document.addEventListener('DOMContentLoaded', () => {
    if (typeof EVENT_CONFIG === 'undefined' || !EVENT_CONFIG.isActive) return;

    const eventDate = new Date(EVENT_CONFIG.date).getTime();
    const nowMs = new Date().getTime();
    
    if (eventDate - nowMs < 0) return;

    const style = document.createElement('style');
    style.innerHTML = `
        /* Стационарная кнопка на рубашке карты */
        .event-floating-timer {
            position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%);
            background: rgba(255, 255, 255, 0.88); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
            border: 1px solid rgba(211, 188, 230, 0.8); border-radius: 20px;
            padding: 8px 18px; box-shadow: 0 4px 15px rgba(156, 122, 187, 0.25);
            z-index: 20; display: flex; flex-direction: column; align-items: center; cursor: pointer; transition: 0.2s ease;
            white-space: nowrap; width: max-content; pointer-events: auto;
        }
        .event-floating-timer:active { transform: translateX(-50%) scale(0.95); }
        .event-timer-title { font-size: 0.75rem; color: #8a7a94; margin-bottom: 2px; font-weight: 600; text-transform: uppercase; }
        .event-timer-countdown { font-family: 'Cormorant Garamond', serif; font-size: 1.1rem; color: #9c7abb; font-weight: 700; }
        
        .event-modal-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(49, 34, 59, 0.7); backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px); z-index: 10000;
            display: flex; align-items: center; justify-content: center;
            padding: 15px; opacity: 0; visibility: hidden; transition: 0.3s ease;
        }
        .event-modal-overlay.active { opacity: 1; visibility: visible; }
        .event-modal-content {
            background: #fff; width: 100%; max-width: 360px;
            border-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); position: relative; overflow: hidden; text-align: center;
        }
        /* Выразительная и заметная красная кнопка закрытия */
        .event-close-btn {
            position: absolute; top: 12px; right: 12px; width: 34px; height: 34px;
            background: rgba(220, 53, 69, 0.95); color: #fff; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-size: 22px; font-weight: 800; line-height: 1; cursor: pointer; z-index: 100;
            box-shadow: 0 3px 10px rgba(0, 0, 0, 0.35); border: 2px solid #ffffff; transition: 0.2s ease;
        }
        .event-close-btn:active { transform: scale(0.88); background: rgba(200, 35, 51, 1); }
        .event-banner-img { width: 100%; height: 180px; object-fit: cover; }
        .event-body { padding: 20px; }
        .event-title { font-family: 'Cormorant Garamond', serif; font-size: 1.5rem; color: #4a3b52; margin-bottom: 8px; font-weight: 600; }
        .event-desc { font-size: 0.9rem; color: #4a3b52; line-height: 1.4; margin-bottom: 12px; }
        .event-promo-box { background: #f7f3fb; border: 1px dashed #b897d4; padding: 12px; border-radius: 12px; font-weight: bold; color: #5c3b75; margin: 12px 0; font-size: 1.2rem; }
        .event-warning { font-size: 0.75rem; color: #d9534f; font-weight: 600; margin-bottom: 10px; display: block; }
    `;
    document.head.appendChild(style);

    const eventContainer = document.createElement('div');
    eventContainer.innerHTML = `
        <div class="event-floating-timer" id="eventFloatingTimer">
            <span class="event-timer-title">Дом медитации ✨</span>
            <span class="event-timer-countdown" id="eventCountdownText">Считаем...</span>
        </div>

        <div class="event-modal-overlay" id="eventPromoModal">
            <div class="event-modal-content">
                <span class="event-close-btn" id="closeEventModal">&times;</span>
                <img src="${EVENT_CONFIG.imagePath}" alt="Анонс" class="event-banner-img">
                
                <div class="event-body">
                    <h3 class="event-title">${EVENT_CONFIG.title}</h3>
                    
                    <div id="eventStep1">
                        <p class="event-desc">Поделись приглашением с близкой подругой. Вы обе получите <b>скидку 15%</b> на участие! ✨</p>
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

    const timerBanner = document.getElementById('eventFloatingTimer');
    const countdownText = document.getElementById('eventCountdownText');
    const modal = document.getElementById('eventPromoModal');
    const closeModal = document.getElementById('closeEventModal');
    const shareBtn = document.getElementById('eventShareBtn');
    const applyBtn = document.getElementById('eventApplyPromoBtn');
    const directRegBtn = document.getElementById('eventDirectRegisterBtn');
    const step1 = document.getElementById('eventStep1');
    const stepChecking = document.getElementById('eventStepChecking');
    const checkingCountdown = document.getElementById('checkingCountdown');
    const step2 = document.getElementById('eventStep2');
    const promoDisplay = document.getElementById('senderPromoDisplay');
    const rewardTimer = document.getElementById('rewardTimer');

    // ПРИВЯЗКА КНОПКИ К РУБАШКЕ КАРТЫ
    const cardFront = document.querySelector('.card-front') || document.getElementById('cardFront');
    if (cardFront) {
        cardFront.appendChild(timerBanner);
    }

    // Запрещаем клику по кнопке переворачивать карту
    timerBanner.addEventListener('click', (e) => {
        e.stopPropagation();
        openModal();
    });

    function isDailyTabActive() {
        const activeTab = document.getElementById('daily');
        return activeTab && activeTab.classList.contains('active');
    }

    function isInitialCardState() {
        const isFlipped = document.querySelector('.flipped') !== null;
        if (isFlipped) return false;

        const isModalActive = document.querySelector('.modal.active') !== null ||
            (document.getElementById('videoModal') && getComputedStyle(document.getElementById('videoModal')).display !== 'none') ||
            (document.getElementById('shareOptionsModal') && getComputedStyle(document.getElementById('shareOptionsModal')).display !== 'none');
        if (isModalActive) return false;

        return true;
    }

    function updateTimer() {
        const distance = eventDate - new Date().getTime();
        if (distance < 0) {
            timerBanner.style.display = 'none';
            return;
        }

        if (isDailyTabActive() && isInitialCardState()) {
            timerBanner.style.display = 'flex';
        } else {
            timerBanner.style.display = 'none';
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        countdownText.innerText = `${days} дн : ${hours} ч : ${minutes} мин`;
    }

    updateTimer();
    setInterval(updateTimer, 5000);

    document.addEventListener('click', () => {
        setTimeout(updateTimer, 100);
    });

    function openModal() { modal.classList.add('active'); }
    closeModal.addEventListener('click', (e) => { e.stopPropagation(); modal.classList.remove('active'); });

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