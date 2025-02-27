import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { setupLights } from './lights.js';
import { setupGUI } from './gui.js';
import { initRenderer, updateQualitySettings } from './renderer.js';
import { updateHelperVisibility, updateHelpers, setupHelpers } from './helpers.js';
import { connectionConfig, promptForConnectionSettings } from './API/connection-config.js';
import { setupMQTT } from './API/mqtt-client.js';
import { setupRestApiDataFetch, cleanupRestApi } from './API/rest-api.js';
import { createTextDisplay } from './UI/text-display.js';
import { enforceCameraLimits } from './library/camera-utils.js';
import { setupObjectInteraction, findTargetObjects } from './library/object-interaction.js';

let scene, camera, renderer, controls;
let frameCount = 0;
let lastTime = performance.now();
let statsContainer;
let fps = 0;
let model;
let raycaster, mouse;

export const state = {
  scene: null,
  renderer: null,
  lights: {},
  helpers: {
    showAllHelpers: false,
    showLightHelpers: false,
    showGrid: false,
    showAxes: false
  },
  renderSettings: {
    useHighQuality: true,
    shadows: false
  },
  defaultSettings: {
    performance: {
      highQuality: true,
      shadows: false
    },
    helperVisibility: {
      showAllHelpers: false,
      lightHelpers: false,
      grid: false,
      axes: false
    },
    mainLight: {
      x: -4.6,
      y: 3.4,
      z: 2.9,
      intensity: 1.8,
      color: '#ffffff'
    },
    fillLight: {
      x: -0.8,
      y: 3.6,
      z: -6.8,
      intensity: 0.8,
      color: '#b6ccff'
    },
    rimLight: {
      x: -3.2,
      y: -3.5,
      z: -3.5,
      intensity: 1,
      color: '#ffd5cc'
    },
    camera: {
      x: 0,
      y: 4,
      z: 10
    }
  }
};

async function init() {
  // First, get the connection settings from the user
  await promptForConnectionSettings();

  scene = new THREE.Scene();
  state.scene = scene;
  scene.background = new THREE.Color(0x000000);

  setupCamera();
  setupStats();
  setupLights(scene);
  setupHelpers(scene);
  renderer = initRenderer();
  state.renderer = renderer;
  updateQualitySettings();

  document.body.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  // Add camera limits
  controls.maxPolarAngle = Math.PI / 2; // Prevent going below ground
  controls.minDistance = 2; // Prevent getting too close
  controls.maxDistance = 20; // Prevent getting too far

  // Add change event listener to enforce position limits
  controls.addEventListener('change', () => enforceCameraLimits(camera));

  // Raycaster for object interaction
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  // Setup object interaction
  setupObjectInteraction(raycaster, mouse, camera, controls);

  // Create 3D text display
  createTextDisplay('0.00');

  // Setup data connection based on user choice
  if (connectionConfig.type === 'mqtt') {
    setupMQTT();
  } else {
    setupRestApiDataFetch();
  }

  loadModel();
  animate();
  window.addEventListener('resize', onWindowResize, false);
}

function loadModel() {
  const loader = new GLTFLoader();
  const modelPath = new URL('../WaterPumpPanel.gltf', import.meta.url).href;
  
  loader.load(
    modelPath,
    (gltf) => {
      model = gltf.scene;
      setupModel(model);
      document.getElementById('info').style.display = 'none';
      setupGUI();
    },
    (xhr) => {
      document.getElementById('info').textContent =
        `Loading: ${Math.round((xhr.loaded / xhr.total) * 100)}%`;
    },
    (error) => {
      console.error('Error loading model:', error);
      document.getElementById('info').textContent = 'Error loading model. Please check console for details.';
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

  // Find target objects in the model
  window.targetObject = findTargetObjects(model);
}

function animate() {
  requestAnimationFrame(animate);

  frameCount++;
  const currentTime = performance.now();
  const elapsed = currentTime - lastTime;

  if (elapsed >= 1000) {
    fps = Math.round((frameCount * 1000) / elapsed);
    frameCount = 0;
    lastTime = currentTime;
  }

  controls.update();
  enforceCameraLimits(camera);
  renderer.render(scene, camera);
  updateStats();
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function setupCamera() {
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(
    state.defaultSettings.camera.x,
    state.defaultSettings.camera.y,
    state.defaultSettings.camera.z
  );
}

function setupStats() {
  statsContainer = document.createElement('div');
  statsContainer.style.position = 'fixed';
  statsContainer.style.top = '10px';
  statsContainer.style.left = '10px';
  statsContainer.style.color = 'white';
  statsContainer.style.fontFamily = 'monospace';
  statsContainer.style.fontSize = '12px';
  statsContainer.style.backgroundColor = 'rgba(0,0,0,0.5)';
  statsContainer.style.padding = '5px';
  document.body.appendChild(statsContainer);
}

function updateStats() {
  const campos = camera.position;
  statsContainer.innerHTML = `
    FPS: ${fps}<br>
    Camera Position:<br>
    x: ${campos.x.toFixed(2)}<br>
    y: ${campos.y.toFixed(2)}<br>
    z: ${campos.z.toFixed(2)}
  `;
}

// Clean up resources
function cleanup() {
  cleanupRestApi();
}

// Window beforeunload event to clean up resources
window.addEventListener('beforeunload', cleanup);

init(); 