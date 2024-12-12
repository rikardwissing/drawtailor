export function svgToWebp(svg) {
  return new Promise((resolve) => {
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
      // Convert to WebP with quality 0.8
      resolve(canvas.toDataURL("image/webp", 0.8));
    };
    img.src = url;
  });
}