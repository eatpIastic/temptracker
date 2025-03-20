import { onChatPacket } from "../../BloomCore/utils/Events";
import Dungeon from "../../BloomCore/dungeons/Dungeon";
import Skyblock from "../../BloomCore/Skyblock";
import PogObject from "../../PogData";
import { MODULENAME, formatNumber } from "../utils/Utils";
import { registerWhen, C0EPacketClickWindow } from "../../BloomCore/utils/Utils";
import Prices from "../utils/Prices";

const kismetData = new PogObject(`${MODULENAME}/data`, {chests: []}, "kismetChests.json");

const isRecent = (t) => Date.now() - t < 172800000;

const fakeSlotToData = new HashMap();
const currentChestsPrices = new HashMap();
let page = 0;
let clickedSlot = 0;

onChatPacket( () => {
    if (!Dungeon.inDungeon) return;
    kismetData["chests"].unshift({time: Date.now(), rerolled: false});
    kismetData["chests"] = kismetData["chests"].filter(c => isRecent(c["time"]));
    kismetData.save();
}).setCriteria(/\s*☠ Defeated (.+) in (\d+)m\s+(\d+)s/);

registerWhen(register("step", () => {
    Prices.checkPrices();
    kismetData["chests"] = kismetData["chests"].filter(c => isRecent(c["time"]));
}).setFps(1), () => Skyblock.area == "Dungeon Hub");

registerWhen(register("tick", () => {
    let container = Player?.getContainer();
    if (container?.getName()?.includes("The Catacombs")) {
        findChestProfits();
        return;
    } else {
        if (!currentChestsPrices.isEmpty()) {
            currentChestsPrices.clear();
        }
    }


    if (!container || container?.getName() != "Croesus") return;

    let itemList = container.getItems().filter(i => i?.getName()?.includes("The Catacombs"));

    for (let i = 0; i < itemList.length; i++) {
        let item = itemList[i];
        let lore = item.getLore();

        let isRerolled = kismetData["chests"]?.[i]?.["rerolled"] ?? true;
        let isOpened, canKey, notOpened;

        for (let element of lore) {
            let line = element.removeFormatting();
            isOpened = isOpened || line.includes("No more Chests to open!");
            canKey = canKey || line.includes("Opened Chest: ");
            notOpened = notOpened || line.includes("No Chests Opened!");
        }

        fakeSlotToData.put(i, {
            isRerolled: isRerolled,
            isOpened: isOpened,
            canKey: canKey,
            notOpened: notOpened
        });
    }
}), () => Skyblock.area == "Dungeon Hub");

registerWhen(register("tick", () => {
    let container = Player.getContainer();
    if (!container) return;
    if (!currChestVal && container.getName().match(/(Wood|Gold|Diamond|Emerald|Obsidian|Bedrock) Chest/)) {
        currChestVal = getContainerValue();
        drawProfit = formatNumber(Math.floor(currChestVal));
        drawProfitW = Renderer.getStringWidth(drawProfit);
    }
}), () => (Dungeon.inDungeon && Dungeon.runEnded) || Skyblock.area == "Dungeon Hub");

let currChestVal;
let drawProfit;
let drawProfitW;
let minRerollProtProfit = 50000;

registerWhen(register("guiMouseClick", (mx, my, mb, gui, event) => {
    if (mb != 0 && mb != 1) return;
    
    let slot = Client.currentGui.getSlotUnderMouse();
    if (!slot) return;

    let currIndex = slot.getIndex();
    let item = Player.getContainer().getStackInSlot(currIndex);
    if (item?.getName()?.removeFormatting() != "Reroll Chest") return;

    if (currChestVal > minRerollProtProfit) {
        World.playSound("game.player.hurt.fall.big", 1, 1);
        ChatLib.chat(`&7> &cPrevented Chest Reroll: &6${drawProfit}`);
        cancel(event);
        console.log("cancelled");
    }
}), () => Dungeon.inDungeon || Skyblock.area == "Dungeon Hub");

register("guiClosed", () => {
    drawProfit = undefined;
    drawProfitW = undefined;
    currChestVal = undefined;
});

