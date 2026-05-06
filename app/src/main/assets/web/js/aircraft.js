// expenditures elements - this object is also used in report.js
const exp = {
    fox2: document.getElementById("fox2-exp"),
    fox3: document.getElementById("fox3-exp"),
    fuel: document.getElementById("fuel-input"),
    flaresButton: document.getElementById("flares-button"),
    chaffButton: document.getElementById("chaff-button"),
    decoyButton: document.getElementById("decoy-button")
};

// class for the data in the dataset
class AircraftModel {
    constructor(type, name, weapons, models) {
        this.type = type;
        this.name = name;
        this.models = models || [];
        this.weaponDefs = weapons || [];
        // UI reference for the menu
        this.optionButton = null;
    }
}

// the actual aircraft in use
class ActiveAircraft {
    constructor(model) {
        this.model = model;
        this.type = model.type;
        this.name = model.name;
        this.models = model.models;

        // create weapon instances from definitions
        this.weapons = model.weaponDefs.map((w) => new AircraftWeapon(w, this));

        // UI references set when the menu attaches this instance to a model button
        this.optionButton = null;
        this.weaponButtonContainer = null;
        this.weaponQuantityContainer = null;
    }

    select() {
        Aircraft.selectedAircraft = this;
        if (this.optionButton) this.optionButton.classList.add("selected");
        Aircraft.button.textContent = this.name;

        // every aircraft shares the same loadout popup that is populated on selection
        this.buildLoadoutMenu();
        AircraftWeapon.updateExpenditures();
    }

    buildLoadoutMenu() {
        if (!Aircraft.selectedAircraft) return;

        // show the loadout option group if there are weapons
        if (this.weapons.length > 0) {
            Aircraft.loadoutButton.classList.remove("hidden");
        } else {
            Aircraft.loadoutButton.classList.add("hidden");
            return;
        }

        // clear existing content
        Aircraft.weaponContainer.innerHTML = ``;

        // populate weapons
        for (const weapon of this.weapons) {
            const weaponItem = document.createElement("div");
            weaponItem.classList.add("weapon-item");

            // persist the state of active weapons
            if (weapon.active) {
                weaponItem.classList.add("active");
            }

            const label = document.createElement("span");
            label.textContent = weapon.name;
            weaponItem.appendChild(label);

            const input = document.createElement("scroll-input");
            input.setAttribute("min", "0");
            input.setAttribute("max", "99");
            input.setAttribute("sensitivity", "0.2");
            input.setAttribute("value", weapon.quantity);
            input.addEventListener("input", () => {
                weapon.quantity = parseInt(input.getAttribute("value"));
                if (weapon.quantity > 0) {
                    weapon.active = true;
                    weaponItem.classList.add("active");
                } else {
                    weapon.active = false;
                    weaponItem.classList.remove("active");
                }
            });
            weaponItem.appendChild(input);

            // increment quantity on click
            weaponItem.addEventListener("click", (e) => {
                // skip clicks on input
                if (e.target === input) return;
                weapon.active = true;
                weaponItem.classList.add("active");
                weapon.quantity++;
                input.setAttribute("value", weapon.quantity);
            });

            Aircraft.weaponContainer.appendChild(weaponItem);
        }
    }

    toJSON() {
        const A2G = this.weapons.filter((w) => w.active).map((w) => w.toJSON());
        const A2A = [
            {
                name: "Fox 2",
                quantity: Aircraft.fox2Input.value,
                expended: parseInt(exp.fox2.value),
            },
            {
                name: "Fox 3",
                quantity: Aircraft.fox3Input.value,
                expended: parseInt(exp.fox3.value),
            },
        ];
        return {
            name: this.name,
            A2G: A2G,
            A2A: A2A,
        };
    }
}

class AircraftWeapon {
    static expContainer = document.getElementById("expenditures-weapons");

    constructor(name, aircraft = null) {
        this.name = name;
        this.active = false;
        this.aircraft = aircraft;
        this._quantity = 0;
        this.el = {};

        this.buildExpenditureItem();
    }

    get quantity() {
        return this._quantity;
    }

    set quantity(value) {
        this._quantity = value;
        this.updateItem();
        AircraftWeapon.updateExpenditures();
    }

    getExpendedQuantity() {
        if (this.useTicker()) {
            return parseInt(this.el.input.getAttribute("value"));
        } else {
            return this.quantity - parseInt(this.el.input.getAttribute("value"));
        }
    }

    toJSON() {
        return {
            name: this.name,
            quantity: this.quantity,
            expended: this.getExpendedQuantity(),
        };
    }

    buildExpenditureItem() {
        this.el.item = document.createElement("div");
        this.el.item.classList.add("expenditure-item");

        this.el.label = document.createElement("span");
        this.el.label.classList.add("weapon-name");
        this.el.label.textContent = this.name;

        this.updateItem();
    }

    updateItem() {
        if (this.useTicker()) {
            this.el.input = document.createElement("tally-ticker");
            this.el.input.setAttribute("min", "0");
            this.el.input.setAttribute("max", this.quantity);
            this.el.input.setAttribute("value", "0");
        } else {
            this.el.input = document.createElement("div");
            this.el.input.classList.add("meter-slider", "secondary");
            this.el.input.setAttribute("min", "0");
            this.el.input.setAttribute("max", this.quantity);
            this.el.input.setAttribute("value", this.quantity);
            setupMeterSlider(this.el.input);
        }

        this.el.item.innerHTML = "";
        this.el.item.appendChild(this.el.label);
        this.el.item.appendChild(this.el.input);
    }

