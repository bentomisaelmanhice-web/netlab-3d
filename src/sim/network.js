import { isCableCompatible } from './cables.js';

export class Network {
  constructor() {
    this.devices = new Map();
    this.cables = [];
    this.cableSeq = 0;
  }

  addDevice(device) {
    this.devices.set(device.id, device);
    return device;
  }

  connect(a, b, cableTypeId) {
    if (a === b) return { ok: false, reason: 'same-device' };
    if (a.cable || b.cable) return { ok: false, reason: 'port-in-use' };
    const cable = {
      id: ++this.cableSeq,
      a,
      b,
      type: cableTypeId,
      compatible: isCableCompatible(a, b, cableTypeId),
    };
    a.cable = cable;
    b.cable = cable;
    this.cables.push(cable);
    this.refreshLinks();
    return { ok: true, cable };
  }

  disconnect(cable) {
    const idx = this.cables.indexOf(cable);
    if (idx >= 0) this.cables.splice(idx, 1);
    cable.a.cable = null;
    cable.b.cable = null;
    this.refreshLinks();
  }

  refreshLinks() {
    for (const c of this.cables) {
      const up = c.compatible && c.a.adminUp && c.b.adminUp;
      c.a.linkUp = up;
      c.b.linkUp = up;
    }
  }

  neighbors(iface) {
    const out = [];
    for (const c of this.cables) {
      if (!c.a.linkUp) continue;
      if (c.a === iface) out.push(c.b);
      else if (c.b === iface) out.push(c.a);
    }
    // a switch bridges all its ethernet ports internally (single VLAN in MVP)
    if (iface.device.type === 'switch') {
      for (const other of iface.device.interfaces) {
        if (other !== iface && other.portType === 'ethernet') out.push(other);
      }
    }
    return out;
  }

  pathBetween(a, b) {
    if (a === b) return [a];
    const prev = new Map();
    const seen = new Set([a]);
    const queue = [a];
    while (queue.length) {
      const cur = queue.shift();
      for (const next of this.neighbors(cur)) {
        if (seen.has(next)) continue;
        seen.add(next);
        prev.set(next, cur);
        if (next === b) {
          const path = [b];
          let p = b;
          while (p !== a) {
            p = prev.get(p);
            path.unshift(p);
          }
          return path;
        }
        queue.push(next);
      }
    }
    return null;
  }

  findInterfaceByIp(ip) {
    for (const d of this.devices.values()) {
      for (const i of d.interfaces) {
        if (i.ip === ip) return i;
      }
    }
    return null;
  }

  deviceByName(name) {
    for (const d of this.devices.values()) {
      if (d.name === name) return d;
    }
    return null;
  }
}
