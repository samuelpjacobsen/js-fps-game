/**
 * This file generates dynamic textures to avoid loading external files
 */

// Generate menu background texture
function generateMenuBackground() {
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
    return canvas.toDataURL('image/jpeg');
}

// Apply menu background on load
document.addEventListener('DOMContentLoaded', () => {
    const menuScreen = document.getElementById('menu-screen');
    if (menuScreen) {
        const dataUrl = generateMenuBackground();
        menuScreen.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.9)), url('${dataUrl}')`;
    }
});

// Generate ground texture
function generateGroundTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Base color
    ctx.fillStyle = '#444444';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add some noise for texture
    for (let i = 0; i < 5000; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = Math.random() * 3 + 1;
        const alpha = Math.random() * 0.3 + 0.1;
        
        ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    return canvas;
}

// Export functions
window.TextureGenerator = {
    generateMenuBackground,
    generateGroundTexture
};
