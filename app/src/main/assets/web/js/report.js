// report page elements
const report = {
    reportContainer: document.getElementById("report"),
    reportOutput: document.getElementById("report-output"),
    submitButton: document.getElementById("submit-report"),
    callsign: document.getElementById("callsign"),
    mission: document.getElementById("mission"),
};

function generateReport() {
    const aircraftData = Aircraft.getCurrentAircraftData();
    return {
        callsign: report.callsign.value,
        mission: report.mission.value,
        aircraftName: aircraftData ? aircraftData.name : "N/A",
        expenditures: {
            A2GWeapons: aircraftData ? aircraftData.A2G : [],
            A2AWeapons: aircraftData ? aircraftData.A2A : [],
            fuelRemaining: parseInt(exp.fuel.getAttribute("value")),
            fuelMax: parseInt(exp.fuel.getAttribute("max")),
            flaresUsed: exp.flaresButton.classList.contains("active"),
            chaffUsed: exp.chaffButton.classList.contains("active"),
            decoyUsed: exp.decoyButton.classList.contains("active"),
        },
        groundTargets: GroundTarget.toJSON(),
        maintenance: MaintenanceItem.toJSON(),
        airEngagements: AirEngagement.toJSON(),
        timestamp: new Date().toISOString(),
    };
}

