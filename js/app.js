document.addEventListener('DOMContentLoaded', () => {
    
    // Принудительное разворачивание Mini App при старте
    if (window.Telegram?.WebApp?.expand) {
        window.Telegram.WebApp.expand();
    }
    window.addEventListener('focus', () => {
        if (window.Telegram?.WebApp?.expand) {
            window.Telegram.WebApp.expand();
        }
    });

    // --- ДИНАМИЧЕСКИЙ ВЫВОД ВЕРСИИ ИЗ INDEX.HTML ---
    const appScriptTag = document.getElementById('appScript');
    const versionLabel = document.getElementById('appVersionLabel');
    if (appScriptTag && versionLabel) {
        const srcAttr = appScriptTag.getAttribute('src');
        const vMatch = srcAttr ? srcAttr.match(/\?v=(.+)$/) : null;
        const currentVersion = vMatch ? vMatch[1] : '1';
        versionLabel.innerText = `v${currentVersion}`;
    }

    // --- НАСТРОЙКИ ---
    const BOT_LINK = "https://t.me/Djamiliakha_bot"; // Ваша актуальная ссылка на бота
    const TOTAL_CARDS = 71; 
    const STORAGE_KEY = "mystic_collection"; // Ключ для локального хранилища коллекции

    // --- ЛОГИКА ГЛАВНЫХ ВКЛАДОК ---
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
            
            if(btn.dataset.tab === 'collection') {
                renderCollection();
            }
        });
    });

    // --- ЛОГИКА ВНУТРЕННИХ ВКЛАДОК ВИДЕОТЕКИ ---
    const vTabBtns = document.querySelectorAll('.v-tab-btn');
    const vTabContents = document.querySelectorAll('.v-tab-content');

    vTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            vTabBtns.forEach(b => b.classList.remove('active'));
            vTabContents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.vtab).classList.add('active');
        });
    });

    // ==========================================
    // ЛОГИКА ПОТОКА И СОХРАНЕНИЯ В КОЛЛЕКЦИЮ
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

