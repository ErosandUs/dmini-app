document.addEventListener('DOMContentLoaded', () => {
    if (typeof EVENT_CONFIG === 'undefined' || !EVENT_CONFIG.isActive) return;

    const getEventKey = (baseKey) => `${baseKey}_${EVENT_CONFIG.date}`;

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
        .event-banner-wrap {
            width: 100%;
            padding-top: 100%;
            position: relative;
            overflow: hidden;
            background: #f6f0fa;
        }
        .event-banner-img {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
        }
        .event-body { padding: 20px; }
        .event-title { font-family: 'Cormorant Garamond', serif; font-size: 1.5rem; color: #9c7abb; margin-bottom: 10px; }
        .event-desc { font-size: 0.9rem; color: #4a3b52; line-height: 1.5; margin-bottom: 15px; }
        .event-warning { font-size: 0.78rem; color: #b33939; font-weight: 600; margin-bottom: 12px; display: block; line-height: 1.35; }
        .event-promo-box {
            background: linear-gradient(135deg, rgba(211, 188, 230, 0.3), rgba(240, 228, 247, 0.5));
            border: 2px dashed #9c7abb;
            padding: 12px;
            border-radius: 10px;
            font-family: 'Montserrat', sans-serif;
            font-weight: 700;
            font-size: 1.25rem;
            color: #31223b;
            margin: 15px 0;
            letter-spacing: 2px;
            user-select: all;
        }
        .event-reward-timer-box {
            font-size: 0.85rem;
            color: #b33939;
            font-weight: 600;
            margin-bottom: 15px;
        }
        .event-reward-timer-val {
            font-family: 'Cormorant Garamond', serif;
            font-size: 1.15rem;
            font-weight: 700;
        }
        @keyframes urgentBlink {
            0%, 100% { opacity: 1; color: #ff4d4d; transform: scale(1); }
            50% { opacity: 0.6; color: #9c7abb; transform: scale(0.98); }
        }
        .timer-urgent {
            animation: urgentBlink 1.5s infinite ease-in-out !important;
            color: #ff4d4d !important;
            font-weight: 700;
        }
        .urgent-text {
            color: #ff4d4d;
            font-weight: bold;
            margin-bottom: 5px;
            font-size: 1.1rem;
        }
    `;
    document.head.appendChild(style);

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
                <div class="event-banner-wrap">
                    <img src="${EVENT_CONFIG.imagePath}" id="eventModalImg" alt="Анонс" class="event-banner-img">
                </div>
                
                <div class="event-body">
                    <!-- Шаг 1: Инвайт -->
                    <div id="eventStep1">
                        <h3 class="event-title">${EVENT_CONFIG.title}</h3>
                        <p class="event-desc">Поделись приглашением с близкой подругой, которая ещё не была на наших практиках. Вы обе получите <b>промокод на скидку</b> для участия! ✨</p>
                        <span class="event-warning">❗️ Нажми кнопку, чтобы отправить подруге приглашение и сразу забрать свой промокод!</span>
                        <button class="action-btn" id="eventShareBtn">Отправить приглашение 💌</button>
                        <button class="action-btn share-btn" id="eventDirectRegisterBtn" style="margin-top: 10px;">Подробнее о медитации</button>
                    </div>

                    <!-- Шаг 2: Персональная награда -->
                    <div id="eventStep2" style="display: none;">
                        <h3 class="event-title" style="font-size: 1.35rem;">Твой подарок разблокирован! ✨</h3>
                        <p class="event-desc" id="eventStep2Desc">Твой персональный промокод на скидку:</p>
                        <div class="event-promo-box" id="senderPromoDisplay">...</div>
                        <div class="event-reward-timer-box" id="eventRewardTimerBox">
                            Скидка сгорит через: <span class="event-reward-timer-val" id="rewardTimer">23:59:59</span>
                        </div>
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
    const step1 = document.getElementById('eventStep1');
    const step2 = document.getElementById('eventStep2');
    const step2Desc = document.getElementById('eventStep2Desc');
    const shareBtn = document.getElementById('eventShareBtn');
    const directRegBtn = document.getElementById('eventDirectRegisterBtn');
    const applyPromoBtn = document.getElementById('eventApplyPromoBtn');
    const promoDisplay = document.getElementById('senderPromoDisplay');
    const rewardTimer = document.getElementById('rewardTimer');
    const rewardTimerBox = document.getElementById('eventRewardTimerBox');

    let currentSenderPromo = localStorage.getItem(getEventKey('event_sender_promo')) || '';
    let fomoInterval = null;

    function isDailyTabActive() {
        const activeTab = document.getElementById('daily');
        return activeTab && activeTab.classList.contains('active');
    }

    function isInitialCardState() {
        if (window.isCardDrawing) return false;
        const step1Card = document.getElementById('step1-card');
        if (!step1Card || getComputedStyle(step1Card).display === 'none') return false;
        const card = document.getElementById('card');
        if (card && card.classList.contains('flipped')) return false;
        const drawBtn = document.getElementById('drawCardBtn');
        if (drawBtn && getComputedStyle(drawBtn).display === 'none') return false;
        const nextToAudioBtn = document.getElementById('nextToAudioBtn');
        if (nextToAudioBtn && getComputedStyle(nextToAudioBtn).display !== 'none') return false;
        const shareCardBtn = document.getElementById('shareCardBtn');
        if (shareCardBtn && getComputedStyle(shareCardBtn).display !== 'none') return false;
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

    document.addEventListener('click', () => {
        updateTimer();
    });

    function openModal() { if (modal) modal.classList.add('active'); }
    function closeModal() { if (modal) modal.classList.remove('active'); }

    if (closeEventModal) closeEventModal.addEventListener('click', closeModal);
    if (timerBanner) timerBanner.addEventListener('click', openModal);
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    function startFomoTimer(initialRemainingSeconds) {
        if (fomoInterval) clearInterval(fomoInterval);
        let remain = initialRemainingSeconds;
        function tick() {
            if (remain <= 0) {
                clearInterval(fomoInterval);
                if (rewardTimer) rewardTimer.innerText = '00:00:00';
                localStorage.removeItem(getEventKey('event_share_clicked_time'));
                if (timerBanner) timerBanner.style.display = 'none';
                closeModal();
                return;
            }
            const h = Math.floor(remain / 3600).toString().padStart(2, '0');
            const m = Math.floor((remain % 3600) / 60).toString().padStart(2, '0');
            const s = (remain % 60).toString().padStart(2, '0');
            if (rewardTimer) rewardTimer.innerText = `${h}:${m}:${s}`;
            remain--;
        }
        tick();
        fomoInterval = setInterval(tick, 1000);
    }

    function showStep2(promoCode, remainingSeconds = null) {
        currentSenderPromo = promoCode;
        const desc = step2Desc;
        const timerBox = rewardTimerBox;
        if (step1) step1.style.display = 'none';
        if (step2) step2.style.display = 'block';
        if (step2Desc) step2Desc.innerText = 'Твой персональный промокод на скидку:';
        if (promoDisplay) {
            promoDisplay.style.display = 'block';
            promoDisplay.innerText = currentSenderPromo;
        }
        if (rewardTimerBox) rewardTimerBox.style.display = 'block';
        if (applyPromoBtn) applyPromoBtn.style.display = 'block';

        // Логика срочности (< 3 часов)
        const clickedTimeVal = localStorage.getItem(getEventKey('event_share_clicked_time')) || localStorage.getItem('event_share_clicked_time');
        const currentRemaining = remainingSeconds !== null ? remainingSeconds : ((24 * 3600) - Math.floor((new Date().getTime() - (parseInt(clickedTimeVal) || new Date().getTime())) / 1000));
        
        if (currentRemaining > 0 && currentRemaining <= (3 * 3600) && timerBox) {
            if (desc) desc.innerHTML = '<div class="urgent-text">Осталось совсем мало времени! Применяй промокод!</div>Твой персональный промокод на скидку 15%:';
            timerBox.classList.add('timer-urgent');
        } else if (timerBox) {
            timerBox.classList.remove('timer-urgent');
        }

        if (currentRemaining > 0) {
            startFomoTimer(currentRemaining);
        } else {
            localStorage.removeItem(getEventKey('event_share_clicked_time'));
            localStorage.removeItem('event_share_clicked_time');
            if (step1) step1.style.display = 'block';
            if (step2) step2.style.display = 'none';
        }
    }

    function showStep2Error() {
        if (fomoInterval) clearInterval(fomoInterval);
        if (step1) step1.style.display = 'none';
        if (step2) step2.style.display = 'block';
        if (step2Desc) step2Desc.innerText = 'Извините, сервис временно недоступен, обратитесь позже.';
        if (promoDisplay) promoDisplay.style.display = 'none';
        if (rewardTimerBox) rewardTimerBox.style.display = 'none';
        if (applyPromoBtn) applyPromoBtn.style.display = 'none';
        
        // НОВОЕ: Сбрасываем метки, чтобы при перезаходе пользователь снова оказался на Шаге 1 и мог попробовать получить код заново
        localStorage.removeItem(getEventKey('event_share_clicked_time'));
        localStorage.removeItem('event_share_clicked_time');
        localStorage.removeItem(getEventKey('event_sender_promo'));
        localStorage.removeItem('event_sender_promo');
    }

    // 4. Восстановление состояния при загрузке страницы
    const savedShareTime = localStorage.getItem(getEventKey('event_share_clicked_time')) || localStorage.getItem('event_share_clicked_time');
    const isPromoClaimed = (localStorage.getItem(getEventKey('event_promo_claimed')) || localStorage.getItem('event_promo_claimed')) === 'true';
    const savedPromo = localStorage.getItem(getEventKey('event_sender_promo')) || localStorage.getItem('event_sender_promo');

    // Проверяем: таймер восстанавливаем ТОЛЬКО если есть и время, и реальный промокод
    if (savedShareTime && savedPromo) {
        const secondsPassed = Math.floor((nowMs - parseInt(savedShareTime)) / 1000);
        const remainingSeconds = (24 * 3600) - secondsPassed;

        if (remainingSeconds > 0) {
            if (!isPromoClaimed) {
                let showCount = parseInt(localStorage.getItem(getEventKey('event_promo_auto_shown_count')) || localStorage.getItem('event_promo_auto_shown_count') || '0');
                
                if (showCount === 0) {
                    if (window.Telegram?.WebApp?.expand) window.Telegram.WebApp.expand();
                    setTimeout(openModal, 500);
                    localStorage.setItem(getEventKey('event_promo_auto_shown_count'), '1');
                    localStorage.setItem('event_promo_auto_shown_count', '1');
                } else if (showCount === 1 && remainingSeconds <= (3 * 3600)) {
                    if (window.Telegram?.WebApp?.expand) window.Telegram.WebApp.expand();
                    setTimeout(openModal, 500);
                    localStorage.setItem(getEventKey('event_promo_auto_shown_count'), '2');
                    localStorage.setItem('event_promo_auto_shown_count', '2');
                }
            }
            
            showStep2(savedPromo, remainingSeconds);
        } else {
            // Время истекло
            localStorage.removeItem(getEventKey('event_share_clicked_time'));
            localStorage.removeItem('event_share_clicked_time');
            localStorage.removeItem(getEventKey('event_promo_auto_shown_count'));
            localStorage.removeItem('event_promo_auto_shown_count');
            localStorage.removeItem(getEventKey('event_sender_promo'));
            localStorage.removeItem('event_sender_promo');
        }
    } else if (savedShareTime && !savedPromo) {
        // Битый стейт (время записано, а промокода нет) — полностью зачищаем
        localStorage.removeItem(getEventKey('event_share_clicked_time'));
        localStorage.removeItem('event_share_clicked_time');
        localStorage.removeItem(getEventKey('event_promo_auto_shown_count'));
        localStorage.removeItem('event_promo_auto_shown_count');
    }

    if (!isPromoClaimed && !savedShareTime) {
        const hoursUntilEvent = (eventDate - nowMs) / (1000 * 60 * 60);
        const isFirstShown = localStorage.getItem(getEventKey('event_popup_first'));
        const isLastDayShown = localStorage.getItem(getEventKey('event_popup_last'));

        if (hoursUntilEvent > 24 && !isFirstShown) {
            setTimeout(openModal, 2000);
            localStorage.setItem(getEventKey('event_popup_first'), 'true');
        } else if (hoursUntilEvent <= 24 && hoursUntilEvent > 0 && !isLastDayShown) {
            setTimeout(openModal, 2000);
            localStorage.setItem(getEventKey('event_popup_first'), 'true');
            localStorage.setItem(getEventKey('event_popup_last'), 'true');
        }
    }

    let statusPollInterval = null;
    let isCheckingStatus = false;
    let activeSenderId = null;

    function getSenderId() {
        const tgId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
        if (tgId) return String(tgId);
        if (!activeSenderId) {
            activeSenderId = String(Math.floor(Math.random() * 1000000000));
        }
        return activeSenderId;
    }

    function checkPromoStatus(senderId) {
        if (!EVENT_CONFIG.appsScriptUrl || !senderId) return;
        if (currentSenderPromo) return;
        if (isCheckingStatus) return;

        isCheckingStatus = true;
        fetch(EVENT_CONFIG.appsScriptUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ userId: senderId, action: 'check_status' })
        })
        .then(res => res.json())
        .then(data => {
            isCheckingStatus = false;
            if (data && data.status === 'success' && data.promo) {
                if (statusPollInterval) {
                    clearInterval(statusPollInterval);
                    statusPollInterval = null;
                }
                localStorage.setItem(getEventKey('event_sender_promo'), data.promo);
                localStorage.setItem(getEventKey('event_share_clicked_time'), new Date().getTime().toString());
                showStep2(data.promo);
            } else if (data && data.status === 'error') {
                // Пул пуст или серверная ошибка
                if (statusPollInterval) {
                    clearInterval(statusPollInterval);
                    statusPollInterval = null;
                }
                showStep2Error();
            }
        })
        .catch(err => {
            isCheckingStatus = false;
            console.warn('Check promo status error:', err);
        });
    }

    function startStatusPolling(senderId) {
        if (statusPollInterval) clearInterval(statusPollInterval);
        checkPromoStatus(senderId);
        statusPollInterval = setInterval(() => {
            checkPromoStatus(senderId);
        }, 2500);
    }

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && !currentSenderPromo && step2 && step2.style.display !== 'none') {
            const senderId = getSenderId();
            checkPromoStatus(senderId);
        }
    });

    window.addEventListener('focus', () => {
        if (!currentSenderPromo && step2 && step2.style.display !== 'none') {
            const senderId = getSenderId();
            checkPromoStatus(senderId);
        }
    });

    if (directRegBtn) {
        directRegBtn.addEventListener('click', () => {
            openLinkSafe(EVENT_CONFIG.registrationLink);
        });
    }

    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            const senderId = getSenderId();

            if (window.Telegram?.WebApp?.switchInlineQuery) {
                try {
                    window.Telegram.WebApp.switchInlineQuery("invite");
                } catch (e) {
                    console.warn("switchInlineQuery error:", e);
                }
            } else {
                const directLink = `${EVENT_CONFIG.registrationLink}?promo=${EVENT_CONFIG.promoReceiver}`;
                const shareText = `Привет! Приглашаю тебя на медитацию «${EVENT_CONFIG.title}». Держи от меня подарок — скидку 15% по промокоду ${EVENT_CONFIG.promoReceiver} ✨\n\nРегистрируйся по ссылке:\n${directLink}`;
                const shareUrl = `https://t.me/share/url?url=&text=${encodeURIComponent(shareText)}`;
                openLinkSafe(shareUrl, true);
            }

            if (window.Telegram?.WebApp?.expand) {
                window.Telegram.WebApp.expand();
            }

            if (step1) step1.style.display = 'none';
            if (step2) step2.style.display = 'block';
            if (step2Desc) step2Desc.innerText = 'Ожидаем подтверждения отправки...';
            if (promoDisplay) {
                promoDisplay.style.display = 'block';
                promoDisplay.innerText = '...';
            }
            if (rewardTimerBox) rewardTimerBox.style.display = 'none';
            if (applyPromoBtn) applyPromoBtn.style.display = 'none';

            startStatusPolling(senderId);
        });
    }

    if (applyPromoBtn) {
        applyPromoBtn.addEventListener('click', () => {
            const promoToApply = currentSenderPromo || localStorage.getItem(getEventKey('event_sender_promo')) || '';
            if (!promoToApply) return;
            localStorage.setItem(getEventKey('event_promo_claimed'), 'true');

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(promoToApply).catch(err => console.log('Clipboard error:', err));
            }

            const applyUrl = `${EVENT_CONFIG.registrationLink}?promo=${encodeURIComponent(promoToApply)}`;
            openLinkSafe(applyUrl);
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
