const svg = document.getElementById("drawingSvg");
const clearButton = document.getElementById("clearButton");
// Remove brushSizeInput constant
const interpretButton = document.getElementById("interpretButton");
const doneButton = document.getElementById("doneButton");
// const newDrawingButton = document.getElementById("newDrawingButton");
const toolsContainer = document.querySelector(".tools");
const drawingPrompt = document.getElementById("drawingPrompt");
const guessContainer = document.getElementById("guessContainer");
const gainPointButton = document.getElementById("gainPointButton");
const losePointButton = document.getElementById("losePointButton");
const scoreDisplay = document.getElementById("scoreDisplay");
let currentScore = 0;

let hasDrawn = false; // Add this with other state variables at the top

// Disable drawing initially
svg.classList.add("svg-disabled");
toolsContainer.classList.add("submitted");

// Drawing settings
let isDrawing = false;
let brushColor = "#000000"; // Default color
let brushSize = 5; // Fixed brush size
let currentPath = null;
let isTouch = false;
let previousCoords = null;

// Event listeners
svg.addEventListener("pointerdown", (e) => {
  if (!isTouch) {
    e.target.setPointerCapture(e.pointerId);
    startDrawing(e);
    draw(e);
  }
});
svg.addEventListener("pointermove", (e) => {
  if (!isTouch) draw(e);
});
svg.addEventListener("pointerup", (e) => {
  if (!isTouch) {
    e.target.releasePointerCapture(e.pointerId);
    stopDrawing(e);
  }
});

// Replace colorPicker event listener with new color palette handler
document.querySelectorAll('.color-button').forEach(button => {
  button.addEventListener('click', (e) => {
    document.querySelectorAll('.color-button').forEach(b => b.classList.remove('selected'));
    e.target.classList.add('selected');
    brushColor = e.target.dataset.color;
  });
});

// Add touch handling for the color buttons
document.querySelectorAll('.color-button').forEach(button => {
  button.addEventListener('touchstart', (e) => {
    e.preventDefault();
    document.querySelectorAll('.color-button').forEach(b => b.classList.remove('selected'));
    e.target.classList.add('selected');
    brushColor = e.target.dataset.color;
  });
});

// Remove brushSizeInput event listener

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
  const rect = svg.getBoundingClientRect();
  const scaleX = rect.width / svg.viewBox.baseVal.width;
  const scaleY = rect.height / svg.viewBox.baseVal.height;
  
  if (e.touches) {
    const touch = e.touches[0];
    return {
      offsetX: (touch.clientX - rect.left) / scaleX,
      offsetY: (touch.clientY - rect.top) / scaleY
    };
  }
  return {
    offsetX: (e.clientX - rect.left) / scaleX,
    offsetY: (e.clientY - rect.top) / scaleY
  };
}

