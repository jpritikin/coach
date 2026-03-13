---
title: Conversation
type: docs
bookToc: false
weight: 25
---

# Conversation

<details>
<summary>Overview</summary>

Two parts from the Alcohol Addiction scenario — **Shamer** and **Drinker** — are in an IFIO-style directed dialogue. The simulation runs in real time. Watch how stance, regulation, and trust evolve as the conversation progresses.

**Goal:** guide both parts to regulation so they can complete conversation cycles and build trust toward *collaborative*.

**Stance** is the core metric for each part, ranging from −1 to +1. Negative means withdrawn or shut down; positive means activated or flooded. Both parts need to stay within ±0.3 (the green zone) for the conversation to advance.

**Each cycle** has the speaker **Speak → Validate**, with the listener **Mirror → Empathize** in between. Completing the Empathize step grants a large trust boost and softens the speaker's stance.

**Trust** accumulates over completed cycles and determines how open and collaborative the dialogue becomes. It has four bands: *hostile → guarded → opening → collaborative*.

**Therapist buttons** let you nudge a part's effective stance by ±0.2 in real time:

| Button | When to use |
|--------|-------------|
| **Calm** | A part is dysregulated (stance > +0.3) — push it back toward center |
| **Activate** | A part is withdrawn (stance < −0.3) — draw it back into engagement. Also use Activate when both parts are *waiting* (both withdrawn) to nominate a speaker |

The buttons glow when a nudge would help. The therapist delta decays over time, so repeated presses are needed to sustain the effect.

**Self-to-part trust** (the slider on each card) controls how resilient a part is to shocks from the other's words. Higher values mean the part absorbs provocation more stably. You can adjust this mid-conversation.

</details>

<details>
<summary>Reference</summary>

### Stance

Each part holds a raw stance in [−1, +1]. Negative is withdrawn; positive is activated. The **effective stance** adds two transient deltas on top:

```
effective_stance = clamp(raw_stance + therapist_delta + shock_delta, −1, +1)
```

Stance is sampled at the start of each conversation and when a part is re-nominated as speaker. The sample draws from a normal distribution around the magnitude value, widened by low self-to-part trust:

```
stddev = (1 − selfTrust) / 4
shift  = 0.5 × (1 − selfTrust)
sample = N(0.5, stddev) clamped to [0,1]
drawn  = sign(magnitude) × min(1, |magnitude| × (sample + shift))
```

A flip occurs with probability `flipOdds`, negating `drawn`. When a part is renominated (cycle boundary), the new raw stance blends 25% of the previous value with 75% of a fresh sample, anchoring memory while allowing drift.

**Stance descriptions:**

| Range | Label |
|-------|-------|
| > +0.6 | flooding |
| +0.3 to +0.6 | dysregulated |
| −0.3 to +0.3 | regulated |
| −0.6 to −0.3 | withdrawing |
| < −0.6 | shut down |

---

### Regulation score

The regulation score is a continuous value in [0, 1] that smooths out momentary excursions:

```
if both |stanceA| < 0.3 and |stanceB| < 0.3:
    score += 0.5 × dt          (recovers in ~2 s)
else:
    score −= 0.3 × dt          (decays in ~3 s)

regulated = score > 0.5
```

The lag prevents a briefly mis-spoken line from immediately derailing the cycle. Both parts must sustain regulation for the conversation to advance.

---

### Conversation cycle

The cycle is driven by the **speaker/listener role pair** and the current phase:

**4-step** (standard):

| Step | Speaker | Listener |
|------|---------|----------|
| 1 | **Speak** | Listen |
| 2 | Listen | **Mirror** |
| 3 | **Validate** | Listen |
| 4 | Listen | **Empathize** |

**6-step** (repair loop — when the selected dialogue tuple has 6 lines):

| Step | Speaker | Listener |
|------|---------|----------|
| 1 | **Speak** | Listen |
| 2 | Listen | **Mirror** |
| 3 | **Clarify** | Listen |
| 4 | Listen | **Mirror again** |
| 5 | **Validate** | Listen |
| 6 | Listen | **Empathize** |

The 6-step path is chosen automatically based on the dialogue tuple selected for that cycle (some trust bands only include 4-line tuples). It is the simulation's representation of a repair loop when the first mirror misses.

**Phase advancement** happens only when `regulated = true`. Each utterance fires after a 3-second timer elapses. When dysregulated, only the **speaker** can still utter (probabilistically, see below); all other phases wait.

