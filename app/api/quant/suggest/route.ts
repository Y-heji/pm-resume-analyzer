import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const SYSTEM_PROMPT = `你是AI量化交易顾问。基于市场状态、因子表现、持仓情况，生成交易建议。

## 输出JSON
{
  "regime_summary": "当前市场状态+含义 1-2句",
  "factor_guidance": "当前应优先使用哪些因子类型 1-2句",
  "position_advice": "对当前持仓的操作建议 2-3句",
  "risk_alert": "当前主要风险 1句",
  "next_action": "下一步建议操作 (加仓/减仓/观望/调仓)"
}`;

export async function GET() {
  try {
    const cwd = path.join(process.cwd(), "..", "stock-review");

    // Read regime
    let regime: any = {};
    const rp = path.join(cwd, "data", "regime.json");
    if (fs.existsSync(rp)) {
      const data = JSON.parse(fs.readFileSync(rp, "utf-8"));
      if (Array.isArray(data) && data.length > 0) regime = data[data.length - 1];
    }

    // Read factors
    let topFactors: any[] = [];
    const fp = path.join(cwd, "data", "factors.json");
    if (fs.existsSync(fp)) {
      topFactors = JSON.parse(fs.readFileSync(fp, "utf-8")).slice(0, 5);
    }

    // Read portfolio
    let portfolio: any = {};
    const pp = path.join(cwd, "data", "portfolio.json");
    if (fs.existsSync(pp)) portfolio = JSON.parse(fs.readFileSync(pp, "utf-8"));

    // Read latest report for market context
    const reportDir = path.join(cwd, "data");
    const dirs = fs.readdirSync(reportDir).filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort().reverse();
    let marketSummary = "";
    if (dirs.length > 0) {
      const rp2 = path.join(reportDir, dirs[0], "report.json");
      if (fs.existsSync(rp2)) {
        const report = JSON.parse(fs.readFileSync(rp2, "utf-8"));
        marketSummary = report.analysis?.full_summary || "";
      }
    }

    const payload = [
      "当前状态: " + JSON.stringify(regime),
      "最佳因子(Top5): " + JSON.stringify(topFactors.map((f: any) => ({ name: f.name, sharpe: f.sharpe, ic: f.rank_ic }))),
      "持仓统计: " + JSON.stringify(portfolio),
      "市场总结: " + marketSummary,
    ].join("\n");

    const { OpenAI } = await import("openai");
    const client = new OpenAI({
      baseURL: "https://api.deepseek.com/v1",
      apiKey: process.env.DEEPSEEK_API_KEY || "",
    });

    const resp = await client.chat.completions.create({
      model: "deepseek-chat",
      messages: [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: payload }],
      temperature: 0.4, max_tokens: 1000,
    });

    const text = resp.choices[0].message.content || "";
    const start = text.indexOf("{"), end = text.lastIndexOf("}");
    if (start === -1) throw new Error("No JSON response");
    return NextResponse.json(JSON.parse(text.slice(start, end + 1)));
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
