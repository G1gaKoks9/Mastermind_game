const CANVA = document.querySelector("#game-canva");
const CTX = CANVA.getContext("2d");
const BG_MUSIC = new Audio("sound/bg_music.mp3");
BG_MUSIC.loop = true;
const BG_WAITING_FOR_GAME_MUSIC = new Audio("sound/waiting_for_game.mp3");
BG_WAITING_FOR_GAME_MUSIC.loop = true;
const BUTTON_HOVER_SOUND = new Audio("sound/button_hover.mp3");
const CLICK_SOUND = new Audio("sound/click.mp3");
const SUBMIT_SOUND = new Audio("sound/submit.mp3");
const WIN_MUSIC = new Audio("sound/win.mp3");
const MENU_BUTTON_HOVER_SOUND1 = new Audio("sound/menu_button_hover.mp3");
const MENU_BUTTON_HOVER_SOUND2 = new Audio("sound/menu_button_hover.mp3");
const START_GAME_SOUND = new Audio("sound/start_game.mp3");
const SOUNDS = [
    BG_MUSIC,
    BG_WAITING_FOR_GAME_MUSIC,
    BUTTON_HOVER_SOUND,
    CLICK_SOUND,
    SUBMIT_SOUND,
    WIN_MUSIC, 
    MENU_BUTTON_HOVER_SOUND1,
    MENU_BUTTON_HOVER_SOUND2,
    START_GAME_SOUND
];
const SOUNDS_BASIC_VOLUMES = new Map([
    [BG_MUSIC, 0.3],
    [BG_WAITING_FOR_GAME_MUSIC, 0.4],
    [BUTTON_HOVER_SOUND, BUTTON_HOVER_SOUND.volume],
    [CLICK_SOUND, CLICK_SOUND.volume],
    [SUBMIT_SOUND, SUBMIT_SOUND.volume],
    [WIN_MUSIC, 0.5], 
    [MENU_BUTTON_HOVER_SOUND1, MENU_BUTTON_HOVER_SOUND1.volume],
    [MENU_BUTTON_HOVER_SOUND2, MENU_BUTTON_HOVER_SOUND2.volume],
    [START_GAME_SOUND, START_GAME_SOUND.volume]
]);
SOUNDS.forEach(sound => sound.volume = SOUNDS_BASIC_VOLUMES.get(sound));
WIN_MUSIC.addEventListener("play", () => { audioFadeOut(BG_MUSIC, 1000, true); });
WIN_MUSIC.addEventListener("ended", () => audioFadeIn(BG_MUSIC, SOUNDS_BASIC_VOLUMES.get(BG_MUSIC), true, 1000));

const TILE_WIDTH = 90;
const TILE_HEIGHT = TILE_WIDTH;
// red, green, blue, yellow, magenta, cyan, orange, grey
const COLORS = ["#c11", "#2c3", "#13c", "#cc2", "#c2c", "#2cc", "#c51", "#777"];

const CORRECT = new Image(); CORRECT.src = "images/correct.png";
const CORRECT_HORRIZONTAL = 60;
const CORRECT_VERTICAL = 325;
const ELSEWHERE = new Image(); ELSEWHERE.src = "images/elsewhere.png";
const ELSEWHERE_HORRIZONTAL = 70;
const ELSEWHERE_VERTICAL = 340;
const NONE = new Image(); NONE.src = "images/none.png";
const NONE_HORRIZONTAL = 55;
const NONE_VERTICAL = 335;

// Wartości są ustawiane w funkcji loadFunction()
let gamePattern;
let winPattern;
let winPatternMap = new Map();
let round;
let activeTile;
let isGameWon;
let isSolving;

let isMusicOn = true;

Array.prototype.count = function(element) {
    return this.filter(_ => _ == element).length;
}

window.addEventListener("load", loadFunction);

// Dołączenie dźwięków do najechania na przyciski interfejsu startowego
document.querySelector("#one-player-button").addEventListener("mouseenter", () => MENU_BUTTON_HOVER_SOUND1.play());
document.querySelector("#two-players-button").addEventListener("mouseenter", () => MENU_BUTTON_HOVER_SOUND2.play());

// Dołączenie dźwięku do najechania na przycisk interfejsu końcowego
document.querySelector("#new-game-button").addEventListener("mouseenter", () => {
    if ($("#winning-screen").css("opacity") == 1) MENU_BUTTON_HOVER_SOUND1.play();
});

