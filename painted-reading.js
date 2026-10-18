/* Scroll lays one original painting into another through two soft, uneven brush fields.
   The paper never gets tinted, blurred, stretched into a tall panel, or repeated in tiles. */
(() => {
  const stage = document.querySelector('.paper-atmosphere');
  if (!stage) return;
  const layers = [...stage.querySelectorAll('.paper-layer')];
  const byName = Object.fromEntries(layers.map(layer => [layer.dataset.paint, layer]));
  const markers = [...document.querySelectorAll('[data-reading-paint]')];
  const reduce = matchMedia('(prefers-reduced-motion:reduce)');
  let stops = [], pending = false;
  const clamp = n => Math.max(0, Math.min(1, n));
  function measure() {
    stops = markers.map(node => ({top:node.getBoundingClientRect().top + scrollY, name:node.dataset.readingPaint}));
    queue();
  }
  function paint() {
    pending = false;
    const line = scrollY + innerHeight * .66;
    let index = 0;
    for (let i=0; i<stops.length; i++) {
      if (stops[i].top <= line) index=i;
      else break;
    }
    const current = stops[index];
    if (!current) return;
    const previous = stops[Math.max(0,index-1)];
    const distance = Math.min(innerHeight * .9, Math.max(240,(stops[index+1]?.top ?? Infinity)-current.top));
    let amount = index === 0 ? 1 : clamp((line-current.top)/distance);
    amount = amount * amount * (3-2*amount);
    if (reduce.matches) amount=1;
    layers.forEach(layer => {layer.style.opacity='0';layer.style.zIndex='0';layer.classList.remove('is-arriving');});
    const underneath=byName[previous.name], above=byName[current.name];
    if (!above || !underneath) return;
    underneath.style.opacity='1';
    above.style.zIndex='1';
    above.style.opacity=String(amount);
    if (above === underneath || amount > .995) above.style.opacity='1';
    else {
      above.classList.add('is-arriving');
      above.style.setProperty('--brush-x',`${30+amount*200}%`);
      above.style.setProperty('--brush-y',`${25+amount*150}%`);
    }
  }
  function queue(){if(!pending){pending=true;requestAnimationFrame(paint);}}
  addEventListener('scroll',queue,{passive:true});
  addEventListener('resize',measure,{passive:true});
  addEventListener('pageshow',measure);
  reduce.addEventListener('change',queue);
  // Details disclosures and responsive reflow move later paint changes with their text.
  const resize = new ResizeObserver(measure);
  document.querySelectorAll('.reading-chapter').forEach(node => resize.observe(node));
  document.fonts?.ready.then(measure);
  measure();
})();
