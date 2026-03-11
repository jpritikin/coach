export type IfioPhase = 'speak' | 'listen' | 'mirror' | 'validate' | 'empathize';
export type TrustBand = 'hostile' | 'guarded' | 'opening' | 'collaborative';

export const PHASE_INDEX: Record<Exclude<IfioPhase, 'listen'>, number> = {
    speak: 0, mirror: 1, validate: 2, empathize: 3
};

export const REGULATION_STANCE_LIMIT = 0.3;
export const RESPOND_DELAY = 3;
export const NEW_CYCLE_DELAY = 4;
const LISTENER_VIOLATION_GRACE = 1.0;
const REGULATION_RECOVER_RATE = 0.5;
const REGULATION_DECAY_RATE = 0.3;
const SPEAK_BASE_RATE = 0.5;

export interface ConversationDialogues {
    hostile?: string[][];
    guarded?: string[][];
    opening?: string[][];
    collaborative?: string[][];
}

export interface InterPartRelation {
    trust: number;
    trustFloor: number;
    stance: number;
    stanceMagnitude: number; // original setup magnitude, immutable
    stanceFlipOdds: number;
    dialogues?: ConversationDialogues;
    flipUtterances?: string[];
}

const GENERIC_FLIP_UTTERANCES = [
    "I can't take it anymore.",
    "That's it — I'm done.",
    "Everything just broke open.",
    "I can't hold this.",
    "Something just gave way.",
];

export interface Part {
    id: string;
    name: string;
    selfTrust: number;
}

export interface ConversationState {
    speakerId: string;
    phases: Map<string, IfioPhase>;
    effectiveStances: Map<string, number>;
    therapistDeltas: Map<string, number>;
    // Active dialogue tuple index per speakerId, rolled once per cycle
    activeTupleIndex: Map<string, number>;
    regulationScore: number;
    respondTimer: number;
    newCycleTimer: number;
    listenerViolationTimer: number;
    // Ball: position 0=partA side, 1=partB side
    ballPos: number;
    ballVel: number;
    ballUttererIsA: boolean;
    ballBias: number; // 0=all-A, 0.5=balanced, 1=all-B
}

export interface Message {
    id: number;
    senderId: string;
    text: string;
    phase: IfioPhase;
    type: 'dialogue' | 'trust';
}

export interface ShockEvent {
    receiverId: string;
    delta: number;      // actual stance change applied
    rawStanceBefore: number;
    rawStanceAfter: number;
    simTime: number;
}

export interface PhaseTransitionEvent {
    speakerId: string;
    listenerId: string;
    oldPhaseS: IfioPhase;
    oldPhaseL: IfioPhase;
    newPhaseS: IfioPhase;
    newPhaseL: IfioPhase;
    rawStanceA: number;
    rawStanceB: number;
    simTime: number;
}

export interface NominateEvent {
    speakerId: string;
    sampledStance: number;
}

export type SimEvent =
    | { kind: 'shock'; data: ShockEvent }
    | { kind: 'phase'; data: PhaseTransitionEvent }
    | { kind: 'message'; data: Message }
    | { kind: 'nominate'; data: NominateEvent };

export interface SimState {
    partA: Part;
    partB: Part;
    relAB: InterPartRelation;
    relBA: InterPartRelation;
    conversation: ConversationState;
    messages: Message[];
    messageCounter: number;
    simTime: number;
    cyclesCompleted: number;
}

// Distribution of next shock to receiverId given current state.
// Returns [deltaIfSameDir, deltaIfFlip, probSameDir].
export function nextShockDist(state: SimState, receiverId: string): [number, number, number] {
    const { partA, partB } = state;
    const isReceiverA = receiverId === partA.id;
    const speakerId = isReceiverA ? partB.id : partA.id;
    const receiverRel = isReceiverA ? state.relAB : state.relBA;
    const speakerRel  = isReceiverA ? state.relBA : state.relAB;
    const selfTrust   = isReceiverA ? partA.selfTrust : partB.selfTrust;
    const speakerStance = state.conversation.effectiveStances.get(speakerId) ?? 0;
    const shockMag = 0.3 * Math.abs(speakerStance) * 2 / ((1 + selfTrust) * (1 + receiverRel.trust));
    const probSameDir = speakerRel.stanceFlipOdds;
    const sameDir  = Math.sign(speakerStance) * shockMag;
    const flipDir  = -Math.sign(speakerStance) * shockMag;
    return [sameDir, flipDir, probSameDir];
}

