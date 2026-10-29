(() => {
  const WA = '5511971542024';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const brl = n => 'R$ ' + n.toFixed(2).replace('.', ',');
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
  };

  /* ---------- INTRO ---------- */
  const html = document.documentElement;
  const intro = $('#intro');
  const params = new URLSearchParams(location.search);
  let seen = false;
  try { seen = sessionStorage.getItem('sg-intro') === '1'; } catch {}
  if ((seen && !params.has('intro')) || reduce) {
    html.classList.remove('intro-on');
  } else {
    try { sessionStorage.setItem('sg-intro', '1'); } catch {}
    const timers = [];
    const end = () => {
      timers.forEach(clearTimeout);
      intro.classList.add('out');
      setTimeout(() => html.classList.remove('intro-on'), 650);
    };
    timers.push(setTimeout(() => intro.classList.add('logo'), 2000));
    timers.push(setTimeout(end, 3300));
    intro.addEventListener('click', end);
    addEventListener('keydown', end, { once: true });
  }

  /* ---------- EMBERS ---------- */
  function embers(canvas, density) {
    const ctx = canvas.getContext('2d');
    let w, h, dpr, parts = [], visible = true, raf;
    const resize = () => {
      dpr = Math.min(devicePixelRatio || 1, 1.5);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(140, (w * h) / 9000) * density);
      parts = Array.from({ length: n }, () => spawn(true));
    };
    const spawn = (init) => ({
      x: Math.random() * w,
      y: init ? Math.random() * h : h + 10,
      r: Math.random() * 1.8 + .5,
      vy: -(Math.random() * .9 + .35),
      vx: (Math.random() - .5) * .3,
      ph: Math.random() * Math.PI * 2,
      life: 1, decay: Math.random() * .004 + .0015,
      hue: 28 + Math.random() * 20
    });
    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        p.ph += .03;
        p.x += p.vx + Math.sin(p.ph) * .35;
        p.y += p.vy;
        p.life -= p.decay;
        if (p.life <= 0 || p.y < -10) { parts[i] = spawn(false); continue; }
        const a = Math.min(1, p.life * 1.4) * (0.55 + Math.sin(p.ph * 3) * .25);
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5);
        g.addColorStop(0, `hsla(${p.hue + 10},100%,75%,${a})`);
        g.addColorStop(.35, `hsla(${p.hue},100%,55%,${a * .55})`);
        g.addColorStop(1, `hsla(${p.hue - 15},100%,45%,0)`);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 5, 0, 7); ctx.fill();
      }
      raf = visible ? requestAnimationFrame(tick) : null;
    };
    resize();
    addEventListener('resize', resize);
    if (reduce) { tick(); cancelAnimationFrame(raf); return; }
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(tick);
    }).observe(canvas);
  }
  embers($('#embers'), 1);
  embers($('#embersFt'), .6);

  /* ---------- STATUS (aberto agora) ---------- */
  // dia: seg a sáb 10:30–16:00 · noite: ter a sáb 17:00–23:00
  const SHIFTS = [
    { days: [1, 2, 3, 4, 5, 6], from: 630, to: 960, label: 'almoço' },
    { days: [2, 3, 4, 5, 6], from: 1020, to: 1380, label: 'grelha acesa' }
  ];
  const fmt = m => `${Math.floor(m / 60)}h${m % 60 ? String(m % 60).padStart(2, '0') : ''}`;
  function spNow() {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date());
    const get = t => parts.find(p => p.type === t).value;
    const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
    return { day, min: (+get('hour') % 24) * 60 + +get('minute') };
  }
  function status() {
    const { day, min } = spNow();
    const el = $('#status');
    const span = $('span', el);
    el.classList.remove('open', 'soon');
    const now = SHIFTS.find(s => s.days.includes(day) && min >= s.from && min < s.to);
    if (now) {
      el.classList.add('open');
      span.textContent = `Aberto agora · ${now.label} até ${fmt(now.to)}`;
    } else {
      const next = SHIFTS.filter(s => s.days.includes(day) && min < s.from).sort((a, b) => a.from - b.from)[0];
      if (next) { el.classList.add('soon'); span.textContent = `Fechado agora · abre às ${fmt(next.from)}`; }
      else {
        let d = (day + 1) % 7, n = 1;
        while (!SHIFTS.some(s => s.days.includes(d))) { d = (d + 1) % 7; n++; }
        const names = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
        span.textContent = `Fechado agora · abre ${n === 1 ? 'amanhã' : names[d]} às 10h30`;
      }
    }
    $$('#hrs div').forEach(r => r.classList.toggle('today', +r.dataset.d === day));
  }
  status();
  setInterval(status, 60000);

  /* ---------- MENU + COMANDA ---------- */
  const MENU = [
    { id: 'lanches', nome: 'Lanches de pernil', itens: [
      ['pernil-paulista', 'Pernil Paulista', 'Pão francês, pernil suíno, cebola, tomate e pimentão.', 29],
      ['pernil-carioca', 'Pernil Carioca', 'Pão francês, pernil suíno, cebola, tomate, pimentão e abacaxi.', 35],
      ['pernil-mineiro', 'Pernil Mineiro', 'Pão francês, pernil suíno, cebola, tomate, pimentão e mussarela.', 35],
      ['linguica-paulista', 'Linguiça Paulista', 'Pão francês, linguiça de Bragança e vinagrete.', 29],
      ['linguica-mineira', 'Linguiça Mineira', 'Pão francês, linguiça de Bragança e queijo mussarela.', 35],
      ['linguica-caipira', 'Linguiça Caipira', 'Pão francês, linguiça de Bragança e ovo.', 35]
    ]},
    { id: 'burguers', nome: 'Burguers', itens: [
      ['santa-burguer', 'Santa Burguer', 'Brioche, hambúrguer 150g, bacon, alface, molho do chef, maionese verde e catupiry.', 32],
      ['grelha-burguer', 'Grelha Burguer', 'Brioche, hambúrguer 150g, bacon, rúcula, molho do chef e mussarela.', 36],
      ['mega-grelha', 'Mega Grelha', 'Brioche, 150g, cheddar, bacon, ovo, alface, tomate, cebola roxa, picles e maionese verde.', 40],
      ['pulled-pork', 'Pulled Pork', 'Brioche, copa lombo desfiada, barbecue artesanal e coleslaw.', 33],
      ['x-bacon-salada', 'X Bacon Salada', 'Brioche, 150g, cheddar, bacon, tomate, picles, cebola roxa, alface e maionese verde.', 35],
      ['x-bacon', 'X Bacon', 'Brioche, 150g, cheddar, bacon e ketchup Heinz.', 32],
      ['x-egg', 'X Egg', 'Brioche, 150g, cheddar, ovo frito e maionese verde.', 32],
      ['x-salada', 'X Salada', 'Brioche, 150g, cheddar, alface, tomate, cebola roxa, picles e maionese verde.', 28],
      ['x-burguer', 'X Burguer', 'Brioche, 150g, cheddar e maionese verde.', 25],
      ['burguer-simples', 'Burguer Simples', 'Brioche, 150g e maionese verde.', 20]
    ]},
    { id: 'espetos', nome: 'Espetos', itens: [
      ['esp-carne', 'Espeto de carne', 'Acompanha farofa com vinagrete.', 11],
      ['esp-frango', 'Espeto de frango', 'Acompanha farofa com vinagrete.', 11],
      ['esp-linguica', 'Espeto de linguiça', 'Acompanha farofa com vinagrete.', 11],
      ['esp-coracao', 'Espeto de coração', 'Acompanha farofa com vinagrete.', 11],
      ['esp-coalho', 'Queijo coalho', 'Na brasa, dourado por fora.', 11],
      ['esp-pao-alho', 'Pão de alho', 'O clássico do churrasco.', 11],
      ['esp-combo', 'Combo misto', 'Carne, linguiça e frango.', 29]
    ]},
    { id: 'porcoes', nome: 'Porções', itens: [
      ['batata', 'Batata frita', 'Com o tempero especial do chef e maionese verde.', 28],
      ['batata-especial', 'Batata com cheddar e bacon', 'Inteira, com o tempero do chef.', 35],
      ['polenta', 'Polenta frita', 'Pedaços dourados e crocantes.', 28],
      ['nuggets', 'Nuggets', 'Com o molho secreto do chef.', 28],
      ['croquete', 'Croquete de pernil', '', 28],
      ['pastel-angu', 'Pastel de angu', 'De carne.', 30]
    ]},
    { id: 'veg', nome: 'Vegetariano', itens: [
      ['santa-veg', 'Santa Veg', 'Brioche, hambúrguer de berinjela 150g, molho do chef e rúcula.', 37]
    ]}
  ];
  const HAS_IMG = new Set(['batata','batata-especial','polenta','nuggets','pernil-paulista','pernil-carioca','pernil-mineiro','linguica-paulista','linguica-mineira','linguica-caipira','santa-burguer','grelha-burguer','burguer-simples','x-burguer','x-egg','x-salada','x-bacon','x-bacon-salada','mega-grelha','santa-veg','esp-carne','esp-frango','esp-linguica','esp-coracao','esp-pao-alho','esp-coalho']);
  const ITEMS = {};
  MENU.forEach(c => c.itens.forEach(([id, nome, desc, preco]) => ITEMS[id] = { id, nome, desc, preco }));

  const tabs = $('#tabs'), list = $('#items');
  let cart = store.get('sg-cart') || {};
  Object.keys(cart).forEach(k => { if (!ITEMS[k]) delete cart[k]; });

  MENU.forEach((c, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.role = 'tab'; b.textContent = c.nome; b.dataset.cat = c.id;
    b.setAttribute('aria-selected', i === 0);
    b.addEventListener('click', () => renderCat(c.id));
    tabs.appendChild(b);
  });

  function renderCat(id) {
    $$('button', tabs).forEach(b => b.setAttribute('aria-selected', b.dataset.cat === id));
    const cat = MENU.find(c => c.id === id);
    list.innerHTML = cat.itens.map(([iid, nome, desc, preco], k) => `
      <li class="item" style="animation-delay:${k * 45}ms">
        ${HAS_IMG.has(iid) ? `<img src="img/m/${iid}.webp" alt="${nome}" loading="lazy" width="76" height="76">` : `<span class="noimg"><img src="img/flame.png" alt=""></span>`}
        <div><h3>${nome}</h3>${desc ? `<p>${desc}</p>` : ''}<div class="pr">${brl(preco)}</div></div>
        <button class="add" type="button" data-id="${iid}" aria-label="Adicionar ${nome}">+${cart[iid] ? `<span class="q">${cart[iid]}</span>` : ''}</button>
      </li>`).join('');
  }
  list.addEventListener('click', e => {
    const b = e.target.closest('.add'); if (!b) return;
    change(b.dataset.id, 1);
    flyEmber(b);
  });

  const cmdList = $('#cmdList'), cmd = $('#comanda'), fab = $('#fab');
  function change(id, d) {
    cart[id] = (cart[id] || 0) + d;
    if (cart[id] <= 0) delete cart[id];
    store.set('sg-cart', cart);
    renderCart();
    const btn = $(`.add[data-id="${id}"]`, list);
    if (btn) btn.innerHTML = '+' + (cart[id] ? `<span class="q">${cart[id]}</span>` : '');
    if (d > 0) { cmd.classList.remove('bump'); void cmd.offsetWidth; cmd.classList.add('bump'); }
  }
  function renderCart() {
    const ids = Object.keys(cart);
    const total = ids.reduce((s, k) => s + ITEMS[k].preco * cart[k], 0);
    const count = ids.reduce((s, k) => s + cart[k], 0);
    cmdList.innerHTML = ids.length ? ids.map(k => `
      <li><span class="qty"><button type="button" data-d="-1" data-id="${k}" aria-label="Tirar um">−</button><span>${cart[k]}</span><button type="button" data-d="1" data-id="${k}" aria-label="Mais um">+</button></span>
      <span class="nm">${ITEMS[k].nome}</span><span class="vl">${brl(ITEMS[k].preco * cart[k])}</span></li>`).join('')
      : '<li class="empty">Tá vazia ainda. Escolhe um lanche ali do lado.</li>';
    $('#cmdTotal').textContent = brl(total);
    $('#fabN').textContent = count;
    $('#fabT').textContent = brl(total);
    fab.classList.toggle('show', count > 0);
    const send = $('#cmdSend');
    send.setAttribute('aria-disabled', count === 0);
    send.href = count ? waLink(ids, total) : '#';
  }
  function waLink(ids, total) {
    const modo = ($('input[name=modo]:checked') || {}).value || 'Entrega';
    const linhas = ids.map(k => `${cart[k]}x ${ITEMS[k].nome} (${brl(ITEMS[k].preco * cart[k])})`);
    let msg = `Oi, Santa Grelha! Montei minha comanda pelo site:\n\n${linhas.join('\n')}\n\nTotal: ${brl(total)}\nModo: ${modo}`;
    if (modo === 'Entrega') msg += '\nEndereço: ';
    msg += '\nNome: ';
    return `https://wa.me/${WA}?text=${encodeURIComponent(msg)}`;
  }
  cmdList.addEventListener('click', e => {
    const b = e.target.closest('button[data-id]'); if (b) change(b.dataset.id, +b.dataset.d);
  });
  $$('input[name=modo]').forEach(r => r.addEventListener('change', renderCart));
  $('#cmdClear').addEventListener('click', () => { cart = {}; store.set('sg-cart', cart); renderCart(); renderCat($('button[aria-selected=true]', tabs).dataset.cat); });
  fab.addEventListener('click', () => { cmd.classList.add('open'); fab.classList.add('hidden'); });
  document.addEventListener('click', e => {
    if (cmd.classList.contains('open') && !cmd.contains(e.target) && !fab.contains(e.target) && !e.target.closest('.add')) { cmd.classList.remove('open'); fab.classList.remove('hidden'); }
  });
  const n = (store.get('sg-n') || 0) + 1; store.set('sg-n', n);
  $('#cmdN').textContent = 'nº ' + String(n).padStart(3, '0');
  renderCat(MENU[0].id);
  renderCart();

  // fagulha voando do botão até a comanda
  function flyEmber(from) {
    if (reduce) return;
    const target = getComputedStyle(fab).display !== 'none' ? fab : $('#cmdTotal');
    const a = from.getBoundingClientRect(), b = target.getBoundingClientRect();
    const s = document.createElement('i');
    s.style.cssText = `position:fixed;z-index:80;left:${a.left + a.width / 2 - 5}px;top:${a.top + a.height / 2 - 5}px;width:10px;height:10px;border-radius:50%;background:#ffd36b;box-shadow:0 0 14px 4px #f9a801;pointer-events:none`;
    document.body.appendChild(s);
    const dx = b.left + b.width / 2 - a.left - a.width / 2, dy = b.top + b.height / 2 - a.top - a.height / 2;
    s.animate([
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: `translate(${dx * .5}px,${dy * .5 - 80}px) scale(1.3)`, opacity: 1, offset: .5 },
      { transform: `translate(${dx}px,${dy}px) scale(.4)`, opacity: .2 }
    ], { duration: 650, easing: 'cubic-bezier(.4,0,.2,1)' }).onfinish = () => s.remove();
  }

  /* ---------- HEADER / NAV ---------- */
  const hd = $('#hd'), burger = $('#burger');
  burger.addEventListener('click', () => {
    const o = hd.classList.toggle('open');
    burger.setAttribute('aria-expanded', o);
  });
  $$('#nav a').forEach(a => a.addEventListener('click', () => { hd.classList.remove('open'); burger.setAttribute('aria-expanded', false); }));

  /* ---------- COMENTÁRIOS ---------- */
  const qs = $$('#quotes blockquote'), dots = $$('#qdots button');
  let qi = 0, qt;
  const showQ = i => {
    qi = i; qs.forEach((q, k) => q.classList.toggle('on', k === i)); dots.forEach((d, k) => d.classList.toggle('on', k === i));
    clearTimeout(qt); qt = setTimeout(() => showQ((qi + 1) % qs.length), 5200);
  };
  dots.forEach((d, k) => d.addEventListener('click', () => showQ(k)));
  showQ(0);

  /* ---------- REVEAL ---------- */
  const rvs = ['.menu-head', '.voz-quotes', '.onde-info', '.onde-map', '.ft-logo'];
  rvs.forEach(s => $$(s).forEach(el => el.classList.add('rv')));
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .15 });
  $$('.rv').forEach(el => io.observe(el));

  /* ---------- SCROLL (um rAF só) ---------- */
  const heroBg = $('.hero-bg'), heroIn = $('.hero-in'), hero = $('.hero');
  const turnos = $('#turnos'), clock = $('#clock');
  const fotos = $('#fotos'), track = $('#fotosTrack');
  let lastY = scrollY, ticking = false, trackMax = 0;

  function sizeFotos() {
    trackMax = Math.max(0, track.scrollWidth - innerWidth);
    fotos.style.setProperty('--fh', `${innerHeight + trackMax}px`);
  }
  sizeFotos();
  addEventListener('resize', () => { sizeFotos(); onScroll(); });
  addEventListener('load', sizeFotos);

  function onScroll() {
    ticking = false;
    const y = scrollY, vh = innerHeight;

    // header
    hd.classList.toggle('solid', y > 40);
    hd.classList.toggle('hide', y > lastY && y > vh * .8 && !hd.classList.contains('open') && !cmd.classList.contains('open'));
    lastY = y;

    // hero parallax
    if (!reduce && y < vh * 1.2) {
      const k = y / vh;
      heroBg.style.transform = `translate3d(0,${y * .3}px,0) scale(${1 + k * .08})`;
      heroIn.style.transform = `translate3d(0,${y * .18}px,0)`;
      heroIn.style.opacity = Math.max(0, 1 - k * 1.3);
    }

    // dia → noite
    const tr = turnos.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, -tr.top / (tr.height - vh)));
    turnos.style.setProperty('--p', p.toFixed(4));
    const mins = 630 + Math.round(p * (1380 - 630) / 15) * 15;
    clock.textContent = `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
    hd.classList.toggle('on-day', tr.top <= 60 && tr.bottom > 60 && p < .5 && !hd.classList.contains('open'));

    // fotos horizontais
    const fr = fotos.getBoundingClientRect();
    const fp = Math.min(1, Math.max(0, -fr.top / Math.max(1, fr.height - vh)));
    track.style.transform = `translate3d(${-fp * trackMax}px,0,0)`;
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();
})();
