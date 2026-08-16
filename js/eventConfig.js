const EVENT_CONFIG = {
    // Статус: true (показывать анонс и таймер) или false (скрыть всё)
    isActive: false, 
    
    // Основная информация
    title: "Осеннее Равноденствие: Баланс энергий",
    date: "2026-09-21T20:30:00", // Дата и время (в формате Год-Месяц-День T Время)
    price: "1500 руб.",
    
    // Картинка (ты просто заменяешь файл event_banner.jpeg в папке images)
    imagePath: "images/event_banner.jpeg", 
    
    // Ссылка на регистрацию/оплату (GetCourse)
    registrationLink: "https://djamiliakha.ru/23.09.2026",
    
    // Юзернейм Telegram-бота без символа @ (для генерации реферальной ссылки)
    botUsername: "Djamiliakha_bot",

    // Промокод для получателя
    promoReceiver: "ЛЮБОВЬ15",

    // Пул промокодов для отправителя
    promoSendersPool: ["KODi DLIA OTPRAVITELIA"]
};