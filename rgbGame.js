'use strict';

// ************ GLOBAL VARIABLES ************

// Constants/Settings
var DEVELOPER_MODE = false,
    STANDARD_BACKGROUND_COLOR = "SteelBlue",
    HINT_PROBABILITY = 0.5,
    MIN_LEVEL = 2,
    FIRST_QUILT_MODE_ROWCOUNT = 13,
    BASIC_COLORS = ["red", "green", "blue"];

// DOM Elements
var BODY = document.querySelector("body"),
    HEADER = document.querySelector("#header"),
    H1 = document.querySelector("#header h1"),
    COLOR_CONTAINER = document.querySelector("#color-container"),
    WHITE_BAR = document.querySelector("#white-bar"),
    STATS = document.querySelector("#stats"),
    MSG_AREA = document.querySelector("#messageArea"),
    MESSAGE = document.querySelector("#message"),
    LEVEL_DISPLAY = document.querySelector("#level"),
    LEVEL_UP_BTN = document.querySelector(".level-spinner .icon-up-open"),
    LEVEL_DOWN_BTN = document.querySelector(".level-spinner .icon-down-open"),
    WIN_COUNT = document.querySelector("#winCount"),
    LOSS_COUNT = document.querySelector("#lossCount"),
    RED_DISPLAY = document.querySelector("#winningColor .redVal"),
    GREEN_DISPLAY = document.querySelector("#winningColor .greenVal"),
    BLUE_DISPLAY = document.querySelector("#winningColor .blueVal"),
    NEW_GAME_BTN = document.querySelector("#newGameBtn"),
    INFO_BTN = document.querySelector("#learnMore"),
    INFO = document.querySelector("#info-screen"),
    FLASH = document.querySelector("#flash"),
    WIN_ICON = document.querySelector("#winUp"),
    LOSE_ICON = document.querySelector("#lossUp"),
    STATS_SWITCH_ICON = document.querySelector("#stats .icon-exchange");

// Other variables
var currentLevel = MIN_LEVEL,
    highestLevel = MIN_LEVEL,
    newLevelUnlocked = false,
    optionCount = countFromLevel(MIN_LEVEL),
    remaining = optionCount,
    rowCount = MIN_LEVEL,
    winningColor,
    winningColorArr,
    hints,
    winMsg = "You win!",
    newLevelMsg = "You won and unlocked the next level!",
    gameOver = false,
    colors = [],
    squares = [],
    winningIndex = 0,
    winCount = 0,
    lossCount = 0,
    mouseDown = false,
    shiftDown = false;

var MESSAGES = [
    "Click the color described by the RGB code above.",
    "RGB stands for Red, Green, Blue.",
    "Hints sometimes appear up here.",
    "Beating the hardest level will unlock a harder one.",
    "You won't be able to unlock higher levels just by guessing.",
    "You can click here to reveal stats and options.",
    "How high of a level can you beat?",
    "Unsure? It helps to eliminate the ones you know are wrong.",
    "Red and green in equal amounts make yellow.",
    "Green and blue in equal amounts make cyan.",
    "Red and blue in equal amounts make magenta.",
    "If red, green and blue are equal it makes a shade of gray.",
    "If all the numbers are high, it will be very light.",
    "To start a new game, you can also click the screen.",
    "You always can switch to an easier level if it gets too difficult.",
    "To turn off auto-advance, just change off the hardest level.",
    "You can eliminate squares with a right-click or a shift+left-click.",
    "Bold colors have both a low value and a high value in the RGB code.",
    "You can shift+click and drag to easily eliminate many squares.",
    "Click the info button to find out about how this was made.",
    "Hit the space or N keys at any time to start a new game."
];

// ************ STATIC FUNCTIONS ************

function randInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

function rgbComponents(c) {
    c = c.split(",");
    var RGB = [];
    RGB[0] = Number(c[0].slice(4));
    RGB[1] = Number(c[1]);
    RGB[2] = Number(c[2].replace(")", ""));
    RGB[3] = c[3] ? Number(parseFloat(c[3])) : -1;
    return RGB;
}

function getRandomColor() {
    var r = randInt(0, 255);
    var g = randInt(0, 255);
    var b = randInt(0, 255);
    return "rgb(" + r + ", " + g + ", " + b + ")";
}

function countFromLevel(level) {
    return level * level;
}

// ************ FUNCTIONS USING GLOBAL VARS ************

