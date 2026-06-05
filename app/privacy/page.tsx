"use client";
export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="text-2xl font-bold mb-6">隐私政策</h1>
      <div className="prose prose-sm text-gray-700 space-y-4">
        <h2>1. 信息收集</h2>
        <p>我们收集您主动提供的简历内容、邮箱地址以及使用过程中产生的分析记录。简历内容仅用于生成分析结果和优化建议。</p>
        <h2>2. 信息使用</h2>
        <p>您的简历数据仅用于提供 AI 分析和优化服务，不会被用于其他商业用途。</p>
        <h2>3. 数据存储</h2>
        <p>分析结果保存 24 小时后自动删除。您可随时联系客服请求删除所有数据。</p>
        <h2>4. Cookie</h2>
        <p>我们使用必要的 Cookie 来维持登录状态和提供服务。</p>
        <h2>5. 联系我们</h2>
        <p>隐私相关问题请联系：2014761579@qq.com。</p>
      </div>
    </div>
  );
}
