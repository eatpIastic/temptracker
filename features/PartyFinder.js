import Skyblock from "../../BloomCore/Skyblock";
import { onChatPacket } from "../../BloomCore/utils/Events";
import { registerWhen } from "../../BloomCore/utils/Utils";
import PogObject from "../../PogData";
import { MODULENAME } from "../utils/Utils";

const partyFinderInfo = new HashMap();
const partySlotInfo = new HashMap();
const playerClassInfo = new PogObject(`${MODULENAME}/data`, {selectedClass: "Mage"}, "classinfo.json");
const dodgeRedColor = Renderer.color(255, 60, 60, 127);
const goodGreenColor = Renderer.color(60, 175, 60, 127);
const darkBackgroundColor = Renderer.color(0, 0, 0, 200);
let lastHoveredSlot;


/**
 * 
 * once i have player tracking make it so:
 * gui has dodged players listed
 * gui has a runtime with that party guess
 * red highlight means someone is dodged
 * green highlight means a party is available with your class and nobody is dodged
 * 
 */


registerWhen(register("renderSlot", (slot, gui, event) => {
    if (!partySlotInfo.containsKey(slot.getIndex())) return;

    let info = partySlotInfo.get(slot.getIndex());
    const x = slot.getDisplayX();
    const y = slot.getDisplayY();

    Tessellator.pushMatrix();
    Renderer.drawRect(info.color, x, y, 16, 16);

    Renderer.translate(x, y - (slot.getIndex() % 2 == 0 ? 0 : 4), 1000);
    Renderer.scale(0.5, 0.5);
    Renderer.drawString(info.missingStr, 0, 16, true);
    
    
    Tessellator.popMatrix();
}), () => !partySlotInfo.isEmpty());

registerWhen(register("step", () => {
    let container = Player.getContainer();

    if (!container) return;

    if (container.getName() != "Party Finder") return;

    let itemList = container.getItems();
    for (let i = 0; i < itemList.length; i++) {
        let item = itemList[i];
        if (!item) continue;
        if (partyFinderInfo.containsKey(i)) continue;
        let match = item.getName()?.match(/\w{3,16}'s Party.*/);
        if (!match) continue;

        let playerList = [];
        let lore = item.getLore();
        let missing = ["Archer", "Berserk", "Mage", "Tank", "Healer"];
        for (let k = 0; k < lore.length; k++) {
            let line = lore[k].removeFormatting();
            let playerMatch = line.match(/\s*(\w{3,16}): (Healer|Archer|Mage|Tank|Berserk) \(\d{1,3}\).*/);
            if (!playerMatch) continue;
            playerList.push(playerMatch[1]);
            missing = missing.filter(className => className != playerMatch[2]);
        }

        partyFinderInfo.put(i, [playerList, [...missing]]);
        // console.log(`Party ${i}: ${[...playerList].join(", ")}`);
    }

    partyFinderInfo.keySet().forEach(i => {
        if (partySlotInfo.containsKey(i)) return;
        let info = {};

        let players = partyFinderInfo.get(i)[0];
        let missingClasses = partyFinderInfo.get(i)[1];
        info.missingStr = missingClasses.map(str => str.charAt(0)).join(" ");
        if (missingClasses.includes(playerClassInfo["selectedClass"])) {
            info["color"] = goodGreenColor;
        } else {
            info["color"] = dodgeRedColor;
        }
        info.playerInfo = [];
        for (let i = 0; i < players.length; i++) {
            info.playerInfo.push([players[i], false]); // name, if theyre dodged. (temp just static)
        }

        partySlotInfo.put(i, info);
    });

}).setFps(5), () => Skyblock.area == "Dungeon Hub");

register("guiClosed", (event) => {
    partyFinderInfo.clear();
    partySlotInfo.clear();
    lastHoveredSlot = undefined;
});

onChatPacket( (className) => {
    playerClassInfo["selectedClass"] = className;
    playerClassInfo.save();
}).setCriteria(/You have selected the (\w{4,7}) Dungeon Class!/);

register("tick", () => {
    let tempSlot = Client.currentGui.getSlotUnderMouse()
    if (tempSlot) {
        let tempIndex = tempSlot.getIndex();
        if (partySlotInfo.containsKey(tempIndex)) {
            lastHoveredSlot = tempIndex;
        }
    }
});

registerWhen(register("guiRender", () => {
    let info = partySlotInfo.get(lastHoveredSlot);

    Tessellator.pushMatrix();
    // Renderer.translate(10, 10, 500);

    Renderer.drawRect(darkBackgroundColor, 10, 10, Renderer.screen.getWidth() / 4, Renderer.screen.getHeight() / 3);
    Renderer.translate(15, 15, 1000);
    Renderer.drawString(`bigtracker party info`, 0, 0);
    Renderer.translate(0, 0, 1000);
    Renderer.drawString(`${info.missingStr}`, 15, 25);
    for (let i = 0; i < info.playerInfo.length; i++) {
        let temp = info.playerInfo[i];
        Renderer.drawString(`${temp[0]}: ${temp[1] ? "X" : ":)"}`, 15, 35 + (i * 10)); // idk just temp until i have actual player stat and dodge tracking
    }

    Tessellator.popMatrix();
}), () => lastHoveredSlot != undefined);