// === ЛОГИКА ТАЙМЕРА (12 ЧАСОВ) ===
    const COOLDOWN_MS = 12 * 60 * 60 * 1000; 
    let countdownInterval; 

    // --- НОВЫЙ БЛОК: Проверка VIP-пользователей ---
    const VIP_USERS = ['Djamilia_Kha', 'atribute']; // Никнеймы без знака @

    function isUserVIP() {
        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) {
            const username = window.Telegram.WebApp.initDataUnsafe.user.username;
            return VIP_USERS.includes(username);
        }
        return false;
    }
    // ----------------------------------------------

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
        // Если пользователь VIP, сразу разрешаем получение карты, игнорируя таймер
        if (isUserVIP()) {
            drawBtn.disabled = false;
            return true;
        }

        const lastDraw = localStorage.getItem('lastDrawTime');
        if (lastDraw) {
            const elapsed = Date.now() - parseInt(lastDraw);
            if (elapsed < COOLDOWN_MS) {
                drawBtn.disabled = true;
                const remaining = COOLDOWN_MS - elapsed;
                startCountdown(remaining);
                return false; 
            }
        }
        return true; 
    }

    function startCountdown(duration) {
        if (countdownInterval) clearInterval(countdownInterval); 
        let remain = duration;
        
        countdownInterval = setInterval(() => {
            remain -= 1000;
            if (remain <= 0) {
                clearInterval(countdownInterval);
                drawBtn.disabled = false;
                drawBtn.innerText = "Получить послание";
            } else {
                drawBtn.innerText = `Ожидайте: ${formatTime(remain)}`;
            }
        }, 1000);
        
        drawBtn.innerText = `Ожидайте: ${formatTime(remain)}`;
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
        if (!isFlipped && checkTimer()) {
            window.isCardDrawing = true;
            if (typeof window.hideEventTimer === 'function') {
                window.hideEventTimer();
            }
            localStorage.setItem('lastDrawTime', Date.now()); 
            setNewCard();
        }
    }

    function setNewCard() {
        const randomNum = Math.floor(Math.random() * TOTAL_CARDS) + 1;
        currentCardPath = `images/${randomNum}.jpeg`; 
        if (cardResultImg) {
            cardResultImg.src = currentCardPath; 
            cardResultImg.onload = () => {
                if (card) card.classList.add('flipped');
                isFlipped = true;
                window.isCardDrawing = false;
                
                saveCardToCollection(randomNum);

                // --- ОТПРАВКА ЦЕЛИ В ЯНДЕКС МЕТРИКУ: Выбор карты ---
                if (typeof ym !== 'undefined') {
                    ym(110909428, 'reachGoal', 'get_card');
                }
                
                if (drawBtn) drawBtn.style.display = 'none';
                if (typeof window.updateEventTimer === 'function') {
                    window.updateEventTimer();
                }

                setTimeout(() => { 
                    if (nextToAudioBtn) nextToAudioBtn.style.display = 'block';
                    if (shareCardBtn) shareCardBtn.style.display = 'block'; 
                    if (typeof window.updateEventTimer === 'function') {
                        window.updateEventTimer();
                    }
                }, 500);
            };
        }
    }

    if (drawBtn) drawBtn.addEventListener('click', drawRandomCard);
    if (card) card.addEventListener('click', drawRandomCard);

    // ==========================================
    // ЛОГИКА ШЕРИНГА И МЕНЮ ВЫБОРА (ОБЩАЯ)
    // ==========================================
    const shareOptionsModal = document.getElementById('shareOptionsModal');
    const closeShareModal = document.getElementById('closeShareModal');
    const shareToFriendBtn = document.getElementById('shareToFriendBtn');
    const shareToUniverseBtn = document.getElementById('shareToUniverseBtn');

    let activeSharePath = ""; 

    shareCardBtn.addEventListener('click', () => {
        activeSharePath = currentCardPath;
        shareOptionsModal.classList.add('active');
    });

    closeShareModal.addEventListener('click', () => {
        shareOptionsModal.classList.remove('active');
    });

    // --- НАДЕЖНАЯ ОТПРАВКА В ЛС ---
    shareToFriendBtn.addEventListener('click', () => {
        if (typeof ym !== 'undefined') {
            ym(110909428, 'reachGoal', 'share_direct');
        }

        const shareText = `Привет! Нашла классное приложение по метафорическим картам ✨
https://clck.ru/3VB8wu

Заходи в бота: ${BOT_LINK}`;
        const shareUrl = `https://t.me/share/url?text=${encodeURIComponent(shareText)}`;

        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.openTelegramLink) {
            window.Telegram.WebApp.openTelegramLink(shareUrl);
        } else {
            window.open(shareUrl, '_blank');
        }

        if (window.Telegram?.WebApp?.expand) {
            window.Telegram.WebApp.expand();
        }
        
        shareOptionsModal.classList.remove('active');
    });

    // --- ОТПРАВКА КАРТОЧКИ В STORIES ---
    shareToUniverseBtn.addEventListener('click', () => {
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
                    updateActiveMonthBtn(this.activeIndex, monthSlidesIndex);
                }
            }
        });

        document.querySelectorAll('.month-btn').forEach(btn => {
            btn.addEventListener('click', function() {
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
        
        if (step3Video) step3Video.style.display = 'none';
        if (step1Card) step1Card.style.display = 'block';
        
        if (card) card.classList.remove('flipped');
        isFlipped = false;
        
        if (nextToAudioBtn) nextToAudioBtn.style.display = 'none';
        if (shareCardBtn) shareCardBtn.style.display = 'none';
        
        if (drawBtn) drawBtn.style.display = 'block';
        checkTimer();

        if (typeof window.updateEventTimer === 'function') {
            window.updateEventTimer();
        }
    }

    resetPracticeBtn.addEventListener('click', resetToStart);

    // --- ШАГ 2: АУДИО И ПЕРЕХОД К ФИНАЛЬНОМУ ВИДЕО ---
    const audioPlayer = document.getElementById('audioPlayer');
    const audioTitle = document.getElementById('audioTitle');
    const shareAudioBtn = document.getElementById('shareAudioBtn'); 
    
    let currentAudioName = "";
    let audioCtx, gainNode, videoSource;

    function startRandomAudio() {
        // === ИСПОЛЬЗУЕМ ДАННЫЕ ИЗ appData.js ===
        if (typeof AUDIO_TRACKS_DATA !== 'undefined' && AUDIO_TRACKS_DATA.length > 0) {
            const randomAudioIndex = Math.floor(Math.random() * AUDIO_TRACKS_DATA.length);
            const selectedAudio = AUDIO_TRACKS_DATA[randomAudioIndex];

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
    }

    if (nextToAudioBtn) {
        nextToAudioBtn.addEventListener('click', () => {
            if (step1Card) step1Card.style.display = 'none';
            if (step2Audio) step2Audio.style.display = 'flex'; 
            startRandomAudio();
        });
    }

    if (shareAudioBtn) {
        shareAudioBtn.addEventListener('click', () => {
            const text = `🎧 Я прослушала трансформационное послание «${currentAudioName}». Узнай, что Вселенная хочет сказать тебе:`;
            const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(BOT_LINK)}&text=${encodeURIComponent(text)}`;
            if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData) {
                window.Telegram.WebApp.openTelegramLink(shareUrl);
            } else {
                window.open(shareUrl, '_blank');
            }

            if (window.Telegram?.WebApp?.expand) {
                window.Telegram.WebApp.expand();
            }
        });
    }

    // Автопереход к третьему шагу (Финальное Видео)
    const finalVideoContainer = document.getElementById('finalVideoContainer');

    if (audioPlayer) {
        audioPlayer.addEventListener('ended', () => {
            if (step2Audio) step2Audio.style.display = 'none';
            if (step3Video) step3Video.style.display = 'block';
            
            // === ИСПОЛЬЗУЕМ ДАННЫЕ ИЗ appData.js ===
            if (typeof FINAL_VIDEOS_DATA !== 'undefined' && FINAL_VIDEOS_DATA.length > 0) {
                const randomFinalVideo = FINAL_VIDEOS_DATA[Math.floor(Math.random() * FINAL_VIDEOS_DATA.length)];
                if (finalVideoPlayer) finalVideoPlayer.src = randomFinalVideo;
            }
            
            try {
                if (!audioCtx && finalVideoPlayer) {
                    const AudioContext = window.AudioContext || window.webkitAudioContext;
                    audioCtx = new AudioContext();
                    videoSource = audioCtx.createMediaElementSource(finalVideoPlayer);
                    gainNode = audioCtx.createGain();
                    gainNode.gain.value = 3.0; 
                    videoSource.connect(gainNode);
                    gainNode.connect(audioCtx.destination);
                }
                if (audioCtx && audioCtx.state === 'suspended') {
                    audioCtx.resume();
                }
            } catch (e) {
                console.log("Усиление звука не поддерживается", e);
            }
            
            if (replayFinalVideo) replayFinalVideo.style.display = 'none'; 
            
            if (finalVideoPlayer) {
                finalVideoPlayer.play().catch(err => {
                    if (replayFinalVideo) replayFinalVideo.style.display = 'flex';
                });
            }
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

    // Event popup logic is handled dynamically in eventPopup.js
});

