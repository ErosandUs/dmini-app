// --- ЕДИНАЯ БЕЗОПАСНАЯ ОТПРАВКА ЦЕЛЕЙ В ЯНДЕКС.МЕТРИКУ (счётчик 110909428) ---
// Если Метрика не загрузилась или заблокирована, приложение продолжает работать без ошибок.
function trackGoal(goal, params) {
    try {
        if (typeof ym === 'function') {
            if (params) {
                ym(110909428, 'reachGoal', goal, params);
            } else {
                ym(110909428, 'reachGoal', goal);
            }
        }
    } catch (_) {}
}
window.trackGoal = trackGoal;

document.addEventListener('DOMContentLoaded', () => {

    // Инициализация отображения и перехода в нативный полный экран (Bot API 8.0+)
    if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        try {
            tg.ready();
        } catch (_) {}

        // Проверка поддержки методов Telegram Bot API 8.0+
        const isBotApi8 = (() => {
            try {
                if (typeof tg.isVersionAtLeast === 'function') {
                    return tg.isVersionAtLeast('8.0');
                }
                const v = parseFloat(tg.version || '0');
                return v >= 8.0;
            } catch (_) {
                return false;
            }
        })();

        // 1. Попытка входа в нативный Fullscreen ТОЛЬКО если версия Bot API >= 8.0, иначе expand()
        try {
            if (isBotApi8 && typeof tg.requestFullscreen === 'function') {
                try {
                    tg.requestFullscreen();
                } catch (fsErr) {
                    console.warn('tg.requestFullscreen() вызвал ошибку, откат на expand():', fsErr);
                    if (typeof tg.expand === 'function') {
                        tg.expand();
                    }
                }
            } else if (typeof tg.expand === 'function') {
                tg.expand();
            }
        } catch (e) {
            console.warn('Fullscreen не поддерживается:', e);
            if (typeof tg.expand === 'function') {
                try { tg.expand(); } catch (_) {}
            }
        }

        // 2. Защита от закрытия шторки случайным свайпом вниз (доступно с Bot API 7.7+)
        try {
            const isBotApi77 = (() => {
                try {
                    if (typeof tg.isVersionAtLeast === 'function') {
                        return tg.isVersionAtLeast('7.7');
                    }
                    const v = parseFloat(tg.version || '0');
                    return v >= 7.7;
                } catch (_) {
                    return false;
                }
            })();

            if (isBotApi77 && typeof tg.disableVerticalSwipes === 'function') {
                tg.disableVerticalSwipes();
            }
        } catch (e) {
            console.warn('disableVerticalSwipes не поддерживается:', e);
        }

        // 3. Синхронизация системных цветов Telegram с палитрой приложения
        try {
            if (typeof tg.setHeaderColor === 'function') {
                tg.setHeaderColor('#f6f0fa');
            }
            if (typeof tg.setBackgroundColor === 'function') {
                tg.setBackgroundColor('#f6f0fa');
            }
        } catch (e) {
            console.warn('Цвета системных зон не применились:', e);
        }

        // 4. Синхронизация системных зон (Safe Area Insets) исключительно через CSS-переменные на :root
        const syncSafeArea = () => {
            try {
                const root = document.documentElement;
                if (tg.safeAreaInset) {
                    root.style.setProperty('--tg-safe-area-inset-top', `${tg.safeAreaInset.top || 0}px`);
                    root.style.setProperty('--tg-safe-area-inset-bottom', `${tg.safeAreaInset.bottom || 0}px`);
                    root.style.setProperty('--tg-safe-area-inset-left', `${tg.safeAreaInset.left || 0}px`);
                    root.style.setProperty('--tg-safe-area-inset-right', `${tg.safeAreaInset.right || 0}px`);
                }
                if (tg.contentSafeAreaInset) {
                    root.style.setProperty('--tg-content-safe-area-inset-top', `${tg.contentSafeAreaInset.top || 0}px`);
                    root.style.setProperty('--tg-content-safe-area-inset-bottom', `${tg.contentSafeAreaInset.bottom || 0}px`);
                    root.style.setProperty('--tg-content-safe-area-inset-left', `${tg.contentSafeAreaInset.left || 0}px`);
                    root.style.setProperty('--tg-content-safe-area-inset-right', `${tg.contentSafeAreaInset.right || 0}px`);
                }
            } catch (err) {
                console.warn('Не удалось синхронизировать Safe Area:', err);
            }
        };

        syncSafeArea();

        // Слушатели обновления зон безопасности в реальном времени
        if (typeof tg.onEvent === 'function') {
            try {
                tg.onEvent('safeAreaChanged', syncSafeArea);
                tg.onEvent('contentSafeAreaChanged', syncSafeArea);
                tg.onEvent('fullscreenChanged', syncSafeArea);
            } catch (e) {
                console.warn('Ошибка подписки на события safe area:', e);
            }
        }

        window.addEventListener('focus', () => {
            try {
                if (isBotApi8 && typeof tg.requestFullscreen === 'function' && !tg.isFullscreen) {
                    try {
                        tg.requestFullscreen();
                    } catch (_) {
                        if (typeof tg.expand === 'function' && !tg.isExpanded) {
                            tg.expand();
                        }
                    }
                } else if (typeof tg.expand === 'function' && !tg.isExpanded) {
                    tg.expand();
                }
            } catch (e) {
                if (typeof tg.expand === 'function') {
                    try { tg.expand(); } catch (_) {}
                }
            }
            syncSafeArea();
        });
    }

    // --- ТАКТИЛЬНЫЙ ОТКЛИК (HAPTIC FEEDBACK) ---
    // Тройная мягкая вибрация для сакрального вытягивания карты
    function triggerMysticCardHaptic() {
        const haptic = window.Telegram?.WebApp?.HapticFeedback;
        if (!haptic) return;
        haptic.impactOccurred('light');
        setTimeout(() => { haptic.impactOccurred('light'); }, 90);
        setTimeout(() => { haptic.impactOccurred('light'); }, 180);
    }

    // Универсальный мягкий клик для кнопок
    function triggerSoftHaptic() {
        window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('light');
    }

    // Легкий микротик для навигации
    function triggerSelectionHaptic() {
        window.Telegram?.WebApp?.HapticFeedback?.selectionChanged();
    }

    // --- Проверка VIP-пользователей ---
    const VIP_USERS = ['Djamilia_Kha', 'atribute']; // Никнеймы без знака @

    function isUserVIP() {
        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) {
            const username = window.Telegram.WebApp.initDataUnsafe.user.username;
            if (VIP_USERS.includes(username)) return true;
        }
        if (window.location.search.includes('vip=1')) return true;
        return false;
    }

    // --- ДИНАМИЧЕСКИЙ ВЫВОД ВЕРСИИ ИЗ INDEX.HTML ---
    const appScriptTag = document.getElementById('appScript');
    const versionLabel = document.getElementById('appVersionLabel');
    // Ярлык версии виден только VIP-пользователям; остальным элемент убирается из DOM
    if (versionLabel && !isUserVIP()) {
        versionLabel.remove();
    } else if (appScriptTag && versionLabel) {
        const srcAttr = appScriptTag.getAttribute('src');
        const vMatch = srcAttr ? srcAttr.match(/\?v=(.+)$/) : null;
        const currentVersion = vMatch ? vMatch[1] : '1';
        versionLabel.innerText = `v${currentVersion}`;
    }

    // --- НАСТРОЙКИ ---
    const BOT_LINK = "https://t.me/Djamiliakha_bot?start=go"; // Ваша актуальная ссылка на бота
    const TOTAL_CARDS = 71; 
    const STORAGE_KEY = "mystic_collection"; // Ключ для локального хранилища коллекции

    // --- ЛОГИКА ГЛАВНЫХ ВКЛАДОК ---
    const tabContents = document.querySelectorAll('.tab-content');

    // --- ЛОГИКА ВНУТРЕННИХ ВКЛАДОК ВИДЕОТЕКИ ---
    const vTabBtns = document.querySelectorAll('.v-tab-btn');
    const vTabContents = document.querySelectorAll('.v-tab-content');

    vTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            triggerSelectionHaptic();
            vTabBtns.forEach(b => b.classList.remove('active'));
            vTabContents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.vtab).classList.add('active');        });
    });

    // ==========================================
    // ЛОГИКА ПОТОКА И СОХРАНЕНИЯ В КОЛЛЕКЦИЮ
    // ==========================================

    const headerScreenTitle = document.getElementById('headerScreenTitle');
    const step1Card = document.getElementById('step1-card');
    const cardDrawStage = document.getElementById('cardDrawStage');
    const cooldownDashboard = document.getElementById('cooldownDashboard');
    const cardTapPrompt = document.getElementById('cardTapPrompt');
    const step1_5Celestial = document.getElementById('step1_5-celestial');
    const step2Audio = document.getElementById('step2-audio');
    const step3Video = document.getElementById('step3-video'); 

    const card = document.getElementById('mysticCard');
    const drawCardBtn = document.getElementById('drawCardBtn');
    const cardResultImg = document.getElementById('cardResult');
    const openCelestialBtn = document.getElementById('openCelestialBtn');
    const openAudioFromCardBtn = document.getElementById('openAudioFromCardBtn');
    const backToCardBtn = document.getElementById('backToCardBtn');
    const shareCardBtn = document.getElementById('shareCardBtn'); 
    const nextToAudioBtn = document.getElementById('nextToAudioBtn');
    const avatarVideo = document.getElementById('avatarVideo');

    // Элементы интерактивного дашборда «Пространство дня»
    const cooldownMoonWidget = document.getElementById('cooldownMoonWidget');
    const cooldownCollectionWidget = document.getElementById('cooldownCollectionWidget');
    const cooldownVideoWidget = document.getElementById('cooldownVideoWidget');
    const cdTodayCardThumb = document.getElementById('cdTodayCardThumb');
    const cdTodayCardName = document.getElementById('cdTodayCardName');
    const cdReplayAudioBtn = document.getElementById('cdReplayAudioBtn');
    const cdShareCardBtn = document.getElementById('cdShareCardBtn');
    const cdCooldownTimeText = document.getElementById('cdCooldownTimeText');
    const cdVipResetBtn = document.getElementById('cdVipResetBtn');
    const cdDrawCardBtn = document.getElementById('cdDrawCardBtn');
    const sacredGateToast = document.getElementById('sacredGateToast');
    const backFromCelestialTopBtn = document.getElementById('backFromCelestialTopBtn');
    const backFromCollectionBtn = document.getElementById('backFromCollectionBtn');
    const backFromVideoBtn = document.getElementById('backFromVideoBtn');
    
    let isFlipped = false;
    let currentCardNumber = parseInt(localStorage.getItem('lastDrawnCardNumber') || '1', 10);
    if (isNaN(currentCardNumber) || currentCardNumber < 1 || currentCardNumber > TOTAL_CARDS) {
        currentCardNumber = 1;
    }
    let currentCardPath = `images/${currentCardNumber}.jpeg`; 

