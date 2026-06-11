import React from 'react';
import { Star } from 'lucide-react';

interface GameHUDProps {
  timeRemaining: number;
  timeLimit: number;
  pressure: number;
  completion: number;
  satisfaction: number;
  levelName: string;
  nozzleType: string;
  targetPatterns: { type: string; description: string; color: string }[];
  onFinish: () => void;
  onBack: () => void;
}

const nozzleLabels: Record<string, string> = {
  round: '圆口花嘴',
  star: '星形花嘴',
  leaf: '叶子花嘴',
  writing: '写字花嘴',
};

const GameHUD: React.FC<GameHUDProps> = ({
  timeRemaining,
  timeLimit,
  pressure,
  completion,
  satisfaction,
  levelName,
  nozzleType,
  targetPatterns,
  onFinish,
  onBack,
}) => {
  const timePercent = (timeRemaining / timeLimit) * 100;
  const timeColor = timePercent > 50 ? 'text-green-600' : timePercent > 25 ? 'text-yellow-600' : 'text-red-600';
  const timeBgColor = timePercent > 50 ? 'bg-green-500' : timePercent > 25 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="bg-white/90 backdrop-blur rounded-2xl p-4 shadow-lg border-2 border-pink-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-pink-700">🎂 {levelName}</h3>
          <button
            onClick={onBack}
            className="text-sm text-gray-500 hover:text-gray-700 transition"
          >
            ← 返回
          </button>
        </div>

        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">⏱️ 剩余时间</span>
            <span className={`text-lg font-bold ${timeColor}`}>
              {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, '0')}
            </span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${timeBgColor} transition-all duration-300`}
              style={{ width: `${timePercent}%` }}
            />
          </div>
        </div>

        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">✅ 完成度</span>
            <span className="text-lg font-bold text-blue-600">{completion}%</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">😊 满意度</span>
            <span className="text-lg font-bold text-purple-600">{satisfaction}%</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 transition-all duration-300"
              style={{ width: `${satisfaction}%` }}
            />
          </div>
        </div>
      </div>

      <div className="bg-white/90 backdrop-blur rounded-2xl p-4 shadow-lg border-2 border-pink-200">
        <h4 className="font-bold text-pink-700 mb-2">💪 挤酱力度</h4>
        <div className="flex items-center gap-3">
          <div className="flex-1 relative h-32 bg-gradient-to-t from-red-100 via-yellow-100 to-green-100 rounded-xl border-2 border-gray-300 overflow-hidden">
            <div
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-orange-400 to-pink-400 transition-all duration-100"
              style={{ height: `${pressure * 100}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-bold text-white drop-shadow-lg">
                {Math.round(pressure * 100)}
              </span>
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-1">🎯</div>
            <p className="text-xs text-gray-600">滚轮调节</p>
            <p className="text-xs font-medium text-pink-600 mt-1">
              {pressure < 0.3 ? '太轻' : pressure < 0.7 ? '适中' : '太重'}
            </p>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          花嘴: {nozzleLabels[nozzleType] || nozzleType}
        </p>
      </div>

      <div className="bg-white/90 backdrop-blur rounded-2xl p-4 shadow-lg border-2 border-pink-200">
        <h4 className="font-bold text-pink-700 mb-2">📋 订单要求</h4>
        <div className="space-y-2">
          {targetPatterns.map((pattern, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full border-2 border-gray-300"
                style={{ backgroundColor: pattern.color }}
              />
              <span className="text-sm text-gray-700">{pattern.description}</span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={onFinish}
        className="bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white font-bold py-3 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
      >
        <Star className="w-5 h-5" />
        完成订单
      </button>
    </div>
  );
};

export default GameHUD;
