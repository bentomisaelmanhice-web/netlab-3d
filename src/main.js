import * as THREE from 'three';
import { initScene, BENCH_TOP_Y } from './core/scene.js';
import { initPicking } from './core/picking.js';
import { buildDeviceVisual, setLed } from './render/deviceMeshes.js';
import { updateCableMesh } from './render/cableMesh.js';
import { createDevice } from './sim/device.js';
import { state, emit, events } from './game/state.js';
import { MISSIONS } from './game/missions.js';
import { initHud, updateHud, toast } from './ui/hud.js';
import { initPalette } from './ui/palette.js';
import { initCli } from './ui/cli.js';

const container = document.getElementById('viewport');
const ctx = initScene(container);

initHud();
initPalette();
initCli();

startMission(MISSIONS[0]);

function startMission(mission) {
  state.mission = mission;
  let i = 0;
  for (const spec of mission.setup) {
    const device = createDevice(`dev-${++i}`, spec.name, spec.type);
    state.net.addDevice(device);
    const visual = buildDeviceVisual(device);
    visual.group.position.set(spec.pos[0], BENCH_TOP_Y, spec.pos[2]);
    ctx.scene.add(visual.group);
    state.visuals.set(device.id, visual);
  }
  updateHud();
}

initPicking(ctx);

events.addEventListener('network-changed', () => {
  refreshLeds();
  updateHud();
});

events.addEventListener('ping', () => {
  updateHud();
});

function refreshLeds() {
  for (const cv of state.cableVisuals) {
    const ledA = state.visuals.get(cv.sim.a.device.id).anchors.get(cv.sim.a).led;
    const ledB = state.visuals.get(cv.sim.b.device.id).anchors.get(cv.sim.b).led;
    setLed(ledA, cv.sim.a.linkUp);
    setLed(ledB, cv.sim.b.linkUp);
  }
}

const a = new THREE.Vector3();
const b = new THREE.Vector3();

ctx.renderer.setAnimationLoop(() => {
  // cables follow their port anchors so dragged devices carry cables along
  for (const cv of state.cableVisuals) {
    state.visuals.get(cv.sim.a.device.id).anchors.get(cv.sim.a).anchor.getWorldPosition(a);
    state.visuals.get(cv.sim.b.device.id).anchors.get(cv.sim.b).anchor.getWorldPosition(b);
    updateCableMesh(cv.mesh, a, b);
  }
  ctx.controls.update();
  ctx.renderer.render(ctx.scene, ctx.camera);
});

toast('Bem-vindo! Completa a Missão 1: liga os dois PCs ao switch.', 'info');

// debug/test handle
window.__netlab = { state, ctx, THREE, events, updateHud };
