/**
 * Main entry point for the game
 * This script initializes the game and handles global events
 */

// This script mainly acts as an entry point
// Most of the game logic is in game.js
// Global game instance is created in game.js

// Add global error handling
window.addEventListener('error', (event) => {
    console.error('Game error:', event.error);
    alert(`Ocorreu um erro: ${event.error.message}`);
});

// Add keyboard shortcuts
document.addEventListener('keydown', (event) => {
    // F11 for fullscreen
    if (event.key === 'F11') {
        event.preventDefault();
        toggleFullscreen();
    }
});

/**
 * Toggle fullscreen mode
 */
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.error('Error attempting to enable fullscreen:', err);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

// Add custom CSS for better crosshair
document.addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style');
    style.textContent = `
        #crosshair {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 12px;
            height: 12px;
            border: 2px solid white;
            border-radius: 50%;
            z-index: 1000;
        }
        
        #crosshair::before, #crosshair::after {
            content: '';
            position: absolute;
            background-color: white;
        }
        
        #crosshair::before {
            width: 2px;
            height: 6px;
            top: 3px;
            left: 5px;
        }
        
        #crosshair::after {
            width: 6px;
            height: 2px;
            top: 5px;
            left: 3px;
        }
    `;
    document.head.appendChild(style);
    
    // Update crosshair element
    const crosshair = document.getElementById('crosshair');
    if (crosshair) {
        crosshair.innerHTML = '';
    }
});

// Verificação WebGL simplificada
if (!window.WebGLRenderingContext) {
    alert('Seu navegador não suporta WebGL, necessário para executar este jogo.');
}

// Create placeholder image for menu background if missing
window.addEventListener('DOMContentLoaded', () => {
    const img = new Image();
    img.src = 'textures/menu-bg.jpg';
    img.onerror = () => {
        console.warn('Menu background image missing, creating placeholder');
        createMenuBackground();
    };
});

/**
 * Create a placeholder menu background if the image is missing
 */
function createMenuBackground() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 768;
    const ctx = canvas.getContext('2d');
    
    // Draw gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#001f3f');
    gradient.addColorStop(1, '#000000');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw some random "stars"
    ctx.fillStyle = 'white';
    for (let i = 0; i < 200; i++) {
        const size = Math.random() * 2;
        ctx.beginPath();
        ctx.arc(
            Math.random() * canvas.width,
            Math.random() * canvas.height,
            size,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }
    
    // Convert to data URL
    const dataUrl = canvas.toDataURL('image/jpeg');
    
    // Apply to menu background
    const menuScreen = document.getElementById('menu-screen');
    if (menuScreen) {
        menuScreen.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.9)), url('${dataUrl}')`;
    }
}

// Add some game instructions to the menu
document.addEventListener('DOMContentLoaded', () => {
    const menuScreen = document.getElementById('menu-screen');
    if (menuScreen) {
        const instructions = document.createElement('div');
        instructions.style.marginTop = '30px';
        instructions.style.textAlign = 'center';
        instructions.style.color = 'white';
        instructions.style.maxWidth = '600px';
        instructions.innerHTML = `
            <h3>Instruções</h3>
            <p>WASD - Movimento</p>
            <p>Mouse - Olhar</p>
            <p>Clique - Atirar</p>
            <p>R - Recarregar</p>
            <p>1-3 - Mudar armas</p>
            <p>Espaço - Pular</p>
            <p>T - Chat</p>
            <p>ESC - Liberar mouse</p>
            <p>F11 - Tela cheia</p>
        `;
        menuScreen.appendChild(instructions);
    }
});
