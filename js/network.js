/**
 * Class for handling network communication
 */
class Network {
    /**
     * Create a network manager
     * @param {Game} game - Reference to the main game
     */
    constructor(game) {
        this.game = game;
        this.peer = null;
        this.connections = {};
        this.isHost = false;
        this.gameId = null;
        
        // Initialize PeerJS
        this.initializePeer();
    }
    
    /**
     * Initialize the PeerJS connection
     */
    initializePeer() {
        // Create a new random ID for this peer
        const peerId = generateGameId();
        
        // Initialize the peer with the random ID
        this.peer = new Peer(peerId, {
            debug: 2, // Log level
            // You might want to set up your own PeerJS server for a production game
            // For this example, we're using the free PeerJS server
        });
        
        // Setup event listeners
        this.setupPeerEvents();
    }
    
    /**
     * Set up event listeners for PeerJS events
     */
    setupPeerEvents() {
        // When peer is fully connected to the server
        this.peer.on('open', (id) => {
            console.log('Connected to PeerJS server with ID:', id);
        });
        
        // When an error occurs
        this.peer.on('error', (error) => {
            console.error('PeerJS error:', error);
            alert('Erro de conexão: ' + error.message);
        });
        
        // When a connection is received
        this.peer.on('connection', (conn) => {
            this.handleNewConnection(conn);
        });
    }
    
    /**
     * Handle a new connection
     * @param {DataConnection} conn - The new connection
     */
    handleNewConnection(conn) {
        conn.on('open', () => {
            console.log('New player connected:', conn.peer);
            
            // Add to connections list
            this.connections[conn.peer] = conn;
            
            // If we're the host, send the current game state
            if (this.isHost) {
                // First, let them know we're the host
                conn.send({
                    type: 'host-confirm',
                    gameId: this.gameId
                });
                
                // Send the current game state
                this.sendGameState(conn);
            }
            
            // Set up data handling
            conn.on('data', (data) => {
                this.handleData(data, conn.peer);
            });
            
            // Handle connection close
            conn.on('close', () => {
                console.log('Player disconnected:', conn.peer);
                
                // Remove from connections
                delete this.connections[conn.peer];
                
                // Remove player from game if exists
                if (this.game.players[conn.peer]) {
                    if (this.game.scene) {
                        this.game.scene.remove(this.game.players[conn.peer].model);
                    }
                    delete this.game.players[conn.peer];
                    
                    // Update the player list UI
                    this.game.updatePlayersList();
                }
                
                // If we're the host, inform other players about the disconnection
                if (this.isHost) {
                    this.broadcast({
                        type: 'player-disconnected',
                        playerId: conn.peer
                    });
                }
            });
        });
    }
    
    /**
     * Handle received data
     * @param {Object} data - The received data
     * @param {string} senderId - ID of the sender
     */
    handleData(data, senderId) {
        switch (data.type) {
            case 'host-confirm':
                // Received confirmation from host
                this.gameId = data.gameId;
                document.getElementById('game-id-display').textContent = `Game ID: ${this.gameId}`;
                break;
                
            case 'game-state':
                // Received full game state
                this.receiveGameState(data);
                break;
                
            case 'player-update':
                // Received player update
                this.updateRemotePlayer(data.player);
                break;
                
            case 'player-join':
                // A new player joined the game
                this.addRemotePlayer(data.player);
                break;
                
            case 'player-disconnected':
                // A player disconnected
                if (this.game.players[data.playerId]) {
                    if (this.game.scene) {
                        this.game.scene.remove(this.game.players[data.playerId].model);
                    }
                    delete this.game.players[data.playerId];
                    
                    // Update the player list UI
                    this.game.updatePlayersList();
                }
                break;
                
            case 'hit':
                // Player was hit
                this.handleHit(data);
                break;
                
            case 'chat-message':
                // Received chat message
                this.handleChatMessage(data);
                break;
        }
    }
    
    /**
     * Create a new game as host
     * @returns {string} The generated game ID
     */
    createGame() {
        this.isHost = true;
        this.gameId = generateGameId();
        document.getElementById('game-id-display').textContent = `Game ID: ${this.gameId}`;
        return this.gameId;
    }
    
    /**
     * Join an existing game
     * @param {string} gameId - ID of the game to join
     */
    joinGame(gameId) {
        if (!gameId) {
            alert('ID do jogo inválido!');
            return false;
        }
        
        // Set game ID
        this.gameId = gameId;
        
        // Connect to the host
        const conn = this.peer.connect(gameId);
        
        // Handle the connection
        conn.on('open', () => {
            console.log('Connected to host!');
            this.connections[gameId] = conn;
            
            // Send player data to host
            conn.send({
                type: 'player-join',
                player: this.game.localPlayer.serialize()
            });
            
            // Handle data from host
            conn.on('data', (data) => {
                this.handleData(data, gameId);
            });
            
            // Handle disconnection
            conn.on('close', () => {
                console.log('Disconnected from host');
                alert('Desconectado do host. Voltando para o menu.');
                this.game.returnToMenu();
            });
            
            return true;
        });
        
        conn.on('error', (error) => {
            console.error('Connection error:', error);
            alert('Erro ao conectar ao jogo: ' + error.message);
            return false;
        });
    }
    
