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


@Vigilant("bigtracker", "§bbigtracker settings", {
    getCategoryComparator: () => (a, b) => {
        const categories = ["tracking", "croesus", "party finder", "utils"];
        return categories.indexOf(a.name) - categories.indexOf(b.name);
    }
})
class Settings {
    @SwitchProperty({
        name: "auto kick",
        description: "autokicks players who you've dodged",
        category: "party finder"
    })
    autokick = false
    @SwitchProperty({
        name: "say kick reason",
        description: "says the note in chat when you kick a player",
        category: "party finder"
    })
    sayreason = false
    @SwitchProperty({
        name: "reroll protection",
        description: "protection from rerolling high profit dungeon chests. override by holding ctrl and clicking the kismet",
        category: "croesus",
    })
    reroll_protection = false;
    @SwitchProperty({
        name: "croesus overlay",
        description: "kismet tracking, unopened chest tracking, profit overlay",
        category: "croesus"
    })
    croesus_overlay = false;
    @ButtonProperty({
        name: "import cheaters",
        description: "imports, dodges, and notes all cheaters tracked on eatplastic's github",
        category: "utils",
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