import * as THREE from 'three';
import { state } from './main.js';

export function setupHelpers(scene) {
  const gridHelper = new THREE.GridHelper(10, 10);
  const axesHelper = new THREE.AxesHelper(5);

  scene.add(gridHelper);
  scene.add(axesHelper);

  state.helpers.gridHelper = gridHelper;
  state.helpers.axesHelper = axesHelper;
}

export function updateHelperVisibility() {
  const { helpers, lights } = state;
  const showHelpers = helpers.showAllHelpers;

  lights.mainLightHelper.visible = showHelpers && helpers.showLightHelpers;
  lights.fillLightHelper.visible = showHelpers && helpers.showLightHelpers;
  lights.rimLightHelper.visible = showHelpers && helpers.showLightHelpers;
  helpers.gridHelper.visible = showHelpers && helpers.showGrid;
  helpers.axesHelper.visible = showHelpers && helpers.showAxes;
}

export function updateHelpers() {
  const { helpers, lights } = state;
  if (helpers.showLightHelpers && helpers.showAllHelpers) {
    lights.mainLightHelper.update();
    lights.fillLightHelper.update();
    lights.rimLightHelper.update();
  }
} 