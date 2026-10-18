/* Exact case counts and records come from the existing, unchanged H5DATA corpus. */
(() => {
  const root = document.querySelector('.relations-page');
  const cases = window.H5DATA?.cases;
  if (!root || !Array.isArray(cases)) {
    const status = document.querySelector('#relation-selection-status');
    if (status) status.textContent = '案例数据未载入，请刷新页面重试。';
    return;
  }
  const $ = selector => root.querySelector(selector) || document.querySelector(selector);
  const groups = [
    {id:'work', name:'企业/上下级', label:'企业 / 上下级', color:'#f4d49c', points:[[920,210],[1110,210],[1320,210],[1530,210],[1730,210],[865,310],[1040,315],[1240,320],[1450,330],[1660,340],[1810,365],[975,430],[1205,450],[1555,462]]},
    {id:'family', name:'亲属', label:'亲属', color:'#ffc0a7', points:[[730,575],[915,625],[1090,665],[785,820],[1010,855],[1205,920]]},
    {id:'friend', name:'朋友/同学/熟人', label:'朋友 / 同学 / 熟人', color:'#c9e9de', points:[[1740,625],[1820,770],[1640,875],[1800,950]]}
  ];
  const center = [1370,735];
  const buttons = new Map();
  const paths = new Map();
  let activeGroup = null;
  let previewGroup = null;
  let readingGroup = null;
  let scrollFrame = 0;
  let selectedCase = null;
  let returnFocus = null;

  function amount(c) {
    if (c.sent === null || c.sent === undefined) return '未披露';
    const unit = {CNY:'元',HKD:'港元',USD:'美元'}[c.currency] || c.currency || '元';
    const prefix = /超过|大于/.test(c.sentQualifier || '') ? '超过 ' : /约|近似/.test(c.sentQualifier || '') ? '约 ' : '';
    return prefix + (c.sent >= 10000 ? Number((c.sent / 10000).toFixed(4)).toLocaleString('zh-CN') + ' 万' + unit : c.sent.toLocaleString('zh-CN') + ' ' + unit);
  }
  function updateHighlight() {
    const shownGroup = previewGroup || activeGroup || readingGroup;
    root.querySelectorAll('.relation-filter-button').forEach(filter => {
      const shown = filter.dataset.group === shownGroup;
      filter.classList.toggle('is-previewing',shown);
      if(shown) filter.setAttribute('aria-current','true');
      else filter.removeAttribute('aria-current');
    });
    root.querySelectorAll('[data-relation-group]').forEach(label => {
      label.classList.toggle('is-group-lit',label.dataset.relationGroup === shownGroup);
      label.classList.toggle('is-dimmed',Boolean(shownGroup && label.dataset.relationGroup !== shownGroup));
    });
    const group = groups.find(item => item.id === shownGroup);
    const message = group ? `${group.label} · ${cases.filter(c => c.relation === group.name).length} 起案例已高亮` : `正在显示全部 ${cases.length} 起案例`;
    if($('#relation-selection-status').textContent !== message) $('#relation-selection-status').textContent = message;
    buttons.forEach((button,id) => {
      const dimmed = Boolean(shownGroup && button.dataset.group !== shownGroup);
      const lit = Boolean(shownGroup && button.dataset.group === shownGroup);
      button.classList.toggle('is-group-lit',lit);
      paths.get(id).classList.toggle('is-group-lit',lit);
      button.classList.toggle('is-dimmed',dimmed);
      button.setAttribute('aria-pressed',String(id === selectedCase));
      paths.get(id).classList.toggle('is-dimmed',dimmed);
      paths.get(id).classList.toggle('is-active',id === selectedCase);
    });
  }
  function closeDetail(restoreFocus = true) {
    $('#relationship-detail').close();
    
    selectedCase = null;
    updateHighlight();
    if (restoreFocus && returnFocus) returnFocus.focus({preventScroll:true});
  }
  function selectGroup(id) {
    closeDetail(false);
    activeGroup = activeGroup === id ? null : id;
    root.querySelectorAll('.relation-filter-button').forEach(button => button.setAttribute('aria-pressed',String(button.dataset.group === activeGroup)));
    updateHighlight();

  }
  function inspectCase(c,group,button) {
    if (activeGroup && activeGroup !== group.id) selectGroup(group.id);
    returnFocus = button;
    selectedCase = c.id;
    
    $('#relationship-detail').showModal();
    $('#relationship-case-group').textContent = `${group.label} · ${c.id}`;
    $('#relationship-case-title').textContent = `${c.place && c.place !== '未披露' ? c.place : c.region} · ${c.year}`;
    $('#relationship-case-person').textContent = c.person && c.person !== '未披露' ? c.person : '冒充身份未披露';
    $('#relationship-case-reason').textContent = c.reason;
    $('#relationship-case-money').textContent = amount(c);
    $('#relationship-case-outcome').textContent = c.outcome;
    $('#relationship-case-coding').textContent = `关系归组：${c.relation}。${c.relationRaw !== c.relation ? `原始关系描述：${c.relationRaw}。` : ''}`;
    const sources = $('#relationship-case-sources');
    sources.replaceChildren();
    (c.sourceUrls || []).forEach((url,i) => {
      if (!/^https?:\/\//.test(url)) return;
      const link = document.createElement('a');
      link.href = url; link.target = '_blank'; link.rel = 'noopener';
      link.textContent = `查看来源${i ? i + 1 : ''} ↗`;
      sources.append(link);
    });
    $('#relationship-detail').scrollTop = 0;
    updateHighlight();
    $('#relationship-case-title').focus({preventScroll:true});
  }
  groups.forEach(group => {
    const members = cases.filter(c => c.relation === group.name);
    root.querySelectorAll(`[data-relation-count="${group.id}"]`).forEach(label => label.textContent = members.length);
    const filter = $(`.relation-filter-button[data-group="${group.id}"]`);
    filter.style.setProperty('--case-share',`${members.length / cases.length * 100}%`);
    filter.setAttribute('aria-label',`${group.label}，${members.length} 起，共 ${cases.length} 起，筛选关系`);
    filter.addEventListener('click',() => selectGroup(group.id));
    const preview=()=>{previewGroup=group.id;filter.classList.add('is-previewing');updateHighlight();};
    const clearPreview=()=>{previewGroup=null;filter.classList.remove('is-previewing');updateHighlight();};
    filter.style.setProperty('--group-color',group.color);
    filter.addEventListener('pointerenter',event=>{if(event.pointerType!=='touch')preview();});
    filter.addEventListener('pointerleave',clearPreview);
    filter.addEventListener('focus',preview);filter.addEventListener('blur',clearPreview);
    members.forEach((c,index) => {
      const [x,y] = group.points[index] || [740 + (index % 8) * 138,170 + Math.floor(index / 8) * 150];
      const path = document.createElementNS('http://www.w3.org/2000/svg','path');
      path.classList.add('relationship-line');
      path.style.setProperty('--group-color',group.color);
      path.setAttribute('d',`M ${center[0]} ${center[1]} C ${center[0] + (x - center[0]) * .16} ${center[1] - 135}, ${x + (center[0] - x) * .28} ${y + 140}, ${x} ${y}`);
      $('#relationship-lines').append(path);
      paths.set(c.id,path);
      const button = document.createElement('button');
      button.type = 'button';button.className = 'relation-node';
      button.classList.toggle('has-label-below',y < 260);
      button.dataset.group = group.id;button.dataset.case = c.id;
      button.style.setProperty('--node-x',`${x}px`);button.style.setProperty('--node-y',`${y}px`);button.style.setProperty('--group-color',group.color);
      button.setAttribute('aria-label',`${c.place || c.region}，${c.year}，${c.person || group.label}，查看案例与来源`);
      button.setAttribute('aria-pressed','false');button.setAttribute('aria-controls','relationship-detail');
      const label = document.createElement('span');label.className = 'relation-node-label';label.setAttribute('aria-hidden','true');
      label.textContent = `${c.person && c.person !== '未披露' ? c.person : group.label} · ${c.year}`;
      button.append(label);
      button.addEventListener('click',() => inspectCase(c,group,button));
      button.addEventListener('pointerenter',event => {if(event.pointerType==='touch')return;previewGroup=group.id;updateHighlight();path.classList.add('is-active');});
      button.addEventListener('pointerleave',() => {previewGroup=null;updateHighlight();path.classList.toggle('is-active',selectedCase === c.id);});
      button.addEventListener('focus',() => {previewGroup=group.id;updateHighlight();path.classList.add('is-active');});
      button.addEventListener('blur',() => {previewGroup=null;updateHighlight();path.classList.toggle('is-active',selectedCase === c.id);});
      $('#relationship-nodes').append(button);buttons.set(c.id,button);
    });
  });
  const visual = $('.relationship-visual');
  let pointer = null;
  function nearestBranch(x,y) {
    let nearest=null,distance=Infinity;
    buttons.forEach(button => {
      const r=button.getBoundingClientRect();
      const d=Math.hypot(x-r.left-r.width/2,y-r.top-r.height/2);
      if(d<distance){distance=d;nearest=button.dataset.group;}
    });
    return distance<95?nearest:null;
  }
  function followTree() {
    scrollFrame=0;
    const r=visual.getBoundingClientRect(),line=innerHeight*.52;
    let next=null;
    if(r.bottom>90 && r.top<innerHeight*.8){
      let distance=Infinity;
      groups.forEach(group => {
        const members=[...buttons.values()].filter(button=>button.dataset.group===group.id);
        const ys=members.map(button=>{const b=button.getBoundingClientRect();return b.top+b.height/2;});
        const center=ys.reduce((a,b)=>a+b,0)/ys.length;
        const d=Math.abs(center-line);
        if(d<distance){distance=d;next=group.id;}
      });
    }
    readingGroup=next;
    if(pointer)previewGroup=nearestBranch(pointer.x,pointer.y);
    updateHighlight();
  }
  function queueTree(){if(!scrollFrame)scrollFrame=requestAnimationFrame(followTree);}
  visual.addEventListener('pointermove',event=>{
    if(event.pointerType==='touch')return;
    pointer={x:event.clientX,y:event.clientY};
    const group=event.target.closest('[data-relation-group]')?.dataset.relationGroup || nearestBranch(pointer.x,pointer.y);
    if(previewGroup!==group){previewGroup=group;updateHighlight();}
  });
  visual.addEventListener('pointerleave',()=>{pointer=null;previewGroup=null;updateHighlight();});
  visual.addEventListener('scroll',queueTree,{passive:true,capture:true});
  addEventListener('scroll',queueTree,{passive:true});addEventListener('resize',queueTree,{passive:true});
  new ResizeObserver(queueTree).observe(visual);
  $('#relations-reset').addEventListener('click',() => { previewGroup=null;activeGroup=null;readingGroup=null;selectGroup(null); });
  queueTree();
  $('#relationship-detail').addEventListener('cancel', event => { event.preventDefault(); closeDetail(); });
  $('#relation-detail-close').addEventListener('click',() => closeDetail());
  document.addEventListener('keydown',event => {
    if (event.key === 'Escape' && $('#relationship-detail').open) closeDetail();
  });
})();
