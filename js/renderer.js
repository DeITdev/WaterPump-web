import * as THREE from 'three';
import { state } from './main.js';

export function initRenderer() {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    logarithmicDepthBuffer: true,
    powerPreference: 'high-performance'
  });

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;

  return renderer;
}

export function updateQualitySettings() {
  const { renderSettings, lights } = state;
  const renderer = state.renderer;

  if (renderSettings.useHighQuality) {
    setHighQualitySettings(renderer);
    updateShadowSettings(lights, true);
  } else {
    setLowQualitySettings(renderer);
    updateShadowSettings(lights, false);
  }

  renderer.shadowMap.enabled = renderSettings.shadows;
  Object.values(lights).forEach(light => {
    if (light instanceof THREE.DirectionalLight) {
      light.castShadow = renderSettings.shadows;
    }
  });
}

function setHighQualitySettings(renderer) {
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.physicallyCorrectLights = true;
}

function setLowQualitySettings(renderer) {
  renderer.shadowMap.type = THREE.BasicShadowMap;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.physicallyCorrectLights = false;
}

function updateShadowSettings(lights, highQuality) {
  const settings = highQuality ? {
    mapSize: 2048,
    radius: 4,
    bias: -0.0001,
    normalBias: 0.02
  } : {
    mapSize: 512,
    radius: 1,
    bias: -0.0001,
    normalBias: 0.01
  };

  Object.values(lights).forEach(light => {
    if (light instanceof THREE.DirectionalLight) {
      light.shadow.mapSize.width = settings.mapSize;
      light.shadow.mapSize.height = settings.mapSize;
      light.shadow.radius = settings.radius;
      light.shadow.bias = settings.bias;
      light.shadow.normalBias = settings.normalBias;
    }
  });
} 