function initialize() {

    setHeights();

    LEVEL_DISPLAY.value = currentLevel;

    createEventListeners();

    newGame();
}

//Dynamically sets height/width of square container
function setHeights() {
    var heightBelowHeader = (window.innerHeight - HEADER.clientHeight);
    INFO.style.height = heightBelowHeader + "px";
    var ccStyle = window.getComputedStyle(COLOR_CONTAINER);
    var ccPaddingTop = ccStyle.getPropertyValue("padding-top");
    var ccPaddingBottom = ccStyle.getPropertyValue("padding-bottom");
    var paddingNum = +ccPaddingTop.replace(/\D+$/g, "");
    paddingNum += +ccPaddingBottom.replace(/\D+$/g, "");
    heightBelowHeader = (heightBelowHeader - paddingNum) + "px";
    COLOR_CONTAINER.style.height = heightBelowHeader;
    COLOR_CONTAINER.style.width = heightBelowHeader;

}

function createEventListeners() {

    document.addEventListener("mousedown", function(ev) {
        if (ev.button === 0) {
            mouseDown = true;
        }
    });

    document.addEventListener("mouseup", function(ev) {
        if (ev.button === 0) {
            mouseDown = false;
        }
    });

    document.addEventListener("keydown", function(ev) {
        var key = ev.key.toLowerCase();

        switch (key) {
            case "shift":
                shiftDown = true;
                break;
            case " ":
            case "n":
                newGame();
                break;
            case "arrowup":
                ev.stopPropagation();
                changeLevel(1);
                break;
            case "arrowdown":
                ev.stopPropagation();
                changeLevel(-1);
        }
    });

    document.addEventListener("keyup", function(ev) {

        if (ev.key === "Shift") {
            shiftDown = false;
            arrangeSquares();
        }
    });

    window.addEventListener("resize", setHeights);

    BODY.addEventListener("contextmenu", function(ev) {
        ev.preventDefault();
    });

    WHITE_BAR.addEventListener("click", function() {
        if (!gameOver) {
            toggleWhiteBarView();
        }
    });

    COLOR_CONTAINER.addEventListener("click", function() {
        if (gameOver && !shiftDown) {
            newGame();
        }
    });

    HEADER.addEventListener("contextmenu", function(ev) {
        ev.stopPropagation();
    });

    NEW_GAME_BTN.addEventListener("click", function(ev) {
        ev.stopPropagation();
        newGame();
    });

    INFO_BTN.addEventListener("click", function(ev) {
        ev.stopPropagation();
        toggleInfoScreen();
    });

    LEVEL_UP_BTN.addEventListener("click", function(ev) {
        ev.stopPropagation();
        changeLevel(1);
    });

    LEVEL_DOWN_BTN.addEventListener("click", function(ev) {
        ev.stopPropagation();
        changeLevel(-1);
    });

    INFO.addEventListener("contextmenu", function(ev) {
        ev.stopPropagation();
    });
}

function toggleWhiteBarView() {
    updateWhiteBar();
    STATS.classList.toggle("hidden");
    MSG_AREA.classList.toggle("hidden");
}

function displayStats() {
    if (STATS.classList.contains("hidden")) {
        toggleWhiteBarView();
    } else {
        updateWhiteBar();
    }
}

function displayMessage() {
    if (MSG_AREA.classList.contains("hidden")) {
        toggleWhiteBarView();
    } else {
        updateWhiteBar();
    }
}

function updateWhiteBar() {
    WIN_COUNT.textContent = winCount;
    LOSS_COUNT.textContent = lossCount;
    if (squares.length === optionCount && winCount === 0) {
        MESSAGE.textContent = MESSAGES[0];
    } else {
        MESSAGE.textContent = squares.length + " left. " + getRandomMessage();
    }
}

function getRandomMessage() {
    var msg;
    if (Math.random() < HINT_PROBABILITY) {
        msg = hint();
    } else {
        msg = MESSAGES[randInt(0, MESSAGES.length - 1)];
    }
    return msg;
}

function hint() {
    return hints[randInt(0, hints.length - 1)];
}

