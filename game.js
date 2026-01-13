const url = new URLSearchParams(location.search);
const level = Number(url.get("level")) || 1;
document.getElementById("title").textContent = `Level ${level}`;

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const overlay = document.getElementById("overlay");
const stick = document.getElementById("stick");
const joystick = document.getElementById("joystick");

const START = {x:40,y:210,w:40,h:40};
const END   = {x:820,y:210,w:40,h:40};

let cursor = {x:START.x+20,y:START.y+20};
let joyDX=0, joyDY=0, joyActive=false;
let enteredWire=false, gameOver=false;

const SPEED = 2 + level*0.4;

/* ===== LEVEL PATHS ===== */
function drawPath(){
  ctx.beginPath();
  ctx.strokeStyle="lime";
  ctx.lineWidth = 14 - level;
  ctx.moveTo(80,230);

  if(level<4) ctx.lineTo(860,230);
  else ctx.bezierCurveTo(200,80,600,380,860,230);

  ctx.stroke();
}

function draw(){
  ctx.clearRect(0,0,900,450);
  drawPath();

  ctx.fillStyle="blue";
  ctx.fillRect(START.x,START.y,START.w,START.h);
  ctx.fillStyle="white";
  ctx.fillText("START",START.x,START.y-5);

  ctx.fillStyle="red";
  ctx.fillRect(END.x,END.y,END.w,END.h);
  ctx.fillText("END",END.x,END.y-5);

  ctx.beginPath();
  ctx.arc(cursor.x,cursor.y,3,0,Math.PI*2);
  ctx.fillStyle="#00f";
  ctx.fill();
}

function update(){
  if(joyActive && !gameOver){
    cursor.x += joyDX*SPEED;
    cursor.y += joyDY*SPEED;

    const inside = ctx.isPointInStroke(cursor.x,cursor.y);

    if(!enteredWire && inside) enteredWire=true;
    if(enteredWire && !inside) lose();

    if(cursor.x>END.x && cursor.x<END.x+END.w &&
       cursor.y>END.y && cursor.y<END.y+END.h){
      win();
    }
  }
  draw();
  requestAnimationFrame(update);
}

function lose(){
  gameOver=true;
  overlay.style.display="flex";
}

function win(){
  let unlocked = Number(localStorage.getItem("unlockedLevel"))||1;
  if(level>=unlocked) localStorage.setItem("unlockedLevel", level+1);
  location.href="index.html";
}

function restart(){
  location.reload();
}

/* ===== JOYSTICK ===== */
joystick.onpointerdown=e=>{
  joyActive=true;
  joystick.setPointerCapture(e.pointerId);
};
joystick.onpointermove=e=>{
  if(!joyActive||gameOver) return;
  const r=joystick.getBoundingClientRect();
  let x=e.clientX-r.left-70;
  let y=e.clientY-r.top-70;
  const d=Math.hypot(x,y);
  if(d>70){x*=70/d;y*=70/d;}
  stick.style.left=(x+70-25)+"px";
  stick.style.top =(y+70-25)+"px";
  joyDX=x/70; joyDY=y/70;
};
joystick.onpointerup=()=>{
  joyActive=false;
  joyDX=joyDY=0;
  stick.style.left="45px";
  stick.style.top="45px";
  lose(); // 👈 taking hand off = LOOSER
};

draw();
update();
