// ===== Livraison Mortelle =====
const cv = document.getElementById("c"), ctx = cv.getContext("2d"), msg = document.getElementById("msg");
const $ = id => document.getElementById(id);
const W = 800, H = 500;

let scene = "menu", hard = false, gfx = 2, last = null, act = false, skip = false, t = 0;
let P = { x: 400, y: 450, s: 3 }, M = null, objs = [], houseObjs = null, cut = null, near = null;
let fd = 0, hid = false, drawers = 0, hasLetter = false, hasKey = false, knocked = 0, flashT = 0, timer = 0, overTxt = "";
const keys = {};

// ---------- Menu ----------
$("play").onclick = () => { $("menu").classList.add("hidden"); newGame(); };
$("diff").onclick = () => { hard = !hard; $("diff").textContent = hard ? "Mode difficile" : "Mode facile"; };
let paused = false, vol = 0.6, rt = 0, ro = 0, L = null, cz = 0, torch = false, fo = 0, fw = 0, ph = 0, jt = 0, jmp = false, lg = [], hist = [], rk = [], gap = 110, endTxt = "", letterRead = false, jc = 0, jcv = 0, jcPrev = "house", jcTxt = "", vt = 0, plx = 0, plz = 3, ply = 0, pst = 0, pt = 0, lgx = 6, lgz = 22, lgR = null, murk = 0, ckey = false, wall = 0, ws = 0, c2 = 0, rats = [], ghost = null, crowDone = false, scr = 0, ov = 0, reviveIdx = -1, rst = false, glued = false, ul = 0, fl2 = 0, hideT = 0, hideObj = null, invOpen = false, phase2 = false, kA = false, kB = false, glue = false, stormSeen = false, pu = 0, rd = 0, sn = 0, cw = 0, ex = 0, cli = 0, legs = true, rn8 = 0, cl = 0, dv = 0, winSeen = false, cr = 0, rx = 0, rg = 100, tr = [], rn = 0, bk = 0, hits = 0, swing = 0, ct = 0, dr = 0, winT = 0, lit = false;
const R = 1100, MON = ["house", "upper"];
const setPause = q => { paused = q; if (ac) q ? ac.suspend() : ac.resume(); if (typeof speechSynthesis !== "undefined") q ? speechSynthesis.pause() : speechSynthesis.resume(); };
const toggleOpt = () => { const open = $("options").classList.contains("hidden"); $("options").classList.toggle("hidden", !open); setPause(open); document.activeElement.blur(); };
$("pause").onclick = () => { setPause(!paused); document.activeElement.blur(); };
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
  if (!ac || ac.state !== "running") return;
  const o = ac.createOscillator(), g = ac.createGain(), n = ac.currentTime;
  o.type = type; o.frequency.value = f;
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f + slide), n + d);
  g.gain.setValueAtTime(v, n); g.gain.exponentialRampToValueAtTime(.001, n + d);
  o.connect(g); g.connect(mg); o.start(); o.stop(n + d);
}
function noise(d, v, freq = 400) {
  if (!ac || ac.state !== "running") return;
  const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(), n = ac.currentTime;
  s.buffer = noiseBuf; f.type = "lowpass"; f.frequency.value = freq;
  g.gain.setValueAtTime(v, n); g.gain.exponentialRampToValueAtTime(.001, n + d);
  s.connect(f); f.connect(g); g.connect(mg); s.start(); s.stop(n + d);
}
const stepSnd = v => { noise(.16, v * 1.3, 130 + Math.random() * 60); tone(48, .18, "sine", v * .8, -14); };
function stairsSnd() { for (let i = 0; i < 7; i++) setTimeout(() => { noise(.1, .5, 500); tone(90 + i * 6, .1, "square", .06); }, i * 170); }
function engine(on, rate = 1) {
  if (!ac || ac.state !== "running") return;
  if (on && !eng && ac.state === "running") {
    const o = ac.createOscillator(), l = ac.createOscillator(), lg = ac.createGain(), f = ac.createBiquadFilter(), g = ac.createGain();
    o.type = "sawtooth"; f.type = "lowpass"; f.frequency.value = 380; g.gain.value = .025; lg.gain.value = .015;
    l.connect(lg); lg.connect(g.gain); o.connect(f); f.connect(g); g.connect(mg); o.start(); l.start(); eng = { o, l };
  }
  if (eng) { eng.o.frequency.value = 48 + rate * 16; eng.l.frequency.value = 10 + rate * 5; if (!on) { eng.o.stop(); eng.l.stop(); eng = null; } }
}
// Une musique différente par étage
const MUS = {
  intro: { n: [55, 0, 55, 58, 0, 55, 0, 62], type: "sawtooth", bpm: 70, v: .1, d: .3 },
  cave:  { n: [41, 0, 0, 0, 39, 0, 0, 0], type: "sine", bpm: 50, v: .3, d: 1.5 },
  house: { n: [110, 0, 155, 0, 110, 0, 147, 0], type: "triangle", bpm: 90, v: .12, d: .5 },
  upper: { n: [330, 311, 0, 277, 0, 0, 262, 0], type: "triangle", bpm: 70, v: .07, d: .9 },
  attic: { n: [466, 0, 0, 440, 0, 0, 415, 0, 0, 0], type: "square", bpm: 60, v: .03, d: 1.2 }
};
const FILES = {};
if (typeof Audio !== "undefined") ["rain", "thunder", "bell", "step"].forEach(n => { const a = new Audio(n + ".mp3"); a.addEventListener("canplaythrough", () => { FILES[n] = a; }); });
let rainSrc = null;
function rainOn(l) {
  if (FILES.rain) { FILES.rain.loop = true; FILES.rain.volume = Math.min(1, vol * l * 4); FILES.rain.play().catch(() => {}); return; }
  if (!ac || ac.state !== "running") return;
  if (!rainSrc) {
    const b = ac.createBuffer(1, ac.sampleRate * 3, ac.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const so = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); so.buffer = b; so.loop = true; f.type = "bandpass"; f.frequency.value = 3500; if (f.Q) f.Q.value = .4;
    so.connect(f); f.connect(g); g.connect(mg); so.start(); rainSrc = { so, g };
  }
  rainSrc.g.gain.value = l;
}
function rainOff() { if (FILES.rain) FILES.rain.pause(); if (rainSrc) { rainSrc.so.stop(); rainSrc = null; } }
function thunder() {
  if (FILES.thunder) { FILES.thunder.volume = vol; FILES.thunder.currentTime = 0; FILES.thunder.play().catch(() => {}); return; }
  noise(.25, .9, 6000); [0, .35, .8, 1.5, 2.4].forEach((d, i) => setTimeout(() => noise(2.2 - i * .3, .7 - i * .1, 140 + i * 30), d * 1000)); tone(40, 3, "sine", .25, -12);
}
function bell() { if (FILES.bell) { FILES.bell.volume = vol; FILES.bell.play().catch(() => {}); return; } [1568, 2349, 3136].forEach((f, i) => tone(f, 1.2 - i * .3, "sine", .12 - i * .03)); }
function speak(text, who, rate) {
  if (typeof speechSynthesis === "undefined") return;
  speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = "fr-FR"; u.volume = vol;
  const vs = speechSynthesis.getVoices().filter(v => v.lang.startsWith("fr")), ml = vs.filter(v => /thomas|paul|henri|antoine|male|homme|claude|nicolas|lucas|mathieu/i.test(v.name)), pool = ml.length ? ml : vs;
  if (pool.length) u.voice = pool[who === "old" ? pool.length - 1 : 0];
  u.pitch = who === "old" ? .1 : .5; u.rate = rate || (who === "old" ? 1.05 : 1.25); speechSynthesis.speak(u);
}
const stopSpeak = () => { if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel(); };
const sr = a => { a = Math.sin(a * 127.1) * 43758.5453; return a - Math.floor(a); };
const heavy = v => { noise(.18, v * .5, 170); tone(55, .15, "square", v * .15, -20); };
const drag = v => noise(.45, v * .35, 800);
const scream = () => { tone(520, .9, "sawtooth", .06, 380); tone(780, .7, "square", .03, 200); setTimeout(() => tone(450, .8, "sawtooth", .06, 420), 450); noise(.8, .08, 2500); };
MUS.back = { n: [58, 0, 0, 0], type: "sawtooth", bpm: 40, v: .05, d: 2.5 };
const growl = () => { tone(75, .9, "sawtooth", .14, -25); tone(112, .7, "square", .05, -40); noise(.8, .15, 600); };
function noiseBP(d, v, freq, q = 1) { if (!ac || ac.state !== "running") return; const so = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(), n = ac.currentTime; so.buffer = noiseBuf; f.type = "bandpass"; f.frequency.value = freq; if (f.Q) f.Q.value = q; g.gain.setValueAtTime(v, n); g.gain.exponentialRampToValueAtTime(.001, n + d); so.connect(f); f.connect(g); g.connect(mg); so.start(); so.stop(n + d); }
const leafSnd = (v, sd = 0) => {
  if (FILES.step) { const a = FILES.step.cloneNode(); a.volume = Math.min(1, v * vol * 1.4); a.playbackRate = .6 + Math.random() * .1; a.play().catch(() => {}); return; }
  noise(.22, v * 1.5, 80 + sd * 15); tone(38 + sd * 4, .22, "sine", v * .9, -14); noiseBP(.2, v * .25, 200 + sd * 30, .7);
  setTimeout(() => noiseBP(.06, v * .15, 700 + Math.random() * 500, 1.5), 60);
};
const batSnd = () => { for (let i = 0; i < 6; i++) setTimeout(() => noiseBP(.05, .4, 2500, 2), i * 60); tone(3200, .08, "sine", .05, 500); setTimeout(() => tone(3600, .08, "sine", .05, -400), 200); };
const drawerSnd = () => { noiseBP(.25, .35, 500, 1.2); tone(110, .2, "triangle", .1, 30); };
const doorSnd = () => { tone(140, .5, "sawtooth", .06, -50); noiseBP(.4, .15, 900, 2); };
const treeFall = () => { noise(.6, .9, 500); tone(55, .5, "sawtooth", .18, -30); setTimeout(() => noiseBP(.05, 1, 6000, 1), 60); setTimeout(() => noise(.8, .7, 300), 300); };
const moan = () => { tone(180, 2.2, "sine", .1, -60); tone(185, 2.2, "sine", .08, -70); noiseBP(2, .12, 600, 3); };
const ambient = () => { const r = Math.random(); if (r < .34) tone(80 + Math.random() * 40, .9, "sawtooth", .05, -30); else if (r < .67) { noise(.08, .5, 400); setTimeout(() => noise(.08, .4, 400), 220); } else noiseBP(1.2, .08, 3500, 4); };
const breath = () => { noise(.35, .2, 1500); setTimeout(() => noise(.45, .26, 1000), 420); };
const crowSnd = () => { for (let i = 0; i < 4; i++) setTimeout(() => tone(480 + Math.random() * 120, .2, "sawtooth", .05, -220), i * 160 + Math.random() * 80); };
MUS.cell = { n: [55, 0, 0, 78, 0, 0, 52, 0, 0, 0, 466, 0], type: "triangle", bpm: 52, v: .14, d: 1.8 };
MUS.cabin = { n: [220, 0, 0, 233, 0, 0, 196, 0, 0, 0], type: "sine", bpm: 44, v: .06, d: 2.2 };
MUS.menu = { n: [262, 330, 392, 494, 0, 0, 262, 330, 392, 440, 0, 0], type: "sine", bpm: 56, v: .3, d: 1.6 };
const spd = p => p < .45 ? 1 : p < .78 ? 1 - (p - .45) * 2.1 : 0;
addEventListener("pointerdown", () => { initAudio(); if (scene === "menu" && mus !== "menu") music("menu"); });
setInterval(() => { if (stormSeen && (scene === "house" || scene === "cave")) thunder(); }, 10000);
setInterval(() => { if (scene === "menu" && ac) { tone(140, .9, "sawtooth", .025, -70); noise(1.3, .06, 500); tone(85, 1.2, "sawtooth", .02, -20); } }, 10000);
const MS = { run: "intro", forest: "upper", path: "intro", cave: "cave", house: "house", upper: "upper", attic: "attic", chase: "intro" };
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
  if (e.key.toLowerCase() === "r") rst = true;
  if (e.key.toLowerCase() === "c") ckey = true;
  if (e.key === " ") { e.preventDefault(); jmp = true; }
  if (e.key.toLowerCase() === "a" && ["house", "upper", "attic", "cave"].includes(scene)) invOpen = !invOpen;
  if ((e.key === "p" || e.key === "P" || e.key === "Escape") && $("options").classList.contains("hidden")) setPause(!paused);
});
addEventListener("keyup", e => {
  delete keys[e.key];
  if (last === e.key) last = ARROWS.find(k => keys[k]) || null;
});

// ---------- Outils ----------
function say(txt, s = 3) { msg.textContent = txt; msg.style.opacity = 1; flashT = s * 60; }
const REV = { house: [5, 22], upper: [6, 6], attic: [7, 7], cave: [3, 24], chase: [9, 9], run: [18, 18] };
function lose(txt) { const r = REV[scene]; reviveIdx = r ? r[phase2 ? 1 : 0] : -1; scene = "over"; ov = 0; overTxt = txt; msg.style.opacity = 0; engine(false); }
function reviveTo(i) { engine(false); stopSpeak(); hid = false; houseObjs = null; SC[i][2](false); if (!mus || mus === "menu") music("intro"); say("Tu reviens à la vie...", 2.5); }
function showLetter(lines, next, who) { L = { lines, t: 0, next, k: (who === "old" ? 15 : 18) / 60 }; scene = "letter"; speak(lines.join(" "), who); }
function toMenu() { music("menu"); scene = "menu"; msg.style.opacity = 0; $("menu").classList.remove("hidden"); }
function cutscene(lines, next) { cut = { lines, i: 0, t: 0, next }; scene = "cut"; }

function newGame() {
  hasKey = false; hasLetter = false; knocked = 0; drawers = 0; houseObjs = null; phase2 = false; kA = kB = glue = glued = false; stormSeen = false; winSeen = false; crowDone = false; invOpen = false; hid = false; torch = false; rats = []; ghost = null; paused = false;
  initAudio(); rt = 0; ro = 0; scene = "ride"; music("intro");
}

function go(s, x = 100, y = 420) {
  scene = s; hid = false; P.s = 3; P.x = x; P.y = y; music(MS[s] || null);
  if (s === "path" || s === "chase" || s === "run") bpm = 150;
  rats = ["house", "upper", "attic", "cave"].includes(s) ? [0, 1, 2].map(i => ({ x: 100 + i * 250, y: 440 - (i % 2) * 70, v: (i % 2 ? 1 : -1) * 1.2 })) : []; ghost = null;
  if (s === "run") { rx = 0; rg = 100; tr = []; rn = 0; }
  if (MON.includes(s)) { const q = { house: [700, 420], upper: [600, 380], attic: [700, 430] }[s]; M = { x: q[0], y: q[1], alert: 0, wp: [q[0], q[1]], st: 0 }; }
  if (s === "path") { P.x = 400; P.y = 450; objs = []; }
  if (s === "cave") {
    drawers = 0; hasLetter = phase2;
    objs = Array.from({ length: 12 }, (_, i) => ({ t: "drawer", x: 90 + (i % 6) * 100, y: 50 + Math.floor(i / 6) * 90, w: 80, h: 60, letter: !phase2 && i === 8, kb: false }));
    objs.push({ t: "stairs", x: 710, y: 400, w: 70, h: 80, ic: "🪜" }); if (phase2) objs.push({ t: "bench", x: 300, y: 390, w: 140, h: 60 });
  }
  if (s === "house") {
    if (!houseObjs) {
      houseObjs = [
        { t: "hide", n: "placard", ic: "🚪", x: 30, y: 50, w: 70, h: 100 },
        { t: "hide", n: "lit", v: 0, x: 380, y: 50, w: 120, h: 70 },
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
    if (phase2 && !houseObjs.p2) { houseObjs.p2 = 1; houseObjs.forEach(o => { if (o.n === "table") { o.x += o.x < 400 ? -40 : 50; o.y += 30; o.br = 1; } if (o.t === "item") o.f = 1; }); houseObjs.push({ t: "down", ic: "🪜", x: 40, y: 400, w: 80, h: 80, to: "cave", sx: 640, sy: 400 }); }
    objs = houseObjs;
  }
  if (s === "attic") {
    objs = [
      { t: "key", ic: "🔑", x: 600, y: 240, w: 30, h: 30 },
      { t: "window", x: 350, y: 0, w: 100, h: 40 },
      { t: "hide", n: "caisse", ic: "📦", x: 300, y: 300, w: 90, h: 60 },
      { t: "hide", n: "malle", ic: "🧳", x: 480, y: 80, w: 100, h: 60 },
      { t: "down", ic: "🪜", x: 40, y: 400, w: 80, h: 80, to: "upper", sx: 600, sy: 140 }
    ];
    if (hasKey || phase2) objs.shift(); if (phase2) objs.push({ t: "glue", x: 700, y: 330, w: 70, h: 24 }, { t: "cab", k: "B", ic: "🗄️", x: 140, y: 50, w: 80, h: 60 });
  }
  if (s === "upper") objs = [
    { t: "hide", n: "placard", ic: "🚪", x: 30, y: 50, w: 70, h: 100 },
    { t: "hide", n: "lit", v: 1, x: 330, y: 60, w: 140, h: 80 },
    { t: "hide", n: "lit", v: 1, x: 560, y: 300, w: 140, h: 80 },
    { t: "up", ic: "🪜", x: 690, y: 50, w: 80, h: 70, to: "attic", sx: 200, sy: 400 },
    { t: "down", ic: "🪜", x: 40, y: 400, w: 80, h: 80, to: "house", sx: 700, sy: 140 }
  ];
  if (s === "upper" && phase2) objs.push({ t: "cab", ic: "🗄️", x: 560, y: 50, w: 80, h: 60, k: "A" });
  if (s === "chase") { P.x = 400; P.y = 330; P.s = 4; M = null; timer = 0; objs = []; hist = []; rk = []; gap = 110; hits = 0; wall = 0; engine(true, 4); }
}

// ---------- Actions (touche Z) ----------
function use(o) {
  if (o.t === "drawer") {
    o.open = 1; drawers++; drawerSnd();
    if (o.letter) { o.t = "letter"; o.ic = "📜"; say("Un vieux papier ! Appuie sur Z pour le prendre."); }
    else { o.t = "empty"; if (o.kb) { kB = true; say("Un morceau de clé cassé, au fond du tiroir !", 4); } else say("Tiroir ouvert... rien d’utile."); }
  } else if (o.t === "letter") {
    hasLetter = true; o.t = "empty";
    showLetter(["Si tu lis ceci, tu es comme moi : livreur, piégé.", "Il m’a assommé sur le seuil. Je compte les jours.", "Je l’ai blessé à la jambe : il traîne le pied. Écoute-le.", "Cache-toi : placards, lits, sous les tables.", "Ne renverse rien. Lampes, bougies... il entend tout.", "La porte est cadenassée. La clé est dans la maison,", "peut-être au grenier. Fuis, et ne reviens jamais..."], () => { scene = "cave"; }, "young");
  } else if (o.t === "stairs") {
    if (!hasLetter) say("Trouve d’abord le papier dans les tiroirs.");
    else { stairsSnd(); go("house"); say("Le maître rôde. Ne fais pas de bruit.", 4); }
  } else if (o.t === "hide") { if (o.n === "placard") doorSnd(); hideT = 24; hideObj = o; hid = true; P.x = o.x + o.w / 2; P.y = o.y + o.h / 2; say("Tu te caches (" + o.n + "). Z pour sortir.", 2); }
  else if (o.t === "cab") { if (!o.done) { o.done = 1; drawerSnd(); if (o.k === "B") kB = true; else kA = true; say("Dans le tiroir : un morceau de clé de la maison ! (A : inventaire)", 4); } else say("Vide."); }
  else if (o.t === "glue") { glue = true; o.t = "empty"; say("Un tube de colle forte, caché sous une latte du plancher !", 4); }
  else if (o.t === "bench") { if (kA && kB && glue && !glued) { glued = true; say("Sur l’établi, tu colles les deux morceaux : la clé est reconstituée !", 4); } else if (glued) say("La clé est recollée. Va ouvrir le cadenas de la porte d’entrée."); else say("Un établi. Il faut les deux morceaux de clé et la colle (A : inventaire).", 4); }
  else if (o.t === "door") { if (!phase2) say("La porte d’entrée est cadenassée."); else if (glued) { ul = 0; scene = "unlock"; } else say("Cadenas. Recolle d’abord la clé sur l’établi du sous-sol (A : inventaire).", 4); }
  else if (o.t === "window") { winT = 0; scene = phase2 ? "storm" : "win"; }
  else if (o.t === "down" && scene === "attic" && !(phase2 ? stormSeen : winSeen)) say(phase2 ? "Regarde d’abord par la fenêtre... le ciel est étrange (Z)." : "Quelque chose bouge dehors... regarde par la fenêtre (Z).", 3);
  else if (o.to) { stairsSnd(); go(o.to, o.sx, o.sy); say(o.to === "attic" ? "Le monstre ne peut pas monter ici. Une fenêtre au fond : Z pour regarder." : "Tu entends des pas... reste discret.", 4); }
  else if (o.t === "key") { hasKey = true; objs = objs.filter(k => k !== o); say("Tu as trouvé la clé ! Direction le garage, au rez-de-chaussée."); }
  else if (o.t === "garage") {
    if (phase2) say("Le garage est vide : la voiture a disparu...");
    else if (!hasKey) say("Le garage est fermé à clé.");
    else cutscene([["🚗", "Tu démarres la voiture... Il arrive !", 3]], () => go("chase"));
  }
}

// ---------- Mise à jour ----------
function update() {
  if (flashT > 0 && --flashT === 0) msg.style.opacity = 0;
  const wr = scene === "storm" ? .02 + Math.min(.2, Math.max(0, (winT - 150) / 2000)) : (scene === "puddle" || scene === "road2d" || scene === "flee" || scene === "unlock") ? .22 : (stormSeen && ["house", "upper", "attic", "cave"].includes(scene)) ? .07 : 0;
  if (wr && !paused) rainOn(wr); else if (!wr) rainOff();
  if (scene === "menu" || paused || invOpen) return;
  if (hideT > 0) hideT--;
  if (rats.length && ["house", "upper", "attic", "cave"].includes(scene)) { rats.forEach(r => { r.x += r.v; if (r.x < 20 || r.x > W - 20 || Math.random() < .004) r.v *= -1;  }); if (Math.random() < .004) ambient(); if (!ghost && (scene === "house" || scene === "upper") && Math.random() < .0006) { ghost = { x: Math.random() < .5 ? -60 : W + 60, y: 120 + Math.random() * 220 }; ghost.v = ghost.x < 0 ? 1.6 : -1.6; moan(); } if (ghost) { ghost.x += ghost.v; if (ghost.x < -80 || ghost.x > W + 80) ghost = null; } }
  if (scene === "ride") {
    rt++; const p = rt / R; ro += .012 * spd(p);
    engine(p < .78, 3 * spd(p) + .5); bpm = 70 + p * 110;
    if (rt === Math.floor(.78 * R)) noise(.8, .4, 900);
    if (rt === 100 || rt === 150 || rt === 210) crowSnd();
    if (rt === Math.floor(.88 * R)) { tone(120, 1.8, "sawtooth", .12, -60); noise(1.6, .15, 600); thunder(); }
    if (rt === Math.floor(.88 * R) + 4) batSnd();
    if (p > .8 && rt % 38 === 0) stepSnd(.12 + p * .3);
    if (skip || rt > R) { engine(false); go("path"); say("Avance tout droit avec la flèche ↑", 4); }
    return;
  }
  if (scene === "drop") {
    dr++;
    if (dr === 320) tone(180, 1.2, "sawtooth", .2, -100);
    if (dr === 340) noise(.3, .6, 300);
    if (dr === 450) { noise(.5, 1, 200); tone(50, .4, "square", .3, -20); }
    if (dr === 540) growl();
    if (dr === 600) { noise(.6, 1, 800); tone(60, .5, "square", .3, -30); }
    if (dr % 40 === 0 && dr < 220) stepSnd(.15);
    if (skip || dr > 720) { go("cave"); say("Tu te réveilles dans un sous-sol. Fouille les tiroirs (Z).", 5); }
    return;
  }
  if (scene === "storm") { winT++; if (winT === 520) thunder(); if (skip || winT > 720) { stormSeen = true; go("attic", 400, 200); say("Un gros orage se prépare... ", 4); } return; }
  if (scene === "win") {
    winT++; if (winT < 340 && winT % 38 === 0) heavy(.2);
    if (winT === 60) say("Qu’est-ce qu’il fait avec ma moto ?!", 3); if (winT === 180) say("Ma moto ! Il me l’a volée...", 3); if (winT === 300) say("Il la ramène vers la maison... il compte rester longtemps.", 3.5);
    if (winT > 430 && winT % 55 === 0) treeFall(); if (winT === 600) treeFall();
    if (skip || winT > 920) { winSeen = true; go("attic", 400, 200); say("Il n’y a pas que le monstre qui est un danger maintenant...", 6); }
    return;
  }
  if (scene === "car") {
    cr++; if (cr === 20) { noise(.3, .7, 300); tone(70, .2, "square", .2, -20); } if (cr === 40) say("J’essaie de démarrer la voiture...", 3);
    if (cr === 110 || cr === 170) for (let i = 0; i < 6; i++) setTimeout(() => { noise(.12, .5, 900); tone(90 + i * 10, .1, "sawtooth", .1); }, i * 120);
    if (cr === 250) { say("Le moteur prend feu !", 3); noise(1.2, .6, 500); tone(60, 1, "sawtooth", .2, 40); }
    if (cr > 250 && cr % 9 === 0) noise(.1, .3, 3500);
    if (cr === 400) { growl(); say("Il arrive ! Il faut sortir d’ici !", 3); }
    if (skip || cr > 520) { ex = 0; scene = "exit"; }
    return;
  }
  if (scene === "crawl") { if (keys.ArrowUp) { cw += .0016; if (t % 30 === 0) leafSnd(.12, (t / 30) % 2 | 0); } if (t % 200 === 0) heavy(.08); if (t % 70 === 0) breath(); if (cw >= 1) { cr = 0; scene = "car"; } return; }
  if (scene === "exit") { ex++; if (ex === 10) { noise(.2, .8, 500); tone(120, .15, "square", .2, -40); } if (ex > 50 && ex % 18 === 0) leafSnd(.3, (ex / 18) % 2 | 0); if (skip || ex > 240) { go("run"); say("Cours ! ← → esquive, Espace saute les rondins.", 4); } return; }
  if (scene === "jscare") { jc++; if (jc === 1) { scream(); noise(.4, 1, 3000); tone(120, .5, "sawtooth", .3, -60); } if (jc > 80) { scene = jcPrev; lose(jcTxt); } return; }
  if (scene === "vortex") { vt++; if (vt === 1) { music("vortex"); speak("Ça a commencé à mes douze ans, à la piscine municipale.", "old", .85); noise(2, .2, 300); } if (vt === 230) { noise(1.2, .5, 1500); tone(200, 1.2, "sine", .2, 800); } if (skip || vt > 340) { rpool(); scene = "pool"; music("pool"); } return; }
  if (scene === "pool") { updPool(); return; }
  if (scene === "c2b") { updC2b(); return; }
  if (scene === "wasted") { ws++; if (ws === 25) { noise(1.5, 1, 300); tone(50, 1.2, "sawtooth", .3, -20); } if (ws === 95) tone(110, 1.5, "sawtooth", .12, -40); if (ws > 330) { scene = "chase"; lose("Tu as percuté un arbre : la voiture a explosé."); } return; }
  if (scene === "ch2") { c2++; if (c2 === 1) music("ch2"); if (c2 === 560 || c2 === 600) bark();
    if (c2 >= 760 && c2 % 30 === 0) { if ((c2 / 30) % 2) { noiseBP(.05, .35, 1800, 3); tone(260, .06, "square", .05); } else { noiseBP(.05, .3, 1300, 3); tone(200, .06, "square", .05); } }
    if (c2 >= 760 && Math.random() < .08) noiseBP(.03 + Math.random() * .05, .05 + Math.random() * .12, 1500 + Math.random() * 3000, 2);
    if (c2 >= 760 && c2 % 90 === 0) noise(.9, .05, 160);
    if (c2 === 1260) speak("Alors, où en étions-nous, mon grand ?", "old", .85); if (c2 === 1560) speak("Non... je préfère tout te raconter depuis le début.", "old", .85); if (c2 === 1700) speak("Ces phénomènes étranges ont commencé quand j’étais enfant.", "old", .85); if (skip) c2 = c2 < 760 ? 760 : c2 + 40; if (c2 > 1880) { vt = 0; scene = "vortex"; } return; }
  if (scene === "unlock") { ul++; if (ul === 40) { tone(900, .06, "square", .15); noise(.05, .5, 4000); } if (ul === 100) { tone(300, .3, "square", .2, -100); noise(.2, .6, 2500); } if (ul === 135) { noise(.3, .8, 1500); tone(180, .2, "square", .2, -60); } if (ul === 160) tone(110, 1.6, "sawtooth", .1, -50); if (ul === 200) thunder(); if (skip || ul > 280) { fl2 = 0; scene = "flee"; } return; }
  if (scene === "flee") { fl2++; if (fl2 % 13 === 0) leafSnd(.6, (fl2 / 13) % 2 | 0); if (fl2 === 140) thunder(); if (fl2 > 300) { pu = 0; scene = "puddle"; } return; }
  if (scene === "puddle") {
    pu++; if (pu % 150 === 90) thunder();
    if (pu < 200 && pu % 14 === 0) { leafSnd(.5, (pu / 14) % 2 | 0); if (pu % 28 === 0) drag(.3); }
    if (pu === 220) { noise(.5, .9, 900); tone(60, .3, "square", .2, -20); }
    if (pu === 520) { noise(.2, .8, 1500); tone(180, .15, "square", .2, -60); }
    if (pu === 560) { noise(.3, 1, 600); tone(70, .3, "square", .3, -30); }
    if (pu === 600) scream(); if (pu === 680) noise(.4, .7, 300);
    if (pu > 720 && pu % 24 === 0) leafSnd(.5, (pu / 24) % 2 | 0);
    if (skip || pu > 900) { rd = 0; scene = "road2d"; music("cabin"); say("Le vieux livreur te suit. Marche vers la droite (→).", 5); }
    return;
  }
  if (scene === "road2d") { if (keys.ArrowRight) { rd += 3; if (t % 24 === 0) leafSnd(.35, (t / 24) % 2 | 0); } if (rd > 2190) { sn = 0; scene = "station"; music("cave"); } return; }
  if (scene === "station") { sn++; if (sn === 200) bell(); if (sn === 500) tone(60, 1.2, "sawtooth", .12, 20); if (sn === 600) { tone(130, 1.6, "sawtooth", .1, -60); valChap1(); } if (sn > 500 && sn % 6 === 0) noise(.05, .3, 3000); if (skip && sn > 100 || sn > 760) { endTxt = "À suivre..."; scene = "end"; } return; }
  if (scene === "retry") { rn8++; if (skip || rn8 > 480) { go("run"); say("Cours ! ← → esquive, Espace saute les rondins.", 4); } return; }
  if (scene === "run") {
    rn++; if (jt > 0 && --jt === 0) leafSnd(.7);
    if (rn <= 1100) {
      if (keys.ArrowLeft) rx = Math.max(-1, rx - .022); if (keys.ArrowRight) rx = Math.min(1, rx + .022);
      if (jmp && jt <= 0) { jt = 40; tone(300, .2, "sine", .1, 200); }
      fo += .012; if (rn % 16 === 0) leafSnd(.5, (rn / 16) % 2 | 0); if (rn === 300 || rn === 335 || rn === 380) crowSnd(); if (rn % 50 === 10) tr.push({ z: 0, x: Math.random() * 2 - 1, log: Math.random() < .45 });
      tr.forEach(o => { o.z += .0125; if (!o.h && o.z > .9 && o.z < .96 && Math.abs(o.x - rx) < (o.log ? .4 : .28) && !(o.log && jt > 0)) { o.h = 1; scene = "retry"; rn8 = 0; growl(); noise(.3, .6, 300); } });
      tr = tr.filter(o => o.z < 1.05);
      if (rn % 200 === 100) scream();
    } else { if (rn === 1101) { noise(.5, 1, 500); tone(70, .4, "square", .3, -30); say("Tu trébuches...", 3); } if (rn > 1190) { scene = "back"; bk = 0; music("back"); } }
    return;
  }
  if (scene === "back") {
    bk++; if (bk === 30) say("Où... où suis-je ? Ça n’a aucun sens...", 4); if (bk === 250) growl(); if (bk === 400) { noise(.5, 1, 800); scream(); }
    if (bk > 520) { cl = 0; cli = 0; scene = "cell"; music("cell"); }
    return;
  }
  if (scene === "cell") {
    cl++; const dur = (cli === 9 ? 420 : 120) + DLG[cli][1].length * 4;
    if (cli === 8 && cl % 30 === 0) ((cl / 30) % 2 | 0) ? drag(.3) : heavy(.3);
    if (cli === 9 && cl === 60) { noise(.3, .9, 500); tone(90, .2, "square", .3, -40); }
    if (cli === 9 && cl === 70) { scream(); tone(1500, 1, "sawtooth", .1, -500); } if (cli === 9 && cl === 110) heavy(.9); if (cli === 9 && cl === 210) growl(); if (cli === 9 && cl > 210 && cl % 20 === 0) drag(.4);
    if (skip || cl > dur) { cl = 0; if (++cli >= DLG.length) { hasKey = false; phase2 = true; houseObjs = null; go("house", 400, 300); say("Le monstre a tout saccagé : plus de voiture, plus de clés. Trouve de quoi ouvrir la porte.", 7); } }
    return;
  }
  if (scene === "dive") { dv++; if (dv === 100) { noise(.6, .8, 600); leafSnd(1); } if (dv === 125) leafSnd(1); if (skip || dv > 190) { ct = 0; scene = "cat"; } return; }
  if (scene === "cat") {
    ct++; if (ct > 150 && ct < 320 && ct % 40 === 0) heavy(.5);
    if (ct === 140) say("C’est le chat du vieil homme qui vivait ici... celui de la lettre.", 4);
    if (ct === 320) growl();
    if (ct === 380) { tone(900, .5, "sine", .2, -600); noise(.5, .8, 900); }
    if (ct > 780 || (skip && ct > 200)) { cw = 0; scene = "crawl"; music("cabin"); say("Reste bas... rampe doucement vers la voiture avec ↑", 5); }
    return;
  }
  if (scene === "letter") { L.t++; const tot = L.lines.join("").length / L.k; if (skip) { if (L.t < tot) L.t = tot; else { stopSpeak(); L.next(); } } return; }
  if (scene === "screamer") { scr++; if (scr === 1) { crowSnd(); noise(.3, 1, 3000); tone(300, .4, "sawtooth", .3, 500); } if (scr > 55) scene = "cabin"; return; }
  if (scene === "cabin") {
    if (keys.ArrowUp) cz = Math.min(1, cz + .006);
    if (cz > .5 && mus !== "cabin") music("cabin");
    if (!crowDone && t % 300 === 60) { noiseBP(.3, .3, 1200, 2); setTimeout(() => noiseBP(.2, .3, 1500, 2), 250); say("Quelque chose bouge dans le placard...", 3); }
    if (torch) { ex++; if (ex > 150) { fo = 0; fw = 0; ph = 0; lg = []; lit = false; go("forest"); say("Il fait noir. Appuie sur Z pour allumer ta lampe.", 5); return; } }
    if (act) { if (cz > .5 && !torch && !crowDone) say("Quelque chose bouge dans le placard... va voir (clic).", 3); else if (cz > .5 && !torch && !letterRead) say("Une lettre est posée sur la table... lis-la (clic).", 3); else if (cz > .5 && !torch) { torch = true; ex = 0; say("Tu prends la lampe torche et sors de la maison...", 3); } else if (cz > .9 && torch) { fo = 0; fw = 0; ph = 0; lg = []; lit = false; go("forest"); say("Il fait noir. Appuie sur Z pour allumer ta lampe.", 5); } else if (cz > .9) say("Prends d’abord la lampe torche sur la table."); }
    return;
  }
  if (scene === "forest") {
    fd++; if (jt > 0 && --jt === 0) leafSnd(.7);
    if (ph === 0) { if (act && !lit) { lit = true; tone(1200, .04, "square", .05); noise(.05, .4, 3000); say("Lampe allumée. Avance avec ↑", 3); } if (lit && keys.ArrowUp) { fo += .004; fw++; if (fw % 24 === 0) leafSnd(.7, (fw / 24) % 2); if (fw % 24 === 12 && fw > 120) heavy(.08); } if (fw > 380) { ph = 1; fd = 0; say("Des pas derrière toi... tu te retournes.", 3); } }
    else if (ph === 1) { if (fd === 30) crowSnd(); if (fd === 60) tone(200, 1, "sawtooth", .1, -80); if (fd > 150) { ph = 2; fd = 0; say("COURS ! Saute les branchages avec ESPACE !", 4); } }
    else if (ph === 2) {
      fo += .02; if (fd % 14 === 0) leafSnd(.5, (fd / 14) % 2 | 0); if (fd === 200 || fd === 235 || fd === 280) crowSnd();
      if (jmp && jt <= 0) { jt = 40; tone(300, .2, "sine", .1, 200); }
      if (fd % 130 === 40) lg.push({ z: 0 });
      lg.forEach(l => { l.z += .0105; if (!l.h && l.z > .93 && l.z < .97 && jt <= 0) { l.h = 1; fd -= 60; noise(.3, .8, 400); say("Tu as trébuché !", 1); } });
      if (fd > 900) { ph = 3; dv = 0; scene = "dive"; music(null); }
    }
    return;
  }
  if (scene === "cut") {
    cut.t++; if (cut.t === 1 && cut.lines[cut.i][3]) cut.lines[cut.i][3]();
    if (skip || cut.t > cut.lines[cut.i][2] * 60) { cut.i++; cut.t = 0; if (cut.i >= cut.lines.length) cut.next(); }
    return;
  }
  if (scene === "over") { ov++; if (skip && reviveIdx >= 0) reviveTo(reviveIdx); else if (rst) newGame(); else if (ov > 480) toMenu(); return; }
  if (scene === "end") { if (skip) toMenu(); else if (ckey && ch1()) startChapter2(); return; }

  if (!hid && last) {
    const d = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[last];
    P.x += d[0] * P.s; P.y += d[1] * P.s; if (t % 18 === 0) stepSnd(.1);
  }
  const path = scene === "path";
  const ch = scene === "chase";
  P.x = Math.max(path ? 340 : ch ? 250 : 20, Math.min(path ? 460 : ch ? 550 : W - 20, P.x));
  P.y = ch ? Math.max(290, Math.min(360, P.y)) : Math.max(42, Math.min(H - 20, P.y));

  if (path && P.y < 100) {
    dr = 0; scene = "drop";
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
      }
    });
    let sp = (hard ? 2.2 : 1.5) * (phase2 ? 1.25 : 1), tx = M.wp[0], ty = M.wp[1];
    if (M.alert > 0) { M.alert--; tx = P.x; ty = P.y; sp *= 1.2; }
    else {
      if (Math.hypot(M.x - tx, M.y - ty) < 10) M.wp = [60 + Math.random() * 680, 80 + Math.random() * 360];
      if (!hid && Math.hypot(M.x - P.x, M.y - P.y) < (hard ? 220 : 150)) M.alert = 120;
    }
    const d = Math.hypot(tx - M.x, ty - M.y) || 1;
    M.x += (tx - M.x) / d * sp; M.y += (ty - M.y) / d * sp;
    if (++M.st % 26 === 0) { const hv = Math.max(.05, .8 - Math.hypot(M.x - P.x, M.y - P.y) / 600); (M.st / 26 | 0) % 2 ? drag(hv) : heavy(hv); }
    M.near = Math.hypot(M.x - P.x, M.y - P.y) < 130 && !hid; if (M.near && t % 110 === 0) growl();
    if (!hid && Math.hypot(M.x - P.x, M.y - P.y) < 26) jscare("Le maître t’a attrapé...");
  }

  if (scene === "chase") {
    timer++; hist.unshift(P.x); hist.length = 45; if (P.x <= 255 || P.x >= 545) wall++; else wall = 0; if (wall > 180) { ws = 0; scene = "wasted"; engine(false); return; }
    if (timer % 210 === 60) rk.push({ z: 0, x: Math.random() * 1.6 - .8 });
    rk.forEach(r => { r.z += .011; if (!r.h && r.z > .93 && r.z < .97 && Math.abs(400 + r.x * .88 * 300 - P.x) < 36) { r.h = 1; gap -= 45; if (++hits >= 2) lose("Deux rochers... la voiture est détruite."); noise(.4, .8, 300); tone(70, .3, "square", .2, -30); } });
    gap = Math.min(110, gap + .04); if (gap < 85 && timer % 120 === 0) growl();
    if (timer > 1100) {
      engine(false);
      cutscene([["🚗", "Tu t’enfonces dans la forêt... une maison abandonnée apparaît.", 4], ["🏚️", "Tu te gares et pousses la porte.", 3]],
        () => { cz = 0; torch = false; letterRead = false; go("cabin"); });
    }
  }
}

