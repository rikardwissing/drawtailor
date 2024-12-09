const svg = document.getElementById("drawingSvg");
const clearButton = document.getElementById("clearButton");
const colorPicker = document.getElementById("colorPicker");
const brushSizeInput = document.getElementById("brushSize");
const interpretButton = document.getElementById("interpretButton");
const aiResult = document.getElementById("aiResult");

// Remove saveButton, interpretButton, savedImage references and their event listeners
const doneButton = document.getElementById("doneButton");

// Remove the newDrawingButton reference
// const newDrawingButton = document.getElementById("newDrawingButton");
const toolsContainer = document.querySelector(".tools");

// Add after initial constants
const drawingPrompt = document.getElementById("drawingPrompt");

// Add after initial constants
const guessContainer = document.getElementById("guessContainer");

// Add new button references and score tracking
const gainPointButton = document.getElementById("gainPointButton");
const losePointButton = document.getElementById("losePointButton");
const scoreDisplay = document.getElementById("scoreDisplay");
let currentScore = 0;

// Disable drawing initially
svg.classList.add('svg-disabled');
toolsContainer.classList.add('submitted');

// Drawing settings
let isDrawing = false;
let brushColor = colorPicker.value;
let brushSize = parseInt(brushSizeInput.value, 10);
let currentPath = null;
let isTouch = false;
let previousCoords = null;

// Event listeners
svg.addEventListener("mousedown", (e) => {
  if (!isTouch) startDrawing(e);
});
svg.addEventListener("mousemove", (e) => {
  if (!isTouch) draw(e);
});
svg.addEventListener("mouseup", (e) => {
  if (!isTouch) stopDrawing(e);
});
svg.addEventListener("mouseout", (e) => {
  if (!isTouch) stopDrawing(e);
});

// Add touch event listeners
svg.addEventListener("touchstart", handleTouchStart);
svg.addEventListener("touchmove", handleTouchMove);
svg.addEventListener("touchend", stopDrawing);
svg.addEventListener("touchcancel", stopDrawing);

colorPicker.addEventListener("change", (e) => {
  brushColor = e.target.value;
});

brushSizeInput.addEventListener("change", (e) => {
  brushSize = e.target.value;
});

clearButton.addEventListener("click", clearCanvas);
doneButton.addEventListener("click", finishMasterpiece);

// Remove this event listener
// newDrawingButton.addEventListener("click", startNewDrawing);

// Add new event listeners for score buttons
gainPointButton.addEventListener("click", () => {
  currentScore++;
  startNewDrawing();
});

losePointButton.addEventListener("click", () => {
  currentScore--;
  startNewDrawing();
});

// Functions
function getCoordinates(e) {
  if (e.touches) {
    // Touch event
    const touch = e.touches[0];
    const rect = svg.getBoundingClientRect();
    return {
      offsetX: touch.clientX - rect.left,
      offsetY: touch.clientY - rect.top,
    };
  }
  return {
    offsetX: e.offsetX,
    offsetY: e.offsetY,
  };
}

function startDrawing(e) {
  isDrawing = true;
  brushColor = colorPicker.value;
  brushSize = parseInt(brushSizeInput.value, 10);
  const coords = getCoordinates(e);

  // Create a new path for the stroke
  currentPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  currentPath.setAttribute("stroke", brushColor);
  currentPath.setAttribute("stroke-width", brushSize);
  currentPath.setAttribute("fill", "none");
  currentPath.setAttribute("stroke-linecap", "round"); // Add rounded caps
  currentPath.setAttribute("stroke-linejoin", "round"); // Add rounded joins
  currentPath.setAttribute("d", `M${coords.offsetX},${coords.offsetY}`); // Move to starting point
  currentPath.setAttribute("pointer-events", "none"); // Prevent path from capturing events

  svg.appendChild(currentPath);

  previousCoords = coords; // Initialize previous coordinates
}

function draw(e) {
  if (!isDrawing || !currentPath) return;

  const coords = getCoordinates(e);

  if (previousCoords) {
    // Calculate the midpoint for the Bezier control point
    const midX = (previousCoords.offsetX + coords.offsetX) / 2;
    const midY = (previousCoords.offsetY + coords.offsetY) / 2;

    // Add quadratic Bezier curve to the path
    const d = currentPath.getAttribute("d");
    currentPath.setAttribute(
      "d",
      `${d} Q${previousCoords.offsetX},${previousCoords.offsetY} ${midX},${midY}`
    );
  }

  previousCoords = coords; // Update previous coordinates
}

