// import { onChatPacket } from "../../BloomCore/utils/Events";
// import Dungeon from "../../BloomCore/dungeons/Dungeon";
// import Skyblock from "../../BloomCore/Skyblock";
// import { registerWhen } from "../../BloomCore/utils/Utils";
// import PogObject from "../../PogData";
// import { MODULENAME, formatNumber } from "../utils/Utils";
// import Prices from "../utils/Prices";
// import config from "../config";

// const kismetChestData = new PogObject(`${MODULENAME}/data`, {chests: []}, "kismetChests.json");
// const isRecent = (t) => Date.now() - t < 172800000;
// const getKismetIndex = (n) => n - 10 - (2 * (n - 10 > 6 ? Math.floor((n - 10) / 6) : 0)) + (page * 28);

// let currentCroesusPage;
// let currentContainerVal;
// let chestViewVal;

// let page = 0;

// onChatPacket( () => {
//     if (!Dungeon.inDungeon) return;
//     kismetChestData["chests"].unshift({time: Date.now(), rerolled: false});
//     kismetChestData["chests"] = kismetChestData["chests"].filter(c => isRecent(c["time"]));
//     kismetChestData.save();
// }).setCriteria(/\s*☠ Defeated (.+) in (\d+)m\s+(\d+)s/);


// registerWhen(register("tick", () => {
//     const container = Player.getContainer();
//     if (!container) return;
//     const containerName = container.getName();

//     if (containerName == "Croesus") {
//         checkCroesusPage();
//     } else if (containerName.match(/(Wood|Gold|Diamond|Emerald|Obsidian|Bedrock) Chest/)) {
//         checkContainerVal();
//     } else if (containerName.includes("The Catacombs")) {
//         checkChestViewVal();
//     }
// }), () => Dungeon.runEnded != null || Skyblock.area == "Dungeon Hub");


// registerWhen(register("guiMouseClick", (mx, my, mb, gui, event) => {
//     if (mb != 0 && mb != 1) return;

//     let clickedSlot = Client.currentGui.getSlotUnderMouse();
//     if (!clickedSlot) return;
//     let slotIndex = clickedSlot.getIndex();
//     let container = Player.getContainer();
//     if (!container) return;
//     let containerName = container.getName();
//     let chestNameMatch = containerName?.match(/(Wood|Gold|Diamond|Emerald|Obsidian|Bedrock) Chest/);
//     let item = container.getStackInSlot(slotIndex);
//     let itemName = item.getName();
//     if (page != 0 && containerName != "Croesus" && !chestNameMatch && !containerName?.includes("The Catacombs")) {
//         page = 0;
//     }

//     if (chestNameMatch && slotIndex == 50 && Keyboard.isKeyDown(Keyboard.KEY_LCONTROL)) {
//         if (currentContainerVal != undefined && config.reroll_protection && (currentContainerVal.profit >= parseInt(config.croesus_prot_amt) ?? 3000000)) {
//             cancel(event);
//         } else if (Dungeon.inDungeon) {
//             kismetChestData[0]["rerolled"] = true;
//         } else {
//             if (!kismetChestData["chests"]?.[clickedSlot]) return;
//             kismetChestData["chests"][clickedSlot]["rerolled"] = true;
//             kismetChestData.save();
//         }
//     } else if (slotIndex == 53 && itemName == "Next Page") {
//         page++;
//     } else if (slotIndex == 45 && itemName == "Previous Page") {
//         page--;
//     } else if (chestNameMatch.includes("The Catacombs")) {
//         clickedSlot = getKismetIndex(slotIndex);
//     }
// }), () =>  Dungeon.runEnded != null || Skyblock.area == "Dungeon Hub");


// registerWhen(register("guiClosed", () => {
//     if (currentContainerVal != undefined) {
//         containerProfitDisplay.unregister();
//     }

//     if (chestViewVal != undefined) {
//         croesusProfitOverlay.unregister();
//     }

//     if (currentCroesusPage != undefined) {
//         croesusPageOverlay.unregister();
//     }

//     currentCroesusPage = undefined;
//     currentContainerVal = undefined;
//     chestViewVal = undefined;
//     currentCroesusPage = undefined;
// }), () => Dungeon.runEnded != null || Skyblock.area == "Dungeon Hub");


