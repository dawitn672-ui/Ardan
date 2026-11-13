// The release's core, portraits: PORTRAIT: the drawn portraits.
// Readable source of vendor/ardan-b593143.html with the patch layer baked in (X1, docs/DECISIONS.md D-028). Edit it here.
// Defines: PORTRAIT, PORTRAIT.shade, PORTRAIT.mix, PORTRAIT.outfit, PORTRAIT.bust, PORTRAIT.beast, PORTRAIT.H,
// PORTRAIT.svg, PORTRAIT.charges, PORTRAIT.arms, PORTRAIT.device, PORTRAIT.coat, PORTRAIT.full, PORTRAIT.head,
// PORTRAIT.weapon, PORTRAIT.shieldArt, PORTRAIT.rangedArt.

const PORTRAIT = {
  n: 0,
};

PORTRAIT.shade = function (hex, amt) {
  let c = (hex || "#888888").replace("#", "");
  if (c.length === 3)
    c = c
      .split("")
      .map(x => x + x)
      .join("");
  const n = parseInt(c, 16);
  let r = (n >> 16) & 255,
    g = (n >> 8) & 255,
    b = n & 255;
  r = Math.max(0, Math.min(255, Math.round(r + amt * 255)));
  g = Math.max(0, Math.min(255, Math.round(g + amt * 255)));
  b = Math.max(0, Math.min(255, Math.round(b + amt * 255)));
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};

PORTRAIT.mix = function (a, b, t) {
  const pa = parseInt(a.slice(1), 16),
    pb = parseInt(b.slice(1), 16),
    ch = (x, s) => (x >> s) & 255,
    m = s => Math.round(ch(pa, s) * (1 - t) + ch(pb, s) * t);
  return "#" + ((1 << 24) + (m(16) << 16) + (m(8) << 8) + m(0)).toString(16).slice(1);
};

PORTRAIT.outfit = function (p) {
  const realm = A.realm(p.ruler || (p.noble && p.noble.realm) || p.realm),
    rc = realm ? realm.color : "#8a7a60";
  return p.ruler
    ? {
        kind: "royal",
        main: PORTRAIT.shade(rc, -0.25),
        trim: "#d8b24a",
        fur: true,
        crown: true,
      }
    : p.mil && p.mil.rank >= 6
      ? {
          kind: "officer",
          main: PORTRAIT.shade(rc, -0.2),
          trim: "#c9a64a",
          mail: true,
        }
      : p.mil
        ? {
            kind: "soldier",
            main: PORTRAIT.shade(rc, -0.15),
            trim: "#6b5b45",
            mail: ["HI", "HC", "MC"].includes(p.mil.troop) || p.gear.armor === "mail",
            helm: !!p.gear.helm,
          }
        : p.job && p.job.c === "clergy"
          ? {
              kind: "priest",
              main: "#e8e0cc",
              trim: "#a8862f",
            }
          : p.status === "royal"
            ? {
                kind: "royal",
                main: PORTRAIT.shade(rc, -0.2),
                trim: "#d8b24a",
                fur: true,
                circlet: true,
              }
            : p.status === "noble" || (p.noble && p.noble.rung >= 4)
              ? {
                  kind: "noble",
                  main: PORTRAIT.shade(rc, -0.3),
                  trim: "#c0a060",
                  fur: true,
                }
              : p.status === "gentry" || (p.noble && p.noble.rung >= 2)
                ? {
                    kind: "gentry",
                    main: "#5a4a6a",
                    trim: "#b09060",
                  }
                : p.status === "merchant" || (p.job && p.job.c === "merchant")
                  ? {
                      kind: "merchant",
                      main: "#6a3a3a",
                      trim: "#c8a050",
                    }
                  : p.prison
                    ? {
                        kind: "rags",
                        main: "#5e5a50",
                        trim: "#4a463e",
                      }
                    : p.status === "slave" || p.flags.unfree
                      ? {
                          kind: "rags",
                          main: "#7a6e5a",
                          trim: "#5a5040",
                        }
                      : p.status === "artisan"
                        ? {
                            kind: "artisan",
                            main: "#4f5f6f",
                            trim: "#7a6248",
                            apron: true,
                          }
                        : {
                            kind: "peasant",
                            main: ["#6b5a3e", "#5a6b3e", "#5e4b3b", "#4f5a4a"][(p.app.face || 0) % 4],
                            trim: "#4a3e2e",
                          };
};

