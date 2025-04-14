import { onChatPacket } from "../../BloomCore/utils/Events";
import Dungeon from "../../BloomCore/dungeons/Dungeon";
import Skyblock from "../../BloomCore/Skyblock";
import PogObject from "../../PogData";
import { MODULENAME, formatNumber } from "../utils/Utils";
import { registerWhen, C0EPacketClickWindow } from "../../BloomCore/utils/Utils";
import Prices from "../utils/Prices";
import config from "../config";

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
    if (!config.croesus_overlay) return;
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

    if (fakeSlotToData.get("page") != page) {
        fakeSlotToData.clear();
    }

    if (!fakeSlotToData.isEmpty()) return;

    let realItemList = container.getItems();
    // let itemList = container.getItems().filter(i => i?.getName()?.includes("The Catacombs"));

    let b = 0;
    for (let i = 0; i < realItemList.length; i++) {
        let item = realItemList[i];
        if (!item?.getName()?.includes("The Catacombs")) continue;
        let lore = item.getLore();

        let isRerolled = kismetData["chests"]?.[b]?.["rerolled"] ?? true;
        let isOpened, canKey, notOpened;

        for (let line of lore) {
            line = line.removeFormatting();
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
        b++;
    }
    fakeSlotToData.put("page", page);
}), () => Skyblock.area == "Dungeon Hub");

registerWhen(register("tick", () => {
    if (!config.croesus_overlay) return;
    let container = Player.getContainer();
    if (!container) return;
    if (!currChestVal && container.getName().match(/(Wood|Gold|Diamond|Emerald|Obsidian|Bedrock) Chest/)) {
        currChestVal = getContainerValue();
        drawProfit = formatNumber(Math.floor(currChestVal));
        drawProfitW = Renderer.getStringWidth(drawProfit);
    }
}), () => Dungeon.inDungeon || Skyblock.area == "Dungeon Hub");

let currChestVal;
let drawProfit;
let drawProfitW;
let minRerollProtProfit = 3000000;

registerWhen(register("guiMouseClick", (mx, my, mb, gui, event) => {
    if (mb != 0 && mb != 1) return;
    if (!config.reroll_protection) return;
    
    let slot = Client.currentGui.getSlotUnderMouse();
    if (!slot) return;
    if (Keyboard.isKeyDown(Keyboard.KEY_LCONTROL)) return;

    let currIndex = slot.getIndex();
    let item = Player.getContainer().getStackInSlot(currIndex);
    if (item?.getName()?.removeFormatting() != "Reroll Chest") return;

    if (currChestVal > minRerollProtProfit) {
        World.playSound("game.player.hurt.fall.big", 1, 0.5);
        ChatLib.chat(`&7> &cPrevented Chest Reroll: &6${drawProfit}`);
        cancel(event);
    }
}), () => Dungeon.inDungeon || Skyblock.area == "Dungeon Hub");

register("guiClosed", () => {
    drawProfit = undefined;
    drawProfitW = undefined;
    currChestVal = undefined;
});

const getContainerValue = () => {
    if (!config.croesus_overlay) return;
    let currContainer = Player.getContainer();
    if (!currContainer) return null;

    let items = currContainer.getItems();
    let profit = 0;
    for (let i = 0; i < items.length - 50; i++) {
        if (!items?.[i] || items[i].getName()?.trim() == "") continue;
        let itemName = items[i].getName().removeFormatting();
        // console.log(itemName)
        let lore = items[i].getLore();

        if (itemName.includes("Enchanted Book")) {
            itemName = `Enchanted Book (${lore[1].removeFormatting()})`;
            // console.log(`book: ${itemName}, ${Prices.getPrice(itemName)}`);
            profit += Prices.getPrice(itemName);
        } else if (itemName.includes(" Essence x")) {
            let match = itemName.match(/((Undead|Wither) Essence) x(\d+).*/);
            let price = Prices.getPrice(match[1]);
            let amt = parseInt(match[3]);
            // console.log(`essence ${price} ${amt} ${match[3]}`);

            profit += (price * amt);
        } else if (itemName.includes("Open Reward Chest")) {
            for (let k = 0; k < lore.length; k++) {
                let loreLine = lore[k].removeFormatting().replaceAll(",", "").trim();
                if (loreLine.match(/(\d+) Coins/)) {
                    let amtMatch = loreLine.match(/(\d+) Coins/);
                    // console.log(`cost: ${amtMatch[1]}`)
                    profit -= parseInt(amtMatch[1]);
                } else if (loreLine == "Dungeon Chest Key") {
                    // console.log("subtracting dungeon chest key price");
                    profit -= Prices.getPrice("DUNGEON_CHEST_KEY");
                }
            }
        } else {
            // console.log(`adding ${itemName}: ${Prices.getPrice(itemName)}`)
            if (itemName.includes("Shiny ")) itemName = itemName.replace("Shiny ", "");

            profit += Prices.getPrice(itemName) ?? 0;
        }
    }

    // console.log(profit)
    return profit;
}

