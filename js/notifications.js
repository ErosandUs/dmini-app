/**
 * Колокольчик «Утренняя карта дня» (рядом с Луной на экране «Пространство дня»).
 *
 * Человек сам включает и выключает утренние напоминания. Всё хранится на сервере
 * (Google Apps Script + Таблица), поэтому статус одинаков на всех устройствах.
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
    var REQUEST_TIMEOUT_MS = 15000;
    var STATUS_DELAY_MS = 1500;
    var TOAST_MS = 3200;

    var busy = false;
    var enabled = false;
    var toastTimer = null;
    var row, btn, toast;

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

    function render(value) {
        enabled = Boolean(value);
        btn.classList.toggle('is-on', enabled);
        btn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
        btn.setAttribute('aria-label', 'Утренние напоминания о карте дня: ' + (enabled ? 'включены' : 'выключены'));
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
        var message = 'Чтобы получать напоминания, откройте бота и нажмите «Старт». Затем снова включите колокольчик.';
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
                    if (data.subscribed) {
                        var cfg = getConfig();
                        var hour = cfg && cfg.notifyHour ? cfg.notifyHour : 9;
                        showToast('Утренние напоминания включены ✨ Карта дня придёт в ' + hour + ':00 по вашему времени');
                    } else {
                        showToast('Утренние напоминания отключены');
                    }
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

    // Тихая синхронизация: узнаём реальный статус (на сервере) и обновляем часовой пояс
    function refreshStatus() {
        if (busy) return;
        callServer('status')
            .then(function (data) {
                if (busy) return;
                if (data && data.status === 'success') {
                    render(data.subscribed);
                    writeCache(data.subscribed);
                }
            })
            .catch(function (err) {
                console.warn('Notifications status error (using cache):', err);
            });
    }

    document.addEventListener('DOMContentLoaded', function () {
        row = document.getElementById('notifyBellRow');
        btn = document.getElementById('notifyBellBtn');
        toast = document.getElementById('notifyBellToast');
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
