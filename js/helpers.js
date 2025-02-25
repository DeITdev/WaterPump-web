import * as THREE from 'three';
import { state } from './main.js';

export function setupHelpers(scene) {
  const gridHelper = new THREE.GridHelper(10, 10);
  const axesHelper = new THREE.AxesHelper(5);

  // Set initial visibility to false
  gridHelper.visible = false;
  axesHelper.visible = false;

  scene.add(gridHelper);
  scene.add(axesHelper);

  state.helpers.gridHelper = gridHelper;
  state.helpers.axesHelper = axesHelper;
}

export function updateHelperVisibility() {
  const { helpers, lights } = state;

  if (helpers.showAllHelpers) {
    // Only show helpers if their individual toggles are true
    lights.mainLightHelper.visible = helpers.showLightHelpers;
    lights.fillLightHelper.visible = helpers.showLightHelpers;
    lights.rimLightHelper.visible = helpers.showLightHelpers;
    helpers.gridHelper.visible = helpers.showGrid;
    helpers.axesHelper.visible = helpers.showAxes;
  } else {
    // Hide all helpers when showAllHelpers is false
    lights.mainLightHelper.visible = false;
    lights.fillLightHelper.visible = false;
    lights.rimLightHelper.visible = false;
    helpers.gridHelper.visible = false;
    helpers.axesHelper.visible = false;
  }
}

export function updateHelpers() {
  const { helpers, lights } = state;
  if (helpers.showLightHelpers && helpers.showAllHelpers) {
    lights.mainLightHelper.update();
    lights.fillLightHelper.update();
    lights.rimLightHelper.update();
  }
} 