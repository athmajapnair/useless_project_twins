const questions = [
    {
        id: "height",
        title: "🌴 Tree Height",
        options: [
            { label: "Small", value: 10 },
            { label: "Medium", value: 20 },
            { label: "Tall", value: 30 }
        ]
    },
    {
        id: "coconuts",
        title: "🥥 Number of Coconuts",
        options: [
            { label: "1 - 5", value: 5 },
            { label: "6 - 15", value: 15 },
            { label: "16+", value: 25 }
        ]
    },
    {
        id: "wind",
        title: "💨 Wind Speed",
        options: [
            { label: "Calm", value: 5 },
            { label: "Normal", value: 15 },
            { label: "Strong", value: 30 }
        ]
    },
    {
        id: "distance",
        title: "🧍 Your Distance",
        options: [
            { label: "More than 10m", value: 0 },
            { label: "5 - 10m", value: 15 },
            { label: "Under 5m 💀", value: 30 }
        ]
    }
];

// Risk tiers: mood and the "target: you" line now scale with the actual
// score instead of being random, and low-risk results stay low-key.
const tiers = [
    {
        max: 20,
        cssClass: "safe",
        message: "🟢 SAFE — The coconut has no personal issues with you.",
        keralaMessage: "🟢 SAFE — Thenga onnum cheyyilla, relax aavam.",
        moods: ["Calm 😌", "Unbothered 😎"],
        stability: "Stable",
        showTarget: false
    },
    {
        max: 40,
        cssClass: "suspicious",
        message: "🟡 SUSPICIOUS — Maybe don't stand directly underneath it.",
        keralaMessage: "🟡 SUSPICIOUS — Thenga alpam suspicious aanu, sookshikkanam.",
        moods: ["Mildly Suspicious 🤨", "Curious 🧐"],
        stability: "Slightly loose",
        showTarget: false
    },
    {
        max: 60,
        cssClass: "risky",
        message: "🟠 RISKY — The coconut is considering its options.",
        keralaMessage: "🟠 RISKY — Thenga confuse aanu, maari nilkkeda.",
        moods: ["Agitated 😬", "Suspicious 🤨"],
        stability: "Questionable",
        showTarget: true
    },
    {
        max: 80,
        cssClass: "danger",
        message: "🔴 DANGEROUS — BRO. MOVE.",
        keralaMessage: "🔴 DANGEROUS — Thenga vannekkam, odi rakshapedu!",
        moods: ["Angry 😡", "Very Angry 😤"],
        stability: "Unstable",
        showTarget: true
    },
    {
        max: 100,
        cssClass: "final-boss",
        message: "☠️ THENGA FINAL BOSS — WHY ARE YOU STILL UNDER THE TREE?!",
        keralaMessage: "☠️ FINAL BOSS — Thenga vere level aanu, odi odi odi!!!",
        moods: ["PERSONAL ☠️", "FURIOUS 🤬"],
        stability: "Critical",
        showTarget: true
    }
];

function getTier(risk) {
    return tiers.find(t => risk <= t.max);
}

const answers = {};
let currentQuestion = 0;
const keralaMode = true; // Kerala Mode is now always on, no toggle
let lastRisk = null;
let lastTier = null;

const screens = {
    question: document.getElementById("screen-question"),
    analyzing: document.getElementById("screen-analyzing"),
    result: document.getElementById("screen-result")
};

const tree = document.getElementById("tree");
const fallingCoconut = document.getElementById("fallingCoconut");
const sideRail = document.getElementById("sideRail");
const introPage = document.getElementById("introPage");
const appPage = document.getElementById("appPage");

function showScreen(name) {
    const isIntro = name === "intro";
    introPage.classList.toggle("active", isIntro);
    appPage.classList.toggle("active", !isIntro);

    if (!isIntro) {
        Object.values(screens).forEach(s => s.classList.remove("active"));
        screens[name].classList.add("active");
    }

    // The icon rail only makes sense once there's a result to dig into.
    sideRail.classList.toggle("visible", name === "result");
    if (name !== "result") closePanel();
}

/* ---------- SLIDE-IN PANEL (shared by the rail icons and the Premium badge) ---------- */

