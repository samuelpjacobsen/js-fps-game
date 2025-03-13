// Game Constants
const GAME_STATES = {
    LOADING: 'loading',
    MENU: 'menu',
    PLAYING: 'playing',
    GAME_OVER: 'gameOver'
};

// Player Constants
const PLAYER = {
    HEALTH: 100,
    MOVE_SPEED: 10,
    JUMP_FORCE: 10,
    HEIGHT: 1.8,
    RADIUS: 0.5
};

// Weapon Constants
const WEAPONS = {
    PISTOL: {
        name: 'Pistol',
        damage: 25,
        fireRate: 0.3,  // shots per second
        magazineSize: 12,
        totalAmmo: 36,
        reloadTime: 1.2,
        spread: 0.02
    },
    RIFLE: {
        name: 'Rifle',
        damage: 15,
        fireRate: 0.1,  // shots per second
        magazineSize: 30,
        totalAmmo: 90,
        reloadTime: 2.0,
        spread: 0.015
    },
    SHOTGUN: {
        name: 'Shotgun',
        damage: 8,
        fireRate: 0.7,  // shots per second
        magazineSize: 8,
        totalAmmo: 32,
        reloadTime: 2.5,
        spread: 0.1,
        pellets: 8
    }
};

// Physics Constants
const PHYSICS = {
    GRAVITY: 9.8,
    FRICTION: 0.9
};

// Network Constants
const NETWORK = {
    UPDATE_RATE: 16 // ms
};

// Map Constants
const MAP = {
    SIZE: 50,
    WALL_HEIGHT: 4
};
