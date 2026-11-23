// ===== Livraison Mortelle =====
const cv = document.getElementById("c"), ctx = cv.getContext("2d"), msg = document.getElementById("msg");
const $ = id => document.getElementById(id);
const W = 800, H = 500;

let scene = "menu", hard = false, gfx = 2, last = null, act = false, skip = false, t = 0;
let P = { x: 400, y: 450, s: 3 }, M = null, objs = [], houseObjs = null, cut = null, near = null;
let hid = false, drawers = 0, hasLetter = false, hasKey = false, knocked = 0, flashT = 0, timer = 0, overTxt = "";
const keys = {};

// ---------- Menu ----------
$("play").onclick = () => { $("menu").classList.add("hidden"); newGame(); };
$("diff").onclick = () => { hard = !hard; $("diff").textContent = hard ? "Mode difficile" : "Mode facile"; };
let paused = false, vol = 0.6, rt = 0;
const R = 840, MON = ["house", "upper", "attic"];
const toggleOpt = () => { paused = !paused; $("options").classList.toggle("hidden", !paused); document.activeElement.blur(); };
$("gear").onclick = toggleOpt; $("close").onclick = toggleOpt;
$("gfx").oninput = e => { gfx = +e.target.value; $("gfxLabel").textContent = ["", "Bas", "Moyen", "Élevé"][gfx]; };
$("bri").oninput = e => { cv.style.filter = "brightness(" + e.target.value / 100 + ")"; };
$("vol").oninput = e => { vol = e.target.value / 100; if (mg) mg.gain.value = vol; };

// ---------- Sons (générés avec WebAudio, aucun fichier nécessaire) ----------
let ac, mg, noiseBuf, eng = null, mus = null, bpm = 60, beat = 0, mt = null;
function initAudio() {
  if (ac) return;
  ac = new (window.AudioContext || window.webkitAudioContext)();
  mg = ac.createGain(); mg.gain.value = vol; mg.connect(ac.destination);
  noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
  const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
}
function tone(f, d = .5, type = "sine", v = .2, slide = 0) {
  if (!ac) return;
  const o = ac.createOscillator(), g = ac.createGain(), n = ac.currentTime;
  o.type = type; o.frequency.value = f;
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f + slide), n + d);
  g.gain.setValueAtTime(v, n); g.gain.exponentialRampToValueAtTime(.001, n + d);
  o.connect(g); g.connect(mg); o.start(); o.stop(n + d);
}
function noise(d, v, freq = 400) {
  if (!ac) return;
  const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(), n = ac.currentTime;
  s.buffer = noiseBuf; f.type = "lowpass"; f.frequency.value = freq;
  g.gain.setValueAtTime(v, n); g.gain.exponentialRampToValueAtTime(.001, n + d);
  s.connect(f); f.connect(g); g.connect(mg); s.start(); s.stop(n + d);
}
const stepSnd = v => noise(.12, v, 300 + Math.random() * 200);
function stairsSnd() { for (let i = 0; i < 7; i++) setTimeout(() => { noise(.1, .5, 500); tone(90 + i * 6, .1, "square", .06); }, i * 170); }
function engine(on, rate = 1) {
  if (!ac) return;
  if (on && !eng) { const o = ac.createOscillator(), g = ac.createGain(); o.type = "sawtooth"; g.gain.value = .07; o.connect(g); g.connect(mg); o.start(); eng = o; }
  if (eng) { eng.frequency.value = 60 + rate * 50; if (!on) { eng.stop(); eng = null; } }
}
// Une musique différente par étage
const MUS = {
  intro: { n: [55, 0, 55, 58, 0, 55, 0, 62], type: "sawtooth", bpm: 70, v: .1, d: .3 },
  cave:  { n: [41, 0, 0, 0, 39, 0, 0, 0], type: "sine", bpm: 50, v: .3, d: 1.5 },
  house: { n: [110, 0, 155, 0, 110, 0, 147, 0], type: "triangle", bpm: 90, v: .12, d: .5 },
  upper: { n: [330, 311, 0, 277, 0, 0, 262, 0], type: "triangle", bpm: 70, v: .07, d: .9 },
  attic: { n: [466, 0, 0, 440, 0, 0, 415, 0, 0, 0], type: "square", bpm: 60, v: .03, d: 1.2 }
};
const MS = { path: "intro", cave: "cave", house: "house", upper: "upper", attic: "attic", chase: "intro" };
function music(n) { mus = n; beat = 0; if (n) bpm = MUS[n].bpm; if (n && !mt) tick(); }
function tick() {
  if (!mus) { mt = null; return; }
  const m = MUS[mus], f = m.n[beat++ % m.n.length];
  if (f) tone(f, m.d, m.type, m.v);
  mt = setTimeout(tick, 30000 / bpm);
}

