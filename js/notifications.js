/**
 * Колокольчик «Утренняя карта дня» (справа, над виджетом на экране «Пространство дня»).
 *
 * Обычно это компактный круглый значок: заливка показывает, включены ли уведомления.
 * При нажатии на 2–3 секунды выезжает надпись «Уведомления включены / выключены» и сворачивается обратно.
 * Всё хранится на сервере (Google Apps Script + Таблица), поэтому статус одинаков на всех устройствах.
 * Серверная часть: sessions/2026-11-07_morning-notifications/gas/Notifications.gs
 *
 * Правила проекта:
 *  - POST только с 'Content-Type': 'text/plain;charset=utf-8';
 *  - никаких тяжёлых действий при старте: статус запрашивается отложенно;
 *  - без бесконечных анимаций; вне Telegram (нет initData) блок скрыт.
 */
(function () {
    'use strict';

    var CACHE_KEY = 'dzam_morning_notify';
    var VISIT_COUNT_KEY = 'dzam_visit_days_count';
    var VISIT_DAY_KEY = 'dzam_visit_last_day';
    var PROMPT_SHOWN_KEY = 'dzam_morning_prompt_shown';
    var PROMPT_MIN_DAYS = 5;

    var REQUEST_TIMEOUT_MS = 15000;
    var STATUS_DELAY_MS = 1500;
    var TOAST_MS = 3200;
    var LABEL_MS = 2600;

    var TEXT_ON = 'Уведомления включены';
    var TEXT_OFF = 'Уведомления выключены';
    var ENABLE_BTN_TEXT = 'Подключить напоминания';
    var ENABLE_BTN_BUSY_TEXT = 'Подключаем...';

    var busy = false;
    var enabled = false;
    var visitDays = 0;
    var toastTimer = null;
    var labelTimer = null;
    var row, btn, toast, label;
    var promptModal, promptCloseBtn, promptEnableBtn, promptDismissBtn, promptError;

    function getTg() {
        return window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
    }

    function getConfig() {
        return typeof EVENT_CONFIG !== 'undefined' ? EVENT_CONFIG : null;
    }

    function getTimeZone() {
        try {
            return Intl.DateTimeFormat().resolvedOptions().timeZone || '';
        } catch (_) {
            return '';
        }
    }

    function readCache() {
        try { return localStorage.getItem(CACHE_KEY) === '1'; } catch (_) { return false; }
    }

    function writeCache(value) {
        try { localStorage.setItem(CACHE_KEY, value ? '1' : '0'); } catch (_) {}
    }

    function getLocalDateKey() {
        var now = new Date();
        var y = now.getFullYear();
        var m = String(now.getMonth() + 1);
        var d = String(now.getDate());
        if (m.length < 2) m = '0' + m;
        if (d.length < 2) d = '0' + d;
        return y + '-' + m + '-' + d;
    }

    function recordVisitDay() {
        try {
            var today = getLocalDateKey();
            var lastDay = localStorage.getItem(VISIT_DAY_KEY);
            var count = parseInt(localStorage.getItem(VISIT_COUNT_KEY) || '0', 10);
            if (isNaN(count) || count < 0) count = 0;

            if (lastDay !== today) {
                count += 1;
                localStorage.setItem(VISIT_DAY_KEY, today);
                localStorage.setItem(VISIT_COUNT_KEY, String(count));
            }
            return count;
        } catch (_) {
            return 0;
        }
    }

    function isPromptShown() {
        try { return localStorage.getItem(PROMPT_SHOWN_KEY) === '1'; } catch (_) { return false; }
    }

    function markPromptShown() {
        try { localStorage.setItem(PROMPT_SHOWN_KEY, '1'); } catch (_) {}
    }

    function setPromptError(text) {
        if (!promptError) return;
        if (!text) {
            promptError.textContent = '';
            promptError.hidden = true;
            return;
        }
        promptError.textContent = text;
        promptError.hidden = false;
    }

    function canShowPrompt() {
        if (!promptModal || enabled || busy || isPromptShown() || visitDays < PROMPT_MIN_DAYS) {
            return false;
        }

        var dailyTab = document.getElementById('daily');
        var dashboard = document.getElementById('cooldownDashboard');
        var stage = document.getElementById('cardDrawStage');
        if (!dailyTab || !dailyTab.classList.contains('active') || !dashboard) {
            return false;
        }
        if (window.getComputedStyle(dashboard).display === 'none') {
            return false;
        }
        if (stage && window.getComputedStyle(stage).display !== 'none') {
            return false;
        }

        if (document.querySelector('.modal.active, .event-modal-overlay.active')) {
            return false;
        }
        var sheet = document.getElementById('sacredBottomSheet');
        if (sheet && !sheet.classList.contains('hidden')) {
            return false;
        }

        return true;
    }

    function openPrompt() {
        if (!promptModal) return;
        markPromptShown();
        setPromptError('');
        promptModal.classList.add('active');
    }

    function closePrompt(force) {
        if (!promptModal) return;
        if (busy && !force) return;
        promptModal.classList.remove('active');
    }

    // Только цвет и подписи: значок остаётся компактным
    function render(value) {
        enabled = Boolean(value);
        btn.classList.toggle('is-on', enabled);
        btn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
        btn.setAttribute('aria-label', 'Утренние напоминания о карте дня: ' + (enabled ? 'включены' : 'выключены'));
        if (label) label.textContent = enabled ? TEXT_ON : TEXT_OFF;
    }

    // Надпись выезжает справа налево на пару секунд и уходит обратно в колокольчик
    function flashLabel() {
        if (!label) return;
        btn.classList.add('is-expanded');
        if (labelTimer) clearTimeout(labelTimer);
        labelTimer = setTimeout(function () {
            btn.classList.remove('is-expanded');
        }, LABEL_MS);
    }

    function showToast(text) {
        if (!toast) return;
        toast.textContent = text;
        toast.classList.add('is-visible');
        if (toastTimer) clearTimeout(toastTimer);
        toastTimer = setTimeout(function () {
            toast.classList.remove('is-visible');
        }, TOAST_MS);
    }

    function callServer(action) {
        var cfg = getConfig();
        var tg = getTg();
        var controller = typeof AbortController === 'function' ? new AbortController() : null;
        var timer = controller ? setTimeout(function () { controller.abort(); }, REQUEST_TIMEOUT_MS) : null;

        return fetch(cfg.notifyScriptUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: action, initData: tg.initData, tz: getTimeZone() }),
            signal: controller ? controller.signal : undefined
        })
        .then(function (res) { return res.json(); })
        .then(function (data) {
            if (timer) clearTimeout(timer);
            return data;
        }, function (err) {
            if (timer) clearTimeout(timer);
            throw err;
        });
    }

    function openBot() {
        var cfg = getConfig();
        var tg = getTg();
        if (!tg || !cfg || !cfg.botUsername) return;
        try { tg.openTelegramLink('https://t.me/' + cfg.botUsername); } catch (_) {}
    }

    // Бот не смог написать человеку (он ни разу не нажимал «Старт» у бота)
    function showCantWrite() {
        var message = 'Чтобы получать напоминания, откройте бота и нажмите «Старт». Затем снова нажмите на колокольчик.';
        var tg = getTg();
        try {
            if (tg && typeof tg.showPopup === 'function' && (typeof tg.isVersionAtLeast !== 'function' || tg.isVersionAtLeast('6.2'))) {
                tg.showPopup({
                    message: message,
                    buttons: [
                        { id: 'bot', type: 'default', text: 'Открыть бота' },
                        { id: 'cancel', type: 'cancel' }
                    ]
                }, function (id) {
                    if (id === 'bot') openBot();
                });
                return;
            }
        } catch (_) {}
        showToast(message);
    }

    function onClick(e) {
        if (e) e.stopPropagation();
        if (busy) return;

        var tg = getTg();
        try {
            if (tg && tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
        } catch (_) {}

        busy = true;
        btn.classList.add('is-busy');
        var action = enabled ? 'unsubscribe' : 'subscribe';

        callServer(action)
            .then(function (data) {
                if (data && data.status === 'success') {
                    render(data.subscribed);
                    writeCache(data.subscribed);
                    markPromptShown();
                    flashLabel();
                } else if (data && data.error === 'cant_write') {
                    showCantWrite();
                } else {
                    showToast('Не получилось. Попробуйте ещё раз чуть позже');
                }
            })
            .catch(function (err) {
                console.warn('Notifications request error:', err);
                showToast('Нет связи. Попробуйте ещё раз чуть позже');
            })
            .then(function () {
                busy = false;
                btn.classList.remove('is-busy');
            });
    }

    function onPromptEnableClick() {
        if (busy) return;

        var tg = getTg();
        try {
            if (tg && tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
        } catch (_) {}

        busy = true;
        btn.classList.add('is-busy');
        if (promptEnableBtn) {
            promptEnableBtn.classList.add('is-busy');
            promptEnableBtn.disabled = true;
            promptEnableBtn.textContent = ENABLE_BTN_BUSY_TEXT;
        }
        setPromptError('');

        callServer('subscribe')
            .then(function (data) {
                if (data && data.status === 'success') {
                    render(data.subscribed);
                    writeCache(data.subscribed);
                    closePrompt(true);
                    flashLabel();
                } else if (data && data.error === 'cant_write') {
                    closePrompt(true);
                    showCantWrite();
                } else {
                    setPromptError('Не получилось подключить. Попробуйте ещё раз чуть позже');
                }
            })
            .catch(function (err) {
                console.warn('Notifications prompt subscribe error:', err);
                setPromptError('Нет связи. Попробуйте ещё раз чуть позже');
            })
            .then(function () {
                busy = false;
                btn.classList.remove('is-busy');
                if (promptEnableBtn) {
                    promptEnableBtn.classList.remove('is-busy');
                    promptEnableBtn.disabled = false;
                    promptEnableBtn.textContent = ENABLE_BTN_TEXT;
                }
            });
    }

    // Тихая синхронизация: узнаём реальный статус (на сервере) и обновляем часовой пояс
    function refreshStatus() {
        if (busy) return;
        callServer('status')
            .then(function (data) {
                if (busy) return;
                if (data && data.status === 'success') {
                    render(data.subscribed);
                    writeCache(data.subscribed);
                    if (data.subscribed) {
                        markPromptShown();
                    } else if (canShowPrompt()) {
                        openPrompt();
                    }
                }
            })
            .catch(function (err) {
                console.warn('Notifications status error (using cache):', err);
            });
    }

    document.addEventListener('DOMContentLoaded', function () {
        visitDays = recordVisitDay();

        row = document.getElementById('notifyBellRow');
        btn = document.getElementById('notifyBellBtn');
        toast = document.getElementById('notifyBellToast');
        label = document.getElementById('notifyBellLabel');

        promptModal = document.getElementById('notifyPromptModal');
        promptCloseBtn = document.getElementById('closeNotifyPromptModal');
        promptEnableBtn = document.getElementById('notifyPromptEnableBtn');
        promptDismissBtn = document.getElementById('notifyPromptDismissBtn');
        promptError = document.getElementById('notifyPromptError');

        if (promptCloseBtn) {
            promptCloseBtn.addEventListener('click', function () { closePrompt(false); });
        }
        if (promptDismissBtn) {
            promptDismissBtn.addEventListener('click', function () { closePrompt(false); });
        }
        if (promptModal) {
            promptModal.addEventListener('click', function (e) {
                if (e.target === promptModal) closePrompt(false);
            });
            document.addEventListener('keydown', function (e) {
                if (e.key === 'Escape' && promptModal.classList.contains('active')) {
                    closePrompt(false);
                }
            });
        }
        if (promptEnableBtn) {
            promptEnableBtn.addEventListener('click', onPromptEnableClick);
        }

        if (!row || !btn) return;

        var tg = getTg();
        var cfg = getConfig();
        // Вне Telegram подписи пользователя нет, поэтому блок остаётся скрытым
        if (!tg || !tg.initData || !cfg || !cfg.notifyScriptUrl) return;

        render(readCache());
        row.hidden = false;
        btn.addEventListener('click', onClick);
        setTimeout(refreshStatus, STATUS_DELAY_MS);
    });
})();
