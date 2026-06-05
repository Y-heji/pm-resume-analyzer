"use client";

import { useState } from "react";

export default function CsButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center text-xl"
        title="联系客服"
      >
        {open ? "✕" : "💬"}
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed bottom-20 right-6 z-50 w-72 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="p-5">
            <h4 className="text-sm font-bold text-gray-900 mb-3">联系客服</h4>

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-gray-500 mb-1">微信</p>
                <p className="text-gray-800 font-medium">Xu--Fengnian</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">邮箱</p>
                <a href="mailto:2014761579@qq.com" className="text-blue-600 hover:text-blue-700">
                  2014761579@qq.com
                </a>
              </div>
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-400">工作时间：09:00 - 21:00</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
