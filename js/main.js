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

const CRITICAL_LOAD = 80;
const PENGUIN_SPEED = .125;
const PENGUIN_SIZE = 64;
const ANIMATION_DURATION = 100;
const TILE_SIZE = 72;
const TILE_OFFSET = 10;
const START_FOLDERS = 10;
const START_PENGUINS = 3;
const MAX_PENGUINS = 5;
const SPAWN_RATE = 1000; //ms
const MIN_SEARCH_DURATION = 2;
const MAX_SEARCH_DURATION = 15;

const ANIMATION_FRAMES = {
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

const GameState = {
    STARTING: 0,
    RUNNING: 1,
    PAUSED: 2
};

const PenguinState = {
    IDLE: 0,
    RUNNING: 1,
    PRESSING: 2,
    HANGING: 3,
    GETTING_UP: 4,
    SEARCHING: 5,
    TOSSING: 6,
    PRESSING: 7,
    DEAD: 8
};

const FolderState = {
    CLOSED: 0,
    OPEN: 1,
    EMPTY: 2
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
    'mkv', 'mpg',
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
        this.stopped = false;

        this.countdown = 0;
        this.onEnd = null;
    }

    stop() {
        this.stopped = true;
    }

    start() {
        this.stopped = false;
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
        if (this.stopped) return;

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
    return new TossBehaviour(sample(game.folders));
}

class TossBehaviour {
    constructor(target) {
        this.target = target;
        this.stage = TossStage.SETUP;
        this.searchDuration = 1;
    }

    next(penguin) {
        switch (this.stage) {
            case TossStage.SETUP:
                penguin.target = this.findTargetPoint();
                penguin.setState(PenguinState.RUNNING);
                this.stage = TossStage.RUNNING;
            break;
            case TossStage.RUNNING:
                this.setSearchDuration();
                this.target.setState(FolderState.OPEN);

                penguin.setState(PenguinState.SEARCHING);
                this.stage = TossStage.SEARCHING;
            break;
            case TossStage.SEARCHING:
                if (--this.searchDuration > 0) break;
                this.target.setState(FolderState.EMPTY);

                penguin.setState(PenguinState.TOSSING);
                this.stage = TossStage.TOSSING;
            break;
            case TossStage.TOSSING:
                spawnRandomFile();
                this.setSearchDuration();
                this.target.setState(FolderState.OPEN);

                penguin.setState(PenguinState.SEARCHING);
                this.stage = TossStage.SEARCHING;
            break;
        }
    }

    setSearchDuration() {
        this.searchDuration = MIN_SEARCH_DURATION
            + ((Math.random() * (MAX_SEARCH_DURATION - MIN_SEARCH_DURATION))|0);
    }

    findTargetPoint() {
        const c = getCenter(this.target.el);
        return { x: c.x + 16, y: c.y };
    }
}

class Penguin {
    constructor(x, y, container, animId) {
        this.animId = animId;
        this.el = this.initElement(container);

        const rect = this.el.getBoundingClientRect();
        this.w = rect.width;
        this.h = rect.height;

        this.init(x, y);
    }

    init(x, y) {
        this.x = x;
        this.y = y;
        // point
        this.target = null;
        this.captured = false;
        this.state = PenguinState.IDLE;
        this.behaviour = updateBehaviour(this);

        this.el.classList.remove('hidden');
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
        this.el.style.left = `${this.x - this.w / 2}px`;
        this.el.style.top = `${this.y - this.h / 2}px`;
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
            case PenguinState.DEAD:
                this.el.classList.add('hidden');
                game.animations[this.animId].stop();
                --game.penguinsAlive;
            break;
        }
        this.state = state;
    }

    tick(dt) {
        if (this.state === PenguinState.DEAD) return;

        if (this.state === PenguinState.IDLE) {
            this.behaviour.next(this);
        }

        if (this.target === null) return;

        if (this.captured) {
            this.setPos(game.mousePos.x, game.mousePos.y);
            return;
        }

        if (this.state === PenguinState.RUNNING && near(this, this.target)) {
            this.behaviour.next(this);
            return;
        }

        if (this.state === PenguinState.GETTING_UP && game.bin.isOver(this.x, this.y)) {
            this.setState(PenguinState.DEAD);
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
        this.state = FolderState.CLOSED;
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

    setState(value) {
        this.state = value;

        switch (value) {
            case FolderState.CLOSED:
                this.el.classList.remove('open', 'empty');
            break;
            case FolderState.OPEN:
                this.el.classList.remove('empty');
                this.el.classList.add('open');
            break;
            case FolderState.EMPTY:
                this.el.classList.remove('open');
                this.el.classList.add('empty');
            break;
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

class Bin {
    constructor(x, y, container) {
        this.x = x;
        this.y = y;

        this.el = this.initElement(container);
        this.el.addEventListener('click', e => {
            e.stopPropagation();
            select(this.el);
        });

        this.updateView();
    }

    initElement(container) {
        const el = document.createElement('div');
        el.classList.add('file', 'bin');
        const icon = document.createElement('div');
        icon.classList.add('icon');
        const span = document.createElement('span');
        span.innerText = 'Recycle Bin';
        el.appendChild(icon)
        el.appendChild(span);
        container.appendChild(el);

        return el;
    }

    updateView() {
        this.el.style.left = `${this.x}px`;
        this.el.style.top = `${this.y}px`;
    }

    isOver(x, y) {
        const rect = this.el.getBoundingClientRect();
        return x > rect.left && x < rect.right
            && y > rect.top && y < rect.bottom;
    }
}

class GameStarter {
    constructor(x, y, container) {
        this.x = x;
        this.y = y;

        this.el = this.initElement(container);
        this.el.addEventListener('click', e => {
            e.stopPropagation();
            select(this.el);
        });
        this.el.addEventListener('dblclick', e => {
            startGame();
        });

        this.updateView();
    }

    initElement(container) {
        const el = document.createElement('div');
        el.classList.add('file', 'starter');
        const icon = document.createElement('div');
        icon.classList.add('icon');
        const span = document.createElement('span');
        span.innerText = 'penguins.exe';
        el.appendChild(icon)
        el.appendChild(span);
        container.appendChild(el);

        return el;
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
        this.h = rect.height - 32;
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

class IndicatorCtrl {
    constructor() {
        this.cpu = 0;
        this.ram = 0;
        this.cpuEl = document.getElementById('cpu-progress');
        this.ramEl = document.getElementById('ram-progress');
    }

    update(cpu, ram) {
        if (this.cpu != cpu) {
            this.cpuEl.style.width = `${cpu}%`;
            if (cpu >= CRITICAL_LOAD && this.cpu < CRITICAL_LOAD) {
                this.cpuEl.classList.add('critical');
            }
            if (cpu < CRITICAL_LOAD && this.cpu >= CRITICAL_LOAD) {
                this.cpuEl.classList.remove('critical');
            }
            this.cpu = cpu;
        }
        if (this.ram != ram) {
            this.ramEl.style.width = `${ram}%`;
            if (ram >= CRITICAL_LOAD && this.ram < CRITICAL_LOAD) {
                this.ramEl.classList.add('critical');
            }
            if (ram < CRITICAL_LOAD && this.ram >= CRITICAL_LOAD) {
                this.ramEl.classList.remove('critical');
            }
            this.ram = ram;
        }
    }
}

/**** GLOBALS ****/

const game = {
    prevFrame: null,
    toNextSpawn: SPAWN_RATE, 
    state: GameState.STARTING,
    cpu: 0,
    ram: 0,

    penguins: [],
    penguinsAlive: 0,
    animations: [],
    folders: [],
    files: null,

    mousePos: { x: 0, y: 0 },
    body: null,
    indicators: null,
    grid: null,
    bin: null,
    starter: null
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

function popName(arr, defaultValue, addExtension = true) {
    return arr.pop() ?? `${defaultValue} (${(Math.random() * 1000 + 1)|0})`
        + (addExtension ? `.${sample(EXTENSIONS)}` : '');
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
    game.files.add(f);
}

function startGame() {
    if (game.state !== GameState.STARTING) return;

    // TODO add sounds, vfx, etc.
    game.state = GameState.RUNNING;
}

function tick(t) {
    requestAnimationFrame(tick);

    if (game.state !== GameState.RUNNING) return;

    if (game.prevFrame === null) {
        game.prevFrame = t;
    }
    const dt = t - game.prevFrame;
    game.prevFrame = t;

    if (dt > 1e3) return;

    game.toNextSpawn -= dt;
    if (game.toNextSpawn <= 0 && game.penguinsAlive < MAX_PENGUINS) {
        spawnPenguin(game.body);
        game.toNextSpawn = SPAWN_RATE;
    }

    for (let p of game.penguins) {
        p.tick(dt);
    }
    
    for (let a of game.animations) {
        a.tick(dt);
    }

    game.cpu = game.penguinsAlive;
    game.ram = game.files.size;
    game.indicators.update(game.cpu, game.ram);
}

function spawnBin(container) {
    const p = game.grid.addRandom();
    const bin = new Bin(p.x, p.y, container);
    return bin;
}

function spawnStarter(container) {
    const p = game.grid.addNext();
    const starter = new GameStarter(p.x, p.y, container);
    return starter;
}

function spawnPenguin(container) {
    const rect = container.getBoundingClientRect();
    const x = 10 + Math.random() * (rect.width - 20);
    const y = 10 + Math.random() * (rect.height - 20);

    for (const p of game.penguins) {
        if (p.state !== PenguinState.DEAD) continue;
        p.init(x, y);
        game.animations[p.animId].start();
        ++game.penguinsAlive;
        return;
    }

    const index = game.penguins.length;
    const p = new Penguin(x, y, container, index);
    const a = new Animation(p.el, ANIMATION_FRAMES, 'right', PENGUIN_SIZE);
    game.penguins.push(p);
    game.animations.push(a);
    ++game.penguinsAlive;
}

function init() {
    const body = document.querySelector('body');
    const desktop = document.getElementById('desktop');
    game.body = body;

    body.addEventListener('mousemove', e => {
        game.mousePos.x = e.clientX;
        game.mousePos.y = e.clientY;
    });

    desktop.addEventListener('click', e => unselect());

    game.files = new Set();
    game.grid = new Grid(desktop, TILE_SIZE, TILE_OFFSET);
    game.indicators = new IndicatorCtrl();

    shuffle(folderNames);
    shuffle(fileNames);

    game.bin = spawnBin(desktop);

    for (let i = 0; i < START_FOLDERS; ++i) {
        const p = game.grid.addNext();
        const f = new Folder(p.x, p.y, popName(folderNames, 'Folder', false), desktop);
        game.folders.push(f);
    }

    game.starter = spawnStarter(desktop);

    //for (let i = 0; i < START_PENGUINS; ++i) {
        //spawnPenguin(body);
    //}

    requestAnimationFrame(tick);
}

function closeSeal() {
    document.querySelector('.browser').style.display = 'none';
}
