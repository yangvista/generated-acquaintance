/* The complete face holds, dissolves in about three seconds, and resets offscreen. */
(() => {
  const portrait=document.querySelector('.ending-portrait');if(!portrait)return;
  const reduced=matchMedia('(prefers-reduced-motion:reduce)');
  const source=new Image(),clamp=n=>Math.max(0,Math.min(1,n));
  const smooth=n=>{const t=clamp(n);return t*t*(3-2*t);};
  const duration=3100,size=900;
  let visible=false,started=false,complete=false,frame=0,last=0,elapsed=0,drawnAt=-Infinity;
  let canvas,context;
  const pieces=[],left=432,top=45,width=405,height=702,columns=9,rows=26;
  for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
    const seed=((row*37+col*19)%97)/97;
    pieces.push({x:left+col*width/columns,y:top+row*height/rows,w:width/columns,h:height/rows,
      delay:450+(1-col/(columns-1))*90+seed*170,
      travel:1750+seed*400,dx:130+seed*200,dy:-65-seed*100,seed});
  }
  function draw(time){
    if(!context)return;
    const ratio=source.naturalWidth/size;context.clearRect(0,0,size,size);
    context.save();context.beginPath();context.rect(0,0,size,size);context.rect(left,top,width,height);context.clip('evenodd');
    context.globalAlpha=1-smooth((time-600)/1500);context.drawImage(source,0,0,size,size);context.restore();
    for(const p of pieces){
      const phase=clamp((time-p.delay)/p.travel);if(phase>=1)continue;
      const drift=1-Math.pow(1-phase,3),alpha=1-smooth((phase-.15)/.85);
      const x=p.x+drift*p.dx,y=p.y+drift*p.dy,h=p.h*(1-.77*drift),w=p.w*(1-.23*drift);
      context.globalAlpha=alpha;
      context.drawImage(source,p.x*ratio,p.y*ratio,(p.w+.6)*ratio,(p.h+.6)*ratio,x,y,w+.6,h+.6);
      if(phase>.12){
        context.globalAlpha=Math.sin(Math.PI*phase)*.64;context.fillStyle=p.seed>.5?'#f0d2a0':'#a9c9db';
        context.font='13px "Songti SC",serif';context.fillText(p.seed>.5?'01':'10',x+4,y+h*.74);
      }
    }
    context.globalAlpha=1;
  }
  function stop(){cancelAnimationFrame(frame);frame=0;last=0;}
  function reset(){
    stop();started=false;complete=false;elapsed=0;drawnAt=-Infinity;
    portrait.classList.remove('face-is-dissolving','face-dissolved');
    if(canvas){canvas.hidden=reduced.matches;draw(0);}
  }
  function finish(){
    stop();complete=true;context?.clearRect(0,0,size,size);
    portrait.classList.remove('face-is-dissolving');portrait.classList.add('face-dissolved');
  }
  function tick(now){
    frame=0;if(!visible||document.hidden||complete||reduced.matches)return;
    if(last)elapsed+=Math.min(now-last,100);last=now;
    if(now-drawnAt>=16){draw(elapsed);drawnAt=now;}
    if(elapsed>=duration){finish();return;}
    frame=requestAnimationFrame(tick);
  }
  function sync(){
    if(!canvas)return;
    if(reduced.matches){stop();canvas.hidden=true;return;}
    canvas.hidden=false;
    if(!visible||document.hidden||complete){stop();return;}
    if(!started){started=true;portrait.classList.add('face-is-dissolving');}
    if(!frame){last=0;frame=requestAnimationFrame(tick);}
  }
  const observer=new IntersectionObserver(entries=>{
    const entry=entries[0];
    if(!entry.isIntersecting){visible=false;reset();return;}
    visible=entry.intersectionRatio>(started?.08:.28);sync();
  },{threshold:[0,.08,.28]});observer.observe(portrait);
  source.onload=()=>{
    canvas=document.createElement('canvas');canvas.width=canvas.height=size;
    canvas.className='ending-face-canvas';canvas.setAttribute('aria-hidden','true');
    context=canvas.getContext('2d');if(!context)return;
    portrait.append(canvas);reset();sync();
  };
  source.src='ending-face-complete.png';
  document.addEventListener('visibilitychange',sync);
  reduced.addEventListener('change',()=>{reset();sync();});
})();
