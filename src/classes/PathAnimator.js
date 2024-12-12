import { ANIMATION_SETTINGS } from '../config/constants.js';

export class PathAnimator {
  static getPathPoints(path, pointDensity = ANIMATION_SETTINGS.pointDensity) {
    const length = path.getTotalLength();
    const numPoints = Math.max(1, Math.floor(length * pointDensity));
    const points = [];

    for (let i = 0; i <= numPoints; i++) {
      const point = path.getPointAtLength(length * (i / numPoints));
      points.push({ x: point.x, y: point.y });
    }
    return points;
  }

  static animate(pathElement) {
    const originalPoints = this.getPathPoints(pathElement);
    const offsets = originalPoints.map(() => ({ x: 0, y: 0 }));
    const speeds = originalPoints.map(() => ({
      x: Math.random() * 2 - 1,
      y: Math.random() * 2 - 1,
    }));

    const animate = () => {
      offsets.forEach((offset, i) => {
        offset.x += speeds[i].x * 0.2;
        offset.y += speeds[i].y * 0.2;

        if (Math.abs(offset.x) > 2) speeds[i].x *= -1;
        if (Math.abs(offset.y) > 2) speeds[i].y *= -1;
      });

      let d = `M${originalPoints[0].x + offsets[0].x},${originalPoints[0].y + offsets[0].y}`;
      for (let i = 1; i < originalPoints.length; i++) {
        const x = originalPoints[i].x + offsets[i].x;
        const y = originalPoints[i].y + offsets[i].y;
        const prevX = originalPoints[i - 1].x + offsets[i - 1].x;
        const prevY = originalPoints[i - 1].y + offsets[i - 1].y;
        const cpX = (prevX + x) / 2;
        const cpY = (prevY + y) / 2;
        d += ` Q${prevX},${prevY} ${cpX},${cpY}`;
      }

      pathElement.setAttribute("d", d);
      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }
}