// ---------- Dessin ----------
const BG = { path: "#0c180c", cave: "#1a1410", house: "#241a12", attic: "#1c1612", upper: "#201814", chase: "#0a140a" };
const COL = { hide: "#4a2f1a", drawer: "#3b2a1e", letter: "#5a4a2e", stairs: "#2a2a2a", door: "#222", garage: "#333", up: "#2a2a2a", down: "#2a2a2a", key: "#222", window: "#0a1428", bench: "#3a2614", cab: "#4a3320", glue: "#2a1c12" };
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
  if (scene === "chase") return drawChase();
  if (scene === "wasted") return drawWasted();
  if (scene === "vortex") return drawVortex();
  if (scene === "pool") return drawPool();
  if (scene === "c2b") return drawC2b();
  if (scene === "jscare") return drawJscare();
  if (scene === "ch2") return drawCh2();
  if (scene === "cabin") return drawCabin();
  if (scene === "screamer") return drawScreamer();
  if (scene === "forest") return drawForest();
  if (scene === "drop") return drawDrop();
  if (scene === "win") return drawWin();
  if (scene === "cat") return drawCat();
  if (scene === "car") return drawCar();
  if (scene === "run") return drawRun();
  if (scene === "back") return drawBack();
  if (scene === "retry") return drawRetry();
  if (scene === "dive") return drawDive();
  if (scene === "cell") return drawCell();
  if (scene === "storm") return drawStorm();
  if (scene === "unlock") return drawUnlock();
  if (scene === "flee") return drawFlee();
  if (scene === "puddle") return drawPuddle();
  if (scene === "road2d") return drawRoad2d();
  if (scene === "station") return drawStation();
  if (scene === "crawl") return drawCrawl();
  if (scene === "exit") return drawExit();
  if (scene === "letter") {
    paper(); [[120, 110, 34], [640, 390, 48], [720, 80, 20], [210, 430, 26]].forEach((a, i) => stain(a[0], a[1], a[2], i));
    ctx.textAlign = "left"; ctx.textBaseline = "alphabetic"; let fs = 28; ctx.font = fs + "px 'Segoe Script','Brush Script MT',cursive";
    const mw = Math.max(...L.lines.map(l => (ctx.measureText(l) || { width: 0 }).width)); if (mw > 620) { fs = Math.floor(fs * 620 / mw); ctx.font = fs + "px 'Segoe Script','Brush Script MT',cursive"; }
    ctx.fillStyle = "#2a1810";
    let n = L.t * L.k; L.lines.forEach((l, i) => { ctx.fillText(l.slice(0, Math.max(0, Math.min(l.length, n))), 90, (250 - (L.lines.length - 1) * 21) + i * 42); n -= l.length; });
    txt("Entrée : continuer", W / 2, 470, 14, "#6a5a40"); return;
  }
  if (scene === "cut") {
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
    const l = cut.lines[Math.min(cut.i, cut.lines.length - 1)];
    em(l[0], W / 2 + (l[0] === "🛵" ? cut.t * 2 - 200 : 0), 190, 120);
    txt(l[1], W / 2, 340, 22);
    txt("Entrée : passer", W / 2, 470, 14, "#777");
    return;
  }
  if (scene === "over") {
    ctx.fillStyle = "#2a0505"; ctx.fillRect(0, 0, W, H); txt("☠️", W / 2, 140, 70); txt(overTxt, W / 2, 230, 24, "#d44");
    if (reviveIdx >= 0) txt("Entrée : revivre ici", W / 2, 290, 20); txt("R : recommencer à zéro", W / 2, 325, 20);
    txt("Retour au menu dans " + Math.max(0, Math.ceil(8 - ov / 60)) + " s", W / 2, 370, 16, "#aaa"); ctx.fillStyle = "#a00"; ctx.fillRect(200, 395, 400 * Math.max(0, 1 - ov / 480), 8); return;
  }
  if (scene === "end") {
    ctx.fillStyle = "#050303"; ctx.fillRect(0, 0, W, H); ctx.save(); ctx.globalAlpha = Math.random() < .04 ? .5 : 1; ctx.shadowColor = "#600"; ctx.shadowBlur = 24; txt((endTxt || "Bravo...").toUpperCase(), W / 2, 230, 64, "#a01510"); ctx.restore();
    for (let k = 0; k < 14; k++) { const dx = 140 + k * 38 + sr(k) * 10, len = 20 + sr(k + 3) * 70 + Math.min(60, (t * .2) % 120); ctx.fillStyle = "rgba(130,10,8,.9)"; ctx.fillRect(dx, 250, 4, len); ctx.beginPath(); ctx.arc(dx + 2, 250 + len, 4, 0, 7); ctx.fill(); }
    ctx.strokeStyle = "rgba(160,160,160,.12)"; ctx.lineWidth = 1; for (let k = 0; k < 8; k++) { ctx.beginPath(); ctx.moveTo(sr(k) * W, 0); ctx.lineTo(sr(k) * W + 30, H); ctx.stroke(); }
    if (ch1()) txt("✔ Chapitre 1 validé — C : Chapitre 2", W / 2, 400, 18, "#9c9"); txt("Entrée : retour au menu", W / 2, 440, 16, "#777"); return;
  }

  ctx.fillStyle = BG[scene]; ctx.fillRect(0, 0, W, H);
  if (MON.includes(scene) || scene === "attic") {
    oldFloor();
    if (phase2 && scene === "house") { ctx.fillStyle = "#2a1a0c"; for (let k = 0; k < 14; k++) ctx.fillRect(sr(k) * 760 + 20, 60 + sr(k + 20) * 400, 30 + sr(k + 5) * 30, 4); }
  }
  if (scene === "path") { ctx.fillStyle = "#2c2c2c"; ctx.fillRect(340, 0, 120, H); em("🏚️", W / 2, 50, 100); }
  if (scene === "chase") trees.forEach(([x, y]) => em("🌲", x, (y + timer * 4) % H, 44));

  objs.forEach(o => {
    if (o.t === "item") return;
    if (o.t === "empty") { ctx.fillStyle = "#1a120c"; ctx.fillRect(o.x, o.y, o.w, o.h); return; }
    ctx.save(); if (o.br) { ctx.translate(o.x + o.w / 2, o.y + o.h / 2); ctx.rotate(o.x % 2 ? .12 : -.1); ctx.translate(-o.x - o.w / 2, -o.y - o.h / 2); }
    ctx.fillStyle = COL[o.t]; ctx.fillRect(o.x, o.y, o.w, o.h);
    ctx.strokeStyle = "#000"; ctx.strokeRect(o.x, o.y, o.w, o.h);
    if (o.t === "hide" || o.t === "drawer") {
      ctx.fillStyle = "rgba(0,0,0,.3)"; for (let k = 1; k < 4; k++) ctx.fillRect(o.x, o.y + k * o.h / 4, o.w, 2);
      ctx.beginPath(); ctx.moveTo(o.x + o.w * .3, o.y); ctx.lineTo(o.x + o.w * .4, o.y + o.h * .4); ctx.lineTo(o.x + o.w * .33, o.y + o.h * .8); ctx.stroke();
      ctx.fillStyle = "rgba(255,220,160,.08)"; ctx.fillRect(o.x, o.y, o.w, 4);
    }
    furn(o); texWood(o);
    if (o.t === "hide") txt(o.n, o.x + o.w / 2, o.y + o.h + 10, 12, "#a98");
    ctx.restore();
  });
  objs.filter(o => o.t === "item").forEach(item);

  if (M && (MON.includes(scene) || scene === "chase")) monster(M.x, M.y, M.near);
  if (!hid || hideT > 0) { if (scene === "chase") em("🚗", P.x, P.y, 34); else if (hideT > 0 && hideObj && hideObj.n !== "placard") { ctx.save(); ctx.translate(P.x, P.y + 24); ctx.rotate(Math.min(1.45, (24 - hideT) / 10 * 1.45)); person(0, 0, .5, false, t, false); ctx.restore(); } else person(P.x, P.y + 20 + (hideT > 0 ? 12 : 0), hideT > 0 ? .42 : .55, last === "ArrowUp", last ? t : 0); }
  if (hid && hideT <= 0) hidePose();
  if (near && !hid && scene !== "path") txt("Z", P.x, P.y - 32, 20, "#ffd27a");
  if (hid) txt("Caché... (Z pour sortir)", W / 2, 24, 16, "#ffd27a");

  if (rats.length && ["house", "upper", "attic", "cave"].includes(scene)) { drawRats(); drawGhost(); spooky(); }
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

