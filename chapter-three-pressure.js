(() => {
  const page = document.querySelector('.pressure-page');
  if (!page) return;
  const cases = window.H5DATA?.cases;
  const board = document.querySelector('#pressure-case-board');
  const filters = [...page.querySelectorAll('[data-pressure-filter]')];
  if (!Array.isArray(cases) || !cases.length) {
    document.querySelector('#pressure-board-error').hidden = false;
    filters.forEach(button => { button.disabled = true; });
    return;
  }
  const detail = document.querySelector('#pressure-detail');
  const overview = document.querySelector('#pressure-overview');
  const close = document.querySelector('#pressure-detail-close');
  const title = document.querySelector('#pressure-detail-title');
  const live = document.querySelector('#pressure-live-status');
  const labels = { urgent: '紧急 / 保密话术', document: '伪造凭证 / 文件' };
  let selectedFilter = 'urgent';
  let activeCard = null;
  let enterTimer=0, leaveTimer=0, suppressFocus=false;
  const finePointer=matchMedia('(hover:hover) and (pointer:fine)');
  function cancelClose(){clearTimeout(leaveTimer);}
  function scheduleClose(){clearTimeout(enterTimer);cancelClose();leaveTimer=setTimeout(()=>closeDetail(false),360);}
  function positionDetail(){
    if(detail.hidden)return;
    const boardLeft=board.getBoundingClientRect().left;
    const width=innerWidth>760?Math.min(440,Math.max(280,boardLeft-40)):Math.min(innerWidth-32,440);
    detail.style.setProperty('--case-preview-width',`${width}px`);
    detail.style.left=innerWidth>760?`${Math.max(16,boardLeft-width-20)}px`:`${(innerWidth-width)/2}px`;
    detail.style.top=innerWidth>760?'82px':`${Math.max(72,(innerHeight-Math.min(detail.scrollHeight,innerHeight-110))/2)}px`;
  }
  const positions = [
    [0,18,-7],[130,0,4],[258,18,-3],[386,4,6],[516,22,-5],[642,6,4],[772,21,-4],[898,4,5],
    [10,184,5],[138,163,-5],[267,188,4],[389,170,-4],[520,191,6],[647,170,-6],[776,192,4],[900,168,-4],
    [0,345,-4],[132,326,5],[259,350,-5],[387,331,4],[517,352,-3],[644,329,5],[772,350,-5],[897,335,4]
  ];

  page.querySelectorAll('[data-pressure-total]').forEach(el => { el.textContent = String(cases.length); });
  ['urgent', 'document'].forEach(key => {
    document.querySelector(`#pressure-${key}-count`).textContent = String(cases.filter(item => item[key] === true).length);
  });

  function closeDetail(restoreFocus = true) {
    clearTimeout(enterTimer);cancelClose();detail.hidden=true;
    
    if (activeCard) {
      activeCard.setAttribute('aria-pressed', 'false');
      activeCard.classList.remove('is-peeking');
      if (restoreFocus){suppressFocus=true;activeCard.focus({ preventScroll: true });suppressFocus=false;}
    }
    activeCard = null;
  }

  function openDetail(item, button, index, focus=false) {
    clearTimeout(enterTimer);cancelClose();
    if(activeCard===button&&!detail.hidden){if(focus)close.focus({preventScroll:true});return;}
    activeCard?.classList.remove('is-peeking');
    if (activeCard) activeCard.setAttribute('aria-pressed', 'false');
    activeCard = button;
    button.setAttribute('aria-pressed', 'true');button.classList.add('is-peeking');
    
    detail.hidden=false;
    document.querySelector('#pressure-detail-kicker').textContent = `样本 ${String(index + 1).padStart(2, '0')} / ${cases.length} · ${item.year}`;
    title.textContent = item.place || item.region || '地点未披露';
    document.querySelector('#pressure-detail-person').textContent = `被冒充者：${item.person || '未披露'}`;
    document.querySelector('#pressure-detail-reason').textContent = item.reason || '公开材料未披露。';
    document.querySelector('#pressure-detail-outcome').textContent = item.outcome || '公开材料未披露。';
    const tags = document.querySelector('#pressure-detail-tags');
    tags.replaceChildren();
    ['urgent', 'document'].forEach(key => {
      if (item[key] !== true) return;
      const tag = document.createElement('span');
      tag.textContent = `本案计入：${labels[key]}`;
      tags.append(tag);
    });
    tags.hidden = !tags.childElementCount;
    const sources = document.querySelector('#pressure-detail-sources');
    sources.replaceChildren();
    (item.sourceUrls || []).forEach((url, position) => {
      if (!/^https?:\/\//i.test(url)) return;
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = `阅读来源${position ? ` ${position + 1}` : ''} ↗`;
      sources.append(link);
    });
    detail.scrollTop = 0;
    positionDetail();
    if(focus)close.focus({preventScroll:true});
    live.textContent = `已打开样本 ${index + 1}：${title.textContent}`;
  }

  const cards = cases.map((item, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'pressure-case';
    button.setAttribute('aria-pressed', 'false');
    button.setAttribute('aria-controls', 'pressure-detail');
    const [x, y, turn] = positions[index] || [(index % 8) * 128, Math.floor(index / 8) * 168, 0];
    button.style.setProperty('--paper-x', `${x}px`);
    button.style.setProperty('--paper-y', `${y}px`);
    button.style.setProperty('--paper-turn', `${turn}deg`);
    const paper = document.createElement('span');
    paper.className = 'pressure-paper';
    paper.setAttribute('aria-hidden', 'true');
    const number = document.createElement('span');
    number.className = 'pressure-case-number';
    number.setAttribute('aria-hidden', 'true');
    number.textContent = String(index + 1).padStart(2, '0');
    const tip = document.createElement('span');
    tip.className = 'pressure-case-tip';
    tip.setAttribute('aria-hidden', 'true');
    tip.textContent = `${item.place || item.region} · ${item.year}`;
    button.append(paper, number, tip);
    button.addEventListener('pointerenter',event=>{
      if(event.pointerType==='touch'||!finePointer.matches)return;
      cancelClose();clearTimeout(enterTimer);enterTimer=setTimeout(()=>openDetail(item,button,index),180);
    });
    button.addEventListener('pointerleave',scheduleClose);
    button.addEventListener('focus',()=>{if(!suppressFocus)openDetail(item,button,index);});
    button.addEventListener('blur',event=>{if(!detail.contains(event.relatedTarget))scheduleClose();});
    button.addEventListener('click', () => openDetail(item, button, index,true));
    board.append(button);
    return button;
  });

  function showFilter(key) {
    selectedFilter = key;
    closeDetail(false);
    board.dataset.filter = key;
    filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.pressureFilter === key)));
    cases.forEach((item, index) => {
      const recorded = item[key] === true;
      cards[index].classList.toggle('is-recorded', recorded);
      cards[index].setAttribute('aria-label', `样本 ${index + 1}，${item.place || item.region}，${item.year}，当前查看${labels[key]}：${recorded ? '本类别案例' : '其他案例'}，查看案情与来源`);
    });
    const count = cases.filter(item => item[key] === true).length;
    document.querySelector('#pressure-board-selection').textContent = `浅金突出：${labels[key]}`;
    live.textContent = `浅金突出 ${count} 起${labels[key]}案例。全部档案都属于同一组 ${cases.length} 起样本，同一案件可属于两类。`;
  }

  filters.forEach(button => button.addEventListener('click', () => showFilter(button.dataset.pressureFilter)));
  detail.addEventListener('pointerenter',cancelClose);
  detail.addEventListener('pointerleave',()=>{if(!detail.contains(document.activeElement))scheduleClose();});
  detail.addEventListener('focusin',cancelClose);
  detail.addEventListener('focusout',event=>{if(!detail.contains(event.relatedTarget)&&event.relatedTarget!==activeCard)scheduleClose();});
  document.addEventListener('pointerdown',event=>{if(!detail.hidden&&!detail.contains(event.target)&&!board.contains(event.target))closeDetail(false);});
  window.addEventListener('resize',positionDetail,{passive:true});
  window.addEventListener('scroll',()=>{if(!detail.hidden&&!detail.contains(document.activeElement))closeDetail(false);},{passive:true});
  close.addEventListener('click', () => closeDetail());
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !detail.hidden) {
      event.preventDefault();
      closeDetail();
    }
  });
  showFilter(selectedFilter);
})();