// Dołączenie dźwięku najechania na aktywny przycisk "cofnij"
document.querySelector("#back-button").addEventListener("mouseenter", () => {
    if (document.querySelector("#back-button").classList.contains("active-control-buttons") && activeTile >= 1) BUTTON_HOVER_SOUND.play();
})

// Dołączenie dźwięku najechania na aktywny przycisk "wyczyść"
document.querySelector("#clear-button").addEventListener("mouseenter", () => {
    if (document.querySelector("#clear-button").classList.contains("active-control-buttons")) BUTTON_HOVER_SOUND.play();
})

// Dołączenie dźwięku najechania na aktywny przycisk "sprawdź"
document.querySelector("#submit-button").addEventListener("mouseenter", () => {
    if (document.querySelector("#submit-button").classList.contains("active-control-buttons")) BUTTON_HOVER_SOUND.play();
})

// Event listenery do przycisków startowych
document.querySelectorAll(".start-buttons").forEach(element => element.addEventListener("click", startGame));

// Obsłużenie kliknięcia przycisku "cofnij"
document.querySelector("#back-button").addEventListener("click", function() {
    if (document.querySelector("#back-button").classList.contains("active-control-buttons") && activeTile >= 1) {
        CLICK_SOUND.play();
        activeTile--;
        drawArrow();
        if (activeTile == 0) document.querySelector("#back-button").classList.remove("active-control-buttons");
    }
});

// Obsłużenie kliknięcia przycisku "wyczyść"
document.querySelector("#clear-button").addEventListener("click", function() {
    if (document.querySelector("#clear-button").classList.contains("active-control-buttons")) {
        CLICK_SOUND.play();
        clearBoard();
    }
});

// Obsłużenie kliknięcia przycisku "sprawdź" (lub Enter) + sprawdzenie wygranej
document.querySelector("#submit-button").addEventListener("click", submitButtonClick);
window.addEventListener("keydown", enterAsSubmitButtonClick);

// Event listener dla przycisku na ekranie końcowym
document.querySelector("#new-game-button").addEventListener("click", () => {
    if ($("#winning-screen").css("opacity") == 1) {
        CLICK_SOUND.play();
        $("#global-container").fadeOut(500);
        $("#winning-screen").animate({opacity: 0}, 500);
        setTimeout(loadFunction, 700);
    }
});

// Wykonuje się po załadowaniu strony / wciśnięciu przycisku NOWA GRA na ekranie końcowym
function loadFunction() {
    $("#winning-screen").css("display", "none");
    $("#global-container").css("filter", "blur(0)");
    $("#starting-screen").css("display", "flex");
    $("#starting-screen").animate({opacity: 1}, 500);
    $("#comment").html("Który z kolorów wstawić w miejsce oznaczone strzałką?");
    gamePattern = ["empty", "empty", "empty", "empty", "empty"];
    winPattern = [];
    winPatternMap.clear();
    round = 1;
    activeTile = 0;
    isGameWon = false;
    isSolving = false;
    SOUNDS.forEach(sound => {
        sound.pause();
        sound.currentTime = 0;
    });
}

function clearBoard() {
    gamePattern = ["empty", "empty", "empty", "empty", "empty"];
    document.querySelector("#submit-button").classList.remove("active-control-buttons");
    document.querySelector("#back-button").classList.remove("active-control-buttons");
    document.querySelector("#clear-button").classList.remove("active-control-buttons");
    activeTile = 0;

    drawEmptyBoard();
}

function drawTile(x, y, filling) {
    if (filling == "none") {
        CTX.strokeStyle = "white";
        CTX.strokeRect(x, y, TILE_WIDTH, TILE_HEIGHT);
    } else {
        CTX.fillStyle = filling;
        CTX.fillRect(x, y, TILE_WIDTH, TILE_HEIGHT);
    }
}

function drawArrow() {
    // Zakrywamy obecnie widoczną strzałkę
    CTX.fillStyle = "#000";
    CTX.fillRect(60, 140, 600, 60);

    CTX.fillStyle = "#fff";
    CTX.font = "42px Arial";
    CTX.fillText("↑", 85 + activeTile * 130, 180);
}

function drawEmptyBoard() {
    CTX.fillStyle = "#000";
    CTX.fillRect(40, 30, 640, 110);
    for (i = 0; i < gamePattern.length; i++) {
        drawTile(50 + i * 130, 40, "none");
    }
    drawArrow();
}