function item(o) {
  if (o.f) return em(o.ic, o.x, o.y, 22, .25);
  const fl = Math.sin(t * .09 + o.x) * 1.2;
  const g = ctx.createRadialGradient(o.x, o.y - 10, 2, o.x, o.y - 10, 45); g.addColorStop(0, "rgba(255,170,60,.35)"); g.addColorStop(1, "rgba(255,170,60,0)");
  ctx.fillStyle = g; ctx.fillRect(o.x - 45, o.y - 55, 90, 90);
  if (o.ic === "💡") { ctx.fillStyle = "#6a5230"; ctx.fillRect(o.x - 3, o.y - 4, 6, 12); ctx.fillStyle = "#e0b860"; ctx.beginPath(); ctx.moveTo(o.x - 9, o.y - 4); ctx.lineTo(o.x + 9, o.y - 4); ctx.lineTo(o.x + 5, o.y - 16); ctx.lineTo(o.x - 5, o.y - 16); ctx.fill(); }
  else { ctx.fillStyle = "#e6dcc0"; ctx.fillRect(o.x - 3, o.y - 6, 6, 14); ctx.fillStyle = "#ffb347"; ctx.beginPath(); ctx.ellipse(o.x + fl * .4, o.y - 11, 2.5, 5 + fl * .5, 0, 0, 7); ctx.fill(); }
}
function batDraw() {
  ctx.fillStyle = "#6a4422"; ctx.beginPath(); ctx.moveTo(-2, 8); ctx.lineTo(-6, -32); ctx.lineTo(6, -32); ctx.lineTo(2, 8); ctx.fill();
  ctx.fillStyle = "#aaa"; for (let k = 0; k < 6; k++) { const y = -6 - k * 5; ctx.beginPath(); ctx.moveTo(-6, y); ctx.lineTo(-12, y - 2); ctx.lineTo(-6, y - 4); ctx.moveTo(6, y); ctx.lineTo(12, y - 2); ctx.lineTo(6, y - 4); ctx.fill(); }
}
function monster(x, y, open, bat) {
  ctx.fillStyle = "#050505"; ctx.strokeStyle = "#333"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.ellipse(x, y + 8, 17, 24, 0, 0, 7); ctx.fill(); ctx.stroke();
  if (legs) { ctx.fillStyle = "#cdb9a2"; ctx.fillRect(x - 7, y + 30, 4, 7); ctx.fillRect(x + 3, y + 30, 4, 7); } ctx.fillStyle = "#050505";
  ctx.beginPath(); ctx.arc(x, y - 16, 13, 0, 7); ctx.fill(); ctx.stroke();
  ctx.shadowColor = "#f00"; ctx.shadowBlur = 12; ctx.fillStyle = "#f22";
  ctx.fillRect(x - 7, y - 19, 5, 3); ctx.fillRect(x + 2, y - 19, 5, 3); ctx.shadowBlur = 0;
  ctx.save(); ctx.translate(x + 20, y + 2); ctx.rotate(bat ? swing : .5);
  if (bat) batDraw(); else { ctx.fillStyle = "#a8a8aa"; ctx.fillRect(-2, -16, 4, 22); ctx.fillStyle = "#a00"; ctx.fillRect(-2, -14, 3, 9); ctx.fillRect(0, -4, 2, 6); ctx.fillStyle = "#222"; ctx.fillRect(-3, 6, 6, 7); }
  ctx.restore(); ctx.shadowBlur = 0;
  if (open) {
    const m = (Math.sin(t * .35) + 1) / 2 * 7; ctx.fillStyle = "#200"; ctx.fillRect(x - 8, y - 11, 16, 3 + m); ctx.fillStyle = "#eee";
    for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(x - 8 + k * 4, y - 11); ctx.lineTo(x - 6 + k * 4, y - 7); ctx.lineTo(x - 4 + k * 4, y - 11); ctx.fill(); ctx.beginPath(); ctx.moveTo(x - 8 + k * 4, y - 8 + m); ctx.lineTo(x - 6 + k * 4, y - 12 + m); ctx.lineTo(x - 4 + k * 4, y - 8 + m); ctx.fill(); }
  }
}
function road(gravel, off, tw = 4) {
  const g = ctx.createLinearGradient(0, 0, 0, 230); g.addColorStop(0, "#04050b"); g.addColorStop(1, "#141a2a");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, 230);
  ctx.fillStyle = "#e8e4cc"; ctx.beginPath(); ctx.arc(620, 70, 26, 0, 7); ctx.fill();
  ctx.fillStyle = "#07100a"; ctx.fillRect(0, 230, W, 270);
  const pg = ctx.createLinearGradient(0, 230, 0, 500); pg.addColorStop(0, "#1c160f"); pg.addColorStop(1, gravel ? "#4a4944" : "#42341f");
  ctx.fillStyle = pg; ctx.beginPath(); ctx.moveTo(400 - tw, 230); ctx.lineTo(400 + tw, 230); ctx.lineTo(700, 500); ctx.lineTo(100, 500); ctx.fill();
  if (off !== undefined) {
    for (let k = 0; k < 70; k++) { const d = Math.pow((k / 70 + off) % 1, 2), sd = sr(k) < .5 ? -1 : 1, x = 400 + sd * (d * 300 + 6 + sr(k + 70) * (30 + d * 200)), y = 230 + d * 270; ctx.fillStyle = k % 3 ? "#1d3a16" : "#3a2a12"; ctx.beginPath(); ctx.ellipse(x, y, 2 + d * 16, 1 + d * 6, 0, 0, 7); ctx.fill(); }
    for (let k = 0; k < 14; k++) { const d = Math.pow((k / 14 + off) % 1, 2), sd = k % 2 ? -1 : 1; ctx.fillStyle = "#555"; ctx.beginPath(); ctx.ellipse(400 + sd * (d * 300 + 4), 230 + d * 270, 2 + d * 14, 1 + d * 7, 0, 0, 7); ctx.fill(); }
  }
}
function forest(off, n, sx = 0, rocks) {
  for (let i = 0; i < n; i++) {
    const d = Math.pow((i / n + off) % 1, 2), y = 230 + d * 270, sg = i % 2 ? -1 : 1, z = 10 + d * 170;
    if (rocks) { ctx.fillStyle = "#4a4a48"; ctx.beginPath(); ctx.ellipse(400 + sg * (40 + d * 330), y, z * .4, z * .22, 0, 0, 7); ctx.fill(); continue; }
    const x = 400 + sx + sg * (120 + d * 560), ty = i % 3;
    ctx.fillStyle = ["#050c06", "#08140a", "#040a05"][(i * 7) % 3];
    if (ty === 0) { ctx.beginPath(); ctx.moveTo(x, y - z * 1.9); ctx.lineTo(x - z * .5, y - z * .5); ctx.lineTo(x + z * .5, y - z * .5); ctx.fill(); ctx.beginPath(); ctx.moveTo(x, y - z * 1.3); ctx.lineTo(x - z * .6, y); ctx.lineTo(x + z * .6, y); ctx.fill(); }
    else if (ty === 1) { ctx.fillRect(x - z * .08, y - z * 1.1, z * .16, z * 1.1); [[-.35, -1.2], [.3, -1.35], [0, -1.7]].forEach(a => { ctx.beginPath(); ctx.ellipse(x + a[0] * z, y + a[1] * z, z * .5, z * .42, 0, 0, 7); ctx.fill(); }); }
    else { ctx.fillRect(x - z * .06, y - z * 1.8, z * .12, z * 1.8); ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = Math.max(1, z * .06); ctx.beginPath(); for (let b = 0; b < 4; b++) { const by = y - z * (.8 + b * .25), dr = b % 2 ? 1 : -1; ctx.moveTo(x, by); ctx.lineTo(x + dr * z * .5, by - z * .35); } ctx.stroke(); }
  }
}
function crows(tm) {
  ctx.strokeStyle = "#000"; ctx.lineWidth = 2;
  for (let k = 0; k < 14; k++) { const x = -50 + (tm * 6 + k * 40) % 900, y = 70 + Math.sin(tm * .05 + k) * 25 + k * 4, f = Math.sin(tm * .4 + k) * 5; ctx.beginPath(); ctx.moveTo(x - 9, y + f / 2); ctx.quadraticCurveTo(x - 4, y - f, x, y); ctx.quadraticCurveTo(x + 4, y - f, x + 9, y + f / 2); ctx.stroke(); }
}
function vign(cx, cy, r0, r1, a) {
  const v = ctx.createRadialGradient(cx, cy, r0, cx, cy, r1); v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0," + a + ")");
  ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
}
// Intro "3D" : forêt, chantier de pierres, poussière, portail et manoir
function drawRide() {
  const p = rt / R, sp = spd(p);
  road(p > .45, undefined, 4 + (p > .3 ? Math.pow(Math.min(1, (p - .3) / .55), 2) * 28 : 0)); if (p > .3) allee(ro);
  forest(ro, 40, 0); forest(ro * 1.37, 26, 40); forest(ro * 1.7, 30, -30);
  if (rt > 60 && rt < 360) crows(rt - 60);
  if (p > .3) {
    const s = Math.min(1, (p - .3) / .55), s2 = s * s, hs = 14 + s2 * 260, by = 232 + s2 * 20;
    manor(hs, by); const lf = rt - Math.floor(.88 * R); if (lf >= 0 && lf < 30) { ctx.strokeStyle = "#fff"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(400 + hs * .2, 0); for (let k = 1; k <= 8; k++) ctx.lineTo(400 + hs * .2 + (sr(k + lf) - .5) * 70, k * (by - hs * 1.6) / 8); ctx.stroke(); }
    if (p > .45) {
      const gw = 30 + s2 * 330, open = Math.max(0, (p - .88) / .12), lw = gw * (1 - open * .92), ph2 = hs * .5 + s2 * 40;
      ctx.fillStyle = "rgba(6,6,6,.9)"; ctx.fillRect(400 - gw, by - hs * .5, lw, ph2); ctx.fillRect(400 + gw - lw, by - hs * .5, lw, ph2);
      ctx.fillStyle = "#000"; ctx.fillRect(400 - gw - 4, by - hs * .55, 8 + s2 * 8, ph2 + 6); ctx.fillRect(400 + gw - 4, by - hs * .55, 8 + s2 * 8, ph2 + 6);
    }
  }
  if (p > .45) forest(ro * 1.3, 10, 0, 1);
  ctx.fillStyle = "rgba(255,240,180,.1)"; ctx.beginPath(); ctx.moveTo(380, 440); ctx.lineTo(420, 440); ctx.lineTo(600, 240); ctx.lineTo(200, 240); ctx.fill();
  if ((p > .45 && sp > 0) || (p > .78 && p < .86)) for (let k = 0; k < 9; k++) { const a = (rt * 2 + k * 23) % 70; ctx.fillStyle = "rgba(170,160,140," + (.28 - a / 300) + ")"; ctx.beginPath(); ctx.arc(400 + (k - 4) * 14 + Math.sin(rt * .1 + k) * 12, 485 - a, 8 + a * .25, 0, 7); ctx.fill(); }
  const b = Math.sin(rt * .4) * 2 * sp;
  ctx.fillStyle = "#0b0b0b"; ctx.fillRect(388, 430 + b, 24, 70); ctx.fillStyle = "#2a2a2a"; for (let k = 0; k < 9; k++) ctx.fillRect(388, 432 + ((k * 8 + rt * 3 * sp) % 68) + b, 24, 2); ctx.fillStyle = "#777"; ctx.fillRect(394, 430 + b, 12, 8);
  ctx.fillStyle = "#2b3a55"; ctx.fillRect(375, 380 + b, 50, 52);
  ctx.fillStyle = "#b0201a"; ctx.fillRect(364, 418 + b, 72, 38);
  ctx.fillStyle = "#fff"; ctx.font = "bold 10px Arial"; ctx.textAlign = "center"; ctx.fillText("PIZZA ROMA", 400, 433 + b); ctx.font = "8px Arial"; ctx.fillText("Livraison 7j/7", 400, 445 + b);
  ctx.fillStyle = "#d8b090"; ctx.beginPath(); ctx.arc(400, 366 + b, 14, 0, 7); ctx.fill();
  vign(400, 250, 200, 520, .8);
  { const lb = rt - Math.floor(.88 * R); if (lb >= 0 && lb < 170) bats(lb); }
  { const lf2 = rt - Math.floor(.88 * R); if (lf2 >= 0 && lf2 < 30) { ctx.fillStyle = "rgba(215,225,255," + (.6 * (1 - lf2 / 30)) + ")"; ctx.fillRect(0, 0, W, H); } }
  txt(p < .45 ? "Une livraison de pizza, tard le soir, au fond de la forêt..." : p < .78 ? "Le chemin devient un chantier de pierres... la moto ralentit." : p < .88 ? "Le portail. Derrière lui, le manoir." : "Le portail s’ouvre dans un grincement... « Approche... »", W / 2, 40, 20);
  txt("Entrée : passer", W - 80, 480, 13, "#777");
}
// Poursuite : voiture de dos, traces, rochers, motard
function drawChase() {
  road(false, timer * .012); forest(timer * .012, 22, 0);
  rk.forEach((r, i) => { const d = r.z * r.z; rock(400 + r.x * d * 300, 230 + d * 270, 6 + d * 48, i); });
  ctx.fillStyle = "rgba(0,0,0,.35)";
  for (let i = 0; i < 45; i++) { const hx = hist[i] === undefined ? P.x : hist[i], y = P.y + 20 + i * 1.6; ctx.fillRect(hx - 22, y, 4, 2); ctx.fillRect(hx + 18, y, 4, 2); }
  ctx.save(); ctx.translate(400 + (P.x - 400) * .5 + Math.sin(timer * .04) * 140 + Math.sin(timer * .11) * 40, 455 + gap * .1 + Math.sin(timer * .03) * 18); const k = 1 + (1 - gap / 110) * .6 + Math.sin(timer * .03) * .12; ctx.scale(k, k); ctx.rotate(Math.cos(timer * .04) * .12);
  ctx.fillStyle = "rgba(255,240,180,.16)"; ctx.beginPath(); ctx.moveTo(-8, -4); ctx.lineTo(8, -4); ctx.lineTo(70, -130); ctx.lineTo(-70, -130); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.rect(-80, -200, 160, 176); ctx.clip(); legs = false; monster(0, -52, true); legs = true; ctx.restore();
  ctx.fillStyle = "#0b0b0b"; ctx.fillRect(-6, 4, 12, 44); ctx.fillStyle = "#333"; for (let q = 0; q < 7; q++) ctx.fillRect(-6, 4 + (q * 7 + timer * 3) % 42, 12, 2);
  ctx.fillStyle = "#6a1a14"; ctx.beginPath(); ctx.moveTo(-16, 6); ctx.lineTo(16, 6); ctx.lineTo(10, -14); ctx.lineTo(-10, -14); ctx.fill();
  ctx.strokeStyle = "#999"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-4, -14); ctx.lineTo(-6, 8); ctx.moveTo(4, -14); ctx.lineTo(6, 8); ctx.stroke();
  ctx.strokeStyle = "#222"; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-34, -20); ctx.lineTo(34, -20); ctx.stroke();
  ctx.fillStyle = "#ffe9a0"; ctx.beginPath(); ctx.arc(0, -8, 7, 0, 7); ctx.fill();
  ctx.strokeStyle = "#0a0a0a"; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(-14, -42); ctx.lineTo(-30, -22); ctx.moveTo(14, -42); ctx.lineTo(30, -22); ctx.stroke();
  ctx.restore();
  ctx.fillStyle = "#111"; ctx.fillRect(P.x - 34, P.y + 8, 10, 18); ctx.fillRect(P.x + 24, P.y + 8, 10, 18);
  ctx.fillStyle = "#7a1a1a"; ctx.fillRect(P.x - 30, P.y - 18, 60, 34); ctx.fillStyle = "#601414"; ctx.fillRect(P.x - 24, P.y - 34, 48, 18); ctx.fillStyle = "#0c0c10"; ctx.fillRect(P.x - 19, P.y - 31, 38, 11);
  ctx.shadowColor = "#f00"; ctx.shadowBlur = 14; ctx.fillStyle = "#f33"; ctx.fillRect(P.x - 28, P.y + 2, 12, 6); ctx.fillRect(P.x + 16, P.y + 2, 12, 6); ctx.shadowBlur = 0;
  if (hits >= 1) smoke(P.x, P.y - 34);
  vign(P.x, P.y, 150, 520, .85);
  txt("← → ↑ ↓ : esquive les rochers, fuis le motard !", W / 2, 96, 16);
}
// Cabane du vieil homme (vue à la première personne)
function drawCabin() {
  const k = 1 + cz * .5; ctx.save(); ctx.translate(400, 250); ctx.scale(k, k); ctx.translate(-400, -250);
  ctx.fillStyle = "#2a1f16"; ctx.fillRect(0, 0, W, H); ctx.fillStyle = "#1a120c"; ctx.fillRect(0, 340, W, 160);
  ctx.fillStyle = "rgba(0,0,0,.3)"; for (let x = 0; x < W; x += 50) ctx.fillRect(x, 0, 2, 340);
  ctx.fillStyle = "#4a3418"; ctx.fillRect(300, 50, 150, 190); portrait();
  ctx.fillStyle = "#2a1a0e"; ctx.fillRect(70, 110, 130, 230); ctx.fillStyle = "#3a2616"; ctx.fillRect(78, 118, 56, 214); ctx.fillRect(138, 118, 54, 214); ctx.fillStyle = "#c9a24a"; ctx.fillRect(130, 220, 3, 18); ctx.fillRect(139, 220, 3, 18);
  ctx.fillStyle = "#1d130b"; ctx.fillRect(630, 110, 110, 230); ctx.fillStyle = "#c9a45a"; ctx.fillRect(642, 230, 8, 8);
  ctx.fillStyle = "#3a2a1a"; ctx.fillRect(220, 330, 360, 22); ctx.fillRect(240, 352, 14, 110); ctx.fillRect(546, 352, 14, 110);
  ctx.fillStyle = "#d9c9a0"; ctx.fillRect(300, 324, 60, 8);
  if (!torch) lamp();
  if (torch) { const q = Math.min(1, ex / 130); person(430 + q * 250, 420 - q * 70, 1.5 - q * .6, true, ex * 1.5); }
  ctx.restore(); vign(400, 250, 180, 520, .85);
  if (torch) { ctx.fillStyle = "rgba(0,0,0," + Math.max(0, (ex - 110) / 40) + ")"; ctx.fillRect(0, 0, W, H); } txt(torch ? "" : "↑ avancer · Z : lampe torche · clic : cadre, placard", W / 2, 480, 15, "#aaa");
}
// Forêt à la première personne : marche, pas derrière, course, branchages
function drawForest() {
  const yj = jt > 0 ? Math.sin((1 - jt / 40) * Math.PI) * 40 : 0;
  const sx = ph === 1 ? 28 * Math.min(1, fd / 60) : ph === 2 ? 28 * Math.max(0, 1 - fd / 90) : 0, bx = ph === 1 ? 400 - 140 * Math.min(1, fd / 60) : ph === 2 ? 400 - 140 * Math.max(0, 1 - fd / 90) : 400;
  ctx.save(); ctx.translate(0, yj); road(false, fo); forest(fo, 36, sx); if (ph === 2) forest(fo * 1.3, 24, sx); if (ph === 2 && fd > 190 && fd < 420) crows(fd - 190);
  if (ph === 1 || (ph === 2 && fd < 120)) {
    const mv = ph === 1 ? Math.min(1, fd / 150) : 1;
    ctx.fillStyle = "#0a0805"; ctx.fillRect(110, 120, 24, 300);
    ctx.save(); ctx.translate(122, 200); ctx.rotate(Math.sin(fd * .2) * .3 - .6); ctx.fillRect(0, -6, 110, 10); ctx.fillRect(50, -22, 6, 20); ctx.restore();
    bigfoot(165 + mv * 12, 340);
    if (ph === 1 && fd > 30 && fd < 150) { const q = fd - 30, bx = 150 + q * 5, by = 220 - q * 1.5, f = Math.sin(q * .6) * 6; ctx.strokeStyle = "#000"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(bx - 10, by + f); ctx.quadraticCurveTo(bx - 4, by - f, bx, by); ctx.quadraticCurveTo(bx + 4, by - f, bx + 10, by + f); ctx.stroke(); }
    for (let k = 0; k < 8; k++) { ctx.fillStyle = "#7a3a14"; ctx.fillRect(110 + sr(k) * 120, 130 + ((fd * (1 + sr(k + 5))) % 200), 4, 3); }
  }
  lg.forEach((l, i) => branch(l.z * l.z, i));
  if (ph === 2 && fd > 600) { const d = Math.pow(Math.min(1, (fd - 600) / 300), 2); leafPile(400, 290 + d * 110, 30 + d * 330, 6 + d * 60, 3); }
  ctx.restore();
  const g = ctx.createRadialGradient(bx, 270, 10, bx, 270, 230); g.addColorStop(0, "rgba(255,240,190,.12)"); g.addColorStop(1, "rgba(0,0,0,.96)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  if (!lit) { ctx.fillStyle = "rgba(0,0,0,.94)"; ctx.fillRect(0, 0, W, H); txt("Z : allumer la lampe", W / 2, 460, 18, "#ffd27a"); }
}

function stain(x, y, r, sd) {
  for (let k = 0; k < 9; k++) { const a = sr(sd * 9 + k) * 6.28, d = sr(sd * 5 + k + 3) * r * .7, rr = r * (.35 + sr(sd + k * 2) * .5); ctx.fillStyle = k < 3 ? "rgba(45,6,5,.55)" : "rgba(80,10,8,.6)"; ctx.beginPath(); ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, rr, 0, 7); ctx.fill(); }
  ctx.strokeStyle = "rgba(25,3,2,.6)"; ctx.lineWidth = 1;
  for (let k = 0; k < 5; k++) { const a = sr(sd * 3 + k) * 6.28; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * r * .8, y + Math.sin(a) * r * .8); ctx.stroke(); }
  for (let k = 0; k < 12; k++) { const a = sr(sd * 7 + k) * 6.28, d = r * (1 + sr(k + sd) * 1.2); ctx.fillStyle = "rgba(70,8,6,.6)"; ctx.beginPath(); ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, 1 + sr(k * 2 + sd) * 2.5, 0, 7); ctx.fill(); }
  ctx.fillStyle = "rgba(60,8,6,.45)"; ctx.fillRect(x - 1.5, y + r * .4, 3, r * 1.6);
}
function rock(x, y, s, i) {
  const g = ctx.createRadialGradient(x - s * .4, y - s * .5, 1, x, y, s * 1.3); g.addColorStop(0, "#9a9a94"); g.addColorStop(1, "#2c2c2a");
  ctx.fillStyle = g; ctx.strokeStyle = "#111"; ctx.lineWidth = 1; ctx.beginPath();
  for (let k = 0; k < 8; k++) { const a = k * .785, r = s * (.8 + sr(i * 7 + k) * .45), px = x + Math.cos(a) * r * 1.3, py = y + Math.sin(a) * r * .8; k ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
  ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.strokeStyle = "rgba(0,0,0,.5)"; ctx.beginPath(); ctx.moveTo(x - s * .3, y - s * .4); ctx.lineTo(x, y); ctx.lineTo(x + s * .35, y + s * .2); ctx.stroke();
}
function branch(d, i, cx = 400, ww = 1) {
  const y = 230 + d * 270, w = (80 + d * 560) * ww, x = cx - w / 2, h = 8 + d * 36;
  ctx.fillStyle = "#3a2a18"; ctx.fillRect(x, y, w, h); ctx.fillStyle = "#241a0e"; for (let k = 0; k < 8; k++) ctx.fillRect(x + sr(k + i) * w, y, 2 + d * 3, h);
  ctx.strokeStyle = "#2e2212"; ctx.lineWidth = 2 + d * 4;
  for (let k = 0; k < 5; k++) { const bx = x + sr(k * 2 + i) * w; ctx.beginPath(); ctx.moveTo(bx, y + h * .3); ctx.lineTo(bx + (sr(k + 7) - .5) * w * .3, y - h * (.8 + sr(k) * 1.4)); ctx.stroke(); }
  for (let k = 0; k < 26; k++) { ctx.fillStyle = ["#7a3a14", "#a85a1c", "#5a2a10", "#8a6a20"][k % 4]; ctx.beginPath(); ctx.ellipse(x + sr(k + i * 5) * w, y + h * (.2 + sr(k + 11) * .9), 3 + d * 14, 2 + d * 7, sr(k) * 3, 0, 7); ctx.fill(); }
}
function lamp() {
  ctx.fillStyle = "rgba(0,0,0,.4)"; ctx.beginPath(); ctx.ellipse(468, 334, 44, 5, 0, 0, 7); ctx.fill();
  const g = ctx.createLinearGradient(0, 312, 0, 332); g.addColorStop(0, "#8a8a8a"); g.addColorStop(.5, "#2a2a2a"); g.addColorStop(1, "#555"); ctx.fillStyle = g; ctx.fillRect(425, 314, 62, 17);
  ctx.fillStyle = "#444"; ctx.beginPath(); ctx.moveTo(487, 310); ctx.lineTo(508, 304); ctx.lineTo(508, 340); ctx.lineTo(487, 334); ctx.fill();
  ctx.fillStyle = "#e8d48a"; ctx.beginPath(); ctx.ellipse(508, 322, 4, 17, 0, 0, 7); ctx.fill(); ctx.fillStyle = "rgba(255,255,255,.5)"; ctx.fillRect(432, 316, 48, 2);
}
let pc = null;
function portrait0() {
  if (!pc) {
    pc = document.createElement("canvas"); pc.width = 252; pc.height = 332; const c = pc.getContext("2d");
    c.fillStyle = "#1c3a4a"; c.fillRect(0, 0, 252, 332);
    for (let i = 0; i < 260; i++) { c.strokeStyle = ["#2a5a6a", "#d4a84a", "#14283a", "#3a7a7a"][i % 4]; c.lineWidth = 5; c.beginPath(); c.arc(sr(i) * 252, sr(i + 400) * 332, 14 + sr(i + 9) * 14, sr(i + 3) * 6, sr(i + 3) * 6 + 1.6); c.stroke(); }
    c.fillStyle = "#2a2018"; c.beginPath(); c.ellipse(126, 340, 110, 80, 0, 0, 7); c.fill();
    for (let i = 0; i < 220; i++) { const a = sr(i + 50) * 6.28, d = Math.sqrt(sr(i + 70)); c.fillStyle = ["#c9925a", "#a8693a", "#dba873", "#8a5230"][i % 4]; c.save(); c.translate(126 + Math.cos(a) * d * 52, 150 + Math.sin(a) * d * 66); c.rotate(a); c.fillRect(-5, -2, 11, 4); c.restore(); }
    for (let i = 0; i < 170; i++) { const a = sr(i + 90) * 3.14, d = Math.sqrt(sr(i + 130)); c.fillStyle = ["#d8d4c8", "#a8a498", "#7a766a"][i % 3]; c.save(); c.translate(126 + Math.cos(a) * d * 50, 178 + Math.sin(a) * d * 48); c.rotate(a + 1.5); c.fillRect(-2, -6, 4, 12); c.restore(); }
    c.fillStyle = "#d8b050"; c.beginPath(); c.ellipse(126, 96, 105, 26, 0, 0, 7); c.fill(); c.fillStyle = "#b88a30"; c.beginPath(); c.ellipse(126, 78, 58, 34, 0, 3.14, 0); c.fill();
    for (let i = 0; i < 90; i++) { c.strokeStyle = ["#e8c868", "#9a7020", "#c8a040"][i % 3]; c.lineWidth = 3; c.beginPath(); const x = 30 + sr(i + 200) * 192; c.moveTo(x, 80 + sr(i) * 30); c.lineTo(x + 10, 84 + sr(i) * 30); c.stroke(); }
    c.fillStyle = "#3a1a10"; c.fillRect(70, 92, 112, 8); c.strokeStyle = "rgba(60,30,15,.55)"; c.lineWidth = 2; for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(86, 114 + k * 6); c.quadraticCurveTo(126, 108 + k * 6, 166, 114 + k * 6); c.stroke(); } [[100, 146], [152, 146]].forEach(a => { c.beginPath(); c.arc(a[0], a[1] + 8, 12, .2, 2.9); c.stroke(); }); c.beginPath(); c.moveTo(108, 160); c.quadraticCurveTo(100, 185, 112, 200); c.moveTo(144, 160); c.quadraticCurveTo(152, 185, 140, 200); c.stroke(); c.fillStyle = "rgba(210,210,210,.4)"; for (let k = 0; k < 40; k++) c.fillRect(60 + sr(k + 300) * 132, 100 + sr(k + 310) * 40, 3, 8);
    c.fillStyle = "#1a1410"; c.beginPath(); c.ellipse(104, 140, 8, 5, 0, 0, 7); c.ellipse(148, 140, 8, 5, 0, 0, 7); c.fill(); c.fillStyle = "#f0e8d0"; c.fillRect(101, 138, 3, 3); c.fillRect(145, 138, 3, 3);
    c.strokeStyle = "#7a1a14"; c.lineWidth = 3; c.beginPath(); c.moveTo(160, 148); c.lineTo(170, 175); c.stroke();
  }
  ctx.drawImage(pc, 312, 62, 126, 166);
}
function person(x, y, s, back, walk, emo) {
  const sw = Math.sin(walk * .2) * 6 * s;
  ctx.fillStyle = "#1b2438"; ctx.fillRect(x - 9 * s + sw, y - 20 * s, 8 * s, 20 * s); ctx.fillRect(x + s - sw, y - 20 * s, 8 * s, 20 * s);
  ctx.fillStyle = "#b0201a"; ctx.fillRect(x - 12 * s, y - 52 * s, 24 * s, 34 * s);
  ctx.fillStyle = "#d8b090"; ctx.beginPath(); ctx.arc(x, y - 60 * s, 9 * s, 0, 7); ctx.fill();
  ctx.fillStyle = back ? "#6a1410" : "#b0201a"; ctx.fillRect(x - 10 * s, y - 72 * s, 20 * s, 7 * s);
  if (!back) {
    if (emo) {
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(x - 4 * s, y - 62 * s, 3.2 * s, 0, 7); ctx.arc(x + 4 * s, y - 62 * s, 3.2 * s, 0, 7); ctx.fill();
      ctx.fillStyle = "#111"; ctx.fillRect(x - 5 * s, y - 62.5 * s, 2 * s, 2 * s); ctx.fillRect(x + 3 * s, y - 62.5 * s, 2 * s, 2 * s);
      ctx.strokeStyle = "#3a2a20"; ctx.lineWidth = Math.max(1, s); ctx.beginPath(); ctx.moveTo(x - 7 * s, y - 68 * s); ctx.lineTo(x - 2 * s, y - 66 * s); ctx.moveTo(x + 7 * s, y - 68 * s); ctx.lineTo(x + 2 * s, y - 66 * s); ctx.stroke();
      ctx.fillStyle = "#300"; ctx.beginPath(); ctx.ellipse(x, y - 55 * s, 2.5 * s, 3.5 * s, 0, 0, 7); ctx.fill();
    } else { ctx.fillStyle = "#222"; ctx.fillRect(x - 4 * s, y - 62 * s, 2 * s, 2 * s); ctx.fillRect(x + 2 * s, y - 62 * s, 2 * s, 2 * s); }
  }
}
function wheel(x, y, r, a) {
  ctx.fillStyle = "#0b0b0b"; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  ctx.strokeStyle = "#222"; ctx.lineWidth = 2; for (let k = 0; k < 12; k++) { const q = k * .52 + a; ctx.beginPath(); ctx.moveTo(x + Math.cos(q) * r * .86, y + Math.sin(q) * r * .86); ctx.lineTo(x + Math.cos(q) * r, y + Math.sin(q) * r); ctx.stroke(); }
  ctx.fillStyle = "#9a9a9a"; ctx.beginPath(); ctx.arc(x, y, r * .62, 0, 7); ctx.fill(); ctx.fillStyle = "#2a2a2a"; ctx.beginPath(); ctx.arc(x, y, r * .5, 0, 7); ctx.fill();
  ctx.strokeStyle = "#bbb"; ctx.lineWidth = 1; for (let k = 0; k < 6; k++) { const q = k * 1.05 + a; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(q) * r * .6, y + Math.sin(q) * r * .6); ctx.stroke(); }
  ctx.fillStyle = "#ccc"; ctx.beginPath(); ctx.arc(x, y, r * .12, 0, 7); ctx.fill();
}
function moto(x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); const a = t * .3;
  wheel(-32, 0, 17, a); wheel(32, 0, 17, a);
  ctx.fillStyle = "#6a1a14"; ctx.beginPath(); ctx.moveTo(-26, -12); ctx.lineTo(-18, -34); ctx.lineTo(20, -34); ctx.lineTo(30, -14); ctx.lineTo(18, -6); ctx.lineTo(-20, -4); ctx.fill();
  ctx.fillStyle = "#1a1a1a"; ctx.fillRect(-30, -40, 34, 7); ctx.fillStyle = "#b0201a"; ctx.fillRect(-42, -58, 28, 20);
  ctx.fillStyle = "#555"; ctx.fillRect(24, -52, 4, 22); ctx.fillRect(18, -54, 16, 4); ctx.fillStyle = "#ffe9a0"; ctx.beginPath(); ctx.arc(36, -40, 5, 0, 7); ctx.fill();
  ctx.fillStyle = "#777"; ctx.fillRect(-48, -14, 18, 5); ctx.restore();
}
// Cinématique 3D : entrée dans la maison, pizza qui tombe, porte qui claque, monstre
function drawDrop() {
  const w = dr, c = Math.max(0, Math.min(1, (w - 440) / 60));
  ctx.fillStyle = "#050302"; ctx.fillRect(0, 0, W, H);
  const sh = w > 600 && w < 650; if (sh) { ctx.save(); ctx.translate((Math.random() - .5) * 16, (Math.random() - .5) * 16); }
  ctx.fillStyle = "#33261d"; ctx.fillRect(200, 120, 400, 210);
  ctx.fillStyle = "#2a1e17"; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(200, 120); ctx.lineTo(200, 330); ctx.lineTo(0, 500); ctx.fill();
  ctx.beginPath(); ctx.moveTo(800, 0); ctx.lineTo(600, 120); ctx.lineTo(600, 330); ctx.lineTo(800, 500); ctx.fill();
  ctx.fillStyle = "#1c130d"; ctx.beginPath(); ctx.moveTo(200, 330); ctx.lineTo(600, 330); ctx.lineTo(800, 500); ctx.lineTo(0, 500); ctx.fill();
  ctx.fillStyle = "#15100b"; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(800, 0); ctx.lineTo(600, 120); ctx.lineTo(200, 120); ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,.5)"; ctx.lineWidth = 1; for (let i = 0; i <= 8; i++) { ctx.beginPath(); ctx.moveTo(200 + i * 50, 330); ctx.lineTo(i * 100, 500); ctx.stroke(); }
  ctx.fillStyle = "#0b1020"; ctx.fillRect(340, 190, 120, 140);
  if (c > 0) { ctx.fillStyle = "#3a2414"; ctx.beginPath(); ctx.moveTo(340, 190); ctx.lineTo(340 + 120 * c, 196); ctx.lineTo(340 + 120 * c, 324); ctx.lineTo(340, 330); ctx.fill(); }
  ctx.fillStyle = "#4a3320"; ctx.beginPath(); ctx.moveTo(290, 330); ctx.lineTo(510, 330); ctx.lineTo(560, 372); ctx.lineTo(240, 372); ctx.fill(); ctx.fillRect(250, 372, 12, 70); ctx.fillRect(538, 372, 12, 70);
  [[320, 326], [480, 326]].forEach(a => item({ ic: "💡", x: a[0], y: a[1] })); [[180, 400], [620, 400]].forEach(a => item({ ic: "🕯️", x: a[0], y: a[1] }));
  let y, k, back = false;
  y = w < 200 ? 335 + w * .25 : 385; k = w < 200 ? .6 + w * .0035 : 1.3;
  if (w < 700) { ctx.save(); if (w > 600) { ctx.translate(400, y); ctx.rotate(-Math.min(1.5, (w - 600) * .04)); ctx.translate(-400, -y); } person(400, y, k, false, w < 200 ? w : 0, w >= 420); ctx.restore(); }
  if (w >= 300) {
    const f = Math.min(1, (w - 300) / 30), o = Math.min(1, Math.max(0, (w - 330) / 40)), py = 405 + f * 50 - Math.abs(Math.sin(f * 6.28)) * (1 - f) * 45;
    ctx.save(); ctx.translate(340, py); ctx.rotate(f < 1 ? f * .8 : 0); ctx.fillStyle = "#c8a064"; ctx.fillRect(-32, -6, 64, 12); ctx.fillStyle = "#9a7a48"; ctx.fillRect(-32, 4, 64, 2);
    if (o > 0) { ctx.fillStyle = "#e0b058"; ctx.beginPath(); ctx.ellipse(0, -6, 28, 7, 0, 0, 7); ctx.fill(); ctx.fillStyle = "#c0301a"; [[-14, -7], [0, -9], [13, -6], [-4, -4]].forEach(a => { ctx.beginPath(); ctx.arc(a[0], a[1], 4, 0, 7); ctx.fill(); }); ctx.save(); ctx.translate(-32, -6); ctx.rotate(-o * 2.2); ctx.fillStyle = "#c8a064"; ctx.fillRect(0, -3, 64, 6); ctx.restore(); }
    ctx.restore();
  }
  if (w > 480) { const mx = 640 - Math.min(1, (w - 480) / 80) * 210; swing = w < 580 ? -.3 : w < 600 ? -.3 - (w - 580) * .06 : -1.5; ctx.save(); ctx.translate(mx, 318); ctx.scale(2, 2); monster(0, 0, w > 540, true); ctx.restore(); }
  vign(400, 250, 200, 520, .7);
  if (sh) ctx.restore();
  if (w > 600) { ctx.fillStyle = "rgba(255,255,255," + Math.max(0, (660 - w) / 60) + ")"; ctx.fillRect(0, 0, W, H); ctx.fillStyle = "rgba(0,0,0," + Math.min(1, (w - 620) / 60) + ")"; ctx.fillRect(0, 0, W, H); }
  txt(w < 200 ? "Tu entres... personne." : w < 330 ? "Deux pauvres lampes. Des bougies sur les chaises." : w < 440 ? "Un grincement... la pizza t’échappe." : w < 600 ? "La porte se referme brutalement !" : "", W / 2, 470, 18);
}
// La fenêtre du grenier : le monstre ramène le scooter, puis une ombre dans la forêt
function drawWin() {
  const w = winT, pan = Math.min(1, Math.max(0, (w - 340) / 80));
  ctx.fillStyle = "#050914"; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#e8e4cc"; ctx.beginPath(); ctx.arc(120, 70, 24, 0, 7); ctx.fill();
  ctx.fillStyle = "#06100a"; ctx.fillRect(0, 330, W, 170);
  ctx.save(); ctx.translate(-pan * 300, 0);
  const shx = 1000 - (w - 420) * 1.4;
  for (let i = 0; i < 20; i++) {
    const x = 520 + i * 36, tp = w - (420 + (1000 - x) / 1.4), sw = tp > 0 && tp < 120 ? Math.sin(w * .5) * 7 : 0;
    ctx.save(); if (i === 9) { ctx.translate(x, 340); ctx.rotate(Math.min(1.45, Math.max(0, (w - 600) * .03))); ctx.translate(-x, -340); }
    ctx.fillStyle = "#040a06"; ctx.beginPath(); ctx.moveTo(x + sw, 120 + (i % 3) * 25); ctx.lineTo(x - 40, 340); ctx.lineTo(x + 40, 340); ctx.fill(); ctx.restore();
    if (tp > 0) for (let k = 0; k < 7; k++) { const ly = 130 + (i % 3) * 25 + tp * (.5 + sr(i * 9 + k)) * 1.2; if (ly < 340) { ctx.fillStyle = k % 2 ? "#a85a1c" : "#7a3a14"; ctx.fillRect(x + (sr(i * 7 + k) - .5) * 60 + Math.sin(tp * .08 + k) * 8, ly, 4, 3); } }
  }
  if (w > 420 && w < 920) { ctx.save(); ctx.translate(shx, 340); ctx.scale(1.4, 1.4); bigfoot(0, 0); ctx.restore(); }
  const sx2 = Math.min(560, 60 + w * 1.6); moto(sx2, 400, 1); walker(sx2 - 70, 372, Math.min(w, 340)); ctx.strokeStyle = "#070707"; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(sx2 - 56, 372); ctx.lineTo(sx2 - 40, 352); ctx.stroke();
  ctx.restore();
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, 70, H); ctx.fillRect(W - 70, 0, 70, H); ctx.fillRect(0, 0, W, 50); ctx.fillRect(0, H - 60, W, 60);
  ctx.fillStyle = "#1a120c"; ctx.fillRect(396, 0, 8, H); ctx.fillRect(0, 240, W, 8);
  vign(400, 250, 200, 520, .7);
  if (w > 560) txt("Il n’y a pas que le monstre qui est un danger maintenant...", W / 2, 470, 17, "#ddd");
}
// Dans le talus : le monstre et le chat du vieil homme
function drawCat() {
  road(false); forest(.3, 30, 0); ctx.fillStyle = "#04070a"; ctx.fillRect(0, 0, W, 60);
  if (ct < 380) {
    ctx.fillStyle = "#14110e"; ctx.beginPath(); ctx.ellipse(400, 400, 26, 18, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(420, 380, 12, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.moveTo(412, 372); ctx.lineTo(414, 358); ctx.lineTo(421, 370); ctx.moveTo(422, 370); ctx.lineTo(428, 358); ctx.lineTo(430, 372); ctx.fill();
    ctx.strokeStyle = "#14110e"; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(376, 405); ctx.quadraticCurveTo(340, 380 + Math.sin(ct * .05) * 12, 350, 350); ctx.stroke();
    ctx.fillStyle = "#8f8"; ctx.fillRect(415, 378, 3, 3); ctx.fillRect(424, 378, 3, 3);
  } else { ctx.fillStyle = "rgba(90,8,6,.8)"; [[0, 0, 18], [22, 6, 8], [-24, 4, 10], [8, -16, 6]].forEach(a => { ctx.beginPath(); ctx.arc(400 + a[0], 405 + a[1], a[2] * Math.min(1, (ct - 375) / 50), 0, 7); ctx.fill(); }); }
  if (ct > 150) { const mx = ct < 320 ? 900 - (ct - 150) * 2.5 : 500; ctx.save(); swing = ct < 340 ? -.5 : ct < 380 ? -.5 - (ct - 340) * .033 : -1.8; ctx.translate(mx, 290); ctx.scale(3.2, 3.2); monster(0, 0, ct > 320, true); ctx.strokeStyle = "#070707"; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(-17, -8); ctx.lineTo(-24, -2); ctx.moveTo(17, -8); ctx.lineTo(21, 4); ctx.stroke(); ctx.fillStyle = "#151515"; ctx.beginPath(); ctx.arc(-24, -1, 4, 0, 7); ctx.fill(); ctx.restore(); }
  leaves();
  vign(400, 250, 150, 520, .9);
  if (ct > 380 && ct < 430) { ctx.fillStyle = "rgba(150,0,0," + (.5 - (ct - 380) / 100) + ")"; ctx.fillRect(0, 0, W, H); }
  if (ct > 700) { ctx.fillStyle = "rgba(0,0,0," + Math.min(1, (ct - 700) / 70) + ")"; ctx.fillRect(0, 0, W, H); }
  txt(ct < 120 ? "Tu écartes doucement les feuilles..." : ct < 380 ? "Le chat du vieil homme..." : "", W / 2, 470, 16, "#ccc");
}

function bigfoot(x, y) {
  ctx.fillStyle = "rgba(6,4,3,.95)"; ctx.beginPath(); ctx.ellipse(x, y - 34, 15, 24, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(x + 2, y - 62, 9, 0, 7); ctx.fill();
  ctx.fillRect(x - 14, y - 22, 9, 22); ctx.fillRect(x + 5, y - 22, 9, 22);
  ctx.strokeStyle = "rgba(6,4,3,.95)"; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(x - 12, y - 52); ctx.lineTo(x - 26, y - 28); ctx.moveTo(x + 12, y - 52); ctx.lineTo(x + 26, y - 26); ctx.stroke();
  ctx.lineWidth = 1; for (let k = 0; k < 14; k++) { const a = k * .45; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * 14, y - 34 + Math.sin(a) * 24); ctx.lineTo(x + Math.cos(a) * 20, y - 34 + Math.sin(a) * 31); ctx.stroke(); }
  ctx.shadowColor = "#f00"; ctx.shadowBlur = 14; ctx.fillStyle = "#f33"; ctx.fillRect(x - 2, y - 65, 3, 3); ctx.fillRect(x + 4, y - 65, 3, 3); ctx.shadowBlur = 0;
}
function leaves() {
  const sl = 70 + Math.min(1, ct / 110) * 230;
  ctx.fillStyle = "#3a2410"; ctx.fillRect(0, 0, W, 90); ctx.fillRect(0, 420, W, 80); ctx.fillRect(0, 90, 400 - sl, 330); ctx.fillRect(400 + sl, 90, 400 - sl, 330);
  for (let k = 0; k < 420; k++) { const x = sr(k) * W, y = sr(k + 500) * H; if (Math.abs(x - 400) < sl && y > 90 && y < 420) continue; ctx.fillStyle = ["#7a3a14", "#a85a1c", "#5a2a10", "#8a6a20", "#3a2a10"][k % 5]; ctx.beginPath(); ctx.ellipse(x, y, 16, 8, sr(k + 9) * 3, 0, 7); ctx.fill(); }
  if (ct < 130) { ctx.fillStyle = "#d8b090"; [400 - sl, 400 + sl].forEach(hx => { ctx.beginPath(); ctx.arc(hx, 260, 20, 0, 7); ctx.fill(); }); }
}
// Dans la voiture : moteur en feu, regard, rétroviseur
function drawCar() {
  const c = cr, fire = Math.min(1, Math.max(0, (c - 250) / 60)), fl = Math.sin(c * .4) * .1;
  ctx.fillStyle = "#04070a"; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.beginPath(); ctx.moveTo(120, 60); ctx.lineTo(680, 60); ctx.lineTo(740, 330); ctx.lineTo(60, 330); ctx.closePath(); ctx.clip();
  road(false); forest(.4, 24, 0);
  if (fire) { const fg = ctx.createLinearGradient(0, 330, 0, 150); fg.addColorStop(0, "rgba(255,120,20," + .9 * fire + ")"); fg.addColorStop(1, "rgba(255,60,0,0)"); ctx.fillStyle = fg; ctx.fillRect(0, 150, W, 200); for (let k = 0; k < 8; k++) { ctx.fillStyle = "rgba(255," + (120 + k * 15) + ",30," + .6 * fire + ")"; ctx.beginPath(); ctx.ellipse(200 + k * 60 + Math.sin(c * .3 + k) * 8, 320 - Math.abs(Math.sin(c * .2 + k)) * 90 * fire, 22, 50 * fire, 0, 0, 7); ctx.fill(); } }
  ctx.restore();
  ctx.fillStyle = "#0a0a0c"; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(120, 60); ctx.lineTo(60, 330); ctx.lineTo(0, 330); ctx.moveTo(800, 0); ctx.lineTo(680, 60); ctx.lineTo(740, 330); ctx.lineTo(800, 330); ctx.fill(); ctx.fillRect(0, 0, W, 60);
  ctx.fillStyle = "#0b0b0e"; ctx.fillRect(0, 330, W, 170); ctx.strokeStyle = "#151518"; ctx.lineWidth = 18; ctx.beginPath(); ctx.ellipse(400, 470, 130, 55, 0, 0, 7); ctx.stroke(); ctx.fillStyle = "#151518"; ctx.fillRect(388, 425, 24, 45);
  ctx.fillStyle = "#06080c"; ctx.fillRect(340, 66, 120, 52); ctx.save(); ctx.beginPath(); ctx.rect(343, 69, 114, 46); ctx.clip(); ctx.fillStyle = "#0b1220"; ctx.fillRect(340, 66, 120, 52);
  const ms = c < 250 ? .12 + c * .0004 : .22 + Math.pow((c - 250) / 270, 1.3) * .75; ctx.translate(400, 112); ctx.scale(ms, ms); monster(0, 0, ms > .7); ctx.restore();
  ctx.strokeStyle = "#222"; ctx.lineWidth = 5; ctx.strokeRect(340, 66, 120, 52);
  ctx.fillStyle = "rgba(255,90,10," + (.25 * fire + fl * fire) + ")"; ctx.fillRect(0, 0, W, H); vign(400, 250, 200, 520, .6);
}
function drawCrawl() {
  road(false, cw * 2); forest(.2 + cw, 26, 0);
  const s = .15 + cw * 1.1, cy = 250 + cw * 60;
  ctx.fillStyle = "#4a1212"; ctx.fillRect(400 - 60 * s, cy - 36 * s, 120 * s, 36 * s); ctx.fillStyle = "#3a0e0e"; ctx.fillRect(400 - 44 * s, cy - 60 * s, 88 * s, 26 * s); ctx.fillStyle = "#0c0c10"; ctx.fillRect(400 - 36 * s, cy - 56 * s, 72 * s, 18 * s);
  ctx.fillStyle = "#f33"; ctx.fillRect(400 - 56 * s, cy - 26 * s, 20 * s, 8 * s); ctx.fillRect(400 + 36 * s, cy - 26 * s, 20 * s, 8 * s);
  ctx.fillStyle = "#0b0b0b"; ctx.fillRect(400 - 58 * s, cy - 6 * s, 18 * s, 24 * s); ctx.fillRect(400 + 40 * s, cy - 6 * s, 18 * s, 24 * s); ctx.fillStyle = "#555"; ctx.fillRect(400 - 54 * s, cy + 2 * s, 10 * s, 8 * s); ctx.fillRect(400 + 44 * s, cy + 2 * s, 10 * s, 8 * s);
  for (let k = 0; k < 40; k++) { ctx.fillStyle = k % 2 ? "#7a3a14" : "#a85a1c"; ctx.beginPath(); ctx.ellipse(sr(k) * W, 340 + sr(k + 60) * 160, 10, 4, sr(k) * 3, 0, 7); ctx.fill(); }
  const b = Math.sin(cw * 140) * 30; ctx.lineCap = "round"; ctx.lineWidth = 44; ctx.strokeStyle = "#b0201a";
  [[-1, b], [1, -b]].forEach(a => { const x = 400 + a[0] * 130, y = 440 - Math.max(0, a[1]); ctx.beginPath(); ctx.moveTo(400 + a[0] * 220, 560); ctx.lineTo(x, y); ctx.stroke(); ctx.fillStyle = "#d8b090"; ctx.beginPath(); ctx.arc(x, y - 6, 24, 0, 7); ctx.fill(); });
  ctx.lineCap = "butt"; vign(400, 300, 150, 520, .92); txt("↑ : ramper vers la voiture", W / 2, 470, 16, "#aaa");
}
function drawExit() {
  const e = ex, op = Math.min(1, Math.max(0, (e - 20) / 25));
  ctx.fillStyle = "#04070a"; ctx.fillRect(0, 0, W, H); ctx.fillStyle = "#07100a"; ctx.fillRect(0, 330, W, 170); forest(.6, 24, 0);
  ctx.fillStyle = "#6a1414"; ctx.fillRect(150, 300, 300, 70); ctx.fillStyle = "#5a1010"; ctx.fillRect(210, 255, 170, 48); ctx.fillStyle = "#0c0c10"; ctx.fillRect(222, 262, 70, 36); ctx.fillRect(300, 262, 70, 36);
  [220, 390].forEach(x => { ctx.fillStyle = "#111"; ctx.beginPath(); ctx.arc(x, 372, 26, 0, 7); ctx.fill(); ctx.fillStyle = "#888"; ctx.beginPath(); ctx.arc(x, 372, 12, 0, 7); ctx.fill(); });
  ctx.save(); ctx.translate(300, 300); ctx.rotate(-op * .9); ctx.fillStyle = "#7a1a1a"; ctx.fillRect(0, 0, 80, 60); ctx.restore();
  for (let k = 0; k < 7; k++) { ctx.fillStyle = "rgba(255," + (110 + k * 18) + ",30,.85)"; ctx.beginPath(); ctx.ellipse(160 + k * 14, 295 - Math.abs(Math.sin(e * .3 + k)) * 40, 12, 28, 0, 0, 7); ctx.fill(); }
  if (e > 40) person(330 + (e - 40) * 3.2, 390, Math.max(.4, 1 - (e - 40) / 260), true, e);
  ctx.fillStyle = "rgba(255,90,10,.15)"; ctx.fillRect(0, 0, W, H); vign(300, 300, 150, 520, .8);
  if (e > 200) { ctx.fillStyle = "rgba(0,0,0," + (e - 200) / 40 + ")"; ctx.fillRect(0, 0, W, H); }
}
// Course dans la forêt dense : on avance sans arrêt, ← → pour esquiver
function drawRetry() {
  ctx.fillStyle = "#1a0404"; ctx.fillRect(0, 0, W, H); txt("☠️", W / 2, 140, 70); txt("Le monstre t’a rattrapé...", W / 2, 230, 28, "#d44");
  txt("Entrée : reprendre la fuite depuis le début", W / 2, 300, 18); txt("Reprise automatique dans " + Math.max(0, Math.ceil(8 - rn8 / 60)) + " s", W / 2, 340, 16, "#aaa");
  ctx.fillStyle = "#a00"; ctx.fillRect(200, 380, 400 * Math.max(0, 1 - rn8 / 480), 8);
}
function drawDive() {
  const d = Math.min(1, dv / 110), a = Math.min(1, Math.max(0, (dv - 60) / 50));
  road(false); forest(.2, 30, 0);
  leafPile(400, 420, 40 + d * 460, 10 + d * 90, 5);
  ctx.lineCap = "round"; ctx.lineWidth = 46; ctx.strokeStyle = "#b0201a";
  [-1, 1].forEach(sg => { const ex = 400 + sg * (300 - a * 230), ey = 540 - a * 250; ctx.beginPath(); ctx.moveTo(400 + sg * 300, 560); ctx.lineTo(ex, ey); ctx.stroke(); ctx.fillStyle = "#d8b090"; ctx.beginPath(); ctx.arc(ex, ey - 6, 26, 0, 7); ctx.fill(); });
  ctx.lineCap = "butt"; vign(400, 300, 220, 520, .85); txt(dv < 100 ? "Un tas de feuilles ! Tu t’y jettes..." : "", W / 2, 470, 18);
}
function drawRun() {
  const trip = rn > 1100, tt = trip ? Math.min(1, (rn - 1100) / 70) : 0, yj = jt > 0 ? Math.sin((1 - jt / 40) * Math.PI) * 40 : 0;
  ctx.save(); ctx.translate(0, yj); if (trip) { ctx.translate(400, 250); ctx.rotate(tt * 1.3); ctx.translate(-400, -250 + tt * 120); }
  road(false, fo); forest(fo, 44, -rx * 240); forest(fo * 1.31, 28, -rx * 300); if (rn > 290 && rn < 520) crows(rn - 290);
  tr.forEach((o, i) => {
    const d = o.z * o.z, x = 400 + (o.x - rx) * (60 + d * 700), y = 230 + d * 270;
    if (o.log) { branch(d, i, x, .6); return; }
    const w = 12 + d * 110, h = 90 + d * 420; ctx.fillStyle = "#0a0f08"; ctx.fillRect(x - w / 2, y - h, w, h); ctx.fillStyle = "#08140a";
    for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.ellipse(x + (k - 1.5) * w * .8, y - h + (k % 2) * w, w * 1.2, w * .8, 0, 0, 7); ctx.fill(); }
  });
  ctx.restore();
  const g = ctx.createRadialGradient(400, 290, 8, 400, 290, 190); g.addColorStop(0, "rgba(255,240,190,.08)"); g.addColorStop(1, "rgba(0,0,0,.975)"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  if (trip) { ctx.fillStyle = "rgba(0,0,0," + tt + ")"; ctx.fillRect(0, 0, W, H); }
  txt("← → : esquive · Espace : saute les rondins", W / 2, 96, 16, "#ccc");
}
// Backrooms : salle jaune
function thing(x, y, s, tm) {
  ctx.strokeStyle = "#120e0a"; ctx.lineCap = "round"; ctx.lineWidth = 7 * s;
  for (let k = 0; k < 4; k++) { const sg = k % 2 ? 1 : -1, wob = Math.sin(tm * .15 + k * 2) * 14 * s, lv = k < 2 ? -60 : -20; ctx.beginPath(); ctx.moveTo(x + sg * 8 * s, y + lv * s); ctx.lineTo(x + sg * (40 + k * 12) * s + wob, y + (lv - 30 + k * 18) * s); ctx.lineTo(x + sg * (30 + k * 20) * s - wob, y + (lv + 40 + k * 25) * s); ctx.stroke(); }
  ctx.fillStyle = "#120e0a"; ctx.beginPath(); ctx.ellipse(x, y - 60 * s, 12 * s, 48 * s, 0, 0, 7); ctx.fill();
  ctx.fillStyle = "#cfc8b0"; ctx.beginPath(); ctx.ellipse(x, y - 118 * s, 10 * s, 14 * s, 0, 0, 7); ctx.fill(); ctx.fillStyle = "#000"; ctx.fillRect(x - 6 * s, y - 122 * s, 4 * s, 6 * s); ctx.fillRect(x + 2 * s, y - 122 * s, 4 * s, 6 * s);
  ctx.lineCap = "butt";
}
// Backrooms : couloir profond, créature aux membres tordus
function drawBack() {
  const fl = Math.random() < .03 ? .6 : 1, adv = bk * .004, sh = bk > 400 && bk < 450;
  ctx.save(); if (sh) ctx.translate((Math.random() - .5) * 20, (Math.random() - .5) * 20);
  ctx.fillStyle = "#6e6020"; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#4a4018"; ctx.beginPath(); ctx.moveTo(0, 500); ctx.lineTo(800, 500); ctx.lineTo(460, 285); ctx.lineTo(340, 285); ctx.fill();
  ctx.fillStyle = "#8a8248"; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(800, 0); ctx.lineTo(460, 225); ctx.lineTo(340, 225); ctx.fill();
  ctx.fillStyle = "#7a6a2c"; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(340, 225); ctx.lineTo(340, 285); ctx.lineTo(0, 500); ctx.moveTo(800, 0); ctx.lineTo(460, 225); ctx.lineTo(460, 285); ctx.lineTo(800, 500); ctx.fill();
  ctx.fillStyle = "#5a4e1a"; ctx.fillRect(340, 225, 120, 60);
  for (let i = 0; i < 8; i++) {
    const d = Math.pow((i / 8 + adv) % 1, 2), y = 225 - d * 215, lw = 20 + d * 220, pw = 6 + d * 40;
    ctx.fillStyle = "rgba(255,251,224," + fl + ")"; ctx.fillRect(400 - lw / 2, y, lw, 3 + d * 12);
    ctx.fillStyle = "#54481a"; ctx.fillRect(340 - d * 340, 225 - d * 225, pw, 60 + d * 275); ctx.fillRect(460 + d * 340 - pw, 225 - d * 225, pw, 60 + d * 275);
  }
  if (bk > 180) { const q = Math.min(1, (bk - 180) / 220), lp = bk > 400 ? (bk - 400) / 40 : 0; thing(400, 290 + q * 130 + lp * 120, .25 + q * .9 + lp * 3, bk); }
  ctx.restore(); vign(400, 250, 160, 520, .75);
  if (bk > 450) { ctx.fillStyle = "rgba(0,0,0," + Math.min(1, (bk - 450) / 50) + ")"; ctx.fillRect(0, 0, W, H); }
}
// Cellule de cachot dans un manoir devenu immense
const DLG = [
  ["n", "Un mauvais rêve... non : le monstre m’a cogné la tête."],
  ["v", "Alors il t’a eu... Je t’entendais courir au-dessus de moi, et je priais pour que ce ne soit pas la fin."],
  ["v", "J’ai voulu t’aider avec cette lettre, écrite dans le placard pendant qu’il me cherchait. J’y croyais tant."],
  ["p", "Qui est ce monstre ? Pourquoi s’en prendre au livreur de pizza et pas au livreur de sushi ?"],
  ["v", "On ne peut pas s’enfuir d’ici, petit..."],
  ["p", "Je ne me laisserai pas faire."],
  ["n", "Tu fouilles la cellule, de quoi couper les barreaux... Un trou sous la grille !"],
  ["v", "J’ai essayé de creuser. Je n’y suis jamais arrivé."],
  ["n", "Tu te retournes : le monstre approche, couteau en main, la jambe qui traîne, une boule dans l’autre."],
  ["n", "Il veut t’attacher les pieds ! Tu tombes, tu recules... puis ton pied frappe sa jambe !"]
];
function oldman(x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = "#1b2438"; ctx.fillRect(-30, -14, 90, 18); ctx.fillRect(-30, -14, 22, 30);
  ctx.fillStyle = "#7a1812"; ctx.beginPath(); ctx.moveTo(-34, -20); ctx.lineTo(-30, -90); ctx.lineTo(14, -92); ctx.lineTo(20, -20); ctx.fill();
  ctx.fillStyle = "#d4aa88"; ctx.beginPath(); ctx.arc(-8, -108, 16, 0, 7); ctx.fill();
  ctx.fillStyle = "#cfcfc6"; ctx.beginPath(); ctx.ellipse(-8, -98, 14, 16, 0, 0, 3.14); ctx.fill();
  ctx.fillStyle = "#6a1410"; ctx.fillRect(-24, -128, 30, 9);
  ctx.fillStyle = "#f0e6d8"; ctx.fillRect(-16, -112, 7, 4); ctx.fillRect(-4, -112, 7, 4);
  ctx.fillStyle = "#222"; ctx.fillRect(-14, -110, 3, 3); ctx.fillRect(-2, -110, 3, 3);
  ctx.fillStyle = "rgba(70,40,90,.55)"; ctx.fillRect(-16, -107, 8, 3); ctx.fillRect(-4, -107, 8, 3);
  ctx.strokeStyle = "#3a2a20"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-18, -118); ctx.lineTo(-9, -114); ctx.moveTo(6, -118); ctx.lineTo(-3, -114); ctx.stroke();
  ctx.strokeStyle = "#666"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-26, 2); ctx.quadraticCurveTo(-60, 20, -78, 14); ctx.stroke();
  const g = ctx.createRadialGradient(-86, 6, 2, -82, 12, 18); g.addColorStop(0, "#888"); g.addColorStop(1, "#111"); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(-82, 14, 17, 0, 7); ctx.fill();
  ctx.restore();
}
function drawCell0() {
  const B = cli >= 8, sh = cli === 9 && cl > 60 && cl < 110;
  ctx.save(); ctx.scale(1, .8); if (sh) ctx.translate((Math.random() - .5) * 18, (Math.random() - .5) * 18);
  const fv = cli === 8 ? Math.min(1, Math.max(0, (cl - 150) / 250)) : cli === 9 ? 1 : 0; if (B) { const fq = cli === 9 ? Math.min(1, cl / 70) : fv * .3; ctx.translate(400, 250); ctx.rotate(fq * .12); ctx.translate(-400, -250 + fq * 110); }
  ctx.fillStyle = "#0c0e14"; ctx.fillRect(0, 0, W, H + 50);
  ctx.fillStyle = "#181b22"; ctx.fillRect(230, 110, 340, 230);
  ctx.fillStyle = "#12141a"; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(230, 110); ctx.lineTo(230, 340); ctx.lineTo(0, 500); ctx.moveTo(800, 0); ctx.lineTo(570, 110); ctx.lineTo(570, 340); ctx.lineTo(800, 500); ctx.fill();
  ctx.fillStyle = "#1c1a18"; ctx.beginPath(); ctx.moveTo(230, 340); ctx.lineTo(570, 340); ctx.lineTo(800, 500); ctx.lineTo(0, 500); ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,.5)"; ctx.lineWidth = 1; for (let i = 0; i <= 8; i++) { ctx.beginPath(); ctx.moveTo(230 + i * 42, 340); ctx.lineTo(i * 100, 500); ctx.stroke(); } for (let y = 130; y < 340; y += 32) { ctx.beginPath(); ctx.moveTo(230, y); ctx.lineTo(570, y); ctx.stroke(); }
  ctx.fillStyle = "rgba(120,150,220,.12)"; ctx.beginPath(); ctx.moveTo(330, 150); ctx.lineTo(370, 150); ctx.lineTo(430, 340); ctx.lineTo(330, 340); ctx.fill();
  if (!B) { oldman(380, 350, 1.9); if (cli >= 6) { ctx.fillStyle = "#040404"; ctx.beginPath(); ctx.ellipse(580, 440, 60, 14, 0, 0, 7); ctx.fill(); } }
  else {
    ctx.fillStyle = "#0a0b10"; ctx.fillRect(250, 90, 300, 330);
    const a = cli === 8 ? Math.min(1, cl / 300) : 1, op = cli === 8 ? Math.max(0, (a - .85) / .15) : 1, kn = cli === 9 && cl > 70 ? Math.min(1, (cl - 70) / 40) : 0, ms = .4 + a * 1.5;
    ctx.fillStyle = "rgba(140,10,10," + .25 * a + ")"; ctx.beginPath(); ctx.ellipse(400, 250, 220 * a, 260 * a, 0, 0, 7); ctx.fill(); jailer(400 + (cli === 8 ? Math.sin(cl * .12) * 10 : 0), 340 + a * 60 - 92 * (.35 + a * 1.9) + kn * 70 + (cli === 8 ? Math.abs(Math.sin(cl * .12)) * 8 * a : 0) + (cli === 9 ? Math.min(cl, 70) * .5 : 0), .35 + a * 1.9, cli === 9 && cl > 60);
    ctx.fillStyle = "#17171b"; for (let i = 0; i < 7; i++) if (i < 7 - op * 5) ctx.fillRect(250 + i * 47, 90, 12, 330); ctx.fillRect(250, 90, 300, 12);
  }
  ctx.restore(); vign(400, 230, 160, 520, .8);
  if (B) {
    
    const kb = cli === 9 ? Math.min(1, cl / 55) : 0, kk = cli === 9 ? Math.min(1, Math.max(0, (cl - 55) / 25)) : 0;
    
    if (cli === 9) {  if (kk > .85) { ctx.fillStyle = "rgba(180,0,0,.5)"; ctx.fillRect(0, 0, W, 400); } }
  }
  ctx.fillStyle = "#000"; ctx.fillRect(0, 400, W, 100);
  if (cli === 0 && cl < 150) { ctx.fillStyle = "rgba(0,0,0," + (1 - cl / 150) + ")"; ctx.fillRect(0, 0, W, 400); }
  const d = DLG[cli], who = { n: "", v: "Le vieux livreur : ", p: "Toi : " }[d[0]], col = { n: "#bbb", v: "#e8c070", p: "#8cf" }[d[0]], tx = who + d[1];
  let l1 = tx, l2 = ""; if (tx.length > 62) { const m = tx.lastIndexOf(" ", 62); l1 = tx.slice(0, m); l2 = tx.slice(m + 1); }
  txt(l1, W / 2, l2 ? 436 : 450, 18, col); if (l2) txt(l2, W / 2, 466, 18, col);
}
function drawStorm() {
  const w = winT, c = Math.min(1, w / 400), rain = Math.min(1, Math.max(0, (w - 150) / 450));
  ctx.fillStyle = "rgb(" + (20 - c * 12 | 0) + "," + (30 - c * 18 | 0) + "," + (60 - c * 30 | 0) + ")"; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#06100a"; ctx.fillRect(0, 340, W, 160); forest(.3, 22, 0);
  for (let k = 0; k < 14; k++) { ctx.fillStyle = "rgba(" + (40 - k) + "," + (45 - k) + "," + (60 - k) + "," + Math.min(.95, c * 1.2) + ")"; ctx.beginPath(); ctx.ellipse(60 + k * 55 + Math.sin(w * .01 + k) * 20, 60 + (k % 3) * 40, 70 + c * 50, 28 + c * 20, 0, 0, 7); ctx.fill(); }
  ctx.strokeStyle = "rgba(180,200,230,.45)"; ctx.lineWidth = 1; for (let k = 0; k < rain * 260; k++) { const x = (sr(k) * W + w * 4) % W, y = (sr(k + 99) * H + w * (14 + rain * 20)) % H; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 3, y + 14 + rain * 14); ctx.stroke(); }
  if (w > 520 && w < 545) { ctx.fillStyle = "rgba(255,255,255," + (1 - (w - 520) / 25) + ")"; ctx.fillRect(0, 0, W, H); }
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, 70, H); ctx.fillRect(W - 70, 0, 70, H); ctx.fillRect(0, 0, W, 50); ctx.fillRect(0, H - 60, W, 60); ctx.fillStyle = "#1a120c"; ctx.fillRect(396, 0, 8, H); ctx.fillRect(0, 240, W, 8);
  vign(400, 250, 200, 520, .7); txt(w < 150 ? "Des nuages s’accumulent dans le ciel..." : w < 450 ? "Il commence à pleuvoir doucement..." : "Puis d’un coup, la pluie tombe fort.", W / 2, 470, 17);
}
function drawPuddle() {
  const p = pu, fl = p % 150 > 90 && p % 150 < 98, gy = 430, wa = p > 720;
  ctx.fillStyle = fl ? "#2a3550" : "#070a10"; ctx.fillRect(0, 0, W, H);
  for (let k = 0; k < 10; k++) { const x = ((k * 140 - p * .3) % 1400 + 1400) % 1400 - 200; ctx.fillStyle = "#04080a"; ctx.beginPath(); ctx.moveTo(x, 110); ctx.lineTo(x - 55, 400); ctx.lineTo(x + 55, 400); ctx.fill(); }
  ctx.fillStyle = "#2a1e14"; ctx.fillRect(0, 400, W, 100); ctx.fillStyle = "#3a4a60"; ctx.beginPath(); ctx.ellipse(420, 448, 210, 24, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = "rgba(200,220,255,.5)"; ctx.lineWidth = 1; for (let k = 0; k < 6; k++) { const r = (p * 1.2 + k * 25) % 70; ctx.beginPath(); ctx.ellipse(300 + k * 45, 448, r, r * .2, 0, 0, 7); ctx.stroke(); }
  const px = p < 200 ? 60 + p * 1.65 : wa ? 390 + (p - 720) * 1.4 : 390 - Math.min(1, Math.max(0, (p - 260) / 220)) * 40;
  const mx = p < 200 ? -60 + p * 1.15 : 170 + Math.min(1, (p - 200) / 320) * 140, ox = p < 480 ? 960 : p < 540 ? 960 - (p - 480) / 60 * 390 : wa ? px - 100 : 570;
  const mon = Math.min(1, Math.max(0, (p - 570) / 60));
  ctx.save(); ctx.translate(mx + mon * 20, 343 + mon * 70); ctx.rotate(mon * 1.45); ctx.scale(1.5, 1.5); walker(0, 0, Math.min(p, 560)); ctx.restore();
  const fall = Math.min(1, Math.max(0, (p - 200) / 40)), rec = Math.min(1, Math.max(0, (p - 620) / 50)), rot = (p < 620 ? fall : 1 - rec) * 1.2;
  ctx.save(); ctx.translate(px, gy + (p >= 240 && p < 640 ? 14 : 0)); ctx.rotate(rot); person(0, 0, 1.6, false, p < 200 || wa ? p * 1.5 : 0, p > 190 && p < 700); ctx.restore();
  if (p >= 480) {
    const q = Math.min(1, Math.max(0, (p - 520) / 40)), fx = ox - 24; let bx = fx - 40, by = gy - 10;
    elder(ox, gy, 1.5, wa ? p : 0, p > 515 && p < 545);
    if (p >= 520 && p < 570) { bx = fx + (mx + 20 - fx) * q; by = gy - 20 - Math.sin(q * 3.14) * 90 - q * 120; } else if (p >= 570) { bx = wa ? ox - 44 : mx + 30; by = gy - 12; }
    ctx.strokeStyle = "#777"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(fx, gy - 8); ctx.lineTo(bx, by); ctx.stroke(); ctx.fillStyle = "#1a1a1a"; ctx.beginPath(); ctx.arc(bx, by, 14, 0, 7); ctx.fill(); ctx.fillStyle = "#888"; ctx.fillRect(bx - 6, by - 7, 4, 4);
    if (p >= 560 && p < 566) { ctx.fillStyle = "rgba(255,255,255,.4)"; ctx.fillRect(0, 0, W, H); }
  }
  ctx.strokeStyle = "rgba(180,200,230,.5)"; for (let k = 0; k < 300; k++) { const x = (sr(k) * W + p * 5) % W, y = (sr(k + 99) * H + p * 30) % H; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 4, y + 20); ctx.stroke(); }
  vign(400, 250, 220, 520, .7);
  txt(p < 200 ? "Tu cours, le monstre est à tes trousses..." : p < 260 ? "Tu te retournes... et tu glisses dans la flaque !" : p < 480 ? "Terrifié, tu recules dans la boue..." : p < 600 ? "Le vieux livreur barbu surgit et lance sa boule du pied !" : p < 720 ? "Le monstre s’effondre." : "Vous marchez côte à côte vers le portail.", W / 2, 96, 17);
}
function drawRoad2d() {
  const q = Math.min(1, rd / 1400);
  ctx.fillStyle = "#070b14"; ctx.fillRect(0, 0, W, H); ctx.fillStyle = "#e8e4cc"; ctx.beginPath(); ctx.arc(600, 70, 24, 0, 7); ctx.fill();
  for (let k = 0; k < 14; k++) { const x = ((k * 150 - rd * .5) % 2100 + 2100) % 2100 - 150; ctx.fillStyle = "#04080a"; ctx.beginPath(); ctx.moveTo(x, 150); ctx.lineTo(x - 50, 340); ctx.lineTo(x + 50, 340); ctx.fill(); }
  ctx.fillStyle = "#07100a"; ctx.fillRect(0, 340, W, 160);
  ctx.fillStyle = "rgb(" + (92 - q * 56 | 0) + "," + (86 - q * 50 | 0) + "," + (70 - q * 36 | 0) + ")"; ctx.fillRect(0, 360, W, 100);
  if (q > .6) { ctx.fillStyle = "#cfc070"; for (let k = 0; k < 8; k++) ctx.fillRect(((k * 130 - rd) % 1040 + 1040) % 1040 - 100, 408, 60, 5); }
  for (let k = 0; k < 40; k++) { ctx.fillStyle = q < .5 ? "#6a6458" : "#2a2a2c"; ctx.fillRect(((sr(k) * 1600 - rd) % 1600 + 1600) % 1600 - 400, 362 + sr(k + 50) * 96, 3, 2); }
  const sx = 2300 - rd; if (sx < 900) { ctx.fillStyle = "#1c1c20"; ctx.fillRect(sx, 230, 260, 130); ctx.fillStyle = "#ffd070"; ctx.fillRect(sx + 20, 260, 90, 60); ctx.fillStyle = "#4a4a54"; ctx.fillRect(sx + 170, 270, 45, 90); [sx - 150, sx - 80].forEach(x => { ctx.fillStyle = "#c8c8cc"; ctx.fillRect(x, 300, 34, 60); ctx.fillStyle = "#a22"; ctx.fillRect(x, 300, 34, 12); }); ctx.fillStyle = "#eee"; ctx.fillRect(sx - 40, 220, 340, 14); txt("STATION", sx + 130, 227, 12, "#222"); }
  const w = keys.ArrowRight ? t : 0; person(300, 440, 1.1, false, w); elder(200, 440, 1.05, w, false); ctx.strokeStyle = "#777"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(190, 434); ctx.lineTo(166, 436); ctx.stroke(); ctx.fillStyle = "#1a1a1a"; ctx.beginPath(); ctx.arc(158, 434, 13, 0, 7); ctx.fill();
  ctx.strokeStyle = "rgba(180,200,230,.4)"; ctx.lineWidth = 1; for (let k = 0; k < 160; k++) { const x = (sr(k) * W + t * 4) % W, y = (sr(k + 99) * H + t * 24) % H; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 3, y + 16); ctx.stroke(); }
  if (rd > 1250 && rd < 1550) { ctx.fillStyle = "rgba(0,0,0,.6)"; ctx.fillRect(0, 0, W, H); txt("1 h de marche plus tard...", W / 2, 250, 34); }
  vign(400, 300, 220, 520, .6); txt(rd < 100 ? "→ : marche sur la route, le vieux te suit" : "", W / 2, 96, 16, "#aaa");
}
function drawStation() {
  const on = sn < 500 ? 1 : (Math.random() < .5 ? 1 : .08);
  if (sn < 200) {
    ctx.fillStyle = "#0a0e16"; ctx.fillRect(0, 0, W, H); ctx.fillStyle = "#1a1c20"; ctx.fillRect(0, 340, W, 160); ctx.fillStyle = "rgba(120,140,180,.12)"; ctx.fillRect(0, 340, W, 12);
    ctx.fillStyle = "#2a2c32"; ctx.fillRect(330, 160, 400, 190); ctx.fillStyle = "#ffd070"; ctx.fillRect(360, 200, 120, 90); ctx.fillStyle = "#101216"; ctx.fillRect(560, 210, 70, 140);
    ctx.fillStyle = "#e8e8e8"; ctx.fillRect(300, 130, 460, 26); ctx.fillStyle = "rgba(220,255,250," + (.7 + Math.sin(sn * .3) * .2) + ")"; ctx.fillRect(310, 154, 440, 4); txt("STATION", 530, 143, 14, "#a22");
    [90, 220].forEach(x => { ctx.fillStyle = "#c8c8cc"; ctx.fillRect(x, 230, 60, 110); ctx.fillStyle = "#a22"; ctx.fillRect(x, 230, 60, 22); ctx.fillStyle = "#133"; ctx.fillRect(x + 10, 262, 40, 24); ctx.fillStyle = "#7fe"; ctx.fillRect(x + 14, 266, 32, 6); ctx.strokeStyle = "#111"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x + 60, 270); ctx.quadraticCurveTo(x + 80, 330, x + 62, 335); ctx.stroke(); });
    const wx = 120 + sn * 2.2; person(wx, 420, 1, true, sn); elder(wx - 80, 420, .95, sn, false); ctx.fillStyle = "#1a1a1a"; ctx.beginPath(); ctx.arc(wx - 112, 416, 11, 0, 7); ctx.fill();
    ctx.strokeStyle = "rgba(180,200,230,.45)"; ctx.lineWidth = 1; for (let k = 0; k < 200; k++) { const x = (sr(k) * W + t * 4) % W, y = (sr(k + 99) * H + t * 24) % H; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 3, y + 16); ctx.stroke(); }
    priceBoard(); vign(400, 250, 220, 520, .6); txt("Une station-service éclairée, en pleine nuit... Vous poussez la porte.", W / 2, 470, 16); return;
  }
  ctx.fillStyle = "#101418"; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#2a2e32"; ctx.beginPath(); ctx.moveTo(0, 500); ctx.lineTo(800, 500); ctx.lineTo(520, 300); ctx.lineTo(280, 300); ctx.fill();
  ctx.fillStyle = "#4a5056"; ctx.fillRect(340, 225, 120, 60); ctx.fillStyle = "#3a4046"; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(340, 225); ctx.lineTo(340, 285); ctx.lineTo(0, 500); ctx.moveTo(800, 0); ctx.lineTo(460, 225); ctx.lineTo(460, 285); ctx.lineTo(800, 500); ctx.fill();
  const od = Math.max(0, Math.min(1, (sn - 600) / 80)); ctx.fillStyle = "#020203"; ctx.fillRect(345, 235, 26 * od, 50); ctx.fillStyle = "#555c62"; ctx.fillRect(385, 262, 70, 22); ctx.fillStyle = "#222"; ctx.fillRect(400, 248, 28, 16); ctx.fillStyle = "#4a4034"; ctx.fillRect(362, 270, 76, 14); for (let c = 0; c < 6; c++) goods(364 + c * 12, 262, 10, 10, c + 1);
  for (let i = 0; i < 9; i++) {
    const d = Math.pow(i / 9, 1.6), w = 10 + d * 80, bot = 285 + d * 215, top = bot - (50 + d * 130);
    [340 - d * 340, 460 + d * 340 - w].forEach(x => { ctx.fillStyle = "#4a4034"; ctx.fillRect(x, top, w, bot - top); for (let r = 0; r < 6; r++) for (let c = 0; c < 3; c++) { goods(x + 2 + c * w / 3.2, top + 4 + r * (bot - top) / 6.2, w / 4, (bot - top) / 9, i + r + c + (x > 400 ? 2 : 0)); } });
  }
  [2, 4, 6].forEach(i => { const d = Math.pow(i / 9, 1.6), w = 40 + d * 140, bot = 285 + d * 215, top = bot - (28 + d * 70); ctx.fillStyle = "#4a4034"; ctx.fillRect(400 - w / 2, top, w, bot - top); for (let c = 0; c < 4; c++) for (let r = 0; r < 2; r++) goods(400 - w / 2 + 3 + c * (w - 6) / 4, top + 3 + r * (bot - top) / 2.2, (w - 6) / 5, (bot - top) / 3, i + c + r); });
  ctx.fillStyle = "rgba(220,255,250," + .85 * on + ")"; for (let i = 0; i < 5; i++) ctx.fillRect(260 + i * 10, 20 + i * 28, 280 - i * 20, 6);
  ctx.fillStyle = "rgba(0,0,0," + (1 - on) * .9 + ")"; ctx.fillRect(0, 0, W, H); vign(400, 250, 160, 520, .7);
  txt(sn < 340 ? "Toi : Des rayons pleins de tout... mais pas une âme." : sn < 500 ? "Le vieux livreur : Personne... Quelque chose ne va pas." : "", W / 2, 465, 17);
}
function drawInv() {
  ctx.fillStyle = "rgba(0,0,0,.82)"; ctx.fillRect(0, 0, W, H); txt("INVENTAIRE", W / 2, 60, 32, "#d44");
  const it = [["Morceau de clé n°1 (tiroir de l’étage)", kA], ["Morceau de clé n°2 (tiroir tout en haut)", kB], ["Colle forte", glue]];
  it.forEach((a, i) => { ctx.fillStyle = a[1] ? "rgba(80,120,60,.4)" : "rgba(120,30,30,.3)"; ctx.fillRect(160, 110 + i * 70, 480, 54); ctx.strokeStyle = a[1] ? "#6c6" : "#733"; ctx.strokeRect(160, 110 + i * 70, 480, 54); txt((a[1] ? "✔ " : "✘ ") + a[0] + (a[1] ? "" : " — manquant"), W / 2, 137 + i * 70, 18, a[1] ? "#cfc" : "#b88"); });
  const miss = [!kA && "le morceau n°1", !kB && "le morceau n°2", !glue && "la colle"].filter(Boolean);
  txt(phase2 ? (miss.length ? "Il te manque : " + miss.join(", ") : "Tout est là : colle la clé sur l’établi du sous-sol (Z).") : "Rien à assembler pour le moment.", W / 2, 360, 17, "#ddd"); txt("A : fermer", W / 2, 450, 15, "#888");
}
function paper() {
  ctx.fillStyle = "#d8c7a0"; ctx.fillRect(0, 0, W, H);
  const v = ctx.createRadialGradient(400, 250, 250, 400, 250, 520); v.addColorStop(0, "rgba(60,30,10,0)"); v.addColorStop(1, "rgba(60,30,10,.6)"); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
}
let pp = null;
function jailer0(x, y, s, open, kf) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = "#111"; ctx.fillRect(-18, 44, 14, 40); ctx.fillStyle = "#0b0b0b"; ctx.fillRect(6, 44, 16, 40);
  ctx.fillStyle = "#6a1010"; ctx.beginPath(); ctx.moveTo(6, 52); ctx.lineTo(22, 52); ctx.lineTo(24, 74); ctx.lineTo(8, 78); ctx.fill();
  ctx.fillStyle = "#e8e0d0"; ctx.fillRect(5, 60, 18, 5); ctx.fillRect(5, 70, 18, 5); ctx.fillStyle = "#8a1010"; ctx.fillRect(12, 60, 4, 16); ctx.beginPath(); ctx.arc(14, 82, 3, 0, 7); ctx.fill();
  ctx.fillStyle = "#050505"; ctx.fillRect(-20, 82, 18, 8); ctx.fillRect(4, 84, 22, 8);
  ctx.fillStyle = "#070707"; ctx.beginPath(); ctx.ellipse(0, 10, 22, 36, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(0, -36, 15, 0, 7); ctx.fill();
  ctx.shadowColor = "#f00"; ctx.shadowBlur = 12; ctx.fillStyle = "#f22"; ctx.fillRect(-8, -40, 6, 3); ctx.fillRect(2, -40, 6, 3); ctx.shadowBlur = 0;
  if (open) { const m = (Math.sin(t * .35) + 1) / 2 * 5; ctx.fillStyle = "#200"; ctx.fillRect(-7, -30, 14, 3 + m); ctx.fillStyle = "#eee"; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(-7 + k * 3.5, -30); ctx.lineTo(-5.5 + k * 3.5, -26); ctx.lineTo(-3.5 + k * 3.5, -30); ctx.fill(); } }
  ctx.fillStyle = "#3a2a20"; ctx.fillRect(14, 14, 8, 14); ctx.fillStyle = "#a8a8aa"; ctx.fillRect(16, 8, 4, 8);
  const g = ctx.createRadialGradient(-6, 16, 2, 0, 22, 24); g.addColorStop(0, "#999"); g.addColorStop(1, "#0c0c0c"); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 24, 22, 0, 7); ctx.fill();
  ctx.strokeStyle = "#070707"; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(-20, -8); ctx.lineTo(-18, 24); ctx.moveTo(20, -8); ctx.lineTo(18, 24); ctx.stroke();
  ctx.fillStyle = "#151515"; ctx.beginPath(); ctx.arc(-18, 24, 7, 0, 7); ctx.arc(18, 24, 7, 0, 7); ctx.fill();
  ctx.strokeStyle = "#666"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 46); ctx.quadraticCurveTo(10, 60, -4, 68); ctx.stroke();
  ctx.restore();
}
function elder(x, y, s, tm, kick) {
  const sw = Math.sin(tm * .12) * 6;
  ctx.save(); ctx.translate(x, y); if (kick) ctx.rotate(-.15); ctx.scale(s, s);
  ctx.fillStyle = "#1b2438"; ctx.fillRect(-14 + sw, -36, 11, 36); ctx.fillRect(3 - sw, -36, 11, 36); ctx.fillStyle = "#050505"; ctx.fillRect(-16 + sw, -4, 14, 5); ctx.fillRect(2 - sw, -4, 14, 5);
  ctx.fillStyle = "#7a1812"; ctx.beginPath(); ctx.moveTo(-20, -36); ctx.lineTo(-17, -88); ctx.lineTo(17, -88); ctx.lineTo(20, -36); ctx.fill();
  ctx.fillStyle = "#d4aa88"; ctx.beginPath(); ctx.arc(0, -102, 15, 0, 7); ctx.fill(); ctx.fillStyle = "#cfcfc6"; ctx.beginPath(); ctx.ellipse(0, -94, 14, 17, 0, 0, 3.14); ctx.fill(); ctx.fillStyle = "#6a1410"; ctx.fillRect(-16, -122, 32, 9);
  ctx.fillStyle = "#f0e6d8"; ctx.fillRect(-10, -106, 7, 4); ctx.fillRect(3, -106, 7, 4); ctx.fillStyle = "#222"; ctx.fillRect(-8, -104, 3, 3); ctx.fillRect(5, -104, 3, 3);
  ctx.fillStyle = "rgba(70,40,90,.55)"; ctx.fillRect(-10, -102, 8, 3); ctx.fillRect(3, -102, 8, 3);
  ctx.strokeStyle = "#3a2a20"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-12, -112); ctx.lineTo(-4, -109); ctx.moveTo(12, -112); ctx.lineTo(4, -109); ctx.stroke();
  ctx.restore();
}