    /**
     * Send the full game state to a specific connection
     * @param {DataConnection} conn - The connection to send to
     */
    sendGameState(conn) {
        // Serialize all players
        const players = {};
        Object.keys(this.game.players).forEach(id => {
            players[id] = this.game.players[id].serialize();
        });
        
        // Send game state
        conn.send({
            type: 'game-state',
            players: players
        });
    }
    
    /**
     * Receive and apply a full game state
     * @param {Object} data - The game state data
     */
    receiveGameState(data) {
        // Add all players
        Object.keys(data.players).forEach(id => {
            // Skip if this is us
            if (id === this.peer.id) {
                return;
            }
            
            // Add or update the player
            this.addRemotePlayer(data.players[id]);
        });
    }
    
    /**
     * Add a remote player to the game
     * @param {Object} playerData - Serialized player data
     */
    addRemotePlayer(playerData) {
        // Skip if player already exists
        if (this.game.players[playerData.id]) {
            this.updateRemotePlayer(playerData);
            return;
        }
        
        // Create a new player object
        const player = new Player(playerData.id, playerData.name, false, this.game.scene);
        
        // Add weapons to player
        Object.keys(WEAPONS).forEach(weaponType => {
            player.addWeapon(new Weapon(weaponType, player));
        });
        
        // Update with received data
        player.deserialize(playerData);
        
        // Add to game's players
        this.game.players[playerData.id] = player;
        
        // Update the player list UI
        this.game.updatePlayersList();
        
        // If we're the host, inform other players about the new player
        if (this.isHost) {
            this.broadcast({
                type: 'player-join',
                player: playerData
            }, [playerData.id]); // Exclude the new player from broadcast
        }
    }
    
    /**
     * Update a remote player with received data
     * @param {Object} playerData - Serialized player data
     */
    updateRemotePlayer(playerData) {
        // Skip if player doesn't exist
        if (!this.game.players[playerData.id]) {
            return;
        }
        
        // Update the player with received data
        this.game.players[playerData.id].deserialize(playerData);
    }
    
    /**
     * Handle a hit event
     * @param {Object} data - Hit data
     */
    handleHit(data) {
        // Skip if we're the host (we already processed this)
        if (this.isHost) {
            return;
        }
        
        // Skip if target player doesn't exist
        if (!this.game.players[data.targetId]) {
            return;
        }
        
        // Get the attacker
        const attacker = this.game.players[data.attackerId] || null;
        
        // Apply damage to the target
        const killed = this.game.players[data.targetId].takeDamage(data.damage, attacker);
        
        // The data.killed flag should match our result, but we use our local calculation
        // to ensure consistency across clients
    }
    
    /**
     * Handle a chat message
     * @param {Object} data - Chat message data
     */
    handleChatMessage(data) {
        // Display the chat message
        showNotification(`${data.playerName}: ${data.message}`);
    }
    
    /**
     * Send a chat message
     * @param {string} message - The message to send
     */
    sendChatMessage(message) {
        const data = {
            type: 'chat-message',
            playerId: this.peer.id,
            playerName: this.game.localPlayer.name,
            message: message
        };
        
        // Send to all connections
        this.broadcast(data);
        
        // Also show locally
        showNotification(`${this.game.localPlayer.name}: ${message}`);
    }
    
    /**
     * Send player update to all connections
     */
    sendPlayerUpdate() {
        if (!this.game.localPlayer) {
            return;
        }
        
        // Serialize local player
        const playerData = this.game.localPlayer.serialize();
        
        // Send player update
        this.broadcast({
            type: 'player-update',
            player: playerData
        });
    }
    
    /**
     * Send hit information to all clients
     * @param {string} targetId - ID of the hit player
     * @param {number} damage - Amount of damage dealt
     * @param {boolean} killed - Whether the hit killed the player
     * @param {string} attackerId - ID of the attacker
     */
    sendHitInfo(targetId, damage, killed, attackerId) {
        this.broadcast({
            type: 'hit',
            targetId: targetId,
            damage: damage,
            killed: killed,
            attackerId: attackerId
        });
    }
    
    /**
     * Broadcast data to all or specific connections
     * @param {Object} data - Data to broadcast
     * @param {Array} exclude - Array of connection IDs to exclude
     */
    broadcast(data, exclude = []) {
        Object.keys(this.connections).forEach(connId => {
            if (exclude.includes(connId)) {
                return;
            }
            
            this.connections[connId].send(data);
        });
    }
    
    /**
     * Clean up network resources
     */
    dispose() {
        // Close all connections
        Object.values(this.connections).forEach(conn => {
            conn.close();
        });
        
        // Close the peer connection
        if (this.peer) {
            this.peer.destroy();
        }
        
        // Clear variables
        this.connections = {};
        this.peer = null;
        this.isHost = false;
        this.gameId = null;
    }
}