function createHints() {
    var rgbArr2 = winningColorArr.slice();
    var maxIndex = winningColorArr.indexOf(Math.max(rgbArr2[0], rgbArr2[1], rgbArr2[2]));
    var midIndex = winningColorArr.indexOf(Math.max(rgbArr2[0], rgbArr2[1]));
    rgbArr2.splice(midIndex, 1);
    var minIndex = winningColorArr.indexOf(rgbArr2[0]);
    var boldRating = winningColorArr[maxIndex] - winningColorArr[minIndex];
    var maxHint = "This color sure has a lot of " + BASIC_COLORS[maxIndex] + ".";
    var minHint = "I'm not sure what color this is, but it's not " + BASIC_COLORS[minIndex] + ".";
    var boldHint =
        (boldRating >= 256 * 0.8) ? "This color is pretty bold." :
        (boldRating <= 256 * 0.2) ? "This color is pretty bland." : "";
    hints = [maxHint, minHint, boldHint];
}

function eliminate(el) {
    el.classList.add("eliminated");
    remaining--;
    var index = squares.indexOf(el);
    squares.splice(index, 1);
    arrangeSquares();
    if (!gameOver && squares.length === 1) {
        win(squares[0]);
    }
    if (!gameOver) {
        displayMessage();
    }
}

function win(el) {
    gameOver = true;
    winCount++;
    var isTrying = lossCount * currentLevel / optionCount <= winCount;
    if (isTrying && currentLevel === highestLevel) {
        addNewLevel();
    }
    el.classList.add("winner");
    WIN_ICON.classList.remove("hidden");
    H1.style.backgroundColor = winningColor;
    if (squares.length > 1) {
        var index = squares.indexOf(el);
        for (var i = squares.length - 1; i >= 0; i--) {
            if (i === index) {
                continue;
            }
            eliminate(squares[i]);
        }
    }
    var textField = squares[0].querySelector(".winText");
    textField.textContent = newLevelUnlocked ? newLevelMsg : winMsg;
    textField.classList.remove("hidden");
    squares[0].querySelector(".squareText").classList.remove("hidden");
    endGame();
    flash();
}

function lose(el) {
    var i,
        l = squares.length,
        winnerFound = false;
    lossCount++;
    endGame();
    el.classList.add("loser");
    flash("red");
    LOSE_ICON.classList.remove("hidden");

    for (i = 0; i < l; i++) {
        var rgbStr = squares[i].style.backgroundColor;
        if (!winnerFound && rgbStr === winningColor) {
            squares[i].classList.add("winner");
            winnerFound = true;
        } else if (rowCount <= 11) {
            var rgbArr = rgbComponents(rgbStr);
            squares[i].querySelector(".redVal").textContent = rgbArr[0];
            squares[i].querySelector(".greenVal").textContent = rgbArr[1];
            squares[i].querySelector(".blueVal").textContent = rgbArr[2];
            squares[i].querySelector(".squareRGB").classList.remove("hidden");
            squares[i].querySelector(".squareText").classList.remove("hidden");
        }
        squares[i].classList.add("noTransform");
    }
    gameOver = true;
}

// includes functions that trigger in both win and loss conditions
function endGame() {
    displayStats();
    STATS_SWITCH_ICON.classList.add("hidden");
}

function addNewLevel() {
    highestLevel++;
    newLevelUnlocked = true;
}

function changeLevel(n) {
    var newLevel = currentLevel + n;
    if (DEVELOPER_MODE || (newLevel <= highestLevel && newLevel >= MIN_LEVEL)) {
        currentLevel = newLevel;
        newGame();
    }
}

function arrangeSquares() {
    var i,
        l,
        eliminated,
        margin,
        availWidth,
        width,
        height;
    if (!shiftDown || remaining === 1) {
        if (remaining <= Math.pow(rowCount - 1, 2)) {
            eliminated = COLOR_CONTAINER.querySelectorAll(".eliminated");
            l = eliminated.length;
            for (i = 0; i < l; i++) {
                eliminated[i].classList.remove("eliminated");
                eliminated[i].classList.add("hidden");
            }
        }

        rowCount = Math.ceil(Math.sqrt(squares.length));
        if (rowCount >= FIRST_QUILT_MODE_ROWCOUNT) {
            margin = 0;
            availWidth = 100;
        } else {
            margin = "1%";
            availWidth = 100 - (2 * rowCount);
        }
        width = availWidth / rowCount;
        height = width;
        l = squares.length;
        for (i = 0; i < l; i++) {
            squares[i].style.width = width + "%";
            squares[i].style.height = height + "%";
            squares[i].style.margin = margin;
        }
    }
}

