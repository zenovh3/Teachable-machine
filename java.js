const URL = "https://teachablemachine.withgoogle.com/models/IH207Yh4c/";

const statusBar = document.querySelector("#status-bar");
const scoreCorrect = document.querySelector("#score-correct");
const scoreWrong = document.querySelector("#score-wrong");
const scoreTotal = document.querySelector("#score-total");
const arena = document.querySelector("#arena");
const clapFlash = document.querySelector("#clap-flash");
const clapIndicator = document.querySelector("#clap-indicator");
const clapDots = document.querySelector("#clap-dots");
const btnStart = document.querySelector("#btn-start");
const btnDemo1 = document.querySelector("#btn-demo1");
const btnDemo2 = document.querySelector("#btn-demo2");
const resultOverlay = document.querySelector("#result-overlay");
const resultTitle = document.querySelector("#result-title");
const resultSub = document.querySelector("#result-sub");
const btnRestart = document.querySelector("#btn-restart");

const FRUITS = ['🍎','🍊','🍋','🍇','🍓','🍒','🍑','🥭','🍍','🍌','🍉','🍈','🫐','🍏'];
const VEGGIES = ['🥦','🥕','🧅','🥔','🌽','🥒','🍅','🧄','🫑','🥬','🫛'];
const ANSWERS = {};
FRUITS.forEach(f => ANSWERS[f] = 'fruit');
VEGGIES.forEach(v => ANSWERS[v] = 'veggie');

let gameActive = false;
let recognizer;
let currentItem = null;
let itemEl = null;
let fallY = 10;
let correct = 0;
let wrong = 0;
let total = 0;
let animFrame;
let clapArmed = true;

async function createModel() {
  const recognizer = speechCommands.create(
    "BROWSER_FFT",
    undefined,
    URL + "model.json",
    URL + "metadata.json"
  );
  await recognizer.ensureModelLoaded();
  return recognizer;
}

function setStatus(msg) {
  statusBar.innerHTML = msg;
}

function spawnItem() {
  if (!gameActive) return;
  if (itemEl) itemEl.remove();

  const all = [...FRUITS, ...VEGGIES];
  const emoji = all[Math.floor(Math.random() * all.length)];
  currentItem = emoji;
  fallY = 10;

  itemEl = document.createElement('div');
  itemEl.className = 'falling-item';
  itemEl.textContent = emoji;
  itemEl.style.left = '50%';
  itemEl.style.top = '10px';
  itemEl.style.transform = 'translateX(-50%)';
  arena.appendChild(itemEl);

  setStatus('Sort: ' + (ANSWERS[emoji] === 'fruit' ? '🍎 Fruit = 1 clap' : '🥦 Veggie = 2 claps'));
}

