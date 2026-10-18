(() => {
  const reduce=matchMedia('(prefers-reduced-motion:reduce)');
  const clamp=n=>Math.max(0,Math.min(1,n));
  let pending=false;
  // Each message arrives as a whole bubble at its own reading position.
  const questions=[...document.querySelectorAll('.voice-question')].map(group=>{
    const bubble=group.querySelector('.question-bubble');
    group.classList.add('message-ready');
    const question={group,bubble,arrived:false,animation:null};
    group.addEventListener('focusin',()=>receive(question));
    return question;
  });
  function receive(q){
    if(q.arrived)return;
    q.arrived=true;q.group.classList.add('message-received');
    if(reduce.matches||!q.bubble.animate)return;
    q.animation=q.bubble.animate([
      {opacity:0,transform:'translateY(24px) scale(.88)'},
      {opacity:1,transform:'translateY(-3px) scale(1.018)',offset:.68},
      {opacity:1,transform:'translateY(0) scale(1)'}
    ],{duration:640,easing:'cubic-bezier(.2,.75,.25,1)'});
  }
  const cloud=document.querySelector('.wordcloud-frame'),image=cloud?.querySelector('.voices-art');
  const pause=document.querySelector('.voices-motion-toggle');
  let inView=false,userPaused=false,cloudProgress=0,cloudDirection=null,words=[];
  function syncCloud(){
    if(!cloud)return;
    cloud.classList.toggle('is-in-view',inView&&!document.hidden);
    cloud.classList.toggle('cloud-paused',userPaused||reduce.matches);
  }
  function prepareCloud(){
    if(!cloud||!image?.naturalWidth||!cloud.querySelector('.voices-word'))return;
    words=[...cloud.querySelectorAll('.voices-word')];
    words.forEach((word,index)=>{
      word.style.setProperty('--heartbeat-period',`${4.6+(index%4)*.4}s`);
      word.style.setProperty('--heartbeat-delay',`${-.35*index}s`);
    });
    cloud.classList.add('wordcloud-live');if(pause)pause.hidden=false;syncCloud();queue();
  }
  if(cloud)new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;syncCloud();queue();},{threshold:.05}).observe(cloud);
  if(image?.complete)prepareCloud();else image?.addEventListener('load',prepareCloud,{once:true});
  pause?.addEventListener('click',()=>{
    userPaused=!userPaused;pause.setAttribute('aria-pressed',String(userPaused));pause.textContent=userPaused?'继续词云动效':'暂停词云动效';syncCloud();
  });
  document.addEventListener('visibilitychange',syncCloud);
  // The rope has moved to the actual opening case and fits all four prose nodes.
  const journey=document.querySelector('.transfer-journey'),svg=journey?.querySelector('.transfer-rope');
  const steps=journey?[...journey.querySelectorAll('.rope-step')]:[];let points=[];
  function drawRope(){
    if(!journey||!svg)return;
    const r=journey.getBoundingClientRect();
    points=steps.map(step=>{const k=step.querySelector('.rope-knot').getBoundingClientRect();return{x:k.left-r.left+k.width/2,y:k.top-r.top+k.height/2};});
    svg.setAttribute('viewBox',`0 0 ${r.width} ${r.height}`);
    const route=offset=>{
      const first=points[0];let d=`M ${first.x+offset} 8`,last={x:first.x,y:8};
      points.forEach(point=>{const dy=(point.y-last.y)*.52;d+=` C ${last.x+offset-18} ${last.y+dy}, ${point.x+offset+16} ${point.y-dy}, ${point.x+offset} ${point.y}`;last=point;});
      return d+` C ${last.x+offset-8} ${last.y+52}, ${last.x+offset+24} ${r.height-30}, ${last.x+offset+56} ${r.height-12}`;
    };
    svg.querySelectorAll('path').forEach((path,index)=>path.setAttribute('d',route([0,0,-3,3][index])));
    journey.classList.add('rope-ready');queue();
  }
  function update(){
    pending=false;
    questions.forEach(q=>{
      const r=q.bubble.getBoundingClientRect();
      if(reduce.matches){receive(q);return;}
      if(r.bottom<=58||r.top>=innerHeight){
        q.animation?.cancel();q.animation=null;q.arrived=false;
        q.group.classList.remove('message-received');
      }else if(r.top<innerHeight*.7)receive(q);
    });
    if(cloud&&words.length){
      const r=cloud.getBoundingClientRect(),distance=Math.max(180,Math.min(r.height*.7,innerHeight*.48,380));
      if(r.bottom<=58||r.top>=innerHeight){cloudDirection=null;cloudProgress=0;}
      else{
        if(!cloudDirection)cloudDirection=r.top+r.height/2<innerHeight/2?'up':'down';
        cloudProgress=clamp(cloudDirection==='down'?(innerHeight*.83-r.top)/distance:(r.bottom-innerHeight*.17)/distance);
      }
      if(reduce.matches)cloudProgress=1;
      cloud.classList.toggle('cloud-revealed',cloudProgress>0);
      words.forEach((word,index)=>{const p=clamp((cloudProgress*(words.length+3)-index)/3);word.style.setProperty('--word-progress',p);word.style.setProperty('--word-alpha',p);});
    }
    if(journey){const r=journey.getBoundingClientRect(),readY=innerHeight*.73-r.top;
      journey.style.setProperty('--rope-progress',reduce.matches?1:clamp(readY/r.height));
      steps.forEach((step,index)=>{
        const box=step.getBoundingClientRect();
        const reached=readY>(points[index]?.y??Infinity)-40;
        step.classList.toggle('is-traced',reduce.matches||(reached&&box.bottom>58&&box.top<innerHeight));
      });
    }
  }
  function queue(){if(!pending){pending=true;requestAnimationFrame(update);}}
  if(journey){new ResizeObserver(drawRope).observe(journey);drawRope();}
  addEventListener('scroll',queue,{passive:true});addEventListener('resize',()=>{drawRope();queue();},{passive:true});
  document.fonts?.ready.then(()=>{drawRope();queue();});reduce.addEventListener('change',()=>{syncCloud();queue();});queue();
})();
