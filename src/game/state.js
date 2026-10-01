import { Network } from '../sim/network.js';

export const state = {
  net: new Network(),
  visuals: new Map(),   // deviceId -> { group, anchors: Map<iface, { anchor, led, port }> }
  cableVisuals: [],     // { sim, mesh }
  score: 0,
  hintsUsed: 0,
  mission: null,
  missionDone: false,
  mode: 'inspect',      // 'inspect' | 'place'
  paletteItem: null,
  cableType: 'straight',
  lastPing: null,
  terminalDevice: null,
};

export const events = new EventTarget();

export function emit(type, detail) {
  events.dispatchEvent(new CustomEvent(type, { detail }));
}