// Add these utility functions
function getPathPoints(path, pointDensity = 0.1) { // Points per pixel
  const length = path.getTotalLength();
  const numPoints = Math.max(1, Math.floor(length * pointDensity)); // At least 10 points
  const points = [];
  
  for (let i = 0; i <= numPoints; i++) {
    const point = path.getPointAtLength(length * (i / numPoints));
    points.push({ x: point.x, y: point.y });
  }
  return points;
}

function animatePath(pathElement) {
  const originalPoints = getPathPoints(pathElement, 0.1); // 1 point per 10 pixels
  const offsets = originalPoints.map(() => ({ x: 0, y: 0 }));
  const speeds = originalPoints.map(() => ({ x: Math.random() * 2 - 1, y: Math.random() * 2 - 1 }));
  
  function animate() {
    // Update offsets with some random movement
    offsets.forEach((offset, i) => {
      offset.x += speeds[i].x * 0.2;
      offset.y += speeds[i].y * 0.2;
      
      // Bounce effect
      if (Math.abs(offset.x) > 2) speeds[i].x *= -1;
      if (Math.abs(offset.y) > 2) speeds[i].y *= -1;
    });

    // Construct new path data
    let d = `M${originalPoints[0].x + offsets[0].x},${originalPoints[0].y + offsets[0].y}`;
    for (let i = 1; i < originalPoints.length; i++) {
      const x = originalPoints[i].x + offsets[i].x;
      const y = originalPoints[i].y + offsets[i].y;
      const prevX = originalPoints[i-1].x + offsets[i-1].x;
      const prevY = originalPoints[i-1].y + offsets[i-1].y;
      
      // Use quadratic bezier curves for smooth transitions
      const cpX = (prevX + x) / 2;
      const cpY = (prevY + y) / 2;
      d += ` Q${prevX},${prevY} ${cpX},${cpY}`;
    }
    
    pathElement.setAttribute('d', d);
    requestAnimationFrame(animate);
  }
  
  requestAnimationFrame(animate);
}

// Remove canvas-related code from stopDrawing
function stopDrawing(e) {
  isDrawing = false;
  currentPath = null;
  isTouch = false;
  previousCoords = null;
}

function clearCanvas() {
  // Clear all drawn paths (elements)
  while (svg.firstChild) {
    svg.removeChild(svg.firstChild);
  }
}

// Remove saveDrawing and interpretDrawing functions

function svgToWebp(svg) {
  return new Promise((resolve) => {
    // Create canvas with white background
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const svgSize = svg.getBoundingClientRect();
    
    // Set canvas size to match SVG
    canvas.width = svgSize.width;
    canvas.height = svgSize.height;
    
    // Draw white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Convert SVG to data URL
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(svgBlob);
    
    // Draw SVG on canvas
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      // Convert to WebP with quality 0.8 (good balance between size and quality)
      resolve(canvas.toDataURL('image/webp', 0.8));
    };
    img.src = url;
  });
}

function disableDrawing() {
  svg.classList.add('svg-disabled');
  toolsContainer.classList.add('submitted');
}

function enableDrawing() {
  svg.classList.remove('svg-disabled');
  toolsContainer.classList.remove('submitted');
  doneButton.disabled = false;
}

// Add new function to get drawing prompt
function getDrawingPrompt() {
    return fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer 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"
        },
        body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "You are a fun drawing game host. Suggest one simple, creative, and fun thing to draw. Keep it to one short sentence. Make it easy enough to draw! Output it like, draw a ...."
                },
                {
                    role: "user",
                    content: "Give me something fun to draw!"
                }
            ],
            max_tokens: 50
        })
    })
    .then(response => response.json())
    .then(data => data.choices[0].message.content);
}

// Modify startNewDrawing function
function startNewDrawing() {
    clearCanvas();
    updateScore();
    hideScoreButtons();

    drawingPrompt.textContent = "Getting your challenge...";
    
    getDrawingPrompt().then(prompt => {
        drawingPrompt.textContent = "Your challenge: " + prompt;
        enableDrawing();
    });

    // Remove old guesses when starting new round
    while (guessContainer.firstChild) {
      guessContainer.removeChild(guessContainer.firstChild);
    }
}

