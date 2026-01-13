window.addEventListener("load", () => {

  /* ========= AUDIO ========= */
  const startSound   = new Audio("start.mp3");
  const failSound    = new Audio("fail.mp3");
  const successSound = new Audio("success.mp3");

  /* ========= DOM ========= */
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const statsDiv = document.getElementById("stats");
  const levelsDiv = document.getElementById("levels");

  /* ========= CONSTANTS ========= */
  const PX_PER_METER = 100;
  const CURSOR_RADIUS = 2;

  const START = { x:40, y:210, w:35, h:35 };
  const END   = { x:830, y:205, w:40, h:40 };

  /* ========= STATE ========= */
  let level = 0;
  let unlockedLevel = 0;
  let started = false;
  let onLine = false;
  let gameOver = false;
  let levelCompleted = false;

  let cursor = {
    x: START.x + START.w / 2,
    y: START.y + START.h / 2
  };
  let lastCursor = { ...cursor };

  let distancePx = 0;

  /* ========= TIMER ========= */
  let startTime = 0;
  let elapsedTime = 0;
  let timerRunning = false;

  function getTimeMs(){
    return timerRunning
      ? elapsedTime + (performance.now() - startTime)
      : elapsedTime;
  }

  function stopTimer(){
    if(timerRunning){
      elapsedTime = getTimeMs();
      timerRunning = false;
    }
  }

  /* ========= LEVELS ========= */
  const levels = [
    { w:14, p(){ ctx.moveTo(70,230); ctx.lineTo(860,230); } },
    { w:10, p(){ ctx.moveTo(70,230); ctx.bezierCurveTo(250,230,500,230,860,230); } },
    { w:9,  p(){ ctx.moveTo(70,230); ctx.bezierCurveTo(200,180,400,280,860,230); } },
    { w:8,  p(){ ctx.moveTo(70,230); ctx.bezierCurveTo(180,120,380,340,860,230); } }
  ];

  /* ========= DRAW ========= */
  function drawPath(){
    ctx.beginPath();
    ctx.strokeStyle = "lime";
    ctx.lineWidth = levels[level].w;
    levels[level].p();
    ctx.stroke();
  }

  function drawLevels(){
    levelsDiv.textContent = levels
      .map((_,i)=> (i<=unlockedLevel?"🟢":"🔒")+" "+(i+1))
      .join("  ");
  }

  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    drawLevels();
    drawPath();

    ctx.fillStyle="blue";
    ctx.fillRect(START.x,START.y,START.w,START.h);
    ctx.fillStyle="white";
    ctx.fillText("START",START.x-2,START.y+START.h+14);

    ctx.fillStyle="red";
    ctx.fillRect(END.x,END.y,END.w,END.h);
    ctx.fillText("END",END.x+8,END.y-8);

    ctx.beginPath();
    ctx.arc(cursor.x, cursor.y, CURSOR_RADIUS, 0, Math.PI*2);
    ctx.fillStyle="#0066ff";
    ctx.fill();

    statsDiv.textContent =
      `Level ${level+1}/${levels.length} | Time ${(getTimeMs()/1000).toFixed(2)}s | Distance ${(distancePx/PX_PER_METER).toFixed(2)} m`;
  }

  /* ========= GAME FLOW ========= */
  function resetGame(){
    started = onLine = gameOver = levelCompleted = false;
    distancePx = elapsedTime = 0;
    timerRunning = false;
    cursor.x = START.x + START.w/2;
    cursor.y = START.y + START.h/2;
    lastCursor = { ...cursor };
    draw();
  }

  function startGame(){
    started = true;
    onLine = false;
    distancePx = 0;
    elapsedTime = 0;
    startTime = performance.now();
    timerRunning = true;
    startSound.play();
  }

  function lose(){
    if(gameOver || levelCompleted) return;
    stopTimer();
    gameOver = true;
    failSound.play();
    draw();
  }

  function handleMove(){
    if(!started || gameOver || levelCompleted) return;

    const inside = ctx.isPointInStroke(cursor.x, cursor.y);

    if(!onLine && inside){
      onLine = true;
      lastCursor = { ...cursor };
    }

    if(onLine && !inside){
      lose();
      return;
    }

    if(onLine){
      distancePx += Math.hypot(cursor.x-lastCursor.x, cursor.y-lastCursor.y);
      lastCursor = { ...cursor };
    }

    if(cursor.x>END.x && cursor.x<END.x+END.w &&
       cursor.y>END.y && cursor.y<END.y+END.h){
      levelCompleted = true;
      stopTimer();
      successSound.play();
      setTimeout(()=>{
        level = (level+1)%levels.length;
        unlockedLevel = Math.max(unlockedLevel, level);
        resetGame();
      },300);
    }

    draw();
  }

  /* ========= INPUT ========= */

  // Mouse (absolute)
  const pos = e => {
    const r = canvas.getBoundingClientRect();
    return { x:e.clientX-r.left, y:e.clientY-r.top };
  };

  canvas.addEventListener("mousedown",e=>{
    cursor = pos(e);
    lastCursor = { ...cursor };
    if(cursor.x>START.x && cursor.x<START.x+START.w &&
       cursor.y>START.y && cursor.y<START.y+START.h) startGame();
  });

  canvas.addEventListener("mousemove",e=>{
    cursor = pos(e);
    handleMove();
  });

  canvas.addEventListener("mouseup",()=> started && lose());

  // Touch (relative)
  let lastTouchX=null, lastTouchY=null;

  canvas.addEventListener("touchstart",e=>{
    e.preventDefault();
    const t=e.touches[0];
    lastTouchX=t.clientX; lastTouchY=t.clientY;
    if(cursor.x>START.x && cursor.x<START.x+START.w &&
       cursor.y>START.y && cursor.y<START.y+START.h) startGame();
  });

  canvas.addEventListener("touchmove",e=>{
    e.preventDefault();
    if(lastTouchX===null) return;
    const t=e.touches[0];
    cursor.x += t.clientX-lastTouchX;
    cursor.y += t.clientY-lastTouchY;
    cursor.x=Math.max(0,Math.min(canvas.width,cursor.x));
    cursor.y=Math.max(0,Math.min(canvas.height,cursor.y));
    lastTouchX=t.clientX; lastTouchY=t.clientY;
    handleMove();
  });

  canvas.addEventListener("touchend",()=>{
    lastTouchX=lastTouchY=null;
    started && lose();
  });

  window.resetGame = resetGame;
  draw();
});
