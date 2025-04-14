import {
    @ButtonProperty,
    @CheckboxProperty,
    Color,
    @ColorProperty,
    @PercentSliderProperty,
    @SelectorProperty,
    @SwitchProperty,
    @TextProperty,
    @Vigilant,
} from "Vigilance";


@Vigilant("bigtracker", "§ebigtracker settings", {
    getCategoryComparator: () => (a, b) => {
        const categories = ["Tracking", "Croesus", "Party Finder", "Utils"];
        return categories.indexOf(a.name) - categories.indexOf(b.name);
    }
})
class Settings {
    @SwitchProperty({
        name: "auto kick",
        description: "autokicks players who you've dodged",
        category: "Party Finder"
    })
    autokick = false
    @SwitchProperty({
        name: "say kick reason",
        description: "says the note in chat when you kick a player",
        category: "Party Finder"
    })
    sayreason = false
    @SwitchProperty({
        name: "reroll protection",
        description: "protection from rerolling high profit dungeon chests. override by holding ctrl and clicking the kismet",
        category: "Croesus",
    })
    reroll_protection = false;
    @TextProperty({
        name: "min croesus prot value",
        description: "minimum amt of coins for a reroll to be blocked",
        category: "Croesus",
        placeholder: "3000000",
    })
    croesus_prot_amt = "3000000";
    @SwitchProperty({
        name: "chest value",
        description: "display current dungeon chest profit",
        category: "Croesus"
    })
    containerVal = false
    @SwitchProperty({
        name: "croesus overlay",
        description: "kismet tracking, unopened chest tracking, profit overlay",
        category: "Croesus"
    })
    croesus_overlay = false;
    @TextProperty({
        name: "min chest key profit",
        description: "minimum profit to show that a chest key is worth using",
        category: "Croesus",
        placeholder: "200000"
    })
    min_key_profit = "200000"
    @ButtonProperty({
        name: "import cheaters",
        description: "imports, dodges, and notes all cheaters tracked on eatplastic's github",
        category: "Utils",
        placeholder: "import"
    })
    action() {
        // TEMPTRACKER REPLACE THIS WHEN IT BECOMES BIGTRACKER
        ChatLib.command(`temp importcheaters`, true);
    }

    constructor() {
        this.initialize(this);
    }
}

export default new Settings();