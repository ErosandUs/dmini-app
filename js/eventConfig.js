const EVENT_CONFIG = {
    // 1.  Статус: true (показывать анонс и таймер) или false (скрыть всё)
    isActive: true,

    // 2. Название практики/медитации
    title: "САКРАЛЬНАЯ ЖЕНСТВЕННОСТЬ",

    // 3. Дата и время старта события (ISO). Всегда по Москве: оставляйте «+03:00» в конце,
    //    тогда обратный отсчёт и подпись «МСК» верны на любом телефоне
    date: "2026-11-09T19:30:00+03:00",

    // 3.1. Плитка «События» на главном экране, пока есть анонс: общая, без привязки к конкретному эфиру.
    //      Строки: метка, название, «<слово> <дата>» (время в плитке не показывается)
    widgetEyebrow: "Анонс",
    widgetTitle: "Сакральная женственность",
    widgetDatePrefix: "Начало",

    // 3.2. Та же плитка, когда событий нет или они прошли: вход в Telegram-канал
    channelLink: "https://t.me/djamiliakha",
    channelEyebrow: "Telegram-канал",
    channelTitle: "Мир это Ты",
    channelSubtitle: "Послания, медитации, ченнелинг",

    // 4. Баннер события
    imagePath: "images/event_banner.jpeg",

    // 5. Описание во всплывающем окне (Шаг 1)
    description: "Старт уже завтра ✨ Успейте присоединиться. Подробности — по кнопке ниже.",

    // 6. Предупреждение / примечание под описанием (красный текст). Оставьте пустой строкой "", чтобы скрыть блок:
    warningText: "",

    // 7. Текст кнопок в окне анонса:
    shareButtonText: "Пригласить подругу 💌",
    directButtonText: "Узнать программу",

    // 8. Текст сообщения для отправки подруге в Telegram при шеринге:
    shareMessage: "Привет! Уже завтра стартует «{title}», и я сразу подумала о тебе ✨\nУспей присоединиться, программа и подробности по ссылке 💫\n\n{link}",

    // Выдача персонального промокода и скидок:
    // true  — включено: запрос в Google Таблицу за промокодом, показ Шага 2 с таймером 24ч;
    // false — выключено: открывается только отправка приглашения, экран с промокодом не открывается.
    isPromoActive: false,

    // 9. Ссылки и промокоды:
    botUsername: "Djamiliakha_bot",
    registrationLink: "https://djamiliakha.ru/sacral-woman",
    donationLink: "https://pay.cloudtips.ru/p/f430db35",
    promoReceiver: "ЛЮБОВЬ15",
    appsScriptUrl: "https://script.google.com/macros/s/AKfycbxvBYeGEZgc22LaqwFhE8wX7JyX94Ti1QhwssyJqeZP3JDCJN5ey_iE5XuEm2S0xXMm-w/exec",
    horoscopeScriptUrl: "https://script.google.com/macros/s/AKfycby1ngpmw4NxcL9cP0_dziG-Dm6ImUweRkCiytfUtQC9g74Y8sryIh8PfsAlEYjZONjE/exec",

    // 10. Утренние напоминания о карте дня (колокольчик справа над виджетом):
    // notifyScriptUrl — адрес отдельного Google Apps Script (Web App, /exec).
    // Время отправки (8:00 по местному времени) задаёт SEND_HOUR в самом скрипте Notifications.gs.
    notifyScriptUrl: "https://script.google.com/macros/s/AKfycbzcrHi-rcmLOgrM-YE99u1XbqJfIJo0QpAhEnfFatP5SthSTfQyYUAE5J7opK3Sln7g/exec"
};
