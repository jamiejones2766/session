# BLOCK DOCUMENT — JJ · HYROX Build
**Version 1.4 · 25 Jul 2026 · Update every Sunday planning session. This document overrides memory.**
*v1.4: threshold pace 5:44 disproved by 20 Jul lap data (3 reps @ 5:34-5:41, HR below LTHR, negative split, RPE 4) → ~5:30 provisional · CP 237 confirmed understated, 255-275 likely · Stryd HR gap diagnosed (pod records no HR) · Stryd pairing hypothesis dead, power complete throughout*
*v1.3: threshold pace flagged as likely-too-slow (self-confirming loop) · Max HR 195 / RHR corrected · flat 5k-10k pace added as post-Tenerife commitment · athletedata load confirmed Garmin-sourced · LTHR 173 sport-blind bug logged*
*v1.2: thresholds corrected (5:44/km, CP 237W) · MRI-confirmed disc finding · **Corporate Games football WITHDRAWN** · Community Games cancelled, half downgraded to 10k · deload w/c 20 Jul completed · compound chain intervention added · VO2max hill on-ramp agreed · athletedata bug/fix logged · week template updated*
*v1.1: full event calendar added · Birmingham station-collapse analysis · race pacing rule · Tenerife confirmed 4 Sep · phase map*

---

## 1 · ATHLETE

- 79–81 kg (bioimpedance, morning). Lean: ~14% BF, stable 2yrs. Fuel the build; no cut before October.
- Max HR 195 (Garmin, measured) · LTHR 174 (run — matches Garmin) · RHR 43–49, 60-day mean 46.1 (Garmin device profile was carrying 51 — corrected 25 Jul) · HRV 60-day baseline 59.6 ms
- **Threshold pace: ~5:30/km provisional (was 5:44 — disproved 25 Jul by lap data from the 20 Jul session).** 5:44 was too slow and the evidence is not marginal.
  - **20 Jul, 3 × 1.6 km outdoors, 90s standing rests** — the deload-trimmed threshold session, which turns out to have been an accidental threshold test:

    | Rep | Time | Pace | Power | HR avg / max |
    |---|---|---|---|---|
    | 1 | 9:05 | 5:41/km | 246 W | 157 / 164 |
    | 2 | 8:54 | 5:34/km | 250 W | 161 / 167 |
    | 3 | 8:57 | 5:36/km | 248 W | 164 / 170 |

  - Four independent signals, all pointing the same way: **(1)** ran 5:34–5:41 unprompted against a 5:44 prescription — the legs found the pace, the number was wrong; **(2)** negative split, rep 3 five sec/km faster than rep 1, where a threshold test asks only that the last rep hold within 3% of the first; **(3)** **HR never reached LTHR** — session max 170 vs LTHR 174, and only rep 3 entered the 165–172 target band at all; **(4)** self-logged **RPE 4** in the .fit file. All during a deload week.
  - Compromised 1 km race splits average 5:09/km at Birmingham, 5:29/km at Cardiff — a threshold slower than compromised race pace was always implausible.
  - **Resolution: Mon 27 Jul, 4 × 1.6 km @ 5:30/km target, HR-governed** (reps finish 168–172, cap 175). If 5:30 finishes at 165 and feels like RPE 6, take reps 3–4 toward 5:25. Update this figure Monday night from actual lap data.
- **Stryd CP: 237 W stored, but UNDERSTATED — true value likely 255–275 W (25 Jul).** The 20 Jul reps held 246 / 250 / 248 W for ~9 min each, at heart rates below LTHR, with a negative split. You cannot sustain above critical power for 27 min of work at sub-threshold HR and getting faster. CP is below the athlete's demonstrated sustained power, which is the wrong way round.
  - **Cause: a self-confirming loop.** Auto CP fits its power-duration curve to what was actually run. Threshold was set slow → only easy and slow-"threshold" running got done → the curve had no honest fast anchor → CP came back low → corroborated the slow threshold. Neither number was a measurement.
  - Stryd showed ~300 W at one point and it was written off as wrong. It probably sits above the true value, but it was not the outlier it was labelled as — 237 was the worse error. Do not reinstate 300; wait for real data.
  - **Do not hand-set CP.** Let Auto CP re-fit once Monday's session puts genuine hard efforts into the curve. Recheck the app after 2–3 sessions at corrected pace. This is Stryd's rolling calc, not a single-session test. The old "285 W set / held 305–312 W" figures were on a wrong power scale — do not use them.
