import { NextResponse } from "next/server";
import { getAccount, placeOrder, getRecentTrades, getStrategies, updateStrategy, createStrategy, backtestStrategy, deleteStrategy, updatePrices } from "@/lib/trade-db";
import { execSync } from "child_process";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const action = url.searchParams.get("action") || "account";

  try {
    switch (action) {
      case "account": {
        const account = getAccount();
        if (!account) return NextResponse.json({ error: "No account" }, { status: 404 });
        return NextResponse.json(account);
      }
      case "trades": {
        const trades = getRecentTrades(50);
        return NextResponse.json(trades);
      }
      case "strategies": {
        const strategies = getStrategies();
        return NextResponse.json(strategies);
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.action === "order") {
      const result = placeOrder({
        code: body.code, name: body.name, action: body.orderAction,
        shares: body.shares, price: body.price,
        logic: body.logic, emotion_stage: body.emotion_stage,
        sector: body.sector, ai_analysis: body.ai_analysis,
      });
      return NextResponse.json(result);
    }

    if (body.action === "sync_prices") {
      const account = getAccount();
      if (!account?.positions?.length) return NextResponse.json(getAccount());
      const today = new Date().toISOString().slice(0,10).replace(/-/g,"");
      const prices: Array<{ code: string; price: number }> = [];
      for (const pos of account.positions) {
        try {
          const secid = (pos.code.startsWith("6") || pos.code.startsWith("68")) ? `1.${pos.code}` : `0.${pos.code}`;
          // Use 5-min K-line for intraday price, fallback to daily
          const cmd5m = `curl -s --max-time 10 -H "User-Agent: Mozilla/5.0" "https://push2his.eastmoney.com/api/qt/stock/kline/get?secid=${secid}&fields1=f1,f2,f3,f4,f5,f6&fields2=f51,f52,f53,f54,f55,f56&klt=5&fqt=0&beg=${today}&end=${today}"`;
          const stdout = execSync(cmd5m, { timeout: 12000, encoding: "utf-8" });
          const data = JSON.parse(stdout || "{}");
          const klines = data?.data?.klines || [];
          if (klines.length > 0) {
            // 5-min kline: date,open,close,high,low,vol → close=fields[2]
            const fields = klines[klines.length - 1].split(",");
            if (fields.length >= 3) prices.push({ code: pos.code, price: parseFloat(fields[2]) });
          } else {
            // Fallback: daily kline
            const cmdDaily = `curl -s --max-time 10 -H "User-Agent: Mozilla/5.0" "https://push2his.eastmoney.com/api/qt/stock/kline/get?secid=${secid}&fields1=f1,f2,f3,f4,f5,f6&fields2=f51,f52,f53,f54,f55,f56&klt=101&fqt=0&beg=${today}&end=${today}"`;
            const stdout2 = execSync(cmdDaily, { timeout: 12000, encoding: "utf-8" });
            const data2 = JSON.parse(stdout2 || "{}");
            const kls = data2?.data?.klines || [];
            if (kls.length > 0) {
              const f = kls[kls.length - 1].split(",");
              if (f.length >= 3) prices.push({ code: pos.code, price: parseFloat(f[2]) });
            }
          }
        } catch { /* skip this stock */ }
      }
      if (prices.length > 0) updatePrices(prices);
      return NextResponse.json(getAccount());
    }

    if (body.action === "create_strategy") {
      createStrategy(body.name, body.description || "", body.rules || "");
      return NextResponse.json(getStrategies());
    }

    if (body.action === "backtest") {
      const result = backtestStrategy(body.id);
      return NextResponse.json(result);
    }

    if (body.action === "delete_strategy") {
      deleteStrategy(body.id);
      return NextResponse.json(getStrategies());
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