function colorTile() {
    if (activeTile >= 0 && activeTile <= 4) {
        CLICK_SOUND.play();
        let tileColor = this.color;

        drawTile(50 + activeTile * 130, 40, tileColor);
        gamePattern[activeTile] = tileColor;
        activeTile++;
        if (activeTile >= 5) activeTile = 4;
        drawArrow();

        if (!gamePattern.includes("empty") && isSolving) {
            document.querySelector("#submit-button").classList.add("active-control-buttons");
        }
        document.querySelector("#back-button").classList.add("active-control-buttons");
        document.querySelector("#clear-button").classList.add("active-control-buttons");
    }
}

// Obsłużenie kliknięcia przycisku "sprawdź"
function submitButtonClick() {
    if (document.querySelector("#submit-button").classList.contains("active-control-buttons")) {
        SUBMIT_SOUND.play();
        isGameWon = true;
        for (i = 0; i < gamePattern.length; i++) {
            if (gamePattern[i] != winPattern[i]) {
                isGameWon = false;
                break;
            }
        }

        if (isGameWon) {
            setTimeout(() => WIN_MUSIC.play(), 1000);
            CTX.fillStyle = "#000";
            CTX.fillRect(10, 10, 700, 200);
            CTX.fillStyle = "#e46a19";
            CTX.font = "82px Atma";
            CTX.fillText("Brawo, dobra robota!", 50, 125);

            drawSubmittedBoard();
            document.querySelector("#comment").innerHTML = "Wygrałeś w " + round + " rundzie!";

            winningScreen();
        } else {
            round++;
            drawScore();
            drawSubmittedBoard();
            clearBoard();
        }
        document.querySelector("#back-button").classList.remove("active-control-buttons");
        document.querySelector("#clear-button").classList.remove("active-control-buttons");
        document.querySelector("#submit-button").classList.remove("active-control-buttons");
    }
}

// Enter jako kliknięcie przycisku "sprawdź"
function enterAsSubmitButtonClick(event) {
    if (event.key == "Enter") {
        submitButtonClick();
    }
}

function drawSubmittedBoard() {
    winPatternMap.clear();
    winPattern.forEach(color => winPatternMap.set(color, (winPatternMap.get(color) || 0) + 1));

    CTX.fillStyle = "#000";
    CTX.fillRect(40, 200, 640, 200);
    for (i = 0; i < gamePattern.length; i++) {
        drawTile(50 + i * 130, 220, gamePattern[i]);
        if (gamePattern[i] == winPattern[i]) {
            winPatternMap.set(gamePattern[i], winPatternMap.get(gamePattern[i]) - 1);
            if (winPatternMap.get(gamePattern[i]) == 0) winPatternMap.delete(gamePattern[i]);
        }
    }

    for (i = 0; i < gamePattern.length; i++) {
        if (gamePattern[i] == winPattern[i]) CTX.drawImage(CORRECT, CORRECT_HORRIZONTAL + i * 130, CORRECT_VERTICAL);
        else if (winPatternMap.has(gamePattern[i])) CTX.drawImage(ELSEWHERE, ELSEWHERE_HORRIZONTAL + i * 130, ELSEWHERE_VERTICAL);
        else CTX.drawImage(NONE, NONE_HORRIZONTAL + i * 130, NONE_VERTICAL);
    }
}

function drawScore() {
    CTX.fillStyle = "black";
    CTX.fillRect(800, 40, 150, 200);

    CTX.strokeStyle = "#e46a19";
    CTX.beginPath();
    CTX.arc(875, 90, 50, 0, 2 * Math.PI);
    CTX.stroke();

    CTX.fillStyle = "#e46a19";
    CTX.font = "56px Arial";
    if (round < 10) CTX.fillText(round, 860, 109);
    else if (round >= 10 && round < 20) CTX.fillText(round, 843, 109);
    else CTX.fillText(round, 845, 109);

    CTX.font = "32px Liberation Sans";
    CTX.fillText("RUNDA", 820, 180);
}

