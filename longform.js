/* Fit only coordinate-based art. Prose participates in normal responsive document flow. */
(() => {
  const paintings = [...document.querySelectorAll('[data-canvas-width]')];
  function fitArtwork() {
    paintings.forEach(frame => {
      const width = Number(frame.dataset.canvasWidth);
      const height = Number(frame.dataset.canvasHeight);
      // On a phone the relationship painting can be explored horizontally at readable size.
      const actual = frame.classList.contains('relationship-frame') && innerWidth <= 640
        ? Math.max(frame.clientWidth,700) : frame.clientWidth;
      frame.style.setProperty('--art-scale',actual / width);
      frame.style.setProperty('--art-width',`${actual}px`);
      frame.style.setProperty('--art-crop-x',`${Number(frame.dataset.canvasOffsetX || 0)}px`);
      frame.style.setProperty('--art-crop-y',`${Number(frame.dataset.canvasOffsetY || 0)}px`);
      if ((frame.classList.contains('relationship-frame') && innerWidth <= 640) ||
          (frame.classList.contains('archive-frame') && innerWidth > 640)) {
        frame.style.height = `${actual * height / width}px`;
      } else frame.style.removeProperty('height');
    });
  }
  const resize = new ResizeObserver(fitArtwork);
  paintings.forEach(frame => resize.observe(frame));
  fitArtwork();

  const menu = document.querySelector('.reading-menu');
  menu?.addEventListener('click',event => {if (event.target.closest('a')) menu.open = false;});
  document.addEventListener('keydown',event => {if (event.key === 'Escape' && menu?.open) {menu.open=false;menu.querySelector('summary').focus();}});

  // Only the narrative moments receive a quiet entrance. Nothing is hidden before JavaScript runs.
  const preference = matchMedia('(prefers-reduced-motion:reduce)');
  const running = new Set();
  if ('IntersectionObserver' in window && Element.prototype.animate) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) {
          entry.target.getAnimations().forEach(animation=>animation.cancel());
          entry.target.dataset.revealEntered='false';return;
        }
        if(entry.target.dataset.revealEntered==='true')return;
        entry.target.dataset.revealEntered='true';
        if (preference.matches) return;
        const animation = entry.target.animate([
          {opacity:.58,transform:'translateY(14px)'},
          {opacity:1,transform:'translateY(0)'}
        ],{duration:1100,easing:'cubic-bezier(.22,.61,.36,1)'});
        running.add(animation);
        animation.finished.catch(() => {}).finally(() => running.delete(animation));
      });
    },{rootMargin:'0px 0px -8% 0px',threshold:.18});
    document.querySelectorAll('[data-reading-reveal]').forEach(node => observer.observe(node));
  }
  preference.addEventListener('change',() => {if(preference.matches) running.forEach(animation => animation.cancel());});
})();