const getContainerValue = () => {
    let currContainer = Player.getContainer();
    if (!currContainer) return null;

    let items = currContainer.getItems();
    let profit = 0;
    for (let i = 0; i < items.length - 50; i++) {
        if (!items?.[i] || items[i].getName()?.trim() == "") continue;
        let itemName = items[i].getName().removeFormatting();
        let lore = items[i].getLore();

        if (itemName.includes("Enchanted Book")) {
            itemName = `Enchanted Book (${lore[1].removeFormatting()})`;
            console.log(`book: ${itemName}, ${Prices.getPrice(itemName)}`);
            profit += Prices.getPrice(itemName);
        } else if (itemName.includes(" Essence x")) {
            let match = itemName.match(/((Undead|Wither) Essence) x(\d+).*/);
            let price = Prices.getPrice(match[1]);
            let amt = parseInt(match[3]);
            console.log(`essence ${price} ${amt} ${match[3]}`);

            profit += (price * amt);
        } else if (itemName.includes("Open Reward Chest")) {
            for (let k = 0; k < lore.length; k++) {
                let loreLine = lore[k].removeFormatting().replaceAll(",", "").trim();
                if (loreLine.match(/(\d+) Coins/)) {
                    let amtMatch = loreLine.match(/(\d+) Coins/);
                    console.log(`cost: ${amtMatch[1]}`)
                    profit -= parseInt(amtMatch[1]);
                } else if (loreLine == "Dungeon Chest Key") {
                    console.log("subtracting dungeon chest key price");
                    profit -= Prices.getPrice("DUNGEON_CHEST_KEY");
                }
            }
        } else {
            console.log(`adding ${itemName}: ${Prices.getPrice(itemName)}`)
            if (itemName.includes("Shiny ")) itemName = itemName.replace("Shiny ", "");

            profit += Prices.getPrice(itemName) ?? 0;
        }
    }

    console.log(profit)
    return profit;
}

registerWhen(register("renderSlot", (slot, gui, event) => {
    if (currChestVal) {
        if (slot.getIndex() != 41) return;
        let x = slot.getDisplayX();
        let y = slot.getDisplayY();

        Tessellator.pushMatrix();

        Renderer.colorize(0, 212, 255, 255);
        Renderer.translate(x - (drawProfitW / 2), y - 2, 1000);
        Renderer.drawString(`${drawProfit}`, 0, 0);

        Tessellator.popMatrix();

        return;
    }


    if (!fakeSlotToData.isEmpty() && Player.getContainer()?.getName() == "Croesus") {
        if (slot.getIndex() % 9 == 0 || (slot.getIndex() + 1) % 9 == 0) return;
        croesusRendering(slot, gui, event);
        return;
    }
    
    if (!currentChestsPrices.isEmpty()) {
        chestProfitRendering(slot, gui, event);
        return;
    }
}), () => Skyblock.area == "Dungeon Hub");

const chestProfitRendering = (slot, gui, event) => {
    let index = slot.getIndex();
    if (!currentChestsPrices.containsKey(index)) return;

    let x = slot.getDisplayX();
    let y = slot.getDisplayY();
    let profitInfo = currentChestsPrices.get(index);

    let alreadyOpened = profitInfo[4];
    if (alreadyOpened) return;
    
    let coins = profitInfo[0];
    let color = profitInfo[1];
    let lower = profitInfo[2];
    let strW = profitInfo[3];
    

    Tessellator.pushMatrix();
    Renderer.drawRect(color, x, y, 16, 16);

    Renderer.translate(x - (strW > 16 ? (strW - 16) / 2 : 0), y + (lower ? 16 : 0), 1000);
    Renderer.colorize(0, 212, 255, 255);
    Renderer.drawString(`${coins}`, 0, 0);

    Tessellator.popMatrix();
}

