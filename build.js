// portfolio de vittoria scalmati — generador del sitio estático.
// Uso (macOS, sin instalar nada):  osascript -l JavaScript build.js "$PWD"
// Escribe el sitio en site/: index.html (portada, índice, about, contacto) y una carpeta por proyecto.
ObjC.import('Foundation');

const fm = $.NSFileManager.defaultManager;
function write(p, s) {
  fm.createDirectoryAtPathWithIntermediateDirectoriesAttributesError($(p).stringByDeletingLastPathComponent, true, $(), null);
  $(s).writeToFileAtomicallyEncodingError(p, true, $.NSUTF8StringEncoding, null);
}
const attr = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
const ROOT = ObjC.unwrap($.NSProcessInfo.processInfo.arguments).map(ObjC.unwrap).slice(-1)[0];
// el sitio en tres idiomas: inglés en la raíz, español en es/ e italiano en it/. aquí los textos están en inglés y
// traduzioni.js tiene cada uno en español y en italiano; lo que falte allí se queda en inglés y se avisa al terminar.
// las fotos, los vídeos, los libros y el blog no se repiten: todas las versiones usan los de la raíz
const LANGS = ['en', 'es', 'it'];
const TR = eval(ObjC.unwrap($.NSString.stringWithContentsOfFileEncodingError(ROOT + '/traduzioni.js', $.NSUTF8StringEncoding, null)));
let L = 'en';
const missing = new Set();
const t = s => {
  if (L === 'en' || !s) return s;
  if (TR[s] && TR[s][L] != null) return TR[s][L];
  missing.add(s);
  return s;
};

const PROJECTS = [
  { slug: 'ejercicio-de-grabado-sobre-mueble', title: 'ejercicio de grabado sobre mueble', section: 'furniture', kind: 'furniture', year: '2026' },
  {
    slug: 'morso', title: 'morso', section: 'furniture', kind: 'sculptural furniture', year: '2026', type: 'wall cabinet', dims: '80 × 30 × 83 cm',
    text: ['concept of a wall cabinet'],
    imgs: [[737, 999], [765, 1024], [765, 1024], [896, 1200]],
  },
  {
    slug: 'lazito', title: 'lazito', section: 'furniture', kind: 'sculptural furniture', year: '2025', type: 'coffee table', material: 'stainless steel', dims: '100 × 60 × 40 cm',
    lede: 'i really like bows, so i made this',
    text: [
      'this table exists because i wanted it to exist. i like bows, i find them feminine and delicate and a bit funny, and one day i imagined this table in my house and i wanted to have it, that’s all.',
      'it doesn’t answer a need and nobody asked me for it, i just felt like making something pretty and solid and with a bit of character.',
      'i know a project is supposed to come with a deeper story. sometimes you make a thing simply because you feel like it, and i think that is reason enough.',
    ],
    imgs: [[1402, 1122], [1460, 910], [1460, 910], [1415, 2000], [1415, 2000]],
    // las fotos después de la descripción, en grupos con su nota: el modelo 3d, el concepto editorial y el dibujo
    groups: [[2, 3, '3d model'], [4, 5, 'editorial concept']],
  },
  {
    slug: 'silla-mostruosa', title: 'the hedgehog’s confession', section: 'furniture', kind: 'sculptural furniture', year: '2025', type: 'engraved sculpture', material: 'ideally engraved metal or stone',
    // la primera imagen es la silla girando sola, sin fondo (un webp animado sacado del vídeo del modelo 3d);
    // la 1 y la 2, recortadas de las capturas del modelo, también sin fondo (webp con transparencia); la 3, 4 y 5 son
    // las fotos de la escultura en la sala con la ventana y dos detalles de la superficie grabada (jpg, en imgs su extensión)
    hero: ['hero.mp4', 720, 1280, 'hero-poster.jpg'], // la silla en vídeo sobre gris claro, con su primer fotograma de portada para que se vea enseguida (el giro sin fondo de antes está en originali/)
    ext: 'webp',
    text: [
      'a seat-sculpture that crosses the line between a relic of torture and an organic form. the object stands as a monolithic block, conceived in stone or heavy metal, entirely covered by a dense, meticulous engraving that recalls the weave of medieval lace.',
      'its silhouette, massive and gathered, evokes a small armoured animal, a monstrous creature that inspires a quiet tenderness. the rigid body, closed in on itself, is crowned by two sharp horns: a defence that holds the hedgehog’s paradox, where the tool meant to wound others becomes, first of all, a torment and a weight for the one who carries it.',
      'it is a material reflection on aggression as a language, on the ethical limit of communication, and on the vulnerability hidden under an impenetrable armour.',
    ],
    imgs: [[551, 706], [578, 920], [795, 1024, 'jpg'], [795, 1024, 'jpg'], [795, 1024, 'jpg']],
    // la pareja del principio lleva su nota debajo, como en lazito
    groups: [[1, 2, '3d model'], [3], [4, 5]],
  },
  {
    slug: 'budicca', title: 'budicca', section: 'furniture', kind: 'sculptural furniture', year: '2025', type: 'chainmail armchair', dims: '130 × 73 × 71.5 cm', credit: 'master thesis', textBelow: true,
    text: [
      'an armchair where you sit on armour. the frame is forged steel, one fluid line that bends like a ribbon, inspired by the infinite black chair by santo and jean ya. the seat is aluminium chainmail, hung from the frame with large aluminium rings.',
      'chainmail was made for battle, and for men. here it does the opposite: it drapes and follows the shape of your body, moves a little when you shift your weight, and gives you the feeling of sitting on air. the heavy steel holds the chair, the light mesh holds you.',
      'it belongs to the collection of my master thesis at poli.design, with a chaise longue and a hammock, about empowered femininity in furniture design. it starts from paco rabanne, who turned chainmail into a dress, and asks the same of a chair: to be strong and soft at the same time. steel and aluminium are also recyclable and made to last.',
    ],
    imgs: [[1105, 1424], [1105, 1424], [1726, 642]],
    groups: [[2], [3]], // la silla entera y, debajo, el dibujo técnico
  },
  {
    slug: 'generative-photography', title: 'generative photography', section: 'art', kind: 'personal experiments', year: '2026', type: 'personal experiments and exercises',
    text: ['here i practise with textures and body modification, but also with colour balance, light and composition.'],
    imgs: [[1024, 1024], [1024, 1024], [1024, 1024], [624, 624, 'mp4'], [1024, 1024], [1024, 1024], [1024, 1024], [1018, 640]],
  },
  { slug: 'drawing-and-painting', title: 'drawing & painting', section: 'art', year: '2023-2025' },
  { slug: 'photography', title: 'photography', section: 'art', year: '2021-2026' },
  {
    slug: 'ejercicio-de-direccion', title: 'ejercicio de dirección', section: 'art', kind: 'photography', year: '2026', type: 'photo series',
    text: [
      'an exercise in direction: i took care of every part of the image myself. styling, make-up, hair, set design and photography.',
      'model: lucía de la fuente arias.',
    ],
    cutout: false, // todavía no hay su foto recortada sin fondo (assets/img/<slug>/cutout.png): sin ella no hay foto al pasar el ratón
    imgs: [[2000, 1500], [1762, 2000], [2000, 1065]],
    groups: [[2, 3]], // la primera, grande; el retrato y la ancha, juntos
  },
  {
    slug: '3d-sculpture', title: '3d sculpture', section: 'art', year: '2026', type: 'digital art',
    text: ['kittens that grew into each other. creatures that only exist on a screen, for now.'],
    imgs: [[956, 948], [1024, 1024], [1024, 1015]],
    groups: [[2], [3]], // una debajo de otra, grandes
  },
  {
    slug: 'thesis', title: 'thesis', section: 'editorials', kind: 'editorial work', year: '2025', type: 'a woman’s place is in the revolution', credit: 'master thesis',
    text: ['my master thesis at poli.design: a magazine about empowered femininity in furniture design, and a collection of chainmail pieces that take a material made for battle and turn it into something soft to rest in, like <a href="../budicca/index.html">budicca</a>.'],
    imgs: [[2000, 1438], [2000, 1438], [2000, 1438], [2000, 1438], [2000, 1438], [1112, 1502], [1112, 1502]],
    // en su página solo está el libro, que se hojea: las dobles páginas del pdf de la tesis (sin la 1, 2, 21, 23-25
    // ni 28-37), en assets/img/thesis/book/01.jpg… de 2600 × 1759
    book: 21, bookAt: 8, bookSize: [2600, 1759], // se abre por la doble página 8
  },
  {
    slug: 'coat-hanger-book', title: 'coat hanger book', section: 'editorials', kind: 'editorial work', year: '2024', type: 'elogio all’oggetto banale', credit: 'final thesis project',
    text: ['estetizzazione di una gruccia. a book about the wire coat hanger, the most boring object in the house, and the artists who couldn’t stop looking at it: man ray, jasper johns, masao yamamoto. half essay, half collection of images, it follows the hanger from the closet to the museum.'],
    imgs: [[2000, 1333], [1750, 2000], [1750, 2000], [1750, 2000], [1182, 1416], [1396, 1656], [1396, 1656]],
    // en vez de la galería, debajo del texto, el libro que se hojea: las dobles páginas del pdf (sin la 1, 2, 78 ni 79),
    // en assets/img/coat-hanger-book/book/01.jpg… de 2600 × 1548 (grandes, para que se lea el texto en pantallas
    // retina); tapa dura gris y papel gris claro. se abre por la doble página 33
    book: 75, bookAt: 33, bookSize: [2600, 1548], bookStyle: 'hard', bookBelow: true,
  },
  {
    slug: 'museo', title: 'museo', section: 'editorials', kind: 'editorial work', year: '2024', type: 'photo book', credit: 'final thesis project',
    text: ['a small museum of ordinary objects: a pencil sharpener, a bell, a pair of dice, a few pencils. each one photographed in black and white as if it were a work of art, one object per page and a lot of silence around it. every photograph in the book is analog, shot on film: it took a very, very long time.'],
    imgs: [[2000, 1500], [2000, 1500], [2000, 1500], [2000, 1500], [1396, 1418], [1396, 1418], [1396, 1418], [1396, 1418], [1396, 1418]],
    // como coat hanger book: debajo del texto, el libro que se hojea en vez de la galería. las dobles páginas del pdf
    // (sin la 1, 67, 68, 94 ni 99, y sin los subrayados amarillos, que eran anotaciones), en
    // assets/img/museo/book/01.jpg… de 2600 × 1320
    book: 94, bookAt: 46, bookSize: [2600, 1320], bookStyle: 'hard', bookBelow: true,
  },
  { slug: 'micromina-blog', title: 'microblogging', section: 'editorials', kind: 'editor', year: '2026', href: 'micromina/index.html' }, // el blog, dentro del sitio (al final de este archivo)
];
const SHOWN = PROJECTS.filter(p => p.imgs);
// orden de lectura para «next»: furniture → editorials → art, como en el índice
const READING = ['morso', 'lazito', 'silla-mostruosa', 'budicca', 'thesis', 'coat-hanger-book', 'museo', 'generative-photography', 'ejercicio-de-direccion', '3d-sculpture'].map(s => SHOWN.find(p => p.slug === s));