function manor(hs, by) {
  const x0 = 400 - hs * .9, w = hs * 1.8;
  for (let i = 0; i < 22; i++) { ctx.fillStyle = ["#14100a", "#0c0806", "#18110a", "#080503"][i % 4]; ctx.fillRect(x0 + i * w / 22, by - hs, w / 22 + 1, hs); }
  ctx.fillStyle = "#050302"; for (let i = 0; i < 6; i++) ctx.fillRect(x0 + sr(i + 40) * w, by - hs * (.2 + sr(i + 50) * .6), hs * .05, hs * .12);
  ctx.fillStyle = "#040302"; ctx.beginPath(); ctx.moveTo(400 - hs * 1.05, by - hs); ctx.lineTo(395, by - hs * 1.6); ctx.lineTo(400 + hs * 1.05, by - hs); ctx.fill();
  ctx.fillStyle = "#1a1410"; for (let i = 0; i < 6; i++) ctx.fillRect(400 - hs * .7 + i * hs * .22, by - hs * 1.15 - (i % 2) * hs * .05, hs * .12, hs * .04);
  ctx.fillStyle = "#0a0706"; ctx.fillRect(400 + hs * .55, by - hs * 1.75, hs * .14, hs * .55);
  [-.55, .55].forEach(k => {
    const wx = 400 + hs * k - hs * .1, wy = by - hs * .75; ctx.fillStyle = k < 0 ? "#9a3a12" : "#050303"; ctx.fillRect(wx, wy, hs * .2, hs * .28);
    ctx.strokeStyle = "#0a0503"; ctx.lineWidth = Math.max(1, hs * .02); ctx.strokeRect(wx, wy, hs * .2, hs * .28); ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(wx + hs * .2, wy + hs * .28); ctx.moveTo(wx + hs * .2, wy); ctx.lineTo(wx, wy + hs * .28); ctx.stroke();
  });
  ctx.fillStyle = "#050302"; ctx.fillRect(400 - hs * .11, by - hs * .5, hs * .22, hs * .5); ctx.fillStyle = "#3a2a18"; ctx.fillRect(400 + hs * .05, by - hs * .25, hs * .03, hs * .03);
  ctx.fillStyle = "#1a120a"; ctx.fillRect(400 - hs * .22, by - hs * .04, hs * .44, hs * .04);
  ctx.strokeStyle = "#1c3a16"; ctx.lineWidth = Math.max(1, hs * .025);
  for (let i = 0; i < 6; i++) { const vx = 400 + hs * (.55 + i * .07); ctx.beginPath(); ctx.moveTo(vx, by - hs * (1.05 + sr(i) * .1)); ctx.quadraticCurveTo(vx + hs * .05 * (i % 2 ? 1 : -1), by - hs * .5, vx, by - hs * (.1 + sr(i + 5) * .4)); ctx.stroke(); }
  ctx.fillStyle = "#2a5a20"; for (let i = 0; i < 24; i++) ctx.fillRect(400 + hs * (.52 + sr(i) * .4), by - hs * (.1 + sr(i + 9) * .95), hs * .035, hs * .025);
  ctx.fillStyle = "#c33"; ctx.beginPath(); ctx.ellipse(395, by - hs * 1.3, hs * .05, hs * .06, 0, 0, 7); ctx.fill();
  const lg = ctx.createRadialGradient(400 + hs * .2, by - hs * .35, 1, 400 + hs * .2, by - hs * .35, hs * .35); lg.addColorStop(0, "rgba(255,190,90,.55)"); lg.addColorStop(1, "rgba(255,190,90,0)"); ctx.fillStyle = lg; ctx.fillRect(400 - hs * .3, by - hs * .75, hs * .9, hs * .8);
  ctx.fillStyle = "#ffcf7a"; ctx.fillRect(400 + hs * .19, by - hs * .4, hs * .03, hs * .06);
  ctx.fillStyle = "#3a3a3e"; for (let i = 0; i < 4; i++) ctx.fillRect(400 - hs * (.3 + i * .03), by - hs * .04 + i * hs * .012, hs * (.6 + i * .06), hs * .012);
  ctx.fillStyle = "#120d09"; [-1, 1].forEach(sg => ctx.fillRect(400 + sg * hs * .86 - (sg < 0 ? hs * .08 : 0), by - hs * .78, hs * .08, hs * .34));
  ctx.fillStyle = "#050302"; ctx.fillRect(395, by - hs * 1.82, 2, hs * .22); ctx.fillRect(390, by - hs * 1.78, 12, 2);
  ctx.fillStyle = "rgba(225,225,235,.8)"; ctx.beginPath(); ctx.ellipse(400 + hs * .55, by - hs * .62, hs * .04, hs * .065, 0, 0, 7); ctx.fill(); ctx.fillStyle = "#000"; ctx.fillRect(400 + hs * .535, by - hs * .64, hs * .012, hs * .02); ctx.fillRect(400 + hs * .56, by - hs * .64, hs * .012, hs * .02);
}
function furn0(o) {
  const x = o.x, y = o.y, w = o.w, h = o.h, c = x + w / 2, k = o.n || o.t;
  if (k === "drawer" || k === "letter" || k === "empty") {
    ctx.fillStyle = "#4a3320"; ctx.fillRect(x + 3, y + 3, w - 6, h - 6); ctx.fillStyle = "#5c4028"; ctx.fillRect(x + 6, y + 6, w - 12, h - 12);
    ctx.fillStyle = "#c9a24a"; ctx.beginPath(); ctx.arc(c, y + h / 2, 4, 0, 7); ctx.fill();
    if (k === "empty") { ctx.fillStyle = "#14100c"; ctx.fillRect(x + 4, y + h - 10, w - 8, 10); }
    if (k === "letter") { ctx.fillStyle = "#e8dcc0"; ctx.fillRect(x + 12, y + 2, w - 24, 12); }
  } else if (k === "placard") {
    const op = o === hideObj && hideT > 0 ? Math.min(1, (24 - hideT) / 10) : 0;
    ctx.fillStyle = "#2a1a0e"; ctx.fillRect(x - 2, y - 6, w + 4, 8); ctx.fillStyle = "#3a2616"; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = "#050302"; ctx.fillRect(x + 4, y + 6, w / 2 - 6, h - 12);
    ctx.fillStyle = "#4a3320"; ctx.fillRect(x + 4, y + 6, (w / 2 - 6) * (1 - op * .7), h - 12); ctx.fillRect(c + 2, y + 6, w / 2 - 6, h - 12);
    ctx.fillStyle = "#c9a24a"; ctx.fillRect(c - 7, y + h / 2, 3, 10); ctx.fillRect(c + 4, y + h / 2, 3, 10);
  } else if (k === "lit") {
    const v = o.v || 0, bc = ["#2a4a7a", "#8a1e1e", "#4a5a2a"][v];
    ctx.fillStyle = "#2a1a0e"; ctx.fillRect(x, y, w, h); ctx.fillStyle = "#d8d0c0"; ctx.fillRect(x + 4, y + 6, w - 8, h - 12);
    ctx.fillStyle = bc; ctx.fillRect(x + 4, y + h * .35, w - 8, h * .55); ctx.fillStyle = "rgba(0,0,0,.25)"; for (let i = 0; i < 4; i++) ctx.fillRect(x + 8 + i * w / 5, y + h * .4, 2, h * .45);
    ctx.fillStyle = "#efe8dc"; ctx.fillRect(x + 8, y + 8, w * (v ? .3 : .22), h * .26); ctx.fillStyle = "#3a2616"; ctx.fillRect(x - 3, y - (v ? 10 : 4), 8, h + (v ? 10 : 4));
  } else if (k === "table") {
    ctx.fillStyle = "#5a3d22"; ctx.fillRect(x, y + 6, w, 14); ctx.fillStyle = "#3a2614"; ctx.fillRect(x + 6, y + 20, 8, h - 20); ctx.fillRect(x + w - 14, y + 20, 8, h - 20); ctx.fillStyle = "rgba(255,220,160,.12)"; ctx.fillRect(x, y + 6, w, 3);
  } else if (k === "caisse") {
    ctx.fillStyle = "#6a4a28"; ctx.fillRect(x, y, w, h); ctx.fillStyle = "rgba(0,0,0,.4)"; for (let i = 1; i < 4; i++) ctx.fillRect(x, y + i * h / 4, w, 2); ctx.fillRect(x + 4, y, 5, h); ctx.fillRect(x + w - 9, y, 5, h);
  } else if (k === "malle") {
    ctx.fillStyle = "#4a2e18"; ctx.fillRect(x, y, w, h); ctx.fillStyle = "#2a1a0e"; ctx.fillRect(x, y + h * .4, w, 4); ctx.fillStyle = "#8a7a50"; ctx.fillRect(x + 8, y, 6, h); ctx.fillRect(x + w - 14, y, 6, h); ctx.fillRect(c - 4, y + h * .35, 8, 10);
  } else if (k === "cab") {
    ctx.fillStyle = "#4a3320"; ctx.fillRect(x, y, w, h); for (let i = 0; i < 3; i++) { ctx.fillStyle = "#5c4028"; ctx.fillRect(x + 4, y + 4 + i * h / 3, w - 8, h / 3 - 5); ctx.fillStyle = "#c9a24a"; ctx.fillRect(c - 5, y + h / 6 + i * h / 3, 10, 3); }
  } else if (o.t === "stairs" || o.t === "up" || o.t === "down") {
    for (let i = 0; i < 6; i++) { ctx.fillStyle = "rgb(" + (70 + i * 14) + "," + (55 + i * 11) + "," + (40 + i * 8) + ")"; ctx.fillRect(x + i * w / 12, y + i * h / 6, w - i * w / 6, h / 6 - 1); }
  } else if (o.t === "door") {
    ctx.fillStyle = "#3a2414"; ctx.fillRect(x, y, w, h); ctx.fillStyle = "rgba(0,0,0,.4)"; for (let i = 1; i < 4; i++) ctx.fillRect(x + i * w / 4, y, 2, h); ctx.fillStyle = "#c9a24a"; ctx.beginPath(); ctx.arc(x + 10, y + h / 2, 8, 0, 7); ctx.fill(); ctx.fillStyle = "#222"; ctx.fillRect(x + 4, y + h / 2 - 3, 12, 6);
  } else if (o.t === "garage") {
    ctx.fillStyle = "#44464a"; ctx.fillRect(x, y, w, h); ctx.fillStyle = "rgba(0,0,0,.4)"; for (let i = 1; i < 6; i++) ctx.fillRect(x, y + i * h / 6, w, 2);
  } else if (o.t === "window") {
    ctx.fillStyle = "#0a1428"; ctx.fillRect(x, y, w, h); ctx.fillStyle = "#3a2a1a"; ctx.fillRect(x + w / 2 - 2, y, 4, h); ctx.fillRect(x, y + h / 2 - 2, w, 4); ctx.fillStyle = "rgba(160,190,255,.25)"; ctx.fillRect(x + 4, y + 4, w / 2 - 8, h / 2 - 8);
  } else if (o.t === "bench") {
    ctx.fillStyle = "#5a3d22"; ctx.fillRect(x, y, w, 16); ctx.fillStyle = "#3a2614"; ctx.fillRect(x + 8, y + 16, 8, h - 16); ctx.fillRect(x + w - 16, y + 16, 8, h - 16); ctx.fillStyle = "#777"; ctx.fillRect(x + 12, y - 8, 16, 10); ctx.fillStyle = "#c33"; ctx.fillRect(x + 60, y - 6, 10, 8); ctx.fillStyle = "#ddd"; ctx.fillRect(x + 90, y - 3, 22, 4);
  } else if (o.t === "key") {
    ctx.fillStyle = "#c9a24a"; ctx.beginPath(); ctx.arc(c - 6, y + h / 2, 7, 0, 7); ctx.fill(); ctx.fillRect(c, y + h / 2 - 2, 14, 4); ctx.fillRect(c + 9, y + h / 2, 3, 6);
  } else if (o.t === "glue") { ctx.fillStyle = "#3a2a1a"; ctx.fillRect(x, y, w, h); ctx.fillStyle = "rgba(0,0,0,.5)"; ctx.fillRect(x, y + h / 2, w, 2); }
}
function drawUnlock() {
  const u = ul, lift = Math.min(1, Math.max(0, (u - 80) / 40)), fall = Math.max(0, u - 120), op = Math.min(1, Math.max(0, (u - 150) / 90));
  ctx.fillStyle = "#1a120c"; ctx.fillRect(0, 0, W, H); ctx.fillStyle = "#0a0f1a"; ctx.fillRect(250, 60, 300, 400);
  if (op > 0) { ctx.strokeStyle = "rgba(180,200,230,.5)"; ctx.lineWidth = 1; for (let k = 0; k < 90; k++) { const x = 250 + sr(k) * 300, y = 60 + (sr(k + 9) * 400 + u * 22) % 400; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 3, y + 16); ctx.stroke(); } }
  const lw = 150 * (1 - op); ctx.fillStyle = "#3a2414"; ctx.fillRect(250, 60, lw, 400); ctx.fillRect(550 - lw, 60, lw, 400);
  ctx.fillStyle = "rgba(0,0,0,.35)"; for (let i = 1; i < 8; i++) { ctx.fillRect(250 + i * 38, 60, 2, 400); }
  ctx.fillStyle = "#555"; ctx.fillRect(250, 252, lw, 12); ctx.fillRect(550 - lw, 252, lw, 12);
  if (lift < 1 || fall < 100) { const ly = 262 + fall * fall * .04; ctx.save(); ctx.translate(400, ly); ctx.rotate(fall * .02); ctx.strokeStyle = "#999"; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, -14 - lift * 16, 14, Math.PI, 0); ctx.stroke(); ctx.fillStyle = "#c9a24a"; ctx.fillRect(-20, -14, 40, 34); ctx.fillStyle = "#222"; ctx.beginPath(); ctx.arc(0, 0, 4, 0, 7); ctx.fill(); ctx.restore(); }
  vign(400, 250, 180, 520, .75); txt(u < 80 ? "Tu glisses la clé recollée dans le cadenas..." : u < 150 ? "Le cadenas s’ouvre... et tombe." : "La porte s’ouvre sur la tempête.", W / 2, 478, 17);
}
function drawFlee() {
  const f = fl2, fl = f % 150 > 100 && f % 150 < 108;
  ctx.fillStyle = fl ? "#2a3550" : "#070a10"; ctx.fillRect(0, 0, W, H); road(false, f * .01); forest(f * .01, 36, 0); forest(f * .013, 22, 40);
  ctx.fillStyle = "#050505"; ctx.fillRect(385, 205, 4, 22); ctx.fillRect(411, 205, 4, 22); ctx.fillRect(385, 212, 30, 2);
  person(400, 480, 2, true, f * 1.2);
  ctx.strokeStyle = "rgba(180,200,230,.5)"; ctx.lineWidth = 1; for (let k = 0; k < 300; k++) { const x = (sr(k) * W + f * 5) % W, y = (sr(k + 99) * H + f * 30) % H; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 4, y + 20); ctx.stroke(); }
  vign(400, 300, 200, 520, .7); txt("Tu cours sous la pluie, loin du manoir... le portail est encore loin.", W / 2, 96, 16);
}
function goods(x, y, w, h, k) {
  const q = k % 5;
  if (q === 0) { ctx.fillStyle = "#e8c030"; ctx.fillRect(x, y, w, h); ctx.fillStyle = "#c22"; ctx.fillRect(x, y, w, h * .3); }
  else if (q === 1) { ctx.fillStyle = "#7ac0ea"; ctx.fillRect(x + w * .2, y + h * .2, w * .6, h * .8); ctx.fillStyle = "#246"; ctx.fillRect(x + w * .35, y, w * .3, h * .22); }
  else if (q === 2) { ["#e4a", "#4c6", "#fa3"].forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(x + i * w / 3, y + h * .5, w / 3 - 1, h * .5); }); }
  else if (q === 3) { ctx.fillStyle = "#f4dcc8"; ctx.beginPath(); ctx.arc(x + w / 2, y + h * .35, w * .35, 0, 7); ctx.fill(); ctx.fillStyle = "#c8903a"; ctx.beginPath(); ctx.moveTo(x + w * .2, y + h * .5); ctx.lineTo(x + w * .8, y + h * .5); ctx.lineTo(x + w / 2, y + h); ctx.fill(); }
  else { ctx.fillStyle = "#c8c8cc"; ctx.fillRect(x + w * .15, y, w * .7, h); ctx.fillStyle = "#b22"; ctx.fillRect(x + w * .15, y + h * .35, w * .7, h * .25); }
}
// ===== Timeline développeur (code 0210) et sortie de partie =====
const LET1 = ["Si tu lis ceci, tu es comme moi : livreur, piégé.", "Il m’a assommé sur le seuil. Je compte les jours.", "Je l’ai blessé à la jambe : il traîne le pied. Écoute-le.", "Cache-toi : placards, lits, sous les tables.", "Ne renverse rien. Lampes, bougies... il entend tout.", "La porte est cadenassée. La clé est dans la maison,", "peut-être au grenier. Fuis, et ne reviens jamais..."];
const LET2 = ["Je m’appelle Anselme. J’ai vécu ici un an,", "seul, avant la guerre des monstres.", "Je suis resté : cette forêt est maudite.", "Qui la traverse n’en revient pas.", "Si tu lis ceci, ils sont derrière toi.", "Prends ma lampe torche et cours vers", "le talus de feuilles.", "J’ai perdu mon chat, ce qui m’attriste", "énormément. Si tu le trouves,", "prends soin de lui."];
const F = lv => { phase2 = lv >= 2; kA = kB = glue = lv >= 3; glued = lv >= 4; stormSeen = lv >= 3; winSeen = lv >= 1; hasLetter = lv >= 1; hasKey = false; hid = false; invOpen = false; houseObjs = null; };
const lt = (lines, who, th, next) => { if (th) { L = { lines, t: 9999, k: 1 }; scene = "letter"; } else showLetter(lines, next, who); };
const SC = [
  ["Arrivée en moto", 0, th => { rt = th ? 700 : 0; ro = th ? 3 : 0; scene = "ride"; if (!th) { initAudio(); music("intro"); } }],
  ["Chemin du manoir", 0, th => { go("path"); P.y = th ? 300 : 450; }],
  ["Dans la maison : assommé", 0, th => { dr = th ? 560 : 0; scene = "drop"; }],
  ["Sous-sol : les tiroirs", 0, th => { go("cave"); }],
  ["Lettre du livreur", 0, (th) => lt(LET1, "young", th, () => go("cave"))],
  ["Manoir : rez-de-chaussée", 1, th => { go("house", 400, 300); }],
  ["Manoir : étage", 1, th => { go("upper", 400, 300); }],
  ["Grenier", 1, th => { go("attic", 400, 250); }],
  ["Fenêtre : Bigfoot", 1, th => { winT = th ? 560 : 0; scene = "win"; }],
  ["Poursuite en voiture", 1, th => { go("chase"); timer = th ? 500 : 0; rk = th ? [{ z: .5, x: .3 }, { z: .8, x: -.4 }] : []; }],
  ["Lettre d’Anselme", 1, th => lt(LET2, "old", th, () => { cz = 0; torch = false; go("cabin"); })],
  ["Cabane du vieux", 1, th => { go("cabin"); cz = th ? .75 : 0; torch = false; }],
  ["Forêt : la lampe", 1, th => { fo = 0; fw = 0; lg = []; lit = true; go("forest"); ph = th ? 1 : 0; fd = th ? 100 : 0; }],
  ["Forêt : course et rondins", 1, th => { fo = 0; fw = 0; lit = true; go("forest"); ph = 2; fd = th ? 420 : 0; lg = th ? [{ z: .5 }, { z: .8 }] : []; }],
  ["Le tas de feuilles", 1, th => { dv = th ? 100 : 0; scene = "dive"; }],
  ["Le chat", 1, th => { ct = th ? 300 : 0; scene = "cat"; }],
  ["Ramper vers la voiture", 1, th => { cw = th ? .5 : 0; scene = "crawl"; }],
  ["Voiture en feu", 1, th => { cr = th ? 400 : 0; scene = "car"; }],
  ["Course dans la forêt dense", 1, th => { go("run"); rn = th ? 400 : 0; }],
  ["Backrooms", 1, th => { bk = th ? 300 : 0; scene = "back"; }],
  ["Cachot : le vieux livreur", 1, th => { cli = th ? 1 : 0; cl = th ? 100 : 0; scene = "cell"; }],
  ["Cachot : le monstre", 1, th => { cli = 8; cl = th ? 280 : 0; scene = "cell"; }],
  ["Manoir saccagé", 2, th => { go("house", 400, 300); }],
  ["Orage à la fenêtre", 3, th => { winT = th ? 500 : 0; scene = "storm"; }],
  ["Établi du sous-sol", 3, th => { go("cave", 400, 300); }],
  ["Le cadenas", 4, th => { ul = th ? 190 : 0; scene = "unlock"; }],
  ["Fuite sous la pluie", 4, th => { fl2 = th ? 150 : 0; scene = "flee"; }],
  ["La flaque", 4, th => { pu = th ? 600 : 0; scene = "puddle"; }],
  ["Route : 1 h plus tard", 4, th => { rd = th ? 1400 : 0; scene = "road2d"; }],
  ["Station : dehors", 4, th => { sn = th ? 100 : 0; scene = "station"; }],
  ["Station : dedans", 4, th => { sn = th ? 560 : 360; scene = "station"; }],
  ["À suivre...", 4, th => { endTxt = "À suivre..."; scene = "end"; }],
  ["Chapitre 2 : titre et champs", 0, th => { c2 = th ? 400 : 0; scene = "ch2"; }],
  ["Chapitre 2 : la maison de Jim", 0, th => { c2 = th ? 1350 : 800; scene = "ch2"; }],
  ["Flashback : le tourbillon", 0, th => { vt = th ? 150 : 0; scene = "vortex"; }],
  ["Piscine : exploration", 0, th => { rpool(); scene = "pool"; if (!th) music("pool"); }],
  ["Piscine : l’ombre à la vitre", 0, th => { rpool(); pst = 1; pt = th ? 150 : 0; murk = th ? .6 : 0; scene = "pool"; }],
  ["Piscine : le placard", 0, th => { rpool(); pst = 3; pt = th ? 420 : 0; plx = -9.3; plz = 5; ply = 1.08; scene = "pool"; }],
  ["Piscine : 20 h 20", 0, th => { rpool(); pst = 4; pt = th ? 150 : 0; scene = "pool"; }]
];
const NAMES = "scene,M,objs,hid,houseObjs,mus,bpm,beat,cut,L,rt,ro,dr,winT,ct,cr,cw,ex,pu,rd,sn,bk,cl,cli,rn,dv,ul,fl2,ph,fd,fo,fw,cz,jt,lg,tr,rk,gap,timer,hist,rx,hits,rn8,lit,torch,drawers,hasLetter,hasKey,phase2,kA,kB,glue,glued,stormSeen,winSeen,endTxt,hideT,hideObj,invOpen,near,last,rats,ghost,crowDone".split(",");
function openTimeline() {
  const snap = { P: Object.assign({}, P) }; NAMES.forEach(n => { snap[n] = eval(n); });
  const grid = $("tlgrid"); grid.innerHTML = "";
  SC.forEach((a, i) => {
    try { F(a[1]); a[2](true); draw(); } catch (e) {}
    const c = document.createElement("canvas"); c.width = 200; c.height = 125; c.getContext("2d").drawImage(cv, 0, 0, 200, 125);
    const d = document.createElement("div"); d.className = "card"; d.appendChild(c); const lab = document.createElement("div"); lab.textContent = (i + 1) + ". " + a[0]; d.appendChild(lab); d.onclick = () => jumpTo(i); grid.appendChild(d);
  });
  NAMES.forEach(n => { eval(n + " = snap[n]"); }); Object.assign(P, snap.P); engine(false); msg.style.opacity = 0;
  $("timeline").classList.remove("hidden");
}
function jumpTo(i) {
  $("timeline").classList.add("hidden"); $("options").classList.add("hidden"); $("menu").classList.add("hidden"); setPause(false);
  initAudio(); engine(false); stopSpeak(); F(SC[i][1]); SC[i][2](false); hid = false;
  if (!mus || mus === "menu") music("intro"); say("Timeline : " + SC[i][0], 2.5);
}
$("tl").onclick = () => { if ($("code").value === "0210") { $("code").value = ""; openTimeline(); } else say("Code incorrect.", 2); };
$("code").onkeydown = e => { e.stopPropagation(); if (e.key === "Enter") $("tl").click(); };
$("tlclose").onclick = () => $("timeline").classList.add("hidden");
$("quit").onclick = () => { $("options").classList.add("hidden"); setPause(false); stopSpeak(); engine(false); rainOff(); toMenu(); };
function drawRats() {
  rats.forEach(r => { const d = r.v > 0 ? 1 : -1, x = r.x, y = r.y;
    ctx.fillStyle = "#3a3632"; ctx.beginPath(); ctx.ellipse(x, y, 9, 4, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(x + d * 9, y - 1, 4, 3, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = "#5a4a48"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x - d * 9, y); ctx.quadraticCurveTo(x - d * 16, y - 4 + Math.sin(t * .3) * 3, x - d * 22, y + 2); ctx.stroke();
    ctx.fillStyle = "#f33"; ctx.fillRect(x + d * 11, y - 3, 1.5, 1.5); ctx.fillStyle = "#2a2624"; ctx.fillRect(x - 3 + Math.sin(t * .6 + x) * 2, y + 3, 2, 3); ctx.fillRect(x + 3 - Math.sin(t * .6 + x) * 2, y + 3, 2, 3); });
}
function drawGhost() {
  if (!ghost) return; const g = ghost, w = Math.sin(t * .1) * 4; ctx.globalAlpha = .22 + Math.sin(t * .05) * .06; ctx.fillStyle = "#cfe0ff";
  ctx.beginPath(); ctx.arc(g.x, g.y, 18, 0, 7); ctx.fill(); ctx.beginPath(); ctx.moveTo(g.x - 20, g.y); for (let k = 0; k <= 4; k++) ctx.lineTo(g.x - 20 + k * 10, g.y + 70 + (k % 2) * 12 + w); ctx.lineTo(g.x + 20, g.y); ctx.fill();
  ctx.fillStyle = "#000"; ctx.fillRect(g.x - 8, g.y - 4, 5, 8); ctx.fillRect(g.x + 3, g.y - 4, 5, 8); ctx.globalAlpha = 1;
}
function spooky() {
  ctx.lineWidth = 1;
  [[0, 0, 1, 1]].forEach((a, i) => {
    ctx.strokeStyle = "rgba(210,210,210,.28)";
    for (let k = 0; k < 5; k++) { const an = k * .39 + .1; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(a[0] + a[2] * Math.cos(an) * 90, a[1] + a[3] * Math.sin(an) * 90); ctx.stroke(); }
    for (let r = 25; r <= 85; r += 20) { ctx.beginPath(); for (let k = 0; k < 5; k++) { const an = k * .39 + .1, x = a[0] + a[2] * Math.cos(an) * r, y = a[1] + a[3] * Math.sin(an) * r; k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); }
    if (i < 2) {
      const sx = a[0] + a[2] * 50, sy = 30 + (Math.sin(t * .03 + i * 2) + 1) * 28; ctx.beginPath(); ctx.moveTo(sx, 8); ctx.lineTo(sx, sy); ctx.stroke();
      ctx.fillStyle = "#1a1412"; ctx.strokeStyle = "#1a1412"; ctx.beginPath(); ctx.arc(sx, sy + 6, 6, 0, 7); ctx.fill();
      for (let l = 0; l < 4; l++) { const lf = Math.sin(t * .2 + l) * 2; ctx.beginPath(); ctx.moveTo(sx - 4, sy + 4 + l * 2); ctx.lineTo(sx - 11, sy + 8 + l * 2 + lf); ctx.moveTo(sx + 4, sy + 4 + l * 2); ctx.lineTo(sx + 11, sy + 8 + l * 2 - lf); ctx.stroke(); }
      ctx.fillStyle = "#fff"; ctx.fillRect(sx - 3, sy + 4, 2, 2); ctx.fillRect(sx + 1, sy + 4, 2, 2);
    }
  });
  ctx.fillStyle = "rgba(0,0,0," + (.06 + (Math.random() < .02 ? .3 : 0)) + ")"; ctx.fillRect(0, 0, W, H);
}
function drawScreamer() {
  const sh = scr < 20 ? 14 : 5; ctx.save(); ctx.translate((Math.random() - .5) * sh, (Math.random() - .5) * sh);
  ctx.fillStyle = scr < 6 ? "#fff" : "#140000"; ctx.fillRect(-20, -20, W + 40, H + 40);
  ctx.fillStyle = "#07070b"; [-1, 1].forEach(sg => { ctx.beginPath(); ctx.moveTo(400 + sg * 120, 250); for (let k = 0; k < 6; k++) { ctx.lineTo(400 + sg * (260 + k * 24), 60 + k * 70); ctx.lineTo(400 + sg * (230 + k * 24), 100 + k * 70); } ctx.lineTo(400 + sg * 120, 420); ctx.fill(); });
  const g = ctx.createRadialGradient(360, 200, 10, 400, 270, 230); g.addColorStop(0, "#2a3548"); g.addColorStop(1, "#050508"); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(400, 270, 150, 190, 0, 0, 7); ctx.fill();
  ctx.fillStyle = "#050505"; for (let k = 0; k < 16; k++) { const a = k * .39; ctx.beginPath(); ctx.moveTo(400 + Math.cos(a) * 140, 270 + Math.sin(a) * 180); ctx.lineTo(400 + Math.cos(a) * 190, 270 + Math.sin(a) * 235); ctx.lineTo(400 + Math.cos(a + .25) * 140, 270 + Math.sin(a + .25) * 180); ctx.fill(); }
  ctx.fillStyle = "#0b0b0f"; ctx.beginPath(); ctx.moveTo(335, 245); ctx.lineTo(465, 245); ctx.lineTo(400, 410); ctx.fill();
  ctx.fillStyle = "#6a1010"; ctx.beginPath(); ctx.moveTo(350, 330); ctx.lineTo(450, 330); ctx.lineTo(400, 395); ctx.fill(); ctx.fillStyle = "#2a2a30"; ctx.beginPath(); ctx.moveTo(335, 245); ctx.lineTo(465, 245); ctx.lineTo(400, 340); ctx.fill();
  ctx.fillStyle = "#555a66"; ctx.fillRect(398, 250, 4, 70); ctx.fillStyle = "#000"; ctx.fillRect(380, 262, 8, 3); ctx.fillRect(412, 262, 8, 3);
  [300, 500].forEach(x => { ctx.fillStyle = "#d8c8a0"; ctx.beginPath(); ctx.arc(x, 210, 26, 0, 7); ctx.fill(); ctx.fillStyle = "#000"; ctx.beginPath(); ctx.arc(x, 212, 14, 0, 7); ctx.fill(); ctx.fillStyle = "#fff"; ctx.fillRect(x - 6, 205, 5, 5); });
  ctx.restore();
}
cv.addEventListener("click", e => {
  if (scene !== "cabin" || paused) return; const r = cv.getBoundingClientRect(), k = 1 + cz * .5, x = 400 + ((e.clientX - r.left) * W / r.width - 400) / k, y = 250 + ((e.clientY - r.top) * H / r.height - 250) / k;
  if (x > 285 && x < 375 && y > 300 && y < 345) showLetter(LET2, () => { scene = "cabin"; letterRead = true; }, "old");
  else if (x > 300 && x < 450 && y > 50 && y < 240) say("Portrait : Anselme Ferrand, le vieil homme de la forêt.", 4);
  else if (x > 70 && x < 200 && y > 110 && y < 340) { if (!crowDone) { crowDone = true; scr = 0; scene = "screamer"; } else say("Le placard est vide, il ne reste que des plumes.", 3); }
});
function walker(x, y, tm) {
  const sw = Math.sin(tm * .12) * 10; ctx.save(); legs = false; monster(x, y, false); legs = true; ctx.restore();
  ctx.lineCap = "round"; ctx.lineWidth = 8; ctx.strokeStyle = "#0a0a0a";
  ctx.beginPath(); ctx.moveTo(x - 7, y + 30); ctx.lineTo(x - 7 + sw, y + 58); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + 7, y + 30); ctx.lineTo(x + 7 - sw * .3 - 4, y + 55); ctx.stroke(); ctx.lineCap = "butt";
  ctx.fillStyle = "#050505"; ctx.fillRect(x - 12 + sw, y + 56, 12, 6); ctx.fillRect(x - 12 - sw * .3, y + 55, 14, 6);
  ctx.fillStyle = "#e8e0d0"; ctx.fillRect(x + 1 - sw * .15, y + 38, 12, 5); ctx.fillStyle = "#8a1010"; ctx.fillRect(x + 5 - sw * .15, y + 38, 3, 14);
}
function allee(off) {
  for (let r = 0; r < 18; r++) { const d = Math.pow((r / 18 + off) % 1, 2), y = 230 + d * 270; for (let c = 0; c < 5; c++) { const x = 400 + (c - 2) * (d * 110 + 2), w = 4 + d * 34; ctx.fillStyle = (r + c) % 2 ? "#4a4944" : "#3a3a38"; ctx.beginPath(); ctx.ellipse(x, y, w, 1.5 + d * 9, 0, 0, 7); ctx.fill(); } }
}
function bats(lb) {
  ctx.fillStyle = "#000";
  for (let k = 0; k < 3; k++) { const x = 400 + (k - 1) * 40 + lb * (k - 1) * 3.2, y = 250 - lb * (1.5 + k * .4) - 60, f = Math.sin(lb * .8 + k * 2) * 10;
    ctx.beginPath(); ctx.ellipse(x, y, 4, 6, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x - 14, y - 10 - f, x - 26, y + 2 + f * .4); ctx.quadraticCurveTo(x - 14, y + 2, x, y + 6); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 14, y - 10 - f, x + 26, y + 2 + f * .4); ctx.quadraticCurveTo(x + 14, y + 2, x, y + 6); ctx.fill(); }
}
const ch1 = () => { try { return localStorage.getItem("ch1") === "1"; } catch (e) { return false; } };
function valChap1() { try { localStorage.setItem("ch1", "1"); } catch (e) {} say("Chapitre 1 validé !", 5); }
function startChapter2() { F(0); hasLetter = false; $("menu").classList.add("hidden"); $("chapters").classList.add("hidden"); initAudio(); engine(false); stopSpeak(); c2 = 0; scene = "ch2"; music("ch2"); }
MUS.ch2 = { n: [262, 330, 392, 330, 294, 349, 440, 349], type: "sine", bpm: 64, v: .12, d: 1.2 };
MUS.vortex = { n: [392, 494, 587, 784, 587, 494], type: "sine", bpm: 80, v: .1, d: 1.6 };
MUS.pool = { n: [131, 0, 0, 196, 0, 0, 175, 0], type: "sine", bpm: 48, v: .07, d: 2 };
const whistle = () => { for (let i = 0; i < 6; i++) setTimeout(() => tone(2600 + Math.random() * 300, .06, "sine", .1), i * 70); };
const heart = () => { tone(50, .12, "sine", .5, -10); setTimeout(() => tone(46, .12, "sine", .4, -10), 150); };
let CH = 1.35; const FOC = 420;
function rpool() { plx = 0; plz = 3; ply = 0; pst = 0; pt = 0; lgx = 8.3; lgz = 27; murk = 0; lgR = null; CH = 1.35; lkW = 0; lky = 440; lgS = 0; lkS = 0; tk = 0; lkx = 60; lkMx = 900; dark = 0; lkKey = false; }
function poly(P3, col, al = 1) {
  const q = P3.map(p => { const dx = p[0] - plx, dz = p[2] - plz; return [dx * Math.cos(ply) - dz * Math.sin(ply), p[1] - CH, dx * Math.sin(ply) + dz * Math.cos(ply)]; }), o = [];
  for (let i = 0; i < q.length; i++) { const a = q[i], b = q[(i + 1) % q.length], ai = a[2] > .2, bi = b[2] > .2; if (ai) o.push(a); if (ai !== bi) { const k = (.2 - a[2]) / (b[2] - a[2]); o.push([a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, .2]); } }
  if (o.length < 3) return; ctx.globalAlpha = al; ctx.fillStyle = col; ctx.beginPath(); o.forEach((p, i) => { const x = 400 + p[0] * FOC / p[2], y = 250 - p[1] * FOC / p[2]; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.fill(); ctx.globalAlpha = 1;
}
function bb(x, z, h) { const dx = x - plx, dz = z - plz, c = dx * Math.cos(ply) - dz * Math.sin(ply), d = dx * Math.sin(ply) + dz * Math.cos(ply); if (d < .5) return null; return { x: 400 + c * FOC / d, y: 250 + CH * FOC / d, s: h * FOC / d / 72 }; }
function draw3D() {
  ctx.fillStyle = "#0b1218"; ctx.fillRect(0, 0, W, H);
  poly([[-10, 6, 0], [10, 6, 0], [10, 6, 32], [-10, 6, 32]], "#1a2630");
  for (let i = 0; i < 10; i++) for (let j = 0; j < 16; j++) { const x = -10 + i * 2, z = j * 2; poly([[x, 0, z], [x + 2, 0, z], [x + 2, 0, z + 2], [x, 0, z + 2]], (i + j) % 2 ? "#8fa0a8" : "#7d8e96"); }
  const wc = "rgb(" + (58 - murk * 20 | 0) + "," + (167 - murk * 100 | 0) + "," + (196 - murk * 130 | 0) + ")";
  poly([[-6, -.3, 6], [6, -.3, 6], [6, -.3, 24], [-6, -.3, 24]], wc);
  for (let k = 0; k < 9; k++) { const zz = 7 + ((k * 2 + t * .03) % 17); poly([[-6, -.29, zz], [6, -.29, zz], [6, -.29, zz + .12], [-6, -.29, zz + .12]], "#ffffff", .15); }
  [-3, 0, 3].forEach(x => poly([[x - .08, -.28, 6], [x + .08, -.28, 6], [x + .08, -.28, 24], [x - .08, -.28, 24]], "#1a3a6a"));
  for (let k = 0; k < 18; k++) { const z = 6 + k, a = k % 2 ? "#d8d0b8" : "#c4baa0"; poly([[-6.7, .08, z], [-6, .08, z], [-6, .08, z + 1], [-6.7, .08, z + 1]], a); poly([[6, .08, z], [6.7, .08, z], [6.7, .08, z + 1], [6, .08, z + 1]], a); poly([[-6, 0, z], [-6, .08, z], [-6, .08, z + 1], [-6, 0, z + 1]], "#6a6454"); }
  for (let k = 0; k < 12; k++) { const x = -6.7 + k, a = k % 2 ? "#d8d0b8" : "#c4baa0"; poly([[x, .08, 5.3], [x + 1, .08, 5.3], [x + 1, .08, 6], [x, .08, 6]], a); poly([[x, .08, 24], [x + 1, .08, 24], [x + 1, .08, 24.7], [x, .08, 24.7]], a); }
  poolDetail(); [[-4, 8], [4, 8], [-4, 16], [4, 16], [-4, 24], [4, 24]].forEach(a => { const pb = bb(a[0], a[1], 0); if (pb) { ctx.fillStyle = "rgba(255,255,255,.16)"; ctx.beginPath(); ctx.ellipse(pb.x, pb.y, 60 * pb.s, 7 * pb.s, 0, 0, 7); ctx.fill(); } poly([[a[0] - .6, 5.95, a[1] - 1], [a[0] + .6, 5.95, a[1] - 1], [a[0] + .6, 5.95, a[1] + 1], [a[0] - .6, 5.95, a[1] + 1]], Math.random() < .02 ? "#667" : "#e8f4ff"); });
  poly([[-10, 0, 32], [10, 0, 32], [10, 2.2, 32], [-10, 2.2, 32]], "#c6d4da"); poly([[-10, 2.2, 32], [10, 2.2, 32], [10, 6, 32], [-10, 6, 32]], "#6f8c98");
  poly([[-10, 0, 0], [-10, 0, 32], [-10, 2.2, 32], [-10, 2.2, 0]], "#b6c4ca"); poly([[-10, 2.2, 0], [-10, 2.2, 32], [-10, 6, 32], [-10, 6, 0]], "#5f7c88");
  poly([[10, 0, 0], [10, 0, 32], [10, 2.2, 32], [10, 2.2, 0]], "#b6c4ca"); poly([[10, 2.2, 0], [10, 2.2, 32], [10, 6, 32], [10, 6, 0]], "#5f7c88");
  poly([[-3.2, 3.2, 31.9], [3.2, 3.2, 31.9], [3.2, 5.2, 31.9], [-3.2, 5.2, 31.9]], "#222a2a"); poly([[-3, 3.4, 31.8], [3, 3.4, 31.8], [3, 5, 31.8], [-3, 5, 31.8]], "#0e2a2a");
  if (pst >= 1) { poly([[-.5, 3.4, 31.7], [.5, 3.4, 31.7], [.45, 4.3, 31.7], [.3, 4.5, 31.7], [-.3, 4.5, 31.7], [-.45, 4.3, 31.7]], "#000"); poly([[-.3, 4.2, 31.6], [-.12, 4.2, 31.6], [-.12, 4.26, 31.6], [-.3, 4.26, 31.6]], "#fff"); poly([[.12, 4.2, 31.6], [.3, 4.2, 31.6], [.3, 4.26, 31.6], [.12, 4.26, 31.6]], "#fff"); }
  [10, 16, 22].forEach(z => { poly([[-9.95, 0, z], [-9.95, 0, z + 1.4], [-9.95, 2.3, z + 1.4], [-9.95, 2.3, z]], "#2a4a3a"); poly([[-9.9, 1, z + 1.1], [-9.9, 1, z + 1.25], [-9.9, 1.15, z + 1.25], [-9.9, 1.15, z + 1.1]], "#c9a24a"); });
  poly([[9.95, 0, 12], [9.95, 0, 13.4], [9.95, 2.3, 13.4], [9.95, 2.3, 12]], "#050a0c"); const od = pst === 3 ? Math.min(1, Math.max(0, (pt - 100) / 40)) : (lgS === 2 ? .9 : 0), ha = od * 1.5, hx = 10 - 1.4 * Math.sin(ha), hz = 12 + 1.4 * Math.cos(ha);
  poly([[10, 0, 12], [hx, 0, hz], [hx, 2.3, hz], [10, 2.3, 12]], "#2a4a3a");
  poly([[-9.95, 0, 4], [-9.95, 0, 5.4], [-9.95, 2.2, 5.4], [-9.95, 2.2, 4]], "#3a5a4a"); for (let k = 0; k < 4; k++) poly([[-9.9, 1.4 + k * .15, 4.2], [-9.9, 1.4 + k * .15, 5.2], [-9.9, 1.46 + k * .15, 5.2], [-9.9, 1.46 + k * .15, 4.2]], "#0a1410");
  const cd = bb(0, 31.9, 1); if (cd) { const w = 2.4 * FOC / (31.9 - plz) * .35, cy = 250 - (4.7 - CH) * FOC / (31.9 - plz); ctx.fillStyle = "#050505"; ctx.fillRect(cd.x - w, cy - w * .36, w * 2, w * .72); clkPos = [cd.x, cy, w * 1.7]; led(pst >= 5 ? "00:00" : "20:00", cd.x, cy, w * 1.7); }
  if (pst === 3 && pt > 130) { const mp = manPath((pt - 140) * .1), b = bb(mp[0], mp[1], 2.9); if (b) bigMan(b.x, b.y, b.s, (pt > 150 && pt < 240) || (pt > 400 && pt < 520)); }
  wallDetail(); lgR = null; if (pst < 3 && lgS < 3) { const b = bb(lgx, lgz, 1.8); if (b) { lifeg(b.x, b.y, b.s); lgR = { x: b.x - 15 * b.s, y: b.y - 75 * b.s, w: 30 * b.s, h: 75 * b.s }; } }
  if (dark) darkPool(); ctx.fillStyle = "rgba(30,50,30," + murk * .3 + ")"; ctx.fillRect(0, 0, W, H); vign(400, 250, 160, 520, .7);
}
function drawPool0() {
  if (pst === 6) return drawLockers();
  if (pst === 4) return drawLapse();
  if (pst === 3) { ctx.save(); ctx.beginPath(); ctx.rect(370, 60, 60, 380); ctx.clip(); draw3D(); ctx.restore(); ctx.fillStyle = "#020202"; ctx.fillRect(0, 0, 370, H); ctx.fillRect(430, 0, 370, H); ctx.fillRect(370, 0, 60, 60); ctx.fillRect(370, 440, 60, 60); if (pt > 420 && pt < 450) { ctx.fillStyle = "rgba(255,255,255,.5)"; ctx.fillRect(0, 0, W, H); } txt("Tu retiens ton souffle dans le placard...", W / 2, 470, 16, "#aaa"); return; }
  if (pst === 4) { const a = Math.min(1, pt / 120); ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = a; ctx.fillStyle = "#1a0505"; ctx.fillRect(220, 170, 360, 160); led("20:20", 400, 250, 340); ctx.globalAlpha = 1; return; }
  draw3D();
}
function updPool() {
  pt++; const inW = Math.abs(plx) < 6 && plz > 6 && plz < 24; CH += ((inW ? .95 : 1.35) - CH) * .15;
  if (pst === 0 || pst === 1 || pst === 2 || pst === 5) {
    if (keys.ArrowLeft) ply -= .035; if (keys.ArrowRight) ply += .035;
    const sp = (inW ? .045 : .075) * (keys.ArrowUp ? 1 : keys.ArrowDown ? -1 : 0);
    plx = Math.max(-9.4, Math.min(9.4, plx + Math.sin(ply) * sp)); plz = Math.max(.6, Math.min(31, plz + Math.cos(ply) * sp));
    if (sp && pt % 20 === 0) { if (inW) noise(.2, .25, 700); else { tone(120, .05, "square", .04); noiseBP(.05, .12, 3000, 2); } }
  }
  if (pt === 40 && pst === 0) { whistle(); say("Maître-nageur : C’est la fin de la journée ! Il n’y a plus personne !", 5); }
  if (pst === 0) {
    lifeUpd();
    if (inW && lgS >= 3) { pst = 1; pt = 0; music("cell"); }
    if (act) { const nd = [10, 16, 22].find(z => Math.abs(plz - (z + .7)) < 1.6); if (Math.abs(plx) > 7.6 && nd !== undefined) say("Cette porte est fermée à clé.", 3); else if (Math.hypot(plx + 9, plz - 5) < 2.6) say("Un placard... pas maintenant.", 3); }
  } else if (pst === 1) {
    murk = Math.min(1, pt / 200); if (pt === 30) tone(70, 2, "sawtooth", .15, -20); if (pt === 120) say("Une ombre t’observe derrière la vitre teintée...", 4); if (pt > 280) pst = 2;
  } else if (pst === 2) {
    if (act) { if (inW) { plz = 5; say("Tu sors de l’eau.", 2); } else if (Math.hypot(plx + 9, plz - 5) < 2.6) { pst = 3; pt = 0; plx = -9.3; plz = 5; ply = 1.08; doorSnd(); } }
    if (pt === 10) { say("L’homme arrive ! Sors de l’eau (Z), puis cours te cacher dans le placard, à gauche !", 8); tone(220, .5, "sawtooth", .1, -80); } if (pt % 36 === 0) heart();
  } else if (pst === 3) {
    if (pt === 100) doorSnd(); if (pt === 160 || pt === 420) alien(); const iv = Math.max(14, 60 - pt * .08 | 0); if (pt % iv === 0) heart(); if (pt > 140 && pt % 40 === 0) leafSnd(.3, (pt / 40) % 2 | 0);
    if (pt === 420) { scream(); noise(.6, 1, 2500); } if (pt > 620) { pst = 4; pt = 0; }
  } else if (pst === 4) {
    if (pt === 1) music(null); if (pt % 40 === 0 && pt < 300) tone(900, .05, "square", .04);
    if (pt === 300) for (let i = 0; i < 12; i++) setTimeout(() => { bell(); tone(70, 1.2, "sine", .15); }, i * 750);
    if (pt > 860) { pst = 5; pt = 0; plx = -8.6; plz = 5.6; ply = .5; dark = 1; music("cell"); }
  } else if (pst === 5) {
    if (pt === 40) say("Minuit. Les lumières sont éteintes... Il faut sortir. Une seule porte semble encore ouverte.", 6); if (pt % 110 === 0) heart();
    if (act) { const nd = [10, 16, 22].find(z => Math.abs(plz - (z + .7)) < 1.6); if (Math.abs(plx) > 7.6 && nd === 16) { pst = 6; pt = 0; lkS = 0; tk = 0; lkx = 60; doorSnd(); music("cell"); } else if (Math.abs(plx) > 7.6 && nd !== undefined) say("Verrouillée.", 2); else if (Math.abs(plx) > 9 && Math.abs(plz - 12.7) < 1.5) say("Cette porte est condamnée.", 2); }
  } else if (pst === 6) lockerUpd2();
}
cv.addEventListener("click", e => {
  if (scene !== "pool" || paused || !lgR) return; const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) * W / r.width, y = (e.clientY - r.top) * H / r.height;
  if (x > lgR.x && x < lgR.x + lgR.w && y > lgR.y && y < lgR.y + lgR.h) { say("Maître-nageur : Il est tard, tu devrais rentrer chez toi Jim.", 3.5); speak("Il est tard, tu devrais rentrer chez toi Jim.", "young", 1); }
});
function drawVortex() {
  const v = vt; ctx.fillStyle = "#001030"; ctx.fillRect(0, 0, W, H);
  for (let arm = 0; arm < 5; arm++) { ctx.strokeStyle = arm % 2 ? "rgba(255,255,255,.55)" : "rgba(60,140,255,.65)"; ctx.lineWidth = 16 - arm * 2; ctx.beginPath(); for (let r = 6; r < 520; r += 6) { const a = arm * 1.256 + r * .018 - v * .07, x = 400 + Math.cos(a) * r, y = 250 + Math.sin(a) * r * .75; r === 6 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke(); }
  for (let k = 0; k < 90; k++) { const a = k * .35 + v * .04, r = (k * 6 + v * 3) % 560; ctx.fillStyle = "rgba(" + (120 + k % 4 * 40) + "," + (180 + k % 3 * 25) + ",255," + (.55 - r / 1200) + ")"; ctx.beginPath(); ctx.arc(400 + Math.cos(a + r * .01) * r * 1.2, 250 + Math.sin(a + r * .01) * r * .9, 3 + r * .03, 0, 7); ctx.fill(); }
  const g = ctx.createRadialGradient(400, 250, 10, 400, 250, 200 + v); g.addColorStop(0, "rgba(255,255,255,.95)"); g.addColorStop(1, "rgba(0,60,200,0)"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  if (v > 250) { ctx.fillStyle = "rgba(255,255,255," + Math.min(1, (v - 250) / 80) + ")"; ctx.fillRect(0, 0, W, H); }
  txt(v < 250 ? vtTxt : "", W / 2, 70, 17, "#cfe");
}
const bark = () => { tone(420, .1, "square", .12, -200); setTimeout(() => tone(380, .12, "square", .12, -180), 180); };
function refreshChapters() { const ok = ch1(); $("c2").disabled = !ok; $("c2").textContent = ok ? "Chapitre 2 — Jim le serveur de pizza" : "🔒 Chapitre 2 — verrouillé (finis le 1)"; $("c3").disabled = true; }
$("chap").onclick = () => { $("menu").classList.add("hidden"); $("chapters").classList.remove("hidden"); refreshChapters(); };
$("cback").onclick = () => { $("chapters").classList.add("hidden"); $("menu").classList.remove("hidden"); };
$("c1").onclick = () => { $("chapters").classList.add("hidden"); newGame(); };
$("c2").onclick = startChapter2;
function oldFloor0() {
  for (let y = 40, r = 0; y < H; y += 36, r++) {
    for (let x = -((r * 97) % 140); x < W; x += 140) { ctx.fillStyle = ["#3a2a1a", "#2e2014", "#43301c", "#26190f"][(r * 3 + ((x / 140) | 0) + 8) % 4]; ctx.fillRect(x, y, 139, 35); ctx.fillStyle = "rgba(0,0,0,.45)"; ctx.fillRect(x + 139, y, 2, 35); ctx.fillStyle = "#14100a"; ctx.fillRect(x + 6, y + 6, 2, 2); ctx.fillRect(x + 130, y + 28, 2, 2); }
    ctx.fillStyle = "rgba(0,0,0,.5)"; ctx.fillRect(0, y + 35, W, 2);
  }
  ctx.fillStyle = "rgba(10,8,5,.6)"; [[120, 300, 60, 26], [560, 140, 40, 22], [650, 420, 70, 24]].forEach(a => ctx.fillRect(a[0], a[1], a[2], a[3]));
  ctx.strokeStyle = "rgba(0,0,0,.5)"; ctx.lineWidth = 1; for (let k = 0; k < 10; k++) { const x = sr(k) * W, y = 60 + sr(k + 3) * 400; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 30, y + 8); ctx.stroke(); }
  for (let i = 0; i < 32; i++) { ctx.fillStyle = ["#14100a", "#0c0806", "#18110a", "#080503"][i % 4]; ctx.fillRect(i * 25, 0, 26, 38); }
  ctx.fillStyle = "#100b07"; ctx.fillRect(0, 0, 14, H); ctx.fillRect(W - 14, 0, 14, H); ctx.fillStyle = "#050302"; ctx.fillRect(0, 36, W, 5); ctx.fillRect(150, 8, 3, 28); ctx.fillRect(520, 4, 3, 32);
  ctx.strokeStyle = "rgba(0,0,0,.2)"; for (let k = 0; k < 70; k++) { const x = sr(k) * W, y = 44 + sr(k + 90) * 450; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 18 + sr(k + 5) * 30, y + 1); ctx.stroke(); }
  ctx.fillStyle = "rgba(0,0,0,.5)"; for (let k = 0; k < 8; k++) { ctx.beginPath(); ctx.ellipse(40 + sr(k + 200) * 720, 60 + sr(k + 210) * 420, 5, 3, 0, 0, 7); ctx.fill(); }
  stain(300, 250, 16, 11); stain(640, 390, 13, 12); ctx.strokeStyle = "rgba(80,8,6,.5)"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(300, 270); ctx.lineTo(380, 330); ctx.lineTo(470, 345); ctx.stroke();
  ctx.fillStyle = "rgba(110,10,8,.6)"; for (let k = 0; k < 4; k++) ctx.fillRect(80 + k * 180, 38, 3, 10 + sr(k + 300) * 26);
}
function drawWasted() {
  const w = ws, sd = P.x < 400 ? -1 : 1; ctx.fillStyle = "#04070a"; ctx.fillRect(0, 0, W, H); road(false); forest(.3, 24, 0);
  ctx.fillStyle = "#050a06"; ctx.fillRect(400 + sd * 170 - 20, 120, 40, 330);
  const cx = 400 + sd * Math.min(150, w * 6); ctx.fillStyle = "#7a1a1a"; ctx.fillRect(cx - 30, 300, 60, 34); ctx.fillRect(cx - 24, 276, 48, 26);
  if (w > 25) for (let k = 0; k < 8; k++) { ctx.fillStyle = "rgba(255," + (80 + k * 20) + ",20," + Math.max(0, .9 - (w - 25) / 140) + ")"; ctx.beginPath(); ctx.arc(cx + Math.sin(k * 2 + w * .2) * 30, 320 - (w - 25) * (.6 + k * .08), 20 + (w - 25) * .5 + k * 4, 0, 7); ctx.fill(); }
  if (w >= 25 && w < 32) { ctx.fillStyle = "rgba(255,255,255,.8)"; ctx.fillRect(0, 0, W, H); }
  if (w > 95) { const a = Math.min(1, (w - 95) / 40); ctx.fillStyle = "rgba(40,40,40," + .6 * a + ")"; ctx.fillRect(0, 0, W, H); ctx.save(); ctx.globalAlpha = a; ctx.font = "bold 100px Impact, 'Arial Black', sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "#000"; ctx.fillRect(0, 0, 0, 0); ctx.fillText("WASTED", W / 2 + 4, 254); ctx.fillStyle = "#c41"; ctx.fillText("WASTED", W / 2, 250); ctx.restore(); }
}
function dog(x, y, s, run, bk) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); const l = run ? Math.sin(t * .5) * 8 : 0;
  ctx.fillStyle = "#c8903a"; ctx.beginPath(); ctx.ellipse(0, 0, 22, 10, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(20, -8, 9, 8, 0, 0, 7); ctx.fill();
  ctx.fillStyle = "#8a5a22"; ctx.beginPath(); ctx.ellipse(18, -14, 4, 6, .3, 0, 7); ctx.fill(); ctx.fillStyle = "#222"; ctx.fillRect(26, -9, 4, 3); ctx.fillRect(22, -11, 2, 2); if (bk) { ctx.fillStyle = "#500"; ctx.fillRect(26, -6, 6, 3); }
  ctx.strokeStyle = "#c8903a"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-16, 6); ctx.lineTo(-16 + l, 18); ctx.moveTo(-8, 8); ctx.lineTo(-8 - l, 18); ctx.moveTo(10, 8); ctx.lineTo(10 + l, 18); ctx.moveTo(18, 6); ctx.lineTo(18 - l, 18); ctx.moveTo(-20, -2); ctx.quadraticCurveTo(-30, -12 + Math.sin(t * .6) * 6, -28, -16); ctx.stroke();
  ctx.restore();
}
function sub(tx, who) { ctx.fillStyle = "rgba(0,0,0,.78)"; ctx.fillRect(40, 424, 720, 62); txt(who + tx, W / 2, 455, 18, who ? "#e8c070" : "#ccc"); }
function drawCh2() {
  const c = c2, out = c < 760;
  if (out) {
    const g = ctx.createLinearGradient(0, 0, 0, 330); g.addColorStop(0, "#3a2a5a"); g.addColorStop(.5, "#d0603a"); g.addColorStop(1, "#f0a040"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, 330);
    ctx.fillStyle = "#ffd080"; ctx.beginPath(); ctx.arc(250, 310, 52, 0, 7); ctx.fill(); ctx.fillStyle = "#b8862a"; ctx.fillRect(0, 322, W, 178);
    const hx = 520, hy = 332; for (let k = 0; k < 11; k++) { ctx.fillStyle = k % 2 ? "#3a2616" : "#523a24"; ctx.fillRect(hx + k * 10, hy - 60, 9, 60); }
    ctx.fillStyle = "#2a1a10"; ctx.beginPath(); ctx.moveTo(hx - 10, hy - 60); ctx.lineTo(hx + 55, hy - 100); ctx.lineTo(hx + 120, hy - 60); ctx.fill(); ctx.fillStyle = "#3a3a3a"; ctx.fillRect(hx + 85, hy - 112, 14, 42);
    for (let k = 0; k < 5; k++) { ctx.fillStyle = "rgba(200,200,200,.22)"; ctx.beginPath(); ctx.arc(hx + 92 + Math.sin(t * .03 + k) * 6, hy - 118 - k * 14 - ((t * .3) % 14), 6 + k, 0, 7); ctx.fill(); }
    ctx.fillStyle = "#ffcf60"; ctx.fillRect(hx + 14, hy - 40, 20, 18); const dop = c > 640 && c < 700; ctx.fillStyle = dop ? "#0a0604" : "#2a1a0e"; ctx.fillRect(hx + 70, hy - 38, 22, 38);
    for (let r = 0; r < 14; r++) { const y = 338 + r * 12, sc = .6 + r * .08; ctx.strokeStyle = r % 2 ? "#e0b040" : "#c89a30"; ctx.lineWidth = 1.5 * sc; ctx.beginPath(); for (let k = 0; k < 45; k++) { const x = sr(k + r * 50) * W, sw = Math.sin(t * .04 + x * .015 + r) * 4; ctx.moveTo(x, y); ctx.lineTo(x + sw, y - 16 * sc); } ctx.stroke(); }
    if (c > 300) { const dx = c < 560 ? -40 + (c - 300) * 2.37 : 575, bk = c >= 560 && c < 640 && (c % 40 < 20); dog(dx, 448, 1.4, c < 560, bk); if (bk) txt("Wouf ! Wouf !", dx + 10, 410, 16, "#fff"); }
    ctx.fillStyle = "rgba(255,150,50,.08)"; ctx.fillRect(0, 0, W, H);
  } else {
    const fire = .8 + Math.sin(t * .3) * .1 + Math.random() * .1;
    for (let i = 0; i < 32; i++) { ctx.fillStyle = ["#2a1a10", "#22150c", "#2e1d12", "#1c110a"][i % 4]; ctx.fillRect(i * 25, 0, 26, 300); } ctx.fillStyle = "rgba(0,0,0,.4)"; for (let i = 0; i < 32; i++) ctx.fillRect(i * 25, 0, 2, 300); ctx.fillStyle = "#140c07"; ctx.fillRect(0, 196, W, 8); ctx.fillRect(0, 292, W, 10);
    ctx.fillStyle = "#1c120a"; ctx.fillRect(0, 302, W, 198); ctx.fillStyle = "rgba(0,0,0,.35)"; for (let y = 320; y < H; y += 30) ctx.fillRect(0, y, W, 2);
    clock(245, 40); ctx.fillStyle = "#2a1a0e"; ctx.fillRect(300, 120, 190, 8); for (let k = 0; k < 10; k++) { ctx.fillStyle = ["#6a2a1a", "#2a4a6a", "#4a6a2a", "#8a6a2a"][k % 4]; ctx.fillRect(306 + k * 17, 84 + (k % 3) * 3, 14, 36 - (k % 3) * 3); }
    ctx.fillStyle = "#2a1a0e"; ctx.fillRect(30, 250, 170, 130); ctx.fillStyle = "#3a2616"; ctx.fillRect(36, 258, 78, 58); ctx.fillRect(118, 258, 76, 58); ctx.fillRect(36, 322, 158, 50); ctx.fillStyle = "#c9a24a"; ctx.fillRect(72, 284, 6, 6); ctx.fillRect(152, 284, 6, 6); ctx.fillRect(110, 344, 8, 5);
    ctx.fillStyle = "#aab0b4"; ctx.beginPath(); ctx.ellipse(115, 236, 62, 16, 0, 0, 7); ctx.fill(); ctx.fillStyle = "#8a9094"; ctx.beginPath(); ctx.ellipse(115, 234, 30, 7, 0, 0, 7); ctx.fill(); ctx.fillStyle = "#9aa0a4"; ctx.fillRect(150, 222, 38, 8); ctx.beginPath(); ctx.arc(190, 226, 6, 0, 7); ctx.fill(); ctx.fillStyle = "#333"; ctx.fillRect(100, 228, 14, 5); ctx.fillStyle = "#e8e0d0"; ctx.beginPath(); ctx.arc(128, 226, 5, 0, 7); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.rect(590, 110, 180, 230); ctx.clip(); ctx.fillStyle = "#3a1a12"; ctx.fillRect(590, 110, 180, 230); for (let r = 0; r < 15; r++) for (let b = -1; b < 6; b++) { ctx.fillStyle = ["#6a2e22", "#5a2418", "#7a3a2a"][(r * 3 + b + 3) % 3]; ctx.fillRect(590 + b * 31 + (r % 2) * 15, 110 + r * 16, 29, 14); } ctx.restore();
    ctx.fillStyle = "#0a0604"; ctx.fillRect(620, 190, 120, 150);
    for (let k = 0; k < 7; k++) { ctx.fillStyle = "rgba(255," + (90 + k * 18) + ",20,.9)"; ctx.beginPath(); ctx.ellipse(650 + k * 14, 330 - Math.abs(Math.sin(t * .2 + k)) * 50 * fire, 12, 30 * fire, 0, 0, 7); ctx.fill(); }
    ctx.fillStyle = "#4a2a1a"; ctx.beginPath(); ctx.ellipse(410, 440, 160, 34, 0, 0, 7); ctx.fill(); ctx.fillStyle = "#6a3a22"; ctx.beginPath(); ctx.ellipse(410, 440, 130, 24, 0, 0, 7); ctx.fill();
    ctx.fillStyle = "#4a2818"; ctx.fillRect(462, 318, 140, 60); ctx.fillStyle = "#5a3220"; ctx.fillRect(470, 326, 124, 44); ctx.fillStyle = "#6a3c26"; ctx.fillRect(470, 372, 124, 36); ctx.fillStyle = "#3a1e12"; ctx.fillRect(458, 340, 20, 70); ctx.fillRect(590, 340, 20, 70);
    ctx.strokeStyle = "rgba(20,8,4,.7)"; ctx.lineWidth = 1; for (let k = 0; k < 9; k++) { const x = 476 + sr(k) * 110, y = 330 + sr(k + 4) * 70; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 8, y + 5); ctx.lineTo(x + 5, y + 12); ctx.stroke(); } ctx.fillStyle = "#2a140c"; for (let k = 0; k < 4; k++) ctx.fillRect(490 + k * 28, 340, 3, 3);
    const jx = c < 960 ? -40 + (c - 800) * 3.7 : 530, jy = c < 960 ? 396 : 404, hasDog = c > 1000, dx = c < 1160 ? -30 + (c - 1000) * 3.1 : 470;
    if (hasDog) dog(dx, 450, 1.3, c < 1160, false);
    ctx.save(); ctx.translate(430, 428); ctx.scale(1.4, 1.4); ctx.fillStyle = "#c8b48a"; ctx.fillRect(-14, -30, 28, 34); ctx.fillStyle = "#6a4a2a"; ctx.fillRect(-18, -26, 6, 30); ctx.fillRect(12, -26, 6, 30); ctx.fillStyle = "#4a3220"; ctx.fillRect(-14, -8, 28, 4);
    ctx.fillStyle = "#e8c8a0"; ctx.beginPath(); ctx.arc(0, -42, 12, 0, 7); ctx.fill(); ctx.fillStyle = "#e8d070"; ctx.beginPath(); ctx.arc(0, -46, 12, Math.PI, 0); ctx.fill(); ctx.fillRect(-12, -46, 4, 10); ctx.strokeStyle = "#8a5a22"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(10, -44); ctx.lineTo(14, -22); ctx.stroke();
    ctx.fillStyle = "#222"; ctx.fillRect(-5, -43, 2, 2); ctx.fillRect(3, -43, 2, 2); if (c > 1160) { ctx.strokeStyle = "#e8c8a0"; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(12, -22); ctx.lineTo(36 + Math.sin(t * .15) * 3, -4); ctx.stroke(); } ctx.restore();
    person(jx, jy, 1.5, false, c < 960 ? c : 0);
    if (c > 1250) { ctx.fillStyle = "#6a1a1a"; ctx.fillRect(jx - 20, jy - 50, 26, 20); ctx.fillStyle = "#e8dcc0"; ctx.fillRect(jx - 18, jy - 48, 22, 16); }
    const dk = ctx.createRadialGradient(680, 300, 40, 680, 300, 560); dk.addColorStop(0, "rgba(0,0,0,0)"); dk.addColorStop(1, "rgba(0,0,0,.9)"); ctx.fillStyle = dk; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(255,140,50,.1)"; ctx.fillRect(0, 0, W, H);
    if (c > 1160 && c < 1260) sub("Le chien rejoint l’enfant, qui le caresse doucement.", ""); else if (c >= 1260 && c < 1420) sub("Alors, où en étions-nous, mon grand ?", "Jim : "); else if (c >= 1420 && c < 1560) sub("Le livreur de pizza et le monstre de la forêt !", "Le fils : "); else if (c >= 1560 && c < 1700) sub("Non... je préfère tout te raconter depuis le début.", "Jim : "); else if (c >= 1700 && c < 1880) sub("Ces phénomènes étranges ont commencé quand j’étais enfant.", "Jim : ");
  }
  const a1 = c < 120 ? 1 : Math.max(0, 1 - (c - 120) / 180), a2 = Math.max(0, 1 - Math.abs(c - 760) / 30), ov = Math.max(a1, a2);
  if (ov > 0) { ctx.fillStyle = "rgba(0,0,0," + ov + ")"; ctx.fillRect(0, 0, W, H); }
  const ta = c < 50 ? c / 50 : c < 120 ? 1 : Math.max(0, 1 - (c - 120) / 80);
  if (ta > 0) { ctx.globalAlpha = ta; txt("CHAPITRE 2", W / 2, 215, 20, "#aaa"); txt("Jim le serveur de pizza", W / 2, 265, 46, "#e8dcc8"); ctx.globalAlpha = 1; }
}
function clock(x, y) {
  ctx.fillStyle = "#3a2212"; ctx.fillRect(x - 28, y + 20, 56, 150); ctx.beginPath(); ctx.moveTo(x - 34, y + 24); ctx.lineTo(x, y - 6); ctx.lineTo(x + 34, y + 24); ctx.fill();
  ctx.fillStyle = "#5a3a20"; ctx.fillRect(x - 24, y + 24, 48, 6); ctx.fillRect(x - 24, y + 160, 48, 6); for (let k = 0; k < 4; k++) ctx.fillRect(x - 24 + k * 14, y + 8, 4, 12);
  ctx.fillStyle = "#d8cfae"; ctx.beginPath(); ctx.arc(x, y + 52, 18, 0, 7); ctx.fill(); ctx.strokeStyle = "#111"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y + 52); ctx.lineTo(x + 8, y + 46); ctx.moveTo(x, y + 52); ctx.lineTo(x - 2, y + 38); ctx.stroke();
  ctx.fillStyle = "#120a06"; ctx.fillRect(x - 17, y + 78, 34, 76); ctx.save(); ctx.translate(x, y + 82); ctx.rotate(Math.sin(t * .1047) * .3); ctx.strokeStyle = "#b8903a"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 56); ctx.stroke(); ctx.fillStyle = "#c9a24a"; ctx.beginPath(); ctx.arc(0, 58, 8, 0, 7); ctx.fill(); ctx.restore();
}
function texWood(o) {
  if (!["hide", "drawer", "cab", "empty", "letter", "bench", "door"].includes(o.t)) return;
  const x = o.x, y = o.y, w = o.w, h = o.h, sd = x * .13 + y * .07;
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.lineWidth = 1;
  for (let k = 0; k < 7; k++) { ctx.strokeStyle = "rgba(0,0,0," + (.12 + sr(sd + k) * .15) + ")"; ctx.beginPath(); const yy = y + sr(sd + k + 9) * h; ctx.moveTo(x, yy); ctx.bezierCurveTo(x + w * .3, yy + 4, x + w * .6, yy - 4, x + w, yy + 2); ctx.stroke(); }
  ctx.strokeStyle = "rgba(220,200,170,.18)"; for (let k = 0; k < 3; k++) { const a = sr(sd + k + 20) * w, b = sr(sd + k + 30) * h; ctx.beginPath(); ctx.moveTo(x + a, y + b); ctx.lineTo(x + a + 10 + sr(k) * 14, y + b + 6); ctx.stroke(); }
  ctx.fillStyle = "rgba(10,6,3,.35)"; ctx.beginPath(); ctx.arc(x + sr(sd + 40) * w, y + sr(sd + 41) * h, 6 + sr(sd + 42) * 10, 0, 7); ctx.fill();
  if (sr(sd + 50) < .3) { ctx.fillStyle = "rgba(90,8,6,.55)"; const bx = x + sr(sd + 51) * w, by = y + sr(sd + 52) * h * .5; ctx.beginPath(); ctx.arc(bx, by, 5, 0, 7); ctx.fill(); ctx.fillRect(bx - 1.5, by, 3, 10 + sr(sd) * 14); }
  ctx.restore();
}
function smoke(x, y) { for (let k = 0; k < 9; k++) { const a = (t * 1.4 + k * 11) % 90; ctx.fillStyle = "rgba(120,120,120," + (.4 - a / 260) + ")"; ctx.beginPath(); ctx.arc(x + Math.sin(a * .08 + k) * 12, y - a, 5 + a * .12, 0, 7); ctx.fill(); } }
function jscare(txt) { jcTxt = txt; jcPrev = scene; jcv = (jcv + 1) % 3; jc = 0; scene = "jscare"; stopSpeak(); }
function drawJscare0() {
  const v = jcv, j = jc, sh = j < 40 ? 16 : 6; ctx.save(); ctx.translate((Math.random() - .5) * sh, (Math.random() - .5) * sh);
  ctx.fillStyle = j < 5 ? "#fff" : v === 1 ? "#1a0000" : "#050000"; ctx.fillRect(-20, -20, W + 40, H + 40);
  const sc = 1 + Math.min(1, j / 12) * .35 + (v === 2 ? Math.sin(j * 1.2) * .06 : 0); ctx.save(); ctx.translate(400, v === 1 ? 300 : 260); ctx.scale(sc, sc); if (v === 1) ctx.rotate(.15);
  ctx.fillStyle = "#040404"; ctx.beginPath(); ctx.ellipse(0, 0, 200, 250, 0, 0, 7); ctx.fill(); ctx.strokeStyle = "#1a1a1a"; ctx.lineWidth = 3; for (let k = 0; k < 10; k++) { ctx.beginPath(); ctx.moveTo(-180 + k * 40, -230 + sr(k) * 40); ctx.quadraticCurveTo(-170 + k * 40 + sr(k + 5) * 30, 0, -190 + k * 38, 220); ctx.stroke(); }
  [-70, 70].forEach(x => { ctx.fillStyle = "#300"; ctx.beginPath(); ctx.ellipse(x, -50, 46, 28, 0, 0, 7); ctx.fill(); ctx.shadowColor = "#f00"; ctx.shadowBlur = 40; ctx.fillStyle = "#f22"; ctx.beginPath(); ctx.ellipse(x, -50, 34, 18, 0, 0, 7); ctx.fill(); ctx.shadowBlur = 0; ctx.strokeStyle = "#900"; ctx.lineWidth = 1.5; for (let k = 0; k < 8; k++) { ctx.beginPath(); ctx.moveTo(x + Math.cos(k) * 34, -50 + Math.sin(k) * 18); ctx.lineTo(x + Math.cos(k) * 10, -50 + Math.sin(k) * 5); ctx.stroke(); } ctx.fillStyle = "#000"; ctx.fillRect(x - 3, -64, 6, 28); });
  const open = 60 + Math.abs(Math.sin(j * .5)) * 40; ctx.fillStyle = "#200"; ctx.beginPath(); ctx.ellipse(0, 90, 110, open, 0, 0, 7); ctx.fill(); ctx.fillStyle = "#d8d0b0";
  for (let k = 0; k < 9; k++) { const x = -90 + k * 22, l = 28 + sr(k + v) * 26; ctx.beginPath(); ctx.moveTo(x, 90 - open * .8); ctx.lineTo(x + 10, 90 - open * .8 + l); ctx.lineTo(x + 20, 90 - open * .8); ctx.fill(); ctx.beginPath(); ctx.moveTo(x + 4, 90 + open * .8); ctx.lineTo(x + 14, 90 + open * .8 - l * .8); ctx.lineTo(x + 24, 90 + open * .8); ctx.fill(); }
  ctx.fillStyle = "#a00"; ctx.fillRect(-60, 100, 6, 40); ctx.fillRect(40, 96, 5, 50);
  if (v !== 0) { ctx.save(); ctx.rotate(v === 1 ? -.4 : .3); ctx.fillStyle = "#a8a8b0"; ctx.beginPath(); ctx.moveTo(150, 330); ctx.lineTo(190, 330); ctx.lineTo(176, 60); ctx.fill(); ctx.fillStyle = "#900"; ctx.fillRect(160, 120, 20, 200); ctx.restore(); }
  ctx.restore(); ctx.fillStyle = "rgba(150,0,0,.7)"; for (let k = 0; k < 20; k++) { ctx.beginPath(); ctx.arc(sr(k + v * 9) * W, sr(k + 40) * H, 3 + sr(k + 70) * 10, 0, 7); ctx.fill(); } ctx.restore();
}
function oldFilm() {
  ctx.globalCompositeOperation = "multiply"; ctx.fillStyle = "rgba(226,206,170,.75)"; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = "rgba(255,255,255,.18)"; ctx.lineWidth = 1; for (let k = 0; k < 3; k++) if (Math.random() < .5) { const x = Math.random() * W; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + (Math.random() - .5) * 6, H); ctx.stroke(); }
  for (let k = 0; k < 14; k++) { ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.fillRect(Math.random() * W, Math.random() * H, 1 + Math.random() * 2, 1 + Math.random() * 2); }
}
function loop() { t++; update(); draw(); if (scene === "vortex" || scene === "pool") oldFilm(); { const ci = ["cell", "puddle", "win", "storm", "drop", "ride", "car", "exit", "flee", "dive", "cat", "crawl", "back", "station", "road2d", "unlock", "screamer", "wasted", "ch2", "cut", "letter", "jscare", "vortex"].includes(scene); msg.style.top = ci ? "12px" : "auto"; msg.style.bottom = ci ? "auto" : "14px"; msg.style.right = ci ? "120px" : "5%"; } if (scene !== "menu") for (let i = 0; i < 140; i++) { ctx.fillStyle = "rgba(255,255,255," + Math.random() * .06 + ")"; ctx.fillRect(Math.random() * W, Math.random() * H, 1.5, 1.5); } if (invOpen) drawInv(); if (paused && $("options").classList.contains("hidden")) { ctx.fillStyle = "rgba(0,0,0,.6)"; ctx.fillRect(0, 0, W, H); txt("PAUSE", W / 2, 230, 54); txt("P ou Échap pour reprendre", W / 2, 290, 18, "#aaa"); } act = false; skip = false; jmp = false; rst = false; ckey = false; requestAnimationFrame(loop); }

