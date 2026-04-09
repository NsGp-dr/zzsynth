// Sequencer engine
// Manages timing, steps, and tracks

import { zzfxPlay, getAudioContext, PRESETS } from './zzfx.js';

const STEPS = 16;
const DEFAULT_BPM = 120;

export class Sequencer {
  constructor(onStep) {
    this.bpm = DEFAULT_BPM;
    this.playing = false;
    this.currentStep = 0;
    this.onStep = onStep; // callback(stepIndex)
    this._intervalId = null;
    this._nextStepTime = 0;
    this._lookahead = 0.1; // seconds
    this._scheduleInterval = 50; // ms

    // 8 tracks, each with 16 steps (on/off) and a sound preset
    this.tracks = [
      { name: 'KICK',    preset: 'kick',    steps: new Array(STEPS).fill(false), muted: false },
      { name: 'SNARE',   preset: 'snare',   steps: new Array(STEPS).fill(false), muted: false },
      { name: 'HI-HAT',  preset: 'hihat',   steps: new Array(STEPS).fill(false), muted: false },
      { name: 'OPEN HH', preset: 'openhat', steps: new Array(STEPS).fill(false), muted: false },
      { name: 'CLAP',    preset: 'clap',    steps: new Array(STEPS).fill(false), muted: false },
      { name: 'BASS',    preset: 'bass',    steps: new Array(STEPS).fill(false), muted: false },
      { name: 'LEAD',    preset: 'lead',    steps: new Array(STEPS).fill(false), muted: false },
      { name: 'BLIP',    preset: 'blip',    steps: new Array(STEPS).fill(false), muted: false },
    ];

    // Default pattern
    this.tracks[0].steps = [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0].map(Boolean);
    this.tracks[1].steps = [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0].map(Boolean);
    this.tracks[2].steps = [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0].map(Boolean);
    this.tracks[6].steps = [0,0,1,0, 0,0,0,1, 0,0,1,0, 0,1,0,0].map(Boolean);
  }

  get stepDuration() {
    return (60 / this.bpm) / 4; // 16th notes
  }

  start() {
    if (this.playing) return;
    this.playing = true;
    const ctx = getAudioContext();
    this._nextStepTime = ctx.currentTime + 0.05;
    this._scheduleLoop();
  }

  stop() {
    this.playing = false;
    clearTimeout(this._intervalId);
    this.currentStep = 0;
    this.onStep(-1);
  }

  _scheduleLoop() {
    if (!this.playing) return;
    const ctx = getAudioContext();

    while (this._nextStepTime < ctx.currentTime + this._lookahead) {
      this._scheduleStep(this.currentStep, this._nextStepTime);
      this._nextStepTime += this.stepDuration;
      this.currentStep = (this.currentStep + 1) % STEPS;
    }

    this._intervalId = setTimeout(() => this._scheduleLoop(), this._scheduleInterval);
  }

  _scheduleStep(step, time) {
    const ctx = getAudioContext();
    const delay = Math.max(0, time - ctx.currentTime);
    
    // UI
    this.onStep(step, delay);

    // Audio
    // Dentro de sequencer.js -> _scheduleStep
    // Dentro de sequencer.js -> _scheduleStep
    this.tracks.forEach(track => {
      if (track.steps[step] && !track.muted) {
        const presetData = PRESETS[track.preset];
        
        // Usamos el setTimeout para el timing visual y sonoro
        setTimeout(() => {
          zzfxPlay(presetData);
        }, Math.max(0, delay * 1000));
      }
    });
  }

  toggleStep(trackIndex, stepIndex) {
    this.tracks[trackIndex].steps[stepIndex] = !this.tracks[trackIndex].steps[stepIndex];
  }

  toggleMute(trackIndex) {
    this.tracks[trackIndex].muted = !this.tracks[trackIndex].muted;
  }

  setPreset(trackIndex, presetName) {
    this.tracks[trackIndex].preset = presetName;
  }

  setBpm(bpm) {
    this.bpm = Math.max(40, Math.min(240, bpm));
  }

  clearTrack(trackIndex) {
    this.tracks[trackIndex].steps.fill(false);
  }

  randomizeTrack(trackIndex) {
    this.tracks[trackIndex].steps = Array.from({ length: STEPS }, () => Math.random() > 0.75);
  }

  clearAll() {
    this.tracks.forEach(t => t.steps.fill(false));
  }
}
