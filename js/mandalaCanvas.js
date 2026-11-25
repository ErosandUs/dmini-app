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

    // ---------- Процедурные эффекты (Экономика 2.0) ----------
    const EFFECT_IDS = ['goldWave', 'lightBreath', 'stardust', 'touchTrail', 'royalCrown'];
    function normalizeEffectList(list) {
        if (!Array.isArray(list)) return [];
        const out = [];
        for (let i = 0; i < list.length; i++) {
            const id = String(list[i] || '');
            if (EFFECT_IDS.indexOf(id) !== -1 && out.indexOf(id) === -1) out.push(id);
        }
        return out;
    }

    let sharedSpark = null, sharedStar = null, sharedAura = null;
    function getSparkSprite() {
        if (sharedSpark) return sharedSpark;
        const c = mk(32, 32), g = c.getContext('2d');
        const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
        gr.addColorStop(0, 'rgba(255,246,214,1)');
        gr.addColorStop(0.35, 'rgba(240,190,90,0.9)');
        gr.addColorStop(1, 'rgba(220,160,60,0)');
        g.fillStyle = gr;
        g.fillRect(0, 0, 32, 32);
        return (sharedSpark = c);
    }

    function getStarSprite() {
        if (sharedStar) return sharedStar;
        const c = mk(32, 32), g = c.getContext('2d');
        const gr = g.createRadialGradient(16, 16, 0, 16, 16, 15);
        gr.addColorStop(0, 'rgba(255,250,224,0.95)');
        gr.addColorStop(0.45, 'rgba(248,210,120,0.45)');
        gr.addColorStop(1, 'rgba(240,184,96,0)');
        g.fillStyle = gr;
        g.fillRect(0, 0, 32, 32);
        g.fillStyle = 'rgba(255,252,235,0.98)';
        g.beginPath();
        g.moveTo(16, 3);
        g.quadraticCurveTo(17.4, 14.6, 29, 16);
        g.quadraticCurveTo(17.4, 17.4, 16, 29);
        g.quadraticCurveTo(14.6, 17.4, 3, 16);
        g.quadraticCurveTo(14.6, 14.6, 16, 3);
        g.fill();
        return (sharedStar = c);
    }

    function getAuraSprite() {
        if (sharedAura) return sharedAura;
        const c = mk(256, 256), g = c.getContext('2d');
        const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
        gr.addColorStop(0, 'rgba(255,248,220,0.68)');
        gr.addColorStop(0.36, 'rgba(246,204,116,0.40)');
        gr.addColorStop(0.72, 'rgba(240,188,224,0.16)');
        gr.addColorStop(1, 'rgba(240,188,224,0)');
        g.fillStyle = gr;
        g.fillRect(0, 0, 256, 256);
        return (sharedAura = c);
    }

    function drawMiniStar(ctx, x, y, r, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x, y - r);
        ctx.quadraticCurveTo(x + r * 0.16, y - r * 0.16, x + r, y);
        ctx.quadraticCurveTo(x + r * 0.16, y + r * 0.16, x, y + r);
        ctx.quadraticCurveTo(x - r * 0.16, y + r * 0.16, x - r, y);
        ctx.quadraticCurveTo(x - r * 0.16, y - r * 0.16, x, y - r);
        ctx.fill();
    }

    function computeCrownRadii(art, size) {
        if (art && art.edgeFade === false) {
            return { innerR: size * 0.455, outerR: size * 0.486 };
        }
        return { innerR: size * 0.435, outerR: size * 0.478 };
    }

    function buildCrownLayers(size, innerR, outerR, isThumb) {
        const half = size / 2;
        const outerCv = mk(size, size), oc = outerCv.getContext('2d');
        const rays = isThumb ? 12 : 16;
        const rStart = innerR * 0.78, rEnd = outerR * 1.03;
        oc.save();
        oc.translate(half, half);
        for (let i = 0; i < rays; i++) {
            const a = (i / rays) * Math.PI * 2;
            const cos = Math.cos(a), sin = Math.sin(a);
            const g = oc.createLinearGradient(cos * rStart, sin * rStart, cos * rEnd, sin * rEnd);
            g.addColorStop(0, 'rgba(255,244,204,0)');
            g.addColorStop(0.55, i % 2 === 0 ? 'rgba(255,232,164,0.34)' : 'rgba(246,204,116,0.22)');
            g.addColorStop(1, 'rgba(255,244,204,0)');
            oc.strokeStyle = g;
            oc.lineWidth = isThumb ? 1.4 : (i % 2 === 0 ? 2.2 : 1.3);
            oc.beginPath();
            oc.moveTo(cos * rStart, sin * rStart);
            oc.lineTo(cos * rEnd, sin * rEnd);
            oc.stroke();
        }
        oc.strokeStyle = 'rgba(255,234,172,0.72)';
        oc.lineWidth = isThumb ? 1.3 : 1.7;
        oc.beginPath();
        oc.arc(0, 0, outerR, 0, Math.PI * 2);
        oc.stroke();

        oc.save();
        oc.setLineDash(isThumb ? [3, 4] : [6, 7]);
        oc.strokeStyle = 'rgba(255,246,214,0.58)';
        oc.lineWidth = isThumb ? 0.9 : 1.1;
        oc.beginPath();
        oc.arc(0, 0, outerR * 0.962, 0, Math.PI * 2);
        oc.stroke();
        oc.restore();

        const starCount = 8;
        const starR = isThumb ? 3.4 : 6.2;
        for (let i = 0; i < starCount; i++) {
            const a = (i / starCount) * Math.PI * 2;
            drawMiniStar(oc, Math.cos(a) * outerR, Math.sin(a) * outerR, starR, 'rgba(255,246,214,0.92)');
        }
        oc.restore();

        const innerCv = mk(size, size), ic = innerCv.getContext('2d');
        ic.save();
        ic.translate(half, half);
        ic.strokeStyle = 'rgba(246,212,130,0.62)';
        ic.lineWidth = isThumb ? 1.1 : 1.3;
        ic.beginPath();
        ic.arc(0, 0, innerR, 0, Math.PI * 2);
        ic.stroke();

        ic.save();
        ic.setLineDash(isThumb ? [1.5, 4.5] : [2, 8]);
        ic.strokeStyle = 'rgba(255,242,198,0.55)';
        ic.lineWidth = isThumb ? 1.1 : 1.5;
        ic.beginPath();
        ic.arc(0, 0, innerR * 1.028, 0, Math.PI * 2);
        ic.stroke();
        ic.restore();

        for (let i = 0; i < 4; i++) {
            const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
            ic.fillStyle = 'rgba(255,248,220,0.88)';
            ic.beginPath();
            ic.arc(Math.cos(a) * innerR, Math.sin(a) * innerR, isThumb ? 1.6 : 2.8, 0, Math.PI * 2);
            ic.fill();
        }
        ic.restore();
        return { outerCv, innerCv };
    }

    function makeDustPool(count, size, minRFrac, maxRFrac) {
        const pool = [];
        for (let i = 0; i < count; i++) {
            const frac = i / count;
            pool.push({
                angle: frac * Math.PI * 2 + (i % 3) * 0.41,
                speed: (i % 2 === 0 ? 1 : -1) * (0.045 + (i % 5) * 0.014),
                radFrac: minRFrac + ((i * 37) % 100) / 100 * (maxRFrac - minRFrac),
                wobble: 0.025 + (i % 4) * 0.008,
                freq: 0.65 + (i % 6) * 0.18,
                phase: i * 1.37,
                size: (size / 1024) * (16 + (i % 5) * 4.5),
                star: i % 3 === 0
            });
        }
        return pool;
    }

    function drawLightBreathEffect(ctx, S, now, reduce) {
        const aura = getAuraSprite();
        const breath = reduce ? 0.55 : 0.5 - 0.5 * Math.cos(now / 955);
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const outerSize = S * (0.88 + 0.14 * breath);
        ctx.globalAlpha = 0.24 + 0.24 * breath;
        ctx.drawImage(aura, (S - outerSize) / 2, (S - outerSize) / 2, outerSize, outerSize);
        const coreSize = S * (0.48 + 0.1 * breath);
        ctx.globalAlpha = 0.18 + 0.22 * breath;
        ctx.drawImage(aura, (S - coreSize) / 2, (S - coreSize) / 2, coreSize, coreSize);
        ctx.restore();
    }

    function drawGoldWaveEffect(ctx, S, bufCv, maskCv, now, phaseOffsetMs, reduce) {
        if (!bufCv || !maskCv) return;
        if (reduce) {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha = 0.24;
            ctx.drawImage(maskCv, 0, 0, S, S);
            ctx.restore();
            return;
        }
        const cycle = 4800, sweep = 2600;
        const elapsed = ((now - (phaseOffsetMs || 0)) % cycle + cycle) % cycle;
        if (elapsed >= sweep) return;
        const k = elapsed / sweep;
        const bs = bufCv.width, bc = bufCv.getContext('2d');
        const r = k * bs * 0.78;
        const band = bs * 0.14;
        bc.globalCompositeOperation = 'source-over';
        bc.clearRect(0, 0, bs, bs);
        const g = bc.createRadialGradient(bs / 2, bs / 2, Math.max(0, r - band), bs / 2, bs / 2, r + bs * 0.03);
        g.addColorStop(0, 'rgba(255,244,204,0)');
        g.addColorStop(0.58, 'rgba(255,244,204,0.92)');
        g.addColorStop(1, 'rgba(255,244,204,0)');
        bc.fillStyle = g;
        bc.fillRect(0, 0, bs, bs);
        bc.globalCompositeOperation = 'destination-in';
        bc.drawImage(maskCv, 0, 0);
        const fade = Math.sin(k * Math.PI);
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.45 + 0.4 * fade;
        ctx.drawImage(bufCv, 0, 0, S, S);
        ctx.restore();
    }

    function drawCrownEffect(ctx, S, layers, now, reduce) {
        if (!layers) return;
        const aOuter = reduce ? 0 : now / 22000;
        const aInner = reduce ? 0 : -now / 32000;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.85;
        ctx.translate(S / 2, S / 2);
        ctx.rotate(aOuter);
        ctx.drawImage(layers.outerCv, -S / 2, -S / 2, S, S);
        ctx.rotate(aInner - aOuter);
        ctx.drawImage(layers.innerCv, -S / 2, -S / 2, S, S);
        ctx.restore();
    }

    function drawDustEffect(ctx, S, pool, now, reduce) {
        if (!pool || !pool.length) return;
        const spark = getSparkSprite(), star = getStarSprite();
        const t = reduce ? 0 : now / 1000;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < pool.length; i++) {
            const p = pool[i];
            const a = p.angle + t * p.speed;
            const r = S * (p.radFrac + p.wobble * Math.sin(t * p.freq + p.phase));
            const x = S / 2 + Math.cos(a) * r;
            const y = S / 2 + Math.sin(a) * r;
            const tw = reduce ? 0.65 : 0.25 + 0.7 * (0.5 + 0.5 * Math.sin(t * (1.8 + p.freq) + p.phase * 2));
            const sz = Math.max(8, p.size * (0.75 + 0.35 * tw));
            ctx.globalAlpha = tw;
            ctx.drawImage(p.star ? star : spark, x - sz / 2, y - sz / 2, sz, sz);
        }
        ctx.restore();
    }

    function drawTouchEffects(ctx, touchSparks, touchRipples, scaleFactor) {
        if (!touchSparks.length && !touchRipples.length) return;
        const spark = getSparkSprite();
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let i = touchRipples.length - 1; i >= 0; i--) {
            const rp = touchRipples[i];
            rp.life -= 0.032;
            if (rp.life <= 0) { touchRipples.splice(i, 1); continue; }
            const r = rp.maxR * (1 - rp.life * 0.72);
            ctx.globalAlpha = rp.life * 0.65;
            ctx.strokeStyle = 'rgba(255,238,184,0.92)';
            ctx.lineWidth = Math.max(1.2, 3.2 * scaleFactor * rp.life);
            ctx.beginPath();
            ctx.arc(rp.x, rp.y, r, 0, Math.PI * 2);
            ctx.stroke();
        }
        for (let i = touchSparks.length - 1; i >= 0; i--) {
            const p = touchSparks[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.96;
            p.vy *= 0.96;
            p.life -= p.decay || 0.028;
            if (p.life <= 0) { touchSparks.splice(i, 1); continue; }
            const d = p.r * 5.5;
            ctx.globalAlpha = p.life;
            ctx.drawImage(spark, p.x - d / 2, p.y - d / 2, d, d);
        }
        ctx.restore();
    }

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

    // ---------- Приближение и перемещение (Zoom & Pan) для Canvas и SVG ----------
    // Используется личной мандалой (обёртка .mrich-stage) и общей мандалой (SVG в #sharedArt).
    function attachZoom(viewport, target, opts) {
        opts = opts || {};
        const MIN = opts.min || 1;
        const MAX = opts.max || 3.5;
        let scale = 1, tx = 0, ty = 0;
        let dragging = false, pinching = false, moved = false;
        let sx = 0, sy = 0, tx0 = 0, ty0 = 0;
        let pDist0 = 0, pScale0 = 1, pMid0 = { x: 0, y: 0 }, pTx0 = 0, pTy0 = 0;
        let suppressClickUntil = 0;
        let animTimer = 0;

        function clamp() {
            if (scale <= MIN + 0.001) {
                scale = MIN;
                tx = 0;
                ty = 0;
                return;
            }
            const w = viewport.clientWidth || 1;
            const h = viewport.clientHeight || 1;
            const maxX = w * (scale - 1) / 2;
            const maxY = h * (scale - 1) / 2;
            tx = Math.max(-maxX, Math.min(maxX, tx));
            ty = Math.max(-maxY, Math.min(maxY, ty));
        }

        function apply(animate) {
            clearTimeout(animTimer);
            if (animate) {
                target.classList.add('is-animating');
                animTimer = setTimeout(() => target.classList.remove('is-animating'), 220);
            } else {
                target.classList.remove('is-animating');
            }
            const zoomed = scale > MIN + 0.001;
            viewport.classList.toggle('is-zoomed', zoomed);
            target.style.transform = zoomed ? `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0) scale(${scale.toFixed(4)})` : '';
            if (opts.onChange) opts.onChange(scale, MIN, MAX);
        }

        function zoomTo(nextScale, px, py, animate) {
            const clamped = Math.max(MIN, Math.min(MAX, nextScale));
            if (px !== undefined && py !== undefined && scale > 0) {
                const ix = (px - tx) / scale;
                const iy = (py - ty) / scale;
                scale = clamped;
                tx = px - ix * scale;
                ty = py - iy * scale;
            } else {
                const ratio = clamped / scale;
                scale = clamped;
                tx *= ratio;
                ty *= ratio;
            }
            clamp();
            apply(animate);
        }

        function centerOffset(clientX, clientY) {
            const r = viewport.getBoundingClientRect();
            return { x: clientX - (r.left + r.width / 2), y: clientY - (r.top + r.height / 2) };
        }

        function touchInfo(t1, t2) {
            const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY) || 1;
            const mid = centerOffset((t1.clientX + t2.clientX) / 2, (t1.clientY + t2.clientY) / 2);
            return { dist, mid };
        }

        function onTouchStart(e) {
            if (e.touches.length === 2) {
                e.preventDefault();
                pinching = true;
                dragging = false;
                moved = true;
                if (opts.onGestureStart) opts.onGestureStart();
                const info = touchInfo(e.touches[0], e.touches[1]);
                pDist0 = info.dist;
                pScale0 = scale;
                pMid0 = info.mid;
                pTx0 = tx;
                pTy0 = ty;
            } else if (e.touches.length === 1 && scale > MIN + 0.001) {
                dragging = true;
                pinching = false;
                moved = false;
                sx = e.touches[0].clientX;
                sy = e.touches[0].clientY;
                tx0 = tx;
                ty0 = ty;
            }
        }

        function onTouchMove(e) {
            if (pinching && e.touches.length === 2) {
                e.preventDefault();
                const info = touchInfo(e.touches[0], e.touches[1]);
                const nextScale = Math.max(MIN, Math.min(MAX, pScale0 * (info.dist / pDist0)));
                const ix = (pMid0.x - pTx0) / pScale0;
                const iy = (pMid0.y - pTy0) / pScale0;
                scale = nextScale;
                tx = info.mid.x - ix * scale;
                ty = info.mid.y - iy * scale;
                clamp();
                apply(false);
            } else if (dragging && e.touches.length === 1) {
                const dx = e.touches[0].clientX - sx;
                const dy = e.touches[0].clientY - sy;
                if (!moved && Math.hypot(dx, dy) > 8) {
                    moved = true;
                    if (opts.onGestureStart) opts.onGestureStart();
                }
                if (moved) {
                    e.preventDefault();
                    tx = tx0 + dx;
                    ty = ty0 + dy;
                    clamp();
                    apply(false);
                }
            }
        }

        function onTouchEnd(e) {
            if (pinching && e.touches.length === 1) {
                pinching = false;
                suppressClickUntil = Date.now() + 340;
                if (scale > MIN + 0.001) {
                    dragging = true;
                    moved = true;
                    sx = e.touches[0].clientX;
                    sy = e.touches[0].clientY;
                    tx0 = tx;
                    ty0 = ty;
                }
                return;
            }
            if (e.touches.length === 0) {
                if (moved || pinching) suppressClickUntil = Date.now() + 340;
                dragging = false;
                pinching = false;
                moved = false;
            }
        }

        let mouseDrag = false, mouseMoved = false;
        function onMouseDown(e) {
            if (e.button !== 0 || scale <= MIN + 0.001) return;
            mouseDrag = true;
            mouseMoved = false;
            sx = e.clientX;
            sy = e.clientY;
            tx0 = tx;
            ty0 = ty;
        }
        function onMouseMove(e) {
            if (!mouseDrag) return;
            const dx = e.clientX - sx;
            const dy = e.clientY - sy;
            if (!mouseMoved && Math.hypot(dx, dy) > 6) {
                mouseMoved = true;
                if (opts.onGestureStart) opts.onGestureStart();
            }
            if (mouseMoved) {
                tx = tx0 + dx;
                ty = ty0 + dy;
                clamp();
                apply(false);
            }
        }
        function onMouseUp() {
            if (!mouseDrag) return;
            if (mouseMoved) suppressClickUntil = Date.now() + 260;
            mouseDrag = false;
            mouseMoved = false;
        }

        function onWheel(e) {
            if (!e.ctrlKey && scale <= MIN + 0.001) return;
            e.preventDefault();
            const pt = centerOffset(e.clientX, e.clientY);
            const factor = e.deltaY < 0 ? 1.18 : 1 / 1.18;
            zoomTo(scale * factor, pt.x, pt.y, false);
        }

        viewport.addEventListener('touchstart', onTouchStart, { passive: false });
        viewport.addEventListener('touchmove', onTouchMove, { passive: false });
        viewport.addEventListener('touchend', onTouchEnd, { passive: true });
        viewport.addEventListener('touchcancel', onTouchEnd, { passive: true });
        viewport.addEventListener('mousedown', onMouseDown);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        viewport.addEventListener('wheel', onWheel, { passive: false });

        apply(false);

        return {
            zoomIn: () => zoomTo(scale * 1.45, undefined, undefined, true),
            zoomOut: () => zoomTo(scale / 1.45, undefined, undefined, true),
            reset: () => { scale = MIN; tx = 0; ty = 0; apply(true); },
            getScale: () => scale,
            shouldIgnoreClick: () => Date.now() < suppressClickUntil,
            destroy: () => {
                clearTimeout(animTimer);
                viewport.classList.remove('is-zoomed');
                target.style.transform = '';
                target.classList.remove('is-animating');
                viewport.removeEventListener('touchstart', onTouchStart);
                viewport.removeEventListener('touchmove', onTouchMove);
                viewport.removeEventListener('touchend', onTouchEnd);
                viewport.removeEventListener('touchcancel', onTouchEnd);
                viewport.removeEventListener('mousedown', onMouseDown);
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);
                viewport.removeEventListener('wheel', onWheel);
            }
        };
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
        // 22.11.2026: мандалы с вертикальным сюжетом (например, Хранительница p2) не вращаются после завершения
        host.classList.toggle('mrich--nospin', art.spin === false || art.key === 'p2');
        host.innerHTML = '';
        const stage = document.createElement('div');
        stage.className = 'mrich-stage';
        const cv = mk(S, S);
        cv.className = 'mrich-canvas';
        cv.setAttribute('role', 'img');
        cv.setAttribute('aria-label', opts.label || ('Мандала «' + art.title + '»'));
        stage.appendChild(cv);
        host.appendChild(stage);
        const ctx = cv.getContext('2d');

        let A = null;             // картинки и карта областей
        let destroyed = false;
        let staticCv, glowCv, paintedCv, baseCv, goldCv, unpaintedCv, unpaintedGoldCv;
        let hasGlow = false, hasPainted = false, hasUnpainted = false, alive = false;
        let unpaintedSmall = [];
        const masks = {};
        const paintCache = {};    // кусок картины в форме области: «id_v» → холст
        let selected = null, reveal = null, flash = null, wave = null, dimMode = false, highlightUnpainted = false;
        const sparks = [];
        let activeEffects = normalizeEffectList(opts.effects);
        let previewEffect = null, previewT0 = 0;
        let goldWaveMask = null, goldWaveBuf = null, crownLayers = null, dustPool = null;
        const touchSparks = [], touchRipples = [];
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
        // 25.11.2026: узкие зазоры на стыке контуров (lab === 0, где gold-lines.png прозрачен, а расширение областей 3 px
        // не достаёт) раньше заливались белым #f7f0fa и просвечивали при приближении. Теперь весь силуэт внутри
        // контура подкрашен цветом контура #be8e3e, а жемчужная основа рисуется только под реальными областями (с тем же +3 px).
        function buildBase() {
            // золотые линии темнее, чтобы читались на светлом
            goldCv = mk(S, S);
            const gc = goldCv.getContext('2d');
            gc.drawImage(A.gold, 0, 0);
            let gd = null;
            try { gd = gc.getImageData(0, 0, S, S).data; } catch (_) {}
            gc.globalCompositeOperation = 'source-in';
            gc.fillStyle = '#be8e3e';
            gc.fillRect(0, 0, S, S);

            const lab = A.lab, N = S * S;
            const outer = new Uint8Array(N);
            const q = new Int32Array(N);
            let head = 0, tail = 0;
            for (let x = 0; x < S; x++) {
                if (lab[x] === 255) { outer[x] = 1; q[tail++] = x; }
                const b = (S - 1) * S + x;
                if (lab[b] === 255 && !outer[b]) { outer[b] = 1; q[tail++] = b; }
            }
            for (let y = 1; y < S - 1; y++) {
                const l = y * S, r = l + S - 1;
                if (lab[l] === 255 && !outer[l]) { outer[l] = 1; q[tail++] = l; }
                if (lab[r] === 255 && !outer[r]) { outer[r] = 1; q[tail++] = r; }
            }
            while (head < tail) {
                const cur = q[head++], x = cur % S, y = (cur / S) | 0;
                if (x > 0 && !outer[cur - 1] && lab[cur - 1] === 255) { outer[cur - 1] = 1; q[tail++] = cur - 1; }
                if (x < S - 1 && !outer[cur + 1] && lab[cur + 1] === 255) { outer[cur + 1] = 1; q[tail++] = cur + 1; }
                if (y > 0 && !outer[cur - S] && lab[cur - S] === 255) { outer[cur - S] = 1; q[tail++] = cur - S; }
                if (y < S - 1 && !outer[cur + S] && lab[cur + S] === 255) { outer[cur + S] = 1; q[tail++] = cur + S; }
            }
            // Срезаем внешний 2–4 px ореол (lab === 0 снаружи от непрозрачного контура), чтобы край остался гладким
            const maxDepth = gd ? 4 : 3;
            const depth = new Uint8Array(N);
            head = 0;
            while (head < tail) {
                const cur = q[head++], d = depth[cur];
                if (d >= maxDepth) continue;
                const x = cur % S, y = (cur / S) | 0, nd = d + 1;
                if (x > 0 && !outer[cur - 1] && lab[cur - 1] === 0 && (!gd || gd[(cur - 1) * 4 + 3] < 96)) { outer[cur - 1] = 1; depth[cur - 1] = nd; q[tail++] = cur - 1; }
                if (x < S - 1 && !outer[cur + 1] && lab[cur + 1] === 0 && (!gd || gd[(cur + 1) * 4 + 3] < 96)) { outer[cur + 1] = 1; depth[cur + 1] = nd; q[tail++] = cur + 1; }
                if (y > 0 && !outer[cur - S] && lab[cur - S] === 0 && (!gd || gd[(cur - S) * 4 + 3] < 96)) { outer[cur - S] = 1; depth[cur - S] = nd; q[tail++] = cur - S; }
                if (y < S - 1 && !outer[cur + S] && lab[cur + S] === 0 && (!gd || gd[(cur + S) * 4 + 3] < 96)) { outer[cur + S] = 1; depth[cur + S] = nd; q[tail++] = cur + S; }
            }

            baseCv = mk(S, S);
            const s = baseCv.getContext('2d');
            // 1. Внутренний силуэт (включая узкие стыки между линиями) — цвет контура #be8e3e
            const body = mk(S, S), bc = body.getContext('2d'), bimg = bc.createImageData(S, S);
            for (let i = 0; i < N; i++) if (!outer[i]) bimg.data[i * 4 + 3] = 255;
            bc.putImageData(bimg, 0, 0);
            bc.globalCompositeOperation = 'source-in';
            bc.fillStyle = '#be8e3e';
            bc.fillRect(0, 0, S, S);
            s.drawImage(body, 0, 0);

            // 2. Жемчужная основа и призрак картины строго по объединённой маске областей (+3 px, как в maskOf)
            const rawRegs = maskWhere(v => v !== 0 && v !== 255);
            const regs = mk(S, S), rc = regs.getContext('2d');
            for (let dx = -3; dx <= 3; dx++) for (let dy = -3; dy <= 3; dy++) if (dx * dx + dy * dy <= 9) rc.drawImage(rawRegs, dx, dy);
            rc.globalCompositeOperation = 'source-in';
            rc.fillStyle = '#f7f0fa';
            rc.fillRect(0, 0, S, S);
            s.drawImage(regs, 0, 0);
            rc.drawImage(A.V[1], 0, 0);
            s.globalAlpha = 0.22;
            s.drawImage(regs, 0, 0);
            s.globalAlpha = 1;
        }

        // Искра — готовая картинка-светлячок вместо градиента на каждую искру в каждом кадре
        function buildSprite() {
            sprite = getSparkSprite();
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
            const dimPainted = dimMode || highlightUnpainted;
            // узор (клинья, ободки) проявляется картиной первого раскрашенного соседа
            regions.forEach(r => {
                if (r.layer !== 'decor') return;
                const nb = (r.near || []).find(n => opts.paintOf(n) !== undefined);
                if (nb === undefined) return;
                const p = regionPaint(r.id, opts.paintOf(nb));
                s.globalAlpha = dimPainted ? 0.25 : 1;
                s.drawImage(p.c, p.m.x, p.m.y);
                s.globalAlpha = 1;
            });

            const pc = paintedCv.getContext('2d');
            pc.globalCompositeOperation = 'source-over';
            pc.clearRect(0, 0, S, S);
            const gc = glowCv.getContext('2d');
            gc.globalCompositeOperation = 'source-over';
            gc.clearRect(0, 0, S, S);
            const uc = unpaintedCv.getContext('2d');
            uc.globalCompositeOperation = 'source-over';
            uc.clearRect(0, 0, S, S);
            const ugc = unpaintedGoldCv.getContext('2d');
            ugc.globalCompositeOperation = 'source-over';
            ugc.clearRect(0, 0, S, S);
            const mineCv = dimMode ? mk(S, S) : null;
            hasGlow = false;
            hasPainted = false;
            hasUnpainted = false;
            unpaintedSmall = [];
            for (const r of paintable) {
                const v = opts.paintOf(r.id);
                const m = maskOf(r.id);
                if (v !== undefined) {
                    const p = regionPaint(r.id, v);
                    const mine = mineOf(r.id);
                    s.globalAlpha = (highlightUnpainted || (dimMode && !mine)) ? 0.25 : 1;
                    s.drawImage(p.c, m.x, m.y);
                    s.globalAlpha = 1;
                    pc.drawImage(m.c, m.x, m.y);
                    hasPainted = true;
                    if (mineCv && mine) mineCv.getContext('2d').drawImage(m.c, m.x, m.y);
                } else {
                    if (highlightUnpainted) {
                        if (r.layer === 'gold') ugc.drawImage(m.c, m.x, m.y);
                        else uc.drawImage(m.c, m.x, m.y);
                        hasUnpainted = true;
                        const bw = r.bbox[2] - r.bbox[0], bh = r.bbox[3] - r.bbox[1];
                        if (bw < 110 || bh < 110) unpaintedSmall.push(r);
                    } else if (!dimMode && opts.canPaint && opts.canPaint(r)) {
                        gc.drawImage(m.c, m.x, m.y);
                        hasGlow = true;
                    }
                }
            }
            gc.globalCompositeOperation = 'source-in';
            gc.fillStyle = '#f0b860';
            gc.fillRect(0, 0, S, S);
            if (hasUnpainted) {
                uc.globalCompositeOperation = 'source-in';
                uc.fillStyle = '#e85d8a';
                uc.fillRect(0, 0, S, S);
                ugc.globalCompositeOperation = 'source-in';
                ugc.fillStyle = '#f0a018';
                ugc.fillRect(0, 0, S, S);
            }
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
        const hasEffect = id => activeEffects.indexOf(id) !== -1 || previewEffect === id;
        const hasAnyEffect = () => activeEffects.length > 0 || !!previewEffect;
        const visible = () => !document.hidden && onScreen && (io !== null || host.offsetParent !== null);
        const busyNow = () => !!(reveal || flash || wave || sparks.length || touchSparks.length || touchRipples.length || selected);
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
            // Без движения хватает ~30 кадров: мерцание, перелив и эффекты плавные
            if (!busyNow() && now - lastFrame < 30) { rafId = requestAnimationFrame(frame); return; }
            lastFrame = now;
            draw(now);
            // Раскрашенная мандала вращается средствами CSS; при активных эффектах цикл работает и в покое
            const idleAnim = !reduceMotion && ((!alive && (hasGlow || (highlightUnpainted && hasUnpainted) || (hasPainted && !dimMode && !highlightUnpainted))) || hasAnyEffect());
            if (busyNow() || idleAnim) rafId = requestAnimationFrame(frame);
        }

        function draw(now) {
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 1;
            ctx.clearRect(0, 0, S, S);
            ctx.drawImage(staticCv, 0, 0);

            // мерцание свободных областей или контрастная подсветка всех незакрашенных
            if (highlightUnpainted && hasUnpainted) {
                const pulse = reduceMotion ? 0.68 : 0.42 + 0.44 * (0.5 + 0.5 * Math.sin(now / 360));
                ctx.globalAlpha = pulse;
                ctx.drawImage(unpaintedCv, 0, 0);
                ctx.drawImage(unpaintedGoldCv, 0, 0);
                ctx.globalAlpha = 1;
            } else if (hasGlow) {
                ctx.globalAlpha = reduceMotion ? 0.16 : 0.06 + 0.16 * (0.5 + 0.5 * Math.sin(now / 520));
                ctx.drawImage(glowCv, 0, 0);
                ctx.globalAlpha = 1;
            }
            // перелив по раскрашенному: медленный бегущий блик (в уменьшенном размере)
            if (hasPainted && !dimMode && !highlightUnpainted && !reduceMotion && !alive) {
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

            if (hasEffect('lightBreath')) drawLightBreathEffect(ctx, S, now, reduceMotion);

            ctx.drawImage(goldCv, 0, 0);

            if (hasEffect('goldWave')) {
                drawGoldWaveEffect(ctx, S, goldWaveBuf, goldWaveMask, now, previewEffect === 'goldWave' ? previewT0 : 0, reduceMotion);
            }
            if (hasEffect('royalCrown')) {
                drawCrownEffect(ctx, S, crownLayers, now, reduceMotion);
            }
            if (hasEffect('stardust')) {
                drawDustEffect(ctx, S, dustPool, now, reduceMotion);
            }
            if (hasEffect('touchTrail') || touchSparks.length || touchRipples.length) {
                drawTouchEffects(ctx, touchSparks, touchRipples, 1);
            }

            // мягкие маячки для мелких незакрашенных кусочков при включённой подсветке
            if (highlightUnpainted && unpaintedSmall.length) {
                const wave01 = reduceMotion ? 0.7 : 0.5 + 0.5 * Math.sin(now / 360);
                const rad = 14 + 8 * wave01;
                ctx.save();
                ctx.lineWidth = 3.5;
                for (let i = 0; i < unpaintedSmall.length; i++) {
                    const r = unpaintedSmall[i];
                    ctx.beginPath();
                    ctx.arc(r.cx, r.cy, rad, 0, Math.PI * 2);
                    ctx.strokeStyle = r.layer === 'gold'
                        ? `rgba(240, 160, 24, ${(0.55 + 0.4 * wave01).toFixed(2)})`
                        : `rgba(232, 93, 138, ${(0.55 + 0.4 * wave01).toFixed(2)})`;
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.arc(r.cx, r.cy, 4.5, 0, Math.PI * 2);
                    ctx.fillStyle = '#fff9f2';
                    ctx.fill();
                }
                ctx.restore();
            }

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

        const zoom = attachZoom(host, stage, {
            onChange: opts.onZoomChange,
            onGestureStart: lpCancel
        });

        // Пассивное отслеживание касаний для эффекта «Отклик на касание» и защиты от случайного тапа после свайпа на 1×
        let effDrag = null, lastTrailAt = 0, suppressTapUntil = 0;
        function pointerCanvasPos(ev) {
            if (ev.target === cv && typeof ev.offsetX === 'number' && cv.clientWidth > 0 && cv.clientHeight > 0) {
                return { x: ev.offsetX * (S / cv.clientWidth), y: ev.offsetY * (S / cv.clientHeight) };
            }
            const rect = cv.getBoundingClientRect();
            if (!rect.width) return null;
            return { x: (ev.clientX - rect.left) * (S / rect.width), y: (ev.clientY - rect.top) * (S / rect.height) };
        }
        function spawnTouchBurst(pt, count, withRipple) {
            if (!A || !pt) return;
            if (withRipple && !reduceMotion && touchRipples.length < 6) {
                touchRipples.push({ x: pt.x, y: pt.y, maxR: 54, life: 1 });
            }
            if (reduceMotion) return;
            for (let i = 0; i < count; i++) {
                if (touchSparks.length >= 45) touchSparks.shift();
                const a = Math.random() * Math.PI * 2;
                const spd = 0.5 + Math.random() * 1.9;
                touchSparks.push({
                    x: pt.x + (Math.random() - 0.5) * 10,
                    y: pt.y + (Math.random() - 0.5) * 10,
                    vx: Math.cos(a) * spd,
                    vy: Math.sin(a) * spd - 0.35,
                    life: 1,
                    r: 2.2 + Math.random() * 3.4,
                    decay: 0.026 + Math.random() * 0.014
                });
            }
            kick();
        }
        function onEffDown(ev) {
            if (ev.button !== undefined && ev.button > 0) return;
            effDrag = { x: ev.clientX, y: ev.clientY, moved: false };
            if (hasEffect('touchTrail')) {
                spawnTouchBurst(pointerCanvasPos(ev), 5, true);
                lastTrailAt = performance.now();
            }
        }
        function onEffMove(ev) {
            if (effDrag && !effDrag.moved && Math.hypot(ev.clientX - effDrag.x, ev.clientY - effDrag.y) > 10) {
                effDrag.moved = true;
            }
            if (!hasEffect('touchTrail') || !A) return;
            if (ev.pointerType === 'mouse' && !(ev.buttons & 1)) return;
            const now = performance.now();
            if (now - lastTrailAt < 28) return;
            lastTrailAt = now;
            spawnTouchBurst(pointerCanvasPos(ev), 2, false);
        }
        function onEffEnd() {
            if (effDrag && effDrag.moved && hasEffect('touchTrail')) {
                suppressTapUntil = Date.now() + 260;
            }
            effDrag = null;
        }
        cv.addEventListener('pointerdown', onEffDown, { passive: true });
        cv.addEventListener('pointermove', onEffMove, { passive: true });
        cv.addEventListener('pointerup', onEffEnd, { passive: true });
        cv.addEventListener('pointercancel', onEffEnd, { passive: true });

        function onClick(ev) {
            if (zoom.shouldIgnoreClick()) return;
            if (Date.now() < suppressTapUntil) return;
            if (longFired) { longFired = false; return; }   // после долгого нажатия выбор картины не открываем
            if (!A || reveal) return;
            const pt = pointerCanvasPos(ev);
            if (!pt) return;
            const id = pick(pt.x, pt.y);
            if (opts.onTap) opts.onTap(id === 255 ? null : byId[id] || null, pt);
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

        function setHighlightUnpainted(on) {
            highlightUnpainted = !!on;
            refresh();
        }

        function setEffects(list) {
            activeEffects = normalizeEffectList(list);
            kick();
        }

        function setPreviewEffect(id) {
            const valid = id && EFFECT_IDS.indexOf(id) !== -1 ? id : null;
            previewEffect = valid;
            previewT0 = valid ? performance.now() : 0;
            kick();
        }

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
            zoom.destroy();
            if (reveal) clearTimeout(reveal.timer);
            if (io) io.disconnect();
            cancelAnimationFrame(rafId);
            clearTimeout(pollId);
            cv.removeEventListener('pointerdown', onEffDown);
            cv.removeEventListener('pointermove', onEffMove);
            cv.removeEventListener('pointerup', onEffEnd);
            cv.removeEventListener('pointercancel', onEffEnd);
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
            unpaintedCv = mk(S, S);
            unpaintedGoldCv = mk(S, S);
            goldWaveMask = mk(WAVE, WAVE);
            const gwm = goldWaveMask.getContext('2d');
            gwm.drawImage(A.gold, 0, 0, WAVE, WAVE);
            gwm.globalCompositeOperation = 'source-in';
            gwm.fillStyle = '#fff2c2';
            gwm.fillRect(0, 0, WAVE, WAVE);
            goldWaveBuf = mk(WAVE, WAVE);
            const cr = computeCrownRadii(art, 512);
            crownLayers = buildCrownLayers(512, cr.innerR, cr.outerR, false);
            dustPool = makeDustPool(22, S, 0.14, 0.46);
            buildBase();
            buildSprite();
            refresh();
        });

        return {
            ready, refresh, select, preview, celebrate, setAlive, setDim, setHighlightUnpainted,
            setEffects, setPreviewEffect, snapshot, destroy,
            reveal: startReveal,
            region: id => byId[id],
            paintable,
            isBusy: () => !!reveal,
            zoomIn: zoom.zoomIn,
            zoomOut: zoom.zoomOut,
            resetZoom: zoom.reset,
            getZoom: zoom.getScale
        };
    }

    // Миниатюра текущей мандалы для кнопки-медальона на главном экране (с поддержкой купленных эффектов)
    function renderThumb(canvas, art, paint, opts) {
        if (!canvas || !art) return Promise.resolve();
        const ctx = canvas.getContext && canvas.getContext('2d');
        if (!ctx) return Promise.resolve();
        opts = opts || {};
        const effects = normalizeEffectList(opts.effects);
        const bindTouchEl = opts.bindTouchEl || null;
        const seq = (canvas._thumbSeq = (canvas._thumbSeq || 0) + 1);
        const w = canvas.width || 180;
        const h = canvas.height || 180;

        if (canvas._thumbCtrl) {
            canvas._thumbCtrl.stop();
            canvas._thumbCtrl = null;
        }

        return loadAssets(art).then(A => {
            if (canvas._thumbSeq !== seq) return;
            const S = art.size;
            const lab = A.lab;
            const variantById = new Int8Array(256);
            variantById.fill(-1);
            const pMap = paint || {};
            const usedV = [false, false, false];
            Object.keys(pMap).forEach(k => {
                const id = parseInt(k, 10);
                const entry = pMap[k];
                if (id > 0 && id < 255 && entry && typeof entry.c === 'number' && entry.c >= 0 && entry.c < 3) {
                    variantById[id] = entry.c;
                    usedV[entry.c] = true;
                }
            });
            (art.regions || []).forEach(r => {
                if (r.layer !== 'decor') return;
                const nb = (r.near || []).find(n => variantById[n] >= 0);
                if (nb !== undefined) variantById[r.id] = variantById[nb];
            });

            let minX = S, minY = S, maxX = 0, maxY = 0;
            (art.regions || []).forEach(r => {
                if (!r.bbox) return;
                if (r.bbox[0] < minX) minX = r.bbox[0];
                if (r.bbox[1] < minY) minY = r.bbox[1];
                if (r.bbox[2] > maxX) maxX = r.bbox[2];
                if (r.bbox[3] > maxY) maxY = r.bbox[3];
            });
            if (maxX <= minX || maxY <= minY) { minX = 0; minY = 0; maxX = S; maxY = S; }
            const bw = maxX - minX;
            const bh = maxY - minY;
            const side = Math.max(1, Math.min(bw, bh));
            const cropX = Math.max(0, Math.min(S - side, (minX + maxX - side) / 2));
            const cropY = bh > bw
                ? Math.max(0, Math.min(S - side, minY))
                : Math.max(0, Math.min(S - side, (minY + maxY - side) / 2));

            const insideCv = mk(w, h), ic = insideCv.getContext('2d');
            const insideImg = ic.createImageData(w, h), idata = insideImg.data;
            const vMaskImg = [null, null, null];
            const vMaskData = [null, null, null];
            for (let v = 0; v < 3; v++) {
                if (!usedV[v]) continue;
                vMaskImg[v] = ic.createImageData(w, h);
                vMaskData[v] = vMaskImg[v].data;
            }
            const shift = Math.max(1, Math.round(side / w));

            for (let y = 0; y < h; y++) {
                const sy = Math.min(S - 1, (cropY + (y + 0.5) * side / h) | 0);
                const rowOff = sy * S;
                for (let x = 0; x < w; x++) {
                    const sx = Math.min(S - 1, (cropX + (x + 0.5) * side / w) | 0);
                    const id = lab[rowOff + sx];
                    if (id === 255) continue;
                    const aIdx = (y * w + x) * 4 + 3;
                    idata[aIdx] = 255;
                    let v = variantById[id];
                    if (v < 0 && id === 0) {
                        const n1 = sx >= shift ? variantById[lab[rowOff + sx - shift]] : -1;
                        if (n1 >= 0) v = n1;
                        else {
                            const n2 = sx + shift < S ? variantById[lab[rowOff + sx + shift]] : -1;
                            if (n2 >= 0) v = n2;
                            else {
                                const n3 = sy >= shift ? variantById[lab[(sy - shift) * S + sx]] : -1;
                                if (n3 >= 0) v = n3;
                                else if (sy + shift < S) {
                                    const n4 = variantById[lab[(sy + shift) * S + sx]];
                                    if (n4 >= 0) v = n4;
                                }
                            }
                        }
                    }
                    if (v >= 0 && vMaskData[v]) vMaskData[v][aIdx] = 255;
                }
            }

            const drawCropped = (c, img) => {
                const iw = img.naturalWidth || img.width || S;
                const ih = img.naturalHeight || img.height || S;
                const kx = iw / S, ky = ih / S;
                c.drawImage(img, cropX * kx, cropY * ky, side * kx, side * ky, 0, 0, w, h);
            };

            const out = mk(w, h), octx = out.getContext('2d');
            ic.putImageData(insideImg, 0, 0);
            ic.globalCompositeOperation = 'source-in';
            ic.fillStyle = '#f7f0fa';
            ic.fillRect(0, 0, w, h);
            octx.drawImage(insideCv, 0, 0);
            if (A.V[1]) {
                drawCropped(ic, A.V[1]);
                octx.globalAlpha = 0.22;
                octx.drawImage(insideCv, 0, 0);
                octx.globalAlpha = 1;
            }

            for (let v = 0; v < 3; v++) {
                if (!vMaskImg[v] || !A.V[v]) continue;
                const vm = mk(w, h), vmc = vm.getContext('2d');
                vmc.putImageData(vMaskImg[v], 0, 0);
                vmc.globalCompositeOperation = 'source-in';
                drawCropped(vmc, A.V[v]);
                octx.drawImage(vm, 0, 0);
            }

            const goldCv = mk(w, h), gctx = goldCv.getContext('2d');
            drawCropped(gctx, A.gold);
            gctx.globalCompositeOperation = 'source-in';
            gctx.fillStyle = '#be8e3e';
            gctx.fillRect(0, 0, w, h);

            if (!effects.length) {
                ctx.clearRect(0, 0, w, h);
                ctx.drawImage(out, 0, 0);
                ctx.drawImage(goldCv, 0, 0);
                return;
            }

            const has = id => effects.indexOf(id) !== -1;
            const thumbGoldMask = has('goldWave') ? (() => {
                const gm = mk(w, h), mc = gm.getContext('2d');
                drawCropped(mc, A.gold);
                mc.globalCompositeOperation = 'source-in';
                mc.fillStyle = '#fff2c2';
                mc.fillRect(0, 0, w, h);
                return gm;
            })() : null;
            const thumbWaveBuf = has('goldWave') ? mk(w, h) : null;
            const thumbCrown = has('royalCrown') ? buildCrownLayers(w, w * 0.415, w * 0.472, true) : null;
            const thumbDust = has('stardust') ? makeDustPool(9, w, 0.16, 0.44) : null;
            const tSparks = [], tRipples = [];

            let stopped = false, rafId = 0, pollId = 0, onScreen = true, lastFrame = 0, lastTouchGlint = 0;
            let io = null;
            if ('IntersectionObserver' in window) {
                io = new IntersectionObserver(entries => {
                    onScreen = entries[entries.length - 1].isIntersecting;
                    if (onScreen) kickThumb();
                });
                io.observe(canvas);
            }
            const isThumbVisible = () => !document.hidden && onScreen && canvas.offsetParent !== null;

            function spawnThumbBurst(rx, ry, count) {
                if (reduceMotion) return;
                if (tRipples.length < 4) tRipples.push({ x: rx, y: ry, maxR: w * 0.28, life: 1 });
                for (let i = 0; i < count; i++) {
                    if (tSparks.length >= 16) tSparks.shift();
                    const a = Math.random() * Math.PI * 2;
                    const spd = 0.35 + Math.random() * 0.9;
                    tSparks.push({ x: rx, y: ry, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd - 0.15, life: 1, r: 1.5 + Math.random() * 2, decay: 0.036 });
                }
                kickThumb();
            }

            function onThumbDown(ev) {
                if (!has('touchTrail') || stopped) return;
                const r = canvas.getBoundingClientRect();
                const rx = r.width ? ((ev.clientX - r.left) / r.width) * w : w / 2;
                const ry = r.height ? ((ev.clientY - r.top) / r.height) * h : h / 2;
                spawnThumbBurst(rx, ry, 6);
            }
            if (bindTouchEl && has('touchTrail')) {
                bindTouchEl.addEventListener('pointerdown', onThumbDown, { passive: true });
            }

            function drawThumbFrame(now) {
                ctx.globalCompositeOperation = 'source-over';
                ctx.globalAlpha = 1;
                ctx.clearRect(0, 0, w, h);
                ctx.drawImage(out, 0, 0);
                if (has('lightBreath')) drawLightBreathEffect(ctx, w, now, reduceMotion);
                ctx.drawImage(goldCv, 0, 0);
                if (has('goldWave')) drawGoldWaveEffect(ctx, w, thumbWaveBuf, thumbGoldMask, now, 0, reduceMotion);
                if (has('royalCrown')) drawCrownEffect(ctx, w, thumbCrown, now, reduceMotion);
                if (has('stardust')) drawDustEffect(ctx, w, thumbDust, now, reduceMotion);
                if (has('touchTrail') && !reduceMotion && now - lastTouchGlint > 3200) {
                    lastTouchGlint = now;
                    const a = (now / 1000) % (Math.PI * 2);
                    const rx = w / 2 + Math.cos(a) * w * 0.24, ry = h / 2 + Math.sin(a) * h * 0.24;
                    if (tRipples.length < 3) tRipples.push({ x: rx, y: ry, maxR: w * 0.2, life: 0.85 });
                    if (tSparks.length < 14) tSparks.push({ x: rx, y: ry, vx: Math.cos(a + 1.2) * 0.5, vy: Math.sin(a + 1.2) * 0.5, life: 0.9, r: 1.8, decay: 0.032 });
                }
                if (tSparks.length || tRipples.length) {
                    drawTouchEffects(ctx, tSparks, tRipples, w / 1024);
                }
            }

            function thumbFrame(now) {
                rafId = 0;
                if (stopped) return;
                if (!isThumbVisible()) { pollId = setTimeout(kickThumb, 700); return; }
                if (now - lastFrame < 34) { rafId = requestAnimationFrame(thumbFrame); return; }
                lastFrame = now;
                drawThumbFrame(now);
                if (!reduceMotion || tSparks.length || tRipples.length) {
                    rafId = requestAnimationFrame(thumbFrame);
                }
            }

            function kickThumb() {
                if (stopped || rafId) return;
                clearTimeout(pollId);
                pollId = 0;
                rafId = requestAnimationFrame(thumbFrame);
            }

            function stopThumb() {
                if (stopped) return;
                stopped = true;
                cancelAnimationFrame(rafId);
                clearTimeout(pollId);
                if (io) io.disconnect();
                if (bindTouchEl) bindTouchEl.removeEventListener('pointerdown', onThumbDown);
            }

            canvas._thumbCtrl = { kick: kickThumb, stop: stopThumb };
            drawThumbFrame(performance.now());
            if (!reduceMotion) kickThumb();
        });
    }

    window.MandalaCanvas = { create, loadAssets, attachZoom, renderThumb };
})();
