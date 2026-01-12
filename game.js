/* ================= AUDIO ================= */
const startSound   = new Audio("start.mp3");
const failSound    = new Audio("fail.mp3");
const successSound = new Audio("success.mp3");

/* ================= DOM ================= */
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const statsDiv = document.getElementById("stats");
const levelsDiv = document.getElementById("levels");

/* ================= STATE ================= */
let level = 0;
let unlockedLevel = 0;

let holding = false;
let started = false;
let onLine = false;
let gameOver = false;

let cursor = { x: 0, y: 0 };
let lastCursor = { x: 0, y: 0 };
let distance = 0;

const START = { x: 40,  y: 210, w: 35, h: 35 };
const END   = { x: 830, y: 205, w: 40, h: 40 };
const CURSOR_RADIUS = 2;

/* ================= CANVAS RESET (CRITICAL) ================= */
function resetCanvasState() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.lineWidth = 1;
  ctx.font = "14px Arial";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

/* ================= DIFFICULTY ================= */
function getDifficulty(lv) {
  if (lv <= 2) return "EASY";
  if (lv <= 5) return "MEDIUM";
  if (lv <= 8) return "HARD";
  return "MASTER";
}

/* ================= LEVELS ================= */
const levels = [
  { w: 9,  p(){ ctx.moveTo(70,230); ctx.bezierCurveTo(300,230,500,230,860,230); } },
  { w: 8,  p(){ ctx.moveTo(70,230); ctx.bezierCurveTo(200,180,400,280,860,230); } },
  { w: 7,  p(){ ctx.moveTo(70,230); ctx.bezierCurveTo(180,120,380,340,860,230); } },
  { w: 6.5,p(){ ctx.moveTo(70,230); ctx.bezierCurveTo(160,60,360,400,860,230); } },
  { w: 6,  p(){ ctx.moveTo(70,200); ctx.bezierCurveTo(200,420,420,40,860,230); } },
  { w: 5.5,p(){
      ctx.moveTo(70,230);
      ctx.bezierCurveTo(150,80,300,380,500,120);
      ctx.bezierCurveTo(650,-20,750,360,860,230);
    }
  },
  { w: 5,  p(){
      ctx.moveTo(70,230);
      ctx.bezierCurveTo(150,20,280,420,420,180);
      ctx.bezierCurveTo(560,-40,700,420,860,230);
    }
  },
  { w: 4.5,p(){
      ctx.moveTo(70,200);
      ctx.bezierCurveTo(140,400,260,40,400,300);
      ctx.bezierCurveTo(540,520,700,-80,860,230);
    }
  },
  { w: 4,  p(){
      ctx.moveTo(70,230);
      ctx.bezierCurveTo(120,20,240,420,360,120);
      ctx.bezierCurveTo(480,-80,600,520,720,180);
      ctx.bezierCurveTo(780,60,820,300,860,230);
    }
  },
  { w: 3.5,p(){
      ctx.moveTo(70,230);
      ctx.bezierCurveTo(120,0,220,460,340,140);
      ctx.bezierCurveTo(460,-120,580,560,700,160);
      ctx.bezierCurveTo(760,40,820,340,860,230);
    }
  }
];

/* ================= DRAW ================= */
function drawPath() {
  ctx.beginPath();
  ctx.strokeStyle = "lime";
  ctx.lineWidth = levels[level].w;
  levels[level].p();
  ctx.stroke();
}

function drawLevels() {
  let txt = "";
  for (let i = 0; i < levels.length; i++) {
    txt += (i <= unlockedLevel ? "🟢" : "🔒") + " " + (i + 1) + "  ";
  }
  levelsDiv.textContent = txt;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  resetCanvasState(); // 🔥 FIXES TEXT GROWING BUG

  drawLevels();
  drawPath();

  // START
  ctx.fillStyle = "blue";
  ctx.fillRect(START.x, START.y, START.w, START.h);
  ctx.fillStyle = "white";
  ctx.font = "14px Arial";
  ctx.fillText("START", START.x - 2, START.y + START.h + 14);

  // END
  ctx.fillStyle = "red";
  ctx.fillRect(END.x, END.y, END.w, END.h);
  ctx.font = "14px Arial";
  ctx.fillText("END", END.x + 8, END.y - 8);

  // Cursor
  ctx.beginPath();
  ctx.arc(cursor.x, cursor.y, CURSOR_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = "#007bff";
  ctx.fill();

  // Game Over text (isolated)
  if (gameOver) {
    ctx.save();
    ctx.font = "48px Arial";
    ctx.fillStyle = "red";
    ctx.fillText("!!!!! LOOOOOSER !!!!!", 200, 240);
    ctx.restore();
  }

  statsDiv.textContent =
    `Level ${level + 1}/10 | ${getDifficulty(level)} | Distance ${Math.round(distance)} px`;
}

/* ================= HELPERS ================= */
function getPos(e) {
  const r = canvas.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}
function getTouchPos(t) {
  const r = canvas.getBoundingClientRect();
  return { x: t.clientX - r.left, y: t.clientY - r.top };
}
function inBox(p, b) {
  return p.x > b.x && p.x < b.x + b.w && p.y > b.y && p.y < b.y + b.h;
}

/* ================= GAME ================= */
function lose() {
  if (gameOver) return;
  gameOver = true;
  failSound.currentTime = 0;
  failSound.play();
  draw();
}

function resetGame() {
  holding = false;
  started = false;
  onLine = false;
  gameOver = false;
  distance = 0;
  draw();
}

function startCheck() {
  if (level > unlockedLevel) return;
  holding = true;
  started = true;
  onLine = false;
  distance = 0;
  startSound.currentTime = 0;
  startSound.play();
}

function handleMove() {
  if (!holding || !started || gameOver) {
    draw();
    return;
  }

  drawPath();
  const inside = ctx.isPointInStroke(cursor.x, cursor.y);

  if (!onLine && inside) {
    onLine = true;
    lastCursor = { ...cursor };
  }
  if (onLine && !inside) {
    lose();
    return;
  }

  const dx = cursor.x - lastCursor.x;
  const dy = cursor.y - lastCursor.y;
  distance += Math.sqrt(dx * dx + dy * dy);
  lastCursor = { ...cursor };

  if (inBox(cursor, END)) {
  successSound.play();

  setTimeout(() => {

    // If NOT last level → go to next level
    if (level < levels.length - 1) {
      level = level + 1;

      // unlock ONLY the next level
      if (level > unlockedLevel) {
        unlockedLevel = level;
      }

    } 
    // If MASTER level completed
    else {
      alert("🏆 MASTER LEVEL CLEARED!");
      level = 0;
      unlockedLevel = 0;
    }

    resetGame();
  }, 300);
}

/* ================= INPUT ================= */
// Mouse
canvas.addEventListener("mousedown", e => {
  cursor = getPos(e);
  lastCursor = { ...cursor };
  if (inBox(cursor, START)) startCheck();
});
canvas.addEventListener("mousemove", e => {
  cursor = getPos(e);
  handleMove();
});
canvas.addEventListener("mouseup", () => {
  if (started && !gameOver) lose();
});

// Touch
canvas.addEventListener("touchstart", e => {
  e.preventDefault();
  cursor = getTouchPos(e.touches[0]);
  lastCursor = { ...cursor };
  if (inBox(cursor, START)) startCheck();
});
canvas.addEventListener("touchmove", e => {
  e.preventDefault();
  cursor = getTouchPos(e.touches[0]);
  handleMove();
});
canvas.addEventListener("touchend", e => {
  e.preventDefault();
  if (started && !gameOver) lose();
});

/* ================= INIT ================= */
draw();
