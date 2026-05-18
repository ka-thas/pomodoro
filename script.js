const CIRCUMFERENCE = 2 * Math.PI * 95; // 596.9

const MODES = {
    work:  { label: "Work",        duration: 25 * 60 },
    short: { label: "Short Break", duration: 5  * 60 },
    long:  { label: "Long Break",  duration: 15 * 60 },
};

const SESSIONS_PER_CYCLE = 4;

let currentMode = "work";
let timeLeft = MODES.work.duration;
let totalTime = MODES.work.duration;
let running = false;
let interval = null;
let sessionsCompleted = 0;
let autoplay = false;

const timeEl           = document.getElementById("time");
const ringFg           = document.getElementById("ring-fg");
const startPause       = document.getElementById("start-pause");
const resetBtn         = document.getElementById("reset");
const skipBtn          = document.getElementById("skip");
const sessionDots      = document.getElementById("session-dots");
const sessionLabel     = document.getElementById("session-label");
const modeBtns         = document.querySelectorAll(".mode-btn");
const autoplayToggle   = document.getElementById("autoplay-toggle");

function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
}

function playChime() {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [[880, 0], [660, 0.15], [880, 0.3]].forEach(([freq, when]) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = "sine";
        gain.gain.setValueAtTime(0.25, ctx.currentTime + when);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + when + 0.4);
        osc.start(ctx.currentTime + when);
        osc.stop(ctx.currentTime + when + 0.4);
    });
}

function updateTheme() {
    document.body.classList.toggle("work-active", currentMode === "work" && running);
}

function updateRing() {
    const progress = timeLeft / totalTime;
    ringFg.style.strokeDashoffset = CIRCUMFERENCE * (1 - progress);
}

function updateDisplay() {
    timeEl.textContent = formatTime(timeLeft);
    updateRing();
    document.title = `${formatTime(timeLeft)} — ${MODES[currentMode].label}`;
}

function buildSessionDots() {
    sessionDots.innerHTML = "";
    for (let i = 0; i < SESSIONS_PER_CYCLE; i++) {
        const dot = document.createElement("div");
        dot.className = "session-dot";
        const sessionNum = sessionsCompleted % SESSIONS_PER_CYCLE;
        if (i < sessionNum) {
            dot.classList.add("done");
        } else if (i === sessionNum && currentMode === "work") {
            dot.classList.add("current");
        }
        sessionDots.appendChild(dot);
    }
    const sessionNum = (sessionsCompleted % SESSIONS_PER_CYCLE) + 1;
    sessionLabel.textContent = `Session ${sessionNum} of ${SESSIONS_PER_CYCLE}`;
}

function setMode(mode) {
    stop();
    currentMode = mode;
    timeLeft = MODES[mode].duration;
    totalTime = MODES[mode].duration;

    modeBtns.forEach(btn => {
        btn.classList.toggle("active", btn.dataset.mode === mode);
    });

    updateDisplay();
    buildSessionDots();
    updateTheme();
}

function start() {
    running = true;
    startPause.classList.add("running");
    startPause.innerHTML = '<i data-lucide="pause"></i>';
    lucide.createIcons();
    updateTheme();

    interval = setInterval(() => {
        timeLeft--;
        updateDisplay();
        if (timeLeft <= 0) {
            onTimerEnd();
        }
    }, 1000);
}

function pause() {
    running = false;
    startPause.classList.remove("running");
    startPause.innerHTML = '<i data-lucide="play"></i>';
    lucide.createIcons();
    clearInterval(interval);
    updateTheme();
}

function stop() {
    pause();
    timeLeft = MODES[currentMode].duration;
    totalTime = MODES[currentMode].duration;
    updateDisplay();
}

function onTimerEnd() {
    pause();
    playChime();

    if (currentMode === "work") {
        sessionsCompleted++;
        const isLongBreak = sessionsCompleted % SESSIONS_PER_CYCLE === 0;
        setMode(isLongBreak ? "long" : "short");
    } else {
        setMode("work");
    }
    buildSessionDots();

    if (autoplay) {
        setTimeout(start, 800);
    }
}

startPause.addEventListener("click", () => {
    running ? pause() : start();
});

resetBtn.addEventListener("click", () => {
    stop();
    buildSessionDots();
});

skipBtn.addEventListener("click", () => {
    onTimerEnd();
});

modeBtns.forEach(btn => {
    btn.addEventListener("click", () => setMode(btn.dataset.mode));
});

autoplayToggle.addEventListener("click", () => {
    autoplay = !autoplay;
    autoplayToggle.classList.toggle("active", autoplay);
});

// Init
ringFg.style.strokeDasharray = CIRCUMFERENCE;
ringFg.style.strokeDashoffset = 0;
updateDisplay();
buildSessionDots();
