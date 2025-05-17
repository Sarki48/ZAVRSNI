// Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
var glazba = true;

provjeriAudio();

const config = {
    debugMode: false,
    showHitboxes: false,
    playerSpeed: 450 // povećano za deltaTime
};

const road = {
    width: canvas.width,
    height: canvas.height,
    lanes: 3,
    laneWidth: canvas.width / 3,
    markings: [],
    speed: 420, // povećano za deltaTime
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

// Inicijaliziraj oznake na cesti
function inicijalizirajOznakeCeste() {
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

// Inicijaliziraj igru
function inicijalizirajIgru() {
    inicijalizirajOznakeCeste();
    window.addEventListener('keydown', obradiPritisakTipke);
    window.addEventListener('keyup', obradiOtpustanjeTipke);
    window.addEventListener('keydown', (e) => {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
        }
    });
    pustiPozadinskuGlazbu();
    lastTimestamp = 0;
    requestAnimationFrame(glavnaPetlja);
}

// Glavna petlja igre
function glavnaPetlja(timestamp) {
    if (!lastTimestamp) lastTimestamp = timestamp;
    const deltaTime = (timestamp - lastTimestamp) / 1000;
    lastTimestamp = timestamp;
    azuriraj(deltaTime);
    iscrtaj();
    if (!gameState.gameOver) {
        gameState.animationId = requestAnimationFrame(glavnaPetlja);
    }
}

// Ažuriraj stanje igre
function azuriraj(deltaTime) {
    if (!gameState.gameStarted || gameState.gameOver) return;
    azurirajOznakeCeste(deltaTime);
    azurirajKretanjeIgraca(deltaTime);
    for (let i = gameState.obstacles.length - 1; i >= 0; i--) {
        const obs = gameState.obstacles[i];
        obs.y += obs.speed * deltaTime;
        if (obs.y > canvas.height) {
            gameState.obstacles.splice(i, 1);
            gameState.score++;
            if (gameState.score % 10 === 0) {
                povecajTezinu();
            }
        }
        if (provjeriSudaranje(player, obs)) {
            gameState.gameOver = true;
        }
    }
    if (Math.random() < 0.0075) {
        generirajPrepreku();
    }
}

function povecajTezinu() {
    gameState.obstacles.forEach(obs => obs.speed += 0.5);
}

function azurirajOznakeCeste(deltaTime) {
    for (const marking of road.markings) {
        marking.y += road.speed * 1.5 * deltaTime;
        if (marking.y > canvas.height) {
            marking.y = -marking.height;
        }
    }
}

// Ažuriraj kretanje igrača (slobodno kretanje)
function azurirajKretanjeIgraca(deltaTime) {
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
    player.x += player.speedX * (deltaTime ? deltaTime : 1/60);
    player.y += player.speedY * (deltaTime ? deltaTime : 1/60);
    player.x = Math.max(road.leftBoundary, Math.min(player.x, road.rightBoundary - player.width));
    player.y = Math.max(0, Math.min(player.y, canvas.height - player.height));
}

// Iscrtaj igru
function iscrtaj() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    iscrtajCestu();
    iscrtajPrepreke();
    if (!gameState.gameStarted) {
        iscrtajPocetniEkran();
    } else {
        iscrtajIgraca();
        iscrtajRezultat();
        if (gameState.gameOver) {
            iscrtajKrajIgre();
        }
    }
}

// Funkcije za crtanje
function iscrtajCestu() {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#FFF';
    for (const mark of road.markings) {
        ctx.fillRect(mark.x, mark.y, mark.width, mark.height);
    }
}