function updateReport() {
    let generatedReport = generateReport();
    // uncomment for testing
    // generatedReport = JSON.parse(
    //     '{"callsign":"Mambo-5", "mission": "WTF102", "aircraftName":"F-15","expenditures":{"A2GWeapons":[{"name":"AGM-158 JASSM","quantity":2,"expended":1},{"name":"AGM-65 Maverick","quantity":2,"expended":1},{"name":"GBU-15","quantity":3,"expended":1}],"A2AWeapons":[{"name":"Fox 2","quantity":4,"expended":4},{"name":"Fox 3","quantity":14,"expended":2}],"fuelRemaining":12000,"fuelMax":20000,"flaresUsed":true,"chaffUsed":false,"decoyUsed":true},"groundTargets":[{"name":"eggs","type":"Custom","status":3},{"name":"Fulei-class","type":"Fulei-class","status":2}],"maintenance":[{"name":"Radar","status":"code-2"},{"name":"Flight Controls","status":"code-2"},{"name":"EW","status":"code-3"}],"airEngagements":[{"status":1},{"status":2}],"timestamp":"2026-03-20T20:03:18.318Z"}',
    // );
    const callsign = generatedReport.callsign || "N/A";
    const output = report.reportOutput;

    output.innerHTML = "";

    const el = {};

    el.titleRow = document.createElement("div");
    el.titleRow.classList.add("title-row");
    el.callsign = document.createElement("div");
    el.callsign.classList.add("callsign");
    el.callsign.innerText = callsign;
    el.titleRow.appendChild(el.callsign);

    if (generatedReport.mission) {
        el.mission = document.createElement("div");
        el.mission.classList.add("mission");
        el.mission.innerText = `${generatedReport.mission}`;
        el.titleRow.appendChild(el.mission);
    }

    output.appendChild(el.titleRow);
    output.appendChild(document.createElement("hr"));

    el.statusTitleRow = document.createElement("div");
    el.statusTitleRow.classList.add("title-row");
    el.statusTitle = document.createElement("div");
    el.statusTitle.classList.add("section-title");
    el.statusTitle.innerText = "Status";
    el.statusTitleRow.appendChild(el.statusTitle);
    output.appendChild(el.statusTitleRow);

    el.aircraft = document.createElement("div");
    el.aircraft.classList.add("aircraft");
    el.aircraft.innerText = `${generatedReport.aircraftName}`;
    el.statusTitleRow.appendChild(el.aircraft);

    el.statusContainer = document.createElement("div");
    el.statusContainer.classList.add("status-container");

    el.fuelStatus = document.createElement("div");
    el.fuelStatus.classList.add("fuel-report");
    el.fuelStatus.innerText = `Fuel Remaining: ${generatedReport.expenditures.fuelRemaining} lbs`;
    const fuelRatio = (generatedReport.expenditures.fuelRemaining / generatedReport.expenditures.fuelMax);
    el.fuelStatus.style.setProperty("--value", fuelRatio);
    output.appendChild(el.fuelStatus);

    el.flaresStatus = document.createElement("div");
    el.flaresStatus.classList.add("countermeasures-item");
    el.flaresStatus.innerText = "Flares";
    if (generatedReport.expenditures.flaresUsed) {
        el.flaresStatus.classList.add("used");
    }
    el.statusContainer.appendChild(el.flaresStatus);

    el.chaffStatus = document.createElement("div");
    el.chaffStatus.classList.add("countermeasures-item");
    el.chaffStatus.innerText = "Chaff";
    if (generatedReport.expenditures.chaffUsed) {
        el.chaffStatus.classList.add("used");
    }
    el.statusContainer.appendChild(el.chaffStatus);

    el.decoyStatus = document.createElement("div");
    el.decoyStatus.classList.add("countermeasures-item");
    el.decoyStatus.innerText = "Decoy";
    if (generatedReport.expenditures.decoyUsed) {
        el.decoyStatus.classList.add("used");
    }
    el.statusContainer.appendChild(el.decoyStatus);

    output.appendChild(el.statusContainer);
    output.appendChild(document.createElement("hr"));

    el.loadoutTitleRow = document.createElement("div");
    el.loadoutTitleRow.classList.add("title-row");

    el.loadoutTitle = document.createElement("div");
    el.loadoutTitle.classList.add("section-title");
    el.loadoutTitle.innerText = "Loadout";
    el.loadoutTitleRow.appendChild(el.loadoutTitle);

    el.A2AWeaponsContainer = document.createElement("div");
    el.A2AWeaponsContainer.classList.add("a2a-container");
    for (const weapon of generatedReport.expenditures.A2AWeapons) {
        const weaponDiv = document.createElement("div");
        weaponDiv.classList.add("item", "a2a-item");

        const weaponName = document.createElement("span");
        weaponName.classList.add("a2a-name");
        weaponName.innerText = weapon.name;
        weaponDiv.appendChild(weaponName);

        const weaponQty = document.createElement("span");
        weaponQty.classList.add("a2a-quantity");
        weaponQty.innerText = `x${weapon.quantity - weapon.expended}/${weapon.quantity}`;
        weaponDiv.appendChild(weaponQty);
        el.A2AWeaponsContainer.appendChild(weaponDiv);
    }

    el.loadoutTitleRow.appendChild(el.A2AWeaponsContainer);

    el.A2GWeaponsContainer = document.createElement("div");
    el.A2GWeaponsContainer.classList.add("item-container");

    for (const weapon of generatedReport.expenditures.A2GWeapons) {
        const weaponDiv = document.createElement("div");
        weaponDiv.classList.add("item", "weapon-item");

        const weaponName = document.createElement("span");
        weaponName.classList.add("weapon-name");
        weaponName.innerText = weapon.name;
        weaponDiv.appendChild(weaponName);

        const weaponQty = document.createElement("span");
        weaponQty.classList.add("weapon-quantity");
        weaponQty.innerText = `x${weapon.quantity - weapon.expended}/${weapon.quantity}`;
        weaponDiv.appendChild(weaponQty);
        el.A2GWeaponsContainer.appendChild(weaponDiv);
    }

    output.appendChild(el.loadoutTitleRow);
    output.appendChild(el.A2GWeaponsContainer);

    el.targetsTitle = document.createElement("div");
    el.targetsTitle.classList.add("section-title");
    el.targetsTitle.innerText = "Targets";

    el.targetsContainer = document.createElement("div");
    el.targetsContainer.classList.add("item-container");

    for (const target of generatedReport.groundTargets) {
        const targetDiv = document.createElement("div");
        targetDiv.classList.add("item", "target-item");
        targetDiv.classList.add("status-" + target.status);

        const targetName = document.createElement("span");
        targetName.classList.add("target-name");
        targetName.innerText = target.name;
        targetDiv.appendChild(targetName);

        el.targetsContainer.appendChild(targetDiv);
    }

    output.appendChild(el.targetsTitle);
    output.appendChild(el.targetsContainer);

    if (generatedReport.maintenance.length || generatedReport.airEngagements.length) {
        output.appendChild(document.createElement("hr"));
    }

    if (generatedReport.airEngagements.length) {
        el.airEngagementsTitle = document.createElement("div");
        el.airEngagementsTitle.classList.add("section-title");
        el.airEngagementsTitle.innerText = "Air Engagements";

        el.airEngagementsContainer = document.createElement("div");
        el.airEngagementsContainer.classList.add("item-container");

        for (const engagement of generatedReport.airEngagements) {
            const engagementDiv = document.createElement("div");
            engagementDiv.classList.add("item", "engagement-item");
            if (engagement.status === 1) {
                engagementDiv.classList.add("success");
            } else if (engagement.status === 2) {
                engagementDiv.classList.add("failure");
            }
            el.airEngagementsContainer.appendChild(engagementDiv);
        }

        output.appendChild(el.airEngagementsTitle);
        output.appendChild(el.airEngagementsContainer);
    }

    if (generatedReport.maintenance.length) {
        el.maintenanceTitle = document.createElement("div");
        el.maintenanceTitle.classList.add("section-title");
        el.maintenanceTitle.innerText = "Maintenance Issues";

        el.maintenanceContainer = document.createElement("div");
        el.maintenanceContainer.classList.add("item-container");

        for (const item of generatedReport.maintenance) {
            const itemDiv = document.createElement("div");
            itemDiv.classList.add("item", "maintenance-item");
            itemDiv.classList.add(item.status);
            const itemName = document.createElement("span");
            itemName.classList.add("maintenance-name");
            itemName.innerText = item.name;
            itemDiv.appendChild(itemName);
            el.maintenanceContainer.appendChild(itemDiv);
        }

        output.appendChild(el.maintenanceTitle);
        output.appendChild(el.maintenanceContainer);
    }

    output.classList.remove("empty");
}

