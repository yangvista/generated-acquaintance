(() => {
  const page = document.querySelector('.mechanism-page');
  if (!page) return;
  const reader = page.querySelector('#mechanism-reader');
  const scroller = page.querySelector('#mechanism-scroll');
  const nodes = [...page.querySelectorAll('[data-mechanism-step]')];
  const panels = [...page.querySelectorAll('.mechanism-panel')];
  const scenes = [...page.querySelectorAll('[data-mechanism-art]')];
  const caption = page.querySelector('#mechanism-scene-caption');
  const count = page.querySelector('#mechanism-scene-count');
  const status = page.querySelector('#mechanism-live-status');
  const hint = page.querySelector('#mechanism-scroll-hint');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const labels = ['影像与声音素材', '预录内容进入视频会议', '会议结束，付款指令继续', '付款进入五个本地账户'];
  let current = -1;
  let pendingFrame = 0;

  function showStep(index) {
    if (current === index) return;
    current = index;
    reader.dataset.step = String(index);
    nodes.forEach((node, position) => {
      const active = position === index;
      if (active) node.setAttribute('aria-current', 'step');
      else node.removeAttribute('aria-current');
      panels[position].classList.toggle('is-active', active);
      scenes[position].hidden = !active;
    });
    caption.textContent = labels[index];
    count.textContent = `0${index + 1} / 04`;
    status.textContent = `当前步骤：${nodes[index].querySelector('strong').textContent}`;
    hint.textContent = index === panels.length - 1
      ? '已读至最后一步 · 向上滚动可回看 ↑'
      : '继续向下阅读，画面随步骤变化 ↓';
  }

  function followReading() {
    pendingFrame = 0;
    const readingLine = Math.max(150, window.innerHeight * .46);
    let index = 0;
    panels.forEach((panel, position) => {
      if (panel.getBoundingClientRect().top <= readingLine) index = position;
    });
    showStep(index);
  }

  function scheduleReading() {
    if (!pendingFrame) pendingFrame = requestAnimationFrame(followReading);
  }

  function goToStep(index) {
    panels[index].scrollIntoView({block:'start', behavior:reducedMotion.matches?'instant':'smooth'});

  }

  nodes.forEach((node, index) => {
    node.addEventListener('click', () => goToStep(index));
    node.addEventListener('keydown', event => {
      let target;
      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') target = Math.min(index + 1, nodes.length - 1);
      if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') target = Math.max(index - 1, 0);
      if (event.key === 'Home') target = 0;
      if (event.key === 'End') target = nodes.length - 1;
      if (target === undefined) return;
      event.preventDefault();
      nodes[target].focus({ preventScroll: true });
      goToStep(target);
    });
  });

  // Native scrolling supports wheel, trackpad, touch and keyboard; no wheel interception.
  window.addEventListener('scroll', scheduleReading, { passive: true });
  window.addEventListener('resize', scheduleReading, {passive:true});
  new ResizeObserver(scheduleReading).observe(scroller);
  document.fonts?.ready.then(scheduleReading);
  followReading();
})();
