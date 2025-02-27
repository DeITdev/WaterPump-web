import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { state } from '../main.js';

let textMesh;
let font = null;

// Load font once and cache it
function loadFont() {
  return new Promise((resolve, reject) => {
    if (font) {
      resolve(font);
      return;
    }

    const loader = new FontLoader();
    loader.load(
      '/fonts/helvetiker_regular.typeface.json',
      (loadedFont) => {
        font = loadedFont;
        resolve(font);
      },
      // onProgress callback
      (xhr) => {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
      },
      // onError callback
      (err) => {
        console.error('Error loading font:', err);
        reject(err);
      }
    );
  });
}

export async function createTextDisplay(initialValue = '0.00') {
  try {
    await loadFont();
    updateTextDisplay(initialValue);
  } catch (error) {
    console.error('Failed to create text display:', error);
  }
}

export async function updateTextDisplay(value) {
  try {
    if (!font) {
      await loadFont();
    }

    if (textMesh) {
      state.scene.remove(textMesh);
      textMesh.geometry.dispose();
      textMesh.material.dispose();
    }

    const geometry = new TextGeometry(value, {
      font: font,
      size: 0.3,  // Smaller size
      height: 0.05,  // Less depth
      curveSegments: 12,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.01,
      bevelOffset: 0,
      bevelSegments: 5
    });

    const material = new THREE.MeshStandardMaterial({
      color: 0x00ff00,
      metalness: 0.3,
      roughness: 0.4,
      emissive: 0x00ff00,
      emissiveIntensity: 0.2
    });

    textMesh = new THREE.Mesh(geometry, material);

    // Center the text
    geometry.computeBoundingBox();
    const centerOffset = -0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x);
    
    // Position the text in front of the model
    textMesh.position.set(centerOffset, 2.5, 3.0);
    textMesh.rotation.y = -Math.PI / 6; // Slight rotation for better visibility

    // Add some nice effects
    textMesh.castShadow = true;
    textMesh.receiveShadow = true;

    state.scene.add(textMesh);
  } catch (error) {
    console.error('Failed to update text display:', error);
  }
}