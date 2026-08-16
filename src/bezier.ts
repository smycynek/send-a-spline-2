import memoize from 'memoize';
import { Point } from './Point';
import { cartesianAdjust } from './drawUtil';
import { Logger } from './Logger';
import { Triple } from './Triple';

function factorial(n: number): number {
  if (n === 0 || n === 1) {
    return 1;
  }
  return factorial(n - 1) * n;
}
const memFactorial = memoize(factorial);

function createSplineBezierManualArray(controlPoints: Point[]): Point[] {
  // This creates a single high-degree bezier (5,6,7 degree, etc).

  // This is a parametric function with an input t (time) and
  // control points from the user that yields an x/y point.
  // (Pretty basic stuff for spline experts, but still documenting for my own
  // edification.)

  if (controlPoints.length < 4 || controlPoints.length % 2 !== 0) {
    return [];
  }

  const evaluateAtT = (t: number, points: Point[]): Point => {
    const degree = points.length - 1;
    let x = 0;
    let y = 0;
    for (let currentDegree = 0; currentDegree <= degree; currentDegree++) {
      // 1 3 3 1 for 4 point cubic
      const coefficient =
        memFactorial(degree) / (memFactorial(currentDegree) * memFactorial(degree - currentDegree));
      x +=
        coefficient *
        Math.pow(1 - t, degree - currentDegree) *
        Math.pow(t, currentDegree) *
        points[currentDegree].x;
      y +=
        coefficient *
        Math.pow(1 - t, degree - currentDegree) *
        Math.pow(t, currentDegree) *
        points[currentDegree].y;
    }
    return new Point(x, y);
  };

  // A continuous set of evaluations at t from values 0 to 1 yield a the curve.
  const bezierPoints: Point[] = [];
  for (let t = 0; t <= 1; t += 0.01) {
    bezierPoints.push(evaluateAtT(t, controlPoints));
  }

  return bezierPoints;
}

///
/// Create groups of four points with the last point of each group
/// is also the start point of the next group
export function createCompositeSplineBezier(controlPoints: Point[]): Point[] {
  const size = 4;
  const groups: Point[][] = [];
  const spline: Point[] = [];

  for (let ii = 0; ii < controlPoints.length; ii += 3) {
    const group = controlPoints.slice(ii, ii + size);
    if (group.length < 4) {
      // We constrain the point list to multiples of 4 for now, but this
      // is just a safeguard
      break;
    }
    groups.push(group);
  }

  /// Create a set of evaluated points from each group and add to one collection.
  for (const group of groups) {
    const ptemp = createSplineBezierManualArray(group);
    spline.push(...ptemp);
  }
  return spline;
}

// When the user selects a point, it might be a join point or one of the points directly before or after it.
// This there are corner cases for selections near the beginning or end of the spline, but we want to figure out
// which join index is closest to the uer's selection.
export const getTargetJoinIndex = (points: Point[], pointIndex: number): number => {
  const pointCount = points.length;

  if (pointCount <= 4) {
    return -1;
  } else if (pointCount <= 7) {
    return 0;
  }
  // e.g, for 10 points, you have 2 join indicies, so indicies 0 and 1;
  const maxJoinIndex = Math.floor((pointCount - 7) / 3);

  // which join bucket does the selection range fall into?
  const selectedJoinIndex = Math.floor((pointIndex - 2) / 3);

  // Keep in mind that there is no join at the end of the spline, so use the lesser of selected and max.
  return Math.min(selectedJoinIndex, maxJoinIndex);
};

// Decide if a given point move might require an adjustment to maintain colinear points.
export const needsAdjustment = (targetJoinIndex: number, pointIndex: number): boolean => {
  if (targetJoinIndex < 0) {
    return false;
  }
  const base = [2, 3, 4];
  const joinPointIndicies = base.map((i) => i + 3 * targetJoinIndex);
  return joinPointIndicies.includes(pointIndex);
};

export const adjustJoin = (
  targetJoinIndex: number,
  currentPoint: Point,
  pointIndex: number,
  pointList: Point[]
): Point[] => {
  const startIndex = 2 + targetJoinIndex * 3;
  const middleIndex = startIndex + 1;
  const endIndex = startIndex + 2;

  // To maintain G1 continuity,
  // we need the join-point and the points before and after it to be colinear and equidistant from
  // the (center) join point.  Also, the join point acts like a pivot and does not move if the
  // 'before' or 'after' points are moved.  If the join point is moved, the 'before' and 'after' points
  // move with i.
  if (pointIndex === startIndex) {
    Logger.trace(`Adjusting first joint point. ${pointIndex}`);
    pointList[startIndex] = cartesianAdjust(currentPoint);
    const pStart = pointList[startIndex];
    const pMiddle = pointList[middleIndex];
    let pEnd = pointList[endIndex];
    pEnd = pMiddle.add(pMiddle.subtract(pStart as Triple)) as Point;
    pointList[endIndex] = pEnd;
  }

  if (pointIndex === middleIndex) {
    Logger.trace(`Adjusting middle joint point. ${pointIndex}`);
    let pStart = pointList[startIndex];
    const pMiddle = pointList[middleIndex];
    let pEnd = pointList[endIndex];
    const newPMiddle = cartesianAdjust(currentPoint);
    const deltaMiddle = newPMiddle.subtract(pMiddle as Triple) as Point;
    pStart = pStart.add(deltaMiddle) as Point;
    pointList[startIndex] = pStart;
    pEnd = pMiddle.add(pMiddle.subtract(pStart as Triple)) as Point;
    pointList[endIndex] = pEnd;
  }

  if (pointIndex === endIndex) {
    Logger.trace(`Adjusting last joint point. ${pointIndex}`);
    let pStart = pointList[startIndex];
    const pMiddle = pointList[middleIndex];
    pointList[endIndex] = cartesianAdjust(currentPoint);
    const pEnd = pointList[endIndex];
    pStart = pMiddle.scale(2).subtract(pEnd as Triple) as Point;
    pointList[startIndex] = pStart;
  }

  return pointList;
};
