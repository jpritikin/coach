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

<div id="ifs-conversation-root"></div>

<script type="module" src="/js/ifsConversation.js"></script>

<style>
#ifs-conversation-root {
    font-family: system-ui, sans-serif;
    font-size: 0.9rem;
}

.ifs-conv-wrap {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.ifs-status-wrap {
    position: relative;
}

.ifs-arc-svg {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
    z-index: 2;
    overflow: visible;
}

.ifs-arc-ball {
    filter: blur(2px);
}

.ifs-status-grid {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    gap: 1rem;
    align-items: start;
}

.ifs-part-card {
    background: #f5f5f5;
    border: 2px solid #ddd;
    border-radius: 8px;
    padding: 0.75rem 1rem;
    transition: border-color 0.3s;
}

.ifs-part-card.ifs-speaker {
    border-color: #3a6ea5;
    background: #eef3fa;
}

.ifs-part-name {
    font-size: 1.1rem;
    font-weight: bold;
    margin-bottom: 0.4rem;
    color: #222;
}

.ifs-phase, .ifs-stance, .ifs-trust, .ifs-therapist-delta {
    margin: 0.2rem 0;
    color: #444;
}

.ifs-desc {
    color: #777;
    font-size: 0.85em;
}

.ifs-controls {
    margin-top: 0.6rem;
    display: flex;
    gap: 0.4rem;
}

.ifs-btn {
    flex: 1;
    padding: 0.3rem 0.5rem;
    border: 1px solid #aaa;
    border-radius: 4px;
    background: #fff;
    cursor: pointer;
    font-size: 0.8rem;
}

.ifs-btn:hover {
    background: #e8e8e8;
}

.ifs-btn-flash {
    background: #3a6ea5 !important;
    color: #fff !important;
}

.ifs-btn-hint {
    background: #fff3cd !important;
    border-color: #d4a017 !important;
    color: #7a5500 !important;
}

.ifs-middle {
    text-align: center;
    padding: 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    align-items: center;
    justify-content: center;
}

.ifs-inter-trust {
    font-weight: bold;
    font-size: 0.85rem;
    color: #555;
}

.ifs-trust-val {
    font-size: 0.85rem;
}

.ifs-trust-row-speaker {
    background: #eef3fa;
    border-radius: 4px;
    padding: 0.1rem 0.3rem;
    outline: 2px solid #3a6ea5;
    outline-offset: 1px;
}

.ifs-band {
    color: #777;
    font-size: 0.8em;
}

.ifs-stance-bar-label {
    color: #888;
    font-size: 0.75em;
    margin-top: 0.3rem;
}

.ifs-stance-bar {
    width: 100%;
    min-height: 36px;
}

.ifs-regulation {
    margin-top: 0.4rem;
    padding: 0.3rem 0.7rem;
    border-radius: 12px;
    font-weight: bold;
    font-size: 0.85rem;
}

.ifs-regulated {
    background: #d4edda;
    color: #155724;
}

.ifs-dysregulated {
    background: #f8d7da;
    color: #721c24;
}

.ifs-reg-score, .ifs-cycles {
    font-size: 0.8rem;
    color: #666;
}

.ifs-log-wrap {
    border: 1px solid #ddd;
    border-radius: 8px;
    overflow: hidden;
}

.ifs-log-label {
    background: #f0f0f0;
    padding: 0.4rem 0.75rem;
    font-weight: bold;
    font-size: 0.85rem;
    color: #555;
    border-bottom: 1px solid #ddd;
}

.ifs-log {
    height: 280px;
    overflow-y: auto;
    padding: 0.5rem 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    background: #fafafa;
}

.ifs-msg {
    display: flex;
    gap: 0.4rem;
    align-items: baseline;
    flex-wrap: wrap;
}

.ifs-msg-left {
    justify-content: flex-start;
}

.ifs-msg-right {
    justify-content: flex-end;
}

.ifs-msg-sender {
    font-weight: bold;
    color: #3a6ea5;
    white-space: nowrap;
}

.ifs-msg-right .ifs-msg-sender {
    color: #a53a3a;
}

.ifs-msg-phase {
    color: #999;
    font-size: 0.78em;
    white-space: nowrap;
}

.ifs-msg-text {
    color: #333;
}

.ifs-msg-trust {
    justify-content: center;
}

.ifs-msg-trust-text {
    font-size: 0.75em;
    color: #999;
    font-style: italic;
}

.ifs-sim-controls {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    flex-wrap: wrap;
}

.ifs-sim-controls button {
    padding: 0.3rem 0.8rem;
    border: 1px solid #aaa;
    border-radius: 4px;
    background: #fff;
    cursor: pointer;
}

.ifs-sim-controls button:hover {
    background: #e8e8e8;
}

.ifs-speed-btn.ifs-active {
    background: #3a6ea5;
    color: #fff;
    border-color: #3a6ea5;
}

.ifs-speed-label {
    color: #666;
    font-size: 0.85rem;
}

/* Setup screen */
.ifs-setup {
    max-width: 560px;
    padding: 1.5rem;
    border: 1px solid #ddd;
    border-radius: 8px;
    background: #fafafa;
}

.ifs-setup h3 {
    margin-top: 0;
}

.ifs-setup p {
    color: #555;
    line-height: 1.5;
}

.ifs-setup-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    margin: 1.2rem 0;
}

.ifs-setup-section {
    border: 1px solid #ddd;
    border-radius: 6px;
    padding: 0.75rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
}

.ifs-setup-section-title {
    font-weight: bold;
    font-size: 1rem;
    color: #333;
    margin-bottom: 0.2rem;
}

@media (max-width: 560px) {
    .ifs-setup-grid {
        grid-template-columns: 1fr;
    }
}

.ifs-setup-row label {
    display: block;
    font-weight: bold;
    margin-bottom: 0.3rem;
}

.ifs-slider-wrap {
    display: flex;
    align-items: center;
    gap: 0.6rem;
}

.ifs-slider-wrap input[type="range"] {
    flex: 1;
    cursor: pointer;
}

.ifs-slider-val {
    font-variant-numeric: tabular-nums;
    min-width: 2.8em;
    color: #3a6ea5;
    font-weight: bold;
}

.ifs-trust-hint {
    margin-top: 0.25rem;
    font-size: 0.82rem;
    color: #777;
    min-height: 1.1em;
}

.ifs-start-btn {
    padding: 0.5rem 1.4rem;
    background: #3a6ea5;
    color: #fff;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 1rem;
    font-weight: bold;
}

.ifs-start-btn:hover {
    background: #2d5a8e;
}

@media (max-width: 600px) {
    .ifs-status-grid {
        grid-template-columns: 1fr;
    }
    .ifs-middle {
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: center;
    }
}
</style>
