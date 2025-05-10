// =============================================
// SIMPLE RETRO RACER - Core Game Only
// =============================================

// Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game Configuration
const config = {
    debugMode: false,
    showHitboxes: false,
    playerSpeed: 4
};

// Road Settings
const road = {
    width: canvas.width,
    height: canvas.height,
    lanes: 3,
    laneWidth: canvas.width / 3,
    markings: [],
    speed: 3,
    leftBoundary: 0,
    rightBoundary: canvas.width
};

// Player Car
const player = {
    x: canvas.width / 2 - 16,
    y: canvas.height - 100,
    width: 122,
    height: 155,
    currentLane: 1,
    moving: false,
    targetX: canvas.width / 2 - 16,
    speedX: 0,
    speedY: 0
};

// Game State
const gameState = {
    obstacles: [],
    score: 0,
    gameOver: false,
    animationId: null,
    gameStarted: false,
    keysPressed: {}
};

// Load car images
const carImages = {
    player: new Image(),
    blue: new Image(),
    yellow: new Image(),
    purple: new Image(),
    green: new Image()
};

carImages.player.src = 'imgs/igrac.jpg';
carImages.blue.src = 'imgs/auto4.png';
carImages.yellow.src = 'imgs/auto1.png';
carImages.purple.src = 'imgs/auto2.png';
carImages.green.src = 'imgs/auto3.png'; 

// Initialize Road Markings
function initRoadMarkings() {
    road.markings = [];
    for (let i = 0; i < canvas.height / 60; i++) {
        road.markings.push({
            x: canvas.width / 3 - 2.5, // First dashed line
            y: i * 60,
            width: 5,
            height: 30
        });
        road.markings.push({
            x: (2 * canvas.width) / 3 - 2.5, // Second dashed line
            y: i * 60,
            width: 5,
            height: 30
        });
    }
}

// Initialize Game
function initGame() {
    initRoadMarkings();
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('keydown', (e) => {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault(); // Prevent scrolling when using arrow keys
        }
    });
    gameLoop();
}

// Main Game Loop
function gameLoop() {
    update();
    render();
    
    if (!gameState.gameOver) {
        gameState.animationId = requestAnimationFrame(gameLoop);
    }
}

// Update Game State
function updateRoadMarkings() {
    for (const marking of road.markings) {
        marking.y += road.speed * 1.5; // Doubled the speed of the dashed lines
        if (marking.y > canvas.height) {
            marking.y = -marking.height;
        }
    }
}

function update() {
    if (!gameState.gameStarted || gameState.gameOver) return;

    // Update road markings
    updateRoadMarkings();

    // Update player position
    updatePlayerMovement();

    // Update obstacles
    for (let i = gameState.obstacles.length - 1; i >= 0; i--) {
        const obs = gameState.obstacles[i];
        obs.y += obs.speed;

        // Remove off-screen obstacles
        if (obs.y > canvas.height) {
            gameState.obstacles.splice(i, 1);
            gameState.score++;
        }

        // Check collisions
        if (checkCollision(player, obs)) {
            gameState.gameOver = true;
        }
    }

    // Randomly generate new obstacles
    if (Math.random() < 0.0075) {
        generateObstacle();
    }
}

// Update player movement to allow free movement
function updatePlayerMovement() {
    player.speedX = 0;
    player.speedY = 0;

    if (gameState.keysPressed['ArrowLeft']) {
        player.speedX = -config.playerSpeed;
    }
    if (gameState.keysPressed['ArrowRight']) {
        player.speedX = config.playerSpeed;
    }
    if (gameState.keysPressed['ArrowUp']) {
        player.speedY = -config.playerSpeed;
    }
    if (gameState.keysPressed['ArrowDown']) {
        player.speedY = config.playerSpeed;
    }

    player.x += player.speedX;
    player.y += player.speedY;

    // Keep player within road boundaries
    player.x = Math.max(road.leftBoundary, Math.min(player.x, road.rightBoundary - player.width));
    player.y = Math.max(0, Math.min(player.y, canvas.height - player.height));
}

// Render Game
function render() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw road
    drawRoad();
    
    // Draw obstacles
    drawObstacles();
    
    // Draw start screen or game elements
    if (!gameState.gameStarted) {
        drawStartScreen();
    } else {
        drawPlayer();
        drawScore();
        
        if (gameState.gameOver) {
            drawGameOver();
        }
    }
}

// Drawing Functions
function drawRoad() {
    // Road background
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Lane markings
    ctx.fillStyle = '#FFF';
    for (const mark of road.markings) {
        ctx.fillRect(mark.x, mark.y, mark.width, mark.height);
    }
}

