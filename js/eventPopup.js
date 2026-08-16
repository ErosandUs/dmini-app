document.addEventListener('DOMContentLoaded', () => {
    if (typeof EVENT_CONFIG === 'undefined' || !EVENT_CONFIG.isActive) return;

    const eventDate = new Date(EVENT_CONFIG.date).getTime();
    const nowMs = new Date().getTime();
    
    if (eventDate - nowMs < 0) return;

    const style = document.createElement('style');
    style.innerHTML = `
        .event-timer-btn {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            width: 100%;
            max-width: 300px;
            margin: 12px auto;
            padding: 12px 15px;
            background: linear-gradient(135deg, #f0e4f7, #e3d3f2);
            border: 1.5px solid #bba0d6;
            border-radius: 8px;
            color: #31223b;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(187, 160, 214, 0.3);
            transition: all 0.3s ease;
            box-sizing: border-box;
        }
        .event-timer-btn:active {
            transform: scale(0.96);
        }
        .event-timer-title {
            font-family: 'Montserrat', sans-serif;
            font-size: 0.72rem;
            color: #725687;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin-bottom: 2px;
            text-align: center;
        }
        .event-timer-countdown {
            font-family: 'Cormorant Garamond', serif;
            font-size: 1.25rem;
            color: #4a2868;
            font-weight: 700;
            text-align: center;
        }
        
        .event-modal-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(246, 240, 250, 0.95); z-index: 10000;
            display: flex; align-items: center; justify-content: center;
            padding: 15px; opacity: 0; visibility: hidden; transition: 0.3s ease;
        }
        .event-modal-overlay.active { opacity: 1; visibility: visible; }
        .event-modal-content {
            background: #fff; width: 100%; max-width: 380px;
            border-radius: 15px; border: 1px solid #d3bce6;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1); position: relative; overflow: hidden; text-align: center;
        }
        .event-close-btn {
            position: absolute; top: 10px; right: 15px;
            font-size: 30px; color: #fff; cursor: pointer; line-height: 1;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3); z-index: 2;
        }
        .event-banner-img { width: 100%; height: 200px; object-fit: cover; }
        .event-body { padding: 20px; }
        .event-title { font-family: 'Cormorant Garamond', serif; font-size: 1.5rem; color: #9c7abb; margin-bottom: 10px; }
        .event-desc { font-size: 0.9rem; color: #4a3b52; line-height: 1.5; margin-bottom: 15px; }
        .event-success-note {
            display: none;
            background: rgba(211, 188, 230, 0.25);
            border: 1px solid #d3bce6;
            border-radius: 10px;
            padding: 12px 14px;
            font-size: 0.85rem;
            color: #4a2868;
            line-height: 1.4;
            margin-top: 12px;
            text-align: center;
            box-sizing: border-box;
        }
    `;
    document.head.appendChild(style);

    // Если кнопка таймера ещё не найдена — ищем или создаем её под кнопкой вытягивания карты
    let timerBanner = document.getElementById('eventFloatingTimer');
    if (!timerBanner) {
        timerBanner = document.createElement('button');
        timerBanner.className = 'action-btn share-btn event-timer-btn';
        timerBanner.id = 'eventFloatingTimer';
        timerBanner.style.display = 'none';
        timerBanner.innerHTML = `
            <span class="event-timer-title">До медитации осталось:</span>
            <span class="event-timer-countdown" id="eventCountdownText">Считаем...</span>
        `;
        const drawCardBtn = document.getElementById('drawCardBtn');
        if (drawCardBtn && drawCardBtn.parentNode) {
            drawCardBtn.parentNode.insertBefore(timerBanner, drawCardBtn.nextSibling);
        }
    }

    const eventContainer = document.createElement('div');
    eventContainer.innerHTML = `
        <div class="event-modal-overlay" id="eventPromoModal">
            <div class="event-modal-content">
                <span class="event-close-btn" id="closeEventModal">&times;</span>
                <img src="${EVENT_CONFIG.imagePath}" id="eventModalImg" alt="Анонс" class="event-banner-img">
                
                <div class="event-body">
                    <h3 class="event-title">${EVENT_CONFIG.title}</h3>
                    
                    <p class="event-desc">Отправь приглашение подруге, которая ещё не была на наших практиках. Как только она перейдёт в бота, вы обе моментально получите промокоды со скидкой 15% на участие!</p>
                    
                    <button class="action-btn" id="eventShareBtn">Поделиться с подругой 💌</button>
                    <button class="action-btn share-btn" id="eventDirectRegisterBtn" style="margin-top: 10px;">Подробнее о медитации</button>

                    <div class="event-success-note" id="eventSuccessNote">
                        Приглашение готово! Как только подруга нажмет «Старт» в боте, бот сразу пришлет твой промокод в чат ✨
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(eventContainer);

    const countdownText = document.getElementById('eventCountdownText');
    const modal = document.getElementById('eventPromoModal');
    const closeEventModal = document.getElementById('closeEventModal');
    const shareBtn = document.getElementById('eventShareBtn');
    const directRegBtn = document.getElementById('eventDirectRegisterBtn');
    const successNote = document.getElementById('eventSuccessNote');

    // 1. Проверка активной вкладки
    function isDailyTabActive() {
        const activeTab = document.getElementById('daily');
        return activeTab && activeTab.classList.contains('active');
    }

    // 2. Проверка начального экрана (первый шаг с неперевернутой картой)
    function isInitialCardState() {
        if (window.isCardDrawing) return false;

        // Проверяем видимость первого шага
        const step1Card = document.getElementById('step1-card');
        if (!step1Card || getComputedStyle(step1Card).display === 'none') return false;

        // Если карта перевернута — скрываем таймер
        const card = document.getElementById('card');
        if (card && card.classList.contains('flipped')) return false;

        // Если кнопка "Получить послание" скрыта — значит карта перевернута или вытягивается
        const drawBtn = document.getElementById('drawCardBtn');
        if (drawBtn && getComputedStyle(drawBtn).display === 'none') return false;

        // Если видны кнопки перехода ко 2-му шагу (аудио / шеринг) — скрываем
        const nextToAudioBtn = document.getElementById('nextToAudioBtn');
        if (nextToAudioBtn && getComputedStyle(nextToAudioBtn).display !== 'none') return false;

        const shareCardBtn = document.getElementById('shareCardBtn');
        if (shareCardBtn && getComputedStyle(shareCardBtn).display !== 'none') return false;

        // Если открыто любое модальное окно — скрываем таймер
        const isModalActive = (document.getElementById('videoModal') && getComputedStyle(document.getElementById('videoModal')).display !== 'none') ||
            (document.getElementById('shareOptionsModal') && getComputedStyle(document.getElementById('shareOptionsModal')).display !== 'none') ||
            (document.getElementById('eventPromoModal') && document.getElementById('eventPromoModal').classList.contains('active'));
        if (isModalActive) return false;

        return true;
    }

    function updateTimer() {
        if (!timerBanner) return;
        const distance = eventDate - new Date().getTime();
        if (distance < 0) {
            timerBanner.style.display = 'none';
            return;
        }

        // Показываем плашку ТОЛЬКО если пользователь на первой вкладке И карта ещё НЕ перевернута
        if (isDailyTabActive() && isInitialCardState()) {
            timerBanner.style.display = 'flex';
        } else {
            timerBanner.style.display = 'none';
        }

        if (countdownText) {
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            countdownText.innerText = `${days} дн : ${hours} ч : ${minutes} мин`;
        }
    }

    window.updateEventTimer = updateTimer;
    window.hideEventTimer = () => {
        if (timerBanner) timerBanner.style.display = 'none';
    };

    updateTimer();
    setInterval(updateTimer, 3000);

    // Мгновенно пересчитываем видимость при любом клике
    document.addEventListener('click', () => {
        updateTimer();
    });

    function openModal() { if (modal) modal.classList.add('active'); }
    function closeModal() { if (modal) modal.classList.remove('active'); }

    if (closeEventModal) closeEventModal.addEventListener('click', closeModal);
    if (timerBanner) timerBanner.addEventListener('click', openModal);

    // Закрытие при клике по затемненному фону
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    const hoursUntilEvent = (eventDate - nowMs) / (1000 * 60 * 60);
    const isFirstShown = localStorage.getItem('event_popup_first');
    const isLastDayShown = localStorage.getItem('event_popup_last');

    if (hoursUntilEvent > 24 && !isFirstShown) {
        setTimeout(openModal, 2000);
        localStorage.setItem('event_popup_first', 'true');
    } else if (hoursUntilEvent <= 24 && hoursUntilEvent > 0 && !isLastDayShown) {
        setTimeout(openModal, 2000);
        localStorage.setItem('event_popup_first', 'true');
        localStorage.setItem('event_popup_last', 'true');
    }

    if (directRegBtn) {
        directRegBtn.addEventListener('click', () => {
            openLinkSafe(EVENT_CONFIG.registrationLink);
        });
    }

    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            const tgUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
            const senderId = tgUser?.id || 'direct';
            const botDeeplink = `https://t.me/${EVENT_CONFIG.botUsername}?start=ref_${senderId}`;
            const shareText = `Привет! Приглашаю тебя на медитацию «${EVENT_CONFIG.title}». Переходи в бота по моей ссылке, чтобы забрать приветственную скидку 15%:\n${botDeeplink}`;
            const shareUrl = `https://t.me/share/url?text=${encodeURIComponent(shareText)}`;
            
            openLinkSafe(shareUrl, true);

            if (successNote) {
                successNote.style.display = 'block';
            }
        });
    }

    function openLinkSafe(url, isTelegramShare = false) {
        if (window.Telegram && window.Telegram.WebApp) {
            if (isTelegramShare && window.Telegram.WebApp.openTelegramLink) {
                window.Telegram.WebApp.openTelegramLink(url);
            } else if (window.Telegram.WebApp.openLink) {
                window.Telegram.WebApp.openLink(url);
            } else {
                window.open(url, '_blank');
            }
        } else {
            window.open(url, '_blank');
        }
    }
});