// const checkContainerVal = () => {
//     if (currentContainerVal != undefined) return;
//     let container = Player.getContainer();
//     let itemList = container.getItems();
//     let profit = 0;

//     for (let i = 0; i < itemList.length - 50; i++) {
//         let item = itemList?.[i];

//         if (!item || item?.getName()?.trim() == "") continue;
        
//         let itemName = item.getName().removeFormatting();

//         if (itemName == "Enchanted Book") {
//             let itemLore = item.getLore();
//             profit += Prices.getPrice(`Enchanted Book (${itemLore[1].removeFormatting()})`) ?? 0;
//         } else if (itemName.match(/((Undead|Wither) Essence) x(\d+).*/)) {
//             let match = itemName.match(/((Undead|Wither) Essence) x(\d+).*/);
//             profit += (Prices.getPrice(match[1]) * match[3]) ?? 0;
//         } else if (itemName == "Open Reward Chest") {
//             let itemLore = item.getLore();
//             for (let k = 0; k < itemLore.length; k++) {
//                 let loreLine = itemLore[k].removeFormatting().replaceAll(",", "").trim();
//                 if (loreLine.match(/(\d+) Coins/)) {
//                     profit -= parseInt(loreLine.match(/(\d+) Coins/)[1]) ?? 0;
//                 } else if (loreLine == "Dungeon Chest Key") {
//                     profit -= Prices.getPrice("DUNGEON_CHEST_KEY");
//                 }
//             }
//         } else if (itemName.includes("Shiny ")) {
//             profit += Prices.getPrice(itemName.replace("Shiny ", "")) ?? 0;
//         } else {
//             profit += Prices.getPrice(itemName) ?? 0;
//         }
//     }

//     let profitStr = formatNumber(Math.floor(profit));
//     let profitStrW = Renderer.getStringWidth(profitStr) / 2;

//     currentContainerVal = {
//         profit: profit,
//         profitStr: profitStr,
//         profitStrW: profitStrW
//     };

//     if (config.containerVal) {
//         containerProfitDisplay.register();
//     }
// }


// const containerProfitDisplay = register("renderSlot", (slot, gui, event) => {
//     if (slot.getIndex() != 31 || currentContainerVal == undefined) return;
//     let x = slot.getDisplayX();
//     let y = slot.getDisplayY();

//     Tessellator.pushMatrix();
//     Renderer.colorize(0, 212, 255, 255);
//     Renderer.translate(x - currentContainerVal.profitStrW + 9, y + 16, 1000);
//     Renderer.drawString(`${currentContainerVal.profitStr}`, 0, 0);
//     Tessellator.popMatrix();
// }).unregister();


// const checkChestViewVal = () => {
//     if (chestViewVal != undefined) return;
//     let container = Player.getContainer();
//     if (!container) return;

//     let itemList = container.getItems();
//     let indexToProfit = [];
    
//     for (let i = 0; i < itemList.length - 30; i++) {
//         if (!itemList?.[i]?.getName()?.match(/(Wood|Gold|Diamond|Emerald|Obsidian|Bedrock) Chest/)) {
//             continue;
//         }

//         let profit = 0;
//         let chestItem = itemList[i];
//         let chestLore = chestItem.getLore();

//         for (let k = 0; k < chestLore.length; k++) {
//             let line = chestLore[k].removeFormatting().replaceAll(",", "");
//             if (line.match(/(\d+) Coins/)) {
//                 profit -= parseInt(line.match(/(\d+) Coins/)[1]);
//             } else if (line.match(/((Undead|Wither) Essence) x(\d+).*/)) {
//                 let match = line.match(/((Undead|Wither) Essence) x(\d+).*/);
//                 profit += (Prices.getPrice(match[1]) * match[3]) ?? 0;
//             } else if (line.includes("Shiny ")) {
//                 profit += Prices.getPrice(chestLore[k].removeFormatting().replace("Shiny "));
//             } else if (line.trim() != "" && line != "Dungeon Chest Key") {
//                 profit += Prices.getPrice(chestLore[k].removeFormatting());
//             }
//         }
//         indexToProfit.push([i, profit]);
//     }

//     indexToProfit = indexToProfit.sort( (a, b) => b[1] - a[1]);
//     // indexToProfit.forEach(a => console.log(`${a[0]}: ${a[1]}`))
//     chestViewVal = new HashMap();

