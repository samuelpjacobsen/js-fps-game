/**
 * Class representing a weapon in the game
 */
class Weapon {
    /**
     * Create a weapon
     * @param {string} type - Type of weapon (from WEAPONS constants)
     * @param {Player} owner - Player who owns this weapon
     */
    constructor(type, owner) {
        const weaponData = WEAPONS[type];
        
        this.type = type;
        this.name = weaponData.name;
        this.damage = weaponData.damage;
        this.fireRate = weaponData.fireRate;
        this.magazineSize = weaponData.magazineSize;
        this.totalAmmo = weaponData.totalAmmo;
        this.defaultTotalAmmo = weaponData.totalAmmo;
        this.currentAmmo = weaponData.magazineSize;
        this.reloadTime = weaponData.reloadTime;
        this.spread = weaponData.spread;
        this.pellets = weaponData.pellets || 1;
        this.owner = owner;
        this.lastFireTime = 0;
        
        // Create weapon model
        this.createWeaponModel();
    }
    
    /**
     * Create the 3D model for this weapon
     */
    createWeaponModel() {
        this.model = new THREE.Group();
        
        // Different models for different weapons
        if (this.type === 'PISTOL') {
            // Simple pistol model
            const gunBody = new THREE.Mesh(
                new THREE.BoxGeometry(0.2, 0.15, 0.5),
                new THREE.MeshLambertMaterial({ color: 0x222222 })
            );
            gunBody.position.z = 0.25;
            
            const gunHandle = new THREE.Mesh(
                new THREE.BoxGeometry(0.1, 0.3, 0.2),
                new THREE.MeshLambertMaterial({ color: 0x111111 })
            );
            gunHandle.position.set(0, -0.2, 0.1);
            
            this.model.add(gunBody);
            this.model.add(gunHandle);
        } else if (this.type === 'RIFLE') {
            // Simple rifle model
            const gunBody = new THREE.Mesh(
                new THREE.BoxGeometry(0.2, 0.15, 0.8),
                new THREE.MeshLambertMaterial({ color: 0x222222 })
            );
            gunBody.position.z = 0.4;
            
            const gunHandle = new THREE.Mesh(
                new THREE.BoxGeometry(0.1, 0.3, 0.2),
                new THREE.MeshLambertMaterial({ color: 0x111111 })
            );
            gunHandle.position.set(0, -0.2, 0.1);
            
            const gunMagazine = new THREE.Mesh(
                new THREE.BoxGeometry(0.15, 0.3, 0.1),
                new THREE.MeshLambertMaterial({ color: 0x333333 })
            );
            gunMagazine.position.set(0, -0.2, 0.3);
            
            this.model.add(gunBody);
            this.model.add(gunHandle);
            this.model.add(gunMagazine);
        } else if (this.type === 'SHOTGUN') {
            // Simple shotgun model
            const gunBody = new THREE.Mesh(
                new THREE.BoxGeometry(0.2, 0.2, 0.9),
                new THREE.MeshLambertMaterial({ color: 0x222222 })
            );
            gunBody.position.z = 0.45;
            
            const gunHandle = new THREE.Mesh(
                new THREE.BoxGeometry(0.1, 0.3, 0.2),
                new THREE.MeshLambertMaterial({ color: 0x111111 })
            );
            gunHandle.position.set(0, -0.2, 0.2);
            
            this.model.add(gunBody);
            this.model.add(gunHandle);
        }
        
        // Position the weapon in front of the player
        this.model.position.set(0.3, -0.2, -0.5);
        this.model.rotation.y = Math.PI / 2;
    }
    
    /**
     * Fire the weapon
     * @returns {boolean} Whether the shot was fired
     */
    shoot() {
        const now = performance.now() / 1000; // Convert to seconds
        const timeSinceLastFire = now - this.lastFireTime;
        
        // Check if we can fire (cooldown and ammo)
        if (timeSinceLastFire < this.fireRate || this.currentAmmo <= 0) {
            return false;
        }
        
        this.lastFireTime = now;
        this.currentAmmo--;
        
        // Create bullet(s)
        for (let i = 0; i < this.pellets; i++) {
            this.createBullet();
        }
        
        return true;
    }
    