// ---------- Clavier ----------
const ARROWS = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
addEventListener("keydown", e => {
  if (ARROWS.includes(e.key)) { e.preventDefault(); keys[e.key] = 1; last = e.key; }
  if (e.key.toLowerCase() === "z") act = true;
  if (e.key === "Enter") skip = true;
});
addEventListener("keyup", e => {
  delete keys[e.key];
  if (last === e.key) last = ARROWS.find(k => keys[k]) || null;
});

// ---------- Outils ----------
function say(txt, s = 3) { msg.textContent = txt; msg.style.opacity = 1; flashT = s * 60; }
function lose(txt) { scene = "over"; overTxt = txt; msg.style.opacity = 0; }
function toMenu() { scene = "menu"; msg.style.opacity = 0; $("menu").classList.remove("hidden"); }
function cutscene(lines, next) { cut = { lines, i: 0, t: 0, next }; scene = "cut"; }

function newGame() {
  hasKey = false; hasLetter = false; knocked = 0; drawers = 0; houseObjs = null;
  initAudio(); rt = 0; scene = "ride"; music("intro");
}

function go(s, x = 100, y = 420) {
  scene = s; hid = false; P.s = 3; P.x = x; P.y = y; music(MS[s] || null);
  if (s === "path" || s === "chase") bpm = 150;
  if (MON.includes(s)) { const q = { house: [700, 420], upper: [600, 380], attic: [700, 430] }[s]; M = { x: q[0], y: q[1], alert: 0, wp: [q[0], q[1]], st: 0 }; }
  if (s === "path") { P.x = 400; P.y = 450; objs = []; }
  if (s === "cave") {
    drawers = 0; hasLetter = false;
    objs = [
      { t: "drawer", x: 150, y: 60, w: 70, h: 50 },
      { t: "drawer", x: 380, y: 60, w: 70, h: 50, letter: 1 },
      { t: "drawer", x: 610, y: 60, w: 70, h: 50 },
      { t: "stairs", x: 710, y: 400, w: 70, h: 80, ic: "🪜" }
    ];
  }
  if (s === "house") {
    if (!houseObjs) {
      houseObjs = [
        { t: "hide", n: "placard", ic: "🚪", x: 30, y: 50, w: 70, h: 100 },
        { t: "hide", n: "lit", ic: "🛏️", x: 380, y: 50, w: 120, h: 70 },
        { t: "hide", n: "table", ic: "", x: 200, y: 220, w: 160, h: 80 },
        { t: "hide", n: "table", ic: "", x: 520, y: 220, w: 160, h: 80 },
        { t: "door", ic: "🔒", x: 740, y: 230, w: 50, h: 90 },
        { t: "garage", ic: "🚗", x: 340, y: 440, w: 120, h: 55 },
        { t: "up", ic: "🪜", x: 690, y: 50, w: 80, h: 70, to: "upper", sx: 200, sy: 420 },
        { t: "item", ic: "💡", x: 240, y: 235, w: 0, h: 0 }, { t: "item", ic: "💡", x: 320, y: 235, w: 0, h: 0 },
        { t: "item", ic: "🕯️", x: 560, y: 235, w: 0, h: 0 }, { t: "item", ic: "🕯️", x: 640, y: 235, w: 0, h: 0 },
        { t: "item", ic: "🕯️", x: 150, y: 340, w: 0, h: 0 }, { t: "item", ic: "🕯️", x: 650, y: 340, w: 0, h: 0 }
      ];
    }
    objs = houseObjs;
  }
  if (s === "attic") {
    objs = [
      { t: "key", ic: "🔑", x: 600, y: 240, w: 30, h: 30 },
      { t: "hide", n: "caisse", ic: "📦", x: 300, y: 300, w: 90, h: 60 },
      { t: "hide", n: "malle", ic: "🧳", x: 480, y: 80, w: 100, h: 60 },
      { t: "down", ic: "🪜", x: 40, y: 400, w: 80, h: 80, to: "upper", sx: 600, sy: 140 }
    ];
    if (hasKey) objs.shift();
  }
  if (s === "upper") objs = [
    { t: "hide", n: "placard", ic: "🚪", x: 30, y: 50, w: 70, h: 100 },
    { t: "hide", n: "lit", ic: "🛏️", x: 330, y: 60, w: 140, h: 80 },
    { t: "hide", n: "lit", ic: "🛏️", x: 560, y: 300, w: 140, h: 80 },
    { t: "up", ic: "🪜", x: 690, y: 50, w: 80, h: 70, to: "attic", sx: 200, sy: 400 },
    { t: "down", ic: "🪜", x: 40, y: 400, w: 80, h: 80, to: "house", sx: 700, sy: 140 }
  ];
  if (s === "chase") { P.x = 400; P.y = 420; P.s = 4; M = { x: 400, y: 40 }; timer = 0; objs = []; }
}

