import * as THREE from 'three';
import { CABLE_TYPES } from '../sim/cables.js';

function buildGeometry(a, b) {
  const dist = a.distanceTo(b);
  const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
  mid.y -= Math.max(0.14, dist * 0.16);
  const curve = new THREE.CatmullRomCurve3([a, mid, b]);
  return new THREE.TubeGeometry(curve, 20, 0.03, 8, false);
}

export function createCableMesh(typeId, aPos, bPos) {
  const mat = new THREE.MeshStandardMaterial({
    color: CABLE_TYPES[typeId].color,
    roughness: 0.65,
  });
  return new THREE.Mesh(buildGeometry(aPos, bPos), mat);
}

export function updateCableMesh(mesh, aPos, bPos) {
  mesh.geometry.dispose();
  mesh.geometry = buildGeometry(aPos, bPos);
}
