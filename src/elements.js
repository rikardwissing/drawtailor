export let elements = {};

export function initializeElements() {
    elements.svg = document.getElementById("drawingSvg");
    elements.clearButton = document.getElementById("clearButton");
    elements.doneButton = document.getElementById("doneButton");
    elements.toolsContainer = document.querySelector(".tools");
    elements.drawingPrompt = document.getElementById("drawingPrompt");
    elements.guessContainer = document.getElementById("guessContainer");
    elements.gainPointButton = document.getElementById("gainPointButton");
    elements.losePointButton = document.getElementById("losePointButton");
    elements.scoreDisplay = document.getElementById("scoreDisplay");
    elements.colorButtons = document.querySelectorAll(".color-button");

    // Network UI elements
    elements.networkUI = document.getElementById('networkUI');
    elements.gameUI = document.getElementById('gameUI');
    elements.lobby = document.getElementById('lobby');
    elements.playerName = document.getElementById('playerName');
    elements.peerId = document.getElementById('peerId');
    elements.roomInput = document.getElementById('roomInput');
    elements.createRoomButton = document.getElementById('createRoom');
    elements.joinRoomButton = document.getElementById('joinRoom');
    elements.startGameButton = document.getElementById('startGame');
    elements.playerList = document.getElementById('playerList');
}
