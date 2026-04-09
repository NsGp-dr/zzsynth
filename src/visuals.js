// src/visuals.js
import { getAnalyser } from './zzfx.js';

let canvas, ctx, analyser;
let dataArray;
let isVisualizing = false;

export function initVisuals() {
  canvas = document.getElementById('visualizer');
  if (!canvas) return;
  ctx = canvas.getContext('2d');
  analyser = getAnalyser();
  const bufferLength = analyser.frequencyBinCount;
  dataArray = new Uint8Array(bufferLength);
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

export function startVisualization() {
  if (isVisualizing) return;
  isVisualizing = true;
  drawLoop();
}

export function stopVisualization() {
  isVisualizing = false;
}

function drawLoop() {
  if (!isVisualizing) return;
  requestAnimationFrame(drawLoop);

  analyser.getByteTimeDomainData(dataArray);

  // 1. Limpieza con trail
  ctx.fillStyle = 'rgba(10, 10, 18, 0.15)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  
  // Definimos los radios claramente para evitar errores de referencia
  const baseRadius = Math.min(centerX, centerY) * 0.5;
  const perspective = baseRadius * 1.5; 

  // 2. Intensidad
  let sum = 0;
  for (let i = 0; i < dataArray.length; i++) {
    sum += Math.abs(dataArray[i] - 128);
  }
  const avgIntensity = sum / dataArray.length;
  const intensityFactor = Math.min(1, avgIntensity / 40);

  // 3. Estilo
  const baseHue = (Date.now() / 50) % 360;
  const color = `hsla(${baseHue}, 100%, ${50 + intensityFactor * 30}%, 0.8)`;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5 + intensityFactor * 3;
  ctx.shadowBlur = 10 + intensityFactor * 20;
  ctx.shadowColor = color;

  // 4. Geometría Esférica 3D
  // Reducimos la cantidad de puntos para asegurar rendimiento
  const points = [];
  const latLines = 12; // Latitud
  const lonLines = 24; // Longitud

  for (let i = 0; i <= latLines; i++) {
    const lat = (i * Math.PI) / latLines;
    const sinLat = Math.sin(lat);
    const cosLat = Math.cos(lat);

    for (let j = 0; j <= lonLines; j++) {
      const lon = (j * 2 * Math.PI) / lonLines;
      const sinLon = Math.sin(lon);
      const cosLon = Math.cos(lon);

      // Usamos el audio para deformar el radio
      const dataIndex = (i * lonLines + j) % dataArray.length;
      const audioVal = (dataArray[dataIndex] - 128) / 128.0;
      
      // Movimiento del centro hacia afuera
      const dynamicRadius = baseRadius * (1 + intensityFactor * 0.4) + (audioVal * 30);

      // Coordenadas 3D
      const x3d = dynamicRadius * sinLat * cosLon;
      const y3d = dynamicRadius * sinLat * sinLon;
      const z3d = dynamicRadius * cosLat;

      // Proyección 2D simple
      const scale = perspective / (perspective + z3d);
      const x2d = centerX + x3d * scale;
      const y2d = centerY + y3d * scale;

      points.push({ x: x2d, y: y2d, z: z3d });
    }
  }

  // 5. Dibujo de la malla
  ctx.beginPath();
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    // Solo dibujamos líneas si no es el final de una fila de longitud
    if (i % (lonLines + 1) !== 0) {
      ctx.moveTo(points[i - 1].x, points[i - 1].y);
      ctx.lineTo(p.x, p.y);
    }
  }
  ctx.stroke();

  // 6. Brillo central (Efecto esfera sólida)
  const grad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, baseRadius);
  grad.addColorStop(0, `hsla(${baseHue}, 100%, 70%, ${0.1 + intensityFactor * 0.2})`);
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.arc(centerX, centerY, baseRadius * (1 + intensityFactor), 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
}