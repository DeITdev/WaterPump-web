import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { setupLights } from './lights.js';
import { setupGUI } from './gui.js';
import { initRenderer, updateQualitySettings } from './renderer.js';
import { updateHelperVisibility, updateHelpers, setupHelpers } from './helpers.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

let scene, camera, renderer, controls, textMesh;
let frameCount = 0;
let lastTime = performance.now();
let statsContainer;
let fps = 0;

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

function init() {
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
  controls.addEventListener('change', enforceCameraLimits);

  // Create 3D text
  createText('0.00');

  // Setup MQTT client
  setupMQTT();

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

  frameCount++;
  const currentTime = performance.now();
  const elapsed = currentTime - lastTime;

  if (elapsed >= 1000) {
    fps = Math.round((frameCount * 1000) / elapsed);
    frameCount = 0;
    lastTime = currentTime;
  }

  controls.update();
  enforceCameraLimits();
  renderer.render(scene, camera);
  updateStats();
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function setupCamera() {
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 10;
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

// Add this new function to enforce camera position limits
function enforceCameraLimits() {
  // Clamp Y position between 1.0 and 7.0
  camera.position.y = Math.max(1.0, Math.min(7.0, camera.position.y));

  // Clamp X and Z positions to not exceed 8.0
  camera.position.x = Math.max(-8.0, Math.min(8.0, camera.position.x));
  camera.position.z = Math.max(-8.0, Math.min(8.0, camera.position.z));

  // Update camera matrix after position changes
  camera.updateProjectionMatrix();
}

function createText(value) {
  const loader = new FontLoader();
  loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function (font) {
    if (textMesh) {
      scene.remove(textMesh);
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

    scene.add(textMesh);
  });
}

function setupMQTT() {
  // Check if mqtt client is available globally
  if (typeof mqtt === 'undefined') {
    console.error('MQTT library not loaded properly');
    return;
  }

  const options = {
    username: 'admin',
    password: 'admin',
    clientId: 'waterpanel_' + Math.random().toString(16).substring(2, 8)
  };

  // Use the WebSocket port from your SCADA configuration
  const client = mqtt.connect('ws://127.0.0.1:51328', options);

  client.on('connect', () => {
    console.log('Connected to MQTT broker from browser');
    client.subscribe('/v1/device/+/rawdata');
  });

  client.on('message', (topic, message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('Received MQTT data:', data);

      // Based on your data structure, we need to find the currentInjector in the dataBA array
      if (data.dataBA) {
        const injectorData = data.dataBA.find(item => item.label === "currentInjector");
        if (injectorData && injectorData.value !== undefined) {
          createText(injectorData.value.toFixed(2));
        }
      }
    } catch (error) {
      console.error('Error parsing MQTT message:', error);
    }
  });

  client.on('error', (error) => {
    console.error('MQTT connection error:', error);
  });
}

init(); 