// Replace showGuessesSequentially function with this version
function showGuessesSequentially(guesses, index = 0, onComplete = null) {
  if (index >= guesses.length) {
    if (onComplete) onComplete();
    return;
  }

  const guess = document.createElement('div');
  guess.className = 'guess';
  guess.textContent = guesses[index].trim();
  
  // Temporarily append to measure text width
  guess.style.visibility = 'hidden';
  guessContainer.appendChild(guess);
  const textWidth = guess.offsetWidth;
  const textHeight = guess.offsetHeight;
  
  const svgHeight = 400;
  const svgWidth = 600;
  const padding = 40;
  
  // Position guesses in corners with some random offset
  let x, y;
  const randomOffset = 20; // Small random offset for variation
  let rotation = -15;

  switch(index) {
    case 0: // Top left
      x = padding + Math.random() * randomOffset;
      y = padding + Math.random() * randomOffset;
      rotation = -15
      break;
    case 1: // Top right
      x = svgWidth - padding - textWidth - Math.random() * randomOffset;
      y = padding + Math.random() * randomOffset;
      rotation = 15
      break;
    case 2: // Bottom left
      x = padding + Math.random() * randomOffset;
      y = svgHeight - padding - textHeight - Math.random() * randomOffset;
      rotation = 15
      break;
    case 3: // Bottom right
      x = svgWidth - padding - textWidth - Math.random() * randomOffset;
      y = svgHeight - padding - textHeight - Math.random() * randomOffset;
      rotation = -15
      break;
  }
  
  // Rest of the function remains the same...
  guess.style.visibility = 'visible';
  Object.assign(guess.style, {
    left: `${x}px`,
    top: `${y}px`,
    transform: `rotate(${rotation}deg) scale(0.5)`,
    opacity: '0'
  });

  // Rest of animation code remains the same
  let wobblePhase = 0;
  let fadeInComplete = false;
  
  function animate() {
    wobblePhase += 0.1;
    const wobble = Math.sin(wobblePhase) * 1; // Reduced wobble amplitude
    const scale = fadeInComplete ? 1 + Math.sin(wobblePhase * 0.5) * 0.03 : 0.5 + (1 - 0.5) * guess.style.opacity;
    
    guess.style.transform = `rotate(${rotation + wobble}deg) scale(${scale})`;
    
    if (!fadeInComplete) {
      const newOpacity = parseFloat(guess.style.opacity) + 0.02;
      guess.style.opacity = newOpacity;
      
      if (newOpacity >= 1) {
        fadeInComplete = true;
        // Increased delay between guesses
        setTimeout(() => showGuessesSequentially(guesses, index + 1, onComplete), 400);
      }
    }
    
    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}

document.addEventListener('DOMContentLoaded', () => {
  startNewDrawing();
});


function finishMasterpiece() {
  isDrawing = false;
  doneButton.disabled = true;
  disableDrawing();
  
  const paths = Array.from(svg.getElementsByTagName('path'));
  paths.forEach(animatePath);
  
  // Convert SVG to WebP before sending to API
  svgToWebp(svg).then(webpData => {
    fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer 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"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are playing a drawing guessing game. Give 4 different guesses about what the drawing might be. Each answer should just be a word or a phrase. Make each guess fun and enthusiastic! Format output with one guess per line. Only answer with the guesses. Do not add any number or dashes to prefix the guess."
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: webpData
                }
              }
            ]
          }
        ],
        max_tokens: 150
      })
    })
    .then(response => response.json())
    .then(data => {
      const guesses = data.choices[0].message.content.split('\n');
      showGuessesSequentially(guesses, 0, showScoreButtons);
    });
  });
}

// Touch event handlers
function handleTouchStart(e) {
  e.preventDefault(); // Prevent scrolling
  isTouch = true;
  startDrawing(e);
}

function handleTouchMove(e) {
  e.preventDefault(); // Prevent scrolling
  draw(e);
}

function updateScore() {
  scoreDisplay.textContent = `Score: ${currentScore}`;
}

function showScoreButtons() {
  gainPointButton.style.display = 'inline-block';
  losePointButton.style.display = 'inline-block';
}

// Modify the hideScoreButtons function to reset the game
function hideScoreButtons() {
  gainPointButton.style.display = 'none';
  losePointButton.style.display = 'none';
  // Start new drawing automatically when hiding score buttons
}