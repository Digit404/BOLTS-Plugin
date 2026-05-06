class MaintenanceItem {
    static items = [];

    static buttonGrid = document.getElementById("maintenance-grid");
    static statusText = document.getElementById("status-text");
    static logo = document.getElementById("logo");
    static secret = false;
    static counter = 0;

    constructor(name) {
        this.name = name;
        // unfortunately status number is one less than code number
        this.status = 0; // 0 = green, 1 = amber, 2 = red
        this.button = null; // will be set when building the menu

        MaintenanceItem.items.push(this);
    }

    buildButton() {
        this.button = document.createElement("div");
        this.button.classList.add("status-button", "green");
        this.button.textContent = this.name;
        this.button.addEventListener("click", () => {
            if (MaintenanceItem.secret === false) {
                this.incrementStatus();
                MaintenanceItem.generateStatusText();
                return;
            }

            const clickedIndex = MaintenanceItem.items.indexOf(this);
            const gridSize = MaintenanceItem.gridSize;
            const row = Math.floor(clickedIndex / gridSize);
            const col = clickedIndex % gridSize;

            const adjacentDeltas = [
                [0, 0],
                [-1, 0],
                [1, 0],
                [0, -1],
                [0, 1],
            ];

            adjacentDeltas.forEach(([dRow, dCol]) => {
                const nRow = row + dRow;
                const nCol = col + dCol;
                if (nRow >= 0 && nRow < gridSize && nCol >= 0 && nCol < gridSize) {
                    const idx = nRow * gridSize + nCol;
                    const item = MaintenanceItem.items[idx];
                    if (!item) return;
                    item.incrementStatus();
                }
            });

            MaintenanceItem.generateStatusText();
        });
        return this.button;
    }

    updateButtonColor() {
        if (!this.button) return;
        this.button.classList.remove("green", "amber", "red");
        switch (this.status) {
            case 0:
                this.button.classList.add("green");
                break;
            case 1:
                this.button.classList.add("amber");
                break;
            case 2:
                this.button.classList.add("red");
                break;
        }
    }

    incrementStatus() {
        this.status = (this.status + 1) % 3;
        this.updateButtonColor();
    }

    toJSON() {
        const statusString = ["code-1", "code-2", "code-3"][this.status];
        return {
            name: this.name,
            status: statusString,
        };
    }

    static toJSON() {
        return this.items.filter((i) => i.status !== 0).map((i) => i.toJSON());
    }

    static get gridSize() {
        return Math.sqrt(this.items.length);
    }

    static buildMenu() {
        this.buttonGrid.innerHTML = "";

        for (const item of this.items) {
            this.buttonGrid.appendChild(item.buildButton());
        }

        this.logo.addEventListener("click", () => {
            document.body.classList.toggle("dark");
            this.counter++;
            this.secret = this.counter % 5 === 0;
            if (this.secret) {
                MaintenanceItem.randomizeStatuses();
            }
        });
    }

    static generateStatusText() {
        const greenItems = this.items.filter((item) => item.status === 0);
        const amberItems = this.items.filter((item) => item.status === 1);
        const redItems = this.items.filter((item) => item.status === 2);

        const statusCounts = [greenItems, amberItems, redItems];

        this.statusText.innerHTML = "";

        if (statusCounts[0].length === this.items.length) {
            const p = document.createElement("p");
            p.innerHTML = "All systems Code 1.";
            this.statusText.appendChild(p);
            return;
        }

        for (const status of statusCounts) {
            if (status.length > 0 && statusCounts.indexOf(status) !== 0) {
                const p = document.createElement("div");
                p.innerHTML = `Code ${statusCounts.indexOf(status) + 1} systems: `;
                this.statusText.appendChild(p);
                const div = document.createElement("div");
                div.classList.add("status-list", "status-" + (statusCounts.indexOf(status) + 1));
                this.statusText.appendChild(div);
                for (const item of status) {
                    const span = document.createElement("span");
                    span.innerHTML = item.name;
                    span.classList.add("status-item");
                    div.appendChild(span);
                }
            }
        }
    }

    static randomizeStatuses() {
        const NUMBER_OF_CLICKS = 100;
        let clicks = 0;

        setInterval(() => {
            if (clicks >= NUMBER_OF_CLICKS) return;
            const randomIndex = Math.floor(Math.random() * this.items.length);
            this.items[randomIndex].incrementStatus();
            clicks++;
        }, 10);

        setTimeout(() => {
            this.generateStatusText();
        }, NUMBER_OF_CLICKS * 20);
    }
}

const maintenanceItems = ["Engine", "Radar", "Flight Controls", "EW", "RWR", "Airframe", "Displays", "Weapons", "Avionics"];

for (const item of maintenanceItems) {
    new MaintenanceItem(item);
}

MaintenanceItem.buildMenu();
MaintenanceItem.generateStatusText();