const findChestProfits = () => {
    if (!currentChestsPrices.isEmpty()) return;
    let container = Player.getContainer();
    let items = container.getItems();

    let keysAndProfit = [];

    for (let i = 0; i < items.length; i++) {
        if (!items[i]?.getName()?.match(/(Wood|Gold|Diamond|Emerald|Obsidian|Bedrock) Chest/)) {
            continue;
        }

        let profit = 0;
        let chestItem = items[i];
        let lore = chestItem.getLore();
        let alreadyOpened = false;
        for (let k = 0; k < lore.length; k++) {
            let line = lore[k].removeFormatting().replaceAll(",", "");

            if (line.match(/(\d+) Coins/)) {
                profit -= parseInt(line.match(/(\d+) Coins/)[1]);
            } else if (line.match(/(Undead|Wither) Essence x(\d+)/)) {
                let match = line.match(/(Undead|Wither) Essence x(\d+)/);
                let type = match[1] + " Essence";
                profit += Prices.getPrice(type) * parseInt(match[2]);
            } else if (line.includes("Already opened!")) {
                alreadyOpened = true;
            } else {
                profit += Prices.getPrice(lore[k].removeFormatting());
            }
        }
        keysAndProfit.push([i, profit, alreadyOpened]);
    }

    keysAndProfit = keysAndProfit.sort( (a, b) => b[1] - a[1]);
    console.log(`${keysAndProfit.toString()}`)
    let keyPrice = Prices.getPrice("DUNGEON_CHEST_KEY");

    try {
        currentChestsPrices.put(keysAndProfit[0][0], [formatNumber(Math.floor(keysAndProfit[0][1])), Renderer.color(69, 212, 58, 133), true, Renderer.getStringWidth(`${formatNumber(Math.floor(keysAndProfit[0][1]))}`), keysAndProfit[0][2]]);
        keysAndProfit[1][0] -= keyPrice;
        currentChestsPrices.put(keysAndProfit[1][0], [formatNumber(Math.floor(keysAndProfit[1][1])), Renderer.color(68, 77, 198, 133), false, Renderer.getStringWidth(`${formatNumber(Math.floor(keysAndProfit[1][1]))}`), keysAndProfit[1][2]]);
    } catch(e) {
        console.error(e);
    }
}


const croesusRendering = (slot, gui, event) => {
    let index = getClickIndex(slot.getIndex());
    if (!fakeSlotToData.containsKey(index)) return;

    let slotData = fakeSlotToData.get(index);
    let x = slot.getDisplayX();
    let y = slot.getDisplayY();
    
    if (slotData.isOpened) {
        // hide chests that cant be opened or keyed
        cancel(event);
    } else if (slotData.notOpened && !slotData.isRerolled) {
        // chest is not opened and is not rerolled. blue?
        Tessellator.pushMatrix()
        Renderer.drawRect(Renderer.color(79, 165, 222, 112), x, y, 16, 16);
        Tessellator.popMatrix()
    } else if (slotData.notOpened) {
        // chests has been rerolled but has not been opened. green? 69, 212, 58, 112
        Tessellator.pushMatrix()
        Renderer.drawRect(Renderer.color(69, 212, 58, 112), x, y, 16, 16);
        Tessellator.popMatrix()
    } else if (slotData.canKey) {
        // first chest has been opened but can still use a key. yellow
        Tessellator.pushMatrix()
        Renderer.drawRect(Renderer.color(218, 206, 55, 112), x, y, 16, 16);
        Tessellator.popMatrix()
    }
}

registerWhen(register("packetSent", (packet, event) => {
    let slot = packet.func_149544_d();
    let itemName = packet.func_149546_g()?.func_82833_r()?.removeFormatting();
    if (!itemName) return;

    let containerName = Player.getContainer()?.getName();
    if (page != 0 && containerName != "Croesus" && !containerName?.match(/(Wood|Gold|Diamond|Emerald|Obsidian|Bedrock) Chest/) && !containerName?.includes("The Catacombs")) {
        page = 0;
    }
    
    if (itemName.includes("The Catacombs")) {
        clickedSlot = getClickIndex(slot);
    } else if (itemName == "Reroll Chest") {
        if (!containerName.match(/(Wood|Gold|Diamond|Emerald|Obsidian|Bedrock) Chest/)) {
            return;
        }

        if (Dungeon.inDungeon) {
            kismetData["chests"][0]["rerolled"] = true;
        } else {
            if (!kismetData["chests"]?.[clickedSlot]) return;
            kismetData["chests"][clickedSlot]["rerolled"] = true;
        }
        kismetData.save();
    } else if (itemName == "Next Page") {
        page++;
    } else if (itemName == "Previous Page") {
        page--;
    }
}).setFilteredClass(C0EPacketClickWindow), () => Dungeon.inDungeon || Skyblock.area == "Dungeon Hub");

/**
 * 
 * @param {Number} n Slot Index from Croesus GUI Click 
 * @returns {Number} fakeSlotData and kismetData index
 */
const getClickIndex = (n) => n - 10 - (2 * (n - 10 > 6 ? Math.floor((n - 10) / 6) : 0)) + (page * 28);
