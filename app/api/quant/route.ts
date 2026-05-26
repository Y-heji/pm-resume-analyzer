import { NextResponse } from "next/server";
import { execSync } from "child_process";
import path from "path";
import fs from "fs";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "basic";
    const cwd = path.join(process.cwd(), "..", "stock-review");

    if (action === "factory") {
      const fp = path.join(cwd, "data", "factory_pool.json");
      return NextResponse.json(fs.existsSync(fp) ? JSON.parse(fs.readFileSync(fp, "utf-8")) : []);
    }
    if (action === "portfolio") {
      const pp = path.join(cwd, "data", "portfolio.json");
      return NextResponse.json(fs.existsSync(pp) ? JSON.parse(fs.readFileSync(pp, "utf-8")) : {});
    }
    if (action === "regime") {
      const rp = path.join(cwd, "data", "regime.json");
      return NextResponse.json(fs.existsSync(rp) ? JSON.parse(fs.readFileSync(rp, "utf-8")) : {});
    }

    const fp = path.join(cwd, "data", "factors.json");
    return NextResponse.json(fs.existsSync(fp) ? JSON.parse(fs.readFileSync(fp, "utf-8")) : []);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const pyExe = "E:/软件/python.exe";
    const cwd = path.join(process.cwd(), "..", "stock-review");

    if (body.action === "factory") {
      execSync(`"${pyExe}" -c "from quant.factory import evaluate_and_filter; from quant.backtest import load_data; import json; df=load_data(500); r=evaluate_and_filter(df,0.03,5); print(f'Promoted:{len(r[\"promoted\"])}')"`, { cwd, timeout: 180000 });
      const fp = path.join(cwd, "data", "factory_pool.json");
      return NextResponse.json(fs.existsSync(fp) ? JSON.parse(fs.readFileSync(fp, "utf-8")) : []);
    }

    if (body.action === "portfolio") {
      execSync(`"${pyExe}" -c "from quant.optimize import compare_strategies; from quant.backtest import load_data; import json; df=load_data(500); r=compare_strategies(df,10); json.dump(r, open('data/portfolio.json','w',encoding='utf-8'))"`, { cwd, timeout: 180000 });
      const pp = path.join(cwd, "data", "portfolio.json");
      return NextResponse.json(JSON.parse(fs.readFileSync(pp, "utf-8")));
    }

    execSync(`"${pyExe}" -c "from quant.backtest import evaluate_all_factors; import json; r=evaluate_all_factors(500); json.dump(r, open('data/factors.json','w',encoding='utf-8'))"`, { cwd, timeout: 120000 });
    const fp = path.join(cwd, "data", "factors.json");
    return NextResponse.json(JSON.parse(fs.readFileSync(fp, "utf-8")));
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