// === ЛОГИКА ТАЙМЕРА (12 ЧАСОВ) И ЭКРАНА «ПРОСТРАНСТВО ДНЯ» ===
    const COOLDOWN_MS = 12 * 60 * 60 * 1000; 
    let countdownInterval; 

    function formatTime(ms) {
        const totalSeconds = Math.ceil(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        if (hours > 0) return `${hours}ч ${minutes}м`;
        else if (minutes > 0) return `${minutes}м ${seconds}с`;
        else return `${seconds} сек.`;
    }

    function setHeaderTitle(titleText) {
        if (headerScreenTitle) {
            headerScreenTitle.innerText = titleText;
        }
    }

    function isDashboardSleeping() {
        return Boolean(cooldownDashboard && cooldownDashboard.classList.contains('is-sleeping'));
    }

    // Рубашка карты (спящее состояние) или сегодняшняя открытая карта (пробуждённое)
    function updateTodayCardOnDashboard() {
        const cdTodayCardThumbBack = document.getElementById('cdTodayCardThumbBack');

        if (isDashboardSleeping()) {
            const backPath = 'images/0.jpeg';
            if (cdTodayCardThumb) {
                if (cdTodayCardThumb.getAttribute('src') !== backPath) cdTodayCardThumb.src = backPath;
                cdTodayCardThumb.alt = 'Рубашка карты';
            }
            if (cdTodayCardThumbBack && cdTodayCardThumbBack.getAttribute('src') !== backPath) {
                cdTodayCardThumbBack.src = backPath;
            }
            return;
        }

        const savedCard = parseInt(localStorage.getItem('lastDrawnCardNumber') || '0', 10);
        if (savedCard >= 1 && savedCard <= TOTAL_CARDS) {
            currentCardNumber = savedCard;
        }
        currentCardPath = `images/${currentCardNumber}.jpeg`;

        if (cdTodayCardThumb) {
            cdTodayCardThumb.src = currentCardPath;
            cdTodayCardThumb.alt = 'Карта дня';
        }
        if (cdTodayCardThumbBack) {
            cdTodayCardThumbBack.src = currentCardPath;
        }
        if (cdTodayCardName) {
            let trackLabel = '';
            if (typeof CARD_TO_AUDIO_MAP !== 'undefined' && typeof AUDIO_TRACKS_DATA !== 'undefined') {
                const trackIds = CARD_TO_AUDIO_MAP[currentCardNumber] || [1];
                const trackObj = AUDIO_TRACKS_DATA.find(t => t.id === trackIds[0]);
                if (trackObj && trackObj.title) {
                    trackLabel = ` «${trackObj.title}»`;
                }
            }
            cdTodayCardName.innerText = `Карта №${currentCardNumber}${trackLabel}`;
        }
    }

    // Единая функция показа дашборда «Пространство дня» в одном из двух состояний:
    // isAwake=false — «спящее» (вуаль на Послании небес и Видеотеке, призыв вытянуть карту),
    // isAwake=true  — «пробуждённое» (карта дня, кнопки практики, встроенный таймер)
    function setDashboardAwake(isAwake) {
        if (!cooldownDashboard) return;
        const wasSleeping = cooldownDashboard.classList.contains('is-sleeping');

        if (cardDrawStage) cardDrawStage.style.display = 'none';
        cooldownDashboard.style.display = 'flex';
        if (versionLabel) versionLabel.style.display = 'block';
        // Фиксируем стартовый стиль вуали, чтобы при пробуждении она плавно растворялась
        if (wasSleeping && isAwake) void cooldownDashboard.offsetWidth;
        cooldownDashboard.classList.toggle('is-sleeping', !isAwake);

        [cooldownMoonWidget, cooldownVideoWidget].forEach(widget => {
            if (widget) widget.setAttribute('aria-disabled', isAwake ? 'false' : 'true');
        });

        setHeaderTitle('Пространство дня');
        updateTodayCardOnDashboard();

        // Кнопка VIP-сброса: только в пробуждённом состоянии
        const showVipReset = isAwake && isUserVIP();
        if (cdVipResetBtn) {
            cdVipResetBtn.style.display = showVipReset ? 'inline-block' : 'none';
            const vipFooter = cdVipResetBtn.closest('.cd-cooldown-footer');
            if (vipFooter) vipFooter.classList.toggle('is-vip', showVipReset);
        }

        // Обновляем данные Луны и Коллекции на виджетах (через микротик, чтобы функции были инициализированы)
        setTimeout(() => {
            if (typeof renderCelestialStep === 'function') {
                try { renderCelestialStep(); } catch (_) {}
            }
            if (typeof calculateSacredProgress === 'function') {
                try { calculateSacredProgress(); } catch (_) {}
            }
            if (typeof window.updateEventTimer === 'function') {
                window.updateEventTimer();
            }
            if (typeof syncFieldCounterVisibility === 'function') {
                syncFieldCounterVisibility();
            }
        }, 0);
    }

    function showCooldownDashboard() {
        setDashboardAwake(true);
    }

    function showSleepingDashboard() {
        setDashboardAwake(false);
    }

    // Чистая проверка активного 12-часового кулдауна (без побочных переключений экранов)
    function isCooldownActive() {
        const lastDrawTs = parseInt(localStorage.getItem('lastDrawTime') || '', 10);
        if (isNaN(lastDrawTs)) return false;
        return (Date.now() - lastDrawTs) < COOLDOWN_MS;
    }

    // --- Контекстное уведомление прямо из замочка для «спящих» виджетов ---
    const veilBubbleTimers = {};
    function hideAllVeilBubbles() {
        ['cdCelestialGateBubble', 'cdVideoGateBubble'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.remove('is-visible');
            if (veilBubbleTimers[id]) {
                clearTimeout(veilBubbleTimers[id]);
                veilBubbleTimers[id] = null;
            }
        });
    }

    // Подпись у замка теперь постоянная (в разметке), всплывающих подсказок нет: при нажатии замок лишь слегка «вздрагивает»
    function showVeilBubble(bubbleId) {
        const holder = bubbleId === 'cdVideoGateBubble' ? '#cooldownVideoWidget' : '#cooldownCelestialFullCard';
        const lockEl = document.querySelector(`${holder} .cd-veil-lock`);
        if (!lockEl) return;

        lockEl.classList.remove('is-pulsing');
        void lockEl.offsetWidth;
        lockEl.classList.add('is-pulsing');

        if (veilBubbleTimers[bubbleId]) clearTimeout(veilBubbleTimers[bubbleId]);
        veilBubbleTimers[bubbleId] = setTimeout(() => {
            lockEl.classList.remove('is-pulsing');
        }, 600);
    }

    let isTransitioningToRitual = false;

    // --- Ритуал карты: полноэкранный этап практики с кинематографичным зумом ---
    function openCardRitual() {
        if (isFlipped || window.isCardDrawing || isTransitioningToRitual) return;
        if (isCooldownActive()) {
            checkTimer();
            return;
        }
        triggerSoftHaptic();
        hideAllVeilBubbles();

        // Проверяем, совершается ли переход с главного экрана (дашборда)
        const isComingFromDashboard = Boolean(cooldownDashboard && cooldownDashboard.style.display !== 'none');
        const startTarget = cdTodaySleepingDeck ? (cdTodaySleepingDeck.querySelector('.cd-today-card-thumb--front') || cdTodaySleepingDeck) : null;
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // Чистое исходное состояние: рубашка вверх, кнопка «Получить послание» видна, кнопок аудио нет
        if (card) {
            card.style.transition = 'none';
            card.classList.remove('flipped');
            void card.offsetWidth;
            card.style.transition = '';
        }
        if (cardTapPrompt) cardTapPrompt.classList.remove('is-dissolved');
        if (drawCardBtn) {
            drawCardBtn.disabled = false;
            drawCardBtn.style.display = 'block';
        }
        if (openAudioFromCardBtn) openAudioFromCardBtn.style.display = 'none';
        if (shareCardBtn) shareCardBtn.style.display = 'none';

        if (typeof window.hideEventTimer === 'function') {
            window.hideEventTimer();
        }
        if (typeof syncFieldCounterVisibility === 'function') {
            syncFieldCounterVisibility();
        }
        setHeaderTitle('Послание на день');

        // Кинематографичный Shared-Element Zoom Transition (60 FPS GPU Composite)
        if (isComingFromDashboard && startTarget && !prefersReduced && typeof card?.animate === 'function') {
            isTransitioningToRitual = true;

            const startRect = startTarget.getBoundingClientRect();

            // Мгновенно переключаем экраны под летающим прокси
            if (cooldownDashboard) cooldownDashboard.style.display = 'none';
            if (versionLabel) versionLabel.style.display = 'none';
            if (cardDrawStage) {
                cardDrawStage.style.display = 'flex';
                cardDrawStage.style.opacity = '0';
            }
            window.scrollTo({ top: 0, behavior: 'auto' });

            // Временно делаем реальную большую карту невидимой, пока летит прокси
            card.style.visibility = 'hidden';

            // Вычисляем целевые координаты большой карты
            const endRect = card.getBoundingClientRect();
            const deltaX = startRect.left - endRect.left;
            const deltaY = startRect.top - endRect.top;
            const scaleX = startRect.width / endRect.width;
            const scaleY = startRect.height / endRect.height;

            // Прокси сразу в итоговом размере карты: последний кадр полёта совпадает с настоящей картой
            const proxy = document.createElement('div');
            proxy.className = 'cd-card-zoom-proxy';
            proxy.style.top = `${endRect.top}px`;
            proxy.style.left = `${endRect.left}px`;
            proxy.style.width = `${endRect.width}px`;
            proxy.style.height = `${endRect.height}px`;

            const proxyImg = document.createElement('img');
            proxyImg.src = 'images/0.jpeg';
            proxyImg.alt = '';
            proxyImg.decoding = 'sync';
            proxy.appendChild(proxyImg);
            document.body.appendChild(proxy);

            // 1. Полет и масштабирование карты (460 мс, плавная кривая Apple/Telegram)
            // Скругление компенсирует масштаб: на экране углы остаются около 12px
            const proxyAnim = proxy.animate([
                {
                    transform: `translate3d(${deltaX}px, ${deltaY}px, 0) scale(${scaleX}, ${scaleY})`,
                    borderRadius: `${12 / scaleX}px / ${12 / scaleY}px`
                },
                {
                    transform: 'translate3d(0, 0, 0) scale(1, 1)',
                    borderRadius: '12px / 12px'
                }
            ], {
                duration: 460,
                easing: 'cubic-bezier(0.2, 0.9, 0.28, 1)',
                fill: 'forwards'
            });

            // 2. Мягкое проявление окружения ритуала
            if (cardDrawStage) {
                cardDrawStage.animate([
                    { opacity: 0 },
                    { opacity: 1 }
                ], {
                    duration: 300,
                    easing: 'ease-out',
                    fill: 'forwards'
                });
            }

            // 3. Золотой лотос грациозно опускается на свое место сверху
            const lotusDivider = document.getElementById('ritualTopLotusDivider');
            if (lotusDivider && typeof lotusDivider.animate === 'function') {
                lotusDivider.animate([
                    { opacity: 0, transform: 'translateY(-18px)' },
                    { opacity: 1, transform: 'translateY(0)' }
                ], {
                    duration: 420,
                    delay: 140,
                    easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
                    fill: 'backwards'
                });
            }

            // 4. Кнопка «ПОЛУЧИТЬ ПОСЛАНИЕ» всплывает снизу
            if (drawCardBtn && typeof drawCardBtn.animate === 'function') {
                drawCardBtn.animate([
                    { opacity: 0, transform: 'translateY(22px)' },
                    { opacity: 1, transform: 'translateY(0)' }
                ], {
                    duration: 440,
                    delay: 180,
                    easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
                    fill: 'backwards'
                });
            }

            // Завершение перехода: передача управления реальной карте
            const cleanup = () => {
                card.style.visibility = '';
                if (cardDrawStage) cardDrawStage.style.opacity = '';
                // Прокси убираем чуть позже: настоящая карта успевает отрисоваться под ним без мигания
                setTimeout(() => {
                    if (proxy.parentNode) proxy.remove();
                }, 60);
                triggerSoftHaptic();
                isTransitioningToRitual = false;
            };

            proxyAnim.finished.then(cleanup).catch(cleanup);

        } else {
            // Обычный переход при первом входе, prefers-reduced-motion или отсутствии анимации
            if (cooldownDashboard) cooldownDashboard.style.display = 'none';
            if (versionLabel) versionLabel.style.display = 'none';
            if (cardDrawStage) cardDrawStage.style.display = 'flex';
            window.scrollTo({ top: 0, behavior: 'auto' });
        }
    }

    function checkTimer() {
        const lastDraw = localStorage.getItem('lastDrawTime');
        if (lastDraw) {
            const lastDrawTs = parseInt(lastDraw, 10);
            if (!isNaN(lastDrawTs)) {
                const elapsed = Date.now() - lastDrawTs;
                if (elapsed >= 0 && elapsed < COOLDOWN_MS) {
                    const remaining = COOLDOWN_MS - elapsed;
                    startCountdown(remaining, lastDrawTs + COOLDOWN_MS);
                    if (!isFlipped && !window.isCardDrawing) {
                        showCooldownDashboard();
                    }
                    return false; 
                } else if (elapsed < 0) {
                    // Защита от перевода системных часов назад: корректируем точку отсчета
                    const nowTs = Date.now();
                    localStorage.setItem('lastDrawTime', nowTs.toString());
                    startCountdown(COOLDOWN_MS, nowTs + COOLDOWN_MS);
                    if (!isFlipped && !window.isCardDrawing) {
                        showCooldownDashboard();
                    }
                    return false;
                }
            }
        }
        if (countdownInterval) clearInterval(countdownInterval);
        if (!isFlipped && !window.isCardDrawing) {
            showSleepingDashboard();
        }
        return true; 
    }

    function startCountdown(duration, targetEndTime = Date.now() + duration) {
        if (countdownInterval) clearInterval(countdownInterval); 
        
        const updateTick = () => {
            const remain = targetEndTime - Date.now();
            if (remain <= 0) {
                clearInterval(countdownInterval);
                localStorage.removeItem('lastDrawTime');
                if (!isFlipped && !window.isCardDrawing) {
                    showSleepingDashboard();
                }
            } else {
                const formatted = formatTime(remain);
                if (cdCooldownTimeText) {
                    cdCooldownTimeText.innerText = formatted;
                }
            }
        };

        updateTick();
        countdownInterval = setInterval(updateTick, 1000);
    }

    function updatePracticeStreak() {
        const now = Date.now();
        const lastDrawStr = localStorage.getItem('practice_last_draw_time');
        let streak = parseInt(localStorage.getItem('practice_streak_count') || '1', 10);
        if (isNaN(streak) || streak < 1) {
            streak = 1;
        }

        if (!lastDrawStr) {
            streak = 1;
        } else {
            const lastTime = parseInt(lastDrawStr, 10);
            if (isNaN(lastTime)) {
                streak = 1;
            } else {
                const diffHours = (now - lastTime) / (1000 * 60 * 60);
                const isSameDay = new Date(now).toDateString() === new Date(lastTime).toDateString();

                if (isSameDay) {
                    // В тот же день стрик не увеличиваем
                } else if (diffHours <= 48) {
                    // Прошло меньше 48 часов и день другой -> +1
                    streak += 1;
                } else {
                    // Прошло больше 48 часов -> сброс на 1
                    streak = 1;
                }
            }
        }

        localStorage.setItem('practice_streak_count', streak.toString());
        localStorage.setItem('practice_last_draw_time', now.toString());
        return streak;
    }

    checkTimer();

    function saveCardToCollection(cardNum) {
        updatePracticeStreak();
        let collection = getNormalizedCollection();
        const existingIndex = collection.findIndex(c => c.id === cardNum);
        const now = new Date().toISOString();

        if (existingIndex !== -1) {
            collection[existingIndex].count += 1;
            collection[existingIndex].date = now;
        } else {
            collection.push({ id: cardNum, date: now, count: 1 });
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(collection));
        calculateSacredProgress();
    }

    function drawRandomCard() {
        if (!isFlipped && !window.isCardDrawing && !isCooldownActive()) {
            triggerMysticCardHaptic();
            window.isCardDrawing = true;
            if (drawCardBtn) {
                drawCardBtn.disabled = true;
                fadeOutButton(drawCardBtn);
            }
            // Подсказка-призыв мягко растворяется в момент касания карты
            if (cardTapPrompt) cardTapPrompt.classList.add('is-dissolved');
            if (typeof syncFieldCounterVisibility === 'function') {
                syncFieldCounterVisibility();
            };
            if (typeof window.hideEventTimer === 'function') {
                window.hideEventTimer();
            }
            setNewCard();
        }
    }

    function setNewCard() {
        const randomNum = Math.floor(Math.random() * TOTAL_CARDS) + 1;
        currentCardNumber = randomNum;
        currentCardPath = `images/${randomNum}.jpeg`; 
        if (cardResultImg) {
            let loadFailed = false;
            cardResultImg.onerror = () => {
                loadFailed = true;
                window.isCardDrawing = false;
                if (drawCardBtn) {
                    drawCardBtn.disabled = false;
                    drawCardBtn.style.display = 'block';
                }
                if (cardTapPrompt) cardTapPrompt.classList.remove('is-dissolved');
                if (typeof syncFieldCounterVisibility === 'function') {
                    syncFieldCounterVisibility();
                };
                alert("Не удалось загрузить карту. Пожалуйста, проверьте соединение с интернетом и попробуйте снова ✨");
            };

            // Сначала ждём загрузку: при ошибке сработает onerror, и кулдаун не запустится
            const imageLoaded = new Promise(resolve => { cardResultImg.onload = resolve; });
            cardResultImg.src = currentCardPath;
            // Декодируем картинку до переворота, чтобы анимация не подвисала посередине.
            // decode() может не завершиться в WebView, поэтому ждём его не дольше 2 секунд
            const imageReady = imageLoaded.then(() => {
                if (typeof cardResultImg.decode !== 'function') return;
                return Promise.race([
                    cardResultImg.decode().catch(() => {}),
                    new Promise(resolve => setTimeout(resolve, 2000))
                ]);
            });

            imageReady.then(() => {
                if (loadFailed) return;

                localStorage.setItem('lastDrawTime', Date.now().toString());
                localStorage.setItem('lastDrawnCardNumber', String(randomNum));

                const flipRevealed = window.playCardFlip
                    ? window.playCardFlip(card)
                    : (card.classList.add('flipped'), new Promise(resolve => setTimeout(resolve, 500)));
                isFlipped = true;

                saveCardToCollection(randomNum);

                // --- ОТПРАВКА ЦЕЛИ В ЯНДЕКС МЕТРИКУ: Выбор карты ---
                if (typeof ym !== 'undefined') {
                    ym(110909428, 'reachGoal', 'get_card');
                }

                if (typeof window.updateEventTimer === 'function') {
                    window.updateEventTimer();
                }

                flipRevealed.then(() => {
                    window.isCardDrawing = false;
                    if (typeof syncFieldCounterVisibility === 'function') {
                        syncFieldCounterVisibility();
                    };
                    if (openAudioFromCardBtn) revealButton(openAudioFromCardBtn, 0);
                    if (shareCardBtn) revealButton(shareCardBtn, 110);
                    if (typeof window.updateEventTimer === 'function') {
                        window.updateEventTimer();
                    }
                });
            });
        }
    }

    // Мягкое появление/исчезновение кнопок вокруг переворота карты
    const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function revealButton(btn, delay) {
        btn.style.display = 'block';
        if (typeof btn.animate !== 'function') return;
        const shift = prefersReducedMotion() ? 'none' : 'translateY(10px)';
        btn.animate([
            { opacity: 0, transform: shift },
            { opacity: 1, transform: 'none' }
        ], { duration: 520, delay, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'backwards' });
    }

    function fadeOutButton(btn) {
        if (typeof btn.animate !== 'function') {
            btn.style.display = 'none';
            return;
        }
        btn.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: 'ease-in' })
            .finished.then(() => { btn.style.display = 'none'; });
    }

    if (card) {
        card.addEventListener('click', drawRandomCard);
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                drawRandomCard();
            }
        });
    }
    if (drawCardBtn) {
        drawCardBtn.addEventListener('click', drawRandomCard);
    }
    if (cdDrawCardBtn) cdDrawCardBtn.addEventListener('click', openCardRitual);
    const cdTodaySleepingDeck = document.getElementById('cdTodaySleepingDeck');
    if (cdTodaySleepingDeck) cdTodaySleepingDeck.addEventListener('click', openCardRitual);

    // ==========================================
    // ЛОГИКА ШЕРИНГА И МЕНЮ ВЫБОРА (ОБЩАЯ)
    // ==========================================
    const shareOptionsModal = document.getElementById('shareOptionsModal');
    const closeShareModal = document.getElementById('closeShareModal');
    const shareToFriendBtn = document.getElementById('shareToFriendBtn');
    const shareToUniverseBtn = document.getElementById('shareToUniverseBtn');

    let activeSharePath = ""; 

    function openTelegramShare(shareText) {
        const encodedText = encodeURIComponent(shareText);
        const fullShareUrl = `https://t.me/share/url?url=&text=${encodedText}`;

        if (window.Telegram?.WebApp?.openTelegramLink) {
            window.Telegram.WebApp.openTelegramLink(fullShareUrl);
        } else {
            window.open(fullShareUrl, '_blank');
        }

        if (window.Telegram?.WebApp?.expand) {
            window.Telegram.WebApp.expand();
        }
    }

    shareCardBtn.addEventListener('click', () => {
        triggerSoftHaptic();
        activeSharePath = currentCardPath;
        shareOptionsModal.classList.add('active');
    });

    closeShareModal.addEventListener('click', () => {
        shareOptionsModal.classList.remove('active');
    });

    // --- НАДЕЖНАЯ ОТПРАВКА В ЛС ---
    shareToFriendBtn.addEventListener('click', () => {
        triggerSoftHaptic();
        if (typeof ym !== 'undefined') {
            ym(110909428, 'reachGoal', 'share_direct');
        }

        const shareText = `Привет! Нашла классное приложение по метафорическим картам ✨\nhttps://clck.ru/3VB8wu\n\nЗаходи в приложение: ${BOT_LINK}`;
        openTelegramShare(shareText);

        if (shareOptionsModal) {
            shareOptionsModal.classList.remove('active');
        }
    });

    // --- ОТПРАВКА КАРТОЧКИ В STORIES ---
    shareToUniverseBtn.addEventListener('click', () => {
        triggerSoftHaptic();
        if (typeof ym !== 'undefined') {
            ym(110909428, 'reachGoal', 'share_story');
        }

        shareToStories(activeSharePath); 
        shareOptionsModal.classList.remove('active');
    });

    function shareToStories(imagePath) {
        if (!window.Telegram || !window.Telegram.WebApp) {
            alert("Поделиться в Stories можно только внутри Telegram ✨");
            return;
        }

        const webApp = window.Telegram.WebApp;

        if (typeof webApp.shareToStory !== 'function' || !webApp.isVersionAtLeast('7.8')) {
            alert("Чтобы делиться в Stories, обновите Telegram ✨");
            return;
        }

        try {
            const absoluteMediaUrl = new URL(imagePath, window.location.href).toString();
            const params = {
                text: "Получи своё послание от Вселенной! @Djamilia_Kha ✨", 
                widget_link: { 
                    url: BOT_LINK, 
                    name: "Получить послание 💫" 
                }
            };
            webApp.shareToStory(absoluteMediaUrl, params);
        } catch (error) {
            console.error("Ошибка при вызове сторис:", error);
            alert("Не удалось открыть редактор сторис.");
        }
    }

    // ==========================================
    // ЛОГИКА ОТРИСОВКИ КОЛЛЕКЦИИ (СВАЙПЕР)
    // ==========================================
    let collectionSwiper = null; 

    function renderCollection() {
        calculateSacredProgress();
        let collection = getNormalizedCollection();
        const wrapper = document.getElementById('collectionWrapper');
        const emptyMsg = document.getElementById('emptyCollection');
        const swiperContainer = document.getElementById('collectionSwiperContainer');
        const timelineNav = document.getElementById('timelineNav');

        collection.sort((a, b) => new Date(b.date) - new Date(a.date));

        if (collection.length === 0) {
            emptyMsg.style.display = 'block';
            swiperContainer.style.display = 'none';
            timelineNav.style.display = 'none';
            return;
        }

        emptyMsg.style.display = 'none';
        swiperContainer.style.display = 'block';
        timelineNav.style.display = 'flex';
        
        wrapper.innerHTML = '';
        timelineNav.innerHTML = '';

        let monthsSet = new Set();
        let monthSlidesIndex = {}; 

        collection.forEach((item, index) => {
            const dateObj = new Date(item.date);
            const dateStr = dateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
            const monthStr = dateObj.toLocaleDateString('ru-RU', { month: 'long' });
            const monthCapitalized = monthStr.charAt(0).toUpperCase() + monthStr.slice(1);

            if (!monthsSet.has(monthCapitalized)) {
                monthsSet.add(monthCapitalized);
                monthSlidesIndex[monthCapitalized] = index; 
            }

            const imgPath = `images/${item.id}.jpeg`;
            
            let syncHtml = '';
            if (item.count > 1) {
                syncHtml = `<div class="sync-msg">Эта карта возвращалась к вам ${item.count} раза</div>`;
            }

            const slideHtml = `
                <div class="swiper-slide">
                    <div class="collection-date">${dateStr}</div>
                    <img src="${imgPath}" class="collection-card-img" alt="Карта ${item.id}" loading="lazy">
                    ${syncHtml}
                    <button class="action-btn share-btn collection-share-btn" data-path="${imgPath}">Поделиться картой 💫</button>
                </div>
            `;
            wrapper.insertAdjacentHTML('beforeend', slideHtml);
        });

        monthsSet.forEach((month, idx) => {
            const btnHtml = `<button class="month-btn ${idx === 0 ? 'active' : ''}" data-index="${monthSlidesIndex[month]}">${month}</button>`;
            timelineNav.insertAdjacentHTML('beforeend', btnHtml);
        });

        document.querySelectorAll('.collection-share-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                triggerSoftHaptic();
                activeSharePath = this.getAttribute('data-path'); 
                shareOptionsModal.classList.add('active'); 
            });
        });

        if (collectionSwiper) {
            collectionSwiper.destroy(true, true);
        }
        
        collectionSwiper = new Swiper(".collectionSwiper", {
            slidesPerView: 1,
            spaceBetween: 20,
            autoHeight: true,
            on: {
                slideChange: function () {
                    triggerSelectionHaptic();
                    updateActiveMonthBtn(this.activeIndex, monthSlidesIndex);
                }
            }
        });

        document.querySelectorAll('.month-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                triggerSelectionHaptic();
                const targetIndex = parseInt(this.getAttribute('data-index'));
                collectionSwiper.slideTo(targetIndex, 500); 
            });
        });
    }

    function updateActiveMonthBtn(currentIndex, indexMap) {
        let activeMonth = "";
        let maxIndexPassed = -1;

        for (const [month, index] of Object.entries(indexMap)) {
            if (currentIndex >= index && index > maxIndexPassed) {
                maxIndexPassed = index;
                activeMonth = month;
            }
        }

        document.querySelectorAll('.month-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.innerText === activeMonth) {
                btn.classList.add('active');
            }
        });
    }

    // ==========================================
    // ЛОГИКА ВОЗВРАТА В НАЧАЛО (СБРОС ПРАКТИКИ)
    // ==========================================
    const resetPracticeBtn = document.getElementById('resetPracticeBtn');
    const finalVideoPlayer = document.getElementById('finalVideoPlayer');
    const replayFinalVideo = document.getElementById('replayFinalVideo');
    const audioPlayer = document.getElementById('audioPlayer');
    const audioTitle = document.getElementById('audioTitle');
    const nextToVideoBtn = document.getElementById('nextToVideoBtn');
    const shareAudioBtn = document.getElementById('shareAudioBtn');
    const backToMainAfterAudioBtn = document.getElementById('backToMainAfterAudioBtn');
    let audioReplayMode = false; // true: аудио открыто повторно с главного экрана (без видеошага)
    let autoResetTimeout;

    function resetToStart() {
        if (autoResetTimeout) {
            clearTimeout(autoResetTimeout);
        }
        window.isCardDrawing = false;
        
        if (avatarVideo) {
            avatarVideo.pause();
        }
        if (audioPlayer) {
            audioPlayer.pause();
            audioPlayer.currentTime = 0;
        }
        if (finalVideoPlayer) {
            finalVideoPlayer.pause();
            finalVideoPlayer.currentTime = 0;
        }
        
        if (replayFinalVideo) replayFinalVideo.style.display = 'none'; 

        tabContents.forEach(c => c.classList.remove('active'));
        const dailySection = document.getElementById('daily');
        if (dailySection) dailySection.classList.add('active');
        
        if (step1_5Celestial) step1_5Celestial.style.display = 'none';
        if (step2Audio) step2Audio.style.display = 'none';
        if (step3Video) step3Video.style.display = 'none';
        if (step1Card) step1Card.style.display = 'block';
        const fcReset = document.getElementById('dailyFieldCounter');
        if (fcReset) fcReset.style.display = 'flex';
        
        if (card) {
            card.classList.remove('flipped');
            card.style.visibility = '';
        }
        isFlipped = false;
        isTransitioningToRitual = false;
        
        if (drawCardBtn) {
            drawCardBtn.disabled = false;
            drawCardBtn.style.display = 'block';
        }
        if (openCelestialBtn) openCelestialBtn.style.display = 'none';
        if (openAudioFromCardBtn) openAudioFromCardBtn.style.display = 'none';
        if (shareCardBtn) shareCardBtn.style.display = 'none';
        if (nextToVideoBtn) nextToVideoBtn.style.display = 'none';
        if (shareAudioBtn) shareAudioBtn.style.display = 'none';
        if (backToMainAfterAudioBtn) backToMainAfterAudioBtn.style.display = 'none';
        audioReplayMode = false;

        checkTimer();
        if (typeof syncFieldCounterVisibility === 'function') {
            syncFieldCounterVisibility();
        };
        if (typeof updateDailyFieldCounter === 'function') {
            updateDailyFieldCounter();
        }

        if (typeof window.updateEventTimer === 'function') {
            window.updateEventTimer();
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Кнопка «Энергии Вселенной» после видео: сразу открывает гид дня (возврат оттуда — «← Назад» на главный экран)
    resetPracticeBtn.addEventListener('click', () => {
        triggerSoftHaptic();
        resetToStart();
        if (typeof openCelestialFromDashboard === 'function') {
            openCelestialFromDashboard();
        }
    });

    // --- ШАГ 2: АУДИО И ПЕРЕХОД К ФИНАЛЬНОМУ ВИДЕО ---
    let currentAudioName = "";
    let finalVideoGoalSent = false; // защита от повторной отправки цели при пересмотре видео

    function startAudioForCurrentCard() {
        const availableTrackIds = (typeof CARD_TO_AUDIO_MAP !== 'undefined' && CARD_TO_AUDIO_MAP[currentCardNumber]) ? CARD_TO_AUDIO_MAP[currentCardNumber] : [1];
        // Трек закреплён за картой дня: ключ = время розыгрыша + номер карты
        const audioKey = (localStorage.getItem('lastDrawTime') || '0') + '_' + currentCardNumber;
        let targetAudioId = null;
        try {
            if (localStorage.getItem('lastAudioKey') === audioKey) {
                const savedId = parseInt(localStorage.getItem('lastAudioTrackId'), 10);
                if (availableTrackIds.includes(savedId)) targetAudioId = savedId;
            }
        } catch (e) {}
        if (targetAudioId === null) {
            targetAudioId = availableTrackIds[Math.floor(Math.random() * availableTrackIds.length)];
            try {
                localStorage.setItem('lastAudioKey', audioKey);
                localStorage.setItem('lastAudioTrackId', String(targetAudioId));
            } catch (e) {}
        }
        const selectedAudio = AUDIO_TRACKS_DATA.find(track => track.id === targetAudioId) || AUDIO_TRACKS_DATA[0];

        currentAudioName = selectedAudio.title;
        finalVideoGoalSent = false;
        if (audioTitle) audioTitle.innerText = `«${currentAudioName}»`;
        if (audioPlayer) {
            audioPlayer.src = `audio/${selectedAudio.id}.mp3`;
            audioPlayer.play().catch(err => console.log("Audio play blocked:", err));
        }
        if (avatarVideo) {
            if (!avatarVideo.src && avatarVideo.dataset.src) {
                avatarVideo.src = avatarVideo.dataset.src;
            }
            avatarVideo.play().catch(err => console.log("Видео заблокировано:", err));
        }
        if (nextToVideoBtn) nextToVideoBtn.style.display = audioReplayMode ? 'none' : 'block';
        if (backToMainAfterAudioBtn) backToMainAfterAudioBtn.style.display = audioReplayMode ? 'block' : 'none';
        if (shareAudioBtn) shareAudioBtn.style.display = 'block';
    }

    // --- ШАГ 1.5: ПОСЛАНИЕ НЕБЕС (АСТРОНОМИЧЕСКИЙ КОМПАС ПО МОСКВЕ UTC+3) ---
    function getDaysDeclension(n) {
        const abs = Math.abs(n) % 100;
        const n1 = abs % 10;
        if (abs > 10 && abs < 20) return 'дней';
        if (n1 > 1 && n1 < 5) return 'дня';
        if (n1 === 1) return 'день';
        return 'дней';
    }

    function buildMoonShadowPath(illumFraction, isWaning) {
        const R = 46.5;
        const topY = 50 - R;
        const botY = 50 + R;
        if (illumFraction >= 0.995) return '';
        if (illumFraction <= 0.005) {
            return `M 50 ${topY} A ${R} ${R} 0 1 0 50 ${botY} A ${R} ${R} 0 1 0 50 ${topY} Z`;
        }
        const rx = Math.round(Math.max(0.5, R * Math.abs(1 - 2 * illumFraction)) * 100) / 100;
        if (isWaning) {
            // Северное полушарие: Убывающая Луна («С») — свет слева, тень справа
            const outerSweep = 1;
            const innerSweep = illumFraction > 0.5 ? 0 : 1;
            return `M 50 ${topY} A ${R} ${R} 0 0 ${outerSweep} 50 ${botY} A ${rx} ${R} 0 0 ${innerSweep} 50 ${topY} Z`;
        } else {
            // Северное полушарие: Растущая Луна («Р») — свет справа, тень слева
            const outerSweep = 0;
            const innerSweep = illumFraction > 0.5 ? 1 : 0;
            return `M 50 ${topY} A ${R} ${R} 0 0 ${outerSweep} 50 ${botY} A ${rx} ${R} 0 0 ${innerSweep} 50 ${topY} Z`;
        }
    }

    // ==========================================
    // АВТОНОМНЫЙ МАТЕМАТИЧЕСКИЙ ДВИЖОК ЭФЕМЕРИД (2026–2028+)
    // ==========================================
    let skyActiveSlides = [];
    let skyCurrentSlideIdx = 0;
    let skyEventsInitialized = false;

    function normalizeDeg(deg) {
        return ((deg % 360) + 360) % 360;
    }

    function solveKepler(M_rad, e) {
        let E = M_rad + e * Math.sin(M_rad);
        for (let i = 0; i < 5; i++) {
            const dM = M_rad - (E - e * Math.sin(E));
            const dE = dM / (1 - e * Math.cos(E));
            E += dE;
            if (Math.abs(dE) < 1e-6) break;
        }
        return E;
    }

    function getHeliocentricPos(bodyKey, T) {
        const cfg = typeof CELESTIAL_CONFIG_DATA !== 'undefined' ? CELESTIAL_CONFIG_DATA : null;
        const keplerData = (cfg && cfg.PLANETARY_KEPLER_DATA) ? cfg.PLANETARY_KEPLER_DATA : null;
        if (!keplerData || !keplerData[bodyKey]) return { x: 0, y: 0, z: 0 };
        const el = keplerData[bodyKey];
        const toRad = Math.PI / 180;

        const a = el.a[0] + el.a[1] * T;
        const e = el.e[0] + el.e[1] * T;
        const I = (el.I[0] + el.I[1] * T) * toRad;
        const L = normalizeDeg(el.L[0] + el.L[1] * T);
        const wbar = normalizeDeg(el.wbar[0] + el.wbar[1] * T);
        const node = normalizeDeg(el.node[0] + el.node[1] * T) * toRad;

        const w = normalizeDeg(wbar - (el.node[0] + el.node[1] * T)) * toRad;
        const M = normalizeDeg(L - wbar) * toRad;

        const E = solveKepler(M, e);
        const xPrime = a * (Math.cos(E) - e);
        const yPrime = a * Math.sqrt(Math.max(0, 1 - e * e)) * Math.sin(E);

        const cosw = Math.cos(w), sinw = Math.sin(w);
        const cosNode = Math.cos(node), sinNode = Math.sin(node);
        const cosI = Math.cos(I), sinI = Math.sin(I);

        const xEcl = (cosw * cosNode - sinw * sinNode * cosI) * xPrime + (-sinw * cosNode - cosw * sinNode * cosI) * yPrime;
        const yEcl = (cosw * sinNode + sinw * cosNode * cosI) * xPrime + (-sinw * sinNode + cosw * cosNode * cosI) * yPrime;
        const zEcl = (sinw * sinI) * xPrime + (cosw * sinI) * yPrime;

        return { x: xEcl, y: yEcl, z: zEcl };
    }

    function getGeocentricPlanet(bodyKey, jd) {
        const T = (jd - 2451545.0) / 36525;
        const pPos = getHeliocentricPos(bodyKey, T);
        const ePos = getHeliocentricPos('earth', T);

        const dx = pPos.x - ePos.x;
        const dy = pPos.y - ePos.y;

        const toDeg = 180 / Math.PI;
        let lambda = Math.atan2(dy, dx) * toDeg;
        lambda = normalizeDeg(lambda);

        // Расчёт суточной скорости для фиксации ретроградности
        const T1 = (jd + 1 - 2451545.0) / 36525;
        const pPos1 = getHeliocentricPos(bodyKey, T1);
        const ePos1 = getHeliocentricPos('earth', T1);
        let lambda1 = Math.atan2(pPos1.y - ePos1.y, pPos1.x - ePos1.x) * toDeg;
        lambda1 = normalizeDeg(lambda1);

        let speed = lambda1 - lambda;
        if (speed > 180) speed -= 360;
        if (speed < -180) speed += 360;

        return {
            lambda,
            isRetrograde: speed < 0,
            dailySpeed: speed
        };
    }

    const ZODIAC_SIGNS_PREP = [
        'в Овне', 'в Тельце', 'в Близнецах', 'в Раке', 'во Льве', 'в Деве',
        'в Весах', 'в Скорпионе', 'в Стрельце', 'в Козероге', 'в Водолее', 'в Рыбах'
    ];

    const MONTHS_RU_GEN = [
        'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
        'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
    ];

    function getPlanetStatusAndUntil(bodyKey, startJd) {
        const cur = getGeocentricPlanet(bodyKey, startJd);
        const signIdx = Math.floor(cur.lambda / 30) % 12;

        let signUntilStr = '';
        for (let d = 1; d <= 240; d++) {
            const nextJd = startJd + d;
            const nextPos = getGeocentricPlanet(bodyKey, nextJd);
            const nextSignIdx = Math.floor(nextPos.lambda / 30) % 12;
            if (nextSignIdx !== signIdx) {
                const ms = (nextJd - 2440587.5) * 86400000;
                const dateObj = new Date(ms);
                signUntilStr = `до ${dateObj.getUTCDate()} ${MONTHS_RU_GEN[dateObj.getUTCMonth()]}`;
                break;
            }
        }

        let retroUntilStr = '';
        if (cur.isRetrograde) {
            for (let d = 1; d <= 90; d++) {
                const nextJd = startJd + d;
                const nextPos = getGeocentricPlanet(bodyKey, nextJd);
                if (!nextPos.isRetrograde) {
                    const ms = (nextJd - 2440587.5) * 86400000;
                    const dateObj = new Date(ms);
                    retroUntilStr = `до ${dateObj.getUTCDate()} ${MONTHS_RU_GEN[dateObj.getUTCMonth()]}`;
                    break;
                }
            }
        }

        return {
            lambda: cur.lambda,
            signIdx,
            signName: ZODIAC_SIGNS_PREP[signIdx],
            isRetrograde: cur.isRetrograde,
            signUntil: signUntilStr,
            retroUntil: retroUntilStr
        };
    }

    function buildSkyEventsSlides(jd, sunData, mskIsoDate) {
        const slides = [];

        // 1. Меркурий (вычисляется математически)
        const merc = getPlanetStatusAndUntil('mercury', jd);
        slides.push({
            id: 'mercury',
            icon: '☿',
            type: 'МЕРКУРИЙ',
            title: merc.isRetrograde ? 'ретроградный' : merc.signName,
            date: merc.isRetrograde ? merc.retroUntil : merc.signUntil,
            sideLabel: 'Меркурий'
        });

        // 2. Солнце (гарантированный базовый якорь, вычисляется математически)
        slides.push({
            id: 'sun',
            icon: '☉',
            type: 'СОЛНЦЕ',
            title: sunData ? sunData.name : 'в Скорпионе',
            date: sunData ? sunData.until : 'до 22 ноября',
            sideLabel: 'Солнце',
            isAlwaysActive: true
        });

        // 3. Марс (вычисляется математически)
        const mars = getPlanetStatusAndUntil('mars', jd);
        slides.push({
            id: 'mars',
            icon: '♂',
            type: mars.isRetrograde ? 'МАРС (РЕТРОГРАД)' : 'МАРС',
            title: mars.signName,
            date: mars.isRetrograde ? mars.retroUntil : mars.signUntil,
            sideLabel: 'Марс'
        });

        // 4. Венера (вычисляется математически)
        const ven = getPlanetStatusAndUntil('venus', jd);
        slides.push({
            id: 'venus',
            icon: '♀',
            type: ven.isRetrograde ? 'ВЕНЕРА (РЕТРОГРАД)' : 'ВЕНЕРА',
            title: ven.signName,
            date: ven.isRetrograde ? ven.retroUntil : ven.signUntil,
            sideLabel: 'Венера'
        });

        // 5. Юпитер / Парад планет (если несколько планет в одном знаке)
        const jup = getPlanetStatusAndUntil('jupiter', jd);
        if (jup.signIdx === mars.signIdx) {
            slides.push({
                id: 'parade',
                icon: '♃',
                type: 'ПАРАД ПЛАНЕТ',
                title: `Марс и Юпитер ${mars.signName}`,
                date: mars.signUntil,
                sideLabel: 'Парад'
            });
        }

        // 6. Проверка ближайших затмений (NASA Eclipse Catalog)
        const cfg = typeof CELESTIAL_CONFIG_DATA !== 'undefined' ? CELESTIAL_CONFIG_DATA : null;
        const eclipses = (cfg && cfg.ASTRONOMICAL_ECLIPSES_2026_2028) ? cfg.ASTRONOMICAL_ECLIPSES_2026_2028 : [];
        if (mskIsoDate) {
            for (let i = 0; i < eclipses.length; i++) {
                const ec = eclipses[i];
                const ecMs = Date.parse(ec.date + 'T00:00:00Z');
                const curMs = Date.parse(mskIsoDate + 'T00:00:00Z');
                const diffDays = Math.round((ecMs - curMs) / 86400000);
                if (diffDays >= -2 && diffDays <= 12) {
                    let dText = '';
                    if (diffDays === 0) dText = 'сегодня';
                    else if (diffDays === 1) dText = 'завтра';
                    else if (diffDays < 0) dText = 'прошло 2 дня назад';
                    else dText = `через ${diffDays} ${getDaysDeclension(diffDays)}`;
                    slides.push({
                        id: 'eclipse',
                        icon: '☾',
                        type: 'ЗАТМЕНИЕ',
                        title: ec.name,
                        date: dText,
                        sideLabel: 'Затмение'
                    });
                    break;
                }
            }
        }

        return slides;
    }

    function renderSkyWidgetSlide() {
        const total = skyActiveSlides.length;
        if (total === 0) return;

        const current = skyActiveSlides[skyCurrentSlideIdx];
        const prevIdx = (skyCurrentSlideIdx - 1 + total) % total;
        const nextIdx = (skyCurrentSlideIdx + 1) % total;

        const icoEl = document.getElementById('skyEventIco');
        const typeEl = document.getElementById('skyEventType');
        const titleEl = document.getElementById('skyEventTitle');
        const dateEl = document.getElementById('skyEventDate');
        const leftLabelEl = document.getElementById('skyNavLeftLabel');
        const rightLabelEl = document.getElementById('skyNavRightLabel');
        const dotsRow = document.getElementById('skyDotsRow');

        if (icoEl) icoEl.innerText = current.icon;
        if (typeEl) typeEl.innerText = current.type;
        if (titleEl) titleEl.innerText = current.title;
        if (dateEl) dateEl.innerText = current.date;

        if (leftLabelEl) leftLabelEl.innerText = skyActiveSlides[prevIdx].sideLabel;
        if (rightLabelEl) rightLabelEl.innerText = skyActiveSlides[nextIdx].sideLabel;

        if (dotsRow) {
            dotsRow.innerHTML = '';
            skyActiveSlides.forEach((_, idx) => {
                const dot = document.createElement('div');
                dot.className = `sky-dot ${idx === skyCurrentSlideIdx ? 'is-active' : ''}`;
                dot.setAttribute('role', 'button');
                dot.setAttribute('aria-label', `Событие ${idx + 1}`);
                dot.onclick = () => {
                    triggerSoftHaptic();
                    skyCurrentSlideIdx = idx;
                    renderSkyWidgetSlide();
                };
                dotsRow.appendChild(dot);
            });
        }
    }

    function prevSkyEvent() {
        const total = skyActiveSlides.length;
        if (total <= 1) return;
        triggerSoftHaptic();
        skyCurrentSlideIdx = (skyCurrentSlideIdx - 1 + total) % total;
        renderSkyWidgetSlide();
    }

    function nextSkyEvent() {
        const total = skyActiveSlides.length;
        if (total <= 1) return;
        triggerSoftHaptic();
        skyCurrentSlideIdx = (skyCurrentSlideIdx + 1) % total;
        renderSkyWidgetSlide();
    }

    function initSkyEventsWidget(jd, sunData, mskIsoDate) {
        skyActiveSlides = buildSkyEventsSlides(jd, sunData, mskIsoDate);

        // По требованию: открывается на «Солнце»
        const sunIdx = skyActiveSlides.findIndex(s => s.id === 'sun');
        skyCurrentSlideIdx = sunIdx !== -1 ? sunIdx : 0;

        renderSkyWidgetSlide();

        if (!skyEventsInitialized) {
            skyEventsInitialized = true;

            const prevBtn = document.getElementById('skyNavPrevBtn');
            const nextBtn = document.getElementById('skyNavNextBtn');
            if (prevBtn) prevBtn.addEventListener('click', prevSkyEvent);
            if (nextBtn) nextBtn.addEventListener('click', nextSkyEvent);

            const widgetEl = document.getElementById('skyEventsWidget');
            if (widgetEl) {
                let touchStartX = 0;
                let touchStartY = 0;
                widgetEl.addEventListener('touchstart', (e) => {
                    if (e.touches && e.touches[0]) {
                        touchStartX = e.touches[0].clientX;
                        touchStartY = e.touches[0].clientY;
                    }
                }, { passive: true });

                widgetEl.addEventListener('touchend', (e) => {
                    if (e.changedTouches && e.changedTouches[0]) {
                        const diffX = e.changedTouches[0].clientX - touchStartX;
                        const diffY = e.changedTouches[0].clientY - touchStartY;
                        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 36) {
                            if (diffX > 0) {
                                prevSkyEvent();
                            } else {
                                nextSkyEvent();
                            }
                        }
                    }
                }, { passive: true });
            }
        }
    }

    function renderCelestialStep() {
        const MSK_OFFSET_MS = 3 * 60 * 60 * 1000;
        const mskShifted = new Date(Date.now() + MSK_OFFSET_MS);
        const mskYear = mskShifted.getUTCFullYear();
        const mskMonth = mskShifted.getUTCMonth();
        const mskDay = mskShifted.getUTCDate();
        const mskIsoDate = `${mskYear}-${String(mskMonth + 1).padStart(2, '0')}-${String(mskDay).padStart(2, '0')}`;

        const monthsRu = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
        const dateEl = document.getElementById('celestialDateLabel');
        if (dateEl) {
            const dayStr = String(mskDay).padStart(2, '0');
            const monthStr = String(mskMonth + 1).padStart(2, '0');
            const yearStr = String(mskYear).slice(-2);
            dateEl.innerText = `${dayStr}.${monthStr}.${yearStr}`;
        }

        const cfg = typeof CELESTIAL_CONFIG_DATA !== 'undefined' ? CELESTIAL_CONFIG_DATA : null;

        // Опорный суточный срез на 09:00 МСК (06:00 UTC) для соответствия московскому лунному календарю
        const snapUtcMs = Date.UTC(mskYear, mskMonth, mskDay, 6, 0, 0);
        const jd = (snapUtcMs / 86400000) + 2440587.5;
        const T = (jd - 2451545.0) / 36525;
        const toRad = Math.PI / 180;

        // 1. Истинная эклиптическая долгота Солнца (алгоритм Жана Миуса)
        const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
        const M = 357.5291092 + 35999.0502909 * T - 0.0001537 * T * T;
        const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M * toRad)
                + (0.019993 - 0.000101 * T) * Math.sin(2 * M * toRad)
                + 0.000289 * Math.sin(3 * M * toRad);
        const omega = 125.04 - 1934.136 * T;
        let lambdaSun = L0 + C - 0.00569 - 0.00478 * Math.sin(omega * toRad);
        lambdaSun = ((lambdaSun % 360) + 360) % 360;

        const sunSignIdx = Math.floor(lambdaSun / 30) % 12;

        // Динамический расчёт даты смены знака Солнца вперед по суткам (алгоритм Миуса)
        let sunUntilDate = 'до 22 ноября';
        for (let d = 1; d <= 35; d++) {
            const nextT = ((jd + d) - 2451545.0) / 36525;
            const nextL0 = 280.46646 + 36000.76983 * nextT + 0.0003032 * nextT * nextT;
            const nextM = 357.5291092 + 35999.0502909 * nextT - 0.0001537 * nextT * nextT;
            const nextC = (1.914602 - 0.004817 * nextT - 0.000014 * nextT * nextT) * Math.sin(nextM * toRad)
                        + (0.019993 - 0.000101 * nextT) * Math.sin(2 * nextM * toRad)
                        + 0.000289 * Math.sin(3 * nextM * toRad);
            const nextOmega = 125.04 - 1934.136 * nextT;
            let nextLam = nextL0 + nextC - 0.00569 - 0.00478 * Math.sin(nextOmega * toRad);
            nextLam = ((nextLam % 360) + 360) % 360;
            if (Math.floor(nextLam / 30) % 12 !== sunSignIdx) {
                const targetMs = (snapUtcMs + d * 86400000);
                const dObj = new Date(targetMs);
                sunUntilDate = `до ${dObj.getUTCDate()} ${monthsRu[dObj.getUTCMonth()]}`;
                break;
            }
        }

        const sunData = {
            name: ZODIAC_SIGNS_PREP[sunSignIdx] || 'в Скорпионе',
            until: sunUntilDate
        };

        // Инициализация виджета событий на небе (открывается на «Солнце»)
        initSkyEventsWidget(jd, sunData, mskIsoDate);

        // 2. Геоцентрическая эклиптическая долгота Луны с периодическими возмущениями (Жан Миус)
        const Lp = 218.3164477 + 481267.88123421 * T - 0.0015786 * T * T;
        const D = 297.8501921 + 445267.1114034 * T - 0.0018819 * T * T;
        const Mp = 134.9633964 + 477198.8675055 * T + 0.0087414 * T * T;
        const F = 93.2720950 + 483202.0175233 * T - 0.0036539 * T * T;

        let lambdaMoon = Lp
            + 6.288774 * Math.sin(Mp * toRad)
            + 1.274027 * Math.sin((2 * D - Mp) * toRad)
            + 0.658314 * Math.sin(2 * D * toRad)
            + 0.213618 * Math.sin(2 * Mp * toRad)
            - 0.185116 * Math.sin(M * toRad)
            - 0.114332 * Math.sin(2 * F * toRad)
            + 0.058793 * Math.sin((2 * D - 2 * Mp) * toRad)
            + 0.057066 * Math.sin((2 * D - M - Mp) * toRad)
            + 0.053322 * Math.sin((2 * D + Mp) * toRad)
            + 0.045758 * Math.sin((2 * D - M) * toRad)
            - 0.040923 * Math.sin((M - Mp) * toRad)
            - 0.034720 * Math.sin(D * toRad)
            - 0.030383 * Math.sin((M + Mp) * toRad);
        lambdaMoon = ((lambdaMoon % 360) + 360) % 360;

        const moonSignIdx = Math.floor(lambdaMoon / 30) % 12;
        const moonSigns = (cfg && cfg.ZODIAC_MOON_SIGNS) ? cfg.ZODIAC_MOON_SIGNS : [
            'Овне', 'Тельце', 'Близнецах', 'Раке', 'Льве', 'Деве',
            'Весах', 'Скорпионе', 'Стрельце', 'Козероге', 'Водолее', 'Рыбах'
        ];
        const moonSign = moonSigns[moonSignIdx] || 'Близнецах';

        const elongation = ((lambdaMoon - lambdaSun) % 360 + 360) % 360;
        const illumFraction = (1 - Math.cos(elongation * toRad)) / 2;
        const illumination = Math.round(illumFraction * 100);
        const isWaning = elongation > 180;

        let phaseName = 'Убывающая Луна';
        if (elongation < 7 || elongation > 353) phaseName = 'Новолуние';
        else if (elongation < 83) phaseName = 'Растущий серп';
        else if (elongation < 97) phaseName = 'Первая четверть';
        else if (elongation < 173) phaseName = 'Растущая Луна';
        else if (elongation <= 187) phaseName = 'Полнолуние';
        else if (elongation < 263) phaseName = 'Убывающая Луна';
        else if (elongation < 277) phaseName = 'Третья четверть';
        else phaseName = 'Старая Луна';

        const lunarDay = Math.min(30, Math.max(1, Math.floor((elongation / 360) * 29.530588) + 1));
        const shadowD = buildMoonShadowPath(illumFraction, isWaning);

        const phaseEl = document.getElementById('celestialPhaseName');
        const illumEl = document.getElementById('celestialIlluminationText');
        const moonSignEl = document.getElementById('celestialMoonSignText');
        const shadowPathEl = document.getElementById('celestialMoonShadowPath');
        const moonLabelEl = document.querySelector('#step1_5-celestial .celestial-moon-label');

        if (moonLabelEl) moonLabelEl.innerText = `${lunarDay}-Й ЛУННЫЙ ДЕНЬ`;
        if (phaseEl) phaseEl.innerText = phaseName;
        if (illumEl) illumEl.innerText = `освещено ${illumination}%`;
        if (moonSignEl) moonSignEl.innerText = `Луна в ${moonSign}`;
        if (shadowPathEl) shadowPathEl.setAttribute('d', shadowD);

        // Синхронизация Луны-венца и виджета «Энергии Вселенной» на экране «Пространство дня»
        const dashShadowEl = document.getElementById('dashboardMoonShadowPath');
        const cdMoonPhaseName = document.getElementById('cdMoonPhaseName');
        const cdMoonMetaText = document.getElementById('cdMoonMetaText');
        if (dashShadowEl) {
            // Реальная астрономическая фаза текущего дня
            dashShadowEl.setAttribute('d', shadowD);
        }
        if (cdMoonPhaseName) cdMoonPhaseName.innerText = phaseName;
        if (cdMoonMetaText) cdMoonMetaText.innerText = 'Гид дня';

        if (typeof renderPersonalHoroscope === 'function') {
            renderPersonalHoroscope(mskIsoDate);
        }
        if (typeof fetchGasHoroscope === 'function') {
            fetchGasHoroscope(mskIsoDate);
        }

        // 2.5. Лунный гид: 4 энергии дня (Медитация, Красота, Дом, Дела)
        const elementIdx = moonSignIdx % 4; // 0: Огонь, 1: Земля, 2: Воздух, 3: Вода
        const meditationByElement = [
            'Практики активации внутренней силы, уверенности и ясности намерения',
            'Заземляющие медитации, телесное расслабление и благодарность телу',
            'Дыхательные практики, отпускание лишних мыслей и лёгкость ума',
            'Глубокие медитации на исцеление сердца, интуицию и внутренний покой'
        ];

        // 1. Медитация
        const meditationData = {
            title: 'Медитация и состояние',
            tag: 'Благоприятно',
            color: 'gold',
            desc: meditationByElement[elementIdx] || meditationByElement[0]
        };

        // 2. Красота и уход
        const goodHairSigns = [1, 4, 5, 6, 9]; // Телец, Лев, Дева, Весы, Козерог
        const neutralHairSigns = [2, 8, 10];   // Близнецы, Стрелец, Водолей
        let beautyData;
        if (goodHairSigns.includes(moonSignIdx)) {
            beautyData = {
                title: 'Стрижка и уход за собой',
                tag: 'Благоприятно',
                color: 'gold',
                desc: !isWaning
                    ? 'Отличный день для стрижки (волосы будут расти быстрее), окрашивания и бьюти-процедур'
                    : 'Благоприятно для стрижки (форма сохранится надолго), укрепления корней и ухода за кожей'
            };
        } else if (neutralHairSigns.includes(moonSignIdx)) {
            beautyData = {
                title: 'Стрижка и уход за собой',
                tag: 'Гармонично',
                color: 'purple',
                desc: 'Хорошо для лёгкой укладки, массажа лица, увлажняющих масок и обновления образа'
            };
        } else {
            beautyData = {
                title: 'Стрижка и уход за собой',
                tag: 'Бережно',
                color: 'terracotta',
                desc: 'Стрижку лучше отложить; день идеален для питательных масок, тёплой ванны и спа-отдыха'
            };
        }

        // 3. Дом и пространство
        let homeData;
        if (isWaning) {
            homeData = {
                title: 'Дом и пространство',
                tag: 'Благоприятно',
                color: 'gold',
                desc: 'Идеальное время для уборки, расхламления и очищения пространства свечой'
            };
        } else {
            homeData = {
                title: 'Дом и пространство',
                tag: 'Гармонично',
                color: 'purple',
                desc: 'Наполняйте дом уютом, цветами и красотой; тяжёлую уборку лучше перенести'
            };
        }

        // 4. Дела и общение
        let affairsData;
        if (elongation < 12 || elongation > 348) {
            affairsData = {
                title: 'Дела и общение',
                tag: 'День тишины',
                color: 'terracotta',
                desc: 'Время планирования и мечты: записывайте желания, но не спешите с резкими шагами'
            };
        } else if (elongation >= 170 && elongation <= 190) {
            affairsData = {
                title: 'Дела и общение',
                tag: 'Яркие эмоции',
                color: 'purple',
                desc: 'Творческий подъём и глубина чувств: избегайте споров, направьте энергию в созидание'
            };
        } else if (!isWaning) {
            affairsData = {
                title: 'Дела и общение',
                tag: 'Благоприятно',
                color: 'gold',
                desc: 'Энергия роста: начинайте новые проекты, назначайте важные встречи и проявляйтесь'
            };
        } else {
            affairsData = {
                title: 'Дела и общение',
                tag: 'Гармонично',
                color: 'purple',
                desc: 'Завершайте начатые дела, подводите итоги, проводите тёплые встречи с близкими'
            };
        }

        window.celestialDailyEnergies = {
            meditation: meditationData,
            beauty: beautyData,
            home: homeData,
            affairs: affairsData
        };

        const setCircleColor = (circleId, color) => {
            const el = document.getElementById(circleId);
            if (!el) return;
            el.classList.remove('celestial-energy-circle--gold', 'celestial-energy-circle--purple', 'celestial-energy-circle--terracotta');
            el.classList.add(`celestial-energy-circle--${color}`);
        };

        setCircleColor('cgCircleMeditation', meditationData.color);
        setCircleColor('cgCircleBeauty', beautyData.color);
        setCircleColor('cgCircleHome', homeData.color);
        setCircleColor('cgCircleAffairs', affairsData.color);

        if (typeof window.showCelestialEnergyDetail === 'function') {
            window.showCelestialEnergyDetail(window.activeCelestialEnergyKey || 'meditation');
        }

        // 3. Послание неба и Заземление по фазе Луны
        const phaseMessages = (cfg && cfg.CELESTIAL_MESSAGES_BY_PHASE) ? cfg.CELESTIAL_MESSAGES_BY_PHASE : {};
        const msgObj = phaseMessages[phaseName] || {
            message: 'Луна ещё полна сил, но уже учится отпускать. Всё, что вчера казалось важным, можно уложить на дно и не тащить в завтра. Вы точно молодцы.',
            grounding: 'Тёплый чай и пять минут у окна без телефона'
        };
        const msgTextEl = document.getElementById('celestialMessageText');
        const groundTextEl = document.getElementById('celestialGroundingText');
        if (msgTextEl) msgTextEl.innerText = msgObj.message;
        if (groundTextEl) groundTextEl.innerText = msgObj.grounding;

        // 5. Ближайший сакральный портал (зеркальные даты + Равноденствия и Солнцестояния)
        const portalsList = (cfg && cfg.SACRED_PORTALS_CALENDAR) ? cfg.SACRED_PORTALS_CALENDAR : [
            { name: '11:11', m: 10, d: 11 }
        ];
        const todayUtcStart = Date.UTC(mskYear, mskMonth, mskDay, 0, 0, 0);
        let nextPortal = { name: '11:11', countdown: 'через 14 дней' };

        outerLoop:
        for (let yOffset = 0; yOffset <= 1; yOffset++) {
            const targetYear = mskYear + yOffset;
            for (let i = 0; i < portalsList.length; i++) {
                const p = portalsList[i];
                const pUtcStart = Date.UTC(targetYear, p.m, p.d, 0, 0, 0);
                const diffDays = Math.round((pUtcStart - todayUtcStart) / 86400000);
                if (diffDays >= 0) {
                    let cdText = '';
                    if (diffDays === 0) cdText = 'сегодня';
                    else if (diffDays === 1) cdText = 'завтра';
                    else cdText = `через ${diffDays} ${getDaysDeclension(diffDays)}`;
                    nextPortal = { name: p.name, countdown: cdText };
                    break outerLoop;
                }
            }
        }

        const portalNameEl = document.getElementById('celestialPortalName');
        const portalDaysEl = document.getElementById('celestialPortalCountdown');
        // Зеркальные даты показываем как даты («11:11» → «11.11»), длинные названия — мельче
        const portalLabel = String(nextPortal.name).replace(/^(\d{2}):(\d{2})$/, '$1.$2');
        if (portalNameEl) {
            portalNameEl.innerText = portalLabel;
            portalNameEl.classList.toggle('is-long', portalLabel.length > 6);
        }
        if (portalDaysEl) portalDaysEl.innerText = nextPortal.countdown;
    }

    // --- ИНТЕРАКТИВНЫЙ ЛУННЫЙ ГИД: 4 ЭНЕРГИИ ДНЯ ---
    window.activeCelestialEnergyKey = 'meditation';

    function showCelestialEnergyDetail(key) {
        if (!window.celestialDailyEnergies || !window.celestialDailyEnergies[key]) return;
        window.activeCelestialEnergyKey = key;
        const data = window.celestialDailyEnergies[key];

        const titleEl = document.getElementById('cgDetailTitle');
        const tagEl = document.getElementById('cgDetailTag');
        const descEl = document.getElementById('cgDetailDesc');
        const detailCard = document.getElementById('celestialEnergyDetail');

        document.querySelectorAll('.celestial-energy-btn').forEach(btn => {
            btn.classList.toggle('is-active', btn.getAttribute('data-energy') === key);
        });

        if (!titleEl || !tagEl || !descEl) return;

        if (detailCard && typeof detailCard.animate === 'function') {
            detailCard.animate([
                { opacity: 0.5, transform: 'translateY(2px)' },
                { opacity: 1, transform: 'translateY(0)' }
            ], { duration: 180, easing: 'ease-out' });
        }

        titleEl.innerText = data.title;
        tagEl.innerText = data.tag;
        tagEl.className = `celestial-harmony-tag celestial-harmony-tag--${data.color}`;
        descEl.innerText = data.desc;
    }
    window.showCelestialEnergyDetail = showCelestialEnergyDetail;

    document.querySelectorAll('.celestial-energy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const energyKey = btn.getAttribute('data-energy');
            if (energyKey) {
                triggerSoftHaptic();
                showCelestialEnergyDetail(energyKey);
            }
        });
    });

    // --- ПЕРЕХОДЫ ПО РАЗДЕЛАМ И ШАГАМ ПРАКТИКИ ---
    function startAudioStep() {
        triggerSoftHaptic();
        if (step1Card) step1Card.style.display = 'none';
        if (step1_5Celestial) step1_5Celestial.style.display = 'none';
        if (typeof syncFieldCounterVisibility === 'function') {
            syncFieldCounterVisibility();
        }
        const fcStep2 = document.getElementById('dailyFieldCounter');
        if (fcStep2) fcStep2.style.display = 'none';
        if (step2Audio) step2Audio.style.display = 'flex';
        setHeaderTitle('Аудиопослание');
        startAudioForCurrentCard();
        if (typeof window.updateEventTimer === 'function') {
            window.updateEventTimer();
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    if (openAudioFromCardBtn) {
        openAudioFromCardBtn.addEventListener('click', () => { audioReplayMode = false; startAudioStep(); });
    }

    if (nextToAudioBtn) {
        nextToAudioBtn.addEventListener('click', () => { audioReplayMode = false; startAudioStep(); });
    }

    // «Слушать практику» на главном экране: повтор только аудио, без видеошага
    if (cdReplayAudioBtn) {
        cdReplayAudioBtn.addEventListener('click', () => { audioReplayMode = true; startAudioStep(); });
    }

    if (cdShareCardBtn) {
        cdShareCardBtn.addEventListener('click', () => {
            triggerSoftHaptic();
            updateTodayCardOnDashboard();
            activeSharePath = currentCardPath;
            if (shareOptionsModal) shareOptionsModal.classList.add('active');
        });
    }

    if (cdVipResetBtn) {
        cdVipResetBtn.addEventListener('click', () => {
            triggerSoftHaptic();
            if (countdownInterval) clearInterval(countdownInterval);
            localStorage.removeItem('lastDrawTime');
            showSleepingDashboard();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    function openCelestialFromDashboard(e) {
        if (e && typeof e.stopPropagation === 'function') {
            e.stopPropagation();
        }
        if (isDashboardSleeping()) {
            triggerSoftHaptic();
            showVeilBubble('cdCelestialGateBubble');
            return;
        }
        triggerSelectionHaptic();
        renderCelestialStep();
        if (step1Card) step1Card.style.display = 'none';
        if (step1_5Celestial) step1_5Celestial.style.display = 'block';
        setHeaderTitle('Послание небес');
        if (typeof syncFieldCounterVisibility === 'function') {
            syncFieldCounterVisibility();
        }
        if (typeof window.hideEventTimer === 'function') {
            window.hideEventTimer();
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function openCollectionFromDashboard() {
        hideAllVeilBubbles();
        triggerSelectionHaptic();
        tabContents.forEach(c => c.classList.remove('active'));
        const colSec = document.getElementById('collection');
        if (colSec) colSec.classList.add('active');
        setHeaderTitle('Моя коллекция');
        renderCollection();
        if (typeof syncFieldCounterVisibility === 'function') {
            syncFieldCounterVisibility();
        }
        if (typeof window.hideEventTimer === 'function') {
            window.hideEventTimer();
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function openVideoFromDashboard(e) {
        if (e && typeof e.stopPropagation === 'function') {
            e.stopPropagation();
        }
        if (isDashboardSleeping()) {
            triggerSoftHaptic();
            showVeilBubble('cdVideoGateBubble');
            return;
        }
        triggerSelectionHaptic();
        tabContents.forEach(c => c.classList.remove('active'));
        const vidSec = document.getElementById('video');
        if (vidSec) vidSec.classList.add('active');
        setHeaderTitle('Видеотека');
        if (typeof syncFieldCounterVisibility === 'function') {
            syncFieldCounterVisibility();
        }
        if (typeof window.hideEventTimer === 'function') {
            window.hideEventTimer();
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    document.addEventListener('click', (e) => {
        if (!e.target) return;
        const clickedLocked = e.target.closest('#cooldownCelestialFullCard, #cooldownVideoWidget');
        if (!clickedLocked) {
            hideAllVeilBubbles();
        }
    });

    function bindWidgetActivation(el, handler) {
        if (!el) return;
        el.addEventListener('click', handler);
        el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handler();
            }
        });
    }

    const cooldownHoroscopeWidget = document.getElementById('cooldownHoroscopeWidget');
    const cooldownCelestialFullCard = document.getElementById('cooldownCelestialFullCard');
    const cooldownGratitudeWidget = document.getElementById('cooldownGratitudeWidget');
    const cdGratitudeBtn = document.getElementById('cdGratitudeBtn');

    bindWidgetActivation(cooldownMoonWidget, openCelestialFromDashboard);
    bindWidgetActivation(cooldownHoroscopeWidget, openCelestialFromDashboard);
    bindWidgetActivation(cooldownCelestialFullCard, openCelestialFromDashboard);
    bindWidgetActivation(cooldownCollectionWidget, openCollectionFromDashboard);
    bindWidgetActivation(cooldownVideoWidget, openVideoFromDashboard);

    // ==========================================
    // МОДУЛЬ: ПЕРСОНАЛЬНЫЙ ГОРОСКОП И ВЫБОР ЗНАКА В 1 КЛИК
    // ==========================================
    const ZODIAC_STORAGE_KEY = 'mystic_zodiac_sign';
    const zodiacSelectModal = document.getElementById('zodiacSelectModal');
    const closeZodiacModal = document.getElementById('closeZodiacModal');
    const zodiacSignsGrid = document.getElementById('zodiacSignsGrid');
    const zodiacPreviewHead = document.getElementById('zodiacPreviewHead');
    const zodiacPreviewText = document.getElementById('zodiacPreviewText');
    const zodiacOpenCelestialBtn = document.getElementById('zodiacOpenCelestialBtn');
    const celestialChangeSignBtn = document.getElementById('celestialChangeSignBtn');
    const zodiacModalPreview = document.getElementById('zodiacModalPreview');
    const zodiacModalTitle = document.getElementById('zodiacModalTitle');
    const zodiacModalSub = document.getElementById('zodiacModalSub');
    const zodiacSectionLabel = document.getElementById('zodiacSectionLabel');
    const zodiacSectionLabelText = document.getElementById('zodiacSectionLabelText');

    // ==========================================
    // КЭШ И ЗАГРУЗКА AI-ГОРОСКОПА ИЗ GOOGLE APPS SCRIPT
    // ==========================================
    const GAS_HOROSCOPE_CACHE_PREFIX = 'mystic_gas_horoscope_';
    let isFetchingGasHoroscope = false;

    function getCachedGasHoroscope(dateKey) {
        try {
            const raw = localStorage.getItem(GAS_HOROSCOPE_CACHE_PREFIX + dateKey);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object') return parsed;
        } catch (_) {}
        return null;
    }

    function saveCachedGasHoroscope(dateKey, items) {
        try {
            localStorage.setItem(GAS_HOROSCOPE_CACHE_PREFIX + dateKey, JSON.stringify(items));
        } catch (_) {}
    }

    function fetchGasHoroscope(dateKey) {
        if (isFetchingGasHoroscope) return;
        const effectiveDateKey = dateKey || (typeof getMskDateInfo === 'function' ? getMskDateInfo().dateKey : '2026-10-31');

        if (getCachedGasHoroscope(effectiveDateKey)) return;

        const endpoint = (typeof EVENT_CONFIG !== 'undefined' && (EVENT_CONFIG.horoscopeScriptUrl || EVENT_CONFIG.appsScriptUrl))
            ? (EVENT_CONFIG.horoscopeScriptUrl || EVENT_CONFIG.appsScriptUrl)
            : null;

        if (!endpoint) return;

        isFetchingGasHoroscope = true;

        fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action: 'getHoroscope' })
        })
        .then(res => res.json())
        .then(data => {
            isFetchingGasHoroscope = false;
            if (data && data.status === 'success' && data.items && typeof data.items === 'object') {
                saveCachedGasHoroscope(effectiveDateKey, data.items);
                renderPersonalHoroscope(effectiveDateKey);
            }
        })
        .catch(err => {
            isFetchingGasHoroscope = false;
            console.warn('GAS Horoscope fetch error (using fallback):', err);
        });
    }

    function getZodiacList() {
        const cfg = typeof CELESTIAL_CONFIG_DATA !== 'undefined' ? CELESTIAL_CONFIG_DATA : null;
        return (cfg && Array.isArray(cfg.ZODIAC_HOROSCOPE_DATA)) ? cfg.ZODIAC_HOROSCOPE_DATA : [];
    }

    function getSelectedZodiacObj() {
        const list = getZodiacList();
        if (!list.length) return null;
        const savedKey = localStorage.getItem(ZODIAC_STORAGE_KEY);
        if (!savedKey) return null;
        return list.find(z => z.key === savedKey) || null;
    }

    function getDailyHoroscopeMessage(signObj, dateStr) {
        if (!signObj) {
            return 'Сегодня космический поток бережно поддерживает ваши искренние намерения.';
        }
        const effectiveDateKey = dateStr || (typeof getMskDateInfo === 'function' ? getMskDateInfo().dateKey : '2026-10-31');

        // 1. Проверяем свежий авторский AI-гороскоп из Google Apps Script
        const gasCached = getCachedGasHoroscope(effectiveDateKey);
        if (gasCached && gasCached[signObj.key]) {
            const item = gasCached[signObj.key];
            const liveText = (item && typeof item === 'object') ? item.text : (typeof item === 'string' ? item : '');
            if (liveText && liveText.trim()) {
                return liveText.trim();
            }
        }

        // 2. Бесшовный fallback: статические тексты из базы appData.js
        if (!Array.isArray(signObj.messages) || !signObj.messages.length) {
            return 'Сегодня космический поток бережно поддерживает ваши искренние намерения.';
        }
        const seedStr = `${effectiveDateKey}_${signObj.key}`;
        let hash = 0;
        for (let i = 0; i < seedStr.length; i++) {
            hash = ((hash << 5) - hash) + seedStr.charCodeAt(i);
            hash |= 0;
        }
        const idx = Math.abs(hash) % signObj.messages.length;
        return signObj.messages[idx];
    }

    function renderPersonalHoroscope(mskIsoDate) {
        const signObj = getSelectedZodiacObj();

        const glyphEl = document.getElementById('cdHoroscopeGlyph');
        const titleEl = document.getElementById('cdHoroscopeTitle');
        const datesEl = document.getElementById('cdHoroscopeDates');

        const cGlyph = document.getElementById('celestialHoroscopeGlyph');
        const cTitle = document.getElementById('celestialHoroscopeTitle');
        const cElem = document.getElementById('celestialHoroscopeElement');
        const cFirstP = document.getElementById('celestialHoroscopeFirstP');
        const cRestP = document.getElementById('celestialHoroscopeRestP');
        const cAff = document.getElementById('celestialHoroscopeAffirmation');
        const cCard = document.getElementById('celestialHoroscopeCard');
        const cToggleBtn = document.getElementById('celestialHoroscopeToggleBtn');
        const cText = document.getElementById('celestialHoroscopeText');

        // Если знак ещё не выбран пользователем — показываем деликатную заглушку на главном экране
        if (!signObj) {
            const defaultStarSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6.4-4.8-6.4 4.8 2.4-7.2-6-4.8h7.6z"/></svg>';
            if (glyphEl) glyphEl.innerHTML = defaultStarSvg;
            if (titleEl) titleEl.innerText = 'Гороскоп';
            if (datesEl) datesEl.innerText = 'Выберите знак';

            if (cGlyph) cGlyph.innerHTML = defaultStarSvg;
            if (cTitle) cTitle.innerText = 'Выберите свой знак';
            if (cElem) cElem.innerText = '12 знаков Зодиака';
            if (cCard) cCard.classList.add('is-empty');
            if (celestialChangeSignBtn && celestialChangeSignBtn.firstElementChild) {
                celestialChangeSignBtn.firstElementChild.innerText = 'Выбрать знак';
            }
            const defaultPrompt = 'Выберите знак Зодиака, чтобы открыть персональное послание звёзд на сегодня.';
            if (cFirstP) cFirstP.innerText = defaultPrompt;
            if (cRestP) {
                cRestP.innerText = '';
                cRestP.style.display = 'none';
            }
            if (cText) cText.innerText = defaultPrompt;
            if (cAff) cAff.innerText = '«Звёзды освещают путь тем, кто слышит своё сердце.»';
            if (cToggleBtn) cToggleBtn.style.display = 'none';
            if (cCard) cCard.classList.remove('is-expanded');

            // В модалке выбора знака показываем аккуратную подсказку
            if (zodiacModalTitle) zodiacModalTitle.innerText = 'Ваш знак Зодиака';
            if (zodiacModalSub) {
                zodiacModalSub.style.display = 'block';
                zodiacModalSub.innerText = 'Выберите свой знак в сетке — приложение запомнит его для ежедневного прогноза ✨';
            }
            if (zodiacModalPreview) zodiacModalPreview.style.display = 'none';
            if (zodiacSectionLabel) zodiacSectionLabel.style.display = 'none';

            if (zodiacSignsGrid) {
                zodiacSignsGrid.querySelectorAll('.zodiac-sign-btn').forEach(btn => btn.classList.remove('is-selected'));
            }
            return;
        }

        if (cCard) cCard.classList.remove('is-empty');
        if (celestialChangeSignBtn && celestialChangeSignBtn.firstElementChild) {
            celestialChangeSignBtn.firstElementChild.innerText = 'Сменить знак';
        }

        const dateKey = mskIsoDate || getMskDateInfo().dateKey;
        const dailyMsg = getDailyHoroscopeMessage(signObj, dateKey);

        // 1. Обновление правой половины сплит-виджета на главном экране
        if (glyphEl) glyphEl.innerHTML = signObj.svg || signObj.glyph;
        if (titleEl) titleEl.innerText = 'Гороскоп';
        if (datesEl) {
            datesEl.innerText = `${signObj.name} • ${signObj.dates}`;
        }

        // 2. Обновление интегрированной карточки гороскопа внутри #step1_5-celestial
        if (cGlyph) cGlyph.innerHTML = signObj.svg || signObj.glyph;
        if (cTitle) cTitle.innerText = `${signObj.name} • ${signObj.dates}`;
        if (cElem) cElem.innerText = signObj.element;

        // Разделение сообщения на первый абзац и раскрываемое продолжение
        const cleanMsg = (dailyMsg || '').trim();
        const paragraphs = cleanMsg.split(/\n\s*\n/);
        const firstPText = paragraphs[0] || cleanMsg;
        const restPText = paragraphs.slice(1).join('\n\n').trim();

        if (cFirstP) cFirstP.innerText = firstPText;
        if (cRestP) {
            cRestP.innerText = restPText;
            cRestP.style.display = restPText ? 'block' : 'none';
        }
        if (cText) cText.innerText = cleanMsg;
        if (cAff) {
            if (signObj.affirmation) {
                cAff.innerText = `«${signObj.affirmation}»`;
                cAff.style.display = 'block';
            } else {
                cAff.style.display = 'none';
            }
        }

        const hasMoreContent = Boolean(restPText || (signObj && signObj.affirmation));
        if (cToggleBtn) {
            cToggleBtn.style.display = hasMoreContent ? 'flex' : 'none';
            cToggleBtn.setAttribute('aria-expanded', cCard && cCard.classList.contains('is-expanded') ? 'true' : 'false');
        }

        // 3. Обновление модального окна выбора знака
        if (zodiacModalTitle) zodiacModalTitle.innerText = 'Сменить знак Зодиака';
        if (zodiacModalSub) {
            zodiacModalSub.style.display = 'block';
            zodiacModalSub.innerText = 'Выберите свой знак в сетке — приложение запомнит его и обновит гороскоп';
        }
        if (zodiacModalPreview) zodiacModalPreview.style.display = 'none';
        if (zodiacSectionLabel) zodiacSectionLabel.style.display = 'none';

        // Подсветка активной кнопки в сетке 12 знаков
        if (zodiacSignsGrid) {
            zodiacSignsGrid.querySelectorAll('.zodiac-sign-btn').forEach(btn => {
                btn.classList.toggle('is-selected', btn.getAttribute('data-sign') === signObj.key);
            });
        }
    }

    function buildZodiacModalGrid() {
        if (!zodiacSignsGrid) return;
        const list = getZodiacList();
        zodiacSignsGrid.innerHTML = '';
        const currentObj = getSelectedZodiacObj();

        list.forEach(sign => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `zodiac-sign-btn ${currentObj && currentObj.key === sign.key ? 'is-selected' : ''}`;
            btn.setAttribute('data-sign', sign.key);
            btn.setAttribute('aria-label', `${sign.name}, ${sign.dates}`);
            btn.innerHTML = `
                <span class="zodiac-btn-glyph" aria-hidden="true">${sign.svg || sign.glyph}</span>
                <span class="zodiac-btn-name">${sign.name}</span>
                <span class="zodiac-btn-dates">${sign.dates}</span>
            `;
            btn.addEventListener('click', () => {
                triggerSelectionHaptic();
                localStorage.setItem(ZODIAC_STORAGE_KEY, sign.key);
                trackGoal('select_zodiac', { sign: sign.key });
                if (horoscopeCard) {
                    horoscopeCard.classList.remove('is-expanded');
                    if (horoscopeToggleBtn) horoscopeToggleBtn.setAttribute('aria-expanded', 'false');
                }
                renderPersonalHoroscope();
                closeZodiacSelectModal();
            });
            zodiacSignsGrid.appendChild(btn);
        });
    }

    function openZodiacModal() {
        triggerSoftHaptic();
        if (typeof fetchGasHoroscope === 'function') {
            fetchGasHoroscope();
        }
        if (zodiacSignsGrid && !zodiacSignsGrid.children.length) {
            buildZodiacModalGrid();
        }
        renderPersonalHoroscope();
        if (zodiacSelectModal) {
            zodiacSelectModal.classList.add('active');
        }
    }

    function closeZodiacSelectModal() {
        if (zodiacSelectModal) {
            zodiacSelectModal.classList.remove('active');
        }
    }

    if (celestialChangeSignBtn) {
        celestialChangeSignBtn.addEventListener('click', openZodiacModal);
    }
    if (closeZodiacModal) {
        closeZodiacModal.addEventListener('click', closeZodiacSelectModal);
    }
    if (zodiacSelectModal) {
        zodiacSelectModal.addEventListener('click', (e) => {
            if (e.target === zodiacSelectModal) closeZodiacSelectModal();
        });
    }
    if (zodiacOpenCelestialBtn) {
        zodiacOpenCelestialBtn.addEventListener('click', () => {
            closeZodiacSelectModal();
            openCelestialFromDashboard();
        });
    }

    const horoscopeToggleBtn = document.getElementById('celestialHoroscopeToggleBtn');
    const horoscopeCard = document.getElementById('celestialHoroscopeCard');
    if (horoscopeToggleBtn && horoscopeCard) {
        horoscopeToggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            triggerSoftHaptic();
            const isExpanded = horoscopeCard.classList.toggle('is-expanded');
            horoscopeToggleBtn.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
        });
    }

    // ==========================================
    // МОДУЛЬ: ЧАША БЛАГОДАРНОСТИ • ЭНЕРГООБМЕН (CloudTips)
    // ==========================================
    function openGratitudeDonation(e) {
        if (e) e.stopPropagation();
        triggerSoftHaptic();
        trackGoal('donation_click');
        const url = (typeof EVENT_CONFIG !== 'undefined' && EVENT_CONFIG.donationLink)
            ? EVENT_CONFIG.donationLink
            : 'https://pay.cloudtips.ru/p/f430db35';
        if (window.Telegram?.WebApp?.openLink) {
            try {
                window.Telegram.WebApp.openLink(url);
                return;
            } catch (_) {}
        }
        window.open(url, '_blank', 'noopener');
    }

    bindWidgetActivation(cooldownGratitudeWidget, openGratitudeDonation);
    if (cdGratitudeBtn) {
        cdGratitudeBtn.addEventListener('click', openGratitudeDonation);
    }

    // Инициализируем персональный гороскоп при старте
    renderPersonalHoroscope();
    if (typeof fetchGasHoroscope === 'function') {
        fetchGasHoroscope();
    }

    if (openCelestialBtn) {
        openCelestialBtn.addEventListener('click', openCelestialFromDashboard);
    }

    if (backToMainAfterAudioBtn) {
        backToMainAfterAudioBtn.addEventListener('click', () => {
            triggerSoftHaptic();
            resetToStart();
        });
    }

    [backToCardBtn, backFromCelestialTopBtn, backFromCollectionBtn, backFromVideoBtn].forEach(btn => {
        if (btn) {
            btn.addEventListener('click', () => {
                triggerSoftHaptic();
                resetToStart();
            });
        }
    });

    if (nextToVideoBtn) {
        nextToVideoBtn.addEventListener('click', () => {
            triggerSoftHaptic();
            if (audioPlayer) audioPlayer.pause();
            if (avatarVideo) avatarVideo.pause();
            transitionToStep3();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    if (shareAudioBtn) {
        shareAudioBtn.addEventListener('click', () => {
            triggerSoftHaptic();
            trackGoal('share_audio', { track: currentAudioName });
            const text = `🎧 Я прослушала трансформационное послание «${currentAudioName}». Узнай, что Вселенная хочет сказать тебе:\n${BOT_LINK}`;
            openTelegramShare(text);
        });
    }

    // Автопереход к третьему шагу (Финальное Видео)
    const finalVideoContainer = document.getElementById('finalVideoContainer');

    function transitionToStep3() {
        if (!step2Audio || step2Audio.style.display === 'none') return;

        if (avatarVideo) {
            avatarVideo.pause();
        }

        step2Audio.style.display = 'none';
        if (step3Video) step3Video.style.display = 'flex';
        setHeaderTitle('Видеопослание');
        window.scrollTo({ top: 0, behavior: 'auto' });
        
        // === ИСПОЛЬЗУЕМ ДАННЫЕ ИЗ appData.js ===
        if (typeof FINAL_VIDEOS_DATA !== 'undefined' && FINAL_VIDEOS_DATA.length > 0) {
            const randomFinalVideo = FINAL_VIDEOS_DATA[Math.floor(Math.random() * FINAL_VIDEOS_DATA.length)];
            if (finalVideoPlayer) {
                finalVideoPlayer.src = randomFinalVideo;
                finalVideoPlayer.volume = 1.0;
            }
        }
        
        if (replayFinalVideo) replayFinalVideo.style.display = 'none'; 
        
        if (finalVideoPlayer) {
            finalVideoPlayer.play().catch(() => {
                if (replayFinalVideo) replayFinalVideo.style.display = 'flex';
            });
        }
    }

    // --- Свой плеер: кнопка ▶/❚❚, полоса перемотки и время поверх того же <audio id="audioPlayer"> ---
    (function initCustomAudioPlayer() {
        const playerCard = document.getElementById('v2Player');
        const playBtn = document.getElementById('v2PlayBtn');
        const seek = document.getElementById('v2Seek');
        const timeEl = document.getElementById('v2Time');
        if (!audioPlayer || !playerCard || !playBtn || !seek || !timeEl) return;

        const fmt = (s) => {
            if (!isFinite(s) || s < 0) return '0:00';
            return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
        };
        let dragging = false;

        function sync() {
            const d = audioPlayer.duration;
            const hasDur = isFinite(d) && d > 0;
            if (!dragging) seek.value = hasDur ? (audioPlayer.currentTime / d) * 100 : 0;
            seek.style.setProperty('--p', `${seek.value}%`);
            timeEl.textContent = hasDur ? `${fmt(audioPlayer.currentTime)} / ${fmt(d)}` : fmt(audioPlayer.currentTime);
        }
        function setPlaying(isPlaying) {
            playerCard.classList.toggle('is-playing', isPlaying);
            playBtn.setAttribute('aria-label', isPlaying ? 'Пауза' : 'Воспроизвести');
        }

        ['timeupdate', 'loadedmetadata', 'durationchange', 'emptied'].forEach(ev => audioPlayer.addEventListener(ev, sync));
        audioPlayer.addEventListener('play', () => setPlaying(true));
        audioPlayer.addEventListener('pause', () => setPlaying(false));
        audioPlayer.addEventListener('ended', () => setPlaying(false));

        playBtn.addEventListener('click', () => {
            triggerSoftHaptic();
            if (audioPlayer.paused) {
                audioPlayer.play().catch(err => console.log('Audio play blocked:', err));
            } else {
                audioPlayer.pause();
            }
        });

        seek.addEventListener('input', () => {
            dragging = true;
            const d = audioPlayer.duration;
            if (isFinite(d) && d > 0) audioPlayer.currentTime = (seek.value / 100) * d;
            seek.style.setProperty('--p', `${seek.value}%`);
        });
        seek.addEventListener('change', () => { dragging = false; sync(); });

        sync();
    })();

    if (audioPlayer) {
        audioPlayer.addEventListener('ended', () => {
            trackGoal('audio_complete', { track: currentAudioName });
            if (audioReplayMode) return; // повтор: видеошага нет, кнопка «Энергии Вселенной» уже показана
            transitionToStep3();
        });
        audioPlayer.addEventListener('error', () => {
            if (audioReplayMode) {
                console.warn("Ошибка загрузки аудиопослания (повтор).");
                return;
            }
            console.warn("Ошибка загрузки аудиопослания, переход к завершающему шагу.");            transitionToStep3();
        });
    }

    if (finalVideoPlayer) {
        finalVideoPlayer.addEventListener('ended', () => {
            if (!finalVideoGoalSent) {
                finalVideoGoalSent = true;
                trackGoal('final_video_complete');
            }
            if (replayFinalVideo) replayFinalVideo.style.display = 'flex';
            autoResetTimeout = setTimeout(resetToStart, 20000); 
        });
    }

    if (finalVideoContainer) {
        finalVideoContainer.addEventListener('click', () => {
            if (!finalVideoPlayer) return;
            if (finalVideoPlayer.paused || finalVideoPlayer.ended) {
                if (autoResetTimeout) clearTimeout(autoResetTimeout);
                if (finalVideoPlayer.ended) finalVideoPlayer.currentTime = 0;
                if (replayFinalVideo) replayFinalVideo.style.display = 'none';
                finalVideoPlayer.play();
            } else {
                finalVideoPlayer.pause();
                if (replayFinalVideo) replayFinalVideo.style.display = 'flex';
            }
        });
    }

    // --- ЛОГИКА ВИДЕОГАЛЕРЕИ (YouTube) ---
    const videoGallery = document.getElementById('videoGallery');
    const videoModal = document.getElementById('videoModal');
    const closeModal = document.getElementById('closeModal');
    const modalVideoWrap = document.getElementById('modalVideoWrap');
    
    // === ИСПОЛЬЗУЕМ ДАННЫЕ ИЗ appData.js ===
    YOUTUBE_GALLERY_DATA.forEach(video => {
        const thumbUrl = `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`;
        const videoHtml = `
            <div class="video-item" data-id="${video.id}">
                <div class="video-thumb">
                    <img src="${thumbUrl}" alt="Обложка">
                    <div class="play-icon"></div>
                </div>
                <div class="video-title">${video.title}</div>
            </div>
        `;
        videoGallery.insertAdjacentHTML('beforeend', videoHtml);
    });

    document.querySelectorAll('.video-item').forEach(item => {
        item.addEventListener('click', function() {
            triggerSoftHaptic();
            const videoId = this.getAttribute('data-id');
            modalVideoWrap.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
            videoModal.classList.add('active');
        });
    });

    closeModal.addEventListener('click', () => {
        videoModal.classList.remove('active');
        modalVideoWrap.innerHTML = ''; 
    });

    videoModal.addEventListener('click', (e) => {
        if (e.target === videoModal) {
            videoModal.classList.remove('active');
            modalVideoWrap.innerHTML = '';
        }
    });

    // --- ЦЕЛЬ МЕТРИКИ: переход на GetCourse из вкладки «Премиум медитации» ---
    document.addEventListener('click', (e) => {
        const link = e.target && e.target.closest ? e.target.closest('a.premium-btn') : null;
        if (!link) return;
        trackGoal('premium_click', { title: (link.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80) });
    });

    // ==========================================
    // МОДУЛЬ: САКРАЛЬНЫЙ ПРОГРЕСС И ДОСТИЖЕНИЯ
    // ==========================================

    const SACRED_RANKS = [
        { min: 1, max: 4, rank: "Искательница смыслов ✦", text: "✨ Твоё намерение мягко вливается в общий круг" },
        { min: 5, max: 14, rank: "Хранительница знаков ✦", text: "🌿 Твоя практика звучит в унисон со всем полем" },
        { min: 15, max: 29, rank: "Глубокое видение ✦", text: "💫 Твой свет укрепляет пространство осознанности" },
        { min: 30, max: 49, rank: "Мастер синхронии ✦", text: "🌟 Ты создаёшь резонанс для других сердец" },
        { min: 50, max: Infinity, rank: "Абсолютный свет ✦", text: "👑 Ты держишь сакральное поле для всего сообщества" }
    ];

    const SACRED_SEALS = [
        { id: 'first_touch', count: 1, title: "Первое касание", icon: "🪷", desc: "Сделан первый шаг в доверие Вселенной" },
        { id: 'guardian', count: 7, title: "Хранительница знаков", icon: "🌿", desc: "Семь открытых посланий и устойчивый диалог с собой" },
        { id: 'deep_vision', count: 20, title: "Глубокое видение", icon: "💫", desc: "Умение считывать тонкие смыслы между строк" },
        { id: 'master_sync', count: 40, title: "Мастер синхронии", icon: "🌟", desc: "Более половины пути в непрерывном потоке Джамили" },
        { id: 'absolute_light', count: 65, title: "Абсолютный свет", icon: "👑", desc: "Высшая ступень интеграции сакральных знаний" }
    ];

    function getNormalizedCollection() {
        let collection = [];
        try {
            const raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
            if (Array.isArray(raw)) collection = raw;
        } catch (e) {
            collection = [];
        }
        
        let normalized = [];
        let isModified = false;

        collection.forEach(item => {
            if (!item) return;
            let id = null;
            let date = new Date().toISOString();
            let count = 1;

            if (typeof item === 'object') {
                if (item.id !== undefined) id = item.id;
                else if (item.path !== undefined) {
                    const m = String(item.path).match(/(\d+)/);
                    if (m) id = parseInt(m[1]);
                    isModified = true;
                }
                
                if (item.date) date = item.date;
                else isModified = true;
                
                if (item.count) count = item.count;
                else isModified = true;
            } else {
                // Старейший формат
                const match = String(item).match(/(\d+)/);
                if (match) {
                    id = parseInt(match[1]);
                    isModified = true;
                }
            }

            if (id !== null && !isNaN(parseInt(id))) {
                normalized.push({ id: parseInt(id), date: date, count: count });
            }
        });

        // Перезаписываем хранилище в новом виде
        if (isModified) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
        }

        return normalized;
    }

    function getCardsDeclension(n) {
        const abs = Math.abs(n) % 100;
        const rem = abs % 10;
        if (abs > 10 && abs < 20) return 'карт';
        if (rem > 1 && rem < 5) return 'карты';
        if (rem === 1) return 'карта';
        return 'карт';
    }

    function getDaysDeclension(n) {
        const abs = Math.abs(n) % 100;
        const rem = abs % 10;
        if (abs > 10 && abs < 20) return 'дней';
        if (rem > 1 && rem < 5) return 'дня';
        if (rem === 1) return 'день';
        return 'дней';
    }

    function calculateSacredProgress() {
        const collection = getNormalizedCollection();
        const uniqueSet = new Set();
        collection.forEach(item => uniqueSet.add(item.id));
        const uniqueCardsCount = uniqueSet.size;

        // Расчет текущего ранга и прогресса
        let currentRank = null;
        let rankName = "Искательница смыслов ✦";
        let fieldText = "✨ Твоё намерение мягко вливается в общий круг";
        let progressPercent = 0;

        if (uniqueCardsCount === 0) {
            rankName = "Искательница смыслов ✦";
            fieldText = "✨ Твоё намерение мягко вливается в общий круг";
            progressPercent = 0;
        } else {
            currentRank = SACRED_RANKS.find(r => uniqueCardsCount >= r.min && uniqueCardsCount <= r.max);
            if (!currentRank) {
                currentRank = SACRED_RANKS[SACRED_RANKS.length - 1];
            }

            rankName = currentRank.rank;
            fieldText = currentRank.text;

            if (currentRank.max === Infinity || uniqueCardsCount >= 50) {
                progressPercent = 100;
            } else {
                const intervalSpan = currentRank.max - currentRank.min;
                if (intervalSpan > 0) {
                    const rawProgress = ((uniqueCardsCount - currentRank.min) / intervalSpan) * 100;
                    progressPercent = Math.max(0, Math.min(100, Math.round(rawProgress)));
                } else {
                    progressPercent = 100;
                }
            }
        }

        // Подсчет открытых печатей (ачивок)
        const unlockedBadges = SACRED_SEALS.filter(seal => uniqueCardsCount >= seal.count);
        const unlockedCount = unlockedBadges.length;

        // Обновление DOM-элементов виджета в секции #collection
        const fieldTextEl = document.getElementById('fieldContributionText');
        const badgesCountEl = document.getElementById('unlockedBadgesCount');
        const progressFillEl = document.getElementById('sacredProgressFill');
        const rankTextEl = document.getElementById('sacredRankText');

        if (fieldTextEl) fieldTextEl.innerText = fieldText;
        if (badgesCountEl) badgesCountEl.innerText = unlockedCount;
        if (progressFillEl) progressFillEl.style.width = `${progressPercent}%`;
        if (rankTextEl) rankTextEl.innerText = rankName;

        // Обновление виджета «Моя коллекция» на экране «Пространство дня»
        const cdCollectionBadge = document.getElementById('cdCollectionBadge');
        const cdCollectionRankText = document.getElementById('cdCollectionRankText');
        if (cdCollectionBadge) {
            cdCollectionBadge.innerText = uniqueCardsCount > 0 ? `(${uniqueCardsCount}/${TOTAL_CARDS})` : '';
        }
        if (cdCollectionRankText) {
            cdCollectionRankText.innerText = `Собрано: ${uniqueCardsCount} ${getCardsDeclension(uniqueCardsCount)} • ${rankName}`;
        }
        // Мини-прогресс коллекции в объединённом виджете (через transform — без Reflow)
        const cdCollectionFill = document.getElementById('cdCollectionFill');
        if (cdCollectionFill) {
            const ratio = Math.min(1, Math.max(0, uniqueCardsCount / TOTAL_CARDS));
            cdCollectionFill.style.transform = `scaleX(${ratio})`;
        }

        // Обновление элементов модальной шторки (Bottom Sheet)
        const sheetFieldDescEl = document.getElementById('sheetFieldDesc');
        const sheetCardsCountEl = document.getElementById('sheetCardsCount');
        const sheetBadgesFractionEl = document.getElementById('sheetBadgesFraction');
        const streakDisplayEl = document.getElementById('streakDisplayText');
        const achievementsGridEl = document.getElementById('achievementsGrid');

        if (sheetFieldDescEl) sheetFieldDescEl.innerText = fieldText;
        if (sheetCardsCountEl) sheetCardsCountEl.innerText = `${uniqueCardsCount} ${getCardsDeclension(uniqueCardsCount)}`;
        if (sheetBadgesFractionEl) sheetBadgesFractionEl.innerText = `${unlockedCount} / ${SACRED_SEALS.length}`;

        const currentStreak = parseInt(localStorage.getItem('practice_streak_count') || '1');
        if (streakDisplayEl) {
            streakDisplayEl.innerText = `Ритм осознанности: ${currentStreak} ${getDaysDeclension(currentStreak)} в потоке ✨`;
        }

        // Генерация карточек печатей
        if (achievementsGridEl) {
            achievementsGridEl.innerHTML = '';
            SACRED_SEALS.forEach(seal => {
                const isUnlocked = uniqueCardsCount >= seal.count;
                const remaining = Math.max(0, seal.count - uniqueCardsCount);

                const sealCard = document.createElement('div');
                sealCard.className = `achievement-card ${isUnlocked ? 'unlocked' : 'locked'}`;

                const reqBadge = isUnlocked
                    ? `<span class="achievement-req">✦ ${seal.count} ${getCardsDeclension(seal.count)}</span>`
                    : `<span class="achievement-req">Цель: ${seal.count} ${getCardsDeclension(seal.count)}</span>`;

                const statusLabel = isUnlocked
                    ? `<span class="achievement-status">✨ Видья открыта</span>`
                    : `<span class="achievement-status">🔒 Видья сокрыта: осталось ${remaining} ${getCardsDeclension(remaining)}</span>`;

                sealCard.innerHTML = `
                    <div class="achievement-icon-wrap">
                        <span>${seal.icon}</span>
                    </div>
                    <div class="achievement-info">
                        <div class="achievement-header">
                            <h4 class="achievement-title">${seal.title}</h4>
                            ${reqBadge}
                        </div>
                        <p class="achievement-desc">${seal.desc}</p>
                        ${statusLabel}
                    </div>
                `;
                achievementsGridEl.appendChild(sealCard);
            });
        }
    }

    // Обработчики открытия и закрытия модальной шторки (Bottom Sheet)
    const sacredProgressWidget = document.getElementById('sacredProgressWidget');
    const sacredBottomSheet = document.getElementById('sacredBottomSheet');
    const sheetOverlay = document.getElementById('sheetOverlay');
    const closeSheetBtn = document.getElementById('closeSheetBtn');

    function openSacredBottomSheet() {
        triggerSoftHaptic();
        try {
            calculateSacredProgress();
        } catch(e) {
            console.error("Ошибка расчета сакрального прогресса:", e);
        }
        if (sacredBottomSheet) {
            sacredBottomSheet.classList.remove('hidden');
            void sacredBottomSheet.offsetWidth;
            sacredBottomSheet.classList.add('active');
            document.body.style.overflow = 'hidden';

            // Запуск односекундного светодиодного луча по контуру плашки стрика
            const streakBar = document.getElementById('sheetStreakBar');
            if (streakBar) {
                streakBar.classList.remove('led-pulse');
                void streakBar.offsetWidth; // Принудительный reflow для перезапуска
                streakBar.classList.add('led-pulse');
            }
        }
    }

    function closeSacredBottomSheet() {
        if (sacredBottomSheet) {
            sacredBottomSheet.classList.remove('active');
            setTimeout(() => {
                if (!sacredBottomSheet.classList.contains('active')) {
                    sacredBottomSheet.classList.add('hidden');
                }
            }, 300);
            document.body.style.overflow = '';
        }
    }

    if (sacredProgressWidget) {
        sacredProgressWidget.addEventListener('click', openSacredBottomSheet);
        sacredProgressWidget.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openSacredBottomSheet();
            }
        });
    }

    if (sheetOverlay) {
        sheetOverlay.addEventListener('click', closeSacredBottomSheet);
    }

    if (closeSheetBtn) {
        closeSheetBtn.addEventListener('click', closeSacredBottomSheet);
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sacredBottomSheet && sacredBottomSheet.classList.contains('active')) {
            closeSacredBottomSheet();
        }
    });

    // Первичный расчет сакрального прогресса при загрузке страницы
    calculateSacredProgress();

    // ==========================================
    // ДИНАМИЧЕСКИЙ СЧЁТЧИК «ОБЩЕЕ ПОЛЕ» (МСК / UTC+3)
    // ==========================================

    const fieldCounterContainer = document.getElementById('dailyFieldCounter');
    const fieldCounterText = document.getElementById('dailyFieldCounterText');

    // 1. Расчет московского времени (UTC+3) независимо от локального пояса устройства
    function getMskDateInfo() {
        const MSK_OFFSET_MS = 3 * 60 * 60 * 1000;
        const mskDate = new Date(Date.now() + MSK_OFFSET_MS);
        const year = mskDate.getUTCFullYear();
        const month = String(mskDate.getUTCMonth() + 1).padStart(2, '0');
        const day = String(mskDate.getUTCDate()).padStart(2, '0');
        const dateKey = `${year}-${month}-${day}`;
        const hours = mskDate.getUTCHours();
        const minutes = mskDate.getUTCMinutes();
        const seconds = mskDate.getUTCSeconds();
        const totalMinutes = hours * 60 + minutes + (seconds / 60);
        return { dateKey, totalMinutes };
    }

    // 2. Детерминированный целевой суточный лимит (240..295) от даты
    function getDailyTarget(dateKey) {
        let hash = 0;
        for (let i = 0; i < dateKey.length; i++) {
            hash = ((hash << 5) - hash) + dateKey.charCodeAt(i);
            hash |= 0;
        }
        const seed = Math.abs(hash);
        return 240 + (seed % 56);
    }

    // 3. Грамматически корректное склонение слова «женщина»
    function getWomenDeclension(count) {
        const absN = Math.abs(count) % 100;
        const lastDigit = absN % 10;
        if (absN >= 11 && absN <= 19) {
            return 'женщин';
        }
        if (lastDigit === 1) {
            return 'женщина';
        }
        if (lastDigit >= 2 && lastDigit <= 4) {
            return 'женщины';
        }
        return 'женщин';
    }

    // 4. Прогрессивная суточная шкала с кусочно-линейной интерполяцией
    function calculateFieldBaseCount(totalMinutes, target) {
        const targetFactor = Math.min(Math.max((target - 240) / 55, 0), 1);

        const schedule = [
            { t: 0,    min: 38,  max: 47 },
            { t: 240,  min: 48,  max: 58 },
            { t: 420,  min: 62,  max: 75 },
            { t: 690,  min: 162, max: 190 },
            { t: 1080, min: 210, max: 235 },
            { t: 1350, min: 232, max: 280 },
            { t: 1440, min: target, max: target }
        ];

        const milestones = schedule.map(pt => {
            let val;
            if (pt.t === 1440) {
                val = target;
            } else if (pt.t === 1350) {
                // Для 22:30: ~96% от суточного таргета, не превышая target - 2
                const raw = Math.round(pt.min + targetFactor * (pt.max - pt.min));
                val = Math.min(raw, target - 2);
            } else {
                val = Math.round(pt.min + targetFactor * (pt.max - pt.min));
            }
            return { t: pt.t, v: val };
        });

        const m = Math.min(Math.max(totalMinutes, 0), 1439.99);

        let pA = milestones[0];
        let pB = milestones[milestones.length - 1];

        for (let i = 0; i < milestones.length - 1; i++) {
            if (m >= milestones[i].t && m <= milestones[i + 1].t) {
                pA = milestones[i];
                pB = milestones[i + 1];
                break;
            }
        }

        const span = pB.t - pA.t;
        const progress = span > 0 ? (m - pA.t) / span : 0;
        const calculated = pA.v + progress * (pB.v - pA.v);

        return Math.floor(calculated);
    }

    // 5. Управление видимостью нижнего счётчика поля (верхняя чёлка отключена, чтобы не перекрывать Луну-венец)
    function updateTabsNotch() {
        const fc = document.getElementById('dailyFieldCounter');
        const dailyTab = document.getElementById('daily');
        const isDailyTab = dailyTab && dailyTab.classList.contains('active');
        const isStep1 = step1Card && step1Card.style.display !== 'none';
        const isRitualStage = cardDrawStage && cardDrawStage.style.display === 'flex';
        const shouldShow = isDailyTab && isStep1 && !isRitualStage && !isFlipped && !window.isCardDrawing;

        if (fc) {
            fc.style.display = shouldShow ? 'inline-flex' : 'none';
        }
    }
    window.updateTabsNotch = updateTabsNotch;

    // Жесткая синхронизация видимости счётчика и перерисовки векторного контура шапки
    function syncFieldCounterVisibility() {
        updateTabsNotch();
    }
    window.syncFieldCounterVisibility = syncFieldCounterVisibility;

    // 6. Обновление счётчика с защитой монотонности и учётом личного вклада (+1)
    function updateDailyFieldCounter() {
        if (!fieldCounterText) return;

        const { dateKey, totalMinutes } = getMskDateInfo();
        const target = getDailyTarget(dateKey);
        const baseCount = calculateFieldBaseCount(totalMinutes, target);

        const storedDate = localStorage.getItem('mystic_field_date');
        let storedCount = parseInt(localStorage.getItem('mystic_field_count') || '0', 10);
        if (isNaN(storedCount)) storedCount = 0;

        const userContributedDate = localStorage.getItem('mystic_field_user_today');

        // Смена суток (00:00 по Москве): мягкий переход на новый день
        if (storedDate !== dateKey) {
            storedCount = 0;
            localStorage.setItem('mystic_field_date', dateKey);
        }

        // Личный вклад: при первом визите за сегодня добавляется +1
        let userOffset = 1;
        if (userContributedDate !== dateKey) {
            localStorage.setItem('mystic_field_user_today', dateKey);
        }

        // Монотонность: значение может только расти или оставаться неизменным
        const effectiveCount = baseCount + userOffset;
        const finalCount = Math.max(effectiveCount, storedCount);

        localStorage.setItem('mystic_field_count', finalCount.toString());

        const declension = getWomenDeclension(finalCount);
        fieldCounterText.innerText = `${finalCount} ${declension} в потоке`;
        syncFieldCounterVisibility();
    }

    window.updateDailyFieldCounter = updateDailyFieldCounter;

    // Первичная инициализация счетчика Общего поля и запуск минутного таймера синхронизации
    updateDailyFieldCounter();
    setInterval(updateDailyFieldCounter, 60000);

    // Event popup logic is handled dynamically in eventPopup.js
});

