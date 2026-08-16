/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Color } from './color';
import { Constants } from './constants';
import { Logger } from './Logger';
import { Point } from './Point';

export interface DrawConfig {
  color: Color;
  scale: number;
  offset: Point;
  canvas: HTMLCanvasElement;
  width: number;
  solid: boolean;
}

export const getDrawConfig = (
  color: Color,
  width: number,
  offset: Point = new Point(0, 0)
): DrawConfig => {
  return {
    color: color,
    canvas: getCanvas(),
    scale: getScale(),
    offset: offset,
    width: width,
    solid: true,
  };
};

export const getCanvas = () => document.getElementById('main-canvas')! as HTMLCanvasElement;
export const getContext = () => getCanvas()?.getContext('2d');
export const getScale = () => getCanvas().width / Constants.range;
export const cartesianAdjust = (pt: Point): Point => {
  const scale = getScale();
  const adjustedX = (-getCanvas().width / 2 + pt.x) / scale;
  const adjustedY = (getCanvas().height / 2 - pt.y) / scale;
  return new Point(adjustedX, adjustedY);
};

export const drawPoint = (
  x: number, // note, screen coords
  y: number,
  color: Color,
  transparent: boolean = false,
  radius: number = 2,
  lineWidth: number = 1
) => {
  const ctx = getContext();
  if (!ctx) {
    Logger.warn('No drawing context');
    return;
  }
  ctx.strokeStyle = color;
  ctx.fillStyle = transparent ? Color.transparent : color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();
};

export const drawControlPoint = (x: number, y: number) => {
  drawPoint(x, y, Color.blue, true, 5, 2);
};

export const drawJoinPoint = (x: number, y: number) => {
  drawPoint(x, y, Color.black, false, 3, 2);
};

export const drawEndPoint = (x: number, y: number) => {
  drawPoint(x, y, Color.black, true, 3, 2);
};

export const drawLine = (p1: Point, p2: Point, config: DrawConfig) => {
  const ctx = getContext();
  if (!ctx) {
    Logger.warn('No drawing context');
    return;
  }
  ctx.strokeStyle = config.color;
  ctx.lineWidth = config.width;
  if (!config.solid) {
    ctx.setLineDash([5, 10]);
  } else {
    ctx.setLineDash([]);
  }
  ctx.beginPath();
  ctx.moveTo(
    (p1.x + config.offset.x) * config.scale + getCanvas().width / 2 + config.offset.x,
    (-p1.y - config.offset.y) * config.scale + getCanvas().height / 2 + config.offset.y
  );
  ctx.lineTo(
    (p2.x + config.offset.x) * config.scale + getCanvas().width / 2 + config.offset.x,
    (-p2.y - config.offset.y) * config.scale + getCanvas().height / 2 + config.offset.y
  );
  ctx.stroke();
};

export const drawGridPoint = (x: number, y: number) => {
  drawPoint(x, y, Color.black, true, 0.25);
};

export const drawCurvePointCartSegments = (points: Point[], config: DrawConfig) => {
  for (let i = 0; i < points.length - 1; i++) {
    drawLine(points[i], points[i + 1], config);
  }
};

export const drawGridAndAxes = () => {
  const scale = getScale();
  for (let idx = -getCanvas().width / 2; idx <= getCanvas().width; idx += scale) {
    for (let idy = -getCanvas().height / 2; idy < getCanvas().height; idy += scale) {
      drawGridPoint(idx, idy);
    }
  }
  drawCurvePointCartSegments(
    [new Point(0, -100), new Point(0, 100)],
    getDrawConfig(Color.black, 1)
  );
  drawCurvePointCartSegments(
    [new Point(-100, 0), new Point(100, 0)],
    getDrawConfig(Color.black, 1)
  );
};

export const drawControlPointConnectionLines = (points: Point[], config: DrawConfig) => {
  config.color = Color.blue;
  config.width = 1.0;

  // Draw blue dashed lines between non-join control points
  const length = points.length;
  drawCurvePointCartSegments([points[0], points[1]], config);
  drawCurvePointCartSegments([points[1], points[2]], config);
  drawCurvePointCartSegments([points[length - 3], points[length - 2]], config);
  drawCurvePointCartSegments([points[length - 2], points[length - 1]], config);
  for (let startIndex = 4; startIndex < points.length - 4; startIndex += 3) {
    const pts = [points[startIndex], points[startIndex + 1]];
    drawCurvePointCartSegments(pts, config);
  }

  // Draw black dashed line between join control points
  config.color = Color.black;
  config.width = 1.0;
  for (let startIndex = 2; startIndex < points.length - 4; startIndex += 3) {
    const pts = [points[startIndex], points[startIndex + 2]];
    drawCurvePointCartSegments(pts, config);
  }
};

export const drawControlPoints = (scale: number, points: Point[], canvas: HTMLCanvasElement) => {
  points.forEach((p: Point, index: number) => {
    if (index === 0 || index === points.length - 1) {
      drawEndPoint(canvas.width / 2 + p.x * scale, canvas.height / 2 - p.y * scale);
    } else if (index % 3 === 0) {
      drawEndPoint(canvas.width / 2 + p.x * scale, canvas.height / 2 - p.y * scale);
    } else {
      drawControlPoint(canvas.width / 2 + p.x * scale, canvas.height / 2 - p.y * scale);
    }
  });
};
