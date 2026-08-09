/* SESSION v2 — HYROX gym logger · vanilla JS PWA
   New in v2: TODAY tab (pulls data/plan.json from the repo),
   GitHub sync (session logs committed to data/sessions/),
   settings (token, repo, sync status).
   Storage: jj-block-state / jj-sessions / jj-plan / jj-sync-cfg */

const SEED = {
  movements: [
    { id: "beltsquat", name: "Belt Squat", kg: 80, reps: 8, sets: 2, spinal: false },
    { id: "revlunge", name: "BB Reverse Lunge", kg: 45, reps: 6, sets: 2, spinal: true },
    { id: "rdl", name: "BB Romanian Deadlift", kg: 60, reps: 6, sets: 2, spinal: true },
    { id: "pullup", name: "Weighted Pull Up", kg: 3.8, reps: 6, sets: 2, spinal: false },
    { id: "press", name: "BB Shoulder Press", kg: 30, reps: 6, sets: 2, spinal: false },
    { id: "sledpush", name: "Sled Push (per 12.5m)", kg: 152, reps: 1, sets: 2, spinal: false },
    { id: "sledpull", name: "Sled Pull (per 12.5m)", kg: 103, reps: 1, sets: 2, spinal: true },
    { id: "wallball", name: "Wall Ball", kg: 6, reps: 12, sets: 2, spinal: false },
    { id: "kbcarry", name: "KB Farmers Carry (per 25m)", kg: 24, reps: 1, sets: 2, spinal: true },
    { id: "sblunge", name: "Sandbag Lunge (per 10m)", kg: 20, reps: 1, sets: 2, spinal: true },
  ],
};

const load = (k, fb) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };

let blockState = load("jj-block-state", SEED);
let history = load("jj-sessions", []);
let plan = expandRoutines(load("jj-plan", null));
let planMeta = load("jj-plan-meta", { at: null, ok: null, why: "" });
let cfg = load("jj-sync-cfg", { owner: "jamiejones2766", repo: "session", token: "" });
let session = { date: new Date().toISOString().slice(0, 10), sets: [], rounds: [], steps: [], pauses: [], rpe: null, back: null, notes: "" };
let tab = "today";
let openMove = null;
let timerMode = null, timer = null;
let finishReport = null, showSettings = false, syncMsg = "";
let selectedDate = new Date().toISOString().slice(0, 10);
let editKg = {}, editReps = {}, editRpe = {}, editSym = {};
let planOpen = false;
let setupVals = { work: 180, rest: 60, rounds: 6, amrap: 14 };
let chipScrollX = 0;
const COUNTDOWN_S = 15;
const TRANSITION_S = 15;

/* ── wake lock ── */
let wakeLock = null;
async function lockScreen() { try { if ("wakeLock" in navigator) wakeLock = await navigator.wakeLock.request("screen"); } catch (e) {} }
function unlockScreen() { try { wakeLock && wakeLock.release(); } catch (e) {} wakeLock = null; }
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && timer) lockScreen(); });

/* ── audio ── */
let actx = null;
function beep(freq = 880, ms = 180, when = 0) {
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === "suspended") actx.resume();
    const o = actx.createOscillator(), g = actx.createGain();
    o.frequency.value = freq; o.type = "square";
    g.gain.setValueAtTime(0.15, actx.currentTime + when);
    g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + when + ms / 1000);
    o.connect(g); g.connect(actx.destination);
    o.start(actx.currentTime + when); o.stop(actx.currentTime + when + ms / 1000);
  } catch (e) {}
}
const triple = () => { beep(880, 150, 0); beep(880, 150, .22); beep(1320, 420, .44); };

/* ── helpers ── */
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const todayISO = () => new Date().toISOString().slice(0, 10);
let toastTimeout = null;
function toast(msg) {
  const t = document.createElement("div");
  t.className = "toast"; t.textContent = msg;
  document.body.appendChild(t);
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => t.remove(), 2000);
}

/* ── routine expansion (plan.routines -> inline steps) ──
   A block {"type":"routine","ref":"prerun"} is replaced in place by the
   steps in plan.routines.prerun. Done at load time so block indices —
   and therefore step keys (date:index) and startStepChain — are unchanged. */
function expandRoutines(p) {
  if (!p || !p.days || !p.routines) return p;
  for (const d of Object.keys(p.days)) {
    const day = p.days[d];
    if (!day || !Array.isArray(day.blocks)) continue;
    if (!day.blocks.some((b) => b && b.type === "routine")) continue;
    const out = [];
    for (const b of day.blocks) {
      if (b && b.type === "routine") {
        const r = p.routines[b.ref];
        if (Array.isArray(r)) out.push(...r.map((s) => ({ ...s, grp: b.ref })));
      } else out.push(b);
    }
    day.blocks = out;
  }
  return p;
}

/* ── plan freshness ──
   The old fetchPlan swallowed every failure when silent=true, so a stale plan
   and a current one looked identical on screen. Now every attempt records its
   outcome in jj-plan-meta, the plan bar shows it, and a silent failure still
   says so. ── */