// brillo que suena: [x, y, tamaño] en % de la imagen
const light = ([x, y, s]) => `<button class="light" type="button" style="--x:${x}%;--y:${y}%;--s:${s}%" aria-label="${t('make the light sing')}" aria-pressed="false"><span class="light-hint">${t('touch the light')}</span></button>`;
// la pantalla del principio, antes de bajar: un cuadro de diálogo de videojuego que se escribe solo,
// avisa de que casi todo se puede tocar e invita a empezar (assets/portfolio-ui.js); al pulsar «start» suena un clic metálico
const intro = words => `<div class="intro" data-say="${attr(words)}">
  <div class="intro-box" role="dialog" aria-label="${attr(words)}">
    <p class="oracle-name">vittoria scalmati · portfolio</p>
    <p class="oracle-text" aria-hidden="true"></p>
    <button class="intro-start" type="button">${t('start ▸')}</button>
  </div>
</div>`;
// cada build cambia este número en los enlaces al css y al js, para que el navegador no use una copia vieja
const VER = Date.now().toString(36);
// la cara del final: al llegar al contacto entra flotando con su aura borgoña, dice la frase en un cuadro de diálogo
// como los videojuegos de la primera playstation, y al terminar cierra los ojos y sonríe (assets/portfolio-ui.js).
// face.png (ojos abiertos) y face-smile.png (ojos cerrados, sonriendo) tienen el mismo encuadre. mientras habla,
// sobre la boca de face.png se pinta solo la boca del vídeo face.mp4 (sin sonido), con los bordes difuminados
const oracle = (words, R) => `<div class="oracle" data-say="${attr(words)}">
  <div class="oracle-face">
    <div class="oracle-bob">
      <img src="${R}assets/img/home/face.png" alt="" width="468" height="690">
      <video class="face-video" src="${R}assets/video/face.mp4?v=${VER}" muted playsinline preload="auto" aria-hidden="true" style="position:absolute;width:1px;height:1px;opacity:0;pointer-events:none"></video>
      <canvas class="face-mouth" width="460" height="340"></canvas>
      <img class="face-smile" src="${R}assets/img/home/face-smile.png" alt="" width="468" height="690" loading="lazy">
    </div>
  </div>
  <div class="oracle-box" role="dialog" aria-label="${attr(words)}">
    <p class="oracle-name">vittoria</p>
    <p class="oracle-text" aria-hidden="true"></p>
    <button class="oracle-close" type="button" aria-label="${t('close')}">✕</button>
  </div>
</div>`;
// chica que habla al tocarla, sin sonido (assets/portfolio-ui.js): lo que dice, dónde empieza la cabeza (% desde arriba,
// para que la frase quede justo encima) y su boca. la boca es la del vídeo girl.mp4 (la misma chica hablando), pintada
// en un canvas encima de la foto: solo un óvalo alrededor de los labios, opaco en el centro y fundido con la piel.
// m: photo = tamaño de la foto; map = [escala, x, y] que lleva el vídeo a la foto (medido comparando los labios del
// primer fotograma con los de la foto); c = centro de la boca y w = ancho de los labios, en px de la foto;
// seg = el trozo del vídeo que dice la frase, que empieza y acaba con la boca cerrada; tone = [a, b] por canal (r, g, b)
// para que el color del vídeo sea el de la foto (a × vídeo + b, medido con la boca cerrada); grain = la grana de la foto;
// ask = respuestas que aparecen al terminar la frase (las dos llevan al contacto) y reply = lo que contesta entonces
const talker = (words, head, { photo: [W, H], map: [s, ox, oy], c: [cx, cy], w, seg, tone, grain, ask, reply }, R) => {
  words = t(words);
  const rx = .95 * w, up = .42 * w, down = .7 * w;
  const x0 = cx - rx, y0 = cy - up, pw = 2 * rx, ph = up + down;
  const k = Math.max(2, 240 / pw);
  const src = [(x0 - ox) / s, (y0 - oy) / s, pw / s, ph / s].map(n => n.toFixed(2)).join(',');
  const pc = (a, b) => `${(a / b * 100).toFixed(3)}%`;
  return `<video class="mouth-video" src="${R}assets/video/girl.mp4?v=${VER}" muted playsinline preload="auto" aria-hidden="true" style="position:absolute;width:1px;height:1px;opacity:0;pointer-events:none"></video>
      <canvas class="mouth-live" width="${Math.round(pw * k)}" height="${Math.round(ph * k)}" data-src="${src}" data-seg="${seg.join(',')}" data-tone="${tone.join(',')}" data-grain="${grain.join(',')}" data-k="${k.toFixed(3)}" data-up="${(up / ph).toFixed(4)}" style="left:${pc(x0, W)};top:${pc(y0, H)};width:${pc(pw, W)}" aria-hidden="true"></canvas>
      <button class="talk" type="button" aria-label="${attr(t('say:'))} ${attr(words)}"></button>
      <span class="bubble" style="--by:${head}%" aria-live="polite"${reply ? ` data-reply="${attr(t(reply))}"` : ''}><span class="bubble-text">${words}</span>${ask ? `<span class="bubble-choices">${ask.map(a => `<a href="#contact">${t(a)}</a>`).join('')}</span>` : ''}</span>`;
};
const pimg = (pre, slug, i, ext = 'jpg') => `${pre}assets/img/${slug}/${i}.${ext}?v=${VER}`;
// la foto que sigue al ratón: el proyecto recortado, sin fondo (assets/img/<slug>/cutout.png)
const pcut = (pre, slug) => `${pre}assets/img/${slug}/cutout.png?v=${VER}`;
const entryLine = p => `${t(p.title)} <i>|</i> ${p.kind ? t(p.kind) + ' <i>|</i> ' : ''}${p.year}`;

