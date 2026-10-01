import * as THREE from 'three';
import { state, emit } from '../game/state.js';
import { createCableMesh, updateCableMesh } from '../render/cableMesh.js';
import { buildDeviceVisual } from '../render/deviceMeshes.js';
import { createDevice } from '../sim/device.js';
import { CABLE_TYPES, correctCableType } from '../sim/cables.js';
import { BENCH_TOP_Y } from './scene.js';
import { openTerminal } from '../ui/cli.js';
import { toast } from '../ui/hud.js';
import { setPlaceMode } from '../ui/palette.js';

const CONNECT_ERRORS = {
  'same-device': 'Não podes ligar duas portas do mesmo equipamento.',
  'port-in-use': 'Uma das portas já está ocupada.',
};

const TYPE_PREFIX = { pc: 'PC', switch: 'SW', router: 'R', server: 'SRV' };

function snap(v) {
  return Math.round(v / 0.25) * 0.25;
}

export function initPicking(ctx) {
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const dom = ctx.renderer.domElement;

  let hoverPort = null;
  let cableDrag = null;   // { fromIface, anchor, anchorWorld, preview }
  let deviceDrag = null;  // { device, startX, startY, moved }

  function setPointer(e) {
    const r = dom.getBoundingClientRect();
    pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
  }

  function pick() {
    raycaster.setFromCamera(pointer, ctx.camera);
    return raycaster.intersectObjects(ctx.scene.children, true);
  }

  function findIface(hits) {
    for (const h of hits) {
      let o = h.object;
      while (o) {
        if (o.userData && o.userData.iface) return o.userData.iface;
        o = o.parent;
      }
    }
    return null;
  }

  function findDevice(hits) {
    for (const h of hits) {
      let o = h.object;
      while (o) {
        if (o.userData && o.userData.deviceId) {
          return state.net.devices.get(o.userData.deviceId);
        }
        o = o.parent;
      }
    }
    return null;
  }

  function placePoint(hits) {
    for (const h of hits) {
      if (h.object.name === 'placePlane' || h.object.name === 'floorPlane') {
        return h.point.clone();
      }
    }
    return null;
  }

  function cursorPoint() {
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -cableDrag.anchorWorld.y);
    const p = new THREE.Vector3();
    if (raycaster.ray.intersectPlane(plane, p)) return p;
    return new THREE.Vector3().copy(raycaster.ray.origin).addScaledVector(raycaster.ray.direction, 5);
  }

  function placeDevice(type, point) {
    let count = 0;
    for (const d of state.net.devices.values()) {
      if (d.type === type) count++;
    }
    const name = `${TYPE_PREFIX[type]}${count + 1}`;
    const device = createDevice(`dev-${state.net.devices.size + 1}`, name, type);
    state.net.addDevice(device);
    const visual = buildDeviceVisual(device);
    visual.group.position.set(snap(point.x), BENCH_TOP_Y, snap(point.z));
    ctx.scene.add(visual.group);
    visual.group.updateMatrixWorld(true);
    state.visuals.set(device.id, visual);
    setPlaceMode(null);
    emit('network-changed');
    toast(`${name} adicionado à bancada.`, 'ok');
  }

  function updateHover(hits) {
    const iface = findIface(hits);
    const device = iface ? iface.device : findDevice(hits);
    dom.style.cursor = iface ? 'crosshair' : device ? 'pointer' : 'default';
    if (hoverPort === iface) return;
    if (hoverPort) {
      const v = state.visuals.get(hoverPort.device.id);
      if (v) v.anchors.get(hoverPort).port.material.color.setHex(0x0b1220);
    }
    hoverPort = iface;
    if (iface) {
      const v = state.visuals.get(iface.device.id);
      if (v) v.anchors.get(iface).port.material.color.setHex(0x38bdf8);
    }
  }

  function cancelCableDrag() {
    if (!cableDrag) return;
    ctx.scene.remove(cableDrag.preview);
    cableDrag = null;
    ctx.controls.enabled = true;
  }

  dom.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    setPointer(e);
    const hits = pick();
    const iface = findIface(hits);

    if (iface && state.mode !== 'place') {
      ctx.controls.enabled = false;
      const anchor = state.visuals.get(iface.device.id).anchors.get(iface).anchor;
      const aPos = new THREE.Vector3();
      anchor.getWorldPosition(aPos);
      const preview = createCableMesh(state.cableType, aPos, aPos.clone());
      ctx.scene.add(preview);
      cableDrag = { fromIface: iface, anchor, anchorWorld: aPos, preview };
      try {
        dom.setPointerCapture(e.pointerId);
      } catch {
        /* synthetic events have no active pointer */
      }
      return;
    }

    const device = findDevice(hits);
    if (device) {
      deviceDrag = { device, startX: e.clientX, startY: e.clientY, moved: false };
      return;
    }

    if (state.mode === 'place' && state.paletteItem) {
      const p = placePoint(hits);
      if (p) placeDevice(state.paletteItem, p);
    }
  });

  dom.addEventListener('pointermove', (e) => {
    setPointer(e);
    if (cableDrag) {
      updateCableMesh(cableDrag.preview, cableDrag.anchorWorld, cursorPoint());
      return;
    }
    if (deviceDrag) {
      if (!deviceDrag.moved) {
        const dist = Math.hypot(e.clientX - deviceDrag.startX, e.clientY - deviceDrag.startY);
        if (dist > 4) {
          deviceDrag.moved = true;
          ctx.controls.enabled = false;
        }
      }
      if (deviceDrag.moved) {
        const p = placePoint(pick());
        if (p) {
          const g = state.visuals.get(deviceDrag.device.id).group;
          g.position.set(snap(p.x), BENCH_TOP_Y, snap(p.z));
        }
      }
      return;
    }
    updateHover(pick());
  });

  dom.addEventListener('pointerup', (e) => {
    setPointer(e);
    if (cableDrag) {
      const hits = pick();
      const target = findIface(hits);
      if (target && target !== cableDrag.fromIface) {
        const res = state.net.connect(cableDrag.fromIface, target, state.cableType);
        if (res.ok) {
          state.cableVisuals.push({ sim: res.cable, mesh: cableDrag.preview });
          emit('network-changed');
          const used = CABLE_TYPES[res.cable.type].label;
          const aName = `${cableDrag.fromIface.device.name} ${cableDrag.fromIface.name}`;
          const bName = `${target.device.name} ${target.name}`;
          if (res.cable.compatible) {
            toast(`Link UP: ${aName} ↔ ${bName} (cabo ${used}).`, 'ok');
          } else {
            const correct = CABLE_TYPES[correctCableType(cableDrag.fromIface, target)].label;
            toast(`Link DOWN: ${aName} ↔ ${bName}. Cabo ${used} errado — o correto é ${correct}.`, 'err');
          }
        } else {
          ctx.scene.remove(cableDrag.preview);
          toast(CONNECT_ERRORS[res.reason] || 'Não foi possível ligar.', 'err');
        }
      } else {
        ctx.scene.remove(cableDrag.preview);
      }
      cableDrag = null;
      ctx.controls.enabled = true;
      return;
    }
    if (deviceDrag) {
      if (deviceDrag.moved) {
        ctx.controls.enabled = true;
      } else {
        openTerminal(deviceDrag.device);
      }
      deviceDrag = null;
    }
  });

  dom.addEventListener('pointercancel', cancelCableDrag);

  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || state.terminalDevice) return;
    cancelCableDrag();
    if (deviceDrag) {
      deviceDrag = null;
      ctx.controls.enabled = true;
    }
    if (state.mode === 'place') setPlaceMode(null);
  });
}
