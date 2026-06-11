import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Phaser from 'phaser';
import { ChallengeScene } from '@/game/ChallengeScene';
import { GameScore, DrawnPoint, CustomerOrder, OrderResult, BusinessDayResult } from '@/types/game';
import { useGameStore } from '@/store/gameStore';
import { generateCustomerQueue, BUSINESS_DAY_DURATION, BUSINESS_DAY_CUSTOMER_COUNT } from '@/data/customers';
import { calculateOrderResult, calculateBusinessDayResult } from '@/utils/scoreCalculator';
import CustomerOrderCard from '@/components/CustomerOrderCard';
import BusinessDaySummary from '@/components/BusinessDaySummary';

type Phase = 'intro' | 'playing' | 'transition' | 'summary';

const BusinessDay: React.FC = () => {
  const navigate = useNavigate();
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<ChallengeScene | null>(null);

  const { saveBusinessDayScore, getBusinessDayLeaderboard } = useGameStore();

  const [phase, setPhase] = useState<Phase>('intro');
  const [customerQueue, setCustomerQueue] = useState<CustomerOrder[]>([]);
  const [currentOrderIndex, setCurrentOrderIndex] = useState(0);

  const [timeRemaining, setTimeRemaining] = useState(0);
  const [pressure, setPressure] = useState(0.5);
  const [scoreEstimate, setScoreEstimate] = useState<GameScore>({
    completion: 0,
    satisfaction: 0,
    totalScore: 0,
    stars: 0,
  });
  const [patience, setPatience] = useState(100);
  const [businessDayTimeRemaining, setBusinessDayTimeRemaining] = useState(BUSINESS_DAY_DURATION);
  const [businessDayResult, setBusinessDayResult] = useState<BusinessDayResult | null>(null);
  const [isNewRecord, setIsNewRecord] = useState(false);

  const businessDayTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentOrderRef = useRef<CustomerOrder | null>(null);
  const orderResultsRef = useRef<OrderResult[]>([]);
  const customerQueueRef = useRef<CustomerOrder[]>([]);
  const currentOrderIndexRef = useRef(0);

  const startBusinessDay = useCallback(() => {
    const queue = generateCustomerQueue(BUSINESS_DAY_CUSTOMER_COUNT);
    setCustomerQueue(queue);
    customerQueueRef.current = queue;
    setCurrentOrderIndex(0);
    currentOrderIndexRef.current = 0;
    orderResultsRef.current = [];
    setBusinessDayTimeRemaining(BUSINESS_DAY_DURATION);
    setPhase('playing');
  }, []);

  const processOrderEnd = useCallback((score: GameScore, drawnPaths: DrawnPoint[][]) => {
    const order = currentOrderRef.current;
    if (!order) return;

    const timeUsed = order.timeLimit - (sceneRef.current ? (sceneRef.current as any).timeRemaining : 0);
    const currentPatience = (sceneRef.current as any)?.currentPatience ?? patience;

    const result = calculateOrderResult(order, score, drawnPaths, timeUsed, currentPatience);

    orderResultsRef.current = [...orderResultsRef.current, result];

    const nextIndex = currentOrderIndexRef.current + 1;
    const remainingBusinessDayTime = businessDayTimeRemaining;

    if (nextIndex >= customerQueueRef.current.length || remainingBusinessDayTime <= 0) {
      setPhase('summary');
    } else {
      setPhase('transition');
      setTimeout(() => {
        const nextOrder = customerQueueRef.current[nextIndex];
        setCurrentOrderIndex(nextIndex);
        currentOrderIndexRef.current = nextIndex;
        setPatience(nextOrder ? nextOrder.patience : 100);
        setPhase('playing');
      }, 1800);
    }
  }, [businessDayTimeRemaining, patience]);

  useEffect(() => {
    if (phase !== 'playing') return;
    if (!customerQueue.length) return;

    const order = customerQueue[currentOrderIndex];
    if (!order) return;

    currentOrderRef.current = order;
    setPatience(order.patience);

    if (sceneRef.current) {
      sceneRef.current.loadNewOrder(order);
    }
  }, [phase, currentOrderIndex, customerQueue]);

  useEffect(() => {
    if (phase !== 'playing') return;

    if (businessDayTimerRef.current) {
      clearInterval(businessDayTimerRef.current);
    }

    businessDayTimerRef.current = setInterval(() => {
      setBusinessDayTimeRemaining(prev => {
        const next = prev - 1;
        if (next <= 0) {
          if (sceneRef.current) {
            sceneRef.current.forceEndOrder();
          }
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => {
      if (businessDayTimerRef.current) {
        clearInterval(businessDayTimerRef.current);
        businessDayTimerRef.current = null;
      }
    };
  }, [phase]);

  useEffect(() => {
    if (phase === 'playing' && businessDayTimeRemaining <= 0) {
      if (businessDayTimerRef.current) {
        clearInterval(businessDayTimerRef.current);
        businessDayTimerRef.current = null;
      }
    }
  }, [phase, businessDayTimeRemaining]);

  useEffect(() => {
    if (phase !== 'summary') return;
    if (orderResultsRef.current.length === 0) return;

    const result = calculateBusinessDayResult(orderResultsRef.current, BUSINESS_DAY_DURATION);
    setBusinessDayResult(result);

    const leaderboard = getBusinessDayLeaderboard();
    const bestScore = leaderboard.length > 0 ? leaderboard[0].totalIncome : 0;
    if (result.totalIncome > bestScore && result.totalIncome > 0) {
      setIsNewRecord(true);
    }

    saveBusinessDayScore({
      totalIncome: result.totalIncome,
      date: result.date,
      totalOrders: result.totalOrders,
      failedOrders: result.failedOrders,
    });
  }, [phase, getBusinessDayLeaderboard, saveBusinessDayScore]);

  useEffect(() => {
    if (!gameContainerRef.current || phase === 'intro') return;

    if (gameRef.current) return;

    const logicalWidth = 800;
    const logicalHeight = 600;

    const firstOrder = customerQueue[0];
    if (!firstOrder) return;

    const sceneConfig = {
      order: firstOrder,
      onScoreUpdate: (score: GameScore) => setScoreEstimate(score),
      onTimeUpdate: (time: number) => setTimeRemaining(time),
      onPressureUpdate: (p: number) => setPressure(p),
      onPatienceUpdate: (p: number) => setPatience(p),
      onOrderEnd: (score: GameScore, drawnPaths: DrawnPoint[][]) => processOrderEnd(score, drawnPaths),
      onOrderTransition: () => {},
    };

    const challengeSceneInstance = new ChallengeScene();
    (challengeSceneInstance as any).initData = sceneConfig;

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
      game.scene.add('ChallengeScene', challengeSceneInstance, true, sceneConfig);
      sceneRef.current = challengeSceneInstance;
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
  }, [phase, customerQueue, processOrderEnd]);

  const handleFinish = () => {
    if (sceneRef.current) {
      sceneRef.current.forceEndOrder();
    }
  };

  const handleReplay = () => {
    if (businessDayTimerRef.current) {
      clearInterval(businessDayTimerRef.current);
      businessDayTimerRef.current = null;
    }
    if (gameRef.current) {
      gameRef.current.destroy(true);
      gameRef.current = null;
    }
    sceneRef.current = null;
    setPhase('intro');
    setBusinessDayResult(null);
    setIsNewRecord(false);
    setScoreEstimate({ completion: 0, satisfaction: 0, totalScore: 0, stars: 0 });
    setPressure(0.5);
  };

  const handleHome = () => {
    if (businessDayTimerRef.current) {
      clearInterval(businessDayTimerRef.current);
      businessDayTimerRef.current = null;
    }
    navigate('/');
  };

  const handlePracticeWeakness = (patternType: string) => {
    navigate(`/practice/${patternType}`);
  };

  if (phase === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-pink-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-10 left-10 text-5xl opacity-20">🏪</div>
        <div className="absolute top-20 right-20 text-4xl opacity-20">💰</div>
        <div className="absolute bottom-20 left-20 text-4xl opacity-20">🧁</div>
        <div className="absolute bottom-10 right-10 text-5xl opacity-20">⏰</div>

        <div className="relative z-10 text-center mb-8">
          <div className="text-8xl mb-4">🏪</div>
          <h1 className="text-4xl font-bold text-orange-600 mb-2 drop-shadow-lg" style={{ fontFamily: 'cursive' }}>
            营业日挑战
          </h1>
          <p className="text-lg text-orange-700 font-medium">
            在限定时间内连续服务多位顾客，赚取更多小费！
          </p>
        </div>

        <div className="relative z-10 bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border-4 border-orange-200 max-w-lg w-full">
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-3 bg-orange-50 rounded-xl p-3 border border-orange-200">
              <span className="text-2xl">⏰</span>
              <div>
                <p className="font-bold text-orange-800">营业时间</p>
                <p className="text-sm text-orange-600">{BUSINESS_DAY_DURATION / 60} 分钟</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-pink-50 rounded-xl p-3 border border-pink-200">
              <span className="text-2xl">👥</span>
              <div>
                <p className="font-bold text-pink-800">顾客数量</p>
                <p className="text-sm text-pink-600">{BUSINESS_DAY_CUSTOMER_COUNT} 位</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-yellow-50 rounded-xl p-3 border border-yellow-200">
              <span className="text-2xl">💰</span>
              <div>
                <p className="font-bold text-yellow-800">评分标准</p>
                <p className="text-sm text-yellow-600">耐心值、速度、准确度、力度稳定性、偏好匹配</p>
              </div>
            </div>
          </div>

          <button
            onClick={startBusinessDay}
            className="w-full bg-gradient-to-r from-orange-400 to-pink-400 hover:from-orange-500 hover:to-pink-500 text-white font-bold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-lg"
          >
            🏪 开始营业
          </button>
          <button
            onClick={handleHome}
            className="w-full mt-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-6 rounded-2xl transition-all"
          >
            返回主菜单
          </button>
        </div>
      </div>
    );
  }

  const currentOrder = customerQueue[currentOrderIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-pink-50 p-2 md:p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-3 md:gap-4 items-start">
          <div className="flex-1 w-full">
            <div
              ref={gameContainerRef}
              className="relative bg-white rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden border-4 border-orange-200 w-full"
              style={{ aspectRatio: '4/3', maxWidth: '800px' }}
            />
            <div className="mt-3 text-center text-sm text-orange-700 bg-white/70 rounded-xl py-2 px-4">
              🎮 按住鼠标左键裱花，滚轮调节力度 | 营业时间结束自动结算
            </div>
          </div>

          <div className="w-full lg:w-72 flex-shrink-0">
            {currentOrder && phase === 'playing' && (
              <CustomerOrderCard
                order={currentOrder}
                orderIndex={currentOrderIndex}
                totalOrders={customerQueue.length}
                timeRemaining={timeRemaining}
                pressure={pressure}
                completion={scoreEstimate.completion}
                satisfaction={scoreEstimate.satisfaction}
                patience={patience}
                businessDayTimeRemaining={businessDayTimeRemaining}
                onFinish={handleFinish}
              />
            )}
            {phase === 'transition' && (
              <div className="bg-white/90 backdrop-blur rounded-2xl p-6 shadow-lg border-2 border-orange-200 text-center">
                <div className="text-4xl mb-3 animate-bounce">🔄</div>
                <p className="font-bold text-orange-700 mb-2">下一位顾客即将到来...</p>
                <p className="text-sm text-gray-600">
                  剩余营业时间: {Math.floor(businessDayTimeRemaining / 60)}:{String(businessDayTimeRemaining % 60).padStart(2, '0')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {phase === 'summary' && businessDayResult && (
        <BusinessDaySummary
          result={businessDayResult}
          leaderboard={getBusinessDayLeaderboard()}
          isNewRecord={isNewRecord}
          onReplay={handleReplay}
          onHome={handleHome}
          onPracticeWeakness={handlePracticeWeakness}
        />
      )}
    </div>
  );
};

export default BusinessDay;
