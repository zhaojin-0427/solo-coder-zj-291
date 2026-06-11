import { Point, Pattern, DrawnPoint, GameScore, TrajectoryReview, ReviewPoint, ReviewPointType, PatternType, PracticeResult, CustomerOrder, OrderResult, BusinessDayResult } from '@/types/game';

const distance = (p1: Point, p2: Point): number => {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
};

const pointToSegmentDistance = (point: Point, segStart: Point, segEnd: Point): number => {
  const dx = segEnd.x - segStart.x;
  const dy = segEnd.y - segStart.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return distance(point, segStart);
  let t = ((point.x - segStart.x) * dx + (point.y - segStart.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return distance(point, {
    x: segStart.x + t * dx,
    y: segStart.y + t * dy,
  });
};

const pointToPathDistance = (point: Point, path: Point[]): number => {
  let minDist = Infinity;
  for (let i = 0; i < path.length - 1; i++) {
    const dist = pointToSegmentDistance(point, path[i], path[i + 1]);
    if (dist < minDist) minDist = dist;
  }
  return minDist;
};

export const findNearestPattern = (
  x: number,
  y: number,
  patterns: Pattern[]
): Pattern | null => {
  if (patterns.length === 0) return null;
  let nearest: Pattern | null = null;
  let minDist = Infinity;
  const pt = { x, y };
  for (const pattern of patterns) {
    const dist = pointToPathDistance(pt, pattern.points);
    if (dist < minDist) {
      minDist = dist;
      nearest = pattern;
    }
  }
  return nearest;
};

export const calculateScore = (
  patterns: Pattern[],
  drawnPaths: DrawnPoint[][],
  timeRemaining: number,
  timeLimit: number
): GameScore => {
  if (drawnPaths.length === 0 || drawnPaths.every((p) => p.length < 2)) {
    return { completion: 0, satisfaction: 0, totalScore: 0, stars: 0 };
  }

  const patternCoverages: number[] = [];
  let totalDrawnLength = 0;
  let thicknessScore = 0;
  let speedPenalty = 0;
  let colorMatchScore = 0;
  let sampleCount = 0;

  patterns.forEach((pattern) => {
    const patternPoints = pattern.points;
    const tolerance = 18 + pattern.requiredThickness;

    let coveredPoints = 0;

    patternPoints.forEach((pt) => {
      let minDist = Infinity;
      drawnPaths.forEach((path) => {
        const d = pointToPathDistance(pt, path);
        if (d < minDist) minDist = d;
      });
      if (minDist <= tolerance) {
        coveredPoints += 1;
      }
    });

    const coverage = patternPoints.length > 0 ? coveredPoints / patternPoints.length : 0;
    patternCoverages.push(coverage);
  });

  const avgPatternCoverage = patternCoverages.length > 0
    ? patternCoverages.reduce((a, b) => a + b, 0) / patternCoverages.length
    : 0;

  const minPatternCoverage = patternCoverages.length > 0 ? Math.min(...patternCoverages) : 0;

  const weightedCoverage = avgPatternCoverage * 0.6 + minPatternCoverage * 0.4;

  drawnPaths.forEach((path) => {
    for (let i = 1; i < path.length; i++) {
      const prev = path[i - 1];
      const curr = path[i];
      totalDrawnLength += distance(prev, curr);

      const nearestPattern = findNearestPattern(curr.x, curr.y, patterns);

      if (nearestPattern) {
        const targetThickness = nearestPattern.requiredThickness || 6;
        const thicknessDiff = Math.abs(curr.thickness - targetThickness);
        thicknessScore += Math.max(0, 1 - thicknessDiff / 8);
        colorMatchScore += 1;
      } else {
        thicknessScore += Math.max(0, 1 - Math.abs(curr.thickness - 6) / 8);
      }

      const moveDist = distance(prev, curr);
      const timeDiff = curr.timestamp - prev.timestamp;
      if (timeDiff > 0) {
        const speed = moveDist / (timeDiff / 16.67);
        if (speed > 6) speedPenalty += (speed - 6) * 0.4;
        if (speed < 0.8) speedPenalty += (0.8 - speed) * 1.5;
      }
      sampleCount++;
    }
  });

  const avgThicknessScore = sampleCount > 0 ? thicknessScore / sampleCount : 0;
  const colorMatchRatio = sampleCount > 0 ? colorMatchScore / sampleCount : 0;
  const speedQuality = Math.max(0, 1 - speedPenalty / Math.max(1, sampleCount) / 3);

  const completion = Math.round(weightedCoverage * 100);

  const satisfactionRaw = (
    avgThicknessScore * 0.35 +
    speedQuality * 0.25 +
    colorMatchRatio * 0.2 +
    weightedCoverage * 0.2
  );
  const satisfaction = Math.round(satisfactionRaw * 100);

  const timeBonusRatio = Math.min(0.15, (timeRemaining / Math.max(1, timeLimit)) * 0.15);
  const rawScore = (completion * 0.55 + satisfaction * 0.45) * (1 + timeBonusRatio);
  const totalScore = Math.min(100, Math.round(rawScore));

  let stars = 0;
  if (totalScore >= 92) stars = 3;
  else if (totalScore >= 75) stars = 2;
  else if (totalScore >= 55) stars = 1;

  return {
    completion: Math.max(0, Math.min(100, completion)),
    satisfaction: Math.max(0, Math.min(100, satisfaction)),
    totalScore: Math.max(0, Math.min(100, totalScore)),
    stars,
  };
};

const DEVIATION_THRESHOLD = 25;
const SPEED_FAST_THRESHOLD = 7;
const SPEED_SLOW_THRESHOLD = 0.8;
const PRESSURE_HIGH_THRESHOLD = 0.8;
const PRESSURE_LOW_THRESHOLD = 0.25;

const reviewPointTypeLabels: Record<ReviewPointType, string> = {
  deviation: '偏离目标区域',
  speed_fast: '速度过快断裂',
  speed_slow: '速度过慢堆积',
  pressure_high: '力度过高',
  pressure_low: '力度过低',
};

export const analyzeTrajectory = (
  patterns: Pattern[],
  drawnPaths: DrawnPoint[][]
): TrajectoryReview => {
  const reviewPoints: ReviewPoint[] = [];
  let deviationCount = 0;
  let speedFastCount = 0;
  let speedSlowCount = 0;
  let pressureHighCount = 0;
  let pressureLowCount = 0;

  const typeErrorCounts: Record<ReviewPointType, number> = {
    deviation: 0,
    speed_fast: 0,
    speed_slow: 0,
    pressure_high: 0,
    pressure_low: 0,
  };

  const patternTypeErrorCounts: Record<PatternType, Record<ReviewPointType, number>> = {
    rose: { deviation: 0, speed_fast: 0, speed_slow: 0, pressure_high: 0, pressure_low: 0 },
    leaf: { deviation: 0, speed_fast: 0, speed_slow: 0, pressure_high: 0, pressure_low: 0 },
    shell: { deviation: 0, speed_fast: 0, speed_slow: 0, pressure_high: 0, pressure_low: 0 },
    text: { deviation: 0, speed_fast: 0, speed_slow: 0, pressure_high: 0, pressure_low: 0 },
  };

  drawnPaths.forEach((path) => {
    for (let i = 1; i < path.length; i++) {
      const prev = path[i - 1];
      const curr = path[i];

      const nearestPattern = findNearestPattern(curr.x, curr.y, patterns);
      if (!nearestPattern) continue;

      const distToPattern = pointToPathDistance(curr, nearestPattern.points);
      const tolerance = DEVIATION_THRESHOLD + nearestPattern.requiredThickness;

      if (distToPattern > tolerance) {
        deviationCount++;
        typeErrorCounts.deviation++;
        patternTypeErrorCounts[nearestPattern.type].deviation++;
        reviewPoints.push({
          x: curr.x,
          y: curr.y,
          type: 'deviation',
          severity: Math.min(1, (distToPattern - tolerance) / tolerance),
          timestamp: curr.timestamp,
        });
      }

      const moveDist = distance(prev, curr);
      const timeDiff = curr.timestamp - prev.timestamp;
      if (timeDiff > 0) {
        const speed = moveDist / (timeDiff / 16.67);
        if (speed > SPEED_FAST_THRESHOLD) {
          speedFastCount++;
          typeErrorCounts.speed_fast++;
          patternTypeErrorCounts[nearestPattern.type].speed_fast++;
          reviewPoints.push({
            x: curr.x,
            y: curr.y,
            type: 'speed_fast',
            severity: Math.min(1, (speed - SPEED_FAST_THRESHOLD) / SPEED_FAST_THRESHOLD),
            timestamp: curr.timestamp,
          });
        } else if (speed < SPEED_SLOW_THRESHOLD && moveDist > 0.5) {
          speedSlowCount++;
          typeErrorCounts.speed_slow++;
          patternTypeErrorCounts[nearestPattern.type].speed_slow++;
          reviewPoints.push({
            x: curr.x,
            y: curr.y,
            type: 'speed_slow',
            severity: Math.min(1, (SPEED_SLOW_THRESHOLD - speed) / SPEED_SLOW_THRESHOLD),
            timestamp: curr.timestamp,
          });
        }
      }

      const thickness = curr.thickness;
      const targetThickness = nearestPattern.requiredThickness;
      const pressureRatio = thickness / (3 + PRESSURE_HIGH_THRESHOLD * 8);

      if (thickness > targetThickness * 1.6) {
        pressureHighCount++;
        typeErrorCounts.pressure_high++;
        patternTypeErrorCounts[nearestPattern.type].pressure_high++;
        reviewPoints.push({
          x: curr.x,
          y: curr.y,
          type: 'pressure_high',
          severity: Math.min(1, (thickness - targetThickness * 1.6) / targetThickness),
          timestamp: curr.timestamp,
        });
      } else if (thickness < targetThickness * 0.4) {
        pressureLowCount++;
        typeErrorCounts.pressure_low++;
        patternTypeErrorCounts[nearestPattern.type].pressure_low++;
        reviewPoints.push({
          x: curr.x,
          y: curr.y,
          type: 'pressure_low',
          severity: Math.min(1, (targetThickness * 0.4 - thickness) / targetThickness),
          timestamp: curr.timestamp,
        });
      }
    }
  });

  let weakestType: ReviewPointType = 'deviation';
  let maxCount = 0;
  for (const [type, count] of Object.entries(typeErrorCounts)) {
    if (count > maxCount) {
      maxCount = count;
      weakestType = type as ReviewPointType;
    }
  }

  let weakestPatternType: PatternType = 'rose';
  let maxPatternErrors = 0;
  for (const [pType, errors] of Object.entries(patternTypeErrorCounts)) {
    const total = Object.values(errors).reduce((a, b) => a + b, 0);
    if (total > maxPatternErrors) {
      maxPatternErrors = total;
      weakestPatternType = pType as PatternType;
    }
  }

  return {
    reviewPoints,
    deviationCount,
    speedFastCount,
    speedSlowCount,
    pressureHighCount,
    pressureLowCount,
    weakestType,
    weakestPatternType,
  };
};

export const calculatePracticeResult = (
  targetPoints: Point[],
  drawnPaths: DrawnPoint[][],
  requiredThickness: number
): PracticeResult => {
  if (drawnPaths.length === 0 || drawnPaths.every((p) => p.length < 2)) {
    return {
      score: 0,
      completion: 0,
      accuracy: 0,
      speedQuality: 0,
      pressureQuality: 0,
      errors: [
        { type: 'deviation', count: 0, description: reviewPointTypeLabels.deviation },
        { type: 'speed_fast', count: 0, description: reviewPointTypeLabels.speed_fast },
        { type: 'speed_slow', count: 0, description: reviewPointTypeLabels.speed_slow },
        { type: 'pressure_high', count: 0, description: reviewPointTypeLabels.pressure_high },
        { type: 'pressure_low', count: 0, description: reviewPointTypeLabels.pressure_low },
      ],
    };
  }

  const tolerance = 18 + requiredThickness;
  let coveredPoints = 0;
  let totalAccuracy = 0;
  let accuracySamples = 0;

  targetPoints.forEach((pt) => {
    let minDist = Infinity;
    drawnPaths.forEach((path) => {
      const d = pointToPathDistance(pt, path);
      if (d < minDist) minDist = d;
    });
    if (minDist <= tolerance) {
      coveredPoints++;
      totalAccuracy += 1 - Math.min(1, minDist / tolerance);
      accuracySamples++;
    }
  });

  const completion = targetPoints.length > 0 ? Math.round((coveredPoints / targetPoints.length) * 100) : 0;
  const accuracy = accuracySamples > 0 ? Math.round((totalAccuracy / accuracySamples) * 100) : 0;

  let speedQualitySum = 0;
  let pressureQualitySum = 0;
  let sampleCount = 0;
  let speedFastCount = 0;
  let speedSlowCount = 0;
  let pressureHighCount = 0;
  let pressureLowCount = 0;
  let deviationCount = 0;

  drawnPaths.forEach((path) => {
    for (let i = 1; i < path.length; i++) {
      const prev = path[i - 1];
      const curr = path[i];
      const moveDist = distance(prev, curr);
      const timeDiff = curr.timestamp - prev.timestamp;

      const distToTarget = pointToPathDistance(curr, targetPoints);
      if (distToTarget > tolerance) {
        deviationCount++;
      }

      if (timeDiff > 0) {
        const speed = moveDist / (timeDiff / 16.67);
        if (speed > SPEED_FAST_THRESHOLD) {
          speedFastCount++;
          speedQualitySum += Math.max(0, 1 - (speed - SPEED_FAST_THRESHOLD) / 5);
        } else if (speed < SPEED_SLOW_THRESHOLD && moveDist > 0.5) {
          speedSlowCount++;
          speedQualitySum += Math.max(0, speed / SPEED_SLOW_THRESHOLD);
        } else {
          speedQualitySum += 1;
        }
      }

      const thicknessDiff = Math.abs(curr.thickness - requiredThickness);
      const maxDiff = requiredThickness * 1.2;
      if (curr.thickness > requiredThickness * 1.6) {
        pressureHighCount++;
        pressureQualitySum += Math.max(0, 1 - (thicknessDiff / maxDiff));
      } else if (curr.thickness < requiredThickness * 0.4) {
        pressureLowCount++;
        pressureQualitySum += Math.max(0, 1 - (thicknessDiff / maxDiff));
      } else {
        pressureQualitySum += Math.max(0, 1 - thicknessDiff / maxDiff);
      }
      sampleCount++;
    }
  });

  const speedQuality = sampleCount > 0 ? Math.round((speedQualitySum / sampleCount) * 100) : 0;
  const pressureQuality = sampleCount > 0 ? Math.round((pressureQualitySum / sampleCount) * 100) : 0;

  const score = Math.min(100, Math.round(
    completion * 0.3 + accuracy * 0.25 + speedQuality * 0.2 + pressureQuality * 0.25
  ));

  return {
    score,
    completion,
    accuracy,
    speedQuality,
    pressureQuality,
    errors: [
      { type: 'deviation', count: deviationCount, description: reviewPointTypeLabels.deviation },
      { type: 'speed_fast', count: speedFastCount, description: reviewPointTypeLabels.speed_fast },
      { type: 'speed_slow', count: speedSlowCount, description: reviewPointTypeLabels.speed_slow },
      { type: 'pressure_high', count: pressureHighCount, description: reviewPointTypeLabels.pressure_high },
      { type: 'pressure_low', count: pressureLowCount, description: reviewPointTypeLabels.pressure_low },
    ],
  };
};

const calculateAccuracy = (
  patterns: Pattern[],
  drawnPaths: DrawnPoint[][]
): number => {
  if (drawnPaths.length === 0 || drawnPaths.every(p => p.length < 2)) return 0;
  const tolerance = 18;
  let totalAccuracy = 0;
  let accuracySamples = 0;

  patterns.forEach(pattern => {
    pattern.points.forEach(pt => {
      let minDist = Infinity;
      drawnPaths.forEach(path => {
        const d = pointToPathDistance(pt, path);
        if (d < minDist) minDist = d;
      });
      if (minDist <= tolerance + pattern.requiredThickness) {
        totalAccuracy += 1 - Math.min(1, minDist / (tolerance + pattern.requiredThickness));
        accuracySamples++;
      }
    });
  });

  return accuracySamples > 0 ? Math.round((totalAccuracy / accuracySamples) * 100) : 0;
};

const calculateSpeedQuality = (drawnPaths: DrawnPoint[][]): number => {
  if (drawnPaths.length === 0) return 0;
  let speedQualitySum = 0;
  let sampleCount = 0;

  drawnPaths.forEach(path => {
    for (let i = 1; i < path.length; i++) {
      const prev = path[i - 1];
      const curr = path[i];
      const moveDist = distance(prev, curr);
      const timeDiff = curr.timestamp - prev.timestamp;
      if (timeDiff > 0) {
        const speed = moveDist / (timeDiff / 16.67);
        if (speed > SPEED_FAST_THRESHOLD) {
          speedQualitySum += Math.max(0, 1 - (speed - SPEED_FAST_THRESHOLD) / 5);
        } else if (speed < SPEED_SLOW_THRESHOLD && moveDist > 0.5) {
          speedQualitySum += Math.max(0, speed / SPEED_SLOW_THRESHOLD);
        } else {
          speedQualitySum += 1;
        }
        sampleCount++;
      }
    }
  });

  return sampleCount > 0 ? Math.round((speedQualitySum / sampleCount) * 100) : 0;
};

const calculatePressureStability = (
  patterns: Pattern[],
  drawnPaths: DrawnPoint[][]
): number => {
  if (drawnPaths.length === 0) return 0;
  let pressureQualitySum = 0;
  let sampleCount = 0;

  drawnPaths.forEach(path => {
    for (let i = 1; i < path.length; i++) {
      const curr = path[i];
      const nearestPattern = findNearestPattern(curr.x, curr.y, patterns);
      const targetThickness = nearestPattern?.requiredThickness || 6;
      const thicknessDiff = Math.abs(curr.thickness - targetThickness);
      const maxDiff = targetThickness * 1.2;
      pressureQualitySum += Math.max(0, 1 - thicknessDiff / maxDiff);
      sampleCount++;
    }
  });

  return sampleCount > 0 ? Math.round((pressureQualitySum / sampleCount) * 100) : 0;
};

const calculatePreferenceMatch = (
  order: CustomerOrder,
  drawnPaths: DrawnPoint[][]
): number => {
  if (drawnPaths.length === 0 || drawnPaths.every(p => p.length < 2)) return 0;

  let colorMatchCount = 0;
  let speedMatchCount = 0;
  let totalPoints = 0;

  drawnPaths.forEach(path => {
    for (let i = 1; i < path.length; i++) {
      const curr = path[i];
      const nearest = findNearestPattern(curr.x, curr.y, order.requiredPatterns);
      if (nearest && nearest.color === order.colorPreference) {
        colorMatchCount++;
      }

      const prev = path[i - 1];
      const moveDist = distance(prev, curr);
      const timeDiff = curr.timestamp - prev.timestamp;
      if (timeDiff > 0) {
        const speed = moveDist / (timeDiff / 16.67);
        if (order.preferredSpeed === 'slow' && speed < 3) speedMatchCount++;
        else if (order.preferredSpeed === 'medium' && speed >= 2 && speed <= 5) speedMatchCount++;
        else if (order.preferredSpeed === 'fast' && speed > 4) speedMatchCount++;
      }
      totalPoints++;
    }
  });

  if (totalPoints === 0) return 0;
  const colorScore = colorMatchCount / totalPoints;
  const speedScore = speedMatchCount / totalPoints;
  return Math.round((colorScore * 0.6 + speedScore * 0.4) * 100);
};

export const calculateOrderResult = (
  order: CustomerOrder,
  score: GameScore,
  drawnPaths: DrawnPoint[][],
  timeUsed: number,
  patienceRemaining: number
): OrderResult => {
  const accuracy = calculateAccuracy(order.requiredPatterns, drawnPaths);
  const speedQuality = calculateSpeedQuality(drawnPaths);
  const pressureStability = calculatePressureStability(order.requiredPatterns, drawnPaths);
  const preferenceMatch = calculatePreferenceMatch(order, drawnPaths);

  const speedBonus = Math.max(0, 1 - timeUsed / order.timeLimit);
  const patienceFactor = patienceRemaining / order.patience;

  const satisfaction = Math.round(
    patienceFactor * 30 +
    speedBonus * 20 +
    (accuracy / 100) * 20 +
    (pressureStability / 100) * 15 +
    (preferenceMatch / 100) * 15
  );

  const failed = satisfaction < 20 || score.completion < 15;

  const tip = failed ? 0 : Math.round(
    order.basePrice *
    (1 + speedBonus * 0.3) *
    (0.5 + (accuracy / 100) * 0.3) *
    (0.7 + (pressureStability / 100) * 0.2) *
    (0.8 + (preferenceMatch / 100) * 0.2) *
    (0.4 + patienceFactor * 0.6)
  );

  const review = drawnPaths.length > 0 && !drawnPaths.every(p => p.length < 2)
    ? analyzeTrajectory(order.requiredPatterns, drawnPaths)
    : null;

  return {
    orderId: order.id,
    customerName: order.customerName,
    customerEmoji: order.customerEmoji,
    score,
    completion: score.completion,
    accuracy,
    speedQuality,
    pressureStability,
    preferenceMatch,
    patienceRemaining: Math.round(patienceRemaining),
    tip: Math.max(0, tip),
    satisfaction: Math.max(0, Math.min(100, satisfaction)),
    timeUsed,
    timeLimit: order.timeLimit,
    failed,
    review,
  };
};

export const calculateBusinessDayResult = (
  orderResults: OrderResult[],
  businessDayTime: number
): BusinessDayResult => {
  const totalIncome = orderResults.reduce((sum, r) => sum + r.tip, 0);
  const averageSatisfaction = orderResults.length > 0
    ? Math.round(orderResults.reduce((sum, r) => sum + r.satisfaction, 0) / orderResults.length)
    : 0;
  const failedOrders = orderResults.filter(r => r.failed).length;

  const bestOrder = orderResults.length > 0
    ? orderResults.reduce((best, curr) => curr.tip > best.tip ? curr : best, orderResults[0])
    : null;

  const skillErrorCounts: Record<ReviewPointType, number> = {
    deviation: 0,
    speed_fast: 0,
    speed_slow: 0,
    pressure_high: 0,
    pressure_low: 0,
  };

  const patternErrorCounts: Record<PatternType, number> = {
    rose: 0,
    leaf: 0,
    shell: 0,
    text: 0,
  };

  orderResults.forEach(result => {
    if (result.review) {
      skillErrorCounts.deviation += result.review.deviationCount;
      skillErrorCounts.speed_fast += result.review.speedFastCount;
      skillErrorCounts.speed_slow += result.review.speedSlowCount;
      skillErrorCounts.pressure_high += result.review.pressureHighCount;
      skillErrorCounts.pressure_low += result.review.pressureLowCount;
      patternErrorCounts[result.review.weakestPatternType]++;
    }
  });

  let weakestSkill: ReviewPointType = 'deviation';
  let maxSkillErrors = 0;
  for (const [skill, count] of Object.entries(skillErrorCounts)) {
    if (count > maxSkillErrors) {
      maxSkillErrors = count;
      weakestSkill = skill as ReviewPointType;
    }
  }

  let weakestPatternType: PatternType = 'rose';
  let maxPatternErrors = 0;
  for (const [pType, count] of Object.entries(patternErrorCounts)) {
    if (count > maxPatternErrors) {
      maxPatternErrors = count;
      weakestPatternType = pType as PatternType;
    }
  }

  return {
    totalIncome,
    averageSatisfaction,
    failedOrders,
    totalOrders: orderResults.length,
    bestOrder,
    weakestSkill,
    weakestPatternType,
    orderResults,
    businessDayTime,
    date: new Date().toISOString().split('T')[0],
  };
};