    /**
     * Create a bullet and add it to the scene
     */
    createBullet() {
        if (!this.owner || !game) {
            return;
        }
        
        // Get the camera direction for local player or model direction for other players
        let direction, origin;
        
        if (this.owner.isLocal && game.camera) {
            // Use camera direction
            direction = new THREE.Vector3(0, 0, -1);
            direction.applyQuaternion(game.camera.quaternion);
            
            // Position bullet at camera position
            origin = game.camera.position.clone();
        } else {
            // Use player model direction
            direction = new THREE.Vector3(0, 0, -1);
            direction.applyQuaternion(this.owner.model.quaternion);
            
            // Position bullet at player position
            origin = this.owner.model.position.clone();
            origin.y += PLAYER.HEIGHT * 0.8; // Head height
        }
        
        // Add random spread
        const spreadX = (Math.random() - 0.5) * this.spread;
        const spreadY = (Math.random() - 0.5) * this.spread;
        direction.x += spreadX;
        direction.y += spreadY;
        direction.normalize();
        
        // Create raycaster for bullet trajectory
        const raycaster = new THREE.Raycaster(origin, direction, 0, 100);
        
        // Check for collisions with players
        const players = Object.values(game.players)
            .filter(player => player !== this.owner && !player.isDead)
            .map(player => ({
                player: player,
                mesh: player.body
            }));
        
        const playerMeshes = players.map(p => p.mesh);
        const intersects = raycaster.intersectObjects(playerMeshes, true);
        
        if (intersects.length > 0) {
            // Hit a player
            const hitIndex = playerMeshes.indexOf(intersects[0].object);
            const hitPlayer = players[hitIndex].player;
            
            // Calculate damage (reduced by distance)
            const distance = intersects[0].distance;
            const damageMultiplier = 1 - (distance / 100) * 0.5; // Max 50% reduction at max distance
            const finalDamage = Math.max(1, Math.floor(this.damage * damageMultiplier));
            
            // Apply damage
            const killed = hitPlayer.takeDamage(finalDamage, this.owner);
            
            // Create hit effect
            this.createHitEffect(intersects[0].point);
            
            // If this is the server or host, send hit info to clients
            if (game.isHost) {
                game.network.sendHitInfo(hitPlayer.id, finalDamage, killed, this.owner.id);
            }
        } else {
            // Check for collision with walls or ground
            const mapObjects = game.map ? game.map.colliders : [];
            const mapIntersects = raycaster.intersectObjects(mapObjects, true);
            
            if (mapIntersects.length > 0) {
                // Hit the map
                this.createHitEffect(mapIntersects[0].point);
            }
        }
        
        // Visual bullet trail effect
        this.createBulletTrail(origin, direction);
    }
    
    /**
     * Create a visual effect at hit location
     * @param {THREE.Vector3} position - Position of the hit
     */
    createHitEffect(position) {
        if (!game || !game.scene) {
            return;
        }
        
        // Simple particle effect for hit
        const particleGeometry = new THREE.SphereGeometry(0.05, 8, 8);
        const particleMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        const particleCount = 5;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            particle.position.copy(position);
            
            // Random velocity
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.1,
                (Math.random() - 0.5) * 0.1 + 0.05, // Slight upward bias
                (Math.random() - 0.5) * 0.1
            );
            
            game.scene.add(particle);
            
            // Animate and remove after a short time
            const startTime = performance.now();
            const duration = 300 + Math.random() * 200;
            
            function animateParticle() {
                const elapsedTime = performance.now() - startTime;
                
                if (elapsedTime < duration) {
                    particle.position.x += velocity.x;
                    particle.position.y += velocity.y;
                    particle.position.z += velocity.z;
                    
                    velocity.y -= 0.001; // Gravity
                    
                    requestAnimationFrame(animateParticle);
                } else {
                    game.scene.remove(particle);
                    particle.geometry.dispose();
                    particle.material.dispose();
                }
            }
            
            animateParticle();
        }
    }
    
    /**
     * Create a visual bullet trail
     * @param {THREE.Vector3} origin - Start position of the trail
     * @param {THREE.Vector3} direction - Direction of the trail
     */
    createBulletTrail(origin, direction) {
        if (!game || !game.scene) {
            return;
        }
        
        // Calculate end point of trail
        const end = origin.clone().add(direction.clone().multiplyScalar(100));
        
        // Create line for trail
        const geometry = new THREE.BufferGeometry().setFromPoints([origin, end]);
        const material = new THREE.LineBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.8 });
        const line = new THREE.Line(geometry, material);
        
        game.scene.add(line);
        
        // Fade out and remove after a short time
        const startTime = performance.now();
        const duration = 100;
        
        function animateLine() {
            const elapsedTime = performance.now() - startTime;
            
            if (elapsedTime < duration) {
                material.opacity = 0.8 * (1 - elapsedTime / duration);
                requestAnimationFrame(animateLine);
            } else {
                game.scene.remove(line);
                geometry.dispose();
                material.dispose();
            }
        }
        
        animateLine();
    }
    
    /**
     * Reload the weapon
     */
    reload() {
        if (this.currentAmmo === this.magazineSize || this.totalAmmo === 0) {
            return;
        }
        
        const neededAmmo = this.magazineSize - this.currentAmmo;
        const ammoToAdd = Math.min(neededAmmo, this.totalAmmo);
        
        this.currentAmmo += ammoToAdd;
        this.totalAmmo -= ammoToAdd;
    }
}