//     try {
//         let bestProfitGreen = Renderer.color(69, 212, 58, 127);
//         let bestProfitStr = formatNumber(Math.floor(indexToProfit[0][1]));
//         chestViewVal.put(indexToProfit[0][0], {
//             str: bestProfitStr,
//             strW: Renderer.getStringWidth(bestProfitStr) / 2,
//             color: bestProfitGreen,
//             lower: false
//         });

//         let chestKeyProfit = indexToProfit[1][1] - Prices.getPrice("DUNGEON_CHEST_KEY");
//         if (chestKeyProfit >= parseInt(config.min_key_profit) ?? 200000) {
//             let chestKeyBlue = Renderer.color(44, 162, 255, 127);
//             let chestKeyProfitStr = formatNumber(Math.floor(chestKeyProfit));
//             chestViewVal.put(indexToProfit[1][0], {
//                 str: chestKeyProfitStr,
//                 strW: Renderer.getStringWidth(chestKeyProfitStr) / 2,
//                 color: chestKeyBlue,
//                 lower: true
//             });
//         }
//     } catch (e) { console.error(e) }

//     if (config.croesus_overlay) {
//         croesusProfitOverlay.register();
//     }
// }

// const croesusProfitOverlay = register("renderSlot", (slot, gui, event) => {
//     let index = slot.getIndex();
//     if (!chestViewVal.containsKey(index)) return;

//     let x = slot.getDisplayX();
//     let y = slot.getDisplayY();
//     let info = chestViewVal.get(index);
//     Tessellator.pushMatrix();
//     Renderer.drawRect(info.color, x, y, 16, 16);
//     Renderer.translate(x + 8 - info.strW, y + (info.lower ? 17 : -8), 1000);
//     Renderer.colorize(255, 92, 50, 255);
//     Renderer.drawString(info.str, 0, 0);
//     Tessellator.popMatrix();
// }).unregister();


// const checkCroesusPage = () => {
//     if (currentCroesusPage != undefined) return;

//     let container = Player.getContainer();
//     let itemList = container.getItems();
//     currentCroesusPage = new HashMap();

//     for (let i = 10; i < itemList.length; i++) {
//         let item = itemList?.[i];
//         if (!item || !item.getName().includes("The Catacombs")) continue;
//         let itemLore = item.getLore();
//         let fakeSlot = getKismetIndex(i);
//         let isRerolled = kismetChestData["chests"]?.[fakeSlot]?.["rerolled"] ?? true;
//         let isOpened, canKey, notOpened;

//         for (let line of itemLore) {
//             line = line.removeFormatting();
//             isOpened = isOpened || line.includes("No more Chests to open!");
//             canKey = canKey || line.includes("Opened Chest: ");
//             notOpened = notOpened || line.includes("No Chests Opened!");
//         }

//         currentCroesusPage.put(i, {
//             isRerolled: isRerolled,
//             isOpened: isOpened,
//             canKey: canKey,
//             notOpened: notOpened
//         });
//     }
//     croesusPageOverlay.register();
// }


// const croesusPageOverlay = register("renderSlot", (slot, gui, event) => {
//     let index = slot.getIndex();
//     if (!currentCroesusPage.containsKey(index)) return;

//     let slotData = currentCroesusPage.get(index);
//     let x = slot.getDisplayX();
//     let y = slot.getDisplayY();

//     if (slotData.isOpened) {
//         cancel(event);
//     }  else if (slotData.notOpened && !slotData.isRerolled) {
//         // chest is not opened and is not rerolled. blue?
//         Tessellator.pushMatrix()
//         Renderer.drawRect(Renderer.color(79, 165, 222, 112), x, y, 16, 16);
//         Tessellator.popMatrix()
//     } else if (slotData.notOpened) {
//         // chests has been rerolled but has not been opened. green? 69, 212, 58, 112
//         Tessellator.pushMatrix()
//         Renderer.drawRect(Renderer.color(69, 212, 58, 112), x, y, 16, 16);
//         Tessellator.popMatrix()
//     } else if (slotData.canKey) {
//         // first chest has been opened but can still use a key. yellow
//         Tessellator.pushMatrix()
//         Renderer.drawRect(Renderer.color(218, 206, 55, 112), x, y, 16, 16);
//         Tessellator.popMatrix()
//     }
// }).unregister();
