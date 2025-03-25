import PogObject from "../../PogData";

export const MODULENAME = "bigtracker";
export const File = Java.type("java.io.File");
export const Loader = Java.type("net.minecraftforge.fml.common.Loader");
export const hasPV = Loader.isModLoaded("hatecheaters") || Loader.isModLoaded("notenoughupdates");
export const S32PacketConfirmTransaction = Java.type("net.minecraft.network.play.server.S32PacketConfirmTransaction");
export const toRoman = ["I", "II", "III", "IV", "V", "VI", "VII"];
// export const tabCompleteNames = new Set(new File(`./config/ChatTriggers/modules/${MODULENAME}/bigplayers`)?.list()?.map(str => new PogObject(`${MODULENAME}/data/bigplayers`, {}, str)?.["USERNAME"] ?? ""));
export const allClasses = ["Archer", "Berserk", "Mage", "Tank", "Healer"];
export const formatNumber = (n) => n?.toString()?.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");


export const firstTimeSetup = () => {
    new File(`./config/ChatTriggers/modules/${MODULENAME}/data`).mkdirs();
    new File(`./config/ChatTriggers/modules/${MODULENAME}/bigplayers`);
}

export class Tasks {
    static DODGECHECK = "DODGECHECK";
    static UPDATETIME = "UPDATETIME";
    static DEATH = "DEATH";
    static SS = "SS";
    static PRE4 = "PRE4";
    static PRINT = "PRINT";
    static MODIFYNOTE = "MODIFYNOTE";
    static MODIFYDODGE = "MODIFYDODGE";
    static PFINFO = "PFINFO";
}

export const formatMSandTick = (times, howManyDecimals=2) => {
    let seconds = times[0] / 1000;
    let ticks = times[1] / 20;

    let timeStr = "";
    let tickStr = "";

    if (seconds > 60) {
        timeStr += `${Math.trunc(seconds / 60)}m `
    }

    if (howManyDecimals != 0) {
        timeStr += `${(seconds % 60).toFixed(howManyDecimals)}s`;
    } else {
        timeStr += `${Math.trunc(seconds % 60)}s`;
    }
    
    if (ticks > 60) {
        tickStr += `${Math.trunc(ticks / 60)}m `
    }
    tickStr += `${(ticks % 60).toFixed(howManyDecimals)}s`;

    return [timeStr, tickStr];
}

export const chatMsgClickCMD = (msgTxt, cmd) => new TextComponent(msgTxt).setClick("run_command", cmd).chat();
export const chatMsgClickURL = (msgTxt, clickTxt) => new TextComponent(msgTxt).setClick("open_url", clickTxt).chat();
export const chatMsgHover = (msgTxt, hoverTxt) => new TextComponent(msgTxt).setHover("show_text", hoverTxt).chat();
