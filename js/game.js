/**
 * Main game class
 */
class Game {
    /**
     * Create the game
     */
    constructor() {
        this.state = GAME_STATES.LOADING;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.localPlayer = null;
        this.players = {};
        this.map = null;
        this.network = null;
        this.lastTime = 0;
        this.isHost = false;
        
        // Initialize game systems
        this.init();
    }
    
    /**
     * Initialize the game
     */
    init() {
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.getElementById('game-container').appendChild(this.renderer.domElement);
        
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87ceeb); // Sky blue
        this.scene.fog = new THREE.Fog(0x87ceeb, 50, 100);
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.y = PLAYER.HEIGHT;
        
        // Create controls
        this.controls = new THREE.PointerLockControls(this.camera, document.body);
        
        // Create network manager
        this.network = new Network(this);
        
        // Load game resources
        this.loadResources();
        
        // Add event listeners
        this.setupEventListeners();
        
        // Set initial game state
        this.setState(GAME_STATES.LOADING);
    }
    
    /**
     * Load game resources
     */
    loadResources() {
        const textureLoader = new THREE.TextureLoader();
        const modelLoader = new THREE.GLTFLoader();
        
        // Simple progress tracking
        let totalResources = 2; // Add more as needed
        let loadedResources = 0;
        
        const updateProgress = () => {
            loadedResources++;
            const progress = (loadedResources / totalResources) * 100;
            document.getElementById('progress-bar').style.width = `${progress}%`;
            document.getElementById('loading-text').textContent = `Carregando... ${Math.floor(progress)}%`;
            
            // If all resources are loaded, go to menu
            if (loadedResources >= totalResources) {
                setTimeout(() => {
                    this.setState(GAME_STATES.MENU);
                }, 500);
            }
        };
        
        // Load textures
        textureLoader.load('textures/ground.jpg', texture => {
            // Store texture or use it right away
            updateProgress();
        }, undefined, error => {
            console.error('Error loading texture:', error);
            updateProgress();
        });
        
        // Load models
        modelLoader.load('models/weapon.glb', gltf => {
            // Store model or use it right away
            updateProgress();
        }, undefined, error => {
            console.error('Error loading model:', error);
            updateProgress();
        });
        
        // Simulate loading for demo
        if (totalResources === 0) {
            setTimeout(() => {
                this.setState(GAME_STATES.MENU);
            }, 1000);
        }
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Resize handler
        window.addEventListener('resize', this.onWindowResize.bind(this));
        
        // Pointer lock change handler
        document.addEventListener('pointerlockchange', this.onPointerLockChange.bind(this));
        
        // Menu button handlers
        document.getElementById('create-game-btn').addEventListener('click', this.createGame.bind(this));
        document.getElementById('join-game-btn').addEventListener('click', () => {
            const joinForm = document.getElementById('join-form');
            joinForm.style.display = joinForm.style.display === 'none' ? 'block' : 'none';
        });
        document.getElementById('connect-btn').addEventListener('click', this.joinGame.bind(this));
        
        // Game over screen buttons
        document.getElementById('play-again-btn').addEventListener('click', this.restartGame.bind(this));
        document.getElementById('exit-btn').addEventListener('click', this.returnToMenu.bind(this));
        
        // Controls for pointer lock
        this.renderer.domElement.addEventListener('click', () => {
            if (this.state === GAME_STATES.PLAYING && !this.controls.isLocked) {
                this.controls.lock();
            }
        });
        
        // Keyboard controls
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', this.onKeyUp.bind(this));
        
        // Mouse controls
        document.addEventListener('mousedown', this.onMouseDown.bind(this));
        document.addEventListener('mouseup', this.onMouseUp.bind(this));
    }
    
    /**
     * Handle window resize
     */
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    /**
     * Handle pointer lock change
     */
    onPointerLockChange() {
        if (document.pointerLockElement === document.body) {
            // Pointer is locked
            console.log('Pointer locked');
        } else {
            // Pointer is unlocked
            console.log('Pointer unlocked');
        }
    }
    
    /**
     * Handle key down events
     */
    onKeyDown(event) {
        if (this.state !== GAME_STATES.PLAYING || !this.localPlayer) {
            return;
        }
        
        // Movement keys
        switch (event.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.moveForward = true;
                break;
                
            case 'KeyS':
            case 'ArrowDown':
                this.moveBackward = true;
                break;
                
            case 'KeyA':
            case 'ArrowLeft':
                this.moveLeft = true;
                break;
                
            case 'KeyD':
            case 'ArrowRight':
                this.moveRight = true;
                break;
                
            case 'Space':
                this.localPlayer.jump();
                break;
                
            case 'KeyR':
                this.localPlayer.reload();
                break;
                
            case 'Digit1':
                this.localPlayer.switchWeapon(0); // Pistol
                break;
                
            case 'Digit2':
                this.localPlayer.switchWeapon(1); // Rifle
                break;
                
            case 'Digit3':
                this.localPlayer.switchWeapon(2); // Shotgun
                break;
                
            case 'KeyT':
                // Chat input (simplified for this demo)
                const message = prompt('Digite sua mensagem:');
                if (message) {
                    this.network.sendChatMessage(message);
                }
                break;
                
            case 'Escape':
                if (this.controls.isLocked) {
                    this.controls.unlock();
                }
                break;
        }
    }
    
    /**
     * Handle key up events
     */
    onKeyUp(event) {
        if (this.state !== GAME_STATES.PLAYING) {
            return;
        }
        
        // Movement keys
        switch (event.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.moveForward = false;
                break;
                
            case 'KeyS':
            case 'ArrowDown':
                this.moveBackward = false;
                break;
                
            case 'KeyA':
            case 'ArrowLeft':
                this.moveLeft = false;
                break;
                
            case 'KeyD':
            case 'ArrowRight':
                this.moveRight = false;
                break;
        }
    }
    
    /**
     * Handle mouse down events
     */
    onMouseDown(event) {
        if (this.state !== GAME_STATES.PLAYING || !this.localPlayer || !this.controls.isLocked) {
            return;
        }
        
        // Left click (shoot)
        if (event.button === 0) {
            this.shooting = true;
            this.tryShoot();
        }
    }
    
    /**
     * Handle mouse up events
     */
    onMouseUp(event) {
        if (event.button === 0) {
            this.shooting = false;
        }
    }
    
    /**
     * Try to shoot the weapon
     */
    tryShoot() {
        if (!this.shooting || !this.localPlayer) {
            return;
        }
        
        const didShoot = this.localPlayer.shoot();
        
        // Schedule next shot attempt based on weapon fire rate
        if (this.localPlayer.currentWeapon) {
            setTimeout(() => {
                this.tryShoot();
            }, this.localPlayer.currentWeapon.fireRate * 1000);
        }
    }
    
    /**
     * Create a new game as host
     */
    createGame() {
        // Get player name
        const playerName = document.getElementById('player-name').value.trim() || `Player${Math.floor(Math.random() * 1000)}`;
        
        // Create a new game on the network
        const gameId = this.network.createGame();
        this.isHost = true;
        
        // Create the map
        this.map = new GameMap(this.scene);
        
        // Create local player
        this.localPlayer = new Player(this.network.peer.id, playerName, true, this.scene);
        this.players[this.localPlayer.id] = this.localPlayer;
        
        // Add weapons to player
        Object.keys(WEAPONS).forEach(weaponType => {
            this.localPlayer.addWeapon(new Weapon(weaponType, this.localPlayer));
        });
        
        // Position the camera at player eye height
        this.camera.position.y = PLAYER.HEIGHT;
        
        // Start the game
        this.startGame();
    }
    
    /**
     * Join an existing game
     */
    joinGame() {
        // Get player name and game ID
        const playerName = document.getElementById('player-name').value.trim() || `Player${Math.floor(Math.random() * 1000)}`;
        const gameId = document.getElementById('game-id-input').value.trim();
        
        // Join the game on the network
        const success = this.network.joinGame(gameId);
        
        if (success) {
            // Create local player
            this.localPlayer = new Player(this.network.peer.id, playerName, true, this.scene);
            this.players[this.localPlayer.id] = this.localPlayer;
            
            // Add weapons to player
            Object.keys(WEAPONS).forEach(weaponType => {
                this.localPlayer.addWeapon(new Weapon(weaponType, this.localPlayer));
            });
            
            // Create the map
            this.map = new GameMap(this.scene);
            
            // Position the camera at player eye height
            this.camera.position.y = PLAYER.HEIGHT;
            
            // Start the game
            this.startGame();
        }
    }
    
    /**
     * Start the game
     */
    startGame() {
        // Set game state to playing
        this.setState(GAME_STATES.PLAYING);
        
        // Position player at spawn point
        const spawnPoint = this.map.getRandomSpawnPoint();
        this.localPlayer.model.position.copy(spawnPoint);
        this.camera.position.copy(spawnPoint);
        this.camera.position.y = PLAYER.HEIGHT;
        
        // Lock pointer for controls
        this.controls.lock();
        
        // Start the game loop
        this.lastTime = performance.now();
        this.gameLoop();
    }
    
    /**
     * Restart the game
     */
    restartGame() {
        // Hide game over screen
        document.getElementById('game-over-screen').style.display = 'none';
        
        // Reset player states
        Object.values(this.players).forEach(player => {
            player.respawn();
        });
        
        // Start the game
        this.startGame();
    }
    
    /**
     * Return to the main menu
     */
    returnToMenu() {
        // Clean up resources
        this.cleanup();
        
        // Return to menu state
        this.setState(GAME_STATES.MENU);
    }
    
    /**
     * Clean up game resources
     */
    cleanup() {
        // Dispose network
        if (this.network) {
            this.network.dispose();
        }
        
        // Dispose map
        if (this.map) {
            this.map.dispose();
            this.map = null;
        }
        
        // Remove all players
        Object.values(this.players).forEach(player => {
            if (player.model && this.scene) {
                this.scene.remove(player.model);
            }
        });
        this.players = {};
        this.localPlayer = null;
        
        // Reset UI
        document.getElementById('kill-feed').innerHTML = '';
        document.getElementById('players-list').innerHTML = '';
        
        // Reset controls
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.shooting = false;
        
        // Unlock pointer
        if (this.controls) {
            this.controls.unlock();
        }
    }
    
    /**
     * Set the game state
     * @param {string} newState - New game state
     */
    setState(newState) {
        this.state = newState;
        
        // Update UI based on state
        const loadingScreen = document.getElementById('loading-screen');
        const menuScreen = document.getElementById('menu-screen');
        const gameUI = document.getElementById('game-ui');
        const gameOverScreen = document.getElementById('game-over-screen');
        
        // Hide all screens
        loadingScreen.style.display = 'none';
        menuScreen.style.display = 'none';
        gameUI.style.display = 'none';
        gameOverScreen.style.display = 'none';
        
        // Show appropriate screen for current state
        switch (this.state) {
            case GAME_STATES.LOADING:
                loadingScreen.style.display = 'flex';
                break;
                
            case GAME_STATES.MENU:
                menuScreen.style.display = 'flex';
                break;
                
            case GAME_STATES.PLAYING:
                gameUI.style.display = 'block';
                this.renderer.domElement.style.display = 'block';
                break;
                
            case GAME_STATES.GAME_OVER:
                gameOverScreen.style.display = 'flex';
                break;
        }
    }
    
    /**
     * End the game
     */
    endGame() {
        // Set game state to game over
        this.setState(GAME_STATES.GAME_OVER);
        
        // Display results
        const resultsElement = document.getElementById('results');
        
        // Sort players by kills
        const sortedPlayers = Object.values(this.players).sort((a, b) => b.kills - a.kills);
        
        // Create results HTML
        let resultsHTML = '<h3>Resultados</h3><table>';
        resultsHTML += '<tr><th>Jogador</th><th>Eliminações</th><th>Mortes</th></tr>';
        
        sortedPlayers.forEach(player => {
            resultsHTML += `<tr>
                <td>${player.name}${player.id === this.localPlayer.id ? ' (você)' : ''}</td>
                <td>${player.kills}</td>
                <td>${player.deaths}</td>
            </tr>`;
        });
        
        resultsHTML += '</table>';
        resultsElement.innerHTML = resultsHTML;
    }
    
    /**
     * Update the list of players in the UI
     */
    updatePlayersList() {
        const playersList = document.getElementById('players-list');
        
        // Create list HTML
        let listHTML = '<h3>Jogadores</h3>';
        
        Object.values(this.players).forEach(player => {
            listHTML += `<div>${player.name}${player.id === this.localPlayer.id ? ' (você)' : ''}: ${player.kills} eliminações</div>`;
        });
        
        playersList.innerHTML = listHTML;
    }
    
    /**
     * Main game loop
     */
    gameLoop() {
        if (this.state !== GAME_STATES.PLAYING) {
            return;
        }
        
        const now = performance.now();
        const deltaTime = (now - this.lastTime) / 1000; // Convert to seconds
        this.lastTime = now;
        
        // Update local player position based on input
        if (this.localPlayer && !this.localPlayer.isDead) {
            // Calculate movement direction
            let moveDirection = new THREE.Vector3(0, 0, 0);
            
            if (this.moveForward) moveDirection.z -= 1;
            if (this.moveBackward) moveDirection.z += 1;
            if (this.moveLeft) moveDirection.x -= 1;
            if (this.moveRight) moveDirection.x += 1;
            
            if (moveDirection.length() > 0) {
                moveDirection.normalize();
                
                // Align direction with camera
                moveDirection.applyQuaternion(this.camera.quaternion);
                moveDirection.y = 0; // Keep movement on XZ plane
                moveDirection.normalize();
                
                // Apply movement
                this.localPlayer.move(moveDirection);
            }
            
            // Update player position from camera
            this.localPlayer.model.position.x = this.camera.position.x;
            this.localPlayer.model.position.z = this.camera.position.z;
            
            // Sync player rotation with camera
            this.localPlayer.model.rotation.y = this.camera.rotation.y;
        }
        
        // Update all players
        Object.values(this.players).forEach(player => {
            player.update(deltaTime);
        });
        
        // If camera has fallen below the ground, reset it
        if (this.camera.position.y < PLAYER.HEIGHT) {
            this.camera.position.y = PLAYER.HEIGHT;
        }
        
        // Send player updates over network
        if (this.network && this.localPlayer) {
            // Throttle updates based on NETWORK.UPDATE_RATE
            const updateInterval = NETWORK.UPDATE_RATE / 1000; // Convert to seconds
            
            this.updateTimer = (this.updateTimer || 0) + deltaTime;
            if (this.updateTimer >= updateInterval) {
                this.network.sendPlayerUpdate();
                this.updateTimer = 0;
            }
        }
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
        
        // Continue game loop
        requestAnimationFrame(this.gameLoop.bind(this));
    }
}

// Create global game instance
let game;

// Initialize when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    game = new Game();
});
