import './style.css';
import { buildUI } from './ui.js';
// NUEVO: Importar las funciones visuales
import { initVisuals, startVisualization, stopVisualization } from './visuals.js';
import { getAudioContext } from './zzfx.js';

// No necesitamos DOMContentLoaded para módulos de Vite
// Pero necesitamos una interacción del usuario para el AudioContext

buildUI();

// NUEVO: Inicializar el canvas al cargar
initVisuals();

// Modificar los listeners del transporte para activar/desactivar la visualización
// Esto requiere que tus botones en ui.js tengan IDs accesibles.

// Buscamos los botones que creó buildUI()
const playBtn = document.getElementById('btn-play');
const stopBtn = document.getElementById('btn-stop');

if (playBtn) {
  playBtn.addEventListener('click', () => {
    // 1. Despertar audio
    getAudioContext().resume();
    // 2. Arrancar visualización
    startVisualization();
    // El secuenciador se arranca dentro del listener original en ui.js
  });
}

if (stopBtn) {
  stopBtn.addEventListener('click', () => {
    // Parar visualización
    stopVisualization();
    // El secuenciador se para dentro del listener original en ui.js
  });
}