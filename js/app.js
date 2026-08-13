document.addEventListener('DOMContentLoaded', () => {
    
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

    checkTimer();

    function saveCardToCollection(cardNum) {
        let collection = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        const existingIndex = collection.findIndex(c => c.id === cardNum);
        const now = new Date().toISOString();

        if (existingIndex !== -1) {
            collection[existingIndex].count += 1;
            collection[existingIndex].date = now;
        } else {
            collection.push({ id: cardNum, date: now, count: 1 });
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(collection));
    }

    function drawRandomCard() {
        if (!isFlipped && checkTimer()) {
            localStorage.setItem('lastDrawTime', Date.now()); 
            setNewCard();
        }
    }

    function setNewCard() {
        const randomNum = Math.floor(Math.random() * TOTAL_CARDS) + 1;
        currentCardPath = `images/${randomNum}.jpeg`; 
        cardResultImg.src = currentCardPath; 
        cardResultImg.onload = () => {
            card.classList.add('flipped');
            isFlipped = true;
            
            saveCardToCollection(randomNum);

            // --- ОТПРАВКА ЦЕЛИ В ЯНДЕКС МЕТРИКУ: Выбор карты ---
            if (typeof ym !== 'undefined') {
                ym(110909428, 'reachGoal', 'get_card');
            }
            
            drawBtn.style.display = 'none';

            setTimeout(() => { 
                nextToAudioBtn.style.display = 'block';
                shareCardBtn.style.display = 'block'; 
            }, 500);
        };
    }

    drawBtn.addEventListener('click', drawRandomCard);
    card.addEventListener('click', drawRandomCard);

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
        let collection = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
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
        
        finalVideoPlayer.pause();
        finalVideoPlayer.currentTime = 0;
        
        replayFinalVideo.style.display = 'none'; 
        
        step3Video.style.display = 'none';
        step1Card.style.display = 'block';
        
        card.classList.remove('flipped');
        isFlipped = false;
        
        nextToAudioBtn.style.display = 'none';
        shareCardBtn.style.display = 'none';
        
        drawBtn.style.display = 'block';
        checkTimer();
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
        const randomAudioIndex = Math.floor(Math.random() * AUDIO_TRACKS_DATA.length);
        const selectedAudio = AUDIO_TRACKS_DATA[randomAudioIndex];

        currentAudioName = selectedAudio.title;
        audioTitle.innerText = `«${currentAudioName}»`;
        
        audioPlayer.src = `audio/${selectedAudio.id}.mp3`;
        
        audioPlayer.play();
        if (avatarVideo) {
            avatarVideo.play().catch(err => console.log("Видео заблокировано:", err));
        }
        
        shareAudioBtn.style.display = 'block';
    }

    nextToAudioBtn.addEventListener('click', () => {
        step1Card.style.display = 'none';
        step2Audio.style.display = 'flex'; 
        startRandomAudio();
    });

    shareAudioBtn.addEventListener('click', () => {
        const text = `🎧 Я прослушала трансформационное послание «${currentAudioName}». Узнай, что Вселенная хочет сказать тебе:`;
        const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(BOT_LINK)}&text=${encodeURIComponent(text)}`;
        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData) {
            window.Telegram.WebApp.openTelegramLink(shareUrl);
        } else {
            window.open(shareUrl, '_blank');
        }
    });

    // Автопереход к третьему шагу (Финальное Видео)
    const finalVideoContainer = document.getElementById('finalVideoContainer');

    audioPlayer.addEventListener('ended', () => {
        step2Audio.style.display = 'none';
        step3Video.style.display = 'block';
        
        // === ИСПОЛЬЗУЕМ ДАННЫЕ ИЗ appData.js ===
        const randomFinalVideo = FINAL_VIDEOS_DATA[Math.floor(Math.random() * FINAL_VIDEOS_DATA.length)];
        finalVideoPlayer.src = randomFinalVideo;
        
        try {
            if (!audioCtx) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                audioCtx = new AudioContext();
                videoSource = audioCtx.createMediaElementSource(finalVideoPlayer);
                gainNode = audioCtx.createGain();
                gainNode.gain.value = 3.0; 
                videoSource.connect(gainNode);
                gainNode.connect(audioCtx.destination);
            }
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
        } catch (e) {
            console.log("Усиление звука не поддерживается", e);
        }
        
        replayFinalVideo.style.display = 'none'; 
        
        finalVideoPlayer.play().catch(err => {
            replayFinalVideo.style.display = 'flex';
        });
    });

    finalVideoPlayer.addEventListener('ended', () => {
        replayFinalVideo.style.display = 'flex';
        autoResetTimeout = setTimeout(resetToStart, 20000); 
    });

    finalVideoContainer.addEventListener('click', () => {
        if (finalVideoPlayer.paused || finalVideoPlayer.ended) {
            if (autoResetTimeout) clearTimeout(autoResetTimeout);
            if (finalVideoPlayer.ended) finalVideoPlayer.currentTime = 0;
            replayFinalVideo.style.display = 'none';
            finalVideoPlayer.play();
        } else {
            finalVideoPlayer.pause();
            replayFinalVideo.style.display = 'flex';
        }
    });

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
    // ЛОГИКА АНОНСА И ТАЙМЕРА (ПРОМОКОДЫ)
    // ==========================================
    if (typeof EVENT_CONFIG !== 'undefined' && EVENT_CONFIG.isActive) {
        const eventTimerBanner = document.getElementById('eventTimerBanner');
        const eventTimerCountdown = document.getElementById('eventTimerCountdown');
        
        const eventModal = document.getElementById('eventModal');
        const closeEventModal = document.getElementById('closeEventModal');
        const eventModalImg = document.getElementById('eventModalImg');
        const eventModalTitle = document.getElementById('eventModalTitle');
        const eventModalDate = document.getElementById('eventModalDate');
        
        const eventInitialActions = document.getElementById('eventInitialActions');
        const eventRegisterBtn = document.getElementById('eventRegisterBtn');
        const eventShareBtn = document.getElementById('eventShareBtn');
        const promoRewardBlock = document.getElementById('promoRewardBlock');
        const senderPromoCodeBox = document.getElementById('senderPromoCodeBox');
        const copyAndApplyPromoBtn = document.getElementById('copyAndApplyPromoBtn');

        const eventDate = new Date(EVENT_CONFIG.date).getTime();

        eventModalImg.src = EVENT_CONFIG.imagePath;
        eventModalTitle.innerText = EVENT_CONFIG.title;
        
        const formatOpts = { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' };
        eventModalDate.innerText = new Date(EVENT_CONFIG.date).toLocaleDateString('ru-RU', formatOpts);
        senderPromoCodeBox.innerText = EVENT_CONFIG.promoSender;

        function updateEventTimer() {
            const now = new Date().getTime();
            const distance = eventDate - now;

            if (distance < 0) {
                eventTimerBanner.style.display = 'none';
                return false;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

            eventTimerCountdown.innerText = `${days} дн : ${hours} ч : ${minutes} мин`;
            eventTimerBanner.style.display = 'flex';
            return true;
        }

        if (updateEventTimer()) {
            setInterval(updateEventTimer, 60000);
        }

        function openEventModal() {
            eventModal.classList.add('active');
            promoRewardBlock.style.display = 'none';
            eventInitialActions.style.display = 'block';
        }

        eventTimerBanner.addEventListener('click', openEventModal);
        closeEventModal.addEventListener('click', () => eventModal.classList.remove('active'));

        const nowMs = new Date().getTime();
        const hoursUntilEvent = (eventDate - nowMs) / (1000 * 60 * 60);
        
        const isFirstShown = localStorage.getItem('promo_first_shown');
        const isLastDayShown = localStorage.getItem('promo_last_day_shown');

        if (hoursUntilEvent > 24 && !isFirstShown) {
            setTimeout(openEventModal, 1500);
            localStorage.setItem('promo_first_shown', 'true');
        } else if (hoursUntilEvent <= 24 && hoursUntilEvent > 0 && !isLastDayShown) {
            setTimeout(openEventModal, 1500);
            localStorage.setItem('promo_first_shown', 'true');
            localStorage.setItem('promo_last_day_shown', 'true');
        }

        eventRegisterBtn.addEventListener('click', () => {
            if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.openLink) {
                window.Telegram.WebApp.openLink(EVENT_CONFIG.registrationLink);
            } else {
                window.open(EVENT_CONFIG.registrationLink, '_blank');
            }
        });

        eventShareBtn.addEventListener('click', () => {
            const shareText = `Привет, дорогая! Я иду в классное поле на медитацию «${EVENT_CONFIG.title}». Почувствовала, что хочу разделить это с тобой ✨

Держи от меня подарок — промокод на 15%: ${EVENT_CONFIG.promoReceiver}

Подробности тут: ${BOT_LINK}`;
            const shareUrl = `https://t.me/share/url?text=${encodeURIComponent(shareText)}`;

            if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.openTelegramLink) {
                window.Telegram.WebApp.openTelegramLink(shareUrl);
            } else {
                window.open(shareUrl, '_blank');
            }

            eventInitialActions.style.display = 'none';
            promoRewardBlock.style.display = 'block';

            if (typeof ym !== 'undefined') {
                ym(110909428, 'reachGoal', 'event_share_click');
            }
        });

        copyAndApplyPromoBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(EVENT_CONFIG.promoSender).then(() => {
                const linkWithPromo = `${EVENT_CONFIG.registrationLink}?promo=${EVENT_CONFIG.promoSender}`;
                
                if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.openLink) {
                    window.Telegram.WebApp.openLink(linkWithPromo);
                } else {
                    window.open(linkWithPromo, '_blank');
                }
            }).catch(err => {
                console.error('Ошибка копирования', err);
            });
        });
    }
});