// ---------- Actions (touche Z) ----------
function use(o) {
  if (o.t === "drawer") {
    o.open = 1; drawers++;
    if (o.letter) { o.t = "letter"; o.ic = "📜"; say("Un vieux papier ! Appuie sur Z pour le prendre."); }
    else { o.t = "empty"; say("Tiroir ouvert... rien d’utile. (" + drawers + "/3)"); }
  } else if (o.t === "letter") {
    hasLetter = true; o.t = "empty";
    say("Lettre d’un ancien livreur : « Cache-toi dans les placards, sous les lits ou les tables (Z). Ne renverse ni lampes ni bougies, il t’entendrait. La clé doit être cachée dans le grenier... »", 11);
  } else if (o.t === "stairs") {
    if (drawers < 3) say("Ouvre d’abord tous les tiroirs.");
    else if (!hasLetter) say("Tu n’as pas pris le papier.");
    else { stairsSnd(); go("house"); say("Le maître rôde. Ne fais pas de bruit.", 4); }
  } else if (o.t === "hide") { hid = true; P.x = o.x + o.w / 2; P.y = o.y + o.h / 2; say("Tu te caches (" + o.n + "). Z pour sortir.", 2); }
  else if (o.t === "door") say("La porte d’entrée est cadenassée.");
  else if (o.to) { stairsSnd(); go(o.to, o.sx, o.sy); say("Tu entends des pas... reste discret.", 3); }
  else if (o.t === "key") { hasKey = true; objs = objs.filter(k => k !== o); say("Tu as trouvé la clé ! Direction le garage, au rez-de-chaussée."); }
  else if (o.t === "garage") {
    if (!hasKey) say("Le garage est fermé à clé.");
    else cutscene([["🚗", "Tu démarres la voiture... Il arrive !", 3]], () => go("chase"));
  }
}

