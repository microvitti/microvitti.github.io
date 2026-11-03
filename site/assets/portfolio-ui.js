// micromina — portfolio: lo que aparece al hacer scroll, la foto que sigue al ratón en el índice, las chicas que hablan,
// la pantalla del principio y la cara del final.
// el sitio cambia de página sin recargar (se trae la página nueva y se cambia el contenido).
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wait = ms => new Promise(done => setTimeout(done, ms));
  const pause = c => /[,.?!]/.test(c);
  // las bocas de vídeo pintadas en un canvas: algunos navegadores (safari en el iphone, sobre todo) a veces dan un
  // fotograma que aún no está decodificado, y sale ruido de colores. un trozo de cara de verdad es suave y no es negro:
  // si lo que llega no lo es, no se pinta y se queda la boca de la foto
  const realFrame = (p, w, h) => {
    let diff = 0, lum = 0, n = 0;
    for (let y = Math.round(h * .3); y < h * .7; y += 3) for (let x = Math.round(w * .3); x < w * .7 - 1; x += 3) {
      const i = (y * w + x) * 4;
      diff += Math.abs(p[i] - p[i + 4]) + Math.abs(p[i + 1] - p[i + 5]) + Math.abs(p[i + 2] - p[i + 6]);
      lum += p[i] + p[i + 1] + p[i + 2];
      n++;
    }
    return n > 0 && diff / n < 36 && lum / n > 90;
  };
  // el siguiente repintado de la pantalla (los vídeos son de 1 px e invisibles: el navegador casi no avisa de sus
  // fotogramas, así que se mira en cada repintado si el vídeo ha avanzado)
  const nextFrame = (video, fn) => requestAnimationFrame(fn);

  // ───────── la foto que sigue al ratón (índice y «next») ─────────
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  let x = 0, y = 0, tx = 0, ty = 0, raf = 0, shown = false;
  const preview = () => document.querySelector('.preview');
  const place = () => { const p = preview(); if (p) p.style.transform = `translate3d(${x}px, ${y}px, 0) translate(28px, -50%)`; };
  const follow = () => {
    x += (tx - x) * .16;
    y += (ty - y) * .16;
    place();
    raf = Math.abs(tx - x) + Math.abs(ty - y) > .4 ? requestAnimationFrame(follow) : 0;
  };
  if (fine) addEventListener('pointermove', e => {
    tx = e.clientX;
    ty = e.clientY;
    if (shown && !raf && !reduce) raf = requestAnimationFrame(follow);
    if (reduce) { x = tx; y = ty; place(); }
  }, { passive: true });

  // ───────── creative process: el gabinete de curiosidades ─────────
  // el cuadro de diálogo está siempre abajo. al entrar explica dónde estás; después, tocar un objeto (o moverse con las
  // flechas y elegir con enter) abre su frase, que se escribe letra a letra, con «look closer» o «leave it».
  // cuando no hay nada que decir, invita a mirar alrededor.
  // los objetos ya mirados se cuentan arriba a la izquierda, como en un juego
  // ───────── los sonidos del gabinete ─────────
  // al pasar el cursor por encima de un objeto suena algo suyo. no son grabaciones: cada sonido se fabrica en el
  // momento con el audio del navegador (ruido filtrado y tonos que se apagan), así no pesan nada.
  // el navegador solo deja sonar después de un primer clic o tecla en el sitio
  const sfx = (() => {
    let ac = null, out = null, hiss = null;
    const rnd = (a, b) => a + Math.random() * (b - a);
    const start = () => {
      if (!ac) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        ac = new AC();
        out = ac.createGain();
        out.gain.value = .55;
        out.connect(ac.destination);
        hiss = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
        const d = hiss.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      }
      if (ac.state === 'suspended') ac.resume();
      return ac;
    };
    ['pointerdown', 'keydown'].forEach(e => addEventListener(e, start, { passive: true }));
    // una envolvente: sube en «a» segundos hasta «peak» y se apaga en «d»
    const env = (t, a, peak, d) => {
      const g = ac.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(peak, t + a);
      g.gain.exponentialRampToValueAtTime(.0001, t + a + d);
      return g;
    };
    // ruido filtrado (golpes, chasquidos, siseos) y tonos (cristal, metal, zumbidos)
    const noise = (t, { type = 'bandpass', f = 1000, f2, q = 1, peak = .3, a = .002, d = .1, to = out } = {}) => {
      const src = ac.createBufferSource(), filt = ac.createBiquadFilter(), g = env(t, a, peak, d);
      src.buffer = hiss;
      src.loop = true;
      filt.type = type;
      filt.frequency.setValueAtTime(f, t);
      if (f2) filt.frequency.exponentialRampToValueAtTime(f2, t + a + d);
      filt.Q.value = q;
      src.connect(filt).connect(g).connect(to);
      src.start(t, rnd(0, 1.5));
      src.stop(t + a + d + .05);
    };
    const tone = (t, f, { type = 'sine', f2, peak = .2, a = .002, d = .3, to = out } = {}) => {
      const o = ac.createOscillator(), g = env(t, a, peak, d);
      o.type = type;
      o.frequency.setValueAtTime(f, t);
      if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + a + d);
      o.connect(g).connect(to);
      o.start(t);
      o.stop(t + a + d + .05);
    };
    // cristal: unos parciales que no son armónicos, como una copa
    const glassy = (t, f, peak, d) => [[1, 1], [2.32, .5], [4.25, .28], [6.63, .14]].forEach(([m, v]) => tone(t, f * m, { peak: peak * v, d: d / Math.sqrt(m) }));
    const SOUNDS = {
      // madera que se apoya: un golpe sordo y un segundo más pequeño, cuando se asienta
      wood(t) {
        tone(t, 150, { f2: 85, peak: .55, d: .22 });
        tone(t, 330, { f2: 260, peak: .16, d: .07 });
        noise(t, { f: 900, q: .7, peak: .45, d: .06 });
        tone(t + .11, 170, { f2: 110, peak: .2, d: .12 });
        noise(t + .11, { type: 'lowpass', f: 700, peak: .2, d: .04 });
      },
      // algo que arde: un siseo suave y chasquidos sueltos
      burn(t) {
        noise(t, { f: 2600, q: .4, peak: .07, a: .25, d: 1.7 });
        noise(t, { type: 'lowpass', f: 400, peak: .06, a: .3, d: 1.4 });
        for (let i = 0; i < 26; i++) noise(t + rnd(0, 1.9) ** 1.2, { type: 'highpass', f: rnd(1500, 4500), peak: rnd(.12, .45), d: rnd(.006, .03) });
      },
      // bebida con gas: burbujitas que estallan, cada una sube un poco de tono, y el siseo del gas
      fizz(t) {
        noise(t, { type: 'highpass', f: 6500, peak: .035, a: .05, d: 1.6 });
        for (let i = 0; i < 70; i++) {
          const s = t + rnd(0, 1.7) ** 1.3, f = rnd(1800, 6000);
          tone(s, f, { f2: f * 1.4, peak: rnd(.02, .07), d: rnd(.012, .035) });
        }
      },
      // metal que tintinea: la tapa de lata, tres o cuatro golpecitos que van perdiendo fuerza
      clink(t) {
        [0, .13, .22, .4].forEach((s, i) => {
          const f = rnd(1150, 1650), v = .16 / (i + 1);
          [[1, 1], [2.76, .6], [5.4, .35], [8.93, .2]].forEach(([m, k]) => tone(t + s, f * m, { peak: v * k, d: .5 / Math.sqrt(m) }));
          noise(t + s, { type: 'highpass', f: 5000, peak: v * 1.5, d: .012 });
        });
      },
      // dedos en el teclado: teclas a ritmo irregular, de vez en cuando la barra espaciadora
      keys(t) {
        let s = t;
        for (let i = 0; i < 15; i++) {
          const space = i % 6 === 5;
          noise(s, { f: space ? 1400 : rnd(2600, 4200), q: 2, peak: space ? .3 : rnd(.18, .3), d: space ? .035 : .018 });
          tone(s, space ? 120 : 190, { peak: .06, d: .02 });
          s += rnd(.07, .17);
        }
      },
      // un disco que gira en un lector de cd: el clic de la bandeja, el motor que coge velocidad y el zumbido
      cd(t) {
        noise(t, { type: 'highpass', f: 3000, peak: .3, d: .012 });
        tone(t + .05, 3200, { peak: .05, d: .03 });
        const o = ac.createOscillator(), lp = ac.createBiquadFilter(), g = env(t + .1, .5, .07, 1.7);
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(30, t + .1);
        o.frequency.exponentialRampToValueAtTime(190, t + 1.1);
        lp.type = 'lowpass';
        lp.frequency.value = 900;
        o.connect(lp).connect(g).connect(out);
        o.start(t + .1);
        o.stop(t + 2.4);
        noise(t + .1, { f: 500, f2: 2600, q: 5, peak: .05, a: .5, d: 1.6 });
        tone(t + .3, 4000, { f2: 7000, peak: .008, a: .6, d: 1.2 });
      },
      // cristal que se rompe: el golpe, el estallido y muchos trocitos que caen y tintinean
      shatter(t) {
        noise(t, { type: 'highpass', f: 1800, peak: .7, d: .15 });
        noise(t, { f: 5000, q: .6, peak: .4, d: .35 });
        glassy(t, 2600, .12, .7);
        for (let i = 0; i < 34; i++) {
          const s = t + .03 + rnd(0, 1) ** 1.6;
          glassy(s, rnd(2500, 7500), rnd(.015, .06), rnd(.08, .3));
          noise(s, { type: 'highpass', f: 6000, peak: rnd(.03, .1), d: .01 });
        }
      },
      // cristal que se agrieta: un crujido seco y unos tics, sin llegar a romperse
      crack(t) {
        noise(t, { type: 'highpass', f: 2500, peak: .55, d: .025 });
        tone(t, 3400, { f2: 2900, peak: .05, d: .5 });
        [.06, .13, .17, .31].forEach(s => noise(t + s, { type: 'highpass', f: rnd(3000, 6000), peak: rnd(.1, .25), d: rnd(.006, .015) }));
        noise(t + .02, { f: 4500, q: 8, peak: .04, a: .05, d: .3 });
      },
      // una tapa de cristal que se abre: el roce del cristal contra cristal y un «tin» al soltarla
      lid(t) {
        noise(t, { f: 2800, f2: 5200, q: 7, peak: .06, a: .06, d: .32 });
        tone(t, 1900, { f2: 2300, peak: .015, a: .06, d: .3 });
        glassy(t + .36, 2250, .1, 1.4);
      },
      // chispas que vibran: destellos agudos y un brillo que tiembla
      sparkle(t) {
        const trem = ac.createGain(), lfo = ac.createOscillator(), depth = ac.createGain();
        trem.gain.value = .5;
        lfo.frequency.value = 13;
        depth.gain.value = .5;
        lfo.connect(depth).connect(trem.gain);
        trem.connect(out);
        lfo.start(t);
        lfo.stop(t + 1.9);
        tone(t, 5200, { peak: .03, a: .25, d: 1.3, to: trem });
        tone(t, 5236, { peak: .03, a: .25, d: 1.3, to: trem });
        for (let i = 0; i < 26; i++) {
          const s = t + rnd(0, 1.5), f = rnd(3200, 9500);
          tone(s, f, { peak: rnd(.02, .05), d: rnd(.1, .35), to: trem });
        }
        noise(t, { type: 'highpass', f: 8000, peak: .02, a: .2, d: 1.2, to: trem });
      },
      // las cartas del tarot (assets/minigames.js): barajar, una carta que se desliza sobre la mesa, una que se gira
      shuffle(t) {
        for (let i = 0; i < 22; i++) noise(t + i * .032 + rnd(0, .01), { f: rnd(2400, 3600), q: 1.5, peak: rnd(.08, .16), d: .014 });
        noise(t + .74, { f: 1200, q: .8, peak: .18, d: .05 });
      },
      deal(t) {
        noise(t, { f: 2600, f2: 900, q: .9, peak: .16, a: .02, d: .16 });
        noise(t + .17, { type: 'lowpass', f: 900, peak: .14, d: .03 });
      },
      flip(t) {
        noise(t, { f: 1800, f2: 3800, q: 1.2, peak: .1, a: .03, d: .1 });
        noise(t + .14, { type: 'highpass', f: 2200, peak: .22, d: .02 });
      },
      // una hoja de la tesis que se pasa, al ritmo del giro (1,15 s): la hoja que se despega, blanda y grave; el roce del
      // papel en el aire, que no es un siseo liso sino muchos rocecitos seguidos, más fuertes a mitad del giro; y el
      // soplo y el toque suave al posarse. sin agudos, que es lo que lo hacía de plástico
      page(t) {
        noise(t, { type: 'lowpass', f: 650, peak: .03, a: .05, d: .18 });
        noise(t + .08, { f: 1100, f2: 2200, q: .5, peak: .022, a: .32, d: .5 });
        for (let i = 0; i < 48; i++) {
          const u = Math.random();
          noise(t + .1 + u * .8, { f: rnd(1300, 3400), q: rnd(.8, 1.5), peak: .02 * Math.sin(Math.PI * u) * rnd(.4, 1), a: .005, d: rnd(.025, .06) });
        }
        noise(t + .93, { type: 'lowpass', f: 900, f2: 280, peak: .032, a: .012, d: .13 });
        tone(t + .95, 110, { f2: 70, peak: .012, d: .08 });
      },
      // «start»: un clic pequeño y un poco metálico, como un interruptor de latón
      click(t) {
        noise(t, { type: 'highpass', f: 5500, peak: .35, d: .008 });
        tone(t, 180, { f2: 120, peak: .12, d: .03 });
        [[1, 1], [2.76, .5], [5.4, .25]].forEach(([m, k]) => tone(t + .002, 2900 * m, { peak: .05 * k, d: .14 / Math.sqrt(m) }));
      },
      // las fusas de un gato: un ruido grave que late unas 25 veces por segundo, en dos respiraciones
      // (al coger aire más flojo y un poco más agudo, al soltarlo más fuerte)
      purr(t) {
        [[0, .85, .5, 27, 210], [.95, 1.05, 1, 24, 170]].forEach(([at, len, k, rate, f]) => {
          const t0 = t + at;
          const src = ac.createBufferSource(), filt = ac.createBiquadFilter(), am = ac.createGain(), lfo = ac.createOscillator(), depth = ac.createGain();
          src.buffer = hiss;
          src.loop = true;
          filt.type = 'lowpass';
          filt.frequency.value = f;
          filt.Q.value = 2.5;
          am.gain.value = .5;
          lfo.frequency.value = rate;
          depth.gain.value = .5;
          lfo.connect(depth).connect(am.gain);
          const g = ac.createGain();
          g.gain.setValueAtTime(0, t0);
          g.gain.linearRampToValueAtTime(.9 * k, t0 + .18);
          g.gain.setValueAtTime(.9 * k, t0 + len - .25);
          g.gain.linearRampToValueAtTime(0, t0 + len);
          src.connect(filt).connect(am).connect(g).connect(out);
          src.start(t0, rnd(0, 1));
          lfo.start(t0);
          src.stop(t0 + len + .05);
          lfo.stop(t0 + len + .05);
          tone(t0, rate * 2, { peak: .05 * k, a: .18, d: len }); // el cuerpo de la vibración
        });
      },
    };
    const last = new Map();
    // «again» para los que se repiten seguidos a propósito (las cartas que se reparten una tras otra)
    return (name, again) => {
      if (!SOUNDS[name] || !start() || ac.state !== 'running') return;
      // que no se repita si se pasa por encima varias veces seguidas
      const now = ac.currentTime;
      if (!again && now - (last.get(name) ?? -9) < 1.2) return;
      last.set(name, now);
      SOUNDS[name](now + .01);
    };
  })();
  window.folioSfx = sfx; // para los mini juegos

  // su nombre sobre las manos: cambia de letra muy deprisa, al azar y nunca dos veces la misma seguida.
  // con movimiento reducido se queda en la ballet
  function nameFlicker(name) {
    const forms = [...name.querySelectorAll('.nf')];
    if (reduce || forms.length < 2) return;
    let now = 0;
    const timer = setInterval(() => {
      if (!name.isConnected) return clearInterval(timer);
      let k = Math.floor(Math.random() * (forms.length - 1));
      if (k >= now) k++;
      forms[now].classList.remove('on');
      forms[k].classList.add('on');
      now = k;
    }, 170);
  }

  // el humo de la salvia: sube desde la punta encendida, se ondula y se deshace antes de llegar a la balda de arriba.
  // no son partículas: en cada momento la forma de cada hilo sale de unas ondas que suben con el tiempo
  function sageSmoke(cabinet) {
    const cv = cabinet.querySelector('.smoke');
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const W = cv.width, H = cv.height;
    const [sx, sy] = cv.dataset.from.split(',').map(Number); // la punta de la salvia, en proporción del lienzo
    const X = sx * W, Y = sy * H, top = H * .04;
    // tres hilos, cada uno con su ritmo
    const strands = [[1, 0, 1], [.7, 2.1, .8], [.5, 4.3, 1.25]];
    const draw = t => {
      ctx.clearRect(0, 0, W, H);
      strands.forEach(([strength, ph, sp]) => {
        let px = X, py = Y;
        for (let y = Y; y > top; y -= 2) {
          const h = (Y - y) / (Y - top); // 0 en la punta, 1 arriba
          const k = y / H * 14;
          const sway = (Math.sin(k * 1.3 - t * 1.1 * sp + ph) * .6 + Math.sin(k * 2.7 - t * 1.9 * sp + ph * 1.7) * .3 + Math.sin(k * .6 - t * .4 + ph) * .5) * W * .22 * h * h
            + Math.sin(t * .23 + ph) * W * .05 * h;
          const x = X + sway - h * W * .06;
          // se rompe en jirones que suben
          const wisp = .5 + .5 * Math.sin(k * 1.9 - t * 2.4 * sp + ph * 3);
          const a = strength * (1 - h) ** 1.4 * Math.min(1, h * 12) * (.35 + .65 * wisp) * .5;
          ctx.strokeStyle = `rgba(252, 250, 247, ${a.toFixed(3)})`;
          ctx.lineWidth = W * (.012 + .07 * h * h);
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(x, y);
          ctx.stroke();
          px = x;
          py = y;
        }
      });
    };
    ctx.lineCap = 'round';
    if (reduce) return draw(8);
    const frame = now => {
      if (!cv.isConnected) return;
      draw(now / 1000);
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  let game = null; // el gabinete de la página que se está viendo, para el teclado
  function cabinetGame(cabinet) {
    const curios = [...cabinet.querySelectorAll('.curio')];
    const box = cabinet.querySelector('.game-box');
    const text = box.querySelector('.game-text');
    const choices = box.querySelector('.game-choices');
    const count = cabinet.querySelector('.items-n');
    let seen = new Set();
    try { seen = new Set(JSON.parse(sessionStorage.getItem('curios-seen') || '[]')); } catch (e) {}
    const tally = () => {
      // solo cuentan los objetos que hay ahora en la estantería (de otras visitas pueden quedar nombres viejos)
      count.textContent = curios.filter(c => seen.has(c.dataset.name)).length;
      curios.forEach(c => c.classList.toggle('seen', seen.has(c.dataset.name)));
    };
    let here = -1, turn = 0, options = [], sel = 0;
    // al llegar a un objeto nuevo (con el cursor o con las flechas) suena el suyo
    const point = i => {
      const was = here;
      here = (i + curios.length) % curios.length;
      if (here !== was) sfx(curios[here].dataset.sound);
      curios.forEach((c, k) => c.classList.toggle('here', k === here));
    };
    const pick = k => {
      if (!options.length) return;
      sel = (k + options.length) % options.length;
      [...choices.children].forEach((b, j) => b.classList.toggle('sel', j === sel));
    };
    // escribe la frase letra a letra y, al terminar, enseña las opciones: [texto, qué hace]
    const talk = async (line, opts) => {
      const mine = ++turn;
      choices.replaceChildren();
      options = [];
      for (let i = 1; i <= line.length; i++) {
        if (mine !== turn) return;
        text.textContent = line.slice(0, i);
        await wait(pause(line[i - 1]) ? 200 : 28);
      }
      if (mine !== turn) return;
      options = opts;
      opts.forEach(([label, act], j) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = label;
        b.addEventListener('click', act);
        b.addEventListener('pointerenter', () => pick(j));
        choices.append(b);
      });
      pick(0);
    };
    // el primer plano: algunos objetos (la cornice con juanki y marcelo) se acercan al pulsar «look closer».
    // la imagen sale del sitio del objeto en la estantería y crece hasta el centro; al cerrar vuelve a su sitio
    const close = cabinet.querySelector('.closeup');
    const pic = close.querySelector('img');
    let near = null; // el objeto que está en primer plano
    const fromShelf = () => {
      const a = near.getBoundingClientRect(), b = pic.getBoundingClientRect();
      return `translate(${a.left - b.left}px, ${a.top - b.top}px) scale(${a.width / b.width}, ${a.height / b.height})`;
    };
    const approach = async c => {
      near = c;
      pic.src = c.dataset.close;
      try { await pic.decode(); } catch (e) {}
      if (near !== c) return;
      close.hidden = false;
      pic.style.transition = 'none';
      pic.style.transform = fromShelf();
      void pic.offsetWidth;
      pic.style.removeProperty('transition');
      pic.style.removeProperty('transform');
      close.classList.add('on');
      await wait(reduce ? 0 : 950);
    };
    const leave = () => {
      if (!near) return;
      close.classList.remove('on');
      pic.style.transform = fromShelf();
      near = null;
      const shut = () => { if (!near) close.hidden = true; };
      if (reduce) shut();
      else setTimeout(shut, 800);
    };
    // sin nada que decir: la invitación a mirar, ya escrita, sin opciones (y si había algo en primer plano, vuelve)
    const idle = () => {
      turn++;
      options = [];
      choices.replaceChildren();
      text.textContent = cabinet.dataset.idle;
      leave();
    };
    // «look closer» con primer plano: se acerca y, si trae pregunta (los gatos: «would you like to pet them?»),
    // la hace: «yes» lleva al mini juego, «no» lo deja todo como estaba
    const closer = async c => {
      turn++;
      options = [];
      choices.replaceChildren();
      await approach(c);
      if (near !== c) return;
      if (c.dataset.ask) talk(c.dataset.ask, [['yes', () => go(new URL(c.dataset.go, location.href).href, true)], ['no', idle]]);
      else talk(c.dataset.closeLine || c.dataset.line, [['put it back', idle]]);
    };
    const inspect = i => {
      point(i);
      const c = curios[here];
      seen.add(c.dataset.name);
      try { sessionStorage.setItem('curios-seen', JSON.stringify([...seen])); } catch (e) {}
      tally();
      leave();
      // «look closer» solo si hay primer plano; si trae un enlace (el mac: la lista de vídeos), se abre aparte
      talk(c.dataset.line, [
        ...(c.dataset.close ? [['look closer', () => closer(c)]] : []),
        ...(c.dataset.link ? [[c.dataset.linkLabel, () => { open(c.dataset.link, '_blank', 'noopener'); idle() }]] : []),
        ['leave it', idle],
      ]);
    };
    curios.forEach((c, i) => {
      c.addEventListener('click', () => inspect(i));
      c.addEventListener('pointerenter', () => point(i));
    });
    tally();
    wait(reduce ? 0 : 700).then(() => talk(cabinet.dataset.welcome, [['look around', idle]]));
    game = {
      cabinet,
      key(e) {
        const k = e.key;
        // enter o espacio sobre un botón del gabinete ya hacen clic solos
        if ((k === 'Enter' || k === ' ') && e.target.closest('.cabinet button')) return;
        if (options.length && (k === 'ArrowLeft' || k === 'ArrowRight')) pick(sel + (k === 'ArrowRight' ? 1 : -1));
        else if (k === 'ArrowLeft' || k === 'ArrowRight') point(here < 0 ? 0 : here + (k === 'ArrowRight' ? 1 : -1));
        else if (k === 'ArrowUp' || k === 'ArrowDown') point(here < 0 ? 0 : here + (k === 'ArrowDown' ? 3 : -3));
        else if (k === 'Enter' || k === ' ') {
          if (options.length) options[sel][1]();
          else inspect(here < 0 ? 0 : here);
        } else if (k === 'Escape') idle();
        else return;
        e.preventDefault();
      },
    };
  }
  addEventListener('keydown', e => {
    if (!game || !game.cabinet.isConnected || e.target.closest?.('input, textarea')) return;
    game.key(e);
  });

  // ───────── la tesis: el libro que se hojea ─────────
  // las dos mitades enseñan la doble página de ahora, con las sombras de una revista abierta (en el css). al pasar,
  // la hoja que gira es de papel: está hecha de tiras finas, cada una un poco doblada respecto a la anterior, así se
  // curva mientras gira sobre el lomo y se aplana al posarse. por delante lleva la media página que se va, por detrás
  // la que llega; cada tira se oscurece o se aclara según cómo le da la luz, y la hoja echa sombra sobre las páginas
  // de debajo. se pasa tocando una mitad, arrastrando la hoja con el dedo o el ratón (se suelta y termina sola, o
  // vuelve si no se ha llevado bastante), con las flechas de abajo o con las del teclado. empieza en data-at
  let book = null;
  function flipBook(el) {
    const n = +el.dataset.n, STRIPS = 22, TIME = 1150;
    const src = i => `${el.dataset.src}${String(i).padStart(2, '0')}.jpg?v=${el.dataset.v}`;
    const stage = el.querySelector('.book-stage');
    const [l, r] = el.querySelectorAll('.book-half img');
    const [castL, castR] = el.querySelectorAll('.book-cast');
    const count = el.querySelector('.book-count');
    const prev = el.querySelector('.book-prev'), next = el.querySelector('.book-next');
    let at = +el.dataset.at || 1, flip = null, queued = 0;
    const show = () => {
      count.textContent = `${at} / ${n}`;
      prev.disabled = at === 1;
      next.disabled = at === n;
      [at - 1, at + 1].forEach(i => { if (i >= 1 && i <= n) new Image().src = src(i); });
    };
    const ease = p => p < .5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2;
    const easeOut = p => 1 - (1 - p) ** 3;

    // la hoja: d = 1 se va la mitad derecha hacia la izquierda, d = -1 al revés
    const begin = d => {
      const to = at + d;
      if (to < 1 || to > n) return null;
      const half = stage.clientWidth / 2, h = stage.clientHeight, sw = half / STRIPS;
      const size = `${half}px ${h}px, ${half}px ${h}px, ${half}px ${h}px, ${half * 2}px ${h}px`; // --shade son tres capas, y la foto
      const face = (side, img, x) => {
        const f = document.createElement('div');
        f.className = `bs-${side}`;
        // la sombra de la página (la misma que en el css) multiplicada sobre la foto, y una capa de luz encima
        const page = (d > 0) === (side === 'f') ? 'r' : 'l';
        f.style.cssText = `background-image:var(--shade-${page}),url("${src(img)}");background-size:${size};background-position:${`${page === 'r' ? -(x - half) : -x}px 0,`.repeat(3)}${-x}px 0`;
        f.append(document.createElement('i'));
        return f;
      };
      const strips = [];
      let parent = stage;
      for (let i = 0; i < STRIPS; i++) {
        const s = document.createElement('div');
        s.className = i ? 'bs' : 'bs book-leaf';
        const front = d > 0 ? half + i * sw : half - (i + 1) * sw; // dónde cae la tira en la doble página de ahora
        const back = d > 0 ? half - (i + 1) * sw : half + i * sw; //  y en la que llega
        s.style.width = `${sw + .7}px`;
        s.style.left = `${i ? (d > 0 ? sw : -sw) : (d > 0 ? half : half - sw)}px`;
        s.style.transformOrigin = `${d > 0 ? 0 : sw}px 50%`;
        const ff = face('f', at, front), bf = face('b', to, back);
        s.append(ff, bf);
        parent.append(s);
        strips.push({ s, fi: ff.firstChild, bi: bf.firstChild });
        parent = s;
      }
      (d > 0 ? r : l).src = src(to);
      sfx('page', true);
      return { d, to, strips, p: 0, half };
    };
    // cómo está la hoja con el avance p (0 = sin tocar, 1 = ya del otro lado)
    const draw = (f, p) => {
      f.p = p;
      const turned = 180 * p, bend = 62 / STRIPS * Math.sin(Math.PI * p) * (1 + .6 * (1 - p)); // al principio se curva más
      // lo girada que está cada tira de verdad: la primera gira sobre el lomo; las demás se quedan un poco atrás, que
      // es lo que curva la hoja
      const angles = f.strips.map((_, i) => turned - i * bend);
      // la luz se calcula en los bordes entre tiras (la media de las dos) y dentro de cada tira se funde de un borde al
      // otro, así no se ven columnas: de frente a la luz, clara; de canto, oscura; y un brillo cuando se levanta
      const edges = angles.map((a, i) => i ? (angles[i - 1] + a) / 2 : a).concat(angles[angles.length - 1]);
      const light = a => {
        const c = Math.cos(a * Math.PI / 180);
        return [.5 * (1 - Math.abs(c)) ** 1.3, .16 * Math.abs(Math.sin(a * Math.PI / 90)) ** 6];
      };
      const lit = edges.map(light);
      const out = f.d > 0 ? 'to right' : 'to left', back = f.d > 0 ? 'to left' : 'to right'; // del lomo hacia fuera
      const paint = (dir, [d0, s0], [d1, s1]) => `linear-gradient(${dir}, rgba(255,255,255,${s0.toFixed(3)}), rgba(255,255,255,${s1.toFixed(3)})), linear-gradient(${dir}, rgba(0,0,0,${d0.toFixed(3)}), rgba(0,0,0,${d1.toFixed(3)}))`;
      f.strips.forEach(({ s, fi, bi }, i) => {
        s.style.transform = `rotateY(${-f.d * (i ? -bend : turned)}deg)`;
        fi.style.background = paint(out, lit[i], lit[i + 1]);
        bi.style.background = paint(back, lit[i], lit[i + 1]);
      });
      // las sombras que echa: sobre la página que va a tapar y sobre la que deja ver
      const a = turned * Math.PI / 180, lift = Math.sin(a), reach = f.half * Math.abs(Math.cos(a));
      const toward = f.d > 0 ? castL : castR, away = f.d > 0 ? castR : castL;
      const dir = f.d > 0 ? 'to left' : 'to right', dir2 = f.d > 0 ? 'to right' : 'to left';
      toward.style.background = `linear-gradient(${dir}, rgba(0,0,0,.42), rgba(0,0,0,.12) ${Math.max(8, reach * .45)}px, transparent ${Math.max(16, reach)}px)`;
      toward.style.opacity = p > .5 ? (lift ** .7).toFixed(3) : 0;
      away.style.background = `linear-gradient(${dir2}, transparent ${reach * .85}px, rgba(0,0,0,.3) ${reach}px, transparent ${reach + 30 + lift * f.half * .45}px)`;
      away.style.opacity = p < .5 ? (lift ** .8).toFixed(3) : 0;
    };
    const end = (f, done) => {
      if (done) { at = f.to; (f.d > 0 ? l : r).src = src(at); }
      else (f.d > 0 ? r : l).src = src(at);
      // la foto de debajo ya está puesta antes de quitar la hoja, para que no parpadee
      let gone = false;
      const clear = () => {
        if (gone) return;
        gone = true;
        f.strips[0].s.remove();
        castL.style.opacity = castR.style.opacity = 0;
        flip = null;
        show();
        if (queued) { const d = queued; queued = 0; turn(d); }
      };
      requestAnimationFrame(clear);
      setTimeout(clear, 120);
    };
    // de p hasta target, con su curva; sin la pestaña a la vista no hay fotogramas, así que también hay reloj
    const play = (f, target, curve) => {
      const from = f.p, dur = TIME * Math.max(.35, Math.abs(target - from)), t0 = performance.now();
      const finish = () => {
        if (f.ended) return;
        f.ended = true;
        draw(f, target);
        end(f, target === 1);
      };
      const step = now => {
        if (f.ended) return;
        const k = Math.min(1, (now - t0) / dur);
        if (k < 1) { draw(f, from + (target - from) * curve(k)); requestAnimationFrame(step); }
        else finish();
      };
      requestAnimationFrame(step);
      setTimeout(finish, dur + 400);
    };
    const turn = d => {
      if (flip) { queued = d; return; }
      if (at + d < 1 || at + d > n) return;
      if (reduce) { at += d; l.src = r.src = src(at); show(); return; }
      const img = new Image();
      img.src = src(at + d);
      flip = 'wait';
      (img.decode ? img.decode() : Promise.resolve()).catch(() => {}).then(() => {
        flip = begin(d);
        draw(flip, 0);
        play(flip, 1, ease);
      });
    };
    prev.addEventListener('click', () => turn(-1));
    next.addEventListener('click', () => turn(1));

    // tocar o arrastrar
    let drag = null;
    stage.addEventListener('pointerdown', e => {
      if (flip || e.button) return;
      const box = stage.getBoundingClientRect();
      drag = { x: e.clientX, d: e.clientX > box.left + box.width / 2 ? 1 : -1, f: null, last: e.clientX, v: 0 };
      stage.setPointerCapture(e.pointerId);
    });
    stage.addEventListener('pointermove', e => {
      if (!drag || reduce) return;
      const dx = e.clientX - drag.x;
      drag.v = e.clientX - drag.last;
      drag.last = e.clientX;
      if (!drag.f) {
        if (Math.abs(dx) < 10 || Math.sign(dx) !== -drag.d || flip) return;
        drag.f = flip = begin(drag.d);
        if (!flip) { drag = null; return; }
      }
      draw(drag.f, Math.max(0, Math.min(1, -drag.d * dx / (drag.f.half * 1.7))));
    });
    const release = e => {
      if (!drag) return;
      const g = drag;
      drag = null;
      if (!g.f) { if (e.type === 'pointerup' && Math.abs(e.clientX - g.x) < 10) turn(g.d); return; }
      const fling = -g.d * g.v > 4, back = g.d * g.v > 4;
      play(g.f, !back && (fling || g.f.p > .3) ? 1 : 0, easeOut);
    };
    stage.addEventListener('pointerup', release);
    stage.addEventListener('pointercancel', release);
    show();
    book = { el, turn };
  }
  addEventListener('keydown', e => {
    if (!book || !book.el.isConnected || (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft')) return;
    const box = book.el.getBoundingClientRect();
    if (box.bottom < 0 || box.top > innerHeight) return;
    e.preventDefault();
    book.turn(e.key === 'ArrowRight' ? 1 : -1);
  });

  // escape cierra la pantalla del principio o la cara del final, la que esté
  let onEscape = null;
  // la cara del final solo sale al tocar «contact» en el menú: si se toca desde otra página, se apunta y sale al llegar
  let faceAsked = false, askFace = null;
  document.addEventListener('click', e => {
    if (!e.target.closest?.('a[href*="#contact"]')) return;
    faceAsked = true;
    askFace?.();
  }, true);
  addEventListener('keydown', e => { if (e.key === 'Escape' && onEscape) onEscape(e); });

  // ───────── lo que hay que preparar en cada página (al llegar y después de cada cambio de página) ─────────
  function setup() {
    game = null;
    book = null;
    const thesis = document.querySelector('.book');
    if (thesis) flipBook(thesis);
    const cabinet = document.querySelector('.cabinet');
    if (cabinet) { cabinetGame(cabinet); sageSmoke(cabinet); }
    const name = document.querySelector('.hands-name');
    if (name) nameFlicker(name);
    // el «holi,» de micromina hace lo mismo; sus letras se piden sólo cuando hacen falta
    const holi = document.querySelector('.mm-flick');
    if (holi) {
      if (!document.getElementById('mm-fonts')) {
        const l = document.createElement('link');
        l.id = 'mm-fonts';
        l.rel = 'stylesheet';
        l.href = 'https://fonts.googleapis.com/css2?family=Archivo+Black&family=Kaushan+Script&family=Abril+Fatface&family=Limelight&family=Bagel+Fat+One&display=swap';
        document.head.append(l);
      }
      nameFlicker(holi);
    }
    window.folioGames?.init(); // los mini games (assets/minigames.js)

    const items = document.querySelectorAll('.reveal');
    if (reduce || !('IntersectionObserver' in window)) {
      items.forEach(el => el.classList.add('in'));
    } else {
      const io = new IntersectionObserver(entries => entries.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        io.unobserve(e.target);
      }), { rootMargin: '0px 0px -8% 0px', threshold: .08 });
      items.forEach(el => io.observe(el));
    }

    // la pantalla del principio: el texto se escribe letra a letra (un clic lo completa de golpe, como en los videojuegos)
    // y al terminar aparece «start». se ve una vez por sesión; mientras está, la página no se mueve
    const intro = document.querySelector('.intro');
    onEscape = null;
    if (intro) {
      let seen = false;
      try { seen = sessionStorage.getItem('intro-seen') === '1'; } catch (e) {}
      if (seen) intro.remove();
      else {
        const root = document.documentElement;
        const text = intro.querySelector('.oracle-text');
        const start = intro.querySelector('.intro-start');
        const words = intro.dataset.say;
        let skip = false;
        root.classList.add('intro-on');
        const begin = () => {
          sfx('click', true);
          intro.classList.add('gone');
          root.classList.remove('intro-on');
          onEscape = null;
          try { sessionStorage.setItem('intro-seen', '1'); } catch (e) {}
          setTimeout(() => intro.remove(), 1000);
        };
        (async () => {
          await wait(reduce ? 200 : 700);
          for (let i = 1; i <= words.length && !skip; i++) {
            text.textContent = words.slice(0, i);
            await wait(pause(words[i - 1]) ? 260 : 38);
          }
          text.textContent = words;
          intro.classList.add('ready');
          start.focus({ preventScroll: true });
        })();
        intro.addEventListener('click', e => { if (e.target !== start) skip = true; });
        intro.addEventListener('keydown', e => {
          if (e.key !== 'Enter' && e.key !== ' ') return;
          e.preventDefault();
          if (intro.classList.contains('ready')) begin();
          else skip = true;
        });
        start.addEventListener('click', begin);
        onEscape = begin;
      }
    }

    // las chicas (índice y about): al tocarlas aparece lo que dicen y la boca del vídeo lo dice, sin sonido.
    // el canvas (.mouth-live) lleva en data-src el trozo del vídeo que cae sobre sus labios y en data-seg el trozo
    // de tiempo que dice la frase; la máscara es un óvalo opaco en el centro, para que los labios de la foto
    // no se transparenten nunca, y fundido hacia fuera (data-up = dónde está la boca, de arriba a abajo)
    document.querySelectorAll('.talk').forEach(talk => {
      const girl = talk.parentElement;
      const video = girl.querySelector('.mouth-video');
      const live = girl.querySelector('.mouth-live');
      if (!video || !live) return;
      const [sx, sy, sw, sh] = live.dataset.src.split(',').map(Number);
      const [from, to] = live.dataset.seg.split(',').map(Number);
      const W = live.width, H = live.height, up = +live.dataset.up;
      const ctx = live.getContext('2d', { willReadFrequently: true });
      const shape = new Uint8ClampedArray(W * H);
      for (let y = 0, j = 0; y < H; y++) for (let x = 0; x < W; x++, j++) {
        const fy = y / H;
        const d = Math.hypot((x / W - .5) * 2, fy < up ? (fy - up) / up : (fy - up) / (1 - up));
        shape[j] = (d < .75 ? 1 : Math.max(0, (1 - d) / .25)) * 255;
      }
      // el color se ajusta al de la foto (data-tone) y se le añade su misma grana, quieta como en la foto, en granos
      // del tamaño de un píxel de la foto (data-k = píxeles del canvas por píxel de la foto)
      const [ar, br, ag, bg, ab, bb] = live.dataset.tone.split(',').map(Number);
      const [gr, gg, gb] = live.dataset.grain.split(',').map(Number);
      const cell = +live.dataset.k;
      const noise = new Float32Array(W * H * 3), cols = Math.ceil(W / cell);
      const seed = new Float32Array(cols * Math.ceil(H / cell) * 3).map(() => (Math.random() + Math.random() + Math.random() - 1.5) * 2);
      for (let y = 0, j = 0; y < H; y++) for (let x = 0; x < W; x++, j++) {
        const s = ((y / cell | 0) * cols + (x / cell | 0)) * 3;
        noise[j * 3] = seed[s] * gr; noise[j * 3 + 1] = seed[s + 1] * gg; noise[j * 3 + 2] = seed[s + 2] * gb;
      }
      const paint = () => {
        ctx.drawImage(video, sx, sy, sw, sh, 0, 0, W, H);
        const im = ctx.getImageData(0, 0, W, H), p = im.data;
        if (!realFrame(p, W, H)) { ctx.clearRect(0, 0, W, H); return false; } // sin fotograma de verdad, se queda la foto
        for (let i = 0, j = 0; j < shape.length; i += 4, j++) {
          p[i] = ar * p[i] + br + noise[j * 3];
          p[i + 1] = ag * p[i + 1] + bg + noise[j * 3 + 1];
          p[i + 2] = ab * p[i + 2] + bb + noise[j * 3 + 2];
          p[i + 3] = shape[j];
        }
        ctx.putImageData(im, 0, 0);
        return true;
      };
      // lo que dice se escribe letra a letra, al ritmo de la boca, como en una conversación. si trae respuestas
      // (la del about: «yes» · «yes»), aparecen en cuanto termina de escribir, pase lo que pase con el vídeo; al elegir
      // una, contesta (data-reply) y lleva al contacto
      const bubble = girl.querySelector('.bubble');
      const said = bubble.querySelector('.bubble-text');
      const words = said.textContent;
      const choices = girl.querySelector('.bubble-choices');
      let turn = 0;
      const write = async (mine, line, ms) => {
        const step = ms / Math.max(1, line.length);
        for (let i = 1; i <= line.length; i++) {
          if (mine !== turn) return false;
          said.textContent = line.slice(0, i);
          await wait(pause(line[i - 1]) ? step * 4 : step);
        }
        return mine === turn;
      };
      const stopMouth = () => { video.pause(); girl.classList.remove('speaking'); };
      let shownAt = -1;
      const frames = mine => {
        if (mine !== turn || !video.isConnected) return;
        if (video.currentTime !== shownAt && paint()) { shownAt = video.currentTime; girl.classList.add('speaking') }
        // ha terminado el trozo de la frase y la boca está cerrada: se para y la foto vuelve a quedar sola
        if (video.currentTime >= to || video.ended) stopMouth();
        else nextFrame(video, () => frames(mine));
      };
      const speak = async mine => {
        if (reduce) return;
        // en el móvil el vídeo no carga hasta que se le da al play
        if (video.readyState < 1) await video.play().catch(() => {});
        video.pause();
        video.currentTime = from;
        await Promise.race([new Promise(done => video.addEventListener('seeked', done, { once: true })), wait(1500)]);
        if (mine !== turn) return;
        if (paint()) girl.classList.add('speaking');
        await video.play().catch(() => {});
        nextFrame(video, () => frames(mine));
      };
      const say = async (line, then) => {
        const mine = ++turn;
        girl.classList.remove('asking');
        girl.classList.add('talking');
        speak(mine);
        const done = await write(mine, line, reduce ? 0 : Math.min((to - from) * 1000, line.length * 70));
        if (!done) return;
        await wait(250);
        if (mine !== turn) return;
        stopMouth();
        then(mine);
      };
      talk.addEventListener('click', () => say(words, mine => {
        if (choices) return girl.classList.add('asking');
        wait(1400).then(() => mine === turn && girl.classList.remove('talking'));
      }));
      // al elegir, contesta y se queda ahí: la página no se mueve (un nuevo toque sobre ella vuelve a empezar)
      choices?.querySelectorAll('a').forEach(a => a.addEventListener('click', e => {
        e.preventDefault();
        say(bubble.dataset.reply || words, () => {});
      }));
    });

    // la cara del final: solo cuando se toca «contact» en el menú (bajar hasta el final no la llama). en cuanto se ve
    // el contacto entra flotando, escribe la frase letra a letra mientras mueve la boca, y al terminar cierra los ojos
    // y sonríe. se cierra con la ✕ o con escape, y vuelve si se toca «contact» otra vez
    askFace = null;
    const oracle = document.querySelector('.oracle');
    const contact = document.querySelector('.contact-lines');
    if (oracle && contact && 'IntersectionObserver' in window) {
      const text = oracle.querySelector('.oracle-text');
      const words = oracle.dataset.say;
      const go = () => { oracle.classList.add('gone'); faceVideo.pause(); };
      // en el canvas, encima de la boca de face.png, se pinta la boca del vídeo. el trozo del vídeo está medido para
      // que los labios caigan justo encima: en face.png va de x 197 a 427 y de y 525 a 695, y el vídeo está a
      // escala .797 desplazado (-250, 127) (medido comparando la foto con el primer fotograma)
      const faceVideo = oracle.querySelector('.face-video');
      const mouth = oracle.querySelector('.face-mouth');
      const still = oracle.querySelector('.oracle-bob img');
      const ctx = mouth.getContext('2d', { willReadFrequently: true });
      const MW = mouth.width, MH = mouth.height;
      // la máscara: alrededor de la boca (centro 312, 610 en la foto) el vídeo es opaco del todo, para que los labios
      // cerrados de la foto no se transparenten nunca; hacia fuera se funde con la cara. es más alta por debajo,
      // porque al hablar la barbilla baja
      const shape = new Float32Array(MW * MH);
      for (let y = 0, j = 0; y < MH; y++) for (let x = 0; x < MW; x++, j++) {
        const fx = 197 + x * 230 / MW, fy = 525 + y * 170 / MH;
        const d = Math.hypot((fx - 312) / 120, (fy - 610) / (fy < 610 ? 50 : 85));
        shape[j] = d < .75 ? 2 : Math.max(0, Math.min(1, (1 - d) / .25)); // 2 = núcleo opaco
      }
      const paint = () => {
        ctx.drawImage(faceVideo, 560.85, 499.37, 288.58, 213.3, 0, 0, MW, MH);
        const im = ctx.getImageData(0, 0, MW, MH), p = im.data;
        if (!realFrame(p, MW, MH)) return ctx.clearRect(0, 0, MW, MH); // sin fotograma de verdad, se queda la foto
        for (let i = 0, j = 0; j < shape.length; i += 4, j++) {
          if (shape[j] === 2) { p[i + 3] = 255; continue; }
          // fuera del núcleo, el gris oscuro y frío del fondo del vídeo que asoma junto a la mandíbula se borra
          const warm = (p[i] - p[i + 2] - 4) / 10, light = (p[i] * .3 + p[i + 1] * .59 + p[i + 2] * .11 - 75) / 30;
          p[i + 3] = shape[j] * Math.max(0, Math.min(1, Math.max(warm, light))) * 255;
        }
        ctx.putImageData(im, 0, 0);
        // y nada sale del contorno de la cara de la foto
        ctx.globalCompositeOperation = 'destination-in';
        ctx.drawImage(still, 197, 525, 230, 170, 0, 0, MW, MH);
        ctx.globalCompositeOperation = 'source-over';
      };
      const frames = () => {
        if (!faceVideo.isConnected) return;
        paint();
        if (!faceVideo.paused && !faceVideo.ended) nextFrame(faceVideo, frames);
      };
      faceVideo.addEventListener('loadeddata', paint);
      faceVideo.addEventListener('seeked', paint);
      faceVideo.addEventListener('play', frames);
      if (faceVideo.readyState >= 2) paint();
      const appear = async () => {
        oracle.classList.add('in');
        if (!onEscape) onEscape = go;
        // en el móvil el vídeo no carga hasta que se le da al play: se arranca y se para para tener la cara quieta
        if (faceVideo.readyState < 2) faceVideo.play().then(() => faceVideo.pause(), () => {});
        await wait(reduce ? 400 : 2700);
        oracle.classList.add('boxed', 'talking');
        // la frase se escribe al ritmo del vídeo: cada letra pesa 1 y cada pausa 5, repartidas en lo que dura
        // (el vídeo va a 1,6× para que la frase no se haga lenta: la boca y las letras siguen yendo juntas)
        faceVideo.playbackRate = 1.6;
        const steps = [...words].map(ch => (pause(ch) ? 5 : 1));
        const total = steps.reduce((a, b) => a + b, 0);
        const typeTo = f => {
          let n = 0;
          for (let w = 0; n < words.length && (w += steps[n]) <= f * total; ) n++;
          text.textContent = words.slice(0, n);
        };
        if (!reduce && (await faceVideo.play().then(() => true, () => false))) {
          await new Promise(done => {
            const tick = () => {
              typeTo(faceVideo.currentTime / Math.max(1, faceVideo.duration - .8));
              if (faceVideo.ended) done();
              else requestAnimationFrame(tick);
            };
            tick();
          });
        }
        typeTo(1);
        oracle.classList.remove('talking');
        await wait(250);
        oracle.classList.add('smile', 'done');
      };
      // se espera a que el contacto esté a la vista (el menú baja hasta él); si ya se había visto, empieza de cero
      let seen = null;
      askFace = () => {
        faceAsked = false;
        if (oracle.classList.contains('in') && !oracle.classList.contains('gone')) return; // ya está ahí
        seen?.disconnect();
        oracle.classList.remove('gone', 'in', 'boxed', 'talking', 'smile', 'done');
        text.textContent = '';
        faceVideo.pause();
        if (faceVideo.readyState) faceVideo.currentTime = 0;
        seen = new IntersectionObserver(entries => {
          if (!entries.some(e => e.isIntersecting)) return;
          seen.disconnect();
          appear();
        }, { threshold: .6 });
        seen.observe(contact);
      };
      if (faceAsked) askFace(); // se llegó aquí desde otra página tocando «contact»
      oracle.querySelector('.oracle-close').addEventListener('click', go);
    }

    // la foto que sigue al ratón: cada enlace con data-img la enseña mientras pasas por encima
    shown = false;
    if (fine) document.querySelectorAll('[data-img]').forEach(a => {
      new Image().src = a.dataset.img;
      a.addEventListener('pointerenter', e => {
        const p = preview();
        if (!p) return;
        if (!shown) { x = tx = e.clientX; y = ty = e.clientY; place(); }
        p.src = a.dataset.img;
        p.classList.add('on');
        shown = true;
      });
      a.addEventListener('pointerleave', () => {
        preview()?.classList.remove('on');
        shown = false;
      });
    });
  }

  // ───────── cambiar de página sin recargar ─────────
  // el <head> no se cambia: sus enlaces (estilos, icono) se fijan con la dirección completa, porque al cambiar de
  // página una ruta relativa como «assets/…» pasaría a apuntar a otra carpeta
  document.querySelectorAll('head link[href]').forEach(l => l.setAttribute('href', l.href));
  // los enlaces a otras páginas del portfolio se traen con fetch y se cambia el contenido del body;
  // los externos, los mailto y los que abren otra pestaña funcionan como siempre
  const inside = a => a && a.origin === location.origin && !a.target && !a.hasAttribute('download')
    && /(\.html|\/)$/.test(a.pathname) && !(a.pathname === location.pathname && a.hash);
  async function go(url, push) {
    let html;
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(res.status);
      html = await res.text();
    } catch (e) {
      location.href = url;
      return;
    }
    dispatchEvent(new Event('folio:leave'));
    if (push) {
      history.replaceState({ y: scrollY }, '');
      history.pushState({ y: 0 }, '', url);
    }
    // se lee después de cambiar la dirección, así las rutas relativas de la página nueva apuntan bien
    const doc = new DOMParser().parseFromString(html, 'text/html');
    doc.querySelectorAll('body script').forEach(s => s.remove());
    document.title = doc.title;
    document.body.className = doc.body.className;
    document.body.replaceChildren(...doc.body.childNodes);
    document.documentElement.classList.remove('intro-on');
    const hash = new URL(url).hash;
    const target = hash && document.getElementById(decodeURIComponent(hash.slice(1)));
    const y0 = push ? 0 : (history.state?.y ?? 0);
    document.documentElement.style.scrollBehavior = 'auto';
    if (target) target.scrollIntoView();
    else scrollTo(0, y0);
    document.documentElement.style.removeProperty('scroll-behavior');
    setup();
  }
  document.addEventListener('click', e => {
    if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest('a[href]');
    if (!inside(a)) return;
    e.preventDefault();
    go(a.href, true);
  });
  // atrás/adelante: si solo cambia el #ancla dentro de la misma página, basta con desplazarse
  let loaded = location.pathname;
  addEventListener('folio:leave', () => { setTimeout(() => { loaded = location.pathname; }); });
  addEventListener('popstate', () => {
    if (location.pathname === loaded) {
      const target = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (target) target.scrollIntoView();
      else scrollTo(0, history.state?.y ?? 0);
      return;
    }
    go(location.href, false);
  });
  history.scrollRestoration = 'manual';

  setup();
})();
