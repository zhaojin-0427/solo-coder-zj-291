import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Phaser from 'phaser';
import { practicePatterns } from '@/data/levels';
import { PracticeScene } from '@/game/PracticeScene';
import { PracticeResult, PatternType } from '@/types/game';
import { useGameStore } from '@/store/gameStore';
import { ExpSettlement } from '@/types/skill';
import { Trophy, Star, Target, ArrowLeft } from 'lucide-react';
import ExpSettlementToast from '@/components/ExpSettlementToast';

const nozzleLabels: Record<string, string> = {
  round: '圆口花嘴',
  star: '星形花嘴',
  leaf: '叶子花嘴',
  writing: '写字花嘴',
};

const patternTypeAliases: Record<string, PatternType> = {
  writing: 'text',
  write: 'text',
  letter: 'text',
  letters: 'text',
  zi: 'text',
  xie: 'text',
  flower: 'rose',
  luosihua: 'rose',
  yezi: 'leaf',
  beike: 'shell',
  beikebian: 'shell',
  border: 'shell',
  edge: 'shell',
};

const resolvePatternType = (raw: string | undefined): PatternType | null => {
  if (!raw) return null;
  const normalized = raw.toLowerCase().trim();
  const allTypes: PatternType[] = ['rose', 'leaf', 'shell', 'text'];
  if (allTypes.includes(normalized as PatternType)) {
    return normalized as PatternType;
  }
  if (patternTypeAliases[normalized]) {
    return patternTypeAliases[normalized];
  }
  return null;
};