// ===== AMÉLIORATIONS : textures, poses, screamers, LED =====
const web = (x, y, d, s) => { ctx.strokeStyle = "rgba(220,220,220,.3)"; ctx.lineWidth = 1; for (let i = 0; i < 4; i++) { const a = i * .4 + .1; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + d * Math.cos(a) * s, y + Math.sin(a) * s); ctx.stroke(); } for (let r = s * .3; r <= s; r += s * .25) { ctx.beginPath(); for (let i = 0; i < 4; i++) { const a = i * .4 + .1; ctx[i ? "lineTo" : "moveTo"](x + d * Math.cos(a) * r, y + Math.sin(a) * r); } ctx.stroke(); } };
const SEG = { 0: "abcdef", 1: "bc", 2: "abdeg", 3: "abcdg", 4: "bcfg", 5: "acdfg", 6: "acdefg", 7: "abc", 8: "abcdefg", 9: "abcdfg" };
function led(s, cx, cy, w) {
  const dw = w / 5.4, dh = dw * 1.9, th = Math.max(2, dw * .17), g = dw * .25, tot = 4 * dw + 3 * g + dw * .6; let x = cx - tot / 2; const y = cy - dh / 2;
  ctx.fillStyle = "#080000"; ctx.fillRect(x - dw * .3, y - dh * .18, tot + dw * .6, dh * 1.36);
  for (const ch of s) {
    if (ch === ":") { ctx.save(); ctx.shadowColor = "#f22"; ctx.shadowBlur = dw * .4; ctx.fillStyle = "#ff2a1a"; ctx.fillRect(x + dw * .2, y + dh * .3, th, th); ctx.fillRect(x + dw * .2, y + dh * .65, th, th); ctx.restore(); x += dw * .6; continue; }
    const on = SEG[ch] || "", hh = dh / 2 - th * 1.5;
    const Pz = { a: [x + th, y, dw - 2 * th, th], b: [x + dw - th, y + th, th, hh], c: [x + dw - th, y + dh / 2 + th * .5, th, hh], d: [x + th, y + dh - th, dw - 2 * th, th], e: [x, y + dh / 2 + th * .5, th, hh], f: [x, y + th, th, hh], g: [x + th, y + dh / 2 - th / 2, dw - 2 * th, th] };
    for (const k in Pz) { ctx.save(); if (on.includes(k)) { ctx.shadowColor = "#f22"; ctx.shadowBlur = dw * .5; ctx.fillStyle = "#ff2a1a"; } else ctx.fillStyle = "rgba(90,0,0,.35)"; ctx.fillRect(...Pz[k]); ctx.restore(); }
    x += dw + g;
  }
}
function poolDetail() {
  const Q = (x0, z0, x1, z1, y, c, a) => poly([[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]], c, a);
  for (let k = 0; k < 20; k++) { const z = 6 + k; Q(-6.7, z - .02, -6, z + .02, .09, "#3a3426", 1); Q(6, z - .02, 6.7, z + .02, .09, "#3a3426", 1); }
  for (let k = 0; k < 13; k++) { const x = -6.7 + k; Q(x - .02, 5.3, x + .02, 6, .09, "#3a3426", 1); Q(x - .02, 24, x + .02, 24.7, .09, "#3a3426", 1); }
  Q(-6.07, 6, -6, 24, .095, "#fffbe6", .75); Q(6, 6, 6.07, 24, .095, "#fffbe6", .75); Q(-6.7, 5.93, 6.7, 6, .095, "#fffbe6", .6);
  for (let i = 0; i < 14; i++) { const z = 1 + i * 2.3, sh = .08 + .05 * Math.sin(t * .03 + i); [-8.4, 8.4].forEach(x => Q(x - .3, z, x + .3, z + 1.2, .012, "#ffffff", sh)); if (z < 5 || z > 24.5) { Q(-4.2, z, -3.8, z + 1.2, .012, "#ffffff", sh); Q(3.8, z, 4.2, z + 1.2, .012, "#ffffff", sh); } }
  for (let p = 0; p < 9; p++) { const sd = p % 2 ? 1 : -1, cx = sd * (7.4 + sr(p + 40) * 2), cz = 3 + sr(p + 50) * 28, r = .35 + sr(p + 60) * .5, pts = []; for (let a = 0; a < 8; a++) pts.push([cx + Math.cos(a * .785) * r * 1.4, .013, cz + Math.sin(a * .785) * r]); poly(pts, "#a9cde0", .38); poly(pts.map(q => [q[0] * .6 + cx * .4, .014, q[2] * .6 + cz * .4]), "#ffffff", .12); }
  for (let k = 0; k < 3; k++) Q(7 + k * .5, 10 + k * 5, 7.12 + k * .5, 13 + k * 5, .014, "#ffffff", .18);
}
function hidePose() {
  const o = hideObj; if (!o) return; const n = o.n, cx = o.x + o.w / 2, by = o.y + o.h;
  if (n === "lit") { const x = o.x + o.w * .25, y = by - 7; ctx.fillStyle = "#1b2438"; ctx.fillRect(x + 6, y - 5, 34, 6); ctx.fillStyle = "#b0201a"; ctx.fillRect(x - 6, y - 8, 22, 10); ctx.fillStyle = "#d8b090"; ctx.beginPath(); ctx.arc(x - 12, y - 4, 6, 0, 7); ctx.fill(); ctx.fillStyle = "#6a1410"; ctx.fillRect(x - 18, y - 10, 10, 4); ctx.fillStyle = "#fff"; ctx.fillRect(x - 15, y - 5, 2, 2); ctx.fillRect(x - 10, y - 5, 2, 2); }
  else if (n === "placard") { ctx.fillStyle = "#000"; ctx.fillRect(o.x + 6, o.y + 8, o.w - 12, o.h - 16); const b = (t % 140 < 6) ? 0 : 3; ctx.fillStyle = "#fff"; ctx.fillRect(cx - 9, o.y + 34, 5, b + 1); ctx.fillRect(cx + 4, o.y + 34, 5, b + 1); }
  else { const x = cx, y = by - 4; ctx.fillStyle = "#b0201a"; ctx.fillRect(x - 14, y - 22, 28, 18); ctx.fillStyle = "#1b2438"; ctx.fillRect(x - 16, y - 6, 32, 6); ctx.fillStyle = "#d8b090"; ctx.beginPath(); ctx.arc(x + 12, y - 26, 7, 0, 7); ctx.fill(); ctx.fillStyle = "#6a1410"; ctx.fillRect(x + 5, y - 33, 14, 4); ctx.fillStyle = "#fff"; ctx.fillRect(x + 13, y - 27, 2, 2); }
}
function furn(o) {
  furn0(o); const x = o.x, y = o.y, w = o.w, h = o.h, k = o.n || o.t, sd = x * .17 + y * .11, c = x + w / 2;
  ctx.save(); ctx.beginPath(); ctx.rect(x - 2, y - 8, w + 4, h + 10); ctx.clip();
  const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, "rgba(255,230,180,.08)"); g.addColorStop(1, "rgba(0,0,0,.45)"); ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  for (let i = 0; i < 10; i++) { ctx.fillStyle = "rgba(30,45,20," + (.12 + sr(sd + i) * .12) + ")"; ctx.beginPath(); ctx.arc(x + sr(sd + i + 5) * w, y + h - sr(sd + i + 9) * h * .3, 1 + sr(i + sd) * 3, 0, 7); ctx.fill(); }
  ctx.strokeStyle = "rgba(0,0,0,.55)"; ctx.lineWidth = 1; for (let i = 0; i < 3; i++) { const a = x + sr(sd + i + 20) * w, b = y + sr(sd + i + 30) * h; ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(a + 4 + sr(i) * 10, b + 8 + sr(i + 3) * 12); ctx.lineTo(a + 2, b + 20 + sr(i + 8) * 10); ctx.stroke(); }
  if (["placard", "drawer", "cab", "letter", "empty", "door", "bench"].includes(k) && sr(sd) < .75) { ctx.strokeStyle = "rgba(15,5,3,.8)"; ctx.lineWidth = 2; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(x + w * .55 + i * 6, y + h * .15); ctx.lineTo(x + w * .5 + i * 6 + 3, y + h * .6); ctx.stroke(); } }
  if (sr(sd + 7) < .5) { const bx = x + sr(sd + 8) * w, bl = h * (.25 + sr(sd + 9) * .5); ctx.fillStyle = "rgba(100,8,6,.7)"; ctx.fillRect(bx, y, 2.5, bl); ctx.beginPath(); ctx.arc(bx + 1.2, y + bl, 2.6, 0, 7); ctx.fill(); }
  if (k === "lit") {
    ctx.fillStyle = "rgba(120,100,60,.25)"; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.ellipse(x + 10 + sr(sd + i) * (w - 20), y + h * .4 + sr(sd + i + 9) * h * .3, 6 + sr(i + sd) * 8, 4, 0, 0, 7); ctx.fill(); }
    ctx.fillStyle = "rgba(90,10,8,.55)"; ctx.beginPath(); ctx.ellipse(x + w * .55, y + h * .55, 12, 7, .3, 0, 7); ctx.fill(); ctx.fillRect(x + w * .55 - 1, y + h * .55, 2, 12);
    ctx.fillStyle = "#050302"; ctx.fillRect(x + 4, y + h - 16, w - 8, 14); ctx.fillStyle = "#2a1a0e"; ctx.fillRect(x + 2, y + h - 18, w - 4, 3); ctx.fillRect(x + 2, y + h - 16, 5, 16); ctx.fillRect(x + w - 7, y + h - 16, 5, 16);
  } else if (k === "table") {
    ctx.fillStyle = "rgba(90,8,6,.5)"; ctx.beginPath(); ctx.ellipse(x + w * .4, y + 12, 14, 3, 0, 0, 7); ctx.fill(); ctx.strokeStyle = "rgba(0,0,0,.6)"; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(x + 20 + i * 30, y + 8); ctx.lineTo(x + 26 + i * 30, y + 18); ctx.stroke(); }
  } else if (k === "placard") {
    ctx.fillStyle = "rgba(0,0,0,.55)"; ctx.fillRect(c - 1, y + 6, 2, h - 12); ctx.fillStyle = "#6a5a40"; [[x + 6, y + 14], [x + 6, y + h - 14], [x + w - 6, y + 14], [x + w - 6, y + h - 14]].forEach(a => { ctx.beginPath(); ctx.arc(a[0], a[1], 2, 0, 7); ctx.fill(); });
  } else if (o.t === "door") {
    ctx.strokeStyle = "#555"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y + h * .3); ctx.lineTo(x + w, y + h * .5); ctx.moveTo(x, y + h * .6); ctx.lineTo(x + w, y + h * .75); ctx.stroke(); ctx.fillStyle = "#777"; for (let i = 0; i < 4; i++) ctx.fillRect(x + 6 + i * 11, y + h * .3 + i * 4, 3, 3);
  } else if (o.t === "window") { ctx.strokeStyle = "rgba(200,220,255,.5)"; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(x + w * .3, y + h * .3); ctx.lineTo(x + w * (.1 + i * .25), y + (i % 2) * h); ctx.stroke(); } web(x + 2, y + 2, 1, 26); }
  ctx.restore();
  if (sr(sd + 3) < .5) web(x + 3, y + 3, 1, 16);
}
function oldFloor() {
  oldFloor0(); ctx.lineWidth = 1;
  for (let k = 0; k < 60; k++) { const x = sr(k + 500) * W, y = 44 + sr(k + 510) * 450; ctx.strokeStyle = "rgba(0,0,0," + (.15 + sr(k) * .2) + ")"; ctx.beginPath(); ctx.moveTo(x, y); ctx.bezierCurveTo(x + 14, y + 2, x + 30, y - 3, x + 44 + sr(k + 3) * 40, y + 1); ctx.stroke(); ctx.strokeStyle = "rgba(210,185,140,.07)"; ctx.beginPath(); ctx.moveTo(x, y + 1.5); ctx.lineTo(x + 30, y + 1); ctx.stroke(); }
  for (let k = 0; k < 40; k++) { ctx.fillStyle = "#0a0705"; ctx.fillRect(sr(k + 600) * W, 44 + sr(k + 610) * 450, 2, 2); }
  ctx.strokeStyle = "rgba(0,0,0,.6)"; ctx.lineWidth = 2; for (let c = 0; c < 3; c++) { let x = 120 + c * 280, y = 120 + c * 90; ctx.beginPath(); ctx.moveTo(x, y); for (let i = 0; i < 7; i++) { x += 14 + sr(c * 9 + i) * 18; y += sr(c * 9 + i + 4) * 26 - 8; ctx.lineTo(x, y); } ctx.stroke(); }
  for (let m = 0; m < 5; m++) { const mx = 60 + sr(m + 700) * 680, my = 80 + sr(m + 710) * 380, g = ctx.createRadialGradient(mx, my, 2, mx, my, 40 + sr(m) * 30); g.addColorStop(0, "rgba(40,60,30,.3)"); g.addColorStop(1, "rgba(40,60,30,0)"); ctx.fillStyle = g; ctx.fillRect(mx - 80, my - 80, 160, 160); }
  for (let i = 0; i < 8; i++) { const fx = 240 + i * 34, fy = 300 + Math.sin(i * .9) * 18 + (i % 2 ? 8 : -8); ctx.fillStyle = "rgba(90,8,6," + (.55 - i * .05) + ")"; ctx.beginPath(); ctx.ellipse(fx, fy, 5, 9, .2, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(fx + 1, fy - 11, 3.5, 3, 0, 0, 7); ctx.fill(); }
  ctx.fillStyle = "rgba(100,10,8,.7)"; ctx.beginPath(); ctx.ellipse(430, 22, 9, 11, 0, 0, 7); ctx.fill(); for (let f = 0; f < 5; f++) ctx.fillRect(421 + f * 4, 8 - f % 2 * 3, 3, 10); ctx.fillRect(428, 28, 4, 10);
  ctx.fillStyle = "rgba(200,180,140,.12)"; for (let i = 0; i < 10; i++) { ctx.beginPath(); ctx.moveTo(i * 80 + 10, 0); ctx.lineTo(i * 80 + 30, 0); ctx.lineTo(i * 80 + 22, 14 + sr(i + 800) * 20); ctx.fill(); }
  web(14, 40, 1, 70); web(W - 14, 40, -1, 70);
  for (let i = 0; i < 24; i++) { ctx.fillStyle = "rgba(220,200,160," + (.1 + .1 * Math.sin(t * .03 + i)) + ")"; ctx.fillRect((sr(i + 900) * W + t * .12 * (1 + sr(i))) % W, sr(i + 910) * H + Math.sin(t * .02 + i) * 8, 1.5, 1.5); }
}
function portrait() {
  portrait0(); ctx.save(); ctx.beginPath(); ctx.rect(312, 62, 126, 166); ctx.clip(); ctx.translate(312, 62); ctx.scale(.5, .5);
  ctx.fillStyle = "rgba(140,110,50,.2)"; ctx.fillRect(0, 0, 252, 332);
  [[104, 143, 17, 11], [148, 143, 17, 11], [86, 182, 13, 24], [166, 182, 13, 24]].forEach(a => { ctx.fillStyle = "rgba(25,12,8,.42)"; ctx.beginPath(); ctx.ellipse(a[0], a[1], a[2], a[3], 0, 0, 7); ctx.fill(); });
  ctx.strokeStyle = "rgba(35,18,10,.7)"; ctx.lineWidth = 2;
  for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.moveTo(82 + k * 2, 106 + k * 6); ctx.quadraticCurveTo(126, 98 + k * 6 + (k % 2 ? 3 : -3), 170 - k * 2, 106 + k * 6); ctx.stroke(); }
  for (let s = -1; s <= 1; s += 2) { for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(126 + s * 30, 142 + k * 3); ctx.lineTo(126 + s * (52 + k * 5), 136 + k * 10); ctx.stroke(); } ctx.beginPath(); ctx.moveTo(126 + s * 14, 166); ctx.quadraticCurveTo(126 + s * 34, 190, 126 + s * 30, 214); ctx.stroke(); ctx.beginPath(); ctx.arc(126 + s * 22, 154, 13, .3, 2.8); ctx.stroke(); }
  ctx.fillStyle = "rgba(90,50,25,.5)"; for (let k = 0; k < 14; k++) { ctx.beginPath(); ctx.arc(76 + sr(k + 1200) * 100, 112 + sr(k + 1210) * 90, 1.5 + sr(k) * 2, 0, 7); ctx.fill(); }
  ctx.strokeStyle = "rgba(235,235,225,.55)"; for (let k = 0; k < 30; k++) { const x = 60 + sr(k + 1300) * 132; ctx.beginPath(); ctx.moveTo(x, 96 + sr(k) * 30); ctx.lineTo(x - 4 + sr(k + 5) * 8, 126 + sr(k + 2) * 20); ctx.stroke(); }
  ctx.strokeStyle = "rgba(10,6,4,.55)"; ctx.beginPath(); ctx.moveTo(108, 208); ctx.quadraticCurveTo(126, 201, 146, 210); ctx.stroke();
  ctx.strokeStyle = "rgba(0,0,0,.4)"; ctx.lineWidth = 1; for (let k = 0; k < 8; k++) { const a = sr(k + 1400) * 252, b = sr(k + 1410) * 332; ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(a + sr(k + 1420) * 60 - 30, b + sr(k + 1430) * 60); ctx.stroke(); }
  const g = ctx.createRadialGradient(126, 166, 60, 126, 166, 200); g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,.55)"); ctx.fillStyle = g; ctx.fillRect(0, 0, 252, 332); ctx.restore();
}
function smoke(x, y) {
  for (let k = 0; k < 18; k++) { const a = (t * 1.3 + k * 9) % 120, s2 = 6 + a * .24, c = 70 - a / 3 | 0; ctx.fillStyle = "rgba(" + c + "," + c + "," + (c + 2) + "," + Math.max(0, .55 - a / 200) + ")"; ctx.beginPath(); ctx.arc(x + Math.sin(a * .07 + k) * (8 + a * .2), y - a * 1.1, s2, 0, 7); ctx.fill(); }
  for (let k = 0; k < 4; k++) { const a = (t * 3 + k * 20) % 40; ctx.fillStyle = "rgba(255," + (120 + k * 20) + ",30," + (.7 - a / 60) + ")"; ctx.fillRect(x + Math.sin(k * 3 + a * .2) * 10, y - a, 2, 2); }
}
function drawJscare() {
  drawJscare0(); const v = jcv, j = jc; if (j < 1) return; const sh = j < 40 ? 10 : 4;
  ctx.save(); ctx.translate(400 + (Math.random() - .5) * sh, (v === 1 ? 300 : 260) + (Math.random() - .5) * sh); const sc = 1 + Math.min(1, j / 12) * .35 + (v === 2 ? Math.sin(j * 1.2) * .06 : 0); ctx.scale(sc, sc); if (v === 1) ctx.rotate(.15);
  const open = 60 + Math.abs(Math.sin(j * .5)) * 40; ctx.lineCap = "round";
  if (v === 0) {
    ctx.strokeStyle = "rgba(150,10,10,.75)"; ctx.lineWidth = 2; for (let k = 0; k < 7; k++) { ctx.beginPath(); ctx.moveTo(-150 + k * 6, -190 + k * 10); ctx.bezierCurveTo(-120, -120 + k * 12, -90, -80, -60 + k * 3, -70); ctx.stroke(); ctx.beginPath(); ctx.moveTo(150 - k * 6, -190 + k * 10); ctx.bezierCurveTo(120, -120 + k * 12, 90, -80, 60 - k * 3, -70); ctx.stroke(); }
    ctx.strokeStyle = "#7a7a6a"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-110, -120); ctx.lineTo(-30, 10); ctx.stroke(); ctx.strokeStyle = "#300"; ctx.lineWidth = 1; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.moveTo(-100 + k * 14, -105 + k * 22); ctx.lineTo(-90 + k * 14, -98 + k * 22); ctx.stroke(); }
    ctx.strokeStyle = "rgba(210,230,200,.55)"; ctx.lineWidth = 3; for (let k = 0; k < 5; k++) { const x = -70 + k * 35, l = 30 + ((j * 3 + k * 17) % 60); ctx.beginPath(); ctx.moveTo(x, 90 + open * .8); ctx.lineTo(x + Math.sin(j * .3 + k) * 4, 90 + open * .8 + l); ctx.stroke(); }
  } else if (v === 1) {
    [-1, 1].forEach(sg => { ctx.fillStyle = "#0a0a0a"; ctx.beginPath(); ctx.ellipse(sg * 230, 210, 70, 90, sg * .4, 0, 7); ctx.fill(); for (let f = 0; f < 4; f++) { const fx = sg * (110 + f * 14), fy = 60 - f * 22; ctx.strokeStyle = "#0a0a0a"; ctx.lineWidth = 22; ctx.beginPath(); ctx.moveTo(sg * (200 + f * 18), 150); ctx.lineTo(fx, fy); ctx.stroke(); ctx.fillStyle = "#cfc8a8"; ctx.beginPath(); ctx.moveTo(fx - 9, fy); ctx.lineTo(fx + 9, fy); ctx.lineTo(fx - sg * 15, fy - 40); ctx.fill(); } });
    ctx.strokeStyle = "#1a1a1a"; ctx.lineWidth = 2; for (let k = 0; k < 9; k++) { ctx.beginPath(); ctx.moveTo(-190 + k * 48, -210); ctx.lineTo(-180 + k * 48 + sr(k) * 30, -150); ctx.lineTo(-195 + k * 48, -100); ctx.stroke(); }
  } else {
    for (let k = 0; k < 5; k++) { const x = -90 + k * 45, y = -150 + Math.abs(k - 2) * 14; ctx.shadowColor = "#f00"; ctx.shadowBlur = 14; ctx.fillStyle = "#d22"; ctx.beginPath(); ctx.ellipse(x, y, 9, 6 + Math.sin(j * .5 + k) * 2, 0, 0, 7); ctx.fill(); ctx.shadowBlur = 0; ctx.fillStyle = "#000"; ctx.fillRect(x - 1, y - 5, 2, 10); }
    ctx.strokeStyle = "#c00"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, 40); ctx.lineTo(-6, 90 + open * .9); ctx.lineTo(8, 170 + open * .7); ctx.stroke();
    ctx.fillStyle = "rgba(120,0,0,.7)"; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.arc(-80 + k * 32, 100 + open * .9 + ((j * 4 + k * 20) % 60), 4, 0, 7); ctx.fill(); }
  }
  ctx.lineCap = "butt"; ctx.restore(); ctx.fillStyle = "rgba(120,0,0," + Math.min(.35, j / 60) * .5 + ")"; ctx.fillRect(0, 0, W, H);
}
function drawCell() {
  drawCell0(); if (cli < 8) return;
  const k = cli === 9 ? Math.min(1, cl / 55) : 0, kk = (cli === 9 ? Math.min(1, Math.max(0, (cl - 55) / 25)) : 0) * (cl > 100 ? Math.max(0, 1 - (cl - 100) / 20) : 1), rec = cli === 8 ? Math.min(60, Math.max(0, cl - 150) * .25) : 60 + k * 30;
  ctx.save(); ctx.translate(300 - rec - (cli === 9 ? Math.max(0, cl - 170) * 3.2 : 0), 392 + k * 6); ctx.rotate(-k * .45 * (1 - Math.min(1, Math.max(0, (cl - 70) / 30)))); person(0, 0, 2.1, false, cli === 8 ? cl * 1.2 : (cl > 170 ? cl * 2.2 : 0), cli === 9 || cl > 200);
  if (kk > 0) { ctx.lineCap = "round"; ctx.strokeStyle = "#1b2438"; ctx.lineWidth = 17; ctx.beginPath(); ctx.moveTo(8, -30); ctx.lineTo(8 + kk * 160, -30 - kk * 10); ctx.stroke(); ctx.fillStyle = "#111"; ctx.beginPath(); ctx.arc(8 + kk * 164, -30 - kk * 10, 11, 0, 7); ctx.fill(); ctx.lineCap = "butt"; }
  ctx.restore();
  if (cli === 8 && cl > 150) { ctx.strokeStyle = "#b49a62"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(430, 330); ctx.quadraticCurveTo(400, 360 + Math.sin(cl * .2) * 8, 360, 380); ctx.stroke(); }
}


