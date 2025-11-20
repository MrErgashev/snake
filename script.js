const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");

const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const scoreEl = document.getElementById("score");
const highScoreEl = document.getElementById("highScore");
const speedLabel = document.getElementById("speedLabel");
const themeToggle = document.getElementById("themeToggle");

const CELL_SIZE = 20;
const GRID_COUNT = canvas.width / CELL_SIZE;
const COLORS = {
  bg: "#edf1fb",
  grid: "rgba(31, 42, 68, 0.06)",
  snake: "#6f7bfd",
  snakeHead: "#3dd9a3",
  snakeGlow: "rgba(111, 123, 253, 0.35)",
  food: "#f5b544",
  foodGlow: "rgba(245, 181, 68, 0.5)",
  muted: "#667298",
};

const difficulties = [
  { label: "1x", delay: 180 },
  { label: "1.25x", delay: 140 },
  { label: "1.5x", delay: 110 },
  { label: "2x", delay: 80 },
];

const state = {
  snake: [],
  direction: { x: 1, y: 0 },
  nextDirection: { x: 1, y: 0 },
  food: null,
  score: 0,
  highScore: Number(localStorage.getItem("neonSnakeHighScore")) || 0,
  speedIndex: 0,
  running: false,
  paused: false,
  lastUpdate: 0,
};

function initGame() {
  state.snake = [
    { x: 5, y: 10 },
    { x: 4, y: 10 },
    { x: 3, y: 10 },
  ];
  state.direction = { x: 1, y: 0 };
  state.nextDirection = { x: 1, y: 0 };
  state.food = randomCell();
  state.score = 0;
  state.running = true;
  state.paused = false;
  state.lastUpdate = 0;
  speedLabel.textContent = difficulties[state.speedIndex].label;
  updateScoreboard();
  window.requestAnimationFrame(gameLoop);
}

function randomCell() {
  let cell;
  do {
    cell = {
      x: Math.floor(Math.random() * GRID_COUNT),
      y: Math.floor(Math.random() * GRID_COUNT),
    };
  } while (state.snake.some((segment) => segment.x === cell.x && segment.y === cell.y));
  return cell;
}

function updateScoreboard() {
  scoreEl.textContent = state.score;
  highScoreEl.textContent = state.highScore;
}

function drawGrid() {
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 1;
  for (let i = 0; i <= GRID_COUNT; i++) {
    const pos = i * CELL_SIZE;
    ctx.beginPath();
    ctx.moveTo(pos, 0);
    ctx.lineTo(pos, canvas.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, pos);
    ctx.lineTo(canvas.width, pos);
    ctx.stroke();
  }
}

function drawFood() {
  const { x, y } = state.food;
  const centerX = x * CELL_SIZE + CELL_SIZE / 2;
  const centerY = y * CELL_SIZE + CELL_SIZE / 2;

  ctx.shadowBlur = 15;
  ctx.shadowColor = COLORS.foodGlow;
  const gradient = ctx.createRadialGradient(centerX, centerY, 4, centerX, centerY, CELL_SIZE / 1.5);
  gradient.addColorStop(0, COLORS.food);
  gradient.addColorStop(1, "rgba(255,235,59,0.1)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, CELL_SIZE / 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawSnake() {
  state.snake.forEach((segment, index) => {
    const px = segment.x * CELL_SIZE;
    const py = segment.y * CELL_SIZE;
    ctx.fillStyle = index === 0 ? COLORS.snakeHead : COLORS.snake;
    ctx.shadowBlur = index === 0 ? 25 : 15;
    ctx.shadowColor = COLORS.snakeGlow;
    ctx.beginPath();
    ctx.roundRect(px + 2, py + 2, CELL_SIZE - 4, CELL_SIZE - 4, 6);
    ctx.fill();
  });
  ctx.shadowBlur = 0;
}

function moveSnake() {
  state.direction = state.nextDirection;
  const head = {
    x: state.snake[0].x + state.direction.x,
    y: state.snake[0].y + state.direction.y,
  };

  if (isCollision(head)) {
    endGame();
    return;
  }

  state.snake.unshift(head);

  const ateFood = head.x === state.food.x && head.y === state.food.y;
  if (ateFood) {
    state.score += 10;
    if (state.score > state.highScore) {
      state.highScore = state.score;
      localStorage.setItem("neonSnakeHighScore", state.highScore);
    }
    state.food = randomCell();
    updateScoreboard();
  } else {
    state.snake.pop();
  }
}

function isCollision(head) {
  const hitWall = head.x < 0 || head.x >= GRID_COUNT || head.y < 0 || head.y >= GRID_COUNT;
  const hitSelf = state.snake.some((segment) => segment.x === head.x && segment.y === head.y);
  return hitWall || hitSelf;
}

function gameLoop(timestamp) {
  if (!state.running) return;
  window.requestAnimationFrame(gameLoop);
  if (state.paused) return;

  const delay = difficulties[state.speedIndex].delay;
  if (timestamp - state.lastUpdate < delay) return;
  state.lastUpdate = timestamp;

  drawGrid();
  moveSnake();
  drawFood();
  drawSnake();
}

function endGame() {
  state.running = false;
  ctx.fillStyle = "rgba(233,237,245,0.94)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#1f2a44";
  ctx.textAlign = "center";
  ctx.font = "bold 32px 'Space Grotesk', sans-serif";
  ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2 - 10);
  ctx.font = "18px 'Space Grotesk', sans-serif";
  ctx.fillStyle = COLORS.muted || "#667298";
  ctx.fillText("Space tugmasi bilan qayta boshlang", canvas.width / 2, canvas.height / 2 + 20);
}

