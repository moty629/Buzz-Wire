/* ========= LEVEL ========= */
const params = new URLSearchParams(window.location.search);
const level = Number(params.get("level")) || 1;

document.getElementById("title").textContent = `Level ${level}`;

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const overlay = document.getElementById("overlay");
const joystick = document.getElementById("joystick");
const stick = document.getElementById("stick");

/* ========= CONSTANTS ========= */
const START = { x: 40, y: 205, w: 40, h: 40 };
const END   = { x: 820, y: 205, w: 40, h: 40 };

const JOY_RADIUS = 70;
const STICK_RADIUS = 25;
const SPEED = 2 + level * 0.4;

/* ========= STATE ========= */
let cursor = {
  x: START.x + START.w / 2,
  y: START.y + START.h / 2
};

let joyDX = 0;
let joyDY = 0;
let joyActive = false;

let hasStarted = false;   // 🔑 NEW FLAG
let gameOver = false;

/* ========= DRAW WIRE ========= */
function drawPath(){
  ctx.beginPath();
  ctx.strokeStyle = "lime";
  ctx.lineWidth = Math.max(4, 16 - level);
  ctx.moveTo(80, 225);

  if(level <= 3){
    ctx.lineTo(860, 225);
  } else if(level <= 6){
    ctx.bezierCurveTo(200, 80, 600, 380, 860, 225);
  } else {
    ctx.bezierCurveTo(150, 50, 300, 400, 450, 100);
    ctx.bezierCurveTo(600, -50, 750, 450, 860, 225);
  }

  ctx.stroke();
}

/* ========= DRAW ========= */
function draw(){
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawPath();

  // START
  ctx.fillStyle = "blue";
  ctx.fillRect(START.x, START.y, START.w, START.h);
  ctx.fillStyle = "white";
  ctx.fillText("START", START.x - 2, START.y - 6);

  // END
  ctx.fillStyle = "red";
  ctx.fillRect(END.x, END.y, END.w, END.h);
  ctx.fillStyle = "white";
  ctx.fillText("END", END.x + 2, END.y - 6);

  // 🔴 CURSOR
  ctx.beginPath();
  ctx.arc(cursor.x, cursor.y, 3, 0, Math.PI * 2);
  ctx.fillStyle = "red";
  ctx.fill();
}

/* ========= GAME LOOP ========= */
function update(){
  if(gameOver){
    draw();
    return;
  }

  // ❗ DO NOTHING UNTIL JOYSTICK TOUCHED
  if(!hasStarted){
    draw();
    requestAnimationFrame(update);
    return;
  }

  if(joyActive){
    cursor.x += joyDX * SPEED;
    cursor.y += joyDY * SPEED;

    cursor.x = Math.max(0, Math.min(canvas.width, cursor.x));
    cursor.y = Math.max(0, Math.min(canvas.height, cursor.y));

    // ❌ STRICT RULE: OUT OF WIRE = LOOSER
    if(!ctx.isPointInStroke(cursor.x, cursor.y)){
      lose();
      return;
    }

    // WIN
    if(
      cursor.x > END.x && cursor.x < END.x + END.w &&
      cursor.y > END.y && cursor.y < END.y + END.h
    ){
      win();
      return;
    }
  }

  draw();
  requestAnimationFrame(update);
}

/* ========= END STATES ========= */
function lose(){
  if(gameOver) return;
  gameOver = true;
  overlay.style.display = "flex";
}

function win(){
  let unlocked = Number(localStorage.getItem("unlockedLevel")) || 1;
  if(level >= unlocked){
    localStorage.setItem("unlockedLevel", level + 1);
  }
  window.location.href = "index.html";
}

function restart(){
  window.location.reload();
}

/* ========= JOYSTICK ========= */
joystick.addEventListener("pointerdown", e => {
  if(gameOver) return;

  hasStarted = true;   // 🔥 GAME STARTS HERE
  joyActive = true;
  joystick.setPointerCapture(e.pointerId);
});

joystick.addEventListener("pointermove", e => {
  if(!joyActive || gameOver) return;

  const r = joystick.getBoundingClientRect();
  let x = e.clientX - r.left - JOY_RADIUS;
  let y = e.clientY - r.top  - JOY_RADIUS;

  const d = Math.hypot(x, y);
  if(d > JOY_RADIUS){
    x *= JOY_RADIUS / d;
    y *= JOY_RADIUS / d;
  }

  stick.style.left = (x + JOY_RADIUS - STICK_RADIUS) + "px";
  stick.style.top  = (y + JOY_RADIUS - STICK_RADIUS) + "px";

  joyDX = x / JOY_RADIUS;
  joyDY = y / JOY_RADIUS;
});

joystick.addEventListener("pointerup", () => {
  if(gameOver) return;
  joyActive = false;
  joyDX = joyDY = 0;

  stick.style.left = "45px";
  stick.style.top  = "45px";

  // ✋ Hand off after start = LOOSER
  if(hasStarted){
    lose();
  }
});

joystick.addEventListener("pointercancel", () => {
  if(gameOver) return;
  joyActive = false;
  joyDX = joyDY = 0;
  stick.style.left = "45px";
  stick.style.top  = "45px";
  if(hasStarted){
    lose();
  }
});

/* ========= START ========= */
draw();
update();
