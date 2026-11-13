// The release's core, map: MAP: the map view.
// Readable source of vendor/ardan-b593143.html with the patch layer baked in (X1, docs/DECISIONS.md D-027). Edit it here.
// Defines: MAP, MAP.init, MAP.hex, MAP.ownerColor, MAP.cb, MAP.CB_PAL, MAP.cbAssign, MAP.realmColor, MAP.DIPL,
// MAP.FAITH_COL, MAP.MODES, MAP.modeInfo, MAP.rgb, MAP.overlay, MAP.provAt, MAP.toCanvas, MAP.draw, MAP.attach.

const MAP = {
  grid: null,
  gw: 0,
  gh: 0,
  img: null,
  overlayCache: null,
  ownerKey: "",
};

MAP.init = function () {
  if (MAP.grid) return;
  const m = LORE.map;
  MAP.gw = m.gw;
  MAP.gh = m.gh;
  const bin = atob(m.rle),
    u16 = new Uint16Array(bin.length / 2);
  for (let i = 0; i < u16.length; i++) u16[i] = bin.charCodeAt(i * 2) | (bin.charCodeAt(i * 2 + 1) << 8);
  const g = new Int16Array(m.gw * m.gh);
  let k = 0;
  for (let i = 0; i < u16.length; i += 2) {
    const v = u16[i] - 1,
      n = u16[i + 1];
    g.fill(v, k, k + n);
    k += n;
  }
  MAP.grid = g;
  MAP.img = new Image();
  MAP.img.src = "data:image/jpeg;base64," + LORE.terrainJpg;
  MAP.img.onload = () => {
    if (UI && UI.onMapReady) UI.onMapReady();
  };
};

