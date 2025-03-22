import Skyblock from "../../BloomCore/Skyblock";
import { onChatPacket } from "../../BloomCore/utils/Events";
import { registerWhen } from "../../BloomCore/utils/Utils";
import PogObject from "../../PogData";
import { MODULENAME, Tasks } from "../utils/Utils";
import { getPlayerByName } from "./BigPlayer";

const partyFinderInfo = new HashMap();
const partySlotInfo = new HashMap();
const playerClassInfo = new PogObject(`${MODULENAME}/data`, {selectedClass: "Mage"}, "classinfo.json");
const dodgeRedColor = Renderer.color(255, 60, 60, 127);
const goodGreenColor = Renderer.color(60, 175, 60, 127);
const darkBackgroundColor = Renderer.color(0, 0, 0, 200);
let lastHoveredSlot;


registerWhen(register("renderSlot", (slot, gui, event) => {
    if (!partySlotInfo.containsKey(slot.getIndex())) return;

    let info = partySlotInfo.get(slot.getIndex());
    const x = slot.getDisplayX();
    const y = slot.getDisplayY();

    Tessellator.pushMatrix();

    if (info.color) {
        Renderer.drawRect(info.color, x, y, 16, 16);
    }

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
    }

    partyFinderInfo.keySet().forEach(i => {
        // if (partySlotInfo.containsKey(i)) return;
        let info = {};

        let players = partyFinderInfo.get(i)[0];
        let missingClasses = partyFinderInfo.get(i)[1];
        info.missingStr = missingClasses.map(str => str.charAt(0)).join(" ");
        if (missingClasses.includes(playerClassInfo["selectedClass"])) {
            info["color"] = goodGreenColor;
        }

        info.playerInfo = [];
        
        for (let i = 0; i < players.length; i++) {
            info["playerInfo"].push([players[i], getPlayerByName(players[i], Tasks.PFINFO)]); // name, if theyre dodged
        }

        if (info["playerInfo"].some(val => val[1] == "DODGED")) {
            info["color"] = dodgeRedColor;
        } else if (info?.["color"] == undefined) {
            info["color"] = false;
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


registerWhen(register("tick", () => {
    if (Player.getContainer()?.getName() != "Party Finder") return;
    
    let tempSlot = Client.currentGui.getSlotUnderMouse()
    if (tempSlot) {
        let tempIndex = tempSlot.getIndex();
        if (partySlotInfo.containsKey(tempIndex)) {
            lastHoveredSlot = tempIndex;
        }
    }
}), () => Skyblock.area == "Dungeon Hub");


registerWhen(register("guiRender", () => {
    if (!partyFinderInfo.containsKey(lastHoveredSlot)) return;

    let info = partySlotInfo.get(lastHoveredSlot);

    Tessellator.pushMatrix();

    Renderer.drawRect(darkBackgroundColor, 10, 10, Renderer.screen.getWidth() * .25, Renderer.screen.getHeight() * .85);
    Renderer.translate(15, 15, 1000);
    Renderer.drawString(`bigtracker party info`, 0, 0);
    Renderer.translate(0, 0, 1000);

    let theScale = 1 - (info.playerInfo.length * .125);
    let startY = 30 / theScale;
    let spacing = (6 + (4 - info.playerInfo.length)) / theScale;
    let theX = 15 / theScale;
    
    let atLine = 0;
    let lastWas = false;

    for (let i = 0; i < info.playerInfo.length; i++) {
        let temp = info.playerInfo[i];
        let pfInfo = temp[1];

        if (typeof pfInfo == typeof {}) {
            if (atLine != 0  && !lastWas) atLine++;
            Renderer.scale(theScale);
            Renderer.drawString(`>> ${temp[0]}`, theX, (startY + (spacing * atLine)));
            atLine++;

            let infoKeys = Object.keys(pfInfo);
            for (let k = 0; k < infoKeys.length; k++) {
                Renderer.scale(theScale);
                Renderer.drawString(`${infoKeys[k]}: ${pfInfo[infoKeys[k]]}`, theX, (startY + (spacing * atLine)));
                atLine++;
            }
            lastWas = true;
        } else {
            Renderer.scale(theScale);
            Renderer.drawString(`${temp[0]}: ${pfInfo ?? "?"}`, theX, (startY + (spacing * atLine)));
            lastWas = false;
        }
        
        atLine++;
    }

    Tessellator.popMatrix();
}), () => lastHoveredSlot != undefined);