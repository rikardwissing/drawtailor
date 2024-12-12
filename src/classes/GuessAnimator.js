import { elements } from "../elements.js";

export class GuessAnimator {
  showSequentially(guesses, index = 0, onComplete = null) {
    if (index >= guesses.length) {
      if (onComplete) onComplete();
      return;
    }

    const guess = document.createElement("div");
    guess.className = "guess";
    guess.textContent = guesses[index].trim();

    // Setup initial state
    guess.style.visibility = "hidden";
    elements.guessContainer.appendChild(guess);
    const textWidth = guess.offsetWidth;
    const textHeight = guess.offsetHeight;

    // Calculate dimensions and positions
    const svgRect = elements.svg.getBoundingClientRect();
    const svgHeight = svgRect.height;
    const svgWidth = svgRect.width;
    const padding = Math.min(svgWidth, svgHeight) * 0.067;
    const randomOffset = padding / 2;
    let rotation = -15;

    // Position guess based on index
    const [x, y] = this.calculatePosition(index, svgWidth, svgHeight, padding, textWidth, textHeight, randomOffset);

    guess.style.visibility = "visible";
    Object.assign(guess.style, {
      left: `${x}px`,
      top: `${y}px`,
      transform: `rotate(${rotation}deg) scale(0.5)`,
      opacity: "0",
    });

    this.animateGuess(guess, rotation, () => 
      this.showSequentially(guesses, index + 1, onComplete)
    );
  }

  calculatePosition(index, width, height, padding, textWidth, textHeight, randomOffset) {
    switch (index) {
      case 0: return [padding + Math.random() * randomOffset, padding + Math.random() * randomOffset];
      case 1: return [width - padding - textWidth - Math.random() * randomOffset, padding + Math.random() * randomOffset];
      case 2: return [padding + Math.random() * randomOffset, height - padding - textHeight - Math.random() * randomOffset];
      case 3: return [width - padding - textWidth - Math.random() * randomOffset, height - padding - textHeight - Math.random() * randomOffset];
      default: return [padding, padding];
    }
  }

  animateGuess(guess, rotation, onComplete) {
    let wobblePhase = 0;
    let fadeInComplete = false;

    const animate = () => {
      wobblePhase += 0.1;
      const wobble = Math.sin(wobblePhase) * 1;
      const scale = fadeInComplete
        ? 1 + Math.sin(wobblePhase * 0.5) * 0.03
        : 0.5 + (1 - 0.5) * guess.style.opacity;

      guess.style.transform = `rotate(${rotation + wobble}deg) scale(${scale})`;

      if (!fadeInComplete) {
        const newOpacity = parseFloat(guess.style.opacity) + 0.02;
        guess.style.opacity = newOpacity;

        if (newOpacity >= 1) {
          fadeInComplete = true;
          setTimeout(onComplete, 400);
        }
      }

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }
}