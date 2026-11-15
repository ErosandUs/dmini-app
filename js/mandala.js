// --- ЛИЧНАЯ МАНДАЛА-РАСКРАСКА (этап 2, 14.11.2026) ---
// Практика даёт капли краски: карта, аудио до конца, видео до конца (по разу за цикл карты).
// Подарок подруге (+1), сторис (+3 раз в сутки) и «Подарки от Джамили» дают золотые капли.
// Человек сам выбирает область и одну из трёх картин. Мандала закрыта, когда раскрашены все области.
// Хранение: localStorage + копия в Telegram CloudStorage.
// 14.11.2026: живописные мандалы — отрисовка в js/mandalaCanvas.js, данные в js/mandala-<ключ>.js.
(function () {
    'use strict';

    const STATE_KEY = 'mandala_state_v1';
    const CLOUD_KEY = 'mandala_state_v1';
    const VIP_ONLY = true;                              // 14.11.2026: тест на телефоне — мандалы только у VIP. Для всех: false
    const VIP_DROPS = 999;                              // у VIP капли пополняются до этого числа при каждом входе
    const STATE_V = 3;                                  // 3 — живописные мандалы (области другие, раскраска с нуля)
    const ART_KEYS = ['p1', 'p2', 'p3', 'p4', 'p5'];    // мандала 1..5 → данные window.MANDALA_RICH[ключ]
    const LEVEL_COUNT = ART_KEYS.length;
    const BOT_LINK = 'https://t.me/Djamiliakha_bot?start=go';
    const LAYER_NAMES = { center: 'Сердце', petals: 'Лепестки', leaves: 'Листья', outer: 'Внешние лепестки', gold: 'Золотые лепестки' };
    // Послание Джамили при завершении мандалы (черновики — на утверждении у Валентина)
    const FINISH_TEXT = {
        p1: '✨✨✨\nВаш лотос раскрылся.\n\n' +
            'Каждая капля на этом пути - день, когда вы выбирали себя: карту, тишину, свой внутренний голос. ' +
            'А золотые лепестки - свет, которым вы поделились с подругами.\n\n' +
            'Так растёт наш внутренний сад: шаг за шагом, с любовью.\n\n' +
            'Я РАСКРЫВАЮСЬ, КАК ЛОТОС НА РАССВЕТЕ.\n\nДжамиля Ха'
    };

    function artOf(level) {
        const key = ART_KEYS[level - 1];
        return (key && window.MANDALA_RICH && window.MANDALA_RICH[key]) || null;
    }

    function capsOf(art) {
        if (!art) return { practice: 0, gold: 0 };
        let practice = 0, gold = 0;
        art.regions.forEach(r => {
            if (r.layer === 'gold') gold++;
            else if (r.layer !== 'decor') practice++;
        });
        return { practice, gold };
    }

    // ---------- Состояние ----------
    function emptyState() {
        return {
            v: STATE_V,
            practiceAll: 0,     // заработано капель за всё время
            goldAll: 0,         // заработано золотых капель за всё время
            practiceSpent: 0,   // потрачено капель
            goldSpent: 0,       // потрачено золотых капель
            level: 1,           // текущая мандала 1..5 (дальше — когда готова её картина)
            done: false,        // все пять раскрашены
            paint: {},          // раскраска текущей мандалы: { номер области: { l: 'gold' | 'p', c: картина 0..2 } }
            flags: {},          // одноразовые поводы: welcome, migrated, level_1, day30, moon_YYYY-MM-DD …
            cycle: { key: '', card: false, audio: false, video: false },
            storyDay: '',
            firstSeen: 0,
            lastVisit: 0,
            hintSeen: false,
            resetAt: 0,         // 15.11.2026: время сброса раскраски тестером (при слиянии с облаком побеждает более поздний)
            active: false       // было ли хоть одно действие (показывать ли плашку на главной)
        };
    }

    function loadState() {
        try {
            const raw = JSON.parse(localStorage.getItem(STATE_KEY) || 'null');
            if (raw && typeof raw === 'object') {
                const s = Object.assign(emptyState(), raw);
                if (raw.v !== STATE_V) {
                    // Прежние версии (плоские мандалы): раскраска заново, все заработанные капли возвращаются
                    s.v = STATE_V;
                    s.level = 1;
                    s.done = false;
                    s.paint = {};
                    s.practiceSpent = 0;
                    s.goldSpent = 0;
                    delete s.seen;
                }
                return s;
            }
        } catch (_) {}
        return emptyState();
    }

    let state = loadState();

    function saveState(skipCloud) {
        try { localStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch (_) {}
        if (!skipCloud) pushCloud();
    }

    function getCloud() {
        const tg = window.Telegram && window.Telegram.WebApp;
        try {
            if (tg && tg.CloudStorage && typeof tg.isVersionAtLeast === 'function' && tg.isVersionAtLeast('6.9')) {
                return tg.CloudStorage;
            }
        } catch (_) {}
        return null;
    }

    let cloudTimer = null;
    function pushCloud() {
        const cloud = getCloud();
        if (!cloud) return;
        clearTimeout(cloudTimer);
        cloudTimer = setTimeout(() => {
            try { cloud.setItem(CLOUD_KEY, JSON.stringify(state), () => {}); } catch (_) {}
        }, 400);
    }

    // Слияние с облаком (другое устройство): счётчики — максимум, раскраска — от более продвинутой мандалы
    function pullCloud() {
        const cloud = getCloud();
        if (!cloud) return;
        try {
            cloud.getItem(CLOUD_KEY, (err, value) => {
                if (err || !value) { pushCloud(); return; }
                let remote = null;
                try { remote = JSON.parse(value); } catch (_) {}
                if (!remote || typeof remote !== 'object' || remote.v !== STATE_V) { pushCloud(); return; }
                const before = JSON.stringify(state);
                ['practiceAll', 'goldAll'].forEach(k => {
                    state[k] = Math.max(state[k] || 0, remote[k] || 0);
                });
                const rReset = remote.resetAt || 0, lReset = state.resetAt || 0;
                if (rReset !== lReset) {
                    // Был сброс раскраски: раскраска и потраченное — с той стороны, где сброс позже,
                    // иначе раскраска с другого устройства вернулась бы
                    if (rReset > lReset) {
                        state.resetAt = rReset;
                        state.level = remote.level || 1;
                        state.done = !!remote.done;
                        state.paint = remote.paint || {};
                        state.practiceSpent = remote.practiceSpent || 0;
                        state.goldSpent = remote.goldSpent || 0;
                    }
                } else {
                    ['practiceSpent', 'goldSpent'].forEach(k => {
                        state[k] = Math.max(state[k] || 0, remote[k] || 0);
                    });
                }
                if (rReset !== lReset) {
                    // уже решено выше
                } else if ((remote.level || 1) > state.level || (remote.done && !state.done)) {
                    state.level = remote.level || 1;
                    state.done = !!remote.done;
                    state.paint = remote.paint || {};
                } else if ((remote.level || 1) === state.level) {
                    state.paint = Object.assign({}, remote.paint || {}, state.paint);
                }
                state.flags = Object.assign({}, remote.flags || {}, state.flags);
                if (remote.firstSeen && (!state.firstSeen || remote.firstSeen < state.firstSeen)) state.firstSeen = remote.firstSeen;
                state.active = state.active || !!remote.active;
                state.hintSeen = state.hintSeen || !!remote.hintSeen;
                if (JSON.stringify(state) !== before) {
                    saveState();
                    renderChip();
                    if (isPathOpen()) renderPath();
                }
            });
        } catch (_) {}
    }

    // ---------- Прогресс ----------
    function getProgress() {
        const level = Math.min(state.level, LEVEL_COUNT);
        const art = artOf(level);
        const caps = capsOf(art);
        let paintedP = 0, paintedG = 0;
        Object.keys(state.paint).forEach(id => {
            if (state.paint[id].l === 'gold') paintedG++; else paintedP++;
        });
        return {
            level,
            art,
            soon: !art,                        // картина этой мандалы ещё готовится
            practiceCap: caps.practice,
            goldCap: caps.gold,
            paintedP,
            paintedG,
            complete: !!art && paintedP >= caps.practice && paintedG >= caps.gold,
            dropsP: Math.max(0, state.practiceAll - state.practiceSpent),
            dropsG: Math.max(0, state.goldAll - state.goldSpent),
            done: !!state.done
        };
    }

    // Раскрашенная мандала остаётся «живой», пока не готова картина следующей; потом открывается следующая
    function maybeAdvance() {
        const pr = getProgress();
        if (!pr.complete || state.done) return false;
        if (state.level >= LEVEL_COUNT) {
            state.done = true;
            saveState();
            return true;
        }
        if (!artOf(state.level + 1)) return false;
        const finished = state.level;
        state.level = finished + 1;
        state.paint = {};
        giveOnce('level_' + finished, 'за раскрашенную мандалу');
        toast(`Открыта новая мандала: «${artOf(state.level).title}» 🪷`);
        saveState();
        return true;
    }

    // ---------- Слова и даты ----------
    function plural(n, one, few, many) {
        const m100 = n % 100, m10 = n % 10;
        if (m100 >= 11 && m100 <= 14) return many;
        if (m10 === 1) return one;
        if (m10 >= 2 && m10 <= 4) return few;
        return many;
    }
    const dropsWord = n => plural(n, 'капля', 'капли', 'капель');
    const petalsWord = n => plural(n, 'лепесток', 'лепестка', 'лепестков');
    const goldDropsWord = n => plural(n, 'золотая капля', 'золотые капли', 'золотых капель');

    function dayKey(ts) {
        const d = new Date(ts || Date.now());
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }

    function moonEvent() {
        const age = ((Date.now() - Date.UTC(2000, 0, 6, 18, 14)) / 86400000) % 29.530588;
        if (age < 1 || age > 28.53) return 'new';
        if (Math.abs(age - 14.765) < 1) return 'full';
        return '';
    }

    function readCollection() {
        try {
            const raw = JSON.parse(localStorage.getItem('mystic_collection') || '[]');
            return Array.isArray(raw) ? raw : [];
        } catch (_) {
            return [];
        }
    }

    function readNum(key) {
        const n = parseInt(localStorage.getItem(key) || '0', 10);
        return isNaN(n) || n < 0 ? 0 : n;
    }

    function haptic(kind) {
        try {
            const h = window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback;
            if (!h) return;
            if (kind === 'success') h.notificationOccurred('success');
            else if (kind === 'select') h.selectionChanged();
            else h.impactOccurred('light');
        } catch (_) {}
    }

    // ---------- Плашка-уведомление (общий элемент #giftToast) ----------
    const toastQueue = [];
    let toastBusy = false;
    function toast(text) {
        if (!state.active) return; // пока человек не начал путь, тихо копим
        toastQueue.push(text);
        if (!toastBusy) nextToast();
    }
    function nextToast() {
        const el = document.getElementById('giftToast');
        const text = toastQueue.shift();
        if (!el || !text) { toastBusy = false; return; }
        toastBusy = true;
        el.textContent = text;
        el.classList.add('is-visible');
        setTimeout(() => {
            el.classList.remove('is-visible');
            setTimeout(nextToast, 350);
        }, 3000);
    }

    // ---------- Начисления ----------
    function djamiliaGift(reason) {
        state.goldAll += 1;
        toast(`🎁 Подарок от Джамили: золотая капля ${reason}`);
    }

    function giveOnce(flag, reason) {
        if (state.flags[flag]) return false;
        state.flags[flag] = Date.now();
        djamiliaGift(reason);
        return true;
    }

    function cycleKey() {
        return localStorage.getItem('lastDrawTime') || 'none';
    }

    function award(kind, origin) {
        let flying = false;
        const key = cycleKey();
        if (state.cycle.key !== key) state.cycle = { key, card: false, audio: false, video: false };

        if (kind === 'card' || kind === 'audio' || kind === 'video') {
            if (state.cycle[kind]) return;
            state.cycle[kind] = true;
            state.active = true;
            state.practiceAll += 1;
            const msg = kind === 'card' ? 'карта дня' : (kind === 'audio' ? 'аудиопослание' : 'видеопослание');
            // «+1 🪷» всплывает над картой, аудио или видео и улетает в счётчик капель
            flying = flyDrop(origin, kind === 'card' ? 2600 : 0);
            if (!flying) {
                const show = () => toast(`🪷 +1 капля краски (${msg}). Раскрасьте лепесток в «Твой путь»`);
                if (kind === 'card') setTimeout(show, 2600); else show();
            }

            if (kind === 'card') {
                const streak = readNum('practice_streak_count');
                if (streak >= 7 && streak % 7 === 0) giveOnce('streak7_' + dayKey(), `за ${streak} дней практики подряд`);
                if (state.firstSeen && Date.now() - state.firstSeen >= 30 * 86400000) giveOnce('day30', 'за 30 дней с нами');
            }
        } else if (kind === 'gift') {
            if (window.MandalaShared) window.MandalaShared.onShare();
            state.active = true;
            state.goldAll += 1;
            toast('💌 Подарок отправлен: +1 золотая капля');
        } else if (kind === 'story') {
            if (window.MandalaShared) window.MandalaShared.onShare();
            state.active = true;
            const today = dayKey();
            if (state.storyDay === today) {
                toast('Спасибо, что поделились ✨ Золотые капли за сторис сегодня уже получены');
            } else {
                state.storyDay = today;
                state.goldAll += 3;
                // 15.11.2026: начисляется после возвращения из редактора — крупный золотой перелёт и надпись
                flying = flyDrop(origin, 0, { text: '+3 ✨', gold: true });
                toast('Спасибо, что поделились! ✨ +3 золотые капли');
            }
        } else {
            return;
        }
        saveState();
        if (!flying) { renderChip(); syncHud(); }   // при перелёте счётчик обновится, когда капля долетит
        if (isPathOpen()) renderPath();
    }

    // ---------- Счётчик капель и перелёт «+1» ----------
    // На главном счётчик — плашка с лотосом (#giftCounterChip). На экранах аудио и видео (и когда плашки не видно)
    // сверху по центру показывается такой же счётчик .drop-hud.
    let hud = null, hudNum = null, hudPending = 0;

    function totalDrops() {
        const pr = getProgress();
        return pr.dropsP + pr.dropsG;
    }

    function chipVisible() {
        const chip = document.getElementById('giftCounterChip');
        return !!(chip && chip.offsetParent !== null && !chip.classList.contains('is-mandala-hidden'));
    }

    function syncHud() {
        if (!hud) return;
        const daily = document.getElementById('daily');
        const show = state.active && daily && daily.classList.contains('active') && !chipVisible();
        hud.classList.toggle('is-on', !!show);
        hudNum.textContent = String(totalDrops());
    }

    function setupHud() {
        if (hud) return;
        hud = document.createElement('div');
        hud.className = 'drop-hud';
        hud.setAttribute('aria-hidden', 'true');
        hud.innerHTML = '<span class="drop-hud-ico">🪷</span><span class="drop-hud-num"></span>';
        hudNum = hud.querySelector('.drop-hud-num');
        document.body.appendChild(hud);
        const daily = document.getElementById('daily');
        const schedule = () => {
            if (hudPending) return;
            hudPending = requestAnimationFrame(() => { hudPending = 0; syncHud(); });
        };
        if (daily && 'MutationObserver' in window) {
            new MutationObserver(schedule).observe(daily, { attributes: true, subtree: true, attributeFilter: ['style', 'class'] });
        }
        syncHud();
    }

    // Возвращает true, если перелёт будет (иначе показываем обычное сообщение)
    // opt (15.11.2026): text — надпись («+3 ✨» за сторис), gold — золотой вариант
    function flyDrop(origin, delay, opt) {
        opt = opt || {};
        let reduce = false;
        try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (_) {}
        if (reduce || !document.body || typeof document.body.animate !== 'function') return false;
        setTimeout(() => {
            let target = null;
            if (chipVisible()) target = document.getElementById('giftCounterChip');
            else if (isPathOpen()) target = document.getElementById('mandalaSubcaption');   // строка с каплями на экране мандалы
            else if (hud) { hud.classList.add('is-on'); target = hud; }
            const vw = window.innerWidth, vh = window.innerHeight;
            let sx = vw / 2, sy = vh / 2;
            const o = origin && origin.getBoundingClientRect ? origin.getBoundingClientRect() : null;
            if (o && o.width && o.bottom > 0 && o.top < vh) {
                sx = o.left + o.width / 2;
                sy = Math.min(Math.max(o.top + o.height / 2, 80), vh - 80);
            }
            const t = target ? target.getBoundingClientRect() : { left: vw / 2, top: 20, width: 0, height: 0 };
            const dx = t.left + t.width / 2 - sx, dy = t.top + t.height / 2 - sy;
            const el = document.createElement('div');
            el.className = opt.gold ? 'drop-fly drop-fly--gold' : 'drop-fly';
            el.textContent = opt.text || '+1 🪷';
            el.style.left = sx + 'px';
            el.style.top = sy + 'px';
            document.body.appendChild(el);
            haptic('light');
            const anim = el.animate([
                { transform: 'translate(-50%, -50%) scale(0.5)', opacity: 0 },
                { transform: 'translate(-50%, -160%) scale(1.15)', opacity: 1, offset: 0.25 },
                { transform: 'translate(-50%, -160%) scale(1)', opacity: 1, offset: 0.5 },
                { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.45)`, opacity: 0.35 }
            ], { duration: opt.gold ? 2300 : 1700, easing: 'cubic-bezier(0.45, 0, 0.2, 1)', fill: 'forwards' });
            let landed = false;
            const land = () => {
                if (landed) return;
                landed = true;
                el.remove();
                renderChip();
                syncHud();
                if (target) {
                    target.classList.remove('is-bump');
                    void target.offsetWidth;
                    target.classList.add('is-bump');
                    setTimeout(() => target.classList.remove('is-bump'), 700);
                }
            };
            anim.onfinish = land;
            setTimeout(land, 3200); // подстраховка, если анимация не доиграла (приложение свёрнуто)
        }, delay || 0);
        return true;
    }

    // ---------- Запуск: перенос накопленного и поводы при входе ----------
    function init() {
        const now = Date.now();
        const collection = readCollection();

        if (!state.flags.migrated) {
            state.flags.migrated = now;
            let draws = 0;
            let earliest = 0;
            collection.forEach(item => {
                const c = item && typeof item === 'object' && item.count ? parseInt(item.count, 10) || 1 : 1;
                draws += c;
                const t = item && item.date ? Date.parse(item.date) : NaN;
                if (!isNaN(t) && (!earliest || t < earliest)) earliest = t;
            });
            state.practiceAll += draws;
            state.goldAll += readNum('gift_sent_count') + readNum('story_share_count') * 3;
            if (!state.firstSeen) state.firstSeen = earliest || now;
            if (draws > 0 || readNum('gift_sent_count') || readNum('story_share_count')) state.active = true;
        }
        if (!state.firstSeen) state.firstSeen = now;

        giveOnce('welcome', 'на начало пути');

        if (state.lastVisit && now - state.lastVisit >= 7 * 86400000) {
            giveOnce('back_' + dayKey(), '— мы скучали');
        }
        const moon = moonEvent();
        if (moon) giveOnce('moon_' + dayKey(), moon === 'new' ? 'в новолуние' : 'в полнолуние');
        if (now - state.firstSeen >= 30 * 86400000 && collection.length) giveOnce('day30', 'за 30 дней с нами');

        state.lastVisit = now;
        maybeAdvance();
        saveState(true);
        renderChip();
        bindUi();
        setupHud();
        pullCloud();
    }

    // ---------- Плашка на главной ----------
    function renderChip() {
        const chip = document.getElementById('giftCounterChip');
        if (!chip) return;
        const pr = getProgress();
        const visible = state.active;
        chip.classList.toggle('is-mandala-hidden', !visible);
        if (!visible) return;
        const ico = chip.querySelector('.cd-gift-ico');
        const val = document.getElementById('giftCounterValue');
        const lbl = document.getElementById('giftCounterLabel');
        // Плашка — счётчик капель; светится, только когда есть что раскрасить
        const waiting = pr.dropsP + pr.dropsG;
        const canPaintNow = !(pr.done || pr.complete || pr.soon) && waiting > 0;
        if (ico) ico.textContent = '🪷';
        if (waiting > 0) {
            if (val) val.textContent = String(waiting);
            if (lbl) lbl.textContent = dropsWord(waiting);
            chip.classList.toggle('has-drops', canPaintNow);
            chip.setAttribute('aria-label', `${waiting} ${dropsWord(waiting)} краски. Открыть мандалу`);
        } else {
            const filled = pr.paintedP + pr.paintedG;
            if (val) val.textContent = String(filled);
            if (lbl) lbl.textContent = petalsWord(filled);
            chip.classList.remove('has-drops');
            chip.setAttribute('aria-label', `Моя мандала: раскрашено ${filled} ${petalsWord(filled)}. Открыть «Твой путь»`);
        }
    }

    // ---------- Экран «Твой путь» ----------
    function isPathOpen() {
        const sec = document.getElementById('path');
        return !!(sec && sec.classList.contains('active'));
    }

    let view = null;        // движок текущей мандалы (js/mandalaCanvas.js)
    let viewLevel = 0;
    let selectedId = 0;
    let selectedPt = null;

    function paintOf(id) {
        const p = state.paint[id];
        return p ? p.c : undefined;
    }

    function canPaintRegion(r) {
        const pr = getProgress();
        if (pr.complete || pr.done || state.paint[r.id]) return false;
        return r.layer === 'gold' ? pr.dropsG > 0 : pr.dropsP > 0;
    }

    function renderPath() {
        const box = document.getElementById('mandalaArt');
        if (!box) return;
        maybeAdvance();
        const pr = getProgress();
        if (!view || viewLevel !== pr.level) hidePalette();
        renderTexts(pr);
        if (pr.soon || !window.MandalaCanvas) {
            if (view) { view.destroy(); view = null; viewLevel = 0; }
            box.classList.remove('mrich', 'is-alive');
            box.innerHTML = '<div class="mrich-soon"><p class="mrich-soon-title">Следующая мандала готовится</p>' +
                '<p class="mrich-soon-text">Капли краски копятся и дождутся её.</p></div>';
            return;
        }
        if (!view || viewLevel !== pr.level) {
            if (view) view.destroy();
            viewLevel = pr.level;
            view = window.MandalaCanvas.create(box, {
                art: pr.art,
                label: `Моя мандала «${pr.art.title}»`,
                paintOf,
                canPaint: canPaintRegion,
                onTap,
                onLongPress: isVip() ? askReset : null
            });
            view.ready.catch(() => {
                box.innerHTML = '<p class="mandala-error">Не удалось загрузить мандалу. Проверьте интернет и откройте экран снова.</p>';
                view = null;
                viewLevel = 0;
            });
        } else {
            view.refresh();
        }
        if (view) view.setAlive(pr.complete);
    }

    function renderTexts(pr) {
        const cap = document.getElementById('mandalaCaption');
        const sub = document.getElementById('mandalaSubcaption');
        const levels = document.getElementById('mandalaLevels');
        const streakEl = document.getElementById('mandalaStreak');
        const hint = document.getElementById('mandalaHint');
        const total = pr.practiceCap + pr.goldCap;
        const filled = pr.paintedP + pr.paintedG;
        const leftP = pr.practiceCap - pr.paintedP;
        const leftG = pr.goldCap - pr.paintedG;
        const allDrops = pr.dropsP + pr.dropsG;

        if (cap) {
            if (pr.done) cap.textContent = 'Все пять мандал раскрашены ✨';
            else if (pr.soon) cap.textContent = `Мандала ${pr.level} из ${LEVEL_COUNT} готовится`;
            else if (pr.complete) cap.textContent = `«${pr.art.title}» раскрашена ✨`;
            else cap.textContent = `«${pr.art.title}» · раскрашено ${filled} из ${total}`;
        }

        if (sub) {
            const parts = [];
            if (pr.done) {
                parts.push('Спасибо, что несёте свет. Продолжайте практику и дарите карты подругам.');
            } else if (pr.soon || pr.complete) {
                parts.push('Следующая мандала готовится.');
                if (allDrops > 0) parts.push(`${allDrops} ${dropsWord(allDrops)} краски дождутся её.`);
                else parts.push('Капли за практику и подарки будут копиться для неё.');
            } else {
                const canP = leftP > 0 ? Math.min(pr.dropsP, leftP) : 0;
                const canG = Math.min(pr.dropsG, leftG);
                if (canP + canG > 0) {
                    const have = [];
                    if (pr.dropsP > 0) have.push(`${pr.dropsP} ${dropsWord(pr.dropsP)}`);
                    if (pr.dropsG > 0) have.push(`${pr.dropsG} ${goldDropsWord(pr.dropsG)}`);
                    parts.push(`У Вас ${have.join(' и ')}. Нажмите на мерцающую область и выберите картину.`);
                } else if (leftP > 0) {
                    parts.push(`Капли краски дарит практика: карта дня, аудио до конца, видео до конца. Осталось ${leftP} ${plural(leftP, 'область', 'области', 'областей')}.`);
                }
                if (leftP === 0 && leftG > 0) {
                    parts.push(`Почти готово! Осталось ${leftG} ${plural(leftG, 'золотой лепесток', 'золотых лепестка', 'золотых лепестков')}: подарите карту подруге или поделитесь в сторис.`);
                    if (pr.dropsP > 0) parts.push(`${pr.dropsP} ${dropsWord(pr.dropsP)} ждут следующей мандалы.`);
                } else if (leftG > 0 && pr.dropsG === 0) {
                    parts.push('Золотые лепестки проявляются золотыми каплями: их дают подарки подругам и сторис.');
                }
            }
            sub.textContent = parts.join(' ');
        }

        if (levels) {
            levels.innerHTML = '';
            for (let n = 1; n <= LEVEL_COUNT; n++) {
                const dot = document.createElement('span');
                const isDone = n < pr.level || pr.done || (n === pr.level && pr.complete);
                dot.className = 'mandala-level-dot' + (isDone ? ' is-done' : '') + (n === pr.level && !pr.done && !pr.complete ? ' is-current' : '');
                dot.setAttribute('aria-hidden', 'true');
                levels.appendChild(dot);
            }
            levels.setAttribute('aria-label', `Мандала ${pr.level} из ${LEVEL_COUNT}`);
        }

        if (streakEl) {
            const s = Math.max(1, readNum('practice_streak_count'));
            streakEl.textContent = `🕯 Ритм: ${s} ${plural(s, 'день', 'дня', 'дней')} подряд`;
        }

        if (hint) hint.hidden = !!state.hintSeen;

        // У раскрашенной мандалы — кнопка к посланию, обоям и сторис
        if (pr.complete && !pr.done) {
            const pal = paletteEl();
            if (pal && !selectedId) {
                pal.hidden = false;
                pal.innerHTML = '';
                const b = document.createElement('button');
                b.type = 'button';
                b.className = 'mrich-finish-open';
                b.textContent = '✨ Послание мандалы';
                b.addEventListener('click', () => openFinish(pr.art));
                pal.appendChild(b);
            }
        }
    }

    // ---------- Раскраска ----------
    const paletteEl = () => document.getElementById('mandalaPalette');

    function hidePalette() {
        selectedId = 0;
        selectedPt = null;
        if (view) view.select(null);
        const pal = paletteEl();
        if (pal) { pal.hidden = true; pal.innerHTML = ''; }
    }

    function showMessage(text) {
        if (view) view.select(null);
        selectedId = 0;
        const pal = paletteEl();
        if (!pal) return;
        pal.hidden = false;
        pal.innerHTML = '';
        const p = document.createElement('p');
        p.className = 'mandala-palette-msg';
        p.textContent = text;
        pal.appendChild(p);
    }

    function onTap(region, pt) {
        const pr = getProgress();
        if (!region) { hidePalette(); renderTexts(pr); return; }
        if (pr.complete || pr.done) return;
        if (region.layer === 'decor') { showMessage('Это узор. Он засияет сам, когда Вы раскрасите соседние лепестки ✨'); return; }
        if (state.paint[region.id]) { showMessage('Эта область уже проявлена Вами 🌸'); return; }
        const isGold = region.layer === 'gold';
        if ((isGold ? pr.dropsG : pr.dropsP) <= 0) {
            showMessage(isGold
                ? 'Золотые лепестки проявляются золотыми каплями. Их дают подарки подругам и сторис.'
                : 'Капли краски дарит практика: карта дня, аудио до конца, видео до конца.');
            return;
        }

        haptic('select');
        selectedId = region.id;
        selectedPt = pt;
        view.select(region.id);

        const pal = paletteEl();
        if (!pal) return;
        pal.hidden = false;
        pal.innerHTML = '';
        const label = document.createElement('span');
        label.className = 'mandala-palette-label';
        label.textContent = `${LAYER_NAMES[region.layer] || 'Область'}: какой картиной проявить?`;
        pal.appendChild(label);
        const row = document.createElement('div');
        row.className = 'mandala-palette-row mrich-swatches';
        pr.art.variants.forEach((name, v) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'mrich-swatch';
            b.setAttribute('aria-label', `Картина «${name}»`);
            b.appendChild(view.preview(region.id, v, 168));
            const cap = document.createElement('span');
            cap.textContent = name;
            b.appendChild(cap);
            b.addEventListener('click', () => paintRegion(region.id, region.layer, v));
            row.appendChild(b);
        });
        pal.appendChild(row);
    }

    function paintRegion(id, layer, v) {
        const pr = getProgress();
        if (!view || view.isBusy() || state.paint[id] || pr.complete || pr.done || id !== selectedId) return;
        if (layer === 'gold') {
            if (pr.dropsG <= 0) return;
            state.goldSpent += 1;
        } else {
            if (pr.dropsP <= 0) return;
            state.practiceSpent += 1;
        }
        const pt = selectedPt;
        state.paint[id] = { l: layer === 'gold' ? 'gold' : 'p', c: v };
        saveState();
        haptic('light');
        const pal = paletteEl();
        if (pal) { pal.hidden = true; pal.innerHTML = ''; }
        selectedId = 0;
        selectedPt = null;

        view.reveal(id, v, pt, () => {
            const after = getProgress();
            renderChip();
            renderTexts(after);
            view.refresh();
            if (after.complete) {
                haptic('success');
                view.celebrate();
                view.setAlive(true);
                giveOnce('finished_' + ART_KEYS[after.level - 1], 'за раскрашенную мандалу');
                saveState();
                renderChip();
                setTimeout(() => openFinish(after.art), 2700);
            }
        });
    }

    // ---------- Завершение: послание, обои, сторис ----------
    function majorityVariant() {
        const n = [0, 0, 0];
        Object.keys(state.paint).forEach(id => { const c = state.paint[id].c; n[c] = (n[c] || 0) + 1; });
        return n.indexOf(Math.max(...n));
    }

    function closeOverlay() {
        const o = document.getElementById('mrichOverlay');
        if (o) o.remove();
    }

    function overlay(build) {
        closeOverlay();
        const o = document.createElement('div');
        o.id = 'mrichOverlay';
        o.className = 'mrich-overlay';
        o.setAttribute('role', 'dialog');
        o.setAttribute('aria-modal', 'true');
        const card = document.createElement('div');
        card.className = 'mrich-card';
        build(card);
        o.appendChild(card);
        o.addEventListener('click', e => { if (e.target === o) closeOverlay(); });
        document.body.appendChild(o);
    }

    function button(text, cls, onClick) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = cls;
        b.textContent = text;
        b.addEventListener('click', onClick);
        return b;
    }

    function openFinish(art) {
        overlay(card => {
            const h = document.createElement('h3');
            h.textContent = `«${art.title}» раскрашена`;
            const p = document.createElement('p');
            p.className = 'mrich-card-text';
            p.textContent = FINISH_TEXT[art.key] || '';
            card.append(h, p,
                button('Сохранить мандалу', 'mrich-btn', () => openWallpaper(art)),
                button('Любоваться', 'mrich-btn mrich-btn--ghost', closeOverlay));
        });
    }

    function openWallpaper(art) {
        if (!view) return;
        const W = 1080, H = 1920, w = document.createElement('canvas');
        w.width = W; w.height = H;
        const c = w.getContext('2d');
        const g = c.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, '#f6ecf8');
        g.addColorStop(1, '#fcece2');
        c.fillStyle = g;
        c.fillRect(0, 0, W, H);
        // мандала в мягком круге
        const snap = view.snapshot(), size = 1020, m = document.createElement('canvas');
        m.width = m.height = size;
        const mc = m.getContext('2d');
        mc.drawImage(snap, 0, 0, size, size);
        mc.globalCompositeOperation = 'destination-in';
        const rg = mc.createRadialGradient(size / 2, size / 2, size * 0.42, size / 2, size / 2, size / 2);
        rg.addColorStop(0, 'rgba(0,0,0,1)');
        rg.addColorStop(1, 'rgba(0,0,0,0)');
        mc.fillStyle = rg;
        mc.fillRect(0, 0, size, size);
        c.drawImage(m, (W - size) / 2, 520);
        c.fillStyle = '#a0742e';
        c.textAlign = 'center';
        c.font = '600 96px "Cormorant Garamond", Georgia, serif';   // 15.11: надпись крупнее (было 72 и 40)
        c.fillText(art.title, W / 2, 320);
        c.fillStyle = '#6f5f82';
        c.font = '54px "Cormorant Garamond", Georgia, serif';
        c.fillText('Моя мандала', W / 2, 410);
        let url = '';
        try { url = w.toDataURL('image/jpeg', 0.92); } catch (_) {}
        overlay(card => {
            const h = document.createElement('h3');
            h.textContent = 'Ваша мандала';
            card.appendChild(h);
            const p = document.createElement('p');
            p.className = 'mrich-card-text';
            if (url) {
                const img = document.createElement('img');
                img.className = 'mrich-wall';
                img.src = url;
                img.alt = `Мандала «${art.title}»`;
                p.textContent = 'Нажмите на картинку и удерживайте, чтобы сохранить.';
                card.append(img, p);
            } else {
                p.textContent = 'Не удалось подготовить картинку. Попробуйте ещё раз позже.';
                card.appendChild(p);
            }
            card.appendChild(button('Закрыть', 'mrich-btn mrich-btn--ghost', closeOverlay));
        });
    }

    // Подарок мандалы подруге: сервер (Notifications.gs, prepareMandalaShare) готовит сообщение с картинкой
    // мандалы и кнопкой в бота, Telegram показывает выбор чата. Золотая капля — только если Telegram подтвердил отправку.
    let giftBusy = false;
    function giftMandala(btn) {
        const tg = window.Telegram && window.Telegram.WebApp;
        if (!tg || !tg.initData || typeof tg.shareMessage !== 'function' || typeof tg.isVersionAtLeast !== 'function' || !tg.isVersionAtLeast('8.0')) {
            toast('Дарить мандалу можно в Telegram (нужна свежая версия) ✨');
            return;
        }
        const url = typeof EVENT_CONFIG !== 'undefined' ? EVENT_CONFIG.notifyScriptUrl : '';
        const art = getProgress().art || artOf(1);
        if (!url || !art || giftBusy) return;
        giftBusy = true;
        const label = btn.textContent;
        btn.disabled = true;
        btn.textContent = 'Готовим подарок… ✨';
        fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'prepareMandalaShare', initData: tg.initData, key: art.key, variant: majorityVariant() })
        })
            .then(r => r.json())
            .then(data => {
                if (data && data.status === 'success' && data.msgId) {
                    tg.shareMessage(data.msgId, sent => { if (sent) award('gift'); });
                } else {
                    toast('Не удалось подготовить подарок. Попробуйте ещё раз немного позже.');
                }
            })
            .catch(() => toast('Не удалось подготовить подарок. Проверьте интернет и попробуйте ещё раз.'))
            .finally(() => {
                giftBusy = false;
                btn.disabled = false;
                btn.textContent = label;
            });
    }

    // Сторис с картиной мандалы (15.11.2026: кнопка вернулась на экран мандалы и видна всегда).
    // Картинка — готовая images/mandala/<ключ>/story-<картина>.jpg 9:16 на GitHub Pages.
    // Вернулся из редактора сторис слишком быстро — капель нет
    function storyTooFast() {
        toast('Золотые капли — за опубликованную сторис ✨');
    }

    function shareStory(btn) {
        const tg = window.Telegram && window.Telegram.WebApp;
        if (!tg || typeof tg.shareToStory !== 'function' || typeof tg.isVersionAtLeast !== 'function' || !tg.isVersionAtLeast('7.8')) {
            toast('Поделиться в сторис можно в Telegram (нужна свежая версия) ✨');
            return;
        }
        const art = getProgress().art || artOf(1);
        if (!art) return;
        try {
            const media = new URL(`${art.base}story-${majorityVariant()}.jpg`, window.location.href).toString();
            tg.shareToStory(media, {
                text: `Моя мандала «${art.title}» 🪷 @Djamilia_Kha`,
                widget_link: { url: BOT_LINK, name: 'Раскрасить свою 🪷' }
            });
            // Telegram не сообщает, опубликована ли история: капли — после возвращения из редактора (app.js, afterStoryReturn)
            if (typeof window.afterStoryReturn === 'function') window.afterStoryReturn(() => award('story', btn), storyTooFast);
            else award('story', btn);
        } catch (_) {
            toast('Не удалось открыть редактор сторис.');
        }
    }

    // ---------- Сброс раскраски (15.11.2026, только VIP-тестеры): долгое нажатие на мандалу ----------
    function askReset() {
        haptic('success');
        const q = 'Сбросить раскраску мандалы? Все области станут чистыми, капли вернутся.';
        const tg = window.Telegram && window.Telegram.WebApp;
        if (tg && typeof tg.showConfirm === 'function' && typeof tg.isVersionAtLeast === 'function' && tg.isVersionAtLeast('6.2')) {
            try { tg.showConfirm(q, ok => { if (ok) resetPaint(); }); return; } catch (_) {}
        }
        if (window.confirm(q)) resetPaint();
    }

    function resetPaint() {
        closeOverlay();
        hidePalette();
        state.paint = {};
        state.level = 1;
        state.done = false;
        state.practiceSpent = 0;
        state.goldSpent = 0;
        Object.keys(state.flags).forEach(f => { if (f.indexOf('finished_') === 0) delete state.flags[f]; });
        state.resetAt = Date.now();
        saveState();
        if (view) view.setAlive(false);
        renderChip();
        renderPath();
        toast('Раскраска сброшена ✨');
    }

    // ---------- Кнопки экрана ----------
    function bindUi() {
        const tabs = document.querySelectorAll('.mandala-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const which = tab.getAttribute('data-mtab');
                tabs.forEach(t => {
                    const on = t === tab;
                    t.classList.toggle('is-active', on);
                    t.setAttribute('aria-selected', on ? 'true' : 'false');
                });
                const mine = document.getElementById('mandalaPaneMine');
                const shared = document.getElementById('mandalaPaneShared');
                if (mine) mine.hidden = which !== 'mine';
                if (shared) shared.hidden = which !== 'shared';
            });
        });


        const hintClose = document.getElementById('mandalaHintClose');
        if (hintClose) hintClose.addEventListener('click', () => {
            state.hintSeen = true;
            saveState();
            const hint = document.getElementById('mandalaHint');
            if (hint) hint.hidden = true;
        });

        const giftBtn = document.getElementById('mandalaGiftBtn');
        if (giftBtn) giftBtn.addEventListener('click', () => {
            haptic('select');
            giftMandala(giftBtn);
        });

        const storyBtn = document.getElementById('mandalaStoryBtn');
        if (storyBtn) storyBtn.addEventListener('click', () => {
            haptic('select');
            shareStory(storyBtn);
        });

        const colLink = document.getElementById('mandalaCollectionLink');
        if (colLink) colLink.addEventListener('click', () => {
            const legacy = document.getElementById('pathCollectionCard');
            if (legacy) legacy.click();
        });
    }

    // Запуск после app.js (его обработчик DOMContentLoaded зарегистрирован раньше): там объявлен window.isUserVIP.
    // Пока VIP_ONLY, у остальных мандала не включается вовсе: app.js работает как без неё.
    function isVip() {
        return typeof window.isUserVIP === 'function' && !!window.isUserVIP();
    }

    function start() {
        const vip = isVip();
        if (VIP_ONLY && !vip) return;
        document.documentElement.classList.add('mandala-vip');
        window.Mandala = { award, renderPath, renderChip, getProgress, storyTooFast };
        init();
        if (vip) {
            // Тест: капли пополняются до VIP_DROPS, плашка на главной видна сразу
            state.practiceAll = Math.max(state.practiceAll, state.practiceSpent + VIP_DROPS);
            state.goldAll = Math.max(state.goldAll, state.goldSpent + VIP_DROPS);
            state.active = true;
            saveState(true);
            renderChip();
        }
    }

    if (document.readyState === 'complete') {
        start();
    } else {
        document.addEventListener('DOMContentLoaded', start);
    }
})();
