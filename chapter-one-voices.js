(() => {
  const root = document.querySelector('.voices-page');
  const data = window.H5DATA;
  if (!root || !data?.titles || !data?.terms) return;
  const $ = selector => document.querySelector(selector);
  const dialog = $('#voices-source-dialog');
  const content = $('#voices-dialog-content');
  const recognition = data.terms.find(term => term.word === '识别');
  const total = data.titles.length;
  $('#voices-recognition-text').textContent = recognition.count;
  $('#voices-source-total').textContent = total;
  // Bounds in the original 2048 × 1152 artwork; scaled with the 16:9 page.
  const bounds = {
    '换脸':[840,405,455,258], '视频':[634,328,256,132],
    '识别':[1176,326,280,150], '防范':[611,603,268,150],
    '家人':[1170,653,267,139], '骗局':[1320,488,214,116],
    '声音':[527,454,252,145], '深伪':[942,230,237,132],
    '朋友':[470,603,134,82], '熟人':[781,757,146,108],
    '转账':[1438,605,166,103], '破绽':[930,667,228,120],
    '追回':[1314,784,149,87]
  };
  const paragraph = text => {
    const p = document.createElement('p'); p.textContent = text; content.append(p);
  };
  const heading = text => {
    const h = document.createElement('h3'); h.textContent = text; content.append(h);
  };
  function addTitles(items) {
    items.forEach(item => {
      const article = document.createElement('article'); article.className = 'voices-original-title';
      const platform = document.createElement('span'); platform.textContent = `${item.platform} · 采集到的平台原题`;
      const link = document.createElement('a'); link.textContent = item.title;
      if (/^https?:\/\//.test(item.url)) {link.href = item.url;link.target = '_blank';link.rel = 'noopener';}
      article.append(platform,link);content.append(article);
    });
  }
  function openDialog(title, populate) {
    $('#voices-dialog-heading').textContent = title;
    content.replaceChildren(); populate();
    dialog.showModal(); content.scrollTop = 0;
  }
  function openTerm(term) {
    openDialog(`${term.word} · ${term.count} 条标题`,() => {
      paragraph(`匹配词：${term.aliases.join('、')}。同一标题中出现多个匹配词仍只计一次。`);
      paragraph('以下为采集到的平台原题，标题中的主张不作为本文案情证据。');
      addTitles(term.titles.map(index => data.titles[index]));
    });
  }
  data.terms.forEach(term => {
    if (!bounds[term.word]) return;
    const button = document.createElement('button');button.type = 'button';button.className = 'voices-word';button.dataset.word = term.word;
    const [x,y,w,h] = bounds[term.word].map(value => value * 1920 / 2048);
    [['x',x],['y',y],['w',w],['h',h]].forEach(([key,value]) => button.style.setProperty(`--word-${key}`,`${value}px`));
    const paintedWord = document.createElement('span');
    paintedWord.className = 'word-painted-stroke';
    paintedWord.setAttribute('aria-hidden','true');
    button.append(paintedWord);
    button.setAttribute('aria-label',`${term.word}，${term.count} 条标题，查看原题`);
    button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-controls','voices-source-dialog');
    button.addEventListener('click',() => openTerm(term));$('#voices-word-hotspots').append(button);
  });
  $('#voices-method').addEventListener('click',() => openDialog('这些标题是怎么收集的？',() => {
    heading(`${total} 条标题从哪里来`);
    paragraph('我们从微博、小红书、抖音、知乎的公开搜索结果和内容页面中，收集与 AI 技术和诈骗相关的标题。');
    paragraph(`按“AI 换脸”“人工智能”“深伪”“诈骗”等关键词检索，人工筛选同时涉及 AI 技术和诈骗的内容。去掉账号主页、话题页和重复标题后，保留 ${total} 条；仅标点不同的同一标题也只算一次。`);
    heading('词语怎样计数');
    paragraph('一个词在同一标题里出现多次，只计一次；一条标题可以同时包含多个词，分别计入对应词的数量。意思相近的词放在一起统计，例如“识别”包括辨别、分辨、识破、鉴定和检测。词云为手绘呈现，点击词语即可查看准确数量与对应原题。');
    paragraph(data.terms.map(term => `${term.word}：${term.aliases.join('、')}`).join('；')+'。');
    heading('这组标题说明了什么');
    paragraph('11/60 描述的是这组公开标题中识别真假相关讨论的占比。它提示我们关注熟人身份核验这一防范环节，但不直接测量公众的识别能力，也不意味着其余标题的作者缺乏防骗意识。');
    heading('平台原题与来源');
    paragraph('平台标题只作为讨论文本，不用于证明其中的案情或主张。');
    addTitles(data.titles);
  }));
  $('#voices-close-dialog').addEventListener('click',() => dialog.close());
  dialog.addEventListener('click',event => {
    if (event.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
  });
})();
