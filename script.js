// Postavke canvasa

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

var glazba = true;

provjeriAudio();

const postavke = {
    debugMod: false,
    prikaziHitbox: false,
    brzinaIgraca: 450 
};

const cesta = {
    sirina: canvas.width,
    visina: canvas.height,
    trake: 3,
    sirinaTrake: canvas.width / 3,
    oznake: [],
    brzina: 420, 
    lijevaGranica: 0,
    desnaGranica: canvas.width
};

const igrac = {
    x: canvas.width / 2 - (122 / 2),
    y: canvas.height - 100,
    sirina: 122,
    visina: 155,
    trenutnaTraka: 1,
    pomicanje: false,
    ciljX: canvas.width / 2 - (122 / 2),
    brzinaX: 0,
    brzinaY: 0
};

const stanjeIgre = {
    prepreke: [],
    rezultat: 0,
    krajIgre: false,
    animacijaId: null,
    igraPokrenuta: false,
    pritisnuteTipke: {}
};

const slikeAuta = {
    igrac: new Image(),
    plavi: new Image(),
    zuti: new Image(),
    ljubicast: new Image(),
    zeleni: new Image()
};

slikeAuta.igrac.src = 'imgs/igrac.jpg';
slikeAuta.plavi.src = 'imgs/auto4.png';
slikeAuta.zuti.src = 'imgs/auto1.png';
slikeAuta.ljubicast.src = 'imgs/auto2.png';
slikeAuta.zeleni.src = 'imgs/auto3.png';

// Inicijaliziraj oznake na cesti