function planAge() {
  if (!planMeta.at) return null;
  const mins = Math.floor((Date.now() - planMeta.at) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/* ── plan fetch (raw, public repo — no token needed) ── */
async function fetchPlan(silent) {
  try {
    const url = `https://raw.githubusercontent.com/${cfg.owner}/${cfg.repo}/main/data/plan.json?t=${Date.now()}`;
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    plan = expandRoutines(await r.json());
    save("jj-plan", plan);
    planMeta = { at: Date.now(), ok: true, why: "" };
    save("jj-plan-meta", planMeta);
    if (!silent) toast("Plan updated");
    render();
  } catch (e) {
    const why = e.message || "offline";
    planMeta = { at: planMeta.at, ok: false, why };
    save("jj-plan-meta", planMeta);
    // Toast on silent failures too. Offline in a gym is exactly when you can
    // end up running last week's session without knowing it.
    toast(planMeta.at
      ? `Plan not refreshed (${why}) — showing last pull`
      : `No plan found in repo (${why})`);
    render();
  }
}

/* ── GitHub sync (contents API, unique filenames → no SHA dance) ── */
async function pushSession(done) {
  if (!cfg.token) return { ok: false, why: "no token" };
  const stamp = done.finished.replace(/[:T]/g, "-").slice(0, 16);
  const path = `data/sessions/${stamp}.json`;
  const body = {
    message: `session log ${done.date}`,
    content: btoa(unescape(encodeURIComponent(JSON.stringify(done, null, 1)))),
  };
  try {
    const r = await fetch(`https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${path}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${cfg.token}`, Accept: "application/vnd.github+json" },
      body: JSON.stringify(body),
    });
    if (r.ok) return { ok: true, why: "" };
    let detail = "";
    try { const j = await r.json(); detail = j.message ? ` — ${j.message}` : ""; } catch (e) {}
    const hint = r.status === 401 ? " (token expired or invalid)"
      : r.status === 403 ? " (token lacks Contents write)"
      : r.status === 404 ? " (token not granted to this repo, or owner/repo wrong)"
      : r.status === 422 ? " (file already exists at this path)" : "";
    return { ok: false, why: `HTTP ${r.status}${hint}${detail}`, status: r.status, path };
  } catch (e) { return { ok: false, why: `network: ${e.message || "offline"}` }; }
}
async function syncUnsent() {
  const pending = history.filter((h) => !h.synced);
  if (!pending.length) { syncMsg = "All sessions synced"; render(); return; }
  syncMsg = `Syncing ${pending.length}…`; render();
  let n = 0;
  const fails = [];
  for (const h of pending) {
    const res = await pushSession(h);
    if (res.ok) { h.synced = true; n++; }
    else {
      // 422 = file already on the remote. The push landed, the local flag never
      // flipped (dropped response). Treat as synced rather than retrying forever.
      if (res.status === 422) { h.synced = true; n++; fails.push(`${h.date}: already on remote, marked synced`); }
      else fails.push(`${h.date}: ${res.why}`);
    }
  }
  save("jj-sessions", history);
  const stuck = pending.length - n;
  syncMsg = stuck === 0
    ? `Synced ${n} ✓${fails.length ? ` · ${fails.join(" · ")}` : ""}`
    : `Synced ${n}, ${stuck} failed · ${fails.join(" · ")}`;
  render();
}

/* ── timer engine ── */
let tickId = null;
function startTick() { stopTick(); tickId = setInterval(onTick, 250); }
function stopTick() { if (tickId) clearInterval(tickId); tickId = null; }
function stepAt(dayKey, bi) { return plan?.days?.[dayKey]?.blocks?.[bi]; }
function markStepDone(dayKey, bi) {
  const b = stepAt(dayKey, bi);
  if (!b) return;
  const key = dayKey + ":" + bi;
  if (!session.steps.find((x) => x.key === key)) session.steps.push({ key, label: b.label, spinal: !!b.spinal, rpe: null, sym: null, t: Date.now() });
}
function enterStepWork(now) {
  const bi = timer.blockIdxs[timer.pos];
  const b = stepAt(timer.dayKey, bi);
  timer.phase = "work";
  timer.endAt = now + b.secs * 1000;
  timer.left = b.secs;
  timer.warned = false;
}
function onTick() {
  if (!timer) return;
  if (timer.paused) { render(); return; }
  const now = Date.now();
  const left = Math.max(0, (timer.endAt - now) / 1000);
  timer.left = left;
  if (left <= 3.2 && left > 2.8 && !timer.warned) { beep(660, 120); timer.warned = true; }
  if (left > 3.2) timer.warned = false;
  if (left <= 0) {
    if (timer.kind === "interval") {
      if (timer.phase === "countdown") { beep(1320, 300); timer.phase = "work"; timer.endAt = now + timer.workS * 1000; }
      else if (timer.phase === "work") {
        if (timer.round >= timer.rounds) { timer.phase = "done"; triple(); stopTick(); unlockScreen(); }
        else { triple(); timer.phase = "rest"; timer.endAt = now + timer.restS * 1000; }
      } else { beep(1320, 400); timer.round++; timer.phase = "work"; timer.endAt = now + timer.workS * 1000; }
    } else if (timer.kind === "amrap") {
      if (timer.phase === "countdown") { beep(1320, 300); timer.phase = "run"; timer.startedAt = now; timer.endAt = now + timer.mins * 60000; }
      else { timer.phase = "done"; triple(); stopTick(); unlockScreen(); }
    } else if (timer.kind === "stepchain") {
      if (timer.phase === "countdown") { beep(1320, 300); enterStepWork(now); }
      else if (timer.phase === "work") {
        markStepDone(timer.dayKey, timer.blockIdxs[timer.pos]);
        timer.pos++;
        if (timer.pos >= timer.blockIdxs.length) { timer.phase = "done"; triple(); stopTick(); unlockScreen(); }
        else { triple(); timer.phase = "transition"; timer.endAt = now + TRANSITION_S * 1000; }
      } else { beep(1320, 400); enterStepWork(now); }
    } else if (timer.kind === "rest") { triple(); timer = null; stopTick(); unlockScreen(); }
    else { triple(); timer = null; stopTick(); unlockScreen(); }
  }
  render();
}

