import { PathAnimator } from './PathAnimator.js';
import { elements } from '../elements.js';

export class Drawing {
  constructor(networkManager) {
    this.isDrawing = false;
    this.brushColor = "#000000";
    this.brushSize = 5;
    this.currentPath = null;
    this.isTouch = false;
    this.previousCoords = null;
    this.hasDrawn = false;
    this.networkManager = networkManager;
    this.paths = [];

    this.bindEvents();
  }

  bindEvents() {
    elements.svg.addEventListener("pointerdown", this.handlePointerDown.bind(this));
    elements.svg.addEventListener("pointermove", this.handlePointerMove.bind(this));
    elements.svg.addEventListener("pointerup", this.handlePointerUp.bind(this));
  }

  handlePointerDown(e) {
    if (!this.isTouch) {
      e.target.setPointerCapture(e.pointerId);
      const coords = this.getCoordinates(e);
      this.startNewPath(coords);
      this.addPointToPath(coords);
    }
  }

  handlePointerMove(e) {
    if (!this.isTouch) {
      const coords = this.getCoordinates(e);
      this.addPointToPath(coords);
    }
  }

  handlePointerUp(e) {
    if (!this.isTouch) {
      e.target.releasePointerCapture(e.pointerId);
      this.finishPath();
    }
  }

  getCoordinates(e) {
    const rect = elements.svg.getBoundingClientRect();
    const scaleX = rect.width / elements.svg.viewBox.baseVal.width;
    const scaleY = rect.height / elements.svg.viewBox.baseVal.height;

    if (e.touches) {
      const touch = e.touches[0];
      return {
        offsetX: (touch.clientX - rect.left) / scaleX,
        offsetY: (touch.clientY - rect.top) / scaleY,
      };
    }
    return {
      offsetX: (e.clientX - rect.left) / scaleX,
      offsetY: (e.clientY - rect.top) / scaleY,
    };
  }

  startNewPath(coords) {
    this.isDrawing = true;
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    this.currentPath = this.createNewPath();
    this.currentPath.setAttribute("d", `M${coords.offsetX},${coords.offsetY}`);
    elements.svg.appendChild(this.currentPath);
    this.paths.push(this.currentPath);
    this.previousCoords = coords;
    
    if (!this.hasDrawn) {
      this.hasDrawn = true;
      elements.doneButton.disabled = false;
      elements.clearButton.disabled = false;
    }
  }

  createNewPath() {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("stroke", this.brushColor);
    path.setAttribute("stroke-width", this.brushSize);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    path.setAttribute("pointer-events", "none");
    return path;
  }

  addPointToPath(coords) {
    if (!this.isDrawing || !this.currentPath || !this.previousCoords) return;

    const midX = (this.previousCoords.offsetX + coords.offsetX) / 2;
    const midY = (this.previousCoords.offsetY + coords.offsetY) / 2;
    const d = this.currentPath.getAttribute("d");
    const newD = `${d} Q${this.previousCoords.offsetX},${this.previousCoords.offsetY} ${midX},${midY}`;
    this.currentPath.setAttribute("d", newD);
    
    if (this.networkManager) {
      this.networkManager.sendDrawingUpdate({
        pathData: newD,
        color: this.brushColor,
        width: this.brushSize
      });
    }

    this.previousCoords = coords;
  }

  finishPath() {
    if (this.networkManager) {
      this.networkManager.sendDrawingUpdate({
        type: 'PATH_END',
        color: this.brushColor,
        width: this.brushSize
      });
    }

    this.isDrawing = false;
    document.body.style.overflow = "";
    document.body.style.touchAction = "";
    this.currentPath = null;
    this.isTouch = false;
    this.previousCoords = null;
  }

  animateAllPaths() {
    const paths = Array.from(elements.svg.getElementsByTagName("path"));
    paths.forEach(path => PathAnimator.animate(path));
  }

  clear() {
    while (elements.svg.firstChild) {
      elements.svg.removeChild(elements.svg.firstChild);
    }
    this.hasDrawn = false;
    elements.doneButton.disabled = true;
    elements.clearButton.disabled = true;
  }

  setColor(color) {
    this.brushColor = color;
  }

  // Add getter for hasDrawn state
  getHasDrawn() {
    return this.hasDrawn;
  }

  updateFromNetwork(data) {
    console.log({data});
    if (data.type === 'PATH_END') {
      this.currentPath = null;
      return;
    }

    if (!this.currentPath) {
      this.currentPath = this.createNewPath();
      if (data.color) this.currentPath.setAttribute("stroke", data.color);
      if (data.width) this.currentPath.setAttribute("stroke-width", data.width);
      elements.svg.appendChild(this.currentPath);
      this.paths.push(this.currentPath);
    }
    this.currentPath.setAttribute("d", data.pathData);
  }
}