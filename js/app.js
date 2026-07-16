document.addEventListener('DOMContentLoaded', () => {
    
    // --- НАСТРОЙКИ ---
    const BOT_LINK = "https://t.me/Djamiliakha_bot"; // Ваша актуальная ссылка на бота
    const TOTAL_CARDS = 71; 
    const STORAGE_KEY = "mystic_collection"; // Ключ для локального хранилища коллекции

    // Полная база аудиопосланий
    const audioData = [
        { id: 1, title: "Доверие или контроль" }, { id: 2, title: "Доверие" }, { id: 3, title: "Драгоценность" },
        { id: 4, title: "Дух и Душа" }, { id: 5, title: "Дух" }, { id: 6, title: "Духовный путь" },
        { id: 7, title: "Душа и Маски" }, { id: 8, title: "Душа Мастера" }, { id: 9, title: "Дыши сердцем" },
        { id: 10, title: "Единство мироздания" }, { id: 11, title: "Желание души" }, { id: 12, title: "Желания Души" },
        { id: 13, title: "Женская Энергия" }, { id: 14, title: "Женское сердце" }, { id: 15, title: "Женственность" },
        { id: 16, title: "Звездная семья" }, { id: 17, title: "Звездные дары" }, { id: 18, title: "Земля и небеса" },
        { id: 19, title: "Источник творения в сердце" }, { id: 20, title: "Исцеление" }, { id: 21, title: "Иштар божественное женское" },
        { id: 22, title: "Качества души" }, { id: 23, title: "Ключ наслаждения" }, { id: 24, title: "Коды Души" },
        { id: 25, title: "Кокон любви" }, { id: 26, title: "Краски жизни" }, { id: 27, title: "Лотос Сердца" },
        { id: 28, title: "Любовь внутри" }, { id: 29, title: "Любовь" }, { id: 30, title: "Любовь" },
        { id: 31, title: "Любящее сердце" }, { id: 32, title: "Мастерство" }, { id: 33, title: "Материя" },
        { id: 34, title: "Матрица бытия" }, { id: 35, title: "Место силы" }, { id: 36, title: "Мирный воин" },
        { id: 37, title: "Миссия духа" }, { id: 38, title: "Миссия Духа" }, { id: 39, title: "Мужское начало" },
        { id: 40, title: "Настройка на закрытие коридора затмений" }, { id: 41, title: "Новатор" }, { id: 42, title: "Новые времена" },
        { id: 43, title: "Новый цикл" }, { id: 44, title: "Отпускай Контроль" }, { id: 45, title: "Пламя творца" },
        { id: 46, title: "Поколения" }, { id: 47, title: "Порядок" }, { id: 48, title: "Послание Матери Мира" },
        { id: 49, title: "Потенциал" }, { id: 50, title: "Примирение" }, { id: 51, title: "Природа женщины" },
        { id: 52, title: "Пробуждение" }, { id: 53, title: "Путь Ангела" }, { id: 54, title: "Путь жизни" },
        { id: 55, title: "Путь Мастера" }, { id: 56, title: "Путь пройден" }, { id: 57, title: "Путь процветания" },
        { id: 58, title: "Разговор сердца" }, { id: 59, title: "Разрешение кармы рода" }, { id: 60, title: "Распутье" },
        { id: 61, title: "Реализация в масштабе" }, { id: 62, title: "Реализация даров души" }, { id: 63, title: "Реализация и ожидания" },
        { id: 64, title: "Реализация" }, { id: 65, title: "Родовая система" }, { id: 66, title: "Роли" },
        { id: 67, title: "Самоценность" }, { id: 68, title: "Свет и любовь" }, { id: 69, title: "Свет на Земле" },
        { id: 70, title: "Свобода" }, { id: 71, title: "Свободный выбор" }, { id: 72, title: "Семена Жизни" },
        { id: 73, title: "Сила слова" }, { id: 74, title: "Созерцание" }, { id: 75, title: "Сотворчество" },
        { id: 76, title: "Творение в любви" }, { id: 77, title: "Творение и Творец" }, { id: 78, title: "Тонкие энергии Души" },
        { id: 79, title: "Тотальность" }, { id: 80, title: "Уверенность в себе" }, { id: 81, title: "Уникальность" },
        { id: 82, title: "Физическое тело" }, { id: 83, title: "Цветок любви" }, { id: 84, title: "Ценность пути" },
        { id: 85, title: "Циклы" }, { id: 86, title: "Чёрное и белое. Свет и тени" }, { id: 87, title: "Чистота" },
        { id: 88, title: "Шаг к себе" }, { id: 89, title: "Энергии творца" }, { id: 90, title: "Энергия Земли" },
        { id: 91, title: "Энергия перемен" }, { id: 92, title: "Новый мир 💫" }, { id: 93, title: "Ангелы на Земле" },
        { id: 94, title: "Баланс мужского и женского" }, { id: 95, title: "Берегиня" }, { id: 96, title: "Бескорыстность" },
        { id: 97, title: "Благословение пути" }, { id: 98, title: "Божественная Любовь из сердца источника" }, { id: 99, title: "Божественный дух" },
        { id: 100, title: "Божественный план" }, { id: 101, title: "Божественный ребенок" }, { id: 102, title: "Ведущий" },
        { id: 103, title: "Величие духа" }, { id: 104, title: "Вертикаль Божественного Духа" }, { id: 105, title: "Вертикаль" },
        { id: 106, title: "Вместе с Богом" }, { id: 107, title: "Время и циклы" }, { id: 108, title: "Все в тебе" },
        { id: 109, title: "Вспомни Себя" }, { id: 110, title: "Выбирая свет ты можешь светить" }, { id: 111, title: "Высшая Истина" },
        { id: 112, title: "Высшие Планы справедливости" }, { id: 113, title: "Гордыня" }, { id: 114, title: "Дары Духа" },
        { id: 115, title: "Дары души" }, { id: 116, title: "Дары Земли" }, { id: 117, title: "Дверь Любви" },
        { id: 118, title: "Движение" }, { id: 119, title: "Доверие" }, { id: 120, title: "Доверие (2)" }
    ];

    const videoData = [
        { id: "thwMwndsIbs", title: "БОЖЕСТВЕННАЯ ЛЮБОВЬ. Инициация" },
        { id: "i9XDsrUCGuA", title: "Энергия Плеяд и Альционы" },
        { id: "QenCbqfw3pc", title: "Врата Просветления" },
        { id: "i_S7eXWZmQo", title: "Духовное Пробуждение" },
        { id: "TZo1nK9gu_8", title: "Сакральная Женственность" },
        { id: "znoOuxhSDwo", title: "Исцеление Сердца" },
        { id: "5wEu-jPLVwg", title: "Прямой эфир — Ответы на вопросы" },
        { id: "sOiEJhdPIh4", title: "Послания Нового Времени" },
        { id: "0YDP8-dqNLg", title: "Родовые Кармические Узлы" },
        { id: "ZnOiO9UM22E", title: "Медитация Творения" },
        { id: "I2JwWTd0p5U", title: "Сила Звездных Родов" },
        { id: "NqQDJt_XhTo", title: "Энергетическая Настройка" },
        { id: "uXkuOXe9mcA", title: "Отпускание Контроля и Эго" },
        { id: "TA2YCIr3UWU", title: "Высшая Истина Души" },
        { id: "iNK061_YtHY", title: "Божественное Процветание" }
    ];

    // --- ЛОГИКА ГЛАВНЫХ ВКЛАДОК ---
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
            
            // Если открыли коллекцию, перерисовываем ее
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

    // --- ШАГ 1: КАРТА ---
    const card = document.getElementById('mysticCard');
    const drawBtn = document.getElementById('drawCardBtn');
    const cardResultImg = document.getElementById('cardResult');
    const shareCardBtn = document.getElementById('shareCardBtn'); 
    const nextToAudioBtn = document.getElementById('nextToAudioBtn');
    const avatarVideo = document.getElementById('avatarVideo');
    
    let isFlipped = false;
    let currentCardPath = ""; 

    // === ЛОГИКА ТАЙМЕРА (6 ЧАСОВ) ===
    const COOLDOWN_MS = 6 * 60 * 60 * 1000; // 6 часов в миллисекундах
    let countdownInterval; // Глобальная переменная для интервала

    function formatTime(ms) {
        const totalSeconds = Math.ceil(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        if (hours > 0) {
            return `${hours}ч ${minutes}м`;
        } else if (minutes > 0) {
            return `${minutes}м ${seconds}с`;
        } else {
            return `${seconds} сек.`;
        }
    }

    function checkTimer() {
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
        if (countdownInterval) clearInterval(countdownInterval); // Очищаем старый таймер во избежание багов
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
    // =========================================

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

    let activeSharePath = ""; // Переменная для хранения пути текущей карточки для шеринга

    // Клик по кнопке "Поделиться" на главной странице
    shareCardBtn.addEventListener('click', () => {
        activeSharePath = currentCardPath;
        shareOptionsModal.classList.add('active');
    });

    closeShareModal.addEventListener('click', () => {
        shareOptionsModal.classList.remove('active');
    });

    shareToFriendBtn.addEventListener('click', () => {
        const text = "Привет Нашла классное приложение по метафорическим картам.";
        const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(BOT_LINK)}&text=${encodeURIComponent(text)}`;
        
        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData) {
            window.Telegram.WebApp.openTelegramLink(shareUrl);
        } else {
            window.open(shareUrl, '_blank');
        }
        shareOptionsModal.classList.remove('active');
    });

    shareToUniverseBtn.addEventListener('click', () => {
        shareToStories(activeSharePath); // Отправляем именно активную карту (с главной или из коллекции)
        shareOptionsModal.classList.remove('active');
    });

    function shareToStories(imagePath) {
        if (!window.Telegram || !window.Telegram.WebApp) {
            console.error("Telegram WebApp API не найдено");
            return;
        }
        const webApp = window.Telegram.WebApp;

        if (!webApp.isVersionAtLeast('7.8')) {
            webApp.showAlert("Извините, ваша версия Telegram не поддерживает шеринг в сторис. Воспользуйтесь кнопкой «Отправить подруге».");
            return;
        }

        try {
            const absoluteMediaUrl = new URL(imagePath, window.location.href).toString();
            const params = {
                text: "Получи своё послание от Вселенной! ✨", 
                widget_link: { 
                    url: BOT_LINK, 
                    name: "Получить послание 💫" 
                }
            };
            webApp.shareToStory(absoluteMediaUrl, params);
        } catch (error) {
            console.error("Ошибка при вызове сторис:", error);
            webApp.showAlert("Не удалось открыть редактор сторис.");
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

            // Изменили название кнопки и функционал
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

        // Клик по кнопке "Поделиться" внутри коллекции открывает общее меню
        document.querySelectorAll('.collection-share-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                activeSharePath = this.getAttribute('data-path'); // Запоминаем выбранную карту
                shareOptionsModal.classList.add('active'); // Вызываем меню
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
    let autoResetTimeout;

    function resetToStart() {
        if (autoResetTimeout) {
            clearTimeout(autoResetTimeout);
        }
        
        // Переключаем видимость экранов
        step3Video.style.display = 'none';
        step1Card.style.display = 'block';
        
        // Сбрасываем карту (переворачиваем обратно рубашкой)
        card.classList.remove('flipped');
        isFlipped = false;
        
        // Скрываем кнопки следующего шага
        nextToAudioBtn.style.display = 'none';
        shareCardBtn.style.display = 'none';
        
        // Показываем главную кнопку и сразу пересчитываем таймер
        drawBtn.style.display = 'block';
        checkTimer();
    }

    // Обработчик кнопки возврата
    resetPracticeBtn.addEventListener('click', resetToStart);

    // --- ШАГ 2: АУДИО (АВТОЗАПУСК) ---
    const audioPlayer = document.getElementById('audioPlayer');
    const audioTitle = document.getElementById('audioTitle');
    const shareAudioBtn = document.getElementById('shareAudioBtn'); 
    
    let currentAudioName = "";

    function startRandomAudio() {
        const randomAudioIndex = Math.floor(Math.random() * audioData.length);
        const selectedAudio = audioData[randomAudioIndex];

        currentAudioName = selectedAudio.title;
        audioTitle.innerText = `«${currentAudioName}»`;
        
        audioPlayer.src = `audio/${selectedAudio.id}.mp3`;
        
        audioPlayer.play();
        if (avatarVideo) {
            avatarVideo.play().catch(err => console.log("Видео заблокировано системой:", err));
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

    // Автопереход к третьему шагу
    audioPlayer.addEventListener('ended', () => {
        step2Audio.style.display = 'none';
        step3Video.style.display = 'block';
        
        // Запускаем таймер автоматического возврата (15 секунд = 15000 мс)
        autoResetTimeout = setTimeout(resetToStart, 15000);
    });

    // --- ЛОГИКА ВИДЕОГАЛЕРЕИ (YouTube) ---
    const videoGallery = document.getElementById('videoGallery');
    const videoModal = document.getElementById('videoModal');
    const closeModal = document.getElementById('closeModal');
    const modalVideoWrap = document.getElementById('modalVideoWrap');
    
    videoData.forEach(video => {
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
});