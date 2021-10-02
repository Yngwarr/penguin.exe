/**** CLASSES ****/

class Penguin {
    constructor(x, y, container) {
        this.x = x;
        this.y = y;
        this.el = this.initElement(container);
        // point
        this.target = null;
        this.captured = false;

        const rect = this.el.getBoundingClientRect();
        this.w = rect.width;
        this.h = rect.height;

        this.updateView();
    }

    initElement(container) {
        let el = document.createElement('div');
        el.classList.add('penguin');
        el.addEventListener('mousedown', () => {
            this.captured = true;
        });
        el.addEventListener('mouseup', () => {
            this.captured = false;
        });
        container.appendChild(el);
        return el;
    }

    setPos(x, y) {
        this.x = x;
        this.y = y;
        this.updateView();
    }

    move(x, y) {
        this.x += x;
        this.y += y;
        this.updateView();
    }

    updateView() {
        this.el.style.left = `${this.x}px`;
        this.el.style.top = `${this.y}px`;
    }
}

/**** GLOBALS ****/

const PENGUIN_SPEED = 2;

const state = {
    prevFrame: null,
    mousePos: { x: 0, y: 0 },

    penguins: []
};

/**** HELPERS ****/

function getCenter(el) {
    const rect = el.getBoundingClientRect();
    return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}

function distance(from, to) {
    return Math.sqrt((to.x - from.x) ** 2 + (to.y - from.y) ** 2);
}

function direction(from, to) {
    const dist = distance(from, to);
    return { x: (to.x - from.x) / dist, y: (to.y - from.y) / dist };
}

function near(a, b) {
    return distance(a, b) < 5;
}

/**** GAMEPLAY ****/

function step(t) {
    requestAnimationFrame(step);

    if (state.prevFrame === null) {
        state.prevFrame = t;
    }
    const dt = t - state.prevFrame;
    state.prevFrame = t;

    if (dt > 1e3) return;

    for (let p of state.penguins) {
        if (p.target === null) continue;

        if (p.captured) {
            p.setPos(state.mousePos.x - p.w / 2, state.mousePos.y - p.h / 2);
            continue;
        }

        if (near(p, p.target)) continue;

        const dir = direction(p, p.target);
        p.move(dir.x * PENGUIN_SPEED, dir.y * PENGUIN_SPEED);
    }
}

function init() {
    const body = document.querySelector('body');
    body.addEventListener('mousemove', e => {
        state.mousePos.x = e.clientX;
        state.mousePos.y = e.clientY;
    });

    state.penguins = [new Penguin(10, 10, body)];
    state.penguins[0].target = getCenter(document.querySelector('#no-clickin'));

    requestAnimationFrame(step);
}
