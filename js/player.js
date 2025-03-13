/**
 * Class representing a player in the game
 */
class Player {
    /**
     * Create a player
     * @param {string} id - Unique identifier for the player
     * @param {string} name - Display name of the player
     * @param {boolean} isLocal - Whether this is the local player
     * @param {THREE.Scene} scene - The scene to add this player to
     */
    constructor(id, name, isLocal, scene) {
        this.id = id;
        this.name = name;
        this.isLocal = isLocal;
        this.scene = scene;
        this.health = PLAYER.HEALTH;
        this.isDead = false;
        this.kills = 0;
        this.deaths = 0;
        
        // Movement properties
        this.moveSpeed = PLAYER.MOVE_SPEED;
        this.jumpForce = PLAYER.JUMP_FORCE;
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.onGround = true;
        this.canJump = true;
        
        // Weapon properties
        this.currentWeapon = null;
        this.weapons = [];
        this.isReloading = false;
        
        // Network properties
        this.lastPosition = new THREE.Vector3();
        this.lastRotation = new THREE.Euler();
        
        // Create player mesh
        this.createPlayerModel();
        
        // Add player to scene
        if (scene) {
            scene.add(this.model);
        }
    }
    
    /**
     * Create the 3D model for this player
     */
    createPlayerModel() {
        // Create a group to hold all player objects
        this.model = new THREE.Group();
        this.model.position.y = PLAYER.HEIGHT / 2;
        
        // Create player body (using cylinder instead of capsule for compatibility)
        const bodyGeometry = new THREE.CylinderGeometry(PLAYER.RADIUS, PLAYER.RADIUS, PLAYER.HEIGHT, 8);
        const bodyMaterial = new THREE.MeshLambertMaterial({
            color: this.isLocal ? 0x0000ff : 0xff0000
        });
        this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.model.add(this.body);
        
        // Create player name tag
        if (!this.isLocal) {
            // Create a canvas for the name tag
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = 256;
            canvas.height = 64;
            context.font = '24px Arial';
            context.fillStyle = 'white';
            context.textAlign = 'center';
            context.fillText(this.name, 128, 24);
            
            // Create texture and sprite
            const texture = new THREE.CanvasTexture(canvas);
            const material = new THREE.SpriteMaterial({ map: texture });
            this.nameTag = new THREE.Sprite(material);
            this.nameTag.scale.set(2, 0.5, 1);
            this.nameTag.position.y = PLAYER.HEIGHT + 0.5;
            this.model.add(this.nameTag);
        }
        
        // Create weapon model
        this.weaponModel = new THREE.Group();
        this.model.add(this.weaponModel);
        
        // Set up collision properties
        this.radius = PLAYER.RADIUS;
        this.height = PLAYER.HEIGHT;
    }
    
    /**
     * Add a weapon to this player
     * @param {Weapon} weapon - The weapon to add
     */
    addWeapon(weapon) {
        this.weapons.push(weapon);
        
        if (!this.currentWeapon) {
            this.switchWeapon(0);
        }
    }
    
    /**
     * Switch to a specific weapon
     * @param {number} index - Index of the weapon to switch to
     */
    switchWeapon(index) {
        if (index >= 0 && index < this.weapons.length) {
            // Remove current weapon from the model
            if (this.currentWeapon && this.currentWeapon.model) {
                this.weaponModel.remove(this.currentWeapon.model);
            }
            
            // Set the new current weapon
            this.currentWeapon = this.weapons[index];
            
            // Add the new weapon model
            if (this.currentWeapon.model) {
                this.weaponModel.add(this.currentWeapon.model);
            }
            
            // Update ammo display if local player
            if (this.isLocal) {
                this.updateAmmoDisplay();
            }
        }
    }
    
    /**
     * Update the ammo display on the UI
     */
    updateAmmoDisplay() {
        if (this.isLocal && this.currentWeapon) {
            const ammoCounter = document.getElementById('ammo-counter');
            ammoCounter.textContent = `${this.currentWeapon.currentAmmo}/${this.currentWeapon.totalAmmo}`;
        }
    }
    
