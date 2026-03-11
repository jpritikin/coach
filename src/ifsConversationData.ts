import { ScenarioConfig } from './ifsConversationSim.js';

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
                [
                    "The Shamer is going to destroy everything we've built.",
                    "The Drinker thinks the Shamer is tearing things apart.",
                    "Not what the Shamer means. The Shamer is trying to stop a worse collapse.",
                    "The Shamer is scared of a collapse — not trying to cause one.",
                    "Right. The Shamer sees the collapse coming and doesn't know how to stop it.",
                    "The Drinker didn't hear fear in it before. The Drinker can hear it now.",
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
                [
                    "The Shamer keeps score of every slip.",
                    "The Drinker feels judged — like the Shamer is counting failures.",
                    "That's not quite it. The Shamer remembers because it's afraid of repeating.",
                    "The Shamer tracks slips because it's afraid, not to punish.",
                    "Yes. Every slip the Shamer remembers is a moment the Shamer was terrified.",
                    "Keeping score out of fear — the Drinker didn't see it that way before.",
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
                [
                    "The Shamer learned to be loud from our parent. The Shamer didn't choose it.",
                    "The Shamer is saying it inherited this harshness.",
                    "More than inherited — it was the only way the Shamer knew to care.",
                    "The Shamer was harsh because caring quietly wasn't safe to learn.",
                    "Yes. Loud and harsh was the only version of care the Shamer was shown.",
                    "The Drinker sees the Shamer differently now. They learned from the same place.",
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
                [
                    "The Shamer wants to hand over some of this watching to the Drinker.",
                    "The Shamer wants to share the vigilance — not carry it alone.",
                    "It's less about sharing and more about trusting the Drinker to notice.",
                    "The Shamer wants to trust the Drinker to catch the warning signs.",
                    "Yes. If the Drinker can notice, the Shamer doesn't have to stay so loud.",
                    "The Drinker wants that responsibility. The Drinker can try to hold it.",
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
                [
                    "The Drinker didn't ask for any of this.",
                    "The Drinker feels like this was forced on it.",
                    "Not just forced — the Drinker never had a choice about how it learned to cope.",
                    "The Drinker is saying it had no choice — this was survival, not preference.",
                    "Right. The Drinker was doing the only thing available. There was no better option then.",
                    "The Shamer never thought about it as survival. That changes how the Shamer sees it.",
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
                [
                    "The Drinker isn't weak. The Drinker is overwhelmed.",
                    "The Drinker doesn't want to be seen as weak.",
                    "It's more than that — the Drinker needs the Shamer to understand the difference.",
                    "The Drinker is saying weak and overwhelmed are not the same thing.",
                    "Yes. Weak is a choice. Overwhelmed is what happens when too much lands at once.",
                    "The Shamer has been treating them as the same. The Shamer can stop doing that.",
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
                [
                    "The Drinker has been trying to put this down for a long time.",
                    "The Drinker has been trying to stop.",
                    "Not just trying — the Drinker has been exhausted by trying and failing alone.",
                    "The Drinker has been trying to stop alone, and it's worn the Drinker out.",
                    "Yes. Every failed attempt costs something. The Drinker is running low.",
                    "The Shamer didn't know the Drinker was already fighting. The Shamer wants to help now.",
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
                [
                    "The Drinker could use a signal — something that isn't an attack.",
                    "The Drinker wants a way for the Shamer to reach it that doesn't feel like an assault.",
                    "Something quieter — a nudge rather than a verdict.",
                    "The Drinker wants the Shamer to find a gentler way to make contact.",
                    "Yes. The Drinker can respond to a nudge. It's the verdict that shuts the Drinker down.",
                    "The Shamer can learn to nudge. That's worth trying.",
                ],
            ],
        },
    },
};
