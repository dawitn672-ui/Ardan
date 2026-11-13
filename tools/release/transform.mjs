// X1 (D-027): the de-minifying rewrites applied to the release's core, and the AST normaliser that proves them.
//
// T (rewrite) only ever replaces a statement with statements that do the same thing in the same order:
//   a, b, c;              ->  a; b; c;                    (a statement made of a comma list)
//   return a, b, c;       ->  a; b; return c;
//   a && b;               ->  if (a) b;
//   a || b;   !a || b;    ->  if (!a) b;   if (a) b;
//   a ? b : c;            ->  if (a) b; else c;
//   !0  !1                ->  true  false
// applied at every depth (an if made from `a && (b, c)` gets a block { b; c; }). A single statement that becomes
// several is wrapped in a block; an `if` that would sit alone as another `if`'s branch is wrapped too (no dangling else).
// Every rewrite keeps evaluation order and which expressions run; only a statement's completion value changes, which
// a script never reads.
//
// normalize(ast) strips what formatting may change and the program cannot see: positions, raw spellings of literals
// and template parts, comments, directives' raw text, empty statements in a statement list, and a template literal
// with no ${} (compared by its value).
const LISTS = new Set(['body', 'consequent']);
const isList = (node, key) => Array.isArray(node[key]) && LISTS.has(key) &&
  (node.type === 'Program' || node.type === 'BlockStatement' || node.type === 'StaticBlock' || node.type === 'SwitchCase');
const SLOTS = { IfStatement: ['consequent', 'alternate'], ForStatement: ['body'], ForInStatement: ['body'], ForOfStatement: ['body'],
  WhileStatement: ['body'], DoWhileStatement: ['body'], LabeledStatement: ['body'], WithStatement: ['body'] };

const ES = (expression, from) => ({ type: 'ExpressionStatement', expression, start: from.start, end: from.end });
const block = (body, from) => ({ type: 'BlockStatement', body, start: from.start, end: from.end });
const wrap = (list, from) => (list.length === 1 && list[0].type !== 'IfStatement' ? list[0] : block(list, from));

function toStmts(s) {
  if (s.type === 'ExpressionStatement' && !s.directive) {
    const e = s.expression;
    if (e.type === 'SequenceExpression') return e.expressions.flatMap(x => toStmts(ES(x, x)));
    if (e.type === 'LogicalExpression' && (e.operator === '&&' || e.operator === '||')) {
      let test = e.left;
      if (e.operator === '||') test = test.type === 'UnaryExpression' && test.operator === '!' ? test.argument : { type: 'UnaryExpression', operator: '!', prefix: true, argument: test, start: test.start, end: test.end };
      return [{ type: 'IfStatement', test, consequent: wrap(toStmts(ES(e.right, e.right)), e.right), alternate: null, start: s.start, end: s.end }];
    }
    if (e.type === 'ConditionalExpression')
      return [{ type: 'IfStatement', test: e.test, consequent: wrap(toStmts(ES(e.consequent, e.consequent)), e.consequent),
        alternate: wrap(toStmts(ES(e.alternate, e.alternate)), e.alternate), start: s.start, end: s.end }];
  }
  if (s.type === 'ReturnStatement' && s.argument && s.argument.type === 'SequenceExpression') {
    const xs = s.argument.expressions;
    return [...xs.slice(0, -1).flatMap(x => toStmts(ES(x, x))), { type: 'ReturnStatement', argument: xs[xs.length - 1], start: s.start, end: s.end }];
  }
  return [s];
}

// rewrite in place, depth first; returns the node
export function rewrite(node) {
  if (!node || typeof node !== 'object') return node;
  if (Array.isArray(node)) { node.forEach(rewrite); return node; }
  if (node.type === 'UnaryExpression' && node.operator === '!' && node.argument.type === 'Literal' && (node.argument.value === 0 || node.argument.value === 1) && node.argument.raw !== undefined && typeof node.argument.value === 'number') {
    const v = node.argument.value === 0;
    for (const k of Object.keys(node)) if (k !== 'start' && k !== 'end') delete node[k];
    return Object.assign(node, { type: 'Literal', value: v, raw: String(v) });
  }
  for (const k of Object.keys(node)) {
    if (k === 'start' || k === 'end') continue;
    const v = node[k];
    if (isList(node, k)) {
      // statements are rewritten until nothing changes: an if made from a && b may hold a comma list, and so on
      node[k] = v.flatMap(s => toStmts(s));
      node[k].forEach(rewrite);
    } else if (SLOTS[node.type] && SLOTS[node.type].includes(k) && v) {
      const list = toStmts(v);
      node[k] = list.length === 1 ? list[0] : block(list, v);
      // an `if` with an else whose then-branch is a bare if would bind the else to the inner one
      if (node.type === 'IfStatement' && k === 'consequent' && node.alternate && node[k].type === 'IfStatement') node[k] = block([node[k]], v);
      rewrite(node[k]);
    } else if (v && typeof v === 'object') rewrite(v);
  }
  // a rewritten branch may itself have become a bare if under an if-with-else
  if (node.type === 'IfStatement' && node.alternate && node.consequent.type === 'IfStatement') node.consequent = block([node.consequent], node.consequent);
  return node;
}

const DROP = new Set(['start', 'end', 'loc', 'range', 'raw', 'comments', 'directive', 'extra', 'leadingComments', 'trailingComments']);
export function normalize(node) {
  if (Array.isArray(node)) return node.map(normalize);
  if (!node || typeof node !== 'object') return node;
  if (node.type === 'TemplateLiteral' && node.expressions.length === 0) return { type: 'Literal', value: node.quasis[0].value.cooked };
  if (node.type === 'Literal') {
    if (node.regex) return { type: 'Literal', regex: { pattern: node.regex.pattern, flags: node.regex.flags } };
    if (typeof node.bigint === 'string') return { type: 'Literal', bigint: node.bigint };
    return { type: 'Literal', value: node.value };
  }
  if (node.type === 'TemplateElement') return { type: 'TemplateElement', tail: node.tail, cooked: node.value.cooked };
  const out = {};
  // an empty statement in a statement list does nothing (a formatter drops it); as a loop's body it is kept
  const list = ['Program', 'BlockStatement', 'StaticBlock', 'SwitchCase'].includes(node.type);
  for (const k of Object.keys(node).sort()) if (!DROP.has(k))
    out[k] = normalize(list && Array.isArray(node[k]) ? node[k].filter(s => s.type !== 'EmptyStatement') : node[k]);
  return out;
}

// the first difference between two normalised trees, as a path (or null when they are equal)
export function firstDiff(a, b, at = '$') {
  if (a === b) return null;
  if (typeof a !== typeof b || a === null || b === null || typeof a !== 'object') return `${at}: ${JSON.stringify(a)?.slice(0, 120)} vs ${JSON.stringify(b)?.slice(0, 120)}`;
  if (Array.isArray(a) !== Array.isArray(b)) return `${at}: array vs not`;
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  if (Array.isArray(a) && a.length !== b.length) {
    for (let i = 0; i < Math.min(a.length, b.length); i++) { const d = firstDiff(a[i], b[i], `${at}[${i}]`); if (d) return d; }
    return `${at}: length ${a.length} vs ${b.length}`;
  }
  for (const k of keys) { const d = firstDiff(a[k], b[k], `${at}.${k}`); if (d) return d; }
  return null;
}
