import { Drawing } from "./classes/Drawing.js";
import { GuessAnimator } from "./classes/GuessAnimator.js";
import { ScoreManager } from "./classes/ScoreManager.js";
import { ColorPaletteManager } from "./classes/ColorPaletteManager.js";
import { API } from "./api.js";
import { disableDrawing, enableDrawing } from "./utils/domUtils.js";
import { elements, initializeElements } from "./elements.js";
import { P2PNetworkManager } from "./classes/P2PNetworkManager.js";

class App {
  constructor() {
    initializeElements();

    this.networkManager = new P2PNetworkManager((state) =>
      this.handleNetworkState(state)
    );
    this.networkManager.initialize();
    this.setupInitialUI();
  }

  showNetworkUI() {
    elements.networkUI.style.display = "block";
    elements.lobby.style.display = "none";
    elements.gameUI.style.display = "none";
  }

  showLobbyUI() {
    elements.networkUI.style.display = "none";
    elements.lobby.style.display = "block";
    elements.gameUI.style.display = "none";
  }

  showGameUI() {
    elements.networkUI.style.display = "none";
    elements.lobby.style.display = "none";
    elements.gameUI.style.display = "block";
  }

  setupInitialUI() {
    elements.createRoomButton.onclick = () => {
      const name = elements.playerName.value;
      if (!name) return;

      this.networkManager.setPlayerName(name);
      const roomId = this.networkManager.createRoom();
      elements.roomInput.value = roomId;

      this.showLobbyUI();
    };

    elements.joinRoomButton.onclick = () => {
      const name = elements.playerName.value;
      const hostId = elements.roomInput.value;
      if (!name || !hostId) return;

      this.networkManager.setPlayerName(name);
      this.networkManager.joinRoom(hostId);

      this.showLobbyUI();
    };

    elements.startGameButton.onclick = () => {
      if (this.networkManager.isHost) {
        this.networkManager.broadcastGameStart();
        this.handleNetworkState({ type: "GAME_START" });
      }
    };

    this.showNetworkUI();
  }

  handleNetworkState(state) {
    switch (state.type) {
      case "LOBBY_STATE":
        this.updateLobbyUI(state.players);
        break;
      case "GAME_START":
        console.log("Game starting!");
        this.showGameUI();
        this.initializeComponents();
        this.setupEventListeners();
        this.startNewGame();
        break;
      case "DRAWING_UPDATE":
        if (state.senderId !== this.networkManager.peerId) {
          this.drawing.updateFromNetwork(state.pathData);
        }
        break;
    }
  }

  updateLobbyUI(players) {
    elements.playerList.innerHTML = "";

    players.forEach(([playerId, player]) => {
      const div = document.createElement("div");
      div.className = "player-list-item";
      div.textContent = player.name;
      if (player.isHost) {
        div.innerHTML += '<span class="host-badge">Host</span>';
      }
      elements.playerList.appendChild(div);
    });
  }

  initializeComponents() {
    // Initialize components using elements
    this.drawing = new Drawing(this.networkManager);
    this.colorPalette = new ColorPaletteManager(this.drawing);
    this.guessAnimator = new GuessAnimator();
    this.scoreManager = new ScoreManager();
    this.api = new API(this.getApiKey());
    this.scoreManager.setOnScoreChange(() => this.startNewGame());

    // Initial UI state
    elements.svg.style.touchAction = "none";
    disableDrawing(elements.svg, elements.toolsContainer);
  }

  setupEventListeners() {
    elements.clearButton.addEventListener("click", () => this.drawing.clear());
    elements.doneButton.addEventListener("click", () => this.finishDrawing());
    // Score button listeners removed as they're now in ScoreManager
  }

  async startNewGame() {
    this.drawing.clear();
    this.scoreManager.hideButtons();
    enableDrawing(
      elements.svg,
      elements.toolsContainer,
      elements.doneButton,
      elements.clearButton
    );

    elements.drawingPrompt.textContent = "Getting your challenge...";
    const prompt = await this.api.getDrawingPrompt();
    elements.drawingPrompt.textContent = "Your challenge: " + prompt;

    while (elements.guessContainer.firstChild) {
      elements.guessContainer.removeChild(elements.guessContainer.firstChild);
    }
  }

  async finishDrawing() {
    disableDrawing(elements.svg, elements.toolsContainer);
    this.drawing.animateAllPaths();
    const guesses = await this.api.getGuesses(elements.svg);
    this.guessAnimator.showSequentially(guesses, 0, () =>
      this.scoreManager.showButtons()
    );
  }

  getApiKey() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("key");
  }
}

// Initialize app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => new App());
