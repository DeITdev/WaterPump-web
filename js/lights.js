import * as THREE from 'three';
import { state } from './main.js';

export function setupLights(scene) {
  const defaults = state.defaultSettings;

  // Main directional light
  const mainLight = new THREE.DirectionalLight(defaults.mainLight.color, defaults.mainLight.intensity);
  mainLight.position.set(
    defaults.mainLight.x,
    defaults.mainLight.y,
    defaults.mainLight.z
  );
  setupShadowCamera(mainLight);
  scene.add(mainLight);

  // Fill light
  const fillLight = new THREE.DirectionalLight(defaults.fillLight.color, defaults.fillLight.intensity);
  fillLight.position.set(
    defaults.fillLight.x,
    defaults.fillLight.y,
    defaults.fillLight.z
  );
  setupShadowCamera(fillLight);
  scene.add(fillLight);

  // Rim light
  const rimLight = new THREE.DirectionalLight(defaults.rimLight.color, defaults.rimLight.intensity);
  rimLight.position.set(
    defaults.rimLight.x,
    defaults.rimLight.y,
    defaults.rimLight.z
  );
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

  // Set initial visibility to false
  mainLightHelper.visible = false;
  fillLightHelper.visible = false;
  rimLightHelper.visible = false;

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