// pre lleva a la portada de su idioma, R a la raíz del sitio (donde están assets/ y el blog); path es esta página
// dentro de su idioma, para que «en · es · it» lleve a la misma en el otro (sin path, como en el blog, no sale)
function folioDoc({ pre, R = pre, path, title, desc, body, cls }) {
  const langs = path == null ? '' : `
  <nav class="bar-lang" aria-label="language">${LANGS.map(l => `<a href="${R}${l === 'en' ? '' : l + '/'}${path}" hreflang="${l}" lang="${l}"${l === L ? ' aria-current="true"' : ''}>${l}</a>`).join('<i>·</i>')}</nav>`;
  return `<!doctype html>
<html lang="${L}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title}</title>
<meta name="description" content="${attr(desc)}">
<meta property="og:title" content="${attr(title)}">
<meta property="og:description" content="${attr(desc)}">
<link rel="icon" href="${R}assets/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Ballet:opsz@16..72&family=Pinyon+Script&family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;1,6..96,400&family=Source+Sans+3:wght@400;500&family=VT323&display=swap">
<link rel="stylesheet" href="${R}assets/portfolio.css?v=${VER}">
<script>document.documentElement.classList.add('js');try{if(sessionStorage.getItem('intro-seen'))document.documentElement.classList.add('intro-seen')}catch(e){}</script>
</head>
<body class="${cls}">
<header class="bar">
  <a class="bar-name" href="${pre}index.html">vittoria scalmati</a>
  <nav class="bar-nav" aria-label="portfolio">
    <a href="${pre}index.html#index">portfolio</a>
    <a href="${pre}index.html#about">${t('about')}</a>
    <a href="${pre}creative-process/index.html">${t('creative process')}</a>
    <a href="${pre}cv/index.html">cv</a>
    <a href="${pre}index.html#contact">${t('contact')}</a>
  </nav>${langs}
</header>
${body}
<a class="games-link" href="${pre}mini-games/index.html">${t('mini games ▸')}</a>
<img class="preview" alt="" aria-hidden="true">
<script src="${R}assets/minigames.js?v=${VER}" defer></script>
<script src="${R}assets/portfolio-ui.js?v=${VER}" defer></script>
<script src="${R}assets/portfolio.js?v=${VER}" defer></script>
</body>
</html>
`;
}

// el «holi,» de la portada del blog y el «cv» cambian de letra sin parar, como «microvitti» en las manos: las mismas ocho maneras
// (cursiva fina, palo seco negro, pincel, bodoni estrecha, cursiva de píxeles, píxeles finos, mayúsculas de cartel y
// redonda gorda), con letras de verdad. [familia, tamaño]
const HOLI_FORMS = [
  ["'Pinyon Script'", 1.6], ["'Archivo Black'", .75], ["'Kaushan Script'", 1.02], ["'Abril Fatface'", .85],
  ["'FT88 School'", .5], ['VT323', .88], ['Limelight', .71], ["'Bagel Fat One'", .92],
];
const flick = (word, extra = '') => `<h1 class="mm-flick${extra} reveal" aria-label="${word}">${HOLI_FORMS.map(([f, k], i) => `<span class="nf${i ? '' : ' on'}" style="font-family:${f};font-size:${k}em" aria-hidden="true">${word}</span>`).join('')}</h1>`;
// el cv, sin experiencia laboral ni perfil: la formación y las habilidades. cada idioma lleva lo suyo, copiado de su pdf (en originales: «cv vittoria scalmati english 07:26 archival»,
// «cv esp vittoria scalmati 2026 archival» y «cv italiano vittoria scalmati»), así que no son idénticos. de los datos
// personales solo sale el correo: ni teléfono, ni dirección, ni año de nacimiento
const CV = {
  en: {
    desc: 'the cv of vittoria scalmati.',
    labels: { study: 'education', skills: 'skills', langs: 'languages', mail: 'contact' },
    study: [
      ['2023–2024', 'politecnico di milano | poli.design', 'milano', 'furniture design master', ['structural design', 'material manipulation', 'history of design']],
      ['2019–2022', 'fine arts', 'urbino', 'fine arts degree', ['printmaking', 'material textures', 'visual culture']],
    ],
    skills: ['adobe creative suite', 'artistic mixed media', 'ai image & video workflows', '3d model making', 'analog photography', 'creative direction', 'styling', 'printmaking & engraving', 'drawing & painting', 'sculpture', 'furniture design', 'editorial design', 'exhibition design', 'material experimentation'],
    langs: ['italian | native', 'spanish | fluent', 'english | fluent', 'french | b2'],
  },
  es: {
    desc: 'el cv de vittoria scalmati.',
    labels: { study: 'formación', skills: 'habilidades', langs: 'idiomas', mail: 'contacto' },
    study: [
      ['2023–2024', 'politecnico di milano | poli.design', 'milano', 'furniture design master', ['diseño estructural', 'manipulación de materiales', 'historia del diseño']],
      ['2019–2022', 'accademia belle arti', 'urbino', 'fine arts degree', ['grabado', 'texturas de materiales', 'fotografía analógica']],
    ],
    skills: ['adobe creative suite', 'técnicas mixtas artísticas', 'flujos de trabajo de imagen y vídeo con ia', 'modelado 3d', 'fotografía analógica', 'dirección creativa', 'estilismo', 'grabado', 'dibujo y pintura', 'escultura', 'diseño de mobiliario', 'diseño editorial', 'montaje de exposiciones', 'experimentación con materiales'],
    langs: ['italiano | nativo', 'español | fluido (c2)', 'inglés | fluido (c2)', 'francés | b2'],
  },
  it: {
    desc: 'il cv di vittoria scalmati.',
    labels: { study: 'istruzione e formazione', skills: 'competenze', langs: 'lingue', mail: 'contatti' },
    study: [
      ['2023–2024', 'master furniture design', 'politecnico di milano', '', ['progettazione di mobili', 'ricerca concettuale', 'sviluppo del prodotto', 'materiali', 'tecniche costruttive', 'sperimentazione progettuale']],
      ['2019–2022', 'grafica d’arte', 'accademia di belle arti di urbino', '', ['grafica', 'stampa d’arte', 'fotografia', 'progettazione visiva', 'ricerca artistica', 'sperimentazione di tecniche e linguaggi']],
    ],
    skills: ['adobe creative suite', 'tecniche miste artistiche', 'workflow di immagini e video con ai', 'modellazione 3d', 'fotografia analogica', 'direzione creativa', 'styling', 'stampa d’arte e incisione', 'disegno e pittura', 'scultura', 'furniture design', 'editorial design', 'allestimento di mostre', 'sperimentazione con i materiali'],
    langs: ['italiano | madrelingua', 'inglese | advanced c2', 'spagnolo | advanced c2', 'francese | intermedio b2'],
  },
};

