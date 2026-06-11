import React from 'react';
import { Trophy, RotateCcw, Home, TrendingUp, AlertTriangle, Star, Award } from 'lucide-react';
import { BusinessDayResult, OrderResult, ReviewPointType, PatternType, BusinessDayLeaderboardEntry } from '@/types/game';

const errorLabels: Record<ReviewPointType, string> = {
  deviation: '偏离目标区域',
  speed_fast: '速度过快',
  speed_slow: '速度过慢',
  pressure_high: '力度过高',
  pressure_low: '力度过低',
};

const patternTypeLabels: Record<PatternType, string> = {
  rose: '玫瑰花',
  leaf: '叶子',
  shell: '贝壳边',
  text: '写字',
};

interface BusinessDaySummaryProps {
  result: BusinessDayResult;
  leaderboard: BusinessDayLeaderboardEntry[];
  isNewRecord: boolean;
  onReplay: () => void;
  onHome: () => void;
  onPracticeWeakness: (patternType: string) => void;
}

const OrderResultCard: React.FC<{ order: OrderResult; isBest: boolean }> = ({ order, isBest }) => (
  <div className={`rounded-xl p-3 border-2 ${order.failed ? 'border-red-200 bg-red-50/50' : isBest ? 'border-yellow-300 bg-yellow-50/50' : 'border-gray-200 bg-white/50'}`}>
    <div className="flex items-center justify-between mb-1">
      <div className="flex items-center gap-2">
        <span className="text-lg">{order.customerEmoji}</span>
        <span className="font-medium text-sm text-gray-800">{order.customerName}</span>
        {isBest && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-bold">最佳</span>}
        {order.failed && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">失败</span>}
      </div>
      <span className="font-bold text-sm text-green-600">¥{order.tip}</span>
    </div>
    <div className="flex gap-3 text-xs text-gray-600">
      <span>完成 {order.completion}%</span>
      <span>满意 {order.satisfaction}%</span>
      <span>耐心 {order.patienceRemaining}%</span>
    </div>
  </div>
);

const BusinessDaySummary: React.FC<BusinessDaySummaryProps> = ({
  result,
  leaderboard,
  isNewRecord,
  onReplay,
  onHome,
  onPracticeWeakness,
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl border-4 border-pink-200 my-4 max-h-[95vh] overflow-y-auto">
        <div className="text-center">
          <div className="text-7xl mb-4">🏪</div>

          {isNewRecord && (
            <div className="inline-flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-bold px-4 py-1 rounded-full mb-3">
              <Trophy className="w-4 h-4" />
              营业日新纪录！
            </div>
          )}

          <h2 className="text-2xl font-bold text-pink-700 mb-1">营业日结束</h2>
          <p className="text-gray-600 mb-6">今日营业报告</p>

          <div className="bg-gradient-to-br from-pink-50 to-orange-50 rounded-2xl p-5 mb-6 border-2 border-pink-100">
            <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-orange-500 mb-2">
              ¥{result.totalIncome}
            </div>
            <p className="text-sm text-gray-500 mb-4">总收入</p>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-xl p-3 shadow-sm">
                <div className="flex items-center justify-center gap-1 text-purple-600 mb-1">
                  <Star className="w-4 h-4" />
                </div>
                <div className="text-xl font-bold text-purple-600">{result.averageSatisfaction}%</div>
                <div className="text-xs text-gray-600 mt-1">平均满意度</div>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm">
                <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div className="text-xl font-bold text-green-600">{result.totalOrders - result.failedOrders}/{result.totalOrders}</div>
                <div className="text-xs text-gray-600 mt-1">完成订单</div>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm">
                <div className="flex items-center justify-center gap-1 text-red-600 mb-1">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div className="text-xl font-bold text-red-600">{result.failedOrders}</div>
                <div className="text-xs text-gray-600 mt-1">失败订单</div>
              </div>
            </div>
          </div>

          {result.bestOrder && (
            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl p-4 mb-4 border-2 border-yellow-200">
              <h4 className="font-bold text-amber-700 mb-2 flex items-center justify-center gap-2">
                <Award className="w-5 h-5" />
                最佳订单
              </h4>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{result.bestOrder.customerEmoji}</span>
                  <div className="text-left">
                    <p className="font-bold text-amber-800">{result.bestOrder.customerName}</p>
                    <p className="text-xs text-gray-600">完成度 {result.bestOrder.completion}% | 满意度 {result.bestOrder.satisfaction}%</p>
                  </div>
                </div>
                <span className="text-xl font-bold text-amber-600">¥{result.bestOrder.tip}</span>
              </div>
            </div>
          )}

          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-4 mb-4 border-2 border-blue-200">
            <h4 className="font-bold text-blue-700 mb-3 flex items-center justify-center gap-2">
              🎯 技能分析
            </h4>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-white rounded-xl p-3">
                <p className="text-xs text-gray-600 mb-1">最弱技能</p>
                <p className="font-bold text-blue-600 text-sm">{errorLabels[result.weakestSkill]}</p>
              </div>
              <div className="bg-white rounded-xl p-3">
                <p className="text-xs text-gray-600 mb-1">最弱造型</p>
                <p className="font-bold text-blue-600 text-sm">{patternTypeLabels[result.weakestPatternType]}</p>
              </div>
            </div>
            <button
              onClick={() => onPracticeWeakness(result.weakestPatternType)}
              className="mt-3 w-full bg-gradient-to-r from-blue-400 to-purple-400 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-2 px-4 rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm"
            >
              🔁 针对{patternTypeLabels[result.weakestPatternType]}弱项练习
            </button>
          </div>

          <div className="bg-white/90 rounded-2xl p-4 mb-4 border-2 border-gray-200">
            <h4 className="font-bold text-gray-700 mb-3 text-center text-sm">📋 订单明细</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {result.orderResults.map((order) => (
                <OrderResultCard
                  key={order.orderId}
                  order={order}
                  isBest={!!result.bestOrder && order.orderId === result.bestOrder.orderId}
                />
              ))}
            </div>
          </div>

          {leaderboard.length > 0 && (
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-4 mb-4 border-2 border-amber-200">
              <h4 className="font-bold text-amber-700 mb-3 text-center text-sm flex items-center justify-center gap-2">
                <Trophy className="w-4 h-4" />
                营业日排行榜
              </h4>
              <div className="space-y-1">
                {leaderboard.slice(0, 5).map((entry, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
                      isNewRecord && idx === 0 ? 'bg-yellow-100 border border-yellow-300' : 'bg-white/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-amber-600">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`}
                      </span>
                      <span className="text-gray-600">{entry.date}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">{entry.totalOrders - entry.failedOrders}单</span>
                      <span className="font-bold text-amber-700">¥{entry.totalIncome}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-4">
            <button
              onClick={onHome}
              className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-xl transition-all"
            >
              <Home className="w-5 h-5" />
              主菜单
            </button>
            <button
              onClick={onReplay}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-pink-400 to-orange-400 hover:from-pink-500 hover:to-orange-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all"
            >
              <RotateCcw className="w-5 h-5" />
              再来一天
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessDaySummary;
