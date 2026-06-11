import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '@/store/gameStore';
import { getExpProgress, getLevelTitle, GameMode } from '@/types/skill';
import { BADGES } from '@/data/badges';
import { ArrowLeft, Award, TrendingUp, BarChart3, Target, Store, Palette, BookOpen } from 'lucide-react';

const RADAR_DIMENSIONS = [
  { key: 'completion', label: '完成度', color: '#3B82F6' },
  { key: 'satisfaction', label: '满意度', color: '#8B5CF6' },
  { key: 'speedQuality', label: '速度稳定', color: '#F59E0B' },
  { key: 'pressureQuality', label: '力度稳定', color: '#10B981' },
  { key: 'accuracy', label: '精确度', color: '#EF4444' },
];

const RadarChart: React.FC<{ values: number[]; size?: number }> = ({ values, size = 220 }) => {
  const center = size / 2;
  const radius = size / 2 - 30;
  const n = RADAR_DIMENSIONS.length;
  const angleStep = (Math.PI * 2) / n;

  const getPoint = (index: number, value: number) => {
    const angle = angleStep * index - Math.PI / 2;
    const r = (value / 100) * radius;
    return {
      x: center + Math.cos(angle) * r,
      y: center + Math.sin(angle) * r,
    };
  };

  const levels = [20, 40, 60, 80, 100];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {levels.map((level) => (
        <polygon
          key={level}
          points={Array.from({ length: n }, (_, i) => {
            const p = getPoint(i, level);
            return `${p.x},${p.y}`;
          }).join(' ')}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth="1"
        />
      ))}

      {Array.from({ length: n }, (_, i) => {
        const p = getPoint(i, 100);
        return (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={p.x}
            y2={p.y}
            stroke="#E5E7EB"
            strokeWidth="1"
          />
        );
      })}

      <polygon
        points={values
          .map((v, i) => {
            const p = getPoint(i, v);
            return `${p.x},${p.y}`;
          })
          .join(' ')}
        fill="rgba(236, 72, 153, 0.2)"
        stroke="#EC4899"
        strokeWidth="2"
      />

      {values.map((v, i) => {
        const p = getPoint(i, v);
        return (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="4"
            fill={RADAR_DIMENSIONS[i].color}
            stroke="white"
            strokeWidth="2"
          />
        );
      })}

      {RADAR_DIMENSIONS.map((dim, i) => {
        const labelP = getPoint(i, 118);
        return (
          <text
            key={dim.key}
            x={labelP.x}
            y={labelP.y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-xs fill-gray-600"
            fontSize="11"
            fontWeight="600"
          >
            {dim.label}
          </text>
        );
      })}
    </svg>
  );
};

const TrendChart: React.FC<{ performances: { timestamp: number; score: number; mode: string }[] }> = ({ performances }) => {
  if (performances.length < 2) {
    return (
      <div className="text-center text-gray-400 py-8 text-sm">
        完成更多关卡后这里将显示你的表现趋势
      </div>
    );
  }

  const width = 400;
  const height = 120;
  const padding = { top: 10, right: 10, bottom: 20, left: 30 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const scores = performances.map((p) => p.score);
  const maxScore = Math.max(...scores, 1);

  const points = performances.map((p, i) => ({
    x: padding.left + (i / Math.max(1, performances.length - 1)) * chartW,
    y: padding.top + chartH - (p.score / maxScore) * chartH,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  const modeColors: Record<string, string> = {
    level: '#3B82F6',
    practice: '#8B5CF6',
    businessDay: '#F59E0B',
    freeCreate: '#EC4899',
  };

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="max-w-md mx-auto">
      <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + chartH} stroke="#E5E7EB" strokeWidth="1" />
      <line x1={padding.left} y1={padding.top + chartH} x2={padding.left + chartW} y2={padding.top + chartH} stroke="#E5E7EB" strokeWidth="1" />

      <path d={linePath} fill="none" stroke="#EC4899" strokeWidth="2" />

      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="3"
          fill={modeColors[performances[i].mode] || '#EC4899'}
          stroke="white"
          strokeWidth="1.5"
        />
      ))}
    </svg>
  );
};

const modeLabels: Record<GameMode, { label: string; icon: React.ReactNode; color: string }> = {
  level: { label: '正式关卡', icon: <BookOpen className="w-4 h-4" />, color: 'blue' },
  practice: { label: '专项练习', icon: <Target className="w-4 h-4" />, color: 'purple' },
  businessDay: { label: '营业日挑战', icon: <Store className="w-4 h-4" />, color: 'orange' },
  freeCreate: { label: '自由创作', icon: <Palette className="w-4 h-4" />, color: 'pink' },
};

