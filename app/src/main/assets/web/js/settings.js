const settings = {
    settingsButton: document.getElementById("settings-button"),
    popup: document.getElementById("settings-popup"),
    saveButton: document.getElementById("settings-save"),
    takHostname: document.getElementById("tak-hostname"),
    takPort: document.getElementById("tak-port"),
    takCertOption: document.getElementById("tak-cert-option"),
    takLoginOption: document.getElementById("tak-login-option"),
    takCertContainer: document.getElementById("tak-cert-container"),
    takCert: document.getElementById("tak-cert"),
    takCertPassword: document.getElementById("tak-cert-password"),
    takLoginContainer: document.getElementById("tak-login-container"),
    takUsername: document.getElementById("tak-username"),
    takPassword: document.getElementById("tak-password"),
    connectionIndicator: document.getElementById("connection-indicator"),
};

settings.settingsButton.addEventListener("click", async () => {
    const config = await getConfig();

    settings.popup.classList.remove("hidden", "failed");

    settings.takHostname.value = config.takHost;
    settings.takPort.value = config.takPort;
});

settings.saveButton.addEventListener("click", () => {
    if (!settings.takHostname.value || settings.takHostname.value.trim() === "") {
        delete config.takHost;
    } else {
        config.takHost = settings.takHostname.value.trim();
    }

    if (!settings.takPort.value || isNaN(parseInt(settings.takPort.value))) {
        delete config.takPort;
    } else {
        config.takPort = parseInt(settings.takPort.value);
    }

    const connectingPopup = document.createElement("div");
    connectingPopup.classList.add("popup-background", "connecting-popup");
    const popupContent = document.createElement("div");
    popupContent.classList.add("popup-content", "text-center");
    connectingPopup.appendChild(popupContent);
    wirePopup(connectingPopup);

    const title = document.createElement("h2");
    title.innerText = "Connecting to TAK Server...";
    popupContent.appendChild(title);

    document.body.appendChild(connectingPopup);

    // if it's not cordova, the button shouldn't even appear, so just simulate a successful connection for testing
    if (!isCordova()) {
        testCordova = async () => settings.takHostname.value.trim() === "testing";
    }

    testCordova()
        .catch(() => false) // treat errors as failed connection
        .then((ok) => {
            if (ok) {
                settings.popup.classList.add("hidden");
                settings.popup.classList.remove("failed");

                title.innerText = "Connected successfully!";
                connectingPopup.classList.add("success");

                settings.connectionIndicator.classList.add("connected");
                settings.connectionIndicator.classList.remove("failed");

                setTimeout(() => {
                    document.body.removeChild(connectingPopup);
                }, 1000);
            } else {
                document.body.removeChild(connectingPopup);
                settings.popup.classList.add("failed");
                settings.connectionIndicator.classList.add("failed");
                settings.connectionIndicator.classList.remove("connected");
            }
        });
});

settings.takCertOption.addEventListener("click", () => {
    settings.takCertOption.classList.add("active");
    settings.takLoginOption.classList.remove("active");
    settings.takCertContainer.classList.remove("hidden");
    settings.takLoginContainer.classList.add("hidden");
});

settings.takLoginOption.addEventListener("click", () => {
    settings.takLoginOption.classList.add("active");
    settings.takCertOption.classList.remove("active");
    settings.takLoginContainer.classList.remove("hidden");
    settings.takCertContainer.classList.add("hidden");
});