- **Cycling FTP: 210 W provisional** (Wattbike 20-min test when convenient; low priority). *This is the genuine figure — see §11 for why it matters.*
- Devices: Forerunner 265 + Stryd (power via Strava, free tier is full-fidelity) · MZ-Switch (pair ANT+ to watch) · Wattbike · bioimpedance scale
- **Data authority: Garmin Connect > Strava > athletedata** when values conflict. Nuance: Garmin FIT webhooks are unreliable for *file delivery*, so Strava often has the file first — but Garmin remains authoritative for *values*. Don't read "Strava has the file" as "Strava is right."
- Other quirks: Garmin HIIT profile hides run distance/power → record sim run portions on Run profile or narrate. Treadmill belts over-read ~4% vs Stryd.

## 2 · EVENTS & TARGETS

| Date | Event | Treatment |
|---|---|---|
| ~~20–23 Aug~~ | ~~Corporate Games (2 days 6-a-side football)~~ | **WITHDRAWN** (23 Jul). Clinician advised against the 5-a-side given the confirmed annular tear; JJ attended solely to play. 11 straight years, 4 wins — this one cost something. No training built around it. August is now clear. |
| **4 Sep** | **HYROX Tenerife** — doubles w/ Chris | Dress rehearsal. Chris ~26-27 5k fresh (~5:45-6:15/km compromised) — JJ cannot be run-limited. JJ takes heavier station share (doubles as Birmingham training). Mini-taper only. Chris pacing/coaching strategy still to be detailed. |
| ~~19 Sep~~ | ~~Community Games~~ | **CANCELLED** (19 Jul). Event quality not worth the association; sat in the tightest pinch of the Birmingham build. |
| 27 Sep | **Preston 10k** (downgraded from Half, 19 Jul) | **CRUISE.** Reduced recovery burden before Birmingham. Long-run thread no longer needs to reach 16–18 k — rebuild target relaxed accordingly. |
| **31 Oct** | **HYROX Birmingham** — solo | **Sub-1:28 working** · PB 1:25:29 good-day · beat 1:31:27 floor. 1:20 is off the table this block. |

**Phase map:** pre-Tenerife = **patterning only, not full conditioning** · build w/c 27 Jul, 3 Aug, 10 Aug · deload w/c 17 Aug (4-week cadence) · sharpen w/c 24 Aug · mini-taper w/c 31 Aug → Tenerife (4 Sep) · post-Tenerife 8-week Birmingham build: wk1 recovery → wk2–4 progressive build → wk5 race simulation → wk6 sharpen → 13-day taper to ~80% effort.

## 2b · BIRMINGHAM 2025 AUTOPSY (drives this block's emphasis)

Cardiff PB vs Birmingham, station by station: ergs IMPROVED (ski −9s, row −17s); leg strength-endurance collapsed — sled push **+2:15** (top 96.6% of field), wall balls **+1:47** (8:30), lunges **+1:23**, sled pull **+1:00**, farmers +35s, BBJ +29s. Runs were 2:50 FASTER than Cardiff.
**Diagnosis:** ran hot, banked time on runs, paid ~3:1 on leg stations.
**Redemption formula: Birmingham runs (41:10) + Cardiff stations (35:59) + 6:00 roxzone ≈ 1:23.** Every component already demonstrated, never together.
**STANDING RACE RULE — pacing:** runs deliberately controlled (slightly slower than feels right), stations attacked. Applies to sims from now.

**The limiter is fatigue-resistance across the full 8-station sequence, not isolated station weakness.** London and Birmingham failed the same way. Cardiff's 5:30 roxzone (top 22%) proves transition skill is present when the legs work — **roxzone training is not needed this block.** Three-tier pacing model rejected: too much cognitive load on race day.

**Primary intervention: compound chain sessions, stations 5–8** (Row → Farmers Carry → Sandbag Lunge → Wall Balls) with controlled 1 km runs between, at full race weight. This is the London cramp zone and the Birmingham collapse zone in one session.

## 3 · INJURY LEDGER (the reason this document exists)

