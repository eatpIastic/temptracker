import PogObject from "../../PogData";

export const MODULENAME = "temptracker";
export const File = Java.type("java.io.File");
export const Loader = Java.type("net.minecraftforge.fml.common.Loader");
export const hasPV = Loader.isModLoaded("hatecheaters") || Loader.isModLoaded("notenoughupdates");
export const S32PacketConfirmTransaction = Java.type("net.minecraft.network.play.server.S32PacketConfirmTransaction");
export const toRoman = ["I", "II", "III", "IV", "V", "VI", "VII"];
export const tabCompleteNames = new Set(new File(`./config/ChatTriggers/modules/${MODULENAME}/data/bigplayers`)?.list()?.map(str => new PogObject(`${MODULENAME}/data/bigplayers`, {}, str)["USERNAME"]));
export const allClasses = new Set(["Archer", "Berserk", "Mage", "Tank", "Healer"]);


export const firstTimeSetup = () => {
    new File(`./config/ChatTriggers/modules/${MODULENAME}/data`).mkdirs();
}

export const formatNumber = (n) => n?.toString()?.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");


export class Tasks {
    static DODGECHECK = "DODGECHECK";
    static UPDATETIME = "UPDATETIME";
    static DEATH = "DEATH";
    static SS = "SS";
    static PRE4 = "PRE4";
    static PRINT = "PRINT";
    static MODIFYNOTE = "MODIFYNOTE";
    static MODIFYDODGE = "MODIFYDODGE";
}