// ── las páginas, una vez por idioma ──
LANGS.forEach(lang => {
L = lang;
// R0 lleva a la raíz desde la portada de cada idioma, R1 desde una página que está una carpeta más abajo
const R0 = L === 'en' ? '' : '../', R1 = '../' + R0;
const out = path => ROOT + '/site/' + (L === 'en' ? '' : L + '/') + path;

// ── home ──
const indexCol = (sec, d) => `<div class="idx-col idx-${sec} reveal" style="--d:${d}">
      <h2 class="script">${t(sec === 'furniture' ? 'sculptural furniture' : sec)}</h2>
      <ul>
        ${PROJECTS.filter(p => p.section === sec).map(p => p.imgs
          ? `<li><a href="${p.slug}/index.html"${p.cutout === false ? '' : ` data-img="${pcut(R0, p.slug)}"`}>${entryLine(p)}</a></li>`
          : p.href
            ? `<li><a href="${R0}${p.href}">${entryLine(p)}</a></li>`
            : `<li class="soon"><span data-soon="${t('soon')}">${entryLine(p)}</span></li>`).join('\n        ')}
      </ul>
    </div>`;

// sobre las manos, su nombre cambia de letra muy deprisa (assets/portfolio-ui.js): la pinyon script del sitio y otras siete,
// calcadas en vectores de las capturas que mandó vittoria (originali/microvitti/), todas al mismo cuerpo de letra.
// se respeta ese tamaño: [número, ancho en las capturas]; la más ancha (614) ocupa el 88 % del ancho de las manos
const NAMES = [[2, 596], [3, 494], [4, 424], [5, 614], [6, 586], [7, 520], [8, 585]];
write(out('index.html'), folioDoc({
  pre: '',
  R: R0,
  path: 'index.html',
  title: 'vittoria scalmati · portfolio',
  desc: t('vittoria scalmati — furniture design, art, editorials. 2026.'),
  cls: 'home',
  body: `${intro(t("hi, welcome in. almost everything here is alive. you can play with it if you please. nothing breaks. ready?"))}
<main>
  <section class="hands" aria-label="portfolio">
    <figure class="hands-fig reveal">
      <img src="${R0}assets/img/home/hands.jpg" alt="${t('two open hands with little lights in their palms')}" width="766" height="614">
      <h1 class="hands-name" aria-label="microvitti"><span class="nf nf-script script on" aria-hidden="true">microvitti</span>${NAMES.map(([n, a]) => `<img class="nf" src="${R0}assets/img/home/microvitti-${n}.svg?v=${VER}" alt="" aria-hidden="true" style="width:${(88 * a / 614).toFixed(1)}%">`).join('')}</h1>
      ${[[32, 43, 12], [57.4, 69.2, 12]].map(light).join('\n      ')}
    </figure>
    <p class="hands-sub reveal" style="--d:2">${t('visual artist – furniture designer – editor')}</p>
  </section>

  <section class="index" id="index">
    ${indexCol('furniture', 0)}
    ${indexCol('editorials', 1)}
    ${indexCol('art', 2)}
    <figure class="idx-fig reveal" style="--d:3">
      <img src="${R0}assets/img/home/tree.jpg" alt="${t('vittoria in tree pose, a light between her hands')}" width="806" height="1034" loading="lazy">
      ${talker('hello spiritual gangsta', 11, { photo: [806, 1034], map: [.27, 219.48, 200.48], c: [390.85, 218.97], w: 29.7, seg: [.3, 3.3], tone: [.85, 38.6, .85, 40.1, .85, 40.2], grain: [3.9, 5.7, 5.7] }, R0)}
      ${light([50, 32, 20])}
    </figure>
  </section>

  <section class="about" id="about">
    <div class="about-side">
      <figure class="about-fig reveal">
        <img src="${R0}assets/img/home/about.jpg" alt="${t('vittoria, hands together, a light between them')}" width="894" height="1034" loading="lazy">
        ${talker('stop looking for a sign. you are ready to hire me.', 6.5, { photo: [894, 1034], map: [.7168, -12.01, 263.56], c: [442.95, 312.66], w: 78.85, seg: [3.55, 7.9], tone: [.896, 29.4, .995, 2.7, 1.04, -8.8], grain: [3, 4.4, 4.7], ask: ['yes', 'yes'], reply: 'i know. write me, i’m waiting.' }, R0)}
        ${light([47.5, 50.5, 22])}
      </figure>
    </div>
    <div class="about-text">
      <h2 class="script reveal">${t('about me')}</h2>
      <div class="bio reveal" style="--d:1">
        <p>${t(`vittoria scalmati is a furniture designer, editorial designer and artist, also working under the name microvitti. she is italian and lives and works in madrid. she studied fine arts and art history, then completed a master in furniture design at the politecnico di milano and worked in the studio of francesco faccin.`)}</p>
        <p>${t(`her work starts from the experience of being, or feeling, defenseless: the fear of not knowing how to protect herself and the fear of pain. it draws on memories, dreams, foggy things that happened and things that haven’t happened yet. her memory has always been unreliable and her mind is often clouded, so when she feels she is floating too much she holds on to what is concrete. she looks for materials that conduct temperature well, rough materials, anything that stimulates touch and keeps her feet on the ground.`)}</p>
        <p>${t(`what she looks for in everything she makes is that you want to touch it and aren’t afraid it will break. sometimes they still break. she hopes that one day all her objects will be strong like that. the stronger an object looks, the more it tends to come from a fragile and painful memory, and she isn’t sure whether the strength protects that memory or only covers it.`)}</p>
      </div>
      <div class="facts reveal" style="--d:2">
        <div>
          <h3>${t('practice')}</h3>
          <p>${['sculptural furniture', 'editorial design — three books', 'drawing &amp; painting', 'photography', '3d sculpture'].map(t).join('<br>')}</p>
        </div>
        <div>
          <h3>${t('education')}</h3>
          <p>${t('master in furniture design | poli.design | milan | 2023–2024')}<br>${t('fine arts degree | fine arts academy | urbino | 2019–2022')}</p>
          <h3>microblogging</h3>
          <p>${t('editor')}</p>
        </div>
      </div>
    </div>
  </section>

  <section class="contact" id="contact">
    <p class="script reveal"><a href="${R0}micromina/index.html">microblogging</a></p>
    <div class="contact-lines reveal" style="--d:1">
      <p>vittoria scalmati</p>
      <p><a href="mailto:vittoria.scalmati@gmail.com">vittoria.scalmati@gmail.com</a></p>
      <p><a href="https://www.instagram.com/microvitti/" target="_blank" rel="noopener">@microvitti</a></p>
      <p>${t('based in madrid')}</p>
    </div>
    <p class="thanks reveal" style="--d:2">${t('see you soon! good bye')}</p>
  </section>
</main>
${oracle(t("even if you proceed slowly keep walking, if you do, you'll reach your dreams."), R0)}`,
}));

// ── una página por proyecto ──
// todas igual: el título en cursiva; debajo el subtítulo, en negro y en minúscula (en esta web nada empieza con
// mayúscula); una foto grande de presentación; la descripción; en gris claro nombre | proyecto | año | material | medidas (si los
// hay) | personal project (o master thesis, lo que salió del máster); y luego las fotos al ritmo de dos juntas y una en el centro, dos juntas y una en el centro…
// las dos de cada pareja salen a la misma altura (cada una ocupa el ancho que le toca por su proporción)
// el libro abierto que se hojea (assets/portfolio-ui.js): cada mitad enseña media doble página.
// bookStyle 'hard' es la tapa dura gris que asoma por detrás, con el papel gris claro (coat hanger book)
const bookFig = p => {
  const at = p.bookAt || 1, [w, h] = p.bookSize || [1600, 1083], first = `${R1}assets/img/${p.slug}/book/${String(at).padStart(2, '0')}.jpg?v=${VER}`;
  return `<figure class="book${p.bookStyle ? ` book-${p.bookStyle}` : ''} reveal" style="--d:2;--ratio:${w} / ${h}" data-n="${p.book}" data-at="${at}" data-src="${R1}assets/img/${p.slug}/book/" data-v="${VER}" aria-label="${attr(t(p.title))}, ${t('page by page')}">
    <div class="book-stage">
      <div class="book-cover"></div>
      <div class="book-half book-l"><img src="${first}" alt="" width="${w}" height="${h}" draggable="false"></div>
      <div class="book-half book-r"><img src="${first}" alt="" width="${w}" height="${h}" draggable="false"></div>
      <div class="book-cast book-cast-l"></div><div class="book-cast book-cast-r"></div>
    </div>
    <figcaption class="book-nav"><button class="book-prev" type="button" aria-label="${t('previous page')}"${at === 1 ? ' disabled' : ''}>←</button><span class="book-count">${at} / ${p.book}</span><button class="book-next" type="button" aria-label="${t('next page')}">→</button></figcaption>
  </figure>`;
};
READING.forEach((p, k) => {
  const next = READING[(k + 1) % READING.length];
  // una foto con ext 'mp4' es un vídeo: se mueve solo, en bucle y sin sonido, como una foto viva
  const fig = (n, [w, h, ext], extra = '') => ext === 'mp4'
    ? `<figure${extra}><video src="${pimg(R1, p.slug, n, ext)}" width="${w}" height="${h}" autoplay muted loop playsinline preload="metadata" aria-label="${attr(t(p.title))}, video ${n}"></video></figure>`
    : `<figure${extra}><img src="${pimg(R1, p.slug, n, ext || p.ext)}" alt="${attr(t(p.title))}, ${t('image')} ${n}" width="${w}" height="${h}" loading="lazy"></figure>`;
  const pairRow = (ns, cap) => `<div class="g-group reveal"><div class="g-pair">${ns.map(n => fig(n, p.imgs[n - 1], ` style="flex:${(p.imgs[n - 1][0] / p.imgs[n - 1][1]).toFixed(3)}"`)).join('')}</div>${cap ? `<p class="g-cap">${t(cap)}</p>` : ''}</div>`;
  const oneRow = (n, cap) => { const s = p.imgs[n - 1]; return `<div class="g-group g-single g-${s[0] > s[1] * 1.15 ? 'wide' : 'tall'} reveal">${fig(n, s)}${cap ? `<p class="g-cap">${t(cap)}</p>` : ''}</div>` };
  const first = p.hero ? 1 : 2; // con hero aparte (la silla girando), la galería empieza por la foto 1
  const rest = p.imgs.slice(first - 1).map((size, i) => [i + first, size]);
  const rows = [];
  // si el proyecto dice cómo van sus fotos (groups: [n, n, nota] o [n, nota]), se respeta; si no, el ritmo de siempre
  if (p.groups) p.groups.forEach(g => { const ns = g.filter(v => typeof v === 'number'), cap = g.find(v => typeof v === 'string'); rows.push(ns.length > 1 ? pairRow(ns, cap) : oneRow(ns[0], cap)) });
  else for (let i = 0, pair = true; i < rest.length; pair = !pair) {
    if (pair && i + 1 < rest.length) {
      rows.push(pairRow([rest[i][0], rest[i + 1][0]]));
      i += 2;
    } else {
      rows.push(oneRow(rest[i][0]));
      i += 1;
    }
  }
  const meta = [t(p.title), t(p.kind || p.type), p.year, t(p.material), p.dims, t(p.credit || 'personal project')].filter(Boolean).join(' | ');
  const [hsrc, hw, hh] = p.hero ? [`${R1}assets/img/${p.slug}/${p.hero[0]}?v=${VER}`, p.hero[1], p.hero[2]] : [pimg(R1, p.slug, 1), ...p.imgs[0]];
  // el texto del proyecto; con textBelow va al final, después de todas las fotos
  const ptext = `<section class="p-text">
    ${p.lede ? `<h2 class="reveal">${t(p.lede)}</h2>` : ''}
    ${p.text.map(x => `<p class="reveal">${t(x)}</p>`).join('\n    ')}
    ${p.translation ? `<p class="p-translation reveal">${t(p.translation)}</p>` : ''}
    <p class="p-meta reveal">${meta}</p>
  </section>`;
  write(out(`${p.slug}/index.html`), folioDoc({
    pre: '../',
    R: R1,
    path: `${p.slug}/index.html`,
    title: `${t(p.title)} · vittoria scalmati`,
    desc: `${t(p.title)} — ${t(p.kind || p.type)} — ${p.year}. ${t('vittoria scalmati portfolio.')}`,
    cls: 'project',
    body: `<main>
  <section class="p-head">
    <h1 class="p-title${t(p.title).length > 16 ? ' p-title-long' : ''} script reveal">${t(p.title)}</h1>
    ${p.type && t(p.type) !== t(p.title) && !(p.book && !p.bookBelow) ? `<p class="p-type reveal" style="--d:2">${t(p.type)}</p>` : ''}
  </section>
  ${p.book && !p.bookBelow ? bookFig(p) : `<figure class="p-hero${p.hero ? ' p-hero-cut' : ''} reveal" style="--d:2">${/\.mp4$/.test(p.hero?.[0] || '') ? `<video src="${hsrc}"${p.hero[3] ? ` poster="${R1}assets/img/${p.slug}/${p.hero[3]}?v=${VER}"` : ''} width="${hw}" height="${hh}" autoplay muted loop playsinline preload="auto" aria-label="${attr(t(p.title))}"></video>` : `<img src="${hsrc}" alt="${attr(t(p.title))}" width="${hw}" height="${hh}">`}</figure>`}
  ${p.textBelow ? '' : ptext}
  ${p.book ? (p.bookBelow ? `<section class="p-book">${bookFig(p)}</section>` : '') : `<section class="p-gallery">
    ${rows.join('\n    ')}
  </section>`}
  ${p.textBelow ? ptext : ''}
  <a class="p-next" href="../${next.slug}/index.html"${next.cutout === false ? '' : ` data-img="${pcut(R1, next.slug)}"`}>
    <span>${t('next')}</span>
    <strong class="script">${t(next.title)}</strong>
  </a>
  <footer class="p-foot"><a href="../index.html#index">← portfolio</a><span>micromina — vittoria scalmati</span></footer>
</main>`,
  }));
});

// ── creative process: el gabinete de curiosidades ──
// toda la pantalla es la foto de la estantería con objetos de mi vida (assets/img/process/cabinet.jpg, 2000 × 1116),
// ya aclarada para que sea más etérea, y encima una luz que brilla. cada objeto es una zona que se puede tocar:
// es algo muy mío, y poco a poco iremos contando qué (las frases de ahora son provisionales).
// el cuadro de diálogo está siempre abajo, como en un videojuego (assets/portfolio-ui.js).
// cada objeto: [el sonido al pasar por encima (assets/portfolio-ui.js), nombre, lo que se dice de él, x0, y0, x1, y1 en
// píxeles de la foto, y lo que trae de más]: close = primer plano que se acerca con «look closer» (en
// assets/img/process), closeLine = lo que se dice entonces, ask / go = una pregunta con «yes» / «no» y adónde lleva el
// «yes», link / linkLabel = un enlace que se abre aparte
const PLAYLIST = 'https://www.youtube.com/watch?v=d56hMURt3N4&list=PLNNaWGNlzzQA&pp=sAgC';
const CURIOS = [
  ['shatter', 'candelabra', 'i found it in the most remote corner of a store in my town. it was so old and forgotten that it still has its price in the old italian currency. it reminds me of home.', 705, 45, 895, 318],
  ['crack', 'candlestick', 'i use it to light incense. only when i’m home alone.', 915, 18, 1035, 318],
  ['wood', 'juanki and marcelo', 'a black carved frame, and inside juanki and marcelo, my two cats.', 1098, 72, 1350, 320, { close: 'close-cats.webp', ask: 'would you like to pet them?', go: '../mini-games/index.html#cats' }],
  ['cd', 'cher', 'the only album cover in the world with more animal print than human skin.', 595, 440, 785, 614],
  ['burn', 'sage', 'i use it to clean my spaces whenever the air feels heavy.', 790, 500, 1056, 626],
  ['lid', 'crystal jar', 'a crystal jar with a lid, for keeping sweet things.', 1155, 390, 1285, 624],
  ['fizz', 'glass', 'a small glass of a certain fizzy drink that keeps me hooked.', 1283, 535, 1352, 628],
  ['sparkle', 'crystal bowl', 'a cut crystal bowl. it catches all the light.', 1352, 543, 1505, 627],
  ['clink', 'tin box', 'a round tin box with a bow on top.', 628, 778, 862, 920, { close: 'close-box.webp', closeLine: 'god forbid a girl doesn’t know where to keep her secrets.' }],
  ['keys', 'laptop', 'the videos i chill with.', 995, 665, 1335, 914, { link: PLAYLIST, linkLabel: 'watch them' }],
];
const IMG_W = 2000, IMG_H = 1116;
const pct = (v, total) => `${(v / total * 100).toFixed(2)}%`;
const curio = ([sound, name, line, x0, y0, x1, y1, m = {}]) => (name = t(name), `<button class="curio" type="button" style="left:${pct(x0, IMG_W)};top:${pct(y0, IMG_H)};width:${pct(x1 - x0, IMG_W)};height:${pct(y1 - y0, IMG_H)}" data-name="${attr(name)}" data-sound="${sound}" data-line="${attr(t(line))}"${m.close ? ` data-close="${R1}assets/img/process/${m.close}?v=${VER}"` : ''}${m.closeLine ? ` data-close-line="${attr(t(m.closeLine))}"` : ''}${m.ask ? ` data-ask="${attr(t(m.ask))}" data-go="${m.go}"` : ''}${m.link ? ` data-link="${attr(m.link)}" data-link-label="${attr(t(m.linkLabel))}"` : ''} aria-label="${attr(name)}"></button>`);
write(out('creative-process/index.html'), folioDoc({
  pre: '../',
  R: R1,
  path: 'creative-process/index.html',
  title: `${t('creative process')} · vittoria scalmati`,
  desc: t('my cabinet of curiosities: every object stands for something closely tied to me.'),
  cls: 'process',
  body: `<main class="cabinet" data-welcome="${attr(t('welcome to my cabinet of curiosities. every object on this shelf stands for something closely tied to me. look around, and pick one up.'))}" data-idle="${attr(t('look around. pick something up.'))}">
  <h1 class="visually-hidden">${t('creative process')}</h1>
  <p class="items">${t('items')} <span class="items-n">0</span>/${CURIOS.length}</p>
  <div class="stage">
    <img class="cab-photo" src="${R1}assets/img/process/cabinet.jpg?v=${VER}" alt="${t('a small dark wooden shelf on a wall with things from my life: an amber candelabra, a black frame with a photo of my two cats, a cher album, sage burning in a bowl, crystal, a tin box and a laptop')}" width="${IMG_W}" height="${IMG_H}">
    <img class="cab-bloom" src="${R1}assets/img/process/cabinet.jpg?v=${VER}" alt="" aria-hidden="true">
    <img class="mac-screen" src="${R1}assets/img/process/mac-screen.jpg?v=${VER}" alt="" aria-hidden="true" style="left:${pct(1054, IMG_W)};top:${pct(676, IMG_H)};width:${pct(263, IMG_W)};height:${pct(188, IMG_H)}">
    <canvas class="smoke" width="400" height="336" data-from="0.515,0.952" style="left:${pct(905, IMG_W)};top:${pct(352, IMG_H)};width:${pct(200, IMG_W)}" aria-hidden="true"></canvas>
    <div class="lamp" aria-hidden="true"></div>
    ${CURIOS.map(curio).join('\n    ')}
    <div class="closeup" hidden><img alt=""></div>
    <div class="game-box" role="dialog" aria-label="${t('creative process')}" aria-live="polite">
      <p class="game-text"></p>
      <p class="game-choices"></p>
    </div>
  </div>
</main>`,
}));

// ── tarot reader: la tarotista en su página ──
// sobre blanco, iluminada por detrás con una luz blanca y mística: un halo que respira, unos rayos que giran despacio
// y polvo de luz que sube. ella habla en el cuadro de abajo, baraja y reparte tres cartas sobre la mesa
// (assets/minigames.js). los brazos y el cuerpo son la foto, quietos; la cabeza está viva: assets/video/tarot-reader.bin
// es su cabeza sacada del vídeo de gemini y encajada en la foto, y minigames.js la pinta en un canvas encima del cuerpo
// sin cabeza (tarot-reader-body.webp). tarot-reader.webp es la foto entera con el primer fotograma de la cabeza: es lo
// que se ve mientras carga, y lo que se queda sin webcodecs o webgl
const dust = Array.from({ length: 26 }, (_, i) => `<i style="--x:${(8 + (i * 37) % 84).toFixed(1)}%;--s:${(2 + (i * 7) % 4)}px;--t:${(9 + (i * 5) % 9)}s;--d:-${((i * 1.7) % 12).toFixed(1)}s"></i>`).join('');
write(out('tarot-reader/index.html'), folioDoc({
  pre: '../',
  R: R1,
  path: 'tarot-reader/index.html',
  title: `${t('tarot reader')} · vittoria scalmati`,
  desc: t('sit at her table: she shuffles, deals three cards and reads them for you.'),
  cls: 'tarot-page',
  body: `<main class="tarot-room">
  <h1 class="visually-hidden">${t('tarot reader')}</h1>
  <div class="tr-light" aria-hidden="true"><i class="tr-rays"></i><i class="tr-halo"></i><span class="tr-dust">${dust}</span></div>
  <div class="tr-reader"><img src="${R1}assets/img/games/tarot-reader.webp?v=${VER}" alt="${t('the tarot reader: a young woman with her hair pinned up, in a leopard dress, holding tarot cards')}" width="712" height="860" data-video="${R1}assets/video/tarot-reader.bin?v=${VER}" data-body="${R1}assets/img/games/tarot-reader-body.webp?v=${VER}"></div>
  <div class="tr-table" aria-hidden="true"></div>
  <div class="tr-spread">
    ${['the past', 'right now', 'what is coming'].map(pos => `<figure class="tcard" aria-label="${t(pos)}"><div class="tcard-in"><div class="tcard-back" aria-hidden="true"></div><div class="tcard-face"></div></div></figure>`).join('\n    ')}
  </div>
  <div class="tr-box" role="dialog" aria-label="${t('tarot reader')}" aria-live="polite">
    <p class="tr-text"></p>
    <p class="tr-choices"></p>
  </div>
</main>`,
}));

// ── mini games: dos juegos pequeños (assets/minigames.js) ──
// tarot reader: la puerta a su página (tarot-reader/), donde la tarotista lee tres cartas.
// pet my cats: mis gatos, juanki y marcelo, duermen; si los acaricias te dicen una frase (las frases, en minigames.js, aún por decidir)
// juanki es el blanco y atigrado, marcelo el atigrado
// marcelo es el modelo 3d (assets/img/games/marcelo.glb, sacado del obj de meshy y aligerado): está despierto, con la pata arriba, quieto y mirando de frente
// [nombre, pelo, sombra, modelo 3d, desde dónde se mira, si duerme, adónde mira la cámara (marcelo, más arriba y un poco más lejos, para que su sombra no se corte en el borde)]. juanki también es 3d (juanki.glb): duerme hecho una barra de pan
const CATS = [['juanki', '#e9dccb', '#cdbba5', 'juanki.glb', '-50deg 72deg 78%', true], ['marcelo', '#9c948c', '#7d756e', 'marcelo.glb', '-8deg 80deg 80%', false, '0m -0.14m 0m']];
// un gato dormido, enroscado: cuerpo, cabeza apoyada, orejas, cola alrededor
const sleepingCat = ([name, fur, shade]) => `<svg class="cat-svg" viewBox="0 0 220 140" aria-hidden="true">
        <ellipse cx="112" cy="128" rx="92" ry="9" fill="#000" opacity=".07"/>
        <ellipse class="cat-body" cx="118" cy="92" rx="82" ry="40" fill="${fur}"/>
        <path d="M44 112 C 70 132, 170 134, 196 104" stroke="${shade}" stroke-width="15" stroke-linecap="round" fill="none"/>
        <g class="cat-head">
          <path d="M40 56 L 48 30 L 64 50 Z M 78 48 L 90 26 L 98 52 Z" fill="${fur}"/>
          <path d="M46 52 L 50 38 L 58 50 Z M 82 48 L 89 34 L 94 50 Z" fill="${shade}" opacity=".55"/>
          <ellipse cx="70" cy="74" rx="38" ry="30" fill="${fur}"/>
          <path d="M52 74 q 7 6 14 0 M 76 74 q 7 6 14 0" stroke="#3a2e24" stroke-width="2.2" stroke-linecap="round" fill="none"/>
          <path d="M68 84 l 3 3 l 3 -3 z" fill="#c98a92"/>
        </g>
      </svg>`;
write(out('mini-games/index.html'), folioDoc({
  pre: '../',
  R: R1,
  path: 'mini-games/index.html',
  title: `${t('mini games')} · vittoria scalmati`,
  desc: t('two small games: a tarot reader and my cats to pet.'),
  cls: 'games',
  body: `<main>
  <section class="p-head">
    ${flick(t('mini games'), ' mm-flick-long')}
    <nav class="games-menu reveal" style="--d:1" aria-label="${t('games')}">
      <a href="#tarot">: ${t('tarot reader')}</a>
      <a href="#cats">: ${t('pet my cats')}</a>
    </nav>
  </section>

  <section class="game" id="tarot" aria-label="${t('tarot reader')}">
    <h2 class="game-title script reveal">${t('tarot reader')}</h2>
    <a class="game-panel tarot-door reveal" href="../tarot-reader/index.html">
      <span class="door-light" aria-hidden="true"><img src="${R1}assets/img/games/tarot-reader.webp?v=${VER}" alt="" width="712" height="860" loading="lazy"></span>
      <span class="door-words">
        <span class="game-line">${t("she's waiting for you at her table. three cards, one question, zero shame.")}</span>
        <span class="game-btn">&gt; ${t('sit down')}</span>
      </span>
    </a>
  </section>

  <section class="game" id="cats" aria-label="${t('pet my cats')}">
    <h2 class="game-title script reveal">${t('pet my cats')}</h2>
    <div class="game-panel cats reveal">
      <div class="cat-row">
        ${CATS.map(c => `<div class="cat" role="button" tabindex="0" aria-label="${t('pet')} ${c[0]}">
      ${c[3] ? `<model-viewer class="cat-3d" src="${R1}assets/img/games/${c[3]}?v=${VER}" alt="" aria-hidden="true" camera-orbit="${c[4]}"${c[6] ? ` camera-target="${c[6]}"` : ''} interaction-prompt="none" disable-zoom disable-pan disable-tap shadow-intensity=".5" exposure="1.05" loading="eager"></model-viewer>` : sleepingCat(c)}${!c[3] || c[5] ? `
      <span class="cat-zzz" aria-hidden="true">z z z</span>` : ''}
      <span class="cat-says" aria-live="polite"></span>
      <span class="cat-name">${c[0]}</span>
    </div>`).join('\n        ')}
      </div>
      <p class="game-line">${t('pet them long enough and they might give you a great piece of advice.')}</p>
    </div>
  </section>
  <footer class="p-foot"><a href="../index.html#index">← portfolio</a><span>micromina — vittoria scalmati</span></footer>
</main>`,
}));


// ── el cv ──
const cv = CV[L];
const cvRow = ([years, place, where, what, note]) => `<div class="cv-row reveal">
        <p class="cv-years">${years}</p>
        <div>
          <h3>${place} <span>${where}</span></h3>
          ${what ? `<p>${what}</p>` : ''}${note ? `<ul class="cv-note">${note.map(n => `<li>${n}</li>`).join('')}</ul>` : ''}
        </div>
      </div>`;
const cvList = (label, list, sep = ' · ') => list ? `<section class="cv-sec reveal">
      <h2>${label}</h2>
      <p>${list.join(sep)}</p>
    </section>` : '';
write(out('cv/index.html'), folioDoc({
  pre: '../',
  R: R1,
  path: 'cv/index.html',
  title: 'cv · vittoria scalmati',
  desc: cv.desc,
  cls: 'cv-page',
  body: `<main>
  <section class="cv">
    ${flick('cv')}
    <section class="cv-sec">
      <h2 class="reveal">${cv.labels.study}</h2>
      ${cv.study.map(cvRow).join('\n      ')}
    </section>
    ${cvList(cv.labels.skills, cv.skills)}
    ${cvList(cv.labels.langs, cv.langs, '<br>')}
    <section class="cv-sec reveal">
      <h2>${cv.labels.mail}</h2>
      <p><a href="mailto:vittoria.scalmati@gmail.com">vittoria.scalmati@gmail.com</a><br><a href="https://www.instagram.com/microvitti/" target="_blank" rel="noopener">@microvitti</a></p>
    </section>
  </section>
  <footer class="p-foot"><a href="../index.html#index">← portfolio</a><span>micromina — vittoria scalmati</span></footer>
</main>`,
}));
});