function startDrawing(e) {
  isDrawing = true;
  document.body.style.overflow = 'hidden'; // Prevent scrolling
  document.body.style.touchAction = 'none'; // Prevent touch actions
  brushColor = document.querySelector('.color-button.selected').dataset.color;
  // Remove brushSize input parsing
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
  
  if (!hasDrawn) {
    hasDrawn = true;
    doneButton.disabled = false;
    clearButton.disabled = false;
  }

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
function getPathPoints(path, pointDensity = 0.1) {
  // Points per pixel
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
  const speeds = originalPoints.map(() => ({
    x: Math.random() * 2 - 1,
    y: Math.random() * 2 - 1,
  }));

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
    let d = `M${originalPoints[0].x + offsets[0].x},${
      originalPoints[0].y + offsets[0].y
    }`;
    for (let i = 1; i < originalPoints.length; i++) {
      const x = originalPoints[i].x + offsets[i].x;
      const y = originalPoints[i].y + offsets[i].y;
      const prevX = originalPoints[i - 1].x + offsets[i - 1].x;
      const prevY = originalPoints[i - 1].y + offsets[i - 1].y;

      // Use quadratic bezier curves for smooth transitions
      const cpX = (prevX + x) / 2;
      const cpY = (prevY + y) / 2;
      d += ` Q${prevX},${prevY} ${cpX},${cpY}`;
    }

    pathElement.setAttribute("d", d);
    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}

// Remove canvas-related code from stopDrawing
function stopDrawing(e) {
  isDrawing = false;
  document.body.style.overflow = ''; // Restore scrolling
  document.body.style.touchAction = ''; // Restore touch actions
  currentPath = null;
  isTouch = false;
  previousCoords = null;
}

function clearCanvas() {
  // Clear all drawn paths (elements)
  while (svg.firstChild) {
    svg.removeChild(svg.firstChild);
  }
  hasDrawn = false;
  doneButton.disabled = true;
  clearButton.disabled = true;
}

// Remove saveDrawing and interpretDrawing functions

function svgToWebp(svg) {
  return new Promise((resolve) => {
    // Create canvas with white background
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const svgSize = svg.getBoundingClientRect();

    // Set canvas size to match SVG
    canvas.width = svgSize.width;
    canvas.height = svgSize.height;

    // Draw white background
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Convert SVG to data URL
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml" });
    const url = URL.createObjectURL(svgBlob);

    // Draw SVG on canvas
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      // Convert to WebP with quality 0.8 (good balance between size and quality)
      resolve(canvas.toDataURL("image/webp", 0.8));
    };
    img.src = url;
  });
}

function disableDrawing() {
  svg.classList.add("svg-disabled");
  toolsContainer.classList.add("submitted");
}

function enableDrawing() {
  svg.classList.remove("svg-disabled");
  toolsContainer.classList.remove("submitted");
  doneButton.disabled = true; // Always start with disabled submit button
  clearButton.disabled = true; // Always start with disabled submit button
  hasDrawn = false;
}

const mockChallenges = [
  "Draw a happy cloud",
  "Draw a dancing cat",
  "Draw a silly monster",
  "Draw a magic wand",
  "Draw a flying pizza",
];

const mockGuesses = [
  ["A fluffy cloud!", "Cotton candy", "A dream bubble", "A floating sheep"],
  ["A ballet dancer", "A jumping cat", "A disco star", "A party animal"],
  ["A fuzzy beast", "A friendly alien", "A goofy creature", "A weird dragon"],
  [
    "A sparkly stick",
    "A wizard's wand",
    "A magical branch",
    "A glowing scepter",
  ],
  [
    "A flying saucer",
    "A levitating pizza",
    "A space snack",
    "A floating feast",
  ],
];

const urlParams = new URLSearchParams(window.location.search);
const apiKey = urlParams.get("key");
const useMockData = !apiKey;

if (useMockData) {
  alert(
    "No API key provided - using mock data instead, you can add your openai API key as a URL parameter: ?key=your-key-here"
  );
}

function getDrawingPrompt() {
  if (useMockData) {
    const randomIndex = Math.floor(Math.random() * mockChallenges.length);
    return Promise.resolve(mockChallenges[randomIndex]);
  }
  return fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a fun drawing game host. Suggest one simple, creative, and fun thing to draw. Keep it to one short sentence. Make it easy enough to draw! Output it like, draw a ....",
        },
        {
          role: "user",
          content: "Give me something fun to draw!",
        },
      ],
      max_tokens: 50,
    }),
  })
    .then((response) => response.json())
    .then((data) => data.choices[0].message.content);
}

function startNewDrawing() {
  clearCanvas();
  updateScore();
  hideScoreButtons();

  drawingPrompt.textContent = "Getting your challenge...";

  getDrawingPrompt().then((prompt) => {
    drawingPrompt.textContent = "Your challenge: " + prompt;
    enableDrawing();
  });

  while (guessContainer.firstChild) {
    guessContainer.removeChild(guessContainer.firstChild);
  }
}

