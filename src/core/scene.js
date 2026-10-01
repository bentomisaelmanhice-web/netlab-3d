import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export const BENCH_TOP_Y = 0.96;

export function initScene(container) {
  const canvas = document.getElementById('canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0f172a);
  scene.fog = new THREE.Fog(0x0f172a, 22, 48);

  const camera = new THREE.PerspectiveCamera(
    50,
    container.clientWidth / container.clientHeight,
    0.1,
    100
  );
  camera.position.set(4.5, 4.4, 7.5);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 1.0, 0);
  controls.enableDamping = true;
  controls.maxPolarAngle = Math.PI * 0.495;
  controls.minDistance = 2.5;
  controls.maxDistance = 14;

  scene.add(new THREE.HemisphereLight(0xbfdbfe, 0x1e293b, 1.0));
  const key = new THREE.DirectionalLight(0xffffff, 1.7);
  key.position.set(6, 9, 4);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x93c5fd, 0.5);
  fill.position.set(-5, 4, -4);
  scene.add(fill);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 16),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.name = 'floor';
  scene.add(floor);

  const grid = new THREE.GridHelper(16, 32, 0x334155, 0x243044);
  grid.position.y = 0.005;
  scene.add(grid);

  const wallMat = new THREE.MeshStandardMaterial({ color: 0x273449, roughness: 0.95 });
  const back = new THREE.Mesh(new THREE.PlaneGeometry(16, 7), wallMat);
  back.position.set(0, 3.5, -8);
  scene.add(back);
  const left = new THREE.Mesh(new THREE.PlaneGeometry(16, 7), wallMat);
  left.rotation.y = Math.PI / 2;
  left.position.set(-8, 3.5, 0);
  scene.add(left);

  const bench = new THREE.Group();
  const top = new THREE.Mesh(
    new THREE.BoxGeometry(5.2, 0.12, 1.5),
    new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.5 })
  );
  top.position.y = 0.9;
  bench.add(top);
  const legMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.6 });
  for (const [lx, lz] of [[2.4, 0.6], [2.4, -0.6], [-2.4, 0.6], [-2.4, -0.6]]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.9, 0.09), legMat);
    leg.position.set(lx, 0.45, lz);
    bench.add(leg);
  }
  scene.add(bench);

  const placePlane = new THREE.Mesh(
    new THREE.PlaneGeometry(5.2, 1.5),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  placePlane.rotation.x = -Math.PI / 2;
  placePlane.position.y = BENCH_TOP_Y;
  placePlane.name = 'placePlane';
  scene.add(placePlane);

  const floorPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 16),
    new THREE.MeshBasicMaterial({ visible: false })
  );
  floorPlane.rotation.x = -Math.PI / 2;
  floorPlane.name = 'floorPlane';
  scene.add(floorPlane);

  function resize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', resize);

  return { renderer, scene, camera, controls, placePlane, floorPlane, resize };
}
