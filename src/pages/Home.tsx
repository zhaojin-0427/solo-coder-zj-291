import React from 'react';
import { Link } from 'react-router-dom';
import { Cake, BookOpen, Trophy, Star, Target } from 'lucide-react';
import { levels } from '@/data/levels';
import { useGameStore } from '@/store/gameStore';

const difficultyColors = {
  easy: 'bg-green-100 text-green-700 border-green-300',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  hard: 'bg-red-100 text-red-700 border-red-300',
};

const difficultyLabels = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
};

const Home: React.FC = () => {
  const { getHighScore } = useGameStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-orange-50 to-yellow-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-10 left-10 text-6xl opacity-20 animate-pulse">🎂</div>
      <div className="absolute top-20 right-20 text-5xl opacity-20 animate-bounce">🍰</div>
      <div className="absolute bottom-20 left-20 text-4xl opacity-20 animate-pulse">🧁</div>
      <div className="absolute bottom-10 right-10 text-6xl opacity-20 animate-bounce">🎀</div>
      <div className="absolute top-1/2 left-5 text-3xl opacity-15">🍓</div>
      <div className="absolute top-1/3 right-5 text-3xl opacity-15">🍒</div>

      <div className="relative z-10 text-center mb-8">
        <div className="text-8xl mb-4">👩‍🍳</div>
        <h1 className="text-5xl font-bold text-pink-600 mb-2 drop-shadow-lg" style={{ fontFamily: 'cursive' }}>
          甜品裱花大师
        </h1>
        <p className="text-lg text-orange-700 font-medium">
          控制节奏，掌握力度，创造完美蛋糕！
        </p>
      </div>

      <div className="relative z-10 bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border-4 border-pink-200 max-w-2xl w-full">
        <h2 className="text-2xl font-bold text-center text-pink-700 mb-6 flex items-center justify-center gap-2">
          <Cake className="w-7 h-7" />
          选择关卡
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {levels.map((level) => {
            const highScore = getHighScore(level.id);
            return (
              <Link
                key={level.id}
                to={`/game/${level.id}`}
                className="group bg-gradient-to-br from-pink-50 to-orange-50 rounded-2xl p-5 border-2 border-pink-200 hover:border-pink-400 hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <div className="text-center">
                  <div className="text-4xl mb-2">
                    {level.difficulty === 'easy' ? '🌸' : level.difficulty === 'medium' ? '🌹' : '💐'}
                  </div>
                  <h3 className="font-bold text-lg text-pink-800">{level.name}</h3>
                  <span
                    className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold border ${difficultyColors[level.difficulty]}`}
                  >
                    {difficultyLabels[level.difficulty]}
                  </span>
                  <p className="text-sm text-gray-600 mt-2 min-h-[40px]">{level.description}</p>
                  <div className="mt-3 pt-3 border-t border-pink-100">
                    <div className="flex items-center justify-center gap-1 text-amber-600">
                      <Trophy className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        最高分: {highScore > 0 ? highScore : '--'}
                      </span>
                    </div>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      {[1, 2, 3].map((s) => (
                        <Star
                          key={s}
                          className={`w-4 h-4 ${
                            highScore >= (s === 1 ? 50 : s === 2 ? 70 : 90)
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="flex gap-3 mb-2">
          <Link
            to="/learn"
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-white font-bold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
          >
            <BookOpen className="w-6 h-6" />
            <span className="text-lg">📚 知识学习</span>
          </Link>
          <Link
            to="/practice"
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-purple-400 to-pink-400 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
          >
            <Target className="w-6 h-6" />
            <span className="text-lg">🎯 专项练习</span>
          </Link>
        </div>
      </div>

      <div className="relative z-10 mt-6 text-center text-sm text-orange-600 bg-white/60 rounded-xl px-4 py-2">
        <p>💡 提示：按住鼠标移动来裱花，滚轮调节挤酱力度</p>
      </div>
    </div>
  );
};

export default Home;
