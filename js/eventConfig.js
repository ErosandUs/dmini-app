const EVENT_CONFIG = {
    // 1. Статус: true (показывать анонс и таймер) или false (скрыть всё)
    isActive: false,

    // 2. Название практики/медитации (отображается в окне анонса и в тексте приглашения)
    title: "Целительная сессия. Дева Мария",

    // 3. Дата и время старта события в формате ISO (ГГГГ-ММ-ДДTЧЧ:ММ:СС)
    // Нужна для работы счетчика обратного отсчета
    date: "2026-09-09T20:30:00",

    // 4. Путь к баннеру события (рекомендуется квадратная картинка, например 800x800 px, для идеального отображения на телефонах)
    imagePath: "images/event_banner.jpeg",

    // 5. Ссылка на бота в Telegram (без знака @)
    botUsername: "Djamiliakha_bot",

    // 6. Основная ссылка на лендинг/страницу оплаты GetCourse (чистая ссылка БЕЗ GET-параметров)
    registrationLink: "https://djamiliakha.ru/09.09.26",

    // 7. Общий статический промокод со скидкой для подруги (получателя)
    promoReceiver: "ЛЮБОВЬ15",

    // 8. URL веб-приложения Google Apps Script (микросервис для выдачи уникальных кодов отправителям)
    appsScriptUrl: "https://script.google.com/macros/s/AKfycbxvBYeGEZgc22LaqwFhE8wX7JyX94Ti1QhwssyJqeZP3JDCJN5ey_iE5XuEm2S0xXMm-w/exec"
};