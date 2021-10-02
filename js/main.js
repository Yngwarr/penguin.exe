class Penguin {
    constructor(x, y, container) {
        this.x = x;
        this.y = y;
        this.el = this.initElement(container);

        this.updateView();
    }

    initElement(container) {
        let el = document.createElement('div');
        el.classList.add('penguin');
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

const state = {
    prevFrame: null,

    penguins: []
};

function step(t) {
    requestAnimationFrame(step);

    if (state.prevFrame === null) {
        state.prevFrame = t;
    }
    const dt = t - state.prevFrame;

    if (dt > 1e3) return;

    for (let p of state.penguins) {
        p.move(1, 0);
    }

    state.prevFrame = t;
}

function init() {
    const body = document.querySelector('body');

    state.penguins = [new Penguin(10, 10, body)];

    requestAnimationFrame(step);
}