const panelOverlay = document.getElementById("panelOverlay");
const sidePanel = document.getElementById("sidePanel");
const panelContent = document.getElementById("panelContent");
const panelClose = document.getElementById("panelClose");

function openPanel(html) {
    panelContent.innerHTML = html;
    attachPanelHandlers();
    sidePanel.classList.add("open");
    panelOverlay.classList.add("visible");
}

function closePanel() {
    sidePanel.classList.remove("open");
    panelOverlay.classList.remove("visible");
}

panelClose.addEventListener("click", closePanel);
panelOverlay.addEventListener("click", closePanel);

/* ---------- PREMIUM (fixed corner badge, not a buried option) ---------- */

const premiumBadge = document.getElementById("premiumBadge");
premiumBadge.addEventListener("click", () => {
    openPanel(
        "<h3>💎 Thenga Alert Premium™</h3>" +
        "<p class='price'>₹999/month</p>" +
        "<p>✅ Earlier warning</p>" +
        "<p>✅ Premium coconut detection</p>" +
        "<p>✅ Advanced gravity analysis</p>" +
        "<p>✅ Faster running recommendations</p>" +
        "<p>✅ Emotional support from the Twins</p>" +
        "<button class='btn ghost' id='upgradeBtn' type='button'>Upgrade Now</button>" +
        "<p id='upgradeOutput'></p>"
    );
});

/* ---------- INTRO ---------- */

document.getElementById("startBtn").addEventListener("click", () => {
    currentQuestion = 0;
    renderQuestion();
    showScreen("question");
});

/* ---------- QUESTION WIZARD (one question per screen) ---------- */

const questionCard = document.getElementById("questionCard");
const progressDots = document.getElementById("progressDots");
const nextBtn = document.getElementById("nextBtn");
const backBtn = document.getElementById("backBtn");

function renderProgress() {
    progressDots.innerHTML = "";
    questions.forEach(q => {
        const dot = document.createElement("span");
        if (answers[q.id] !== undefined) dot.classList.add("done");
        progressDots.appendChild(dot);
    });
}

function renderQuestion() {
    const q = questions[currentQuestion];

    questionCard.innerHTML =
        "<h2>" + q.title + "</h2>" +
        "<div class='options'>" +
        q.options.map(opt =>
            "<button class='option-btn' data-value='" + opt.value + "'>" + opt.label + "</button>"
        ).join("") +
        "</div>";

    const selected = answers[q.id];
    const optionButtons = questionCard.querySelectorAll(".option-btn");
    optionButtons.forEach(btn => {
        if (selected !== undefined && Number(btn.dataset.value) === selected) {
            btn.classList.add("selected");
        }
        btn.addEventListener("click", () => {
            optionButtons.forEach(b => b.classList.remove("selected"));
            btn.classList.add("selected");
            answers[q.id] = Number(btn.dataset.value);
            nextBtn.disabled = false;
            renderProgress();
        });
    });

    nextBtn.disabled = selected === undefined;
    nextBtn.textContent = currentQuestion === questions.length - 1 ? "Calculate Risk 🥥" : "Next ➡️";
    backBtn.classList.toggle("hidden", currentQuestion === 0);

    renderProgress();
}

nextBtn.addEventListener("click", () => {
    if (currentQuestion < questions.length - 1) {
        currentQuestion++;
        renderQuestion();
    } else {
        runAnalysis();
    }
});

backBtn.addEventListener("click", () => {
    if (currentQuestion > 0) {
        currentQuestion--;
        renderQuestion();
    }
});

/* ---------- ANALYZING ---------- */

const analyzingLines = document.getElementById("analyzingLines");

const analysisSteps = [
    "🔍 Checking tree height...",
    "🥥 Counting suspicious coconuts...",
    "💨 Analyzing wind...",
    "📊 Calculating survival probability..."
];

function runAnalysis() {
    showScreen("analyzing");
    analyzingLines.innerHTML = "";
    tree.classList.add("thinking");

    analysisSteps.forEach((line, i) => {
        setTimeout(() => {
            const p = document.createElement("p");
            p.textContent = line;
            analyzingLines.appendChild(p);
        }, i * 500);
    });

    setTimeout(() => {
        tree.classList.remove("thinking");
        showResult();
    }, analysisSteps.length * 500 + 600);
}