PORTRAIT.bust = function (p, size = 200, opts = {}) {
  if (!p || !p.app) return "";
  const ap = p.app,
    age = A.age(p),
    R2 = GD.RACES[p.race] || GD.RACES.human,
    child = age < R2.adult * 0.75,
    kid = age < R2.adult * 0.35,
    oldF = Math.max(0, Math.min(1, (age - R2.primeEnd) / Math.max(1, R2.old - R2.primeEnd))),
    veryOld = age > R2.old,
    F = p.sex === "F",
    race = p.race;
  let skin = ap.skin || "#d9a77f",
    hair = GD.HAIR[ap.hair] || ap.hair || "#3b2414";
  if (typeof ap.hair == "string" && ap.hair.startsWith("#")) hair = ap.hair;
  const grey = Math.min(1, oldF * 0.8 + (veryOld ? 0.3 : 0));
  if (grey > 0) hair = PORTRAIT.mix(hair, "#d8d4cc", grey);
  const eye = GD.EYES[ap.eye] || "#4b3621",
    out = PORTRAIT.outfit(p),
    skinD = PORTRAIT.shade(skin, -0.12),
    skinL = PORTRAIT.shade(skin, 0.06),
    realm = A.realm(p.realm),
    bg = realm ? realm.color : "#9a8a6a",
    id = "p" + (p.id || "x").replace(/[^a-z0-9]/gi, "") + "_" + PORTRAIT.n++;
  let headW = 46,
    headH = 58,
    jaw = 0.82,
    neckW = 18,
    shoulder = 70;
  const build =
    {
      slight: -8,
      lean: -4,
      average: 0,
      sturdy: 6,
      heavy: 12,
    }[ap.build] || 0;
  if (
    ((shoulder += build),
    F && ((headW -= 3), (headH -= 3), (jaw = 0.72), (shoulder -= 8), (neckW -= 3)),
    race === "dwarf" && ((headW += 6), (headH -= 2), (jaw = 0.95), (shoulder += 14), (neckW += 6)),
    race === "orc" && ((headW += 6), (headH += 2), (jaw = 1), (shoulder += 12), (neckW += 8)),
    race === "halforc" && ((headW += 3), (jaw = 0.92), (shoulder += 6), (neckW += 4)),
    race === "giant" && ((headW += 8), (headH += 4), (jaw = 1), (shoulder += 18), (neckW += 10)),
    race === "elf" && ((headW -= 4), (headH += 2), (jaw = 0.7), (shoulder -= 6), (neckW -= 2)),
    race === "halfelf" && ((headW -= 2), (jaw = 0.76), (shoulder -= 3)),
    child)
  ) {
    const k = kid ? 0.78 : 0.88;
    headW *= k + 0.1;
    headH *= k + 0.06;
    shoulder *= kid ? 0.6 : 0.75;
    neckW *= 0.8;
  }
  const cx = 100,
    cy = child ? 92 : 86,
    hw = headW,
    hh = headH,
    top = cy - hh,
    bot = cy + hh * 0.9,
    jw = hw * jaw,
    head = `M ${cx - hw} ${cy - 4} C ${cx - hw} ${top - 6}, ${cx + hw} ${top - 6}, ${cx + hw} ${cy - 4} C ${cx + hw} ${cy + hh * 0.45}, ${cx + jw} ${bot - 6}, ${cx} ${bot} C ${cx - jw} ${bot - 6}, ${cx - hw} ${cy + hh * 0.45}, ${cx - hw} ${cy - 4} Z`;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="${size}" height="${size}" class="portrait">`;
  s += `<defs><radialGradient id="${id}bg" cx="50%" cy="40%" r="75%"><stop offset="0%" stop-color="${PORTRAIT.shade(bg, 0.18)}"/><stop offset="100%" stop-color="${PORTRAIT.shade(bg, -0.32)}"/></radialGradient>`;
  s += `<linearGradient id="${id}sk" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${skinL}"/><stop offset="100%" stop-color="${skinD}"/></linearGradient>`;
  s += `<clipPath id="${id}clip"><rect x="0" y="0" width="200" height="200" rx="14"/></clipPath></defs>`;
  s += `<g clip-path="url(#${id}clip)"><rect width="200" height="200" fill="url(#${id}bg)"/>`;
  s += `<path d="M0 200 L0 150 Q100 120 200 150 L200 200 Z" fill="${PORTRAIT.shade(bg, -0.4)}" opacity="0.35"/>`;
  if (!p.alive) s += '<rect width="200" height="200" fill="#000" opacity="0.25"/>';
  if (["long", "braided", "tied", "wild"].includes(ap.hstyle) && ap.hstyle !== "shaved")
    s += `<path d="M ${cx - hw - 6} ${cy - 10} Q ${cx - hw - 14} ${cy + hh * 0.9} ${cx - hw + 6} ${cy + hh * 1.25} L ${cx + hw - 6} ${cy + hh * 1.25} Q ${cx + hw + 14} ${cy + hh * 0.9} ${cx + hw + 6} ${cy - 10} Z" fill="${PORTRAIT.shade(hair, -0.08)}"/>`;
  const shY = bot + 10,
    sw = shoulder;
  s += `<path d="M ${cx - sw - 30} 205 L ${cx - sw} ${shY + 10} Q ${cx} ${shY - 6} ${cx + sw} ${shY + 10} L ${cx + sw + 30} 205 Z" fill="${out.main}"/>`;
  if (out.mail) {
    s += `<path d="M ${cx - sw - 30} 205 L ${cx - sw} ${shY + 10} Q ${cx} ${shY - 6} ${cx + sw} ${shY + 10} L ${cx + sw + 30} 205 Z" fill="url(#${id}mail)" opacity="0.9"/>`;
    s = s.replace(
      "</defs>",
      `<pattern id="${id}mail" width="6" height="5" patternUnits="userSpaceOnUse"><rect width="6" height="5" fill="#7d8288"/><circle cx="3" cy="2.5" r="2" fill="none" stroke="#a9aeb3" stroke-width="0.9"/></pattern></defs>`,
    );
    s += `<path d="M ${cx - 26} ${shY + 18} L ${cx + 26} ${shY + 18} L ${cx + 22} 205 L ${cx - 22} 205 Z" fill="${out.main}" opacity="0.92"/>`;
  }
  if (out.fur)
    s += `<path d="M ${cx - sw + 4} ${shY + 12} Q ${cx} ${shY + 34} ${cx + sw - 4} ${shY + 12} Q ${cx} ${shY + 2} ${cx - sw + 4} ${shY + 12} Z" fill="#e9e2d4"/><path d="M ${cx - sw + 10} ${shY + 16} Q ${cx} ${shY + 30} ${cx + sw - 10} ${shY + 16}" stroke="#2a2a2a" stroke-width="2" stroke-dasharray="2 7" fill="none"/>`;
  if (out.apron)
    s += `<path d="M ${cx - 24} ${shY + 20} L ${cx + 24} ${shY + 20} L ${cx + 30} 205 L ${cx - 30} 205 Z" fill="#8a7458"/>`;
  if (out.kind === "priest")
    s += `<path d="M ${cx - 8} ${shY + 6} L ${cx + 8} ${shY + 6} L ${cx + 6} 205 L ${cx - 6} 205 Z" fill="${out.trim}"/>`;
  if (out.kind === "rags")
    s += `<path d="M ${cx - sw + 10} ${shY + 30} l 8 10 l 6 -8 l 7 9 M ${cx + sw - 30} ${shY + 34} l 6 8 l 7 -7" stroke="#3e3a32" stroke-width="2" fill="none"/>`;
  s += `<path d="M ${cx - sw} ${shY + 10} Q ${cx} ${shY - 6} ${cx + sw} ${shY + 10}" stroke="${out.trim}" stroke-width="3" fill="none"/>`;
  s += `<path d="M ${cx - neckW} ${bot - 14} L ${cx - neckW} ${shY + 6} Q ${cx} ${shY + 14} ${cx + neckW} ${shY + 6} L ${cx + neckW} ${bot - 14} Z" fill="${skinD}"/>`;
  const earY = cy + 2;
  if (race === "elf" || race === "halfelf") {
    const len = race === "elf" ? 22 : 12;
    s += `<path d="M ${cx - hw + 2} ${earY - 4} L ${cx - hw - len} ${earY - 18 - len / 2} L ${cx - hw + 2} ${earY + 12} Z" fill="${skin}" stroke="${skinD}" stroke-width="1"/>`;
    s += `<path d="M ${cx + hw - 2} ${earY - 4} L ${cx + hw + len} ${earY - 18 - len / 2} L ${cx + hw - 2} ${earY + 12} Z" fill="${skin}" stroke="${skinD}" stroke-width="1"/>`;
  } else {
    const ew = race === "orc" || race === "giant" ? 9 : 7,
      earMissing = p.wounds && p.wounds.some(w => w.k === "ear");
    s += `<ellipse cx="${cx - hw + 1}" cy="${earY + 4}" rx="${ew}" ry="${ew * 1.5}" fill="${skin}" stroke="${skinD}"/>`;
    s += earMissing
      ? `<path d="M ${cx + hw - 2} ${earY + 2} q 8 2 6 12 l -6 -2 z" fill="${skin}" stroke="${skinD}"/>`
      : `<ellipse cx="${cx + hw - 1}" cy="${earY + 4}" rx="${ew}" ry="${ew * 1.5}" fill="${skin}" stroke="${skinD}"/>`;
  }
  s += `<path d="${head}" fill="url(#${id}sk)" stroke="${PORTRAIT.shade(skin, -0.22)}" stroke-width="1.2"/>`;
  if (race === "orc" || race === "giant" || race === "halforc")
    s += `<path d="M ${cx - hw * 0.8} ${cy - 16} Q ${cx} ${cy - 26} ${cx + hw * 0.8} ${cy - 16} Q ${cx} ${cy - 12} ${cx - hw * 0.8} ${cy - 16} Z" fill="${skinD}" opacity="0.6"/>`;
  const eyeY = cy - 6,
    eyeX = hw * 0.42 + (child ? -2 : 0),
    eyeR = child ? 6.4 : race === "elf" ? 5.4 : 5.2,
    blind = p.wounds && p.wounds.some(w => w.k === "lost_eye"),
    glow = A.hasBlood && (A.hasBlood(p, "mistwalker") || A.hasBlood(p, "deepeye") || A.hasBlood(p, "owl"));
  for (const side of [-1, 1]) {
    const ex = cx + side * eyeX;
    if (blind && side === 1) continue;
    s += `<ellipse cx="${ex}" cy="${eyeY}" rx="${eyeR + 2.5}" ry="${eyeR}" fill="#f3efe6"/>`;
    s += `<circle cx="${ex}" cy="${eyeY + 0.5}" r="${eyeR * 0.62}" fill="${eye}"/>`;
    if (glow) s += `<circle cx="${ex}" cy="${eyeY + 0.5}" r="${eyeR * 0.62}" fill="#c8f0d0" opacity="0.35"/>`;
    s += `<circle cx="${ex}" cy="${eyeY + 0.5}" r="${eyeR * 0.28}" fill="#151515"/><circle cx="${ex + 1.6}" cy="${eyeY - 1.2}" r="1.1" fill="#fff"/>`;
    s += `<path d="M ${ex - eyeR - 3} ${eyeY - 1} Q ${ex} ${eyeY - eyeR - 3} ${ex + eyeR + 3} ${eyeY - 1}" stroke="${PORTRAIT.shade(skin, -0.3)}" stroke-width="1.3" fill="none"/>`;
    const bt = (ap.brow || 0) * 1.4,
      browCol = PORTRAIT.shade(hair, -0.1);
    s += `<path d="M ${ex - eyeR - 3} ${eyeY - eyeR - 5 + (side < 0 ? bt : 0)} Q ${ex} ${eyeY - eyeR - 9} ${ex + eyeR + 3} ${eyeY - eyeR - 5 + (side > 0 ? bt : 0)}" stroke="${browCol}" stroke-width="${race === "orc" || race === "dwarf" || race === "giant" ? 3.6 : 2.4}" stroke-linecap="round" fill="none"/>`;
  }
  if (blind)
    s += `<path d="M ${cx - hw + 2} ${eyeY - 14} L ${cx + hw - 4} ${eyeY - 10}" stroke="#1a1a1a" stroke-width="2"/><ellipse cx="${cx + eyeX}" cy="${eyeY}" rx="${eyeR + 4}" ry="${eyeR + 2}" fill="#1a1a1a"/>`;
  const broke = p.wounds && p.wounds.some(w => w.k === "broken_nose"),
    nl = race === "dwarf" ? 18 : race === "orc" ? 12 : race === "giant" ? 16 : 14,
    nw = race === "dwarf" || race === "orc" || race === "giant" ? 8 : race === "elf" ? 4 : 6;
  s += `<path d="M ${cx - 1} ${eyeY + 2} ${broke ? `L ${cx + 3} ${eyeY + nl * 0.5}` : ""} L ${cx - 1 + (broke ? 2 : 0)} ${eyeY + nl} Q ${cx} ${eyeY + nl + 4} ${cx + nw} ${eyeY + nl}" stroke="${PORTRAIT.shade(skin, -0.28)}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
  if (race === "orc" || race === "halforc")
    s += `<ellipse cx="${cx - 4}" cy="${eyeY + nl + 1}" rx="2" ry="1.4" fill="${PORTRAIT.shade(skin, -0.35)}"/><ellipse cx="${cx + 4}" cy="${eyeY + nl + 1}" rx="2" ry="1.4" fill="${PORTRAIT.shade(skin, -0.35)}"/>`;
  const my = eyeY + nl + (child ? 13 : 16),
    mw = (child ? 9 : 12) + (ap.mouth || 0) * 2,
    lip = F ? "#b05a5a" : PORTRAIT.shade(skin, -0.25),
    happy = p.happy != null ? (p.happy - 50) / 50 : 0;
  if (
    ((s += `<path d="M ${cx - mw} ${my} Q ${cx} ${my + 4 + happy * 4} ${cx + mw} ${my}" stroke="${lip}" stroke-width="${F ? 3 : 2.2}" fill="none" stroke-linecap="round"/>`),
    race === "orc" &&
      (s += `<path d="M ${cx - mw + 2} ${my + 1} l -2 -10 l 5 9 Z M ${cx + mw - 2} ${my + 1} l 2 -10 l -5 9 Z" fill="#efe6cf" stroke="#bdb196" stroke-width="0.8"/>`),
    race === "halforc" &&
      (s += `<path d="M ${cx - mw + 3} ${my + 1} l -1 -5 l 3 5 Z M ${cx + mw - 3} ${my + 1} l 1 -5 l -3 5 Z" fill="#efe6cf"/>`),
    oldF > 0.2)
  ) {
    const o = Math.min(0.7, oldF);
    s += `<path d="M ${cx - eyeX - 12} ${eyeY + 2} l -4 3 M ${cx + eyeX + 12} ${eyeY + 2} l 4 3 M ${cx - mw - 6} ${my - 10} q -3 8 0 14 M ${cx + mw + 6} ${my - 10} q 3 8 0 14" stroke="${PORTRAIT.shade(skin, -0.3)}" stroke-width="1.2" opacity="${o}" fill="none"/>`;
  }
  if (veryOld)
    s += `<path d="M ${cx - 16} ${top + 16} q 16 -4 32 0 M ${cx - 12} ${top + 22} q 12 -3 24 0" stroke="${PORTRAIT.shade(skin, -0.25)}" stroke-width="1" fill="none" opacity="0.6"/>`;
  if (child || F)
    s += `<circle cx="${cx - hw * 0.55}" cy="${my - 8}" r="6" fill="#e07070" opacity="0.15"/><circle cx="${cx + hw * 0.55}" cy="${my - 8}" r="6" fill="#e07070" opacity="0.15"/>`;
  const marks = new Set((p.wounds || []).map(w => (GD.WOUNDS[w.k] || {}).mark).filter(Boolean));
  if (marks.has("faceScar"))
    s += `<path d="M ${cx - hw * 0.6} ${eyeY - 18} L ${cx - hw * 0.1} ${my + 4}" stroke="#a04848" stroke-width="2.2" opacity="0.8"/><path d="M ${cx - hw * 0.5} ${eyeY - 10} l 6 -2 M ${cx - hw * 0.35} ${eyeY + 4} l 6 -2" stroke="#a04848" stroke-width="1.2" opacity="0.7"/>`;
  if (marks.has("burn"))
    s += `<path d="M ${cx + hw * 0.2} ${eyeY + 10} q 14 -6 22 8 q -4 14 -18 10 z" fill="#b0605a" opacity="0.45"/>`;
  if (marks.has("brand"))
    s += `<circle cx="${cx + hw * 0.55}" cy="${my - 6}" r="4.5" fill="none" stroke="#7a2a2a" stroke-width="1.6"/>`;
  if (p.blood && A.bloodDef && A.bloodDef(p) && A.bloodDef(p).tag === "sixfinger") p.blood.show;
  const beard = F || child ? "none" : ap.beard,
    bc = PORTRAIT.shade(hair, -0.05);
  if (
    (beard === "stubble" &&
      (s += `<path d="M ${cx - jw} ${cy + hh * 0.3} C ${cx - jw} ${bot - 2}, ${cx + jw} ${bot - 2}, ${cx + jw} ${cy + hh * 0.3}" stroke="${bc}" stroke-width="7" opacity="0.25" fill="none"/>`),
    beard === "short" || beard === "full" || beard === "long" || beard === "braided")
  ) {
    const blen =
      {
        short: 8,
        full: 16,
        long: 34,
        braided: 40,
      }[beard] + (race === "dwarf" ? 18 : 0);
    s += `<path d="M ${cx - jw - 2} ${cy + hh * 0.18} Q ${cx - jw} ${bot + blen * 0.6} ${cx} ${bot + blen} Q ${cx + jw} ${bot + blen * 0.6} ${cx + jw + 2} ${cy + hh * 0.18} Q ${cx + mw + 4} ${my + 10} ${cx} ${my + 8} Q ${cx - mw - 4} ${my + 10} ${cx - jw - 2} ${cy + hh * 0.18} Z" fill="${bc}"/>`;
    s += `<path d="M ${cx - mw - 2} ${my - 3} Q ${cx} ${my - 9} ${cx + mw + 2} ${my - 3}" stroke="${bc}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`;
    if (beard === "braided")
      s += `<path d="M ${cx} ${bot + 6} L ${cx} ${bot + blen - 2}" stroke="${PORTRAIT.shade(bc, -0.15)}" stroke-width="3" stroke-dasharray="4 3"/><circle cx="${cx}" cy="${bot + blen - 2}" r="3" fill="#c8a24a"/>`;
  }
  const hs = ap.hstyle;
  if (hs !== "shaved" || child) {
    const vol = hs === "wild" ? 10 : hs === "cropped" ? 2 : 6;
    s += `<path d="M ${cx - hw - 3} ${cy - 2} C ${cx - hw - 6} ${top - vol - 8}, ${cx + hw + 6} ${top - vol - 8}, ${cx + hw + 3} ${cy - 2} C ${cx + hw - 6} ${top + 12}, ${cx - hw * 0.2} ${top + 6}, ${cx - hw * 0.3} ${top + 18} C ${cx - hw * 0.6} ${top + 10}, ${cx - hw + 4} ${top + 14}, ${cx - hw - 3} ${cy - 2} Z" fill="${hair}"/>`;
    if (hs === "topknot")
      s += `<ellipse cx="${cx}" cy="${top - vol - 4}" rx="10" ry="8" fill="${hair}"/><path d="M ${cx - 6} ${top - vol + 2} L ${cx + 6} ${top - vol + 2}" stroke="${PORTRAIT.shade(hair, -0.2)}" stroke-width="2.5"/>`;
    if (hs === "braided")
      s += `<path d="M ${cx - hw - 2} ${cy} q -6 30 -2 52 M ${cx + hw + 2} ${cy} q 6 30 2 52" stroke="${PORTRAIT.shade(hair, -0.12)}" stroke-width="7" fill="none" stroke-dasharray="6 3"/>`;
    if (hs === "tied")
      s += `<path d="M ${cx + hw - 4} ${cy - 20} q 16 10 10 40" stroke="${hair}" stroke-width="8" fill="none" stroke-linecap="round"/>`;
  } else if (!child)
    s += `<path d="M ${cx - hw + 2} ${cy - 10} C ${cx - hw} ${top - 4}, ${cx + hw} ${top - 4}, ${cx + hw - 2} ${cy - 10}" stroke="${PORTRAIT.shade(hair, 0.1)}" stroke-width="2" opacity="0.25" fill="none"/>`;
  if (out.crown)
    s += `<path d="M ${cx - hw * 0.8} ${top + 4} L ${cx - hw * 0.8} ${top - 14} L ${cx - hw * 0.4} ${top - 4} L ${cx} ${top - 20} L ${cx + hw * 0.4} ${top - 4} L ${cx + hw * 0.8} ${top - 14} L ${cx + hw * 0.8} ${top + 4} Z" fill="#d8b24a" stroke="#8a6a1a" stroke-width="1.2"/><circle cx="${cx}" cy="${top - 6}" r="3" fill="#b0283a"/><circle cx="${cx - hw * 0.5}" cy="${top - 1}" r="2" fill="#2a5aa0"/><circle cx="${cx + hw * 0.5}" cy="${top - 1}" r="2" fill="#2a5aa0"/>`;
  else {
    if (out.circlet)
      s += `<path d="M ${cx - hw * 0.9} ${top + 8} Q ${cx} ${top - 2} ${cx + hw * 0.9} ${top + 8}" stroke="#d8b24a" stroke-width="3.5" fill="none"/><circle cx="${cx}" cy="${top + 2}" r="2.6" fill="#3a8a5a"/>`;
    else {
      if (out.helm && !child)
        s += `<path d="M ${cx - hw - 4} ${cy - 6} C ${cx - hw - 4} ${top - 16}, ${cx + hw + 4} ${top - 16}, ${cx + hw + 4} ${cy - 6} L ${cx + hw + 2} ${cy - 2} L ${cx - hw - 2} ${cy - 2} Z" fill="#8c9096" stroke="#4e5256" stroke-width="1.4"/><rect x="${cx - 3}" y="${cy - 4}" width="6" height="${nl + 6}" fill="#7c8086" stroke="#4e5256" stroke-width="1"/>`;
      else {
        if (out.kind === "priest" && !child)
          s += `<path d="M ${cx - hw - 6} ${cy + 6} C ${cx - hw - 10} ${top - 18}, ${cx + hw + 10} ${top - 18}, ${cx + hw + 6} ${cy + 6} L ${cx + hw - 2} ${cy - 2} C ${cx + hw - 6} ${top}, ${cx - hw + 6} ${top}, ${cx - hw + 2} ${cy - 2} Z" fill="${out.main}" stroke="${out.trim}" stroke-width="1.5"/>`;
      }
    }
  }
  if (blind)
    s += `<path d="M ${cx - hw - 2} ${eyeY - 12} L ${cx + hw} ${eyeY - 6}" stroke="#1a1a1a" stroke-width="2"/>`;
  s += `</g><rect x="1.5" y="1.5" width="197" height="197" rx="14" fill="none" stroke="${PORTRAIT.shade(bg, -0.45)}" stroke-width="3"/>`;
  if (!p.alive) s += '<path d="M 160 20 l 20 0 M 170 10 l 0 26" stroke="#ddd" stroke-width="3"/>';
  s += "</svg>";
  return s;
};

