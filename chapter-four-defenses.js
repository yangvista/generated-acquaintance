(() => {
  const page = document.querySelector('.defenses-page');
  if (!page) return;
  const nodes = [...page.querySelectorAll('[data-defense-step]')];
  const panels = [...page.querySelectorAll('.defenses-panel')];
  const preference = matchMedia('(prefers-reduced-motion:reduce)');
  let current = -1;
  let scheduled = 0;
  function selectStep(index) {
    if (current === index) return;
    current = index;
    nodes.forEach((node,i) => node.setAttribute('aria-pressed',String(i === index)));
    panels.forEach((panel,i) => panel.classList.toggle('is-active',i === index));
    page.querySelector('#defenses-live-status').textContent = `当前阅读：${nodes[index].querySelector('.defenses-node-name').textContent}`;
  }
  function followReading() {
    scheduled = 0;
    let index = 0;
    const readingLine = Math.max(150, innerHeight * .46);
    panels.forEach((panel,i) => { if (panel.getBoundingClientRect().top <= readingLine) index = i; });
    selectStep(index);
  }
  function scheduleReading() {if (!scheduled) scheduled = requestAnimationFrame(followReading);}
  function goToStep(index) {
    panels[index].scrollIntoView({block:'start',behavior:preference.matches?'instant':'smooth'});
  }
  nodes.forEach((button,index) => {
    button.addEventListener('click',() => goToStep(index));
    button.addEventListener('keydown',event => {
      let next;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = Math.min(index + 1,nodes.length - 1);
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = Math.max(index - 1,0);
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = nodes.length - 1;
      if (next === undefined) return;
      event.preventDefault(); nodes[next].focus({preventScroll:true}); goToStep(next);
    });
  });
  window.addEventListener('scroll',scheduleReading,{passive:true});
  window.addEventListener('resize',scheduleReading,{passive:true});
  new ResizeObserver(scheduleReading).observe(page);
  const moneyButtons = [...page.querySelectorAll('[data-defense-money]')];
  const sample = window.H5DATA?.cases?.find(item => item.id === 'CASE-2023-006');
  // Amounts retain their separate meanings: sent, immediately intercepted, and transferred onward.
  const sent = sample?.sent ?? 4300000;
  const stopped = sample?.stopped ?? 3368400;
  const away = sent - stopped;
  const wan = amount => Number((amount / 10000).toFixed(2)).toLocaleString('zh-CN',{useGrouping:false,maximumFractionDigits:2});
  [['sent',sent],['stopped',stopped],['away',away]].forEach(([key,amount]) => page.querySelectorAll(`[data-defense-${key}]`).forEach(el => {el.textContent = wan(amount);}));
  const chart=page.querySelector('.defenses-money-chart');
  const keptRing=chart.querySelector('.money-ring-kept'),awayRing=chart.querySelector('.money-ring-away');
  const share=stopped/sent*100;
  keptRing.style.strokeDasharray=`${share} ${100-share}`;
  awayRing.style.strokeDasharray=`${100-share} ${share}`;
  awayRing.style.strokeDashoffset=String(-share);
  chart.setAttribute('aria-label',`福州案转出${wan(sent)}万元，其中${wan(stopped)}万元被及时拦截，${wan(away)}万元被转移。`);
  function previewMoney(key){
    keptRing.classList.toggle('is-muted',key==='away');awayRing.classList.toggle('is-muted',key==='kept');
    keptRing.classList.toggle('is-highlighted',key==='kept');awayRing.classList.toggle('is-highlighted',key==='away');
  }
  moneyButtons.forEach(button=>{
    button.addEventListener('pointerenter',()=>previewMoney(button.dataset.defenseMoney));
    button.addEventListener('pointerleave',()=>previewMoney(null));
    button.addEventListener('focus',()=>previewMoney(button.dataset.defenseMoney));
    button.addEventListener('blur',()=>previewMoney(null));
  });
  let ringAnimation=null,ringEntered=false;
  new IntersectionObserver(entries=>{
    const e=entries[0];
    if(!e.isIntersecting){ringAnimation?.cancel();ringAnimation=null;ringEntered=false;return;}
    if(e.intersectionRatio<.25||ringEntered)return;
    ringEntered=true;
    if(preference.matches||!chart.animate)return;
    ringAnimation=chart.animate([{opacity:.2,transform:'scale(.92) rotate(-14deg)'},{opacity:1,transform:'scale(1) rotate(0deg)'}],{duration:1050,easing:'cubic-bezier(.16,1,.3,1)'});
  },{threshold:[0,.25]}).observe(chart);
  preference.addEventListener('change',()=>{if(preference.matches)ringAnimation?.cancel();});
  moneyButtons.forEach(button => button.addEventListener('click', () => {
    moneyButtons.forEach(item => item.setAttribute('aria-pressed',String(item === button)));
    page.querySelector('#defenses-money-caption').textContent = button.dataset.defenseMoney === 'kept'
      ? `* ${wan(stopped)} 万元：在警银协作中被及时拦截；“拦截”不直接等同于已经返还受害人。`
      : `* ${wan(away)} 万元：通报时已被转移，后续追缴结果未披露，不能据此认定最终净损失。`;
  }));
  selectStep(0);
})();
