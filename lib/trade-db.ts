import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "trade.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const fs = require("fs");
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    initSchema(db);
  }
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS account (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL DEFAULT '默认账户',
      initial_capital REAL NOT NULL DEFAULT 1000000,
      cash REAL NOT NULL DEFAULT 1000000,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS positions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      shares INTEGER NOT NULL DEFAULT 0,
      avg_cost REAL NOT NULL DEFAULT 0,
      current_price REAL NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (account_id) REFERENCES account(id)
    );

    CREATE TABLE IF NOT EXISTS trades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      action TEXT NOT NULL CHECK(action IN ('buy','sell','add','reduce','stop_profit','stop_loss')),
      shares INTEGER NOT NULL,
      price REAL NOT NULL,
      amount REAL NOT NULL,
      logic TEXT,
      emotion_stage TEXT,
      sector TEXT,
      ai_analysis TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (account_id) REFERENCES account(id)
    );

    CREATE TABLE IF NOT EXISTS strategies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      rules TEXT,
      total_trades INTEGER DEFAULT 0,
      wins INTEGER DEFAULT 0,
      total_return REAL DEFAULT 0,
      max_drawdown REAL DEFAULT 0,
      win_rate REAL DEFAULT 0,
      profit_loss_ratio REAL DEFAULT 0,
      active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    -- Insert default account if none exists
    INSERT OR IGNORE INTO account (id, name, initial_capital, cash)
    VALUES (1, '默认账户', 1000000, 1000000);
  `);
}

// ─── Account ───

export function getAccount(id = 1) {
  const row = getDb().prepare("SELECT * FROM account WHERE id = ?").get(id) as any;
  if (!row) return null;
  const positions = getDb().prepare("SELECT * FROM positions WHERE account_id = ? AND shares > 0").all(id) as any[];
  const totalMarketValue = positions.reduce((sum: number, p: any) => sum + p.shares * p.current_price, 0);
  const totalCost = positions.reduce((sum: number, p: any) => sum + p.shares * p.avg_cost, 0);
  return {
    ...row,
    total_assets: row.cash + totalMarketValue,
    total_profit: totalMarketValue - totalCost,
    total_profit_pct: totalCost > 0 ? ((totalMarketValue - totalCost) / totalCost * 100) : 0,
    position_count: positions.length,
    positions,
  };
}

// ─── Orders ───

export function placeOrder(params: {
  account_id?: number; code: string; name: string; action: string;
  shares: number; price: number; logic?: string; emotion_stage?: string;
  sector?: string; ai_analysis?: string;
}) {
  const db = getDb();
  const account = db.prepare("SELECT * FROM account WHERE id = ?").get(params.account_id || 1) as any;
  if (!account) throw new Error("Account not found");

  const amount = params.shares * params.price;
  const isBuy = ["buy", "add"].includes(params.action);

  if (isBuy && account.cash < amount) throw new Error("Insufficient cash");

  // Update cash
  const newCash = isBuy ? account.cash - amount : account.cash + amount;
  db.prepare("UPDATE account SET cash = ? WHERE id = ?").run(newCash, account.id);

  // Update or create position
  if (isBuy) {
    const pos = db.prepare("SELECT * FROM positions WHERE account_id = ? AND code = ?").get(account.id, params.code) as any;
    if (pos) {
      const newShares = pos.shares + params.shares;
      const newCost = ((pos.shares * pos.avg_cost) + amount) / newShares;
      db.prepare("UPDATE positions SET shares = ?, avg_cost = ?, current_price = ?, updated_at = datetime('now','localtime') WHERE id = ?")
        .run(newShares, newCost, params.price, pos.id);
    } else {
      db.prepare("INSERT INTO positions (account_id, code, name, shares, avg_cost, current_price) VALUES (?,?,?,?,?,?)")
        .run(account.id, params.code, params.name, params.shares, params.price, params.price);
    }
  } else {
    // Sell — reduce position
    const pos = db.prepare("SELECT * FROM positions WHERE account_id = ? AND code = ?").get(account.id, params.code) as any;
    if (!pos || pos.shares < params.shares) throw new Error("Insufficient shares");
    const newShares = pos.shares - params.shares;
    db.prepare("UPDATE positions SET shares = ?, current_price = ?, updated_at = datetime('now','localtime') WHERE id = ?")
      .run(newShares, params.price, pos.id);
  }

  // Record trade
  db.prepare(`INSERT INTO trades (account_id, code, name, action, shares, price, amount, logic, emotion_stage, sector, ai_analysis)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
    .run(params.account_id || 1, params.code, params.name, params.action, params.shares, params.price, amount,
      params.logic || "", params.emotion_stage || "", params.sector || "", params.ai_analysis || "");

  return getAccount(params.account_id || 1);
}