/** Obsługa startu gry dla wybranego trybu gry */ 
function startGame() {
    CLICK_SOUND.play();
    if (this.getAttribute("id") === "one-player-button") {
        // Losowanie wygrywającej kombinacji
        for (i = 0; i < gamePattern.length; i++) {
            winPattern.push(COLORS[Math.round(Math.random() * 7)]);
        }

        // Ukrycie ekranu startowego i pokazanie elementów interfejsu
        $("#starting-screen").css("display", "none");
        $("#global-container").css("display", "flex");
        $("#global-container").animate({opacity: 1}, 1500);

        // Inicjalizacja płotna <canvas>
        CANVA.width = CANVA.clientWidth;
        CANVA.height = CANVA.clientHeight;

        drawEmptyBoard();
        drawScore();
        isSolving = true;
        START_GAME_SOUND.play();
        setTimeout(() => audioFadeIn(BG_MUSIC, SOUNDS_BASIC_VOLUMES.get(BG_MUSIC)), 500);
    } else if (this.getAttribute("id") === "two-players-button") {
        $("#starting-screen").css("display", "none");
        $("#global-container").css("display", "flex");
        $("#global-container").animate({opacity: 1}, 500);
        CANVA.width = CANVA.clientWidth;
        CANVA.height = CANVA.clientHeight;

        drawEmptyBoard();
        CTX.fillStyle = "#f00";
        CTX.font = "64px Liberation Sans";
        CTX.fillText("Wybierz wygrywającą sekwencję", 115, 325);
        
        settingWinPattern();
        audioFadeIn(BG_WAITING_FOR_GAME_MUSIC, 0.4);

        // Kod wykona się dopiero, gdy isSolving == true
        const IS_READY_TIMER = setInterval(() => {
            if (isSolving) {
                window.removeEventListener("keydown", startTwoPeopleMode);
                clearBoard();
                drawScore();
                $("#global-container").animate({opacity: 1}, 1500);
                START_GAME_SOUND.play();
                audioFadeOut(BG_WAITING_FOR_GAME_MUSIC, 1000, true);
                setTimeout(() => audioFadeIn(BG_MUSIC, SOUNDS_BASIC_VOLUMES.get(BG_MUSIC)), 500);
                clearInterval(IS_READY_TIMER);
            }
        }, 100);
    }

    // Dodanie event listenerów do każdego kafelka z kolorem
    for (i = 0; i < COLORS.length; i++) {
        let tile = document.querySelector("#c" + i)
        tile.style.backgroundColor = COLORS[i];
        tile.addEventListener("click", colorTile);
        tile.color = COLORS[i];
    }

    // Dodanie efektów dźwiękowych po najechaniu na kolorowe przyciski
    document.querySelectorAll(".color-controls").forEach(elem => {
        elem.addEventListener("mouseenter", () => BUTTON_HOVER_SOUND.play());
    });
}

/** Obsługa instrukcji użytkownika dla wybrania wygrywającej sekwencji dla trybu 2-osobowego */
function settingWinPattern() {
    let setingWinningPatternTimer = setTimeout(settingWinPattern, 1);
    if (winPattern.length > 0) {
        clearTimeout(setingWinningPatternTimer);
    } else {
        if (!gamePattern.includes("empty")) {
            CTX.fillStyle = "#000";
            CTX.fillRect(100, 250, 900, 150);
            CTX.fillStyle = "#f00";
            CTX.font = "64px Liberation Sans";
            CTX.fillText("Wciśnij ENTER aby zacząć grę", 130, 325);
            window.addEventListener("keydown", startTwoPeopleMode);
        }
        else {
            window.removeEventListener("keydown", startTwoPeopleMode);
            CTX.fillStyle = "#000";
            CTX.fillRect(100, 250, 900, 150);
            CTX.fillStyle = "#f00";
            CTX.font = "64px Liberation Sans";
            CTX.fillText("Wybierz wygrywającą sekwencję", 115, 325);
        }
    }
}

/** Jest aktywna tylko gdy wszystkie pola na ekranie są zapełnione kolorem
 * Startuje grę ustawiając winningPattern */
function startTwoPeopleMode(event) {
    if (event.key == "Enter") {
        winPattern = gamePattern.toSpliced(0, 0);
        CTX.fillStyle = "#000";
        CTX.fillRect(100, 250, 900, 150);
        isSolving = true;

        $("#global-container").css("opacity", "0");
    }
}

/** Obsługa ekranu końcowego */ 
function winningScreen() {
    let winScreen = $("#winning-screen");
    winScreen.css("display", "flex");
    document.querySelector("#winning-comment").innerHTML = "Wygrałeś w rundzie nr: " + round;

    setTimeout(function() {
        winScreen.animate({ opacity: 1 }, 2000);
    }, 3000);

    setTimeout(function() {
        $("#global-container").animate({ blur: 15 },
            {
                duration: 1000,
                step: function(now) {
                    $(this).css("filter", `blur(${now}px)`);
                }
            }
        );
    }, 4000);

    setTimeout(function() {
        $("#new-game-button").css("cursor", "pointer");
        $("#new-game-button").addClass("side-control-buttons");
    }, 5000);
}

