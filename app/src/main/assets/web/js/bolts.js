// config object holds the connection settings, is not persisted
const config = {};

async function getConfig() {
    const defaultConfig = {
        takHost: "10.0.2.2", // localhost for android emulator
        takPort: 8443,
    };

    let remoteConfig = {};
    try {
        const response = await fetch("./config.json");
        if (!response.ok) throw new Error("Fetch error");
        remoteConfig = await response.json();
    } catch (e) {
        // use default config
    }

    return { ...defaultConfig, ...remoteConfig, ...config };
}

// cordova related functions

function isCordova() {
    return typeof window.cordova !== "undefined" && window.cordova && typeof cordova.plugin !== "undefined";
}

async function testCordova() {
    const config = await getConfig();
    const takHost = config.takHost;
    const takPort = config.takPort;
    console.log("Testing Cordova HTTP to TAK at", config.takHost, config.takPort);

    return new Promise((resolve) => {
        cordova.plugin.http.get(
            `https://${takHost}:${takPort}/Marti/api/version/`,
            {},
            {},
            (response) => resolve(true),
            (error) => {
                console.log(error);
                resolve(false);
            },
        );
    });
}

async function onDeviceReady() {
    console.log("Device is ready");

    settings.settingsButton.classList.remove("hidden");

    // fetch the client certificate. if submit fails it's because you didn't copy the tak.p12 to /www/certificates
    // ./certificates is sorta a magic directory, but not important here
    const response = await fetch("certificates/tak.p12");
    if (!response.ok) {
        console.error("Failed to load client certificate:", response.status);
        return;
    }
    const p12 = await response.arrayBuffer();

    // set the client cert for mutual TLS
    cordova.plugin.http.setClientAuthMode(
        "buffer",
        {
            rawPkcs: p12,
            pkcsPassword: "atakatak", // hardcoded password for the tak cert
        },
        () => {
            console.log("client cert set");
        },
        (err) => {
            console.error("failed setting client cert", err);
        },
    );

    // ignore the tak server's garbage cert
    // there is a way to pin the cert, but this is simpler for now
    cordova.plugin.http.setServerTrustMode(
        "nocheck",
        () => console.log("Trust bypassed"),
        (e) => console.error("Failed to bypass trust", e),
    );
}

document.addEventListener("deviceready", onDeviceReady, false);

// generic page functionality

const containers = document.querySelectorAll(".main-container");
const tabContainers = document.querySelectorAll(".tab-container");
const popups = document.querySelectorAll(".popup-background");
const radial = document.getElementById("main-menu");
const meterSliders = document.querySelectorAll(".meter-slider");
const toggleButtons = document.querySelectorAll(".toggle-button");

function showContainer(containerId) {
    updateReport();
    containers.forEach((container) => {
        if (container.id === containerId) {
            container.style.display = "flex";
        } else {
            container.style.display = "none";
        }
    });
}

function setupMeterSlider(slider) {
    const max = parseFloat(slider.getAttribute("max")) || 100;
    const value = parseFloat(slider.getAttribute("value")) || 0;
    const step = parseFloat(slider.getAttribute("step")) || 1;

    slider.style.setProperty("--max", max);

    updateValue(value);

    let isDragging = false;

    function updateValue(newValue) {
        newValue = Math.min(Math.max(newValue, 0), max);
        newValue = Math.round(newValue / step) * step;
        slider.setAttribute("value", newValue);
        slider.style.setProperty("--value", newValue);

        // trigger change event
        fireChangeEvent();
    }

    function startDrag(e) {
        isDragging = true;
        drag(e);
        e.preventDefault();
    }

    function drag(e) {
        if (!isDragging) return;
        slider.classList.add("hover");

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;

        const rect = slider.getBoundingClientRect();
        const relativeX = clientX - rect.left;
        const percentage = Math.min(Math.max(relativeX / rect.width, 0), 1);
        const newValue = percentage * max;
        updateValue(newValue);
        e.preventDefault();
    }

    function stopDrag() {
        isDragging = false;
        slider.classList.remove("hover");
        // if there is a preventDefault, it will block touch events
    }

    function increment() {
        let currentValue = parseFloat(slider.getAttribute("value")) || 0;
        currentValue += step;
        updateValue(currentValue);
    }

    function decrement() {
        let currentValue = parseFloat(slider.getAttribute("value")) || 0;
        currentValue -= step;
        updateValue(currentValue);
    }

    function fireChangeEvent() {
        const event = new Event("change", { bubbles: true });
        slider.dispatchEvent(event);
    }

    slider.addEventListener("mousedown", startDrag);
    slider.addEventListener("touchstart", startDrag);

    // so we can set it from outside
    slider.addEventListener("set", (e) => {
        updateValue(e.detail.value);
    });

    window.addEventListener("mousemove", drag);
    window.addEventListener("touchmove", drag);

    window.addEventListener("mouseup", stopDrag);
    window.addEventListener("touchend", stopDrag);

    slider.addEventListener("wheel", (e) => {
        e.preventDefault();
        if (e.deltaY < 0) {
            increment();
        } else {
            decrement();
        }
    });
}

function wireFuelGage() {
    const fuelSlider = document.getElementById("fuel-input");
    const fuelText = document.getElementById("fuel-remaining");

    fuelText.value = fuelSlider.getAttribute("value");
    fuelText.max = fuelSlider.getAttribute("max");
    fuelText.min = fuelSlider.getAttribute("min");

    fuelSlider.addEventListener("change", function () {
        // no infinite loop because changing value programmatically won't trigger the event
        fuelText.value = fuelSlider.getAttribute("value");
    });

    fuelText.addEventListener("change", function () {
        const event = new CustomEvent("set", { detail: { value: fuelText.value } });
        fuelSlider.dispatchEvent(event);
    });
}

function wirePopup(popup) {
    popup.addEventListener("click", function (e) {
        if (e.target === popup) {
            popup.classList.add("hidden");
        }
    });

    let closeButton = popup.querySelector(".popup-close");
    const popupContent = popup.querySelector(".popup-content");

    if (!closeButton) {
        closeButton = document.createElement("button");
        closeButton.classList.add("popup-close");
        closeButton.innerHTML = "close";
        popupContent.appendChild(closeButton);
    }

    if (closeButton) {
        closeButton.addEventListener("click", function (e) {
            popup.classList.add("hidden");
        });
    }
}

// generic tab container functionality, does not apply to aircraft selection,
// but might apply to other static tab containers in the future
tabContainers.forEach((tabContainer) => {
    const tabs = tabContainer.querySelectorAll(".tab");
    const tabContents = tabContainer.querySelectorAll(".tab-content");

    for (let i = 0; i < tabs.length; i++) {
        tabs[i].addEventListener("click", function () {
            tabs.forEach((tab) => tab.classList.remove("active"));
            tabContents.forEach((content) => content.classList.add("hidden"));

            tabs[i].classList.add("active");
            tabContents[i].classList.remove("hidden");
        });
    }
});

toggleButtons.forEach((button) => {
    button.addEventListener("click", function () {
        button.classList.toggle("active");
    });
});

meterSliders.forEach(setupMeterSlider);

wireFuelGage();

// generic popup closing functionality
popups.forEach(wirePopup);

// non-declarative logic goes here

containers.forEach((container) => {
    container.style.display = "none";
});

radial.addEventListener("bump", () => {
    const showingContainer = Array.from(containers).find((c) => c.style.display === "flex");
    const index = Array.from(containers).indexOf(showingContainer);
    const nextIndex = (index + 1) % containers.length;
    showContainer(containers[nextIndex].id);
});

showContainer("targeting"); // default to showing the targeting container
