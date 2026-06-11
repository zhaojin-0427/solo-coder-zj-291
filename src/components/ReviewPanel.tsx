import React, { useRef, useEffect } from 'react';
import { TrajectoryReview, ReviewPointType } from '@/types/game';

interface ReviewPanelProps {
  review: TrajectoryReview;
  onPracticeWeakness: (patternType: string) => void;
}

const errorColors: Record<ReviewPointType, string> = {
  deviation: '#ff4444',
  speed_fast: '#ff8800',
  speed_slow: '#8800ff',
  pressure_high: '#ff0066',
  pressure_low: '#0088ff',
};

const errorLabels: Record<ReviewPointType, string> = {
  deviation: '偏离目标区域',
  speed_fast: '速度过快断裂',
  speed_slow: '速度过慢堆积',
  pressure_high: '力度过高',
  pressure_low: '力度过低',
};

const errorIcons: Record<ReviewPointType, string> = {
  deviation: '📍',
  speed_fast: '💨',
  speed_slow: '🐌',
  pressure_high: '💪',
  pressure_low: '🪶',
};

const patternTypeLabels: Record<string, string> = {
  rose: '玫瑰花',
  leaf: '叶子',
  shell: '贝壳边',
  text: '写字',
};

const ReviewPanel: React.FC<ReviewPanelProps> = ({ review, onPracticeWeakness }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const totalErrors =
    review.deviationCount +
    review.speedFastCount +
    review.speedSlowCount +
    review.pressureHighCount +
    review.pressureLowCount;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || totalErrors === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scaleX = canvas.width / 800;
    const scaleY = canvas.height / 600;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#FFF8E7';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#d4a574';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(400 * scaleX, 300 * scaleY, 155 * Math.min(scaleX, scaleY), 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#FFE4C433';
    ctx.beginPath();
    ctx.arc(400 * scaleX, 300 * scaleY, 155 * Math.min(scaleX, scaleY), 0, Math.PI * 2);
    ctx.fill();

    const errorTypes: ReviewPointType[] = ['deviation', 'speed_fast', 'speed_slow', 'pressure_high', 'pressure_low'];

    review.reviewPoints.forEach((point) => {
      ctx.fillStyle = errorColors[point.type];
      ctx.globalAlpha = 0.3 + point.severity * 0.7;
      ctx.beginPath();
      ctx.arc(point.x * scaleX, point.y * scaleY, 3 + point.severity * 5, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.globalAlpha = 1;

    errorTypes.forEach((type, idx) => {
      const x = 8;
      const y = 8 + idx * 18;
      ctx.fillStyle = errorColors[type];
      ctx.beginPath();
      ctx.arc(x + 6, y + 6, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#333';
      ctx.font = '11px Arial';
      ctx.fillText(errorLabels[type], x + 16, y + 10);
    });
  }, [review, totalErrors]);

  const errorSummary = [
    { type: 'deviation' as ReviewPointType, count: review.deviationCount },
    { type: 'speed_fast' as ReviewPointType, count: review.speedFastCount },
    { type: 'speed_slow' as ReviewPointType, count: review.speedSlowCount },
    { type: 'pressure_high' as ReviewPointType, count: review.pressureHighCount },
    { type: 'pressure_low' as ReviewPointType, count: review.pressureLowCount },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-4 border-2 border-blue-200">
        <h4 className="font-bold text-blue-700 mb-3 text-center">📊 裱花轨迹复盘</h4>
        <canvas
          ref={canvasRef}
          width={400}
          height={300}
          className="w-full rounded-xl border border-blue-100"
        />
      </div>

      <div className="bg-white rounded-2xl p-4 border-2 border-orange-200">
        <h4 className="font-bold text-orange-700 mb-3 text-center">🔍 问题分析</h4>
        <div className="space-y-2">
          {errorSummary.map((item) => (
            <div key={item.type} className="flex items-center gap-3">
              <span className="text-lg">{errorIcons[item.type]}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{errorLabels[item.type]}</span>
                  <span className="text-sm font-bold" style={{ color: errorColors[item.type] }}>
                    {item.count}处
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-500 rounded-full"
                    style={{
                      width: `${totalErrors > 0 ? Math.min(100, (item.count / totalErrors) * 100) : 0}%`,
                      backgroundColor: errorColors[item.type],
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {totalErrors > 0 && (
        <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-4 border-2 border-pink-300">
          <h4 className="font-bold text-pink-700 mb-3 text-center">🎯 针对弱项练习</h4>
          <p className="text-sm text-gray-600 text-center mb-3">
            最弱项: <span className="font-bold" style={{ color: errorColors[review.weakestType] }}>{errorLabels[review.weakestType]}</span>
            {' | '}
            最弱造型: <span className="font-bold text-pink-600">{patternTypeLabels[review.weakestPatternType]}</span>
          </p>
          <button
            onClick={() => onPracticeWeakness(review.weakestPatternType)}
            className="w-full bg-gradient-to-r from-pink-400 to-rose-500 hover:from-pink-500 hover:to-rose-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
          >
            🔁 针对{patternTypeLabels[review.weakestPatternType]}弱项再练一次
          </button>
        </div>
      )}
    </div>
  );
};

export default ReviewPanel;
