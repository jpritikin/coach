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
const SUSTAINED_TRUST_INTERVAL = 10;
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
    stanceFlipOdds: number;
    dialogues?: ConversationDialogues;
}

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
    sustainedRegulationTimer: number;
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
    simTime: number;
}

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
    lastShock: ShockEvent | null;
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

function applyStanceShock(speakerId: string, receiverId: string, speakerStance: number, state: SimState): void {
    const receiverRel = receiverId === state.partA.id ? state.relAB : state.relBA;
    const speakerRel = speakerId === state.partA.id ? state.relAB : state.relBA;
    const selfTrust = receiverId === state.partA.id ? state.partA.selfTrust : state.partB.selfTrust;
    const shockMag = 0.3 * Math.abs(speakerStance) * 2 / ((1 + selfTrust) * (1 + receiverRel.trust));
    const sameDir = Math.random() < speakerRel.stanceFlipOdds;
    const dir = sameDir ? Math.sign(speakerStance) : -Math.sign(speakerStance);
    if (dir === 0) return;
    const delta = dir * shockMag;
    receiverRel.stance = clamp(receiverRel.stance + delta);
    const trustBefore = receiverRel.trust;
    addInterPartTrust(receiverRel, -shockMag);
    const trustAfter = receiverRel.trust;
    const receiverName = receiverId === state.partA.id ? state.partA.name : state.partB.name;
    const speakerName = speakerId === state.partA.id ? state.partA.name : state.partB.name;
    const trustDelta = trustAfter - trustBefore;
    if (Math.abs(trustDelta) >= 0.001) {
        state.messages.push({
            id: ++state.messageCounter,
            senderId: receiverId,
            text: `${speakerName}→${receiverName} trust ${trustBefore.toFixed(2)} → ${trustAfter.toFixed(2)} (shock)`,
            phase: 'listen',
            type: 'trust',
        });
    }
    state.lastShock = { receiverId, delta, simTime: state.simTime };
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

function tryAdvancePhase(state: SimState): void {
    const { partA, partB, relAB, relBA, conversation } = state;
    const speakerId = conversation.speakerId;
    const listenerId = speakerId === partA.id ? partB.id : partA.id;
    const phaseS = conversation.phases.get(speakerId)!;
    const phaseL = conversation.phases.get(listenerId)!;
    const relSL = speakerId === partA.id ? relAB : relBA;
    const relLS = speakerId === partA.id ? relBA : relAB;

    conversation.respondTimer = 0;
    if (phaseS === 'speak' && phaseL === 'listen') {
        conversation.phases.set(speakerId, 'listen');
        conversation.phases.set(listenerId, 'mirror');
        const before = relLS.trust;
        addInterPartTrust(relLS, 0.05 * (1 - relLS.trust));
        logTrustChange(state, relLS, before, listenerId, speakerId, 'mirroring');
    } else if (phaseS === 'listen' && phaseL === 'mirror') {
        conversation.phases.set(speakerId, 'validate');
        conversation.phases.set(listenerId, 'listen');
        const before = relSL.trust;
        addInterPartTrust(relSL, 0.05 * (1 - relSL.trust));
        logTrustChange(state, relSL, before, speakerId, listenerId, 'validating');
    } else if (phaseS === 'validate' && phaseL === 'listen') {
        conversation.phases.set(speakerId, 'listen');
        conversation.phases.set(listenerId, 'empathize');
        const before = relLS.trust;
        addInterPartTrust(relLS, 0.05 * (1 - relLS.trust));
        logTrustChange(state, relLS, before, listenerId, speakerId, 'empathizing');
    } else if (phaseS === 'listen' && phaseL === 'empathize') {
        const gain = 0.5 * (1 - Math.min(relAB.trust, relBA.trust));
        const beforeAB = relAB.trust;
        const beforeBA = relBA.trust;
        addInterPartTrust(relAB, gain);
        addInterPartTrust(relBA, gain);
        logTrustChange(state, relAB, beforeAB, partA.id, partB.id, 'cycle complete');
        logTrustChange(state, relBA, beforeBA, partB.id, partA.id, 'cycle complete');
        conversation.phases.set(speakerId, 'listen');
        conversation.phases.set(listenerId, 'listen');
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
            let listeningIsA: boolean | null = null;
            if (phaseS === 'speak' && phaseL === 'listen') listeningIsA = !isA(ls.speakerId);
            else if (phaseS === 'listen' && phaseL === 'mirror') listeningIsA = isA(ls.speakerId);
            else if (phaseS === 'validate' && phaseL === 'listen') listeningIsA = !isA(ls.speakerId);
            else if (phaseS === 'listen' && phaseL === 'empathize') listeningIsA = isA(ls.speakerId);

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

export function tick(state: SimState, dt: number): void {
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
            rollTupleIndex(newSpeakerRel, newSpeaker, conversation);
        }
        tickBall(state, dt);
        state.simTime += dt;
        return;
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
    if (conversation.regulationScore > 0.5) {
        conversation.sustainedRegulationTimer += dt;
        if (conversation.sustainedRegulationTimer >= SUSTAINED_TRUST_INTERVAL) {
            conversation.sustainedRegulationTimer -= SUSTAINED_TRUST_INTERVAL;
            addInterPartTrust(relAB, 0.01 * (1 - relAB.trust));
            addInterPartTrust(relBA, 0.01 * (1 - relBA.trust));
        }
    } else {
        conversation.sustainedRegulationTimer = 0;
    }

    for (const [id, delta] of conversation.therapistDeltas) {
        const newDelta = delta * Math.exp(-0.08 * dt);
        if (Math.abs(newDelta) < 0.001) conversation.therapistDeltas.delete(id);
        else conversation.therapistDeltas.set(id, newDelta);
    }

    const regulated = conversation.regulationScore > 0.5;

    // The active utterer is whoever has a non-listen phase.
    // In speak/listen: speakerId utters.
    // In listen/mirror or listen/empathize: listenerId utters.
    // In validate/listen: speakerId utters.
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
                state.messages.push({ id: ++state.messageCounter, senderId: utterer, text, phase: uttererPhase, type: 'dialogue' });
                applyStanceShock(utterer, uttererReceiver, uttererStance, state);
                if (advanceAfter) tryAdvancePhase(state);
            }
        }
    }

    tickBall(state, dt);
    state.simTime += dt;
}

