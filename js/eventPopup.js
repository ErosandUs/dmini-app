document.addEventListener('DOMContentLoaded', () => {
    if (typeof EVENT_CONFIG === 'undefined' || !EVENT_CONFIG.isActive) return;

    const eventDate = new Date(EVENT_CONFIG.date).getTime();
    const nowMs = new Date().getTime();
    
    if (eventDate - nowMs < 0) return;

    const style = document.createElement('style');
    style.innerHTML = `
        .event-floating-timer {
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            width: 100%; max-width: 320px; margin: 12px auto 0 auto; padding: 10px 20px;
            background: #ffffff; border: 1px solid #d3bce6; border-radius: 15px;
            box-shadow: 0 4px 15px rgba(156, 122, 187, 0.15); cursor: pointer; transition: 0.2s ease; box-sizing: border-box;
        }
        .event-floating-timer:active { transform: scale(0.98); }
        .event-timer-title { font-size: 0.75rem; color: #8a7a94; margin-bottom: 3px; font-weight: 500; text-align: center; }
        .event-timer-countdown { font-family: 'Cormorant Garamond', serif; font-size: 1.1rem; color: #9c7abb; font-weight: 600; }
        
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
            position: absolute; top: 10px; right: 12px; width: 32px; height: 32px;
            background: #dc3545; color: #fff; border-radius: 50%; border: 2px solid #fff;
            display: flex; align-items: center; justify-content: center;
            font-size: 20px; font-weight: bold; cursor: pointer; line-height: 1;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3); z-index: 2;
        }
        .event-banner-img { width: 100%; height: 200px; object-fit: cover; }
        .event-body { padding: 20px; }
        .event-title { font-family: 'Cormorant Garamond', serif; font-size: 1.5rem; color: #9c7abb; margin-bottom: 10px; }
        .event-desc { font-size: 0.9rem; color: #4a3b52; line-height: 1.5; margin-bottom: 15px; }
        .event-promo-box { background: rgba(211, 188, 230, 0.2); border: 1px dashed #9c7abb; padding: 10px; border-radius: 8px; font-weight: bold; color: #31223b; margin: 15px 0; letter-spacing: 1px;}
        .event-warning { font-size: 0.75rem; color: #d9534f; font-weight: 600; margin-bottom: 10px; display: block; }
    `;
    document.head.appendChild(style);

    const eventContainer = document.createElement('div');
    eventContainer.innerHTML = `
        <div class="event-floating-timer" id="eventFloatingTimer">
            <span class="event-timer-title">До медитации осталось:</span>
            <span class="event-timer-countdown" id="eventCountdownText">Считаем...</span>
        </div>

        <div class="event-modal-overlay" id="eventPromoModal">
            <div class="event-modal-content">
                <span class="event-close-btn" id="closeEventModal">&times;</span>
                <img src="${EVENT_CONFIG.imagePath}" alt="Анонс" class="event-banner-img">
                
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

    const timerBanner = document.getElementById('eventFloatingTimer');
    const getCardBtn = document.getElementById('getCardBtn');
    if (getCardBtn && getCardBtn.parentNode) {
        getCardBtn.parentNode.insertBefore(timerBanner, getCardBtn.nextSibling);
    }

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

    // 1. Проверка активной вкладки
    function isDailyTabActive() {
        const activeTab = document.getElementById('daily');
        return activeTab && activeTab.classList.contains('active');
    }

    // 2. Проверка начального экрана (закрытая рубашка карты)
    function isInitialCardState() {
        // Если карта перевернута — скрываем таймер
        const isFlipped = document.querySelector('.flipped') !== null;
        if (isFlipped) return false;

        // Если открыто любое модальное окно (видео, шеринг и т.д.) — скрываем таймер
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

        // Показываем плашку ТОЛЬКО если пользователь на первой вкладке И карта ещё НЕ перевернута
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

    // Мгновенно пересчитываем видимость при любом клике (переворот карты, просмотр видео)
    document.addEventListener('click', () => {
        setTimeout(updateTimer, 100);
    });

    function openModal() { modal.classList.add('active'); }
    closeModal.addEventListener('click', () => modal.classList.remove('active'));
    timerBanner.addEventListener('click', openModal);

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