function togglePause() {
  if (!state.running) return;
  state.paused = !state.paused;
  pauseBtn.textContent = state.paused ? "Resume" : "Pause";
}

function adjustSpeed(direction) {
  const nextIndex = state.speedIndex + direction;
  if (nextIndex < 0 || nextIndex >= difficulties.length) return;
  state.speedIndex = nextIndex;
  speedLabel.textContent = difficulties[state.speedIndex].label;
}

function handleKey(e) {
  const key = e.key.toLowerCase();
  const { x, y } = state.direction;
  if (["arrowup", "w"].includes(key) && y !== 1) state.nextDirection = { x: 0, y: -1 };
  if (["arrowdown", "s"].includes(key) && y !== -1) state.nextDirection = { x: 0, y: 1 };
  if (["arrowleft", "a"].includes(key) && x !== 1) state.nextDirection = { x: -1, y: 0 };
  if (["arrowright", "d"].includes(key) && x !== -1) state.nextDirection = { x: 1, y: 0 };

  if (key === " ") {
    e.preventDefault();
    initGame();
  }
  if (key === "p") togglePause();
  if (key === "+" || key === "=") adjustSpeed(1);
  if (key === "-") adjustSpeed(-1);
}

startBtn.addEventListener("click", initGame);
pauseBtn.addEventListener("click", togglePause);
document.addEventListener("keydown", handleKey);

const THEME_KEY = "snakeTheme";

if (themeToggle) {
  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme === "dark") {
    document.body.classList.add("theme-dark");
  }

  themeToggle.addEventListener("click", () => {
    const isDark = document.body.classList.toggle("theme-dark");
    localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
  });
}

function setDirectionFromInput(dir) {
  const { x, y } = state.direction;
  if (dir === "up" && y !== 1) state.nextDirection = { x: 0, y: -1 };
  if (dir === "down" && y !== -1) state.nextDirection = { x: 0, y: 1 };
  if (dir === "left" && x !== 1) state.nextDirection = { x: -1, y: 0 };
  if (dir === "right" && x !== -1) state.nextDirection = { x: 1, y: 0 };
}

// Touch buttons (mobile on-screen controls)
const touchButtons = document.querySelectorAll(".touch-btn");

touchButtons.forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    const dir = btn.dataset.dir;
    if (dir === "pause") {
      togglePause();
      return;
    }
    setDirectionFromInput(dir);
  });
});

// Swipe controls on canvas (for touch screens)
let touchStartX = null;
let touchStartY = null;

function handleTouchStart(e) {
  const touch = e.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
}

function handleTouchMove(e) {
  // oldinga scroll bo‘lmasin
  e.preventDefault();
}

function handleTouchEnd(e) {
  if (touchStartX === null || touchStartY === null) return;

  const touch = e.changedTouches[0];
  const dx = touch.clientX - touchStartX;
  const dy = touch.clientY - touchStartY;

  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  const threshold = 20;
  if (absDx < threshold && absDy < threshold) {
    touchStartX = null;
    touchStartY = null;
    return;
  }

  if (absDx > absDy) {
    setDirectionFromInput(dx > 0 ? "right" : "left");
  } else {
    setDirectionFromInput(dy > 0 ? "down" : "up");
  }

  touchStartX = null;
  touchStartY = null;
}

canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
canvas.addEventListener("touchend", handleTouchEnd, { passive: false });

// Pre-draw grid for idle state
drawGrid();

