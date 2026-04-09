// UI renderer - builds and manages the visual sequencer
import { Sequencer } from './sequencer.js';
import { zzfxPlay, getAudioContext, PRESETS } from './zzfx.js';

const PRESET_NAMES = Object.keys(PRESETS);

let seq;
let activeStep = -1;

function buildUI() {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = `
    <header class="header">
      <div class="logo">ZZ<span>SYNTH</span></div>
      <div class="transport">
        <button id="btn-play" class="btn-transport play">▶ PLAY</button>
        <button id="btn-stop" class="btn-transport stop">■ STOP</button>
        <button id="btn-clear" class="btn-ghost">CLR ALL</button>
      </div>
      <div class="bpm-control">
        <label>BPM</label>
        <input id="bpm-input" type="number" min="40" max="240" value="120" />
        <input id="bpm-slider" type="range" min="40" max="240" value="120" />
      </div>
    </header>
    <div class="grid-container">
      <div class="step-numbers">
        ${Array.from({length:16},(_,i)=>`<div class="step-num">${i+1}</div>`).join('')}
      </div>
      <div id="tracks-grid"></div>
    </div>

    <footer class="footer">
      <div class="footer-info">
        <span class="lib-tag">ZzFX ENGINE</span>
        <span class="lib-tag">WEB AUDIO API</span>
        <span class="lib-tag">NO DEPENDENCIES</span>
      </div>
      <div class="hint">Click pads to toggle · Drag BPM to change tempo · Click track name to mute</div>
    </footer>
  `;

  // Inicializamos el secuenciador pasándole el callback de actualización visual
  seq = new Sequencer((step, delay = 0) => {
    if (step === -1) {
      clearStepHighlights();
      activeStep = -1;
      return;
    }
    setTimeout(() => {
      clearStepHighlights();
      activeStep = step;
      document.querySelectorAll(`.step-pad[data-step="${step}"]`).forEach(pad => {
        pad.classList.add('current');
      });
    }, delay * 1000);
  });

  renderTracks();
  bindTransport();
}

function renderTracks() {
  const grid = document.getElementById('tracks-grid');
  if (!grid) return;
  grid.innerHTML = '';

  seq.tracks.forEach((track, ti) => {
    const row = document.createElement('div');
    row.className = 'track-row';
    row.dataset.track = ti;

    // Label + mute
    const label = document.createElement('div');
    label.className = 'track-label';
    label.dataset.track = ti;
    label.innerHTML = `
      <span class="track-name">${track.name}</span>
      <span class="mute-dot ${track.muted ? 'muted' : ''}"></span>
    `;
    label.addEventListener('click', () => {
      seq.toggleMute(ti);
      label.querySelector('.mute-dot').classList.toggle('muted', seq.tracks[ti].muted);
      row.classList.toggle('track-muted', seq.tracks[ti].muted);
    });

    // Step pads
    const pads = document.createElement('div');
    pads.className = 'pads';

    track.steps.forEach((active, si) => {
      const pad = document.createElement('button');
      pad.className = `step-pad ${active ? 'on' : ''} ${si % 4 === 0 ? 'beat-start' : ''}`;
      pad.dataset.track = ti;
      pad.dataset.step = si;
      pad.addEventListener('click', () => {
        seq.toggleStep(ti, si);
        pad.classList.toggle('on', seq.tracks[ti].steps[si]);
      });
      pads.appendChild(pad);
    });

    // Track actions
    const actions = document.createElement('div');
    actions.className = 'track-actions';

    // Preset selector
    const select = document.createElement('select');
    select.className = 'preset-select';
    PRESET_NAMES.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p;
      opt.textContent = p.toUpperCase();
      opt.selected = p === track.preset;
      select.appendChild(opt);
    });
    select.addEventListener('change', (e) => {
      seq.setPreset(ti, e.target.value);
    });

    // Preview button
    const preview = document.createElement('button');
    preview.className = 'btn-preview';
    preview.title = 'Preview sound';
    preview.textContent = '♪';
    preview.addEventListener('click', () => {
  getAudioContext().resume(); // Crucial: Los navegadores bloquean el audio hasta que interactúas
  zzfxPlay(PRESETS[seq.tracks[ti].preset]); 
});;

    // Randomize
    const rand = document.createElement('button');
    rand.className = 'btn-rand';
    rand.title = 'Randomize pattern';
    rand.textContent = '⚄';
    rand.addEventListener('click', () => {
      seq.randomizeTrack(ti);
      refreshPads(ti);
    });

    // Clear
    const clr = document.createElement('button');
    clr.className = 'btn-clr';
    clr.title = 'Clear track';
    clr.textContent = '✕';
    clr.addEventListener('click', () => {
      seq.clearTrack(ti);
      refreshPads(ti);
    });

    actions.appendChild(select);
    actions.appendChild(preview);
    actions.appendChild(rand);
    actions.appendChild(clr);

    row.appendChild(label);
    row.appendChild(pads);
    row.appendChild(actions);
    grid.appendChild(row);
  });
}

function refreshPads(trackIndex) {
  const pads = document.querySelectorAll(`.step-pad[data-track="${trackIndex}"]`);
  pads.forEach((pad, si) => {
    pad.classList.toggle('on', seq.tracks[trackIndex].steps[si]);
  });
}

function clearStepHighlights() {
  document.querySelectorAll('.step-pad.current').forEach(p => p.classList.remove('current'));
}

function bindTransport() {
  const playBtn = document.getElementById('btn-play');
  const stopBtn = document.getElementById('btn-stop');
  const clearBtn = document.getElementById('btn-clear');
  const bpmInput = document.getElementById('bpm-input');
  const bpmSlider = document.getElementById('bpm-slider');

  playBtn.addEventListener('click', () => {
    getAudioContext().resume();
    seq.start();
    playBtn.classList.add('active');
  });

  stopBtn.addEventListener('click', () => {
    seq.stop();
    playBtn.classList.remove('active');
  });

  clearBtn.addEventListener('click', () => {
    seq.clearAll();
    document.querySelectorAll('.step-pad').forEach(p => p.classList.remove('on'));
  });

  bpmInput.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    seq.setBpm(val);
    bpmSlider.value = val;
  });

  bpmSlider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    seq.setBpm(val);
    bpmInput.value = val;
  });
}

export { buildUI };