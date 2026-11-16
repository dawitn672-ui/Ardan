// What a built page reports as an error, in one place for the tests, the benches, the soak and the coherency run (round 2
// A3a, CRITIQUE Q1). Features catch their own faults and report them with console.error (1,100 try blocks in the core),
// so a tool that watched only uncaught errors ('pageerror') never saw them: seed 7's N.regrant threw three times in
// 1159 and only console.error knew. Every tool now counts both, and fails on either.
//
//   import { watchPage } from '../lib/page-errors.mjs';
//   const errs = []; watchPage(page, errs);            // pushes 'pageerror: ...' and 'console.error: ...' strings
//   watchPage(page, errs, { allow: [/expected/] });     // a test that provokes an error on purpose names it
//
// ALLOW is the allowlist for the whole project: messages that are not faults of the game. Keep it narrow; every entry
// says why it cannot be fixed instead. A test that provokes an error on purpose (a corrupt save, a blocked script)
// passes its own pattern with `allow`, or calls `expectError(rx)` from tests/run.mjs, rather than growing this list.
export const ALLOW = [
  // The security tests inject markup the page's Content-Security-Policy must refuse; Chromium reports each refusal as a
  // console error. These markers are the tests' own probes (tests/suites/core.test.mjs), never the game's code.
  { rx: /^(?=[\s\S]*Content.Security.Policy)(?=[\s\S]*(__csp|data-pwn|\/x'))/i, why: 'the CSP refusing a security test\'s own probe' },
];

export const allowed = (text, extra = []) => ALLOW.some(a => a.rx.test(text)) || extra.some(rx => rx.test(text));

// counts every uncaught error and every console.error not allowed; `sink` is an array, or a function taking the text
export function watchPage(page, sink, opts = {}) {
  const push = typeof sink === 'function' ? sink : t => sink.push(t);
  const extra = opts.allow || [];
  const max = opts.max || 400;
  page.on('pageerror', e => { const t = String((e && e.stack) || e); if (!allowed(t, extra)) push('pageerror: ' + t.slice(0, max)); });
  page.on('console', m => {
    if (m.type() !== 'error') return;
    const t = m.text();
    if (!allowed(t, extra)) push('console.error: ' + t.slice(0, max));
  });
  return page;
}
