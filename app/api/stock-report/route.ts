import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const dataDir = path.join(process.cwd(), "..", "stock-review", "data");
    // Find latest date directory
    const dirs = fs.readdirSync(dataDir).filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort().reverse();
    if (dirs.length === 0) {
      return NextResponse.json({ error: "No reports found" }, { status: 404 });
    }
    const latest = dirs[0];
    const reportPath = path.join(dataDir, latest, "report.json");
    if (!fs.existsSync(reportPath)) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }
    // K-line data (stored in data/ dir by fetch_kline.py)
    const klinePath = path.join(dataDir, "kline_sh_60.json");
    const kline60mPath = path.join(dataDir, "kline_60m_20.json");
    const kline5mPath = path.join(dataDir, "kline_5m_5.json");
    let kline: unknown[] = [];
    if (fs.existsSync(klinePath)) {
      kline = JSON.parse(fs.readFileSync(klinePath, "utf-8"));
    }
    let kline60m: unknown[] = [];
    if (fs.existsSync(kline60mPath)) {
      kline60m = JSON.parse(fs.readFileSync(kline60mPath, "utf-8"));
    }
    let kline5m: unknown[] = [];
    if (fs.existsSync(kline5mPath)) {
      kline5m = JSON.parse(fs.readFileSync(kline5mPath, "utf-8"));
    }

    const report = JSON.parse(fs.readFileSync(reportPath, "utf-8"));
    return NextResponse.json({ ...report, kline, kline60m, kline5m });
  } catch (err) {
    return NextResponse.json({ error: "Failed to load report" }, { status: 500 });
  }
}