// ---------- Mise à jour ----------
function update() {
  if (flashT > 0 && --flashT === 0) msg.style.opacity = 0;
  if (scene === "menu" || paused) return;
  if (scene === "ride") {
    rt++; const p = rt / R;
    engine(true, p < .7 ? 3 : 3 - (p - .7) * 7); bpm = 70 + p * 110;
    if (p > .7 && rt % 38 === 0) stepSnd(.12 + p * .3);
    if (skip || rt > R) { engine(false); go("path"); say("Avance tout droit avec la flèche ↑", 4); }
    return;
  }
  if (scene === "cut") {
    cut.t++; if (cut.t === 1 && cut.lines[cut.i][3]) cut.lines[cut.i][3]();
    if (skip || cut.t > cut.lines[cut.i][2] * 60) { cut.i++; cut.t = 0; if (cut.i >= cut.lines.length) cut.next(); }
    return;
  }
  if (scene === "over" || scene === "end") { if (skip) toMenu(); return; }

  if (!hid && last) {
    const d = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[last];
    P.x += d[0] * P.s; P.y += d[1] * P.s; if (t % 18 === 0) stepSnd(.1);
  }
  const path = scene === "path";
  P.x = Math.max(path ? 340 : 20, Math.min(path ? 460 : W - 20, P.x));
  P.y = Math.max(20, Math.min(H - 20, P.y));

  if (path && P.y < 100) {
    cutscene([
      ["🏠", "Tu montes les marches et traverses le porche en bois. La porte s’ouvre...", 4],
      ["🕯️", "Deux lampes sur la table, des bougies sur les chaises. Personne.", 4],
      ["🍕", "CRRRRRR... Un grincement ! La pizza tombe. Tu veux fuir...", 4, () => tone(180, 1.2, "sawtooth", .2, -100)],
      ["💥", "BANG ! Un grand coup de massue.", 3, () => { noise(.6, 1, 800); tone(60, .5, "square", .3, -30); }],
      ["⬛", "...", 2]
    ], () => { go("cave"); say("Tu te réveilles dans un sous-sol. Fouille les tiroirs (Z).", 5); });
    return;
  }

  near = objs.find(o => o.t !== "item" && o.t !== "empty" &&
    Math.hypot(P.x - (o.x + o.w / 2), P.y - (o.y + o.h / 2)) < Math.max(o.w, o.h) / 2 + 35);
  if (act) { if (hid) { hid = false; } else if (near) use(near); }

  if (MON.includes(scene)) {
    objs.forEach(o => {
      if (o.t === "item" && !o.f && !hid && Math.hypot(P.x - o.x, P.y - o.y) < 24) {
        o.f = 1; knocked++; M.alert = 360;
        say("Tu as renversé un objet ! Le maître arrive...", 2);
        if (knocked >= (hard ? 1 : 3)) lose("Trop de bruit... le maître t’a trouvé.");
      }
    });
    let sp = hard ? 2.2 : 1.5, tx = M.wp[0], ty = M.wp[1];
    if (M.alert > 0) { M.alert--; tx = P.x; ty = P.y; sp *= 1.4; }
    else {
      if (Math.hypot(M.x - tx, M.y - ty) < 10) M.wp = [60 + Math.random() * 680, 80 + Math.random() * 360];
      if (!hid && Math.hypot(M.x - P.x, M.y - P.y) < (hard ? 220 : 150)) M.alert = 120;
    }
    const d = Math.hypot(tx - M.x, ty - M.y) || 1;
    M.x += (tx - M.x) / d * sp; M.y += (ty - M.y) / d * sp;
    if (++M.st % 22 === 0) stepSnd(Math.max(.04, .7 - Math.hypot(M.x - P.x, M.y - P.y) / 600));
    if (!hid && Math.hypot(M.x - P.x, M.y - P.y) < 26) lose("Le maître t’a attrapé...");
  }

  if (scene === "chase") {
    timer++;
    const sp = hard ? 3.3 : 2.6, d = Math.hypot(P.x - M.x, P.y - M.y) || 1;
    M.x += (P.x - M.x) / d * sp; M.y += (P.y - M.y) / d * sp;
    if (d < 28) lose("Il t’a rattrapé dans la forêt...");
    if (timer > 1100) scene = "end";
  }
}

// ---------- Dessin ----------
const BG = { path: "#0c180c", cave: "#1a1410", house: "#241a12", attic: "#1c1612", upper: "#201814", chase: "#0a140a" };
const COL = { hide: "#4a2f1a", drawer: "#3b2a1e", letter: "#5a4a2e", stairs: "#2a2a2a", door: "#222", garage: "#333", up: "#2a2a2a", down: "#2a2a2a", key: "#222" };
const trees = Array.from({ length: 14 }, (_, i) => [i % 2 ? 40 + Math.random() * 120 : 640 + Math.random() * 120, Math.random() * H]);

