class ScrollInput extends HTMLElement {
    static HORIZONTAL_DEADZONE = 50;
    static HORIZONTAL_RANGE = 300;
    static SENSITIVITY_MIN = 0.25;
    static SENSITIVITY_MAX = 10;
    static SCROLL_SPEED = 0.2;

    static get observedAttributes() {
        return ["value", "min", "max", "sensitivity", "decimal-places", "step", "buttons"];
    }

    constructor() {
        super();
        this.attachShadow({ mode: "open" });

        this.initProperties();

        this.shadowRoot.innerHTML = /* html */ `
            <link rel="stylesheet" href="./css/components.css">
            <div id="scroll-input-container" part="container">
                <button id="scroll-decrement" class="button decrement" part="button decrement">remove</button>
                <input type="text" part="input" id="scroll-input" value="0.00">
                <button id="scroll-increment" class="button increment" part="button increment">add</button>
            </div>
        `;

        this.scrollInput = this.shadowRoot.getElementById("scroll-input");
        this.decrementButton = this.shadowRoot.getElementById("scroll-decrement");
        this.incrementButton = this.shadowRoot.getElementById("scroll-increment");

        if (!this.showButtons) {
            this.decrementButton.remove();
            this.incrementButton.remove();
        }

        this.scrollInput.addEventListener("mousedown", (e) => this.startScroll(e, false));
        this.scrollInput.addEventListener("touchstart", (e) => this.startScroll(e, true), { passive: false });
        this.scrollInput.addEventListener("wheel", (e) => this.wheelScroll(e));
        this.decrementButton.addEventListener("click", () => this.decrement());
        this.incrementButton.addEventListener("click", () => this.increment());

        this.displayValue();
    }

    initProperties() {
        this.scrollValue = this.parseAttribute("value", 0);
        this.valueMin = this.parseAttribute("min", -10000000);
        this.valueMax = this.parseAttribute("max", 10000000);
        this.baseSensitivity = this.parseAttribute("sensitivity", 1);
        this.decimalPlaces = this.parseAttribute("decimal-places", 0, parseInt);
        this.step = this.parseAttribute("step", 1);
        this.showButtons = this.getAttribute("buttons") !== "false" && this.getAttribute("buttons") !== "0";
        this.startPosition = { x: 0, y: 0 };
    }

