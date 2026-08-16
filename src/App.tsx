import { createSignal, onMount, Show, type Component } from 'solid-js';
import styles from './App.module.css';
import { Point } from './Point';
import { Color } from './color';
import { Logger, toggleLog } from './Logger';
import {
  cartesianAdjust,
  drawControlPointConnectionLines,
  drawControlPoints,
  drawCurvePointCartSegments,
  drawGridAndAxes,
  getCanvas,
  getContext,
  getDrawConfig,
  getScale,
} from './drawUtil';
import { getMousePos, getTouchPos, near } from './utility';
import {
  adjustJoin,
  createCompositeSplineBezier,
  getTargetJoinIndex,
  needsAdjustment,
} from './bezier';
import {
  getDataAsJSON,
  loadData,
  loadDataFromQueryString,
  saveData,
  saveDataToQueryString,
} from './serialize';
import { version } from './version';
import { staticHostname } from './config';

const App: Component = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [height, setHeight] = createSignal(0);
  const [showGrid, setShowGrid] = createSignal(true);
  const [pointIndex, setPointIndex] = createSignal(-1);
  const [textLink, setTextLink] = createSignal('');

  const g1 = [new Point(-1, 7), new Point(1, 7), new Point(4, 7)];
  const g2 = [new Point(7, 7), new Point(7, -7), new Point(4, -7)];
  const g3 = [new Point(1, -7), new Point(-1, -7), new Point(-4, -7)];
  const g4 = [new Point(-7, -7), new Point(-7, -3), new Point(-7, -1)];
  const standardPoints = [
    new Point(-7, 1),
    new Point(-7, 3),
    new Point(-7, 7),
    new Point(-4, 7),
    ...g1,
    ...g2,
  ];

  const [hostname] = createSignal(staticHostname);

  const [points, setPoints] = createSignal([...standardPoints]);

  const init = async () => {
    if (getContext()) {
      getContext()?.clearRect(0, 0, getCanvas().width, getCanvas().height);
    }
    const queryString = window.location.search;
    if (queryString) {
      Logger.info(queryString.substring(6));
      const queryStringPoints = await loadDataFromQueryString(queryString);
      Logger.info(`Loaded ${queryStringPoints.length} points`);
      if (queryStringPoints.length >= 4 && queryStringPoints.length <= 16) {
        setPoints(queryStringPoints);
        Logger.info('Loaded from URL');
      } else {
        Logger.info('Loading default');
      }
    } else {
      const savedPoints = await loadData();
      if (savedPoints.length) {
        setPoints(savedPoints);
        Logger.info('Loaded from local storage');
      } else {
        Logger.info('Initial values');
      }
      setTextLink(await getTextUrl());
    }

    resizeCanvas();
    drawGridAndAxes();
    drawAllEntities();
  };

  const resizeCanvas = () => {
    const reducedHeight = window.innerHeight * 0.6;
    const roundedHeight = reducedHeight - (reducedHeight % 50);
    const reducedWidth = window.innerWidth * 0.85;
    const roundedWidth = reducedWidth - (reducedWidth % 50);

    if (roundedWidth > roundedHeight) {
      getCanvas().width = roundedHeight;
      getCanvas().height = roundedHeight;
    } else {
      getCanvas().width = roundedWidth;
      getCanvas().height = roundedWidth;
    }

    setHeight(getCanvas().height);
  };

  const drawAllEntities = () => {
    const ctx = getContext();
    ctx?.clearRect(0, 0, getCanvas().width, getCanvas().height);
    if (showGrid()) {
      drawGridAndAxes();
    }

    const spline = createCompositeSplineBezier(points());

    const config = getDrawConfig(Color.black, 1.0);
    config.solid = false;

    if (showGrid()) {
      drawControlPointConnectionLines(points(), config);
    }

    // Draw actual spline curve
    drawCurvePointCartSegments(spline, getDrawConfig(Color.red, 2.0));

    if (showGrid()) {
      // Draw control points after the curve if enabled
      const scale = getScale();
      drawControlPoints(scale, points(), getCanvas());
    }
  };

  const pointIndexAdjust = (pos: Point) => {
    const pointAdj = cartesianAdjust(pos);
    setPointIndex(-1);
    points().forEach((p: Point, idx: number) => {
      if (near(pointAdj, p) && pointIndex() !== idx) {
        setPointIndex(idx);
      }
    });
    drawAllEntities();
  };

  const moveHandler = (pt: Point) => {
    if (pointIndex() == -1) {
      return;
    }
    let newPoints = [...points()];
    const targetJoinIndex = getTargetJoinIndex(points(), pointIndex()); // which sets of joint points to adjust, 2,3,4, 5,6,7, etc..
    if (needsAdjustment(targetJoinIndex, pointIndex())) {
      newPoints = adjustJoin(targetJoinIndex, pt, pointIndex(), newPoints);
    }
    newPoints[pointIndex()] = cartesianAdjust(pt);
    setPoints(newPoints);
    drawAllEntities();
  };

  const contextMenuHandler = () => {
    //  data.preventDefault();
  };

  const resetButtonHandler = () => {
    setPoints([...standardPoints]);
    saveData(points());
    drawAllEntities();
  };

  // Add pre-defined default curves defined above
  const addButtonHandler = () => {
    const pointCount = points().length;
    if (pointCount < 20) {
      const newPoints = [...points()];

      if (points().length === 4) {
        newPoints.push(...g1);
      } else if (points().length === 7) {
        newPoints.push(...g2);
      }
      if (points().length === 10) {
        newPoints.push(...g3);
      }
      if (points().length === 13) {
        newPoints.push(...g4);
      }

      /* -- if we want the next added segment to be guaranteed colinear.
        const lastPoint = newPoints[newPoints.length - 1];
        const secondLastPoint = newPoints[newPoints.length - 2];
        const delta = lastPoint.subtract(secondLastPoint as Triple) as Point;
        const np1 = lastPoint.add(delta) as Point;
        const np2 = new Point(1, 4) as Point;
        const np3 = new Point(2, -4) as Point;
        newPoints.push(np1, np2, np3);
      */
      setPoints(newPoints);
      saveData(points());
      drawAllEntities();
    }
  };
  const removeButtonHandler = () => {
    if (points().length > 4) {
      const newPoints = [...points()];
      newPoints.splice(newPoints.length - 3, 3);
      setPoints(newPoints);
      saveData(points());
      drawAllEntities();
    }
    Logger.info('Remove button clicked');
    Logger.info('Points length: ' + points().length);
  };

  const showGridButtonHandler = () => {
    setShowGrid(!showGrid());
    drawAllEntities();
  };

  const getTextUrl = async () => {
    const sData = encodeURIComponent(
      `${hostname()}?data=` + (await saveDataToQueryString(points()))
    );
    return `sms:&body=${'Send%20a%20spline%202%21'}%20${sData}`;
  };

  const copyButtonHandler = async () => {
    const sData = `${hostname()}?data=` + (await saveDataToQueryString(points()));
    const type = 'text/plain';
    const clipboardItemData = {
      [type]: sData,
    };
    const clipboardItem = new ClipboardItem(clipboardItemData);
    navigator.clipboard.write([clipboardItem]);
  };

  const copyDataHandler = () => {
    const sData = getDataAsJSON(points(), false);

    const type = 'text/plain';
    const clipboardItemData = {
      [type]: sData,
    };
    const clipboardItem = new ClipboardItem(clipboardItemData);
    navigator.clipboard.write([clipboardItem]);
  };

  const mouseUpHandler = async () => {
    window.history.replaceState({}, '', hostname());
    setPointIndex(-1);
    saveData(points());
    const url = await getTextUrl();
    setTextLink(url);
    Logger.trace(textLink());
  };

  const mouseDownHandler = (data: MouseEvent) => {
    Logger.info('Mouse down');
    const pos = getMousePos(getCanvas(), data);
    pointIndexAdjust(pos);
  };

  const mouseMoveHandler = (data: MouseEvent) => {
    const pt = getMousePos(getCanvas(), data);
    moveHandler(pt);
    Logger.trace(points().length + ' points');
    Logger.trace('Point index: ' + pointIndex() + '  x: ' + pt.x + '  y: ' + pt.y);
  };

  const touchEndHandler = async () => {
    setPointIndex(-1);
    saveData(points());
    const url = await getTextUrl();
    setTextLink(url);
  };

  const touchStartHandler = (data: TouchEvent) => {
    const pos = getTouchPos(getCanvas(), data.touches[0]);
    pointIndexAdjust(pos);
  };

  const touchMoveHandler = (data: TouchEvent) => {
    const pos = getTouchPos(getCanvas(), data.touches[0]);
    if (pos.x > 0 && pos.x < getCanvas().width && pos.y > 0 && pos.y < getCanvas().height) {
      moveHandler(pos);
    }
  };

  onMount(() => {
    init();
  });

  return (
    <div onMouseUp={mouseUpHandler}>
      <header class={styles.header}>
        <h1 title="Toggle Log" onClick={[toggleLog, null]}>
          Send a Spline 2!
        </h1>
        <h2>Electric Boogaloo!</h2>
        <p title="An experiment combining polynomials and social media!">
          Hours of Fun. Drag points. Add and remove a segment with + and - buttons. # button to
          toggle grid and points. Note that endpoints and join points are hollow-black, and control
          points are hollow-blue.
        </p>
      </header>
      <header class={styles.header}>
        <canvas
          title="Drag points here.  Like I said, hours of fun."
          onMouseDown={mouseDownHandler}
          onMouseMove={mouseMoveHandler}
          onTouchStart={touchStartHandler}
          onTouchEnd={touchEndHandler}
          onTouchMove={touchMoveHandler}
          class={styles.pointCanvas}
          onContextMenu={contextMenuHandler}
          id="main-canvas"
        ></canvas>
        <div>
          <div class="label">
            <button
              title="Reset points to default starting positions"
              onClick={resetButtonHandler}
              class="actionButtonWide"
            >
              Reset
            </button>
            <Show when={true}>
              <button
                title="Copy the URL, including the encoded curve point data, to the copy buffer to paste into email, text, etc."
                onClick={copyButtonHandler}
                class="actionButtonWide"
              >
                Copy URL
              </button>
              <button
                title="Copy the plain-text point data to the copy buffer for pasting somewhere else"
                onClick={copyDataHandler}
                class="actionButtonWide"
              >
                Copy data
              </button>
              <a
                title="Send the URL, including the encoded curve point data, to an SMS text message"
                href={textLink()}
                class="button-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                Send text
              </a>
            </Show>
          </div>
          <div class="label">
            <button
              disabled={points().length >= 16}
              class="mini-action"
              title="Add a segment"
              onClick={addButtonHandler}
            >
              +
            </button>

            <button
              disabled={points().length <= 4}
              class="mini-action"
              title="Remove a segment"
              onClick={removeButtonHandler}
            >
              -
            </button>

            <button
              class="mini-action"
              title="Toggle grid and controls"
              onClick={showGridButtonHandler}
            >
              #
            </button>
          </div>
          <div class="label cite">
            <a
              title="More info here. Contact me with questions."
              href="https://github.com/smycynek/send-a-spline-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              https://github.com/smycynek/send-a-spline-2
            </a>
          </div>
          <div title="I keep making small tweaks." class="label narrow cite">
            v {version}
          </div>
        </div>
      </header>
    </div>
  );
};

export default App;