// el blog solo existe en español, en micromina/: su menú y sus botones también, y desde él se vuelve a la versión española
L = 'es';

// ── micromina: el blog, dentro del portfolio ──
// copiado de micromina.es antes de que desaparezca: los artículos (data/micromina/posts.json, exportados de la api de
// wordpress), sus fotos ya descargadas (site/micromina/img/) y la bio. con la ropa del portfolio (su barra, sus letras,
// el borgoña de los detalles); sin redes sociales ni páginas legales
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const fechaEs = iso => { const [y, m, d] = iso.slice(0, 10).split('-'); return `${+d} de ${MESES[+m - 1]} de ${y}`; };
const stripTags = h => h.replace(/<[^>]+>/g, ' ').replace(/\[&hellip;\]/g, '').replace(/\s+/g, ' ').trim();
const decodeEnt = t => t.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&amp;/g, '&').replace(/&hellip;/g, '…').replace(/&nbsp;/g, ' ');
// artículos que ya no se enseñan (siguen en data/micromina/posts.json por si vuelven)
const HIDDEN_POSTS = ['10-relojes-plateados-que-quiero-en-la-muneca-ya'];
const POSTS = JSON.parse(ObjC.unwrap($.NSString.stringWithContentsOfFileEncodingError(ROOT + '/data/micromina/posts.json', $.NSUTF8StringEncoding, null)))
  .filter(p => !HIDDEN_POSTS.includes(p.slug))
  .sort((a, b) => b.date.localeCompare(a.date));