    parseAttribute(name, defaultValue, parser = parseFloat) {
        return this.hasAttribute(name) ? parser(this.getAttribute(name), 10) : defaultValue;
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "min") {
            const min = parseFloat(newValue);
            this.valueMin = isNaN(min) ? 0 : min;
            this.value = this.clampValue(this.value);
        } else if (name === "max") {
            const max = parseFloat(newValue);
            this.valueMax = isNaN(max) ? 1000 : max;
            this.value = this.clampValue(this.value);
        } else if (name === "value") {
            const val = parseFloat(newValue);
            if (!isNaN(val) && val !== this.value) {
                this.value = val;
            }
        } else if (name === "sensitivity") {
            const sensitivity = parseFloat(newValue);
            this.baseSensitivity = isNaN(sensitivity) ? 1 : sensitivity;
        } else if (name === "decimal-places") {
            const places = parseInt(newValue, 10);
            this.decimalPlaces = isNaN(places) ? 0 : places;
            this.displayValue();
        } else if (name === "step") {
            const step = parseFloat(newValue);
            this.step = isNaN(step) ? 100 : step;
        }
    }

    mapRange(value, inMin, inMax, outMin, outMax) {
        return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
    }

    clampValue(value) {
        if (value < this.valueMin) return this.valueMin;
        if (value > this.valueMax) return this.valueMax;
        return value;
    }

    displayValue() {
        const trueValue = this.value / Math.pow(10, this.decimalPlaces);

        this.scrollInput.value = trueValue.toFixed(this.decimalPlaces);
        this.scrollInput.style.setProperty("--position", `${this.value / ScrollInput.SCROLL_SPEED}px`);

        this.dispatchEvent(
            new CustomEvent("change", {
                detail: { value: trueValue.toFixed(this.decimalPlaces) },
                bubbles: true,
            }),
        );
    }

    mapSensitivity(value) {
        if (value <= -ScrollInput.HORIZONTAL_RANGE) return ScrollInput.SENSITIVITY_MIN;
        if (value >= ScrollInput.HORIZONTAL_RANGE) return ScrollInput.SENSITIVITY_MAX;

        if (Math.abs(value) <= ScrollInput.HORIZONTAL_DEADZONE) {
            return 1;
        }

        if (value < 0) {
            return this.mapRange(value, -ScrollInput.HORIZONTAL_RANGE, -ScrollInput.HORIZONTAL_DEADZONE, ScrollInput.SENSITIVITY_MIN, 1);
        }

        return this.mapRange(value, ScrollInput.HORIZONTAL_DEADZONE, ScrollInput.HORIZONTAL_RANGE, 1, ScrollInput.SENSITIVITY_MAX);
    }

    startScroll(e, isTouch = false) {
        e.preventDefault();
        let prevY = isTouch ? e.touches[0].clientY : e.clientY;
        const baseX = isTouch ? e.touches[0].clientX : e.clientX;

        const originalValue = this.value;

        const getEventY = (e) => (isTouch ? e.touches[0].clientY : e.clientY);
        const getEventX = (e) => (isTouch ? e.touches[0].clientX : e.clientX);

        const onMove = (e) => {
            const dy = getEventY(e) - prevY;
            const dx = getEventX(e) - baseX;

            // get the real sensitivity based on horizontal movement
            const sensitivity = this.mapSensitivity(dx);

            // get the movement in pixels, adjusted by sensitivity
            const move = Math.round((dy * this.baseSensitivity) / 10 / sensitivity);

            let displaySensitivity;
            if (sensitivity <= 1) {
                displaySensitivity = this.mapRange(sensitivity, ScrollInput.SENSITIVITY_MIN, 1, 0.5, 1);
            } else {
                displaySensitivity = 1 + sensitivity / ScrollInput.SENSITIVITY_MAX;
            }

            // update the visual sensitivity indicator
            this.scrollInput.style.setProperty("--sensitivity", `${displaySensitivity}`);
            if (Math.abs(move) < 1) return;

            prevY = getEventY(e);
            this.value = this.clampValue(this.value - move);
        };

        const onUp = (e) => {
            if (!isTouch && Math.abs(baseX - getEventX(e)) < ScrollInput.HORIZONTAL_DEADZONE && this.value === originalValue) {
                // if the mouse hasn't moved a significant amount, focus the input
                this.scrollInput.focus();

                // select the entire input value
                this.scrollInput.setSelectionRange(0, this.scrollInput.value.length);

                this.scrollInput.addEventListener(
                    "blur",
                    () => {
                        e.preventDefault();
                        this.value = parseFloat(this.scrollInput.value) * Math.pow(10, this.decimalPlaces);
                    },
                    { once: true },
                );

                this.scrollInput.addEventListener("keydown", (e) => {
                    if (e.key === "Enter") {
                        e.preventDefault();
                        this.value = parseFloat(this.scrollInput.value) * Math.pow(10, this.decimalPlaces);
                        this.scrollInput.blur();
                    } else if (e.key.length === 1 && !e.key.match(/[0-9.]/)) {
                        // allow only numbers and dot
                        e.preventDefault();
                        return;
                    }
                });
            }

            this.scrollInput.style.setProperty("--sensitivity", "1");

            if (isTouch) {
                document.removeEventListener("touchmove", onMove);
                document.removeEventListener("touchend", onUp);
            } else {
                document.removeEventListener("mousemove", onMove);
                document.removeEventListener("mouseup", onUp);
            }
        };

        if (isTouch) {
            document.addEventListener("touchmove", onMove, { passive: false });
            document.addEventListener("touchend", onUp);
        } else {
            document.addEventListener("mousemove", onMove);
            document.addEventListener("mouseup", onUp);
        }
    }

    wheelScroll(e) {
        e.preventDefault();
        if (e.deltaY === 0) return;

        if (e.deltaY < 0) {
            this.value += this.step;
        } else {
            this.value = this.clampValue(this.value - this.step);
        }
    }

    increment() {
        this.value = this.clampValue(this.value + this.step);
    }

    decrement() {
        this.value = this.clampValue(this.value - this.step);
    }

    get value() {
        return this.scrollValue;
    }

    set value(val) {
        if (isNaN(val)) {
            return;
        }
        this.scrollValue = this.clampValue(val);
        this.displayValue();

        this.setAttribute("value", this.scrollValue.toString());
        this.dispatchEvent(
            new CustomEvent("input", {
                detail: { value: this.scrollValue },
                bubbles: true,
            }),
        );
    }
}