const SkillProfile: React.FC = () => {
  const navigate = useNavigate();
  const { getSkillProfile } = useGameStore();
  const profile = getSkillProfile();

  const expProgress = getExpProgress(profile.exp);

  const getModeAvg = (mode: GameMode, field: 'completion' | 'satisfaction' | 'speedQuality' | 'pressureQuality') => {
    const ms = profile.modeStats[mode];
    if (ms.completionCount === 0) return 0;
    const map: Record<string, number> = {
      completion: ms.totalCompletion,
      satisfaction: ms.totalSatisfaction,
      speedQuality: ms.totalSpeedQuality,
      pressureQuality: ms.totalPressureQuality,
    };
    return Math.round(map[field] / ms.completionCount);
  };

  const overallAvg = (field: 'completion' | 'satisfaction' | 'speedQuality' | 'pressureQuality') => {
    let total = 0;
    let count = 0;
    for (const mode of Object.keys(profile.modeStats) as GameMode[]) {
      const ms = profile.modeStats[mode];
      if (ms.completionCount > 0) {
        const map: Record<string, number> = {
          completion: ms.totalCompletion,
          satisfaction: ms.totalSatisfaction,
          speedQuality: ms.totalSpeedQuality,
          pressureQuality: ms.totalPressureQuality,
        };
        total += map[field];
        count += ms.completionCount;
      }
    }
    return count > 0 ? Math.round(total / count) : 0;
  };

  const radarValues = [
    overallAvg('completion'),
    overallAvg('satisfaction'),
    overallAvg('speedQuality'),
    overallAvg('pressureQuality'),
    Math.round(
      (overallAvg('completion') + overallAvg('satisfaction')) / 2
    ),
  ];

  const recentPerformances = profile.recentPerformances
    .filter((p) => p.mode !== 'freeCreate')
    .slice(0, 10);

  const totalOrders = profile.modeStats.level.totalOrders + profile.modeStats.businessDay.totalOrders;
  const totalPractice = profile.modeStats.practice.completionCount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 p-3 md:p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-pink-600 hover:text-pink-700 font-medium bg-white/80 px-4 py-2 rounded-xl shadow-sm hover:shadow transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>返回主菜单</span>
          </button>
          <h1 className="text-2xl md:text-3xl font-bold text-purple-700 flex items-center gap-2">
            <Award className="w-7 h-7" />
            技能档案
          </h1>
          <div className="w-28" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <div className="bg-white/90 backdrop-blur rounded-2xl p-5 shadow-lg border-2 border-purple-200">
            <div className="text-center mb-4">
              <div className="text-5xl mb-2">👩‍🍳</div>
              <h2 className="text-2xl font-bold text-purple-700">
                Lv.{profile.level} {getLevelTitle(profile.level)}
              </h2>
            </div>

            <div className="mb-2">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>经验值</span>
                <span>{expProgress.current} / {expProgress.needed}</span>
              </div>
              <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(2, expProgress.ratio * 100)}%` }}
                />
              </div>
            </div>

            <div className="text-center text-xs text-gray-500">
              总经验: {profile.exp}
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-purple-50 rounded-xl p-3 text-center border border-purple-100">
                <div className="text-2xl font-bold text-purple-600">{totalOrders}</div>
                <div className="text-xs text-gray-600">累计订单</div>
              </div>
              <div className="bg-pink-50 rounded-xl p-3 text-center border border-pink-100">
                <div className="text-2xl font-bold text-pink-600">{totalPractice}</div>
                <div className="text-xs text-gray-600">练习次数</div>
              </div>
              <div className="bg-orange-50 rounded-xl p-3 text-center border border-orange-100">
                <div className="text-2xl font-bold text-orange-600">¥{profile.modeStats.businessDay.highestIncome}</div>
                <div className="text-xs text-gray-600">最高日收入</div>
              </div>
              <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100">
                <div className="text-2xl font-bold text-green-600">{profile.modeStats.freeCreate.artworkCount}</div>
                <div className="text-xs text-gray-600">创作作品</div>
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur rounded-2xl p-5 shadow-lg border-2 border-pink-200">
            <h3 className="font-bold text-pink-700 mb-3 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              五维技能雷达
            </h3>
            <div className="flex justify-center">
              <RadarChart values={radarValues} />
            </div>
            <div className="grid grid-cols-5 gap-1 mt-3">
              {RADAR_DIMENSIONS.map((dim, i) => (
                <div key={dim.key} className="text-center">
                  <div className="text-sm font-bold" style={{ color: dim.color }}>
                    {radarValues[i]}
                  </div>
                  <div className="text-xs text-gray-500">{dim.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur rounded-2xl p-5 shadow-lg border-2 border-orange-200">
            <h3 className="font-bold text-orange-700 mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              最近表现趋势
            </h3>
            <TrendChart performances={recentPerformances.map((p) => ({
              timestamp: p.timestamp,
              score: p.mode === 'businessDay' ? p.satisfaction : p.score,
              mode: p.mode,
            }))} />
            <div className="flex flex-wrap gap-3 mt-2 justify-center">
              {Object.entries(modeLabels).map(([key, ml]) => (
                <div key={key} className="flex items-center gap-1 text-xs text-gray-600">
                  <div className={`w-3 h-3 rounded-full bg-${ml.color}-400`} />
                  {ml.label}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur rounded-2xl p-5 shadow-lg border-2 border-blue-200">
            <h3 className="font-bold text-blue-700 mb-3">📊 各模式详细数据</h3>
            <div className="space-y-3">
              {(Object.entries(modeLabels) as [GameMode, typeof modeLabels.level][]).map(([mode, ml]) => {
                const ms = profile.modeStats[mode];
                return (
                  <div key={mode} className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-2">
                      {ml.icon}
                      <span className="font-medium text-sm text-gray-700">{ml.label}</span>
                    </div>
                    {mode === 'freeCreate' ? (
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-500">作品数: </span>
                          <span className="font-bold text-pink-600">{ms.artworkCount}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-500">订单数: </span>
                          <span className="font-bold text-blue-600">{ms.totalOrders}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">完成次数: </span>
                          <span className="font-bold text-green-600">{ms.completionCount}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">平均完成度: </span>
                          <span className="font-bold text-purple-600">{getModeAvg(mode, 'completion')}%</span>
                        </div>
                        <div>
                          <span className="text-gray-500">平均满意度: </span>
                          <span className="font-bold text-pink-600">{getModeAvg(mode, 'satisfaction')}%</span>
                        </div>
                        <div>
                          <span className="text-gray-500">速度稳定: </span>
                          <span className="font-bold text-yellow-600">{getModeAvg(mode, 'speedQuality')}%</span>
                        </div>
                        <div>
                          <span className="text-gray-500">力度稳定: </span>
                          <span className="font-bold text-emerald-600">{getModeAvg(mode, 'pressureQuality')}%</span>
                        </div>
                        {mode === 'level' || mode === 'practice' ? (
                          <div>
                            <span className="text-gray-500">连续成功: </span>
                            <span className="font-bold text-red-600">{ms.consecutiveSuccesses}</span>
                          </div>
                        ) : mode === 'businessDay' ? (
                          <>
                            <div>
                              <span className="text-gray-500">最高收入: </span>
                              <span className="font-bold text-orange-600">¥{ms.highestIncome}</span>
                            </div>
                          </>
                        ) : null}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-200">
              <h4 className="font-bold text-blue-700 mb-2 text-sm">花型熟练度</h4>
              <div className="grid grid-cols-2 gap-2">
                {(['rose', 'leaf', 'shell', 'text'] as const).map((pt) => {
                  const ps = profile.patternStats[pt];
                  const labels: Record<string, string> = { rose: '🌹 玫瑰', leaf: '🍃 叶片', shell: '🐚 贝壳', text: '✍️ 写字' };
                  return (
                    <div key={pt} className="bg-gray-50 rounded-lg p-2 text-xs">
                      <div className="font-medium text-gray-700 mb-1">{labels[pt]}</div>
                      <div className="text-gray-500">练习: <span className="font-bold text-purple-600">{ps.totalPractice}次</span></div>
                      <div className="text-gray-500">最佳: <span className="font-bold text-pink-600">{ps.bestScore}分</span></div>
                      {ps.totalPractice > 0 && (
                        <div className="text-gray-500">均分: <span className="font-bold text-blue-600">{Math.round(ps.totalScore / ps.totalPractice)}</span></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white/90 backdrop-blur rounded-2xl p-5 shadow-lg border-2 border-yellow-200">
            <h3 className="font-bold text-yellow-700 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5" />
              徽章收藏 ({profile.unlockedBadges.length}/{BADGES.length})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {BADGES.map((badge) => {
                const unlocked = profile.unlockedBadges.includes(badge.id);
                return (
                  <div
                    key={badge.id}
                    className={`rounded-xl p-3 text-center border-2 transition-all ${
                      unlocked
                        ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300 shadow-md'
                        : 'bg-gray-50 border-gray-200 opacity-50'
                    }`}
                  >
                    <div className={`text-3xl mb-1 ${unlocked ? '' : 'grayscale'}`}>
                      {badge.icon}
                    </div>
                    <div className={`text-xs font-bold ${unlocked ? 'text-yellow-700' : 'text-gray-400'}`}>
                      {badge.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 leading-tight">
                      {badge.description}
                    </div>
                    {unlocked && (
                      <div className="text-xs text-green-600 font-bold mt-1">✓ 已解锁</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillProfile;
