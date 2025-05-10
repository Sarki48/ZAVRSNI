// =============================================
// SIMPLE RETRO RACER - Core Game Only
// =============================================

// Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
var glazba = true; // Flag for background music


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
    playBackgroundMusic(); // Start music
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
    ctx.fillText('KORISTITE TIPKE SA STRELICAMA', canvas.width/2, canvas.height/2 + 20);
    ctx.fillText('ZA PROMJENU TRAKA', canvas.width/2, canvas.height/2 + 50);

    ctx.fillStyle = '#FF2A2A';
    ctx.fillText('PRITISNITE BILO KOJU TIPKU', canvas.width/2, canvas.height/2 + 100);
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#FF2A2A';
    ctx.font = '17px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('KRAJ IGRE', canvas.width / 2, canvas.height / 2 - 30);
    ctx.fillText(`REZULTAT: ${gameState.score}`, canvas.width / 2, canvas.height / 2 + 30);
    ctx.fillText('PRITISNITE R ZA PONOVNO POKRETANJE', canvas.width / 2, canvas.height / 2 + 80);
    saveScore();
    stopBackgroundMusic(); // Stop music
    sound = document.getElementById('gameOverSound');
    sound.play(); // Restart music
    sound.loop = false; // Loop the music
    // Restart music
}

function saveScore() {
    const scores = JSON.parse(localStorage.getItem("scores")) || [];
    if (gameState.score >= 0) {
        scores.push(gameState.score);
        localStorage.setItem("scores", JSON.stringify(scores));
    }
    if (scores.length > 10) {
        scores.shift(); 
    }

}

function loadScores() {
    const scores = JSON.parse(localStorage.getItem("scores")) || [];
    return scores.reverse(); // Reverse the order for display
}

function displayScores() {
    const scores = loadScores();
    const scoreList = document.getElementById('scoreList');
    scoreList.innerHTML = ''; // Clear previous scores

    if (scores.length === 0) {
        scoreList.innerHTML = '<li>Još nema rezultata!</li>';
    } else {
        for (let i = 0; i < Math.min(scores.length, 10); i++) {
            const li = document.createElement('li');
            li.textContent = `Rezultat ${i + 1}: ${scores[i]}`;
            scoreList.appendChild(li);
        }
    }
}

function clearScores() {
    localStorage.removeItem("scores"); // Clear scores from local storage   
    updateAsides(); // Update the score display
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
    if (glazba) {
        music = document.getElementById('backgroundMusic');
        music.play(); // Start music
        music.loop = true; // Loop the music
    }
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

function updateAsides() {
    const highscoreElement = document.getElementById('highscore');
    const scoreListElement = document.getElementById('scoreList');

    const scores = loadScores();

    // Update the highest score
    
    highscoreElement.textContent = scores.reduce((a, b) => Math.max(a, b), 0); // Get the highest score
    

    // Update the score list
    scoreListElement.innerHTML = '';
    if (scores.length === 0) {
        scoreListElement.innerHTML = '<li>Još nema rezultata!</li>';
    } else {
        for (let i = 0; i < Math.min(scores.length, 10); i++) {
            const li = document.createElement('li');
            li.textContent = scores[i];
            scoreListElement.appendChild(li);
        }
    }
}

// Call updateAsides periodically or after saving a score
setInterval(updateAsides, 1000); // Update every second

// Background Music Functions
function playBackgroundMusic() {
    const music = document.getElementById('backgroundMusic');
    music.play();
}

function stopBackgroundMusic() {
    const music = document.getElementById('backgroundMusic');
    music.pause();
    music.currentTime = 0; // Reset to the beginning
}
function checkAudio() {
    const audio = document.getElementById('backgroundMusic');
    const audioToggle = document.getElementById('audioToggle');
    if (audio.paused) {
        audioToggle.src = 'imgs/audioOff.jpg'; // Show audio off icon
    }
    else {
        audioToggle.src = 'imgs/audioOn.jpg'; // Show audio on icon
    }
}

function toggleAudio() {
    const audio = document.getElementById('backgroundMusic');
    const audioToggle = document.getElementById('audioToggle');

    if (audio.paused) {
        audio.play();
        audioToggle.src = 'imgs/audioOn.jpg';
    } else {
        audio.pause();
        audioToggle.src = 'imgs/audioOff.jpg';
        glazba = false; // Stop background music
    }
}

// Start the game
window.onload = initGame;