function drawPlayer() {
    ctx.drawImage(carImages.player, player.x, player.y, player.width, player.height);

    if (config.showHitboxes) {
        ctx.strokeStyle = 'red';
        ctx.strokeRect(
            player.x + player.width * 0.1, // Narrower hitbox
            player.y,
            player.width * 0.8, // Narrower width
            player.height * 1.1 // Longer height
        );
    }
}

function drawObstacles() {
    for (const obstacle of gameState.obstacles) {
        let image;
        switch (obstacle.color) {
            case '#0000AA':
                image = carImages.blue; // Ažurirano za plavi auto
                break;
            case '#0000AA':
                image = carImages.blue; // Ažurirano za plavi auto
                break;
            case '#FFAA2A':
                image = carImages.yellow;
                break;
            case '#AA2AFF':
                image = carImages.purple;
                break;
            default:
                image = carImages.green;
        }

        ctx.drawImage(image, obstacle.x, obstacle.y, obstacle.width, obstacle.height);

        if (config.showHitboxes) {
            ctx.strokeStyle = 'blue';
            ctx.strokeRect(
                obstacle.x + obstacle.width * 0.1, // Narrower hitbox
                obstacle.y,
                obstacle.width * 0.8, // Narrower width
                obstacle.height * 1.1 // Longer height
            );
        }
    }
}

function drawScore() {
    ctx.fillStyle = '#2AFF2A';
    ctx.font = '20px "Press Start 2P"';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${gameState.score}`, 20, 30);
}

function drawStartScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#2AFF2A';
    ctx.font = '24px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('RETRO RACER', canvas.width/2, canvas.height/2 - 30);
    
    ctx.fillStyle = '#FFF';
    ctx.font = '16px "Press Start 2P"';
    ctx.fillText('USE ARROW KEYS', canvas.width/2, canvas.height/2 + 20);
    ctx.fillText('TO CHANGE LANES', canvas.width/2, canvas.height/2 + 50);
    
    ctx.fillStyle = '#FF2A2A';
    ctx.fillText('PRESS ANY KEY', canvas.width/2, canvas.height/2 + 100);
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#FF2A2A';
    ctx.font = '28px "Press Start 2P"';
    ctx.textAlign = 'center'; // Ensure text is centered
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 30);
    ctx.fillText(`SCORE: ${gameState.score}`, canvas.width / 2, canvas.height / 2 + 30);
    ctx.fillText('PRESS R TO RESTART', canvas.width / 2, canvas.height / 2 + 80);
}

// Game Functions
function generateObstacle() {
    const lane = Math.floor(Math.random() * road.lanes);
    const types = [
        { width: 159, height: 145, color: '#FF2A2A', speed: 3.5 }, // Regular car
        { width: 159, height: 145, color: '#FFAA2A', speed: 3.5 },  // Fast car
        { width: 159, height: 145, color: '#0000AA', speed: 3.5 }   // Blue car
    ];
    const type = types[Math.floor(Math.random() * types.length)];

    // Check for overlapping obstacles in the same lane
    const laneX = lane * road.laneWidth + (road.laneWidth - type.width) / 2;
    const overlapping = gameState.obstacles.some(obs => {
        return obs.x === laneX && obs.y < type.height * 2; // Ensure enough vertical space
    });

    if (!overlapping) {
        gameState.obstacles.push({
            x: laneX,
            y: -type.height,
            ...type
        });
    }
}

function checkCollision(a, b) {
    const margin = 20; // Tolerancija na X osi
    return a.x + margin < b.x + b.width - margin &&
           a.x + a.width - margin > b.x + margin &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
}

// Input Handling
function handleKeyDown(e) {
    if (!gameState.gameStarted) {
        gameState.gameStarted = true;
        return;
    }
    
    if (gameState.gameOver && e.key.toLowerCase() === 'r') {
        resetGame();
        return;
    }
    
    if (gameState.gameOver) return;
    
    gameState.keysPressed[e.key] = true;
}

function handleKeyUp(e) {
    gameState.keysPressed[e.key] = false;
}

function resetGame() {
    gameState.obstacles = [];
    gameState.score = 0;
    gameState.gameOver = false;
    gameState.gameStarted = true;
    
    player.currentLane = 1;
    player.x = canvas.width/2 - player.width/2;
    player.targetX = player.x;
    player.moving = false;

    gameState.gameLoop = requestAnimationFrame(gameLoop); // Restart the game loop
}

// Start the game
window.onload = initGame;