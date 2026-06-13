const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel, AlignmentType } = require('docx');
const fs = require('fs');

const HF = (t) => new Paragraph({ text: t, heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 120 } });
const H2 = (t) => new Paragraph({ text: t, heading: HeadingLevel.HEADING_2, spacing: { before: 240, after: 80 } });
const P = (t) => new Paragraph({ text: t, spacing: { after: 80 } });
const PI = (t) => new Paragraph({ text: t, spacing: { after: 40 }, indent: { left: 200 } });
const TOD = (t) => new Paragraph({ text: '☐ ' + t, spacing: { after: 60 }, indent: { left: 200 } });
const HR = () => new Paragraph({ text: '', spacing: { before: 200, after: 200 }, border: { top: { style: 'single', size: 1, color: 'cccccc' } } });
const TC = (t, w) => new TableCell({ children: [new Paragraph({ text: t, bold: true, alignment: AlignmentType.CENTER, size: 18, color: 'ffffff' })], shading: { fill: '1e3a5f' }, width: w || { size: 25, type: 'pct' } });
const TD = (t) => new TableCell({ children: [new Paragraph({ text: t, size: 18 })] });

const doc = new Document({
  styles: { default: { document: { run: { font: 'Microsoft YaHei', size: 22 } } } },
  sections: [{
    children: [
      new Paragraph({ text: '抖音视频脚本 — AI 职业经理师 全流程工具教程', heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER, spacing: { after: 60 } }),
      new Paragraph({ text: '时长：75-85 秒 | 出镜：录屏 + 真人配音 | 对标：快跑啊小卢_ | 案例：张明远 | 2026-06-08', alignment: AlignmentType.CENTER, spacing: { after: 400 } }),

      HF('一、视频结构'),
      PI('[0-8s]   钩子 — 数据冲击'),
      PI('[8-28s]  第一步 — AI 诊断简历'),
      PI('[28-50s] 第二步 — AI 深度改写'),
      PI('[50-70s] 第三步 — AI 模拟面试'),
      PI('[70-80s] 收尾 — CTA 导流'),

      HF('二、完整配音脚本'),

      H2('钩子 [0-8 秒]'),
      P('张明远投了八十几份新媒体运营的岗位，一个面试都没有。不是他不行——是他的简历，HR 根本没看到。今天带你看一个 AI 工具，从诊断到改写再到模拟面试，三步帮他翻盘。'),

      H2('第一步：AI 诊断 [8-28 秒]'),
      P('第一步，把张明远的简历和目标岗位 JD 上传。三分钟出诊断报告——匹配分多少、ATS 会卡哪、缺了哪些关键词。'),
      P('你看——二十二分。六个红色警告。'),
      P('第一，动词全是“负责”“参与”“帮忙”——系统判定没有实操经验。第二，JD 要求“内容策划”“数据分析”“用户增长”，简历里关键词覆盖率不到百分之二十。第三，“协助同事完成其他运营相关工作”——这句话写了等于没写，AI 直接标灰。'),
      P('也就是说，他投了八十多家，机器筛阶段就已经被淘汰了。'),

      H2('第二步：AI 深度改写 [28-50 秒]'),
      P('第二步，AI 深度改写。还是张明远，还是武汉微动科技这段实习——'),
      P('改之前：“负责公司公众号的日常运营，参与过几次线上活动，帮忙处理用户反馈，协助同事完成其他运营相关工作。”——二十二分。'),
      P('改之后：“独立运营公司公众号，策划并执行 6 场裂变增长活动，累计触达用户 5 万加；建立用户反馈追踪表，周均处理 50 加条反馈并推动 3 项产品优化；活动期间用户活跃度提升百分之四十，新增关注两千加。”——八十六分。'),
      P('同一个人。同一段经历。STAR 重构、数据增量、关键词注入——AI 全自动完成。'),

      H2('第三步：AI 模拟面试 [50-70 秒]'),
      P('简历过了，面试呢？这个 AI 面试官不是题库——它会真的跟你对话。'),
      P('我让张明远练了一轮。AI 问：“你公众号的六场裂变活动，哪一场数据最差？为什么？重来一次你会怎么改？”他回答完之后，AI 立刻追问：“你说选题不够吸引人——那你知道你的目标用户对什么话题点击率最高吗？”'),
      P('追问完三次，自动出一份诊断报告——表达能力扣分在哪、逻辑哪里有漏洞、建议怎么答更好。面试前跟 AI 练三遍，真面试就不一样了。'),

      H2('收尾：CTA [70-80 秒]'),
      P('诊断、改写、模拟面试——同一个网站，全部免费试用。上传简历就能测，三分钟出第一份报告。链接在我主页，看一眼不吃亏。'),

      HF('三、画面分镜表'),
      new Table({
        width: { size: 100, type: 'pct' },
        rows: [
          new TableRow({ children: [
            TC('时间', { size: 10, type: 'pct' }), TC('画面', { size: 25, type: 'pct' }), TC('录屏/素材', { size: 30, type: 'pct' }), TC('字幕叠加', { size: 35, type: 'pct' })
          ]}),
          ...([
            ['0-3s','简历纸扔进垃圾桶','后期素材','投了 80+ 家，0 面试'],
            ['3-5s','网站首页闪过','录屏：打开 ai职业经理师.xyz','张明远 · 新媒体运营'],
            ['5-8s','三模块图标并排','截屏拼接','诊断→改写→面试 全包'],
            ['8-12s','上传简历 + 粘贴 JD','录屏：拖拽 + 粘贴','上传简历 + JD'],
            ['12-15s','点击分析 + 加载','录屏','AI 分析中...'],
            ['15-18s','诊断报告弹出 22 分','录屏：红字分数特写','匹配分 22'],
            ['18-22s','风险项逐条高亮','录屏：鼠标逐条指','6 项红色警告'],
            ['22-25s','灰色标记文案特写','录屏：鼠标圈选','这句话写了等于没写'],
            ['25-28s','点深度改写按钮','录屏','第二步：AI 深度改写'],
            ['28-33s','加载 → 改写结果','录屏','还是张明远，同一段经历'],
            ['33-40s','左右分屏对比','录屏：左灰右绿滚动','左边 22 分 → 右边 86 分'],
            ['40-45s','改写要点高亮','录屏：鼠标逐条指','STAR · 数据 · 关键词'],
            ['45-48s','导航到面试页','录屏','第三步：AI 模拟面试'],
            ['48-53s','AI 弹出问题','录屏：对话界面','AI：哪场活动数据最差？'],
            ['53-57s','用户回答','录屏：打字+发送','回答后 AI 秒回'],
            ['57-62s','AI 追问','录屏：追问框特写','不是题库——是真的在聊天'],
            ['62-67s','面试报告页','录屏：评分详情','练一次就诊断一次'],
            ['67-72s','三模块全景','截屏拼接','一个网站，三步全包'],
            ['72-78s','网站 CTA','录屏：首页+上传按钮','上传简历就能测'],
            ['78-80s','黑底白字','后期','ai职业经理师.xyz'],
          ].map(r => new TableRow({ children: r.map(c => TD(c)) })))
        ]
      }),

      HF('四、录屏准备清单'),
      PI('1. 网站首页 → 分析页（5 秒）— 干净桌面，关掉其他程序'),
      PI('2. 上传简历+JD → 诊断报告（12 秒）— 提前测试确保 22 分左右'),
      PI('3. 诊断→改写→对比（12 秒）— 左右分屏对比要明显'),
      PI('4. 改写结果细节（5 秒）— 慢速，鼠标逐个指'),
      PI('5. 模拟面试完整一轮（15 秒）— 问题→回答→追问→报告'),
      PI('6. 官网首页收尾（5 秒）— 展示域名 + 上传按钮'),

      HF('五、后期制作检查清单'),
      TOD('导入 6 段录屏，按分镜表剪接'),
      TOD('录音：用麦克风按脚本逐段读，参考配音提示表'),
      TOD('音频对齐画面后加字幕，关键词改色加粗'),
      TOD('BGM：剪映搜"科技轻快"，音量 12-15%'),
      TOD('等待/加载部分 1.5 倍速'),
      TOD('导出：1080p · 60fps · 6Mbps'),

      HF('六、配音提示'),
      PI('钩子：肯定有力，"八十多""一个都没有"重读'),
      PI('诊断：讲解感，每次报数字后停 0.3 秒'),
      PI('改写：改前语气平，改后语气上扬，中间停 0.5 秒'),
      PI('面试：聊天感自然，AI 问题用略快语速'),
      PI('收尾：真诚不推销，最后一句放慢'),

      HF('七、发布信息'),
      P('标题：投了 80 多份全沉？这个 AI 工具 3 步帮他翻盘'),
      P('标签：#简历优化 #AI简历 #求职 #模拟面试 #AI面试 #找工作 #应届生求职 #简历这样做 #AI职业经理师'),
      P('置顶评论：主页可以免费诊断简历 👆 张明远的诊断结果在视频里，你的呢？'),
    ]
  }]
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync('C:/Users/86132/Desktop/抖音视频脚本-拍摄手册.docx', buf);
  console.log('Done: ' + (buf.length / 1024).toFixed(1) + ' KB');
});
