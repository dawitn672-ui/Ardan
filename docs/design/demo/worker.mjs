// renders demo cells off the main thread: receives { i, look, opt }, posts back { i, rgba, W, H, ms }
import { parentPort } from 'node:worker_threads';
import { paint } from '../../../src/ui/engine/paint/portrait.js';
parentPort.on('message', ({ i, look, opt }) => {
  try { const r = paint(look, opt); parentPort.postMessage({ i, rgba: r.rgba, W: r.W, H: r.H, ms: r.ms }, [r.rgba.buffer]); }
  catch (e) { parentPort.postMessage({ i, err: String(e && e.stack || e) }); }
});