function inicijalizirajOznakeCeste() {
    cesta.oznake = [];
    for (let i = 0; i < canvas.height / 60; i++) {
        cesta.oznake.push({
            x: canvas.width / 3 - 2.5,
            y: i * 60,
            sirina: 5,
            visina: 30
        });
        cesta.oznake.push({
            x: (2 * canvas.width) / 3 - 2.5,
            y: i * 60,
            sirina: 5,
            visina: 30
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
    zadnjiTimestamp = 0;
    requestAnimationFrame(glavnaPetlja);
}

// Glavna petlja igre
function glavnaPetlja(timestamp) {
    if (!zadnjiTimestamp) zadnjiTimestamp = timestamp;
    const deltaVrijeme = (timestamp - zadnjiTimestamp) / 1000;
    zadnjiTimestamp = timestamp;
    azuriraj(deltaVrijeme);
    iscrtaj();
    if (!stanjeIgre.krajIgre) {
        stanjeIgre.animacijaId = requestAnimationFrame(glavnaPetlja);
    }
}

// Ažuriraj stanje igre
function azuriraj(deltaVrijeme) {
    if (!stanjeIgre.igraPokrenuta || stanjeIgre.krajIgre) return;
    azurirajOznakeCeste(deltaVrijeme);
    azurirajKretanjeIgraca(deltaVrijeme);
    for (let i = stanjeIgre.prepreke.length - 1; i >= 0; i--) {
        const prepreka = stanjeIgre.prepreke[i];
        prepreka.y += prepreka.brzina * deltaVrijeme;
        if (prepreka.y > canvas.height) {
            stanjeIgre.prepreke.splice(i, 1);
            stanjeIgre.rezultat++;
            if (stanjeIgre.rezultat % 10 === 0) {
                povecajTezinu();
            }
        }
        if (provjeriSudaranje(igrac, prepreka)) {
            stanjeIgre.krajIgre = true;
        }
    }
    if (Math.random() < 0.0075) {
        generirajPrepreku();
    }
}

let osnovnaBrzinaPrepreke = 400; 

function povecajTezinu() {
    stanjeIgre.prepreke.forEach(prepreka => prepreka.brzina += 150);
    osnovnaBrzinaPrepreke += 150;
}

function azurirajOznakeCeste(deltaVrijeme) {
    for (const oznaka of cesta.oznake) {
        oznaka.y += cesta.brzina * 1.5 * deltaVrijeme;
        if (oznaka.y > canvas.height) {
            oznaka.y = -oznaka.visina;
        }
    }
}

// Ažuriraj kretanje igrača (slobodno kretanje)

function azurirajKretanjeIgraca(deltaVrijeme) {
    igrac.brzinaX = 0;
    igrac.brzinaY = 0;
    if (stanjeIgre.pritisnuteTipke['ArrowLeft']) {
        igrac.brzinaX = -postavke.brzinaIgraca;
    }
    if (stanjeIgre.pritisnuteTipke['ArrowRight']) {
        igrac.brzinaX = postavke.brzinaIgraca;
    }
    if (stanjeIgre.pritisnuteTipke['ArrowUp']) {
        igrac.brzinaY = -postavke.brzinaIgraca;
    }
    if (stanjeIgre.pritisnuteTipke['ArrowDown']) {
        igrac.brzinaY = postavke.brzinaIgraca;
    }
    igrac.x += igrac.brzinaX * (deltaVrijeme ? deltaVrijeme : 1/60);
    igrac.y += igrac.brzinaY * (deltaVrijeme ? deltaVrijeme : 1/60);
    igrac.x = Math.max(cesta.lijevaGranica, Math.min(igrac.x, cesta.desnaGranica - igrac.sirina));
    igrac.y = Math.max(0, Math.min(igrac.y, canvas.height - igrac.visina));
}

// Iscrtaj igru
function iscrtaj() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    iscrtajCestu();
    iscrtajPrepreke();
    if (!stanjeIgre.igraPokrenuta) {
        iscrtajPocetniEkran();
    } else {
        iscrtajIgraca();
        iscrtajRezultat();
        if (stanjeIgre.krajIgre) {
            iscrtajKrajIgre();
        }
    }
}

// Funkcije za crtanje
function iscrtajCestu() {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#FFF';
    for (const oznaka of cesta.oznake) {
        ctx.fillRect(oznaka.x, oznaka.y, oznaka.sirina, oznaka.visina);
    }
}

function iscrtajIgraca() {
    ctx.drawImage(slikeAuta.igrac, igrac.x, igrac.y, igrac.sirina, igrac.visina);
    if (postavke.prikaziHitbox) {
        ctx.strokeStyle = 'red';
        ctx.strokeRect(
            igrac.x + igrac.sirina * 0.1,
            igrac.y,
            igrac.sirina * 0.8,
            igrac.visina * 1.1
        );
    }
}

function iscrtajPrepreke() {
    for (const prepreka of stanjeIgre.prepreke) {
        let slika;
        switch (prepreka.boja) {
            case '#0000AA':
                slika = slikeAuta.plavi;
                break;
            case '#FFAA2A':
                slika = slikeAuta.zuti;
                break;
            case '#AA2AFF':
                slika = slikeAuta.ljubicast;
                break;
            default:
                slika = slikeAuta.zeleni;
        }
        ctx.drawImage(slika, prepreka.x, prepreka.y, prepreka.sirina, prepreka.visina);
        if (postavke.prikaziHitbox) {
            ctx.strokeStyle = 'blue';
            ctx.strokeRect(
                prepreka.x + prepreka.sirina * 0.1,
                prepreka.y,
                prepreka.sirina * 0.8,
                prepreka.visina * 1.1
            );
        }
    }
}

function iscrtajRezultat() {
    ctx.fillStyle = '#2AFF2A';
    ctx.font = '20px "Press Start 2P"';
    ctx.textAlign = 'left';
    ctx.fillText(`REZULTAT: ${stanjeIgre.rezultat}`, 20, 30);
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
    ctx.fillText(`REZULTAT: ${stanjeIgre.rezultat}`, canvas.width / 2, canvas.height / 2 + 30);
    ctx.fillText('PRITISNITE R ZA PONOVNO POKRETANJE', canvas.width / 2, canvas.height / 2 + 80);
    spremiRezultat();
    zaustaviPozadinskuGlazbu();
    zvuk = document.getElementById('gameOverSound');
    zvuk.play();
    zvuk.loop = false;
}

// Spremi i učitaj rezultate

function spremiRezultat() {
    const rezultati = JSON.parse(localStorage.getItem("rezultati")) || [];
    if (stanjeIgre.rezultat >= 0) {
        rezultati.push(stanjeIgre.rezultat);
        localStorage.setItem("rezultati", JSON.stringify(rezultati));
    }
    if (rezultati.length > 10) {
        rezultati.shift();
    }
}

function ucitajRezultate() {
    const rezultati = JSON.parse(localStorage.getItem("rezultati")) || [];
    return rezultati.reverse();
}

function prikaziRezultate() {
    const rezultati = ucitajRezultate();
    const listaRezultata = document.getElementById('scoreList');
    listaRezultata.innerHTML = '';
    if (rezultati.length === 0) {
        listaRezultata.innerHTML = '<li>Još nema rezultata!</li>';
    } else {
        for (let i = 0; i < Math.min(rezultati.length, 10); i++) {
            const li = document.createElement('li');
            li.textContent = `Rezultat ${i + 1}: ${rezultati[i]}`;
            listaRezultata.appendChild(li);
        }
    }
}

function obrisiRezultate() {
    localStorage.removeItem("rezultati");
    azurirajAside();
}

// Funkcije igre

function generirajPrepreku() {
    const traka = Math.floor(Math.random() * cesta.trake);
    const tipovi = [
        { sirina: 159, visina: 145, boja: '#FF2A2A' },
        { sirina: 159, visina: 145, boja: '#FFAA2A' },
        { sirina: 159, visina: 145, boja: '#0000AA' }
    ];
    const tip = tipovi[Math.floor(Math.random() * tipovi.length)];
    // Korištenje globalne osnovne brzine
    let dinamicnaBrzina = osnovnaBrzinaPrepreke;
    const zauzeteTrake = new Set(stanjeIgre.prepreke.map(prepreka => Math.floor(prepreka.x / cesta.sirinaTrake)));
    if (zauzeteTrake.size >= cesta.trake - 1) {
        return;
    }
    const trakaX = traka * cesta.sirinaTrake + (cesta.sirinaTrake - tip.sirina) / 2;
    const preklapanje = stanjeIgre.prepreke.some(prepreka => {
        return prepreka.x === trakaX && prepreka.y < tip.visina * 2;
    });
    if (!preklapanje) {
        stanjeIgre.prepreke.push({
            x: trakaX,
            y: -tip.visina,
            brzina: dinamicnaBrzina,
            ...tip
        });
    }
}

function provjeriSudaranje(a, b) {
    const margina = 20;
    return a.x + margina < b.x + b.sirina - margina &&
           a.x + a.sirina - margina > b.x + margina &&
           a.y < b.y + b.visina &&
           a.y + a.visina > b.y;
}

// Obrada tipki
function obradiPritisakTipke(e) {
    if (!stanjeIgre.igraPokrenuta) {
        stanjeIgre.igraPokrenuta = true;
        return;
    }
    if (stanjeIgre.krajIgre && e.key.toLowerCase() === 'r') {
        resetirajIgru();
        return;
    }
    if (stanjeIgre.krajIgre) return;
    stanjeIgre.pritisnuteTipke[e.key] = true;
}

function obradiOtpustanjeTipke(e) {
    stanjeIgre.pritisnuteTipke[e.key] = false;
}

function resetirajIgru() {
    inicijalizirajOznakeCeste();
    stanjeIgre.prepreke = [];
    stanjeIgre.rezultat = 0;
    stanjeIgre.krajIgre = false;
    stanjeIgre.igraPokrenuta = true;
    igrac.trenutnaTraka = 1;
    igrac.x = canvas.width/2 - igrac.sirina/2;
    igrac.ciljX = igrac.x;
    igrac.pomicanje = false;
    zadnjiTimestamp = 0;
    stanjeIgre.animacijaId = requestAnimationFrame(glavnaPetlja);
    provjeriAudio();
}

function azurirajAside() {
    const highscoreElement = document.getElementById('highscore');
    const listaRezultata = document.getElementById('scoreList');
    const rezultati = ucitajRezultate();
    highscoreElement.textContent = rezultati.reduce((a, b) => Math.max(a, b), 0);
    listaRezultata.innerHTML = '';
    if (rezultati.length === 0) {
        listaRezultata.innerHTML = '<li>Još nema rezultata!</li>';
    } else {
        for (let i = 0; i < Math.min(rezultati.length, 10); i++) {
            const li = document.createElement('li');
            li.textContent = rezultati[i];
            listaRezultata.appendChild(li);
        }
    }
}

setInterval(azurirajAside, 1000);

// Funkcije za pozadinsku glazbu

function pustiPozadinskuGlazbu() {
    const glazbaElem = document.getElementById('backgroundMusic');
    if (glazba) {
    glazbaElem.play();
    }
}

function zaustaviPozadinskuGlazbu() {
    const glazbaElem = document.getElementById('backgroundMusic');
    glazbaElem.pause();
    glazbaElem.currentTime = 0;
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