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
  let level = 0;               // current level index
  let unlockedLevel = 0;       // highest unlocked level

  let holding = false;
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

  /* ========= LEVEL DEFINITIONS ========= */
  const levels = [
    { w:14, p(){ ctx.moveTo(70,230); ctx.lineTo(860,230); } },               // 1
    { w:10, p(){ ctx.moveTo(70,230); ctx.bezierCurveTo(250,230,500,230,860,230); } }, // 2
    { w:9,  p(){ ctx.moveTo(70,230); ctx.bezierCurveTo(200,180,400,280,860,230); } }, // 3
    { w:8,  p(){ ctx.moveTo(70,230); ctx.bezierCurveTo(180,120,380,340,860,230); } }, // 4
    { w:7,  p(){ ctx.moveTo(70,200); ctx.bezierCurveTo(200,420,420,40,860,230); } },  // 5
    { w:6,  p(){ ctx.moveTo(70,230); ctx.bezierCurveTo(150,80,300,380,500,120);
                 ctx.bezierCurveTo(650,-20,750,360,860,230); } },                     // 6
    { w:5.5,p(){ ctx.moveTo(70,230); ctx.bezierCurveTo(150,20,280,420,420,180);
                 ctx.bezierCurveTo(560,-40,700,420,860,230); } },                     // 7
    { w:5,  p(){ ctx.moveTo(70,200); ctx.bezierCurveTo(140,400,260,40,400,300);
                 ctx.bezierCurveTo(540,520,700,-80,860,230); } },                     // 8
    { w:4.5,p(){ ctx.moveTo(70,230); ctx.bezierCurveTo(120,20,240,420,360,120);
                 ctx.bezierCurveTo(480,-80,600,520,720,180);
                 ctx.bezierCurveTo(780,60,820,300,860,230); } },                     // 9
    { w:4,  p(){ ctx.moveTo(70,230); ctx.bezierCurveTo(120,0,220,460,340,140);
                 ctx.bezierCurveTo(460,-120,580,560,700,160);
                 ctx.bezierCurveTo(760,40,820,340,860,230); } }                      // 10
  ];

  /* ========= CORE UTIL ========= */
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

  /* ========= LEVEL FLOW CONTROLLER ========= */
  function advanceLevel() {
    if (level < levels.length - 1) {
      level++;                          // STRICT +1
      unlockedLevel = level;            // unlock next level
    } else {
      // end of game – reset everything
      level = 0;
      unlockedLevel = 0;
    }
    resetGame();
  }

  /* ========= DRAW ========= */
  function drawPath(){
    ctx.beginPath();
    ctx.strokeStyle="lime";
    ctx.lineWidth = levels[level].w;
    levels[level].p();
    ctx.stroke();
  }

  function drawLevels(){
    let t="";
    for(let i=0;i<levels.length;i++){
      t += (i <= unlockedLevel ? "🟢" : "🔒") + " " + (i+1) + "  ";
    }
    levelsDiv.textContent = t;
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
    holding = false;
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

    // END ZONE
    if(
      cursor.x > END.x && cursor.x < END.x + END.w &&
      cursor.y > END.y && cursor.y < END.y + END.h
    ){
      levelCompleted = true;
      started = false;
      stopTimer();
      successSound.play();

      setTimeout(advanceLevel, 300);
    }

    draw();
  }

  /* ========= INPUT ========= */
  const pos = e=>{
    const r=canvas.getBoundingClientRect();
    return {x:e.clientX-r.left,y:e.clientY-r.top};
  };

  canvas.addEventListener("mousedown",e=>{
    cursor=pos(e); lastCursor={...cursor};
    if(cursor.x>START.x&&cursor.x<START.x+START.w&&cursor.y>START.y&&cursor.y<START.y+START.h)
      startGame();
  });

  canvas.addEventListener("mousemove",e=>{
    cursor=pos(e);
    handleMove();
  });

  canvas.addEventListener("mouseup",()=>{ if(started) lose(); });

  window.resetGame = resetGame;
  draw();
});