// ─── Update position prices ───

export function updatePrices(prices: Array<{ code: string; price: number }>) {
  const db = getDb();
  const stmt = db.prepare("UPDATE positions SET current_price = ?, updated_at = datetime('now','localtime') WHERE code = ?");
  const tx = db.transaction(() => {
    for (const p of prices) stmt.run(p.price, p.code);
  });
  tx();
}

// ─── Strategies ───

export function getStrategies() {
  return getDb().prepare("SELECT * FROM strategies WHERE active = 1 ORDER BY created_at DESC").all();
}

export function updateStrategy(id: number, stats: { total_trades?: number; wins?: number; total_return?: number; max_drawdown?: number }) {
  const db = getDb();
  const s = db.prepare("SELECT * FROM strategies WHERE id = ?").get(id) as any;
  if (!s) return;
  const trades = stats.total_trades ?? s.total_trades;
  const wins = stats.wins ?? s.wins;
  db.prepare(`UPDATE strategies SET total_trades=?, wins=?, total_return=?, max_drawdown=?,
    win_rate=?, profit_loss_ratio=? WHERE id=?`)
    .run(trades, wins, stats.total_return ?? s.total_return, stats.max_drawdown ?? s.max_drawdown,
      trades > 0 ? (wins / trades * 100) : 0,
      s.total_return > 0 ? (s.total_return / Math.abs(s.max_drawdown || 1)) : 0,
      id);
}

// ─── Recent trades ───

export function getRecentTrades(limit = 20) {
  return getDb().prepare("SELECT * FROM trades ORDER BY created_at DESC LIMIT ?").all(limit);
}

// ─── Strategy backtest ───

export function createStrategy(name: string, description: string, rules: string) {
  return getDb().prepare("INSERT INTO strategies (name, description, rules) VALUES (?,?,?)").run(name, description, rules);
}

export function backtestStrategy(strategyId: number) {
  const db = getDb();
  const s = db.prepare("SELECT * FROM strategies WHERE id = ?").get(strategyId) as any;
  if (!s) throw new Error("Strategy not found");

  const trades = db.prepare("SELECT * FROM trades ORDER BY created_at ASC").all() as any[];
  if (trades.length === 0) return { ...s, total_trades: 0, wins: 0, total_return: 0, max_drawdown: 0, win_rate: 0, profit_loss_ratio: 0 };

  // Group trades by code to compute P&L per stock
  let totalReturn = 0;
  let wins = 0;
  let maxDrawdown = 0;
  let peak = 0;
  let completedTrades = 0;
  const positions: Record<string, { shares: number; cost: number }> = {};

  for (const t of trades) {
    const isBuy = ["buy", "add"].includes(t.action);
    if (isBuy) {
      if (!positions[t.code]) positions[t.code] = { shares: 0, cost: 0 };
      const p = positions[t.code];
      p.cost = (p.cost * p.shares + t.price * t.shares) / (p.shares + t.shares);
      p.shares += t.shares;
    } else {
      const p = positions[t.code];
      if (!p || p.shares < t.shares) continue;
      const pnl = (t.price - p.cost) * t.shares;
      totalReturn += pnl;
      if (pnl > 0) wins++;
      completedTrades++;
      p.shares -= t.shares;
      if (p.shares <= 0) delete positions[t.code];
    }
    // Track drawdown
    const currentTotal = totalReturn + Object.values(positions).reduce((s, p) => s + p.shares * (t.price - p.cost), 0);
    if (currentTotal > peak) peak = currentTotal;
    if (peak > 0) {
      const dd = (peak - currentTotal) / peak * 100;
      if (dd > maxDrawdown) maxDrawdown = dd;
    }
  }

  updateStrategy(strategyId, {
    total_trades: completedTrades, wins,
    total_return: totalReturn, max_drawdown: maxDrawdown,
  });

  return getDb().prepare("SELECT * FROM strategies WHERE id = ?").get(strategyId);
}

export function deleteStrategy(id: number) {
  return getDb().prepare("DELETE FROM strategies WHERE id = ?").run(id);
}
