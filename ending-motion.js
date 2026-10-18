/* Letters replay on reentry. The painted river keeps flowing while the finale remains in view, including after the words scroll above it. */
(()=>{
  const page=document.querySelector('.ending-page');if(!page)return;
  const reduced=matchMedia('(prefers-reduced-motion:reduce)'),clamp=n=>Math.max(0,Math.min(1,n));
  const prose=[...page.querySelectorAll('.ending-copy>p')].map(el=>{
    el.classList.add('ending-prose-ready');return{el,direction:null};
  });
  const finale=page.querySelector('.ending-trust-finale'),sentence=finale?.querySelector('.ending-final-sentence');
  if(!sentence)return;
  const letters=[];
  sentence.setAttribute('aria-label',sentence.textContent.trim());
  sentence.querySelectorAll('.ending-final-line').forEach(line=>{
    const text=line.textContent;line.replaceChildren();line.setAttribute('aria-hidden','true');
    [...text].forEach(character=>{
      const span=document.createElement('span');span.className='trust-letter';span.textContent=character;line.append(span);letters.push(span);
    });
  });
  finale.classList.add('finale-ready');
  let started=false,inView=false,pending=false,animations=[],generation=0;
  function cancel(){generation++;animations.forEach(a=>a.cancel());animations=[];}
  function reset(){
    cancel();started=false;
    finale.classList.remove('finale-started','trust-is-shown');sync();
  }
  function settle(){cancel();started=true;finale.classList.add('finale-started','trust-is-shown');sync();}
  async function start(){
    if(started)return;
    if(reduced.matches||!Element.prototype.animate){settle();return;}
    started=true;const token=++generation;finale.classList.add('finale-started');
    animations=letters.map((letter,index)=>letter.animate([
      {opacity:0,transform:`translate(${index%2?'-3':'3'}px,12px) rotate(${index%2?-3:3}deg)`,filter:'blur(1.4px)'},
      {opacity:.75,transform:'translate(0,-3px) rotate(0deg)',filter:'blur(0px)',offset:.72},
      {opacity:1,transform:'translate(0,0) rotate(0deg)',filter:'blur(0px)'}
    ],{duration:800,delay:index*65,easing:'cubic-bezier(.22,.61,.36,1)',fill:'both'}));
    sync();await Promise.allSettled(animations.map(a=>a.finished));
    if(token!==generation)return;
    finale.classList.add('trust-is-shown');
    animations.forEach(a=>a.cancel());animations=[];
  }
  function sync(){
    finale.classList.toggle('river-running',inView&&!document.hidden&&!reduced.matches);
    animations.forEach(a=>{
      if(a.playState==='finished'||a.playState==='idle')return;
      if(document.hidden||!inView)a.pause();else a.play();
    });
  }
  function update(){
    pending=false;
    prose.forEach(p=>{
      const r=p.el.getBoundingClientRect();let progress=0;
      if(r.bottom<=58||r.top>=innerHeight)p.direction=null;
      else{
        if(!p.direction)p.direction=r.top+r.height/2<innerHeight/2?'up':'down';
        const distance=Math.min(260,innerHeight*.34,r.height*.8);
        progress=clamp(p.direction==='down'?(innerHeight*.78-r.top)/distance:(r.bottom-innerHeight*.17)/distance);
      }
      if(reduced.matches)progress=1;
      p.el.style.setProperty('--prose-progress',progress);p.el.style.setProperty('--prose-alpha',.12+.88*progress);
    });
    const r=sentence.getBoundingClientRect();
    if(reduced.matches){if(!started)settle();return;}
    if(r.bottom<=58||r.top>=innerHeight){if(started)reset();return;}
    if(r.top<innerHeight*.74)start();
  }
  function queue(){if(!pending){pending=true;requestAnimationFrame(update);}}
  new IntersectionObserver(entries=>{
    inView=entries[0].isIntersecting;sync();queue();
  },{threshold:0}).observe(finale);
  addEventListener('scroll',queue,{passive:true});addEventListener('resize',queue,{passive:true});
  document.addEventListener('visibilitychange',sync);
  reduced.addEventListener('change',()=>{if(reduced.matches)settle();else reset();queue();});
  if(reduced.matches)settle();queue();
})();
