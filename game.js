/* ===== AUDIO ===== */
const startSound   = new Audio("start.mp3");
const failSound    = new Audio("fail.mp3");
const successSound = new Audio("success.mp3");

/* ===== CANVAS ===== */
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const statsDiv = document.getElementById("stats");

let holding=false, started=false, onLine=false, gameOver=false;
let cursor={x:0,y:0}, lastCursor={x:0,y:0};
let distance=0;

const START={x:40,y:210,w:35,h:35};
const END  ={x:830,y:205,w:40,h:40};
const CURSOR_RADIUS=2;

/* ===== DRAWING ===== */
function drawPath(){
  ctx.beginPath();
  ctx.moveTo(70,230);
  ctx.bezierCurveTo(150,40, 280,420, 380,120);
  ctx.bezierCurveTo(480,-80, 580,520, 680,220);
  ctx.bezierCurveTo(750,80, 810,360, 860,230);
  ctx.lineWidth=7;
  ctx.strokeStyle="lime";
  ctx.stroke();
}

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  if(gameOver){
    ctx.fillStyle="red";
    ctx.font="48px Arial";
    ctx.fillText("!!!!! LOOOOOSER !!!!!",200,240);
    return;
  }

  drawPath();

  ctx.fillStyle="blue";
  ctx.fillRect(START.x,START.y,START.w,START.h);
  ctx.fillStyle="white";
  ctx.fillText("START",START.x-2,START.y+50);

  ctx.fillStyle="red";
  ctx.fillRect(END.x,END.y,END.w,END.h);
  ctx.fillText("END",END.x+10,END.y-10);

  ctx.beginPath();
  ctx.arc(cursor.x,cursor.y,CURSOR_RADIUS,0,Math.PI*2);
  ctx.fillStyle="#007bff";
  ctx.fill();

  statsDiv.textContent=`Distance: ${Math.round(distance)} px`;
}

/* ===== HELPERS ===== */
function getPos(e){
  const r=canvas.getBoundingClientRect();
  return {x:e.clientX-r.left,y:e.clientY-r.top};
}
function getTouchPos(t){
  const r=canvas.getBoundingClientRect();
  return {x:t.clientX-r.left,y:t.clientY-r.top};
}
function inBox(p,b){
  return p.x>b.x&&p.x<b.x+b.w&&p.y>b.y&&p.y<b.y+b.h;
}

/* ===== GAME LOGIC ===== */
function lose(){
  gameOver=true;
  failSound.play();
  draw();
}
function resetGame(){
  holding=false; started=false; onLine=false; gameOver=false;
  distance=0; draw();
}

/* ===== EVENTS ===== */
canvas.addEventListener("mousedown",e=>{
  cursor=getPos(e);
  lastCursor={...cursor};
  if(inBox(cursor,START)){
    holding=true; started=true; onLine=false; distance=0;
    startSound.play();
  }
});
canvas.addEventListener("mousemove",e=>{
  cursor=getPos(e);
  handleMove();
});
canvas.addEventListener("mouseup",()=>{
  if(started&&!gameOver) lose();
});

canvas.addEventListener("touchstart",e=>{
  e.preventDefault();
  const t=e.touches[0];
  cursor=getTouchPos(t);
  lastCursor={...cursor};
  if(inBox(cursor,START)){
    holding=true; started=true; onLine=false; distance=0;
    startSound.play();
  }
});
canvas.addEventListener("touchmove",e=>{
  e.preventDefault();
  const t=e.touches[0];
  cursor=getTouchPos(t);
  handleMove();
});
canvas.addEventListener("touchend",e=>{
  e.preventDefault();
  if(started&&!gameOver) lose();
});

function handleMove(){
  if(!holding||gameOver||!started){ draw(); return; }

  drawPath();
  const inside=ctx.isPointInStroke(cursor.x,cursor.y);

  if(!onLine && inside){
    onLine=true;
    lastCursor={...cursor};
  }
  if(onLine && !inside){
    lose(); return;
  }
  if(onLine){
    const dx=cursor.x-lastCursor.x;
    const dy=cursor.y-lastCursor.y;
    distance+=Math.sqrt(dx*dx+dy*dy);
    lastCursor={...cursor};
  }
  if(inBox(cursor,END)){
    successSound.play();
    setTimeout(()=>{ alert("SUCCESS"); resetGame(); },300);
  }
  draw();
}

draw();
