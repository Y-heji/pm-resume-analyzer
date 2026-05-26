import { NextResponse } from "next/server";
import { getDb } from "@/lib/trade-db";
import fs from "fs";
import path from "path";

const SYSTEM_PROMPT = `你是量化策略分析师。分析交易记录，找出盈利/亏损的模式和原因。

## 输出JSON
{
  "summary": "策略整体评价 2-3句",
  "strengths": ["优势1", "优势2"],
  "weaknesses": ["弱点1", "弱点2"],
  "pattern": "盈亏模式分析 3-4句 — 什么情况下赚,什么情况下亏,和情绪阶段/板块选择的关系",
  "suggestions": ["建议1", "建议2"]
}

规则: 用数据说话, 具体到交易案例, 不要空泛。`;

export async function POST(req: Request) {
  try {
    const { strategyId } = await req.json();
    const db = getDb();
    const strategy = db.prepare("SELECT * FROM strategies WHERE id = ?").get(strategyId) as any;
    if (!strategy) return NextResponse.json({ error: "Strategy not found" }, { status: 404 });

    const trades = db.prepare("SELECT * FROM trades ORDER BY created_at ASC").all() as any[];

    // Build trade summary
    const buys = trades.filter((t: any) => ["buy", "add"].includes(t.action));
    const sells = trades.filter((t: any) => !["buy", "add"].includes(t.action));

    let tradeSummary = "";
    for (const s of sells) {
      const buy = [...buys].reverse().find((b: any) => b.code === s.code);
      const pnl = buy ? ((s.price - buy.price) * s.shares) : 0;
      tradeSummary += `${s.created_at?.slice(0,16)} | ${s.action} ${s.name} @${s.price} | PnL:${pnl >= 0 ? "+" : ""}${pnl.toFixed(0)} | 情绪:${s.emotion_stage || "?"} | 板块:${s.sector || "?"} | 逻辑:${s.logic || "?"}\n`;
    }

    // Get market context from latest report
    let marketContext = "";
    const reportDir = path.join(process.cwd(), "..", "stock-review", "data");
    if (fs.existsSync(reportDir)) {
      const dirs = fs.readdirSync(reportDir).filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort().reverse();
      if (dirs.length > 0) {
        const rp = path.join(reportDir, dirs[0], "report.json");
        if (fs.existsSync(rp)) {
          const report = JSON.parse(fs.readFileSync(rp, "utf-8"));
          marketContext = `\n=== 最新市场环境 ===\n情绪: ${report.analysis?.market_emotion?.stage}\n主线: ${(report.analysis?.main_lines || []).join("、")}\n总结: ${report.analysis?.full_summary || ""}`;
        }
      }
    }

    const payload = `策略: ${strategy.name}
交易数: ${sells.length} | 胜率: ${strategy.win_rate?.toFixed(1)}% | 盈亏比: ${strategy.profit_loss_ratio?.toFixed(2)}

=== 交易记录 ===
${tradeSummary}
${marketContext}`;

    const { OpenAI } = await import("openai");
    const client = new OpenAI({
      baseURL: "https://api.deepseek.com/v1",
      apiKey: process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY || "",
    });

    const resp = await client.chat.completions.create({
      model: "deepseek-chat",
      messages: [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: payload }],
      temperature: 0.4, max_tokens: 2000,
    });

    const text = resp.choices[0].message.content || "";
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("No JSON in AI response");

    return NextResponse.json(JSON.parse(text.slice(start, end + 1)));
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