class RadialMenu extends HTMLElement {
    constructor() {
        super();

        // template
        const tpl = document.createElement("template");
        tpl.innerHTML = `
            <link rel="stylesheet" href="./css/components.css">
            <div id="radial">
              <button id="trigger" part="trigger">
                <slot name="trigger">menu</slot>
              </button>
              <div id="menu" part="menu"></div>
            </div>
        `;

        this.attachShadow({ mode: "open" }).appendChild(tpl.content.cloneNode(true));

        this.radial = this.shadowRoot.getElementById("radial");
        this.trigger = this.shadowRoot.getElementById("trigger");
        this.menuContainer = this.shadowRoot.getElementById("menu");

        // bind event handlers
        this.onPointerMove = this.onPointerMove.bind(this);
        this.onPointerUp = this.onPointerUp.bind(this);
        this.onPointerDown = this.onPointerDown.bind(this);

        // make sure the radial menu doesn't scroll the page
        this.radial.addEventListener("touchstart", (e) => e.preventDefault(), { passive: false });
        this.trigger.addEventListener("touchstart", (e) => e.preventDefault(), { passive: false });
        this.menuContainer.addEventListener("touchstart", (e) => e.preventDefault(), { passive: false });
    }

    connectedCallback() {
        // get the stuff inside
        const userNodes = [...this.childNodes].filter((n) => n.nodeType === Node.ELEMENT_NODE);

        // create buttons
        const buttons = userNodes.map((node, i) => {
            const btn = (() => {
                const b = document.createElement("button");
                b.append(node);
                return b;
            })();

            btn.part = "button";
            btn.style.setProperty("--index", i);
            this.menuContainer.appendChild(btn);
            return btn;
        });

        this.buttons = buttons;
        this.menuContainer.style.setProperty("--size", buttons.length);

        // get type attribute
        if ((this.getAttribute("type") || "").toLowerCase().startsWith("semi")) {
            this.menuContainer.classList.add("semicircle");
        }

        this.trigger.addEventListener("pointerdown", this.onPointerDown);
    }

    disconnectedCallback() {
        this.trigger.removeEventListener("pointerdown", this.onPointerDown);
        this.removeGlobalListeners();
    }

    closestBtn(x, y) {
        let min = Infinity,
            hit = null;

        // get closest button
        this.buttons.forEach((btn) => {
            const r = btn.getBoundingClientRect();
            const cx = r.left + r.width / 2;
            const cy = r.top + r.height / 2;
            const d2 = (x - cx) ** 2 + (y - cy) ** 2;

            if (d2 < min) {
                min = d2;
                hit = btn;
            }
        });

        // check if target is in the bounds of the trigger button
        const rT = this.trigger.getBoundingClientRect();
        const inTrigger = x >= rT.left && x <= rT.right && y >= rT.top && y <= rT.bottom;

        return inTrigger ? this.trigger : hit;
    }

