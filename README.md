## Send-A-Spline 2

Copyright 2026 Steven Mycynek

version: 000133

# A simple Bezier spline app

After a few other experiments leading up to this, https://stevenvictor.net/curvebox , https://stevenvictor.net/splinebox , and https://stevenvictor.net/bezierbox , I finally have a Bezier spline implementation I'm happy with. This app supports joined cubic beziers with basic G1 continuity. You can also paste or text a URL
with the spline control points encoded into a query string for sharing on social media. There are plenty of libraries that will do something similar, but I wanted to create something from scratch and do all the math from the ground up.

## Installation

```bash
// Set up and debug

bun install
bun run dev


// Code styling

bun run lint
bun run format

// Deployment

bun run build
deploy.sh
```

## Other notes

# Live demo

https://stevenvictor.net/send-a-spline-2
