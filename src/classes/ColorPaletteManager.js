import { elements } from '../elements.js';

export class ColorPaletteManager {
  constructor(drawing) {
    this.drawing = drawing;
    this.bindEvents();
  }

  bindEvents() {
    elements.colorButtons.forEach((button) => {
      button.addEventListener("click", (e) => this.handleColorSelect(e));
      button.addEventListener("touchstart", (e) => this.handleColorSelect(e, true));
    });
  }

  handleColorSelect(e, isTouch = false) {
    if (isTouch) e.preventDefault();
    elements.colorButtons.forEach((b) => b.classList.remove("selected"));
    e.target.classList.add("selected");
    this.drawing.setColor(e.target.dataset.color);
  }
}
