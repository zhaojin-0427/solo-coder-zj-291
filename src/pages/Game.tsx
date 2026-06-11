import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Phaser from 'phaser';
import { levels } from '@/data/levels';
import { PipingGameScene } from '@/game/PipingGameScene';
import { GameScore, DrawnPoint, TrajectoryReview } from '@/types/game';
import { useGameStore } from '@/store/gameStore';
import { analyzeTrajectory } from '@/utils/scoreCalculator';
import { ExpSettlement } from '@/types/skill';
import GameHUD from '@/components/GameHUD';
import ResultModal from '@/components/ResultModal';
import ExpSettlementToast from '@/components/ExpSettlementToast';

const Game: React.FC = () => {
  const { levelId } = useParams<{ levelId: string }>();
  const navigate = useNavigate();
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<PipingGameScene | null>(null);

  const { saveHighScore, getHighScore, submitLevelResult } = useGameStore();

  const [timeRemaining, setTimeRemaining] = useState(0);
  const [pressure, setPressure] = useState(0.5);
  const [scoreEstimate, setScoreEstimate] = useState<GameScore>({
    completion: 0,
    satisfaction: 0,
    totalScore: 0,
    stars: 0,
  });
  const [finalScore, setFinalScore] = useState<GameScore | null>(null);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [trajectoryReview, setTrajectoryReview] = useState<TrajectoryReview | null>(null);
  const [drawnPaths, setDrawnPaths] = useState<DrawnPoint[][]>([]);
  const [expSettlement, setExpSettlement] = useState<ExpSettlement | null>(null);

  const level = levels.find((l) => l.id === Number(levelId));

  const handleGameEnd = useCallback(
    (score: GameScore) => {
      setFinalScore(score);
      const prevHigh = getHighScore(Number(levelId));
      if (score.totalScore > prevHigh) {
        saveHighScore(Number(levelId), score.totalScore);
        setIsNewRecord(true);
      }
      const speedQuality = Math.round(score.satisfaction * 0.9 + score.completion * 0.1);
      const pressureQuality = Math.round(score.satisfaction * 0.85 + score.completion * 0.15);
      const result = submitLevelResult({
        score: score.totalScore,
        completion: score.completion,
        satisfaction: score.satisfaction,
        speedQuality: Math.min(100, speedQuality),
        pressureQuality: Math.min(100, pressureQuality),
        levelId: Number(levelId),
        stars: score.stars,
      });
      setExpSettlement(result);
    },
    [levelId, level, getHighScore, saveHighScore, submitLevelResult]
  );

  useEffect(() => {
    if (!level || !gameContainerRef.current) return;

    const sceneConfig = {
      level,
      onScoreUpdate: (score: GameScore) => setScoreEstimate(score),
      onTimeUpdate: (time: number) => setTimeRemaining(time),
      onPressureUpdate: (p: number) => setPressure(p),
      onGameEnd: handleGameEnd,
    };

    const gameSceneInstance = new PipingGameScene();
    (gameSceneInstance as any).initData = sceneConfig;

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
      game.scene.add('PipingGameScene', gameSceneInstance, true, sceneConfig);
      sceneRef.current = gameSceneInstance;
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
  }, [level, handleGameEnd]);

  useEffect(() => {
    if (finalScore && level && drawnPaths.length > 0) {
      const review = analyzeTrajectory(level.requiredPatterns, drawnPaths);
      setTrajectoryReview(review);
    }
  }, [finalScore, level, drawnPaths]);

  const handleFinish = () => {
    if (sceneRef.current) {
      const paths = (sceneRef.current as any).drawnPaths as DrawnPoint[][] | undefined;
      if (paths) setDrawnPaths(paths);
      sceneRef.current.forceEndGame();
    }
  };

  const handleReplay = () => {
    setFinalScore(null);
    setIsNewRecord(false);
    setTrajectoryReview(null);
    setDrawnPaths([]);
    setScoreEstimate({ completion: 0, satisfaction: 0, totalScore: 0, stars: 0 });
    navigate(0);
  };

  const handleHome = () => {
    navigate('/');
  };

  const handlePracticeWeakness = (patternType: string) => {
    navigate(`/practice/${patternType}`);
  };

  if (!level) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pink-50">
        <div className="text-center">
          <p className="text-xl text-pink-600 mb-4">关卡不存在</p>
          <button
            onClick={() => navigate('/')}
            className="bg-pink-500 text-white px-6 py-2 rounded-xl hover:bg-pink-600"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-orange-50 to-yellow-50 p-2 md:p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-3 md:gap-4 items-start">
          <div className="flex-1 w-full">
            <div
              ref={gameContainerRef}
              className="relative bg-white rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden border-4 border-pink-200 w-full"
              style={{ aspectRatio: '4/3', maxWidth: '800px' }}
            />
            <div className="mt-3 text-center text-sm text-orange-700 bg-white/70 rounded-xl py-2 px-4">
              🎮 按住鼠标左键在蛋糕上移动裱花，滚轮上下调节挤酱力度
            </div>
          </div>

          <div className="w-full lg:w-72 flex-shrink-0">
            <GameHUD
              timeRemaining={timeRemaining}
              timeLimit={level.timeLimit}
              pressure={pressure}
              completion={scoreEstimate.completion}
              satisfaction={scoreEstimate.satisfaction}
              levelName={level.name}
              nozzleType={level.nozzleType}
              targetPatterns={level.requiredPatterns.map((p) => ({
                type: p.type,
                description: p.description,
                color: p.color,
              }))}
              onFinish={handleFinish}
              onBack={handleHome}
            />
          </div>
        </div>
      </div>

      {finalScore && (
        <ResultModal
          score={finalScore}
          levelName={level.name}
          isNewHighScore={isNewRecord}
          review={trajectoryReview}
          onReplay={handleReplay}
          onHome={handleHome}
          onPracticeWeakness={handlePracticeWeakness}
        />
      )}

      {expSettlement && (
        <ExpSettlementToast
          settlement={expSettlement}
          onClose={() => setExpSettlement(null)}
        />
      )}
    </div>
  );
};

export default Game;
