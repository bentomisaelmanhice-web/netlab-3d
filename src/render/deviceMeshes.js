import * as THREE from 'three';

function box(w, h, d, color) {
  return new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color, roughness: 0.6 })
  );
}

function ledMesh() {
  return new THREE.Mesh(
    new THREE.SphereGeometry(0.028, 10, 10),
    new THREE.MeshStandardMaterial({ color: 0x1f2937, emissive: 0x000000 })
  );
}

export function setLed(led, on) {
  led.material.emissive.setHex(on ? 0x22c55e : 0x000000);
  led.material.color.setHex(on ? 0x22c55e : 0x1f2937);
}

function addPort(group, iface, x, y, z) {
  const port = new THREE.Mesh(
    new THREE.BoxGeometry(0.11, 0.085, 0.06),
    new THREE.MeshStandardMaterial({ color: 0x0b1220, roughness: 0.5 })
  );
  port.position.set(x, y, z);
  port.userData.iface = iface;
  group.add(port);

  // oversized invisible hitbox so small ports are easy to grab
  const hit = new THREE.Mesh(
    new THREE.SphereGeometry(0.15, 8, 8),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  hit.position.copy(port.position);
  hit.userData.iface = iface;
  group.add(hit);

  const anchor = new THREE.Object3D();
  anchor.position.copy(port.position);
  group.add(anchor);

  const led = ledMesh();
  led.position.set(x, y + 0.1, z);
  group.add(led);

  return { anchor, led, port };
}

function makeLabel(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.font = 'bold 42px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const w = ctx.measureText(text).width + 44;
  ctx.fillStyle = 'rgba(2, 6, 23, 0.8)';
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(128 - w / 2, 6, w, 52, 14);
  else ctx.rect(128 - w / 2, 6, w, 52);
  ctx.fill();
  ctx.fillStyle = '#e2e8f0';
  ctx.fillText(text, 128, 33);
  const tex = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false }));
  sprite.scale.set(1.15, 0.29, 1);
  return sprite;
}

export function buildDeviceVisual(device) {
  const group = new THREE.Group();
  group.userData.deviceId = device.id;
  const anchors = new Map();
  let labelY = 1.3;

  if (device.type === 'pc') {
    const tower = box(0.42, 1.0, 0.55, 0x94a3b8);
    tower.position.y = 0.5;
    group.add(tower);
    const drive = box(0.3, 0.06, 0.02, 0x334155);
    drive.position.set(-0.1, 0.62, 0.285);
    group.add(drive);
    const power = ledMesh();
    power.position.set(0.12, 0.72, 0.285);
    power.material.emissive.setHex(0x38bdf8);
    group.add(power);
    const stand = box(0.08, 0.3, 0.08, 0x334155);
    stand.position.set(0, 1.15, 0.1);
    group.add(stand);
    const monitor = box(0.85, 0.46, 0.07, 0x0f172a);
    monitor.position.set(0, 1.36, 0.1);
    group.add(monitor);
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.73, 0.34),
      new THREE.MeshBasicMaterial({ color: 0x0c4a6e })
    );
    screen.position.set(0, 1.36, 0.14);
    group.add(screen);
    const keyboard = box(0.36, 0.03, 0.13, 0x1e293b);
    keyboard.position.set(0, 0.015, 0.5);
    group.add(keyboard);
    const eth0 = device.interfaces.find(i => i.portType === 'ethernet');
    anchors.set(eth0, addPort(group, eth0, 0, 0.82, 0.31));
    labelY = 1.78;
  } else if (device.type === 'switch') {
    const body = box(1.5, 0.34, 0.55, 0x2b3a55);
    body.position.y = 0.17;
    group.add(body);
    const brand = box(1.3, 0.12, 0.02, 0x475569);
    brand.position.set(0, 0.24, 0.285);
    group.add(brand);
    device.interfaces.forEach((iface, i) => {
      const x = -0.6 + i * 0.17;
      anchors.set(iface, addPort(group, iface, x, 0.17, 0.31));
    });
    labelY = 0.62;
  } else if (device.type === 'router') {
    const body = box(0.95, 0.16, 0.5, 0x475569);
    body.position.y = 0.12;
    group.add(body);
    const ant1 = box(0.05, 0.5, 0.05, 0x64748b);
    ant1.position.set(-0.35, 0.4, -0.15);
    group.add(ant1);
    const ant2 = box(0.05, 0.5, 0.05, 0x64748b);
    ant2.position.set(0.35, 0.4, -0.15);
    group.add(ant2);
    device.interfaces
      .filter(i => i.portType === 'ethernet')
      .forEach((iface, i) => {
        anchors.set(iface, addPort(group, iface, -0.18 + i * 0.36, 0.12, 0.28));
      });
    labelY = 0.65;
  } else if (device.type === 'server') {
    const body = box(0.5, 1.25, 0.7, 0x1e293b);
    body.position.y = 0.625;
    group.add(body);
    const grill = box(0.02, 0.9, 0.6, 0x334155);
    grill.position.set(0.26, 0.625, 0);
    group.add(grill);
    const eth0 = device.interfaces.find(i => i.portType === 'ethernet');
    anchors.set(eth0, addPort(group, eth0, 0, 0.5, -0.38));
    labelY = 1.5;
  }

  const label = makeLabel(device.name);
  label.position.y = labelY;
  group.add(label);

  return { group, anchors };
}
