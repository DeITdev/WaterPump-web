import * as THREE from 'three';
import { state } from './main.js';

export function setupLights(scene) {
  // Main directional light
  const mainLight = new THREE.DirectionalLight(0xffffff, 2.0);
  mainLight.position.set(-4.6, 3.4, 2.9);
  setupShadowCamera(mainLight);
  scene.add(mainLight);

  // Fill light
  const fillLight = new THREE.DirectionalLight(0xffffff, 2.0);
  fillLight.position.set(-0.8, 3.6, -6.8);
  setupShadowCamera(fillLight);
  scene.add(fillLight);

  // Rim light
  const rimLight = new THREE.DirectionalLight(0xffd5cc, 0.79);
  rimLight.position.set(-3.2, -3.5, -3.5);
  setupShadowCamera(rimLight);
  scene.add(rimLight);

  // Ambient and hemisphere lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.2);
  scene.add(ambientLight);
  scene.add(hemiLight);

  // Create helpers
  const mainLightHelper = new THREE.DirectionalLightHelper(mainLight, 1);
  const fillLightHelper = new THREE.DirectionalLightHelper(fillLight, 1);
  const rimLightHelper = new THREE.DirectionalLightHelper(rimLight, 1);
  scene.add(mainLightHelper);
  scene.add(fillLightHelper);
  scene.add(rimLightHelper);

  // Store references
  state.lights = {
    mainLight,
    fillLight,
    rimLight,
    mainLightHelper,
    fillLightHelper,
    rimLightHelper
  };
}

function setupShadowCamera(light) {
  light.castShadow = true;
  light.shadow.camera.near = 0.1;
  light.shadow.camera.far = 500;
  if (light.shadow.camera instanceof THREE.OrthographicCamera) {
    light.shadow.camera.left = -20;
    light.shadow.camera.right = 20;
    light.shadow.camera.top = 20;
    light.shadow.camera.bottom = -20;
  }
} 