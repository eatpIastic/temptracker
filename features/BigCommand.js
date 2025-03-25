import { MODULENAME } from "../utils/Utils";
import request from "../../requestV2";
import { BigPlayer } from "./BigPlayer";
import Settings from "../config";

const cmd = `temp`;

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

}).setName(`${cmd}`);

const helpCommand = () => {
    ChatLib.chat(`&7>> ${MODULENAME}`);
    ChatLib.chat(`&7/${cmd} cheaters`);
}

const importCheaters = () => {
    request(`https://raw.githubusercontent.com/eatpIastic/list/refs/heads/main/uuids.txt`).then( (res) => {
        res = JSON.parse(res);
        let UUIDS = Object.keys(res);
        for (let i = 0; i < UUIDS.length; i++) {
            let uuid = UUIDS[i];
            let name = res[uuid];
            let player = new BigPlayer(uuid, name);
            if (!player.playerData?.["DODGE"]) {
                player.playerData["DODGE"] = true;
            }
            if (!player.playerData?.["NOTE"] || player.playerData["NOTE"].trim() == "") {
                player.playerData["NOTE"] = "cheater imported from list";
            }
            player.save();
        }
        ChatLib.chat(`&7> &asuccessfully imported &f${UUIDS.length} &acheaters from the list`);
    }).catch( (e) => console.error(e));
}
