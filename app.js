/* SESSION — HYROX gym logger · vanilla JS PWA
   Storage: localStorage jj-block-state / jj-sessions
   Wake lock held while any timer runs; re-acquired on visibility return. */

const SEED = {
  movements: [
    { id: "beltsquat", name: "Belt Squat", kg: 80, reps: 8, sets: 2, spinal: false },
    { id: "revlunge", name: "BB Reverse Lunge", kg: 45, reps: 6, sets: 2, spinal: true },
    { id: "rdl", name: "BB Romanian Deadlift", kg: 60, reps: 6, sets: 2, spinal: true },
    { id: "pullup", name: "Weighted Pull Up", kg: 3.8, reps: 6, sets: 2, spinal: false },
    { id: "press", name: "BB Shoulder Press", kg: 30, reps: 6, sets: 2, spinal: false },
    { id: "sledpush", name: "Sled Push (per 12.5m)", kg: 155, reps: 1, sets: 2, spinal: false },
    { id: "sledpull", name: "Sled Pull (per 12.5m)", kg: 125, reps: 1, sets: 2, spinal: true },
    { id: "wallball", name: "Wall Ball", kg: 9, reps: 12, sets: 2, spinal: false },
    { id: "kbcarry", name: "KB Farmers Carry (per 25m)", kg: 24, reps: 1, sets: 2, spinal: true },
    { id: "sblunge", name: "Sandbag Lunge (per 10m)", kg: 20, reps: 1, sets: 2, spinal: true },
  ],
};

/* ── state ── */
const load = (k, fb) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };

let blockState = load("jj-block-state", SEED);
let history = load("jj-sessions", []);
let session = { date: new Date().toISOString().slice(0, 10), sets: [], rounds: [], rpe: null, back: null, notes: "" };
let tab = "lift";
let openMove = null;
let timerMode = null;        // null | interval | amrap | rest
let timer = null;            // active timer state object
let finishReport = null;
let editKg = {}, editReps = {}, editRpe = {};

/* ── wake lock ── */
let wakeLock = null;
async function lockScreen() {
  try { if ("wakeLock" in navigator) { wakeLock = await navigator.wakeLock.request("screen"); } } catch (e) {}
}
function unlockScreen() { try { wakeLock && wakeLock.release(); } catch (e) {} wakeLock = null; }
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && timer) lockScreen();
});

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
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
let toastTimeout = null;
function toast(msg) {
  const t = document.createElement("div");
  t.className = "toast"; t.textContent = msg;
  document.body.appendChild(t);
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => t.remove(), 1800);
}

/* ── timer engine (timestamp-based: survives throttling) ── */
let tickId = null;
function startTick() { stopTick(); tickId = setInterval(onTick, 250); }
function stopTick() { if (tickId) clearInterval(tickId); tickId = null; }

function onTick() {
  if (!timer) return;
  const now = Date.now();
  const left = Math.max(0, (timer.endAt - now) / 1000);
  timer.left = left;

  if (left <= 3.2 && left > 2.8 && !timer.warned) { beep(660, 120); timer.warned = true; }
  if (left > 3.2) timer.warned = false;

  if (left <= 0) {
    if (timer.kind === "interval") {
      if (timer.phase === "work") {
        if (timer.round >= timer.rounds) { timer.phase = "done"; triple(); stopTick(); unlockScreen(); }
        else { triple(); timer.phase = "rest"; timer.endAt = now + timer.restS * 1000; }
      } else {
        beep(1320, 400); timer.round++; timer.phase = "work"; timer.endAt = now + timer.workS * 1000;
      }
    } else if (timer.kind === "amrap") {
      timer.phase = "done"; triple(); stopTick(); unlockScreen();
    } else { // rest
      triple(); timer = null; stopTick(); unlockScreen();
    }
  }
  render();
}

