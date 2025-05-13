// Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
var glazba = true;

checkAudio();

const config = {
    debugMode: false,
    showHitboxes: false,
    playerSpeed: 4
};

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

const gameState = {
    obstacles: [],
    score: 0,
    gameOver: false,
    animationId: null,
    gameStarted: false,
    keysPressed: {}
};

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
            x: canvas.width / 3 - 2.5,
            y: i * 60,
            width: 5,
            height: 30
        });
        road.markings.push({
            x: (2 * canvas.width) / 3 - 2.5,
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
            e.preventDefault();
        }
    });
    playBackgroundMusic();
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
        marking.y += road.speed * 1.5;
        if (marking.y > canvas.height) {
            marking.y = -marking.height;
        }
    }
}

function increaseDifficulty() {
    gameState.obstacles.forEach(obs => obs.speed += 0.5);
}

function update() {
    if (!gameState.gameStarted || gameState.gameOver) return;
    updateRoadMarkings();
    updatePlayerMovement();
    for (let i = gameState.obstacles.length - 1; i >= 0; i--) {
        const obs = gameState.obstacles[i];
        obs.y += obs.speed;
        if (obs.y > canvas.height) {
            gameState.obstacles.splice(i, 1);
            gameState.score++;
            if (gameState.score % 10 === 0) {
                increaseDifficulty();
            }
        }
        if (checkCollision(player, obs)) {
            gameState.gameOver = true;
        }
    }
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
    player.x = Math.max(road.leftBoundary, Math.min(player.x, road.rightBoundary - player.width));
    player.y = Math.max(0, Math.min(player.y, canvas.height - player.height));
}

// Render Game
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawRoad();
    drawObstacles();
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
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
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
            player.x + player.width * 0.1,
            player.y,
            player.width * 0.8,
            player.height * 1.1
        );
    }
}

function drawObstacles() {
    for (const obstacle of gameState.obstacles) {
        let image;
        switch (obstacle.color) {
            case '#0000AA':
                image = carImages.blue;
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
                obstacle.x + obstacle.width * 0.1,
                obstacle.y,
                obstacle.width * 0.8,
                obstacle.height * 1.1
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
    stopBackgroundMusic();
    sound = document.getElementById('gameOverSound');
    sound.play();
    sound.loop = false;
}

// Save and Load Scores
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
    return scores.reverse();
}

function displayScores() {
    const scores = loadScores();
    const scoreList = document.getElementById('scoreList');
    scoreList.innerHTML = '';
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
    localStorage.removeItem("scores");
    updateAsides();
}

// Game Functions
function generateObstacle() {
    const lane = Math.floor(Math.random() * road.lanes);
    const types = [
        { width: 159, height: 145, color: '#FF2A2A' },
        { width: 159, height: 145, color: '#FFAA2A' },
        { width: 159, height: 145, color: '#0000AA' }
    ];
    const type = types[Math.floor(Math.random() * types.length)];
    const baseSpeed = 3.5;
    const speedIncrement = Math.floor(gameState.score / 10) * 0.5;
    let dynamicSpeed = baseSpeed + speedIncrement;
    if (gameState.score % 10 === 1 && gameState.score > 0 && gameState.obstacles.length === 0) {
        dynamicSpeed = Math.min(baseSpeed + 1, 4);
    }
    const lanesOccupied = new Set(gameState.obstacles.map(obs => Math.floor(obs.x / road.laneWidth)));
    if (lanesOccupied.size >= road.lanes - 1) {
        return;
    }
    const laneX = lane * road.laneWidth + (road.laneWidth - type.width) / 2;
    const overlapping = gameState.obstacles.some(obs => {
        return obs.x === laneX && obs.y < type.height * 2;
    });
    if (!overlapping) {
        gameState.obstacles.push({
            x: laneX,
            y: -type.height,
            speed: dynamicSpeed,
            ...type
        });
    }
}

function checkCollision(a, b) {
    const margin = 20;
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
        music.play();
        music.loop = true;
    }
    gameState.obstacles = [];
    gameState.score = 0;
    gameState.gameOver = false;
    gameState.gameStarted = true;
    player.currentLane = 1;
    player.x = canvas.width/2 - player.width/2;
    player.targetX = player.x;
    player.moving = false;
    gameState.gameLoop = requestAnimationFrame(gameLoop);
    checkAudio();
}

function updateAsides() {
    const highscoreElement = document.getElementById('highscore');
    const scoreListElement = document.getElementById('scoreList');
    const scores = loadScores();
    highscoreElement.textContent = scores.reduce((a, b) => Math.max(a, b), 0);
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

setInterval(updateAsides, 1000);

// Background Music Functions
function playBackgroundMusic() {
    const music = document.getElementById('backgroundMusic');
    music.play();
}

function stopBackgroundMusic() {
    const music = document.getElementById('backgroundMusic');
    music.pause();
    music.currentTime = 0;
}

function checkAudio() {
    const audio = document.getElementById('backgroundMusic');
    const audioToggle = document.getElementById('audioToggle');
    if (audio.paused) {
        audioToggle.src = 'imgs/audioOff.jpg';
        glazba = false;
    }
    else {
        audioToggle.src = 'imgs/audioOn.jpg';
        glazba = true;
        audio.play();
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
        glazba = false;
    }
}

// Start the game
window.onload = initGame;