/* ---------- RESULT ---------- */

const resultBox = document.getElementById("result");
const meterFill = document.getElementById("meterFill");
const runButton = document.getElementById("runButton");

function showResult() {
    const total = answers.height + answers.coconuts + answers.wind + answers.distance;
    const risk = Math.min(100, Math.round((total / 115) * 100));
    const tier = getTier(risk);

    lastRisk = risk;
    lastTier = tier;

    const coconutNumber = Math.floor(Math.random() * 20) + 1;
    const mood = tier.moods[Math.floor(Math.random() * tier.moods.length)];

    resultBox.className = "";
    resultBox.innerHTML =
        "<h2>🥥 Danger score: " + risk + "%</h2>" +
        "<p class='tier-message'>" + (keralaMode ? tier.keralaMessage : tier.message) + "</p>" +
        "<hr>" +
        "<h3>🥥 Target coconut</h3>" +
        "<p>Coconut #" + coconutNumber + "</p>" +
        "<p>Mood: <strong>" + mood + "</strong></p>" +
        "<p>Stability: " + tier.stability + "</p>" +
        (tier.showTarget ? "<p>Target: YOU 👀</p>" : "") +
        (risk > 80 ? (
            "<div class='emergency-banner'>" +
            "<p class='siren'>🚨🚨🚨 THENGA EMERGENCY 🚨🚨🚨</p>" +
            "<p class='danger-abs'>DANGER LEVEL: ABSOLUTELY NOT</p>" +
            "<p>TWINS HAVE RECOMMENDED:</p>" +
            "<p class='run-emoji'>🏃</p>" +
            "<p class='run-text'>RUN.<br>RUN NOW.</p>" +
            "<p class='why-here'>WHY ARE YOU STILL HERE?</p>" +
            "</div>"
        ) : "");

    // "I should probably run" only makes sense once risk is genuinely high -
    // below that threshold it's removed from the page, not just hidden.
    runButton.classList.toggle("hidden", risk <= 50);
    runButton.disabled = false;
    runButton.textContent = risk > 80 ? "🏃 I accept my fate" : "🏃 I should probably run";

    document.body.classList.toggle("emergency-mode", risk > 80);

    renderSideRail(risk, tier);

    showScreen("result");

    fallingCoconut.classList.remove("fall", "wobble");

    requestAnimationFrame(() => {
        setTimeout(() => {
            meterFill.style.width = risk + "%";
            meterFill.style.backgroundColor =
                risk <= 20 ? "#66bb6a" :
                risk <= 40 ? "#fbc02d" :
                risk <= 60 ? "#fb8c00" :
                risk <= 80 ? "#e53935" : "#b71c1c";
            resultBox.className = tier.cssClass;

            fallingCoconut.classList.add(risk > 50 ? "fall" : "wobble");
        }, 150);
    });
}

function updateTierMessage() {
    if (!lastTier) return;
    const msgEl = resultBox.querySelector(".tier-message");
    if (msgEl) {
        msgEl.textContent = keralaMode ? lastTier.keralaMessage : lastTier.message;
    }
}

runButton.addEventListener("click", () => {
    const acceptingFate = runButton.textContent.includes("accept my fate");
    resultBox.innerHTML += acceptingFate
        ? "<h2>😂 FATE ACCEPTED.</h2><p>You remain under the tree. Bold strategy.</p>"
        : "<h2>🏃🏃🏃 RUNNING FOR YOUR LIFE...</h2><p>Good decision. Your ancestors are proud.</p>";
    runButton.disabled = true;
});

/* ---------- LEFT ICON RAIL + PANEL CONTENT (psych profile, why you, excuses, etc.) ---------- */

function statRow(label, value) {
    return (
        "<div class='stat-row'>" +
        "<span class='stat-label'>" + label + "</span>" +
        "<div class='stat-bar'><div class='stat-fill' style='width:" + value + "%'></div></div>" +
        "<span class='stat-value'>" + value + "%</span>" +
        "</div>"
    );
}

