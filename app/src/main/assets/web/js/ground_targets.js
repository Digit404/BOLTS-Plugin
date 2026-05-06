class GroundTargetType {
    static types = [];

    constructor(names) {
        this.names = names;
        GroundTargetType.types.push(this);
    }

    static async fetchTypes() {
        const response = await fetch("./ground_targets.json");
        const data = await response.json();
        for (const typeNames of data) {
            new GroundTargetType(typeNames);
        }
    }
}

class GroundTarget {
    static targets = [];
    static popup = document.getElementById("ground-targets-popup");
    static container = document.getElementById("ground-targets-container");
    static searchInput = document.getElementById("ground-target-search");
    static searchSubmitButton = document.getElementById("ground-target-submit");
    static autocompleteList = document.getElementById("ground-target-autocomplete-list");
    static button = document.getElementById("ground-targets-button");
    static bdaContainer = document.getElementById("bda-targets");
    static selectedIndex = null;

    constructor(name, type) {
        // find existing targets with the same name or `name (n)` pattern
        let count = 1;
        let newName = name;

        while (GroundTarget.targets.find((t) => t.name.toLowerCase() === newName.toLowerCase())) {
            count++;
            newName = `${name} (${count})`;
        }

        this.name = newName;
        this.type = type;
        this.status = 0; // 0 = no action, 1 = successful, 2 = unsuccessful, 3 = unknown
        this.listItem = null; // will be set when building the list
        this.button = null; // will be set when building BDA page

        GroundTarget.targets.push(this);
    }

    buildListItem() {
        this.listItem = document.createElement("div");
        this.listItem.classList.add("ground-target");

        const nameSpan = document.createElement("span");
        nameSpan.textContent = this.name;
        this.listItem.appendChild(nameSpan);

        const deleteButton = document.createElement("button");
        deleteButton.classList.add("icon", "delete-button");
        deleteButton.textContent = "delete";
        deleteButton.addEventListener("click", () => {
            GroundTarget.targets = GroundTarget.targets.filter((t) => t !== this);
            GroundTarget.buildBDAButtons();
            GroundTarget.buildGroundTargetList();
        });
        this.listItem.appendChild(deleteButton);

        return this.listItem;
    }

    buildBDAButton() {
        this.button = document.createElement("button");
        this.button.classList.add("status-button", "grey");
        this.button.textContent = this.name;
        this.updateBDAStatus();
        this.button.addEventListener("click", () => {
            this.status = (this.status + 1) % 4;
            this.updateBDAStatus();
        });
        return this.button;
    }

    updateBDAStatus() {
        if (!this.button) return;
        this.button.classList.remove("grey", "green", "red", "amber");
        switch (this.status) {
            case 0:
                this.button.classList.add("grey");
                break;
            case 1:
                this.button.classList.add("green");
                break;
            case 2:
                this.button.classList.add("red");
                break;
            case 3:
                this.button.classList.add("amber");
                break;
        }
    }

    toJSON() {
        return {
            name: this.name,
            type: this.type,
            status: this.status,
        };
    }

    static toJSON() {
        return this.targets.map((t) => t.toJSON());
    }

    static selectItem(index) {
        const items = this.autocompleteList.querySelectorAll("span");
        if (items.length === 0) return;
        items.forEach((item) => item.classList.remove("selected"));
        this.selectedIndex = (index + items.length) % items.length;
        const item = items[this.selectedIndex];
        item.classList.add("selected");
        item.scrollIntoView({ block: "nearest" });
        this.searchInput.value = item.textContent;
    }

    static initTargets() {
        // button functionality
        this.button.addEventListener("click", () => {
            this.popup.classList.toggle("hidden");
            this.searchInput.focus();
        });

        this.searchSubmitButton.addEventListener("click", () => {
            if (this.searchInput.value.trim() === "") return;
            new GroundTarget(this.searchInput.value.trim(), "Custom");
            this.buildGroundTargetList();
            this.resetSearch();
            this.buildBDAButtons();
        });

        this.searchInput.addEventListener("input", this.updateAutocomplete.bind(GroundTarget));
        this.searchInput.addEventListener("focus", this.updateAutocomplete.bind(GroundTarget));
        this.searchInput.addEventListener("blur", () => {
            setTimeout(() => {
                this.autocompleteList.classList.add("hidden");
            }, 100); // delay to allow click event on autocomplete items to register
        });
        this.searchInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                new GroundTarget(this.searchInput.value.trim(), "Custom");
                this.buildGroundTargetList();
                this.resetSearch();
                this.buildBDAButtons();
                e.preventDefault();
            }
            if (e.key === "ArrowDown" || e.key === "Tab") {
                const index = this.selectedIndex !== null ? this.selectedIndex + 1 : 0;
                this.selectItem(index);
                e.preventDefault();
            }
            if (e.key === "ArrowUp") {
                const index = this.selectedIndex !== null ? this.selectedIndex - 1 : 0;
                this.selectItem(index);
                e.preventDefault();
            }
            if (e.key === "Escape") {
                this.popup.classList.add("hidden");
                e.preventDefault();
            }
        });
    }

    static resetSearch() {
        this.searchInput.value = "";
        this.autocompleteList.innerHTML = "";
        this.autocompleteList.classList.add("hidden");
        this.selectedIndex = null;
        this.searchInput.focus();
    }

    static updateAutocomplete() {
        if (this.searchInput.focused === false) {
            this.autocompleteList.classList.add("hidden");
            return;
        } else {
            this.autocompleteList.classList.remove("hidden");
        }

        const value = this.searchInput.value.toLowerCase();
        this.autocompleteList.innerHTML = "";
        if (value.length === 0) return;

        const matches = fuse.search(value, { limit: 10 }).map((r) => r.item);
        for (const match of matches) {
            const matchName = match.names[0]; // show the first name as the primary
            const entry = document.createElement("span");
            entry.textContent = matchName;
            entry.addEventListener("click", () => {
                new GroundTarget(matchName, matchName);
                this.buildGroundTargetList();

                // reset search
                this.resetSearch();

                this.buildBDAButtons();
            });

            this.autocompleteList.appendChild(entry);
        }
    }

    static buildGroundTargetList() {
        this.container.innerHTML = "";
        for (const target of this.targets) {
            this.container.appendChild(target.buildListItem());
        }
    }

    static buildBDAButtons() {
        this.bdaContainer.innerHTML = "";
        for (const target of this.targets) {
            this.bdaContainer.appendChild(target.buildBDAButton());
        }
    }
}

let fuse;

GroundTargetType.fetchTypes().then(() => {
    GroundTarget.initTargets();

    // set up fuse for fuzzy search
    fuse = new Fuse(GroundTargetType.types, {
        keys: ["names"],
        threshold: 0.5,
        distance: 100,
        minMatchCharLength: 1,
        includeMatches: true,
    });
});
