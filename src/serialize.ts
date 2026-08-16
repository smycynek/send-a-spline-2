import { Logger } from './Logger';
import { Point } from './Point';

// A few functions to render the spline points as JSON, compress that JSON text, and base-64 encode it
// (and reverse the process to decode).  The result is a url query-string-safe encoding of a spline.
// It is probably possible to compress this more effectively with a more compact native format, but I
// wanted something simple.

export async function compressToBase64(text: string): Promise<string> {
  const byteArray = new TextEncoder().encode(text);
  const stream = new CompressionStream('gzip');
  const writer = stream.writable.getWriter();
  writer.write(byteArray);
  writer.close();
  const compressedBuffer = await new Response(stream.readable).arrayBuffer();
  Logger.info('CompressToBase64');
  return btoa(String.fromCharCode(...new Uint8Array(compressedBuffer)));
}

export async function base64ToUncompressed(text: string): Promise<string> {
  const compressedBytes = Uint8Array.from(atob(text), (char) => char.charCodeAt(0));
  const stream = new DecompressionStream('gzip');
  const writer = stream.writable.getWriter();
  writer.write(compressedBytes);
  writer.close();
  const decompressedBuffer = await new Response(stream.readable).arrayBuffer();
  Logger.info('base64Uncompress');
  return new TextDecoder().decode(decompressedBuffer);
}

export function getDataAsJSON(points: Point[], compact: boolean = true): string {
  if (compact) {
    return JSON.stringify(points, null, 0);
  } else {
    return JSON.stringify(points, null, 2);
  }
}

function getPointsFromJSON(data: string): Point[] {
  const ptObj: Point[] = JSON.parse(data);
  const points: Point[] = [];
  ptObj.forEach((p) => {
    points.push(new Point(p.x, p.y, p.z));
  });
  return points;
}

const localStorageKey = 'multiCubicPointData_v11';

export async function saveData(points: Point[]) {
  const data = getDataAsJSON(points, true);
  const bData = await compressToBase64(data);
  try {
    localStorage.setItem(localStorageKey, bData);
    Logger.info('Save to local storage');
  } catch (e) {
    Logger.warn('Cannot save data ' + e);
  }
}

export async function loadDataFromQueryString(queryString: string): Promise<Point[]> {
  const sData = queryString.substring(6);
  if (!sData) {
    return [];
  }
  Logger.info(`Query string: ${queryString}`);
  const uncompressed = await base64ToUncompressed(sData);
  return getPointsFromJSON(uncompressed);
}
export async function saveDataToQueryString(points: Point[]): Promise<string> {
  Logger.info('Get compressed data');
  return compressToBase64(getDataAsJSON(points, true));
}

export async function loadData(): Promise<Point[]> {
  try {
    const sData = localStorage.getItem(localStorageKey);
    if (!sData) {
      return [];
    }
    const uncompressed = await base64ToUncompressed(sData);
    Logger.info('Load data');
    return getPointsFromJSON(uncompressed);
  } catch (e) {
    Logger.warn('Cannot load data ' + e);
    return [];
  }
}
