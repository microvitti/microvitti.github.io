// micromina — mini games: tarot reader (en su propia página) y pet my cats.
// assets/portfolio-ui.js llama a folioGames.init() cada vez que llega una página (el sitio cambia de página sin recargar).
window.folioGames = (() => {
  const pickOne = list => list[Math.floor(Math.random() * list.length)];
  const wait = ms => new Promise(done => setTimeout(done, ms));

  // escribe una frase letra a letra en un elemento; si llega otra, la anterior se corta
  const typing = new WeakMap();
  const type = async (el, line, step = 26) => {
    const mine = (typing.get(el) || 0) + 1;
    typing.set(el, mine);
    for (let i = 1; i <= line.length; i++) {
      if (typing.get(el) !== mine) return;
      el.textContent = line.slice(0, i);
      await wait(/[,.?!:]/.test(line[i - 1]) ? 180 : step);
    }
  };

  // ───────── tarot reader ─────────
  // la tarotista, en su página (tarot-reader/): habla en el cuadro de diálogo de abajo, baraja, reparte tres cartas
  // desde la que tiene en la mano hasta la mesa y las gira una a una, leyéndolas: pasado, presente y lo que viene.
  // las opciones se eligen con el ratón o con las flechas y enter, como en el gabinete
  // los 22 arcanos mayores: [número, nombre, símbolo, al derecho, del revés]. la cartomante habla dulce y claro:
  // cada frase dice qué significa la carta en palabras sencillas y deja un consejo pequeño y amable
  const ARCANA = [
    ['0', 'the fool', '✦', 'a new beginning. you are ready to start something, even without knowing where it leads. trust the first step.', 'you are standing at the edge, afraid to begin. it is alright to be afraid. take one small step.'],
    ['I', 'the magician', '✶', 'you already have everything you need. your hands, your ideas, your heart. it is time to use them.', 'your gifts are there, but you are not using them yet. believe in what you can do.'],
    ['II', 'the high priestess', '☾', 'listen to your inner voice. you already know the answer, deep down.', 'you are not listening to yourself. find a quiet moment and the answer will come.'],
    ['III', 'the empress', '❀', 'softness, care and things that grow. be gentle with yourself, the way you are with others.', 'you take care of everyone except yourself. today, let it be your turn.'],
    ['IV', 'the emperor', '▣', 'calm and steady ground. a clear plan will help you feel safe.', 'too many rules are holding you back. you are allowed to loosen them.'],
    ['V', 'the hierophant', '✠', 'learn from someone wiser. it is alright to ask for guidance.', 'you do not have to follow the usual path. your own way is valid too.'],
    ['VI', 'the lovers', '♡', 'a choice made with the heart. follow what you truly feel.', 'your heart is pulled in two directions. take your time, you will know which way is yours.'],
    ['VII', 'the chariot', '⟁', 'move forward with purpose. you are the one guiding your path now.', 'you are pulled in different directions. choose one road, and the rest will follow.'],
    ['VIII', 'strength', '∞', 'your strength is gentle. patience and kindness will carry you further than force.', 'you are doubting yourself, but you are stronger than you think.'],
    ['IX', 'the hermit', '✧', 'a quiet time to look inside. the answer is found in silence.', 'you have been alone for a long time. let someone you love come closer.'],
    ['X', 'wheel of fortune', '◎', 'things are changing, and the change will bring something good.', 'a difficult moment, but it will pass. the wheel always turns again.'],
    ['XI', 'justice', '⚖', 'honesty and balance. what is fair will find its way to you.', 'something feels unfair. say it gently, but say it.'],
    ['XII', 'the hanged man', '⧗', 'pause and look at things from another side. a new view will help you.', 'you have been waiting too long. it is time to move.'],
    ['XIII', 'death', '✕', 'do not be afraid, it is not what it seems. something ends so that something new can begin.', 'you are holding on to something that is already over. you can let it go softly.'],
    ['XIV', 'temperance', '⚗', 'balance and patience. a little of everything, at its own pace.', 'something is out of balance. slow down and find your middle again.'],
    ['XV', 'the devil', '♆', 'something you love is also keeping you stuck. you deserve to feel free.', 'you are slowly freeing yourself from what held you. be proud of that.'],
    ['XVI', 'the tower', 'ϟ', 'a sudden change. it may shake you, but it lets the light in.', 'a change you saw coming. you are ready for it, more than you know.'],
    ['XVII', 'the star', '★', 'hope, calm and clear. everything is going to be alright.', 'you have lost a little hope. look up, the stars are still there for you.'],
    ['XVIII', 'the moon', '◐', 'not everything is clear yet. trust your intuition while the night lasts.', 'the fog is lifting. soon you will see clearly again.'],
    ['XIX', 'the sun', '☀', 'joy, warmth and light. enjoy this good moment, you deserve it.', 'a small cloud on a sunny day. the light is still there behind it.'],
    ['XX', 'judgement', '✺', 'a call you cannot ignore. listen to it, it is guiding you.', 'you are too hard on yourself. forgive yourself, you are doing well.'],
    ['XXI', 'the world', '◯', 'a cycle comes to an end. you made it. take a moment to celebrate.', 'you are almost there. one last step, and you will be complete.'],
  ];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sound = (name, again) => window.folioSfx?.(name, again);
  // la tarotista viva: los brazos y el cuerpo son los de la foto, quietos, y la cabeza se mueve. el vídeo
  // (assets/video/tarot-reader.bin) es su cabeza en los fotogramas 30 a 99 del de gemini, recortada y encajada en la foto
  // (432 × 384 px de la foto, en box): se mueve como en el vídeo hasta la barbilla y, bajando por la gargantilla, cada vez
  // menos, hasta quedarse quieta justo donde se funde con el cuerpo de la foto. el color está igualado con la foto.
  // al empezar, la foto entera (que ya lleva el primer fotograma) se cambia por el cuerpo sin cabeza (data-body) y la
  // cabeza viva se pinta encima. van primero hacia delante y luego hacia atrás, para poder ir y volver sin saltos. cada
  // fotograma lleva el color arriba y la transparencia abajo, en gris; webgl los junta en un canvas. formato del archivo:
  // 'TRV1', u32 con el largo de la cabecera json (códec, descripción avc, tamaño y si es clave cada fotograma) y los
  // fotogramas h.264 seguidos.
  // no hay ningún salto ni fundido entre fotogramas, así que nunca hay fantasmas: el cabezal avanza o retrocede de uno
  // en uno (de dos en dos cuando corre a hablar). del 72 al 99 habla; del 48 al 71 está callada, mirando fijo. mientras escribe una frase va a la zona en la
  // que habla y allí va y vuelve; cuando acaba, vuelve a la calma. de vez en cuando parpadea: del 48 baja hasta el 37,
  // donde tiene los ojos cerrados, y vuelve (un solo parpadeo, nunca dos seguidos)
  const QUIET = [48, 71], TALK = [72, 99], SHUT = 37;
  function readerVideo(img) {
    const still = { talk() {}, stop() {} };
    const gl0 = document.createElement('canvas').getContext('webgl');
    if (!img.dataset.video || !('VideoDecoder' in window) || !gl0 || reduce) return still;
    let talking = false, alive = true, dec = null, raf = 0;
    const ready = new Map(); // fotogramas ya decodificados que esperan su turno
    (async () => {
      const buf = await (await fetch(img.dataset.video)).arrayBuffer();
      const dv = new DataView(buf), hl = dv.getUint32(4, true);
      if (dv.getUint32(0) !== 0x54525631) return;
      const head = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 8, hl)));
      let at = 8 + hl;
      const frames = head.frames.map(([size, key]) => { const f = { data: new Uint8Array(buf, at, size), key }; at += size; return f });
      const N = head.n, W = head.w, H = head.h / 2; // N fotogramas en cada sentido
      const config = { codec: head.codec, description: Uint8Array.from(atob(head.desc), c => c.charCodeAt(0)), codedWidth: head.w, codedHeight: head.h };
      if (!alive || !(await VideoDecoder.isConfigSupported(config)).supported) return;
      const body = new Image();
      body.src = img.dataset.body;
      body.className = 'tr-body';
      body.alt = '';
      await body.decode();
      if (!alive) return;
      // webgl: color de la mitad de arriba, alfa de la de abajo
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const [bx, by, bw, bh] = head.box, [sw, shh] = head.size, pc = (a, b) => `${(a / b * 100).toFixed(4)}%`;
      canvas.className = 'tr-face';
      Object.assign(canvas.style, { left: pc(bx, sw), top: pc(by, shh), width: pc(bw, sw), height: pc(bh, shh) });
      canvas.setAttribute('aria-hidden', 'true');
      const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false, preserveDrawingBuffer: true });
      const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s };
      const prog = gl.createProgram();
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, 'attribute vec2 p;varying vec2 v;void main(){v=vec2(p.x*.5+.5,.5-p.y*.5);gl_Position=vec4(p,0.,1.);}'));
      gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, 'precision mediump float;varying vec2 v;uniform sampler2D t;void main(){vec3 c=texture2D(t,vec2(v.x,v.y*.5)).rgb;float a=clamp((texture2D(t,vec2(v.x,.5+v.y*.5)).r-.012)/.976,0.,1.);gl_FragColor=vec4(c*a,a);}'));
      gl.linkProgram(prog);
      gl.useProgram(prog);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
      for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.NEAREST], [gl.TEXTURE_MAG_FILTER, gl.NEAREST], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
      let copy = null; // por si el navegador no sube un VideoFrame directamente a webgl
      const paint = frame => {
        try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, frame) }
        catch {
          copy = copy || new OffscreenCanvas(head.w, head.h);
          copy.getContext('2d').drawImage(frame, 0, 0);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, copy);
        }
        gl.viewport(0, 0, W, H);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      };
      // el cabezal: fotograma p (0..N-1) y sentido d. en el archivo, hacia delante es p y hacia atrás N + (N - 1 - p)
      const first = head.first, at_ = q => d > 0 ? q - first : 2 * N - 1 - (q - first);
      let p = first, d = 1, blink = 0, nextBlink = performance.now() + 3000; // empieza en la foto (el 30) y parpadea al llegar
      const step = () => {
        const now = performance.now();
        if (!talking && !blink && p <= QUIET[1] && now > nextBlink) blink = 1;
        if (blink && !talking) {                                             // parpadeo: baja al 37 y vuelve al 48
          d = blink === 1 ? -1 : 1;
          p += d;
          if (p <= SHUT) blink = 2;
          if (blink === 2 && p >= QUIET[0]) { blink = 0; nextBlink = now + 2500 + Math.random() * 3500 }
          return at_(p);
        }
        blink = 0;
        if (talking && p < TALK[0]) d = 1;                                   // a la zona en la que habla, a doble
        else if (talking) { if (p + d < TALK[0] || p + d > TALK[1]) d = -d } // allí va y vuelve
        else if (p >= TALK[0]) d = -1;                                       // termina la frase y vuelve a la calma
        else if (p < QUIET[0]) d = 1;                                        // (si se quedó a medio parpadeo)
        else if (p + d < QUIET[0] || p + d > QUIET[1]) d = -d;               // en calma también va y vuelve
        p += talking && p < TALK[0] - 1 ? 2 * d : d;
        return at_(p);
      };
      // decodificar por delante de lo que se ve: plan = índices del archivo que tocan, en orden
      const plan = [];
      let fed = -1;
      dec = new VideoDecoder({
        output: f => { const i = Math.round(f.timestamp); if (plan.includes(i) && !ready.has(i)) ready.set(i, f); else f.close() },
        error: () => stop(),
      });
      dec.configure(config);
      const feed = i => {
        let k = i; while (!frames[k].key) k--;
        const from = fed >= k && fed < i ? fed + 1 : k;
        for (let j = from; j <= i; j++) dec.decode(new EncodedVideoChunk({ type: frames[j].key ? 'key' : 'delta', timestamp: j, data: frames[j].data }));
        fed = i;
      };
      const top = () => { while (plan.length < 6) { const i = step(); plan.push(i); feed(i) } };
      // el primer fotograma (el 0) es la foto: el canvas la sustituye en cuanto pinta
      plan.push(0);
      feed(0);
      top();
      let last = 0, shown = false;
      const tick = now => {
        if (!alive) return;
        raf = requestAnimationFrame(tick);
        if (!img.isConnected) return stop();
        if (now - last < 1000 / 24 - 1) return;
        const f = ready.get(plan[0]);
        if (!f) return; // aún decodificando: se queda el fotograma de antes
        last = now - last > 1000 / 12 ? now : last + 1000 / 24; // a 24 por segundo de media, también en pantallas de 60 hz
        paint(f);
        f.close();
        ready.delete(plan.shift());
        if (!shown) { shown = true; img.after(body, canvas); img.style.visibility = 'hidden' } // es el mismo fotograma que la foto: el cambio no se ve
        top();
      };
      raf = requestAnimationFrame(tick);
    })().catch(() => stop());
    const stop = () => {
      alive = false;
      cancelAnimationFrame(raf);
      if (dec && dec.state !== 'closed') dec.close();
      ready.forEach(f => f.close());
      ready.clear();
    };
    addEventListener('pagehide', stop, { once: true });
    return { talk(on) { talking = on }, stop };
  }

  let room = null; // la tarotista de la página que se está viendo, para el teclado
  function tarotRoom(root) {
    const text = root.querySelector('.tr-text');
    const choices = root.querySelector('.tr-choices');
    const reader = root.querySelector('.tr-reader');
    const live = readerVideo(reader.querySelector('img'));
    const cards = [...root.querySelectorAll('.tr-spread .tcard')];
    let turn = 0, options = [], sel = 0, deck = [];
    const pick = k => {
      if (!options.length) return;
      sel = (k + options.length) % options.length;
      [...choices.children].forEach((b, j) => b.classList.toggle('sel', j === sel));
    };
    // escribe la frase letra a letra y luego enseña las opciones: [texto, qué hace o adónde lleva]
    const say = async (line, opts) => {
      const mine = ++turn;
      choices.replaceChildren();
      options = [];
      live.talk(true);
      for (let i = 1; i <= line.length; i++) {
        if (mine !== turn) return false;
        text.textContent = line.slice(0, i);
        await wait(/[,.?!:]/.test(line[i - 1]) ? 200 : 28);
      }
      if (mine !== turn) return false;
      live.talk(false);
      options = opts;
      opts.forEach(([label, act], j) => {
        const b = document.createElement(typeof act === 'string' ? 'a' : 'button');
        if (typeof act === 'string') b.href = act;
        else {
          b.type = 'button';
          b.addEventListener('click', act);
        }
        b.textContent = label;
        b.addEventListener('pointerenter', () => pick(j));
        choices.append(b);
      });
      pick(0);
      return true;
    };
    // mientras pasa algo (barajar, repartir), sin opciones; si entretanto se elige otra cosa, se deja de esperar
    const busy = () => {
      live.talk(false);
      choices.replaceChildren();
      options = [];
      return ++turn;
    };
    // la carta que tiene en la mano, en la foto (712 × 860 px): de ahí salen las cartas y ahí vuelven
    const fromHand = card => {
      const r = reader.getBoundingClientRect(), c = card.getBoundingClientRect();
      const hx = r.left + r.width * 540 / 712, hy = r.top + r.height * 655 / 860;
      return `translate(${hx - (c.left + c.width / 2)}px, ${hy - (c.top + c.height / 2)}px) rotate(-12deg) scale(.42)`;
    };
    const deal = async mine => {
      deck = ARCANA.slice().sort(() => Math.random() - .5).slice(0, 3).map(c => ({ c, rev: Math.random() < .3 }));
      // cada carta lleva detrás una de las doce tintas de vittoria (assets/img/games/tarot-backs), sin repetir
      const backs = Array.from({ length: 12 }, (_, i) => i + 1).sort(() => Math.random() - .5);
      cards.forEach((card, i) => card.querySelector('.tcard-back').style.backgroundImage = `url(../assets/img/games/tarot-backs/${backs[i]}.jpg)`);
      for (let i = 0; i < 3; i++) {
        if (mine !== turn) return;
        const card = cards[i], { c: [num, name, sym], rev } = deck[i];
        card.querySelector('.tcard-face').innerHTML = `<span class="tc-num">${num}</span><span class="tc-sym">${sym}</span><span class="tc-name">${name}</span>`;
        card.classList.remove('open');
        card.classList.toggle('rev', rev);
        card.style.transition = 'none';
        card.style.transform = fromHand(card);
        void card.offsetWidth;
        card.style.removeProperty('transition');
        card.style.removeProperty('transform');
        card.classList.add('dealt');
        sound('deal', true);
        await wait(reduce ? 0 : 450);
      }
      await wait(reduce ? 0 : 450);
    };
    const gather = async () => {
      cards.forEach(card => {
        card.style.transform = fromHand(card);
        card.classList.remove('dealt');
      });
      sound('deal', true);
      await wait(reduce ? 0 : 750);
      cards.forEach(card => card.classList.remove('open'));
    };
    const WHEN = ['the past: ', 'the present: ', 'the future: '];
    const welcome = () => say('hello, come in and sit with me. i will read the cards for you.', [['sit down', ask], ['not today', notToday]]);
    const notToday = () => say('that is alright. i will be here whenever you are ready.', [['i am ready now', ask]]);
    const ask = () => say('close your eyes and think of a question. you can keep it to yourself, the cards will hear it.', [['i have one', shuffle]]);
    const shuffle = async () => {
      busy();
      sound('shuffle');
      if (!(await say('i am shuffling the cards, slowly, with your question in mind.', []))) return;
      const mine = turn;
      await wait(reduce ? 0 : 700);
      await deal(mine);
      if (mine !== turn) return;
      say('here are three cards: the past, the present and the future. let us look at them one by one.', [['turn the first', () => reveal(0)]]);
    };
    const reveal = async i => {
      const mine = busy();
      cards[i].classList.add('open');
      sound('flip', true);
      await wait(reduce ? 0 : 800);
      if (mine !== turn) return;
      const { c: [, name, , up, down], rev } = deck[i];
      say(`${WHEN[i]}${name}${rev ? ', upside down' : ''}. ${rev ? down : up}`, i < 2 ? [['next card', () => reveal(i + 1)]] : [['and so?', end]]);
    };
    const end = () => say('that is your reading. the cards show the way, but every step is yours.', [['read again', again], ['thank you', bye]]);
    const again = async () => {
      const mine = busy();
      await gather();
      if (mine === turn) ask();
    };
    const bye = () => say('thank you for sitting with me. come back whenever you need a little light.', [['back to the games', '../mini-games/index.html#tarot']]);
    // las cartas ya repartidas también se giran tocándolas, en su orden
    cards.forEach((card, i) => card.addEventListener('click', () => {
      const next = options.find(([label]) => label === 'turn the first' || label === 'next card');
      if (card.classList.contains('dealt') && !card.classList.contains('open') && next && cards.findIndex(c => !c.classList.contains('open')) === i) next[1]();
    }));
    wait(reduce ? 0 : 900).then(welcome);
    room = {
      root,
      key(e) {
        const k = e.key;
        if ((k === 'Enter' || k === ' ') && e.target.closest?.('.tarot-room button, .tarot-room a')) return;
        if (options.length && (k === 'ArrowLeft' || k === 'ArrowRight')) pick(sel + (k === 'ArrowRight' ? 1 : -1));
        else if (options.length && (k === 'Enter' || k === ' ')) choices.children[sel].click();
        else return;
        e.preventDefault();
      },
    };
  }
  addEventListener('keydown', e => {
    if (room && room.root.isConnected) room.key(e);
  });

  // ───────── pet my cats ─────────
  // al acariciarlos (pasar el ratón o el dedo por encima, unas cuantas veces) ronronean, sale un corazón y dicen
  // una frase de gato; si se les acaricia lo bastante (cada cuatro caricias) te dan uno de sus consejos
  const ADVICE = {
    juanki: [
      'decisions are portals.',
      'you can be both the artist and the muse.',
      'trust no man, fear no bitch.',
      'search inside yourself, not on the internet.',
      'nothing is that serious, choose peace.',
      'stay silly when life gets hard.',
      'do it for the lore.',
    ],
    marcelo: [
      'your fear of looking stupid holds you back.',
      'you got this, twin.',
      'mentally in idgafistan.',
      'bitch.',
      'pressure is a privilege. it means things are expected of you.',
      'everything is a win when the goal is to experience.',
      "you can't use someone else's map to find yourself.",
    ],
  };
  const SAYINGS = [
    'prrrrr...',
    'five more minutes.',
    'you may continue.',
    'i was dreaming of fish.',
    "that's the spot.",
    'do not stop.',
    'mmm. who let you in?',
  ];
  // marcelo en 3d: el visor (model-viewer) se trae sólo si en la página hay un gato en 3d
  let viewer = null;
  const view3d = root => {
    if (!root.querySelector('model-viewer')) return;
    viewer ||= import('https://unpkg.com/@google/model-viewer@3.5.0/dist/model-viewer.min.js').catch(() => {});
  };
  function cats(root) {
    view3d(root);
    root.querySelectorAll('.cat').forEach(cat => {
      let stroke = 0, lastX = null, lastY = null, timer, pets = 0, told = [], hold = 0;
      const says = cat.querySelector('.cat-says');
      const advice = ADVICE[cat.querySelector('.cat-name')?.textContent.trim()] || [];
      const pet = () => {
        sound('purr');
        cat.classList.remove('purr');
        void cat.offsetWidth; // vuelve a empezar la animación
        cat.classList.add('purr');
        const heart = document.createElement('span');
        heart.className = 'cat-heart';
        heart.textContent = '♡';
        heart.style.left = `${30 + Math.random() * 40}%`;
        cat.append(heart);
        setTimeout(() => heart.remove(), 1400);
        // mientras se lee un consejo (3 s como mínimo) no se cambia: el gato sigue ronroneando, pero no habla
        if (performance.now() < hold) return;
        pets++;
        // el consejo: sin repetir hasta haberlos dicho todos
        const wise = advice.length && pets % 4 === 0;
        if (wise) hold = performance.now() + 3000;
        let line;
        if (wise) {
          if (told.length === advice.length) told = [];
          line = pickOne(advice.filter(a => !told.includes(a)));
          told.push(line);
        } else {
          line = pickOne(SAYINGS);
          if (line === says.textContent) line = pickOne(SAYINGS);
        }
        type(says, line, 40);
        cat.classList.add('talking');
        cat.classList.toggle('wise', !!wise);
        clearTimeout(timer);
        timer = setTimeout(() => cat.classList.remove('talking', 'purr', 'wise'), wise ? 4800 : 2600);
      };
      // cuenta cuánto se mueve el puntero sobre el gato; cada 160 px es una caricia
      cat.addEventListener('pointermove', e => {
        if (e.pointerType !== 'mouse' && !e.pressure) return;
        if (lastX !== null) stroke += Math.hypot(e.clientX - lastX, e.clientY - lastY);
        lastX = e.clientX;
        lastY = e.clientY;
        if (stroke > 160) { stroke = 0; pet(); }
      });
      cat.addEventListener('pointerleave', () => { lastX = lastY = null; });
      cat.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pet(); } });
      cat.addEventListener('click', e => { if (e.pointerType !== 'mouse') pet(); });
    });
  }

  return {
    init() {
      room = null;
      const tr = document.querySelector('.tarot-room');
      if (tr) tarotRoom(tr);
      const page = document.querySelector('.games');
      if (!page) return;
      const k = page.querySelector('.cats');
      if (k) cats(k);
    },
  };
})();
