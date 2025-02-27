import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { state } from '../main.js';

let textMesh;

export function createTextDisplay(initialValue = '0.00') {
  updateTextDisplay(initialValue);
}

export function updateTextDisplay(value) {
  const loader = new FontLoader();
  loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function (font) {
    if (textMesh) {
      state.scene.remove(textMesh);
    }

    const geometry = new TextGeometry(value, {
      font: font,
      size: 0.5,
      height: 0.1,
    });

    const material = new THREE.MeshStandardMaterial({
      color: 0x00ff00,
      metalness: 0.3,
      roughness: 0.4
    });

    textMesh = new THREE.Mesh(geometry, material);

    // Center the text
    geometry.computeBoundingBox();
    const centerOffset = -0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x);
    textMesh.position.set(6.0 + centerOffset, 4.0, 5.0);

    state.scene.add(textMesh);
  });
} 