PORTRAIT.beast = function (cid, size = 200) {
  const L = (LORE.creatures || []).find(c => c.id === cid) || {
      name: "Beast",
      cat: "",
    },
    cat = L.cat || "",
    col = /Dragon/.test(cat)
      ? "#6a4a3a"
      : /Marsh/.test(cat)
        ? "#3e5a40"
        : /Desert/.test(cat)
          ? "#a08050"
          : /Mountain|Cave/.test(cat)
            ? "#5a5048"
            : "#4a4038";
  let shape;
  if (/Dragon|Wyvern|Drake/.test(L.name))
    shape =
      '<path d="M30 130 Q60 70 100 100 Q140 40 190 60 Q150 80 140 110 Q170 120 160 140 Q120 120 100 135 Q70 150 30 130 Z" /><path d="M100 100 Q90 50 50 40 Q80 70 85 105 Z" opacity="0.85"/>';
  else {
    if (/Crocodile|Basilisk|Wyrm|Python|Anaconda/.test(L.name))
      shape =
        '<path d="M10 135 Q50 115 100 120 Q150 112 190 128 Q150 140 100 142 Q50 150 10 135 Z"/><path d="M150 120 l 30 -6 l -4 10 Z"/>';
    else {
      if (/Bear|Ape|Men|Old Man/.test(L.name))
        shape =
          '<ellipse cx="100" cy="120" rx="55" ry="45"/><circle cx="100" cy="68" r="26"/><circle cx="82" cy="46" r="8"/><circle cx="118" cy="46" r="8"/>';
      else {
        if (/Roc|Eagle|bird/i.test(L.name))
          shape = '<path d="M20 90 Q100 40 180 90 Q130 90 110 110 L100 150 L90 110 Q70 90 20 90 Z"/>';
        else
          shape =
            '<ellipse cx="100" cy="118" rx="62" ry="32"/><path d="M150 110 Q180 90 182 70 Q160 80 150 100 Z"/><rect x="60" y="135" width="10" height="30"/><rect x="130" y="135" width="10" height="30"/><rect x="85" y="140" width="10" height="26"/><rect x="110" y="140" width="10" height="26"/>';
      }
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="${size}" height="${size}" class="portrait"><rect width="200" height="200" rx="14" fill="#2b2420"/><path d="M0 200 L0 160 Q100 140 200 160 L200 200 Z" fill="#3a3028"/><g fill="${col}" stroke="#1a1410" stroke-width="2">${shape}</g><circle cx="150" cy="${/Dragon|Drake|Wyvern/.test(L.name) ? 62 : 70}" r="3" fill="#e8c040"/><rect x="1.5" y="1.5" width="197" height="197" rx="14" fill="none" stroke="#000" stroke-width="3"/></svg>`;
};

PORTRAIT.H = 340;

// [C8b] Every portrait in the game is drawn by the figure library (src/ui/93-figures, the art the owner approved at
// gate 2, D-035): a square for lists and chips, two by three for size >= 120. The release's paper doll below is what a
// build without that feature draws, and what is drawn if the library ever fails (UI.FIG.errors counts it).
PORTRAIT.svg = function (p, size = 200, opts = {}) {
  if (!p || !p.app) return "";
  if (typeof UI !== "undefined" && UI.FIG && UI.FIG.svg) {
    const s = UI.FIG.svg(p, size, opts || {});
    if (s) return s;
  }
  return size < 120 || (opts && opts.bust) ? PORTRAIT.bust(p, size, opts) : PORTRAIT.full(p, size, opts);
};

PORTRAIT.charges = {
  lion: "M-9 8 L-7 -2 Q-9 -8 -4 -10 Q0 -13 4 -9 L8 -10 L6 -5 Q9 -1 7 3 L9 9 L5 9 L4 4 L-2 5 L-4 9 Z",
  wolf: "M-10 6 L-6 -2 L-8 -9 L-3 -5 L3 -6 L7 -10 L7 -3 L10 2 L4 2 L6 9 L2 9 L0 3 L-5 4 L-6 9 Z",
  bear: "M-10 8 Q-11 -2 -4 -5 L-6 -9 L-2 -8 Q2 -9 5 -6 L8 -8 L8 -4 Q11 0 9 8 Z",
  boar: "M-11 5 Q-9 -5 0 -6 Q8 -6 10 -1 L12 1 L9 3 L9 8 L5 8 L4 4 L-3 4 L-4 8 L-8 8 Z M9 -1 l4 -3",
  stag: "M-3 10 L-2 0 L-6 -4 L-9 -11 L-6 -7 L-6 -11 L-4 -6 L-1 -4 L1 -4 L4 -6 L6 -11 L6 -7 L9 -11 L6 -4 L2 0 L3 10 Z",
  eagle: "M0 -10 L3 -6 L12 -8 L7 0 L11 2 L4 3 L3 10 L0 7 L-3 10 L-4 3 L-11 2 L-7 0 L-12 -8 L-3 -6 Z",
  raven: "M-10 4 Q-4 -2 2 -6 L7 -8 L9 -6 L6 -4 Q8 2 2 6 L6 10 L0 8 L-4 10 L-3 6 Z",
  hawk: "M0 -10 L4 -4 L12 -6 L6 2 L3 10 L0 6 L-3 10 L-6 2 L-12 -6 L-4 -4 Z",
  owl: "M-7 -9 L-3 -6 L3 -6 L7 -9 L7 4 Q7 10 0 10 Q-7 10 -7 4 Z",
  horse: "M-8 9 L-6 0 Q-8 -6 -2 -9 L4 -11 L8 -7 L6 -5 L3 -6 L2 0 L6 9 L2 9 L0 3 L-3 4 L-4 9 Z",
  bull: "M-10 -8 Q-8 -3 -5 -3 L-5 4 Q0 10 5 4 L5 -3 Q8 -3 10 -8 Q6 -5 3 -6 L-3 -6 Q-6 -5 -10 -8 Z",
  ram: "M-6 -6 Q-12 -6 -10 1 Q-8 4 -5 1 L-4 6 Q0 10 4 6 L5 1 Q8 4 10 1 Q12 -6 6 -6 Z",
  dragon: "M-10 8 Q-6 0 -8 -6 L-3 -2 L0 -10 L3 -2 L9 -8 L6 2 L10 6 L3 4 L2 10 L-2 5 Z",
  serpent: "M-8 9 Q-12 2 -4 0 Q4 -2 0 -6 Q-3 -9 2 -10 Q8 -9 6 -4 Q3 2 -2 3 Q-6 5 -2 8 Z",
  fish: "M-11 0 Q-4 -7 5 -3 L11 -7 L9 0 L11 7 L5 3 Q-4 7 -11 0 Z",
  whale: "M-12 2 Q-8 -8 4 -5 Q10 -3 12 -8 L11 0 Q8 6 -2 6 Q-10 6 -12 2 Z",
  tower:
    "M-6 10 L-6 -6 L-8 -6 L-8 -10 L-5 -10 L-5 -8 L-2 -8 L-2 -10 L2 -10 L2 -8 L5 -8 L5 -10 L8 -10 L8 -6 L6 -6 L6 10 Z",
  castle:
    "M-11 10 L-11 -4 L-11 -8 L-8 -8 L-8 -5 L-4 -5 L-4 -10 L4 -10 L4 -5 L8 -5 L8 -8 L11 -8 L11 10 L3 10 L3 4 Q0 0 -3 4 L-3 10 Z",
  gate: "M-9 10 L-9 -4 Q0 -12 9 -4 L9 10 Z M-5 10 L-5 -1 M0 10 L0 -4 M5 10 L5 -1",
  sword: "M-1.2 -11 L1.2 -11 L1.2 4 L5 4 L5 6 L1.2 6 L1.2 9 L-1.2 9 L-1.2 6 L-5 6 L-5 4 L-1.2 4 Z",
  axe: "M-1 -10 L1 -10 L1 10 L-1 10 Z M1 -8 Q9 -8 9 -2 Q9 3 1 2 Z",
  spear: "M0 -11 L3 -5 L1 -5 L1 10 L-1 10 L-1 -5 L-3 -5 Z",
  bow: "M-4 -10 Q8 0 -4 10 M-4 -10 L-4 10",
  arrow: "M0 -11 L3 -7 L1 -7 L1 7 L3 10 L0 8 L-3 10 L-1 7 L-1 -7 L-3 -7 Z",
  hammer: "M-1 -4 L1 -4 L1 10 L-1 10 Z M-7 -10 L7 -10 L7 -4 L-7 -4 Z",
  anvil: "M-10 -6 L8 -6 Q10 -6 11 -3 L4 -3 L4 2 L7 7 L-7 7 L-4 2 L-4 -3 L-8 -3 Z",
  crown: "M-10 6 L-10 -6 L-5 0 L0 -9 L5 0 L10 -6 L10 6 Z",
  star: "M0 -10 L2.4 -3 L9.5 -3 L3.8 1.2 L6 8 L0 4 L-6 8 L-3.8 1.2 L-9.5 -3 L-2.4 -3 Z",
  sun: "M0 -5 A5 5 0 1 1 -0.01 -5 Z M0 -11 L1.5 -7 L-1.5 -7 Z M0 11 L1.5 7 L-1.5 7 Z M-11 0 L-7 1.5 L-7 -1.5 Z M11 0 L7 1.5 L7 -1.5 Z M-8 -8 L-4 -5.5 L-5.5 -4 Z M8 8 L4 5.5 L5.5 4 Z M8 -8 L5.5 -4 L4 -5.5 Z M-8 8 L-5.5 4 L-4 5.5 Z",
  moon: "M3 -10 A10 10 0 1 0 3 10 A7 7 0 1 1 3 -10 Z",
  tree: "M-1.5 10 L-1.5 2 Q-10 2 -8 -4 Q-9 -10 0 -11 Q9 -10 8 -4 Q10 2 1.5 2 L1.5 10 Z",
  oak: "M-1.5 10 L-1.5 1 Q-11 1 -9 -5 Q-6 -12 0 -10 Q6 -12 9 -5 Q11 1 1.5 1 L1.5 10 Z",
  rose: "M0 -7 A7 7 0 1 1 -0.01 -7 Z M0 7 L0 11",
  lily: "M0 -11 Q3 -4 1 2 L6 -3 Q8 4 2 5 L2 10 L-2 10 L-2 5 Q-8 4 -6 -3 L-1 2 Q-3 -4 0 -11 Z",
  wheat: "M0 -11 L0 10 M0 -7 l-4 -2 M0 -7 l4 -2 M0 -3 l-4 -2 M0 -3 l4 -2 M0 1 l-4 -2 M0 1 l4 -2",
  ship: "M-11 3 L11 3 L7 9 L-7 9 Z M-1 3 L-1 -11 L1 -11 L1 3 Z M1 -10 L9 -2 L1 -2 Z",
  anchor:
    "M-1 -7 L1 -7 L1 7 Q6 6 8 1 L10 3 Q7 10 0 10 Q-7 10 -10 3 L-8 1 Q-6 6 -1 7 Z M0 -10 A3 3 0 1 1 -0.01 -10 Z M-5 -4 L5 -4 L5 -2 L-5 -2 Z",
  wave: "M-11 -2 Q-6 -8 -1 -2 Q4 4 9 -2 L11 0 Q4 8 -1 2 Q-6 -4 -11 2 Z M-11 5 Q-6 -1 -1 5 Q4 11 9 5 L11 7 Q4 13 -1 8 Q-6 2 -11 8 Z",
  mountain: "M-11 9 L-3 -6 L1 0 L4 -9 L11 9 Z",
  flame: "M0 -11 Q6 -4 4 2 Q9 0 7 -4 Q12 4 6 10 L-6 10 Q-12 4 -7 -4 Q-9 0 -4 2 Q-6 -4 0 -11 Z",
  key: "M-1 -2 L1 -2 L1 10 L5 10 L5 7 L1 7 M-4 -8 A4 4 0 1 1 4 -8 A4 4 0 1 1 -4 -8 Z",
  hand: "M-6 10 L-6 -2 L-8 -6 L-6 -7 L-4 -3 L-4 -10 L-2 -10 L-2 -3 L-1 -11 L1 -11 L1 -3 L2 -10 L4 -10 L4 -3 L5 -8 L7 -8 L6 2 L6 10 Z",
  skull: "M-7 2 Q-9 -10 0 -10 Q9 -10 7 2 L5 4 L5 8 L-5 8 L-5 4 Z",
  wheel: "M0 -10 A10 10 0 1 1 -0.01 -10 Z M0 -6 A6 6 0 1 0 0.01 -6 Z",
  bell: "M-7 6 Q-7 -9 0 -9 Q7 -9 7 6 L9 8 L-9 8 Z",
  chevron: "M-12 8 L0 -6 L12 8 L12 2 L0 -12 L-12 2 Z",
  bend: "M-14 -10 L-8 -14 L14 10 L8 14 Z",
  cross: "M-2 -12 L2 -12 L2 -2 L12 -2 L12 2 L2 2 L2 12 L-2 12 L-2 2 L-12 2 L-12 -2 L-2 -2 Z",
  bars: "M-14 -7 L14 -7 L14 -3 L-14 -3 Z M-14 3 L14 3 L14 7 L-14 7 Z",
  chequy:
    "M-14 -14 L-7 -14 L-7 -7 L-14 -7 Z M0 -14 L7 -14 L7 -7 L0 -7 Z M-7 -7 L0 -7 L0 0 L-7 0 Z M7 -7 L14 -7 L14 0 L7 0 Z M-14 0 L-7 0 L-7 7 L-14 7 Z M0 0 L7 0 L7 7 L0 7 Z M-7 7 L0 7 L0 14 L-7 14 Z M7 7 L14 7 L14 14 L7 14 Z",
  none: "",
};

PORTRAIT.arms = function (p) {
  const h = p && p.house ? A.house(p.house) : null;
  if (h && h.colors)
    return {
      f: h.colors[0],
      c: h.colors[1],
      ch: h.charge || "chevron",
      h,
    };
  const r = p ? A.realm(p.ruler || (p.mil && p.mil.realm) || p.realm) : null,
    rc = r ? r.color : "#7a6a50";
  return {
    f: PORTRAIT.shade(rc, -0.25),
    c: "#d8c48a",
    ch: p && p.mil ? "star" : "none",
    h: null,
  };
};

PORTRAIT.device = function (a, x, y, sc) {
  const d = PORTRAIT.charges[a.ch] || "";
  if (!d) return "";
  const lineOnly = ["bow", "wheat"].includes(a.ch);
  return `<path d="${d}" transform="translate(${x} ${y}) scale(${sc})" ${lineOnly ? `fill="none" stroke="${a.c}" stroke-width="${2 / sc}"` : `fill="${a.c}" fill-rule="evenodd" stroke="${PORTRAIT.shade(a.f, -0.3)}" stroke-width="${0.6 / sc}"`}/>`;
};

PORTRAIT.coat = function (h, size = 40) {
  const a =
    h && h.colors
      ? {
          f: h.colors[0],
          c: h.colors[1],
          ch: h.charge || "chevron",
        }
      : {
          f: "#5a4a3a",
          c: "#d4a63a",
          ch: "chevron",
        };
  return `<svg viewBox="0 0 40 46" width="${size}" height="${Math.round(size * 1.15)}" class="coat"><path d="M3 3 L37 3 L37 20 Q37 36 20 44 Q3 36 3 20 Z" fill="${a.f}" stroke="${PORTRAIT.shade(a.f, -0.35)}" stroke-width="2"/><path d="M3 3 L37 3 L37 20 Q37 36 20 44 Q3 36 3 20 Z" fill="url(#coatSheen)" opacity="0.35"/>${PORTRAIT.device(a, 20, 21, 1.15)}<defs><linearGradient id="coatSheen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="0.5" stop-color="#fff" stop-opacity="0"/></linearGradient></defs></svg>`;
};

PORTRAIT.full = function (p, size = 200, opts = {}) {
  const ap = p.app,
    id = "f" + String(p.id || "x").replace(/[^a-z0-9]/gi, "") + "_" + PORTRAIT.n++,
    sh = PORTRAIT.shade,
    mix = PORTRAIT.mix,
    age = A.age(p),
    R2 = GD.RACES[p.race] || GD.RACES.human,
    race = p.race,
    F = p.sex === "F",
    grown = Math.min(1, age / Math.max(1, R2.grown || R2.adult)),
    child = age < R2.adult * 0.8,
    kid = age < R2.adult * 0.4,
    baby = age < R2.adult * 0.12,
    oldF = Math.max(0, Math.min(1, (age - R2.primeEnd) / Math.max(1, R2.old - R2.primeEnd))),
    veryOld = age > R2.old,
    g = Object.assign(
      {
        weapon: "fists",
        armor: "none",
      },
      p.gear || {},
    ),
    GG = k => (k && GD.GEAR[k]) || null;
  let skin = ap.skin || "#d9a77f",
    hair = GD.HAIR[ap.hair] || "#3b2414";
  if (typeof ap.hair == "string" && ap.hair.startsWith("#")) hair = ap.hair;
  const grey = Math.min(1, oldF * 0.85 + (veryOld ? 0.3 : 0));
  if (grey > 0) hair = mix(hair, "#d8d4cc", grey);
  const eye = GD.EYES[ap.eye] || "#4b3621",
    skD = sh(skin, -0.14),
    skL = sh(skin, 0.07),
    skLine = sh(skin, -0.3),
    arms = PORTRAIT.arms(p),
    out = PORTRAIT.outfit(p),
    realm = A.realm(p.realm),
    bg = realm ? realm.color : "#8a7a5a",
    raceH =
      {
        human: 1,
        elf: 1.03,
        dwarf: 0.8,
        orc: 1.02,
        giant: 1.06,
        halfelf: 1.01,
        halforc: 1.01,
      }[race] || 1,
    ageH = baby ? 0.36 : kid ? 0.5 + (age / (R2.adult * 0.4)) * 0.15 : child ? 0.68 + (age / R2.adult) * 0.26 : 1,
    hAdj = Math.max(
      -0.08,
      Math.min(
        0.08,
        ((ap.height || 170) - ((F ? R2.height[0] : R2.height[1]) || 170)) / ((F ? R2.height[0] : R2.height[1]) || 170),
      ),
    ),
    stoop = veryOld ? 6 : oldF > 0.6 ? 3 : 0,
    figH = 292 * raceH * ageH * (1 + hAdj * 0.8) - stoop,
    headRatio = baby
      ? 3.6
      : kid
        ? 4.6
        : child
          ? 5.6
          : {
              human: 6.3,
              elf: 6.6,
              dwarf: 4.7,
              orc: 6,
              giant: 6.8,
              halfelf: 6.4,
              halforc: 6.2,
            }[race] || 6.3,
    headH = figH / headRatio;
  let headW =
    headH *
    ({
      dwarf: 0.9,
      orc: 0.88,
      giant: 0.84,
      elf: 0.72,
      halforc: 0.84,
    }[race] || 0.78) *
    (F ? 0.95 : 1);
  if (child) headW = headH * 0.84;
  const buildK =
      {
        slight: 0.86,
        lean: 0.93,
        average: 1,
        sturdy: 1.1,
        heavy: 1.2,
        muscular: 1.16,
        gaunt: 0.82,
        stout: 1.14,
      }[ap.build] || 1,
    raceW =
      {
        dwarf: 1.28,
        orc: 1.32,
        giant: 1.36,
        elf: 0.9,
        halforc: 1.14,
        halfelf: 0.95,
      }[race] || 1,
    cx = 100,
    ground = 326,
    top = ground - figH,
    hcY = top + headH * 0.5,
    chinY = top + headH,
    shY = chinY + headH * (child ? 0.18 : 0.28),
    shW = headW * (child ? 0.95 : 1.22) * buildK * raceW * (F ? 0.88 : 1),
    torsoL =
      headH *
      ({
        dwarf: 1.75,
        giant: 1.55,
        orc: 1.6,
      }[race] || 1.5) *
      (child ? 0.92 : 1),
    waistY = shY + torsoL,
    waistW = shW * (F ? 0.68 : 0.8) * (ap.build === "heavy" || ap.build === "stout" ? 1.15 : 1),
    hipY = waistY + headH * 0.45,
    hipW = shW * (F ? 0.86 : 0.78) * (ap.build === "heavy" ? 1.1 : 1),
    legL = ground - hipY,
    kneeY = hipY + legL * 0.5,
    legW = hipW * 0.58,
    armW = Math.max(5, shW * 0.27),
    elbowY = shY + torsoL * 0.62,
    handY = hipY + headH * (race === "orc" || race === "giant" ? 0.75 : 0.45),
    rH = {
      x: cx - shW - armW * 0.6,
      y: handY,
    },
    lH = {
      x: cx + shW + armW * 0.5,
      y: handY - headH * 0.35,
    },
    W = GG(g.weapon) || GD.GEAR.fists,
    Ar = GG(g.armor) || GD.GEAR.none,
    He = GG(g.helm),
    Sh = GG(g.shield),
    Rg = GG(g.ranged),
    Cl = GG(g.cloak),
    Mt = GG(g.mount),
    aLook = child ? "none" : Ar.look || g.armor || "none",
    metal = "#9aa0a8",
    metalD = "#5d636b",
    metalL = "#d4d9de",
    gold = "#c9a13a",
    leather = "#6b4a2e",
    leatherD = "#46301e",
    cloth = out.main,
    clothD = sh(out.main, -0.16),
    trim = out.trim,
    hose =
      out.kind === "royal" || out.kind === "noble"
        ? sh(arms.f, -0.1)
        : out.kind === "rags"
          ? "#6a6050"
          : sh(out.main, -0.28);
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 ${PORTRAIT.H}" width="${size}" height="${Math.round((size * PORTRAIT.H) / 200)}" class="portrait full">`;
  s += `<defs>
    <linearGradient id="${id}bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sh(bg, 0.12)}"/><stop offset="0.75" stop-color="${sh(bg, -0.25)}"/><stop offset="1" stop-color="${sh(bg, -0.45)}"/></linearGradient>
    <radialGradient id="${id}glow" cx="50%" cy="38%" r="60%"><stop offset="0" stop-color="#fff" stop-opacity="0.22"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <linearGradient id="${id}sk" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${skL}"/><stop offset="1" stop-color="${skD}"/></linearGradient>
    <linearGradient id="${id}met" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${metalD}"/><stop offset="0.35" stop-color="${metalL}"/><stop offset="0.6" stop-color="${metal}"/><stop offset="1" stop-color="${metalD}"/></linearGradient>
    <linearGradient id="${id}cl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${clothD}"/><stop offset="0.45" stop-color="${sh(cloth, 0.06)}"/><stop offset="1" stop-color="${sh(cloth, -0.22)}"/></linearGradient>
    <linearGradient id="${id}lth" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${leatherD}"/><stop offset="0.5" stop-color="${sh(leather, 0.08)}"/><stop offset="1" stop-color="${leatherD}"/></linearGradient>
    <pattern id="${id}mail" width="4" height="3.4" patternUnits="userSpaceOnUse"><rect width="4" height="3.4" fill="${metalD}"/><circle cx="2" cy="1.7" r="1.35" fill="none" stroke="${metalL}" stroke-width="0.7"/></pattern>
    <pattern id="${id}scale" width="6" height="5" patternUnits="userSpaceOnUse"><rect width="6" height="5" fill="${metalD}"/><path d="M0 0 Q3 6 6 0" fill="${metal}" stroke="${metalL}" stroke-width="0.5"/></pattern>
    <pattern id="${id}leaf" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#4d6a52"/><path d="M3 0 Q6 3 3 6 Q0 3 3 0 Z" fill="#9fb8a0" stroke="#d6e3d2" stroke-width="0.4"/></pattern>
    <pattern id="${id}lam" width="5" height="4" patternUnits="userSpaceOnUse"><rect width="5" height="4" fill="${sh(arms.f, -0.35)}"/><rect x="0.4" y="0.4" width="4.2" height="3.2" rx="0.8" fill="${sh(arms.f, -0.05)}" stroke="#2a1d14" stroke-width="0.4"/></pattern>
    <pattern id="${id}quilt" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#bfae86"/><path d="M0 0 L0 6 M0 0 L6 0" stroke="#8e7e5a" stroke-width="0.8"/></pattern>
    <pattern id="${id}fur" width="5" height="5" patternUnits="userSpaceOnUse"><rect width="5" height="5" fill="#e8e0cf"/><path d="M1 1 l1 2 M3 2 l1 2" stroke="#1d1d1d" stroke-width="0.8"/></pattern>
    <pattern id="${id}hide" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#7b6448"/><path d="M0 2 q2 -2 4 0 t4 0 M0 6 q2 -2 4 0 t4 0" stroke="#5e4a33" stroke-width="0.8" fill="none"/></pattern>
    <filter id="${id}sh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="1.2" stdDeviation="1.1" flood-color="#000" flood-opacity="0.35"/></filter>
    ${p.alive ? "" : `<filter id="${id}dead"><feColorMatrix type="saturate" values="0.15"/></filter>`}
    <clipPath id="${id}clip"><rect width="200" height="${PORTRAIT.H}" rx="14"/></clipPath>
  </defs>`;
  s += `<g clip-path="url(#${id}clip)"><rect width="200" height="${PORTRAIT.H}" fill="url(#${id}bg)"/><rect width="200" height="${PORTRAIT.H}" fill="url(#${id}glow)"/>`;
  const prov = A.prov && p.home != null ? A.prov(p.home) : null,
    terr = prov ? prov.terr : "plains",
    hillC =
      {
        forest: "#2f4a30",
        marsh: "#3c4a38",
        desert: "#a88a58",
        steppe: "#7d7a4a",
        mountains: "#5b5a60",
        hills: "#5a6a44",
        tundra: "#a8b2b8",
        plains: "#5f7040",
      }[terr] || "#5f7040";
  if (
    ((s += `<path d="M0 ${ground - 70} Q40 ${ground - 100} 80 ${ground - 76} T160 ${ground - 84} T200 ${ground - 74} L200 ${PORTRAIT.H} L0 ${PORTRAIT.H} Z" fill="${sh(hillC, -0.05)}" opacity="0.55"/>`),
    (terr === "mountains" || terr === "tundra") &&
      (s += `<path d="M-10 ${ground - 60} L40 ${ground - 150} L70 ${ground - 110} L110 ${ground - 170} L160 ${ground - 90} L210 ${ground - 130} L210 ${ground - 40} Z" fill="${sh(hillC, 0.06)}" opacity="0.5"/><path d="M40 ${ground - 150} L52 ${ground - 128} L30 ${ground - 132} Z M110 ${ground - 170} L124 ${ground - 146} L98 ${ground - 150} Z" fill="#eef" opacity="0.6"/>`),
    terr === "forest")
  )
    for (let i = 0; i < 6; i++) {
      const tx = 12 + i * 36,
        ty = ground - 72 - (i % 2) * 10;
      s += `<path d="M${tx} ${ty - 40} L${tx + 14} ${ty} L${tx - 14} ${ty} Z" fill="#23392a" opacity="0.6"/>`;
    }
  if (terr === "desert")
    s += `<path d="M0 ${ground - 40} Q50 ${ground - 60} 100 ${ground - 44} T200 ${ground - 50} L200 ${ground} L0 ${ground} Z" fill="#c8a670" opacity="0.5"/>`;
  s += `<rect x="0" y="${ground - 6}" width="200" height="${PORTRAIT.H - ground + 6}" fill="${sh(hillC, -0.25)}" opacity="0.75"/>`;
  if (arms.h || (p.mil && p.mil.rank >= 4) || p.ruler) {
    s += `<line x1="172" y1="22" x2="172" y2="${ground - 4}" stroke="#4a3a28" stroke-width="2.4"/><circle cx="172" cy="21" r="2.6" fill="${gold}"/>`;
    s += `<path d="M172 30 L142 30 L142 74 L157 66 L172 74 Z" fill="${arms.f}" stroke="${sh(arms.f, -0.35)}" stroke-width="1" opacity="0.92"/>${PORTRAIT.device(arms, 157, 48, 0.9)}`;
  }
  s += `<ellipse cx="${cx}" cy="${ground + 1}" rx="${Math.max(shW, hipW) * 1.3}" ry="5" fill="#000" opacity="0.32"/>`;
  s += `<g ${p.alive ? "" : `filter="url(#${id}dead)"`}>`;
  const cloakOn = !child && (Cl || out.fur || out.kind === "royal" || (p.mil && p.mil.rank >= 6)),
    cloakC =
      Cl && Cl.look === "finecloak"
        ? arms.f
        : Cl && Cl.look === "furcloak"
          ? "#5a4632"
          : out.fur || out.kind === "royal"
            ? sh(arms.f, -0.05)
            : Cl
              ? sh(out.main, -0.2)
              : sh(arms.f, -0.1);
  if (cloakOn && (!Cl || Cl.look !== "tabard"))
    s += `<path d="M${cx - shW - 4} ${shY + 2} Q${cx - shW - 22} ${hipY + 30} ${cx - shW - 18} ${ground - 8} L${cx + shW + 18} ${ground - 8} Q${cx + shW + 22} ${hipY + 30} ${cx + shW + 4} ${shY + 2} Z" fill="${cloakC}" stroke="${sh(cloakC, -0.3)}" stroke-width="1"/><path d="M${cx - shW - 10} ${hipY} Q${cx - shW - 14} ${ground - 40} ${cx - shW - 12} ${ground - 10} M${cx + shW + 10} ${hipY} Q${cx + shW + 14} ${ground - 40} ${cx + shW + 12} ${ground - 10}" stroke="${sh(cloakC, -0.25)}" stroke-width="2" fill="none" opacity="0.6"/>`;
  const hs = ap.hstyle || "short";
  if (
    ["long", "braided", "wild", "locks", "curly"].includes(hs) &&
    !kid &&
    !(He && ["greathelm", "bascinet", "dwarfhelm"].includes(He.look))
  ) {
    const hw2 = headW * 0.55,
      down = shY + headH * (hs === "long" || hs === "locks" ? 1.1 : 0.7);
    s += `<path d="M${cx - hw2} ${hcY - headH * 0.2} Q${cx - hw2 * 1.35} ${chinY} ${cx - hw2 * 1.2} ${down} Q${cx} ${down + headH * 0.18} ${cx + hw2 * 1.2} ${down} Q${cx + hw2 * 1.35} ${chinY} ${cx + hw2} ${hcY - headH * 0.2} Z" fill="${sh(hair, -0.12)}"/>`;
  }
  if (Rg && ["bow"].includes(Rg.kind) && !child)
    s += `<g transform="rotate(-18 ${cx + shW * 0.4} ${shY})"><rect x="${cx + shW * 0.2}" y="${shY - headH * 0.6}" width="${armW * 1.3}" height="${torsoL * 0.95}" rx="2" fill="url(#${id}lth)" stroke="${leatherD}"/>${[0, 1, 2, 3].map(i => `<path d="M${cx + shW * 0.2 + 2 + i * armW * 0.3} ${shY - headH * 0.6} l0 -9 l-2 -3 m2 3 l2 -3" stroke="#d8d0b8" stroke-width="1.2" fill="none"/>`).join("")}</g>`;
  if (W.twoHand) ["polearm", "pike"].includes(W.kind);
  const boots =
      aLook === "plate" || aLook === "mailplate" || aLook === "dwarfplate"
        ? "plate"
        : out.kind === "rags" || (out.kind === "peasant" && !g.mount)
          ? "wraps"
          : "boots",
    bootTop =
      ground -
      legL * (boots === "plate" ? 0.55 : out.kind === "noble" || out.kind === "royal" || g.mount ? 0.42 : 0.24),
    limp = (p.wounds || []).some(w => w.k === "limp" || w.k === "bad_knee");
  for (const side of [-1, 1]) {
    const lx = cx + side * hipW * 0.48,
      fx = cx + side * hipW * (0.55 + (limp && side === 1 ? 0.1 : 0));
    s += `<path d="M${lx - legW * 0.55} ${hipY - 4} L${lx + legW * 0.55} ${hipY - 4} L${fx + legW * 0.42} ${ground - 6} L${fx - legW * 0.42} ${ground - 6} Z" fill="${aLook === "robes" || out.kind === "priest" ? clothD : hose}" stroke="${sh(hose, -0.3)}" stroke-width="0.8"/>`;
    if (boots === "plate")
      s += `<path d="M${(lx + fx) / 2 - legW * 0.5} ${bootTop} L${(lx + fx) / 2 + legW * 0.5} ${bootTop} L${fx + legW * 0.5} ${ground - 5} L${fx - legW * 0.5} ${ground - 5} Z" fill="url(#${id}met)" stroke="${metalD}"/><ellipse cx="${(lx + fx) / 2}" cy="${kneeY}" rx="${legW * 0.55}" ry="${legW * 0.45}" fill="url(#${id}met)" stroke="${metalD}"/>`;
    else {
      if (boots === "boots")
        s += `<path d="M${fx - legW * 0.5} ${bootTop} L${fx + legW * 0.5} ${bootTop} L${fx + legW * 0.5} ${ground - 5} L${fx - legW * 0.5} ${ground - 5} Z" fill="${leatherD}" stroke="#20160e"/><path d="M${fx - legW * 0.5} ${bootTop + 2} L${fx + legW * 0.5} ${bootTop + 2}" stroke="${leather}" stroke-width="2"/>`;
      else
        s += `<path d="M${fx - legW * 0.45} ${ground - legL * 0.2} L${fx + legW * 0.45} ${ground - legL * 0.2} L${fx + legW * 0.45} ${ground - 5} L${fx - legW * 0.45} ${ground - 5} Z" fill="#a8977a" stroke="#6a5c46" stroke-width="0.8"/><path d="M${fx - legW * 0.45} ${ground - legL * 0.16} l${legW * 0.9} 4 M${fx - legW * 0.45} ${ground - legL * 0.09} l${legW * 0.9} 4" stroke="#6a5c46" stroke-width="0.8"/>`;
    }
    s += `<path d="M${fx - legW * 0.55} ${ground - 6} L${fx + legW * 0.55 + side * 4} ${ground - 6} Q${fx + legW * 0.6 + side * 5} ${ground} ${fx + side * 2} ${ground} L${fx - legW * 0.55} ${ground} Z" fill="${boots === "plate" ? metalD : boots === "boots" ? "#2b1d12" : "#5a4a36"}"/>`;
  }
  const longGarb =
      aLook === "robes" ||
      out.kind === "priest" ||
      (F && ["noble", "royal", "merchant"].includes(out.kind) && aLook === "none"),
    skirtY = longGarb ? ground - 10 : hipY + headH * (child ? 0.5 : 0.75),
    torso = `M${cx - shW} ${shY + 3} Q${cx} ${shY - headH * 0.12} ${cx + shW} ${shY + 3} L${cx + waistW} ${waistY} L${cx + hipW * (longGarb ? 1.25 : 1.05)} ${skirtY} L${cx - hipW * (longGarb ? 1.25 : 1.05)} ${skirtY} L${cx - waistW} ${waistY} Z`;
  s += `<path d="${torso}" fill="url(#${id}cl)" stroke="${sh(cloth, -0.35)}" stroke-width="1"/>`;
  if (out.apron && aLook === "none")
    s += `<path d="M${cx - waistW * 0.8} ${waistY - 6} L${cx + waistW * 0.8} ${waistY - 6} L${cx + hipW * 0.9} ${skirtY - 2} L${cx - hipW * 0.9} ${skirtY - 2} Z" fill="#8a7458" stroke="#5a4a36"/>`;
  if (out.kind === "priest")
    s += `<path d="M${cx - 5} ${shY} L${cx + 5} ${shY} L${cx + 6} ${skirtY} L${cx - 6} ${skirtY} Z" fill="${trim}"/>`;
  if (out.kind === "rags")
    s += `<path d="M${cx - hipW} ${skirtY} l6 -8 l5 8 l6 -9 l6 9 l7 -7 l5 7 M${cx - shW * 0.4} ${waistY - 10} l5 6 l-6 2" stroke="${sh(cloth, -0.4)}" stroke-width="1.4" fill="none"/>`;
  if (["noble", "royal"].includes(out.kind) && aLook === "none")
    s += `<path d="M${cx - hipW * (longGarb ? 1.25 : 1.05)} ${skirtY} L${cx + hipW * (longGarb ? 1.25 : 1.05)} ${skirtY}" stroke="${trim}" stroke-width="3"/><path d="M${cx} ${shY + 4} L${cx} ${skirtY}" stroke="${trim}" stroke-width="1.5" stroke-dasharray="1 5"/>`;
  const chest = `M${cx - shW * 0.96} ${shY + 4} Q${cx} ${shY - headH * 0.08} ${cx + shW * 0.96} ${shY + 4} L${cx + waistW * 0.98} ${waistY} L${cx + hipW * 1.02} ${hipY + headH * 0.35} L${cx - hipW * 1.02} ${hipY + headH * 0.35} L${cx - waistW * 0.98} ${waistY} Z`,
    armorFill = {
      padded: `url(#${id}quilt)`,
      leather: `url(#${id}lth)`,
      mail: `url(#${id}mail)`,
      dwarfmail: `url(#${id}mail)`,
      scale: `url(#${id}scale)`,
      lamellar: `url(#${id}lam)`,
      elfmail: `url(#${id}leaf)`,
      hide: `url(#${id}hide)`,
      orcmail: `url(#${id}hide)`,
      brigandine: sh(arms.f, -0.15),
      mailplate: `url(#${id}mail)`,
      plate: `url(#${id}met)`,
      dwarfplate: `url(#${id}mail)`,
    }[aLook];
  if (armorFill && aLook !== "robes") {
    if (
      ((s += `<path d="${chest}" fill="${armorFill}" stroke="${aLook === "leather" || aLook === "hide" || aLook === "orcmail" ? leatherD : metalD}" stroke-width="1.1"/>`),
      aLook === "brigandine")
    ) {
      for (let r = 0; r < 6; r++)
        for (let c = -3; c <= 3; c++)
          s += `<circle cx="${cx + c * shW * 0.24}" cy="${shY + 10 + r * torsoL * 0.15}" r="0.9" fill="${gold}"/>`;
      s += `<path d="M${cx} ${shY + 2} L${cx} ${hipY + headH * 0.3}" stroke="${sh(arms.f, -0.4)}" stroke-width="1"/>`;
    }
    if (
      (aLook === "leather" &&
        (s += `<path d="M${cx - shW * 0.7} ${shY + torsoL * 0.35} Q${cx} ${shY + torsoL * 0.45} ${cx + shW * 0.7} ${shY + torsoL * 0.35} M${cx - shW * 0.65} ${shY + torsoL * 0.62} Q${cx} ${shY + torsoL * 0.72} ${cx + shW * 0.65} ${shY + torsoL * 0.62}" stroke="${leatherD}" stroke-width="1.2" fill="none" stroke-dasharray="2 2"/>`),
      (aLook === "mailplate" || aLook === "dwarfplate") &&
        (s += `<path d="M${cx - shW * 0.72} ${shY + 8} Q${cx} ${shY + 2} ${cx + shW * 0.72} ${shY + 8} L${cx + waistW * 0.86} ${waistY - 2} Q${cx} ${waistY + 6} ${cx - waistW * 0.86} ${waistY - 2} Z" fill="url(#${id}met)" stroke="${metalD}"/><path d="M${cx} ${shY + 6} L${cx} ${waistY + 2}" stroke="${metalL}" stroke-width="1.2"/>${aLook === "dwarfplate" ? `<path d="M${cx - shW * 0.72} ${shY + 8} Q${cx} ${shY + 2} ${cx + shW * 0.72} ${shY + 8}" stroke="${gold}" stroke-width="2.4" fill="none"/>` : ""}`),
      aLook === "plate")
    ) {
      s += `<path d="M${cx} ${shY + 4} L${cx} ${waistY}" stroke="${metalL}" stroke-width="1.4"/>`;
      for (let i = 0; i < 4; i++) {
        const y = waistY + i * headH * 0.12;
        s += `<path d="M${cx - waistW - i * 2} ${y} Q${cx} ${y + 5} ${cx + waistW + i * 2} ${y}" stroke="${metalD}" stroke-width="1.2" fill="none"/>`;
      }
      s += `<path d="M${cx - shW * 0.5} ${shY + 12} Q${cx - shW * 0.2} ${shY + torsoL * 0.4} ${cx - shW * 0.45} ${waistY - 6}" stroke="#fff" stroke-width="2" opacity="0.35" fill="none"/>`;
    }
    if (aLook === "orcmail")
      for (let i = 0; i < 3; i++)
        s += `<path d="M${cx - shW * 0.6 + i * shW * 0.5} ${shY + 10} q4 ${torsoL * 0.2} 0 ${torsoL * 0.38}" stroke="#ece2c8" stroke-width="3" stroke-linecap="round" fill="none"/>`;
    if (aLook === "elfmail")
      s += `<path d="M${cx - shW * 0.96} ${shY + 4} Q${cx} ${shY - headH * 0.08} ${cx + shW * 0.96} ${shY + 4}" stroke="#d6e3d2" stroke-width="1.6" fill="none"/>`;
    if (aLook === "dwarfmail" || aLook === "dwarfplate")
      s += `<path d="M${cx - hipW * 1.02} ${hipY + headH * 0.35} L${cx + hipW * 1.02} ${hipY + headH * 0.35}" stroke="${gold}" stroke-width="2.4"/>`;
  }
  if (aLook === "robes")
    s += `<path d="M${cx - shW * 0.9} ${shY + 6} Q${cx} ${shY + torsoL * 0.4} ${cx + shW * 0.9} ${shY + 6}" stroke="${gold}" stroke-width="2" fill="none"/>`;
  if (
    !child &&
    ((Cl && Cl.look === "tabard") ||
      (["mail", "mailplate", "scale", "brigandine", "dwarfmail"].includes(aLook) &&
        (arms.h || out.kind === "noble" || out.kind === "royal" || (p.mil && p.mil.rank >= 4))))
  ) {
    s += `<path d="M${cx - shW * 0.62} ${shY + 6} L${cx + shW * 0.62} ${shY + 6} L${cx + waistW * 0.78} ${waistY} L${cx + hipW * 0.82} ${skirtY + 4} L${cx} ${skirtY - 2} L${cx - hipW * 0.82} ${skirtY + 4} L${cx - waistW * 0.78} ${waistY} Z" fill="${arms.f}" stroke="${sh(arms.f, -0.35)}" stroke-width="1"/>`;
    s += PORTRAIT.device(arms, cx, shY + torsoL * 0.42, Math.max(0.8, shW / 22));
  }
  if (!longGarb || aLook !== "none") {
    s += `<path d="M${cx - waistW * 1.02} ${waistY + 1} Q${cx} ${waistY + 5} ${cx + waistW * 1.02} ${waistY + 1} L${cx + waistW * 1.02} ${waistY + 5} Q${cx} ${waistY + 9} ${cx - waistW * 1.02} ${waistY + 5} Z" fill="#3a2716"/><rect x="${cx - 3.5}" y="${waistY + 1.5}" width="7" height="6" rx="1" fill="none" stroke="${["noble", "royal"].includes(out.kind) ? gold : "#a89070"}" stroke-width="1.6"/>`;
    if (!child)
      s += `<path d="M${cx + waistW * 0.55} ${waistY + 6} l3 ${headH * 0.28} l6 0 l-1 ${-headH * 0.28} Z" fill="${leather}" stroke="${leatherD}"/>`;
    if (W.kind === "sword" || W.kind === "dagger")
      s += `<path d="M${cx - waistW * 0.9} ${waistY + 4} L${cx - waistW * 1.4} ${hipY + headH * 1.2}" stroke="#2a1d14" stroke-width="${W.kind === "dagger" ? 3 : 4.4}" stroke-linecap="round"/>`;
  }
  if (out.kind === "merchant" && !child)
    s += `<circle cx="${cx - waistW * 0.5}" cy="${waistY + headH * 0.35}" r="${headH * 0.16}" fill="#7a5a32" stroke="#4a3420"/><path d="M${cx - waistW * 0.62} ${waistY + headH * 0.2} l${headH * 0.24} 0" stroke="${gold}" stroke-width="1.4"/>`;
  const sleeve = ["plate", "mailplate", "dwarfplate"].includes(aLook)
      ? `url(#${id}met)`
      : ["mail", "dwarfmail"].includes(aLook)
        ? `url(#${id}mail)`
        : aLook === "scale"
          ? `url(#${id}scale)`
          : aLook === "lamellar"
            ? `url(#${id}lam)`
            : aLook === "elfmail"
              ? `url(#${id}leaf)`
              : aLook === "padded"
                ? `url(#${id}quilt)`
                : aLook === "leather"
                  ? `url(#${id}lth)`
                  : aLook === "hide" || aLook === "orcmail"
                    ? `url(#${id}hide)`
                    : `url(#${id}cl)`,
    lostHand = (p.wounds || []).some(w => w.k === "lost_hand"),
    armPath = (sx, ex, ey, hx, hy) =>
      `M${sx - armW * 0.6} ${shY + 2} Q${sx - armW} ${(shY + ey) / 2} ${ex - armW * 0.6} ${ey} L${hx - armW * 0.5} ${hy - 3} L${hx + armW * 0.5} ${hy - 3} L${ex + armW * 0.6} ${ey} Q${sx + armW * 0.6} ${(shY + ey) / 2} ${sx + armW * 0.7} ${shY + 6} Z`,
    rS = cx - shW + armW * 0.25,
    lS = cx + shW - armW * 0.25;
  if (
    ((s += `<path d="${armPath(rS, cx - shW - armW * 0.2, elbowY, rH.x, rH.y)}" fill="${sleeve}" stroke="${sh(cloth, -0.4)}" stroke-width="0.9"/>`),
    (s += `<path d="${armPath(lS, cx + shW + armW * 0.4, elbowY - headH * 0.1, lH.x, lH.y)}" fill="${sleeve}" stroke="${sh(cloth, -0.4)}" stroke-width="0.9"/>`),
    ["plate", "mailplate", "dwarfplate"].includes(aLook) || ["mail", "scale", "lamellar", "brigandine"].includes(aLook))
  )
    for (const [x, y] of [
      [cx - shW, shY + 6],
      [cx + shW, shY + 6],
    ])
      s += `<ellipse cx="${x}" cy="${y}" rx="${armW * 1.05}" ry="${armW * 0.8}" fill="url(#${id}met)" stroke="${metalD}"/>`;
  s += PORTRAIT.weapon(W, rH, headH, child, id, arms);
  const hand = (x, y) =>
    `<ellipse cx="${x}" cy="${y}" rx="${armW * 0.55}" ry="${armW * 0.62}" fill="${["plate", "mailplate", "dwarfplate"].includes(aLook) ? metal : skin}" stroke="${skLine}" stroke-width="0.8"/>`;
  s += hand(rH.x, rH.y);
  if (lostHand)
    s += `<path d="M${lH.x} ${lH.y - 2} q6 2 4 8 q-2 4 -6 1" stroke="#9aa0a8" stroke-width="2" fill="none"/>`;
  const neckW = headW * (race === "orc" || race === "giant" || race === "dwarf" ? 0.42 : 0.32);
  if (
    ((s += `<path d="M${cx - neckW} ${chinY - headH * 0.2} L${cx - neckW} ${shY + 3} Q${cx} ${shY + 7} ${cx + neckW} ${shY + 3} L${cx + neckW} ${chinY - headH * 0.2} Z" fill="${skD}"/>`),
    ["mail", "mailplate", "dwarfmail", "scale"].includes(aLook) &&
      !He &&
      (s += `<path d="M${cx - neckW * 1.6} ${shY + 3} Q${cx} ${shY + 10} ${cx + neckW * 1.6} ${shY + 3} L${cx + neckW * 1.3} ${chinY - 2} Q${cx} ${chinY + 3} ${cx - neckW * 1.3} ${chinY - 2} Z" fill="url(#${id}mail)" stroke="${metalD}" stroke-width="0.6"/>`),
    out.fur && !child
      ? (s += `<path d="M${cx - shW * 1.02} ${shY + 4} Q${cx} ${shY + headH * 0.55} ${cx + shW * 1.02} ${shY + 4} Q${cx} ${shY - headH * 0.12} ${cx - shW * 1.02} ${shY + 4} Z" fill="url(#${id}fur)" stroke="#bdb39e"/>`)
      : cloakOn && Cl && Cl.look === "furcloak"
        ? (s += `<path d="M${cx - shW * 1.05} ${shY + 3} Q${cx} ${shY + headH * 0.4} ${cx + shW * 1.05} ${shY + 3} Q${cx} ${shY - 4} ${cx - shW * 1.05} ${shY + 3} Z" fill="#8a6a4a" stroke="#5a4632"/>`)
        : cloakOn &&
          (s += `<circle cx="${cx - shW * 0.7}" cy="${shY + 5}" r="${Math.max(2.4, headH * 0.09)}" fill="${gold}" stroke="#6a5014"/>`),
    (s += PORTRAIT.head(p, {
      cx,
      cy: hcY,
      headW,
      headH,
      skin,
      skD,
      skL,
      skLine,
      hair,
      eye,
      id,
      child,
      kid,
      oldF,
      veryOld,
      race,
      F,
      He,
      out,
      arms,
    })),
    Sh && !W.twoHand && !child
      ? (s += PORTRAIT.shieldArt(Sh, lH, headH, shW, arms, id))
      : Rg && !child && (!Sh || W.twoHand) && (s += PORTRAIT.rangedArt(Rg, lH, headH, id)),
    !(Sh && !W.twoHand && !child) && !lostHand && (s += hand(lH.x, lH.y)),
    p.mil && p.mil.rank >= 2 && !child)
  ) {
    const n = Math.min(5, Math.ceil(p.mil.rank / 2));
    for (let i = 0; i < n; i++)
      s += `<path d="M${cx + shW * 0.35 + i * 5} ${shY + 10} l2 3 l-2 3 l-2 -3 Z" fill="${gold}" stroke="#5a4210" stroke-width="0.4"/>`;
  }
  s += "</g>";
  s += `</g><rect x="1.5" y="1.5" width="197" height="${PORTRAIT.H - 3}" rx="14" fill="none" stroke="${sh(bg, -0.5)}" stroke-width="3"/>`;
  if (!p.alive) s += '<path d="M168 16 l18 0 M177 7 l0 24" stroke="#ddd" stroke-width="3"/>';
  return s + "</svg>";
};

PORTRAIT.head = function (p, o) {
  const {
      cx,
      cy,
      headW: hw0,
      headH: hh0,
      skin,
      skD,
      skLine,
      hair,
      eye,
      id,
      child,
      kid,
      oldF,
      veryOld,
      race,
      F,
      He,
      out,
      arms,
    } = o,
    sh = PORTRAIT.shade,
    ap = p.app,
    hw = hw0 / 2,
    hh = hh0 / 2,
    top = cy - hh,
    bot = cy + hh,
    jaw =
      {
        dwarf: 0.95,
        orc: 1,
        giant: 0.98,
        elf: 0.68,
        halforc: 0.9,
        halfelf: 0.74,
      }[race] || (F ? 0.72 : 0.82),
    faceK = [0, 0.05, -0.05, 0.1][ap.face || 0] || 0,
    jw = hw * (jaw + faceK),
    u = hh0 / 60;
  let s = "";
  const full = He && ["greathelm", "bascinet", "dwarfhelm"].includes(He.look) && !child && !He.visorUp,
    earY = cy + hh * 0.05;
  if (race === "elf" || race === "halfelf") {
    const len = (race === "elf" ? 16 : 9) * u;
    for (const sd of [-1, 1])
      s += `<path d="M${cx + sd * (hw - 1)} ${earY - 3 * u} L${cx + sd * (hw + len)} ${earY - (12 + len / 2) * u} L${cx + sd * (hw - 1)} ${earY + 8 * u} Z" fill="${skin}" stroke="${skD}" stroke-width="0.8"/>`;
  } else {
    const ew = (race === "orc" || race === "giant" ? 6.5 : 5) * u,
      earMissing = (p.wounds || []).some(w => w.k === "ear");
    s += `<ellipse cx="${cx - hw + 0.5}" cy="${earY + 3 * u}" rx="${ew}" ry="${ew * 1.45}" fill="${skin}" stroke="${skD}"/>`;
    if (!earMissing)
      s += `<ellipse cx="${cx + hw - 0.5}" cy="${earY + 3 * u}" rx="${ew}" ry="${ew * 1.45}" fill="${skin}" stroke="${skD}"/>`;
    if (ap.jewel === "earring" || ap.jewel === "earrings")
      s += `<circle cx="${cx - hw}" cy="${earY + ew * 1.8}" r="${1.6 * u}" fill="none" stroke="#d4b14a" stroke-width="${0.9 * u}"/>`;
  }
  const head = `M${cx - hw} ${cy - 3 * u} C${cx - hw} ${top - 4 * u}, ${cx + hw} ${top - 4 * u}, ${cx + hw} ${cy - 3 * u} C${cx + hw} ${cy + hh * 0.45}, ${cx + jw} ${bot - 4 * u}, ${cx} ${bot} C${cx - jw} ${bot - 4 * u}, ${cx - hw} ${cy + hh * 0.45}, ${cx - hw} ${cy - 3 * u} Z`;
  s += `<path d="${head}" fill="url(#${id}sk)" stroke="${sh(skin, -0.25)}" stroke-width="1"/>`;
  if (race === "orc" || race === "giant" || race === "halforc")
    s += `<path d="M${cx - hw * 0.8} ${cy - 12 * u} Q${cx} ${cy - 19 * u} ${cx + hw * 0.8} ${cy - 12 * u} Q${cx} ${cy - 9 * u} ${cx - hw * 0.8} ${cy - 12 * u} Z" fill="${skD}" opacity="0.65"/>`;
  const paint = ap.paint || "none";
  if (
    (paint === "warpaint" &&
      (s += `<path d="M${cx - hw * 0.85} ${cy - 2 * u} L${cx + hw * 0.85} ${cy - 2 * u} L${cx + hw * 0.8} ${cy + 4 * u} L${cx - hw * 0.8} ${cy + 4 * u} Z" fill="${arms.f}" opacity="0.55"/>`),
    paint === "tribal" &&
      (s += `<path d="M${cx - hw * 0.6} ${cy + 6 * u} l${4 * u} ${8 * u} m${4 * u} ${-8 * u} l${4 * u} ${8 * u} M${cx + hw * 0.6} ${cy + 6 * u} l${-4 * u} ${8 * u} m${-4 * u} ${-8 * u} l${-4 * u} ${8 * u}" stroke="#23324a" stroke-width="${1.4 * u}" opacity="0.8"/>`),
    paint === "runes" &&
      (s += `<path d="M${cx} ${top + 8 * u} l0 ${8 * u} m${-3 * u} ${-5 * u} l${6 * u} 0 M${cx - hw * 0.55} ${cy + 10 * u} l${3 * u} ${-4 * u} l${3 * u} ${4 * u}" stroke="#2a4a7a" stroke-width="${1.2 * u}" fill="none" opacity="0.85"/>`),
    paint === "dots")
  )
    for (let i = 0; i < 5; i++)
      s += `<circle cx="${cx - 6 * u + i * 3 * u}" cy="${bot - 6 * u}" r="${0.9 * u}" fill="#3a2a2a" opacity="0.8"/>`;
  if (
    (paint === "stripes" &&
      (s += `<path d="M${cx - hw * 0.75} ${cy + 2 * u} l${8 * u} ${3 * u} M${cx - hw * 0.75} ${cy + 7 * u} l${8 * u} ${3 * u} M${cx + hw * 0.75} ${cy + 2 * u} l${-8 * u} ${3 * u} M${cx + hw * 0.75} ${cy + 7 * u} l${-8 * u} ${3 * u}" stroke="#8a2a20" stroke-width="${1.8 * u}" opacity="0.75"/>`),
    ap.freckles || (p.quirks || []).includes("freckled"))
  )
    for (let i = 0; i < 9; i++)
      s += `<circle cx="${cx + (i % 2 ? 1 : -1) * (4 + ((i * 3) % 10)) * u}" cy="${cy + (3 + (i % 3) * 2) * u}" r="${0.6 * u}" fill="${sh(skin, -0.3)}" opacity="0.7"/>`;
  const eyeY = cy - 3 * u,
    eyeX = hw * 0.42,
    eyeR = (child ? 4.6 : race === "elf" ? 3.9 : 3.8) * u,
    blind = (p.wounds || []).some(w => w.k === "lost_eye"),
    shape = ap.eyeShape || 0;
  if (!full) {
    for (const sd of [-1, 1]) {
      const ex = cx + sd * eyeX;
      if (blind && sd === 1) continue;
      const slant = race === "elf" || shape === 2 ? -1.2 * u * sd * -1 : 0;
      s += `<ellipse cx="${ex}" cy="${eyeY}" rx="${eyeR + 1.8 * u}" ry="${eyeR * (shape === 1 ? 0.75 : 0.95)}" fill="#f2eee4" transform="rotate(${slant * 4} ${ex} ${eyeY})"/>`;
      s += `<circle cx="${ex}" cy="${eyeY + 0.4 * u}" r="${eyeR * 0.62}" fill="${eye}"/><circle cx="${ex}" cy="${eyeY + 0.4 * u}" r="${eyeR * 0.28}" fill="#121212"/><circle cx="${ex + 1.1 * u}" cy="${eyeY - 0.9 * u}" r="${0.8 * u}" fill="#fff"/>`;
      s += `<path d="M${ex - eyeR - 2 * u} ${eyeY - 0.6 * u} Q${ex} ${eyeY - eyeR - 2.4 * u} ${ex + eyeR + 2 * u} ${eyeY - 0.6 * u}" stroke="${skLine}" stroke-width="${1.1 * u}" fill="none"/>`;
      const bt = (ap.brow || 0) * 1.1 * u;
      s += `<path d="M${ex - eyeR - 2.5 * u} ${eyeY - eyeR - 3.5 * u + (sd < 0 ? bt : 0)} Q${ex} ${eyeY - eyeR - 6.5 * u} ${ex + eyeR + 2.5 * u} ${eyeY - eyeR - 3.5 * u + (sd > 0 ? bt : 0)}" stroke="${sh(hair, -0.12)}" stroke-width="${(race === "orc" || race === "dwarf" || race === "giant" ? 2.8 : 1.9) * u}" stroke-linecap="round" fill="none"/>`;
    }
    if (blind)
      s += `<path d="M${cx - hw} ${eyeY - 9 * u} L${cx + hw} ${eyeY - 5 * u}" stroke="#1a1a1a" stroke-width="${1.4 * u}"/><ellipse cx="${cx + eyeX}" cy="${eyeY}" rx="${eyeR + 3 * u}" ry="${eyeR + 1.6 * u}" fill="#1a1a1a"/>`;
    const broke = (p.wounds || []).some(w => w.k === "broken_nose"),
      nl =
        (race === "dwarf" ? 13 : race === "orc" ? 9 : race === "giant" ? 12 : 10.5) * u * (1 + (ap.nose || 0) * 0.12),
      nw =
        (race === "dwarf" || race === "orc" || race === "giant" ? 6 : race === "elf" ? 3 : 4.5) *
        u *
        (1 + (ap.nose || 0) * 0.15);
    s += `<path d="M${cx - 0.6 * u} ${eyeY + 2 * u} ${broke ? `L${cx + 2.5 * u} ${eyeY + nl * 0.5}` : ""} L${cx - 0.6 * u + (broke ? 1.5 * u : 0)} ${eyeY + nl} Q${cx} ${eyeY + nl + 3 * u} ${cx + nw} ${eyeY + nl}" stroke="${sh(skin, -0.3)}" stroke-width="${1.4 * u}" fill="none" stroke-linecap="round"/>`;
    if (race === "orc" || race === "halforc")
      s += `<ellipse cx="${cx - 3 * u}" cy="${eyeY + nl + 0.8 * u}" rx="${1.6 * u}" ry="${1.1 * u}" fill="${sh(skin, -0.38)}"/><ellipse cx="${cx + 3 * u}" cy="${eyeY + nl + 0.8 * u}" rx="${1.6 * u}" ry="${1.1 * u}" fill="${sh(skin, -0.38)}"/>`;
    if (ap.jewel === "nosering")
      s += `<circle cx="${cx + 2.4 * u}" cy="${eyeY + nl + 1.5 * u}" r="${1.3 * u}" fill="none" stroke="#d4b14a" stroke-width="${0.8 * u}"/>`;
    const my = eyeY + nl + (child ? 9 : 11) * u,
      mw = ((child ? 6.5 : 8.5) + (ap.mouth || 0) * 1.5) * u,
      lip = F ? "#a95656" : sh(skin, -0.27),
      happy = p.happy != null ? (p.happy - 50) / 50 : 0;
    s += `<path d="M${cx - mw} ${my} Q${cx} ${my + (3 + happy * 3) * u} ${cx + mw} ${my}" stroke="${lip}" stroke-width="${(F ? 2.3 : 1.7) * u}" fill="none" stroke-linecap="round"/>`;
    if (race === "orc")
      s += `<path d="M${cx - mw + 1.5 * u} ${my + 0.8 * u} l${-1.6 * u} ${-7.5 * u} l${3.8 * u} ${6.8 * u} Z M${cx + mw - 1.5 * u} ${my + 0.8 * u} l${1.6 * u} ${-7.5 * u} l${-3.8 * u} ${6.8 * u} Z" fill="#efe6cf" stroke="#bdb196" stroke-width="0.6"/>`;
    if (race === "halforc")
      s += `<path d="M${cx - mw + 2 * u} ${my + 0.8 * u} l${-0.8 * u} ${-4 * u} l${2.4 * u} ${4 * u} Z M${cx + mw - 2 * u} ${my + 0.8 * u} l${0.8 * u} ${-4 * u} l${-2.4 * u} ${4 * u} Z" fill="#efe6cf"/>`;
    if (oldF > 0.2)
      s += `<path d="M${cx - eyeX - 9 * u} ${eyeY + 1.5 * u} l${-3 * u} ${2 * u} M${cx + eyeX + 9 * u} ${eyeY + 1.5 * u} l${3 * u} ${2 * u} M${cx - mw - 4 * u} ${my - 7 * u} q${-2 * u} ${6 * u} 0 ${10 * u} M${cx + mw + 4 * u} ${my - 7 * u} q${2 * u} ${6 * u} 0 ${10 * u}" stroke="${sh(skin, -0.32)}" stroke-width="${0.9 * u}" opacity="${Math.min(0.75, oldF)}" fill="none"/>`;
    if (child || F)
      s += `<circle cx="${cx - hw * 0.55}" cy="${my - 6 * u}" r="${4.5 * u}" fill="#e07070" opacity="0.14"/><circle cx="${cx + hw * 0.55}" cy="${my - 6 * u}" r="${4.5 * u}" fill="#e07070" opacity="0.14"/>`;
    const marks = new Set((p.wounds || []).map(w => (GD.WOUNDS[w.k] || {}).mark).filter(Boolean));
    if (marks.has("faceScar") || (p.quirks || []).includes("scarred"))
      s += `<path d="M${cx - hw * 0.62} ${eyeY - 13 * u} L${cx - hw * 0.12} ${my + 3 * u}" stroke="#9a4444" stroke-width="${1.6 * u}" opacity="0.8"/><path d="M${cx - hw * 0.5} ${eyeY - 7 * u} l${4 * u} ${-1.5 * u} M${cx - hw * 0.36} ${eyeY + 3 * u} l${4 * u} ${-1.5 * u}" stroke="#9a4444" stroke-width="${0.9 * u}" opacity="0.7"/>`;
    if (marks.has("burn"))
      s += `<path d="M${cx + hw * 0.2} ${eyeY + 7 * u} q${10 * u} ${-4 * u} ${16 * u} ${6 * u} q${-3 * u} ${10 * u} ${-13 * u} ${7 * u} z" fill="#b0605a" opacity="0.45"/>`;
    if (marks.has("brand"))
      s += `<circle cx="${cx + hw * 0.55}" cy="${my - 4 * u}" r="${3.2 * u}" fill="none" stroke="#7a2a2a" stroke-width="${1.2 * u}"/>`;
    if ((p.quirks || []).includes("birthmark"))
      s += `<ellipse cx="${cx + hw * 0.5}" cy="${cy - 10 * u}" rx="${4 * u}" ry="${2.6 * u}" fill="#8a3040" opacity="0.4"/>`;
    const beard = F || child ? "none" : ap.beard,
      bc = sh(hair, -0.05);
    if (
      (beard === "stubble" &&
        (s += `<path d="M${cx - jw} ${cy + hh * 0.3} C${cx - jw} ${bot - 1}, ${cx + jw} ${bot - 1}, ${cx + jw} ${cy + hh * 0.3}" stroke="${bc}" stroke-width="${5 * u}" opacity="0.25" fill="none"/>`),
      ["short", "full", "long", "braided", "forked", "goatee", "muttonchops"].includes(beard))
    ) {
      const blen =
        ({
          short: 6,
          full: 12,
          long: 26,
          braided: 30,
          forked: 24,
          goatee: 9,
          muttonchops: 0,
        }[beard] +
          (race === "dwarf" ? 14 : 0)) *
        u;
      if (beard === "goatee")
        s += `<path d="M${cx - mw * 0.6} ${my + 2 * u} Q${cx} ${bot + blen} ${cx + mw * 0.6} ${my + 2 * u} Z" fill="${bc}"/>`;
      else {
        if (beard === "muttonchops")
          s += `<path d="M${cx - hw} ${cy} Q${cx - jw} ${bot - 3 * u} ${cx - mw - 2 * u} ${my} L${cx - hw * 0.7} ${cy} Z M${cx + hw} ${cy} Q${cx + jw} ${bot - 3 * u} ${cx + mw + 2 * u} ${my} L${cx + hw * 0.7} ${cy} Z" fill="${bc}"/>`;
        else
          s += `<path d="M${cx - jw - 1} ${cy + hh * 0.18} Q${cx - jw} ${bot + blen * 0.6} ${cx} ${bot + blen} ${beard === "forked" ? `L${cx + 2 * u} ${bot + blen * 0.7} L${cx + 4 * u} ${bot + blen}` : ""} Q${cx + jw} ${bot + blen * 0.6} ${cx + jw + 1} ${cy + hh * 0.18} Q${cx + mw + 3 * u} ${my + 7 * u} ${cx} ${my + 6 * u} Q${cx - mw - 3 * u} ${my + 7 * u} ${cx - jw - 1} ${cy + hh * 0.18} Z" fill="${bc}"/>`;
      }
      if (beard !== "muttonchops")
        s += `<path d="M${cx - mw - 1.5 * u} ${my - 2.2 * u} Q${cx} ${my - 6.5 * u} ${cx + mw + 1.5 * u} ${my - 2.2 * u}" stroke="${bc}" stroke-width="${3.3 * u}" fill="none" stroke-linecap="round"/>`;
      if (beard === "braided")
        s += `<path d="M${cx} ${bot + 4 * u} L${cx} ${bot + blen - 1}" stroke="${sh(bc, -0.15)}" stroke-width="${2.2 * u}" stroke-dasharray="${3 * u} ${2 * u}"/><circle cx="${cx}" cy="${bot + blen - 1}" r="${2.2 * u}" fill="#c8a24a"/>`;
    }
    if (beard === "mustache")
      s += `<path d="M${cx - mw - 3 * u} ${my + 1 * u} Q${cx - mw * 0.4} ${my - 6 * u} ${cx} ${my - 3 * u} Q${cx + mw * 0.4} ${my - 6 * u} ${cx + mw + 3 * u} ${my + 1 * u}" stroke="${bc}" stroke-width="${3 * u}" fill="none" stroke-linecap="round"/>`;
  }
  const hs = ap.hstyle || "short";
  if (!He || child)
    if ((hs !== "shaved" && hs !== "bald") || child) {
      const vol = (hs === "wild" || hs === "curly" ? 8 : hs === "cropped" ? 1.5 : hs === "mohawk" ? 0 : 4.5) * u;
      if (
        (hs === "mohawk"
          ? (s += `<path d="M${cx - 4 * u} ${cy - 4 * u} Q${cx} ${top - 18 * u} ${cx + 4 * u} ${cy - 4 * u} Z" fill="${hair}"/>`)
          : (s += `<path d="M${cx - hw - 2 * u} ${cy - 1} C${cx - hw - 4 * u} ${top - vol - 6 * u}, ${cx + hw + 4 * u} ${top - vol - 6 * u}, ${cx + hw + 2 * u} ${cy - 1} C${cx + hw - 4 * u} ${top + 9 * u}, ${cx - hw * 0.2} ${top + 4 * u}, ${cx - hw * 0.3} ${top + 13 * u} C${cx - hw * 0.6} ${top + 7 * u}, ${cx - hw + 3 * u} ${top + 10 * u}, ${cx - hw - 2 * u} ${cy - 1} Z" fill="${hair}"/>`),
        hs === "curly")
      )
        for (let i = 0; i < 7; i++)
          s += `<circle cx="${cx - hw + (i * hw) / 3}" cy="${top - vol * 0.4 + (i % 2) * 3 * u}" r="${3.2 * u}" fill="${sh(hair, (i % 2) * 0.05)}"/>`;
      if (
        (hs === "topknot" &&
          (s += `<ellipse cx="${cx}" cy="${top - vol - 3 * u}" rx="${7 * u}" ry="${6 * u}" fill="${hair}"/><path d="M${cx - 4.5 * u} ${top - vol + 1.5 * u} L${cx + 4.5 * u} ${top - vol + 1.5 * u}" stroke="${sh(hair, -0.2)}" stroke-width="${1.8 * u}"/>`),
        hs === "braided" &&
          (s += `<path d="M${cx - hw - 1} ${cy} q${-4 * u} ${22 * u} ${-1.5 * u} ${40 * u} M${cx + hw + 1} ${cy} q${4 * u} ${22 * u} ${1.5 * u} ${40 * u}" stroke="${sh(hair, -0.12)}" stroke-width="${5 * u}" fill="none" stroke-dasharray="${4.5 * u} ${2 * u}"/>`),
        (hs === "tied" || hs === "ponytail") &&
          (s += `<path d="M${cx + hw - 3 * u} ${cy - 15 * u} q${12 * u} ${8 * u} ${7 * u} ${(hs === "ponytail" ? 40 : 28) * u}" stroke="${hair}" stroke-width="${6 * u}" fill="none" stroke-linecap="round"/>`),
        hs === "locks")
      )
        for (let i = 0; i < 6; i++)
          s += `<path d="M${cx + (i < 3 ? -hw - 1 * u + i * 2 * u : hw + 1 * u - (i - 3) * 2 * u)} ${top + 10 * u} q${-2 * u} ${20 * u} ${1 * u} ${36 * u}" stroke="${sh(hair, -0.08)}" stroke-width="${2.8 * u}" fill="none" stroke-linecap="round"/>`;
    } else if (!child)
      s += `<path d="M${cx - hw + 1.5 * u} ${cy - 7 * u} C${cx - hw} ${top - 3 * u}, ${cx + hw} ${top - 3 * u}, ${cx + hw - 1.5 * u} ${cy - 7 * u}" stroke="${sh(hair, 0.1)}" stroke-width="${1.4 * u}" opacity="0.25" fill="none"/>`;
  const met = `url(#${id}met)`,
    mD = "#5d636b";
  if (He && !child) {
    const L = He.look,
      cap = (ext, lowY) =>
        `M${cx - hw - ext} ${lowY} C${cx - hw - ext} ${top - 10 * u - ext}, ${cx + hw + ext} ${top - 10 * u - ext}, ${cx + hw + ext} ${lowY} Z`;
    if (L === "helm" || L === "nasal")
      s += `<path d="${cap(3 * u, cy - 4 * u)}" fill="${met}" stroke="${mD}" stroke-width="1"/><rect x="${cx - 2.2 * u}" y="${cy - 5 * u}" width="${4.4 * u}" height="${15 * u}" fill="${met}" stroke="${mD}" stroke-width="0.8"/>`;
    else if (L === "coif")
      s += `<path d="M${cx - hw - 4 * u} ${bot + 2 * u} C${cx - hw - 6 * u} ${top - 14 * u}, ${cx + hw + 6 * u} ${top - 14 * u}, ${cx + hw + 4 * u} ${bot + 2 * u} L${cx + hw - 1 * u} ${bot - 2 * u} L${cx + hw - 2 * u} ${cy - 8 * u} Q${cx} ${cy - 14 * u} ${cx - hw + 2 * u} ${cy - 8 * u} L${cx - hw + 1 * u} ${bot - 2 * u} Z" fill="url(#${id}mail)" stroke="${mD}" stroke-width="0.8"/>`;
    else if (L === "kettle")
      s += `<path d="${cap(2 * u, cy - 6 * u)}" fill="${met}" stroke="${mD}"/><ellipse cx="${cx}" cy="${cy - 6 * u}" rx="${hw + 11 * u}" ry="${3.6 * u}" fill="${met}" stroke="${mD}"/>`;
    else if (L === "spangen")
      s += `<path d="${cap(3 * u, cy - 4 * u)}" fill="${met}" stroke="${mD}"/><path d="M${cx} ${top - 9 * u} L${cx} ${cy - 4 * u} M${cx - hw * 0.7} ${top + 2 * u} L${cx - hw - 2 * u} ${cy - 4 * u} M${cx + hw * 0.7} ${top + 2 * u} L${cx + hw + 2 * u} ${cy - 4 * u}" stroke="#b08a3a" stroke-width="${2 * u}"/><path d="M${cx - hw * 0.75} ${cy - 4 * u} Q${cx - eyeX} ${cy + 3 * u} ${cx - 1 * u} ${cy - 2 * u} Q${cx + eyeX} ${cy + 3 * u} ${cx + hw * 0.75} ${cy - 4 * u}" stroke="${mD}" stroke-width="${2 * u}" fill="none"/>`;
    else if (L === "horned")
      s += `<path d="${cap(3 * u, cy - 4 * u)}" fill="#6a5a4a" stroke="#3a2e22"/><path d="M${cx - hw} ${cy - 10 * u} Q${cx - hw - 16 * u} ${top - 4 * u} ${cx - hw - 6 * u} ${top - 22 * u} Q${cx - hw - 6 * u} ${top - 4 * u} ${cx - hw + 6 * u} ${top + 6 * u} Z M${cx + hw} ${cy - 10 * u} Q${cx + hw + 16 * u} ${top - 4 * u} ${cx + hw + 6 * u} ${top - 22 * u} Q${cx + hw + 6 * u} ${top - 4 * u} ${cx + hw - 6 * u} ${top + 6 * u} Z" fill="#ece2c8" stroke="#a89878" stroke-width="0.8"/>`;
    else if (L === "turban")
      s += `<path d="M${cx - hw - 4 * u} ${cy - 3 * u} C${cx - hw - 8 * u} ${top - 16 * u}, ${cx + hw + 8 * u} ${top - 16 * u}, ${cx + hw + 4 * u} ${cy - 3 * u} Z" fill="#e8e0cc" stroke="#a8987a"/><path d="M${cx - hw - 2 * u} ${cy - 8 * u} Q${cx} ${top - 4 * u} ${cx + hw + 2 * u} ${cy - 10 * u} M${cx - hw} ${top + 4 * u} Q${cx} ${cy - 2 * u} ${cx + hw} ${top + 2 * u}" stroke="#bfb293" stroke-width="${1.4 * u}" fill="none"/><path d="M${cx} ${top - 11 * u} l0 ${-7 * u}" stroke="${met}" stroke-width="${3 * u}"/><circle cx="${cx}" cy="${cy - 9 * u}" r="${2.6 * u}" fill="${arms.c}"/>`;
    else if (L === "elfhelm")
      s += `<path d="M${cx - hw - 2 * u} ${cy - 2 * u} C${cx - hw - 2 * u} ${top - 8 * u}, ${cx} ${top - 26 * u}, ${cx} ${top - 26 * u} C${cx} ${top - 26 * u}, ${cx + hw + 2 * u} ${top - 8 * u}, ${cx + hw + 2 * u} ${cy - 2 * u} Q${cx} ${cy - 9 * u} ${cx - hw - 2 * u} ${cy - 2 * u} Z" fill="url(#${id}leaf)" stroke="#d6e3d2" stroke-width="0.9"/>`;
    else if (L === "greathelm" || L === "bascinet" || L === "dwarfhelm") {
      const isB = L === "bascinet";
      s += `<path d="M${cx - hw - 4 * u} ${bot + 2 * u} L${cx - hw - 4 * u} ${cy - 6 * u} C${cx - hw - 4 * u} ${top - (isB ? 16 : 8) * u}, ${cx + hw + 4 * u} ${top - (isB ? 16 : 8) * u}, ${cx + hw + 4 * u} ${cy - 6 * u} L${cx + hw + 4 * u} ${bot + 2 * u} Z" fill="${met}" stroke="${mD}" stroke-width="1.1"/>`;
      if (isB)
        s += `<path d="M${cx - hw - 2 * u} ${cy - 6 * u} Q${cx} ${cy + 20 * u} ${cx + hw + 2 * u} ${cy - 6 * u} L${cx} ${cy + 12 * u} Z" fill="${met}" stroke="${mD}"/>`;
      s += `<path d="M${cx - hw * 0.8} ${cy - 3 * u} L${cx + hw * 0.8} ${cy - 3 * u}" stroke="#151515" stroke-width="${2.6 * u}"/>`;
      for (let i = 0; i < 4; i++)
        s += `<circle cx="${cx + 4 * u + (i % 2) * 3 * u}" cy="${cy + 5 * u + Math.floor(i / 2) * 3 * u}" r="${0.8 * u}" fill="#151515"/>`;
      if (L === "greathelm")
        s += `<path d="M${cx} ${top - 6 * u} L${cx} ${bot}" stroke="${mD}" stroke-width="${1.2 * u}"/><path d="M${cx - 10 * u} ${top - 8 * u} Q${cx} ${top - 26 * u} ${cx + 10 * u} ${top - 8 * u}" fill="${arms.f}" stroke="${PORTRAIT.shade(arms.f, -0.3)}"/>`;
      if (L === "dwarfhelm")
        s += `<path d="M${cx - hw - 4 * u} ${bot - 2 * u} Q${cx} ${bot + 14 * u} ${cx + hw + 4 * u} ${bot - 2 * u}" fill="${sh(hair, -0.05)}"/><path d="M${cx - hw - 4 * u} ${cy - 6 * u} L${cx + hw + 4 * u} ${cy - 6 * u}" stroke="#c9a13a" stroke-width="${2 * u}"/>`;
    }
  }
  if (out.crown && !(He && ["greathelm", "bascinet", "dwarfhelm"].includes(He.look)))
    s += `<path d="M${cx - hw * 0.82} ${top + 3 * u} L${cx - hw * 0.82} ${top - 10 * u} L${cx - hw * 0.4} ${top - 3 * u} L${cx} ${top - 14 * u} L${cx + hw * 0.4} ${top - 3 * u} L${cx + hw * 0.82} ${top - 10 * u} L${cx + hw * 0.82} ${top + 3 * u} Z" fill="#d8b24a" stroke="#8a6a1a" stroke-width="0.9"/><circle cx="${cx}" cy="${top - 4 * u}" r="${2.2 * u}" fill="#b0283a"/>`;
  else {
    if (out.circlet && !He)
      s += `<path d="M${cx - hw * 0.92} ${top + 6 * u} Q${cx} ${top - 1 * u} ${cx + hw * 0.92} ${top + 6 * u}" stroke="#d8b24a" stroke-width="${2.6 * u}" fill="none"/><circle cx="${cx}" cy="${top + 1.6 * u}" r="${1.9 * u}" fill="#3a8a5a"/>`;
    else {
      if (out.kind === "priest" && !He && !child)
        s += `<path d="M${cx - hw - 4 * u} ${cy + 4 * u} C${cx - hw - 7 * u} ${top - 13 * u}, ${cx + hw + 7 * u} ${top - 13 * u}, ${cx + hw + 4 * u} ${cy + 4 * u} L${cx + hw - 1.5 * u} ${cy - 1 * u} C${cx + hw - 4 * u} ${top}, ${cx - hw + 4 * u} ${top}, ${cx - hw + 1.5 * u} ${cy - 1 * u} Z" fill="${out.main}" stroke="${out.trim}" stroke-width="1.1"/>`;
    }
  }
  if (ap.jewel === "torc" && !child)
    s += `<path d="M${cx - hw * 0.7} ${bot + 6 * u} Q${cx} ${bot + 12 * u} ${cx + hw * 0.7} ${bot + 6 * u}" stroke="#d4b14a" stroke-width="${2.4 * u}" fill="none"/>`;
  return s;
};

PORTRAIT.weapon = function (W, h, headH, child, id, arms) {
  if (!W || W.kind === "fists" || child) return "";
  const L = W.look || "",
    met = `url(#${id}met)`,
    mD = "#4d535b",
    wood = "#6a4a2a",
    gold = "#c9a13a",
    x = h.x,
    y = h.y,
    k = headH / 40,
    blade = (len, w, curve) =>
      `<path d="M${x - w / 2} ${y - 3 * k} L${x - w / 2 + (curve || 0)} ${y - len * 0.8} Q${x} ${y - len} ${x + w / 2 + (curve || 0) * 0.5} ${y - len * 0.8} L${x + w / 2} ${y - 3 * k} Z" fill="${met}" stroke="${mD}" stroke-width="0.8"/><path d="M${x} ${y - 4 * k} L${x + (curve || 0) * 0.6} ${y - len * 0.85}" stroke="#eef2f5" stroke-width="0.6" opacity="0.7"/>`,
    guard = w =>
      `<rect x="${x - w / 2}" y="${y - 4 * k}" width="${w}" height="${2.6 * k}" rx="1" fill="${gold}" stroke="#6a5014" stroke-width="0.5"/><rect x="${x - 1.4 * k}" y="${y - 2 * k}" width="${2.8 * k}" height="${8 * k}" fill="#3a2716"/><circle cx="${x}" cy="${y + 7 * k}" r="${2 * k}" fill="${gold}"/>`;
  switch (L) {
    case "sword":
    case "goodsword":
    case "chanari":
    case "dwarfblade":
    case "shortsword":
    case "elfblade":
      return (
        blade(
          {
            shortsword: 38,
            sword: 56,
            goodsword: 60,
            chanari: 58,
            dwarfblade: 52,
            elfblade: 60,
          }[L] * k,
          5 * k,
          L === "elfblade" ? 4 * k : 0,
        ) +
        guard(L === "elfblade" ? 10 * k : 16 * k) +
        (L === "chanari"
          ? `<path d="M${x - 1.5 * k} ${y - 20 * k} q3 -6 0 -12 q-3 -6 0 -12" stroke="#6a7078" stroke-width="0.6" fill="none"/>`
          : "")
      );
    case "longsword":
      return (
        blade(78 * k, 5.5 * k) +
        guard(20 * k) +
        `<rect x="${x - 1.4 * k}" y="${y + 4 * k}" width="${2.8 * k}" height="${10 * k}" fill="#3a2716"/>`
      );
    case "falchion":
      return (
        `<path d="M${x - 2.5 * k} ${y - 3 * k} L${x - 2.5 * k} ${y - 46 * k} Q${x + 8 * k} ${y - 52 * k} ${x + 7 * k} ${y - 30 * k} L${x + 2.5 * k} ${y - 3 * k} Z" fill="${met}" stroke="${mD}"/>` +
        guard(14 * k)
      );
    case "saber":
      return (
        `<path d="M${x - 2 * k} ${y - 3 * k} Q${x - 4 * k} ${y - 36 * k} ${x + 10 * k} ${y - 54 * k} Q${x + 2 * k} ${y - 34 * k} ${x + 2.5 * k} ${y - 3 * k} Z" fill="${met}" stroke="${mD}"/>` +
        guard(12 * k)
      );
    case "dagger":
      return blade(22 * k, 4 * k) + guard(9 * k);
    case "axe":
    case "cleaver":
    case "greataxe": {
      const len = (L === "greataxe" ? 84 : 52) * k;
      let s = `<rect x="${x - 1.8 * k}" y="${y - len}" width="${3.6 * k}" height="${len + 8 * k}" fill="${wood}" stroke="#3a2716" stroke-width="0.6"/>`;
      if (L === "cleaver")
        s += `<path d="M${x + 1.8 * k} ${y - len + 2 * k} L${x + 18 * k} ${y - len - 2 * k} L${x + 16 * k} ${y - len + 20 * k} L${x + 1.8 * k} ${y - len + 16 * k} Z" fill="${met}" stroke="${mD}"/>`;
      else
        s +=
          `<path d="M${x + 1.8 * k} ${y - len + 3 * k} Q${x + (L === "greataxe" ? 26 : 18) * k} ${y - len - 6 * k} ${x + (L === "greataxe" ? 24 : 16) * k} ${y - len + (L === "greataxe" ? 24 : 16) * k} Q${x + 10 * k} ${y - len + 12 * k} ${x + 1.8 * k} ${y - len + 13 * k} Z" fill="${met}" stroke="${mD}"/>` +
          (L === "greataxe"
            ? `<path d="M${x - 1.8 * k} ${y - len + 3 * k} Q${x - 22 * k} ${y - len - 4 * k} ${x - 20 * k} ${y - len + 22 * k} Q${x - 10 * k} ${y - len + 12 * k} ${x - 1.8 * k} ${y - len + 13 * k} Z" fill="${met}" stroke="${mD}"/>`
            : "");
      return s;
    }
    case "mace":
    case "morningstar":
    case "club":
    case "maul": {
      const len = (L === "maul" ? 90 : 46) * k;
      let s = `<rect x="${x - 2 * k}" y="${y - len}" width="${4 * k}" height="${len + 8 * k}" fill="${L === "club" || L === "maul" ? "#5a3e22" : wood}"/>`;
      if (L === "mace")
        s += `<ellipse cx="${x}" cy="${y - len}" rx="${6.5 * k}" ry="${8 * k}" fill="${met}" stroke="${mD}"/>${[-1, 0, 1].map(i => `<path d="M${x + i * 4 * k} ${y - len - 8 * k} l${i * 2 * k} ${-3 * k}" stroke="${mD}" stroke-width="${1.6 * k}"/>`).join("")}`;
      if (L === "morningstar")
        s += `<circle cx="${x}" cy="${y - len}" r="${6.5 * k}" fill="${met}" stroke="${mD}"/>${[0, 1, 2, 3, 4, 5, 6, 7]
          .map(i => {
            const a = (i * Math.PI) / 4;
            return `<path d="M${x + Math.cos(a) * 6 * k} ${y - len + Math.sin(a) * 6 * k} L${x + Math.cos(a) * 10 * k} ${y - len + Math.sin(a) * 10 * k}" stroke="${mD}" stroke-width="${1.6 * k}"/>`;
          })
          .join("")}`;
      if (L === "club" || L === "maul")
        s += `<ellipse cx="${x}" cy="${y - len}" rx="${(L === "maul" ? 12 : 6) * k}" ry="${(L === "maul" ? 20 : 11) * k}" fill="#5a3e22" stroke="#3a2716"/>`;
      return s;
    }
    case "warhammer":
      return `<rect x="${x - 2 * k}" y="${y - 54 * k}" width="${4 * k}" height="${62 * k}" fill="${wood}"/><rect x="${x - 11 * k}" y="${y - 60 * k}" width="${22 * k}" height="${10 * k}" rx="1.5" fill="${met}" stroke="${mD}"/><path d="M${x - 11 * k} ${y - 60 * k} l${-5 * k} ${5 * k} l${5 * k} ${5 * k}" fill="${met}" stroke="${mD}"/><path d="M${x - 9 * k} ${y - 55 * k} L${x + 9 * k} ${y - 55 * k}" stroke="${gold}" stroke-width="${1.6 * k}"/>`;
    case "flail":
      return `<rect x="${x - 2 * k}" y="${y - 30 * k}" width="${4 * k}" height="${38 * k}" fill="${wood}"/><path d="M${x} ${y - 30 * k} q${8 * k} ${-6 * k} ${10 * k} ${-16 * k}" stroke="${mD}" stroke-width="${1.6 * k}" fill="none" stroke-dasharray="${2 * k} ${1.5 * k}"/><circle cx="${x + 10 * k}" cy="${y - 48 * k}" r="${6 * k}" fill="${met}" stroke="${mD}"/>${[
        0, 1, 2, 3, 4, 5,
      ]
        .map(i => {
          const a = (i * Math.PI) / 3;
          return `<path d="M${x + 10 * k + Math.cos(a) * 6 * k} ${y - 48 * k + Math.sin(a) * 6 * k} l${Math.cos(a) * 3 * k} ${Math.sin(a) * 3 * k}" stroke="${mD}" stroke-width="${1.4 * k}"/>`;
        })
        .join("")}`;
    case "spear":
    case "pike":
    case "lance":
    case "staff":
    case "glaive":
    case "halberd": {
      const len =
        {
          spear: 120,
          pike: 170,
          lance: 150,
          staff: 110,
          glaive: 120,
          halberd: 125,
        }[L] * k;
      let s = `<rect x="${x - 1.6 * k}" y="${y - len}" width="${3.2 * k}" height="${len + (L === "staff" ? 20 : 26) * k}" fill="${wood}" stroke="#3a2716" stroke-width="0.4"/>`;
      if (L === "spear" || L === "pike")
        s += `<path d="M${x} ${y - len - 14 * k} L${x + 4 * k} ${y - len} L${x - 4 * k} ${y - len} Z" fill="${met}" stroke="${mD}"/>`;
      if (L === "lance")
        s += `<path d="M${x} ${y - len - 10 * k} L${x + 3 * k} ${y - len} L${x - 3 * k} ${y - len} Z" fill="${met}"/><path d="M${x + 1.6 * k} ${y - len + 6 * k} L${x + 22 * k} ${y - len + 12 * k} L${x + 1.6 * k} ${y - len + 20 * k} Z" fill="${arms.f}" stroke="${PORTRAIT.shade(arms.f, -0.3)}"/><path d="M${x - 5 * k} ${y - 10 * k} L${x + 5 * k} ${y - 10 * k} L${x + 3 * k} ${y - 26 * k} L${x - 3 * k} ${y - 26 * k} Z" fill="${met}"/>`;
      if (L === "glaive")
        s += `<path d="M${x - 1.6 * k} ${y - len} Q${x + 12 * k} ${y - len - 10 * k} ${x + 2 * k} ${y - len - 30 * k} Q${x - 4 * k} ${y - len - 12 * k} ${x - 1.6 * k} ${y - len} Z" fill="${met}" stroke="${mD}"/>`;
      if (L === "halberd")
        s += `<path d="M${x} ${y - len - 18 * k} L${x + 3 * k} ${y - len} L${x - 3 * k} ${y - len} Z" fill="${met}"/><path d="M${x + 1.6 * k} ${y - len + 2 * k} Q${x + 16 * k} ${y - len - 2 * k} ${x + 14 * k} ${y - len + 14 * k} L${x + 1.6 * k} ${y - len + 10 * k} Z M${x - 1.6 * k} ${y - len + 4 * k} L${x - 9 * k} ${y - len + 2 * k} L${x - 1.6 * k} ${y - len + 9 * k} Z" fill="${met}" stroke="${mD}"/>`;
      return s;
    }
    case "hammer":
      return `<rect x="${x - 2 * k}" y="${y - 40 * k}" width="${4 * k}" height="${48 * k}" fill="${wood}"/><rect x="${x - 7 * k}" y="${y - 46 * k}" width="${14 * k}" height="${9 * k}" fill="${met}" stroke="${mD}"/>`;
    default:
      return blade(50 * k, 5 * k) + guard(14 * k);
  }
};

PORTRAIT.shieldArt = function (Sh, h, headH, shW, arms, id) {
  const k = headH / 40,
    x = h.x,
    y = h.y,
    L = Sh.look || "shield",
    met = `url(#${id}met)`,
    mD = "#4d535b";
  if (Sh.offhand) {
    const W = {
      parrydagger: {
        look: "dagger",
        kind: "dagger",
      },
      handaxe: {
        look: "axe",
        kind: "axe",
      },
      offsword: {
        look: "shortsword",
        kind: "sword",
      },
    }[L] || {
      look: "dagger",
    };
    return (
      PORTRAIT.weapon(
        W,
        {
          x,
          y,
        },
        headH * 0.85,
        false,
        id,
        arms,
      ) + `<ellipse cx="${x}" cy="${y}" rx="${3.5 * k}" ry="${4 * k}" fill="#c99a78"/>`
    );
  }
  const dv = (cx, cy, sc) => PORTRAIT.device(arms, cx, cy, sc),
    rim = PORTRAIT.shade(arms.f, -0.35);
  if (L === "buckler")
    return `<circle cx="${x}" cy="${y}" r="${9 * k}" fill="${met}" stroke="${mD}" stroke-width="1"/><circle cx="${x}" cy="${y}" r="${3 * k}" fill="#d4d9de" stroke="${mD}"/>`;
  if (L === "shield" || L === "targe") {
    const r = (L === "targe" ? 17 : 22) * k;
    return `<g filter="url(#${id}sh)"><circle cx="${x}" cy="${y}" r="${r}" fill="${arms.f}" stroke="${L === "targe" ? "#3a2716" : "#6a4a2a"}" stroke-width="${2.4 * k}"/>${L === "shield" ? [0, 1, 2, 3, 4, 5].map(i => `<path d="M${x} ${y} L${x + Math.cos((i * Math.PI) / 3) * r} ${y + Math.sin((i * Math.PI) / 3) * r}" stroke="${rim}" stroke-width="0.6" opacity="0.5"/>`).join("") : ""}${dv(x, y, r / 13)}<circle cx="${x}" cy="${y}" r="${4.5 * k}" fill="${met}" stroke="${mD}"/></g>`;
  }
  return L === "kite"
    ? `<g filter="url(#${id}sh)"><path d="M${x - 15 * k} ${y - 26 * k} Q${x} ${y - 32 * k} ${x + 15 * k} ${y - 26 * k} Q${x + 17 * k} ${y + 10 * k} ${x} ${y + 40 * k} Q${x - 17 * k} ${y + 10 * k} ${x - 15 * k} ${y - 26 * k} Z" fill="${arms.f}" stroke="${rim}" stroke-width="${1.8 * k}"/>${dv(x, y - 6 * k, 1.05 * k)}</g>`
    : L === "heater"
      ? `<g filter="url(#${id}sh)"><path d="M${x - 17 * k} ${y - 22 * k} L${x + 17 * k} ${y - 22 * k} L${x + 17 * k} ${y} Q${x + 15 * k} ${y + 20 * k} ${x} ${y + 28 * k} Q${x - 15 * k} ${y + 20 * k} ${x - 17 * k} ${y} Z" fill="${arms.f}" stroke="${rim}" stroke-width="${1.8 * k}"/>${dv(x, y - 2 * k, 1.15 * k)}</g>`
      : L === "tower"
        ? `<g filter="url(#${id}sh)"><path d="M${x - 19 * k} ${y - 44 * k} L${x + 19 * k} ${y - 44 * k} L${x + 19 * k} ${y + 34 * k} L${x - 19 * k} ${y + 34 * k} Z" fill="${arms.f}" stroke="#4a3420" stroke-width="${2.2 * k}"/><path d="M${x} ${y - 44 * k} L${x} ${y + 34 * k}" stroke="${rim}" stroke-width="${3 * k}" opacity="0.5"/>${dv(x, y - 8 * k, 1.3 * k)}</g>`
        : `<circle cx="${x}" cy="${y}" r="${20 * k}" fill="${arms.f}" stroke="${rim}" stroke-width="2"/>${dv(x, y, 1.4 * k)}`;
};

PORTRAIT.rangedArt = function (Rg, h, headH, id) {
  const k = headH / 40,
    x = h.x,
    y = h.y,
    L = Rg.look || Rg.kind;
  if (["selfbow", "compbow", "longbow", "elfbow"].includes(L)) {
    const len =
        {
          selfbow: 60,
          compbow: 46,
          longbow: 84,
          elfbow: 72,
        }[L] * k,
      col = L === "elfbow" ? "#c8b07a" : L === "compbow" ? "#5a3a22" : "#8a6238";
    return `<path d="${L === "compbow" ? `M${x} ${y - len / 2} Q${x + 10 * k} ${y - len / 3} ${x + 4 * k} ${y - len / 6} Q${x + 12 * k} ${y} ${x + 4 * k} ${y + len / 6} Q${x + 10 * k} ${y + len / 3} ${x} ${y + len / 2}` : `M${x} ${y - len / 2} Q${x + 14 * k} ${y} ${x} ${y + len / 2}`}" stroke="${col}" stroke-width="${2.6 * k}" fill="none" stroke-linecap="round"/><path d="M${x} ${y - len / 2} L${x} ${y + len / 2}" stroke="#e8e2cc" stroke-width="0.6"/>`;
  }
  return L === "xbow"
    ? `<rect x="${x - 2.5 * k}" y="${y - 6 * k}" width="${5 * k}" height="${34 * k}" fill="#6a4a2a"/><path d="M${x - 16 * k} ${y - 2 * k} Q${x} ${y - 10 * k} ${x + 16 * k} ${y - 2 * k}" stroke="#6d737b" stroke-width="${2.8 * k}" fill="none"/><path d="M${x - 16 * k} ${y - 2 * k} L${x + 16 * k} ${y - 2 * k}" stroke="#e8e2cc" stroke-width="0.6"/>`
    : L === "javelins"
      ? [0, 1, 2]
          .map(
            i =>
              `<path d="M${x - 3 * k + i * 3 * k} ${y + 14 * k} L${x - 6 * k + i * 4 * k} ${y - 60 * k}" stroke="#7a5a32" stroke-width="${2 * k}"/><path d="M${x - 6 * k + i * 4 * k} ${y - 66 * k} l${2 * k} ${7 * k} l${-4 * k} 0 Z" fill="#9aa0a8"/>`,
          )
          .join("")
      : L === "throwaxes"
        ? [0, 1]
            .map(
              i =>
                `<rect x="${x - 1.4 * k + i * 6 * k}" y="${y - 22 * k}" width="${2.8 * k}" height="${26 * k}" fill="#6a4a2a"/><path d="M${x + 1.4 * k + i * 6 * k} ${y - 22 * k} q${7 * k} ${-2 * k} ${6 * k} ${7 * k} l${-6 * k} 0 Z" fill="#9aa0a8"/>`,
            )
            .join("")
        : L === "knives"
          ? [0, 1, 2]
              .map(
                i =>
                  `<path d="M${x - 4 * k + i * 4 * k} ${y} L${x - 4 * k + i * 4 * k} ${y - 14 * k}" stroke="#c4c9ce" stroke-width="${1.8 * k}"/>`,
              )
              .join("")
          : L === "sling"
            ? `<path d="M${x} ${y} q${-4 * k} ${18 * k} ${2 * k} ${26 * k} q${6 * k} ${-8 * k} ${2 * k} ${-26 * k}" stroke="#8a7a5a" stroke-width="${1.2 * k}" fill="none"/>`
            : "";
};
