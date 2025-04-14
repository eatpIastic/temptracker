import { formatMSandTick, hasPV, MODULENAME, Tasks, chatMsgClickCMD, chatMsgClickURL } from "../utils/Utils";
import { fetch } from "../../tska/polyfill/Fetch";
import PogObject from "../../PogData";


const uuidToData = new HashMap();
const namesToUUID = new HashMap();
const requestSent = new Set();
const requestCooldown = new HashMap();

// TEMPTRACKER THING REMOVE WHEN IT BECOMES BIGTRACKER
register("step", () => {
    uuidToData.clear();
}).setDelay(300);
    
export const getPlayerByName = (name, task=null, extra=null) => {
    name = name?.toLowerCase();
    
    if (!name || name?.trim() == "") {
        return;
    }
        
    if (namesToUUID.containsKey(name) && uuidToData.containsKey(namesToUUID.get(name))) {
        return uuidToData.get(namesToUUID.get(name)).doTask(task, extra);
    } else if (namesToUUID.containsKey(name)) {
        let player = new BigPlayer(namesToUUID.get(name), name);
        uuidToData.put(namesToUUID.get(name), player);
        return player.doTask(task, extra);
    }
    
    if (requestSent.has(name)) return;

    if (requestCooldown.containsKey(name)) {
        if (Date.now() - requestCooldown.get(name) > 6000) {
            requestCooldown.remove(name);
        } else {
            return;
        }
    }
    
    requestSent.add(name);
    console.log(`requesting ${name}`);
    
    return fetch(`https://api.mojang.com/users/profiles/minecraft/${name}`,
        {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Chattriggers)'
            },
            json: true
        }
    ).then(function(res) {
        let UUID = res?.id;
        let NAME =res?.name?.toLowerCase();
        namesToUUID.put(NAME, UUID);
        // tabCompleteNames.add(NAME);
    
        let player = new BigPlayer(UUID, NAME);
                
        uuidToData.put(UUID, player);
        requestSent.delete(name);
        return player.doTask(task, extra);
    }).catch( (e) => {
        console.log(`request failed for ${name}: ${e}`);
        requestSent.delete(name);
        requestCooldown.put(name, Date.now());
    });
}

export class BigPlayer {
    constructor(UUID, username, extra=null) {
        if (extra == null) {
            this.playerData = new PogObject(`${MODULENAME}/bigplayers`, {
                UUID: UUID,
                USERNAME: username?.toLowerCase()
            }, `${UUID}.json`);

            if (username != "" && username != this.playerData["USERNAME"]) {
                ChatLib.chat(`${username} changed it's name from ${this.playerData["USERNAME"]}`);
                this.playerData["USERNAME"] = username;
            }
        } else {
            this.playerData = new PogObject(`${MODULENAME}/bigplayers`, extra, `${UUID}.json`);
        }

        this.cachedAverage = new HashMap();
        this.save();
    }

    save() {
        this.playerData.save();
    }

    doTask(task=null, extra=null) {
        if (task == null && extra == null) {
            return;
        }

        // console.log(`doTask called on ${this.playerData["USERNAME"]} with task ${task}`);
        

        // add rundone at some point?
        // use updatetime for br. why are they separate tasks originally?
        switch (task) {
            case Tasks.PRINT:
                this.printPlayer();
                break;
            case Tasks.DODGECHECK:
                this.printPlayer();
                this.check();
                break;
            case Tasks.PRE4:
                this.pre4(extra);
                break;
            case Tasks.DEATH:
                this.playerData["DEATHS"] = (this.playerData?.["DEATHS"] ?? 0) + 1;
                this.save();
                break;
            case Tasks.UPDATETIME:
                this.updateTime(extra[0], extra[1], extra[2]);
                break;
            case Tasks.MODIFYNOTE:
                this.modifyNote(extra);
                break;
            case Tasks.MODIFYDODGE:
                this.modifyDodge(extra);
                break;
            case Tasks.PFINFO:
                return this.getPFInfo();
        }
    }

