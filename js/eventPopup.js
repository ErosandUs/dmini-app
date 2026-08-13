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
        .event-promo-box { background: rgba(211, 188, 230, 0.2); border: 1px dashed #9c7abb; padding: 10px; border-radius: 8px; font-weight: bold; color: #31223b; margin: 15px 0; letter-spacing: 1px;}
        .event-warning { font-size: 0.75rem; color: #d9534f; font-weight: 600; margin-bottom: 10px; display: block; }
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
                    
                    <div id="eventStep1">
                        <p class="event-desc">Поделись приглашением с близкой подругой. Вы обе получите <b>скидку 15%</b> на участие в практике! ✨</p>
                        <span class="event-warning">❗️ Вернись в это окно после отправки, чтобы забрать подарок!</span>
                        <button class="action-btn" id="eventShareBtn">Отправить приглашение 💌</button>
                        <button class="action-btn share-btn" id="eventDirectRegisterBtn" style="margin-top: 10px;">Подробнее о медитации</button>
                    </div>

                    <div id="eventStepChecking" style="display: none;">
                        <h3 class="event-title" style="font-size: 1.3rem;">Проверка отправки... ✨</h3>
                        <p class="event-desc">Проверяем отправку вашего приглашения. Пожалуйста, не закрывайте окно.</p>
                        <div style="font-size: 2.5rem; font-family: 'Cormorant Garamond', serif; font-weight: bold; color: #9c7abb; margin: 15px 0;" id="checkingCountdown">60</div>
                    </div>

                    <div id="eventStep2" style="display: none;">
                        <h3 class="event-title" style="font-size: 1.3rem;">Приглашение отправлено! ✨</h3>
                        <p class="event-desc">Твой персональный промокод на скидку 15%:</p>
                        <div class="event-promo-box" id="senderPromoDisplay"></div>
                        <p class="event-timer-title" style="margin-bottom:15px; color: #d9534f;">Скидка сгорит через: <span id="rewardTimer">23:59:59</span></p>
                        <button class="action-btn" id="eventApplyPromoBtn">Скопировать и применить</button>
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
    const applyBtn = document.getElementById('eventApplyPromoBtn');
    const directRegBtn = document.getElementById('eventDirectRegisterBtn');
    const step1 = document.getElementById('eventStep1');
    const stepChecking = document.getElementById('eventStepChecking');
    const checkingCountdown = document.getElementById('checkingCountdown');
    const step2 = document.getElementById('eventStep2');
    const promoDisplay = document.getElementById('senderPromoDisplay');
    const rewardTimer = document.getElementById('rewardTimer');

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
    if (closeEventModal) closeEventModal.addEventListener('click', () => { if (modal) modal.classList.remove('active'); });
    if (timerBanner) timerBanner.addEventListener('click', openModal);

    const hoursUntilEvent = (eventDate - nowMs) / (1000 * 60 * 60);
    const isFirstShown = localStorage.getItem('event_popup_first');
    const isLastDayShown = localStorage.getItem('event_popup_last');

    const shareClickedTime = localStorage.getItem('event_share_clicked_time');
    const isPromoClaimed = localStorage.getItem('event_promo_claimed') === 'true';
    const isAutoOpenedAfterShare = localStorage.getItem('event_auto_opened_after_share') === 'true';
    let isSharedState = false;

    if (shareClickedTime) {
        const secondsPassed = (nowMs - parseInt(shareClickedTime)) / 1000;
        
        if (secondsPassed < (24 * 3600)) {
            isSharedState = true;
            
            step1.style.display = 'none';
            step2.style.display = 'block';
            promoDisplay.innerText = EVENT_CONFIG.promoSender;
            startFomoTimer((24 * 3600) - Math.floor(secondsPassed));

            if (!isPromoClaimed && !isAutoOpenedAfterShare) {
                setTimeout(() => {
                    openModal();
                    if (secondsPassed < 60) {
                        step2.style.display = 'none';
                        stepChecking.style.display = 'block';
                        startCheckingTimer(60 - Math.floor(secondsPassed));
                    }
                    localStorage.setItem('event_auto_opened_after_share', 'true');
                }, 500);
            }
        } else {
            localStorage.removeItem('event_share_clicked_time');
            localStorage.removeItem('event_promo_claimed');
            localStorage.removeItem('event_auto_opened_after_share');
        }
    }

    if (!isSharedState) {
        if (hoursUntilEvent > 24 && !isFirstShown) {
            setTimeout(openModal, 2000);
            localStorage.setItem('event_popup_first', 'true');
        } else if (hoursUntilEvent <= 24 && hoursUntilEvent > 0 && !isLastDayShown) {
            setTimeout(openModal, 2000);
            localStorage.setItem('event_popup_first', 'true');
            localStorage.setItem('event_popup_last', 'true');
        }
    }

    directRegBtn.addEventListener('click', () => openLinkSafe(EVENT_CONFIG.registrationLink));

    shareBtn.addEventListener('click', () => {
        const shareText = `Привет, дорогая! Я иду в классное поле на медитацию «${EVENT_CONFIG.title}». Почувствовала, что хочу разделить это с тобой ✨\n\nДержи от меня подарок — промокод на 15%: ${EVENT_CONFIG.promoReceiver}\n\nПодробности тут: ${EVENT_CONFIG.registrationLink}`;
        const shareUrl = `https://t.me/share/url?text=${encodeURIComponent(shareText)}`;
        
        openLinkSafe(shareUrl, true);

        localStorage.setItem('event_share_clicked_time', new Date().getTime().toString());

        step1.style.display = 'none';
        stepChecking.style.display = 'block';
        startCheckingTimer(60);
    });

    applyBtn.addEventListener('click', () => {
        localStorage.setItem('event_promo_claimed', 'true');

        navigator.clipboard.writeText(EVENT_CONFIG.promoSender).then(() => {
            const linkWithPromo = `${EVENT_CONFIG.registrationLink}?promo=${EVENT_CONFIG.promoSender}`;
            openLinkSafe(linkWithPromo);
        }).catch(err => console.log('Clipboard error', err));
    });

    function openLinkSafe(url, isTelegramShare = false) {
        if (window.Telegram && window.Telegram.WebApp) {
            if (isTelegramShare && window.Telegram.WebApp.openTelegramLink) window.Telegram.WebApp.openTelegramLink(url);
            else if (window.Telegram.WebApp.openLink) window.Telegram.WebApp.openLink(url);
            else window.open(url, '_blank');
        } else window.open(url, '_blank');
    }

    function startCheckingTimer(startSeconds) {
        let checkRemain = startSeconds;
        checkingCountdown.innerText = checkRemain;

        const checkInterval = setInterval(() => {
            checkRemain--;
            if (checkRemain <= 0) {
                clearInterval(checkInterval);
                stepChecking.style.display = 'none';
                step2.style.display = 'block';
                promoDisplay.innerText = EVENT_CONFIG.promoSender;
                
                const clickedTimeStr = localStorage.getItem('event_share_clicked_time');
                if (clickedTimeStr) {
                    const passed = (new Date().getTime() - parseInt(clickedTimeStr)) / 1000;
                    startFomoTimer((24 * 3600) - Math.floor(passed));
                } else {
                    startFomoTimer(24 * 3600);
                }
            } else {
                checkingCountdown.innerText = checkRemain;
            }
        }, 1000);
    }

    function startFomoTimer(remainSeconds) {
        let remain = remainSeconds;
        setInterval(() => {
            if (remain <= 0) return;
            remain--;
            const h = Math.floor(remain / 3600).toString().padStart(2, '0');
            const m = Math.floor((remain % 3600) / 60).toString().padStart(2, '0');
            const s = (remain % 60).toString().padStart(2, '0');
            rewardTimer.innerText = `${h}:${m}:${s}`;
        }, 1000);
    }
});