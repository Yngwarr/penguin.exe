/**** CONSTS ****/

const SIN_1 = Math.sin(Math.PI/8);
const SIN_3 = Math.sin(3 * Math.PI/8);
const SIN_5 = Math.sin(5 * Math.PI/8);
const SIN_7 = Math.sin(7 * Math.PI/8);
const SIN_9 = Math.sin(9 * Math.PI/8);
const SIN_11 = Math.sin(11 * Math.PI/8);
const SIN_13 = Math.sin(13 * Math.PI/8);
const SIN_15 = Math.sin(15 * Math.PI/8);
const COS_1 = Math.cos(Math.PI/8);
const COS_3 = Math.cos(3 * Math.PI/8);
const COS_5 = Math.cos(5 * Math.PI/8);
const COS_7 = Math.cos(7 * Math.PI/8);
const COS_9 = Math.cos(9 * Math.PI/8);
const COS_11 = Math.cos(11 * Math.PI/8);
const COS_13 = Math.cos(13 * Math.PI/8);
const COS_15 = Math.cos(15 * Math.PI/8);

const PENGUIN_SPEED = .125;
const PENGUIN_SIZE = 64;
const ANIMATION_DURATION = 100;
const TILE_SIZE = 72;
const TILE_OFFSET = 10;
const START_FOLDERS = 6;
const START_PENGUINS = 3;

const PenguinState = {
    IDLE: 0,
    RUNNING: 1,
    PRESSING: 2,
    HANGING: 3,
    GETTING_UP: 4,
    SEARCHING: 5,
    TOSSING: 6,
    PRESSING: 7
};

const TossStage = {
    SETUP: 0,
    RUNNING: 1,
    SEARCHING: 2,
    TOSSING: 3
};

/**** STRINGS ****/

let folderNames = [
    "Folder (1)",
    "Secrets",
    "Unicorns",
    "Ludum Dare 49",
    "Source"
];

let fileNames = [
    "con",
    "main.cpp",
    "lena.jpg",
    "SYNTHWAVE.wav",
    "keygen.exe",
    "winlogon.exe",
    "unicorn.jpg",
    "cheats.txt",
    "passwords.doc",
    "secrets_DONT_OPEN.docx",
    "penguin.png",
    "DiggyHole.mp3",
    "internet.zip",
    "hl3.rar"
];

const EXTENSIONS = [
    'txt', 'cpp',
    'jpg', 'png',
    'wav', 'mp3',
    'zip', 'rar',
    'exe'
];

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

function updateBehaviour(penguin) {
    // TODO recycle previous behaviour
    return new TossBehaviour(sample(game.folders).el);
}

class TossBehaviour {
    constructor(targetElement) {
        this.targetElement = targetElement;
        this.stage = TossStage.SETUP;
    }

    next(penguin) {
        switch (this.stage) {
            case TossStage.SETUP:
                penguin.target = this.findTarget();
                penguin.setState(PenguinState.RUNNING);
                this.stage = TossStage.RUNNING;
            break;
            case TossStage.RUNNING:
                penguin.setState(PenguinState.SEARCHING);
                this.stage = TossStage.SEARCHING;
            break;
            case TossStage.SEARCHING:
                penguin.setState(PenguinState.TOSSING);
                this.stage = TossStage.TOSSING;
            break;
            case TossStage.TOSSING:
                spawnRandomFile();
                penguin.setState(PenguinState.SEARCHING);
                this.stage = TossStage.SEARCHING;
            break;
        }
    }

    findTarget() {
        return getCenter(this.targetElement);
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
        this.state = PenguinState.IDLE;
        this.behaviour = updateBehaviour(this);

        const rect = this.el.getBoundingClientRect();
        this.w = rect.width;
        this.h = rect.height;

        this.updateView();
    }

