// js/cardFlip.js — кинематографичный переворот карты:
// подъём и золотое сияние → поворот со вспышкой «ребром» и световыми лентами → мягкая посадка

(() => {
    const DURATION = 1800;            // мс, вся сцена
    const REVEAL_AT = 0.7;            // доля сцены, когда лицевая сторона уже раскрыта
    const SPARK_COUNT = 18;
    const REDUCE_QUERY = '(prefers-reduced-motion: reduce)';

    const EASE_LIFT = 'cubic-bezier(0.45, 0, 0.2, 1)';
    const EASE_FLIP = 'cubic-bezier(0.7, 0, 0.3, 1)';     // разгон к ребру и плавное торможение без отскока
    const EASE_SETTLE = 'cubic-bezier(0.22, 1, 0.36, 1)';
    const EASE_IN = 'cubic-bezier(0.55, 0, 1, 0.45)';
    const EASE_OUT = 'cubic-bezier(0, 0.55, 0.45, 1)';

    const fxByContainer = new WeakMap();
    const random = (min, max) => min + Math.random() * (max - min);
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    function buildFx(container) {
        const orbit = (variant, half) =>
            `<div class="flip-orbit flip-orbit--${variant} flip-orbit--${half}"><div class="flip-comet"></div></div>`;

        container.insertAdjacentHTML('afterbegin',
            `<div class="flip-fx flip-fx--back" aria-hidden="true"><div class="flip-aura"></div>${orbit('a', 'back')}${orbit('b', 'back')}</div>`);
        container.insertAdjacentHTML('beforeend',
            `<div class="flip-fx flip-fx--front" aria-hidden="true">
                ${orbit('a', 'front')}${orbit('b', 'front')}
                <div class="flip-burst"></div>
                <div class="flip-flare"></div>
                <div class="flip-flare flip-flare--v"></div>
                ${'<i class="flip-spark"></i>'.repeat(SPARK_COUNT)}
            </div>`);

        const fx = {
            aura: container.querySelector('.flip-aura'),
            orbitsA: container.querySelectorAll('.flip-orbit--a'),
            orbitsB: container.querySelectorAll('.flip-orbit--b'),
            burst: container.querySelector('.flip-burst'),
            flareH: container.querySelector('.flip-flare:not(.flip-flare--v)'),
            flareV: container.querySelector('.flip-flare--v'),
            sparks: container.querySelectorAll('.flip-spark'),
        };
        fxByContainer.set(container, fx);
        return fx;
    }

    // Все анимации — на одной шкале DURATION, тайминг задаётся долями (offset)
    function animateScene(card, container, fx) {
        const opts = (extra) => Object.assign({ duration: DURATION, fill: 'both' }, extra);
        const animations = [];
        const add = (el, keyframes, extra) => animations.push(el.animate(keyframes, opts(extra)));

        // 1. Карта: подъём с лёгким «замахом» → поворот → посадка
        add(card, [
            { offset: 0, transform: 'translateY(0) rotateY(0deg) scale(1)', easing: EASE_LIFT },
            { offset: 0.2, transform: 'translateY(-10px) rotateY(-10deg) scale(1.03)', easing: EASE_FLIP },
            { offset: 0.66, transform: 'translateY(-16px) rotateY(180deg) scale(1.07)', easing: EASE_SETTLE },
            { offset: 1, transform: 'translateY(0) rotateY(180deg) scale(1)' },
        ], { fill: 'none' });

        // 2. Тёплая аура за картой: разгорается при подъёме, гаснет после раскрытия
        add(fx.aura, [
            { offset: 0, opacity: 0, transform: 'scale(0.85)', easing: EASE_LIFT },
            { offset: 0.2, opacity: 0.85, transform: 'scale(1)' },
            { offset: 0.5, opacity: 1, transform: 'scale(1.08)', easing: EASE_OUT },
            { offset: 0.9, opacity: 0, transform: 'scale(1.15)' },
            { offset: 1, opacity: 0, transform: 'scale(1.15)' },
        ]);

        // 3. Световые ленты: проявляются, кружат вокруг карты и гаснут к посадке
        const orbitFade = [
            { offset: 0, opacity: 0 },
            { offset: 0.12, opacity: 1 },
            { offset: 0.62, opacity: 1, easing: EASE_OUT },
            { offset: 0.9, opacity: 0 },
            { offset: 1, opacity: 0 },
        ];
        fx.orbitsA.forEach((orbit) => {
            add(orbit, orbitFade);
            add(orbit.firstElementChild, [
                { transform: 'rotate(-40deg)' },
                { transform: 'rotate(500deg)' },
            ], { easing: 'cubic-bezier(0.3, 0.15, 0.25, 1)' });
        });
        fx.orbitsB.forEach((orbit) => {
            add(orbit, orbitFade, { delay: 90 });
            add(orbit.firstElementChild, [
                { transform: 'rotate(160deg)' },
                { transform: 'rotate(-330deg)' },
            ], { easing: 'cubic-bezier(0.3, 0.15, 0.25, 1)', delay: 90 });
        });

        // 4. Вспышка и лучи: пик ровно в момент, когда карта стоит ребром (~0.435)
        add(fx.burst, [
            { offset: 0, opacity: 0, transform: 'scale(0.2)' },
            { offset: 0.24, opacity: 0.3, transform: 'scale(0.55)', easing: EASE_IN },
            { offset: 0.435, opacity: 1, transform: 'scale(1.35)', easing: EASE_OUT },
            { offset: 0.66, opacity: 0, transform: 'scale(1.7)' },
            { offset: 1, opacity: 0, transform: 'scale(1.7)' },
        ]);
        add(fx.flareH, [
            { offset: 0, opacity: 0, transform: 'rotate(-14deg) scaleX(0)' },
            { offset: 0.33, opacity: 0, transform: 'rotate(-14deg) scaleX(0)', easing: EASE_IN },
            { offset: 0.435, opacity: 1, transform: 'rotate(-14deg) scaleX(1)', easing: EASE_OUT },
            { offset: 0.6, opacity: 0, transform: 'rotate(-14deg) scaleX(0.5)' },
            { offset: 1, opacity: 0, transform: 'rotate(-14deg) scaleX(0.5)' },
        ]);
        add(fx.flareV, [
            { offset: 0, opacity: 0, transform: 'rotate(-14deg) scaleY(0)' },
            { offset: 0.36, opacity: 0, transform: 'rotate(-14deg) scaleY(0)', easing: EASE_IN },
            { offset: 0.435, opacity: 0.85, transform: 'rotate(-14deg) scaleY(1)', easing: EASE_OUT },
            { offset: 0.56, opacity: 0, transform: 'rotate(-14deg) scaleY(0.4)' },
            { offset: 1, opacity: 0, transform: 'rotate(-14deg) scaleY(0.4)' },
        ]);

        // 5. Искры: вспыхивают у краёв карты и уплывают наружу и вверх
        const halfW = container.clientWidth / 2;
        const halfH = container.clientHeight / 2;
        fx.sparks.forEach((spark) => {
            const angle = random(0, Math.PI * 2);
            const x0 = Math.cos(angle) * halfW * random(0.55, 1);
            const y0 = Math.sin(angle) * halfH * random(0.55, 1);
            const x1 = x0 * random(1.15, 1.45);
            const y1 = y0 * random(1.1, 1.3) - random(20, 60);
            const size = random(0.6, 1.5);
            const delay = random(200, 1000);
            const life = random(650, 1050);
            animations.push(spark.animate([
                { opacity: 0, transform: `translate(${x0}px, ${y0}px) scale(${size * 0.3})` },
                { opacity: 1, transform: `translate(${(x0 + x1) / 2}px, ${(y0 + y1) / 2}px) scale(${size})`, offset: 0.3 },
                { opacity: 0, transform: `translate(${x1}px, ${y1}px) scale(${size * 0.4})` },
            ], { duration: life, delay, easing: EASE_OUT, fill: 'both' }));
        });

        return animations;
    }

    // Меньше движения (настройка iPhone): без поворота и полётов, мягкая смена прозрачности
    async function softReveal(card) {
        const fadeOut = card.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, easing: 'ease-in', fill: 'forwards' });
        await fadeOut.finished;
        card.classList.add('flipped');
        card.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'ease-out' });
        fadeOut.cancel();
    }

    // Возвращает Promise, который выполняется, когда лицевая сторона раскрыта
    window.playCardFlip = function playCardFlip(card) {
        const container = card.parentElement;

        if (typeof card.animate !== 'function') {
            card.classList.add('flipped');
            return wait(900);
        }
        if (window.matchMedia(REDUCE_QUERY).matches) {
            return softReveal(card);
        }

        const fx = fxByContainer.get(container) || buildFx(container);

        // Итоговое состояние ставим сразу, без CSS-перехода: сцену ведёт Web Animations API
        card.style.transition = 'none';
        card.style.willChange = 'transform';
        card.classList.add('flipped', 'is-glowing');
        container.classList.add('is-flipping');

        const animations = animateScene(card, container, fx);

        // Сияние гаснет, пока карта оседает
        setTimeout(() => card.classList.remove('is-glowing'), DURATION * 0.62);

        Promise.all(animations.map((anim) => anim.finished)).catch(() => {}).then(() => {
            animations.forEach((anim) => anim.cancel());
            container.classList.remove('is-flipping');
            card.style.willChange = '';
            card.style.transition = '';
        });

        return wait(DURATION * REVEAL_AT);
    };
})();