- **Back — MRI-confirmed annular tear/fissure in a spinal disc (21 Jul 2026).** This replaces the previous "self-managed, post-rehab" label with a structural finding. Clinician: conservative management only — activity modification, load management, time. No surgery, no injections, no explicit movement restrictions given.
  - **Open:** close the loop with physio on whether any specific movement patterns should now be avoided. Separate question from treatment.
  - Current status: quiet. 22 Jul compound chain at race weight — spinal symptom RPE **1** at all three checkpoints, effort 6, no progressive escalation.
- **Ankle** — flared Jul 2025 and Sep 2025 under high running load. Watch on volume jumps.
- **Standing rules:**
  - Spinal stations (RDL, lunges, carries, sandbag work): never to failure. Stop 2 reps short of grind. Any back signal = full stop, log it.
  - "Fine now ≠ fine tomorrow": morning-after stiffness is data, log it. **Applies to the ankle as well as the back from Aug**, once hill work starts.
  - Hinge loads progress only after 2 consecutive clean sessions at current load.
  - **Per-station RPE on spinal stations every session — effort and symptom logged SEPARATELY.** Now has a confirmed structural rationale, not a precautionary one.

## 4 · CURRENT LOAD STATE (25 Jul)

CTL 22.3 · ATL 33.8 · TSB −11.6 · **ACWR 0.91 (sweet spot)** · monotony 1.46 · ramp 1.56 · injury index 0
Peak was ACWR 1.74 (12 Jul). Deload w/c 20 Jul brought it back without losing CTL — it worked.
Status: **BUILD.** w/c 27 Jul is build week 1 post-deload, comeback week 4. Load ceiling ~280–300 (return to pre-deload baseline, do not exceed).

*Note on scale: athletedata's CTL/ATL run roughly half Garmin's training-load numbers (25 Jul bike: 22.7 vs Garmin 47.5). Internally consistent, so trends and ACWR are valid — but never cross-compare this CTL to a Garmin or TrainingPeaks figure.*

## 5 · CURRENT STRENGTH LOADS (last completed: 15 Jul, all clean, back quiet)

| Movement | Load | Notes |
|---|---|---|
| Belt squat | 80 kg × 8 × 2 | Swapped from back squat — keep the swap, zero spinal load |
| Barbell reverse lunge | 45 kg × 6 × 2 | Spinal-adjacent, progress slowly |
| **Barbell RDL** | **60 kg × 6 × 2** | Big jump from 40 (8 Jul). Needs one more clean session before progressing |
| Weighted pull-up | +3.8 kg × 6 × 2 | |
| Barbell shoulder press | 30 kg × 6 × 2 | |
| Sled push | 155 kg, 2×25 m | |
| Sled pull | 125 kg, 50 m | |
| Wall ball | 9 kg × 12 | Race is 6 kg — overloaded, good |

Station loads in sims: KB carry 24 kg · sandbag lunge 20 kg · WB 6 kg · row ~2:04–2:15/500m.
**All HYROX stations have been at race/open weight since 3 Jul 2026.** No load progression is running on stations — nothing is ever "first time at open weight."

## 6 · WEEK TEMPLATE & PROGRESSION RULES

**Shape (updated 25 Jul):** Mon threshold run · Tue easy · **Wed compound chain (stations 5–8)** · Thu REST · Fri race sim · Sat easy · Sun long easy run.
*Changed from v1.1: Wednesday was "strength + easy run"; the compound chain has taken that slot as the block's primary intervention. Friday moved from generic compromised running to structured sim.*
Rest day always buffers the hardest session. Move rest, not sessions, when life intervenes.