export function getTrustBand(trust: number): TrustBand {
    if (trust < 0.3) return 'hostile';
    if (trust < 0.5) return 'guarded';
    if (trust < 0.7) return 'opening';
    return 'collaborative';
}

export function rollTupleIndex(rel: InterPartRelation, speakerId: string, conv: ConversationState): void {
    const band = getTrustBand(rel.trust);
    const pool = rel.dialogues?.[band];
    const idx = pool && pool.length > 0 ? Math.floor(Math.random() * pool.length) : 0;
    conv.activeTupleIndex.set(speakerId, idx);
}

export function getDialogue(rel: InterPartRelation, phase: IfioPhase, speakerId: string, conv: ConversationState): string | null {
    if (phase === 'listen') return null;
    const band = getTrustBand(rel.trust);
    const pool = rel.dialogues?.[band];
    if (!pool || pool.length === 0) return null;
    const idx = conv.activeTupleIndex.get(speakerId) ?? 0;
    return pool[idx % pool.length][PHASE_INDEX[phase]] ?? null;
}

export function clamp(v: number, lo = -1, hi = 1): number {
    return Math.max(lo, Math.min(hi, v));
}

function resampleStance(rel: InterPartRelation, selfTrust: number): void {
    const sample = drawInitialStance(rel.stanceMagnitude, rel.stanceFlipOdds, selfTrust);
    rel.stance = clamp(0.25 * rel.stance + 0.75 * sample);
}

export function addInterPartTrust(rel: InterPartRelation, delta: number): void {
    if (rel.trustFloor > 0 && delta < 0) delta *= 0.5;
    const newTrust = rel.trust + delta;
    if (newTrust < rel.trustFloor) {
        const overflow = rel.trustFloor - newTrust;
        const extremeDir = Math.sign(rel.stance) || 1;
        rel.stance = clamp(rel.stance + extremeDir * overflow * 0.4);
    }
    rel.trust = clamp(newTrust, rel.trustFloor, 1);
}

export function getEffectiveStance(stance: number, therapistDelta: number): number {
    return clamp(stance + therapistDelta);
}

export function stanceDescription(stance: number): string {
    if (stance > 0.6) return 'flooding';
    if (stance > 0.3) return 'dysregulated';
    if (stance > -0.3) return 'regulated';
    if (stance > -0.6) return 'withdrawing';
    return 'shut down';
}

