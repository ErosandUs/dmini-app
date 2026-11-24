// --- ЛИЧНАЯ МАНДАЛА-РАСКРАСКА (этап 2, 14.11.2026; экономика 24.11.2026) ---
// Практика даёт серебряные талисманы: карта (+1), аудио до конца (+1), видео до конца (+1), полный цикл дня (+1).
// Задание мандалы «Поделиться светом» (5 шагов на мандалу): +3 серебряных за шаг и +6 за завершение 5/5.
// 3 серебряных талисмана можно превратить в 1 золотой; «Подарки от Джамили» дают редкие золотые талисманы.
// Хранение: localStorage + Telegram CloudStorage + серверный учёт в Google Apps Script (Economy.js).
(function () {
    'use strict';

    const STATE_KEY = 'mandala_state_v1';
    const CLOUD_KEY = 'mandala_state_v1';
    const VIP_ONLY = true;                              // 24.11.2026: экран мандал открывается только VIP; остальным — медальон и «в разработке»
    const STATE_V = 3;                                  // 3 — живописные мандалы (области другие, раскраска с нуля)
    const ART_KEYS = ['p1', 'p2', 'p3', 'p4', 'p5'];    // мандала 1..5 → данные window.MANDALA_RICH[ключ]
    const LEVEL_COUNT = ART_KEYS.length;
    const BOT_LINK = 'https://t.me/Djamiliakha_bot?start=go';
    const CONVERT_RATE = 3;                             // 3 серебряных -> 1 золотой
    const QUEST_TARGET = 5;                             // шагов задания на каждую мандалу
    const QUEST_STEP_SILVER = 3;                        // +3 серебряных за шаг задания
    const QUEST_BONUS_SILVER = 6;                       // +6 серебряных бонус при закрытии 5/5
    const TEST_PACK_SILVER = 30;
    const TEST_PACK_GOLD = 10;
    const LAYER_NAMES = { center: 'Сердце', petals: 'Лепестки', leaves: 'Листья', outer: 'Внешние лепестки', gold: 'Золотые лепестки' };
    // Послание Джамили при завершении мандалы (черновики — на утверждении у Валентина)
    const FINISH_TEXT = {
        p1: '✨✨✨\nВаш лотос раскрылся.\n\n' +
            'Каждый талисман на этом пути - день, когда вы выбирали себя: карту, тишину, свой внутренний голос. ' +
            'А золотые лепестки - свет, которым вы поделились с подругами.\n\n' +
            'Так растёт наш внутренний сад: шаг за шагом, с любовью.\n\n' +
            'Я РАСКРЫВАЮСЬ, КАК ЛОТОС НА РАССВЕТЕ.\n\nДжамиля Ха',
        // 19.11.2026: черновик, ждёт утверждения Валентина (sessions/2026-11-14_mandala-rich-integration/texts-djamilia.md)
        p2: '🌝🌝🌝\nВаша Хранительница проснулась.\n\n' +
            'Она держит у сердца Цветок жизни - так и мы храним в себе то, что по-настоящему ценно. ' +
            'Луна над ней и полумесяц под ней напоминают: всё живое растёт по своим циклам, шаг за шагом.\n\n' +
            'Каждый талисман здесь - ваш день, ваш выбор, ваше присутствие. А золотой свет вы собрали, делясь им с подругами.\n\n' +
            'Разве это не красиво - видеть, как ваш свет складывается в целый образ?\n\n' +
            'Я ХРАНЮ СВЕТ В СВОЁМ СЕРДЦЕ.\n\nДжамиля Ха'
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
            practiceAll: 0,     // заработано серебряных талисманов за всё время
            goldAll: 0,         // заработано золотых талисманов за всё время
            boughtP: 0,         // куплено серебряных талисманов (авторитет — сервер)
            boughtG: 0,         // куплено золотых талисманов (авторитет — сервер)
            practiceSpent: 0,   // потрачено серебряных (раскраска + конвертация)
            goldSpent: 0,       // потрачено золотых на раскраску
            level: 1,           // текущая мандала 1..5 (дальше — когда готова её картина)
            done: false,        // все пять раскрашены
            paint: {},          // раскраска текущей мандалы: { номер области: { l: 'gold' | 'p', c: картина 0..2 } }
            flags: {},          // одноразовые поводы: welcome, migrated, finished_p1, day30, moon_YYYY-MM-DD …
            quests: {},         // задания по уровням: { '1': { shares: 0..5, done: false } }
            cycle: { key: '', card: false, audio: false, video: false, fullBonus: false },
            storyDay: '',
            firstSeen: 0,
            lastVisit: 0,
            hintSeen: false,
            resetAt: 0,         // 15.11.2026: время сброса раскраски тестером (при слиянии с облаком побеждает более поздний)
            active: false       // было ли хоть одно действие
        };
    }

    function normalizeQuests(rawQuests) {
        const out = {};
        if (!rawQuests || typeof rawQuests !== 'object') return out;
        Object.keys(rawQuests).forEach(k => {
            const q = rawQuests[k];
            if (!q || typeof q !== 'object') return;
            const shares = Math.max(0, Math.min(QUEST_TARGET, parseInt(q.shares, 10) || 0));
            out[k] = { shares, done: !!q.done || shares >= QUEST_TARGET };
        });
        return out;
    }

    function loadState() {
        try {
            const raw = JSON.parse(localStorage.getItem(STATE_KEY) || 'null');
            if (raw && typeof raw === 'object') {
                const s = Object.assign(emptyState(), raw);
                s.cycle = Object.assign({ key: '', card: false, audio: false, video: false, fullBonus: false }, raw.cycle || {});
                s.quests = normalizeQuests(raw.quests);
                s.boughtP = Math.max(0, parseInt(s.boughtP, 10) || 0);
                s.boughtG = Math.max(0, parseInt(s.boughtG, 10) || 0);
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
                ['practiceAll', 'goldAll', 'boughtP', 'boughtG'].forEach(k => {
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
                        state.quests = normalizeQuests(remote.quests);
                    }
                } else {
                    ['practiceSpent', 'goldSpent'].forEach(k => {
                        state[k] = Math.max(state[k] || 0, remote[k] || 0);
                    });
                    const rq = normalizeQuests(remote.quests);
                    Object.keys(rq).forEach(k => {
                        const lq = state.quests[k] || { shares: 0, done: false };
                        const shares = Math.max(lq.shares || 0, rq[k].shares || 0);
                        state.quests[k] = { shares, done: !!(lq.done || rq[k].done || shares >= QUEST_TARGET) };
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

    // ---------- Серверная синхронизация (Google Apps Script / Economy.js) ----------
    function buildEconomySnapshot() {
        return {
            v: state.v,
            practiceAll: state.practiceAll || 0,
            goldAll: state.goldAll || 0,
            boughtP: state.boughtP || 0,
            boughtG: state.boughtG || 0,
            practiceSpent: state.practiceSpent || 0,
            goldSpent: state.goldSpent || 0,
            level: state.level || 1,
            done: !!state.done,
            paint: state.paint || {},
            flags: state.flags || {},
            quests: state.quests || {},
            storyDay: state.storyDay || '',
            firstSeen: state.firstSeen || 0,
            resetAt: state.resetAt || 0
        };
    }

    function applyServerState(srv) {
        if (!srv || typeof srv !== 'object') return;
        const before = JSON.stringify(state);
        if (typeof srv.boughtP === 'number') state.boughtP = Math.max(0, srv.boughtP);
        if (typeof srv.boughtG === 'number') state.boughtG = Math.max(0, srv.boughtG);

        const sReset = Number(srv.resetAt) || 0;
        const lReset = Number(state.resetAt) || 0;
        if (sReset > lReset) {
            state.resetAt = sReset;
            state.level = srv.level || 1;
            state.done = !!srv.done;
            state.paint = srv.paint || {};
            state.practiceSpent = srv.practiceSpent || 0;
            state.goldSpent = srv.goldSpent || 0;
            state.quests = normalizeQuests(srv.quests);
            state.practiceAll = Math.max(0, Number(srv.practiceAll) || 0);
            state.goldAll = Math.max(0, Number(srv.goldAll) || 0);
        } else if (sReset === lReset) {
            if (typeof srv.practiceAll === 'number') state.practiceAll = Math.max(state.practiceAll, srv.practiceAll);
            if (typeof srv.goldAll === 'number') state.goldAll = Math.max(state.goldAll, srv.goldAll);
            if (typeof srv.practiceSpent === 'number') state.practiceSpent = Math.max(state.practiceSpent, srv.practiceSpent);
            if (typeof srv.goldSpent === 'number') state.goldSpent = Math.max(state.goldSpent, srv.goldSpent);
            if ((srv.level || 1) > state.level || (srv.done && !state.done)) {
                state.level = srv.level || 1;
                state.done = !!srv.done;
                state.paint = srv.paint || {};
            } else if ((srv.level || 1) === state.level && srv.paint && typeof srv.paint === 'object') {
                state.paint = Object.assign({}, srv.paint, state.paint);
            }
            const sq = normalizeQuests(srv.quests);
            Object.keys(sq).forEach(k => {
                const lq = state.quests[k] || { shares: 0, done: false };
                const shares = Math.max(lq.shares || 0, sq[k].shares || 0);
                state.quests[k] = { shares, done: !!(lq.done || sq[k].done || shares >= QUEST_TARGET) };
            });
            if (srv.flags && typeof srv.flags === 'object') {
                state.flags = Object.assign({}, srv.flags, state.flags);
            }
        }
        if (JSON.stringify(state) !== before) {
            saveState(true);
            renderChip();
            syncHud();
            if (isPathOpen()) renderPath();
        }
    }

    function callEconomyApi(payload) {
        const tg = window.Telegram && window.Telegram.WebApp;
        const url = typeof EVENT_CONFIG !== 'undefined' ? EVENT_CONFIG.notifyScriptUrl : '';
        if (!url || !tg || !tg.initData) return Promise.resolve(null);
        return fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(Object.assign({}, payload, { initData: tg.initData }))
        })
            .then(r => r.json())
            .then(data => {
                if (data && data.status === 'success' && data.state) {
                    applyServerState(data.state);
                }
                return data;
            })
            .catch(() => null);
    }

    function syncEconomy() {
        return callEconomyApi({ action: 'economySync', state: buildEconomySnapshot() });
    }

    function sendEconomyEvent(evt) {
        return callEconomyApi({
            action: 'economyEvent',
            event: evt,
            state: buildEconomySnapshot()
        });
    }

    // ---------- Прогресс ----------
    function ensureQuest(level) {
        const k = String(level || state.level || 1);
        if (!state.quests || typeof state.quests !== 'object') state.quests = {};
        if (!state.quests[k] || typeof state.quests[k] !== 'object') {
            state.quests[k] = { shares: 0, done: false };
        }
        const q = state.quests[k];
        q.shares = Math.max(0, Math.min(QUEST_TARGET, parseInt(q.shares, 10) || 0));
        q.done = !!q.done || q.shares >= QUEST_TARGET;
        return q;
    }

    function questOf(level) {
        const k = String(level || state.level || 1);
        const q = (state.quests && state.quests[k]) || { shares: 0, done: false };
        const shares = Math.max(0, Math.min(QUEST_TARGET, parseInt(q.shares, 10) || 0));
        return { shares, target: QUEST_TARGET, done: !!q.done || shares >= QUEST_TARGET };
    }

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
            dropsP: Math.max(0, (state.practiceAll || 0) + (state.boughtP || 0) - (state.practiceSpent || 0)),
            dropsG: Math.max(0, (state.goldAll || 0) + (state.boughtG || 0) - (state.goldSpent || 0)),
            quest: questOf(level),
            done: !!state.done
        };
    }

    // Раскрашенная мандала остаётся «живой», пока не готова картина следующей; потом открывается следующая
    // 19.11.2026: следующая мандала открывается не сама, а кнопкой «✨ Открыть следующую мандалу» (byUser),
    // чтобы раскрашенная оставалась живой с посланием, пока человек не решит перейти
    // 24.11.2026: фикс бага двойного золота — золотой талисман выдаётся только при завершении мандалы в paintRegion()
    function maybeAdvance(byUser) {
        const pr = getProgress();
        if (!pr.complete || state.done) return false;
        if (state.level >= LEVEL_COUNT) {
            state.done = true;
            saveState();
            return true;
        }
        if (!byUser || !artOf(state.level + 1)) return false;
        const finished = state.level;
        state.level = finished + 1;
        state.paint = {};
        ensureQuest(state.level);
        saveState();
        sendEconomyEvent({ type: 'advance', level: state.level });
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
    const talismanWord = n => plural(n, 'талисман', 'талисмана', 'талисманов');
    const silverWord = n => plural(n, 'серебряный талисман', 'серебряных талисмана', 'серебряных талисманов');
    const petalsWord = n => plural(n, 'лепесток', 'лепестка', 'лепестков');
    const goldWord = n => plural(n, 'золотой талисман', 'золотых талисмана', 'золотых талисманов');

    function talismanSvg(gold, size) {
        const s = size || 18;
        return '<svg class="talisman-ico ' + (gold ? 'talisman-ico--gold' : 'talisman-ico--silver') +
            '" width="' + s + '" height="' + s + '" viewBox="0 0 80 80" aria-hidden="true">' +
            '<use href="#' + (gold ? 'talisman-gold' : 'talisman-silver') + '"></use></svg>';
    }

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
        if (!isVip() || !state.active) return; // пока раздел закрыт для не-VIP или человек не начал путь, тихо копим
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
        toast(`🎁 Подарок от Джамили: золотой талисман ${reason}`);
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

    function isPremium() {
        return typeof window.isTelegramPremium === 'function' && !!window.isTelegramPremium();
    }

    function award(kind, origin) {
        let flying = false;
        const key = cycleKey();
        if (state.cycle.key !== key) state.cycle = { key, card: false, audio: false, video: false, fullBonus: false };

        if (kind === 'card' || kind === 'audio' || kind === 'video') {
            if (state.cycle[kind]) return;
            state.cycle[kind] = true;
            state.active = true;
            state.practiceAll += 1;
            let gotFullBonus = false;
            if (state.cycle.card && state.cycle.audio && state.cycle.video && !state.cycle.fullBonus) {
                state.cycle.fullBonus = true;
                state.practiceAll += 1;
                gotFullBonus = true;
            }
            const msg = kind === 'card' ? 'карта дня' : (kind === 'audio' ? 'аудиопослание' : 'видеопослание');
            // «+1» с серебряным талисманом всплывает над картой, аудио или видео и улетает в счётчик
            flying = flyDrop(origin, kind === 'card' ? 2600 : 0);
            if (!flying) {
                const text = gotFullBonus
                    ? '🌙 +2 серебряных талисмана (полный день практики ✨)'
                    : `🌙 +1 серебряный талисман (${msg}). Раскрасьте лепесток в «Твой путь»`;
                if (kind === 'card') setTimeout(() => toast(text), 2600); else toast(text);
            } else if (gotFullBonus) {
                setTimeout(() => toast('✨ +1 серебряный талисман бонусом за весь цикл дня'), 1400);
            }

            let bonusFlags = [];
            if (kind === 'card') {
                const streak = readNum('practice_streak_count');
                if (streak >= 7 && streak % 7 === 0) {
                    const f = 'streak7_' + dayKey();
                    if (giveOnce(f, `за ${streak} дней практики подряд`)) bonusFlags.push(f);
                }
                if (state.firstSeen && Date.now() - state.firstSeen >= 30 * 86400000) {
                    if (giveOnce('day30', 'за 30 дней с нами')) bonusFlags.push('day30');
                }
            }
            saveState();
            sendEconomyEvent({
                type: 'practice',
                kind,
                cycleKey: key,
                fullBonus: gotFullBonus,
                bonusFlags
            });
        } else if (kind === 'gift' || kind === 'story') {
            if (kind === 'story' && !isPremium()) return;
            if (window.MandalaShared) window.MandalaShared.onShare();
            state.active = true;
            const today = dayKey();
            if (kind === 'story' && state.storyDay === today) {
                toast('Спасибо, что поделились ✨ Серебряные талисманы за сторис сегодня уже получены');
                saveState();
                return;
            }
            if (kind === 'story') state.storyDay = today;

            const q = ensureQuest(state.level);
            if (q.shares < QUEST_TARGET) {
                q.shares += 1;
                let delta = QUEST_STEP_SILVER;
                let completedNow = false;
                if (q.shares >= QUEST_TARGET) {
                    q.done = true;
                    completedNow = true;
                    delta += QUEST_BONUS_SILVER;
                }
                state.practiceAll += delta;
                flying = flyDrop(origin, 0, { count: '+' + delta });
                if (completedNow) {
                    toast(`✨ Задание мандалы выполнено (${QUEST_TARGET}/${QUEST_TARGET}): +${delta} серебряных талисманов!`);
                } else {
                    const via = kind === 'story' ? '✨ Сторис' : '💌 Подарок подруге';
                    toast(`${via}: +${delta} серебряных талисмана (${q.shares}/${QUEST_TARGET})`);
                }
                saveState();
                sendEconomyEvent({
                    type: kind,
                    level: state.level,
                    shares: q.shares,
                    questDone: q.done,
                    deltaSilver: delta,
                    storyDay: state.storyDay
                });
            } else {
                toast(kind === 'story'
                    ? 'Спасибо, что поделились ✨ Задание этой мандалы уже выполнено'
                    : '💌 Подарок отправлен от души! Задание этой мандалы уже выполнено ✨');
                saveState();
            }
        } else {
            return;
        }
        if (!flying) { renderChip(); syncHud(); }   // при перелёте счётчик обновится, когда талисман долетит
        if (isPathOpen()) renderPath();
    }

    function convertSilverToGold(btn) {
        const pr = getProgress();
        if (pr.dropsP < CONVERT_RATE) return;
        haptic('select');
        state.practiceSpent += CONVERT_RATE;
        state.goldAll += 1;
        state.active = true;
        saveState();
        const flying = flyDrop(btn, 0, { count: '+1', gold: true });
        toast('✨ 3 серебряных талисмана превратились в 1 золотой');
        if (!flying) { renderChip(); syncHud(); }
        if (isPathOpen()) renderPath();
        sendEconomyEvent({ type: 'convert', costSilver: CONVERT_RATE, gainGold: 1 });
    }

    // ---------- Счётчик талисманов и перелёт «+1» ----------
    // На главном счётчик и точка входа — кнопка-медальон (#mandalaCrownBtn). На экранах аудио и видео
    // (и когда медальона не видно) сверху по центру показывается такой же счётчик .drop-hud.
    let hud = null, hudSilver = null, hudGold = null, hudPending = 0;

    function chipVisible() {
        const crown = document.getElementById('mandalaCrownBtn');
        if (crown && crown.offsetParent !== null) return true;
        const chip = document.getElementById('giftCounterChip');
        return !!(chip && chip.offsetParent !== null && !chip.classList.contains('is-mandala-hidden'));
    }

    function syncHud() {
        if (!hud || !isVip()) return;
        const daily = document.getElementById('daily');
        const show = state.active && daily && daily.classList.contains('active') && !chipVisible();
        hud.classList.toggle('is-on', !!show);
        const pr = getProgress();
        if (hudSilver) hudSilver.textContent = String(pr.dropsP);
        if (hudGold) hudGold.textContent = String(pr.dropsG);
    }

    function setupHud() {
        if (hud || !isVip()) return;
        hud = document.createElement('div');
        hud.className = 'drop-hud';
        hud.setAttribute('aria-hidden', 'true');
        hud.innerHTML =
            '<span class="drop-hud-item">' + talismanSvg(false, 18) + '<span class="drop-hud-num drop-hud-silver">0</span></span>' +
            '<span class="drop-hud-sep" aria-hidden="true">·</span>' +
            '<span class="drop-hud-item">' + talismanSvg(true, 18) + '<span class="drop-hud-num drop-hud-gold">0</span></span>';
        hudSilver = hud.querySelector('.drop-hud-silver');
        hudGold = hud.querySelector('.drop-hud-gold');
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
    // opt: count/text — надпись («+3», «+9»), gold — золотой вариант
    function flyDrop(origin, delay, opt) {
        if (!isVip()) return false;
        opt = opt || {};
        let reduce = false;
        try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (_) {}
        if (reduce || !document.body || typeof document.body.animate !== 'function') return false;
        setTimeout(() => {
            let target = null;
            const crown = document.getElementById('mandalaCrownBtn');
            if (isPathOpen()) {
                target = document.querySelector(opt.gold ? '.mandala-talisman-pill--gold' : '.mandala-talisman-pill--silver')
                    || document.getElementById('mandalaSubcaption');
            } else if (crown && crown.offsetParent !== null) {
                target = crown;
            } else if (chipVisible()) {
                target = document.getElementById('giftCounterChip');
            } else if (hud) {
                hud.classList.add('is-on');
                target = hud;
            }
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
            const label = opt.count || opt.text || '+1';
            el.innerHTML = '<span>' + label + '</span>' + talismanSvg(!!opt.gold, opt.gold ? 28 : 22);
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
        ensureQuest(state.level);
        maybeAdvance();
        saveState(true);
        renderChip();
        bindUi();
        setupHud();
        pullCloud();
        setTimeout(syncEconomy, 1200);
    }

    // ---------- Кнопка-медальон на главной (вместо Луны и старой боковой плашки) ----------
    function thumbFallbackArt(level) {
        for (let l = level; l >= 1; l--) {
            const a = artOf(l);
            if (a) return a;
        }
        return artOf(1);
    }

    function renderChip() {
        const chip = document.getElementById('giftCounterChip');
        if (chip) {
            chip.classList.add('is-mandala-hidden');
            chip.classList.remove('has-drops');
        }
        const btn = document.getElementById('mandalaCrownBtn');
        const pill = document.getElementById('mandalaCrownPill');
        const canvas = document.getElementById('mandalaCrownCanvas');
        const vip = isVip();
        const pr = getProgress();
        const waiting = pr.dropsP + pr.dropsG;
        const canPaintNow = vip && !(pr.done || pr.complete || pr.soon) && waiting > 0;
        const filled = pr.paintedP + pr.paintedG;

        if (pill) {
            if (!vip) pill.textContent = 'Раскрасить';
            else if (canPaintNow) pill.textContent = `Раскрасить · ${waiting}`;
            else if (pr.done) pill.textContent = 'Моя мандала ✨';
            else pill.textContent = 'Моя мандала';
        }
        if (btn) {
            btn.classList.toggle('has-drops', canPaintNow);
            if (!vip) {
                btn.setAttribute('aria-label', 'Моя мандала. Раскраска скоро откроется');
            } else if (canPaintNow) {
                btn.setAttribute('aria-label', `${waiting} ${talismanWord(waiting)}. Раскрасить мандалу`);
            } else {
                btn.setAttribute('aria-label', `Моя мандала: раскрашено ${filled} ${petalsWord(filled)}. Открыть «Твой путь»`);
            }
        }
        if (canvas && window.MandalaCanvas && window.MandalaCanvas.renderThumb) {
            const art = vip ? (pr.art || thumbFallbackArt(pr.level)) : artOf(1);
            if (art) {
                const paint = vip && pr.art ? state.paint : {};
                const key = art.key + ':' + (vip && pr.art ? JSON.stringify(paint) : 'empty');
                if (canvas._thumbKey !== key) {
                    canvas._thumbKey = key;
                    window.MandalaCanvas.renderThumb(canvas, art, paint).catch(() => {
                        if (canvas._thumbKey === key) canvas._thumbKey = '';
                    });
                }
            }
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
    let highlightUnpainted = false;

    function updateZoomUi(scale, min, max) {
        const s = typeof scale === 'number' ? scale : 1;
        const lo = typeof min === 'number' ? min : 1;
        const hi = typeof max === 'number' ? max : 3.5;
        const isBase = s <= lo + 0.01;
        const outBtn = document.getElementById('mandalaZoomOutBtn');
        const resetBtn = document.getElementById('mandalaZoomResetBtn');
        const inBtn = document.getElementById('mandalaZoomInBtn');
        if (outBtn) outBtn.disabled = isBase;
        if (resetBtn) {
            resetBtn.disabled = isBase;
            resetBtn.textContent = isBase ? '1×' : s.toFixed(1).replace(/\.0$/, '') + '×';
        }
        if (inBtn) inBtn.disabled = s >= hi - 0.01;
    }

    function syncToolsUi(pr) {
        const tools = document.getElementById('mandalaTools');
        const hlBtn = document.getElementById('mandalaHighlightBtn');
        const hasArt = !!(pr && !pr.soon && window.MandalaCanvas);
        if (tools) tools.hidden = !hasArt;
        const showHl = hasArt && !pr.complete && !pr.done;
        if (!showHl && highlightUnpainted) {
            highlightUnpainted = false;
            if (view && view.setHighlightUnpainted) view.setHighlightUnpainted(false);
        }
        if (hlBtn) {
            hlBtn.hidden = !showHl;
            hlBtn.classList.toggle('is-active', highlightUnpainted);
            hlBtn.setAttribute('aria-pressed', highlightUnpainted ? 'true' : 'false');
        }
        if (view && view.getZoom) updateZoomUi(view.getZoom(), 1, 3.5);
        else updateZoomUi(1, 1, 3.5);
    }

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
        if (!view || viewLevel !== pr.level) {
            hidePalette();
            highlightUnpainted = false;
        }
        renderTexts(pr);
        if (pr.soon || !window.MandalaCanvas) {
            if (view) { view.destroy(); view = null; viewLevel = 0; }
            box.classList.remove('mrich', 'is-alive', 'mrich--nospin');
            box.innerHTML = '<div class="mrich-soon"><p class="mrich-soon-title">Следующая мандала готовится</p>' +
                '<p class="mrich-soon-text">Талисманы копятся и дождутся её.</p></div>';
            syncToolsUi(pr);
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
                onLongPress: isVip() ? askReset : null,
                onZoomChange: updateZoomUi
            });
            view.ready.catch(() => {
                box.innerHTML = '<p class="mandala-error">Не удалось загрузить мандалу. Проверьте интернет и откройте экран снова.</p>';
                view = null;
                viewLevel = 0;
                syncToolsUi({ soon: true });
            });
        } else {
            view.refresh();
        }
        if (view) view.setAlive(pr.complete);
        syncToolsUi(pr);
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

        const silverCountEl = document.getElementById('mandalaSilverCount');
        const goldCountEl = document.getElementById('mandalaGoldCount');
        if (silverCountEl) silverCountEl.textContent = String(pr.dropsP);
        if (goldCountEl) goldCountEl.textContent = String(pr.dropsG);

        const convertBtn = document.getElementById('mandalaConvertBtn');
        if (convertBtn) {
            convertBtn.hidden = !!(pr.done || pr.soon);
            convertBtn.disabled = pr.dropsP < CONVERT_RATE;
        }

        const questCard = document.getElementById('mandalaQuestCard');
        const questProgress = document.getElementById('mandalaQuestProgress');
        const questFill = document.getElementById('mandalaQuestFill');
        const questDesc = document.getElementById('mandalaQuestDesc');
        if (questCard && pr.quest) {
            questCard.hidden = !!(pr.done || pr.soon);
            questCard.classList.toggle('is-done', pr.quest.done);
            if (questProgress) {
                questProgress.textContent = pr.quest.done
                    ? `${pr.quest.target} / ${pr.quest.target} ✨`
                    : `${pr.quest.shares} / ${pr.quest.target}`;
            }
            if (questFill) {
                questFill.style.width = Math.round((pr.quest.shares / pr.quest.target) * 100) + '%';
            }
            if (questDesc) {
                if (pr.quest.done) {
                    questDesc.textContent = 'Задание этой мандалы выполнено! Новое откроется на следующей мандале.';
                } else if (isPremium()) {
                    questDesc.textContent = 'Подарите карту/мандалу подруге или выложите сторис: +3 🌙 за шаг и +6 🌙 за 5/5.';
                } else {
                    questDesc.textContent = 'Подарите карту или мандалу подруге: +3 🌙 за шаг и +6 🌙 за 5/5.';
                }
            }
        }

        const storyBtn = document.getElementById('mandalaStoryBtn');
        if (storyBtn) storyBtn.hidden = !isPremium();

        const buyBtn = document.getElementById('mandalaBuyBtn');
        if (buyBtn) buyBtn.hidden = !!(pr.done || pr.soon);

        if (sub) {
            const parts = [];
            if (pr.done) {
                parts.push('Спасибо, что несёте свет. Продолжайте практику и дарите карты подругам.');
            } else if (pr.complete && artOf(pr.level + 1)) {
                parts.push(`Ваша следующая мандала «${artOf(pr.level + 1).title}» уже ждёт.`);
                if (allDrops > 0) parts.push(`${allDrops} ${talismanWord(allDrops)} готовы для неё.`);
            } else if (pr.soon || pr.complete) {
                parts.push('Следующая мандала готовится.');
                if (allDrops > 0) parts.push(`${allDrops} ${talismanWord(allDrops)} дождутся её.`);
                else parts.push('Талисманы за практику и подарки будут копиться для неё.');
            } else {
                const canP = leftP > 0 ? Math.min(pr.dropsP, leftP) : 0;
                const canG = Math.min(pr.dropsG, leftG);
                if (canP + canG > 0) {
                    const have = [];
                    if (pr.dropsP > 0) have.push(`${pr.dropsP} ${silverWord(pr.dropsP)}`);
                    if (pr.dropsG > 0) have.push(`${pr.dropsG} ${goldWord(pr.dropsG)}`);
                    parts.push(`У Вас ${have.join(' и ')}. Нажмите на мерцающую область и выберите картину.`);
                } else if (leftP > 0) {
                    parts.push(`Практика приносит до 4 🌙 за день, а задание мандалы — ещё 21 🌙. Осталось ${leftP} ${plural(leftP, 'область', 'области', 'областей')}.`);
                }
                if (leftP === 0 && leftG > 0) {
                    const gf = pr.art.goldForms || ['золотой лепесток', 'золотых лепестка', 'золотых лепестков'];
                    parts.push(`Почти готово! Осталось ${leftG} ${plural(leftG, gf[0], gf[1], gf[2])}: превратите 3 🌙 → 1 ☀️ или выберите набор красок.`);
                    if (pr.dropsP > 0 && pr.dropsP < CONVERT_RATE) parts.push(`${pr.dropsP} ${silverWord(pr.dropsP)} уже в копилке.`);
                } else if (leftG > 0 && pr.dropsG === 0) {
                    parts.push(pr.dropsP >= CONVERT_RATE
                        ? 'Золотые лепестки проявляются золотыми талисманами — можно превратить 3 серебряных в 1 золотой.'
                        : 'Золотые лепестки проявляются золотыми талисманами (обмен 3 🌙 → 1 ☀️ или подарки Джамили).');
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
                if (artOf(pr.level + 1)) {
                    const n = document.createElement('button');
                    n.type = 'button';
                    n.className = 'mrich-finish-open mrich-next-open';
                    n.textContent = '✨ Открыть следующую мандалу';
                    n.addEventListener('click', openNext);
                    pal.appendChild(n);
                }
            }
        }
    }

    function openNext() {
        haptic('success');
        closeOverlay();
        if (maybeAdvance(true)) {
            renderChip();
            renderPath();
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
                ? 'Золотые лепестки проявляются золотыми талисманами: их можно получить превратив 3 серебряных в 1 золотой или в подарок от Джамили.'
                : 'Серебряные талисманы дарит практика (до 4 за день) и задание «Поделиться светом».');
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
        label.textContent = `${region.name || LAYER_NAMES[region.layer] || 'Область'}: какой картиной проявить?`;
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
        const paintedLayer = layer === 'gold' ? 'gold' : 'p';
        state.paint[id] = { l: paintedLayer, c: v };
        saveState();
        haptic('light');
        const pal = paletteEl();
        if (pal) { pal.hidden = true; pal.innerHTML = ''; }
        selectedId = 0;
        selectedPt = null;
        sendEconomyEvent({ type: 'paint', level: state.level, regionId: id, layer: paintedLayer, variant: v });

        view.reveal(id, v, pt, () => {
            const after = getProgress();
            renderChip();
            renderTexts(after);
            view.refresh();
            if (after.complete) {
                haptic('success');
                highlightUnpainted = false;
                view.setHighlightUnpainted(false);
                view.resetZoom();
                view.celebrate();
                view.setAlive(true);
                syncToolsUi(after);
                const finishFlag = 'finished_' + ART_KEYS[after.level - 1];
                const gotFinishGift = giveOnce(finishFlag, 'за раскрашенную мандалу');
                const nextArt = artOf(after.level + 1);
                if (nextArt) toast(`Открыта новая мандала: «${nextArt.title}» 🪷`);
                saveState();
                renderChip();
                renderTexts(getProgress());
                if (gotFinishGift) {
                    sendEconomyEvent({ type: 'djamilia_gift', flag: finishFlag });
                }
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
                    tg.shareMessage(data.msgId, sent => { if (sent) award('gift', btn); });
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

    // Сторис с картиной мандалы (только для Telegram Premium).
    // Картинка — готовая images/mandala/<ключ>/story-<картина>.jpg 9:16 на GitHub Pages.
    // Вернулся из редактора сторис слишком быстро — награды нет
    function storyTooFast() {
        toast('Талисманы начисляются только за опубликованную сторис ✨');
    }

    function shareStory(btn) {
        if (!isPremium()) return;
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
            // Telegram не сообщает, опубликована ли история: награда — после возвращения из редактора (app.js, afterStoryReturn)
            if (typeof window.afterStoryReturn === 'function') window.afterStoryReturn(() => award('story', btn), storyTooFast);
            else award('story', btn);
        } catch (_) {
            toast('Не удалось открыть редактор сторис.');
        }
    }

    // ---------- Покупка набора красок для текущей мандалы (превью до подключения СБП) ----------
    function openPackModal() {
        haptic('select');
        const pr = getProgress();
        const art = pr.art || artOf(1);
        if (!art) return;
        const caps = capsOf(art);
        const pricesMap = (typeof EVENT_CONFIG !== 'undefined' && EVENT_CONFIG.mandalaPrices) ? EVENT_CONFIG.mandalaPrices : {};
        const price = pricesMap[art.key] || pricesMap.default || { fullRub: 490, goldRub: 240 };

        overlay(card => {
            const h = document.createElement('h3');
            h.textContent = `Набор для «${art.title}»`;

            const list = document.createElement('div');
            list.className = 'mandala-pack-list';

            const fullItem = document.createElement('div');
            fullItem.className = 'mandala-pack-item';
            fullItem.innerHTML =
                '<div class="mandala-pack-top">' +
                    '<span class="mandala-pack-name">Закрасить мандалу целиком</span>' +
                    `<span class="mandala-pack-price">${price.fullRub} ₽</span>` +
                '</div>' +
                '<div class="mandala-pack-items">' +
                    `<strong>${caps.practice}</strong>` + talismanSvg(false, 16) +
                    '<span>+</span>' +
                    `<strong>${caps.gold}</strong>` + talismanSvg(true, 16) +
                '</div>';

            const goldItem = document.createElement('div');
            goldItem.className = 'mandala-pack-item';
            goldItem.innerHTML =
                '<div class="mandala-pack-top">' +
                    '<span class="mandala-pack-name">Только золотые солнца</span>' +
                    `<span class="mandala-pack-price">${price.goldRub} ₽</span>` +
                '</div>' +
                '<div class="mandala-pack-items">' +
                    `<strong>${caps.gold}</strong>` + talismanSvg(true, 16) +
                '</div>';

            list.append(fullItem, goldItem);

            const note = document.createElement('p');
            note.className = 'mandala-pack-note';
            note.textContent = 'Если часть мандалы уже раскрашена, неизрасходованные талисманы сохранятся для следующей мандалы.';

            card.append(
                h,
                list,
                note,
                button('Оплата по СБП скоро откроется ✨', 'mrich-btn', () => {
                    closeOverlay();
                    toast('Оплата по СБП появится на следующем этапе ✨');
                }),
                button('Закрыть', 'mrich-btn mrich-btn--ghost', closeOverlay)
            );
        });
    }

    function showDevNotice() {
        haptic('select');
        overlay(card => {
            const h = document.createElement('h3');
            h.textContent = 'Моя мандала 🪷';
            const p = document.createElement('p');
            p.className = 'mrich-card-text';
            p.textContent = 'Раскраска мандалы сейчас в разработке и совсем скоро откроется ✨\n\nВаши практики и подарки подругам уже бережно сохраняются — когда раздел откроется, все талисманы будут ждать Вас внутри.';
            card.append(h, p, button('Хорошо', 'mrich-btn', closeOverlay));
        });
    }

    // ---------- Меню тестера (только VIP): долгое нажатие на мандалу ----------
    function askReset() {
        haptic('success');
        overlay(card => {
            const h = document.createElement('h3');
            h.textContent = 'Меню тестера (VIP)';
            const p = document.createElement('p');
            p.className = 'mrich-card-text';
            p.textContent = 'Выберите действие для проверки мандал и экономики:';
            card.append(
                h,
                p,
                button('Сбросить раскраску и задание', 'mrich-btn', resetPaint),
                button(`+${TEST_PACK_SILVER} 🌙 и +${TEST_PACK_GOLD} ☀️ (для теста)`, 'mrich-btn mrich-btn--secondary', grantTestPack),
                button('Полный сброс (как новый пользователь)', 'mrich-btn mrich-btn--secondary', fullReset),
                button('Закрыть', 'mrich-btn mrich-btn--ghost', closeOverlay)
            );
        });
    }

    function grantTestPack() {
        closeOverlay();
        state.practiceAll += TEST_PACK_SILVER;
        state.goldAll += TEST_PACK_GOLD;
        state.active = true;
        saveState();
        renderChip();
        syncHud();
        renderPath();
        toast(`Тест: начислено +${TEST_PACK_SILVER} 🌙 и +${TEST_PACK_GOLD} ☀️`);
        sendEconomyEvent({ type: 'vip_test_pack', silver: TEST_PACK_SILVER, gold: TEST_PACK_GOLD });
    }

    function resetPaint() {
        closeOverlay();
        hidePalette();
        state.paint = {};
        state.level = 1;
        state.done = false;
        state.practiceSpent = 0;
        state.goldSpent = 0;
        state.quests = { '1': { shares: 0, done: false } };
        Object.keys(state.flags).forEach(f => { if (f.indexOf('finished_') === 0 || f.indexOf('level_') === 0) delete state.flags[f]; });
        state.resetAt = Date.now();
        saveState();
        highlightUnpainted = false;
        if (view) {
            view.setHighlightUnpainted(false);
            view.resetZoom();
            view.setAlive(false);
        }
        renderChip();
        syncHud();
        renderPath();
        toast('Раскраска и задание сброшены ✨');
        sendEconomyEvent({ type: 'reset_paint' });
    }

    function fullReset() {
        closeOverlay();
        hidePalette();
        const prevBoughtP = state.boughtP || 0;
        const prevBoughtG = state.boughtG || 0;
        state = emptyState();
        state.boughtP = prevBoughtP;
        state.boughtG = prevBoughtG;
        state.active = true;
        state.firstSeen = Date.now();
        state.lastVisit = Date.now();
        state.flags.migrated = Date.now();
        giveOnce('welcome', 'на начало пути');
        ensureQuest(1);
        state.resetAt = Date.now();
        saveState();
        highlightUnpainted = false;
        if (view) {
            view.setHighlightUnpainted(false);
            view.resetZoom();
            view.setAlive(false);
        }
        renderChip();
        syncHud();
        renderPath();
        toast('Сброшено к состоянию нового пользователя ✨');
        sendEconomyEvent({ type: 'full_reset' });
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

        const convertBtn = document.getElementById('mandalaConvertBtn');
        if (convertBtn) convertBtn.addEventListener('click', () => {
            convertSilverToGold(convertBtn);
        });

        const giftBtn = document.getElementById('mandalaGiftBtn');
        if (giftBtn) giftBtn.addEventListener('click', () => {
            haptic('select');
            giftMandala(giftBtn);
        });

        const storyBtn = document.getElementById('mandalaStoryBtn');
        if (storyBtn) {
            storyBtn.hidden = !isPremium();
            storyBtn.addEventListener('click', () => {
                haptic('select');
                shareStory(storyBtn);
            });
        }

        const buyBtn = document.getElementById('mandalaBuyBtn');
        if (buyBtn) buyBtn.addEventListener('click', openPackModal);

        const colLink = document.getElementById('mandalaCollectionLink');
        if (colLink) colLink.addEventListener('click', () => {
            const legacy = document.getElementById('pathCollectionCard');
            if (legacy) legacy.click();
        });

        const hlBtn = document.getElementById('mandalaHighlightBtn');
        if (hlBtn) hlBtn.addEventListener('click', () => {
            if (!view) return;
            haptic('select');
            highlightUnpainted = !highlightUnpainted;
            view.setHighlightUnpainted(highlightUnpainted);
            syncToolsUi(getProgress());
        });

        const zoomInBtn = document.getElementById('mandalaZoomInBtn');
        if (zoomInBtn) zoomInBtn.addEventListener('click', () => {
            if (!view) return;
            haptic('select');
            view.zoomIn();
        });

        const zoomOutBtn = document.getElementById('mandalaZoomOutBtn');
        if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => {
            if (!view) return;
            haptic('select');
            view.zoomOut();
        });

        const zoomResetBtn = document.getElementById('mandalaZoomResetBtn');
        if (zoomResetBtn) zoomResetBtn.addEventListener('click', () => {
            if (!view) return;
            haptic('select');
            view.resetZoom();
        });
    }

    // Запуск после app.js (его обработчик DOMContentLoaded зарегистрирован раньше): там объявлен window.isUserVIP.
    // Медальон виден всем (html.mandala-visible), а экран мандал и талисманы открыты только VIP (html.mandala-vip).
    function isVip() {
        if (!VIP_ONLY) return true;
        return typeof window.isUserVIP === 'function' && !!window.isUserVIP();
    }

    function start() {
        const vip = isVip();
        document.documentElement.classList.add('mandala-visible');
        if (vip) document.documentElement.classList.add('mandala-vip');
        window.Mandala = { award, renderPath, renderChip, getProgress, storyTooFast, showDevNotice };
        init();
    }

    if (document.readyState === 'complete') {
        start();
    } else {
        document.addEventListener('DOMContentLoaded', start);
    }
})();
