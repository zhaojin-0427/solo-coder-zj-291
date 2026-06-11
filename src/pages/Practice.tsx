import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Phaser from 'phaser';
import { practicePatterns } from '@/data/levels';
import { PracticeScene } from '@/game/PracticeScene';
import { PracticeResult } from '@/types/game';

const nozzleLabels: Record<string, string> = {
  round: '圆口花嘴',
  star: '星形花嘴',
  leaf: '叶子花嘴',
  writing: '写字花嘴',
};

const Practice: React.FC = () => {
  const { patternType } = useParams<{ patternType: string }>();
  const navigate = useNavigate();
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<PracticeScene | null>(null);

  const [pressure, setPressure] = useState(0.5);
  const [practiceResult, setPracticeResult] = useState<PracticeResult | null>(null);
  const [currentHint, setCurrentHint] = useState<string>('');
  const [isFinished, setIsFinished] = useState(false);

  const pattern = practicePatterns.find((p) => p.type === patternType);

  const handlePracticeEnd = useCallback((result: PracticeResult) => {
    setPracticeResult(result);
    setIsFinished(true);
  }, []);

  const handleScoreUpdate = useCallback((result: PracticeResult) => {
    if (!isFinished) {
      setPracticeResult(result);
    }
  }, [isFinished]);

  const handleErrorHint = useCallback((hint: string) => {
    setCurrentHint(hint);
    setTimeout(() => setCurrentHint(''), 2000);
  }, []);

  useEffect(() => {
    if (!pattern || !gameContainerRef.current) return;

    const sceneConfig = {
      pattern,
      onScoreUpdate: handleScoreUpdate,
      onPressureUpdate: (p: number) => setPressure(p),
      onPracticeEnd: handlePracticeEnd,
      onErrorHint: handleErrorHint,
    };

    const practiceSceneInstance = new PracticeScene();
    (practiceSceneInstance as any).initData = sceneConfig;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: gameContainerRef.current,
      width: 800,
      height: 600,
      backgroundColor: '#FFF8E7',
      scene: [],
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    game.events.once('ready', () => {
      game.scene.add('PracticeScene', practiceSceneInstance, true, sceneConfig);
      sceneRef.current = practiceSceneInstance;
    });

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [pattern, handlePracticeEnd, handleScoreUpdate, handleErrorHint]);

  const handleFinish = () => {
    if (sceneRef.current) {
      sceneRef.current.forceEndPractice();
    }
  };

  const handleRetry = () => {
    setPracticeResult(null);
    setIsFinished(false);
    setCurrentHint('');
    navigate(0);
  };

  const handleBack = () => {
    navigate('/practice');
  };

  if (!pattern) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pink-50">
        <div className="text-center">
          <p className="text-xl text-pink-600 mb-4">练习项目不存在</p>
          <button
            onClick={() => navigate('/practice')}
            className="bg-pink-500 text-white px-6 py-2 rounded-xl hover:bg-pink-600"
          >
            返回练习选择
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-orange-50 to-yellow-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-4 items-start">
          <div className="flex-1">
            <div
              ref={gameContainerRef}
              className="bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-pink-200"
              style={{ aspectRatio: '4/3', maxWidth: '800px' }}
            />
            <div className="mt-3 text-center text-sm text-orange-700 bg-white/70 rounded-xl py-2 px-4">
              🎮 按住鼠标左键沿示范线裱花，滚轮调节挤酱力度
            </div>
            {currentHint && (
              <div className="mt-2 text-center text-sm font-bold text-red-600 bg-red-50 rounded-xl py-2 px-4 border border-red-200 animate-pulse">
                {currentHint}
              </div>
            )}
          </div>

          <div className="w-full lg:w-72 flex-shrink-0 space-y-3">
            <div className="bg-white/90 backdrop-blur rounded-2xl p-4 shadow-lg border-2 border-pink-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-pink-700">{pattern.icon} {pattern.name}</h3>
                <button
                  onClick={handleBack}
                  className="text-sm text-gray-500 hover:text-gray-700 transition"
                >
                  ← 返回
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-3">{pattern.description}</p>
              <div className="bg-pink-50 rounded-xl p-3 text-center">
                <p className="text-xs text-pink-600 font-medium">
                  花嘴: {nozzleLabels[pattern.nozzleType]}
                </p>
                <p className="text-xs text-pink-600 mt-1">
                  目标粗细: {pattern.requiredThickness}px
                </p>
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur rounded-2xl p-4 shadow-lg border-2 border-pink-200">
              <h4 className="font-bold text-pink-700 mb-2">💪 挤酱力度</h4>
              <div className="flex items-center gap-3">
                <div className="flex-1 relative h-24 bg-gradient-to-t from-red-100 via-yellow-100 to-green-100 rounded-xl border-2 border-gray-300 overflow-hidden">
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-orange-400 to-pink-400 transition-all duration-100"
                    style={{ height: `${pressure * 100}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white drop-shadow-lg">
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

            {practiceResult && (
              <div className="bg-white/90 backdrop-blur rounded-2xl p-4 shadow-lg border-2 border-blue-200">
                <h4 className="font-bold text-blue-700 mb-3 text-center">📊 练习评分</h4>
                <div className="text-center mb-3">
                  <span className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">
                    {practiceResult.score}
                  </span>
                  <span className="text-lg text-gray-500">/100</span>
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600">完成度</span>
                      <span className="font-bold text-blue-600">{practiceResult.completion}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${practiceResult.completion}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600">精确度</span>
                      <span className="font-bold text-green-600">{practiceResult.accuracy}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${practiceResult.accuracy}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600">速度质量</span>
                      <span className="font-bold text-orange-600">{practiceResult.speedQuality}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${practiceResult.speedQuality}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600">力度质量</span>
                      <span className="font-bold text-purple-600">{practiceResult.pressureQuality}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${practiceResult.pressureQuality}%` }} />
                    </div>
                  </div>
                </div>

                {practiceResult.errors.some((e) => e.count > 0) && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs font-bold text-gray-700 mb-2">⚠️ 错误统计</p>
                    <div className="space-y-1">
                      {practiceResult.errors.filter((e) => e.count > 0).map((e) => (
                        <div key={e.type} className="flex justify-between text-xs">
                          <span className="text-gray-600">{e.description}</span>
                          <span className="font-bold text-red-500">{e.count}处</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!isFinished ? (
              <button
                onClick={handleFinish}
                className="w-full bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white font-bold py-3 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
              >
                ✅ 完成练习
              </button>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={handleRetry}
                  className="w-full bg-gradient-to-r from-pink-400 to-orange-400 hover:from-pink-500 hover:to-orange-500 text-white font-bold py-3 px-6 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  🔄 再练一次
                </button>
                <button
                  onClick={handleBack}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-6 rounded-2xl transition-all flex items-center justify-center gap-2"
                >
                  📋 选择其他练习
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const PracticeSelect: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-orange-50 to-yellow-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-pink-600 hover:text-pink-700 font-medium bg-white/80 px-4 py-2 rounded-xl shadow-sm hover:shadow transition-all"
          >
            ← 返回主菜单
          </button>
          <h1 className="text-3xl font-bold text-pink-700 flex items-center gap-2">
            🎯 专项练习
          </h1>
          <div className="w-32" />
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg border-2 border-pink-200 mb-8">
          <p className="text-center text-gray-600">
            选择你想练习的造型类型，系统会提供目标示范线和实时错误提示，帮助你针对性提升裱花技巧
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {practicePatterns.map((p) => (
            <button
              key={p.type}
              onClick={() => navigate(`/practice/${p.type}`)}
              className="group bg-white/90 backdrop-blur rounded-3xl p-6 shadow-lg border-2 border-pink-200 hover:border-pink-400 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] text-left"
            >
              <div className="flex items-start gap-4">
                <div className="text-5xl flex-shrink-0">{p.icon}</div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-pink-700 mb-2">{p.name}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed mb-3">{p.description}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-xs bg-pink-50 text-pink-600 px-2 py-1 rounded-lg border border-pink-200">
                      {nozzleLabels[p.nozzleType]}
                    </span>
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-lg border border-blue-200">
                      目标粗细 {p.requiredThickness}px
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Practice;