// ===== PISCINE : maître-nageur, minuit, vestiaire =====
let lgS = 0, lkS = 0, tk = 0, lkx = 60, lkMx = 900, dark = 0, lkKey = false, clkPos = null, lkNear = -1;
const TAG = 5; REV.pool = [40, 40];
const alien0 = () => { tone(180, 1.8, "sawtooth", .13, 520); tone(250, 1.6, "square", .06, -160); tone(1300, 1.2, "sawtooth", .05, -700); noiseBP(1.8, .22, 1600, 3); setTimeout(() => { tone(420, 1.2, "sawtooth", .1, -300); noise(1, .3, 900); }, 700); };
function lifeg(x, y, s) {
  const sw = Math.sin(t * .2) * 5 * s; ctx.fillStyle = "#c9966a"; ctx.fillRect(x - 9 * s + sw, y - 22 * s, 8 * s, 22 * s); ctx.fillRect(x + s - sw, y - 22 * s, 8 * s, 22 * s);
  ctx.fillStyle = "#d22"; ctx.fillRect(x - 12 * s, y - 32 * s, 24 * s, 14 * s); ctx.fillStyle = "#f4f4f0"; ctx.fillRect(x - 12 * s, y - 54 * s, 24 * s, 24 * s);
  ctx.fillStyle = "#d22"; ctx.fillRect(x - 3 * s, y - 48 * s, 6 * s, 12 * s); ctx.fillRect(x - 6 * s, y - 45 * s, 12 * s, 6 * s);
  ctx.fillStyle = "#c9966a"; ctx.fillRect(x - 17 * s, y - 52 * s, 5 * s, 20 * s); ctx.fillRect(x + 12 * s, y - 52 * s, 5 * s, 20 * s); ctx.beginPath(); ctx.arc(x, y - 62 * s, 9 * s, 0, 7); ctx.fill();
  ctx.fillStyle = "#222"; ctx.fillRect(x - 9 * s, y - 72 * s, 18 * s, 5 * s); ctx.fillRect(x - 5 * s, y - 64 * s, 3 * s, 2 * s); ctx.fillRect(x + 2 * s, y - 64 * s, 3 * s, 2 * s);
  ctx.strokeStyle = "#ffd24a"; ctx.lineWidth = Math.max(1, s); ctx.beginPath(); ctx.moveTo(x, y - 54 * s); ctx.lineTo(x, y - 47 * s); ctx.stroke(); ctx.fillStyle = "#ffd24a"; ctx.fillRect(x - 2 * s, y - 48 * s, 4 * s, 3 * s);
}
function lifeUpd() {
  if (lgS === 0 && pt > 80) {
    const tx = Math.abs(lgz - plz) > 2.5 ? 8.3 : (Math.abs(plx) < 6.9 ? (plx < 0 ? -7.6 : 7.6) : plx), dx = tx - lgx, dz = plz - lgz, d = Math.hypot(dx, dz); if (d > .3) { lgx += dx / d * .05; lgz += dz / d * .05; }
    if (Math.hypot(plx - lgx, plz - lgz) < 3.4 || (d < .4 && Math.abs(lgz - plz) < 2.5)) { lgS = 1; lkT = 0; whistle(); say("Maître-nageur : Il se fait tard, Jim. Tu peux faire une longueur dans la piscine, mais pas plus.", 7); speak("Il se fait tard, Jim. Tu peux faire une longueur dans la piscine, mais pas plus.", "young", 1); }
  } else if (lgS === 1) { if (++lkT > 330) lgS = 2; }
  else if (lgS === 2) { const dx = 9.1 - lgx, dz = 12.7 - lgz, d = Math.hypot(dx, dz); if (d > .4) { lgx += dx / d * .04; lgz += dz / d * .04; } else { lgS = 3; doorSnd(); say("Le maître-nageur est parti. Fais ta longueur (entre dans l’eau).", 5); } }
  if (act) { const nd = [10, 16, 22].find(z => Math.abs(plz - (z + .7)) < 1.6); if (Math.abs(plx) > 7.6 && nd !== undefined) say("Cette porte est fermée à clé.", 3); else if (Math.hypot(plx + 9, plz - 5) < 2.6) say("Un placard... pas maintenant.", 3); }
}
let lkT = 0;
function poolExtra() { }
function wallDetail() {
  [-10, 10].forEach(x => poly([[x, 1, 0], [x, 1, 32], [x, 1.3, 32], [x, 1.3, 0]], "#2f5f8a"));
  poly([[-10, 1, 31.9], [10, 1, 31.9], [10, 1.3, 31.9], [-10, 1.3, 31.9]], "#2f5f8a");
  for (let z = 4; z < 30; z += 6) { poly([[9.9, 3.8, z], [9.9, 3.8, z + 3], [9.9, 5.2, z + 3], [9.9, 5.2, z]], "#1a2a4a"); poly([[9.85, 3.9, z + .1], [9.85, 3.9, z + 1.4], [9.85, 5.1, z + 1.4], [9.85, 5.1, z + .1]], "#34508a", .6); poly([[9.85, 3.8, z + 1.45], [9.85, 3.8, z + 1.55], [9.85, 5.2, z + 1.55], [9.85, 5.2, z + 1.45]], "#101820"); }
  const Q = (x0, z0, x1, z1, y, c) => poly([[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]], c);
  [[7.9, 19.6], [8.7, 19.6], [7.9, 20.4], [8.7, 20.4]].forEach(a => poly([[a[0] - .05, 0, a[1]], [a[0] + .05, 0, a[1]], [a[0] + .05, 1.4, a[1]], [a[0] - .05, 1.4, a[1]]], "#bbb")); Q(7.8, 19.5, 8.8, 20.5, 1.4, "#d33"); poly([[8.8, 1.4, 19.5], [8.8, 2.3, 19.5], [8.8, 2.3, 20.5], [8.8, 1.4, 20.5]], "#eee");
  [-6.1, 6.1].forEach(x => { [15, 15.7].forEach(z => poly([[x - .04, -.3, z], [x + .04, -.3, z], [x + .04, .9, z], [x - .04, .9, z]], "#d0d6dc")); [0, .3, .6].forEach(y => poly([[x - .04, y, 15], [x + .04, y, 15], [x + .04, y + .04, 15.7], [x - .04, y + .04, 15.7]], "#d0d6dc")); });
  for (let k = 0; k < 18; k++) [-3, 0, 3].forEach(x => poly([[x - .1, -.2, 6.5 + k * .95], [x + .1, -.2, 6.5 + k * .95], [x + .1, -.2, 6.95 + k * .95], [x - .1, -.2, 6.95 + k * .95]], k % 2 ? "#e33" : "#f4f4f4"));
}
function darkPool() {
  ctx.fillStyle = "rgba(0,4,12,.9)"; ctx.fillRect(0, 0, W, H);
  poly([[-6, -.3, 6], [6, -.3, 6], [6, -.3, 24], [-6, -.3, 24]], "#1f86a8", .9);
  [-3, 0, 3].forEach(x => poly([[x - .08, -.28, 6], [x + .08, -.28, 6], [x + .08, -.28, 24], [x - .08, -.28, 24]], "#9fd8ee", .5));
  const c = bb(0, 15, 0); if (c) { const g = ctx.createRadialGradient(c.x, c.y, 10, c.x, c.y, 360); g.addColorStop(0, "rgba(90,210,240,.28)"); g.addColorStop(1, "rgba(90,210,240,0)"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
  poly([[-9.9, 2.4, 16], [-9.9, 2.4, 17.4], [-9.9, 2.75, 17.4], [-9.9, 2.75, 16]], "#3fe08a", .5 + .4 * Math.sin(t * .1));
  if (clkPos) led("00:00", clkPos[0], clkPos[1], clkPos[2]);
}
function drawLapse() {
  const m = (1220 + Math.min(1, pt / 300) * 220) % 1440, hh = String(m / 60 | 0).padStart(2, "0"), mm = String(m % 60 | 0).padStart(2, "0");
  ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H); const g = ctx.createLinearGradient(0, 330, 0, 500); g.addColorStop(0, "rgba(40,140,180,0)"); g.addColorStop(1, "rgba(40,140,180," + (.25 + Math.sin(t * .05) * .05) + ")"); ctx.fillStyle = g; ctx.fillRect(0, 330, W, 170);
  ctx.globalAlpha = Math.min(1, pt / 40); led(hh + ":" + mm, 400, 230, 340); ctx.globalAlpha = 1;
  if (pt > 300 && pt % 45 < 8) { ctx.fillStyle = "rgba(255,40,20,.12)"; ctx.fillRect(0, 0, W, H); }
  txt(pt < 300 ? "Les heures défilent..." : "Minuit sonne dans la piscine déserte.", W / 2, 420, 18, "#a99");
}
function manKnife(x, y, s, sh) {
  ctx.fillStyle = "#050505"; ctx.beginPath(); ctx.ellipse(x, y - 60 * s, 26 * s, 62 * s, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(x, y - 138 * s, 18 * s, 0, 7); ctx.fill(); ctx.fillRect(x - 20 * s, y - 20 * s, 14 * s, 40 * s); ctx.fillRect(x + 6 * s, y - 20 * s, 14 * s, 40 * s); if (sh) { ctx.fillStyle = "#300"; ctx.beginPath(); ctx.ellipse(x, y - 128 * s, 8 * s, 12 * s, 0, 0, 7); ctx.fill(); ctx.fillStyle = "#eee"; for (let i = -2; i < 3; i++) ctx.fillRect(x + i * 3 * s - s, y - 139 * s, 2 * s, 4 * s); }
  ctx.shadowColor = "#f00"; ctx.shadowBlur = 14; ctx.fillStyle = "#f22"; ctx.fillRect(x - 9 * s, y - 142 * s, 7 * s, 4 * s); ctx.fillRect(x + 3 * s, y - 142 * s, 7 * s, 4 * s); ctx.shadowBlur = 0;
  ctx.strokeStyle = "#050505"; ctx.lineWidth = 12 * s; ctx.beginPath(); ctx.moveTo(x + 22 * s, y - 100 * s); ctx.lineTo(x + 46 * s, y - 60 * s); ctx.stroke(); ctx.fillStyle = "#c8ccd0"; ctx.beginPath(); ctx.moveTo(x + 44 * s, y - 62 * s); ctx.lineTo(x + 52 * s, y - 62 * s); ctx.lineTo(x + 48 * s, y - 14 * s); ctx.fill(); ctx.fillStyle = "#a00"; ctx.fillRect(x + 47 * s, y - 40 * s, 3 * s, 20 * s);
}
function drawLockers() {
  const wg = ctx.createLinearGradient(0, 0, 0, 330); wg.addColorStop(0, "#1c2a2e"); wg.addColorStop(1, "#33474c"); ctx.fillStyle = wg; ctx.fillRect(0, 0, W, 330);
  const fg = ctx.createLinearGradient(0, 330, 0, 500); fg.addColorStop(0, "#22343a"); fg.addColorStop(1, "#4a6268"); ctx.fillStyle = fg; ctx.fillRect(0, 330, W, 170);
  ctx.strokeStyle = "rgba(0,0,0,.3)"; ctx.lineWidth = 1; for (let x = 0; x < W; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 330); ctx.stroke(); } for (let y = 330; y < H; y += 28) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); } for (let x = -400; x <= 1200; x += 70) { ctx.beginPath(); ctx.moveTo(400 + (x - 400) * .35, 330); ctx.lineTo(x, H); ctx.stroke(); }
  ctx.fillStyle = "rgba(255,255,255,.07)"; for (let k = 0; k < 8; k++) ctx.fillRect(75 + k * 85, 332, 40, 90);
  for (let i = 0; i < 8; i++) {
    const x = 60 + i * 85, y = 70, w = 76, h = 250, g = ctx.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, "#5a7078"); g.addColorStop(.5, "#8fa4ac"); g.addColorStop(1, "#4a5e66"); ctx.fillStyle = g; ctx.fillRect(x, y, w, h); ctx.strokeStyle = "#101820"; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = "rgba(0,0,0,.55)"; for (let v = 0; v < 6; v++) ctx.fillRect(x + 14, y + 14 + v * 7, w - 28, 3); ctx.fillStyle = "#111"; ctx.fillRect(x + w - 18, y + 120, 6, 24); ctx.fillStyle = "#d8d8c0"; ctx.fillRect(x + w / 2 - 9, y + 70, 18, 12); ctx.fillStyle = "#222"; ctx.font = "9px monospace"; ctx.textAlign = "center"; ctx.fillText(String(101 + i * 3), x + w / 2, y + 79);
    ctx.fillStyle = "rgba(110,50,20,.35)"; ctx.fillRect(x, y + h - 30 - sr(i) * 20, w, 30 + sr(i) * 20); ctx.strokeStyle = "rgba(0,0,0,.4)"; ctx.beginPath(); ctx.moveTo(x + 8 + sr(i + 5) * 30, y + 160); ctx.lineTo(x + 20 + sr(i + 6) * 30, y + 190); ctx.stroke();
    if (i === TAG) { ctx.strokeStyle = "#e01818"; ctx.fillStyle = "#e01818"; ctx.lineWidth = 5; ctx.lineCap = "round"; ctx.beginPath(); ctx.arc(x + 38, y + 170, 18, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x + 24, y + 160); ctx.lineTo(x + 52, y + 192); ctx.moveTo(x + 52, y + 160); ctx.lineTo(x + 24, y + 192); ctx.stroke(); ctx.lineWidth = 3; [[20, 190], [38, 192], [56, 188]].forEach(a => { ctx.beginPath(); ctx.moveTo(x + a[0], y + a[1]); ctx.lineTo(x + a[0], y + a[1] + 22 + sr(a[0]) * 14); ctx.stroke(); }); ctx.lineCap = "butt"; }
    if (lkNear === i && (lkS === 1 || lkS === 3)) txt("Z", x + w / 2, y - 12, 22, "#ffd27a");
  }
  [[110, 260], [480, 260]].forEach(a => { ctx.fillStyle = "#3a2a1a"; for (let k = 0; k < 4; k++) ctx.fillRect(a[0], 380 + k * 6, a[1], 5); ctx.fillStyle = "#222"; ctx.fillRect(a[0] + 10, 404, 8, 40); ctx.fillRect(a[0] + a[1] - 18, 404, 8, 40); });
  ctx.fillStyle = "#2a2e32"; ctx.fillRect(742, 120, 58, 210); ctx.fillStyle = "#555"; ctx.fillRect(748, 220, 46, 8); ctx.fillStyle = lkS >= 3 ? "#3fe08a" : "#16301f"; ctx.fillRect(744, 96, 54, 18); if (lkS >= 3) txt("SORTIE", 771, 105, 11, "#031");
  if (lkS === 3 && !lkKey) { ctx.fillStyle = "#ffd24a"; ctx.shadowColor = "#ffd24a"; ctx.shadowBlur = 12 + 6 * Math.sin(t * .15); ctx.beginPath(); ctx.arc(236, 386, 5, 0, 7); ctx.fill(); ctx.fillRect(240, 385, 16, 3); ctx.shadowBlur = 0; } if (lkS !== 2) person(lkx, lky, 1.5, true, (keys.ArrowLeft || keys.ArrowRight || keys.ArrowUp || keys.ArrowDown) ? t : 0);
  const fl = Math.random() < .05 ? .5 : 1; ctx.fillStyle = "rgba(0,0,0," + (.35 + (1 - fl) * .3) + ")"; ctx.fillRect(0, 0, W, H); vign(400, 250, 160, 520, .75);
  if (lkS === 1) { txt("Cache-toi dans le casier au tag rouge ! (← → et Z)", W / 2, 40, 18, "#ffd27a"); ctx.fillStyle = "#400"; ctx.fillRect(200, 62, 400, 8); ctx.fillStyle = tk > 420 ? "#f22" : "#c33"; ctx.fillRect(200, 62, 400 * Math.max(0, 1 - tk / 600), 8); }
  if (lkS === 2) {
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H); ctx.save(); ctx.beginPath(); for (let i = 0; i < 6; i++) ctx.rect(250, 120 + i * 40, 300, 14); ctx.clip();
    const cg = ctx.createLinearGradient(0, 100, 0, 400); cg.addColorStop(0, "#1e2e32"); cg.addColorStop(1, "#4a6a70"); ctx.fillStyle = cg; ctx.fillRect(200, 100, 400, 320); manKnife(lkMx, 470, 2.3, lkW > 100 && lkW < 260); ctx.restore();
    ctx.fillStyle = "rgba(160,0,0," + (.15 + .15 * Math.sin(t * .17)) + ")"; ctx.fillRect(0, 0, W, H); vign(400, 250, 100, 480, .9); txt("Tu retiens ton souffle...", W / 2, 470, 16, "#999");
  }
  if (lkS === 3) txt(lkKey ? "Tu as la clé. La porte de secours est tout à droite (Z)." : "Une clé brille sur le banc ! (↑ ↓ ← → puis Z)", W / 2, 40, 16, "#9fe9b0");
}
function lockerUpd() {
  if (lkS !== 2) { if (keys.ArrowLeft) lkx = Math.max(30, lkx - 2.4); if (keys.ArrowRight) lkx = Math.min(770, lkx + 2.4); if ((keys.ArrowLeft || keys.ArrowRight) && pt % 24 === 0) stepSnd(.3); }
  const li = Math.round((lkx - 98) / 85); lkNear = li >= 0 && li < 8 && Math.abs(lkx - (98 + li * 85)) < 44 ? li : -1;
  if (lkS === 0) { if (pt === 150) { doorSnd(); heavy(.9); noise(.4, 1, 700); lkS = 1; tk = 0; say("Une porte claque ! Quelqu’un arrive... Cache-toi dans le casier au tag rouge !", 6); } }
  else if (lkS === 1) {
    tk++; if (tk % 60 === 0) heart(); if (tk % 45 === 0) leafSnd(.2 + tk / 1200, (tk / 45) % 2 | 0);
    if (act && lkNear >= 0) { if (lkNear === TAG) { lkS = 2; pt = 0; doorSnd(); lkMx = 900; } else { drawerSnd(); say("Casier vide... ce n’est pas le bon !", 2); } }
    if (tk > 600) { scream(); alien(); jscare("Il t’a trouvé dans le vestiaire..."); }
  } else if (lkS === 2) {
    if (pt % 40 === 0) heart(); if (pt > 120) lkMx -= 4.2; if (pt > 100 && pt % 30 === 0) heavy(.45); if (pt === 110) growl();
    if (lkMx < -120) { lkS = 3; pt = 0; lkKey = true; doorSnd(); say("Il est parti. Dans le casier : une clé « SORTIE ». Va à la porte de secours, tout à droite (Z).", 7); }
  } else if (lkS === 3 && act) { if (lkx > 690) { doorSnd(); endTxt = "À suivre... (Chapitre 3)"; scene = "end"; } else say("La porte de secours est tout à droite.", 2); }
}
SC.push(["Piscine : minuit", 0, th => { rpool(); pst = 5; pt = 0; dark = 1; plx = -8.6; plz = 5.6; ply = .5; scene = "pool"; if (!th) music("cell"); }], ["Vestiaire : le casier", 0, th => { rpool(); pst = 6; pt = th ? 100 : 0; scene = "pool"; if (!th) music("cell"); }]);


