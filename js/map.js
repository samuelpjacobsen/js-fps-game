/**
 * Class representing the game map
 */
class GameMap {
    /**
     * Create a game map
     * @param {THREE.Scene} scene - The scene to add this map to
     */
    constructor(scene) {
        this.scene = scene;
        this.objects = [];
        this.colliders = [];
        this.spawnPoints = [];
        
        this.createMap();
    }
    
    /**
     * Create the map geometry and add it to the scene
     */
    createMap() {
        if (!this.scene) {
            return;
        }
        
        // Create ground with dynamic texture
        const groundCanvas = window.TextureGenerator.generateGroundTexture();
        const groundTexture = new THREE.CanvasTexture(groundCanvas);
        groundTexture.wrapS = THREE.RepeatWrapping;
        groundTexture.wrapT = THREE.RepeatWrapping;
        groundTexture.repeat.set(10, 10);
        
        const groundGeometry = new THREE.PlaneGeometry(MAP.SIZE, MAP.SIZE, 1, 1);
        const groundMaterial = new THREE.MeshLambertMaterial({ map: groundTexture });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        this.objects.push(ground);
        
        // Add ground to colliders
        this.colliders.push(ground);
        
        // Create outer walls
        this.createOuterWalls();
        
        // Create interior structures
        this.createInteriorStructures();
        
        // Create spawn points
        this.createSpawnPoints();
        
        // Add lighting
        this.addLighting();
    }
    
