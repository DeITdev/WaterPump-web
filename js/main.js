import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { setupLights } from './lights.js';
import { setupGUI } from './gui.js';
import { initRenderer, updateQualitySettings } from './renderer.js';
import { updateHelperVisibility, updateHelpers, setupHelpers } from './helpers.js';

let scene, camera, renderer, controls;
let frameCount = 0;
let lastTime = performance.now();
let statsElement;

export const state = {
  scene: null,
  renderer: null,
  lights: {},
  helpers: {
    showAllHelpers: false,
    showLightHelpers: true,
    showGrid: true,
    showAxes: true
  },
  renderSettings: {
    useHighQuality: true,
    shadows: true
  }
};

function updateFPS() {
  frameCount++;
  const currentTime = performance.now();
  const elapsed = currentTime - lastTime;

  if (elapsed >= 1000) {
    const fps = Math.round((frameCount * 1000) / elapsed);
    statsElement.textContent = `FPS: ${fps}`;
    frameCount = 0;
    lastTime = currentTime;
  }
}

function init() {
  statsElement = document.getElementById('stats');
  scene = new THREE.Scene();
  state.scene = scene;
  scene.background = new THREE.Color(0x333333);

  camera = new THREE.PerspectiveCamera(
    40,
    window.innerWidth / window.innerHeight,
    0.1,
    5000
  );
  camera.position.set(10, 10, 10);

  setupLights(scene);
  setupHelpers(scene);
  renderer = initRenderer();
  state.renderer = renderer;
  updateQualitySettings();

  document.body.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  loadModel();
  animate();
  window.addEventListener('resize', onWindowResize, false);
}

function loadModel() {
  const loader = new GLTFLoader();
  loader.load(
    'WaterPumpPanel.gltf',
    (gltf) => {
      const model = gltf.scene;
      setupModel(model);
      document.getElementById('info').style.display = 'none';
      setupGUI();
    },
    (xhr) => {
      document.getElementById('info').textContent =
        `Loading: ${Math.round((xhr.loaded / xhr.total) * 100)}%`;
    },
    (error) => {
      document.getElementById('info').textContent = 'Error loading model';
      console.error('Error loading model:', error);
    }
  );
}

function setupModel(model) {
  model.traverse((node) => {
    if (node.isMesh) {
      node.castShadow = true;
      node.receiveShadow = true;
      if (node.material) {
        node.material.roughness = 0.7;
        node.material.metalness = 0.3;
        node.material.envMapIntensity = 1.0;
      }
    }
  });
  scene.add(model);

  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  camera.position.multiplyScalar(maxDim / 5);
  controls.target.copy(center);
  controls.update();
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
  updateFPS();
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

init(); 