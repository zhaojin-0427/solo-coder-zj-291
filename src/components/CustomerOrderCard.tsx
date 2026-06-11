import React from 'react';
import { CustomerOrder, CakeShape, NozzleType } from '@/types/game';

const shapeLabels: Record<CakeShape, string> = {
  circle: '⭕ 圆形',
  square: '⬜ 方形',
  heart: '❤️ 心形',
};

const nozzleLabels: Record<NozzleType, string> = {
  round: '圆口花嘴',
  star: '星形花嘴',
  leaf: '叶子花嘴',
  writing: '写字花嘴',
};

const speedLabels: Record<string, string> = {
  slow: '🐢 慢速',
  medium: '🚶 适中',
  fast: '🏃 快速',
};

interface CustomerOrderCardProps {
  order: CustomerOrder;
  orderIndex: number;
  totalOrders: number;
  timeRemaining: number;
  pressure: number;
  completion: number;
  satisfaction: number;
  patience: number;
  businessDayTimeRemaining: number;
  onFinish: () => void;
}

const CustomerOrderCard: React.FC<CustomerOrderCardProps> = ({
  order,
  orderIndex,
  totalOrders,
  timeRemaining,
  pressure,
  completion,
  satisfaction,
  patience,
  businessDayTimeRemaining,
  onFinish,
}) => {
  const timePercent = (timeRemaining / order.timeLimit) * 100;
  const timeColor = timePercent > 50 ? 'text-green-600' : timePercent > 25 ? 'text-yellow-600' : 'text-red-600';
  const timeBgColor = timePercent > 50 ? 'bg-green-500' : timePercent > 25 ? 'bg-yellow-500' : 'bg-red-500';

  const patiencePercent = Math.min(100, (patience / order.patience) * 100);
  const patienceColor = patiencePercent > 50 ? 'bg-green-500' : patiencePercent > 25 ? 'bg-yellow-500' : 'bg-red-500';

  const bdMinutes = Math.floor(businessDayTimeRemaining / 60);
  const bdSeconds = businessDayTimeRemaining % 60;

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="bg-white/90 backdrop-blur rounded-2xl p-4 shadow-lg border-2 border-pink-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-pink-700">
            🏪 营业日挑战
          </h3>
          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-lg font-medium">
            订单 {orderIndex + 1}/{totalOrders}
          </span>
        </div>

        <div className="flex items-center gap-2 mb-3 bg-gradient-to-r from-pink-50 to-orange-50 rounded-xl p-2">
          <span className="text-2xl">{order.customerEmoji}</span>
          <div>
            <p className="font-bold text-pink-800 text-sm">{order.customerName}</p>
            <p className="text-xs text-gray-500">基础价格: ¥{order.basePrice}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-gray-500">营业时间</p>
            <p className="font-bold text-orange-600 text-sm">
              {bdMinutes}:{String(bdSeconds).padStart(2, '0')}
            </p>
          </div>
        </div>

        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-700">😤 耐心值</span>
            <span className={`text-xs font-bold ${patiencePercent > 50 ? 'text-green-600' : patiencePercent > 25 ? 'text-yellow-600' : 'text-red-600'}`}>
              {Math.round(patiencePercent)}%
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${patienceColor} transition-all duration-500`}
              style={{ width: `${patiencePercent}%` }}
            />
          </div>
        </div>

        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-700">⏱️ 订单时间</span>
            <span className={`text-sm font-bold ${timeColor}`}>
              {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, '0')}
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full ${timeBgColor} transition-all duration-300`}
              style={{ width: `${timePercent}%` }}
            />
          </div>
        </div>

        <div className="mb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-700">✅ 完成度</span>
            <span className="text-sm font-bold text-blue-600">{completion}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-gray-700">😊 满意度</span>
            <span className="text-sm font-bold text-purple-600">{satisfaction}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 transition-all duration-300"
              style={{ width: `${satisfaction}%` }}
            />
          </div>
        </div>
      </div>

      <div className="bg-white/90 backdrop-blur rounded-2xl p-4 shadow-lg border-2 border-pink-200">
        <h4 className="font-bold text-pink-700 mb-2 text-sm">💪 挤酱力度</h4>
        <div className="flex items-center gap-3">
          <div className="flex-1 relative h-20 bg-gradient-to-t from-red-100 via-yellow-100 to-green-100 rounded-xl border-2 border-gray-300 overflow-hidden">
            <div
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-orange-400 to-pink-400 transition-all duration-100"
              style={{ height: `${pressure * 100}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold text-white drop-shadow-lg">
                {Math.round(pressure * 100)}
              </span>
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-1">🎯</div>
            <p className="text-xs text-gray-600">滚轮调节</p>
            <p className="text-xs font-medium text-pink-600 mt-1">
              {pressure < 0.3 ? '太轻' : pressure < 0.7 ? '适中' : '太重'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white/90 backdrop-blur rounded-2xl p-4 shadow-lg border-2 border-pink-200">
        <h4 className="font-bold text-pink-700 mb-2 text-sm">📋 订单详情</h4>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <span>{shapeLabels[order.cakeShape]}</span>
            <span className="text-gray-400">|</span>
            <span>{nozzleLabels[order.nozzleType]}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>偏好速度:</span>
            <span>{speedLabels[order.preferredSpeed]}</span>
          </div>
          <div className="space-y-1">
            {order.requiredPatterns.map((pattern, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full border border-gray-300 flex-shrink-0"
                  style={{ backgroundColor: pattern.color }}
                />
                <span className="text-gray-700">{pattern.description}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={onFinish}
        className="bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white font-bold py-3 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
      >
        ✅ 完成当前订单
      </button>
    </div>
  );
};

export default CustomerOrderCard;
