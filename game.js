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

  /* ========= STATE ========= */
  let level = 0;            // current level index (0 = level 1)
  let unlockedLevel = 0;    // highest unlocked level

  let started = false;
  let onLine = false;
  let gameOver = false;
  let levelCompleted = false;

  let cursor = { x:0, y:0 };
  let lastCursor = { x:0, y:0 };

  let distancePx = 0;

  /* ========= TIMER ========= */
  let startTime = 0;
  let elapsedTime = 0;
  let timerRunning = false;

  /* ========= CONSTANTS ========= */
  const PX_PER_METER = 100;
  const START = { x:40, y:210, w:35, h:35 };
  const END   = { x:830, y:205, w:40, h:40 };

  /* ========= SEPARATE LEVEL DEFINITIONS ========= */
  const levels = [
    { width:14, draw(){ ctx.moveTo(70,230); ctx.lineTo(860,230); } }, // 1
    { width:12, draw(){ ctx.moveTo(70,230); ctx.bezierCurveTo(250,200,500,260,860,230); } }, // 2
    { width:10, draw(){ ctx.moveTo(70,230); ctx.bezierCurveTo(200,160,400,300,860,230); } }, // 3
    { width:9,  draw(){ ctx.moveTo(70,230); ctx.bezierCurveTo(180,120,380,340,860,230); } }, // 4
    { width:8,  draw(){ ctx.moveTo(70,230); ctx.bezierCurveTo(200,80,420,380,860,230); } },  // 5
    { width:7,  draw(){ ctx.moveTo(70,230); ctx.bezierCurveTo(160,100,300,360,500,150);
                        ctx.bezierCurveTo(650,50,760,340,860,230); } }, // 6
    { width:6,  draw(){ ctx.moveTo(70,230); ctx.bezierCurveTo(140,60,280,380,420,200);
                        ctx.bezierCurveTo(560,40,700,360,860,230); } }, // 7
    { width:5.5,draw(){ ctx.moveTo(70,230); ctx.bezierCurveTo(120,80,240,360,360,140);
                        ctx.bezierCurveTo(480,60,600,380,720,200);
                        ctx.bezierCurveTo(780,160,820,280,860,230); } }, // 8
    { width:5,  draw(){ ctx.moveTo(70,230); ctx.bezierCurveTo(120,100,220,360,340,160);
                        ctx.bezierCurveTo(460,80,580,360,700,180);
                        ctx.bezierCurveTo(760,140,820,300,860,230); } }, // 9
    { width:4,  draw(){ ctx.moveTo(70,230); ctx.bezierCurveTo(120,120,220,340,340,180);
                        ctx.bezierCurveTo(460,140,580,320,700,200);
                        ctx.bezierCurveTo(760,180,820,260,860,230); } }  // 10
  ];

  /* ========= UTIL ========= */
  function resetCanvas(){
    ctx.setTransform(1,0,0,1,0,0);
    ctx.font = "14px Arial";
    ctx.lineWidth = 1;
  }

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

  /* ========= UNLOCK LOGIC ========= */
  function unlockNextLevel(){
    if (unlockedLevel === level && level < levels.length - 1) {
      unlockedLevel++;           // unlock ONLY next level
    }
    resetGame();                 // stay on same level
  }

  /* ========= DRAW ========= */
  function drawPath(){
    ctx.beginPath();
    ctx.strokeStyle = "lime";
    ctx.lineWidth = levels[level].width;
    levels[level].draw();
    ctx.stroke();
  }

  function drawLevels(){
    let txt = "";
    for(let i=0;i<levels.length;i++){
      txt += (i <= unlockedLevel ? "🟢" : "🔒") + " " + (i+1) + "  ";
    }
    levelsDiv.textContent = txt;
  }

  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    resetCanvas();

    drawLevels();
    drawPath();

    ctx.fillStyle="blue";
    ctx.fillRect(START.x,START.y,START.w,START.h);
    ctx.fillText("START",START.x-2,START.y+START.h+14);

    ctx.fillStyle="red";
    ctx.fillRect(END.x,END.y,END.w,END.h);
    ctx.fillText("END",END.x+8,END.y-8);

    statsDiv.textContent =
      `Level ${level+1}/10 | Time ${(getTimeMs()/1000).toFixed(2)}s | Distance ${(distancePx/PX_PER_METER).toFixed(2)} m`;
  }

  /* ========= GAME CONTROL ========= */
  function resetGame(){
    started = false;
    onLine = false;
    gameOver = false;
    levelCompleted = false;
    distancePx = 0;
    elapsedTime = 0;
    timerRunning = false;
    draw();
  }

  function startGame(){
    if(level > unlockedLevel) return;

    started = true;
    onLine = false;
    gameOver = false;
    levelCompleted = false;

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
      const dx = cursor.x - lastCursor.x;
      const dy = cursor.y - lastCursor.y;
      distancePx += Math.sqrt(dx*dx + dy*dy);
      lastCursor = { ...cursor };
    }

    if(
      cursor.x > END.x && cursor.x < END.x + END.w &&
      cursor.y > END.y && cursor.y < END.y + END.h
    ){
      levelCompleted = true;
      started = false;
      stopTimer();
      successSound.play();
      setTimeout(unlockNextLevel, 300);
    }

    draw();
  }

  /* ========= INPUT ========= */
  const pos = e=>{
    const r = canvas.getBoundingClientRect();
    return { x:e.clientX-r.left, y:e.clientY-r.top };
  };

  canvas.addEventListener("mousedown",e=>{
    cursor = pos(e);
    lastCursor = { ...cursor };
    if(
      cursor.x>START.x && cursor.x<START.x+START.w &&
      cursor.y>START.y && cursor.y<START.y+START.h
    ) startGame();
  });

  canvas.addEventListener("mousemove",e=>{
    cursor = pos(e);
    handleMove();
  });

  canvas.addEventListener("mouseup",()=>{
    if(started) lose();
  });

  draw();
});
