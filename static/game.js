const socket = io();

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const joystick = document.getElementById("joystick");
const stick = document.getElementById("stick");
const overlay = document.getElementById("overlay");

let cursor = { x: 60, y: 225 };
let joyActive = false;

/* ===== SERVER STATE ===== */
socket.on("state", s => {
  cursor.x = s.x;
  cursor.y = s.y;
  overlay.style.display = s.gameOver ? "flex" : "none";
});

/* ===== DRAW LOOP ===== */
function draw(){
  ctx.clearRect(0,0,900,450);

  // green wire
  ctx.strokeStyle = "lime";
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.moveTo(80,225);
  ctx.lineTo(860,225);
  ctx.stroke();

  // red cursor
  ctx.beginPath();
  ctx.arc(cursor.x, cursor.y, 4, 0, Math.PI*2);
  ctx.fillStyle = "red";
  ctx.fill();

  requestAnimationFrame(draw);
}
draw();

/* ===== JOYSTICK ===== */
joystick.onpointerdown = e => {
  joyActive = true;
  socket.emit("start");
  joystick.setPointerCapture(e.pointerId);
};

joystick.onpointermove = e => {
  if(!joyActive) return;

  const r = joystick.getBoundingClientRect();
  let x = e.clientX - r.left - 70;
  let y = e.clientY - r.top  - 70;

  const d = Math.hypot(x,y);
  if(d > 70){ x *= 70/d; y *= 70/d; }

  stick.style.left = (x + 70 - 25) + "px";
  stick.style.top  = (y + 70 - 25) + "px";

  socket.emit("move", { dx: x/70, dy: y/70 });
};

joystick.onpointerup = () => {
  joyActive = false;
  stick.style.left = "45px";
  stick.style.top  = "45px";
  socket.emit("release");
};

function restart(){
  socket.emit("restart");
}