POSTS.forEach(p => {
  p.cat = (p._embedded && p._embedded['wp:term'] && p._embedded['wp:term'][0][0] || { name: '' }).name;
  p.titleText = decodeEnt(stripTags(p.title.rendered));
  const ex = decodeEnt(stripTags(p.excerpt.rendered));
  p.excerptText = (ex.length > 170 ? ex.slice(0, ex.lastIndexOf(' ', 165)) + '…' : ex).replace(/([.!?»«])…$/, '$1');
});
// el html de gutenberg, limpio: fuera clases y estilos (menos el centrado), las fotos desde micromina/img/ y sin srcset
const cleanPost = (html, pre) => html
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/<\/?div[^>]*>/g, '')
  .replace(/<nav[\s\S]*?<\/nav>/g, '')
  .replace(/<(\/?)(\w+)([^>]*)>/g, (m, close, tag, rest) => {
    tag = tag.toLowerCase();
    if (close) return tag === 'span' ? '' : `</${tag}>`;
    const cls = (rest.match(/class="([^"]*)"/) || [, ''])[1];
    const center = /has-text-align-center|aligncenter/.test(cls) ? ' class="center"' : '';
    if (tag === 'img') {
      const src = (rest.match(/src="([^"]+)"/) || [, ''])[1];
      const w = (rest.match(/width="(\d+)"/) || [, ''])[1], h = (rest.match(/height="(\d+)"/) || [, ''])[1];
      const alt = (rest.match(/alt="([^"]*)"/) || [, ''])[1];
      return `<img src="${pre}micromina/img/${src.split('/').pop()}" alt="${alt}"${w ? ` width="${w}" height="${h}"` : ''} loading="lazy" decoding="async">`;
    }
    if (tag === 'a') return `<a href="${(rest.match(/href="([^"]+)"/) || [, '#'])[1]}" target="_blank" rel="noopener">`;
    if (tag === 'figure') return cls.includes('wp-block-gallery') ? '<figure class="gallery">' : '<figure>';
    if (tag === 'br' || tag === 'hr') return `<${tag}>`;
    if (['p', 'h2', 'h3', 'h4', 'blockquote', 'pre', 'figcaption', 'ul', 'ol', 'li'].includes(tag)) return `<${tag}${center}>`;
    if (['em', 'strong', 'i', 'b', 'cite', 'sup', 'sub'].includes(tag)) return `<${tag}>`;
    return '';
  })
  .replace(/<p[^>]*>\s*(<br>\s*)*<\/p>/g, '')
  .replace(/\n{2,}/g, '\n')
  .trim();
