import React from 'react';
import { Star, Trophy, RotateCcw, Home } from 'lucide-react';
import { GameScore } from '@/types/game';

interface ResultModalProps {
  score: GameScore;
  levelName: string;
  isNewHighScore: boolean;
  onReplay: () => void;
  onHome: () => void;
}

const ResultModal: React.FC<ResultModalProps> = ({
  score,
  levelName,
  isNewHighScore,
  onReplay,
  onHome,
}) => {
  const getEmoji = () => {
    if (score.stars >= 3) return '🎉';
    if (score.stars >= 2) return '😊';
    if (score.stars >= 1) return '🙂';
    return '💪';
  };

  const getMessage = () => {
    if (score.stars >= 3) return '完美裱花！你是真正的甜品大师！';
    if (score.stars >= 2) return '做得不错！继续努力可以更好！';
    if (score.stars >= 1) return '还可以，多加练习哦！';
    return '别灰心，再来一次！';
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border-4 border-pink-200 animate-bounce-in">
        <div className="text-center">
          <div className="text-7xl mb-4">{getEmoji()}</div>

          {isNewHighScore && (
            <div className="inline-block bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-bold px-4 py-1 rounded-full mb-3 flex items-center gap-1 mx-auto">
              <Trophy className="w-4 h-4" />
              新纪录！
            </div>
          )}

          <h2 className="text-2xl font-bold text-pink-700 mb-1">{levelName}</h2>
          <p className="text-gray-600 mb-4">{getMessage()}</p>

          <div className="flex justify-center gap-2 mb-6">
            {[1, 2, 3].map((s) => (
              <Star
                key={s}
                className={`w-12 h-12 transition-all duration-500 ${
                  s <= score.stars
                    ? 'text-yellow-400 fill-yellow-400 scale-110'
                    : 'text-gray-300'
                }`}
                style={{ transitionDelay: `${s * 150}ms` }}
              />
            ))}
          </div>

          <div className="bg-gradient-to-br from-pink-50 to-orange-50 rounded-2xl p-5 mb-6 border-2 border-pink-100">
            <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-orange-500 mb-4">
              {score.totalScore}
              <span className="text-2xl text-gray-500">/100</span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-white rounded-xl p-3 shadow-sm">
                <div className="text-2xl font-bold text-blue-600">{score.completion}%</div>
                <div className="text-xs text-gray-600 mt-1">造型完成度</div>
              </div>
              <div className="bg-white rounded-xl p-3 shadow-sm">
                <div className="text-2xl font-bold text-purple-600">{score.satisfaction}%</div>
                <div className="text-xs text-gray-600 mt-1">顾客满意度</div>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
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
              再来一次
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultModal;