// ===== SUITE : cri, vestiaire, couloir, parking, Grèce, île, cocon =====
let lkW = 0, lky = 440, sq = 0, sqt = 0, scp = 0, sbt = 0, ssw = 0, ssk = 0, sswd = 0, sbat = 0, srp = 0;
let vtTxt = "Jim (voix off) : Ça a commencé à mes 12 ans, à la piscine municipale.";
try { const a = new Audio("cri.mp3"); a.addEventListener("canplaythrough", () => { FILES.cri = a; }); } catch (e) {}
function alien() { if (FILES.cri) { FILES.cri.volume = vol; FILES.cri.currentTime = 0; FILES.cri.play().catch(() => {}); return; } alien0(); }
function manPath(d) { if (d < 1.7) return [9.3 - d, 12.7]; d -= 1.7; if (d < 8.2) return [7.6, 12.7 - d]; d -= 8.2; return [Math.max(-7.6, 7.6 - d), 4.5]; }
function bigMan(x, y, s, sh) {
  ctx.fillStyle = "#040404"; ctx.fillRect(x - 8 * s, y - 36 * s, 6 * s, 36 * s); ctx.fillRect(x + 2 * s, y - 36 * s, 6 * s, 36 * s); ctx.beginPath(); ctx.ellipse(x, y - 48 * s, 10 * s, 20 * s, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = "#040404"; ctx.lineWidth = 5 * s; ctx.beginPath(); ctx.moveTo(x - 9 * s, y - 62 * s); ctx.lineTo(x - 15 * s, y - 28 * s); ctx.moveTo(x + 9 * s, y - 62 * s); ctx.lineTo(x + 15 * s, y - 28 * s); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(x, y - 72 * s, 6.5 * s, 10 * s, 0, 0, 7); ctx.fill(); ctx.fillStyle = "#c8ccd0"; ctx.fillRect(x + 14 * s, y - 28 * s, 2 * s, 14 * s);
  ctx.shadowColor = "#f00"; ctx.shadowBlur = 10; ctx.fillStyle = "#f22"; ctx.fillRect(x - 4.5 * s, y - 75 * s, 3 * s, 1.6 * s); ctx.fillRect(x + 1.5 * s, y - 75 * s, 3 * s, 1.6 * s); ctx.shadowBlur = 0;
  if (sh) { ctx.fillStyle = "#400"; ctx.beginPath(); ctx.ellipse(x, y - 68 * s, 3.6 * s, 6 * s, 0, 0, 7); ctx.fill(); ctx.fillStyle = "#eee"; ctx.fillRect(x - 2 * s, y - 73.5 * s, 4 * s, s); ctx.fillRect(x - 2 * s, y - 63 * s, 4 * s, s); }
}
function lockerUpd2() {
  if (lkS !== 2) { if (keys.ArrowLeft) lkx = Math.max(30, lkx - 2.8); if (keys.ArrowRight) lkx = Math.min(770, lkx + 2.8); if (keys.ArrowUp) lky = Math.max(395, lky - 2.4); if (keys.ArrowDown) lky = Math.min(480, lky + 2.4); if ((keys.ArrowLeft || keys.ArrowRight || keys.ArrowUp || keys.ArrowDown) && pt % 22 === 0) stepSnd(.3); }
  const li = Math.round((lkx - 98) / 85); lkNear = li >= 0 && li < 8 && Math.abs(lkx - (98 + li * 85)) < 44 ? li : -1;
  if (lkS === 0) { if (pt === 150) { doorSnd(); heavy(.9); noise(.4, 1, 700); lkS = 1; tk = 0; say("Une porte claque ! Quelqu’un arrive... Cache-toi dans le casier au tag rouge !", 6); } }
  else if (lkS === 1) {
    tk++; if (tk % 60 === 0) heart(); if (tk % 45 === 0) leafSnd(.2 + tk / 1200, (tk / 45) % 2 | 0);
    if (act && lkNear >= 0) { if (lkNear === TAG) { lkS = 2; pt = 0; lkW = 0; doorSnd(); lkMx = 900; } else { drawerSnd(); say("Casier vide... ce n’est pas le bon !", 2); } }
    if (tk > 600) { scream(); alien(); jscare("Il t’a trouvé dans le vestiaire..."); }
  } else if (lkS === 2) {
    if (pt % 40 === 0) heart(); if (pt > 120) { if (lkMx > 400) lkMx -= 3.2; else { lkW++; if (lkW === 100) alien(); if (lkW > 330) lkMx -= 3.8; } }
    if (pt > 100 && pt % 30 === 0 && (lkMx > 400 || lkW > 330)) heavy(.45); if (pt === 110) growl();
    if (lkMx < -140) { lkS = 3; pt = 0; doorSnd(); say("Il est parti... Une clé brille sur le banc !", 6); }
  } else if (lkS === 3 && act) { if (!lkKey && Math.hypot(lkx - 248, lky - 386) < 75) { lkKey = true; drawerSnd(); say("Tu prends la clé. Va à la porte de secours, tout à droite (Z).", 5); } else if (lkKey && lkx > 690) startSeq(0); else say(lkKey ? "La porte de secours est tout à droite." : "La clé est sur le banc.", 2); }
}
const SM = ["cell", "cell", null, "ch2", "vortex", "pool", "cabin", "back", "back", "cell"];
function startSeq(i, adv) {
  if (i >= 10) { endTxt = "À suivre... (Chapitre 3)"; scene = "end"; music(null); return; }
  scene = "c2b"; sq = i; sqt = adv || 0; scp = 0; sbt = 0; ssw = 0; ssk = 0; sswd = 0; sbat = 0; srp = 0; sjump = 0; fo = 0; engine(false);
  vtTxt = i === 4 ? "Jim (voix off) : J’avais seize ans, sur une île de Grèce..." : "Jim (voix off) : Ça a commencé à mes 12 ans, à la piscine municipale."; music(SM[i]);
}
function updC2b() {
  sqt++; if (skip && ![1, 5, 8].includes(sq)) { startSeq(sq + 1); return; }
  if (sq === 0) { if (sqt === 30) tone(900, .05, "square", .1); if (sqt === 80) { tone(300, .3, "square", .2, -100); noise(.2, .6, 2500); } if (sqt === 130) doorSnd(); if (sqt > 180) startSeq(1); }
  else if (sq === 1) { if (keys.ArrowUp) { scp = Math.min(1, scp + .0016); if (sqt % 26 === 0) leafSnd(.25, (sqt / 26) % 2 | 0); } if (sqt % 70 === 0) heart(); if (scp > .5 && !sbat) { sbat = 1; sbt = 0; scream(); noise(.4, 1, 3000); } if (sbat === 1 && ++sbt > 70) sbat = 2; if (act && scp > .95) { doorSnd(); startSeq(2); } }
  else if (sq === 2) { if (sqt > 90) engine(true, 3 + Math.abs(Math.sin(sqt * .07)) * 5); if (sqt > 100 && sqt % 55 === 0) { tone(70 + Math.random() * 30, .4, "sawtooth", .14, 80); noise(.3, .2, 300); } if (sqt === 120) noise(.3, .6, 900); if (sqt > 260 && sqt < 420 && sqt % 20 === 0) leafSnd(.45, (sqt / 20) % 2 | 0); if (sqt > 520) startSeq(3); }
  else if (sq === 3) { if (sqt === 30) speak("Ce n’était que la première histoire, mon grand. Maintenant, je vais te raconter mon voyage sur une île de Grèce.", "old", .85); if (sqt > 520) startSeq(4); }
  else if (sq === 4) { if (sqt === 1) { noise(2, .2, 300); speak("J’avais seize ans, et je voulais me prouver quelque chose.", "old", .85); } if (sqt === 230) { noise(1.2, .5, 1500); tone(200, 1.2, "sine", .2, 800); } if (sqt > 330) startSeq(5); }
  else if (sq === 5) {
    const deep = ssw > .25;
    if (sqt === 40) { say("Jim : J’avais seize ans. Je voulais rejoindre la petite île à la nage.", 6); speak("J’avais seize ans. Je voulais rejoindre la petite île, à la nage.", "old", .85); }
    if (keys.ArrowUp) { ssw += deep ? .00125 : .0016; ssk = Math.max(0, ssk - 3); if (sqt % 26 === 0) noise(.25, .25, deep ? 900 : 700); }
    else if (deep) { ssk += 1.4; if (ssk > 110) { ssw = .25; ssk = 0; say("Tu coules ! Maintiens ↑ pour nager.", 3); } }
    if (ssw > .25 && !sswd) { sswd = 1; say("Tu n’as plus pied ! Maintiens ↑ pour nager, sinon tu coules.", 5); }
    if (ssw >= 1) startSeq(6);
  }
  else if (sq === 6) { if (sqt === 300) thunder(); if (sqt === 440) { tone(55, 1.6, "sine", .2, -10); noise(1, .3, 300); } if (sqt > 700) startSeq(7); }
  else if (sq === 7) { if (sqt === 190) { scream(); growl(); } if (sqt > 440) startSeq(8); }
  else if (sq === 8) { if (sjump > 0) { if (--sjump === 0) say("Demi-tour ! Cours, vite !", 3); return; } if (keys.ArrowUp) { srp++; fo += .015; if (srp % 14 === 0) leafSnd(.55, (srp / 14) % 2 | 0); } if (sqt % 80 === 0) growl(); if (srp === 150) { srp = 151; sjump = 80; scream(); growl(); noise(.5, 1, 3000); } if (srp > 330) startSeq(9); }
  else if (sq === 9) { if (sqt === 40) { noise(.5, 1, 400); tone(70, .6, "sawtooth", .2, -30); } if (sqt === 110) heavy(.9); if (sqt === 250) moan(); if (sqt > 440) startSeq(10); }
}
function drawC2b() {
  [drawLock, drawCorr, drawPark, drawHouseQ, drawVortexQ, drawSwim, drawIsl, drawForestQ, drawRunQ, drawCoc][sq]();
  const c = [sqt < 100 ? "Tu glisses la clé dans la serrure..." : "Clic. La porte de secours cède.", "", sqt < 120 ? "Dehors... le parking de la piscine. Un moteur gronde dans le noir." : sqt < 260 ? "Une voiture aux vitres teintées allume ses phares !" : "Tu t’enfuis dans les bois !", "", "", sswd ? "" : "↑ : avance dans l’eau", sqt < 200 ? "Tu atteins l’île et escalades les rochers..." : sqt < 430 ? "Tu es enfin sur l’herbe... mais les nuages arrivent. Il va bientôt pleuvoir." : "Des requins ! Impossible de repartir : tu dormiras ici.", sqt < 200 ? "La forêt est dense et sombre..." : sqt < 330 ? "Une créature mi-araignée, mi-oiseau !" : "Tu pars dans l’autre direction, vers la plage !", srp < 150 ? "↑ : cours vers la plage !" : srp < 230 ? "Elle t’attendait ! Demi-tour : continue de courir (↑) !" : "", sqt > 250 ? "Ce n’était pas un trou... c’est le cocon géant de l’araignée." : ""][sq];
  if (c) txt(c, W / 2, 470, 17, "#ddd");
}
function drawLock() {
  ctx.fillStyle = "#0a0e10"; ctx.fillRect(0, 0, W, H); ctx.fillStyle = "#3a4248"; ctx.fillRect(220, 40, 360, 420); ctx.fillStyle = "#2a3036"; for (let i = 0; i < 6; i++) ctx.fillRect(235, 60 + i * 66, 330, 3);
  ctx.fillStyle = "#6a7076"; ctx.beginPath(); ctx.arc(400, 250, 70, 0, 7); ctx.fill(); ctx.fillStyle = "#000"; ctx.beginPath(); ctx.arc(400, 240, 12, 0, 7); ctx.fill(); ctx.fillRect(396, 240, 8, 36);
  const k = Math.min(1, sqt / 70), r = sqt > 90 ? Math.min(1, (sqt - 90) / 40) * Math.PI / 2 : 0; ctx.save(); ctx.translate(400 + (1 - k) * 160, 252 - (1 - k) * 20); ctx.rotate(r); ctx.fillStyle = "#ffd24a"; ctx.beginPath(); ctx.arc(-26, 0, 10, 0, 7); ctx.fill(); ctx.fillRect(-18, -2, 36, 4); ctx.fillRect(10, 2, 4, 8); ctx.restore(); vign(400, 250, 160, 520, .7);
}
function drawCorr0() {
  ctx.fillStyle = "#1a2428"; ctx.fillRect(0, 0, W, H); ctx.fillStyle = "#26363a"; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(W, 0); ctx.lineTo(470, 215); ctx.lineTo(330, 215); ctx.fill();
  ctx.fillStyle = "#2c3e44"; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(330, 215); ctx.lineTo(330, 285); ctx.lineTo(0, 500); ctx.moveTo(W, 0); ctx.lineTo(470, 215); ctx.lineTo(470, 285); ctx.lineTo(W, 500); ctx.fill();
  ctx.fillStyle = "#3a5058"; ctx.beginPath(); ctx.moveTo(0, 500); ctx.lineTo(W, 500); ctx.lineTo(470, 285); ctx.lineTo(330, 285); ctx.fill();
  for (let i = 0; i < 8; i++) { const d = Math.pow((i / 8 + scp * 2) % 1, 2), y = 215 - d * 210, w = 20 + d * 220; ctx.fillStyle = "rgba(200,230,230," + (i % 3 ? .8 : (Math.random() < .5 ? .3 : .8)) + ")"; ctx.fillRect(400 - w / 2, y, w, 3 + d * 10); }
  ctx.fillStyle = "#bfffd0"; ctx.fillRect(400 - 6 - scp * 24, 250 - 12 - scp * 36, 12 + scp * 48, 24 + scp * 72);
  const gg = ctx.createRadialGradient(400, 250, 2, 400, 250, 40 + scp * 300); gg.addColorStop(0, "rgba(180,255,200," + (.35 + scp * .6) + ")"); gg.addColorStop(1, "rgba(180,255,200,0)"); ctx.fillStyle = gg; ctx.fillRect(0, 0, W, H);
  if (sbat === 0 && scp > .3) { ctx.fillStyle = "#000"; ctx.beginPath(); ctx.ellipse(400, 150, 10, 14, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.moveTo(390, 145); ctx.lineTo(372, 160); ctx.lineTo(392, 158); ctx.moveTo(410, 145); ctx.lineTo(428, 160); ctx.lineTo(408, 158); ctx.fill(); }
  if (sbat === 1) { const k = sbt / 70, f = Math.sin(sbt * 1.2) * 12; ctx.save(); ctx.translate(400, 150 + k * 130); ctx.scale(1 + k * 7, 1 + k * 7); ctx.fillStyle = "#050505"; ctx.beginPath(); ctx.ellipse(0, 0, 10, 14, 0, 0, 7); ctx.fill(); [-1, 1].forEach(sg => { ctx.beginPath(); ctx.moveTo(sg * 8, -4); ctx.quadraticCurveTo(sg * 40, -30 - f, sg * 62, 6 + f * .3); ctx.quadraticCurveTo(sg * 38, -4, sg * 28, 10); ctx.quadraticCurveTo(sg * 14, 0, sg * 6, 10); ctx.fill(); }); ctx.fillStyle = "#f22"; ctx.fillRect(-6, -6, 4, 3); ctx.fillRect(2, -6, 4, 3); ctx.fillStyle = "#fff"; ctx.fillRect(-4, 6, 2, 5); ctx.fillRect(2, 6, 2, 5); ctx.restore(); if (sbt < 8) { ctx.fillStyle = "rgba(255,255,255,.7)"; ctx.fillRect(0, 0, W, H); } }
  vign(400, 250, 160, 520, .6); txt(scp < .05 ? "↑ : avance dans le long couloir" : scp > .95 ? "Z : ouvrir la porte de secours" : "", W / 2, 440, 16, "#cfe");
}
function carTint(cx, cy, s, on) {
  ctx.fillStyle = "#0b0d11"; ctx.fillRect(cx - 80 * s, cy - 30 * s, 160 * s, 34 * s); ctx.beginPath(); ctx.moveTo(cx - 55 * s, cy - 30 * s); ctx.lineTo(cx - 38 * s, cy - 62 * s); ctx.lineTo(cx + 38 * s, cy - 62 * s); ctx.lineTo(cx + 55 * s, cy - 30 * s); ctx.fill();
  const g = ctx.createLinearGradient(cx - 40 * s, cy - 60 * s, cx + 40 * s, cy - 30 * s); g.addColorStop(0, "#1a2430"); g.addColorStop(.5, "#02030a"); g.addColorStop(1, "#10161e"); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(cx - 48 * s, cy - 32 * s); ctx.lineTo(cx - 34 * s, cy - 58 * s); ctx.lineTo(cx + 34 * s, cy - 58 * s); ctx.lineTo(cx + 48 * s, cy - 32 * s); ctx.fill();
  ctx.fillStyle = "#000"; [-52, 52].forEach(x => { ctx.beginPath(); ctx.arc(cx + x * s, cy + 4 * s, 13 * s, 0, 7); ctx.fill(); });
  ctx.fillStyle = on ? "#fffbe0" : "#2a2a30"; if (on) { ctx.shadowColor = "#fff"; ctx.shadowBlur = 30; } [-58, 58].forEach(x => { ctx.beginPath(); ctx.ellipse(cx + x * s, cy - 14 * s, 10 * s, 6 * s, 0, 0, 7); ctx.fill(); }); ctx.shadowBlur = 0;
}
function drawPark() {
  const g = ctx.createLinearGradient(0, 0, 0, 260); g.addColorStop(0, "#03060e"); g.addColorStop(1, "#10182a"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, 260); ctx.fillStyle = "#e8e4cc"; ctx.beginPath(); ctx.arc(660, 60, 22, 0, 7); ctx.fill();
  ctx.fillStyle = "#050a06"; for (let i = 0; i < 12; i++) { ctx.beginPath(); ctx.moveTo(430 + i * 34, 150 + sr(i) * 30); ctx.lineTo(410 + i * 34, 270); ctx.lineTo(450 + i * 34, 270); ctx.fill(); }
  ctx.fillStyle = "#14181c"; ctx.fillRect(0, 262, W, 238); ctx.strokeStyle = "rgba(200,200,200,.5)"; ctx.lineWidth = 3; for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.moveTo(40 + i * 105, 500); ctx.lineTo(300 + i * 28, 262); ctx.stroke(); }
  ctx.fillStyle = "#2a3238"; ctx.fillRect(0, 110, 300, 170); ctx.fillStyle = "#1a2024"; ctx.fillRect(0, 100, 300, 12); ctx.fillStyle = "#3fe08a"; ctx.fillRect(210, 170, 50, 110); txt("PISCINE MUNICIPALE", 120, 140, 13, "#8cf");
  [90, 330, 600].forEach(x => { ctx.fillStyle = "#222"; ctx.fillRect(x, 110, 5, 170); const lg = ctx.createRadialGradient(x + 2, 112, 2, x + 2, 112, 110); lg.addColorStop(0, "rgba(255,220,150,.5)"); lg.addColorStop(1, "rgba(255,220,150,0)"); ctx.fillStyle = lg; ctx.fillRect(x - 110, 0, 220, 260); });
  const on = sqt > 120; carProf(180, 372, 1.3, on);
  if (on) { const a = Math.min(1, (sqt - 120) / 20), bg = ctx.createLinearGradient(281, 0, 800, 0); bg.addColorStop(0, "rgba(255,250,210," + .5 * a + ")"); bg.addColorStop(1, "rgba(255,250,210,0)"); ctx.fillStyle = bg; ctx.beginPath(); ctx.moveTo(281, 346); ctx.lineTo(281, 358); ctx.lineTo(800, 440); ctx.lineTo(800, 290); ctx.fill(); if (sqt < 130) { ctx.fillStyle = "rgba(255,255,255,.5)"; ctx.fillRect(0, 0, W, H); } }
  if (sqt < 240) person(235 + sqt * .45, 450, 1.5, true, sqt); else { const r = sqt - 240; person(343 + r * 2.0, 450 - r * .35, Math.max(.35, 1.5 - r * .004), true, sqt * 1.5); }
  vign(400, 250, 200, 520, .6);
}
function drawHouseQ() { c2 = 1900; drawCh2(); sub(sqt < 250 ? "Ce n’était que la première histoire, mon grand." : "Maintenant, je vais te raconter mon voyage sur une île de Grèce.", "Jim : "); }
function drawVortexQ() { vt = sqt; drawVortex(); }
function drawSwim() {
  const g = ctx.createLinearGradient(0, 0, 0, 230); g.addColorStop(0, "#3a7ac8"); g.addColorStop(1, "#c8e0f0"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, 230);
  ctx.fillStyle = "#fff"; ctx.globalAlpha = .8; [[120, 60, 70], [430, 40, 90], [660, 90, 60]].forEach(a => { ctx.beginPath(); ctx.ellipse(a[0] + t * .02 % 40, a[1], a[2], 16, 0, 0, 7); ctx.fill(); }); ctx.globalAlpha = 1;
  const sg = ctx.createLinearGradient(0, 230, 0, 500); sg.addColorStop(0, "#2a9ab8"); sg.addColorStop(1, "#0a4a6a"); ctx.fillStyle = sg; ctx.fillRect(0, 230, W, 270);
  const k = 1 + ssw * 3.2, ix = 620 - ssw * 120, iy = 232; ctx.fillStyle = "#2a3a2a"; ctx.beginPath(); ctx.moveTo(ix - 60 * k, iy); ctx.quadraticCurveTo(ix - 20 * k, iy - 40 * k, ix, iy - 46 * k); ctx.quadraticCurveTo(ix + 30 * k, iy - 30 * k, ix + 70 * k, iy); ctx.fill(); ctx.fillStyle = "#5a5a52"; ctx.fillRect(ix - 60 * k, iy - 4 * k, 130 * k, 4 * k);
  ctx.strokeStyle = "rgba(255,255,255,.3)"; ctx.lineWidth = 1; for (let i = 0; i < 26; i++) { const y = 240 + i * i * .4, x = ((i * 97 + t * (.3 + i * .05)) % 900) - 50; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 20, y - 3, x + 40, y); ctx.stroke(); }
  const sa = Math.max(0, 1 - ssw * 4); if (sa > 0) { ctx.fillStyle = "#d8c08a"; ctx.beginPath(); ctx.moveTo(0, 500); ctx.lineTo(0, 400 + (1 - sa) * 100); ctx.quadraticCurveTo(400, 380 + (1 - sa) * 120, 800, 400 + (1 - sa) * 100); ctx.lineTo(800, 500); ctx.fill(); }
  const jy = 440 - ssw * 70 + ssk * .4, deep = ssw > .25;
  if (!deep) { person(400, jy, 1.6, true, keys.ArrowUp ? t : 0); if (ssw > 0) { ctx.fillStyle = "rgba(40,160,190,.55)"; ctx.fillRect(300, jy - 14, 200, 60); } }
  else { ctx.fillStyle = "#d8b090"; ctx.beginPath(); ctx.arc(400, jy - 10, 16, 0, 7); ctx.fill(); ctx.fillStyle = "#6a1410"; ctx.fillRect(386, jy - 26, 28, 8); ctx.strokeStyle = "#d8b090"; ctx.lineWidth = 9; ctx.lineCap = "round"; const a = keys.ArrowUp ? Math.sin(t * .25) * 40 : 5; ctx.beginPath(); ctx.moveTo(380, jy + 6); ctx.lineTo(350 - a, jy - 10 + a * .5); ctx.moveTo(420, jy + 6); ctx.lineTo(450 + a, jy - 10 - a * .5); ctx.stroke(); ctx.lineCap = "butt"; ctx.fillStyle = "rgba(20,120,150,.6)"; ctx.fillRect(320, jy + 4, 160, 70); if (ssk > 0) { ctx.fillStyle = "rgba(255,255,255,.5)"; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(390 + i * 8, jy - ssk * .6 - i * 8, 3, 0, 7); ctx.fill(); } } }
  vign(400, 250, 200, 520, .4);
}
function drawIsl() {
  const p = sqt, d = Math.min(1, Math.max(0, (p - 180) / 260));
  ctx.fillStyle = "rgb(" + (90 - d * 65 | 0) + "," + (150 - d * 105 | 0) + "," + (210 - d * 140 | 0) + ")"; ctx.fillRect(0, 0, W, 300);
  for (let k = 0; k < 9; k++) { const c = 200 - d * 150 | 0; ctx.fillStyle = "rgba(" + c + "," + c + "," + (c + 10) + "," + (.5 + d * .4) + ")"; ctx.beginPath(); ctx.ellipse((k * 110 + p * .1) % 900 - 50, 60 + (k % 3) * 40 + d * 30, 70 + d * 40, 22 + d * 14, 0, 0, 7); ctx.fill(); }
  ctx.fillStyle = "#12607a"; ctx.fillRect(0, 300, W, 200);
  if (p > 420) for (let k = 0; k < 4; k++) { const x = 100 + k * 200 + Math.sin(t * .02 + k) * 70, y = 306 + k * 9; ctx.fillStyle = "#3a4650"; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 14, y - 26); ctx.lineTo(x + 30, y); ctx.fill(); ctx.strokeStyle = "rgba(255,255,255,.4)"; ctx.beginPath(); ctx.moveTo(x - 30, y + 2); ctx.lineTo(x, y); ctx.moveTo(x + 30, y); ctx.lineTo(x + 60, y + 2); ctx.stroke(); }
  ctx.fillStyle = "#46463f"; ctx.beginPath(); ctx.moveTo(0, 500); ctx.lineTo(0, 330); for (let i = 0; i < 12; i++) ctx.lineTo(i * 70 + 30, 300 + sr(i) * 60 + (i % 2) * 30); ctx.lineTo(800, 350); ctx.lineTo(800, 500); ctx.fill();
  ctx.fillStyle = "#2c2c28"; for (let i = 0; i < 14; i++) { ctx.beginPath(); ctx.ellipse(sr(i + 30) * 800, 380 + sr(i + 40) * 110, 30 + sr(i) * 40, 14 + sr(i + 2) * 16, 0, 0, 7); ctx.fill(); }
  grassIsl(p); const jy = p < 200 ? 470 - p / 200 * 90 : 380; person(400 + (p < 200 ? Math.sin(p * .1) * 12 : 0), jy, 1.4, true, p < 200 ? p * 1.5 : 0);
  ctx.fillStyle = "rgba(0,0,30," + d * .4 + ")"; ctx.fillRect(0, 0, W, H); vign(400, 250, 200, 520, .5); if (p > 640) { ctx.fillStyle = "rgba(0,0,0," + (p - 640) / 60 + ")"; ctx.fillRect(0, 0, W, H); }
}
function bug(x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.strokeStyle = "#0c0806"; ctx.lineWidth = 7; ctx.lineCap = "round";
  for (let i = 0; i < 8; i++) { const sg = i % 2 ? 1 : -1, lv = i >> 1, w = Math.sin(t * .1 + i) * 6; ctx.beginPath(); ctx.moveTo(sg * 14, -10 + lv * 10); ctx.lineTo(sg * (60 + lv * 8), -50 + lv * 22 + w); ctx.lineTo(sg * (80 + lv * 12), 40 + lv * 8); ctx.stroke(); }
  [-1, 1].forEach(sg => { ctx.fillStyle = "#1a1410"; ctx.beginPath(); ctx.moveTo(sg * 10, -40); ctx.quadraticCurveTo(sg * 120, -120 + Math.sin(t * .15) * 14, sg * 140, -30); ctx.quadraticCurveTo(sg * 80, -50, sg * 10, -10); ctx.fill(); });
  ctx.fillStyle = "#120c08"; ctx.beginPath(); ctx.ellipse(0, 0, 30, 40, 0, 0, 7); ctx.fill(); ctx.strokeStyle = "#2a1c12"; ctx.lineWidth = 1.5; for (let i = 0; i < 50; i++) { const a = i * .5, r = sr(i); ctx.beginPath(); ctx.moveTo(Math.cos(a) * 28 * r, Math.sin(a) * 36 * r); ctx.lineTo(Math.cos(a) * 34 * (r + .2), Math.sin(a) * 44 * (r + .2)); ctx.stroke(); }
  ctx.fillStyle = "#1a110b"; ctx.beginPath(); ctx.arc(0, -46, 18, 0, 7); ctx.fill(); ctx.fillStyle = "#6a5a2a"; ctx.beginPath(); ctx.moveTo(-6, -40); ctx.lineTo(6, -40); ctx.lineTo(0, -22); ctx.fill();
  ctx.shadowColor = "#f00"; ctx.shadowBlur = 10; ctx.fillStyle = "#f22"; [-8, -3, 3, 8].forEach((x, i) => { ctx.beginPath(); ctx.arc(x * 1.1, -52 + (i % 2) * 4, 2.2, 0, 7); ctx.fill(); }); ctx.shadowBlur = 0;
  ctx.fillStyle = "#eee"; [-9, 9].forEach(x => { ctx.beginPath(); ctx.moveTo(x - 3, -34); ctx.lineTo(x + 3, -34); ctx.lineTo(x + (x < 0 ? 3 : -3), -12); ctx.fill(); }); ctx.restore();
}
function drawForestQ() { const run = sqt > 330, f = run ? fo + (sqt - 330) * .01 : .3; ctx.save(); if (run) { ctx.translate(W, 0); ctx.scale(-1, 1); } road(false, f); forest(f, 36, 0); ctx.fillStyle = "rgba(0,0,0,.55)"; ctx.fillRect(0, 0, W, H); const k = Math.min(1, Math.max(0, (sqt - 190) / 190)); if (sqt > 160) bug(400, 260 + k * 60, run ? Math.max(.4, 1.9 - (sqt - 330) * .03) : .3 + k * 1.6); ctx.restore(); vign(400, 250, 150, 520, .85); }
function drawRunQ() { const mir = srp > 150; ctx.save(); if (mir) { ctx.translate(W, 0); ctx.scale(-1, 1); } road(false, fo); forest(fo, 40, 0); ctx.fillStyle = "rgba(0,0,0,.6)"; ctx.fillRect(0, 0, W, H); if (!mir) { const k = srp / 150; ctx.fillStyle = "rgba(200,230,255," + (.3 + .5 * k) + ")"; ctx.fillRect(390 - k * 60, 230 - k * 30, 20 + k * 120, 40 + k * 60); ctx.fillStyle = "rgba(60,150,190," + .6 * k + ")"; ctx.fillRect(392 - k * 50, 262 - k * 10, 16 + k * 100, 16 + k * 30); } if (sjump > 0) { bug(400, 250, .5 + (1 - sjump / 80) * 3.2); if (sjump > 72) { ctx.fillStyle = "rgba(255,255,255,.6)"; ctx.fillRect(0, 0, W, H); } } else if (mir) bug(400 + Math.sin(t * .05) * 60, 200, .5 + Math.sin(t * .08) * .05); ctx.restore(); vign(400, 300, 150, 520, .9); }
function drawCoc() {
  const p = sqt;
  if (p < 110) { road(false, fo); forest(fo, 30, 0); ctx.fillStyle = "rgba(0,0,0,.5)"; ctx.fillRect(0, 0, W, H); const k = Math.min(1, p / 70); ctx.fillStyle = "#000"; ctx.beginPath(); ctx.ellipse(400, 340, 40 + k * 460, 12 + k * 260, 0, 0, 7); ctx.fill(); if (p > 70) { ctx.fillStyle = "rgba(0,0,0," + Math.min(1, (p - 70) / 30) + ")"; ctx.fillRect(0, 0, W, H); } return; }
  const g = ctx.createRadialGradient(400, 250, 40, 400, 250, 480); g.addColorStop(0, "#d8d4be"); g.addColorStop(1, "#3a382c"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "rgba(255,255,255,.55)"; ctx.lineWidth = 1.5; for (let i = 0; i < 70; i++) { const a = sr(i) * W, b = sr(i + 80) * H, c = sr(i + 160) * W, d = sr(i + 240) * H; ctx.beginPath(); ctx.moveTo(a, b); ctx.quadraticCurveTo((a + c) / 2 + Math.sin(t * .02 + i) * 10, (b + d) / 2 + 20, c, d); ctx.stroke(); }
  ctx.strokeStyle = "rgba(80,76,58,.5)"; ctx.lineWidth = 6; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.ellipse(400, 250, 120 + i * 80 + Math.sin(t * .03) * 6, 90 + i * 60, 0, 0, 7); ctx.stroke(); }
  ctx.fillStyle = "rgba(230,226,205,.8)"; [[120, 380, 30], [680, 400, 40], [560, 120, 26], [210, 110, 22]].forEach(a => { ctx.beginPath(); ctx.ellipse(a[0], a[1], a[2], a[2] * 1.3, 0, 0, 7); ctx.fill(); });
  ctx.save(); ctx.translate(400, 400); ctx.rotate(-1.4); person(0, 0, 1.2, false, 0, true); ctx.restore(); vign(400, 250, 140, 520, .8);
}
SC.push(["Couloir de sortie", 0, th => startSeq(1, th ? 200 : 0)], ["Parking", 0, th => startSeq(2, th ? 200 : 0)], ["Maison : la Grèce", 0, th => startSeq(3, th ? 100 : 0)], ["Plage : la nage", 0, th => startSeq(5, th ? 300 : 0)], ["Île : requins", 0, th => startSeq(6, th ? 500 : 0)], ["Forêt : la créature", 0, th => startSeq(7, th ? 300 : 0)], ["Le cocon", 0, th => startSeq(9, th ? 300 : 0)]);