**Rules:**
1. Run volume ceiling: **+10–15%/wk.** Deload every 4th week: ~65% volume, keep one quality session.
2. Threshold: extend duration before pace. **Currently 4×1.6 km @ 10.5 km/h (5:44/km)** — corrected from 10.8 on 20 Jul. Progress: 5×1.6 → 3×2.4 → then pace. Steer by HR (reps finish 165–172, cap 175), power confirms.
3. Easy runs: HR ≤148 (fatigue-adjusted ceiling ~152, requires readiness confirmation). Heat: go slower, don't chase pace. Judge fitness by EF (W/bpm) and threshold sessions, not pace-at-HR, until Sept.
4. **HOLD triggers (any → no progression that week):** ACWR >1.3 · injury index >60 · back signal · 2+ nights <6h before a hard day.
5. One TRUE full sim (8×1 km, all stations, race loads, timed) ~3 wks pre-Tenerife, another ~2–3 wks pre-Birmingham. These are the only sessions that predict finish time.
6. Sleep: 7.5 h target, vape cutoff 20:00. Watch worn overnight or the day's data is blind.
7. **Long-run thread:** ~+1 km/wk. Currently ~50–55 min. Target relaxed since the half became a 10k.
8. ~~Sprint/COD prep for football~~ — **removed 25 Jul, football withdrawn.** Short hill work survives, but as the VO2max on-ramp (rule 9), not as COD prep. No change-of-direction work is programmed.
9. **VO2max on-ramp (agreed 25 Jul).** Block has been threshold-heavy with zero work above threshold. The original rationale (back caution) is weak now: MRI came back conservative-management-only, and 22 Jul returned spinal symptom 1 at race weight. **The real risk here is the ankle, not the back** — flared Jul and Sep 2025 under running load, and fast running raises ground reaction force and eccentric ankle demand. Hard running is a poor spinal loader; the 152 kg sled push already loads that disc far more.
   - Hills, not flat intervals, for the introduction: VO2max HR via gradient rather than turnover, lower impact and eccentric cost.
   - Appended **before** Monday's threshold reps, after warm-up — fresh legs, better quality, lower risk than fast work on tired legs. Costs a little threshold sharpness; acceptable at this dose.
   - Ramp: w/c 3 Aug 6 × 30s · w/c 10 Aug 8 × 30s or 6 × 45s · w/c 17 Aug deload, drop it · w/c 24 Aug 8 × 45s · w/c 31 Aug taper, drop.
   - **First flat VO2max lands post-Tenerife, not before.** Pre-Tenerife is tolerance-building only — three exposures cannot move an aerobic ceiling, and introducing a new stimulus 11 days out is a bad trade for a dress rehearsal.
   - **STOP RULE: any ankle or Achilles signal — including morning-after stiffness — and hills come out for a week.** Logged like spinal RPE.
10. **Flat 5k–10k pace running — post-Tenerife commitment (added 25 Jul).** Current range is threshold (5:44) or easy (6:27) and nothing between, a ~40 s/km hole that has been there since 2 Jul. Hills close the VO2max gap but not this one — gradient changes the mechanics, which is the whole reason they're ankle-safer. Race runs at Birmingham were 5:09/km; JJ currently never trains that pace. Also means Preston 10k (27 Sep) yields no useful data as things stand.
11. **Unilateral movements** (split squats, single-leg, single-arm carries) once programming leaves the patterning-only phase, post-Tenerife.

## 7 · LOGGING RITUAL (what JJ reports)

Per session: what was done (loads/paces **actual, not prescribed**) · session RPE · **per-station RPE on any spinal station, effort and symptom separately** · back/ankle status (one word fine) · anything moved/swapped and why.
Weekly (Sunday): weight trend, anything Claude should pull.

**New (25 Jul):** spinal RPE numbers go into the `actual` block on that day in `plan.json`, not just into chat. Chat decisions and plan.json drifted apart in week 3 — the file is the record.

## 8 · WEEKLY PLANNING RITUAL (Sundays)

1. JJ reports the week (§7 format) + fills gaps
2. Claude pulls: injury index, ACWR, monotony, ramp, HRV/RHR trend, sleep, PMC
3. Check HOLD triggers → decide build / hold / deload
4. Generate week vs template + rules → JJ sanity-checks → commit to `data/plan.json`
5. Update this document: loads, volumes, state, version number. **The doc is the memory.**

## 9 · BLOCK LOG

| Week | Run km | Key outcomes |
|---|---|---|
| w/c 29 Jun | ~25.5* | Comeback wk 1. First threshold back (5×1k @10.9, drift 145→160). *sim km estimated |
| w/c 6 Jul | ~26 | Threshold 6.4k vol +28% at lower HR. First full 6-day week. |
| w/c 13 Jul | ~27–28 | Threshold 4×1.6 ✅ · strength PBs, back clean ✅ · sim Fri · 50min Sun. ACWR peaked 1.74. Thresholds found to be wrong and corrected 19 Jul. |
| w/c 20 Jul | — | **Deload (wk 3).** One hard session (Mon threshold, trimmed to 3 reps). Wed: compound chain diagnostic, half volume, race weight — **effort 6 / symptom 1, flat across all three spinal checkpoints.** ACWR 1.74 → 0.91, CTL held. MRI confirmed annular tear 21 Jul. |
| w/c 27 Jul | — | **Build wk 1 (comeback wk 4).** Compound chain → 75% volume on the green diagnostic. Office 9–5 all week, evening sessions. Target load ~285. |

