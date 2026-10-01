import { state, emit } from '../game/state.js';
import { evaluate, allDone } from '../game/missions.js';

let els = {};

export function initHud() {
  els = {
    title: document.getElementById('mission-title'),
    brief: document.getElementById('mission-brief'),
    objectives: document.getElementById('objectives'),
    score: document.getElementById('score'),
    hintBtn: document.getElementById('hint-btn'),
    resetBtn: document.getElementById('reset-btn'),
    banner: document.getElementById('banner'),
    toasts: document.getElementById('toasts'),
  };

  els.hintBtn.addEventListener('click', () => {
    const m = state.mission;
    if (state.hintsUsed >= m.hints.length) {
      toast('Não há mais dicas para esta missão.', 'warn');
      return;
    }
    const hint = m.hints[state.hintsUsed];
    state.hintsUsed++;
    toast(`Dica: ${hint}`, 'warn');
    updateHud();
  });

  els.resetBtn.addEventListener('click', () => {
    location.reload();
  });

  updateHud();
}

export function updateHud() {
  if (!state.mission) return;
  els.title.textContent = state.mission.title;
  els.brief.textContent = state.mission.brief;
  const results = evaluate(state, state.mission);
  els.objectives.innerHTML = results
    .map((r) => `<li class="${r.ok ? 'done' : ''}">${r.ok ? '✔' : '○'} ${r.label}</li>`)
    .join('');
  els.score.textContent = `Pontos: ${state.score}`;
  if (allDone(state, state.mission) && !state.missionDone) completeMission();
}

function completeMission() {
  state.missionDone = true;
  const gained = Math.max(0, state.mission.points - state.hintsUsed * 10);
  state.score += gained;
  els.score.textContent = `Pontos: ${state.score}`;
  els.banner.classList.remove('hidden');
  els.banner.innerHTML = `MISSÃO CONCLUÍDA!<small>+${gained} pontos</small>`;
  setTimeout(() => els.banner.classList.add('hidden'), 6000);
  emit('mission-complete');
}

export function toast(msg, kind = 'info') {
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  el.textContent = msg;
  els.toasts.appendChild(el);
  setTimeout(() => el.remove(), 4200);
}