function renderSideRail(risk, tier) {
    const aggression = risk;
    const patience = 100 - risk;
    const interest = tier.showTarget
        ? Math.floor(Math.random() * 21) + 80
        : Math.floor(Math.random() * 31) + 5;

    const fallingChance =
        risk > 80 ? "Let's not discuss that." :
        risk > 50 ? "Higher than we'd like." :
        risk > 20 ? "Low, but never zero." :
        "Basically zero. Relax.";

    const grudge = tier.showTarget ? "YES" : "Unlikely";

    const wrongReasons = ["Wrong place", "Wrong time", "Wrong tree", "Wrong day", "Wrong shoes"];
    const shuffledWrong = [...wrongReasons].sort(() => Math.random() - 0.5).slice(0, 3);

    const realReasons = [
        "You looked suspicious.",
        "You walked under the tree.",
        "The coconut remembers.",
        "You made eye contact.",
        "Kerala.",
        "No particular reason. It just doesn't like you.",
        "Wrong life choices."
    ];
    const realReason = realReasons[Math.floor(Math.random() * realReasons.length)];

    const incidentMinutesAgo = Math.floor(Math.random() * 58) + 1;
    const incidentCoconut = Math.floor(Math.random() * 20) + 1;
    const investigationStatus = [
        "Still blaming gravity.",
        "Ongoing. No leads.",
        "Coconut refuses to comment.",
        "Closed due to lack of witnesses."
    ][Math.floor(Math.random() * 4)];

    const horoscopeMood = ["ambitious", "petty", "dramatic", "vengeful", "unusually calm"][
        Math.floor(Math.random() * 5)
    ];
    const luckyNumber = Math.floor(Math.random() * 9) + 1;
    const compatibility = Math.floor(Math.random() * 10) + 1;

    // Each entry is one rail icon; clicking it opens its content in the
    // slide-in panel instead of stacking everything into the page.
    const sections = [
        {
            icon: "🥥",
            label: "Coconut psychological profile",
            html:
                "<h3>🥥 Coconut Psychological Profile</h3>" +
                statRow("Aggression", aggression) +
                statRow("Patience", patience) +
                statRow("Interest in you", interest) +
                "<p>Chance of falling: <strong>" + fallingChance + "</strong></p>" +
                "<p>Personal grudge: <strong>" + grudge + "</strong></p>"
        },
        {
            icon: "🎯",
            label: "Why did the coconut choose you?",
            html:
                "<h3>🎯 Why did the coconut choose you?</h3>" +
                shuffledWrong.map(r => "<p>❌ " + r + "</p>").join("") +
                "<p>✅ " + realReason + "</p>"
        },
        {
            icon: "🗣️",
            label: "Excuse generator",
            html:
                "<h3>🗣️ Excuse Generator</h3>" +
                "<button class='btn ghost' id='excuseBtn' type='button'>Generate Excuse</button>" +
                "<p id='excuseOutput'></p>"
        },
        {
            icon: "🔬",
            label: "Scientific basis",
            html:
                "<h3>🔬 Scientific Basis</h3>" +
                "<p><strong>Algorithm used:</strong> Coconut vibes + gravity + Kerala experience + Twins' imagination</p>" +
                "<p><strong>Accuracy:</strong> 0.00001%</p>" +
                "<p><strong>Peer reviewed by:</strong> 🌴 One coconut tree</p>" +
                "<p><strong>Data source:</strong> Trust me bro.</p>"
        },
        {
            icon: "📜",
            label: "Last coconut incident",
            html:
                "<h3>📜 Last Coconut Incident</h3>" +
                "<p>Last incident: " + incidentMinutesAgo + " minutes ago</p>" +
                "<p>Coconut #" + incidentCoconut + " attempted something suspicious.</p>" +
                "<p>Location: Somewhere in Kerala</p>" +
                "<p>Victim status: Unknown</p>" +
                "<p>Investigation status: " + investigationStatus + "</p>"
        },
        {
            icon: "🔮",
            label: "Today's coconut horoscope",
            html:
                "<h3>🔮 Today's Coconut Horoscope</h3>" +
                "<p>Your coconut is feeling <strong>" + horoscopeMood + "</strong> today.</p>" +
                "<p>Lucky number: " + luckyNumber + "</p>" +
                "<p>Lucky direction: AWAY FROM THE TREE</p>" +
                "<p>Compatibility: You ❤️ Coconut: " + compatibility + "%</p>" +
                "<p>Recommended action: Go inside.</p>"
        },
        {
            icon: "⚔️",
            label: "Threat comparison",
            html:
                "<h3>⚔️ Threat Comparison: Coconut vs. You</h3>" +
                "<div class='threat-grid'>" +
                "<div><h4>🥥 Coconut</h4>" +
                "<p>Height: 9/10</p><p>Gravity advantage: 10/10</p>" +
                "<p>Motivation: 11/10</p><p>Common sense: Unknown</p></div>" +
                "<div><h4>🧍 You</h4>" +
                "<p>Height: 5/10</p><p>Reaction speed: 3/10</p>" +
                "<p>Standing-under-tree ability: 10/10 💀</p></div>" +
                "</div>" +
                "<p class='winner'>WINNER: 🥥 COCONUT — \"Better luck next time.\"</p>"
        },
        {
            icon: "🚨",
            label: "Report this coconut",
            html:
                "<h3>🚨 Report This Coconut</h3>" +
                "<button class='btn ghost' id='reportBtn' type='button'>Report This Coconut</button>" +
                "<p id='reportOutput'></p>"
        }
    ];

    if (risk > 80) {
        sections.unshift({
            icon: "🆘",
            label: "Emergency protocol",
            urgent: true,
            html:
                "<h3>🆘 Emergency Protocol</h3>" +
                "<p>STEP 1: MOVE.</p><p>STEP 2: MOVE FASTER.</p>" +
                "<p>STEP 3: WHY ARE YOU STILL READING THIS?</p><p>STEP 4: RUN.</p>"
        });
    }

    sideRail.innerHTML = "";
    sections.forEach(section => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.title = section.label;
        btn.setAttribute("aria-label", section.label);
        btn.textContent = section.icon;
        if (section.urgent) btn.classList.add("urgent");
        btn.addEventListener("click", () => openPanel(section.html));
        sideRail.appendChild(btn);
    });
}

