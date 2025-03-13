// Utility functions for the game

/**
 * Generate a random ID for game sessions
 * @returns {string} A random ID
 */
function generateGameId() {
    return Math.random().toString(36).substring(2, 10);
}

/**
 * Generate a random color for player identification
 * @returns {number} A random color as a THREE.js color number
 */
function getRandomColor() {
    return Math.random() * 0xffffff;
}

/**
 * Check if two objects are colliding (simple sphere collision)
 * @param {Object} obj1 - First object with position and radius properties
 * @param {Object} obj2 - Second object with position and radius properties
 * @returns {boolean} True if objects are colliding
 */
function checkCollision(obj1, obj2) {
    const dx = obj1.position.x - obj2.position.x;
    const dy = obj1.position.y - obj2.position.y;
    const dz = obj1.position.z - obj2.position.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    return distance < (obj1.radius + obj2.radius);
}

/**
 * Linear interpolation between two values
 * @param {number} a - Start value
 * @param {number} b - End value
 * @param {number} t - Interpolation factor (0-1)
 * @returns {number} Interpolated value
 */
function lerp(a, b, t) {
    return a + (b - a) * t;
}

/**
 * Clamp a value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

/**
 * Convert degrees to radians
 * @param {number} degrees - Angle in degrees
 * @returns {number} Angle in radians
 */
function degToRad(degrees) {
    return degrees * Math.PI / 180;
}

/**
 * Calculate distance between two points in 3D space
 * @param {THREE.Vector3} p1 - First point
 * @param {THREE.Vector3} p2 - Second point
 * @returns {number} Distance between points
 */
function getDistance(p1, p2) {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    const dz = p1.z - p2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Check if a point is inside a box
 * @param {THREE.Vector3} point - Point to check
 * @param {THREE.Box3} box - Box to check against
 * @returns {boolean} True if point is inside box
 */
function pointInBox(point, box) {
    return (
        point.x >= box.min.x && point.x <= box.max.x &&
        point.y >= box.min.y && point.y <= box.max.y &&
        point.z >= box.min.z && point.z <= box.max.z
    );
}

/**
 * Format a number with leading zeros
 * @param {number} num - Number to format
 * @param {number} size - Size of the resulting string
 * @returns {string} Formatted number
 */
function padNumber(num, size) {
    let s = num.toString();
    while (s.length < size) s = "0" + s;
    return s;
}

/**
 * Show a notification in the kill feed
 * @param {string} message - Message to show
 */
function showNotification(message) {
    const killFeed = document.getElementById('kill-feed');
    const notification = document.createElement('div');
    notification.className = 'kill-message';
    notification.textContent = message;
    killFeed.appendChild(notification);
    
    // Remove after animation completes
    setTimeout(() => {
        if (killFeed.contains(notification)) {
            killFeed.removeChild(notification);
        }
    }, 4000);
}