// ===== RETOUCHES : feuilles, prix, panique, couloir, voiture, île =====
let sjump = 0;
function leafPile(cx, base, rw, hh, seed) {
  const pal = ["#7a3a14", "#a85a1c", "#5a2a10", "#8a6a20", "#b8742a", "#6a4a1a", "#9a4a1a", "#c89030"];
  ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.beginPath(); ctx.ellipse(cx, base + 4, rw * 1.05, rw * .14 + 4, 0, 0, 7); ctx.fill();
  const n = Math.min(520, 160 + (rw | 0)), L = [];
  for (let i = 0; i < n; i++) { const u = sr(i * 3 + seed) * 2 - 1, f = sr(i * 7 + seed + 1), prof = Math.pow(Math.max(0, 1 - u * u), .75) * hh * 1.7; L.push({ x: cx + u * rw, y: base - prof * Math.pow(f, .8), a: sr(i * 5 + seed + 2) * 6.28, c: i % 8, h: f }); }
  L.sort((a, b) => a.y - b.y); const s0 = 7 + rw * .028;
  L.forEach(l => {
    const s2 = s0 * (.7 + sr(l.x + l.y) * .7); ctx.save(); ctx.translate(l.x, l.y); ctx.rotate(l.a); ctx.fillStyle = pal[l.c]; ctx.beginPath(); ctx.moveTo(-s2, 0); ctx.quadraticCurveTo(0, -s2 * .62, s2, 0); ctx.quadraticCurveTo(0, s2 * .5, -s2, 0); ctx.fill();
    ctx.fillStyle = "rgba(0,0,0," + .5 * (1 - l.h) + ")"; ctx.fill(); if (l.h > .75) { ctx.fillStyle = "rgba(255,220,150,.12)"; ctx.fill(); }
    ctx.strokeStyle = "rgba(30,15,5,.55)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-s2, 0); ctx.lineTo(s2, 0); ctx.moveTo(-s2 * .2, 0); ctx.lineTo(s2 * .2, -s2 * .22); ctx.moveTo(s2 * .1, 0); ctx.lineTo(s2 * .5, s2 * .2); ctx.stroke(); ctx.restore();
  });
}
function priceBoard() {
  ctx.fillStyle = "#0a0c10"; ctx.fillRect(500, 14, 284, 112); ctx.strokeStyle = "#c8c8cc"; ctx.lineWidth = 3; ctx.strokeRect(500, 14, 284, 112); ctx.fillStyle = "#d22"; ctx.fillRect(500, 14, 284, 22); txt("STATION · PRIX", 642, 25, 13, "#fff");
  [["SP95", "3 € le litre", "#ffd24a"], ["Électricité", "5 € le litre", "#6fe0ff"], ["Menu tacos Bodrum étudiant", "12 €", "#ff9a5a"]].forEach((a, i) => { ctx.font = "13px Georgia"; ctx.textBaseline = "middle"; ctx.fillStyle = "#e8dcc8"; ctx.textAlign = "left"; ctx.fillText(a[0], 512, 56 + i * 28); ctx.fillStyle = a[2]; ctx.textAlign = "right"; ctx.fillText(a[1], 772, 56 + i * 28); }); ctx.textAlign = "center";
}
function drawPool() {
  drawPool0(); if (!(pst === 2 || (pst === 1 && pt > 120))) return;
  const p = .5 + .5 * Math.sin(t * .25), g = ctx.createRadialGradient(400, 250, 180, 400, 250, 460); g.addColorStop(0, "rgba(120,0,0,0)"); g.addColorStop(1, "rgba(160,0,0," + (.35 + .3 * p) + ")"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  txt("CACHE-TOI !", W / 2, 70, 34, "rgb(255," + (60 + p * 60 | 0) + ",40)");
  const dx = -9.9 - plx, dz = 4.7 - plz, cx = dx * Math.cos(ply) - dz * Math.sin(ply), cz = dx * Math.sin(ply) + dz * Math.cos(ply), d = Math.hypot(dx, dz), near = Math.hypot(plx + 9, plz - 5) < 2.6, inW = Math.abs(plx) < 6 && plz > 6 && plz < 24;
  ctx.save(); ctx.translate(400, 410); ctx.rotate(Math.atan2(cx, cz)); ctx.fillStyle = "#ffd24a"; ctx.beginPath(); ctx.moveTo(0, -36); ctx.lineTo(22, 10); ctx.lineTo(0, 0); ctx.lineTo(-22, 10); ctx.fill(); ctx.restore();
  txt(near ? "Z : TE CACHER DANS LE PLACARD !" : inW ? "1. Z : sors de l’eau   2. Suis la flèche jusqu’au placard" : "Suis la flèche : placard à " + d.toFixed(0) + " m (mur de gauche)", W / 2, 462, 17, "#ffd24a");
}
function drawCorr() {
  const L = d => 330 - d * 330, R = d => 470 + d * 330, T = d => 215 - d * 215, B = d => 285 + d * 215, sp = (i, n, m) => Math.pow(((i / n) + scp * m) % 1, 2);
  ctx.fillStyle = "#141c20"; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#222e32"; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(W, 0); ctx.lineTo(470, 215); ctx.lineTo(330, 215); ctx.fill();
  ctx.fillStyle = "#3a4a4a"; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(330, 215); ctx.lineTo(330, 255.6); ctx.lineTo(0, 290); ctx.moveTo(W, 0); ctx.lineTo(470, 215); ctx.lineTo(470, 255.6); ctx.lineTo(W, 290); ctx.fill();
  ctx.fillStyle = "#27403c"; ctx.beginPath(); ctx.moveTo(0, 290); ctx.lineTo(330, 255.6); ctx.lineTo(330, 285); ctx.lineTo(0, 500); ctx.moveTo(W, 290); ctx.lineTo(470, 255.6); ctx.lineTo(470, 285); ctx.lineTo(W, 500); ctx.fill();
  const fg = ctx.createLinearGradient(0, 285, 0, 500); fg.addColorStop(0, "#2c3c42"); fg.addColorStop(1, "#5a7078"); ctx.fillStyle = fg; ctx.beginPath(); ctx.moveTo(0, 500); ctx.lineTo(W, 500); ctx.lineTo(470, 285); ctx.lineTo(330, 285); ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,.35)"; ctx.lineWidth = 1; for (let x = 0; x <= 800; x += 100) { ctx.beginPath(); ctx.moveTo(x, 500); ctx.lineTo(330 + x / 800 * 140, 285); ctx.stroke(); }
  for (let i = 0; i < 12; i++) { const d = sp(i, 12, 2); ctx.beginPath(); ctx.moveTo(L(d), B(d)); ctx.lineTo(R(d), B(d)); ctx.stroke(); const ys = T(d) + (B(d) - T(d)) * .58; ctx.beginPath(); ctx.moveTo(L(d), ys); ctx.lineTo(L(d), B(d)); ctx.moveTo(R(d), ys); ctx.lineTo(R(d), B(d)); ctx.stroke(); }
  ctx.strokeStyle = "#4a5a5e"; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(150, 0); ctx.lineTo(360, 215); ctx.moveTo(650, 0); ctx.lineTo(440, 215); ctx.stroke(); ctx.strokeStyle = "#7a8a8e"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(148, 0); ctx.lineTo(358, 215); ctx.moveTo(648, 0); ctx.lineTo(438, 215); ctx.stroke();
  for (let i = 0; i < 5; i++) [-1, 1].forEach(sg => { const d0 = sp(i + (sg > 0 ? .5 : 0), 5, 1.1); if (d0 > .93) return; const d1 = Math.min(1, d0 * 1.3 + .015), X = sg < 0 ? L : R, yt = d => T(d) + (B(d) - T(d)) * .2;
    ctx.fillStyle = "#43555a"; ctx.beginPath(); ctx.moveTo(X(d0), yt(d0)); ctx.lineTo(X(d1), yt(d1)); ctx.lineTo(X(d1), B(d1)); ctx.lineTo(X(d0), B(d0)); ctx.fill(); ctx.strokeStyle = "#1a2426"; ctx.lineWidth = 2; ctx.stroke();
    const w0 = X(d0) + (X(d1) - X(d0)) * .3, w1 = X(d0) + (X(d1) - X(d0)) * .7, a0 = yt(d0) + (B(d0) - yt(d0)) * .12, a1 = yt(d1) + (B(d1) - yt(d1)) * .12, b0 = yt(d0) + (B(d0) - yt(d0)) * .4, b1 = yt(d1) + (B(d1) - yt(d1)) * .4;
    ctx.fillStyle = "rgba(160,200,200,.28)"; ctx.beginPath(); ctx.moveTo(w0, a0 + (a1 - a0) * .3); ctx.lineTo(w1, a0 + (a1 - a0) * .7); ctx.lineTo(w1, b0 + (b1 - b0) * .7); ctx.lineTo(w0, b0 + (b1 - b0) * .3); ctx.fill(); });
  const de = sp(2, 5, 1.1) < .9 ? sp(2, 5, 1.1) : 0; if (de) { ctx.fillStyle = "#c22"; ctx.fillRect(L(de) + 2, B(de) - (B(de) - T(de)) * .45, 6 + de * 18, (B(de) - T(de)) * .16); }
  for (let i = 0; i < 8; i++) { const d = sp(i, 8, 2), y = T(d), w = 20 + d * 220, fl = i % 3 === 0 && Math.random() < .3 ? .25 : .9; ctx.fillStyle = "rgba(210,235,235," + fl + ")"; ctx.fillRect(400 - w / 2, y, w, 3 + d * 10); ctx.fillStyle = "rgba(220,255,250," + .1 * fl + ")"; ctx.beginPath(); ctx.ellipse(400, B(d) - 4, 60 + d * 220, 4 + d * 22, 0, 0, 7); ctx.fill(); }
  ctx.fillStyle = "#bfffd0"; ctx.fillRect(400 - 6 - scp * 24, 250 - 12 - scp * 36, 12 + scp * 48, 24 + scp * 72);
  const gg = ctx.createRadialGradient(400, 250, 2, 400, 250, 40 + scp * 300); gg.addColorStop(0, "rgba(180,255,200," + (.35 + scp * .6) + ")"); gg.addColorStop(1, "rgba(180,255,200,0)"); ctx.fillStyle = gg; ctx.fillRect(0, 0, W, H);
  if (sbat === 0 && scp > .3) { ctx.fillStyle = "#000"; ctx.beginPath(); ctx.ellipse(400, 150, 10, 14, 0, 0, 7); ctx.fill(); ctx.beginPath(); ctx.moveTo(390, 145); ctx.lineTo(372, 160); ctx.lineTo(392, 158); ctx.moveTo(410, 145); ctx.lineTo(428, 160); ctx.lineTo(408, 158); ctx.fill(); }
  if (sbat === 1) { const k = sbt / 70, f = Math.sin(sbt * 1.2) * 12; ctx.save(); ctx.translate(400, 150 + k * 130); ctx.scale(1 + k * 7, 1 + k * 7); ctx.fillStyle = "#050505"; ctx.beginPath(); ctx.ellipse(0, 0, 10, 14, 0, 0, 7); ctx.fill(); [-1, 1].forEach(sg => { ctx.beginPath(); ctx.moveTo(sg * 8, -4); ctx.quadraticCurveTo(sg * 40, -30 - f, sg * 62, 6 + f * .3); ctx.quadraticCurveTo(sg * 38, -4, sg * 28, 10); ctx.quadraticCurveTo(sg * 14, 0, sg * 6, 10); ctx.fill(); }); ctx.fillStyle = "#f22"; ctx.fillRect(-6, -6, 4, 3); ctx.fillRect(2, -6, 4, 3); ctx.fillStyle = "#fff"; ctx.fillRect(-4, 6, 2, 5); ctx.fillRect(2, 6, 2, 5); ctx.restore(); if (sbt < 8) { ctx.fillStyle = "rgba(255,255,255,.7)"; ctx.fillRect(0, 0, W, H); } }
  for (let i = 0; i < 20; i++) { ctx.fillStyle = "rgba(220,230,220," + (.1 + .1 * Math.sin(t * .03 + i)) + ")"; ctx.fillRect((sr(i + 50) * W + t * .2) % W, (sr(i + 60) * H + t * .1 * sr(i)) % H, 1.5, 1.5); }
  vign(400, 250, 160, 520, .6); txt(scp < .05 ? "↑ : avance dans le long couloir" : scp > .95 ? "Z : ouvrir la porte de secours" : "", W / 2, 440, 16, "#cfe");
}
function carProf(cx, cy, s, on) {
  const v = sqt > 100 ? Math.sin(sqt * .9) * 1.2 * s : 0; ctx.save(); ctx.translate(cx + v * .3, cy + v * .4); ctx.scale(s, s);
  ctx.fillStyle = "rgba(0,0,0,.45)"; ctx.beginPath(); ctx.ellipse(0, 26, 110, 10, 0, 0, 7); ctx.fill();
  ctx.fillStyle = "#0b0d11"; ctx.beginPath(); ctx.moveTo(-105, 10); ctx.lineTo(-105, -18); ctx.quadraticCurveTo(-100, -28, -70, -30); ctx.lineTo(-40, -32); ctx.lineTo(-22, -58); ctx.lineTo(38, -58); ctx.lineTo(66, -32); ctx.lineTo(96, -26); ctx.quadraticCurveTo(108, -22, 108, -6); ctx.lineTo(108, 10); ctx.closePath(); ctx.fill();
  const g = ctx.createLinearGradient(-30, -56, 50, -32); g.addColorStop(0, "#202c38"); g.addColorStop(.45, "#020309"); g.addColorStop(1, "#141c26"); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-36, -34); ctx.lineTo(-20, -55); ctx.lineTo(0, -55); ctx.lineTo(0, -34); ctx.fill(); ctx.beginPath(); ctx.moveTo(6, -34); ctx.lineTo(6, -55); ctx.lineTo(36, -55); ctx.lineTo(60, -34); ctx.fill();
  ctx.strokeStyle = "rgba(180,200,230,.25)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(12, -52); ctx.lineTo(28, -38); ctx.stroke();
  ctx.strokeStyle = "#1c2026"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(3, -34); ctx.lineTo(3, 8); ctx.moveTo(-60, -30); ctx.lineTo(-60, 8); ctx.stroke(); ctx.fillStyle = "#3a4048"; ctx.fillRect(-14, -26, 14, 3); ctx.fillRect(-105, 8, 213, 4); ctx.fillStyle = "rgba(140,160,190,.12)"; ctx.fillRect(-100, -20, 206, 3);
  ctx.fillStyle = "#8a0a0a"; ctx.fillRect(-108, -14, 6, 10); ctx.fillStyle = on ? "#fffbe0" : "#2a2a30"; if (on) { ctx.shadowColor = "#fff"; ctx.shadowBlur = 30; } ctx.beginPath(); ctx.ellipse(102, -12, 8, 5, 0, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
  [-66, 68].forEach(x => { ctx.fillStyle = "#050505"; ctx.beginPath(); ctx.arc(x, 12, 20, 0, 7); ctx.fill(); ctx.fillStyle = "#7a7e84"; ctx.beginPath(); ctx.arc(x, 12, 11, 0, 7); ctx.fill(); ctx.strokeStyle = "#2a2a2e"; ctx.lineWidth = 2; for (let i = 0; i < 5; i++) { const a = i * 1.256 + sqt * .4; ctx.beginPath(); ctx.moveTo(x, 12); ctx.lineTo(x + Math.cos(a) * 11, 12 + Math.sin(a) * 11); ctx.stroke(); } });
  ctx.restore(); if (sqt > 100) for (let k = 0; k < 8; k++) { const a = (sqt * 1.5 + k * 14) % 80; ctx.fillStyle = "rgba(150,150,150," + (.35 - a / 260) + ")"; ctx.beginPath(); ctx.arc(cx - 112 * s - a * 1.1, cy + 20 * s - a * .15 + Math.sin(a * .1 + k) * 3, 4 + a * .12, 0, 7); ctx.fill(); }
}
function grassIsl(p) {
  const a = Math.min(1, Math.max(0, (p - 150) / 50)); if (!a) return; ctx.save(); ctx.globalAlpha = a; const g = ctx.createLinearGradient(0, 330, 0, 500); g.addColorStop(0, "#3f7a2c"); g.addColorStop(1, "#1f4418"); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, 500); ctx.lineTo(0, 350); for (let x = 0; x <= 800; x += 40) ctx.lineTo(x, 340 + Math.sin(x * .03) * 8 + sr(x) * 8); ctx.lineTo(800, 500); ctx.fill();
  for (let i = 0; i < 260; i++) { const x = sr(i) * 800, y = 345 + sr(i + 9) * 155, h = 5 + (y - 340) * .07; ctx.strokeStyle = ["#2f6a22", "#4a8a30", "#3a7a28", "#6a9a3a"][i % 4]; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.sin(t * .04 + i) * 2, y - h); ctx.stroke(); }
  for (let i = 0; i < 14; i++) { ctx.fillStyle = i % 2 ? "#f4e870" : "#fff"; ctx.beginPath(); ctx.arc(sr(i + 300) * 800, 360 + sr(i + 310) * 130, 2.2, 0, 7); ctx.fill(); } ctx.restore();
}
function jailer(x, y, s, open, kf) {
  if (cli === 9 && cl > 80) { const f = Math.min(1, (cl - 80) / 50), gq = cl > 200 ? Math.min(1, (cl - 200) / 80) : 0; x -= gq * 70; y += f * 30 * s; ctx.save(); ctx.translate(x, y); ctx.rotate(f * 1.35 - gq * .5); ctx.translate(-x, -y); jailer0(x, y, s, open, kf); ctx.restore(); return; }
  jailer0(x, y, s, open, kf);
}

try { initAudio(); music("menu"); } catch (e) {}
["pointerdown", "keydown", "touchstart", "click"].forEach(ev => addEventListener(ev, () => { initAudio(); if (ac.state !== "running" && !paused) ac.resume(); $("hint").style.display = "none"; if (scene === "menu" && mus !== "menu") music("menu"); }));
loop();