async function submitReport() {
    const reportObj = generateReport();
    const callsign = (reportObj?.callsign || "Unknown").trim() || "Unknown";
    const reportText = JSON.stringify(reportObj, null, 2);

    updateReport();

    report.submitButton.innerText = "Submitting...";
    report.submitButton.disabled = true;

    try {
        const ok = await uploadReportInterface(reportText);
        if (ok) showSubmitted();
        else await showError();
    } catch (e) {
        console.error(e);
        await showError();
    }
}

function httpPost(url, body, headers = {}) {
    return new Promise((resolve, reject) => {
        cordova.plugin.http.post(url, body, headers, resolve, reject);
    });
}

async function uploadReportCordova(reportText, callsign) {
    const timestamp = new Date()
        .toISOString()
        .replace(/\.\d{3}Z$/, "Z") // remove milliseconds
        .replace(/:/g, "-"); // replace colons for filename safety

    const fileName = `${callsign}_${timestamp}`;

    const config = await getConfig();

    // encode query params
    const takHost = config.takHost;
    const takPort = config.takPort;
    const url =
        `https://${takHost}:${takPort}/Marti/sync/upload` +
        `?name=${encodeURIComponent(fileName)}` +
        `&tool=${encodeURIComponent("BOLTS")}` +
        `&keywords=${encodeURIComponent(`IFR,${callsign}`)}`;

    // hopefully tak will eat this
    cordova.plugin.http.setDataSerializer("utf8");

    // use the httpPost wrapper to get a promise
    const response = await httpPost(url, reportText, {
        "Content-Type": "application/json",
    });

    // response.data is usually a string
    // TAK returns JSON with UID/Hash
    let uid, hash;
    try {
        const j = JSON.parse(response.data);
        uid = j.UID;
        hash = j.Hash;
    } catch {
        console.log("TAK response (non-JSON):", response.data);
    }

    console.log("Uploaded report to TAK", { fileName, uid, hash });

    return response.status >= 200 && response.status < 300;
}

async function uploadReportFetch(reportText) {
    const response = await fetch("/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: reportText,
    });
    return response.ok;
}

async function uploadReportInterface(reportText) {
    // Check if the interface exists to avoid errors in regular browsers
    if (window.Android && window.Android.postData) {
        window.Android.postData(reportText);
    } else {
        console.log("Interface not found");
    }

    return "yippee!";
}

function showSubmitted() {
    report.submitButton.disabled = false;
    report.submitButton.classList.add("green");
    report.submitButton.innerText = "Submitted";
    setTimeout(() => {
        report.submitButton.classList.remove("green");
        report.submitButton.innerText = "Submit";
    }, 2000);
}

async function showError() {
    report.submitButton.disabled = false;
    report.submitButton.classList.add("red");
    report.submitButton.innerText = "Error submitting report";

    const config = await getConfig();

    // encode query params
    const takHost = config.takHost;

    report.submitButton.innerText = `Error submitting report to TAK at ${takHost}`;

    setTimeout(() => {
        report.submitButton.classList.remove("red");
        report.submitButton.innerText = "Submit";
    }, 5000);
}

report.submitButton.addEventListener("click", submitReport);
