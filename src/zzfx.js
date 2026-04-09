// src/zzfx.js
// ZzFX - Zuper Zmall Zound Zynth 

let audioCtx;
let analyser;
let gainNode;

export function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Cadena: Source -> Gain -> Analyser -> Destination
    gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
    
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 1024; 
    
    gainNode.connect(analyser);
    analyser.connect(audioCtx.destination);
  }
  
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  
  return audioCtx;
}

export function getAnalyser() {
  getAudioContext();
  return analyser;
}

export function zzfxPlay(params) {
  const ctx = getAudioContext();
  if (ctx.state !== 'running') return;

  // IMPORTANTE: Aseguramos que params sea un array simple
  const data = Array.isArray(params[0]) ? params[0] : params;

  const buffer = zzfxB(...data);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  
  // Conectar al gainNode para que pase por el analizador
  source.connect(gainNode);
  
  source.start();
  return source;
}

export function zzfxB(...params) {
  return buildBuffer(...params);
}

function buildBuffer(
  volume = 1, randomness = 0.05, frequency = 220, attack = 0, sustain = 0.1,
  release = 0.1, shape = 0, shapeCurve = 1, slide = 0, deltaSlide = 0,
  pitchJump = 0, pitchJumpTime = 0, repeatTime = 0, noise = 0, modulation = 0,
  bitCrush = 0, delay = 0, sustainVolume = 1, decay = 0, tremolo = 0
) {
  const ctx = getAudioContext();
  const sampleRate = ctx.sampleRate;

  let startSlide = (slide *= (500 * Math.PI * Math.PI * 2) / sampleRate / sampleRate);
  let startFreq = (frequency *= (1 + randomness * 2 * Math.random() - randomness) * Math.PI * 2 / sampleRate);
  let t = 0, tm = 0, i = 0, r = 0, s = 0, f, length;

  attack = attack * sampleRate + 9;
  decay = decay * sampleRate;
  sustain = sustain * sampleRate;
  release = release * sampleRate;
  delay = delay * sampleRate;
  deltaSlide = deltaSlide * Math.PI * 2 / sampleRate ** 3;
  modulation = modulation * 2 * Math.PI / sampleRate;
  pitchJump = pitchJump * Math.PI * 2 / sampleRate;
  pitchJumpTime = pitchJumpTime * sampleRate;
  repeatTime = repeatTime * sampleRate | 0;

  length = attack + decay + sustain + release + delay | 0;
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  for (; i < length; i++) {
    tm = i < attack ? i / attack :
         i < attack + decay ? 1 - ((i - attack) / decay) * (1 - sustainVolume) :
         i < attack + decay + sustain ? sustainVolume :
         i < length - delay ? (length - i - delay) / release * sustainVolume : 0;

    f = frequency += slide += deltaSlide;
    t += f + f * modulation * Math.sin(i * modulation);

    let sample = Math.sin(t);
    sample = shape > 1 ? (sample > 0 ? 1 : -1) :
             shape > 0 ? Math.abs(sample) ** shapeCurve :
             shape < -1 ? Math.random() * 2 - 1 :
             Math.cos(t * shapeCurve);

    let out = sample * tm * volume * (1 - noise * Math.random());
    
    if (bitCrush && !(i % (bitCrush | 0))) s = out;
    data[i] = bitCrush ? s : out;

    if (repeatTime && !(++r % repeatTime)) {
      frequency = startFreq;
      slide = startSlide;
    }
    if (pitchJumpTime && i === pitchJumpTime) {
      frequency += pitchJump;
      startFreq += pitchJump;
    }
  }

  return buffer;
}

export const PRESETS = {
  kick: [2, 0.05, 130, 0, 0.05, 0.2, 1, 1.5, -40, 5, 0, 0, 0, 0, 0, 0, 0, 0.7, 0.02, 0],
  snare: [1.5, 0.1, 180, 0, 0.02, 0.15, 1, 0.5, 2, 0, 0, 0, 0, 0.3, 0, 0, 0, 0.8, 0.05, 0],
  hihat: [0.8, 0.05, 800, 0, 0.005, 0.05, 3, 1, 0, 0, 0, 0, 0, 0.5, 0, 0, 0, 1, 0.02, 0],
  openhat: [0.8, 0.05, 800, 0, 0.005, 0.2, 3, 1, 0, 0, 0, 0, 0, 0.5, 0, 0, 0, 1, 0.02, 0],
  clap: [1.2, 0.1, 600, 0, 0.01, 0.1, 3, 0.5, 0, 0, 0, 0, 0, 0.8, 0, 0, 0, 0.9, 0.02, 0],
  bass: [1.5, 0.05, 80, 0, 0.05, 0.2, 0, 1.5, -5, 0, 0, 0, 0, 0, 0, 0, 0, 0.8, 0.05, 0],
  lead: [1, 0.05, 440, 0, 0.05, 0.15, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.8, 0.05, 0],
  blip: [1, 0.02, 880, 0, 0.01, 0.08, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0.01, 0],
};
export const PARAM_NAMES = [
  'volume', 'randomness', 'frequency', 'attack', 'sustain', 'release',
  'shape', 'shapeCurve', 'slide', 'deltaSlide', 'pitchJump', 'pitchJumpTime',
  'repeatTime', 'noise', 'modulation', 'bitCrush', 'delay',
  'sustainVolume', 'decay', 'tremolo'
];
