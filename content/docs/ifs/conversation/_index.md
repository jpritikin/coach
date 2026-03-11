---
title: Conversation
type: docs
bookToc: false
weight: 25
---

# Conversation

<details>
<summary>How it works</summary>

Two parts from the Alcohol Addiction scenario — **Shamer** and **Drinker** — are in an IFIO-style directed dialogue. The simulation runs in real time. Watch how stance, regulation, and trust evolve as the conversation progresses.

The IFIO conversation cycle has four steps per speaker turn:

| Step | Speaker | Listener |
|------|---------|----------|
| 1 | **Speak** | Listen |
| 2 | Listen | **Mirror** |
| 3 | **Validate** | Listen |
| 4 | Listen | **Empathize** |

The cycle advances only when both parts are *regulated* (stance within ±0.3). If the listening part's stance exceeds that limit they become the new speaker (listener violation). Completing the empathize step grants a large trust bonus; sustained regulation grants small periodic gains.

**Therapist influence** — use the Calm / Activate buttons to nudge a part's effective stance. The delta decays exponentially over time.

</details>

---

<link rel="stylesheet" href="/css/ifsConversation.css">

<div id="ifs-conversation-root"></div>

<script type="module" src="/js/ifsConversation.js"></script>