MAP.hex = function (c) {
  c = (c || "#999999").replace("#", "");
  if (c.length === 3)
    c = c
      .split("")
      .map(x => x + x)
      .join("");
  const n = parseInt(c, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

MAP.ownerColor = function (rid) {
  if (rid === "unclaimed") return [150, 150, 140];
  const r = A.realm(rid);
  return MAP.hex(r ? MAP.realmColor(r) : "#999");
};

MAP.cb = () => !!(typeof UI < "u" && UI.set && UI.set.mapCb);

MAP.CB_PAL = [
  "#E69F00",
  "#56B4E9",
  "#009E73",
  "#F0E442",
  "#0072B2",
  "#D55E00",
  "#CC79A7",
  "#B0B0B0",
  "#9C6B00",
  "#2B7FB0",
  "#00684D",
  "#B3A91C",
  "#00436B",
  "#8F3F00",
  "#8A4A72",
  "#6E6E6E",
];

MAP.cbAssign = function () {
  const S = A.S,
    live = Object.values(S.realms)
      .filter(r => r.alive)
      .sort((a, b) => A.neighbors(b.id).length - A.neighbors(a.id).length || (a.id < b.id ? -1 : 1)),
    key = S.year + "|" + live.map(r => r.id).join(",");
  if (MAP._cb && MAP._cb.key === key) return MAP._cb.col;
  const col = {};
  for (const r of live) {
    const used = new Set(
      A.neighbors(r.id)
        .map(n => col[n])
        .filter(Boolean),
    );
    col[r.id] = MAP.CB_PAL.find(c => !used.has(c)) || MAP.CB_PAL[0];
  }
  MAP._cb = {
    key,
    col,
  };
  return col;
};

MAP.realmColor = r => (MAP.cb() ? MAP.cbAssign()[r.id] || "#B0B0B0" : r.color);

MAP.DIPL = {
  std: {
    you: "#f2d37a",
    war: "#d0463c",
    ally: "#4fbf6a",
    trib: "#a874d8",
    over: "#7d4fb0",
    coal: "#8f2a2a",
    nap: "#4fb0b0",
    trade: "#6f9fd8",
    friend: "#9fd89f",
    hostile: "#d89f8a",
    neutral: "#a8a49a",
  },
  cb: {
    you: "#F0E442",
    war: "#D55E00",
    ally: "#0072B2",
    trib: "#CC79A7",
    over: "#8A4A72",
    coal: "#8F3F00",
    nap: "#009E73",
    trade: "#56B4E9",
    friend: "#9FD3F0",
    hostile: "#F2B766",
    neutral: "#A8A49A",
  },
};

MAP.FAITH_COL = [
  "#d9a441",
  "#6f9fd8",
  "#c45a5a",
  "#7cc47c",
  "#b58ad8",
  "#d8d07a",
  "#5ac4b8",
  "#d88a5a",
  "#8a8ad8",
  "#c4c4c4",
  "#a0d85a",
  "#d85aa0",
  "#5a8ad8",
  "#d8b08a",
  "#8ad8d0",
  "#b0b05a",
  "#5ab05a",
  "#d86f6f",
  "#9fb4c8",
];

MAP.MODES = {
  political: "Realms",
  diplomatic: "Diplomacy",
  alliances: "Alliances",
  wars: "Wars",
  faith: "Faiths",
  danger: "Infamy",
  terrain: "Terrain",
};

MAP.modeInfo = function (mode, focus) {
  const S = A.S,
    col = {},
    legend = [],
    live = Object.values(S.realms).filter(r => r.alive);
  if (mode === "diplomatic" && focus && A.realm(focus)) {
    const f = A.realm(focus),
      K = MAP.DIPL[MAP.cb() ? "cb" : "std"],
      tag = r => {
        if (r.id === focus) return [K.you, "You"];
        if (A.hostile && A.hostile(focus, r.id)) return [K.war, "At war"];
        if (f.allies.includes(r.id)) return [K.ally, "Ally"];
        if (r.overlord === focus) return [K.trib, "Your tributary"];
        if (f.overlord === r.id) return [K.over, "Your overlord"];
        if (S.coalitions && S.coalitions[focus] && S.coalitions[focus].includes(r.id))
          return [K.coal, "Coalition against you"];
        if (A.hasNap && A.hasNap(focus, r.id)) return [K.nap, "Non-aggression pact"];
        if (A.hasTrade && A.hasTrade(focus, r.id)) return [K.trade, "Trade pact"];
        const rel = A.relBetween(focus, r.id);
        return rel >= 30 ? [K.friend, "Friendly"] : rel <= -30 ? [K.hostile, "Hostile"] : [K.neutral, "Neutral"];
      },
      seen = {};
    for (const r of live) {
      const [c, n] = tag(r);
      col[r.id] = c;
      if (!seen[n]) {
        seen[n] = 1;
        legend.push([c, n]);
      }
    }
  } else if (mode === "alliances") {
    const comp = {};
    let k = 0;
    for (const r of live) {
      if (comp[r.id] != null || !r.allies.some(a => A.realm(a) && A.realm(a).alive)) continue;
      const q = [r.id];
      for (comp[r.id] = k; q.length; ) {
        const x = q.pop();
        for (const a of A.realm(x).allies)
          if (A.realm(a) && A.realm(a).alive && comp[a] == null) {
            comp[a] = k;
            q.push(a);
          }
      }
      k++;
    }
    const blocs = {};
    for (const id in comp) (blocs[comp[id]] = blocs[comp[id]] || []).push(A.realm(id));
    for (const b in blocs) {
      const lead = blocs[b].sort((x, y) => A.realmPower(y) - A.realmPower(x))[0],
        lc = MAP.realmColor(lead);
      for (const r of blocs[b]) col[r.id] = lc;
      legend.push([lc, `${lead.short} bloc (${blocs[b].length})`]);
    }
    for (const r of live)
      if (col[r.id] == null) col[r.id] = r.overlord && col[r.overlord] ? col[r.overlord] : "#77736a";
    legend.push(["#77736a", "No alliance"]);
  } else if (mode === "wars") {
    const hues = MAP.cb()
      ? ["#D55E00", "#0072B2", "#E69F00", "#56B4E9", "#CC79A7", "#009E73"]
      : ["#d0463c", "#3c7fd0", "#d08a3c", "#3cb0d0", "#c43cd0", "#8ad03c"];
    S.wars.forEach((w, i) => {
      const a = hues[(i * 2) % hues.length],
        d = hues[(i * 2 + 1) % hues.length];
      for (const x of w.att) col[x] = a;
      for (const x of w.def) col[x] = d;
      legend.push([a, `${w.name}: ${w.att.map(A.realmShort).join(", ")}`]);
      legend.push([d, `…against ${w.def.map(A.realmShort).join(", ")}`]);
    });
    for (const r of live) if (col[r.id] == null) col[r.id] = "#6b685f";
    legend.push(["#6b685f", "At peace"]);
  } else if (mode === "faith") {
    const fs = {};
    for (const r of live) {
      const i = +String(r.faith || "REL-0").slice(4) || 0;
      col[r.id] = MAP.FAITH_COL[i % MAP.FAITH_COL.length];
      fs[r.faith] = col[r.id];
    }
    for (const k in fs) legend.push([fs[k], (A.faith(k) || {}).name || k]);
  } else if (mode === "danger") {
    for (const r of live) {
      const v = A.clamp((r.infamy || 0) / 70, 0, 1);
      col[r.id] = `rgb(${Math.round(120 + 115 * v)},${Math.round(120 - 80 * v)},${Math.round(110 - 80 * v)})`;
    }
    legend.push(["#787866", "Trusted"], ["#bd6a4a", "Feared"], ["#eb282e", "Coalition bait (infamy 60+)"]);
  } else for (const r of live) col[r.id] = MAP.realmColor(r);
  return {
    col,
    legend,
  };
};

MAP.rgb = function (c) {
  return /^rgb/.test(c) ? c.match(/\d+/g).map(Number) : MAP.hex(c);
};

MAP.overlay = function (mode, hl, focus) {
  MAP.init();
  const S = A.S,
    key =
      mode +
      "|" +
      (MAP.cb() ? "cb" : "") +
      "|" +
      (hl || "") +
      "|" +
      (focus || "") +
      "|" +
      S.year +
      "|" +
      (UI.mapVer || 0) +
      "|" +
      S.prov.map(p => p.owner + (p.occ || "")).join(",") +
      Object.values(S.realms)
        .map(r => r.color + r.allies.length)
        .join("");
  if (MAP.overlayCache && MAP.ownerKey === key) return MAP.overlayCache;
  const info = mode !== "political" && mode !== "terrain" && mode !== "focus" ? MAP.modeInfo(mode, focus) : null,
    { gw, gh, grid } = MAP,
    cv = document.createElement("canvas");
  cv.width = gw;
  cv.height = gh;
  const ctx = cv.getContext("2d"),
    im = ctx.createImageData(gw, gh),
    d = im.data,
    pcol = S.prov.map(p =>
      info
        ? p.owner === "unclaimed"
          ? [120, 118, 110]
          : MAP.rgb(info.col[p.owner] || "#777")
        : MAP.ownerColor(p.owner),
    ),
    ocol = S.prov.map(p => (p.occ ? (info ? MAP.rgb(info.col[p.occ] || "#777") : MAP.ownerColor(p.occ)) : null)),
    own = S.prov.map(p => p.owner);
  for (let y = 0; y < gh; y++)
    for (let x = 0; x < gw; x++) {
      const i = y * gw + x,
        pv = grid[i],
        o = i * 4;
      if (pv < 0) {
        d[o + 3] = 0;
        continue;
      }
      let c = pcol[pv];
      if (ocol[pv] && (x + y) % 6 < 3) c = ocol[pv];
      let a = mode === "terrain" ? 0 : info ? 175 : 120;
      if (hl && own[pv] === hl) a = 175;
      else {
        if (hl && mode === "focus") a = 55;
      }
      const r = x + 1 < gw ? grid[i + 1] : -1,
        dn = y + 1 < gh ? grid[i + gw] : -1,
        rb = r >= 0 && own[r] !== own[pv],
        db = dn >= 0 && own[dn] !== own[pv],
        coast = r < 0 || dn < 0 || (x > 0 && grid[i - 1] < 0) || (y > 0 && grid[i - gw] < 0);
      if (rb || db) {
        d[o] = 20;
        d[o + 1] = 16;
        d[o + 2] = 12;
        d[o + 3] = 230;
        continue;
      }
      if (((r >= 0 && r !== pv) || (dn >= 0 && dn !== pv)) && mode !== "terrain") {
        d[o] = c[0] * 0.6;
        d[o + 1] = c[1] * 0.6;
        d[o + 2] = c[2] * 0.6;
        d[o + 3] = Math.min(255, a + 50);
        continue;
      }
      if (coast) {
        d[o] = 30;
        d[o + 1] = 40;
        d[o + 2] = 50;
        d[o + 3] = 120;
        continue;
      }
      d[o] = c[0];
      d[o + 1] = c[1];
      d[o + 2] = c[2];
      d[o + 3] = a;
    }
  ctx.putImageData(im, 0, 0);
  MAP.overlayCache = cv;
  MAP.ownerKey = key;
  return cv;
};

MAP.provAt = function (canvas, ev) {
  const r = canvas.getBoundingClientRect(),
    x = Math.floor(((ev.clientX - r.left) / r.width) * MAP.gw),
    y = Math.floor(((ev.clientY - r.top) / r.height) * MAP.gh);
  return x < 0 || y < 0 || x >= MAP.gw || y >= MAP.gh ? -1 : MAP.grid[y * MAP.gw + x];
};

MAP.toCanvas = (canvas, kx, ky) => [(kx / 7e3) * canvas.width, (ky / 4500) * canvas.height];

MAP.draw = function (canvas, opts = {}) {
  MAP.init();
  const ctx = canvas.getContext("2d"),
    W = canvas.width,
    H = canvas.height;
  // [X1 baked patch map/62-inked-map IM-GROUND-DRAW] MAP.draw (the world tab, the title strip, the campaign map)
  // asks MAP.ground to draw the inked ground first; only when it declines (the setting is off) does it paint the sea
  // colour and the relief picture.
  ctx.clearRect(0, 0, W, H);
  if (!(MAP.ground && MAP.ground(ctx, W, H, null))) {
    ctx.fillStyle = "#1d3b57";
    ctx.fillRect(0, 0, W, H);
    if (MAP.img && MAP.img.complete && MAP.img.naturalWidth) ctx.drawImage(MAP.img, 0, 0, W, H);
  }
  const ov = MAP.overlay(opts.mode || "political", opts.hl, opts.focus);
  // [X1 baked patch map/62-inked-map IM-LINES] Right after each map lays its realm colours (MAP.draw, the full map,
  // the war room), MAP.inkLines inks the borders, towns and keeps over them, so the wash never greys the line work.
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(ov, 0, 0, W, H);
  if (MAP.inkLines) MAP.inkLines(ctx, W, H, null);
  const S = A.S;
  // [X1 baked patch map/62-inked-map IM-MARKS-DRAW] MAP.draw lets MAP.marks write the realm names in ink at their
  // keeps; when it does, the cream dot and light label of each capital are skipped (the keep is the capital's mark).
  if (
    ((ctx.font = `${Math.max(10, Math.round(W / 95))}px Georgia, serif`),
    (ctx.textAlign = "center"),
    !(MAP.marks && MAP.marks(ctx, W, H, null, opts)) && opts.labels !== false)
  )
    for (const id in S.realms) {
      const r = S.realms[id];
      if (!r.alive || r.capitalProv == null) continue;
      const p = A.prov(r.capitalProv);
      if (!p) continue;
      const [x, y] = MAP.toCanvas(canvas, p.sx, p.sy);
      ctx.fillStyle = "#f4e4b0";
      ctx.strokeStyle = "#1a140c";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      if (r.provCount >= 2 || opts.allLabels) {
        ctx.lineWidth = 3;
        ctx.strokeText(r.short, x, y - 7);
        ctx.fillText(r.short, x, y - 7);
      }
    }
  const pc = A.pc();
  if (pc && opts.home !== false) {
    const hp = A.prov(pc.home);
    if (hp) {
      const [x, y] = MAP.toCanvas(canvas, hp.sx, hp.sy);
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "#d8b25e";
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  if (opts.extra) opts.extra(ctx, W, H);
};

MAP.attach = function (canvas, opts) {
  const wrap = canvas.parentElement;
  let tip = wrap.querySelector(".maptip");
  if (!tip) {
    tip = document.createElement("div");
    tip.className = "maptip hidden";
    wrap.appendChild(tip);
  }
  // [X1 baked patch ui/59-descriptions TT-MAP-TIP-CLICK] UI: the world map (MAP.bind), the Atlas-less world view
  // (UI.gm) and the War Room showed a province card whenever the pointer moved over a province, which a phone never
  // does and which the owner's rule (descriptions open on click, never on hover) forbids. The card is now made by a
  // press on the province (the press still selects it as before); a second press on the same province, Esc, or a
  // press anywhere else closes it (UI.TT.hideMapTips). Drag is untouched.
  canvas.__mapTip = ev => {
    const pid = MAP.provAt(canvas, ev);
    if (pid < 0) {
      tip.classList.add("hidden");
      canvas.__tipPid = -1;
      return;
    }
    if (pid === canvas.__tipPid && !tip.classList.contains("hidden")) {
      tip.classList.add("hidden");
      canvas.__tipPid = -1;
      return;
    }
    canvas.__tipPid = pid;
    const p = A.prov(pid),
      r = A.realm(p.owner);
    let html = `<b>${UI.esc(p.name)}</b> — ${UI.esc(r ? r.name : "Unclaimed land")}<br>${UI.esc(A.cap(p.terr))}, ${UI.esc(p.biome)} · ${A.fmt(p.pop)} people${p.fort ? " · walls " + p.fort : ""}`;
    if (p.occ) html += `<br><span style="color:#e8925a">Occupied by ${UI.esc(A.realmShort(p.occ))}</span>`;
    if (opts && opts.tip) html += opts.tip(p);
    tip.innerHTML = html;
    const wr = wrap.getBoundingClientRect();
    tip.style.left = Math.min(wr.width - 270, ev.clientX - wr.left + 14) + "px";
    tip.style.top = ev.clientY - wr.top + 14 + "px";
    tip.classList.remove("hidden");
  };
  // [X1 baked patch ui/59-descriptions TT-MAP-TIP-CLICK] UI: the world map (MAP.bind), the Atlas-less world view
  // (UI.gm) and the War Room showed a province card whenever the pointer moved over a province, which a phone never
  // does and which the owner's rule (descriptions open on click, never on hover) forbids. The card is now made by a
  // press on the province (the press still selects it as before); a second press on the same province, Esc, or a
  // press anywhere else closes it (UI.TT.hideMapTips). Drag is untouched.
  canvas.onclick = ev => {
    canvas.__mapTip(ev);
    const pid = MAP.provAt(canvas, ev);
    if (pid >= 0 && opts && opts.click) opts.click(A.prov(pid), ev);
  };
};
