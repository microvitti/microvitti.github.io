// micromina — la luz que canta.
// En el portfolio, los brillos (.light: las manos de la portada y las de las chicas) suenan al pasar el ratón.
// La música se genera aquí mismo con Web Audio: un pad lento, campanitas y mucha reverb.
(() => {
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);
  const CHORDS = [
    [53, 57, 60, 64, 67], // fa maj9
    [50, 57, 60, 64, 69], // re m9
    [48, 55, 59, 64, 67], // do maj7
    [46, 53, 57, 62, 65], // si♭ maj7
  ];
  const VOLUME = .55;

  let ctx, master, bus, voices = [], chord = 0, playing = false, bellTimer, chordTimer, sleepTimer;

  // reverb larga hecha con ruido que se apaga
  function impulse(seconds) {
    const len = ctx.sampleRate * seconds, buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
    }
    return buf;
  }

  function setup() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    bus = ctx.createGain();
    const dry = ctx.createGain(), wet = ctx.createGain(), verb = ctx.createConvolver();
    dry.gain.value = .3;
    wet.gain.value = .9;
    verb.buffer = impulse(6);
    bus.connect(dry).connect(master);
    bus.connect(verb).connect(wet).connect(master);

    // pad: cada nota son dos osciladores un poco desafinados, por un filtro que respira
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1100;
    filter.Q.value = .6;
    const lfo = ctx.createOscillator(), lfoDepth = ctx.createGain();
    lfo.frequency.value = .07;
    lfoDepth.gain.value = 600;
    lfo.connect(lfoDepth).connect(filter.frequency);
    lfo.start();
    filter.connect(bus);

    voices = CHORDS[0].map(m => {
      const g = ctx.createGain();
      g.gain.value = .045;
      g.connect(filter);
      const oscs = [['sine', -7], ['triangle', 7]].map(([type, cents]) => {
        const o = ctx.createOscillator();
        o.type = type;
        o.frequency.value = hz(m);
        o.detune.value = cents;
        o.connect(g);
        o.start();
        return o;
      });
      return oscs;
    });

    // ecos para las campanitas
    const delay = ctx.createDelay(2), feedback = ctx.createGain();
    delay.delayTime.value = .48;
    feedback.gain.value = .42;
    delay.connect(feedback).connect(delay);
    delay.connect(bus);
    bus.delay = delay;
  }

  function nextChord() {
    chord = (chord + 1) % CHORDS.length;
    const t = ctx.currentTime;
    CHORDS[chord].forEach((m, i) => voices[i].forEach(o => o.frequency.setTargetAtTime(hz(m), t, 1.4)));
  }

  function bell() {
    const notes = CHORDS[chord];
    const m = notes[Math.floor(Math.random() * notes.length)] + (Math.random() < .5 ? 24 : 12);
    const t = ctx.currentTime, g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(.06, t + .015);
    g.gain.exponentialRampToValueAtTime(.0001, t + 3.5);
    g.connect(bus);
    g.connect(bus.delay);
    [[1, 1], [2.76, .25]].forEach(([ratio, level]) => {
      const o = ctx.createOscillator(), og = ctx.createGain();
      o.frequency.value = hz(m) * ratio;
      og.gain.value = level;
      o.connect(og).connect(g);
      o.start(t);
      o.stop(t + 3.6);
    });
    bellTimer = setTimeout(bell, 700 + Math.random() * 1900);
  }

  // las luces encendidas ahora mismo: la música suena mientras haya alguna
  const lit = new Set();

  function wake(light) {
    if (!ctx) setup();
    clearTimeout(sleepTimer);
    ctx.resume().then(() => document.querySelectorAll('.light').forEach(l => l.classList.remove('needs-touch')));
    // el navegador no deja sonar nada hasta el primer clic o toque en la página
    if (ctx.state !== 'running' && light) light.classList.add('needs-touch');
  }

  function start(light) {
    wake(light);
    lit.add(light);
    light.classList.add('on');
    light.setAttribute('aria-pressed', 'true');
    if (playing) return;
    playing = true;
    const t = ctx.currentTime;
    master.gain.cancelScheduledValues(t);
    master.gain.setValueAtTime(master.gain.value, t);
    master.gain.linearRampToValueAtTime(VOLUME, t + 2.5);
    bellTimer = setTimeout(bell, 600);
    chordTimer = setInterval(nextChord, 7000);
  }

  function stop(light) {
    lit.delete(light);
    light.classList.remove('on', 'needs-touch');
    light.setAttribute('aria-pressed', 'false');
    if (!playing || lit.size) return;
    playing = false;
    clearTimeout(bellTimer);
    clearInterval(chordTimer);
    const t = ctx.currentTime;
    master.gain.cancelScheduledValues(t);
    master.gain.setValueAtTime(master.gain.value, t);
    master.gain.linearRampToValueAtTime(0, t + 3);
    sleepTimer = setTimeout(() => ctx.suspend(), 9000);
  }

  // los eventos se escuchan en todo el documento, así sirven también para las luces de las páginas que llegan
  // después (el sitio cambia de página sin recargar, assets/portfolio-ui.js)
  const lightOf = e => e.target.closest && e.target.closest('.light');
  const moved = (e, light) => light.contains(e.relatedTarget); // entrar o salir de algo de dentro de la misma luz
  document.addEventListener('pointerover', e => {
    const light = lightOf(e);
    if (light && e.pointerType === 'mouse' && !moved(e, light)) start(light);
  });
  document.addEventListener('pointerout', e => {
    const light = lightOf(e);
    if (light && e.pointerType === 'mouse' && !moved(e, light)) stop(light);
  });
  document.addEventListener('focusin', e => { const light = lightOf(e); if (light) start(light); });
  document.addEventListener('focusout', e => { const light = lightOf(e); if (light) stop(light); });
  // con ratón, el clic solo desbloquea; en el móvil no hay hover: tocar la luz la enciende y la apaga
  let lastPointer = 'mouse';
  document.addEventListener('pointerdown', e => { if (lightOf(e)) lastPointer = e.pointerType; });
  document.addEventListener('click', e => {
    const light = lightOf(e);
    if (!light) return;
    if (lastPointer === 'mouse') start(light);
    else lit.has(light) ? stop(light) : start(light);
  });
  // al cambiar de página se apagan las luces que quedaban encendidas
  addEventListener('folio:leave', () => [...lit].forEach(stop));
  // el primer clic en cualquier sitio desbloquea el audio, así luego basta con pasar el ratón
  document.addEventListener('pointerdown', () => wake(), { once: true });
})();