const blogFoot = pre => `<footer class="p-foot"><a href="${pre}es/index.html#index">← portfolio</a><span>micromina — vittoria scalmati</span></footer>`;
const blogPage = (path, { title, desc, body }) => {
  const pre = '../'.repeat(path.split('/').length - 1);
  write(ROOT + '/site/' + path, folioDoc({ pre: pre + 'es/', R: pre, title, desc, cls: 'blog', body: body(pre) }));
};
// portada: el saludo, la bio y el archivo
blogPage('micromina/index.html', {
  title: 'micromina · vittoria scalmati',
  desc: 'micromina, la colección digital de vittoria: moda fabulosa, diseño mágico, objetos desaburridos, cultura visual y estrambolerías varias.',
  body: pre => `<main>
  <section class="mm-home">
    ${flick('holi,')}
    <p class="mm-lead reveal" style="--d:1">esta es mi colección digital</p>
    <p class="mm-yo reveal" style="--d:2">y <a href="${pre}micromina/yo/index.html">yo?</a></p>
    <a class="mm-button reveal" style="--d:3" href="${pre}micromina/archivo/index.html">archivo de articulos</a>
    <img class="mm-logo reveal" style="--d:4" src="${pre}micromina/img/micromina-logo.png?v=${VER}" alt="micromina" width="130" height="135">
  </section>
  ${blogFoot(pre)}
</main>`,
});
// archivo
blogPage('micromina/archivo/index.html', {
  title: 'archivo · micromina · vittoria scalmati',
  desc: 'todos los artículos de micromina.',
  body: pre => `<main>
  <section class="mm-wrap">
    <h1 class="p-title script reveal">archivo</h1>
    <ol class="mm-list">
    ${POSTS.map(p => `<li class="reveal">
      <h2><a href="${pre}micromina/${p.slug}/index.html">${p.title.rendered}</a></h2>
      <time datetime="${p.date.slice(0, 10)}">${fechaEs(p.date)}</time>
      <p>${p.excerptText} <a href="${pre}micromina/${p.slug}/index.html">leer más</a></p>
    </li>`).join('\n    ')}
    </ol>
  </section>
  ${blogFoot(pre)}
</main>`,
});
// artículos
POSTS.forEach((p, i) => {
  const newer = POSTS[i - 1], older = POSTS[i + 1];
  blogPage(`micromina/${p.slug}/index.html`, {
    title: `${p.titleText} · micromina`,
    desc: p.excerptText,
    body: pre => `<main>
  <article class="mm-wrap mm-post">
    <h1 class="reveal">${p.title.rendered}</h1>
    <p class="mm-meta reveal" style="--d:1">${p.cat ? `<span class="mm-cat">${p.cat}</span>` : ''}<time datetime="${p.date.slice(0, 10)}">${fechaEs(p.date)}</time></p>
    <div class="mm-prose">
${cleanPost(p.content.rendered, pre)}
    </div>
    <nav class="mm-pager" aria-label="otros artículos">
      ${older ? `<a href="${pre}micromina/${older.slug}/index.html"><span>← anterior</span>${older.title.rendered}</a>` : '<span></span>'}
      ${newer ? `<a href="${pre}micromina/${newer.slug}/index.html"><span>siguiente →</span>${newer.title.rendered}</a>` : '<span></span>'}
    </nav>
  </article>
  ${blogFoot(pre)}
</main>`,
  });
});
// yo?
blogPage('micromina/yo/index.html', {
  title: 'yo? · micromina · vittoria scalmati',
  desc: 'quién guarda todo esto.',
  body: pre => `<main>
  <section class="mm-wrap mm-bio">
    ${flick('yo?')}
    <p class="mm-holi reveal" style="--d:1">holi</p>
    <div class="bio reveal" style="--d:2">
      <p>soy una chica curiosa, que se aburre facilísimo, un poco triste a veces también, y me muero por saber un poco de todo, literalmente todo lo que existe en el mundo, y esto me da una ansiedad tremenda porque sé que nunca voy a poder descubrirlo entero, es imposible, y esa idea me supera, me aplasta si lo pienso demasiado, pero tampoco pasa nada, porque en realidad no todo me llama la atención, hay muchísimas cosas que me dan absolutamente igual, pero las que sí me gustan son un montón, y como es imposible acordarme de todas sin guardarlas en algún sitio, decidí crear un archivo virtual, una colección digital de lo que me apasiona.</p>
      <p>y a veces me atormento pensando que tengo miedo de no dejar nada en este mundo, así que esto es mi regalo al planeta: una pequeña enciclopedia de cositas que me flipan. yo qué sé, dentro de un millón de años, cuando el mundo ya haya explotado por lo menos tres veces, alguien encontrará este ordenador pequeñito debajo de toneladas de escombros, y ojalá sea la nueva pompeya.</p>
    </div>
  </section>
  ${blogFoot(pre)}
</main>`,
  });

`ok: ${READING.length} proyectos × ${LANGS.length} idiomas${missing.size ? `\nsin traducir (${missing.size}):\n` + [...missing].join('\n') : ''}`;
