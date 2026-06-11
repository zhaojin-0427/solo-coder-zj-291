import { Point, Pattern, DrawnPoint, GameScore } from '@/types/game';

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
