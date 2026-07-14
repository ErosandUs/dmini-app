document.addEventListener('DOMContentLoaded', () => {
    
    // --- НАСТРОЙКИ ---
    const BOT_LINK = "https://t.me/VashBotName"; // Ссылка на вашего бота
    const TOTAL_CARDS = 71; 

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
    // ЛОГИКА ПОТОКА: КАРТА -> АУДИО -> ЗАГЛУШКА ВИДЕО
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

    // === НОВОЕ: Логика таймера (1 минута) ===
    const COOLDOWN_MS = 60 * 1000; // 60 000 мс = 1 минута

    function checkTimer() {
        const lastDraw = localStorage.getItem('lastDrawTime');
        if (lastDraw) {
            const elapsed = Date.now() - parseInt(lastDraw);
            if (elapsed < COOLDOWN_MS) {
                drawBtn.disabled = true;
                const remaining = COOLDOWN_MS - elapsed;
                startCountdown(remaining);
                return false; // Таймер еще идет
            }
        }
        return true; // Можно тянуть карту
    }

    function startCountdown(duration) {
        let remain = duration;
        const interval = setInterval(() => {
            remain -= 1000;
            if (remain <= 0) {
                clearInterval(interval);
                drawBtn.disabled = false;
                drawBtn.innerText = "Получить послание";
            } else {
                const secs = Math.ceil(remain / 1000);
                drawBtn.innerText = `Ожидайте ${secs} сек.`;
            }
        }, 1000);
        // Сразу отображаем первую секунду
        drawBtn.innerText = `Ожидайте ${Math.ceil(remain / 1000)} сек.`;
    }

    // Проверяем таймер при загрузке приложения
    checkTimer();
    // =========================================

    function drawRandomCard() {
        if (!isFlipped && checkTimer()) {
            localStorage.setItem('lastDrawTime', Date.now()); // Записываем время вытягивания
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
            
            // Скрываем кнопку вытягивания карты
            drawBtn.style.display = 'none';

            // Показываем кнопки шага вперед и шеринга карты
            setTimeout(() => { 
                nextToAudioBtn.style.display = 'block';
                shareCardBtn.style.display = 'block'; 
            }, 500);
        };
    }

    drawBtn.addEventListener('click', drawRandomCard);
    card.addEventListener('click', drawRandomCard);

    // ==========================================
    // НОВАЯ ЛОГИКА: ВЫБОР ВАРИАНТА ШЕРИНГА КАРТЫ
    // ==========================================
    const shareOptionsModal = document.getElementById('shareOptionsModal');
    const closeShareModal = document.getElementById('closeShareModal');
    const shareToFriendBtn = document.getElementById('shareToFriendBtn');
    const shareToUniverseBtn = document.getElementById('shareToUniverseBtn');

    // Открываем меню выбора
    shareCardBtn.addEventListener('click', () => {
        shareOptionsModal.classList.add('active');
    });

    // Закрываем меню выбора
    closeShareModal.addEventListener('click', () => {
        shareOptionsModal.classList.remove('active');
    });

    // ВАРИАНТ 1: Отправить подруге (Личные сообщения)
    shareToFriendBtn.addEventListener('click', () => {
        const text = "✨ Я вытянула карту дня! Узнай, какое послание от Вселенной ждет тебя в боте:";
        const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(BOT_LINK)}&text=${encodeURIComponent(text)}`;
        
        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData) {
            window.Telegram.WebApp.openTelegramLink(shareUrl);
        } else {
            window.open(shareUrl, '_blank');
        }
        shareOptionsModal.classList.remove('active');
    });

    // ВАРИАНТ 2: Запрос во Вселенную (Stories)
    shareToUniverseBtn.addEventListener('click', () => {
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
            const absoluteMediaUrl = new URL(currentCardPath, window.location.href).toString();
            const params = {
                text: "Получи свое послание от Вселенной в боте! ✨", 
                widget_link: { url: BOT_LINK, name: "Открыть бота 💫" }
            };
            webApp.shareToStory(absoluteMediaUrl, params);
        } catch (error) {
            console.error("Ошибка при вызове сторис:", error);
            webApp.showAlert("Не удалось открыть редактор сторис.");
        }
        shareOptionsModal.classList.remove('active');
    });
    // ==========================================

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
        
        // Принудительно запускаем аудиоплеер и видео-аватар
        audioPlayer.play();
        if (avatarVideo) {
            avatarVideo.play().catch(err => console.log("Видео заблокировано системой:", err));
        }
        
        shareAudioBtn.style.display = 'block';
    }

    // Переход со скрытием карты и автоматическим стартом аудио
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

    // Автопереход к третьему шагу (Заглушка)
    audioPlayer.addEventListener('ended', () => {
        step2Audio.style.display = 'none';
        step3Video.style.display = 'block';
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