function iscrtajIgraca() {
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

function iscrtajPrepreke() {
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

function iscrtajRezultat() {
    ctx.fillStyle = '#2AFF2A';
    ctx.font = '20px "Press Start 2P"';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${gameState.score}`, 20, 30);
}

function iscrtajPocetniEkran() {
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

function iscrtajKrajIgre() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#FF2A2A';
    ctx.font = '17px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText('KRAJ IGRE', canvas.width / 2, canvas.height / 2 - 30);
    ctx.fillText(`REZULTAT: ${gameState.score}`, canvas.width / 2, canvas.height / 2 + 30);
    ctx.fillText('PRITISNITE R ZA PONOVNO POKRETANJE', canvas.width / 2, canvas.height / 2 + 80);
    spremiRezultat();
    zaustaviPozadinskuGlazbu();
    sound = document.getElementById('gameOverSound');
    sound.play();
    sound.loop = false;
}

// Spremi i učitaj rezultate
function spremiRezultat() {
    const scores = JSON.parse(localStorage.getItem("scores")) || [];
    if (gameState.score >= 0) {
        scores.push(gameState.score);
        localStorage.setItem("scores", JSON.stringify(scores));
    }
    if (scores.length > 10) {
        scores.shift();
    }
}

function ucitajRezultate() {
    const scores = JSON.parse(localStorage.getItem("scores")) || [];
    return scores.reverse();
}

function prikaziRezultate() {
    const scores = ucitajRezultate();
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

function obrisiRezultate() {
    localStorage.removeItem("scores");
    azurirajAside();
}

// Funkcije igre
function generirajPrepreku() {
    const lane = Math.floor(Math.random() * road.lanes);
    const types = [
        { width: 159, height: 145, color: '#FF2A2A' },
        { width: 159, height: 145, color: '#FFAA2A' },
        { width: 159, height: 145, color: '#0000AA' }
    ];
    const type = types[Math.floor(Math.random() * types.length)];
    let baseSpeed = 400;
    const multiplier = Math.pow(1., Math.floor(gameState.score / 10));
    let dynamicSpeed = baseSpeed * multiplier;
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

function provjeriSudaranje(a, b) {
    const margin = 20;
    return a.x + margin < b.x + b.width - margin &&
           a.x + a.width - margin > b.x + margin &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
}

// Obrada tipki
function obradiPritisakTipke(e) {
    if (!gameState.gameStarted) {
        gameState.gameStarted = true;
        return;
    }
    if (gameState.gameOver && e.key.toLowerCase() === 'r') {
        resetirajIgru();
        return;
    }
    if (gameState.gameOver) return;
    gameState.keysPressed[e.key] = true;
}

function obradiOtpustanjeTipke(e) {
    gameState.keysPressed[e.key] = false;
}

function resetirajIgru() {
    if (!glazba) {
        music = document.getElementById('backgroundMusic');
        music.play();
        music.loop = true;
    }
    inicijalizirajOznakeCeste();
    gameState.obstacles = [];
    gameState.score = 0;
    gameState.gameOver = false;
    gameState.gameStarted = true;
    player.currentLane = 1;
    player.x = canvas.width/2 - player.width/2;
    player.targetX = player.x;
    player.moving = false;
    lastTimestamp = 0;
    gameState.gameLoop = requestAnimationFrame(glavnaPetlja);
    provjeriAudio();
}

function azurirajAside() {
    const highscoreElement = document.getElementById('highscore');
    const scoreListElement = document.getElementById('scoreList');
    const scores = ucitajRezultate();
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

setInterval(azurirajAside, 1000);

// Funkcije za pozadinsku glazbu
function pustiPozadinskuGlazbu() {
    const music = document.getElementById('backgroundMusic');
    music.play();
}

function zaustaviPozadinskuGlazbu() {
    const music = document.getElementById('backgroundMusic');
    music.pause();
    music.currentTime = 0;
}

function provjeriAudio() {
    const audio = document.getElementById('backgroundMusic');
    const audioToggle = document.getElementById('audioToggle');
    if (audio.paused) {
        audioToggle.src = 'imgs/audioOff.jpg';
        glazba = false;
    }
    else {
        audioToggle.src = 'imgs/audioOn.jpg';
        audio.play();
    }
}

function promijeniAudio() {
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

// Pokreni igru
window.onload = inicijalizirajIgru;