/* ── actions ── */
window.A = {
  tab(t) { tab = t; showSettings = false; render(); },
  pickDay(d) { selectedDate = d; render(); },
  settings() { showSettings = !showSettings; render(); },
  cfgField(f, el) { cfg[f] = el.value.trim(); save("jj-sync-cfg", cfg); },
  refreshPlan() { fetchPlan(false); },
  toggleGrp(g) { const k = grpKey(g); grpOpen[k] = !grpOpen[k]; render(); },
  syncNow() { syncUnsent(); },

  open(id) { openMove = openMove === id ? null : id; render(); },
  bump(id, field, delta) {
    const store = field === "kg" ? editKg : editReps;
    const m = blockState.movements.find((x) => x.id === id);
    store[id] = Math.max(0, +((store[id] ?? m[field]) + delta).toFixed(1));
    render();
  },
  togglePlan() { planOpen = !planOpen; render(); },
  rpe(id, n) { editRpe[id] = n; render(); },
  sym(id, n) { editSym[id] = n; render(); },
  logSet(id) {
    const m = blockState.movements.find((x) => x.id === id);
    const kg = editKg[id] ?? m.kg, reps = editReps[id] ?? m.reps, rpe = editRpe[id] ?? null, sym = editSym[id] ?? null;
    if (m.spinal && (rpe === null || sym === null)) return;
    session.sets.push({ id, name: m.name, kg, reps, rpe, sym, spinal: m.spinal, t: Date.now() });
    if (kg !== m.kg) { m.kg = kg; save("jj-block-state", blockState); }
    toast(`${m.name} — ${kg} kg × ${reps} logged`);
    render();
  },

  timers(mode) { timerMode = mode; timer = null; tab = "timers"; render(); },
  startInterval(workS, restS, rounds) {
    tab = "timers"; timerMode = "interval";
    timer = { kind: "interval", phase: "countdown", workS, restS, rounds, round: 1, endAt: Date.now() + COUNTDOWN_S * 1000, left: COUNTDOWN_S, paused: false, pauseTotal: 0, pauseLog: [] };
    lockScreen(); beep(880, 200); startTick(); render();
  },
  startAmrap(mins) {
    tab = "timers"; timerMode = "amrap";
    timer = { kind: "amrap", phase: "countdown", mins, endAt: Date.now() + COUNTDOWN_S * 1000, left: COUNTDOWN_S, count: 0, paused: false, pauseTotal: 0, pauseLog: [] };
    lockScreen(); beep(880, 200); startTick(); render();
  },
  startStepChain(bi) {
    const day = plan?.days?.[selectedDate];
    if (!day) return;
    const blocks = day.blocks || [];
    const idxs = [];
    for (let i = bi; i < blocks.length; i++) {
      const b = blocks[i];
      if (b.type === "step" && b.secs) idxs.push(i); else break;
    }
    if (!idxs.length) return;
    tab = "timers"; timerMode = "stepchain";
    timer = { kind: "stepchain", dayKey: selectedDate, blockIdxs: idxs, pos: 0, phase: "countdown", endAt: Date.now() + COUNTDOWN_S * 1000, left: COUNTDOWN_S, paused: false, pauseTotal: 0, pauseLog: [] };
    lockScreen(); beep(880, 200); startTick(); render();
  },
  pauseTimer() {
    if (!timer || timer.phase === "done") return;
    const now = Date.now();
    if (timer.paused) {
      const dur = Math.round((now - timer.pausedAt) / 1000);
      timer.endAt += (now - timer.pausedAt);
      timer.pauseTotal += dur;
      timer.pauseLog.push({ atPhase: timer.phase, durS: dur });
      timer.paused = false; timer.pausedAt = null;
      beep(1100, 150);
    } else {
      timer.paused = true; timer.pausedAt = now;
      beep(440, 150);
    }
    render();
  },
  chipScroll(el) { chipScrollX = el.scrollLeft; },
  amrapRound() {
    if (!timer) return;
    timer.count++;
    session.rounds.push({ n: timer.count, at: Math.round((Date.now() - timer.startedAt) / 1000) });
    beep(1100, 120); render();
  },
  startRest(s) {
    tab = "timers"; timerMode = "rest";
    timer = { kind: "rest", phase: "run", endAt: Date.now() + s * 1000, left: s };
    lockScreen(); startTick(); render();
  },
  exitTimer() {
    if (timer && timer.pauseLog && timer.pauseLog.length) {
      const label = timer.kind === "stepchain" ? "step sequence" : timer.kind === "interval" ? "interval session" : timer.kind === "amrap" ? "AMRAP" : "timer";
      session.pauses.push({ label, at: new Date().toISOString(), entries: timer.pauseLog, totalS: timer.pauseTotal, completed: timer.phase === "done" });
    }
    timer = null; timerMode = null; stopTick(); unlockScreen(); render();
  },
  setupField(id, delta) { setupVals[id] = Math.max(id === "rounds" || id === "amrap" ? 1 : 5, (setupVals[id] || 0) + delta); render(); },

  tickStep(key, label, spinal) {
    const i = session.steps.findIndex((x) => x.key === key);
    if (i >= 0) session.steps.splice(i, 1);
    else session.steps.push({ key, label, spinal: !!spinal, rpe: null, sym: null, t: Date.now() });
    render();
  },
  stepRpe(key, n) {
    const st = session.steps.find((x) => x.key === key);
    if (st) { st.rpe = n; render(); }
  },
  stepSym(key, n) {
    const st = session.steps.find((x) => x.key === key);
    if (st) { st.sym = n; render(); }
  },
  finRpe(n) { session.rpe = n; render(); },
  finBack(b) { session.back = b; render(); },
  finNotes(el) { session.notes = el.value; },
  async saveSession() {
    if (!session.rpe || !session.back) return;
    const done = { ...session, finished: new Date().toISOString(), synced: false };
    finishReport = buildReport(done);
    const res = await pushSession(done);
    done.synced = res.ok;
    history = [done, ...history].slice(0, 100);
    save("jj-sessions", history);
    publishFuel(done);
    session = { date: todayISO(), sets: [], rounds: [], steps: [], pauses: [], rpe: null, back: null, notes: "" };
    editKg = {}; editReps = {}; editRpe = {}; editSym = {};
    toast(res.ok ? "Saved + synced to GitHub ✓" : cfg.token ? "Saved locally — sync failed, retry from Log" : "Saved locally (no token set)");
    render();
  },
  async copyReport() {
    try { await navigator.clipboard.writeText(finishReport); toast("Copied"); }
    catch { toast("Long-press the text to copy"); }
  },
  closeReport() { finishReport = null; tab = "log"; render(); },
  wipe() { if (confirm("Clear all session history?")) { history = []; save("jj-sessions", []); render(); } },
  exportAll() {
    const blob = new Blob([JSON.stringify({ blockState, history }, null, 1)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `session-backup-${todayISO()}.json`;
    a.click();
  },
};

function buildReport(d) {
  return [
    `SESSION REPORT — ${d.date}`,
    `Session RPE: ${d.rpe} · Back: ${d.back}`,
    d.steps?.length ? "Steps:" : null,
    ...(d.steps || []).map((s2) => `  ✓ ${s2.label}${s2.rpe ? ` @ eff ${s2.rpe}` : ""}${s2.sym != null ? ` sym ${s2.sym}` : ""}${s2.spinal ? " ▲" : ""}`),
    d.sets.length ? "Sets:" : "Sets logged: none",
    ...d.sets.map((s) => `  ${s.name}: ${s.kg}kg × ${s.reps}${s.rpe ? ` @ eff ${s.rpe}` : ""}${s.sym != null ? ` sym ${s.sym}` : ""}${s.spinal ? " ▲" : ""}`),
    d.rounds.length ? `AMRAP rounds: ${d.rounds.map((r) => `R${r.n}@${fmt(r.at)}`).join(", ")}` : null,
    d.pauses?.length ? `Pauses: ${d.pauses.map((p) => `${p.label} — ${p.totalS}s total (${p.entries.length} pause${p.entries.length > 1 ? "s" : ""})`).join("; ")}` : null,
    d.notes ? `Notes: ${d.notes}` : null,
  ].filter(Boolean).join("\n");
}

/* ── movement logger (shared by TODAY & LIFTS) ── */
function lastFor(id) {
  for (const h of history) {
    const st = (h.sets || []).filter((x) => x.id === id);
    if (st.length) return { kg: st[st.length - 1].kg, date: h.date };
  }
  return null;
}
function moveCard(m, showLast) {
  const done = session.sets.filter((s) => s.id === m.id).length;
  const kg = editKg[m.id] ?? m.kg, reps = editReps[m.id] ?? m.reps, rpe = editRpe[m.id], sym = editSym[m.id];
  const pips = Array.from({ length: m.sets }).map((_, i) => `<span class="pip ${i < done ? "done" : ""}"></span>`).join("");
  const sel = (n) => rpe === n ? (n >= 9 ? "sel-hi" : n >= 7 ? "sel-mid" : "sel-lo") : "";
  const selSym = (n) => sym === n ? (n >= 4 ? "sel-hi" : n >= 2 ? "sel-mid" : "sel-lo") : "";
  return `
  <button class="row" onclick="A.open('${m.id}')">
    <span><span class="mname">${m.spinal ? '<span style="color:var(--rest)">▲ </span>' : ""}${esc(m.name)}</span>
    <span class="msub">${m.kg} kg · ${m.reps} reps · ${done}/${m.sets} sets${showLast ? (() => { const L = lastFor(m.id); return L ? ` · last ${L.kg}kg on ${L.date.slice(5)}` : " · not yet logged"; })() : ""}</span></span>
    <span class="pips">${pips}</span>
  </button>
  ${openMove === m.id ? `
  <div class="logger">
    <div class="steprow">
      <div class="stepper">
        <button class="stepbtn" onclick="A.bump('${m.id}','kg',${m.kg < 10 ? -0.5 : -2.5})">−</button>
        <div><div class="stepval">${kg}</div><div class="steplbl">kg</div></div>
        <button class="stepbtn" onclick="A.bump('${m.id}','kg',${m.kg < 10 ? 0.5 : 2.5})">+</button>
      </div>
      <div class="stepper">
        <button class="stepbtn" onclick="A.bump('${m.id}','reps',-1)">−</button>
        <div><div class="stepval">${reps}</div><div class="steplbl">reps</div></div>
        <button class="stepbtn" onclick="A.bump('${m.id}','reps',1)">+</button>
      </div>
    </div>
    ${m.spinal ? `
    <div class="rpelab">Effort — required</div>
    <div class="rperow">${[5, 6, 7, 8, 9, 10].map((n) => `<button class="rpebtn ${sel(n)}" onclick="A.rpe('${m.id}',${n})">${n}</button>`).join("")}</div>
    <div class="rpelab">Symptom — required <span class="rpehint">0 = nothing</span></div>
    <div class="rperow">${[0, 1, 2, 3, 4, 5].map((n) => `<button class="rpebtn ${selSym(n)}" onclick="A.sym('${m.id}',${n})">${n}</button>`).join("")}</div>` : ""}
    <button class="big" ${m.spinal && (rpe == null || sym == null) ? "disabled" : ""} onclick="A.logSet('${m.id}')">LOG SET — ${kg} kg × ${reps}</button>
  </div>` : ""}`;
}

/* ── block rendering (grouped routines collapse into one card) ── */
function renderBlock(b, bi) {
if (b.type === "note") return `<div class="noteblock">${esc(b.text)}</div>`;
  if (b.type === "step") {
    const key = selectedDate + ":" + bi;
    const st = session.steps.find((x) => x.key === key);
    const sel = (n) => st && st.rpe === n ? (n >= 9 ? "sel-hi" : n >= 7 ? "sel-mid" : "sel-lo") : "";
    const selSym = (n) => st && st.sym === n ? (n >= 4 ? "sel-hi" : n >= 2 ? "sel-mid" : "sel-lo") : "";
    return `<div class="stepcard ${st ? "ticked" : ""}">
      <button class="steptick" onclick="A.tickStep('${key}',\`${esc(b.label)}\`,${b.spinal ? "true" : "false"})">${st ? "✓" : ""}</button>
      <div class="stepbody">
        <div class="steplabel">${b.spinal ? '<span style="color:var(--rest)">▲ </span>' : ""}${esc(b.label)}${b.secs ? `<span class="stepsecs">${fmt(b.secs)}</span>` : ""}</div>
        ${b.detail ? `<div class="msub">${esc(b.detail)}</div>` : ""}
        ${b.secs && !st ? `<button class="chipstart" onclick="A.startStepChain(${bi})">▶ START (auto-advances through timed steps)</button>` : ""}
        ${st && b.rpe ? `
        <div class="rpelab">Effort</div>
        <div class="rperow">${[5, 6, 7, 8, 9, 10].map((n) => `<button class="rpebtn ${sel(n)}" style="height:40px" onclick="A.stepRpe('${key}',${n})">${n}</button>`).join("")}</div>
        ${b.spinal ? `
        <div class="rpelab">Symptom <span class="rpehint">0 = nothing</span></div>
        <div class="rperow">${[0, 1, 2, 3, 4, 5].map((n) => `<button class="rpebtn ${selSym(n)}" style="height:40px" onclick="A.stepSym('${key}',${n})">${n}</button>`).join("")}</div>` : ""}
        ${b.spinal && (!st.rpe || st.sym == null) ? `<div class="msub" style="color:var(--rest);margin-top:4px">Both required — effort and symptom</div>` : ""}` : ""}
      </div>
    </div>`;
  }
  if (b.type === "interval") return `<div class="hist"><div class="mname">${esc(b.label || "Intervals")}</div>
    <div class="msub">${b.rounds} × ${fmt(b.work)} work / ${fmt(b.rest)} rest</div>
    <button class="big" onclick="A.startInterval(${b.work},${b.rest},${b.rounds})">START</button></div>`;
  if (b.type === "amrap") return `<div class="hist"><div class="mname">${esc(b.label || "AMRAP")}</div>
    <div class="msub">${b.mins} minutes</div>
    ${b.items ? `<div class="amrapitems">${b.items.map((it, n2) => `<div class="amrapitem"><span class="stepnumsm">${n2 + 1}</span>${esc(it)}</div>`).join("")}</div>` : ""}
    <button class="big" onclick="A.startAmrap(${b.mins})">START</button></div>`;
  if (b.type === "movement") {
    const m = blockState.movements.find((x) => x.id === b.id);
    return m ? moveCard(m) : "";
  }
  return "";
}

function renderGroup(g, blocks, start) {
  const key = grpKey(g);
  const open = !!grpOpen[key];
  const steps = blocks.filter((b) => b.type === "step");
  const secs = steps.reduce((a, b) => a + (b.secs || 0), 0);
  const done = steps.filter((b, n) => session.steps.some((x) => x.key === selectedDate + ":" + (start + blocks.indexOf(b)))).length;
  const all = done === steps.length && steps.length > 0;
  const firstTimed = blocks.findIndex((b) => b.type === "step" && b.secs);
  const label = GRP_LABEL[g] || g;
  return `<div class="grpcard ${all ? "grpdone" : ""}">
    <button class="grphead" onclick="A.toggleGrp('${g}')">
      <span class="grpchev ${open ? "open" : ""}">\u203A</span>
      <span class="grpname">${esc(label)}${all ? " \u2713" : ""}</span>
      <span class="grpmeta">${done}/${steps.length}${secs ? " \u00b7 " + fmt(secs) : ""}</span>
    </button>
    ${!open && !all && firstTimed >= 0 ? `<button class="chipstart" style="margin:0 12px 12px" onclick="event.stopPropagation();A.startStepChain(${start + firstTimed})">\u25b6 START ALL</button>` : ""}
    ${open ? `<div class="grpbody">${blocks.map((b, n) => renderBlock(b, start + n)).join("")}</div>` : ""}
  </div>`;
}

function renderBlocks(day) {
  const blocks = day.blocks || [];
  const out = [];
  let i = 0;
  while (i < blocks.length) {
    const g = blocks[i].grp;
    if (!g) { out.push(renderBlock(blocks[i], i)); i++; continue; }
    const s = i;
    while (i < blocks.length && blocks[i].grp === g) i++;
    out.push(renderGroup(g, blocks.slice(s, i), s));
  }
  return out.join("");
}


/* ── collapsible routine groups ── */
const GRP_LABEL = { prerun: "Pre-run warm-up" };
let grpOpen = {};
function grpKey(g) { return selectedDate + ":" + g; }


/* ── fuel bridge ──────────────────────────────────────────────
   Both apps live on jamiejones2766.github.io, so they share one
   localStorage origin. The food log reads this key to set its
   rest/normal/hard target without being told twice. ───────── */
function publishFuel(done) {
  try {
    const mins = Math.round(
      ((done.steps || []).reduce((a, x) => a + (x.secs || 0), 0) +
       (done.rounds || []).reduce((a, x) => a + (x.secs || 0), 0)) / 60
    );
    const planned = plan?.days?.[done.date];
    localStorage.setItem("jj.fuel.session", JSON.stringify({
      date: done.date,
      title: planned?.title || "Session",
      rpe: done.rpe || null,
      mins: mins || null,
      back: done.back || null,
      at: Date.now()
    }));
  } catch (e) { /* bridge is a nicety, never block a save on it */ }
}

/* ── views ── */
function vToday() {
  if (showSettings) return vSettings();
  const wk = plan?.week || "—";
  const wkShort = wk.length > 70 ? wk.slice(0, 70).replace(/[\s,.;—-]+$/, "") + "…" : wk;
  const head = plan ? `<div class="planbar">
      <button class="planhead" onclick="A.togglePlan()">
        <span class="chev ${planOpen ? "open" : ""}">›</span>
        <span class="planline">Plan: ${esc(planOpen ? "this block" : wkShort)}</span>
      </button>
      ${planOpen ? `<p class="hint planbody">${esc(wk)}</p>` : ""}
      <div style="display:flex;align-items:center;gap:10px;margin-top:2px">
        <button class="link" onclick="A.refreshPlan()">refresh</button>
        ${planMeta.ok === false
          ? `<span style="font-size:11.5px;color:var(--danger)">⚠ not refreshed${planAge() ? ` · last pull ${planAge()}` : ""}</span>`
          : `<span style="font-size:11.5px;color:var(--dim)">pulled ${planAge() || "—"}</span>`}
      </div>
    </div>`
    : `<p class="hint">No plan loaded. <button class="link" onclick="A.refreshPlan()">Pull plan from repo</button> once data/plan.json exists.</p>`;

  const t = todayISO();
  // Horizon: this week's Monday through +13 days. Past weeks stay in the file
  // as history but don't clutter the picker.
  const mon = (() => {
    const d = new Date(t + "T12:00:00");
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return d.toISOString().slice(0, 10);
  })();
  const horizonEnd = (() => {
    const d = new Date(mon + "T12:00:00");
    d.setDate(d.getDate() + 13);
    return d.toISOString().slice(0, 10);
  })();
  const allDates = plan?.days ? Object.keys(plan.days).sort() : [];
  const dates = allDates.filter((d) => d >= mon && d <= horizonEnd);
  const chips = dates.length ? `<div class="daychips" onscroll="A.chipScroll(this)">${dates.map((d) => {
    const dt = new Date(d + "T12:00:00");
    const lbl = dt.toLocaleDateString("en-GB", { weekday: "short", day: "numeric" });
    return `<button class="chip ${d === selectedDate ? "on" : ""} ${d === t ? "istoday" : ""}" onclick="A.pickDay('${d}')">${lbl}</button>`;
  }).join("")}</div>` : "";

  const day = plan?.days?.[selectedDate];
  const dayLabel = selectedDate === t ? "" : `<div class="msub" style="margin-bottom:6px">Viewing ${new Date(selectedDate + "T12:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" })}${selectedDate > t ? " (upcoming)" : ""}</div>`;

  if (!day) return `<div class="page">${head}${chips}<div class="hist" style="text-align:center;padding:28px 14px">
    <div class="mname">Nothing scheduled</div>
    <div class="msub" style="margin-top:6px">Rest day, or no plan for this date. The Lift tab has the full library.</div></div></div>`;

  return `<div class="page">${head}${chips}${dayLabel}
    <div class="daytitle">${esc(day.title)}</div>
    ${day.rpe ? `<div class="msub" style="margin-bottom:12px">Target RPE ${esc(day.rpe)}</div>` : ""}
    ${renderBlocks(day)}
  </div>`;
}

function vSettings() {
  const pending = history.filter((h) => !h.synced).length;
  return `<div class="page">
    <div class="small">GitHub sync</div>
    <p class="hint">Fine-grained token · this repo only · Contents read/write. Stored on this phone only. Repo is public — synced logs are publicly visible.</p>
    <input class="field" placeholder="owner" value="${esc(cfg.owner)}" oninput="A.cfgField('owner',this)">
    <input class="field" placeholder="repo" value="${esc(cfg.repo)}" oninput="A.cfgField('repo',this)">
    <input class="field" type="password" placeholder="github token (fine-grained)" value="${esc(cfg.token)}" oninput="A.cfgField('token',this)">
    <button class="big" onclick="A.syncNow()">SYNC NOW${pending ? ` (${pending} pending)` : ""}</button>
    <p class="hint">${esc(syncMsg)}</p>
    <button class="back" onclick="A.settings()">← back</button>
  </div>`;
}

function vLift() {
  return `<div class="page">
    <p class="hint">Working loads + last logged. Sessions in TODAY pull from these; use this tab for unplanned work. ▲ = spinal.</p>
    ${blockState.movements.map((m) => moveCard(m, true)).join("")}
  </div>`;
}

function vTimers() {
  if (timerMode === "interval" && !timer) return `<div class="page">
    <button class="back" onclick="A.exitTimer()">← back</button>
    ${["work", "rest", "rounds"].map((f) => `
      <div style="display:flex;justify-content:center;padding:10px 0"><div class="stepper">
        <button class="stepbtn" onclick="A.setupField('${f}',${f === "rounds" ? -1 : -15})">−</button>
        <div><div class="stepval">${f === "rounds" ? setupVals[f] : fmt(setupVals[f])}</div><div class="steplbl">${f}</div></div>
        <button class="stepbtn" onclick="A.setupField('${f}',${f === "rounds" ? 1 : 15})">+</button>
      </div></div>`).join("")}
    <button class="big" onclick="A.startInterval(${setupVals.work},${setupVals.rest},${setupVals.rounds})">START — ${setupVals.rounds} × ${fmt(setupVals.work)} / ${fmt(setupVals.rest)}</button>
    <div class="wl">screen stays awake while the timer runs</div>
  </div>`;

  if (timerMode === "amrap" && !timer) return `<div class="page">
    <button class="back" onclick="A.exitTimer()">← back</button>
    <div style="display:flex;justify-content:center;padding:16px 0"><div class="stepper">
      <button class="stepbtn" onclick="A.setupField('amrap',-1)">−</button>
      <div><div class="stepval">${setupVals.amrap}</div><div class="steplbl">minutes</div></div>
      <button class="stepbtn" onclick="A.setupField('amrap',1)">+</button>
    </div></div>
    <button class="big" onclick="A.startAmrap(${setupVals.amrap})">START ${setupVals.amrap}-MIN AMRAP</button>
    <div class="wl">screen stays awake while the timer runs</div>
  </div>`;

  if (timerMode === "rest" && !timer) return `<div class="page">
    <button class="back" onclick="A.exitTimer()">← back</button>
    <div class="timerfull" style="min-height:40vh"><div class="clock">REST</div>
      <div class="flex" style="width:100%">
        ${[60, 90, 120].map((s) => `<button class="big" onclick="A.startRest(${s})">${s}s</button>`).join("")}
      </div>
    </div>
  </div>`;

  if (timer) {
    const isCountdown = timer.phase === "countdown";
    const isTransition = timer.phase === "transition";
    const bg = timer.phase === "done" ? "#0F2A20" : isCountdown ? "#101826" : isTransition || timer.phase === "rest" || timer.kind === "rest" ? "#2A2410" : timer.kind === "amrap" ? "#101826" : "#2A1510";
    const col = timer.phase === "done" ? "var(--go)" : isCountdown ? "var(--ink)" : isTransition || timer.phase === "rest" || timer.kind === "rest" ? "var(--rest)" : timer.kind === "amrap" ? "var(--ink)" : "var(--work)";
    let label;
    if (isCountdown) label = "GET READY";
    else if (timer.kind === "interval") label = `${timer.phase === "done" ? "DONE" : timer.phase.toUpperCase()} · ROUND ${Math.min(timer.round, timer.rounds)}/${timer.rounds}`;
    else if (timer.kind === "amrap") label = `${timer.phase === "done" ? "TIME" : "AMRAP"} · ${timer.count} ROUNDS`;
    else if (timer.kind === "stepchain") {
      if (timer.phase === "done") label = "SEQUENCE DONE";
      else if (isTransition) label = "TRANSITION";
      else { const b = stepAt(timer.dayKey, timer.blockIdxs[timer.pos]); label = `${(b?.label || "STEP").toUpperCase()} · ${timer.pos + 1}/${timer.blockIdxs.length}`; }
    } else label = "REST";
    return `<div class="timerfull" style="background:${bg}">
      <div class="phase" style="color:${col}">${label}</div>
      <div class="clock">${timer.phase === "done" ? "✓" : fmt(Math.ceil(timer.left))}</div>
      ${timer.paused ? `<div class="pausedbadge">PAUSED</div>` : ""}
      ${timer.kind === "amrap" && timer.phase === "run" ? `<button class="big huge" onclick="A.amrapRound()">ROUND ${timer.count + 1} DONE</button>` : ""}
      ${timer.phase !== "done" ? `<button class="pausebtn" onclick="A.pauseTimer()">${timer.paused ? "RESUME" : "PAUSE"}</button>` : ""}
      <button class="big ${timer.phase === "done" ? "" : "quiet"}" onclick="A.exitTimer()">${timer.phase === "done" ? "FINISH" : "ABANDON"}</button>
      ${session.rounds.length ? `<div class="splits">${session.rounds.map((r) => `R${r.n} @ ${fmt(r.at)}`).join(" · ")}</div>` : ""}
    </div>`;
  }

  return `<div class="page">
    <p class="hint">Run intervals live on the Garmin. These are for the gym floor.</p>
    ${[["interval", "INTERVALS", "work / rest × rounds"],
       ["amrap", "AMRAP", "countdown + round counter"],
       ["rest", "REST", "60 / 90 / 120 between sets"]].map(([id, name, sub]) => `
      <button class="row" onclick="A.timers('${id}')" style="display:block">
        <span class="mname" style="font-size:22px">${name}</span><span class="msub">${sub}</span>
      </button>`).join("")}
  </div>`;
}

function vFinish() {
  if (finishReport) return `<div class="page">
    <p class="hint">Synced sessions land in the repo automatically. Copy below only as backup / if sync failed.</p>
    <textarea class="report" readonly onclick="this.select()">${esc(finishReport)}</textarea>
    <button class="big" onclick="A.copyReport()">COPY REPORT</button>
    <button class="big quiet" onclick="A.closeReport()">DONE</button>
  </div>`;
  const selS = (n) => session.rpe === n ? (n >= 9 ? "sel-hi" : n >= 7 ? "sel-mid" : "sel-lo") : "";
  const backBtn = (id, label, col) => `<button class="big" style="height:64px;font-size:15px;${session.back === id ? `background:${col};color:#0A0E13` : "background:var(--hi);color:var(--mut)"}" onclick="A.finBack('${id}')">${label}</button>`;
  return `<div class="page">
    <div class="small">Session RPE</div>
    <div class="rperow">${[4, 5, 6, 7, 8, 9, 10].map((n) => `<button class="rpebtn ${selS(n)}" onclick="A.finRpe(${n})">${n}</button>`).join("")}</div>
    <div class="small">Back status</div>
    <div class="flex">${backBtn("fine", "FINE", "var(--go)")}${backBtn("grumble", "GRUMBLE", "var(--rest)")}${backBtn("stop", "STOPPED ME", "var(--danger)")}</div>
    <div class="small">Notes</div>
    <textarea placeholder="swaps, niggles, anything moved" oninput="A.finNotes(this)">${esc(session.notes)}</textarea>
    <button class="big" ${session.rpe && session.back ? "" : "disabled"} onclick="A.saveSession()">SAVE SESSION</button>
    <p class="hint" style="margin-top:10px">${session.sets.length} sets · ${session.rounds.length} AMRAP rounds this session.</p>
  </div>`;
}

function vLog() {
  const col = { fine: "var(--go)", grumble: "var(--rest)", stop: "var(--danger)" };
  const pending = history.filter((h) => !h.synced).length;
  return `<div class="page">
    ${pending ? `<button class="big quiet" onclick="A.syncNow()">SYNC ${pending} PENDING SESSION${pending > 1 ? "S" : ""}</button><p class="hint">${esc(syncMsg)}</p>` : ""}
    ${history.length === 0 ? `<p class="hint">No sessions yet.</p>` : ""}
    ${history.map((h) => `
      <div class="hist">
        <div style="display:flex;justify-content:space-between;align-items:baseline">
          <span class="mname" style="font-size:15px">${esc(h.date)} ${h.synced ? "✓" : "⏳"}</span>
          <span style="font-family:ui-monospace,monospace;font-size:12px;color:${col[h.back] || "var(--mut)"}">RPE ${h.rpe ?? "—"} · ${esc(h.back ?? "—")}</span>
        </div>
        <div class="msub">${h.sets.length} sets${h.rounds?.length ? ` · ${h.rounds.length} AMRAP rounds` : ""}${h.notes ? ` · ${esc(h.notes)}` : ""}</div>
      </div>`).join("")}
    ${history.length ? `
      <button class="back" onclick="A.exportAll()">⬇ export backup (JSON)</button>
      <button class="back" style="color:var(--danger)" onclick="A.wipe()">clear history</button>` : ""}
  </div>`;
}

function render() {
  const views = { today: vToday, lift: vLift, timers: vTimers, finish: vFinish, log: vLog };
  document.getElementById("app").innerHTML = `
    <header><span class="brand">SESSION</span>
    <span style="display:flex;align-items:center;gap:12px">
      <button class="gear" onclick="A.tab('today');A.settings()">⚙</button>
      <span class="date">${new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}</span>
    </span></header>
    ${views[tab]()}
    <nav>${[["today", "TODAY"], ["lift", "LIFTS"], ["timers", "TIMERS"], ["finish", "FINISH"], ["log", "LOG"]].map(([id, l]) =>
      `<button class="nav ${tab === id ? "on" : ""}" onclick="A.tab('${id}')">${l}</button>`).join("")}</nav>`;
  const dc = document.querySelector(".daychips");
  if (dc) dc.scrollLeft = chipScrollX;
}

render();
fetchPlan(true);

/* A PWA resumed from the background never re-runs boot, so the line above
   fires once and then never again. Re-pull when the app becomes visible,
   throttled to 5 min so tab-flicking doesn't hammer raw.githubusercontent. */
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState !== "visible") return;
  if (!planMeta.at || Date.now() - planMeta.at > 5 * 60 * 1000) fetchPlan(true);
});