function em(s, x, y, size = 32, a = 1) {
  ctx.globalAlpha = a; ctx.font = size + "px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillStyle = "#fff"; ctx.fillText(s, x, y); ctx.globalAlpha = 1;
}
function txt(s, x, y, size = 24, col = "#e8dcc8") {
  ctx.font = size + "px Georgia"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = col; ctx.fillText(s, x, y);
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  if (scene === "menu") { ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H); return; }
  if (scene === "ride") return drawRide();
  if (scene === "cut") {
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
    const l = cut.lines[Math.min(cut.i, cut.lines.length - 1)];
    em(l[0], W / 2 + (l[0] === "🛵" ? cut.t * 2 - 200 : 0), 190, 120);
    txt(l[1], W / 2, 340, 22);
    txt("Entrée : passer", W / 2, 470, 14, "#777");
    return;
  }
  if (scene === "over") { ctx.fillStyle = "#2a0505"; ctx.fillRect(0, 0, W, H); txt("☠️", W / 2, 180, 80); txt(overTxt, W / 2, 290, 26, "#d44"); txt("Entrée : retour au menu", W / 2, 360, 18); return; }
  if (scene === "end") { ctx.fillStyle = "#050f05"; ctx.fillRect(0, 0, W, H); em("🌅", W / 2, 170, 100); txt("Bravo, tu l’as semé...", W / 2, 290, 34, "#9c9"); txt("Entrée : retour au menu", W / 2, 360, 18); return; }

  ctx.fillStyle = BG[scene]; ctx.fillRect(0, 0, W, H);
  if (scene === "path") { ctx.fillStyle = "#2c2c2c"; ctx.fillRect(340, 0, 120, H); em("🏚️", W / 2, 50, 100); }
  if (scene === "chase") trees.forEach(([x, y]) => em("🌲", x, (y + timer * 4) % H, 44));

  objs.forEach(o => {
    if (o.t === "item") return em(o.ic, o.x, o.y, 24, o.f ? 0.25 : 1);
    if (o.t === "empty") { ctx.fillStyle = "#1a120c"; ctx.fillRect(o.x, o.y, o.w, o.h); return; }
    ctx.fillStyle = COL[o.t]; ctx.fillRect(o.x, o.y, o.w, o.h);
    ctx.strokeStyle = "#000"; ctx.strokeRect(o.x, o.y, o.w, o.h);
    em(o.ic || (o.t === "drawer" ? "🗄️" : ""), o.x + o.w / 2, o.y + o.h / 2, 30);
    if (o.t === "hide") txt(o.n, o.x + o.w / 2, o.y + o.h + 10, 12, "#a98");
  });
  objs.filter(o => o.t === "item").forEach(o => em(o.ic, o.x, o.y, 24, o.f ? 0.25 : 1));

  if (M && (MON.includes(scene) || scene === "chase")) monster(M.x, M.y);
  if (!hid) em(scene === "chase" ? "🚗" : "🧍", P.x, P.y, 34);
  if (near && !hid && scene !== "path") txt("Z", P.x, P.y - 32, 20, "#ffd27a");
  if (hid) txt("Caché... (Z pour sortir)", W / 2, 24, 16, "#ffd27a");

  // Obscurité selon le niveau de graphismes
  let r = [0, 9999, 280, 190][gfx];
  if (gfx === 3) r += Math.random() * 14 - 7;
  if (gfx === 1) { ctx.fillStyle = "rgba(0,0,0,.3)"; ctx.fillRect(0, 0, W, H); }
  else {
    const g = ctx.createRadialGradient(P.x, P.y, 20, P.x, P.y, r);
    g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,.93)");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
}

function monster(x, y) {
  ctx.fillStyle = "#050505"; ctx.strokeStyle = "#333"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.ellipse(x, y + 8, 17, 24, 0, 0, 7); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(x, y - 16, 13, 0, 7); ctx.fill(); ctx.stroke();
  ctx.shadowColor = "#f00"; ctx.shadowBlur = 12; ctx.fillStyle = "#f22";
  ctx.fillRect(x - 7, y - 19, 5, 3); ctx.fillRect(x + 2, y - 19, 5, 3);
  ctx.save(); ctx.translate(x + 20, y + 2); ctx.rotate(.5);
  ctx.fillStyle = "#d00"; ctx.fillRect(-2, -16, 4, 22); ctx.fillStyle = "#500"; ctx.fillRect(-3, 6, 6, 7);
  ctx.restore(); ctx.shadowBlur = 0;
}