    onPointerDown(e) {
        if (e.button !== 0) return; // only primary button
        e.preventDefault();
        e.stopPropagation();

        this.radial.classList.add("active", "hold");
        setTimeout(() => this.radial.classList.remove("hold"), 200);

        this.ownerDocument.addEventListener("pointermove", this.onPointerMove);
        this.ownerDocument.addEventListener("pointerup", this.onPointerUp);

        this.trigger.setPointerCapture(e.pointerId);
    }

    onPointerMove(e) {
        const hit = this.closestBtn(e.clientX, e.clientY);

        // clear active state
        this.buttons.forEach((b) => {
            b.classList.remove("active");
            b.part.remove("active");
        });

        this.trigger.part.remove("active");

        // set active state on hovered button
        if (hit) {
            hit.classList.add("active");
            hit.part.add("active");
        }
    }

    onPointerUp(e) {
        this.buttons.forEach((b) => {
            b.classList.remove("active");
            b.part.remove("active");
        });

        const target = this.closestBtn(e.clientX, e.clientY);
        if (target === this.trigger) {
            this.dispatchEvent(
                new Event("bump", {
                    bubbles: true,
                    composed: true,
                }),
            );
        } else if (target) {
            const clickEvent = new MouseEvent("click", {
                bubbles: true,
                cancelable: true,
                view: window,
            });
            target.firstElementChild.dispatchEvent(clickEvent);
        }

        this.trigger.part.remove("active");

        this.radial.classList.remove("active");
        this.removeGlobalListeners();
        this.trigger.releasePointerCapture(e.pointerId);
    }

    removeGlobalListeners() {
        this.ownerDocument.removeEventListener("pointermove", this.onPointerMove);
        this.ownerDocument.removeEventListener("pointerup", this.onPointerUp);
    }
}

class TallyTicker extends HTMLElement {
    static get observedAttributes() {
        return ["value", "min", "max"];
    }

    constructor() {
        super();
        this.attachShadow({ mode: "open" });

        this.shadowRoot.innerHTML = /* html */ `
            <link rel="stylesheet" href="./css/components.css">
            <div id="tally-ticker">
                <div id="minus"></div>
                <div id="plus">
                    <span id="value">0</span>
                    <span id="plus-icon"></span>
            </div>
        `;

        this.plusButton = this.shadowRoot.getElementById("plus");
        this.minusButton = this.shadowRoot.getElementById("minus");
        this.valueDisplay = this.shadowRoot.getElementById("value");

        this.minusButton.addEventListener("click", () => this.decrement());
        this.plusButton.addEventListener("click", () => this.increment());

        this.max = this.parseAttribute("max", 20, parseInt);
        this.min = this.parseAttribute("min", 0, parseInt);
        this._value = this.parseAttribute("value", 0, parseInt);
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "value") {
            const val = parseInt(newValue, 10);
            if (isNaN(val)) return;
            this._value = Math.max(0, val);
            this.valueDisplay.textContent = this._value.toString();
        } else if (name === "min") {
            const min = parseInt(newValue, 10);
            this.min = isNaN(min) ? 0 : min;
            this.value = Math.max(this.value, this.min);
        } else if (name === "max") {
            const max = parseInt(newValue, 10);
            this.max = isNaN(max) ? 100 : max;
            this.value = Math.min(this.value, this.max);
        }
    }

    get value() {
        return this._value;
    }

    set value(val) {
        if (isNaN(val)) return;
        this._value = Math.max(0, val);
        this.update();
    }

    parseAttribute(name, defaultValue, parser = parseFloat) {
        return this.hasAttribute(name) ? parser(this.getAttribute(name), 10) : defaultValue;
    }

    increment() {
        if (this.value >= this.max) return;
        this.value += 1;
    }

    decrement() {
        if (this.value <= this.min) return;
        this.value -= 1;
    }

    update() {
        this.valueDisplay.textContent = this._value.toString();
        this.setAttribute("value", this._value);
    }
}

customElements.define("radial-menu", RadialMenu);
customElements.define("scroll-input", ScrollInput);
customElements.define("tally-ticker", TallyTicker);