export interface SetupValues {
    selfTrustA: number;
    selfTrustB: number;
    stanceA: number;       // initial stance for Shamer (positive = dysregulated)
    stanceB: number;       // initial stance for Drinker
    flipOddsA: number;     // probability stance is flipped on init (0–1)
    flipOddsB: number;
}

export function createState(setup: SetupValues): SimState {
    const partA: Part = { id: 'shamer', name: 'Shamer', selfTrust: setup.selfTrustA };
    const partB: Part = { id: 'drinker', name: 'Drinker', selfTrust: setup.selfTrustB };

    const relAB: InterPartRelation = {
        trust: 0.2, trustFloor: 0, stance: setup.stanceA, stanceFlipOdds: setup.flipOddsA,
        dialogues: {
            hostile: [
                [
                    "The Drinker is turning us into our parent.",
                    "The Shamer thinks the Drinker is becoming our parent.",
                    "Yes. The Drinker is doing exactly what our parent did.",
                    "That lands hard. The Drinker doesn't want to hear it — but the Shamer is scared.",
                ],
                [
                    "The Shamer won't let the Drinker have one moment of peace.",
                    "The Drinker just wants the Shamer to back off.",
                    "Every time the Drinker tries to rest, the Shamer is there attacking.",
                    "The Drinker is exhausted by the Shamer. The Shamer hears that.",
                ],
            ],
            guarded: [
                [
                    "The Shamer has seen where this road leads.",
                    "The Shamer is worried about where the drinking is heading.",
                    "Yes. The Shamer has watched it happen before — with our parent.",
                    "The Drinker didn't realize the Shamer was carrying that too.",
                ],
                [
                    "The Shamer is trying to protect us, not punish us.",
                    "The Shamer wants to protect, not attack.",
                    "Right. The Shamer just doesn't know how to do it without getting loud.",
                    "The Drinker can see the Shamer is trying. That helps a little.",
                ],
            ],
            opening: [
                [
                    "The Shamer is scared — not angry. Scared we'll end up like our parent.",
                    "The Shamer is frightened, not just critical.",
                    "Yes. The anger is on top. Underneath it the Shamer is terrified.",
                    "The Drinker didn't know fear was driving this. That changes something.",
                ],
                [
                    "The Shamer doesn't want to be the enemy. The Shamer wants us to survive.",
                    "The Shamer wants to be on the Drinker's side.",
                    "Exactly. The Shamer needs the Drinker to still be here.",
                    "The Drinker wants that too. Maybe we've both been fighting the wrong battle.",
                ],
            ],
            collaborative: [
                [
                    "What if the Shamer and the Drinker looked for another way together?",
                    "The Shamer wants to find a different path — with the Drinker, not against.",
                    "Yes. The Shamer is done fighting. The Shamer wants to problem-solve.",
                    "The Drinker is in. Tell the Shamer what the Shamer needs from the Drinker.",
                ],
                [
                    "The Shamer could warn us without attacking. Just a signal, not a verdict.",
                    "The Shamer is offering to tone down — just flag the danger instead of condemning.",
                    "Right. The Shamer can do that if the Drinker agrees to listen.",
                    "The Drinker can try to listen. That feels like a real agreement.",
                ],
            ],
        },
    };

    const relBA: InterPartRelation = {
        trust: 0.2, trustFloor: 0, stance: setup.stanceB, stanceFlipOdds: setup.flipOddsB,
        dialogues: {
            hostile: [
                [
                    "Leave the Drinker alone.",
                    "The Drinker wants to be left alone.",
                    "Yes. The Shamer's constant lectures make everything worse.",
                    "The Shamer hears that. The Drinker feels hounded.",
                ],
                [
                    "The Shamer sounds just like our parent.",
                    "The Drinker is saying the Shamer reminds the Drinker of our parent.",
                    "Exactly. The same tone. The same contempt.",
                    "That comparison stings. The Shamer doesn't want to be that.",
                ],
            ],
            guarded: [
                [
                    "The Drinker is just trying to get through tonight.",
                    "The Drinker needs to survive tonight — that's what this is about.",
                    "Right. It's not about our parent. It's about right now.",
                    "The Shamer can hear that. Tonight is hard.",
                ],
                [
                    "The Shamer doesn't know how loud it gets inside.",
                    "The Drinker is carrying a lot of noise the Shamer can't see.",
                    "Yes. When it gets loud, drinking is the only thing that quiets it.",
                    "The Shamer didn't know it was that loud. The Drinker is heard.",
                ],
            ],
            opening: [
                [
                    "The Drinker doesn't actually want to drink.",
                    "The Drinker is saying the drinking isn't really what the Drinker wants.",
                    "Right. The Drinker just doesn't know what else to do with all of this.",
                    "Then the Shamer has been blaming the Drinker for something the Drinker is also struggling with.",
                ],
                [
                    "The Drinker learned this from our parent. The Drinker didn't choose it.",
                    "The Drinker is saying this pattern was inherited, not chosen.",
                    "Yes. The Drinker has been carrying what our parent left behind.",
                    "That took courage to say. The Shamer sees the Drinker differently now.",
                ],
            ],
            collaborative: [
                [
                    "The Drinker wants the Shamer as an ally, not a judge.",
                    "The Drinker needs the Shamer on the same side.",
                    "Yes. If the Shamer is with the Drinker, the Drinker doesn't need the drinking as much.",
                    "The Shamer wants that too. The Shamer has always wanted that.",
                ],
                [
                    "What if the Drinker checked in with the Shamer before reaching for the bottle?",
                    "The Drinker is offering to pause and consult instead of acting alone.",
                    "Right. Just a moment — enough to ask if there's another way.",
                    "The Shamer can work with that. That's all the Shamer ever wanted.",
                ],
            ],
        },
    };

    const conversation: ConversationState = {
        speakerId: partA.id,
        phases: new Map(),
        effectiveStances: new Map(),
        therapistDeltas: new Map(),
        activeTupleIndex: new Map(),
        regulationScore: 0,
        respondTimer: 0,
        sustainedRegulationTimer: 0,
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
        lastShock: null,
    };
    initConversation(state);
    return state;
}