// Scène "3D" : route en perspective, arbres, maison qui grandit, scooter vu de dos
function drawRide() {
  const p = rt / R, sp = p < .7 ? 1 : Math.max(.2, 1 - (p - .7) * 2.6), off = rt * .012 * sp;
  let g = ctx.createLinearGradient(0, 0, 0, 230); g.addColorStop(0, "#04050b"); g.addColorStop(1, "#141a2a");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, 230);
  ctx.fillStyle = "#e8e4cc"; ctx.beginPath(); ctx.arc(620, 70, 26, 0, 7); ctx.fill();
  ctx.fillStyle = "#07100a"; ctx.fillRect(0, 230, W, 270);
  ctx.fillStyle = "#1e1e1e"; ctx.beginPath(); ctx.moveTo(396, 230); ctx.lineTo(404, 230); ctx.lineTo(700, 500); ctx.lineTo(100, 500); ctx.fill();
  for (let i = 0; i < 10; i++) { const d = Math.pow((i / 10 + off) % 1, 2); ctx.fillStyle = "#bbb"; ctx.fillRect(399 - d * 6, 230 + d * 270, 2 + d * 12, 2 + d * 40); }
  if (p > .4) {
    const s = Math.min(1, (p - .4) / .6), s2 = s * s, hs = 14 + s2 * 260, by = 232 + s2 * 20;
    ctx.fillStyle = "#17110d"; ctx.fillRect(400 - hs * .9, by - hs, hs * 1.8, hs);
    ctx.fillStyle = "#0a0706"; ctx.beginPath(); ctx.moveTo(400 - hs * 1.05, by - hs); ctx.lineTo(400, by - hs * 1.6); ctx.lineTo(400 + hs * 1.05, by - hs); ctx.fill();
    ctx.fillStyle = "#ffcc66"; [-.55, .35].forEach(k => ctx.fillRect(400 + hs * k, by - hs * .7, hs * .2, hs * .25));
    if (p > .65) { const gw = 30 + s2 * 330; ctx.fillStyle = "#000"; ctx.fillRect(400 - gw, by - hs * .5, 6 + s2 * 8, hs * .5 + s2 * 40); ctx.fillRect(400 + gw, by - hs * .5, 6 + s2 * 8, hs * .5 + s2 * 40); ctx.fillRect(400 - gw, by - hs * .35, gw * 2, 3 + s2 * 4); }
  }
  for (let i = 0; i < 14; i++) {
    const d = Math.pow((i / 14 + off) % 1, 2), y = 230 + d * 270, x = 400 + (i % 2 ? -1 : 1) * (50 + d * 520), z = 10 + d * 170;
    ctx.fillStyle = "#050c06"; ctx.beginPath(); ctx.moveTo(x, y - z * 1.8); ctx.lineTo(x - z * .5, y); ctx.lineTo(x + z * .5, y); ctx.fill();
  }
  ctx.fillStyle = "rgba(255,240,180,.1)"; ctx.beginPath(); ctx.moveTo(380, 440); ctx.lineTo(420, 440); ctx.lineTo(600, 240); ctx.lineTo(200, 240); ctx.fill();
  const b = Math.sin(rt * .4) * 2 * sp;
  ctx.fillStyle = "#111"; ctx.fillRect(390, 430 + b, 20, 70);
  ctx.fillStyle = "#2b3a55"; ctx.fillRect(375, 380 + b, 50, 60);
  ctx.fillStyle = "#c8a064"; ctx.fillRect(372, 425 + b, 56, 22);
  ctx.fillStyle = "#d8b090"; ctx.beginPath(); ctx.arc(400, 366 + b, 14, 0, 7); ctx.fill();
  const v = ctx.createRadialGradient(400, 250, 200, 400, 250, 520); v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,.8)");
  ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  txt(p < .3 ? "Une livraison de pizza, tard le soir, au fond de la forêt..." : p < .75 ? "Une lueur au loin... une maison perdue." : "Un portail... une silhouette : « Approche... »", W / 2, 40, 20);
  txt("Entrée : passer", W - 80, 480, 13, "#777");
}

function loop() { t++; update(); draw(); act = false; skip = false; requestAnimationFrame(loop); }
loop();