function randNormal(mean: number, stddev: number): number {
    // Box-Muller
    const u = 1 - Math.random();
    const v = Math.random();
    return mean + stddev * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// Draw an initial stance given base magnitude, flip odds, and self-trust.
// magnitude: signed default stance value [-1,1]; sign is the default direction
// flipOdds: probability of flipping to opposite sign [0,0.5]
// selfTrust: [0,1] — lower = more variable and more extreme
export function drawInitialStance(magnitude: number, flipOdds: number, selfTrust: number): number {
    const stddev = (1 - selfTrust) / 4;
    const shift  = 0.5 * (1 - selfTrust);
    const sample = Math.max(0, Math.min(1, randNormal(0.5, stddev)));
    const drawn  = Math.sign(magnitude) * Math.min(1, Math.abs(magnitude) * (sample + shift));
    return Math.random() < flipOdds ? -drawn : drawn;
}

function initConversation(state: SimState): void {
    const { partA, partB, relAB, relBA, conversation } = state;
    relAB.stance = drawInitialStance(relAB.stance, relAB.stanceFlipOdds, partA.selfTrust);
    relBA.stance = drawInitialStance(relBA.stance, relBA.stanceFlipOdds, partB.selfTrust);
    const stanceA = getEffectiveStance(relAB.stance, 0);
    const stanceB = getEffectiveStance(relBA.stance, 0);
    const speakerId = stanceA >= stanceB ? partA.id : partB.id;
    const listenerId = speakerId === partA.id ? partB.id : partA.id;
    conversation.speakerId = speakerId;
    conversation.phases.set(speakerId, 'speak');
    conversation.phases.set(listenerId, 'listen');
    conversation.effectiveStances.set(partA.id, stanceA);
    conversation.effectiveStances.set(partB.id, stanceB);
    const initRel = speakerId === partA.id ? relAB : relBA;
    rollTupleIndex(initRel, speakerId, conversation);
}

function updateEffectiveStances(state: SimState): void {
    const { partA, partB, relAB, relBA, conversation } = state;
    const dA = conversation.therapistDeltas.get(partA.id) ?? 0;
    const dB = conversation.therapistDeltas.get(partB.id) ?? 0;
    conversation.effectiveStances.set(partA.id, getEffectiveStance(relAB.stance, dA));
    conversation.effectiveStances.set(partB.id, getEffectiveStance(relBA.stance, dB));
}

function applyStanceShock(speakerId: string, receiverId: string, speakerStance: number, state: SimState, out: SimEvent[]): void {
    const receiverRel = receiverId === state.partA.id ? state.relAB : state.relBA;
    const speakerRel = speakerId === state.partA.id ? state.relAB : state.relBA;
    const selfTrust = receiverId === state.partA.id ? state.partA.selfTrust : state.partB.selfTrust;
    const shockMag = 0.3 * Math.abs(speakerStance) * 2 / ((1 + selfTrust) * (1 + receiverRel.trust));
    const sameDir = Math.random() < speakerRel.stanceFlipOdds;
    const dir = sameDir ? Math.sign(speakerStance) : -Math.sign(speakerStance);
    if (dir === 0) return;
    const rawStanceBefore = receiverRel.stance;
    const delta = dir * shockMag;
    receiverRel.stance = clamp(receiverRel.stance + delta);
    const rawStanceAfter = receiverRel.stance;
    const trustBefore = receiverRel.trust;
    addInterPartTrust(receiverRel, -shockMag);
    const trustAfter = receiverRel.trust;
    const receiverName = receiverId === state.partA.id ? state.partA.name : state.partB.name;
    const speakerName = speakerId === state.partA.id ? state.partA.name : state.partB.name;
    out.push({ kind: 'shock', data: { receiverId, delta, rawStanceBefore, rawStanceAfter, simTime: state.simTime } });
    if (Math.abs(trustAfter - trustBefore) >= 0.001) {
        const msg: Message = {
            id: ++state.messageCounter,
            senderId: receiverId,
            text: `${speakerName}→${receiverName} trust ${trustBefore.toFixed(2)} → ${trustAfter.toFixed(2)} (shock)`,
            phase: 'listen',
            type: 'trust',
        };
        state.messages.push(msg);
        out.push({ kind: 'message', data: msg });
    }

    // Flip: if receiver is dysregulated negative, shock may trigger a polarity reversal.
    const stanceAfterShock = receiverRel.stance;
    if (stanceAfterShock < -REGULATION_STANCE_LIMIT && Math.random() < receiverRel.stanceFlipOdds) {
        const receiverSelfTrust = receiverId === state.partA.id ? state.partA.selfTrust : state.partB.selfTrust;
        const s0 = stanceAfterShock;
        const s1 = drawInitialStance(-s0, 0, receiverSelfTrust);
        receiverRel.stance = clamp(s1);
        const speakerRel2 = speakerId === state.partA.id ? state.relAB : state.relBA;
        speakerRel2.stance = clamp(speakerRel2.stance - (s1 - s0));
        updateEffectiveStances(state);
        const receiverName2 = receiverId === state.partA.id ? state.partA.name : state.partB.name;
        const speakerName2 = speakerId === state.partA.id ? state.partA.name : state.partB.name;
        const pool = [...GENERIC_FLIP_UTTERANCES, ...(receiverRel.flipUtterances ?? [])];
        const utterance = pool[Math.floor(Math.random() * pool.length)];
        const flipMsg: Message = {
            id: ++state.messageCounter,
            senderId: receiverId,
            text: utterance,
            phase: 'speak',
            type: 'dialogue',
        };
        state.messages.push(flipMsg);
        out.push({ kind: 'message', data: flipMsg });

        const msg2: Message = {
            id: ++state.messageCounter,
            senderId: receiverId,
            text: `${receiverName2} flipped: ${s0.toFixed(2)} → ${s1.toFixed(2)}; ${speakerName2} counter-shock ${(-(s0 - s1)).toFixed(2)}`,
            phase: 'listen',
            type: 'trust',
        };
        state.messages.push(msg2);
        out.push({ kind: 'message', data: msg2 });
    }
}

function logTrustChange(state: SimState, rel: InterPartRelation, before: number, fromId: string, toId: string, reason: string): void {
    const after = rel.trust;
    if (Math.abs(after - before) < 0.001) return;
    const fromName = fromId === state.partA.id ? state.partA.name : state.partB.name;
    const toName = toId === state.partA.id ? state.partA.name : state.partB.name;
    state.messages.push({
        id: ++state.messageCounter,
        senderId: toId,
        text: `${fromName}→${toName} trust ${before.toFixed(2)} → ${after.toFixed(2)} (${reason})`,
        phase: 'listen',
        type: 'trust',
    });
}

// Returns [newSpeakerPhase, newListenerPhase] or null if no transition applies.
export function nextPhases(phaseS: IfioPhase, phaseL: IfioPhase): [IfioPhase, IfioPhase] | null {
    if (phaseS === 'speak'     && phaseL === 'listen')   return ['listen',   'mirror'];
    if (phaseS === 'listen'    && phaseL === 'mirror')   return ['validate', 'listen'];
    if (phaseS === 'validate'  && phaseL === 'listen')   return ['listen',   'empathize'];
    if (phaseS === 'listen'    && phaseL === 'empathize') return ['listen',  'listen'];
    return null;
}

function tryAdvancePhase(state: SimState, out: SimEvent[]): void {
    const { partA, partB, relAB, relBA, conversation } = state;
    const speakerId = conversation.speakerId;
    const listenerId = speakerId === partA.id ? partB.id : partA.id;
    const phaseS = conversation.phases.get(speakerId)!;
    const phaseL = conversation.phases.get(listenerId)!;
    const relSL = speakerId === partA.id ? relAB : relBA;

    const next = nextPhases(phaseS, phaseL);
    if (!next) return;

    const [newPhaseS, newPhaseL] = next;
    conversation.respondTimer = 0;
    conversation.phases.set(speakerId, newPhaseS);
    conversation.phases.set(listenerId, newPhaseL);

    out.push({ kind: 'phase', data: {
        speakerId, listenerId,
        oldPhaseS: phaseS, oldPhaseL: phaseL,
        newPhaseS, newPhaseL,
        rawStanceA: relAB.stance, rawStanceB: relBA.stance,
        simTime: state.simTime,
    }});

    if (phaseS === 'listen' && phaseL === 'empathize') {
        const before = relSL.trust;
        addInterPartTrust(relSL, 0.5 * (1 - relSL.trust));
        logTrustChange(state, relSL, before, speakerId, listenerId, 'cycle complete');
        relSL.stance = relSL.stance * 0.5;
        state.cyclesCompleted++;
    }
}

// Minimal scalar state for lookahead simulation (no dialogues, no messages)
interface LookaheadState {
    speakerId: string;
    phaseA: IfioPhase;
    phaseB: IfioPhase;
    stanceA: number;
    stanceB: number;
    regulationScore: number;
    respondTimer: number;
    newCycleTimer: number;
    listenerViolationTimer: number;
    simTime: number;
}

// Run a lightweight forward sim until an utterance fires or time limit exceeded.
// Returns [uttererIsA, timeUntilUtterance].
export function lookaheadUtterance(state: SimState, maxLook = 8): [boolean, number] {
    const { partA, partB, conversation } = state;
    const SUB = 0.05; // substep size in sim-seconds

    let ls: LookaheadState = {
        speakerId: conversation.speakerId,
        phaseA: conversation.phases.get(partA.id) ?? 'listen',
        phaseB: conversation.phases.get(partB.id) ?? 'listen',
        stanceA: conversation.effectiveStances.get(partA.id) ?? 0,
        stanceB: conversation.effectiveStances.get(partB.id) ?? 0,
        regulationScore: conversation.regulationScore,
        respondTimer: conversation.respondTimer,
        newCycleTimer: conversation.newCycleTimer,
        listenerViolationTimer: conversation.listenerViolationTimer,
        simTime: 0,
    };

    const isA = (id: string) => id === partA.id;

    for (let t = 0; t < maxLook; t += SUB) {
        const dt = SUB;
        const { phaseA, phaseB } = ls;
        const bothListen = phaseA === 'listen' && phaseB === 'listen';

        // Update regulation score
        const bothInRange = Math.abs(ls.stanceA) < REGULATION_STANCE_LIMIT && Math.abs(ls.stanceB) < REGULATION_STANCE_LIMIT;
        ls.regulationScore = bothInRange
            ? Math.min(1, ls.regulationScore + REGULATION_RECOVER_RATE * dt)
            : Math.max(0, ls.regulationScore - REGULATION_DECAY_RATE * dt);
        const regulated = ls.regulationScore > 0.5;

        if (bothListen) {
            ls.newCycleTimer += dt;
            if (ls.newCycleTimer >= NEW_CYCLE_DELAY) {
                ls.newCycleTimer = 0;
                ls.speakerId = ls.stanceA >= ls.stanceB ? partA.id : partB.id;
                ls.phaseA = isA(ls.speakerId) ? 'speak' : 'listen';
                ls.phaseB = isA(ls.speakerId) ? 'listen' : 'speak';
                ls.respondTimer = 0;
            }
        } else {
            ls.newCycleTimer = 0;
            const phaseS = isA(ls.speakerId) ? ls.phaseA : ls.phaseB;
            const phaseL = isA(ls.speakerId) ? ls.phaseB : ls.phaseA;

            // Mirror actual tick: listeningPart is who is passively listening
            // speak/listen → listener; listen/mirror → speaker; validate/listen → listener; listen/empathize → speaker
            const listenerIsSpeaker = (phaseS === 'listen' && (phaseL === 'mirror' || phaseL === 'empathize'));
            const hasListeningPart = nextPhases(phaseS, phaseL) !== null;
            let listeningIsA: boolean | null = null;
            if (hasListeningPart) listeningIsA = listenerIsSpeaker ? isA(ls.speakerId) : !isA(ls.speakerId);

            if (listeningIsA !== null) {
                const listeningStance = listeningIsA ? ls.stanceA : ls.stanceB;
                if (listeningStance > REGULATION_STANCE_LIMIT) {
                    ls.listenerViolationTimer += dt;
                    if (ls.listenerViolationTimer >= LISTENER_VIOLATION_GRACE) {
                        ls.listenerViolationTimer = 0;
                        const listenerId = listeningIsA ? partA.id : partB.id;
                        ls.speakerId = listenerId;
                        ls.phaseA = isA(ls.speakerId) ? 'speak' : 'listen';
                        ls.phaseB = isA(ls.speakerId) ? 'listen' : 'speak';
                        ls.respondTimer = 0;
                    }
                } else {
                    ls.listenerViolationTimer = 0;
                }
            }

            // Utterer is whoever has a non-listen phase (mirrors actual tick)
            const uttererIsA = ls.phaseA !== 'listen';
            const uttererPhase = uttererIsA ? ls.phaseA : ls.phaseB;
            const uttererStance = uttererIsA ? ls.stanceA : ls.stanceB;

            if (uttererPhase !== 'listen') {
                let fires = false;
                if (regulated) {
                    ls.respondTimer += dt;
                    if (ls.respondTimer >= RESPOND_DELAY) fires = true;
                } else if (uttererPhase === 'speak' && uttererStance >= REGULATION_STANCE_LIMIT) {
                    const s = uttererStance + 0.3;
                    fires = Math.random() < Math.max(0, s) ** 2 * SPEAK_BASE_RATE * dt;
                }
                if (fires) return [uttererIsA, t + dt];
            }
        }
    }
    // No utterance found within lookahead window — return midpoint as fallback
    return [isA(state.conversation.speakerId), maxLook / 2];
}

function tickBall(state: SimState, dt: number): void {
    const { partA, conversation } = state;
    const phaseA = conversation.phases.get(partA.id) ?? 'listen';
    const phaseB = conversation.phases.get(state.partB.id) ?? 'listen';
    const bothListen = phaseA === 'listen' && phaseB === 'listen';

    // Lookahead: who will utter next and when?
    const [uttererIsA, ttu] = lookaheadUtterance(state);
    conversation.ballUttererIsA = uttererIsA;

    const imminentThreshold = 3.0;
    if (ttu > imminentThreshold) {
        // No imminent utterance — spring to center
        const force = 8 * (0.5 - conversation.ballPos) - 5 * conversation.ballVel;
        conversation.ballVel += force * dt;
    } else {
        // Drive ball to utterer's extreme, arriving in ttu seconds
        const uttererExtreme = uttererIsA ? 0.0 : 1.0;
        const timeLeft = Math.max(ttu, dt);
        const distLeft = uttererExtreme - conversation.ballPos;
        const targetVel = distLeft / timeLeft;
        conversation.ballVel += (targetVel - conversation.ballVel) * Math.min(1, dt / 0.1);
    }

    conversation.ballPos = Math.max(0, Math.min(1, conversation.ballPos + conversation.ballVel * dt));

    // Bias: slow EMA toward whichever side the ball spends time on
    const sideTarget = conversation.ballPos > 0.5 ? 1 : 0;
    const distFromCenter = Math.abs(conversation.ballPos - 0.5);
    const pullRate = 0.8 * distFromCenter * 2;
    const decayRate = 0.4 * (1 - distFromCenter * 2);
    conversation.ballBias += (sideTarget - conversation.ballBias) * pullRate * dt;
    conversation.ballBias += (0.5 - conversation.ballBias) * decayRate * dt;
    conversation.ballBias = Math.max(0, Math.min(1, conversation.ballBias));
}

export function tick(state: SimState, dt: number): SimEvent[] {
    const out: SimEvent[] = [];
    updateEffectiveStances(state);

    const { partA, partB, relAB, relBA, conversation } = state;
    const stanceA = conversation.effectiveStances.get(partA.id)!;
    const stanceB = conversation.effectiveStances.get(partB.id)!;
    const phaseA = conversation.phases.get(partA.id)!;
    const phaseB = conversation.phases.get(partB.id)!;

    if (phaseA === 'listen' && phaseB === 'listen') {
        conversation.newCycleTimer += dt;
        if (conversation.newCycleTimer >= NEW_CYCLE_DELAY) {
            conversation.newCycleTimer = 0;
            const newSpeaker = stanceA >= stanceB ? partA.id : partB.id;
            const newListener = newSpeaker === partA.id ? partB.id : partA.id;
            conversation.speakerId = newSpeaker;
            conversation.phases.set(newSpeaker, 'speak');
            conversation.phases.set(newListener, 'listen');
            conversation.respondTimer = 0;
            const newSpeakerRel = newSpeaker === partA.id ? relAB : relBA;
            const newSpeakerSelfTrust = newSpeaker === partA.id ? partA.selfTrust : partB.selfTrust;
            resampleStance(newSpeakerRel, newSpeakerSelfTrust);
            out.push({ kind: 'nominate', data: { speakerId: newSpeaker, sampledStance: newSpeakerRel.stance } });
            rollTupleIndex(newSpeakerRel, newSpeaker, conversation);
        }
        tickBall(state, dt);
        state.simTime += dt;
        return out;
    }
    conversation.newCycleTimer = 0;

    const speakerId = conversation.speakerId;
    const listenerId = speakerId === partA.id ? partB.id : partA.id;
    const phaseS = conversation.phases.get(speakerId)!;
    const phaseL = conversation.phases.get(listenerId)!;

    let listeningPart: string | null = null;
    if (phaseS === 'speak' && phaseL === 'listen') listeningPart = listenerId;
    else if (phaseS === 'listen' && phaseL === 'mirror') listeningPart = speakerId;
    else if (phaseS === 'validate' && phaseL === 'listen') listeningPart = listenerId;
    else if (phaseS === 'listen' && phaseL === 'empathize') listeningPart = speakerId;

    if (listeningPart) {
        const listeningStance = conversation.effectiveStances.get(listeningPart)!;
        if (listeningStance > REGULATION_STANCE_LIMIT) {
            conversation.listenerViolationTimer += dt;
            if (conversation.listenerViolationTimer >= LISTENER_VIOLATION_GRACE) {
                conversation.listenerViolationTimer = 0;
                const newListener = listeningPart === partA.id ? partB.id : partA.id;
                conversation.speakerId = listeningPart;
                conversation.phases.set(listeningPart, 'speak');
                conversation.phases.set(newListener, 'listen');
                conversation.respondTimer = 0;
                const violatorRel = listeningPart === partA.id ? relAB : relBA;
                rollTupleIndex(violatorRel, listeningPart, conversation);
            }
        } else {
            conversation.listenerViolationTimer = 0;
        }
    }

    const bothInRange = Math.abs(stanceA) < REGULATION_STANCE_LIMIT && Math.abs(stanceB) < REGULATION_STANCE_LIMIT;
    if (bothInRange) {
        conversation.regulationScore = Math.min(1, conversation.regulationScore + REGULATION_RECOVER_RATE * dt);
    } else {
        conversation.regulationScore = Math.max(0, conversation.regulationScore - REGULATION_DECAY_RATE * dt);
    }

    for (const [id, delta] of conversation.therapistDeltas) {
        const newDelta = delta * Math.exp(-0.08 * dt);
        if (Math.abs(newDelta) < 0.001) conversation.therapistDeltas.delete(id);
        else conversation.therapistDeltas.set(id, newDelta);
    }

    const regulated = conversation.regulationScore > 0.5;

    const utterer = phaseS !== 'listen' ? speakerId : listenerId;
    const uttererPhase = conversation.phases.get(utterer)!;
    const uttererReceiver = utterer === speakerId ? listenerId : speakerId;

    if (uttererPhase !== 'listen') {
        const uttererStance = conversation.effectiveStances.get(utterer)!;
        const uttererRel = utterer === partA.id ? relAB : relBA;

        let shouldSpeak = false;
        let advanceAfter = false;

        if (uttererPhase === 'speak') {
            if (regulated) {
                conversation.respondTimer += dt;
                if (conversation.respondTimer >= RESPOND_DELAY) {
                    shouldSpeak = true;
                    advanceAfter = true;
                }
            } else if (uttererStance >= REGULATION_STANCE_LIMIT) {
                const s = uttererStance + 0.3;
                shouldSpeak = Math.random() < Math.max(0, s) ** 2 * SPEAK_BASE_RATE * dt;
            }
        } else {
            if (regulated) {
                conversation.respondTimer += dt;
                if (conversation.respondTimer >= RESPOND_DELAY) {
                    shouldSpeak = true;
                    advanceAfter = true;
                }
            }
        }

        if (shouldSpeak) {
            const text = getDialogue(uttererRel, uttererPhase, utterer, conversation);
            if (text) {
                const msg: Message = { id: ++state.messageCounter, senderId: utterer, text, phase: uttererPhase, type: 'dialogue' };
                state.messages.push(msg);
                out.push({ kind: 'message', data: msg });
                applyStanceShock(utterer, uttererReceiver, uttererStance, state, out);
                if (advanceAfter) tryAdvancePhase(state, out);
            }
        }
    }

    tickBall(state, dt);
    state.simTime += dt;
    return out;
}

export interface SetupValues {
    selfTrustA: number;
    selfTrustB: number;
    stanceA: number;
    stanceB: number;
    flipOddsA: number;
    flipOddsB: number;
}

export interface ScenarioConfig {
    partA: Omit<Part, 'selfTrust'>;
    partB: Omit<Part, 'selfTrust'>;
    relAB: { trust: number; trustFloor: number; dialogues: ConversationDialogues };
    relBA: { trust: number; trustFloor: number; dialogues: ConversationDialogues };
}

export function createState(setup: SetupValues, scenario: ScenarioConfig): SimState {
    const partA: Part = { ...scenario.partA, selfTrust: setup.selfTrustA };
    const partB: Part = { ...scenario.partB, selfTrust: setup.selfTrustB };

    const relAB: InterPartRelation = {
        ...scenario.relAB,
        stance: setup.stanceA,
        stanceMagnitude: setup.stanceA,
        stanceFlipOdds: setup.flipOddsA,
    };

    const relBA: InterPartRelation = {
        ...scenario.relBA,
        stance: setup.stanceB,
        stanceMagnitude: setup.stanceB,
        stanceFlipOdds: setup.flipOddsB,
    };

    const conversation: ConversationState = {
        speakerId: partA.id,
        phases: new Map(),
        effectiveStances: new Map(),
        therapistDeltas: new Map(),
        activeTupleIndex: new Map(),
        regulationScore: 0,
        respondTimer: 0,
        newCycleTimer: 0,
        listenerViolationTimer: 0,
        ballPos: 0.5,
        ballVel: 0,
        ballUttererIsA: true,
        ballBias: 0.5,
    };

    const state: SimState = {
        partA, partB, relAB, relBA, conversation,
        messages: [], messageCounter: 0,
        simTime: 0, cyclesCompleted: 0,
    };
    initConversation(state);
    return state;
}
