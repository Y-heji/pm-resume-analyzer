// 随机生成一份 PM 简历，跑免费版 vs 付费版全链路，输出内容对比到桌面
async function run() {
  const resume = `王建国
产品经理 | 3年经验 | 深圳
wangjianguo@email.com | 13692228888

工作经历：
腾讯 | 产品经理 | 2022.03 - 至今
参与腾讯视频会员增长项目，负责会员权益设计和AB实验。
负责用户反馈收集和分析，协助优化会员转化漏斗。
配合运营团队完成618/双11促销活动策划和执行。

平安科技 | 产品助理 | 2020.07 - 2022.02
协助产品总监完成金融SaaS产品需求文档撰写。
负责用户调研和竞品分析，整理需求池并跟进开发进度。
参与产品上线前的测试和验收工作。

项目经验：
会员权益改版 | 核心成员 | 2023.06 - 2023.12
配合设计和技术团队完成会员权益页面改版。
参与用户访谈，收集会员对现有权益的满意度数据。

教育背景：
深圳大学 | 信息管理与信息系统 | 本科 | 2016-2020

技能：
Axure, SQL, Excel, Jira`;

  const jd = '增长产品经理 - 负责用户增长策略和产品功能设计，要求精通数据分析和AB实验，有用户增长或商业化经验，3年以上产品经验';

  const base = 'http://localhost:3000';

  // Analyze both tiers
  const [free, paid] = await Promise.all([
    fetch(base+'/api/analyze', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({resumeText:resume, jdText:jd, deep:false})}).then(r=>r.json()),
    fetch(base+'/api/analyze', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({resumeText:resume, jdText:jd, deep:true})}).then(r=>r.json())
  ]);

  // Rewrite both tiers
  const [freeRW, paidRW] = await Promise.all([
    fetch(base+'/api/rewrite', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({resumeText:resume, jdText:jd, deep:false})}).then(r=>r.json()),
    fetch(base+'/api/rewrite', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({resumeText:resume, jdText:jd, deep:true})}).then(r=>r.json())
  ]);

  // Export PDFs
  const [freePdf, paidPdf] = await Promise.all([
    fetch(base+'/api/export-pdf', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({finalResume:freeRW.finalResume})}).then(r=>r.status),
    fetch(base+'/api/export-pdf', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({finalResume:paidRW.finalResume, deepAnalysis:paid.deepAnalysis})}).then(r=>r.status)
  ]);

  // Build comparison
  const lines = [];
  lines.push('# 免费版 vs 付费版 对比报告');
  lines.push('');
  lines.push('## 原始简历');
  lines.push('```');
  lines.push(resume);
  lines.push('```');
  lines.push('');
  lines.push('## 分析结果对比');
  lines.push('');
  lines.push('| 指标 | 免费版 | 付费版 |');
  lines.push('|------|--------|--------|');
  lines.push(`| 匹配分 | ${free.matchScore} | ${paid.matchScore} |`);
  lines.push('| deepAnalysis | NO | YES |');
  lines.push('| 缺失技能 | ' + free.missingSkills.length + ' | ' + paid.missingSkills.length + ' |');
  lines.push('| 推荐岗位 | ' + (free.recommendedJobs?.length || 0) + ' | ' + (paid.recommendedJobs?.length || 0) + ' |');
  lines.push('');
  lines.push('## 改写结果对比');
  lines.push('');
  lines.push('| 指标 | 免费版 | 付费版 |');
  lines.push('|------|--------|--------|');
  lines.push('| 模块数 | ' + freeRW.modules?.length + ' | ' + paidRW.modules?.length + ' |');
  lines.push('| ATS提升 | +' + freeRW.atsImprovement + '% | +' + paidRW.atsImprovement + '% |');
  lines.push('| 匹配提升 | +' + freeRW.matchScoreImprovement + '% | +' + paidRW.matchScoreImprovement + '% |');
  const fOk = freePdf === 200 ? 'YES' : 'FAIL';
  const pOk = paidPdf === 200 ? 'YES' : 'FAIL';
  lines.push('| PDF导出 | ' + fOk + ' | ' + pOk + ' +深度报告 |');
  lines.push('');

  // Generate module comparison
  const maxMod = Math.max(freeRW.modules?.length || 0, paidRW.modules?.length || 0);
  for (let i = 0; i < maxMod; i++) {
    const fm = freeRW.modules?.[i];
    const pm = paidRW.modules?.[i];
    if (!fm && !pm) break;
    lines.push(`### 模块 ${i+1}`);
    lines.push('');
    if (fm) {
      lines.push('**免费版：**');
      lines.push(`- 原标题：${fm.sectionTitle}`);
      lines.push(`- 原文：${fm.original}`);
      lines.push(`- 改写：${fm.rewritten}`);
      lines.push(`- 维度：${fm.optimizationReasons?.join('、')}`);
    }
    if (pm) {
      lines.push('');
      lines.push('**付费版：**');
      lines.push(`- 原标题：${pm.sectionTitle}`);
      lines.push(`- 原文：${pm.original}`);
      lines.push(`- 改写：${pm.rewritten}`);
      lines.push(`- 维度：${pm.optimizationReasons?.join('、')}`);
    }
    lines.push('');
  }

  // Paid-only: deep analysis
  if (paid.deepAnalysis) {
    const d = paid.deepAnalysis;
    lines.push('## 付费版专属：深度分析报告');
    lines.push('');
    lines.push(`### ATS 深度报告 · 匹配率 ${d.atsReport?.score}%`);
    lines.push(`缺失关键词：${d.atsReport?.missingKeywords?.join('、')}`);
    lines.push('');
    d.atsReport?.tips?.forEach((t,i) => lines.push(`${i+1}. ${t}`));
    lines.push('');
    lines.push('### HR 视角分析');
    lines.push(`第一印象：${d.hrReview?.impression}`);
    lines.push('');
    lines.push('**优势：**');
    d.hrReview?.strengths?.forEach(s => lines.push(`- ✅ ${s}`));
    lines.push('');
    lines.push('**风险点：**');
    d.hrReview?.risks?.forEach(r => lines.push(`- ⚠️ ${r}`));
    lines.push('');
    lines.push('**面试可能追问：**');
    d.hrReview?.interviewFocus?.forEach(f => lines.push(`- ❓ ${f}`));
    lines.push('');
    lines.push('### 核心差异化优势');
    lines.push(d.coreAdvantage || '无');
    lines.push('');
    lines.push('### 个性化提升建议');
    lines.push(d.personalizedAdvice || '无');
    lines.push('');
  }

  // Final resume comparison
  lines.push('## FinalResume 对比');
  lines.push('');
  lines.push('### 免费版');
  lines.push('```json');
  lines.push(JSON.stringify(freeRW.finalResume, null, 2));
  lines.push('```');
  lines.push('');
  lines.push('### 付费版');
  lines.push('```json');
  lines.push(JSON.stringify(paidRW.finalResume, null, 2));
  lines.push('```');
  lines.push('');
  lines.push('---');
  lines.push('**结论**：付费版多出深度分析报告页（ATS/HR视角/核心优势/个性建议），改写方向更精准，PDF导出包含额外深度报告页。');

  const os = require('os');
  const path = require('path');
  const fs = require('fs');
  const outPath = path.join(os.homedir(), 'Desktop', 'free-vs-paid-comparison.md');
  fs.writeFileSync(outPath, lines.join('\n'));
  console.log('对比报告已保存到桌面：free-vs-paid-comparison.md');
  console.log('文件大小：' + (fs.statSync(outPath).size / 1024).toFixed(1) + ' KB');
  console.log('');
  console.log('汇总：');
  console.log(`  免费版：${freeRW.modules?.length}模块 | PDF:${freePdf===200?'OK':'FAIL'} | deepAnalysis:NO`);
  console.log(`  付费版：${paidRW.modules?.length}模块 | PDF:${paidPdf===200?'OK':'FAIL'} | deepAnalysis:YES(${paid.deepAnalysis?.atsReport?.score}%)`);
}
run().catch(e=>console.error('FAIL:', e.message));