/* ── actions ── */
window.A = {
  tab(t) { tab = t; render(); },
  open(id) { openMove = openMove === id ? null : id; render(); },
  bump(id, field, delta) {
    const store = field === "kg" ? editKg : editReps;
    const m = blockState.movements.find((x) => x.id === id);
    const cur = store[id] ?? m[field];
    store[id] = Math.max(0, +(cur + delta).toFixed(1));
    render();
  },
  rpe(id, n) { editRpe[id] = n; render(); },
  logSet(id) {
    const m = blockState.movements.find((x) => x.id === id);
    const kg = editKg[id] ?? m.kg, reps = editReps[id] ?? m.reps, rpe = editRpe[id] ?? null;
    if (m.spinal && rpe === null) return;
    session.sets.push({ id, name: m.name, kg, reps, rpe, spinal: m.spinal, t: Date.now() });
    if (kg !== m.kg) { m.kg = kg; save("jj-block-state", blockState); }
    toast(`${m.name} — ${kg} kg × ${reps} logged`);
    render();
  },
  timers(mode) { timerMode = mode; timer = null; render(); },
  startInterval(workS, restS, rounds) {
    timer = { kind: "interval", phase: "work", workS, restS, rounds, round: 1, endAt: Date.now() + workS * 1000, left: workS };
    lockScreen(); beep(1320, 300); startTick(); render();
  },
  startAmrap(mins) {
    timer = { kind: "amrap", phase: "run", startedAt: Date.now(), endAt: Date.now() + mins * 60000, left: mins * 60, count: 0 };
    lockScreen(); beep(1320, 300); startTick(); render();
  },
  amrapRound() {
    if (!timer) return;
    timer.count++;
    session.rounds.push({ n: timer.count, at: Math.round((Date.now() - timer.startedAt) / 1000) });
    beep(1100, 120); render();
  },
  startRest(s) {
    timer = { kind: "rest", phase: "run", endAt: Date.now() + s * 1000, left: s };
    lockScreen(); startTick(); render();
  },
  exitTimer() { timer = null; timerMode = null; stopTick(); unlockScreen(); render(); },
  setupField(id, delta) { setupVals[id] = Math.max(id === "rounds" ? 1 : 5, (setupVals[id] || 0) + delta); render(); },
  finRpe(n) { session.rpe = n; render(); },
  finBack(b) { session.back = b; render(); },
  finNotes(el) { session.notes = el.value; },
  saveSession() {
    if (!session.rpe || !session.back) return;
    const done = { ...session, finished: new Date().toISOString() };
    history = [done, ...history].slice(0, 100);
    const ok = save("jj-sessions", history);
    finishReport = buildReport(done);
    session = { date: new Date().toISOString().slice(0, 10), sets: [], rounds: [], rpe: null, back: null, notes: "" };
    editKg = {}; editReps = {}; editRpe = {};
    toast(ok ? "Session saved" : "Save failed — copy report now");
    render();
  },
  async copyReport() {
    try { await navigator.clipboard.writeText(finishReport); toast("Copied — paste to Claude"); }
    catch { toast("Long-press the text to copy"); }
  },
  closeReport() { finishReport = null; tab = "log"; render(); },
  wipe() { if (confirm("Clear all session history?")) { history = []; save("jj-sessions", []); render(); } },
  exportAll() {
    const blob = new Blob([JSON.stringify({ blockState, history }, null, 1)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `session-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  },
};

let setupVals = { work: 180, rest: 60, rounds: 6, amrap: 14 };

function buildReport(d) {
  return [
    `SESSION REPORT — ${d.date}`,
    `Session RPE: ${d.rpe} · Back: ${d.back}`,
    d.sets.length ? "Sets:" : "Sets: none logged",
    ...d.sets.map((s) => `  ${s.name}: ${s.kg}kg × ${s.reps}${s.rpe ? ` @ RPE ${s.rpe}` : ""}${s.spinal ? " ▲" : ""}`),
    d.rounds.length ? `AMRAP rounds: ${d.rounds.map((r) => `R${r.n}@${fmt(r.at)}`).join(", ")}` : null,
    d.notes ? `Notes: ${d.notes}` : null,
  ].filter(Boolean).join("\n");
}

/* ── views ── */
function vLift() {
  return `<div class="page">
    <p class="hint">Tap a movement · adjust · log each set. ▲ = spinal — station RPE required.</p>
    ${blockState.movements.map((m) => {
      const done = session.sets.filter((s) => s.id === m.id).length;
      const kg = editKg[m.id] ?? m.kg, reps = editReps[m.id] ?? m.reps, rpe = editRpe[m.id];
      const pips = Array.from({ length: m.sets }).map((_, i) => `<span class="pip ${i < done ? "done" : ""}"></span>`).join("");
      const sel = (n) => rpe === n ? (n >= 9 ? "sel-hi" : n >= 7 ? "sel-mid" : "sel-lo") : "";
      return `
      <button class="row" onclick="A.open('${m.id}')">
        <span><span class="mname">${m.spinal ? '<span style="color:var(--rest)">▲ </span>' : ""}${esc(m.name)}</span>
        <span class="msub">${m.kg} kg · ${m.reps} reps · ${done}/${m.sets} sets</span></span>
        <span class="pips">${pips}</span>
      </button>
      ${openMove === m.id ? `
      <div class="logger">
        <div class="steprow">
          <div><div class="stepper">
            <button class="stepbtn" onclick="A.bump('${m.id}','kg',${m.kg < 10 ? -0.5 : -2.5})">−</button>
            <div><div class="stepval">${kg}</div><div class="steplbl">kg</div></div>
            <button class="stepbtn" onclick="A.bump('${m.id}','kg',${m.kg < 10 ? 0.5 : 2.5})">+</button>
          </div></div>
          <div><div class="stepper">
            <button class="stepbtn" onclick="A.bump('${m.id}','reps',-1)">−</button>
            <div><div class="stepval">${reps}</div><div class="steplbl">reps</div></div>
            <button class="stepbtn" onclick="A.bump('${m.id}','reps',1)">+</button>
          </div></div>
        </div>
        ${m.spinal ? `
        <div class="small">Station RPE — required</div>
        <div class="rperow">${[5, 6, 7, 8, 9, 10].map((n) => `<button class="rpebtn ${sel(n)}" onclick="A.rpe('${m.id}',${n})">${n}</button>`).join("")}</div>` : ""}
        <button class="big" ${m.spinal && rpe == null ? "disabled" : ""} onclick="A.logSet('${m.id}')">LOG SET — ${kg} kg × ${reps}</button>
      </div>` : ""}`;
    }).join("")}
  </div>`;
}

function vTimers() {
  if (timerMode === "interval" && !timer) return `<div class="page">
    <button class="back" onclick="A.exitTimer()">← back</button>
    ${["work", "rest", "rounds"].map((f) => `
      <div style="display:flex;justify-content:center;padding:10px 0"><div class="stepper">
        <button class="stepbtn" onclick="A.setupField('${f}',${f === "rounds" ? -1 : -15})">−</button>
        <div><div class="stepval">${f === "rounds" ? setupVals[f] : fmt(setupVals[f])}</div><div class="steplbl">${f}${f === "rounds" ? "" : " (m:ss)"}</div></div>
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
    const bg = timer.phase === "done" ? "#0F2A20" : timer.kind === "rest" || timer.phase === "rest" ? "#2A2410" : timer.kind === "amrap" ? "#101826" : "#2A1510";
    const col = timer.phase === "done" ? "var(--go)" : timer.phase === "rest" || timer.kind === "rest" ? "var(--rest)" : timer.kind === "amrap" ? "var(--ink)" : "var(--work)";
    const label = timer.kind === "interval" ? `${timer.phase === "done" ? "DONE" : timer.phase.toUpperCase()} · ROUND ${Math.min(timer.round, timer.rounds)}/${timer.rounds}`
      : timer.kind === "amrap" ? `${timer.phase === "done" ? "TIME" : "AMRAP"} · ${timer.count} ROUNDS` : "REST";
    return `<div class="timerfull" style="background:${bg}">
      <div class="phase" style="color:${col}">${label}</div>
      <div class="clock">${timer.phase === "done" ? "✓" : fmt(Math.ceil(timer.left))}</div>
      ${timer.kind === "amrap" && timer.phase === "run" ? `<button class="big huge" onclick="A.amrapRound()">ROUND ${timer.count + 1} DONE</button>` : ""}
      <button class="big ${timer.phase === "done" ? "" : "quiet"}" onclick="A.exitTimer()">${timer.phase === "done" ? "FINISH" : "ABANDON"}</button>
      ${session.rounds.length ? `<div class="splits">${session.rounds.map((r) => `R${r.n} @ ${fmt(r.at)}`).join(" · ")}</div>` : ""}
    </div>`;
  }

  return `<div class="page">
    <p class="hint">Runs & run intervals: use the Garmin — structured workouts beep on your wrist. These timers are for the gym floor.</p>
    ${[["interval", "INTERVALS", "work / rest × rounds — stations, circuits"],
       ["amrap", "AMRAP", "countdown + round counter with splits"],
       ["rest", "REST", "quick 60 / 90 / 120 between sets"]].map(([id, name, sub]) => `
      <button class="row" onclick="A.timers('${id}')" style="display:block">
        <span class="mname" style="font-size:22px">${name}</span><span class="msub">${sub}</span>
      </button>`).join("")}
  </div>`;
}

function vFinish() {
  if (finishReport) return `<div class="page">
    <p class="hint">Paste this into the Claude chat — it's the Sunday planning input.</p>
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
    <p class="hint" style="margin-top:10px">${session.sets.length} sets · ${session.rounds.length} AMRAP rounds logged this session.</p>
  </div>`;
}

function vLog() {
  const col = { fine: "var(--go)", grumble: "var(--rest)", stop: "var(--danger)" };
  return `<div class="page">
    ${history.length === 0 ? `<p class="hint">No sessions yet. Finish one and it lands here.</p>` : ""}
    ${history.map((h) => `
      <div class="hist">
        <div style="display:flex;justify-content:space-between;align-items:baseline">
          <span class="mname" style="font-size:15px">${esc(h.date)}</span>
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
  const views = { lift: vLift, timers: vTimers, finish: vFinish, log: vLog };
  document.getElementById("app").innerHTML = `
    <header><span class="brand">SESSION</span>
    <span class="date">${new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}</span></header>
    ${views[tab]()}
    <nav>${[["lift", "LIFT"], ["timers", "TIMERS"], ["finish", "FINISH"], ["log", "LOG"]].map(([id, l]) =>
      `<button class="nav ${tab === id ? "on" : ""}" onclick="A.tab('${id}')">${l}</button>`).join("")}</nav>`;
}
render();