function buildSquaresHTML() {
    var i;
    var squareHTML = "";
    for (i = 0; i < optionCount; i++) {
        squareHTML +=
            '<div class="square">' +
            '<div class="squareText">' +
            '<div class="winText"></div>' +
            '<div class="squareRGB">' +
            '<div class="redVal"></div>' +
            '<div class="greenVal"></div>' +
            '<div class="blueVal"></div>' +
            '</div>' +
            '</div>' +
            '</div>';
    }
    COLOR_CONTAINER.innerHTML = squareHTML;
}

function buildSquaresArr() {
    var i, l;
    var els = document.querySelectorAll("#color-container .square");
    squares = [];

    l = els.length;
    for (i = 0; i < l; i++) {
        squares[i] = els[i];
    }
}

function buildSquares() {
    var i, l;
    colors = [];
    optionCount = countFromLevel(currentLevel);
    remaining = optionCount;
    buildSquaresHTML();
    buildSquaresArr();

    l = squares.length;
    for (i = 0; i < l; i++) {
        squares[i].addEventListener("click", onLeftClick);
        squares[i].addEventListener("contextmenu", onRightClick);
        squares[i].addEventListener("mouseover", dragOnOff);
        squares[i].addEventListener("mouseout", dragOnOff);
        squares[i].addEventListener("mousedown", dragOnOff);
    }
}


function newGame() {

    var i, l;
    var textFieldArray;

    gameOver = false;
    if (newLevelUnlocked) {
        currentLevel = highestLevel;
        newLevelUnlocked = false;
    }
    LEVEL_DISPLAY.textContent = currentLevel;
    LOSE_ICON.classList.add("hidden");
    WIN_ICON.classList.add("hidden");
    buildSquares();
    textFieldArray = document.querySelectorAll(".squareText");
    l = textFieldArray.length;
    for (i = 0; i < l; i++) {
        textFieldArray[i].querySelector(".winText").classList.add("hidden");
        textFieldArray[i].querySelector(".squareRGB").classList.add("hidden");
        textFieldArray[i].classList.add("hidden");
    }
    buildSquaresArr();
    winningIndex = randInt(0, optionCount);
    winningColor = getRandomColor();
    winningColorArr = rgbComponents(winningColor);
    createHints();
    for (i = 0; i < optionCount; i++) {
        if (i === winningIndex) {
            colors[i] = winningColor;
        } else {
            colors[i] = getRandomColor();
        }
        squares[i].style.backgroundColor = colors[i];
    }
    RED_DISPLAY.textContent = winningColorArr[0];
    GREEN_DISPLAY.textContent = winningColorArr[1];
    BLUE_DISPLAY.textContent = winningColorArr[2];
    arrangeSquares();
    H1.style.backgroundColor = STANDARD_BACKGROUND_COLOR;
    STATS_SWITCH_ICON.classList.remove("hidden");
    displayMessage();
}

function dragOnOff(ev) {

    if (shiftDown && (mouseDown || ev.type === "mousedown")) {
        onRightClick(ev);
    }
}

function onLeftClick(ev) {

    ev.stopPropagation();
    var el = ev.currentTarget;
    if (el.classList.contains("eliminated")) {
        return;
    }
    if (ev.shiftKey) {
        onRightClick(ev);
        return;
    }
    if (!gameOver) {
        if (el.style.backgroundColor === winningColor) {
            win(el);
        } else {
            lose(el);
        }
    } else if (!shiftDown) {
        newGame();
    }
}

function onRightClick(ev) {

    var el = ev.currentTarget;

    ev.preventDefault();
    if (el.classList.contains("eliminated")) {
        return;
    }
    if (!gameOver) {
        if (el.style.backgroundColor === winningColor) {
            lose(el);
        } else {
            eliminate(el);
        }
    }
}

function flash(color, el) {
    if (!color) {
        color = "White";
    }
    if (!el) {
        el = FLASH;
    }
    el.style.backgroundColor = color;
    el.classList.add("elementToFadeInAndOut");
    setTimeout(function() {
        el.classList.remove("elementToFadeInAndOut");
    }, 500);
}

function toggleInfoScreen() {
    COLOR_CONTAINER.classList.toggle("hidden");
    INFO.classList.toggle("hidden");
    INFO_BTN.classList.toggle("icon-info");
    INFO_BTN.classList.toggle("icon-squares");
}

// ************ CODE ************

initialize();