function showGuessesSequentially(guesses, index = 0, onComplete = null) {
  if (index >= guesses.length) {
    if (onComplete) onComplete();
    return;
  }

  const guess = document.createElement("div");
  guess.className = "guess";
  guess.textContent = guesses[index].trim();

  guess.style.visibility = "hidden";
  guessContainer.appendChild(guess);
  const textWidth = guess.offsetWidth;
  const textHeight = guess.offsetHeight;

  // Get actual SVG dimensions
  const svgRect = svg.getBoundingClientRect();
  const svgHeight = svgRect.height;
  const svgWidth = svgRect.width;
  
  // Make padding proportional to SVG size (using same ratio as original 40/600 ≈ 0.067)
  const padding = Math.min(svgWidth, svgHeight) * 0.067;

  let x, y;
  const randomOffset = padding / 2; // Scale random offset with padding
  let rotation = -15;

  switch (index) {
    case 0:
      x = padding + Math.random() * randomOffset;
      y = padding + Math.random() * randomOffset;
      rotation = -15;
      break;
    case 1:
      x = svgWidth - padding - textWidth - Math.random() * randomOffset;
      y = padding + Math.random() * randomOffset;
      rotation = 15;
      break;
    case 2:
      x = padding + Math.random() * randomOffset;
      y = svgHeight - padding - textHeight - Math.random() * randomOffset;
      rotation = 15;
      break;
    case 3:
      x = svgWidth - padding - textWidth - Math.random() * randomOffset;
      y = svgHeight - padding - textHeight - Math.random() * randomOffset;
      rotation = -15;
      break;
  }

  guess.style.visibility = "visible";
  Object.assign(guess.style, {
    left: `${x}px`,
    top: `${y}px`,
    transform: `rotate(${rotation}deg) scale(0.5)`,
    opacity: "0",
  });

  let wobblePhase = 0;
  let fadeInComplete = false;

  function animate() {
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
        setTimeout(
          () => showGuessesSequentially(guesses, index + 1, onComplete),
          400
        );
      }
    }

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}

document.addEventListener("DOMContentLoaded", () => {
  svg.style.touchAction = 'none';
  startNewDrawing();
});

function finishMasterpiece() {
  isDrawing = false;
  doneButton.disabled = true;
  disableDrawing();

  const paths = Array.from(svg.getElementsByTagName("path"));
  paths.forEach(animatePath);

  if (useMockData) {
    const randomIndex = Math.floor(Math.random() * mockGuesses.length);
    showGuessesSequentially(mockGuesses[randomIndex], 0, showScoreButtons);
    return;
  }

  svgToWebp(svg).then((webpData) => {
    fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are playing a drawing guessing game. Give 4 different guesses about what the drawing might be. Each answer should just be a word or a phrase. Make each guess fun and enthusiastic! Format output with one guess per line. Only answer with the guesses. Do not add any number or dashes to prefix the guess.",
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: webpData,
                },
              },
            ],
          },
        ],
        max_tokens: 150,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        const guesses = data.choices[0].message.content.split("\n");
        showGuessesSequentially(guesses, 0, showScoreButtons);
      });
  });
}

// Update handleTouchStart to prevent double-firing on mobile
function handleTouchStart(e) {
  e.preventDefault();
  e.stopPropagation();
  if (e.touches.length === 1) {
    isTouch = true;
    startDrawing(e);
  }
}

function handleTouchMove(e) {
  e.preventDefault();
  e.stopPropagation();
  draw(e);
}

function updateScore() {
  scoreDisplay.textContent = `Score: ${currentScore}`;
}

function showScoreButtons() {
  gainPointButton.style.display = "inline-block";
  losePointButton.style.display = "inline-block";
}

function hideScoreButtons() {
  gainPointButton.style.display = "none";
  losePointButton.style.display = "none";
}