    /**
     * Shoot the current weapon
     * @returns {boolean} Whether the shot was fired
     */
    shoot() {
        if (this.isReloading || this.isDead || !this.currentWeapon) {
            return false;
        }
        
        const didShoot = this.currentWeapon.shoot();
        
        if (didShoot && this.isLocal) {
            this.updateAmmoDisplay();
            
            // If we're out of ammo, reload
            if (this.currentWeapon.currentAmmo === 0 && this.currentWeapon.totalAmmo > 0) {
                this.reload();
            }
        }
        
        return didShoot;
    }
    
    /**
     * Reload the current weapon
     */
    reload() {
        if (this.isReloading || this.isDead || !this.currentWeapon || 
            this.currentWeapon.currentAmmo === this.currentWeapon.magazineSize || 
            this.currentWeapon.totalAmmo === 0) {
            return;
        }
        
        this.isReloading = true;
        
        // Update UI to show reloading
        if (this.isLocal) {
            const ammoCounter = document.getElementById('ammo-counter');
            ammoCounter.textContent = "Recarregando...";
        }
        
        // Set timeout for reload completion
        setTimeout(() => {
            if (this.currentWeapon) {
                this.currentWeapon.reload();
                this.isReloading = false;
                
                if (this.isLocal) {
                    this.updateAmmoDisplay();
                }
            }
        }, this.currentWeapon.reloadTime * 1000);
    }
    
    /**
     * Apply damage to the player
     * @param {number} amount - Amount of damage to apply
     * @param {Player} attacker - Player who caused the damage
     * @returns {boolean} Whether the player died from this damage
     */
    takeDamage(amount, attacker) {
        if (this.isDead) {
            return false;
        }
        
        this.health -= amount;
        
        // Update health display if local player
        if (this.isLocal) {
            this.updateHealthDisplay();
        }
        
        // Check if player is dead
        if (this.health <= 0) {
            this.health = 0;
            this.die(attacker);
            return true;
        }
        
        return false;
    }
    
    /**
     * Update the health display on the UI
     */
    updateHealthDisplay() {
        if (this.isLocal) {
            const healthFill = document.getElementById('health-fill');
            const healthText = document.getElementById('health-text');
            
            healthFill.style.width = `${this.health}%`;
            healthText.textContent = Math.ceil(this.health);
        }
    }
    
    /**
     * Handle player death
     * @param {Player} killer - Player who killed this player
     */
    die(killer) {
        this.isDead = true;
        this.deaths++;
        
        if (killer && killer !== this) {
            killer.kills++;
            
            // Show kill message
            showNotification(`${killer.name} eliminou ${this.name}`);
        } else {
            // Suicide or environmental death
            showNotification(`${this.name} morreu`);
        }
        
        // Hide player model
        if (this.model) {
            this.model.visible = false;
        }
        
        // Respawn after delay if game is still going
        if (game && game.state === GAME_STATES.PLAYING) {
            setTimeout(() => this.respawn(), 5000);
        }
    }
    
    /**
     * Respawn the player
     */
    respawn() {
        if (!this.isDead) {
            return;
        }
        
        // Reset health
        this.health = PLAYER.HEALTH;
        this.isDead = false;
        
        // Reset ammo for all weapons
        this.weapons.forEach(weapon => {
            weapon.currentAmmo = weapon.magazineSize;
            weapon.totalAmmo = weapon.defaultTotalAmmo;
        });
        
        // Update UI if local player
        if (this.isLocal) {
            this.updateHealthDisplay();
            this.updateAmmoDisplay();
        }
        
        // Reposition player at spawn point
        const spawnPoint = game.map.getRandomSpawnPoint();
        this.model.position.copy(spawnPoint);
        
        // Show player model
        this.model.visible = true;
    }
    
