import { ConversationDialogues, Part } from './ifsConversationSim.js';

export interface ScenarioConfig {
    partA: Omit<Part, 'selfTrust'>;
    partB: Omit<Part, 'selfTrust'>;
    relAB: { trust: number; trustFloor: number; dialogues: ConversationDialogues };
    relBA: { trust: number; trustFloor: number; dialogues: ConversationDialogues };
}

export const shamedDrinkerScenario: ScenarioConfig = {
    partA: { id: 'shamer', name: 'Shamer' },
    partB: { id: 'drinker', name: 'Drinker' },
    relAB: {
        trust: 0.2, trustFloor: 0,
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
    },
    relBA: {
        trust: 0.2, trustFloor: 0,
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
    },
};