    printPlayer() {
        chatMsgClickURL(`&7>> &b${this.playerData["USERNAME"]}`, `https://laby.net/@${this.playerData["UUID"]}`);
        if (this.playerData?.["CLASS"] != undefined) {
            ChatLib.chat(`&9Class &7>> &f${this.playerData["CLASS"]}`);
        }

        if (this.playerData?.["NOTE"] != undefined && this.playerData["NOTE"] != "") {
            ChatLib.chat(`&9Note &7>> &f${this.playerData["NOTE"]}`);
        }

        if (this.playerData?.["DODGE"]) {
            if (this.playerData?.["DODGELENGTH"]) {
                let timeLeft = this.playerData["DODGELENGTH"] - ((Date.now() - this.playerData["DODGEDATE"]) / 86400000);
                ChatLib.chat(`&c>> &4Dodged&c; &f${timeLeft.toFixed(1)} days remaining`);
            }
            else {
                ChatLib.chat(`&c>> &4Dodged`);
            }
        }

        if (this.playerData?.["RUNS"]) {
            ChatLib.chat(`&9Runs &7>> &f${this.playerData["RUNS"]}`);

            if (this.playerData?.["DEATHS"]) {
                ChatLib.chat(`&9DPR &7>> &f${(this.playerData["DEATHS"] / this.playerData["RUNS"]).toFixed(2)}`);
            }

            if (this.playerData?.["LASTRUN"]) {
                ChatLib.chat(`&9Last Run &7>> &f${((Date.now() - this.playerData["LASTRUN"]) / 86400000).toFixed(2)}d ago`);
            }

            // for (let bigSplit of Object.keys(BigPlayer.splitTimings)) {
            //     let splitStr = `&9${bigSplit} &7>> &f`;

            //     if (bigSplit in this.playerData) {
            //         let avg = this.getAvgOfType(bigSplit);
                    
            //         if (avg == null || isNaN(avg[0])) {
            //             continue;
            //         }
                    
            //         splitStr += `&6AVG: &7[`;
            //         if (avg[0] < BigPlayer.splitTimings[bigSplit].avg[0]) {
            //             splitStr += `&a`;
            //         } else if (avg[0] < BigPlayer.splitTimings[bigSplit].avg[1]) {
            //             splitStr += `&e`;
            //         } else {
            //             splitStr += `&c`;
            //         }
                    
            //         let tempTime = formatMSandTick(avg, bigSplit == "RUNDONE" ? 0 : 2);
                    
            //         splitStr += `${tempTime[0]}, ${tempTime[1]}`;
            //         splitStr += '&7] &8| | ';
            //     }

            //     if (bigSplit != "BR" && this.playerData?.[bigSplit + "pb"]) {
            //         splitStr += `&6PB: &7[`;
            //         let pb = this.playerData[bigSplit + "pb"];
                    
            //         if (pb == null || isNaN(pb[0])) {
            //             continue;
            //         }
                    
            //         if (pb[0] < BigPlayer.splitTimings[bigSplit].pb[0]) {
            //             splitStr += `&a`;
            //         } else if (pb[0] < BigPlayer.splitTimings[bigSplit].pb[1]) {
            //             splitStr += `&e`;
            //         } else {
            //             splitStr += `&c`;
            //         }

            //         let tempTime = formatMSandTick(pb, bigSplit == "RUNDONE" ? 0 : 2);
                
            //         splitStr += `${tempTime[0]}, ${tempTime[1]}`;
            //         splitStr += '&7]';
            //     }

            //     if (splitStr != `&9${bigSplit} &7>> &f`) {
            //         ChatLib.chat(splitStr);
            //     }   
            // }

            if ("pre4raten" in this.playerData && this.playerData["pre4raten"] != 0) {
                ChatLib.chat(`&9Pre4 &7>> &f${this.playerData?.["pre4rate"] || 0}/${this.playerData?.["pre4raten"]} (${((this.playerData?.["pre4rate"] || 0) / (this.playerData?.["pre4raten"] || 1) * 100).toFixed(2)}%)`);
            }
        } else {
            ChatLib.chat("&8No Runs");
        }
        if (hasPV) {
            chatMsgClickCMD(`&7>>> Click to PV`, `/pv ${this.playerData["USERNAME"]}`);
        }
    }

    check() {
        
    }

    pre4() {

    }

    updateTime() {

    }

    modifyNote() {

    }

    modifyDodge() {

    }

    getPFInfo() {
        if (this.playerData?.["DODGE"]) {
            let givenInfo = ["DODGED"];
            if (this.playerData?.["NOTE"] && this.playerData["NOTE"].trim() != "") {
                givenInfo.push(this.playerData["NOTE"]);
            }

            return givenInfo;
        } else if (this.playerData?.["RUNS"]) {
            let givenInfo = {};
            givenInfo.NumRuns = this.playerData["RUNS"];
            if (this.playerData?.["RUNDONE"]) {
                givenInfo.AvgRun = formatMSandTick(this.getAvgOfType("RUNDONE"), 0)[0];
            }
            if (this.playerData?.["TERMS"]) {
                givenInfo.AvgTerms = formatMSandTick(this.getAvgOfType("TERMS"), 0)[0];
            }
            if (this.playerData?.["RUNDONEpb"]) {
                givenInfo.RunPB = formatMSandTick(this.playerData["RUNDONEpb"], 0)[0];
            }
            if (this.playerData?.["TERMSpb"]) {
                givenInfo.TermsPB = formatMSandTick(this.playerData["TERMSpb"], 0)[0];
            }
            if (this.playerData?.["NOTE"] && this.playerData["NOTE"].trim() != "") {
                givenInfo.Note = this.playerData?.["NOTE"];
            }

            return givenInfo;
        }
        return "?"
    }

    getAvgOfType(updateType, avgType="median") {
        if (!this.playerData?.[updateType] || this.playerData[updateType].length < 1) {
            return null;
        }

        if (this.cachedAverage.containsKey(updateType)) {
            let temp = this.cachedAverage.get(updateType);
            if (this.playerData[updateType][0] == temp[0] && avgType == temp[1]) {
                return temp[2];
            }
            this.cachedAverage.remove(updateType);
        }

        if (avgType == "median") {
            let tempMSArr = this.playerData[updateType].map( (x) => x[0]).sort((a, b) => a - b);
            let tempTickArr = this.playerData[updateType].map( (x) => x[1]).sort((a, b) => a - b);
            
            let half = Math.floor(tempMSArr.length / 2);
    
            let tempMs = (tempMSArr.length % 2 ? tempMSArr[half] : (tempMSArr[half - 1] + tempMSArr[half]) / 2);
            let tempTick = (tempTickArr.length % 2 ? tempTickArr[half] : (tempTickArr[half - 1] + tempTickArr[half]) / 2);

            this.cachedAverage.put(updateType, [this.playerData[updateType][0], avgType, [tempMs, tempTick]]);
    
            return [tempMs, tempTick];
        } else {
            let tempMs = this.playerData[updateType].map( (x) => x[0]).reduce( (a, b) => a + b);
            let tempTick = this.playerData[updateType].map( (x) => x[1]).reduce( (a, b) => a + b);
            tempMs /= this.playerData[updateType].length;
            tempTick /= this.playerData[updateType].length;

            this.cachedAverage.put(updateType, [this.playerData[updateType][0], avgType, [tempMs, tempTick]]);

            return [tempMs, tempTick];
        }
    }
}
