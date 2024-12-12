export function disableDrawing(svg, toolsContainer) {
  svg.classList.add("svg-disabled");
  toolsContainer.classList.add("submitted");
}

export function enableDrawing(svg, toolsContainer) {
  svg.classList.remove("svg-disabled");
  toolsContainer.classList.remove("submitted");
}