    useTicker() {
        return false; // never for now, maybe change for low quantity weapons
    }

    static updateExpenditures() {
        this.expContainer.innerHTML = "";
        if (!Aircraft.selectedAircraft) {
            return;
        }
        for (const weapon of Aircraft.selectedAircraft.weapons) {
            if (weapon.active && weapon.quantity > 0) {
                this.expContainer.appendChild(weapon.el.item);
                weapon.updateItem();
            }
        }
    }
}

// manager for UI and aircraft state
class Aircraft {
    static aircraftData = {};
    static types = [];
    static selectedAircraft = null; // ActiveAircraft
    static container = document.getElementById("aircraft-container");
    static button = document.getElementById("aircraft-select-button");
    static popup = document.getElementById("aircraft-popup");
    static loadoutPopup = document.getElementById("loadout-popup");
    static loadoutButton = document.getElementById("loadout-button");
    static weaponContainer = document.getElementById("weapon-container");
    static fox2Input = document.getElementById("fox2-input");
    static fox3Input = document.getElementById("fox3-input");

    static getCurrentAircraftData() {
        if (!Aircraft.selectedAircraft) return null;
        return Aircraft.selectedAircraft.toJSON();
    }

    static deselectAll() {
        Aircraft.selectedAircraft = null;

        for (const type in Aircraft.aircraftData) {
            const list = Aircraft.aircraftData[type];
            list.forEach((model) => {
                if (model.optionButton) {
                    model.optionButton.classList.remove("selected");
                }
            });
        }
    }

    static async fetchAircraftData() {
        const response = await fetch("./aircraft.json");
        const data = await response.json();
        for (const type in data) {
            const aircraftList = data[type];
            Aircraft.types.push(type);
            Aircraft.aircraftData[type] = aircraftList.map((item) => new AircraftModel(type, item.name, item.weapons, item.models));
        }
    }

    static buildAircraftMenu() {
        Aircraft.container.innerHTML = "";

        const tabs = document.createElement("div");
        tabs.classList.add("tabs");
        tabs.id = "aircraft-tabs";
        Aircraft.container.appendChild(tabs);

        for (const type of Aircraft.types) {
            const tab = document.createElement("div");
            tab.classList.add("tab");
            tab.id = `${type.toLowerCase()}-tab`;
            tab.textContent = type.charAt(0).toUpperCase() + type.slice(1);
            tabs.appendChild(tab);

            if (type === Aircraft.types[0]) {
                tab.classList.add("active");
            }

            tab.addEventListener("click", function () {
                const allTabs = tabs.querySelectorAll(".tab");
                const allContents = Aircraft.container.querySelectorAll(".tab-content");
                allTabs.forEach((t) => t.classList.remove("active"));
                allContents.forEach((c) => c.classList.add("hidden"));
                tab.classList.add("active");
                const activeContent = document.getElementById(`${type.toLowerCase()}-content`);
                if (activeContent) {
                    activeContent.classList.remove("hidden");
                }
            });

            const tabContent = document.createElement("div");
            tabContent.classList.add("tab-content");
            if (type !== Aircraft.types[0]) {
                tabContent.classList.add("hidden");
            }
            tabContent.id = `${type.toLowerCase()}-content`;
            Aircraft.container.appendChild(tabContent);

            const listDiv = document.createElement("div");
            listDiv.classList.add("aircraft-list");
            tabContent.appendChild(listDiv);

            const aircraftList = Aircraft.aircraftData[type];
            for (const model of aircraftList) {
                model.optionButton = document.createElement("div");
                model.optionButton.classList.add("aircraft-option");
                model.optionButton.textContent = model.name;

                if (model.models.length > 0) {
                    model.optionButton.textContent += ` (${model.models.join("/")})`;
                }

                listDiv.appendChild(model.optionButton);

                model.optionButton.addEventListener("click", function () {
                    Aircraft.deselectAll();

                    const active = new ActiveAircraft(model);
                    active.optionButton = model.optionButton;
                    active.select();

                    Aircraft.popup.classList.add("hidden");
                    Aircraft.loadoutPopup.classList.remove("hidden");
                });
            }
        }

        Aircraft.button.addEventListener("click", function () {
            Aircraft.popup.classList.toggle("hidden");
        });
    }
}

// targeting logic
Aircraft.fox2Input.addEventListener("input", function () {
    let value = Aircraft.fox2Input.value;

    if (value <= 0) {
        value = 10;
    }

    exp.fox2.setAttribute("max", value);
});

Aircraft.fox3Input.addEventListener("input", function () {
    let value = Aircraft.fox3Input.value;

    if (value <= 0) {
        value = 10;
    }

    exp.fox3.setAttribute("max", value);
});

Aircraft.fetchAircraftData().then(() => {
    Aircraft.buildAircraftMenu();
    Aircraft.loadoutButton.addEventListener("click", () => {
        Aircraft.loadoutPopup.classList.toggle("hidden");
    });
});
