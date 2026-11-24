// --- ОБЩАЯ МАНДАЛА «РАСКРАСИМ МИР ВМЕСТЕ» (этап 3, 14.11.2026) ---
// Все участницы раскрашивают одну мандалу. Сервер — Apps Script (Field.gs), адрес EVENT_CONFIG.notifyScriptUrl.
// Капли в день: 1 за вытянутую сегодня карту + 1 за каждый подарок/сторис сегодня, максимум 3 (сервер проверяет то же).
// Вне Telegram — только просмотр.
(function () {
    'use strict';

    const DAILY_LIMIT = 3;
    const REFRESH_MS = 45000;
    const ART_VERSION = '1';
    const MINE_KEY = 'mandala_shared_mine_v1';
    const DAY_KEY = 'mandala_shared_day_v1';
    const LAST_FIELD_KEY = 'mandala_shared_last_v1';
    const PALETTE = {
        'layer-petals': ['#f6c1cc', '#ea8fa5', '#cc6584'],
        'layer-leaves': ['#b3e2d6', '#73c3b1', '#3f9784'],
        'layer-drops': ['#fcd9a0', '#f5b05c', '#dd8a2f'],
        'layer-waves': ['#dcd0f2', '#b6a0dd', '#8b71c4'],
        'layer-rays': ['#ffcdb5', '#ffa27f', '#e5734c'],
        'layer-rim': ['#d6e7bf', '#abcd86', '#7eab58'],
        'layer-background': ['#d3e6f7', '#a3c9ec', '#6fa3d8'],
        'layer-center': ['#ffe7a8', '#f7cb54', '#de9f22']
    };
    const NAMES = {
        'layer-petals': 'Лепестки', 'layer-leaves': 'Листья', 'layer-drops': 'Капли', 'layer-waves': 'Волны',
        'layer-rays': 'Лучи', 'layer-rim': 'Ободок', 'layer-background': 'Фон', 'layer-center': 'Центр'
    };

    let field = null;        // { level, round, total, cells: { a1: 0..2 } }
    let showMine = false;
    let showUnpainted = false;
    let zoomCtrl = null;
    let selectedId = '';
    let busy = false;
    let refreshTimer = null;

    function updateZoomUi(scale, min, max) {
        const s = typeof scale === 'number' ? scale : 1;
        const lo = typeof min === 'number' ? min : 1;
        const hi = typeof max === 'number' ? max : 3.5;
        const isBase = s <= lo + 0.01;
        const outBtn = el('sharedZoomOutBtn');
        const resetBtn = el('sharedZoomResetBtn');
        const inBtn = el('sharedZoomInBtn');
        if (outBtn) outBtn.disabled = isBase;
        if (resetBtn) {
            resetBtn.disabled = isBase;
            resetBtn.textContent = isBase ? '1×' : s.toFixed(1).replace(/\.0$/, '') + '×';
        }
        if (inBtn) inBtn.disabled = s >= hi - 0.01;
    }

    function syncHighlightBtn() {
        const btn = el('sharedHighlightBtn');
        if (!btn) return;
        btn.classList.toggle('is-active', showUnpainted);
        btn.setAttribute('aria-pressed', showUnpainted ? 'true' : 'false');
    }

    // ---------- Хранилище ----------
    function readJson(key, fallback) {
        try {
            const v = JSON.parse(localStorage.getItem(key) || 'null');
            return v && typeof v === 'object' ? v : fallback;
        } catch (_) {
            return fallback;
        }
    }
    function writeJson(key, v) {
        try { localStorage.setItem(key, JSON.stringify(v)); } catch (_) {}
    }

    function dayKey() {
        // День считаем по Москве, как сервер
        try {
            return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Moscow', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
        } catch (_) {
            return new Date().toISOString().slice(0, 10);
        }
    }

    function getDay() {
        const d = readJson(DAY_KEY, null);
        const today = dayKey();
        if (!d || d.day !== today) return { day: today, shares: 0, used: 0 };
        return d;
    }

    function getMine() {
        const m = readJson(MINE_KEY, null);
        if (!m || !field || m.level !== field.level || m.round !== field.round) {
            return { level: field ? field.level : 0, round: field ? field.round : 0, ids: [] };
        }
        // «Свои» — только те, что действительно раскрашены на сервере
        return { level: m.level, round: m.round, ids: (m.ids || []).filter(id => field.cells[id] !== undefined) };
    }

    function drewCardToday() {
        const t = parseInt(localStorage.getItem('lastDrawTime') || '0', 10);
        if (!t) return false;
        try {
            const f = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Moscow', year: 'numeric', month: '2-digit', day: '2-digit' });
            return f.format(new Date(t)) === dayKey();
        } catch (_) {
            return new Date(t).toDateString() === new Date().toDateString();
        }
    }

    function dropsLeft() {
        const d = getDay();
        const earned = Math.min(DAILY_LIMIT, (drewCardToday() ? 1 : 0) + d.shares);
        return Math.max(0, earned - d.used);
    }

    // Вызывается из js/mandala.js при подарке подруге и сторис
    function onShare() {
        const d = getDay();
        d.shares += 1;
        writeJson(DAY_KEY, d);
        if (isOpen()) renderTexts();
    }

    // ---------- Сервер ----------
    function scriptUrl() {
        return (typeof EVENT_CONFIG !== 'undefined' && EVENT_CONFIG.notifyScriptUrl) ? EVENT_CONFIG.notifyScriptUrl : '';
    }

    function initData() {
        const tg = window.Telegram && window.Telegram.WebApp;
        return tg && tg.initData ? tg.initData : '';
    }

    function call(body) {
        const url = scriptUrl();
        if (!url) return Promise.reject(new Error('no_url'));
        return fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(body)
        }).then(r => r.json());
    }

    function loadField() {
        return call({ action: 'getField' }).then(res => {
            if (!res || res.status !== 'success') throw new Error('server');
            setField(res);
        });
    }

    function setField(res) {
        const levelChanged = !field || field.level !== res.level || field.round !== res.round;
        field = { level: res.level, round: res.round, total: res.total, cells: res.cells || {} };
        writeJson(LAST_FIELD_KEY, field);
        if (levelChanged) selectedId = '';
    }

    // ---------- Рисунок ----------
    function loadArt(level) {
        window.MANDALA_SHARED_SVGS = window.MANDALA_SHARED_SVGS || {};
        if (window.MANDALA_SHARED_SVGS[level]) return Promise.resolve(window.MANDALA_SHARED_SVGS[level]);
        return new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = `js/mandala-shared-${level}.js?v=${ART_VERSION}`;
            s.onload = () => (window.MANDALA_SHARED_SVGS[level] ? resolve(window.MANDALA_SHARED_SVGS[level]) : reject(new Error('art')));
            s.onerror = () => reject(new Error('art'));
            document.head.appendChild(s);
        });
    }

    function el(id) { return document.getElementById(id); }

    function isOpen() {
        const pane = el('mandalaPaneShared');
        const path = el('path');
        return !!(pane && !pane.hidden && path && path.classList.contains('active'));
    }

    function render() {
        const art = el('sharedArt');
        if (!art || !field) return;
        renderTexts();
        loadArt(field.level).then(svg => {
            const key = field.level + ':' + field.round;
            if (art.dataset.key !== key) {
                if (zoomCtrl) { zoomCtrl.destroy(); zoomCtrl = null; }
                art.innerHTML = svg;
                art.dataset.key = key;
                const s = art.querySelector('svg');
                if (s) {
                    s.setAttribute('role', 'img');
                    s.setAttribute('aria-label', `Общая мандала ${field.level}`);
                    if (window.MandalaCanvas && window.MandalaCanvas.attachZoom) {
                        zoomCtrl = window.MandalaCanvas.attachZoom(art, s, { onChange: updateZoomUi });
                    }
                }
                art.querySelectorAll('[id^="layer-"] path').forEach(p => p.classList.add('shared-region'));
            }
            paintArt(art);
        }).catch(() => {
            if (zoomCtrl) { zoomCtrl.destroy(); zoomCtrl = null; }
            updateZoomUi(1, 1, 3.5);
            art.innerHTML = '<p class="mandala-error">Не удалось загрузить рисунок. Проверьте интернет и откройте вкладку снова.</p>';
            art.dataset.key = '';
        });
    }

    function paintArt(art) {
        const mine = new Set(getMine().ids);
        const canPaint = dropsLeft() > 0 && !!initData();
        art.querySelectorAll('.shared-region').forEach(p => {
            const layer = p.parentNode && p.parentNode.id;
            const shade = field.cells[p.id];
            const filled = shade !== undefined;
            const colors = PALETTE[layer] || PALETTE['layer-petals'];
            p.setAttribute('fill', filled ? colors[shade] || colors[0] : 'none');
            p.classList.toggle('is-filled', filled);
            p.classList.toggle('is-mine', mine.has(p.id));
            p.classList.toggle('is-paintable', !filled && canPaint);
            p.classList.toggle('is-selected', p.id === selectedId);
        });
        art.classList.toggle('show-mine', showMine);
        art.classList.toggle('show-unpainted', showUnpainted);
        syncHighlightBtn();
    }

    function renderTexts() {
        if (!field) return;
        const painted = Object.keys(field.cells).length;
        const cap = el('sharedCaption');
        if (cap) cap.textContent = `Мандала ${field.level} из 5 · раскрашено ${painted} из ${field.total}`;
        const sub = el('sharedSub');
        if (sub) {
            const left = dropsLeft();
            const mineCount = getMine().ids.length;
            let text;
            if (!initData()) {
                text = 'Раскрашивать общую мандалу можно в приложении внутри Telegram.';
            } else if (left > 0) {
                text = `У Вас ${left} ${left === 1 ? 'талисман' : 'талисмана'} для общей мандалы. Нажмите на мерцающую область и выберите оттенок.`;
            } else if (getDay().used >= DAILY_LIMIT) {
                text = 'Сегодня Вы уже добавили свои цвета. Завтра будут новые талисманы 🌸';
            } else if (getDay().used > 0) {
                const more = DAILY_LIMIT - getDay().used;
                text = `Ваш цвет уже в мандале 🌸 Ещё ${more} ${more === 1 ? 'талисман' : 'талисмана'} сегодня можно получить за подарок подруге или сторис.`;
            } else {
                text = 'Талисманы для общей мандалы: 1 за карту дня и по 1 за подарок подруге или сторис, до 3 в день.';
            }
            if (mineCount > 0) text += ` Ваших мазков здесь: ${mineCount}.`;
            sub.textContent = text;
        }
        const btn = el('sharedMineBtn');
        if (btn) btn.textContent = showMine ? 'Показать всех' : 'Показать мои мазки';
    }

    // ---------- Раскраска ----------
    function palette() { return el('sharedPalette'); }

    function hidePalette() {
        selectedId = '';
        const pal = palette();
        if (pal) pal.hidden = true;
        const art = el('sharedArt');
        if (art) art.querySelectorAll('.is-selected').forEach(p => p.classList.remove('is-selected'));
    }

    function message(text) {
        const pal = palette();
        if (!pal) return;
        pal.hidden = false;
        pal.innerHTML = `<p class="mandala-palette-msg">${text}</p>`;
    }

    function onArtClick(e) {
        if (zoomCtrl && zoomCtrl.shouldIgnoreClick()) return;
        const p = e.target.closest && e.target.closest('.shared-region');
        if (!p || !field) { hidePalette(); return; }
        if (busy) return;
        if (field.cells[p.id] !== undefined) {
            hidePalette();
            message(getMine().ids.indexOf(p.id) >= 0 ? 'Это Ваш мазок 🌸' : 'Эту область уже раскрасила другая участница');
            return;
        }
        if (!initData()) {
            hidePalette();
            message('Раскрашивать общую мандалу можно в приложении внутри Telegram.');
            return;
        }
        if (dropsLeft() <= 0) {
            hidePalette();
            message(getDay().used >= DAILY_LIMIT
                ? 'Сегодня Вы уже добавили свои цвета. Завтра будут новые талисманы 🌸'
                : 'Талисманы для общей мандалы дают карта дня и подарок подруге или сторис.');
            return;
        }

        const layer = p.parentNode && p.parentNode.id;
        const colors = PALETTE[layer] || PALETTE['layer-petals'];
        selectedId = p.id;
        const art = el('sharedArt');
        art.querySelectorAll('.is-selected').forEach(x => x.classList.remove('is-selected'));
        p.classList.add('is-selected');
        try { window.Telegram.WebApp.HapticFeedback.selectionChanged(); } catch (_) {}

        const pal = palette();
        pal.hidden = false;
        pal.innerHTML = '';
        const label = document.createElement('span');
        label.className = 'mandala-palette-label';
        label.textContent = `${NAMES[layer] || 'Область'}: выберите оттенок`;
        pal.appendChild(label);
        const row = document.createElement('div');
        row.className = 'mandala-palette-row';
        colors.forEach((color, c) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'mandala-swatch';
            b.style.background = color;
            b.setAttribute('aria-label', `Оттенок ${c + 1}`);
            b.addEventListener('click', () => paint(p.id, c));
            row.appendChild(b);
        });
        pal.appendChild(row);
    }

    function paint(id, shade) {
        if (busy || !field) return;
        busy = true;
        const level = field.level, round = field.round;
        // Сразу показываем цвет, сервер подтвердит
        field.cells[id] = shade;
        hidePalette();
        const art = el('sharedArt');
        const node = art && art.querySelector('#' + id);
        paintArt(art);
        if (node) {
            node.classList.remove('is-new');
            void node.getBoundingClientRect();
            node.classList.add('is-new');
        }
        message('Сохраняем Ваш цвет…');

        call({ action: 'paint', initData: initData(), level, round, region: id, shade })
            .then(res => {
                if (res && res.field) setField(res.field);
                if (res && res.status === 'success') {
                    const mine = getMine();
                    if (mine.level === level && mine.round === round && mine.ids.indexOf(id) < 0) mine.ids.push(id);
                    writeJson(MINE_KEY, { level, round, ids: mine.ids });
                    const d = getDay();
                    d.used = Math.max(d.used + 1, Number(res.usedToday) || 0);
                    writeJson(DAY_KEY, d);
                    try { window.Telegram.WebApp.HapticFeedback.notificationOccurred('success'); } catch (_) {}
                    message(res.completed
                        ? 'Общая мандала раскрашена всеми вместе! Открыта следующая ✨'
                        : 'Ваш цвет теперь в общей мандале 🌸');
                } else {
                    if (!(res && res.field) && field.cells[id] === shade) delete field.cells[id];
                    const err = res && res.error;
                    if (err === 'limit') {
                        const d = getDay();
                        d.used = DAILY_LIMIT;
                        writeJson(DAY_KEY, d);
                    }
                    message(err === 'taken' ? 'Кто-то успел раскрасить эту область раньше. Выберите соседнюю 🌸'
                        : err === 'limit' ? 'Сегодня Вы уже добавили свои цвета. Завтра будут новые талисманы 🌸'
                        : err === 'level_changed' ? 'Пока Вы выбирали, мандалу раскрасили до конца! Открыта следующая ✨'
                        : err === 'auth' ? 'Не удалось подтвердить вход. Закройте и снова откройте приложение.'
                        : 'Не получилось сохранить цвет. Попробуйте ещё раз.');
                }
            })
            .catch(() => {
                if (field && field.cells[id] === shade) delete field.cells[id];
                message('Нет связи. Цвет не сохранён, попробуйте ещё раз.');
            })
            .then(() => {
                busy = false;
                render();
            });
    }

    // ---------- Открытие вкладки ----------
    function open() {
        if (!field) {
            const cached = readJson(LAST_FIELD_KEY, null);
            if (cached && cached.level) field = cached;
        }
        if (field) render();
        else {
            const art = el('sharedArt');
            if (art && !art.dataset.key) art.innerHTML = '<p class="mandala-error">Загружаем общую мандалу…</p>';
        }
        refresh();
        clearInterval(refreshTimer);
        refreshTimer = setInterval(() => {
            if (isOpen()) refresh(); else clearInterval(refreshTimer);
        }, REFRESH_MS);
    }

    function refresh() {
        if (busy) return;
        loadField().then(render).catch(() => {
            if (!field) {
                const art = el('sharedArt');
                if (art) art.innerHTML = '<p class="mandala-error">Общая мандала сейчас недоступна. Попробуйте позже.</p>';
            }
        });
    }

    function bind() {
        const art = el('sharedArt');
        if (art) art.addEventListener('click', onArtClick);
        const btn = el('sharedMineBtn');
        if (btn) btn.addEventListener('click', () => {
            showMine = !showMine;
            if (showMine) showUnpainted = false;
            if (art) {
                art.classList.toggle('show-mine', showMine);
                art.classList.toggle('show-unpainted', showUnpainted);
            }
            syncHighlightBtn();
            renderTexts();
        });
        const hlBtn = el('sharedHighlightBtn');
        if (hlBtn) hlBtn.addEventListener('click', () => {
            showUnpainted = !showUnpainted;
            if (showUnpainted) showMine = false;
            if (art) {
                art.classList.toggle('show-mine', showMine);
                art.classList.toggle('show-unpainted', showUnpainted);
            }
            syncHighlightBtn();
            renderTexts();
            try { window.Telegram.WebApp.HapticFeedback.selectionChanged(); } catch (_) {}
        });
        const zoomInBtn = el('sharedZoomInBtn');
        if (zoomInBtn) zoomInBtn.addEventListener('click', () => {
            if (!zoomCtrl) return;
            zoomCtrl.zoomIn();
            try { window.Telegram.WebApp.HapticFeedback.selectionChanged(); } catch (_) {}
        });
        const zoomOutBtn = el('sharedZoomOutBtn');
        if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => {
            if (!zoomCtrl) return;
            zoomCtrl.zoomOut();
            try { window.Telegram.WebApp.HapticFeedback.selectionChanged(); } catch (_) {}
        });
        const zoomResetBtn = el('sharedZoomResetBtn');
        if (zoomResetBtn) zoomResetBtn.addEventListener('click', () => {
            if (!zoomCtrl) return;
            zoomCtrl.reset();
            try { window.Telegram.WebApp.HapticFeedback.selectionChanged(); } catch (_) {}
        });
        document.querySelectorAll('.mandala-tab[data-mtab="shared"]').forEach(tab => tab.addEventListener('click', open));
    }

    window.MandalaShared = { onShare, open };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
    else bind();
})();
