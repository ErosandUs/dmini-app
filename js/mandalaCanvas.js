// --- ДВИЖОК ЖИВОПИСНОЙ МАНДАЛЫ (14.11.2026) ---
// Под золотыми контурами лежат 3 картины нейросети. Раскраска проявляет выбранную картину кистью
// в пределах области. Области берутся из карты-картинки (номер области в красном канале пикселя):
// 0 — линия, 255 — снаружи мандалы. Данные мандалы — js/mandala-<ключ>.js, картинки — images/mandala/<ключ>/.
// Используется личной (js/mandala.js) и общей (js/mandalaShared.js) мандалами.
(function () {
    'use strict';

    const reduceMotion = (() => {
        try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (_) { return false; }
    })();

    const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
    const load = src => new Promise((ok, fail) => {
        const i = new Image();
        i.decoding = 'async';
        i.onload = () => ok(i);
        i.onerror = () => fail(new Error('img ' + src));
        i.src = src;
    });
    const easeOut = t => 1 - Math.pow(1 - t, 3);

    // Картинки одной мандалы грузятся один раз на всё приложение
    const assetCache = {};
    function loadAssets(art) {
        if (assetCache[art.key]) return assetCache[art.key];
        const v = art.version ? '?v=' + art.version : '';
        const p = Promise.all([
            load(art.base + 'v0.webp' + v), load(art.base + 'v1.webp' + v), load(art.base + 'v2.webp' + v),
            load(art.base + 'gold-lines.png' + v), load(art.labels)
        ]).then(imgs => {
            const S = art.size;
            const lc = mk(S, S).getContext('2d');
            lc.drawImage(imgs[4], 0, 0);
            const d = lc.getImageData(0, 0, S, S).data;
            const lab = new Uint8Array(S * S);
            for (let i = 0; i < S * S; i++) lab[i] = d[i * 4];
            return { V: imgs.slice(0, 3), gold: imgs[3], lab };
        });
        p.catch(() => { delete assetCache[art.key]; });
        assetCache[art.key] = p;
        return p;
    }

    function create(host, opts) {
        const art = opts.art;
        const S = art.size;
        const regions = art.regions;
        const byId = {};
        regions.forEach(r => { byId[r.id] = r; });
        const paintable = regions.filter(r => r.layer !== 'decor');

        host.classList.add('mrich');
        // 19.11.2026: дымка по краю нужна «Лотосу» (лепестки выходят за круг); ровному кругу (p2) она приглушила бы край
        host.classList.toggle('mrich--nofade', art.edgeFade === false);
        host.innerHTML = '';
        const cv = mk(S, S);
        cv.className = 'mrich-canvas';
        cv.setAttribute('role', 'img');
        cv.setAttribute('aria-label', opts.label || ('Мандала «' + art.title + '»'));
        host.appendChild(cv);
        const ctx = cv.getContext('2d');

        let A = null;             // картинки и карта областей
        let destroyed = false;
        let staticCv, glowCv, paintedCv, baseCv, goldCv;
        let hasGlow = false, hasPainted = false, alive = false;
        const masks = {};
        const paintCache = {};    // кусок картины в форме области: «id_v» → холст
        let selected = null, reveal = null, flash = null, wave = null, dimMode = false;
        const sparks = [];
        // Перелив и волна считаются в уменьшенном размере и растягиваются: они мягкие, а кадр в разы дешевле
        const LOW = 256, WAVE = 512;
        let shimmer, sh, paintedLow, sprite;
        let onScreen = true, lastFrame = 0;

        // ---------- маски ----------
        function maskOf(id) {
            if (masks[id]) return masks[id];
            const r = byId[id], b = r.bbox, pad = 4;
            const bx = Math.max(0, b[0] - pad), by = Math.max(0, b[1] - pad);
            const bw = Math.min(S, b[2] + pad) - bx, bh = Math.min(S, b[3] + pad) - by;
            const raw = mk(bw, bh), rc = raw.getContext('2d'), img = rc.createImageData(bw, bh);
            const lab = A.lab;
            for (let y = 0; y < bh; y++) {
                const row = (by + y) * S + bx;
                for (let x = 0; x < bw; x++) if (lab[row + x] === id) img.data[(y * bw + x) * 4 + 3] = 255;
            }
            rc.putImageData(img, 0, 0);
            // расширяем на 3 px, чтобы краска заходила под золотую линию
            const m = mk(bw, bh), mc = m.getContext('2d');
            for (let dx = -3; dx <= 3; dx++) for (let dy = -3; dy <= 3; dy++) if (dx * dx + dy * dy <= 9) mc.drawImage(raw, dx, dy);
            return (masks[id] = { c: m, x: bx, y: by, w: bw, h: bh });
        }

        function maskWhere(test) {
            const c = mk(S, S), cc = c.getContext('2d'), img = cc.createImageData(S, S), lab = A.lab;
            for (let i = 0; i < S * S; i++) if (test(lab[i])) img.data[i * 4 + 3] = 255;
            cc.putImageData(img, 0, 0);
            return c;
        }

        function regionPaint(id, v) {
            const key = id + '_' + v;
            if (paintCache[key]) return paintCache[key];
            const m = maskOf(id), t = mk(m.w, m.h), tc = t.getContext('2d');
            tc.drawImage(m.c, 0, 0);
            tc.globalCompositeOperation = 'source-in';
            tc.drawImage(A.V[v], m.x, m.y, m.w, m.h, 0, 0, m.w, m.h);
            return (paintCache[key] = { c: t, m });
        }

        // Неизменная основа: внутри мандалы белый перламутр и еле видный призрак картины. Считается один раз.
        // 15.11.2026: снаружи мандалы холст прозрачный. Фон «Жемчужный рассвет» и «цветок жизни» — неподвижный
        // фон карточки в CSS (.mandala-paper--pearl), чтобы узор был по всей карточке и не вращался с мандалой.
        function buildBase() {
            const inside = maskWhere(v => v !== 255);
            baseCv = mk(S, S);
            const s = baseCv.getContext('2d');
            const ic = inside.getContext('2d');
            ic.globalCompositeOperation = 'source-in';
            ic.fillStyle = '#f7f0fa';
            ic.fillRect(0, 0, S, S);
            s.drawImage(inside, 0, 0);
            ic.drawImage(A.V[1], 0, 0);
            s.globalAlpha = 0.22;
            s.drawImage(inside, 0, 0);
            s.globalAlpha = 1;
            // золотые линии темнее, чтобы читались на светлом
            goldCv = mk(S, S);
            const gc = goldCv.getContext('2d');
            gc.drawImage(A.gold, 0, 0);
            gc.globalCompositeOperation = 'source-in';
            gc.fillStyle = '#be8e3e';
            gc.fillRect(0, 0, S, S);
        }

        // Искра — готовая картинка-светлячок вместо градиента на каждую искру в каждом кадре
        function buildSprite() {
            sprite = mk(32, 32);
            const c = sprite.getContext('2d'), g = c.createRadialGradient(16, 16, 0, 16, 16, 16);
            g.addColorStop(0, 'rgba(255,246,214,1)');
            g.addColorStop(0.35, 'rgba(240,190,90,0.9)');
            g.addColorStop(1, 'rgba(220,160,60,0)');
            c.fillStyle = g;
            c.fillRect(0, 0, 32, 32);
        }

        function tinted(id, color) {
            const m = maskOf(id), t = mk(m.w, m.h), tc = t.getContext('2d');
            tc.drawImage(m.c, 0, 0);
            tc.globalCompositeOperation = 'source-in';
            tc.fillStyle = color;
            tc.fillRect(0, 0, m.w, m.h);
            return { c: t, m };
        }

        // ---------- неподвижный слой ----------
        function refresh() {
            if (!A || destroyed) return;
            const s = staticCv.getContext('2d');
            s.globalCompositeOperation = 'source-over';
            s.globalAlpha = 1;
            s.clearRect(0, 0, S, S);   // снаружи прозрачно — старое надо стирать
            s.drawImage(baseCv, 0, 0);

            const mineOf = opts.isMine || (() => false);
            // узор (клинья, ободки) проявляется картиной первого раскрашенного соседа
            regions.forEach(r => {
                if (r.layer !== 'decor') return;
                const nb = (r.near || []).find(n => opts.paintOf(n) !== undefined);
                if (nb === undefined) return;
                const p = regionPaint(r.id, opts.paintOf(nb));
                s.globalAlpha = dimMode ? 0.25 : 1;
                s.drawImage(p.c, p.m.x, p.m.y);
                s.globalAlpha = 1;
            });

            const pc = paintedCv.getContext('2d');
            pc.globalCompositeOperation = 'source-over';
            pc.clearRect(0, 0, S, S);
            const gc = glowCv.getContext('2d');
            gc.globalCompositeOperation = 'source-over';
            gc.clearRect(0, 0, S, S);
            const mineCv = dimMode ? mk(S, S) : null;
            hasGlow = false;
            hasPainted = false;
            for (const r of paintable) {
                const v = opts.paintOf(r.id);
                const m = maskOf(r.id);
                if (v !== undefined) {
                    const p = regionPaint(r.id, v);
                    const mine = mineOf(r.id);
                    s.globalAlpha = dimMode && !mine ? 0.25 : 1;
                    s.drawImage(p.c, m.x, m.y);
                    s.globalAlpha = 1;
                    pc.drawImage(m.c, m.x, m.y);
                    hasPainted = true;
                    if (mineCv && mine) mineCv.getContext('2d').drawImage(m.c, m.x, m.y);
                } else if (!dimMode && opts.canPaint && opts.canPaint(r)) {
                    gc.drawImage(m.c, m.x, m.y);
                    hasGlow = true;
                }
            }
            gc.globalCompositeOperation = 'source-in';
            gc.fillStyle = '#f0b860';
            gc.fillRect(0, 0, S, S);
            // «Мои мазки»: свои области подсвечены тёплым светом
            if (mineCv) {
                const mc = mineCv.getContext('2d');
                mc.globalCompositeOperation = 'source-in';
                mc.fillStyle = 'rgba(255, 236, 190, 0.28)';
                mc.fillRect(0, 0, S, S);
                s.globalCompositeOperation = 'lighter';
                s.drawImage(mineCv, 0, 0);
                s.globalCompositeOperation = 'source-over';
            }
            // маска раскрашенного в уменьшенном виде — для перелива
            const lc = paintedLow.getContext('2d');
            lc.clearRect(0, 0, LOW, LOW);
            lc.drawImage(paintedCv, 0, 0, LOW, LOW);
            kick();
        }

        // ---------- кадр ----------
        let rafId = 0, pollId = 0;
        // Видимость узнаём от IntersectionObserver, а не замером раскладки в каждом кадре
        let io = null;
        if ('IntersectionObserver' in window) {
            io = new IntersectionObserver(entries => {
                onScreen = entries[entries.length - 1].isIntersecting;
                if (onScreen) kick();
            });
            io.observe(host);
        }
        const visible = () => !document.hidden && onScreen && (io !== null || host.offsetParent !== null);
        const busyNow = () => !!(reveal || flash || wave || sparks.length || selected);
        function kick() {
            if (destroyed || rafId || !A) return;
            clearTimeout(pollId);
            pollId = 0;
            rafId = requestAnimationFrame(frame);
        }

        function frame(now) {
            rafId = 0;
            if (destroyed) return;
            if (!visible()) { pollId = setTimeout(kick, 600); return; }
            // Без движения хватает ~30 кадров: мерцание и перелив медленные
            if (!busyNow() && now - lastFrame < 30) { rafId = requestAnimationFrame(frame); return; }
            lastFrame = now;
            draw(now);
            // Раскрашенная мандала вращается средствами CSS: в покое холст не перерисовываем, и вращение остаётся плавным
            const idleAnim = !reduceMotion && !alive && (hasGlow || (hasPainted && !dimMode));
            if (busyNow() || idleAnim) rafId = requestAnimationFrame(frame);
        }

        function draw(now) {
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 1;
            ctx.clearRect(0, 0, S, S);
            ctx.drawImage(staticCv, 0, 0);

            // мерцание свободных областей
            if (hasGlow) {
                ctx.globalAlpha = reduceMotion ? 0.16 : 0.06 + 0.16 * (0.5 + 0.5 * Math.sin(now / 520));
                ctx.drawImage(glowCv, 0, 0);
                ctx.globalAlpha = 1;
            }
            // перелив по раскрашенному: медленный бегущий блик (в уменьшенном размере)
            if (hasPainted && !dimMode && !reduceMotion && !alive) {
                sh.globalCompositeOperation = 'source-over';
                sh.clearRect(0, 0, LOW, LOW);
                const k = LOW / S, a = now / 4200;
                const cx = (S / 2 + Math.cos(a) * S * 0.7) * k, cy = (S / 2 + Math.sin(a) * S * 0.7) * k, w = 260 * k;
                const g = sh.createLinearGradient(cx - w, cy - w, cx + w, cy + w);
                g.addColorStop(0, 'rgba(255,255,255,0)');
                g.addColorStop(0.5, 'rgba(255,240,250,.55)');
                g.addColorStop(1, 'rgba(255,255,255,0)');
                sh.fillStyle = g;
                sh.fillRect(0, 0, LOW, LOW);
                sh.globalCompositeOperation = 'destination-in';
                sh.drawImage(paintedLow, 0, 0);
                ctx.globalCompositeOperation = 'lighter';
                ctx.globalAlpha = 0.3;
                ctx.drawImage(shimmer, 0, 0, S, S);
                ctx.globalCompositeOperation = 'source-over';
                ctx.globalAlpha = 1;
            }

            if (reveal) drawReveal(now);

            if (flash) {
                const k = (now - flash.t0) / 700;
                if (k >= 1) flash = null;
                else {
                    ctx.globalCompositeOperation = 'lighter';
                    ctx.globalAlpha = 0.4 * Math.sin(k * Math.PI);
                    ctx.drawImage(flash.t.c, flash.t.m.x, flash.t.m.y);
                    ctx.globalCompositeOperation = 'source-over';
                    ctx.globalAlpha = 1;
                }
            }

            if (selected) {
                ctx.globalAlpha = 0.18 + 0.12 * Math.sin(now / 200);
                ctx.drawImage(selected.t.c, selected.t.m.x, selected.t.m.y);
                ctx.globalAlpha = 1;
            }

            ctx.drawImage(goldCv, 0, 0);

            // волна по золотым контурам при завершении (в уменьшенном размере)
            if (wave) {
                const k = (now - wave.t0) / 2600;
                if (k < 1.3) {
                    const q = WAVE / S, r = k * S * 0.75, wc = wave.c.getContext('2d');
                    wc.globalCompositeOperation = 'source-over';
                    wc.clearRect(0, 0, WAVE, WAVE);
                    const g = wc.createRadialGradient(WAVE / 2, WAVE / 2, Math.max(0, r - 90) * q, WAVE / 2, WAVE / 2, (r + 10) * q);
                    g.addColorStop(0, 'rgba(255,240,200,0)');
                    g.addColorStop(0.8, 'rgba(255,240,200,1)');
                    g.addColorStop(1, 'rgba(255,240,200,0)');
                    wc.fillStyle = g;
                    wc.fillRect(0, 0, WAVE, WAVE);
                    wc.globalCompositeOperation = 'destination-in';
                    wc.drawImage(wave.gold, 0, 0);
                    ctx.globalCompositeOperation = 'lighter';
                    ctx.drawImage(wave.c, 0, 0, S, S);
                    ctx.drawImage(wave.c, 0, 0, S, S);
                    ctx.globalCompositeOperation = 'source-over';
                    if (Math.random() < 0.8) {
                        const a = Math.random() * Math.PI * 2;
                        sparks.push({ x: S / 2 + Math.cos(a) * r, y: S / 2 + Math.sin(a) * r, vx: Math.cos(a), vy: Math.sin(a), life: 1, r: 2 + Math.random() * 4 });
                    }
                } else wave = null;
            }

            // искры — готовая картинка-светлячок
            if (sparks.length) {
                for (let i = sparks.length - 1; i >= 0; i--) {
                    const p = sparks[i];
                    p.x += p.vx; p.y += p.vy; p.vy += 0.02; p.life -= 0.018;
                    if (p.life <= 0) { sparks.splice(i, 1); continue; }
                    const d = p.r * 6;
                    ctx.globalAlpha = p.life;
                    ctx.drawImage(sprite, p.x - d / 2, p.y - d / 2, d, d);
                }
                ctx.globalAlpha = 1;
                ctx.globalCompositeOperation = 'source-over';
            }
        }

        // ---------- проявление кистью ----------
        function startReveal(id, v, pt, done) {
            if (!A) return;
            const m = maskOf(id);
            const px = pt ? pt.x : byId[id].cx, py = pt ? pt.y : byId[id].cy;
            const far = Math.max(...[[m.x, m.y], [m.x + m.w, m.y], [m.x, m.y + m.h], [m.x + m.w, m.y + m.h]]
                .map(([x, y]) => Math.hypot(x - px, y - py)));
            const blobs = Array.from({ length: 18 }, (_, i) => ({ a: i / 18 * Math.PI * 2 + Math.random() * 0.3, f: 0.55 + Math.random() * 0.5, d: 0.7 + Math.random() * 0.25 }));
            selected = null;
            const R = { id, v, px, py, far: far * 1.08, t0: performance.now(), dur: reduceMotion ? 200 : 1300, blobs, paint: regionPaint(id, v), done, tmp: mk(m.w, m.h) };
            reveal = R;
            // Подстраховка: если кадры не идут (приложение свёрнуто, WebView притормозил), завершаем без анимации
            R.timer = setTimeout(() => { if (reveal === R) finishReveal(R, performance.now()); }, R.dur + 900);
            kick();
        }

        function finishReveal(R, now) {
            clearTimeout(R.timer);
            reveal = null;
            flash = { t0: now, t: tinted(R.id, '#fff6e6') };
            if (!reduceMotion) {
                for (let i = 0; i < 26; i++) {
                    const a = Math.random() * Math.PI * 2, s = 1 + Math.random() * 2.5;
                    sparks.push({ x: byId[R.id].cx, y: byId[R.id].cy, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1, r: 2 + Math.random() * 3 });
                }
            }
            if (R.done) R.done();
            kick();
        }

        function drawReveal(now) {
            const R = reveal, k = Math.min(1, (now - R.t0) / R.dur), e = easeOut(k), m = R.paint.m;
            const tc = R.tmp.getContext('2d');
            tc.globalCompositeOperation = 'source-over';
            tc.clearRect(0, 0, m.w, m.h);
            const cx = R.px - m.x, cy = R.py - m.y, rad = R.far * e;
            const soft = (x, y, r) => {
                if (r <= 0) return;
                const g = tc.createRadialGradient(x, y, 0, x, y, r);
                g.addColorStop(0, 'rgba(0,0,0,1)');
                g.addColorStop(0.72, 'rgba(0,0,0,1)');
                g.addColorStop(1, 'rgba(0,0,0,0)');
                tc.fillStyle = g;
                tc.beginPath();
                tc.arc(x, y, r, 0, Math.PI * 2);
                tc.fill();
            };
            soft(cx, cy, rad * 0.9);
            for (const b of R.blobs) soft(cx + Math.cos(b.a) * rad * b.d, cy + Math.sin(b.a) * rad * b.d, rad * 0.32 * b.f);
            tc.globalCompositeOperation = 'source-in';
            tc.drawImage(R.paint.c, 0, 0);
            ctx.drawImage(R.tmp, m.x, m.y);
            if (k < 1 && !reduceMotion) {
                for (let i = 0; i < 3; i++) {
                    const a = Math.random() * Math.PI * 2, x = R.px + Math.cos(a) * rad * 0.9, y = R.py + Math.sin(a) * rad * 0.9;
                    if (A.lab[(y | 0) * S + (x | 0)] === R.id) sparks.push({ x, y, vx: Math.cos(a) * 0.6, vy: Math.sin(a) * 0.6 - 0.3, life: 1, r: 2 + Math.random() * 3 });
                }
            }
            if (k >= 1) finishReveal(R, now);
        }

        // ---------- нажатия ----------
        function pick(x, y) {
            x = Math.round(x); y = Math.round(y);
            const lab = A.lab;
            const at = (a, b) => (a < 0 || b < 0 || a >= S || b >= S) ? 255 : lab[b * S + a];
            const id = at(x, y);
            if (id !== 0) return id;
            for (let rr = 1; rr <= 14; rr++) {
                for (let a = 0; a < 16; a++) {
                    const v = at(x + Math.round(Math.cos(a / 16 * Math.PI * 2) * rr), y + Math.round(Math.sin(a / 16 * Math.PI * 2) * rr));
                    if (v !== 0) return v;
                }
            }
            return 255;
        }

        // 15.11.2026: долгое нажатие (opts.onLongPress, сейчас — сброс раскраски у тестеров).
        // Пока палец держит, у пальца растёт золотое кольцо; сдвиг пальца отменяет.
        const LONG_MS = 1000;
        let lp = null, longFired = false;
        function lpCancel() {
            if (!lp) return;
            clearTimeout(lp.timer);
            lp.ring.remove();
            lp = null;
        }
        function onDown(ev) {
            if (!opts.onLongPress || !A || reveal || (ev.button !== undefined && ev.button > 0)) return;
            lpCancel();
            longFired = false;
            const hr = host.getBoundingClientRect();
            const ring = document.createElement('div');
            ring.className = 'mrich-hold';
            ring.style.left = (ev.clientX - hr.left) + 'px';
            ring.style.top = (ev.clientY - hr.top) + 'px';
            host.appendChild(ring);
            lp = { x: ev.clientX, y: ev.clientY, ring, timer: setTimeout(() => {
                lpCancel();
                longFired = true;
                opts.onLongPress();
            }, LONG_MS) };
        }
        function onMove(ev) {
            if (lp && Math.hypot(ev.clientX - lp.x, ev.clientY - lp.y) > 12) lpCancel();
        }
        if (opts.onLongPress) {
            cv.addEventListener('pointerdown', onDown);
            cv.addEventListener('pointermove', onMove);
            cv.addEventListener('pointerup', lpCancel);
            cv.addEventListener('pointercancel', lpCancel);
            cv.addEventListener('pointerleave', lpCancel);
            cv.addEventListener('contextmenu', ev => ev.preventDefault());   // без системного меню на долгое нажатие
        }

        function onClick(ev) {
            if (longFired) { longFired = false; return; }   // после долгого нажатия выбор картины не открываем
            if (!A || reveal) return;
            const rect = cv.getBoundingClientRect();
            if (!rect.width) return;
            const x = (ev.clientX - rect.left) / rect.width * S;
            const y = (ev.clientY - rect.top) / rect.height * S;
            const id = pick(x, y);
            if (opts.onTap) opts.onTap(id === 255 ? null : byId[id] || null, { x, y });
        }
        cv.addEventListener('click', onClick);

        // ---------- для хозяина ----------
        function select(id) {
            selected = id && A ? { id, t: tinted(id, '#e9a94a') } : null;
            kick();
        }

        // Окошко выбора: эта же область в картине v, вписанная в круг size×size
        function preview(id, v, size) {
            const c = mk(size, size), cc = c.getContext('2d');
            cc.fillStyle = '#251c48';
            cc.fillRect(0, 0, size, size);
            if (!A) return c;
            const p = regionPaint(id, v), m = p.m, sc = Math.min(size * 0.9 / m.w, size * 0.9 / m.h);
            cc.drawImage(p.c, size / 2 - m.w * sc / 2, size / 2 - m.h * sc / 2, m.w * sc, m.h * sc);
            return c;
        }

        function celebrate() {
            if (!A) return;
            const goldLow = mk(WAVE, WAVE);
            goldLow.getContext('2d').drawImage(A.gold, 0, 0, WAVE, WAVE);   // волна светится по светлому золоту
            wave = { t0: performance.now(), c: mk(WAVE, WAVE), gold: goldLow };
            kick();
        }

        function setAlive(on) {
            alive = !!on;
            host.classList.toggle('is-alive', alive && !reduceMotion);
            kick();
        }

        function setDim(on) { dimMode = !!on; refresh(); }

        // Картинка мандалы как есть (для обоев)
        function snapshot() {
            const c = mk(S, S), cc = c.getContext('2d');
            if (!A) return c;
            cc.drawImage(staticCv, 0, 0);
            cc.drawImage(goldCv, 0, 0);
            return c;
        }

        function destroy() {
            destroyed = true;
            lpCancel();
            if (reveal) clearTimeout(reveal.timer);
            if (io) io.disconnect();
            cancelAnimationFrame(rafId);
            clearTimeout(pollId);
            cv.removeEventListener('click', onClick);
        }

        const ready = loadAssets(art).then(a => {
            if (destroyed) return;
            A = a;
            shimmer = mk(LOW, LOW);
            sh = shimmer.getContext('2d');
            paintedLow = mk(LOW, LOW);
            staticCv = mk(S, S);
            paintedCv = mk(S, S);
            glowCv = mk(S, S);
            buildBase();
            buildSprite();
            refresh();
        });

        return {
            ready, refresh, select, preview, celebrate, setAlive, setDim, snapshot, destroy,
            reveal: startReveal,
            region: id => byId[id],
            paintable,
            isBusy: () => !!reveal
        };
    }

    window.MandalaCanvas = { create, loadAssets };
})();