registerWhen(register("renderSlot", (slot, gui, event) => {
    if (currChestVal) {
        if (slot.getIndex() != 41) return;
        let x = slot.getDisplayX();
        let y = slot.getDisplayY();

        Tessellator.pushMatrix();

        Renderer.colorize(0, 212, 255, 255);
        Renderer.translate(x - 9 - (drawProfitW / 2), y, 1000);
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
}), () => config.croesus_overlay && (Skyblock.area == "Dungeon Hub" || currChestVal));

const chestProfitRendering = (slot, gui, event) => {
    let index = slot.getIndex();
    if (!currentChestsPrices.containsKey(index)) return;

    let x = slot.getDisplayX();
    let y = slot.getDisplayY();
    let profitInfo = currentChestsPrices.get(index);

    // let alreadyOpened = profitInfo[4];
    // if (alreadyOpened) return;
    
    let coins = profitInfo[0];
    let color = profitInfo[1];
    let lower = profitInfo[2];
    let strW = profitInfo[3];
    let strColor = profitInfo[5];
    

    Tessellator.pushMatrix();
    Renderer.drawRect(color, x, y, 16, 16);

    Renderer.translate(x - (strW > 16 ? (strW - 16) / 2 : 0), y + (lower ? 17 : -8), 1000);
    Renderer.colorize(strColor.r, strColor.g, strColor.b, 255);
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
                let match = line.match(/((Undead|Wither) Essence) x(\d+)/);
                let type = match[1];
                profit += Prices.getPrice(type) * parseInt(match[3]);
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
    for (let i = 0; i < 2; i++) {
        let color = Renderer.color(69, 212, 58, 127);
        let strColor = {r: 69, g: 212, b: 58};
        if (i != 0) {
            color = Renderer.color(44, 162, 255, 127);
            strColor = {r: 44, g: 162, b: 255};
            if (!keysAndProfit[i][2]) {
                keysAndProfit[i][1] -= keyPrice;
            }
        }
        currentChestsPrices.put(keysAndProfit[i][0], [formatNumber(Math.floor(keysAndProfit[i][1])), color, i == 0, Renderer.getStringWidth(`${formatNumber(Math.floor(keysAndProfit[i][1]))}`), keysAndProfit[i][2], strColor]);
    }
}


const croesusRendering = (slot, gui, event) => {
    // let index = getClickIndex(slot.getIndex());
    let index = slot.getIndex();
    if (!fakeSlotToData.containsKey(index)) return;

    let slotData = fakeSlotToData.get(index);
    let x = slot.getDisplayX();
    let y = slot.getDisplayY();
    
    if (slotData.isOpened) {
        // hide chests that cant be opened or keyed? or just do nothing to them
        // cancel(event);
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
    fakeSlotToData.clear();
}).setFilteredClass(C0EPacketClickWindow), () => Dungeon.inDungeon || Skyblock.area == "Dungeon Hub");

// converts a croesus gui slot index to a kismetChests.json index
const getClickIndex = (n) => n - 10 - (2 * (n - 10 > 6 ? Math.floor((n - 10) / 6) : 0)) + (page * 28);



