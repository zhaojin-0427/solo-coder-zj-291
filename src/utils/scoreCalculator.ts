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

export const calculateScore = (
  patterns: Pattern[],
  drawnPaths: DrawnPoint[][],
  timeRemaining: number,
  timeLimit: number
): GameScore => {
  if (drawnPaths.length === 0 || drawnPaths.every((p) => p.length < 2)) {
    return { completion: 0, satisfaction: 0, totalScore: 0, stars: 0 };
  }

  let totalPatternLength = 0;
  let coveredLength = 0;
  let thicknessScore = 0;
  let speedPenalty = 0;
  let sampleCount = 0;

  patterns.forEach((pattern) => {
    const patternPoints = pattern.points;
    for (let i = 0; i < patternPoints.length - 1; i++) {
      totalPatternLength += distance(patternPoints[i], patternPoints[i + 1]);
    }

    const tolerance = 25 + pattern.requiredThickness;
    patternPoints.forEach((pt) => {
      let minDist = Infinity;
      drawnPaths.forEach((path) => {
        const d = pointToPathDistance(pt, path);
        if (d < minDist) minDist = d;
      });
      if (minDist <= tolerance) {
        coveredLength += 1;
      }
    });
  });

  drawnPaths.forEach((path) => {
    for (let i = 1; i < path.length; i++) {
      const prev = path[i - 1];
      const curr = path[i];
      const thicknessDiff = Math.abs(curr.thickness - (patterns[0]?.requiredThickness || 6));
      thicknessScore += Math.max(0, 1 - thicknessDiff / 10);

      const moveDist = distance(prev, curr);
      const timeDiff = curr.timestamp - prev.timestamp;
      if (timeDiff > 0) {
        const speed = moveDist / (timeDiff / 16.67);
        if (speed > 8) speedPenalty += (speed - 8) * 0.5;
        if (speed < 0.5) speedPenalty += (0.5 - speed) * 2;
      }
      sampleCount++;
    }
  });

  const patternCoverage = totalPatternLength > 0 ? Math.min(1, coveredLength / patterns.length / 30) : 0;
  const avgThicknessScore = sampleCount > 0 ? thicknessScore / sampleCount : 0;
  const speedQuality = Math.max(0, 1 - speedPenalty / Math.max(1, sampleCount) / 5);

  const completion = Math.round(patternCoverage * 100);
  const satisfaction = Math.round((avgThicknessScore * 0.4 + speedQuality * 0.3 + patternCoverage * 0.3) * 100);

  const timeBonus = timeLimit > 0 ? (timeRemaining / timeLimit) * 0.1 : 0;
  const rawScore = (completion * 0.5 + satisfaction * 0.5) * (1 + timeBonus);
  const totalScore = Math.min(100, Math.round(rawScore));

  let stars = 0;
  if (totalScore >= 90) stars = 3;
  else if (totalScore >= 70) stars = 2;
  else if (totalScore >= 50) stars = 1;

  return {
    completion: Math.max(0, Math.min(100, completion)),
    satisfaction: Math.max(0, Math.min(100, satisfaction)),
    totalScore: Math.max(0, Math.min(100, totalScore)),
    stars,
  };
};
