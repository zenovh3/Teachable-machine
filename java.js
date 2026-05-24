const URL = "https://teachablemachine.withgoogle.com/models/vBXKeht0V/";

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

function fallTick() {
  if (!gameActive) return;
  if (itemEl) {
    fallY += 0.5;
    itemEl.style.top = fallY + 'px';
    if (fallY > 245) missItem();
  }
  animFrame = requestAnimationFrame(fallTick);
}

function missItem() {
  if (!gameActive) return;
  wrong++;
  scoreWrong.textContent = wrong;
  total++;
  scoreTotal.textContent = total;
  setStatus('Too slow! 😅');
  nextItem();
}

function nextItem() {
  if (itemEl) { itemEl.remove(); itemEl = null; }
  currentItem = null;
  fallY = 10;
  if (total >= 10) { endGame(); return; }
  setTimeout(spawnItem, 800);
}

function sortItem(direction) {
  if (!currentItem || !gameActive) return;

  const correctDir = ANSWERS[currentItem] === 'fruit' ? 'left' : 'right';
  const isCorrect = direction === correctDir;

  if (itemEl) {
    itemEl.style.left = direction === 'left' ? '18%' : '82%';
    itemEl.style.opacity = '0';
  }

  if (isCorrect) {
    correct++;
    scoreCorrect.textContent = correct;
    setStatus('Correct! 🎉');
  } else {
    wrong++;
    scoreWrong.textContent = wrong;
    setStatus('Wrong! ' + (ANSWERS[currentItem] === 'fruit' ? 'That was a fruit 🍎' : 'That was a veggie 🥦'));
  }

  total++;
  scoreTotal.textContent = total;
  nextItem();
}

function flashArena() {
  clapFlash.style.opacity = '1';
  setTimeout(() => clapFlash.style.opacity = '0', 150);
}

function registerClap(count) {
  if (!gameActive) {
    startGame();
    return;
  }

  flashArena();
  clapIndicator.textContent = count === 1 ? '👏 1 clap!' : '👏👏 2 claps!';
  updateClapDots(count);

  if (count === 1) sortItem('left');
  else if (count === 2) sortItem('right');

  setTimeout(() => {
    clapIndicator.textContent = '—';
    clapDots.innerHTML = '';
  }, 600);
}

function updateClapDots(count) {
  clapDots.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const dot = document.createElement('span');
    dot.className = 'clap-dot';
    clapDots.appendChild(dot);
  }
}

async function startMic() {
  try {
    setStatus('Loading model...');
    recognizer = await createModel();
    const classLabels = recognizer.wordLabels();
    console.log('Class labels:', classLabels);
    setStatus('👏 Clap to start the game!');

    recognizer.listen(result => {
      const scores = result.scores;

      let maxScore = 0;
      let bestLabel = '';
      classLabels.forEach((label, i) => {
        if (scores[i] > maxScore) {
          maxScore = scores[i];
          bestLabel = label;
        }
      });

      console.log('Best label:', bestLabel, 'Score:', maxScore.toFixed(2));

      if (maxScore > 0.75 && clapArmed) {
        if (bestLabel === 'clap_once') {
          registerClap(1);
          clapArmed = false;
          setTimeout(() => clapArmed = true, 1000);
        } else if (bestLabel === 'clap_twice') {
          registerClap(2);
          clapArmed = false;
          setTimeout(() => clapArmed = true, 1000);
        }
      }
    }, {
      includeSpectrogram: true,
      probabilityThreshold: 0.70,
      invokeCallbackOnNoiseAndUnknown: true,
      overlapFactor: 0.50
    });

  } catch (e) {
    console.error(e);
    setStatus('⚠️ Could not load model — check your URL');
  }
}

function startGame() {
  correct = 0; wrong = 0; total = 0; fallY = 10;
  scoreCorrect.textContent = 0;
  scoreWrong.textContent = 0;
  scoreTotal.textContent = 0;
  resultOverlay.classList.remove('show');
  btnStart.disabled = true;
  gameActive = true;
  cancelAnimationFrame(animFrame);
  spawnItem();
  animFrame = requestAnimationFrame(fallTick);
}

function endGame() {
  gameActive = false;
  cancelAnimationFrame(animFrame);
  if (itemEl) { itemEl.remove(); itemEl = null; }

  const pct = Math.round(correct / 10 * 100);
  resultTitle.textContent = pct >= 80 ? 'Amazing! 🎉' : pct >= 50 ? 'Not bad! 😊' : 'Keep practicing! 💪';
  resultSub.textContent = correct + ' / 10 correct (' + pct + '%)';
  resultOverlay.classList.add('show');
  btnStart.disabled = false;
  setStatus('👏 Clap to play again!');
}

// event listeners
btnStart.addEventListener('click', startGame);
btnDemo1.addEventListener('click', () => registerClap(1));
btnDemo2.addEventListener('click', () => registerClap(2));
btnRestart.addEventListener('click', () => {
  resultOverlay.classList.remove('show');
  startGame();
});

// load model when page opens
window.addEventListener('load', async () => {
  await startMic();
});

