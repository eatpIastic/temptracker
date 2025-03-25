import { MODULENAME } from "../utils/Utils";
import request from "../../requestV2";
import { BigPlayer } from "./BigPlayer";
import Settings from "../config";

const cmd = `temp`;
const allCMDS = ["importcheaters", "settings"];

register("command", (...args) => {
    if (!args?.[0]) {
        helpCommand();
        return;
    }
    
    switch (args[0].toLowerCase()) {
        case "importcheaters":
            importCheaters();
            break;
        case "settings":
            Settings.openGUI();
            break;
    }

}).setTabCompletions( (args) => {
    if (!args || !args?.[0]) {
        return allCMDS;
    }

    return allCMDS.filter(c => c.startsWith(args[0]));
}).setName(`${cmd}`);

const helpCommand = () => {
    ChatLib.chat(`&7>> ${MODULENAME}`);
    ChatLib.chat(`&7/${cmd} cheaters`);
}

const importCheaters = () => {
    request(`https://raw.githubusercontent.com/eatpIastic/list/refs/heads/main/uuids.txt`).then( (res) => {
        res = JSON.parse(res);
        let UUIDS = Object.keys(res);
        let numDodges = 0;
        let numNotes = 0;
        for (let i = 0; i < UUIDS.length; i++) {
            let uuid = UUIDS[i];
            let name = res[uuid];
            let player = new BigPlayer(uuid, name);
            if (!player.playerData?.["DODGE"]) {
                player.playerData["DODGE"] = true;
                numDodges++;
            }
            if (!player.playerData?.["NOTE"] || player.playerData["NOTE"].trim() == "") {
                player.playerData["NOTE"] = "cheater imported from list";
                numNotes++;
            }
            player.save();
        }
        ChatLib.chat(`&7> &asuccessfully imported &f${UUIDS.length} &acheaters from the list`);
        ChatLib.chat(`&7> &aadded &f${numDodges} &adodges and &f${numNotes} &anotes`);
    }).catch( (e) => console.error(e));
}