## 10 · OPEN ITEMS

- [ ] **Revert athletedata Cycling FTP: 217 → 210 W** (see §11)
- [ ] **Update athletedata Stryd CP field: 217 → 237 W** (see §11)
- [ ] Physio: any movement patterns to avoid now the annular tear is confirmed?
- [ ] MZ-Switch → pair ANT+ to Garmin
- [ ] Wattbike 20-min FTP test (low priority — would replace the 210 W provisional)
- [ ] Cancel Repz by **10 Aug** (paid to then; being used as comparison only — confirmed recovery-blind, prescribes volume jumps regardless of readiness)
- [ ] Intervals.icu integration — highest analytical value remaining (training load, power curve). Not connected.
- [ ] Chris (Tenerife doubles partner, first-timer) — pacing/coaching strategy not yet detailed
- [ ] Off-feet conditioning as volume substitution during taper — unresolved
- [ ] Recheck threshold pace and CP periodically; both still moving in early comeback

## 11 · athletedata FIELD STATE (added 25 Jul)

**The sport-blind FTP bug is FIXED — confirmed live 25 Jul.** Verified on both sports:
- Run (24 Jul): `intensity_factor_source: "run_power"`, `ftp_watts: null`, `run_cp_watts: 217`, `threshold_pace_sec_per_km: 343` (5:43/km — the manual field, now actually read)
- Ride (25 Jul): `intensity_factor_source: "ride_power"`, `ftp_watts: 217`, `run_cp_watts: null`

**Because it's fixed, the workaround is now the problem.** The Cycling FTP field was deliberately set to 217 W (JJ's then-CP) to force correct running IF. That hack is no longer needed and is now corrupting *cycling* IF instead.

**Two field changes required:**
| Field | Currently | Should be |
|---|---|---|
| Cycling FTP | 217 W (workaround) | **210 W** (genuine provisional) |
| Stryd CP | 217 W (stale) | **237 W** |

**Trust tiers for athletedata output:**
1. **Raw sensor** (HRV, RHR, sleep, HR, pace, power, cadence) — Garmin passthrough, never affected by any of this. Trust it.
2. **Load maths** (CTL/ATL/TSB/ACWR/ramp) — **sourced from Garmin's training load, not computed by athletedata** (per athletedata, 25 Jul; corrects an earlier claim in this section that it was their own model). Scaled to roughly half Garmin's raw figures. Editing FTP/CP/pace in athletedata therefore does NOT move the PMC chart. Trust trends, not absolute cross-platform comparison.
3. **Anchor-dependent** (IF, TSS, power zones) — only as good as the two fields above. **Always check `derived_metrics.basis` before believing an IF number.**

**Open bug (25 Jul):** athletedata bulk-recomputed 299 activities using **LTHR 173** — that is the *cycling* LTHR. Run LTHR is 174 and Garmin holds 174. Same sport-blind field selection as the original FTP bug, in a different field, appearing *after* the fix shipped. Numerically trivial (one beat); the pattern is not. Report to support.

**Stryd has no heart rate (found 25 Jul).** Every split of the 20 Jul session reads 0 bpm in the Stryd app, while Garmin holds the full trace (avg 155, max 170). Cause: **the Stryd pod does not record heart rate at all** — if the workout reaches the app by offline sync straight from the pod, HR is absent by design. Fix: in Stryd PowerCenter → Settings → *Import from Garmin Connect* (green = connected, grey = not). Once connected, the watch's FIT file carries HR through on every sync. Consequence while broken: Stryd's view of every session is blind to the one signal that would have flagged the threshold pace as too easy. Power is unaffected — CP is power-derived, and the pod's power record has been complete and clean throughout.

Other known behaviours: `get_readiness_today` often returns "not computed" early morning — substitute `garmin_get_hrv` with explicit dates plus `get_daily_metrics` for trend. `get_performance_estimates` is unreliable for confirming saved thresholds; use `get_activity_detail` and read `derived_metrics.basis`.