    initElement(container) {
        let el = document.createElement('div');
        el.classList.add('penguin');
        el.addEventListener('mousedown', () => {
            unselect();
            this.captured = true;
            this.setState(PenguinState.HANGING);
        });
        el.addEventListener('mouseup', () => {
            this.captured = false;
            this.setState(PenguinState.GETTING_UP);
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

    runningAnim(x, y) {
        if (between(x, COS_1, COS_3) && between(y, SIN_1, SIN_3))
            return 'right_down';
        if (between(x, COS_5, COS_7) && between(y, SIN_5, SIN_7))
            return 'left_down';
        if (between(x, COS_9, COS_11) && between(y, SIN_9, SIN_11))
            return 'left_up';
        if (between(x, COS_13, COS_15) && between(y, SIN_13, SIN_15))
            return 'right_up';

        if (x > y && x >= -y)
            return 'right';
        if (x > y && x <= -y)
            return 'up';
        if (x < y && x >= -y)
            return 'down';
        if (x < y && x <= -y)
            return 'left';

        return 'llamapalooza'
    }

    setState(state) {
        switch (state) {
            case PenguinState.IDLE:
                game.animations[this.animId].setAnim('idle');
            break;
            case PenguinState.RUNNING:
                const dir = direction(this, this.target);
                game.animations[this.animId].setAnim(this.runningAnim(dir.x, dir.y));
            break;
            case PenguinState.HANGING:
                game.animations[this.animId].setAnim('hanging');
            break;
            case PenguinState.GETTING_UP:
                game.animations[this.animId].setAnim('getting_up', a => {
                    this.setState(PenguinState.IDLE);
                    this.behaviour = updateBehaviour(this);
                });
            break;
            case PenguinState.SEARCHING:
                game.animations[this.animId].setAnim('search', a => {
                    this.behaviour.next(this);
                });
            break;
            case PenguinState.TOSSING:
                game.animations[this.animId].setAnim('toss', a => {
                    this.behaviour.next(this);
                });
            break;
            case PenguinState.PRESSING:
                game.animations[this.animId].setAnim('press', a => {
                    this.behaviour.next(this);
                });
            break;
        }
        this.state = state;
    }

    tick(dt) {
        if (this.state === PenguinState.IDLE) {
            this.behaviour.next(this);
        }

        if (this.target === null) return;

        if (this.captured) {
            this.setPos(game.mousePos.x - this.w / 2, game.mousePos.y - this.h / 2);
            return;
        }

        if (this.state === PenguinState.RUNNING && near(this, this.target)) {
            this.behaviour.next(this);
            return;
        }

        if (this.state === PenguinState.RUNNING) {
            const dir = direction(this, this.target);
            const speed = PENGUIN_SPEED * dt;
            this.move(dir.x * speed, dir.y * speed);
        }
    }
}

class Folder {
    constructor(x, y, name, container) {
        this.x = x;
        this.y = y;
        this.name = name;
        this.open = false;
        this.el = this.initElement(container);
        this.el.addEventListener('click', e => {
            e.stopPropagation();
            select(this.el);
        });

        this.updateView();
    }

    initElement(container) {
        const el = document.createElement('div');
        el.classList.add('file', 'folder');
        const icon = document.createElement('div');
        icon.classList.add('icon');
        const span = document.createElement('span');
        span.innerText = this.name;
        el.appendChild(icon)
        el.appendChild(span);
        container.appendChild(el);

        return el;
    }

    setOpen(value) {
        this.open = value;
        if (value) {
            this.el.classList.add('open');
        } else {
            this.el.classList.remove('open');
        }
    }

    setPos(x, y) {
        this.x = x;
        this.y = y;
        this.updateView();
    }

    updateView() {
        this.el.style.left = `${this.x}px`;
        this.el.style.top = `${this.y}px`;
    }
}

class File {
    constructor(x, y, name, container) {
        this.x = x;
        this.y = y;
        this.name = name;
        this.el = this.initElement(container);
        this.el.addEventListener('click', e => {
            e.stopPropagation();
            select(this.el);
        });

        this.updateView();
    }

    initElement(container) {
        const el = document.createElement('div');
        el.classList.add('file');
        const ext = this.extentionClass();
        if (ext !== null) {
            el.classList.add(ext);
        }

        const icon = document.createElement('div');
        icon.classList.add('icon');
        const span = document.createElement('span');
        span.innerText = this.name;
        el.appendChild(icon)
        el.appendChild(span);
        container.appendChild(el);

        return el;
    }

    extentionClass() {
        const ext = this.name.substr(this.name.indexOf('.') + 1);
        return EXTENSIONS.includes(ext) ? ext : null;
    }

    updateView() {
        this.el.style.left = `${this.x}px`;
        this.el.style.top = `${this.y}px`;
    }
}

class Grid {
    constructor(container, tile, offset) {
        const rect = container.getBoundingClientRect();
        this.w = rect.width;
        this.h = rect.height;
        this.tile = tile;
        this.offset = offset;
        this.pts = new Set();

        this.tw = ((this.w - offset) / this.tile)|0;
        this.th = ((this.h - offset) / this.tile)|0;
    }

    add(x, y) {
        return this.addId(this.flat(x, y));
    }

    addNext() {
        return this.addId(0);
    }

    addRandom() {
        const x = (Math.random() * this.w)|0;
        const y = (Math.random() * this.h)|0;
        return this.add(x, y);
    }
    
    addId(_id) {
        let id = _id;
        while (this.pts.has(id)) {
            ++id;
        }
        this.pts.add(id);
        return this.unflat(id);
    }

    remove(x, y) {
        const id = this.flat(x, y);
        if (!this.pts.delete(id)) {
            console.warn(`Tried to delete ${id} from the Grid. No luck...`);
        }
    }

    gridCoords(x, y) {
        return {
            x: ((x - this.offset) / this.tile)|0,
            y: ((y - this.offset) / this.tile)|0,
        }
    }

    snap(x, y) {
        const gc = this.gridCoords(x, y);
        const sx = gc.x * this.tile + this.offset;
        const sy = gc.y * this.tile + this.offset;
        return { x: sx, y: sy };
    }

    flat(x, y) {
        const gc = this.gridCoords(x, y);
        return gc.y * this.th + gc.x;
    }

    unflat(id) {
        const tx = (id / this.th)|0;
        const ty = id % this.th;
        return { x: tx * this.tile + this.offset, y: ty * this.tile + this.offset };
    }
}

/**** GLOBALS ****/

const game = {
    grid: null,
    prevFrame: null,
    mousePos: { x: 0, y: 0 },

    penguins: [],
    animations: [],
    folders: [],
    files: []
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

function between(x, a, b) {
    return x > Math.min(a, b) && x < Math.max(a, b);
}

function shuffle(arr) {
    arr.sort(() => Math.random() - .5);
}

function sample(arr) {
    return arr[(Math.random() * arr.length)|0]
}

function popName(arr, defaultValue) {
    return arr.pop() ?? `${defaultValue} (${(Math.random() * 1000 + 1)|0})`;
}

/**** GAMEPLAY ****/

function select(el) {
    unselect();
    el.classList.add('selected');
}

function unselect() {
    document.querySelectorAll('.file.selected').forEach(el => el.classList.remove('selected'));
}

function spawnRandomFile() {
    const p = game.grid.addRandom();
    const f = new File(p.x, p.y, popName(fileNames, 'File'), desktop);
    game.files.push(f);
}

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
    const desktop = document.getElementById('desktop');

    body.addEventListener('mousemove', e => {
        game.mousePos.x = e.clientX;
        game.mousePos.y = e.clientY;
    });

    desktop.addEventListener('click', e => unselect());

    game.grid = new Grid(desktop, TILE_SIZE, TILE_OFFSET);

    const frames = {
        idle: [[0,0], [1,0]],

        up: [[0,1], [1,1],[0,1],[2,1]],
        down: [[1,0], [2,0],[1,0],[3,0]],

        left: [[5,4], [6,4],[7,4],[5,4],[0,5]],
        left_up: [[5,5], [6,5],[7,5],[6,5],[0,6]],
        left_down: [[3,1], [4,1],[5,1],[4,1],[6,1]],

        right: [[4,0], [5,0],[6,0],[4,0],[7,0]],
        right_up: [[7,1], [0,2],[1,2],[0,2],[2,2]],
        right_down: [[1,5], [2,5],[3,5],[2,5],[4,5]],

        hanging: [[3,2], [4,2]],
        getting_up: [[5,2], [6,2], [7,2], [0,3], [1,3], [0,0],[1,0]],

        search: [[3,3], [4,3]],
        toss: [[5,3], [6,3], [7,3], [0,4], [4,3], [3,3], [1,4], [2,4], [3,4],[4,4]],
        press: [[6,5], [1,6], [2,6], [3,6], [4,6],[5,6],[5,5]]
    };

    shuffle(folderNames);
    shuffle(fileNames);

    for (let i = 0; i < START_FOLDERS; ++i) {
        const p = game.grid.addRandom();
        const f = new Folder(p.x, p.y, popName(folderNames, 'Folder'), desktop);
        game.folders.push(f);
    }

    for (let i = 0; i < START_PENGUINS; ++i) {
        const p = new Penguin(10, 40 * i, body, i);
        const a = new Animation(p.el, frames, 'right', PENGUIN_SIZE);

        game.penguins.push(p);
        game.animations.push(a);
    }

    requestAnimationFrame(step);
}

function closeSeal() {
    document.querySelector('.browser').style.display = 'none';
}
