import { elements } from "../elements.js";

export class ScoreManager {
  constructor() {
    this.score = 0;
    this.onScoreChange = () => {};
    this.setupEventListeners();
  }

  setupEventListeners() {
    elements.gainPointButton.addEventListener("click", () => {
      this.increment();
    });

    elements.losePointButton.addEventListener("click", () => {
      this.decrement();
    });
  }

  setOnScoreChange(callback) {
    this.onScoreChange = callback;
  }

  updateDisplay() {
    elements.scoreDisplay.textContent = `Score: ${this.score}`;
  }

  increment() {
    this.score++;
    this.updateDisplay();
    this.onScoreChange();
  }

  decrement() {
    this.score--;
    this.updateDisplay();
    this.onScoreChange();
  }

  showButtons() {
    elements.gainPointButton.style.display = "inline-block";
    elements.losePointButton.style.display = "inline-block";
  }

  hideButtons() {
    elements.gainPointButton.style.display = "none";
    elements.losePointButton.style.display = "none";
  }
}