function attachPanelHandlers() {
    const excuseBtn = document.getElementById("excuseBtn");
    if (excuseBtn) {
        excuseBtn.addEventListener("click", () => {
            const excuses = [
                "I was conducting scientific research.",
                "I didn't see the coconut.",
                "Gravity was stronger than expected.",
                "It was not my coconut.",
                "I blame the government.",
                "My friend told me it was safe.",
                "This was part of my academic project."
            ];
            document.getElementById("excuseOutput").textContent =
                "🗣️ " + excuses[Math.floor(Math.random() * excuses.length)];
        });
    }

    const reportBtn = document.getElementById("reportBtn");
    if (reportBtn) {
        reportBtn.addEventListener("click", () => {
            document.getElementById("reportOutput").innerHTML =
                "Thank you for your report.<br>Unfortunately, the coconut has denied all allegations." +
                "<br><strong>Case status: 🥥 STILL SUSPICIOUS</strong>";
            reportBtn.disabled = true;
        });
    }

    const upgradeBtn = document.getElementById("upgradeBtn");
    if (upgradeBtn) {
        upgradeBtn.addEventListener("click", () => {
            document.getElementById("upgradeOutput").textContent =
                "Payment system currently unavailable because this website has absolutely no business model.";
        });
    }
}

/* ---------- RESTART ---------- */

document.getElementById("restartBtn").addEventListener("click", () => {
    Object.keys(answers).forEach(key => delete answers[key]);
    currentQuestion = 0;
    lastRisk = null;
    lastTier = null;
    fallingCoconut.classList.remove("fall", "wobble");
    meterFill.style.width = "0%";
    document.body.classList.remove("emergency-mode");
    sideRail.innerHTML = "";
    closePanel();
    showScreen("intro");
});