**Cycle completion** (listener finishes Empathize):
- Trust boost: `Δtrust = 0.5 × (1 − trust)` — a large, diminishing-returns gain toward 1.0
- Former speaker's raw stance softened: `raw_stance × 0.5`
- Roles reset; the part with the higher effective stance becomes the next speaker

---

### Utterance timing

When regulated, each phase fires after a **3-second respond timer** resets on every phase transition.

When dysregulated, only a speaker whose stance exceeds +0.3 can speak early, with probability:

```
p(speak in dt) = clamp(stance + 0.3, 0, 1) × 0.5 × dt
```

This means a flooded speaker (+1.0) has ~65% chance of speaking in any given second; a barely-dysregulated speaker (+0.3) has 30%. After an early dysregulated utterance fires, the phase does not advance until regulation returns — creating the "nag/jab/snap" effect without breaking the IFIO structure.

---

### Stance shocks

Every utterance applies a **stance shock** to the receiver. The shock magnitude is proportional to the speaker's effective stance and attenuated by both parties' trust:

```
shockMag = 0.3 × |speakerStance| × 2 / ((1 + selfTrust) × (1 + interPartTrust))
```

By default the shock pushes the receiver **away** from the speaker's polarity (a positive speaker activates the receiver). With probability `flipOdds` — the same **Neuroticism** parameter set in the setup screen — it instead pulls the receiver **toward** the speaker's polarity, modelling a part that mirrors or is drawn into the other's state rather than reacting against it.

The shock accumulates in `shockDelta` and decays exponentially: `shockDelta × e^(−0.08 × dt)`, returning to baseline in ~12 seconds if no further shocks arrive.

The **ball** tracks the speaker — it arcs toward whichever part is about to utter. The ball exists to orient new players, but the clinical discipline is to look away from it: shocks land on the *receiver*, not the sender, so the listener's stance card is where the action is. Toni Herbine-Blank, developer of IFIO, is known for her ability to watch the listening partner during demonstration sessions while the room's attention would usually follow the speaker. Practice ignoring the ball and tracking the quieter card instead.

**Shock overflow:** if the accumulated shock would push the receiver's effective stance below −1, the excess is converted to a trust penalty:

```
Δtrust = −0.2 × overflow
```

This models the relational cost of flooding a withdrawn part past its limit.

---

### Polarity flip

When a shock lands on a receiver who is already dysregulated negative (effective stance < −0.3), there is a further chance equal to `flipOdds` of a **polarity flip**: the part's withdrawn energy suddenly reverses into activation:

```
new_raw = drawInitialStance(−effective_stance, 0, selfTrust)
```

The part becomes the new speaker, emits a generic outburst line ("I can't take it anymore" etc.), and the speaker receives a **counter-shock** equal to the polarity shift magnitude, nudging them back from the extreme. This models a part that has been pushed into shutdown finally erupting.

---

### Trust and trust bands

Trust is a per-relationship value in [0, 1] (Shamer→Drinker and Drinker→Shamer are tracked separately).

| Band | Trust range | Character |
|------|-------------|-----------|
| hostile | < 0.3 | raw, attacking |
| guarded | 0.3 – 0.5 | cautious, partial |
| opening | 0.5 – 0.7 | curious, softer |
| collaborative | ≥ 0.7 | partnered, problem-solving |

The active trust band selects which pool of dialogue tuples to draw from. A cycle completion pulls trust halfway to 1.0. Trust only decreases via shock overflow; the floor is 0 (or a configurable floor, unused in the default scenario).

---

### Listener violation

If the **passively listening** part's effective stance exceeds +0.3 for more than **1 second**, it becomes the new speaker — interrupting the current cycle. This models a part that cannot hold the listening role when flooded.

---

### Therapist influence

Each Calm/Activate press adds ±0.2 to the part's `therapistDelta`. Multiple presses stack, clamped so the effective stance stays within [−1, +1]. The delta decays exponentially at the same rate as shock deltas (`e^(−0.08 × dt)`), halving roughly every 8.7 seconds.

In the **waiting** state (both parts withdrawn), therapist Activate raises a part's effective stance above 0, which nominates it as speaker and resamples its raw stance.

---

### Nomination and speaker selection

At each cycle boundary the part with the **higher effective stance** is nominated as speaker. If both are negative, both enter *waiting*. On nomination the new speaker's raw stance is resampled (75% fresh draw, 25% memory of prior stance), and a new dialogue tuple is rolled from the current trust band's pool.

</details>

---

<link rel="stylesheet" href="/css/ifsConversation.css">

<div id="ifs-conversation-root"></div>

<script type="module" src="/js/ifsConversation.js"></script>
