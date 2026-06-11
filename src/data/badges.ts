import { BadgeDef, SkillProfile } from '@/types/skill';

export const BADGES: BadgeDef[] = [
  {
    id: 'rose_master',
    name: '玫瑰大师',
    icon: '🌹',
    description: '玫瑰花练习累计达到30次',
    category: 'pattern',
  },
  {
    id: 'leaf_expert',
    name: '叶片专家',
    icon: '🍃',
    description: '叶子练习累计达到30次',
    category: 'pattern',
  },
  {
    id: 'shell_master',
    name: '贝壳边达人',
    icon: '🐚',
    description: '贝壳边练习累计达到30次',
    category: 'pattern',
  },
  {
    id: 'writing_ace',
    name: '写字能手',
    icon: '✍️',
    description: '写字练习累计达到30次',
    category: 'pattern',
  },
  {
    id: 'steady_pressure',
    name: '稳定力度',
    icon: '💪',
    description: '力度稳定性平均达到80以上',
    category: 'skill',
  },
  {
    id: 'speed_demon',
    name: '极速交付',
    icon: '⚡',
    description: '速度稳定性平均达到80以上',
    category: 'skill',
  },
  {
    id: 'high_satisfaction_day',
    name: '高满意营业日',
    icon: '💰',
    description: '营业日平均满意度达到75以上',
    category: 'business',
  },
  {
    id: 'consecutive_practice',
    name: '连续练习',
    icon: '🔥',
    description: '连续成功完成10次关卡或练习',
    category: 'skill',
  },
  {
    id: 'free_creator',
    name: '自由创作家',
    icon: '🎨',
    description: '保存5幅自由创作作品',
    category: 'creation',
  },
  {
    id: 'all_round_piper',
    name: '全能裱花师',
    icon: '⭐',
    description: '四种花型练习都达到70分以上',
    category: 'achievement',
  },
  {
    id: 'hundred_orders',
    name: '百单达人',
    icon: '🏆',
    description: '累计完成100个订单',
    category: 'business',
  },
  {
    id: 'perfectionist',
    name: '完美主义',
    icon: '💎',
    description: '在任意关卡获得3星评价',
    category: 'achievement',
  },
  {
    id: 'diligent_learner',
    name: '勤学苦练',
    icon: '🎖️',
    description: '专项练习累计达到50次',
    category: 'skill',
  },
  {
    id: 'business_star',
    name: '营业之星',
    icon: '📈',
    description: '营业日单日收入超过500',
    category: 'business',
  },
];

export const checkBadgeUnlock = (badgeId: string, profile: SkillProfile): boolean => {
  const ms = profile.modeStats;
  const ps = profile.patternStats;

  const avgPressureStability = (mode: 'level' | 'practice' | 'businessDay') => {
    const s = ms[mode];
    return s.completionCount > 0 ? s.totalPressureQuality / s.completionCount : 0;
  };

  const avgSpeedQuality = (mode: 'level' | 'practice' | 'businessDay') => {
    const s = ms[mode];
    return s.completionCount > 0 ? s.totalSpeedQuality / s.completionCount : 0;
  };

  switch (badgeId) {
    case 'rose_master':
      return ps.rose.totalPractice >= 30;
    case 'leaf_expert':
      return ps.leaf.totalPractice >= 30;
    case 'shell_master':
      return ps.shell.totalPractice >= 30;
    case 'writing_ace':
      return ps.text.totalPractice >= 30;
    case 'steady_pressure':
      return (
        avgPressureStability('level') >= 80 ||
        avgPressureStability('practice') >= 80 ||
        avgPressureStability('businessDay') >= 80
      );
    case 'speed_demon':
      return (
        avgSpeedQuality('level') >= 80 ||
        avgSpeedQuality('practice') >= 80 ||
        avgSpeedQuality('businessDay') >= 80
      );
    case 'high_satisfaction_day':
      return ms.businessDay.completionCount > 0 &&
        ms.businessDay.totalSatisfaction / ms.businessDay.completionCount >= 75;
    case 'consecutive_practice':
      return (
        ms.level.consecutiveSuccesses >= 10 ||
        ms.practice.consecutiveSuccesses >= 10
      );
    case 'free_creator':
      return ms.freeCreate.artworkCount >= 5;
    case 'all_round_piper':
      return (
        ps.rose.bestScore >= 70 &&
        ps.leaf.bestScore >= 70 &&
        ps.shell.bestScore >= 70 &&
        ps.text.bestScore >= 70
      );
    case 'hundred_orders':
      return (
        ms.level.totalOrders +
        ms.businessDay.totalOrders >= 100
      );
    case 'perfectionist':
      return profile.recentPerformances.some(
        (p) => p.mode === 'level' && p.score >= 92
      );
    case 'diligent_learner':
      return ms.practice.completionCount >= 50;
    case 'business_star':
      return ms.businessDay.highestIncome >= 500;
    default:
      return false;
  }
};

export const checkAllBadges = (profile: SkillProfile): string[] => {
  const newlyUnlocked: string[] = [];
  for (const badge of BADGES) {
    if (!profile.unlockedBadges.includes(badge.id)) {
      if (checkBadgeUnlock(badge.id, profile)) {
        newlyUnlocked.push(badge.id);
      }
    }
  }
  return newlyUnlocked;
};

export const getBadgeDef = (id: string): BadgeDef | undefined => {
  return BADGES.find((b) => b.id === id);
};