// # # # # # # # # # # # # # # # # # # # # # # # FUNKCJE OBSŁUGI AUDIO # # # # # # # # # # # # # # # # # # # # # # #

function audioFadeIn(audio, targetVolume, play = true, duration = 1000) {
    audio.volume = 0;
    if (play) audio.play();

    let step = 0.01;
    let intervalTime = duration / (targetVolume / step);
    let fadeInterval = setInterval(() => {
        if (audio.volume + step >= targetVolume) {
            audio.volume = targetVolume;
            clearInterval(fadeInterval);
        } else if (isMusicOn) {
            audio.volume += step;
        } else {
            clearInterval(fadeInterval);
            audioFadeOut(audio);
        }
    }, intervalTime);
}

function audioFadeOut(audio, duration = 1000, pause = false) {
    let step = 0.01;
    let intervalTime = duration / (audio.volume / step);
    let fadeInterval = setInterval(() => {
        if (audio.volume - step <= 0) {
            audio.volume = 0;
            if (pause) audio.pause();
            clearInterval(fadeInterval);
        } else {
            audio.volume -= step;
        }
    }, intervalTime);
}

// # # # # # # # # # # # # # # # # # # # # # # # PRZYCISKÓW DŹWIĘKU  # # # # # # # # # # # # # # # # # # # # # # #

// Obsługa zdarzeń dla przycisku SOUND
let soundButton = document.querySelector("#sound-button");
let soundButtonImg = document.querySelector("#sound-button-img");
let isSoundButtonActive = true;

soundButton.addEventListener("mouseenter", () => MENU_BUTTON_HOVER_SOUND1.play());
soundButton.addEventListener("click", () => {
    if (isSoundButtonActive) {
        if (soundButtonImg.src.endsWith("sound_on.png")) {
            soundButtonImg.src = "images/sound_off.png";
            soundButtonImg.alt = "sound_off.png";
            soundButtonImg.style.marginLeft = "8%";
            
            setTimeout(() => SOUNDS.forEach(sound => {
                if (sound !== BG_MUSIC && sound !== BG_WAITING_FOR_GAME_MUSIC && sound != WIN_MUSIC)
                    sound.volume = 0;
            }), 200);
        } else {
            soundButtonImg.src = "images/sound_on.png";
            soundButtonImg.alt = "sound_on.png";
            soundButtonImg.style.marginLeft = "7%";
            
            SOUNDS.forEach(sound => {
                if (sound !== BG_MUSIC && sound !== BG_WAITING_FOR_GAME_MUSIC && sound != WIN_MUSIC)
                    sound.volume = SOUNDS_BASIC_VOLUMES.get(sound);
            });
        }
        CLICK_SOUND.play();
        isSoundButtonActive = false;
        setTimeout(() => isSoundButtonActive = true, 1000);
    }
});

// Obsługa zdarzeń dla przycisku MUSIC
let musicButton = document.querySelector("#music-button");
let musicButtonImg = document.querySelector("#music-button-img");
let isMusicButtonActive = true;

musicButton.addEventListener("mouseenter", () => MENU_BUTTON_HOVER_SOUND2.play());
musicButton.addEventListener("click", () => {
    if (isMusicButtonActive) {
        if (musicButtonImg.src.endsWith("music_on.png")) {
            musicButtonImg.src = "images/music_off.png";
            musicButtonImg.alt = "music_off.png";
            musicButtonImg.style.marginLeft = "11%";

            isMusicOn = false;
            audioFadeOut(BG_MUSIC);
            audioFadeOut(BG_WAITING_FOR_GAME_MUSIC);
            audioFadeOut(WIN_MUSIC);
        } else {
            musicButtonImg.src = "images/music_on.png";
            musicButtonImg.alt = "music_on.png";
            musicButtonImg.style.marginLeft = "13%";

            isMusicOn = true;
            audioFadeIn(BG_MUSIC, SOUNDS_BASIC_VOLUMES.get(BG_MUSIC), false, 1000);
            audioFadeIn(BG_WAITING_FOR_GAME_MUSIC, SOUNDS_BASIC_VOLUMES.get(BG_WAITING_FOR_GAME_MUSIC), false, 1000);
            audioFadeIn(WIN_MUSIC, SOUNDS_BASIC_VOLUMES.get(WIN_MUSIC), false, 1000);
        }
        CLICK_SOUND.play();
        isMusicButtonActive = false;
        setTimeout(() => isMusicButtonActive = true, 1000);
    }
});