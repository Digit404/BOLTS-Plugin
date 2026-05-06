class AirEngagement {
    static engagements = [];
    static addButton = document.getElementById("add-air-engagement");
    static container = document.getElementById("air-engagements");

    constructor() {
        this.status = 0; // 0 = no action, 1 = splash, 2 = vanish
        this.listItem = null; // will be set when building the list
        AirEngagement.engagements.push(this);
    }

    buildElement() {
        this.listItem = document.createElement("div");
        this.listItem.classList.add("air-engagement");

        const label = document.createElement("span");
        label.classList.add("label");
        label.textContent = `Air Engagement # ${AirEngagement.engagements.indexOf(this) + 1}`;

        const splashButton = document.createElement("button");
        splashButton.textContent = "Splash";
        splashButton.classList.add("engagement-button", "splash");
        splashButton.addEventListener("click", () => {
            this.status = this.status === 1 ? 0 : 1;
            this.updateElement();
        });

        const vanishButton = document.createElement("button");
        vanishButton.textContent = "Faded";
        vanishButton.classList.add("engagement-button", "vanish");
        vanishButton.addEventListener("click", () => {
            this.status = this.status === 2 ? 0 : 2;
            this.updateElement();
        });

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "delete";
        deleteButton.classList.add("engagement-delete", "icon");
        deleteButton.addEventListener("click", () => {
            AirEngagement.engagements = AirEngagement.engagements.filter((e) => e !== this);
            AirEngagement.buildList();
        });

        this.listItem.appendChild(label);
        this.listItem.appendChild(splashButton);
        this.listItem.appendChild(vanishButton);
        this.listItem.appendChild(deleteButton);

        this.updateElement();
        return this.listItem;
    }

    updateElement() {
        this.listItem.classList.remove("success");
        this.listItem.classList.remove("failure");

        if (this.status === 1) {
            this.listItem.classList.add("success");
        }
        if (this.status === 2) {
            this.listItem.classList.add("failure");
        }
    }

    toJSON() {
        return {
            status: this.status,
        };
    }

    static toJSON() {
        return this.engagements.map((e) => e.toJSON());
    }

    static init() {
        this.addButton.addEventListener("click", () => {
            new AirEngagement();
            this.buildList();
        });
        this.buildList();
    }

    static buildList() {
        this.container.innerHTML = "";
        for (const engagement of this.engagements) {
            this.container.appendChild(engagement.buildElement());
        }
    }
}

AirEngagement.init();