    /**
     * Update player physics and movement
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        if (this.isDead) {
            return;
        }
        
        // Apply gravity
        if (!this.onGround) {
            this.velocity.y -= PHYSICS.GRAVITY * deltaTime;
        }
        
        // Apply velocity to position
        this.model.position.x += this.velocity.x * deltaTime;
        this.model.position.y += this.velocity.y * deltaTime;
        this.model.position.z += this.velocity.z * deltaTime;
        
        // Check collision with ground
        if (this.model.position.y < PLAYER.HEIGHT / 2) {
            this.model.position.y = PLAYER.HEIGHT / 2;
            this.velocity.y = 0;
            this.onGround = true;
            this.canJump = true;
        }
        
        // Check collision with map boundaries
        if (game && game.map) {
            const halfMapSize = MAP.SIZE / 2;
            
            if (this.model.position.x < -halfMapSize) {
                this.model.position.x = -halfMapSize;
                this.velocity.x = 0;
            } else if (this.model.position.x > halfMapSize) {
                this.model.position.x = halfMapSize;
                this.velocity.x = 0;
            }
            
            if (this.model.position.z < -halfMapSize) {
                this.model.position.z = -halfMapSize;
                this.velocity.z = 0;
            } else if (this.model.position.z > halfMapSize) {
                this.model.position.z = halfMapSize;
                this.velocity.z = 0;
            }
            
            // Collision with walls and objects would go here
            // This would involve more complex collision detection with the map
        }
        
        // Apply friction
        this.velocity.x *= PHYSICS.FRICTION;
        this.velocity.z *= PHYSICS.FRICTION;
        
        // Small velocity threshold to ensure player stops completely
        if (Math.abs(this.velocity.x) < 0.01) this.velocity.x = 0;
        if (Math.abs(this.velocity.z) < 0.01) this.velocity.z = 0;
    }
    
    /**
     * Move the player in a direction
     * @param {THREE.Vector3} direction - Direction to move in (normalized)
     */
    move(direction) {
        if (this.isDead) {
            return;
        }
        
        // Scale direction by move speed
        this.velocity.x = direction.x * this.moveSpeed;
        this.velocity.z = direction.z * this.moveSpeed;
    }
    
    /**
     * Make the player jump
     */
    jump() {
        if (this.isDead || !this.canJump || !this.onGround) {
            return;
        }
        
        this.velocity.y = this.jumpForce;
        this.onGround = false;
        this.canJump = false;
    }
    
    /**
     * Get serialized data for network transmission
     * @returns {Object} Serialized player data
     */
    serialize() {
        return {
            id: this.id,
            name: this.name,
            position: {
                x: this.model.position.x,
                y: this.model.position.y,
                z: this.model.position.z
            },
            rotation: {
                x: this.model.rotation.x,
                y: this.model.rotation.y,
                z: this.model.rotation.z
            },
            health: this.health,
            isDead: this.isDead,
            currentWeapon: this.currentWeapon ? this.weapons.indexOf(this.currentWeapon) : -1,
            isReloading: this.isReloading,
            kills: this.kills,
            deaths: this.deaths
        };
    }
    
    /**
     * Update player from serialized data
     * @param {Object} data - Serialized player data
     */
    deserialize(data) {
        // Update position and rotation if changed
        if (data.position) {
            this.model.position.set(data.position.x, data.position.y, data.position.z);
        }
        
        if (data.rotation) {
            this.model.rotation.set(data.rotation.x, data.rotation.y, data.rotation.z);
        }
        
        // Update health and state
        this.health = data.health;
        
        // Handle death state change
        if (data.isDead !== this.isDead) {
            if (data.isDead) {
                this.isDead = true;
                this.model.visible = false;
            } else {
                this.isDead = false;
                this.model.visible = true;
            }
        }
        
        // Update weapon
        if (data.currentWeapon !== -1 && this.weapons[data.currentWeapon] !== this.currentWeapon) {
            this.switchWeapon(data.currentWeapon);
        }
        
        this.isReloading = data.isReloading;
        
        // Update stats
        this.kills = data.kills;
        this.deaths = data.deaths;
    }
}