const Practice: React.FC = () => {
  const { patternType: rawPatternType } = useParams<{ patternType: string }>();
  const navigate = useNavigate();
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<PracticeScene | null>(null);

  const { savePracticeHighScore, getPracticeHighScore, submitPracticeResult } = useGameStore();

  const resolvedType = resolvePatternType(rawPatternType);
  const pattern = practicePatterns.find((p) => p.type === resolvedType);

  const [pressure, setPressure] = useState(0.5);
  const [practiceResult, setPracticeResult] = useState<PracticeResult | null>(null);
  const [currentHint, setCurrentHint] = useState<string>('');
  const [isFinished, setIsFinished] = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [expSettlement, setExpSettlement] = useState<ExpSettlement | null>(null);

  const handlePracticeEnd = useCallback(
    (result: PracticeResult) => {
      setPracticeResult(result);
      setIsFinished(true);
      if (pattern) {
        const prevHigh = getPracticeHighScore(pattern.type);
        if (result.score > prevHigh) {
          savePracticeHighScore(pattern.type, result.score);
          setIsNewRecord(true);
        }
        const settlement = submitPracticeResult({
          score: result.score,
          completion: result.completion,
          satisfaction: result.completion,
          speedQuality: result.speedQuality,
          pressureQuality: result.pressureQuality,
          patternType: pattern.type,
        });
        setExpSettlement(settlement);
      }
    },
    [pattern, getPracticeHighScore, savePracticeHighScore, submitPracticeResult]
  );

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

    const wrapperWidth = wrapperRef.current?.clientWidth || 800;
    const logicalWidth = 800;
    const logicalHeight = 600;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: gameContainerRef.current,
      width: logicalWidth,
      height: logicalHeight,
      backgroundColor: '#FFF8E7',
      scene: [],
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: logicalWidth,
        height: logicalHeight,
      },
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    game.events.once('ready', () => {
      game.scene.add('PracticeScene', practiceSceneInstance, true, sceneConfig);
      sceneRef.current = practiceSceneInstance;
    });

    const handleResize = () => {
      if (gameRef.current) {
        gameRef.current.scale.refresh();
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
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
    setIsNewRecord(false);
    setCurrentHint('');
    navigate(0);
  };

  const handleBack = () => {
    navigate('/practice');
  };

  if (!pattern) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-orange-50 to-yellow-50 flex flex-col items-center justify-center p-4">
        <div className="text-center bg-white/90 rounded-3xl p-8 shadow-2xl border-4 border-pink-200 max-w-md w-full">
          <div className="text-6xl mb-4">🤔</div>
          <p className="text-xl text-pink-600 mb-2 font-bold">
            练习项目 "{rawPatternType}" 不存在
          </p>
          <p className="text-gray-500 mb-6">
            请从下方选择你想练习的造型类型：
          </p>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {practicePatterns.map((p) => (
              <button
                key={p.type}
                onClick={() => navigate(`/practice/${p.type}`)}
                className="bg-gradient-to-br from-pink-50 to-orange-50 hover:from-pink-100 hover:to-orange-100 rounded-xl p-3 border-2 border-pink-200 hover:border-pink-400 transition-all"
              >
                <div className="text-3xl mb-1">{p.icon}</div>
                <div className="text-sm font-medium text-pink-700">{p.name}</div>
              </button>
            ))}
          </div>
          <button
            onClick={() => navigate('/practice')}
            className="bg-pink-500 hover:bg-pink-600 text-white font-bold px-6 py-2 rounded-xl transition-all w-full"
          >
            返回练习选择
          </button>
        </div>
      </div>
    );
  }

  const highScore = pattern ? getPracticeHighScore(pattern.type) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-orange-50 to-yellow-50 p-2 md:p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-3 md:gap-4 items-start">
          <div className="flex-1 w-full" ref={wrapperRef}>
            <div
              className="relative bg-white rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden border-4 border-pink-200 w-full"
              style={{ aspectRatio: '4/3' }}
            >
              <div
                ref={gameContainerRef}
                className="absolute inset-0 w-full h-full"
              />
            </div>
            <div className="mt-2 md:mt-3 text-center text-xs md:text-sm text-orange-700 bg-white/70 rounded-xl py-2 px-4">
              🎮 按住鼠标/手指沿示范线裱花，滚轮/双指调节挤酱力度
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
                <h3 className="font-bold text-pink-700">
                  {pattern.icon} {pattern.name}
                </h3>
                <button
                  onClick={handleBack}
                  className="text-sm text-gray-500 hover:text-gray-700 transition"
                >
                  ← 返回
                </button>
              </div>
              <p className="text-xs md:text-sm text-gray-600 mb-3">{pattern.description}</p>

              {highScore > 0 && (
                <div className="bg-amber-50 rounded-xl p-2 mb-3 flex items-center gap-2 border border-amber-200">
                  <Trophy className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <span className="text-xs text-amber-700">
                    历史最高分: <span className="font-bold">{highScore}</span>
                  </span>
                </div>
              )}

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
              <h4 className="font-bold text-pink-700 mb-2 text-sm">💪 挤酱力度</h4>
              <div className="flex items-center gap-3">
                <div className="flex-1 relative h-20 md:h-24 bg-gradient-to-t from-red-100 via-yellow-100 to-green-100 rounded-xl border-2 border-gray-300 overflow-hidden">
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-orange-400 to-pink-400 transition-all duration-100"
                    style={{ height: `${pressure * 100}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl md:text-2xl font-bold text-white drop-shadow-lg">
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
                <h4 className="font-bold text-blue-700 mb-3 text-center text-sm">📊 练习评分</h4>

                {isFinished && isNewRecord && (
                  <div className="flex items-center justify-center gap-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-bold px-3 py-1 rounded-full mb-2 text-xs mx-auto w-fit">
                    <Trophy className="w-3 h-3" />
                    新纪录！
                  </div>
                )}

                <div className="text-center mb-3">
                  <span className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-500">
                    {practiceResult.score}
                  </span>
                  <span className="text-base md:text-lg text-gray-500">/100</span>
                </div>
                <div className="space-y-2">
                  {[
                    { label: '完成度', value: practiceResult.completion, color: 'blue' },
                    { label: '精确度', value: practiceResult.accuracy, color: 'green' },
                    { label: '速度质量', value: practiceResult.speedQuality, color: 'orange' },
                    { label: '力度质量', value: practiceResult.pressureQuality, color: 'purple' },
                  ].map((m) => (
                    <div key={m.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600">{m.label}</span>
                        <span className={`font-bold text-${m.color}-600`}>{m.value}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-${m.color}-500 rounded-full transition-all`}
                          style={{ width: `${m.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {practiceResult.errors.some((e) => e.count > 0) && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs font-bold text-gray-700 mb-2">⚠️ 错误统计</p>
                    <div className="space-y-1">
                      {practiceResult.errors
                        .filter((e) => e.count > 0)
                        .map((e) => (
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

      {expSettlement && (
        <ExpSettlementToast
          settlement={expSettlement}
          onClose={() => setExpSettlement(null)}
        />
      )}
    </div>
  );
};

export const PracticeSelect: React.FC = () => {
  const navigate = useNavigate();
  const { getPracticeHighScore } = useGameStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-orange-50 to-yellow-50 p-3 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1 md:gap-2 text-pink-600 hover:text-pink-700 font-medium bg-white/80 px-3 md:px-4 py-2 rounded-xl shadow-sm hover:shadow transition-all text-sm md:text-base"
          >
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden sm:inline">返回主菜单</span>
            <span className="sm:hidden">返回</span>
          </button>
          <h1 className="text-xl md:text-3xl font-bold text-pink-700 flex items-center gap-2">
            <Target className="w-6 h-6 md:w-8 md:h-8" />
            <span className="hidden sm:inline">专项练习</span>
            <span className="sm:hidden">练习</span>
          </h1>
          <div className="w-20 md:w-32" />
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-lg border-2 border-pink-200 mb-6 md:mb-8">
          <p className="text-center text-gray-600 text-xs md:text-base leading-relaxed">
            选择你想练习的造型类型，系统会提供目标示范线和实时错误提示，帮助你针对性提升裱花技巧
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {practicePatterns.map((p) => {
            const hs = getPracticeHighScore(p.type);
            const stars = hs >= 90 ? 3 : hs >= 70 ? 2 : hs >= 50 ? 1 : 0;
            return (
              <button
                key={p.type}
                onClick={() => navigate(`/practice/${p.type}`)}
                className="group bg-white/90 backdrop-blur rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-lg border-2 border-pink-200 hover:border-pink-400 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] text-left w-full"
              >
                <div className="flex items-start gap-3 md:gap-4">
                  <div className="text-4xl md:text-5xl flex-shrink-0">{p.icon}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg md:text-xl font-bold text-pink-700 mb-1 md:mb-2 truncate">
                      {p.name}
                    </h3>
                    <p className="text-xs md:text-sm text-gray-600 leading-relaxed mb-2 md:mb-3 line-clamp-2">
                      {p.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mb-2 md:mb-3">
                      <span className="text-xs bg-pink-50 text-pink-600 px-2 py-1 rounded-lg border border-pink-200">
                        {nozzleLabels[p.nozzleType]}
                      </span>
                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-lg border border-blue-200">
                        {p.requiredThickness}px
                      </span>
                    </div>

                    <div className="flex items-center gap-3 pt-2 border-t border-pink-100">
                      <div className="flex items-center gap-1 text-amber-600">
                        <Trophy className="w-3 h-3 md:w-4 md:h-4" />
                        <span className="text-xs md:text-sm font-medium">
                          {hs > 0 ? hs : '--'}
                        </span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3].map((s) => (
                          <Star
                            key={s}
                            className={`w-3 h-3 md:w-4 md:h-4 ${
                              s <= stars
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Practice;
