import { MODULENAME } from "./Utils";
import PogObject from "../../PogData";
import { fetch } from "../../tska/polyfill/Fetch";
import { toRoman } from "./Utils";


export default class Prices {
    static sentBZ = false;
    static sentAH = false;
    static sentITEM = false;
    
    static priceData = new PogObject(`${MODULENAME}/data`, {
        ahLastUpdated: 0
    }, "prices.json");

    static bzURL = "https://api.hypixel.net/skyblock/bazaar";
    static ahURL = "https://moulberry.codes/lowestbin.json";
    static itemApiURL = "https://api.hypixel.net/v2/resources/skyblock/items";

    static getPrice(itemName) {
        let realName = Prices.priceData?.itemAPI?.[itemName] || itemName;
        if (realName == null) {
            return 0;
        }

        if (Prices.priceData?.bzPrices?.[realName]) {
            return Prices.priceData?.bzPrices[realName];
        } else if (Prices.priceData?.ahPrices?.[realName]) {
            return Prices.priceData?.ahPrices[realName];
        }

        switch (itemName) {
            case "Wither Essence":
                return Prices.getPrice("ESSENCE_WITHER");
            case "Undead Essence":
                return Prices.getPrice("ESSENCE_UNDEAD");
        }

        if (itemName.includes("Enchanted Book")) {
            return Prices.getPrice(Prices.bookToName(itemName));
        }
        return 0;
    }

    // ENCHANTMENT_ULTIMATE_BANK_1
    static UltimateEnchants = new Set(["Bank", "Combo", "One For All", "Soul Eater", "Swarm", "Ultimate Jerry", "Ultimate Wise", "Rend", "Last Stand", "Legion", "No Pain No Gain", "Wisdom"]);
    static bookToName(itemName) {
        let nameMatch = itemName.match(/Enchanted Book \((.+) (I|II|III|IV|V|VI|VII|VIII|IX|X)\)/);
        if (!nameMatch?.[1] || !nameMatch?.[2]) {
            return null;
        }
        let fullName = "ENCHANTMENT_";
        let enchantName = nameMatch[1];
        let enchantLevel = nameMatch[2];

        if (Prices.UltimateEnchants.has(enchantName)) {
            fullName = fullName + "ULTIMATE_";
        }

        enchantName = enchantName.toUpperCase().replace(" ", "_");
        return fullName + enchantName + "_" + (toRoman.indexOf(enchantLevel) + 1);
    }

    static checkPrices() {
        if (!Prices.sentBZ && (!Prices.priceData?.["bzPrices"]?.["lastUpdated"] || Date.now() - Prices.priceData.bzPrices.lastUpdated > 43200000)) {
            Prices.sentBZ = true;
            Prices.updateBZPrices();
        }

        if (!Prices.sentAH && (!Prices.priceData?.["ahLastUpdated"] || Date.now() - Prices.priceData["ahLastUpdated"] > 43200000)) {
            Prices.sentAH = true;
            Prices.updateAHPrices();
        }

        if (!Prices.sentITEM && (!Prices.priceData?.["itemAPI"]?.["lastUpdated"] || Date.now() - Prices.priceData["itemAPI"]["lastUpdated"] > 43200000)) {
            Prices.sentITEM = true;
            Prices.updateItemAPI();
        }
    }

    static updateItemAPI() {
        fetch(Prices.itemApiURL, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Chattriggers)'
            },
            json: true
        }).then(function(res) {
                let tempItemData = JSON.parse(res);
                let nameToID = {
                    lastUpdated: tempItemData.lastUpdated
                };
                let nameToColor = {};
                
                for (let item of tempItemData.items) {
                    nameToID[item.name] = item.id;
                    nameToColor[item.name] = item.tier;
                }

                Prices.priceData.itemAPI = nameToID;
                Prices.priceData.nameToColor = nameToColor;
                Prices.priceData.save();
            });
    }

    static updateBZPrices() {
        fetch(Prices.bzURL, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Chattriggers)'
            },
            json: true
        }).then(function(res) {
                let tempBzPrices = JSON.parse(res);
                let realBzPrices = {
                    lastUpdated: tempBzPrices.lastUpdated
                };

                for (let itemName of Object.keys(tempBzPrices.products)) {
                    realBzPrices[itemName] = tempBzPrices.products[itemName].quick_status.sellPrice;
                }

                Prices.priceData.bzPrices = realBzPrices;
                Prices.priceData.save();
                Prices.sentBZ = false;
            });
    }

    static updateAHPrices() {
        fetch(Prices.ahURL, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Chattriggers)'
            },
            json: true
        }).then(function(res) {
                Prices.priceData.ahPrices = JSON.parse(res);
                Prices.priceData.ahLastUpdated = Date.now();
                Prices.priceData.save();
                Prices.sentAH = false;
            });
    }
}