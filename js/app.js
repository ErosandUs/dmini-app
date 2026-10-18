document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // 1. ИНИЦИАЛИЗАЦИЯ TELEGRAM WEBAPP & SAFE AREA
    // ==========================================
    if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        try {
            tg.ready();
        } catch (_) {}

        // Проверка поддержки Bot API 8.0+
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

        // Вход в нативный Fullscreen ТОЛЬКО если версия Bot API >= 8.0, иначе fallback на expand()
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

        // Защита от закрытия шторки случайным свайпом вниз (Bot API 7.7+)
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

        // Синхронизация системных цветов Telegram с палитрой приложения
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

        // Синхронизация зон безопасности (Safe Area Insets)
        const updateTopPadding = () => {
            const topSafe = window.Telegram?.WebApp?.safeAreaInset?.top || 0;
            const topContent = window.Telegram?.WebApp?.contentSafeAreaInset?.top || 0;
            const totalTop = topSafe + topContent + 4;
            if (document.body) {
                document.body.style.paddingTop = `${totalTop}px`;
            }
        };

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
                updateTopPadding();
            } catch (err) {
                console.warn('Не удалось синхронизировать Safe Area:', err);
            }
        };

        syncSafeArea();

        if (typeof tg.onEvent === 'function') {
            try {
                tg.onEvent('safeAreaChanged', () => {
                    updateTopPadding();
                    syncSafeArea();
                });
                tg.onEvent('contentSafeAreaChanged', () => {
                    updateTopPadding();
                    syncSafeArea();
                });
                tg.onEvent('fullscreenChanged', () => {
                    updateTopPadding();
                    syncSafeArea();
                });
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

    // ==========================================
    // 2. ТАКТИЛЬНАЯ АРХИТЕКТУРА (HAPTIC FEEDBACK)
    // ==========================================
    const getHaptic = () => window.Telegram?.WebApp?.HapticFeedback;

    // Первичное касание карты: мягкий бархатный импульс «вдоха»
    function triggerCardTouchHaptic() {
        const haptic = getHaptic();
        if (!haptic) return;
        try {
            haptic.impactOccurred('soft');
        } catch (_) {
            try { haptic.impactOccurred('light'); } catch (_) {}
        }
    }

    // Синхронизированная тактильная симфония переворота карты (1350 мс)
    function triggerCardFlipSymphony() {
        const haptic = getHaptic();
        if (!haptic) return;

        // 420 мс: прохождение экватора 90° — легкий шелест грани карты
        setTimeout(() => {
            try { haptic.selectionChanged(); } catch (_) {}
        }, 420);

        // 1150 мс: фиксация и раскрытие карты — мягкий двойной резонанс (поющая чаша)
        setTimeout(() => {
            try {
                haptic.notificationOccurred('success');
            } catch (_) {
                try { haptic.impactOccurred('medium'); } catch (_) {}
            }
        }, 1150);
    }

    // Универсальный мягкий отклик для кнопок интерфейса
    function triggerSoftHaptic() {
        const haptic = getHaptic();
        if (!haptic) return;
        try {
            haptic.impactOccurred('soft');
        } catch (_) {
            try { haptic.impactOccurred('light'); } catch (_) {}
        }
    }

    // Легкий микротик для навигации по табам, слайдерам и фильтрам
    function triggerSelectionHaptic() {
        try {
            getHaptic()?.selectionChanged();
        } catch (_) {}
    }

    // ==========================================
    // 3. ДИНАМИЧЕСКИЙ ВЫВОД ВЕРСИИ
    // ==========================================
    const appScriptTag = document.getElementById('appScript');
    const versionLabel = document.getElementById('appVersionLabel');
    if (appScriptTag && versionLabel) {
        const srcAttr = appScriptTag.getAttribute('src');
        const vMatch = srcAttr ? srcAttr.match(/\?v=(.+)$/) : null;
        const currentVersion = vMatch ? vMatch[1] : '1';
        versionLabel.innerText = `v${currentVersion}`;
    }

    // Кнопка добавления на рабочий стол (безопасная инициализация)
    const addToHomeScreenBtn = document.getElementById('addToHomeScreenBtn');
    if (addToHomeScreenBtn) {
        addToHomeScreenBtn.addEventListener('click', () => {
            triggerSoftHaptic();
            const tg = window.Telegram?.WebApp;
            if (tg && typeof tg.addToHomeScreen === 'function') {
                try {
                    tg.addToHomeScreen();
                } catch (err) {
                    console.warn('addToHomeScreen error:', err);
                }
            } else {
                alert("На смартфоне в Telegram здесь откроется окно добавления иконки на рабочий стол ✨");
            }
        });
    }

    // ==========================================
    // 4. КОНСТАНТЫ И НАСТРОЙКИ
    // ==========================================
    const BOT_LINK = "https://t.me/Djamiliakha_bot?start=go";
    const TOTAL_CARDS = 71; 
    const STORAGE_KEY = "mystic_collection";

    // Главные вкладки
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            triggerSelectionHaptic();
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
            
            if (btn.dataset.tab === 'collection') {
                renderCollection();
            }
            if (typeof window.updateEventTimer === 'function') {
                window.updateEventTimer();
            }
        });
    });

    // Внутренние вкладки видеотеки
    const vTabBtns = document.querySelectorAll('.v-tab-btn');
    const vTabContents = document.querySelectorAll('.v-tab-content');

    vTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            triggerSelectionHaptic();
            vTabBtns.forEach(b => b.classList.remove('active'));
            vTabContents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.vtab).classList.add('active');
        });
    });

    // ==========================================
    // 5. РИТУАЛ ВЫТЯГИВАНИЯ КАРТЫ И ТАЙМЕР
    // ==========================================
    const step1Card = document.getElementById('step1-card');
    const step2Audio = document.getElementById('step2-audio');
    const step3Video = document.getElementById('step3-video'); 

    const card = document.getElementById('mysticCard');
    const drawBtn = document.getElementById('drawCardBtn');
    const cardResultImg = document.getElementById('cardResult');
    const shareCardBtn = document.getElementById('shareCardBtn'); 
    const nextToAudioBtn = document.getElementById('nextToAudioBtn');
    const avatarVideo = document.getElementById('avatarVideo');
    
    let isFlipped = false;
    let currentCardPath = ""; 
    let currentCardNumber = 1; 

    // Таймер кулдауна (12 часов)
    const COOLDOWN_MS = 12 * 60 * 60 * 1000; 
    let countdownInterval; 

    const VIP_USERS = ['Djamilia_Kha', 'atribute'];

    function isUserVIP() {
        if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
            const username = window.Telegram.WebApp.initDataUnsafe.user.username;
            return VIP_USERS.includes(username);
        }
        return false;
    }

    function formatTime(ms) {
        const totalSeconds = Math.ceil(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        if (hours > 0) return `${hours}ч ${minutes}м`;
        else if (minutes > 0) return `${minutes}м ${seconds}с`;
        else return `${seconds} сек.`;
    }

    function checkTimer() {
        if (isUserVIP()) {
            if (drawBtn) drawBtn.disabled = false;
            return true;
        }

        const lastDraw = localStorage.getItem('lastDrawTime');
        if (lastDraw) {
            const elapsed = Date.now() - parseInt(lastDraw, 10);
            if (elapsed < COOLDOWN_MS) {
                if (drawBtn) drawBtn.disabled = true;
                const remaining = COOLDOWN_MS - elapsed;
                startCountdown(remaining);
                return false; 
            }
        }
        if (drawBtn) drawBtn.disabled = false;
        return true; 
    }

    function startCountdown(duration) {
        if (countdownInterval) clearInterval(countdownInterval); 
        let remain = duration;
        
        countdownInterval = setInterval(() => {
            remain -= 1000;
            if (remain <= 0) {
                clearInterval(countdownInterval);
                if (drawBtn) {
                    drawBtn.disabled = false;
                    drawBtn.innerText = "Получить послание";
                }
            } else if (drawBtn) {
                drawBtn.innerText = `Ожидайте: ${formatTime(remain)}`;
            }
        }, 1000);
        
        if (drawBtn) {
            drawBtn.innerText = `Ожидайте: ${formatTime(remain)}`;
        }
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

                if (!isSameDay) {
                    if (diffHours <= 48) {
                        streak += 1;
                    } else {
                        streak = 1;
                    }
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
        if (!isFlipped && !window.isCardDrawing && checkTimer()) {
            triggerCardTouchHaptic(); // Мягкий тактильный вдох
            window.isCardDrawing = true;

            if (typeof window.hideEventTimer === 'function') {
                window.hideEventTimer();
            }

            // Мягкое угасание кнопки без резкого исчезновения из DOM
            if (drawBtn) {
                drawBtn.style.opacity = '0';
                drawBtn.style.pointerEvents = 'none';
            }
            if (addToHomeScreenBtn) {
                addToHomeScreenBtn.style.opacity = '0';
                addToHomeScreenBtn.style.pointerEvents = 'none';
            }

            // Фаза предвкушения: легкая левитация карты навстречу пальцу
            if (card) {
                card.classList.add('awakening');
            }

            localStorage.setItem('lastDrawTime', Date.now().toString()); 

            setTimeout(() => {
                setNewCard();
            }, 180);
        }
    }

    function setNewCard() {
        const randomNum = Math.floor(Math.random() * TOTAL_CARDS) + 1;
        currentCardNumber = randomNum;
        currentCardPath = `images/${randomNum}.jpeg`; 

        if (cardResultImg) {
            cardResultImg.src = currentCardPath; 
            cardResultImg.onload = () => {
                if (card) {
                    card.classList.remove('awakening');
                    card.classList.add('flipped');
                }
                isFlipped = true;
                window.isCardDrawing = false;
                
                // Запуск тактильной партитуры в резонанс с CSS-кривой 1350 мс
                triggerCardFlipSymphony();

                saveCardToCollection(randomNum);

                // Фиксация цели в Яндекс.Метрике
                if (typeof ym !== 'undefined') {
                    ym(110909428, 'reachGoal', 'get_card');
                }
                
                if (drawBtn) {
                    drawBtn.style.display = 'none';
                    drawBtn.style.opacity = '';
                    drawBtn.style.pointerEvents = '';
                }
                if (addToHomeScreenBtn) {
                    addToHomeScreenBtn.style.display = 'none';
                    addToHomeScreenBtn.style.opacity = '';
                    addToHomeScreenBtn.style.pointerEvents = '';
                }

                if (typeof window.updateEventTimer === 'function') {
                    window.updateEventTimer();
                }

                // Каскадное проявление кнопок после завершения разворота карты (1500 мс)
                setTimeout(() => { 
                    if (nextToAudioBtn) {
                        nextToAudioBtn.style.display = 'block';
                        nextToAudioBtn.classList.add('ritual-btn-reveal');
                    }
                    triggerSelectionHaptic();

                    setTimeout(() => {
                        if (shareCardBtn) {
                            shareCardBtn.style.display = 'block';
                            shareCardBtn.classList.add('ritual-btn-reveal');
                        }
                        if (typeof window.updateEventTimer === 'function') {
                            window.updateEventTimer();
                        }
                    }, 180);
                }, 1500);
            };
        }
    }

    if (drawBtn) drawBtn.addEventListener('click', drawRandomCard);
    if (card) card.addEventListener('click', drawRandomCard);

    // ==========================================
    // 6. ЛОГИКА ШЕРИНГА (ЛИЧНЫЕ СООБЩЕНИЯ & STORIES)
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

    if (shareCardBtn) {
        shareCardBtn.addEventListener('click', () => {
            triggerSoftHaptic();
            activeSharePath = currentCardPath;
            if (shareOptionsModal) shareOptionsModal.classList.add('active');
        });
    }

    if (closeShareModal) {
        closeShareModal.addEventListener('click', () => {
            triggerSelectionHaptic();
            if (shareOptionsModal) shareOptionsModal.classList.remove('active');
        });
    }

    if (shareToFriendBtn) {
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
    }

    if (shareToUniverseBtn) {
        shareToUniverseBtn.addEventListener('click', () => {
            triggerSoftHaptic();
            if (typeof ym !== 'undefined') {
                ym(110909428, 'reachGoal', 'share_story');
            }

            shareToStories(activeSharePath); 
            if (shareOptionsModal) {
                shareOptionsModal.classList.remove('active');
            }
        });
    }

    function shareToStories(imagePath) {
        if (!window.Telegram?.WebApp) {
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
    // 7. КОЛЛЕКЦИЯ И СВАЙПЕР МЕСЯЦЕВ
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
            if (emptyMsg) emptyMsg.style.display = 'block';
            if (swiperContainer) swiperContainer.style.display = 'none';
            if (timelineNav) timelineNav.style.display = 'none';
            return;
        }

        if (emptyMsg) emptyMsg.style.display = 'none';
        if (swiperContainer) swiperContainer.style.display = 'block';
        if (timelineNav) timelineNav.style.display = 'flex';
        
        if (wrapper) wrapper.innerHTML = '';
        if (timelineNav) timelineNav.innerHTML = '';

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
            if (wrapper) wrapper.insertAdjacentHTML('beforeend', slideHtml);
        });

        monthsSet.forEach((month, idx) => {
            const btnHtml = `<button class="month-btn ${idx === 0 ? 'active' : ''}" data-index="${monthSlidesIndex[month]}">${month}</button>`;
            if (timelineNav) timelineNav.insertAdjacentHTML('beforeend', btnHtml);
        });

        document.querySelectorAll('.collection-share-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                triggerSoftHaptic();
                activeSharePath = this.getAttribute('data-path'); 
                if (shareOptionsModal) shareOptionsModal.classList.add('active'); 
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
                const targetIndex = parseInt(this.getAttribute('data-index'), 10);
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
    // 8. СБРОС И ВОЗВРАТ В НАЧАЛО
    // ==========================================
    const resetPracticeBtn = document.getElementById('resetPracticeBtn');
    const finalVideoPlayer = document.getElementById('finalVideoPlayer');
    const replayFinalVideo = document.getElementById('replayFinalVideo');
    let autoResetTimeout;

    function resetToStart() {
        if (autoResetTimeout) {
            clearTimeout(autoResetTimeout);
        }
        window.isCardDrawing = false;
        
        if (finalVideoPlayer) {
            finalVideoPlayer.pause();
            finalVideoPlayer.currentTime = 0;
        }
        
        if (replayFinalVideo) replayFinalVideo.style.display = 'none'; 
        
        if (step3Video) {
            step3Video.style.display = 'none';
            step3Video.classList.remove('step-fade-in');
        }
        if (step2Audio) {
            step2Audio.style.display = 'none';
            step2Audio.classList.remove('step-fade-in');
        }
        if (step1Card) {
            step1Card.style.display = 'block';
            step1Card.classList.remove('step-fade-out');
            step1Card.classList.add('step-fade-in');
        }
        
        if (card) {
            card.classList.remove('flipped');
            card.classList.remove('awakening');
        }
        isFlipped = false;
        
        if (nextToAudioBtn) {
            nextToAudioBtn.style.display = 'none';
            nextToAudioBtn.classList.remove('ritual-btn-reveal');
        }
        if (shareCardBtn) {
            shareCardBtn.style.display = 'none';
            shareCardBtn.classList.remove('ritual-btn-reveal');
        }
        
        if (drawBtn) {
            drawBtn.style.display = 'block';
            drawBtn.style.opacity = '';
            drawBtn.style.pointerEvents = '';
        }
        if (addToHomeScreenBtn) {
            addToHomeScreenBtn.style.display = 'block';
            addToHomeScreenBtn.style.opacity = '';
            addToHomeScreenBtn.style.pointerEvents = '';
        }
        
        checkTimer();

        if (typeof window.updateEventTimer === 'function') {
            window.updateEventTimer();
        }
    }

    if (resetPracticeBtn) {
        resetPracticeBtn.addEventListener('click', () => {
            triggerSoftHaptic();
            resetToStart();
        });
    }

    // ==========================================
    // 9. ШАГ 2: АУДИОПОСЛАНИЕ И ПЕРЕХОДЫ
    // ==========================================
    const audioPlayer = document.getElementById('audioPlayer');
    const audioTitle = document.getElementById('audioTitle');
    const shareAudioBtn = document.getElementById('shareAudioBtn'); 
    
    let currentAudioName = "";

    function startAudioForCurrentCard() {
        const availableTrackIds = (typeof CARD_TO_AUDIO_MAP !== 'undefined' && CARD_TO_AUDIO_MAP[currentCardNumber]) 
            ? CARD_TO_AUDIO_MAP[currentCardNumber] 
            : [1];
        const targetAudioId = availableTrackIds[Math.floor(Math.random() * availableTrackIds.length)];
        const selectedAudio = AUDIO_TRACKS_DATA.find(track => track.id === targetAudioId) || AUDIO_TRACKS_DATA[0];

        currentAudioName = selectedAudio.title;
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
        if (shareAudioBtn) shareAudioBtn.style.display = 'block';
    }

    // Плавный переход Шаг 1 -> Шаг 2 с микро-паузой 500 мс перед звуком
    if (nextToAudioBtn) {
        nextToAudioBtn.addEventListener('click', () => {
            triggerSoftHaptic();
            if (step1Card) {
                step1Card.classList.add('step-fade-out');
                setTimeout(() => {
                    step1Card.style.display = 'none';
                    step1Card.classList.remove('step-fade-out');

                    if (step2Audio) {
                        step2Audio.style.display = 'flex';
                        step2Audio.classList.add('step-fade-in');
                    }
                    if (typeof window.updateEventTimer === 'function') {
                        window.updateEventTimer();
                    }

                    // Пауза тишины для настройки внимания
                    setTimeout(() => {
                        startAudioForCurrentCard();
                    }, 500);
                }, 400);
            }
        });
    }

    if (shareAudioBtn) {
        shareAudioBtn.addEventListener('click', () => {
            triggerSoftHaptic();
            const text = `🎧 Я прослушала трансформационное послание «${currentAudioName}». Узнай, что Вселенная хочет сказать тебе:\n${BOT_LINK}`;
            openTelegramShare(text);
        });
    }

    // Автопереход Шаг 2 -> Шаг 3 с сакральной тишиной (1.2 сек)
    const finalVideoContainer = document.getElementById('finalVideoContainer');

    if (audioPlayer) {
        audioPlayer.addEventListener('ended', () => {
            setTimeout(() => {
                triggerSoftHaptic();
                if (step2Audio) {
                    step2Audio.classList.add('step-fade-out');
                }
                setTimeout(() => {
                    if (step2Audio) {
                        step2Audio.style.display = 'none';
                        step2Audio.classList.remove('step-fade-out');
                    }
                    if (step3Video) {
                        step3Video.style.display = 'block';
                        step3Video.classList.add('step-fade-in');
                    }
                    
                    if (typeof FINAL_VIDEOS_DATA !== 'undefined' && FINAL_VIDEOS_DATA.length > 0) {
                        const randomFinalVideo = FINAL_VIDEOS_DATA[Math.floor(Math.random() * FINAL_VIDEOS_DATA.length)];
                        if (finalVideoPlayer) finalVideoPlayer.src = randomFinalVideo;
                    }
                    
                    if (replayFinalVideo) replayFinalVideo.style.display = 'none'; 
                    
                    if (finalVideoPlayer) {
                        finalVideoPlayer.currentTime = 0;
                        finalVideoPlayer.play().catch(err => {
                            if (replayFinalVideo) replayFinalVideo.style.display = 'flex';
                        });
                    }
                }, 400);
            }, 1200); // 1.2 секунды чистого послевкусия
        });
    }

    if (finalVideoPlayer) {
        finalVideoPlayer.addEventListener('ended', () => {
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

    // ==========================================
    // 10. ГАЛЕРЕЯ YOUTUBE И МОДАЛЬНОЕ ОКНО
    // ==========================================
    const videoGallery = document.getElementById('videoGallery');
    const videoModal = document.getElementById('videoModal');
    const closeModal = document.getElementById('closeModal');
    const modalVideoWrap = document.getElementById('modalVideoWrap');
    
    if (typeof YOUTUBE_GALLERY_DATA !== 'undefined' && videoGallery) {
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
    }

    document.querySelectorAll('.video-item').forEach(item => {
        item.addEventListener('click', function() {
            triggerSoftHaptic();
            const videoId = this.getAttribute('data-id');
            if (modalVideoWrap) {
                modalVideoWrap.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
            }
            if (videoModal) videoModal.classList.add('active');
        });
    });

    if (closeModal) {
        closeModal.addEventListener('click', () => {
            triggerSelectionHaptic();
            if (videoModal) videoModal.classList.remove('active');
            if (modalVideoWrap) modalVideoWrap.innerHTML = ''; 
        });
    }

    if (videoModal) {
        videoModal.addEventListener('click', (e) => {
            if (e.target === videoModal) {
                triggerSelectionHaptic();
                videoModal.classList.remove('active');
                if (modalVideoWrap) modalVideoWrap.innerHTML = '';
            }
        });
    }

    // ==========================================
    // 11. САКРАЛЬНЫЙ ПРОГРЕСС И ДОСТИЖЕНИЯ
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
                    if (m) id = parseInt(m[1], 10);
                    isModified = true;
                }
                
                if (item.date) date = item.date;
                else isModified = true;
                
                if (item.count) count = item.count;
                else isModified = true;
            } else {
                const match = String(item).match(/(\d+)/);
                if (match) {
                    id = parseInt(match[1], 10);
                    isModified = true;
                }
            }

            if (id !== null && !isNaN(parseInt(id, 10))) {
                normalized.push({ id: parseInt(id, 10), date: date, count: count });
            }
        });

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

        const unlockedBadges = SACRED_SEALS.filter(seal => uniqueCardsCount >= seal.count);
        const unlockedCount = unlockedBadges.length;

        const fieldTextEl = document.getElementById('fieldContributionText');
        const badgesCountEl = document.getElementById('unlockedBadgesCount');
        const progressFillEl = document.getElementById('sacredProgressFill');
        const rankTextEl = document.getElementById('sacredRankText');

        if (fieldTextEl) fieldTextEl.innerText = fieldText;
        if (badgesCountEl) badgesCountEl.innerText = unlockedCount;
        if (progressFillEl) progressFillEl.style.width = `${progressPercent}%`;
        if (rankTextEl) rankTextEl.innerText = rankName;

        const sheetFieldDescEl = document.getElementById('sheetFieldDesc');
        const sheetCardsCountEl = document.getElementById('sheetCardsCount');
        const sheetBadgesFractionEl = document.getElementById('sheetBadgesFraction');
        const streakDisplayEl = document.getElementById('streakDisplayText');
        const achievementsGridEl = document.getElementById('achievementsGrid');

        if (sheetFieldDescEl) sheetFieldDescEl.innerText = fieldText;
        if (sheetCardsCountEl) sheetCardsCountEl.innerText = `${uniqueCardsCount} ${getCardsDeclension(uniqueCardsCount)}`;
        if (sheetBadgesFractionEl) sheetBadgesFractionEl.innerText = `${unlockedCount} / ${SACRED_SEALS.length}`;

        const currentStreak = parseInt(localStorage.getItem('practice_streak_count') || '1', 10);
        if (streakDisplayEl) {
            streakDisplayEl.innerText = `Ритм осознанности: ${currentStreak} ${getDaysDeclension(currentStreak)} в потоке ✨`;
        }

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

            // Тактильная фиксация после завершения анимации открытия шторки (320 мс)
            setTimeout(() => {
                triggerSelectionHaptic();
            }, 320);

            const streakBar = document.getElementById('sheetStreakBar');
            if (streakBar) {
                streakBar.classList.remove('led-pulse');
                void streakBar.offsetWidth;
                streakBar.classList.add('led-pulse');
            }
        }
    }

    function closeSacredBottomSheet() {
        triggerSelectionHaptic();
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

    calculateSacredProgress();
});