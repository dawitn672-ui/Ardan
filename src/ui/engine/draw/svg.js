// The same display list as an SVG string (characters.md §2: for sheets, tests and the share card).
const D = d => {
  let s = '';
  for (let i = 0; i < d.length;) {
    const op = d[i];
    if (op === 0) { s += `M${d[i + 1]} ${d[i + 2]}`; i += 3; }
    else if (op === 1) { s += `L${d[i + 1]} ${d[i + 2]}`; i += 3; }
    else if (op === 2) { s += `C${d.slice(i + 1, i + 7).join(' ')}`; i += 7; }
    else { s += 'Z'; i++; }
  }
  return s;
};
export function svg(list, px, crop = list.crop) {
  const [x, y, w, h] = crop, defs = [], body = [];
  // nested clips: each clipPath is clipped by the one before it
  list.clips.forEach((c, i) => c.forEach((e, j) => defs.push(`<clipPath id="c${i}_${j}"${j ? ` clip-path="url(#c${i}_${j - 1})"` : ''}><path d="${D(e.d)}"${e.r ? ` clip-rule="${e.r}"` : ''}/></clipPath>`)));
  list.items.forEach((it, n) => {
    let fill = it.f;
    if (typeof fill === 'object') {
      defs.push(`<radialGradient id="g${n}" gradientUnits="userSpaceOnUse" cx="${fill.x}" cy="${fill.y}" r="${fill.r}">${fill.s.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('')}</radialGradient>`);
      fill = `url(#g${n})`;
    }
    const clip = it.c !== undefined ? ` clip-path="url(#c${it.c}_${list.clips[it.c].length - 1})"` : '';
    const op = it.a != null ? ` opacity="${it.a}"` : '';
    body.push(it.s ? `<path d="${D(it.d)}" fill="none" stroke="${fill}" stroke-width="${it.s}" stroke-linecap="round" stroke-linejoin="round"${op}${clip}/>`
      : `<path d="${D(it.d)}" fill="${fill}"${it.r ? ` fill-rule="${it.r}"` : ''}${op}${clip}/>`);
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${Math.round(px * h / w)}" viewBox="${x} ${y} ${w} ${h}"><defs>${defs.join('')}</defs>${body.join('')}</svg>`;
}
