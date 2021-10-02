/**** CLASSES ****/

class Animation {
    constructor(el, anims, defaultAnim, size) {
        this.anims = anims;
        this.currentAnim = defaultAnim;
        this.currentFrame = 0;
        this.el = el;
        this.size = size;

        this.countdown = 0;
        this.onEnd = null;
    }

    setAnim(name, onEnd = null) {
        if (!Object.keys(this.anims).includes(name)) {
            console.warn(`There are no animation named '${name}'.`);
            return;
        }
        this.currentAnim = name;
        this.currentFrame = 0;
        this.onEnd = onEnd;
    }

    tick(dt) {
        this.countdown -= dt;
        if (this.countdown > 0) return;

        this.nextFrame();
        this.countdown = ANIMATION_DURATION;
    }

    nextFrame() {
        const frames = this.anims[this.currentAnim];

        ++this.currentFrame;
        if (this.onEnd !== null && this.currentFrame >= frames.length) {
            this.onEnd(this);
        }
        this.currentFrame %= frames.length;

        const f = frames[this.currentFrame];
        this.el.style.backgroundPosition = `${-f[0] * this.size}px ${-f[1] * this.size}px`;
    }
}

class Penguin {
    constructor(x, y, container, animId) {
        this.x = x;
        this.y = y;
        this.animId = animId;
        this.el = this.initElement(container);
        // point
        this.target = null;
        this.captured = false;
        this.state = PenguinState.RUNNING;

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

    setState(state) {
        switch (state) {
            case PenguinState.IDLE:
                game.animations[this.animId].setAnim('idle');
            break;
            case PenguinState.RUNNING:
                // TODO set an actual direction
                game.animations[this.animId].setAnim('right');
            break;
            case PenguinState.PRESSING:
                game.animations[this.animId].setAnim('press', a => {
                    if (game.target !== null) {
                        game.target.click();
                        game.target = null;
                    }
                    this.setState(PenguinState.IDLE);
                });
            break;
        }
        this.state = state;
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

    tick(dt) {
        if (this.target === null) return;

        if (this.captured) {
            this.setPos(game.mousePos.x - this.w / 2, game.mousePos.y - this.h / 2);
            return;
        }

        if (this.state === PenguinState.RUNNING && near(this, this.target)) {
            this.setState(PenguinState.PRESSING);
            return;
        }

        if (this.state === PenguinState.RUNNING) {
            const dir = direction(this, this.target);
            const speed = PENGUIN_SPEED * dt;
            this.move(dir.x * speed, dir.y * speed);
        }
    }
}

const PenguinState = {
    IDLE: 0,
    RUNNING: 1,
    PRESSING: 2
};

/**** GLOBALS ****/

const PENGUIN_SPEED = .125;
const PENGUIN_SIZE = 32;
const ANIMATION_DURATION = 100;

const game = {
    prevFrame: null,
    mousePos: { x: 0, y: 0 },

    penguins: [],
    animations: [],
    target: null
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

    if (game.prevFrame === null) {
        game.prevFrame = t;
    }
    const dt = t - game.prevFrame;
    game.prevFrame = t;

    if (dt > 1e3) return;

    for (let p of game.penguins) {
        p.tick(dt);
    }
    
    for (let a of game.animations) {
        a.tick(dt);
    }
}

function init() {
    const body = document.querySelector('body');
    body.addEventListener('mousemove', e => {
        game.mousePos.x = e.clientX;
        game.mousePos.y = e.clientY;
    });

    game.target = document.querySelector('#no-clickin');
    const t = getCenter(game.target);

    const frames = {
        idle: [[2,2], [0,1]],
        blink: [[2,2], [5,1]],

        up: [[2,1], [2,0]],
        down: [[2,3], [0,0]],

        left: [[1,2], [0,2]],
        up_left: [[1,1], [1,0]],
        down_left: [[1,3], [0,3]],

        right: [[3,2], [4,2]],
        up_right: [[3,1], [3,0]],
        down_right: [[3,3], [4,3]],

        dragged: [[0,4], [1,4]],
        dropped: [[2,4], [3,4], [4,0], [5,0], [4,1], [2,2]],
        shake: [[5,2], [2,2], [5,3]],

        check_folder: [[4,4], [5,4]],
        toss: [[5,5], [4,5], [3,5], [0,5], [5,5], [2,5], [1,5], [0,5], [5,5]],
        press: [[0,6], [1,6], [2,6], [3,6], [4,6]]
    };

    for (let i = 0; i < 1; ++i) {
        const p = new Penguin(10, 40 * i, body, i);
        const a = new Animation(p.el, frames, 'right', PENGUIN_SIZE);

        p.target = t;

        game.penguins.push(p);
        game.animations.push(a);
    }

    requestAnimationFrame(step);
}

function closeSeal() {
    document.querySelector('.browser').style.display = 'none';
}
