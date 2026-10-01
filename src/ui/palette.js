import { state, emit } from '../game/state.js';
import { CABLE_TYPES } from '../sim/cables.js';
import { toast } from './hud.js';

const DEVICE_DEFS = [
  { type: 'pc', label: 'PC', disabled: false },
  { type: 'switch', label: 'Switch', disabled: false },
  { type: 'router', label: 'Router', disabled: true },
  { type: 'server', label: 'Servidor', disabled: true },
];

export function initPalette() {
  const devEl = document.getElementById('palette-devices');
  for (const def of DEVICE_DEFS) {
    const el = document.createElement('div');
    el.className = 'palette-item' + (def.disabled ? ' disabled' : '');
    el.innerHTML =
      `<span class="dot" style="background:#64748b"></span><span>${def.label}</span>` +
      (def.disabled ? '<span class="tag">fase 2</span>' : '');
    el.dataset.type = def.type;
    el.addEventListener('click', () => {
      if (def.disabled) {
        toast('Disponível na fase 2.', 'warn');
        return;
      }
      setPlaceMode(state.paletteItem === def.type ? null : def.type);
    });
    devEl.appendChild(el);
  }

  const cableEl = document.getElementById('palette-cables');
  for (const [id, def] of Object.entries(CABLE_TYPES)) {
    const el = document.createElement('div');
    el.className = 'palette-item' + (def.enabled ? '' : ' disabled');
    el.innerHTML =
      `<span class="dot" style="background:${def.css}"></span><span>${def.label}</span>` +
      (def.enabled ? '' : '<span class="tag">fase 2</span>');
    el.dataset.cable = id;
    el.addEventListener('click', () => {
      if (!def.enabled) {
        toast('Disponível na fase 2.', 'warn');
        return;
      }
      state.cableType = id;
      render();
    });
    cableEl.appendChild(el);
  }

  render();
}

function render() {
  document.querySelectorAll('#palette-devices .palette-item').forEach((el) => {
    el.classList.toggle('active', state.mode === 'place' && state.paletteItem === el.dataset.type);
  });
  document.querySelectorAll('#palette-cables .palette-item').forEach((el) => {
    el.classList.toggle('active', state.cableType === el.dataset.cable);
  });
}

export function setPlaceMode(type) {
  state.paletteItem = type;
  state.mode = type ? 'place' : 'inspect';
  render();
  emit('mode-changed');
}
