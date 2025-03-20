import Dungeon from "../../BloomCore/dungeons/Dungeon";
import { registerWhen } from "../../BloomCore/utils/Utils";
import { onChatPacket } from "../../BloomCore/utils/Events";
import { S32PacketConfirmTransaction } from "../utils/Utils";

let currentRun;
let tick;

class DungeonRun {
    constructor() {
        this.splits = {};
        this.saved = false;
        this.ssDone = false;
        this.pre4Done = false;
    }

    // doNextSplit() {
        
    // }

    checkDev(name) {
        let playerClass = Dungeon.playerClasses[name]["class"];
        let completedAt = [Date.now() - this.splits["TERMS"][0], tick - this.splits["TERMS"][1]];

        if (!this.pre4Done && completedAt[0] > 17000) {
            let theBers = Object.keys(Dungeon.playerClasses).find(p => Dungeon.playerClasses[p]["class"] == "Berserk");
            if (!theBers) return;
            
            // pre 4 failed
        }
    }

    endRun() {
        if (this.saved) return;
        this.saved = true;
    }
}

onChatPacket( () => {
    currentRun = new DungeonRun();
}).setCriteria(/\[NPC\] Mort: Here, I found this map when I first entered the dungeon./);

onChatPacket( (text) => {
    // end br, start camp
    // You have proven yourself. You may pass.
}).setCriteria(/\[BOSS\] The Watcher: (.+)/);

onChatPacket( () => {
    // end portal, start maxor
}).setCriteria(/\[BOSS\] Maxor: WELL! WELL! WELL! LOOK WHO'S HERE!/);

onChatPacket( () => {
    // end maxor, start storm
}).setCriteria(/\[BOSS\] Storm: Pathetic Maxor, just like expected./);

onChatPacket( () => {
    // end storm, start terms
}).setCriteria(/\[BOSS\] Goldor: Who dares trespass into my domain\?/);

onChatPacket( () => {
    // end terms, start goldor
}).setCriteria(/The Core entrance is opening!/);

onChatPacket( () => {
    // end goldor, start necron
}).setCriteria(/\[BOSS\] Necron: You went further than any human before, congratulations./);

onChatPacket( () => {
    // end necron, start p5
}).setCriteria(/\[BOSS\] Necron: All this, for nothing\.\.\./);

// onChatPacket( () => {

// }).setCriteria(/\[BOSS\] .+ Livid: My shadows are everywhere, THEY WILL FIND YOU!!/);

onChatPacket( () => {
    currentRun.endRun();
}).setCriteria(/\s+☠ Defeated (.+) in (\d+)m\s+(\d+)s/);

onChatPacket( (name) => {
    currentRun.checkDev(name);
}).setCriteria(/(\w{3,16}) completed a device!.+/);













export class ClearSplits {
    static BR = "BR";
    static CAMP = "CAMP";
    static PORTAL = "PORTAL";
}

export const F7Splits = [
    "MAXOR",
    "STORM",
    "TERMS",
    "GOLDOR",
    "NECRON",
    "P5"
];
// export class F7Splits {
//     static MAXOR = "MAXOR";
//     static STORM = "STORM";
//     static TERMS = "TERMS";
//     static GOLDOR = "GOLDOR";
//     static NECRON = "NECRON";
//     static P5 = "P5";
// }

register("packetReceived", (packet, event) => {
    tick++;
}).setFilteredClass(S32PacketConfirmTransaction);

register("worldLoad", () => {
    tick = 0;
});
