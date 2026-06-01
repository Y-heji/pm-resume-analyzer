import Link from "next/link";

const hotSearches = [
  "AI产品经理", "产品经理", "前端开发", "后端开发",
  "数据分析", "运营", "UI设计师", "销售", "会计", "HR实习",
];

export default function Home() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16 text-center">
      <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
        AI 产品经理求职分析
      </h1>
      <p className="text-lg text-gray-500 mb-8 max-w-xl mx-auto">
        上传简历，粘贴目标岗位 JD，AI 自动分析匹配度、识别 ATS 风险、发现技能缺口，并生成专属学习路径。
      </p>

      <Link
        href="/analyze"
        className="inline-block px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-lg shadow-sm"
      >
        免费开始分析
      </Link>

      <div className="flex flex-wrap justify-center gap-2 mt-6 max-w-xl mx-auto">
        {hotSearches.map(tag => (
          <Link
            key={tag}
            href={`/analyze?q=${encodeURIComponent(tag)}`}
            className="text-xs px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-500 rounded-full hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
          >
            {tag}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 text-left">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="text-2xl mb-2">&#x1F4CA;</div>
          <h3 className="font-semibold mb-1">AI 精准匹配</h3>
          <p className="text-sm text-gray-500">DeepSeek 驱动的多维度简历与 JD 匹配度分析，覆盖技能、经验、学历。</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="text-2xl mb-2">&#x1F6E1;</div>
          <h3 className="font-semibold mb-1">ATS 风险检测</h3>
          <p className="text-sm text-gray-500">识别简历中的关键词缺失、格式问题，帮助你通过大厂 ATS 初筛。</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="text-2xl mb-2">&#x1F5FA;</div>
          <h3 className="font-semibold mb-1">学习路径规划</h3>
          <p className="text-sm text-gray-500">根据岗位要求生成分优先级的学习路径，告诉你接下来该学什么。</p>
        </div>
      </div>
    </div>
  );
}
