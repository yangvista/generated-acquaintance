/* Fictional Ajie call: tap to respond, with an automatic reveal after 1.2 seconds. */
(() => {
  const $ = selector => document.querySelector(selector);
  const dialog = $('#call-dialog');
  const call = {timers:[], clock:null, optionsTimer:null, started:0, voice:false, running:false};
  let previousOverflow = '';

  function clearCall() {
    call.timers.forEach(clearTimeout);
    call.timers = [];
    clearTimeout(call.optionsTimer);
    call.optionsTimer = null;
    clearInterval(call.clock);
    call.clock = null;
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    call.running = false;
  }

  function readSpeech() {
    if (!call.voice || !('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance('我妈住院了，急着交费。能先借我八千块吗？');
    speech.lang = 'zh-CN';
    speech.rate = 1;
    speechSynthesis.speak(speech);
  }

  function showCallOptions() {
    if (!call.running || !$('#call-options').hidden) return;
    clearTimeout(call.optionsTimer);
    call.optionsTimer = null;
    $('#call-options').hidden = false;
    $('.call-shell').classList.add('has-options');
  }

  function connectCall() {
    clearCall();
    call.running = true;
    $('#call-response').hidden = true;
    $('#call-options').hidden = true;
    $('#call-status').hidden = true;
    $('.call-top').inert = false;
    $('.call-controls').inert = false;
    $('.call-shell').classList.remove('has-options');
    $('#call-subtitle').textContent = '';
    $('#call-clock').textContent = '正在接通…';
    call.timers.push(setTimeout(() => {
      $('#call-subtitle').innerHTML = '“我妈住院了，急着交费。”<br>“能先借我 8,000 块吗？”';
      $('#call-clock').textContent = '00:00';
      call.started = Date.now();
      call.clock = setInterval(() => {
        const seconds = Math.floor((Date.now() - call.started) / 1000);
        $('#call-clock').textContent = `${String(Math.floor(seconds / 60)).padStart(2,'0')}:${String(seconds % 60).padStart(2,'0')}`;
      }, 1000);
      readSpeech();
    }, 200));
    call.optionsTimer = setTimeout(showCallOptions, 1200);
  }

  function openCall() {
    if (dialog.open) return;
    previousOverflow = document.body.style.overflow;
    connectCall();
    dialog.showModal();
    document.body.style.overflow = 'hidden';
  }

  function closeCall() {
    clearCall();
    document.body.style.overflow = previousOverflow;
    dialog.close();
  }

  const outcomes = {
    trust: {
      state:'loss', label:'模拟结局 · 已被骗', title:'你被骗了，8,000 元已转出。',
      copy:'你给“阿杰”转了 8,000 元。收款后，对方挂断通话，把你拉黑。真正的阿杰没有借钱，这笔钱进入了骗子的账户。',
      warning:'一张熟悉的脸，让你把钱交给了陌生人。'
    },
    question: {
      state:'loss', label:'模拟结局 · 已被骗', title:'你追问了，还是被骗了。',
      copy:'对方补充了“妈妈住院、急着缴费”的细节。你信了，随后转出 8,000 元，对方却就此失联。直到拨通真正阿杰的电话，你才知道他根本没有借钱。',
      warning:'解释听起来合理，却仍是同一个骗子编的。'
    },
    callback: {
      state:'safe', label:'模拟结局 · 识破骗局', title:'恭喜你，这次没有被骗。',
      copy:'你拨打了通讯录里阿杰原来的号码。他告诉你：“我没有借钱，我妈也没有住院。”你没有转账，8,000 元还在自己手里。',
      warning:'这通打给原号码的电话，截断了骗局。'
    },
    hang: {
      state:'neutral', label:'模拟通话 · 已结束', title:'通话结束，确认还没有结束。',
      copy:'视频里的熟悉感，会不会让我们忽略付款理由与收款账户？接下来，从一个真实发生的案件看起。', warning:''
    }
  };

  function finishCall(choice) {
    clearCall();
    $('#call-options').hidden = true;
    $('#call-status').hidden = true;
    $('.call-top').inert = true;
    $('.call-controls').inert = true;
    const outcome = outcomes[choice];
    $('#call-response').dataset.outcome = outcome.state;
    $('#response-state').textContent = outcome.label;
    $('#response-title').textContent = outcome.title;
    $('#response-copy').textContent = outcome.copy;
    $('#response-warning').textContent = outcome.warning;
    $('#response-warning').hidden = !outcome.warning;
    $('#call-response').hidden = false;
    $('#enter-story').focus();
  }

  $('#start-call').addEventListener('click', openCall);
  $('#replay-call')?.addEventListener('click', openCall);
  // A touch produces the same click event; controls keep their own actions.
  $('.call-shell').addEventListener('click', event => {
    if (!event.target.closest('button')) showCallOptions();
  });
  $('#close-call').addEventListener('click', closeCall);
  $('#hang-call').addEventListener('click', () => finishCall('hang'));
  $('#repeat-speech').addEventListener('click', connectCall);
  $('#try-again').addEventListener('click', () => {
    connectCall();
    $('#close-call').focus();
  });
  $('#enter-story').addEventListener('click', () => {
    closeCall();
    location.hash = 'opening';
  });
  dialog.querySelectorAll('[data-choice]').forEach(button => {
    button.addEventListener('click', () => finishCall(button.dataset.choice));
  });
  dialog.addEventListener('cancel', event => {
    event.preventDefault();
    closeCall();
  });
  dialog.addEventListener('close', () => {
    clearCall();
    document.body.style.overflow = previousOverflow;
  });
  $('#toggle-voice').addEventListener('click', () => {
    if (!('speechSynthesis' in window)) {
      $('#call-status').textContent = '当前浏览器不支持设备朗读，可阅读字幕。';
      $('#call-status').hidden = false;
      call.timers.push(setTimeout(() => $('#call-status').hidden = true, 3000));
      return;
    }
    call.voice = !call.voice;
    $('#toggle-voice').setAttribute('aria-pressed', String(call.voice));
    $('#toggle-voice').setAttribute('aria-label', call.voice ? '关闭设备朗读' : '开启设备朗读');
    $('#toggle-voice span').textContent = call.voice ? '朗读开' : '朗读关';
    if (call.voice && call.running) readSpeech();
    else speechSynthesis.cancel();
  });
})();
