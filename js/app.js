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
    // ЛОГИКА ПОТОКА И СОХРАНЕНИЯ (КАРТА ДНЯ)
    // ==========================================
    const card = document.getElementById('mysticCard');
    const cardResultImg = document.getElementById('cardResult');
    const drawBtn = document.getElementById('drawCardBtn');
    const shareCardBtn = document.getElementById('shareCardBtn');
    
    const step1Card = document.getElementById('step1-card');
    const step2Audio = document.getElementById('step2-audio');
    const step3Video = document.getElementById('step3-video'); 
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

    function checkTimer() {
        if (isUserVip()) return true; // Отключаем таймер для VIP
        
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
            // Мгновенно скрываем кнопку анонса, чтобы не было задержки
            const eventBtn = document.getElementById('eventPromoBtn');
            if (eventBtn) eventBtn.style.display = 'none';

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
                ym(110909428, 'reachGoal', 'draw_card');
            }

            drawBtn.style.display = 'none';
            if (versionLabel) versionLabel.style.display = 'none';

            setTimeout(() => {
                nextToAudioBtn.style.display = 'block';
                shareCardBtn.style.display = 'block';
            }, 800);
        };
    }

    drawBtn.addEventListener('click', drawRandomCard);

    // ==========================================
    // ЛОГИКА АУДИО И ФИНАЛЬНОГО ВИДЕО
    // ==========================================
    const audioPlayer = document.getElementById('audioPlayer');
    const audioTitle = document.getElementById('audioTitle');
    const shareAudioBtn = document.getElementById('shareAudioBtn');
    
    const finalVideoPlayer = document.getElementById('finalVideoPlayer');
    const replayFinalVideo = document.getElementById('replayFinalVideo');
    const resetPracticeBtn = document.getElementById('resetPracticeBtn');
    const finalVideoContainer = document.getElementById('finalVideoContainer');

    // Настройка финального видео
    finalVideoPlayer.src = "images/final_video.mp4"; // Убедитесь, что файл существует
    finalVideoPlayer.muted = false;
    finalVideoPlayer.loop = false;

    // Авто-плей видео-аватара на шаге 2
    function playAvatarVideo() {
        avatarVideo.play().catch(e => {
            console.log("Автоплей аватара заблокирован, нужно взаимодействие пользователя.");
        });
    }

    nextToAudioBtn.addEventListener('click', () => {
        step1Card.style.display = 'none';
        step2Audio.style.display = 'block';
        
        playAvatarVideo(); 
        
        let fileId = currentCardPath.split('/')[1].split('.')[0];
        const msgText = getMessageData(fileId); 
        audioTitle.innerText = msgText;

        audioPlayer.src = `audio/${fileId}.mp3`; 
        audioPlayer.play().catch(e => console.log("Автоплей аудио заблокирован."));

        // --- ОТПРАВКА ЦЕЛИ В ЯНДЕКС МЕТРИКУ: Переход к аудио ---
        if (typeof ym !== 'undefined') {
            ym(110909428, 'reachGoal', 'go_to_audio');
        }
    });

    audioPlayer.addEventListener('ended', () => {
        shareAudioBtn.style.display = 'block';
        
        setTimeout(() => {
            step2Audio.style.display = 'none';
            step3Video.style.display = 'block';
            
            finalVideoPlayer.play().catch(e => {
                console.log("Автоплей финального видео заблокирован.");
                replayFinalVideo.style.display = 'flex';
            });
        }, 1500); 
    });

    finalVideoPlayer.addEventListener('ended', () => {
        replayFinalVideo.style.display = 'flex';
    });

    finalVideoContainer.addEventListener('click', () => {
        if (finalVideoPlayer.paused || finalVideoPlayer.ended) {
            finalVideoPlayer.play();
            replayFinalVideo.style.display = 'none';
        } else {
            finalVideoPlayer.pause();
            replayFinalVideo.style.display = 'flex';
        }
    });

    resetPracticeBtn.addEventListener('click', () => {
        step3Video.style.display = 'none';
        step1Card.style.display = 'block';
        
        card.classList.remove('flipped');
        isFlipped = false;
        
        nextToAudioBtn.style.display = 'none';
        shareCardBtn.style.display = 'none';
        shareAudioBtn.style.display = 'none';
        
        drawBtn.style.display = 'block';
        if (versionLabel) versionLabel.style.display = 'block';
        checkTimer(); 
    });

    // ==========================================
    // ЛОГИКА ШЕРИНГА (ОБЩАЯ)
    // ==========================================
    const shareOptionsModal = document.getElementById('shareOptionsModal');
    const closeShareModal = document.getElementById('closeShareModal');
    const shareToFriendBtn = document.getElementById('shareToFriendBtn');
    const shareToUniverseBtn = document.getElementById('shareToUniverseBtn');

    let currentShareContext = 'card'; 

    shareCardBtn.addEventListener('click', () => {
        currentShareContext = 'card';
        shareOptionsModal.classList.add('active');
        
        // --- ОТПРАВКА ЦЕЛИ В ЯНДЕКС МЕТРИКУ: Поделиться картой (нажатие) ---
        if (typeof ym !== 'undefined') {
            ym(110909428, 'reachGoal', 'share_card_click');
        }
    });

    shareAudioBtn.addEventListener('click', () => {
        currentShareContext = 'audio';
        shareOptionsModal.classList.add('active');
        
        // --- ОТПРАВКА ЦЕЛИ В ЯНДЕКС МЕТРИКУ: Поделиться аудио (нажатие) ---
        if (typeof ym !== 'undefined') {
            ym(110909428, 'reachGoal', 'share_audio_click');
        }
    });

    closeShareModal.addEventListener('click', () => {
        shareOptionsModal.classList.remove('active');
    });

    shareToFriendBtn.addEventListener('click', () => {
        shareOptionsModal.classList.remove('active');
        const botUrl = BOT_LINK;
        let text = currentShareContext === 'card' 
            ? `Смотри, какую карту дня я вытянула! ✨ Присоединяйся и получи свое послание от Вселенной:`
            : `Послушай это волшебное послание на день! ✨ Заходи в бота и получай свои подсказки от Вселенной:`;
            
        const shareUrl = `https://t.me/share/url?text=${encodeURIComponent(text)}&url=${encodeURIComponent(botUrl)}`;
        
        // --- ОТПРАВКА ЦЕЛИ В ЯНДЕКС МЕТРИКУ: Успешный шеринг другу ---
        if (typeof ym !== 'undefined') {
            ym(110909428, 'reachGoal', currentShareContext === 'card' ? 'share_card_friend' : 'share_audio_friend');
        }

        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.openTelegramLink) {
            window.Telegram.WebApp.openTelegramLink(shareUrl);
        } else {
            window.open(shareUrl, '_blank');
        }
    });

    shareToUniverseBtn.addEventListener('click', () => {
        shareOptionsModal.classList.remove('active');
        const botUrl = BOT_LINK;
        let text = currentShareContext === 'card' 
            ? `Моя карта дня! ✨ Получи свое послание от Вселенной тут: ${botUrl}`
            : `Волшебное послание на день! ✨ Присоединяйтесь: ${botUrl}`;
            
        // --- ОТПРАВКА ЦЕЛИ В ЯНДЕКС МЕТРИКУ: Успешный шеринг в сторис ---
        if (typeof ym !== 'undefined') {
            ym(110909428, 'reachGoal', currentShareContext === 'card' ? 'share_card_story' : 'share_audio_story');
        }

        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.switchInlineQuery) {
            window.Telegram.WebApp.switchInlineQuery(text, ['users']);
        } else {
            const fallbackUrl = `https://t.me/share/url?text=${encodeURIComponent(text)}`;
            window.open(fallbackUrl, '_blank');
        }
    });

    // ==========================================
    // ЛОГИКА КОЛЛЕКЦИИ (ТАЙМЛАЙН)
    // ==========================================
    const collectionWrapper = document.getElementById('collectionWrapper');
    const emptyCollectionMsg = document.getElementById('emptyCollection');
    const swiperContainer = document.getElementById('collectionSwiperContainer');
    const timelineNav = document.getElementById('timelineNav');
    
    let collectionSwiper;

    function renderCollection() {
        const data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        
        if (data.length === 0) {
            emptyCollectionMsg.style.display = 'block';
            swiperContainer.style.display = 'none';
            timelineNav.style.display = 'none';
            return;
        }

        emptyCollectionMsg.style.display = 'none';
        swiperContainer.style.display = 'block';
        timelineNav.style.display = 'flex';

        // Сортируем от самых свежих к старым
        data.sort((a, b) => new Date(b.date) - new Date(a.date));

        collectionWrapper.innerHTML = '';
        timelineNav.innerHTML = '';
        
        // Группируем по месяцам для таймлайна
        const monthsData = {};
        
        data.forEach((item, index) => {
            const dateObj = new Date(item.date);
            const monthYear = dateObj.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
            
            if (!monthsData[monthYear]) {
                monthsData[monthYear] = index; // Индекс первого слайда в этом месяце
            }

            const slide = document.createElement('div');
            slide.className = 'swiper-slide';
            
            const formattedDate = dateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
            
            // Если есть текст в appData.js, выводим его. Иначе пусто.
            const cardText = getMessageData(item.id); 
            
            slide.innerHTML = `
                <div class="collection-date">${formattedDate}</div>
                <img src="images/${item.id}.jpeg" class="collection-card-img" alt="Карта">
                ${item.count > 1 ? `<div class="sync-msg">Синхронность Вселенной: Выпадала ${item.count} раз(а) ✨</div>` : ''}
                <div class="video-title" style="margin-bottom:10px; font-weight: 500;">${cardText}</div>
                
                <button class="action-btn share-btn collection-share-btn" data-url="${BOT_LINK}" data-id="${item.id}">
                    Поделиться инсайтом 💫
                </button>
            `;
            collectionWrapper.appendChild(slide);
        });

        // Создаем кнопки месяцев в таймлайне
        Object.keys(monthsData).forEach((monthStr, i) => {
            const btn = document.createElement('button');
            btn.className = `month-btn ${i === 0 ? 'active' : ''}`;
            btn.innerText = monthStr.charAt(0).toUpperCase() + monthStr.slice(1);
            btn.dataset.index = monthsData[monthStr];
            
            btn.addEventListener('click', () => {
                document.querySelectorAll('.month-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                if (collectionSwiper) {
                    collectionSwiper.slideTo(parseInt(btn.dataset.index));
                }
            });
            
            timelineNav.appendChild(btn);
        });

        if (collectionSwiper) {
            collectionSwiper.destroy(true, true);
        }
        
        collectionSwiper = new Swiper('.collectionSwiper', {
            slidesPerView: 1,
            spaceBetween: 20,
            autoHeight: true,
            on: {
                slideChange: function () {
                    updateTimelineActive(this.activeIndex, monthsData);
                }
            }
        });

        // Обработчики для кнопок шеринга в коллекции
        document.querySelectorAll('.collection-share-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const botUrl = e.target.dataset.url;
                const text = `Смотри, какое невероятное послание я сохранила в своей коллекции! ✨ Получи свою подсказку от Вселенной:`;
                const shareUrl = `https://t.me/share/url?text=${encodeURIComponent(text)}&url=${encodeURIComponent(botUrl)}`;
                
                // --- ОТПРАВКА ЦЕЛИ В ЯНДЕКС МЕТРИКУ: Шеринг из коллекции ---
                if (typeof ym !== 'undefined') {
                    ym(110909428, 'reachGoal', 'share_from_collection');
                }

                if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.openTelegramLink) {
                    window.Telegram.WebApp.openTelegramLink(shareUrl);
                } else {
                    window.open(shareUrl, '_blank');
                }
            });
        });
    }

    function updateTimelineActive(activeIndex, monthsData) {
        const monthKeys = Object.keys(monthsData);
        let currentMonthKey = monthKeys[0];
        
        for (let i = monthKeys.length - 1; i >= 0; i--) {
            if (activeIndex >= monthsData[monthKeys[i]]) {
                currentMonthKey = monthKeys[i];
                break;
            }
        }
        
        document.querySelectorAll('.month-btn').forEach(b => {
            if (b.innerText.toLowerCase() === currentMonthKey.toLowerCase()) {
                b.classList.add('active');
                b.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            } else {
                b.classList.remove('active');
            }
        });
    }

    // ==========================================
    // ЛОГИКА ВИДЕОТЕКИ (ОТКРЫТЫЕ ПРАКТИКИ)
    // ==========================================
    const videoGallery = document.getElementById('videoGallery');
    const videoModal = document.getElementById('videoModal');
    const modalVideoWrap = document.getElementById('modalVideoWrap');
    const closeModal = document.getElementById('closeModal');

    function renderVideos() {
        if (typeof videoData === 'undefined' || videoData.length === 0) {
            videoGallery.innerHTML = '<p style="text-align:center; grid-column: 1 / -1;">Практики загружаются...</p>';
            return;
        }

        videoGallery.innerHTML = '';
        videoData.forEach(video => {
            const item = document.createElement('div');
            item.className = 'video-item';
            item.dataset.embed = video.embedUrl;
            
            // Если есть id, берем стандартное превью YT. Иначе можно использовать дефолтную картинку.
            const thumbnailUrl = video.id ? `https://img.youtube.com/vi/${video.id}/mqdefault.jpg` : 'images/default_video.jpg';

            item.innerHTML = `
                <div class="video-thumb">
                    <img src="${thumbnailUrl}" alt="${video.title}">
                    <div class="play-icon"></div>
                </div>
                <div class="video-title">${video.title}</div>
            `;
            
            item.addEventListener('click', () => {
                openVideoModal(video.embedUrl);
            });
            
            videoGallery.appendChild(item);
        });
    }

    function openVideoModal(embedUrl) {
        // --- ОТПРАВКА ЦЕЛИ В ЯНДЕКС МЕТРИКУ: Просмотр видео в Видеотеке ---
        if (typeof ym !== 'undefined') {
            ym(110909428, 'reachGoal', 'watch_video_library');
        }

        modalVideoWrap.innerHTML = `<iframe src="${embedUrl}?autoplay=1&rel=0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
        videoModal.classList.add('active');
    }

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

    renderVideos();

    // ==========================================
    // ЛОГИКА АНОНСА И СОБЫТИЯ
    // ==========================================
    if (typeof EVENT_CONFIG !== 'undefined' && EVENT_CONFIG.isActive) {
        const eventPromoBlock = document.getElementById('eventPromoBlock');
        const eventTitleDisplay = document.getElementById('eventTitleDisplay');
        const eventDateDisplay = document.getElementById('eventDateDisplay');
        const eventPriceDisplay = document.getElementById('eventPriceDisplay');
        const eventBannerImg = document.getElementById('eventBannerImg');
        const eventShareBtn = document.getElementById('eventShareBtn');
        const copyAndApplyPromoBtn = document.getElementById('copyAndApplyPromoBtn');
        const eventInitialActions = document.getElementById('eventInitialActions');
        const promoRewardBlock = document.getElementById('promoRewardBlock');

        if (eventPromoBlock) {
            eventTitleDisplay.innerText = EVENT_CONFIG.title;
            
            const eventDate = new Date(EVENT_CONFIG.date);
            const formattedDate = eventDate.toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit'
            });
            eventDateDisplay.innerText = `Дата: ${formattedDate}`;
            eventPriceDisplay.innerText = `Стоимость: ${EVENT_CONFIG.price}`;
            eventBannerImg.src = EVENT_CONFIG.imagePath;

            eventPromoBlock.style.display = 'block';
        }

        if (eventShareBtn) {
            eventShareBtn.addEventListener('click', () => {
                const shareText = `Привет, дорогая! Я иду в классное поле на медитацию «${EVENT_CONFIG.title}». Почувствовала, что хочу разделить это с тобой ✨\n\nДержи от меня подарок — промокод на 15%: ${EVENT_CONFIG.promoReceiver}\n\nПодробности тут: ${BOT_LINK}`;
                const shareUrl = `https://t.me/share/url?text=${encodeURIComponent(shareText)}`;

                if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.openTelegramLink) {
                    window.Telegram.WebApp.openTelegramLink(shareUrl);
                } else {
                    window.open(shareUrl, '_blank');
                }

                if (eventInitialActions) eventInitialActions.style.display = 'none';
                if (promoRewardBlock) promoRewardBlock.style.display = 'block';

                if (typeof ym !== 'undefined') {
                    ym(110909428, 'reachGoal', 'event_share_click');
                }
            });
        }

        if (copyAndApplyPromoBtn) {
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
    }
    
    // Вызов расширения App на весь экран 
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.expand();
    }
});