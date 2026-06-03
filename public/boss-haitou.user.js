// ==UserScript==
// @name         禾急 - BOSS海投助手
// @namespace    heji-boss-helper
// @version      1.0.0
// @description  BOSS直聘AI海投助手：一键批量投递 + AI智能回复 + 自动发简历 + 数据看板
// @author       禾急
// @match        *://www.zhipin.com/web/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @grant        GM_notification
// @connect      api.deepseek.com
// @connect      api.openai.com
// @connect      api.siliconflow.cn
// @connect      localhost
// @connect      127.0.0.1
// @run-at       document-idle
// ==/UserScript==

(function () {
  "use strict";

  // ═══════════════════════════════════════════════════════════════
  // CONFIG
  // ═══════════════════════════════════════════════════════════════
  const C = {
    VERSION: "1.0.0",
    STORAGE_PREFIX: "heji_boss_",
    DELAYS: { CLICK: 800, SCROLL: 1200, CHAT_CHECK: 3000, AI_TIMEOUT: 30000 },
    LIMITS: { MAX_RECORDS: 1000, MAX_HR_TRACK: 500, MAX_GREETINGS: 20 },
    PANEL_WIDTH: 360,
  };

  // ═══════════════════════════════════════════════════════════════
  // STORAGE
  // ═══════════════════════════════════════════════════════════════
  const S = {
    get(k, fallback) {
      try { const v = localStorage.getItem(C.STORAGE_PREFIX + k); return v !== null ? JSON.parse(v) : fallback; }
      catch { return fallback; }
    },
    set(k, v) {
      try { localStorage.setItem(C.STORAGE_PREFIX + k, JSON.stringify(v)); } catch {}
    },
    remove(k) { localStorage.removeItem(C.STORAGE_PREFIX + k); },
  };

  // ═══════════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════════
  const state = {
    isRunning: false,
    currentJobIndex: 0,
    jobList: [],
    processedHRs: new Set(),
    sentGreetings: new Set(),
    sentResumes: new Set(),
    totalApplied: S.get("totalApplied", 0),
    todayApplied: S.get("todayApplied", 0),
    records: S.get("records", []),
    init() {
      const today = new Date().toDateString();
      const lastDate = S.get("lastDate", "");
      if (today !== lastDate) { S.set("todayApplied", 0); S.set("lastDate", today); this.todayApplied = 0; }
    }
  };
  state.init();

  // ═══════════════════════════════════════════════════════════════
  // DOM UTILS
  // ═══════════════════════════════════════════════════════════════
  const $ = (sel, parent = document) => parent.querySelector(sel);
  const $$ = (sel, parent = document) => [...parent.querySelectorAll(sel)];
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  async function waitFor(sel, timeout = 5000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const el = $(sel); if (el) return el;
      await sleep(200);
    }
    return null;
  }

  function simulateClick(el) {
    if (!el) return;
    ["mouseover", "mousedown", "mouseup", "click"].forEach(t =>
      el.dispatchEvent(new MouseEvent(t, { bubbles: true, cancelable: true }))
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // AI CLIENT
  // ═══════════════════════════════════════════════════════════════
  const AI = {
    getConfig() {
      return {
        key: S.get("aiKey", "sk-fd50e093b07b44098f47be79082d6178"),
        url: S.get("aiUrl", "https://api.deepseek.com/v1/chat/completions"),
        model: S.get("aiModel", "deepseek-chat"),
        role: S.get("aiRole", "你是求职者的AI助手，帮求职者与HR高效沟通。回复简洁、礼貌、专业，控制在50字以内。"),
      };
    },

    async chat(messages) {
      const cfg = this.getConfig();
      return new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
          method: "POST", url: cfg.url,
          headers: { "Content-Type": "application/json", "Authorization": "Bearer " + cfg.key },
          data: JSON.stringify({ model: cfg.model, messages, max_tokens: 300, temperature: 0.7 }),
          timeout: C.DELAYS.AI_TIMEOUT,
          onload(r) {
            try {
              const d = JSON.parse(r.responseText);
              resolve(d.choices?.[0]?.message?.content || d.choices?.[0]?.text || "");
            } catch { reject(new Error("AI response parse failed")); }
          },
          onerror: reject,
        });
      });
    },

    async reply(hrMessage, context = "") {
      const cfg = this.getConfig();
      const msgs = [
        { role: "system", content: cfg.role },
        { role: "user", content: `HR说："${hrMessage}"\n${context}\n请生成一个简洁得体的回复（50字以内）：` }
      ];
      return this.chat(msgs);
    },
  };

  // ═══════════════════════════════════════════════════════════════
  // UI - Control Panel
  // ═══════════════════════════════════════════════════════════════
  const UI = {
    panel: null, mini: null, minimized: false,

    css: `
      #heji-panel{position:fixed;right:16px;top:60px;width:${C.PANEL_WIDTH}px;max-height:80vh;
        background:#fff;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.12);
        z-index:2147483647;overflow:hidden;font-size:13px;color:#333;font-family:system-ui,sans-serif;}
      #heji-panel.minimized{width:48px;height:48px;border-radius:50%;overflow:hidden;}
      #heji-panel.minimized .heji-body{display:none;}
      #heji-header{background:#1a1a1a;color:#fff;padding:10px 14px;display:flex;justify-content:space-between;align-items:center;cursor:move;user-select:none;}
      #heji-header h3{margin:0;font-size:14px;font-weight:700;letter-spacing:0.5px;}
      #heji-header .heji-btns{display:flex;gap:6px;}
      #heji-header button{background:none;border:none;color:#aaa;cursor:pointer;font-size:16px;padding:0 4px;line-height:1;}
      #heji-header button:hover{color:#fff;}
      .heji-body{padding:12px 14px;overflow-y:auto;max-height:calc(80vh - 42px);}
      .heji-section{margin-bottom:14px;}
      .heji-section label{display:block;font-size:11px;font-weight:600;color:#888;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px;}
      .heji-section input,.heji-section select{width:100%;padding:7px 10px;border:1px solid #e0e0e0;border-radius:6px;font-size:12px;outline:none;box-sizing:border-box;}
      .heji-section input:focus,.heji-section select:focus{border-color:#2563eb;}
      .heji-btn{display:block;width:100%;padding:10px;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;text-align:center;transition:all 0.15s;}
      .heji-btn.primary{background:#2563eb;color:#fff;}
      .heji-btn.primary:hover{background:#1d4ed8;}
      .heji-btn.primary.running{background:#dc2626;animation:pulse 1.5s infinite;}
      .heji-btn.secondary{background:#f3f4f6;color:#333;margin-top:6px;}
      .heji-btn.secondary:hover{background:#e5e7eb;}
      .heji-btn:disabled{opacity:0.5;cursor:not-allowed;}
      @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.7}}
      .heji-stats{display:flex;gap:8px;text-align:center;}
      .heji-stat{flex:1;background:#f8fafc;border-radius:8px;padding:8px 6px;}
      .heji-stat .num{font-size:20px;font-weight:800;color:#2563eb;}
      .heji-stat .lbl{font-size:10px;color:#888;margin-top:2px;}
      .heji-tag{display:inline-block;font-size:10px;padding:2px 6px;border-radius:4px;margin:2px;}
      .heji-tag.green{background:#dcfce7;color:#166534;}
      .heji-tag.red{background:#fef2f2;color:#991b1b;}
      .heji-tag.blue{background:#dbeafe;color:#1e40af;}
      .heji-log{font-size:11px;color:#666;max-height:120px;overflow-y:auto;background:#fafafa;border-radius:6px;padding:8px;}
      .heji-log p{margin:0 0 4px 0;border-bottom:1px solid #f0f0f0;padding-bottom:4px;}
      #heji-mini{position:fixed;left:16px;bottom:80px;width:48px;height:48px;border-radius:50%;background:#2563eb;color:#fff;display:none;align-items:center;justify-content:center;cursor:pointer;z-index:2147483647;font-size:20px;font-weight:900;box-shadow:0 4px 12px rgba(37,99,235,0.4);}
    `,

    init() {
      GM_addStyle(this.css);
      this.build();
      this.bindEvents();
    },

    build() {
      const isJobs = location.pathname.includes("/jobs");
      const p = document.createElement("div"); p.id = "heji-panel";
      p.innerHTML = `
        <div id="heji-header"><h3>⚡ 禾急海投助手</h3>
          <div class="heji-btns">
            <button title="设置" id="heji-settings">⚙</button>
            <button title="看板" id="heji-dash">📊</button>
            <button title="最小化" id="heji-min">−</button>
          </div>
        </div>
        <div class="heji-body">
          <div class="heji-stats">
            <div class="heji-stat"><div class="num" id="heji-total">${state.totalApplied}</div><div class="lbl">累计投递</div></div>
            <div class="heji-stat"><div class="num" id="heji-today">${state.todayApplied}</div><div class="lbl">今日投递</div></div>
            <div class="heji-stat"><div class="num" id="heji-reply">${S.get("totalReplies",0)}</div><div class="lbl">收到回复</div></div>
          </div>
          <div class="heji-section"><label>职位名（逗号分隔）</label><input id="heji-keywords" placeholder="产品经理, 运营, 项目经理" value="${S.get("keywords","")}"></div>
          <div class="heji-section"><label>工作地（逗号分隔）</label><input id="heji-location" placeholder="深圳, 广州, 北京" value="${S.get("location","")}"></div>
          <div class="heji-section"><label>工作经验</label><select id="heji-exp"><option value="">不限</option><option value="应届生">应届生</option><option value="1年以内">1年以内</option><option value="1-3年">1-3年</option><option value="3-5年">3-5年</option><option value="5-10年">5-10年</option><option value="10年以上">10年以上</option></select></div>
          <div class="heji-section"><label>学历要求</label><select id="heji-edu"><option value="">不限</option><option value="初中及以下">初中及以下</option><option value="中专/中技">中专/中技</option><option value="高中">高中</option><option value="大专">大专</option><option value="本科">本科</option><option value="硕士">硕士</option><option value="博士">博士</option></select></div>
          <div class="heji-section"><label>薪资范围</label><select id="heji-salary"><option value="">不限</option><option value="3K以下">3K以下</option><option value="3K-5K">3K-5K</option><option value="5K-10K">5K-10K</option><option value="10K-15K">10K-15K</option><option value="15K-20K">15K-20K</option><option value="20K-25K">20K-25K</option><option value="25K-30K">25K-30K</option><option value="30K-40K">30K-40K</option><option value="40K-50K">40K-50K</option><option value="50K以上">50K以上</option></select></div>
          ${isJobs ? `
            <button class="heji-btn primary" id="heji-start">🚀 启动海投</button>
          ` : `
            <button class="heji-btn primary" id="heji-chat-start">💬 开始智能聊天</button>
          `}
          <button class="heji-btn secondary" id="heji-settings-btn">⚙ AI设置 & 招呼语</button>
          <div class="heji-log" id="heji-log"><p>👋 准备就绪</p></div>
          ${!isJobs ? `<div class="heji-section"><label><input type="checkbox" id="heji-auto-resume" ${S.get("autoResume",true)?"checked":""}> 自动发简历</label></div>` : ""}
        </div>
      `;
      const mini = document.createElement("div"); mini.id = "heji-mini"; mini.textContent = "⚡";
      document.body.appendChild(p); document.body.appendChild(mini);
      this.panel = p; this.mini = mini;
    },

    bindEvents() {
      const startBtn = $("#heji-start") || $("#heji-chat-start");
      if (startBtn) startBtn.addEventListener("click", () => {
        if (state.isRunning) { Engine.stop(); } else { Engine.start(); }
      });

      $("#heji-min")?.addEventListener("click", () => this.toggleMinimize());
      this.mini?.addEventListener("click", () => this.toggleMinimize());
      $("#heji-settings")?.addEventListener("click", () => Dialog.settings());
      $("#heji-dash")?.addEventListener("click", () => Dash.show());
      $("#heji-settings-btn")?.addEventListener("click", () => Dialog.settings());

      const header = $("#heji-header"); let dx=0, dy=0, dragging=false;
      header?.addEventListener("mousedown", e => { dragging=true; dx=e.clientX-this.panel.offsetLeft; dy=e.clientY-this.panel.offsetTop; });
      document.addEventListener("mousemove", e => { if(dragging){ this.panel.style.left=(e.clientX-dx)+"px"; this.panel.style.top=(e.clientY-dy)+"px"; this.panel.style.right="auto"; } });
      document.addEventListener("mouseup", () => { dragging=false; });
    },

    toggleMinimize() {
      this.minimized = !this.minimized;
      this.panel.classList.toggle("minimized", this.minimized);
      this.mini.style.display = this.minimized ? "flex" : "none";
    },

    log(msg) { const el = $("#heji-log"); if (el) { el.innerHTML = `<p>${new Date().toLocaleTimeString()} ${msg}</p>` + el.innerHTML; if (el.children.length > 50) el.removeChild(el.lastChild); } },

    updateStats() {
      const total = $("#heji-total"), today = $("#heji-today"), reply = $("#heji-reply");
      if (total) total.textContent = state.totalApplied;
      if (today) today.textContent = state.todayApplied;
      if (reply) reply.textContent = S.get("totalReplies", 0);
    },

    setRunning(run) {
      const btn = $("#heji-start") || $("#heji-chat-start");
      if (btn) { btn.textContent = run ? "⏹ 停止" : (location.pathname.includes("/jobs") ? "🚀 启动海投" : "💬 开始智能聊天"); btn.classList.toggle("running", run); }
    },
  };

  // ═══════════════════════════════════════════════════════════════
  // SETTINGS DIALOG
  // ═══════════════════════════════════════════════════════════════
  const Dialog = {
    settings() {
      if ($("#heji-overlay")) return;
      const overlay = document.createElement("div"); overlay.id = "heji-overlay";
      overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:2147483648;display:flex;align-items:center;justify-content:center;";
      const cfg = AI.getConfig();
      const greetings = S.get("greetings", ["您好，我对这个岗位很感兴趣，方便聊聊吗？", "您好，看到贵司的招聘信息，我的经验和技能比较匹配，期待进一步沟通。"]);
      overlay.innerHTML = `<div style="background:#fff;border-radius:12px;padding:24px;width:480px;max-height:80vh;overflow-y:auto;font-size:13px;">
        <h3 style="margin:0 0 16px 0;">⚙ 设置</h3>
        <div style="margin-bottom:12px;"><label style="font-weight:600;font-size:11px;">AI API Key</label><input id="dlg-key" type="password" style="width:100%;padding:6px;margin-top:4px;border:1px solid #ddd;border-radius:4px;" value="${cfg.key}"></div>
        <div style="margin-bottom:12px;"><label style="font-weight:600;font-size:11px;">API URL</label><input id="dlg-url" style="width:100%;padding:6px;margin-top:4px;border:1px solid #ddd;border-radius:4px;" value="${cfg.url}"></div>
        <div style="margin-bottom:12px;"><label style="font-weight:600;font-size:11px;">模型</label><input id="dlg-model" style="width:100%;padding:6px;margin-top:4px;border:1px solid #ddd;border-radius:4px;" value="${cfg.model}"></div>
        <div style="margin-bottom:12px;"><label style="font-weight:600;font-size:11px;">目标岗位（逗号分隔，用于AI定向优化）</label><input id="dlg-target-job" style="width:100%;padding:6px;margin-top:4px;border:1px solid #ddd;border-radius:4px;font-size:12px;" placeholder="产品经理, 前端开发工程师" value="${S.get("targetJob","")}"></div>
        <div style="margin-bottom:12px;"><label style="font-weight:600;font-size:11px;">自我评价（AI用来生成打招呼语）</label><textarea id="dlg-self-intro" rows="5" style="width:100%;padding:6px;margin-top:4px;border:1px solid #ddd;border-radius:4px;font-size:12px;" placeholder="工作经验：&#10;专业技能：&#10;项目经历：&#10;行业背景：&#10;个人优势：&#10;求职意向：">${S.get("selfIntro","")}</textarea></div>
        <div style="margin-bottom:12px;"><button id="dlg-gen-greetings" style="padding:8px 16px;background:#2563eb;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;width:100%;">🤖 AI生成高质量打招呼语（3版本）</button><div id="dlg-gen-preview" style="font-size:10px;color:#666;margin-top:6px;line-height:1.5;"></div></div>
        <div style="margin-bottom:12px;"><label style="font-weight:600;font-size:11px;">打招呼语（一行一条，海投时随机发送）</label><textarea id="dlg-greetings" rows="6" style="width:100%;padding:6px;margin-top:4px;border:1px solid #ddd;border-radius:4px;font-size:12px;">${greetings.join("\n")}</textarea></div>
        <div style="margin-bottom:12px;"><label style="font-weight:600;font-size:11px;">AI 角色设定（聊天回复用）</label><textarea id="dlg-role" rows="3" style="width:100%;padding:6px;margin-top:4px;border:1px solid #ddd;border-radius:4px;font-size:12px;">${cfg.role}</textarea></div>
        <div style="display:flex;gap:8px;justify-content:flex-end;">
          <button id="dlg-cancel" style="padding:8px 16px;border:1px solid #ddd;border-radius:6px;background:#f3f4f6;cursor:pointer;">取消</button>
          <button id="dlg-save" style="padding:8px 16px;border:none;border-radius:6px;background:#2563eb;color:#fff;cursor:pointer;">保存</button>
        </div>
      </div>`;
      document.body.appendChild(overlay);
      $("#dlg-cancel").onclick = () => overlay.remove();
      $("#dlg-save").onclick = () => {
        S.set("aiKey", $("#dlg-key").value);
        S.set("aiUrl", $("#dlg-url").value);
        S.set("aiModel", $("#dlg-model").value);
        S.set("aiRole", $("#dlg-role").value);
        S.set("greetings", $("#dlg-greetings").value.split("\n").filter(l => l.trim()));
        S.set("selfIntro", $("#dlg-self-intro").value);
        overlay.remove();
        UI.log("\u2705 设置已保存");
      };

            $("#dlg-gen-greetings").onclick = async () => {
        const btn = $("#dlg-gen-greetings");
        btn.textContent = "\u23f3 AI\u5206\u6790\u751f\u6210\u4e2d..."; btn.disabled = true;
        $("#dlg-gen-preview").innerHTML = "";
        try {
          const selfIntro = $("#dlg-self-intro").value.trim();
          const targetJob = $("#dlg-target-job").value.trim();
          if (!selfIntro) { $("#dlg-gen-preview").textContent = "\u26a0 \u8bf7\u5148\u586b\u5199\u81ea\u6211\u8bc4\u4ef7"; btn.disabled = false; return; }

          const sysPrompt = [
            "你是资深求职顾问，专精于帮求职者写出高回复率的BOSS直聘打招呼语。",
            "",
            "## 核心原则",
            "1. 从自我评价提取并提炼核心信息，不是简单复制原文",
            "2. 只引用与目标岗位最匹配的1-2项核心经历，不罗列全部",
            "3. 避免信息过载，每条50~120字",
            "",
            "## 严禁的套路话术",
            "- \"希望贵公司给我一个机会\"",
            "- \"我是一个认真负责的人\"",
            "- \"看到贵司招聘信息非常感兴趣\"",
            "- \"期待您的回复\"",
            "",
            "## 输出格式：生成3个版本，严格按以下格式",
            "【A版】自然亲和：真实沟通感，像职场同事聊天",
            "【B版】专业价值：突出匹配度和量化成果",
            "【C版】高回复率：用具体数据/项目成果吸引HR点简历",
          ].join("\n");

          const userMsg = targetJob
            ? "目标岗位：" + targetJob + "\n我的自我评价：\n" + selfIntro + "\n\n生成3个版本，每个50-120字。"
            : "我的自我评价：\n" + selfIntro + "\n\n生成3个版本，每个50-120字。";

          const reply = await AI.chat([
            { role: "system", content: sysPrompt },
            { role: "user", content: userMsg }
          ]);

          if (reply) {
            const aM = reply.match(/【A版】\s*([\s\S]*?)(?=【B版】|$)/);
            const bM = reply.match(/【B版】\s*([\s\S]*?)(?=【C版】|$)/);
            const cM = reply.match(/【C版】\s*([\s\S]*?)$/);
            const results = [];
            if (aM) results.push(aM[1].trim());
            if (bM) results.push(bM[1].trim());
            if (cM) results.push(cM[1].trim());

            if (results.length > 0) {
              $("#dlg-greetings").value = results.join("\n");
              const labels = ["A(亲和)", "B(专业)", "C(高回复)"];
              let preview = "";
              results.forEach((r, i) => preview += "<b>" + labels[i] + ":</b> " + r + "<br><br>");
              $("#dlg-gen-preview").innerHTML = preview;
            } else {
              const lines = reply.split("\n").filter(l => l.trim().length > 10);
              $("#dlg-greetings").value = lines.join("\n");
              $("#dlg-gen-preview").textContent = "\u2705 已生成 " + lines.length + " 条";
            }
          }
        } catch (e) {
          $("#dlg-gen-preview").textContent = "\u274c 失败: " + e.message;
        }
        btn.textContent = "\u{1F916} AI生成高质量打招呼语（3版本）"; btn.disabled = false;
      };

      overlay.addEventListener("click", e => { if (e.target === overlay) overlay.remove(); });
    },
  };

  // ═══════════════════════════════════════════════════════════════
  // DASHBOARD
  // ═══════════════════════════════════════════════════════════════
  const Dash = {
    show() {
      const records = S.get("records", []);
      if ($("#heji-dash-overlay")) { $("#heji-dash-overlay").remove(); return; }
      const overlay = document.createElement("div"); overlay.id = "heji-dash-overlay";
      overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:2147483648;display:flex;align-items:center;justify-content:center;";
      const today = new Date().toDateString();
      const todayRecords = records.filter(r => r.date === today);
      overlay.innerHTML = `<div style="background:#fff;border-radius:12px;padding:24px;width:700px;max-height:85vh;overflow-y:auto;font-size:13px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <h3 style="margin:0;">📊 投递看板</h3>
          <button id="heji-dash-close" style="background:none;border:none;font-size:20px;cursor:pointer;">✕</button>
        </div>
        <div style="display:flex;gap:12px;margin-bottom:16px;">
          <div style="flex:1;background:#f8fafc;border-radius:8px;padding:12px;text-align:center;"><div style="font-size:24px;font-weight:800;color:#2563eb;">${records.length}</div><div style="font-size:11px;color:#888;">累计投递</div></div>
          <div style="flex:1;background:#f8fafc;border-radius:8px;padding:12px;text-align:center;"><div style="font-size:24px;font-weight:800;color:#16a34a;">${todayRecords.length}</div><div style="font-size:11px;color:#888;">今日投递</div></div>
          <div style="flex:1;background:#f8fafc;border-radius:8px;padding:12px;text-align:center;"><div style="font-size:24px;font-weight:800;color:#ea580c;">${S.get("totalReplies",0)}</div><div style="font-size:11px;color:#888;">收到回复</div></div>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:11px;">
          <thead><tr style="background:#f3f4f6;"><th style="padding:6px 8px;text-align:left;">公司</th><th style="padding:6px 8px;text-align:left;">岗位</th><th style="padding:6px 8px;text-align:left;">薪资</th><th style="padding:6px 8px;text-align:left;">状态</th><th style="padding:6px 8px;text-align:left;">时间</th></tr></thead>
          <tbody>${records.slice(-50).reverse().map(r => `<tr style="border-bottom:1px solid #f0f0f0;"><td style="padding:4px 8px;">${r.company||"-"}</td><td style="padding:4px 8px;">${r.title||"-"}</td><td style="padding:4px 8px;">${r.salary||"-"}</td><td style="padding:4px 8px;"><span class="heji-tag green">已投递</span></td><td style="padding:4px 8px;color:#888;">${r.time||""}</td></tr>`).join("")}</tbody>
        </table>
      </div>`;
      document.body.appendChild(overlay);
      $("#heji-dash-close").onclick = () => overlay.remove();
      overlay.addEventListener("click", e => { if (e.target === overlay) overlay.remove(); });
    },
  };

  // ═══════════════════════════════════════════════════════════════
  // FILTER SYNC - Click BOSS直聘 page filters
  // ═══════════════════════════════════════════════════════════════
  const FilterSync = {
    // Map our values to BOSS filter button text
    async sync(exp, edu, salary) {
      if (!$("#heji-sync-filters")?.checked) return;
      UI.log("🔧 同步BOSS筛选条件...");

      // Click filter dropdowns one by one
      const filterBar = $(".search-condition");
      if (!filterBar) return;

      const filterBtns = $$(".condition-container .condition-title", filterBar);
      // Experience filter - usually the 3rd or 4th filter button
      if (exp) await this.clickFilterOption(filterBtns, exp);
      if (edu) await this.clickFilterOption(filterBtns, edu);
      if (salary) await this.clickFilterOption(filterBtns, salary);
    },

    async clickFilterOption(btns, targetText) {
      for (const btn of btns) {
        const text = btn.textContent?.trim() || "";
        // Click the dropdown to open it
        simulateClick(btn);
        await sleep(500);
        // Find the option in the dropdown
        const options = $$(".condition-list-item span, .dropdown-item span, .filter-option");
        for (const opt of options) {
          if (opt.textContent?.trim() === targetText) {
            simulateClick(opt);
            await sleep(300);
            return true;
          }
        }
        // Close dropdown if not matched
        simulateClick(btn);
        await sleep(200);
      }
      return false;
    },
  };

  // ═══════════════════════════════════════════════════════════════
  // MAIN ENGINE
  // ═══════════════════════════════════════════════════════════════
  const Engine = {
    async start() {
      if (state.isRunning) return;
      state.isRunning = true;
      UI.setRunning(true);
      UI.log("🚀 启动中...");

      const keywords = $("#heji-keywords")?.value || "";
      const location = $("#heji-location")?.value || "";
      const exp = $("#heji-exp")?.value || "";
      const edu = $("#heji-edu")?.value || "";
      const salary = $("#heji-salary")?.value || "";
      S.set("keywords", keywords); S.set("location", location);
      S.set("exp", exp); S.set("edu", edu); S.set("salary", salary);

      if (location.pathname.includes("/jobs")) {
        // Sync filters to BOSS page first
        await FilterSync.sync(exp, edu, salary);
        await sleep(2000); // Wait for page to reload filtered results
        await this.scanAndApply(keywords, location);
      } else if (location.pathname.includes("/chat")) {
        await this.chatLoop();
      }
    },

    stop() {
      state.isRunning = false;
      UI.setRunning(false);
      UI.log("⏹ 已停止");
    },

    async scanAndApply(keywords, location) {
      const kwList = keywords.split(/[,，]/).map(s => s.trim()).filter(Boolean);
      const locList = location.split(/[,，]/).map(s => s.trim()).filter(Boolean);
      const expVal = $("#heji-exp")?.value || "";
      const eduVal = $("#heji-edu")?.value || "";
      const salaryVal = $("#heji-salary")?.value || "";

      UI.log("📜 加载职位列表...");
      for (let i = 0; i < 10 && state.isRunning; i++) {
        window.scrollTo(0, document.body.scrollHeight);
        await sleep(C.DELAYS.SCROLL);
      }

      const cards = $$("li.job-card-box");
      UI.log(`📋 找到 ${cards.length} 个职位`);

      let count = 0;
      for (const card of cards) {
        if (!state.isRunning) break;

        const title = $(".job-name", card)?.textContent?.trim() || "";
        const salary = $(".salary", card)?.textContent?.trim() || "";
        const loc = $(".job-area", card)?.textContent?.trim() || "";
        const company = $(".company-name", card)?.textContent?.trim() || "";

        // Extract experience and education from tags or job-info
        const allTags = $$(".tag-item, .job-exp, .experience, .job-info-item", card).map(e => e.textContent?.trim() || "").join(" ");
        const cardText = title + " " + salary + " " + loc + " " + allTags;

        if (kwList.length && !kwList.some(k => cardText.includes(k))) continue;
        if (locList.length && !locList.some(l => loc.includes(l))) continue;
        if (expVal && !allTags.includes(expVal)) continue;
        if (eduVal && !allTags.includes(eduVal)) continue;
        if (salaryVal) {
          // Parse salary range for comparison
          const cardMax = this.parseSalaryMax(salary);
          const filterMax = this.parseSalaryMax(salaryVal.replace("以上",""));
          if (filterMax > 0 && cardMax > 0 && cardMax < filterMax) continue;
        }

        card.scrollIntoView({ behavior: "smooth", block: "center" });
        await sleep(C.DELAYS.CLICK);

        const chatBtn = [...$$("a.op-btn-chat", card)].find(b => b.textContent.includes("立即沟通"));
        if (!chatBtn) continue;
        simulateClick(chatBtn);
        await sleep(C.DELAYS.CLICK);

        const stayBtn = await waitFor(".default-btn.cancel-btn", 2000);
        if (stayBtn) { simulateClick(stayBtn); await sleep(500); }

        count++;
        state.totalApplied++;
        state.todayApplied++;
        state.records.push({ title, company, salary, location: loc, status: "已投递", date: new Date().toDateString(), time: new Date().toLocaleTimeString() });
        if (state.records.length > C.LIMITS.MAX_RECORDS) state.records.shift();
        S.set("totalApplied", state.totalApplied);
        S.set("todayApplied", state.todayApplied);
        S.set("records", state.records);
        UI.updateStats();
        UI.log(`✅ ${title} @ ${company} ${salary}`);

        const greetings = S.get("greetings", ["您好，我对这个岗位很感兴趣，方便聊聊吗？"]);
        const msg = greetings[Math.floor(Math.random() * greetings.length)];
        const input = await waitFor("#chat-input", 3000);
        if (input) {
          input.value = msg;
          input.dispatchEvent(new Event("input", { bubbles: true }));
          await sleep(300);
          const sendBtn = $(".btn-send");
          if (sendBtn) simulateClick(sendBtn);
          UI.log(`💬 已发送招呼语`);
        }

        await sleep(C.DELAYS.CLICK);
      }

      S.set("records", state.records);
      state.isRunning = false;
      UI.setRunning(false);
      UI.log(`✅ 海投完成！共投递 ${count} 个职位`);
    },

    // Parse salary max from BOSS format like "15K-25K" or "20K-30K·14薪"
    parseSalaryMax(s) {
      const match = s.match(/(\d+)[kK]/g);
      if (match && match.length >= 2) return parseInt(match[1]);
      if (match) return parseInt(match[0]);
      return 0;
    },

    async chatLoop() {
      UI.log("💬 开始监控聊天...");
      while (state.isRunning) {
        const chatItems = $$('ul[role="group"] li[role="listitem"]');
        for (const item of chatItems) {
          if (!state.isRunning) break;
          const name = $(".name", item)?.textContent?.trim() || "";
          const lastMsg = $(".last-msg", item)?.textContent?.trim() || "";
          const key = name + lastMsg;

          if (state.processedHRs.has(key)) continue;
          state.processedHRs.add(key);

          simulateClick(item);
          await sleep(1000);

          const hrMsg = $("li.message-item.item-friend:last-child .text span")?.textContent?.trim();
          if (hrMsg) {
            UI.log(`📩 ${name}: ${hrMsg.substring(0,30)}...`);
            try {
              const reply = await AI.reply(hrMsg, "");
              const input = await waitFor("#chat-input", 2000);
              if (input && reply) {
                input.value = reply;
                input.dispatchEvent(new Event("input", { bubbles: true }));
                await sleep(500);
                const sendBtn = $(".btn-send");
                if (sendBtn) simulateClick(sendBtn);
                state.replyCount = (state.replyCount || 0) + 1;
                S.set("totalReplies", state.replyCount);
                UI.updateStats();
                UI.log(`🤖 已回复: ${reply.substring(0,30)}...`);
              }
            } catch (e) { UI.log(`❌ AI回复失败: ${e.message}`); }

            if (S.get("autoResume", true)) {
              await sleep(1000);
              const resumeBtn = [...$$(".toolbar-btn")].find(b => b.textContent.includes("发简历"));
              if (resumeBtn) { simulateClick(resumeBtn); await sleep(500); UI.log("📎 已发送简历"); }
            }
          }
        }
        await sleep(C.DELAYS.CHAT_CHECK);
      }
    },
  };

  // ═══════════════════════════════════════════════════════════════
  // INIT
  // ═══════════════════════════════════════════════════════════════
  function init() {
    UI.init();
    console.log("[禾急-BOSS] v" + C.VERSION + " loaded");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