    /**
     * Create the outer walls of the map
     */
    createOuterWalls() {
        const wallHeight = MAP.WALL_HEIGHT;
        const mapSize = MAP.SIZE;
        const halfSize = mapSize / 2;
        
        // Materials
        const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x777777 });
        
        // North wall
        const northWall = new THREE.Mesh(
            new THREE.BoxGeometry(mapSize, wallHeight, 1),
            wallMaterial
        );
        northWall.position.set(0, wallHeight / 2, -halfSize);
        this.scene.add(northWall);
        this.objects.push(northWall);
        this.colliders.push(northWall);
        
        // South wall
        const southWall = new THREE.Mesh(
            new THREE.BoxGeometry(mapSize, wallHeight, 1),
            wallMaterial
        );
        southWall.position.set(0, wallHeight / 2, halfSize);
        this.scene.add(southWall);
        this.objects.push(southWall);
        this.colliders.push(southWall);
        
        // East wall
        const eastWall = new THREE.Mesh(
            new THREE.BoxGeometry(1, wallHeight, mapSize),
            wallMaterial
        );
        eastWall.position.set(halfSize, wallHeight / 2, 0);
        this.scene.add(eastWall);
        this.objects.push(eastWall);
        this.colliders.push(eastWall);
        
        // West wall
        const westWall = new THREE.Mesh(
            new THREE.BoxGeometry(1, wallHeight, mapSize),
            wallMaterial
        );
        westWall.position.set(-halfSize, wallHeight / 2, 0);
        this.scene.add(westWall);
        this.objects.push(westWall);
        this.colliders.push(westWall);
    }
    
    /**
     * Create interior structures like crates, walls, etc.
     */
    createInteriorStructures() {
        const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x777777 });
        const crateMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        
        // Create some center structures
        // Central cross-shaped structure
        const centerX = new THREE.Mesh(
            new THREE.BoxGeometry(20, MAP.WALL_HEIGHT, 4),
            wallMaterial
        );
        centerX.position.set(0, MAP.WALL_HEIGHT / 2, 0);
        this.scene.add(centerX);
        this.objects.push(centerX);
        this.colliders.push(centerX);
        
        const centerZ = new THREE.Mesh(
            new THREE.BoxGeometry(4, MAP.WALL_HEIGHT, 20),
            wallMaterial
        );
        centerZ.position.set(0, MAP.WALL_HEIGHT / 2, 0);
        this.scene.add(centerZ);
        this.objects.push(centerZ);
        this.colliders.push(centerZ);
        
        // Add crates in various locations
        const cratePositions = [
            { x: 10, z: 10 },
            { x: -10, z: 10 },
            { x: 10, z: -10 },
            { x: -10, z: -10 },
            { x: 15, z: 0 },
            { x: -15, z: 0 },
            { x: 0, z: 15 },
            { x: 0, z: -15 }
        ];
        
        cratePositions.forEach(pos => {
            const crate = new THREE.Mesh(
                new THREE.BoxGeometry(2, 2, 2),
                crateMaterial
            );
            crate.position.set(pos.x, 1, pos.z);
            this.scene.add(crate);
            this.objects.push(crate);
            this.colliders.push(crate);
        });
        
        // Add some L-shaped walls
        const lWallPositions = [
            { x: 20, z: 20, rotY: 0 },
            { x: -20, z: 20, rotY: Math.PI/2 },
            { x: -20, z: -20, rotY: Math.PI },
            { x: 20, z: -20, rotY: -Math.PI/2 }
        ];
        
        lWallPositions.forEach(pos => {
            const lWallHoriz = new THREE.Mesh(
                new THREE.BoxGeometry(10, MAP.WALL_HEIGHT, 2),
                wallMaterial
            );
            lWallHoriz.position.set(pos.x - 5, MAP.WALL_HEIGHT / 2, pos.z);
            lWallHoriz.rotation.y = pos.rotY;
            this.scene.add(lWallHoriz);
            this.objects.push(lWallHoriz);
            this.colliders.push(lWallHoriz);
            
            const lWallVert = new THREE.Mesh(
                new THREE.BoxGeometry(2, MAP.WALL_HEIGHT, 10),
                wallMaterial
            );
            lWallVert.position.set(pos.x, MAP.WALL_HEIGHT / 2, pos.z - 5);
            lWallVert.rotation.y = pos.rotY;
            this.scene.add(lWallVert);
            this.objects.push(lWallVert);
            this.colliders.push(lWallVert);
        });
    }
    
    /**
     * Create spawn points around the map
     */
    createSpawnPoints() {
        // Team 1 spawn points (one side of the map)
        for (let i = 0; i < 5; i++) {
            const x = -MAP.SIZE / 2 + 5 + Math.random() * 10;
            const z = -MAP.SIZE / 2 + 5 + Math.random() * 10;
            this.spawnPoints.push(new THREE.Vector3(x, PLAYER.HEIGHT / 2, z));
        }
        
        // Team 2 spawn points (other side of the map)
        for (let i = 0; i < 5; i++) {
            const x = MAP.SIZE / 2 - 5 - Math.random() * 10;
            const z = MAP.SIZE / 2 - 5 - Math.random() * 10;
            this.spawnPoints.push(new THREE.Vector3(x, PLAYER.HEIGHT / 2, z));
        }
    }
    
    /**
     * Add lighting to the map
     */
    addLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 1.0);
        this.scene.add(ambientLight);
        
        // Directional light (sunlight)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(100, 100, 100);
        directionalLight.castShadow = true;
        
        // Configure shadow properties
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
        
        this.scene.add(directionalLight);
        
        // Add some point lights around the map for interest
        const pointLights = [
            { position: new THREE.Vector3(0, 5, 0), color: 0xffffff, intensity: 0.8 },
            { position: new THREE.Vector3(20, 5, 20), color: 0xffffaa, intensity: 0.6 },
            { position: new THREE.Vector3(-20, 5, -20), color: 0xaaffff, intensity: 0.6 },
            { position: new THREE.Vector3(-20, 5, 20), color: 0xffaaaa, intensity: 0.6 },
            { position: new THREE.Vector3(20, 5, -20), color: 0xaaffaa, intensity: 0.6 }
        ];
        
        pointLights.forEach(light => {
            const pointLight = new THREE.PointLight(light.color, light.intensity, 30);
            pointLight.position.copy(light.position);
            this.scene.add(pointLight);
        });
    }
    
    /**
     * Get a random spawn point
     * @returns {THREE.Vector3} A random spawn point position
     */
    getRandomSpawnPoint() {
        if (this.spawnPoints.length === 0) {
            // Default spawn if no points defined
            return new THREE.Vector3(0, PLAYER.HEIGHT / 2, 0);
        }
        
        const index = Math.floor(Math.random() * this.spawnPoints.length);
        return this.spawnPoints[index].clone();
    }
    
    /**
     * Clean up the map resources
     */
    dispose() {
        // Remove all objects from the scene and dispose geometries/materials
        this.objects.forEach(object => {
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => material.dispose());
                } else {
                    object.material.dispose();
                }
            }
            this.scene.remove(object);
        });
        
        // Clear arrays
        this.objects = [];
        this.colliders = [];
        this.spawnPoints = [];
    }
}
