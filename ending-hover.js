/* Text keeps responding to the pointer after the entrance finishes.
   Inner layers move; line layout, link hit areas and the entrance's outer layers stay stable. */
(() => {
  const frame = document.querySelector('#ending');
  if (!frame) return;
  const page = frame.querySelector('.ending-page');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = matchMedia('(hover: hover) and (pointer: fine)');
  const hosts = page.querySelectorAll('.ending-chapter-title,.ending-rule>span,.ending-statement>span,.ending-copy>p,.ending-replay>span,.ending-footer>a');
  const groups = [...hosts].map((host,index) => {
    const layer = document.createElement('span');
    layer.className = 'ending-float';
    layer.append(...host.childNodes);
    host.append(layer);
    host.classList.add('ending-float-anchor');
    return {host,layer,phase:index*.7,lift:host.closest('.ending-copy,.ending-replay,.ending-footer')?4:7,strength:0,x:0,y:0,aimX:0,aimY:0};
  });
  const lookup = new Map(groups.map(group => [group.host,group]));
  let active = null;
  let onScreen = true;
  let request = 0;
  let previousTime = 0;

  function reset(immediate=false) {
    active = null;
    if (!immediate) { schedule(); return; }
    cancelAnimationFrame(request);
    request = 0;
    groups.forEach(group => {
      group.strength = group.x = group.y = 0;
      group.layer.style.removeProperty('transform');
      group.layer.style.removeProperty('will-change');
    });
  }
  function schedule() {
    if (request) return;
    previousTime = performance.now();
    request = requestAnimationFrame(update);
  }
  function update(now) {
    request = 0;
    if (reduced.matches || !pointer.matches || document.hidden || !onScreen) { reset(true); return; }
    const blend = 1 - Math.exp(-Math.min((now-previousTime)/1000,.05)*9);
    previousTime = now;
    let moving = false;
    groups.forEach(group => {
      const hovered = group === active;
      if (!hovered && group.strength < .001 && Math.abs(group.x)+Math.abs(group.y) < .03) {
        group.strength = group.x = group.y = 0;
        group.layer.style.removeProperty('transform');
        group.layer.style.removeProperty('will-change');
        return;
      }
      group.strength += ((hovered?1:0)-group.strength)*blend;
      const x = group.strength*(group.aimX+Math.sin(now/1400+group.phase)*1.2);
      const y = group.strength*(group.aimY-group.lift+Math.sin(now/1100+group.phase)*1.8);
      group.x += (x-group.x)*blend;
      group.y += (y-group.y)*blend;
      group.layer.style.transform = `translate(${group.x.toFixed(3)}px,${group.y.toFixed(3)}px)`;
      group.layer.style.willChange = 'transform';
      moving = true;
    });
    if (moving) request = requestAnimationFrame(update);
  }
  page.addEventListener('pointermove',event => {
    if (event.pointerType === 'touch' || reduced.matches || !pointer.matches || !onScreen) return;
    const group = lookup.get(event.target.closest('.ending-float-anchor'));
    active = group || null;
    if (group) {
      const box = group.host.getBoundingClientRect();
      group.aimX = Math.max(-1,Math.min(1,(event.clientX-box.left)/box.width*2-1))*3;
      group.aimY = Math.max(-1,Math.min(1,(event.clientY-box.top)/box.height*2-1))*2;
    }
    schedule();
  });
  page.addEventListener('pointerleave',() => reset());
  page.addEventListener('pointercancel',() => reset(true));
  page.addEventListener('click',event => { if (event.target.closest('button,a')) reset(); });
  window.addEventListener('blur',() => reset(true));
  document.addEventListener('visibilitychange',() => { if (document.hidden) reset(true); });
  reduced.addEventListener('change',() => { if (reduced.matches) reset(true); });
  pointer.addEventListener('change',() => { if (!pointer.matches) reset(true); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      onScreen = entries[0].isIntersecting && entries[0].intersectionRatio > .05;
      if (!onScreen) reset(true);
    },{threshold:[0,.05]}).observe(frame);
  }
})();
