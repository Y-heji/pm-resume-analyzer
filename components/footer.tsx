"use client";

export default function Footer() {
  const handleCsClick = () => {
    const btn = document.querySelector("button[title='联系客服']") as HTMLButtonElement;
    if (btn) btn.click();
    else {
      // Fallback: try the fixed button
      const fixed = document.querySelector(".fixed.bottom-6 button") as HTMLButtonElement;
      if (fixed) fixed.click();
    }
  };

  return (
    <footer className="bg-white border-t border-gray-200 px-6 py-8 shrink-0">
      <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">产品</h4>
          <ul className="space-y-2 text-gray-500">
            <li><a href="/analyze" className="hover:text-gray-900">简历分析</a></li>
            <li><a href="/membership" className="hover:text-gray-900">专业版</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">支持</h4>
          <ul className="space-y-2 text-gray-500">
            <li><button onClick={handleCsClick} className="hover:text-gray-900">联系客服</button></li>
            <li><span className="text-xs text-gray-400">09:00-21:00</span></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">法律</h4>
          <ul className="space-y-2 text-gray-500">
            <li><a href="/terms" className="hover:text-gray-900">用户协议</a></li>
            <li><a href="/privacy" className="hover:text-gray-900">隐私政策</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">关于</h4>
          <ul className="space-y-2 text-gray-500">
            <li><a href="/about" className="hover:text-gray-900">关于我们</a></li>
            <li><span className="text-xs text-gray-400">AI 职业师</span></li>
          </ul>
        </div>
      </div>
      <div className="max-w-4xl mx-auto mt-6 pt-4 border-t border-gray-100 text-center text-xs text-gray-400">
        &copy; {new Date().getFullYear()} AI 职业师 · 帮助求职者找到更好的工作
      </div>
    </footer>
  );
}
