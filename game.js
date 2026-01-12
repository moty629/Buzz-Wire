window.addEventListener("load", () => {

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

  let holding=false, started=false, onLine=false, gameOver=false;
  let cursor={x:0,y:0}, lastCursor={x:0,y:0};
  let distance=0;

  /* ================= TIMER ================= */
  let startTime=0, elapsedTime=0, timerRunning=false;

  /* ================= CONSTANTS ================= */
  const START={x:40,y:210,w:35,h:35};
  const END  ={x:830,y:205,w:40,h:40};
  const CURSOR_RADIUS=2;

  /* ================= CANVAS RESET ================= */
  function resetCanvas(){
    ctx.setTransform(1,0,0,1,0,0);
    ctx.lineWidth=1;
    ctx.font="14px Arial";
    ctx.textAlign="left";
  }

  /* ================= TIME ================= */
  function getTime(){
    return timerRunning
      ? elapsedTime + (performance.now() - startTime)
      : elapsedTime;
  }

  /* ================= DIFFICULTY ================= */
  function difficulty(lv){
    if(lv<=2) return "EASY";
    if(lv<=5) return "MEDIUM";
    if(lv<=8) return "HARD";
    return "MASTER";
  }

  /* ================= LEVELS ================= */
  const levels=[
    {w:14,p(){ctx.moveTo(70,230);ctx.lineTo(860,230);}},
    {w:10,p(){ctx.moveTo(70,230);ctx.bezierCurveTo(250,230,500,230,860,230);}},
    {w:9,p(){ctx.moveTo(70,230);ctx.bezierCurveTo(200,180,400,280,860,230);}},
    {w:8,p(){ctx.moveTo(70,230);ctx.bezierCurveTo(180,120,380,340,860,230);}},
    {w:7,p(){ctx.moveTo(70,200);ctx.bezierCurveTo(200,420,420,40,860,230);}},
    {w:6,p(){
      ctx.moveTo(70,230);
      ctx.bezierCurveTo(150,80,300,380,500,120);
      ctx.bezierCurveTo(650,-20,750,360,860,230);
    }},
    {w:5.5,p(){
      ctx.moveTo(70,230);
      ctx.bezierCurveTo(150,20,280,420,420,180);
      ctx.bezierCurveTo(560,-40,700,420,860,230);
    }},
    {w:5,p(){
      ctx.moveTo(70,200);
      ctx.bezierCurveTo(140,400,260,40,400,300);
      ctx.bezierCurveTo(540,520,700,-80,860,230);
    }},
    {w:4.5,p(){
      ctx.moveTo(70,230);
      ctx.bezierCurveTo(120,20,240,420,360,120);
      ctx.bezierCurveTo(480,-80,600,520,720,180);
      ctx.bezierCurveTo(780,60,820,300,860,230);
    }},
    {w:4,p(){
      ctx.moveTo(70,230);
      ctx.bezierCurveTo(120,0,220,460,340,140);
      ctx.bezierCurveTo(460,-120,580,560,700,160);
      ctx.bezierCurveTo(760,40,820,340,860,230);
    }}
  ];

  /* ================= DRAW ================= */
  function drawPath(){
    ctx.beginPath();
    ctx.strokeStyle="lime";
    ctx.lineWidth=levels[level].w;
    levels[level].p();
    ctx.stroke();
  }

  function drawLevels(){
    let t="";
    for(let i=0;i<levels.length;i++){
      t+=(i<=unlockedLevel?"🟢":"🔒")+" "+(i+1)+"  ";
    }
    levelsDiv.textContent=t;
  }

  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    resetCanvas();

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
    ctx.arc(cursor.x,cursor.y,CURSOR_RADIUS,0,Math.PI*2);
    ctx.fillStyle="#007bff";
    ctx.fill();

    if(gameOver){
      ctx.save();
      ctx.font="48px Arial";
      ctx.fillStyle="red";
      ctx.fillText("!!!!! LOOOOOSER !!!!!",200,240);
      ctx.restore();
    }

    statsDiv.textContent=
      `Level ${level+1}/10 | ${difficulty(level)} | `+
      `Time ${(getTime()/1000).toFixed(2)}s | `+
      `Distance ${Math.round(distance)} px`;
  }

  /* ================= GAME ================= */
  function resetGame(){
    holding=false;
    started=false;
    onLine=false;
    gameOver=false;
    distance=0;
    elapsedTime=0;
    timerRunning=false;
    draw();
  }

  function lose(){
    if(gameOver) return;
    timerRunning=false;
    elapsedTime=getTime();
    gameOver=true;
    failSound.play();
    draw();
  }

  function startGame(){
    if(level>unlockedLevel) return;
    holding=true;
    started=true;
    onLine=false;
    distance=0;
    elapsedTime=0;
    startTime=performance.now();
    timerRunning=true;
    startSound.play();
  }

  function handleMove(){
    if(!holding||!started||gameOver){draw();return;}

    drawPath();
    const inside=ctx.isPointInStroke(cursor.x,cursor.y);

    if(!onLine&&inside){onLine=true;lastCursor={...cursor};}
    if(onLine&&!inside){lose();return;}

    const dx=cursor.x-lastCursor.x;
    const dy=cursor.y-lastCursor.y;
    distance+=Math.sqrt(dx*dx+dy*dy);
    lastCursor={...cursor};

    if(cursor.x>END.x&&cursor.x<END.x+END.w&&cursor.y>END.y&&cursor.y<END.y+END.h){
      timerRunning=false;
      elapsedTime=getTime();
      successSound.play();

      setTimeout(()=>{
        if(level<levels.length-1){
          level++;
          if(level>unlockedLevel) unlockedLevel=level;
        }else{
          level=0; unlockedLevel=0;
        }
        resetGame();
      },300);
    }
    draw();
  }

  /* ================= INPUT ================= */
  const pos=e=>{
    const r=canvas.getBoundingClientRect();
    return {x:e.clientX-r.left,y:e.clientY-r.top};
  };

  canvas.addEventListener("mousedown",e=>{
    cursor=pos(e); lastCursor={...cursor};
    if(cursor.x>START.x&&cursor.x<START.x+START.w&&cursor.y>START.y&&cursor.y<START.y+START.h)
      startGame();
  });
  canvas.addEventListener("mousemove",e=>{cursor=pos(e);handleMove();});
  canvas.addEventListener("mouseup",()=>{if(started&&!gameOver)lose();});

  canvas.addEventListener("touchstart",e=>{
    e.preventDefault();
    cursor=pos(e.touches[0]); lastCursor={...cursor};
    if(cursor.x>START.x&&cursor.x<START.x+START.w&&cursor.y>START.y&&cursor.y<START.y+START.h)
      startGame();
  });
  canvas.addEventListener("touchmove",e=>{
    e.preventDefault();
    cursor=pos(e.touches[0]);handleMove();
  });
  canvas.addEventListener("touchend",e=>{
    e.preventDefault();
    if(started&&!gameOver)lose();
  });

  /* ================= EXPOSE TO HTML ================= */
  window.resetGame = resetGame;

  /* ================= INIT ================= */
  draw();
});
