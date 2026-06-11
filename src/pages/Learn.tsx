import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Lightbulb } from 'lucide-react';
import { pipingKnowledge } from '@/data/levels';

const Learn: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/"
            className="flex items-center gap-2 text-pink-600 hover:text-pink-700 font-medium bg-white/80 px-4 py-2 rounded-xl shadow-sm hover:shadow transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            返回主菜单
          </Link>
          <h1 className="text-3xl font-bold text-pink-700 flex items-center gap-2">
            <Lightbulb className="w-8 h-8 text-amber-500" />
            裱花知识课堂
          </h1>
          <div className="w-32" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {pipingKnowledge.map((item, idx) => (
            <div
              key={idx}
              className="bg-white/90 backdrop-blur rounded-3xl p-6 shadow-lg border-2 border-orange-200 hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                <div className="text-5xl flex-shrink-0">{item.icon}</div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-pink-700 mb-2">{item.title}</h3>
                  <p className="text-gray-700 leading-relaxed mb-3">{item.description}</p>
                  <div className="bg-gradient-to-r from-amber-50 to-pink-50 rounded-xl p-3 border border-amber-200">
                    <p className="text-sm text-amber-800">
                      <span className="font-bold">💡 小贴士：</span>
                      {item.tip}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-white/90 backdrop-blur rounded-3xl p-6 shadow-lg border-2 border-pink-200">
          <h3 className="text-xl font-bold text-center text-pink-700 mb-4">🎮 游戏操作说明</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-4xl mb-2">🖱️</div>
              <h4 className="font-bold text-gray-800 mb-1">按住移动</h4>
              <p className="text-sm text-gray-600">按住鼠标左键在蛋糕上移动来裱花</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-2">🎡</div>
              <h4 className="font-bold text-gray-800 mb-1">滚轮调节</h4>
              <p className="text-sm text-gray-600">使用鼠标滚轮上下调节挤酱力度</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-2">⏱️</div>
              <h4 className="font-bold text-gray-800 mb-1">把握时间</h4>
              <p className="text-sm text-gray-600">在时间内完成可获得额外加分</p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-400 to-orange-400 hover:from-pink-500 hover:to-orange-500 text-white font-bold py-3 px-8 rounded-2xl shadow-lg hover:shadow-xl transition-all"
          >
            🍰 开始练习裱花
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Learn;
