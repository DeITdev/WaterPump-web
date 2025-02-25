import { state } from './main.js';
import { updateQualitySettings } from './renderer.js';
import { updateHelperVisibility, updateHelpers } from './helpers.js';

export function setupGUI() {
  const gui = new dat.GUI();
  const { lights, helpers, renderSettings } = state;

  setupPerformanceFolder(gui, renderSettings);
  setupHelperFolder(gui, helpers);
  setupLightFolder(gui, 'Main Light', lights.mainLight);
  setupLightFolder(gui, 'Fill Light', lights.fillLight);
  setupLightFolder(gui, 'Rim Light', lights.rimLight);
  addSettingsLogger(gui, lights);
}

function setupPerformanceFolder(gui, renderSettings) {
  const perfFolder = gui.addFolder('Performance');
  perfFolder.add(renderSettings, 'useHighQuality')
    .name('High Quality')
    .onChange(updateQualitySettings);
  perfFolder.add(renderSettings, 'shadows')
    .name('Shadows')
    .onChange(updateQualitySettings);
  perfFolder.open();
}

function setupHelperFolder(gui, helpers) {
  const helperFolder = gui.addFolder('Helper Visibility');
  helperFolder.add(helpers, 'showAllHelpers')
    .name('Show All Helpers')
    .onChange(updateHelperVisibility);
  helperFolder.add(helpers, 'showLightHelpers')
    .name('Light Helpers')
    .onChange(updateHelperVisibility);
  helperFolder.add(helpers, 'showGrid')
    .name('Grid')
    .onChange(updateHelperVisibility);
  helperFolder.add(helpers, 'showAxes')
    .name('Axes')
    .onChange(updateHelperVisibility);
}

function setupLightFolder(gui, name, light) {
  const folder = gui.addFolder(name);
  folder.add(light.position, 'x', -10, 10).onChange(updateHelpers);
  folder.add(light.position, 'y', -10, 10).onChange(updateHelpers);
  folder.add(light.position, 'z', -10, 10).onChange(updateHelpers);
  folder.add(light, 'intensity', 0, 2);

  const colorObj = {
    color: '#' + light.color.getHexString()
  };
  folder.addColor(colorObj, 'color')
    .onChange(value => light.color.set(value));
}

function addSettingsLogger(gui, lights) {
  gui.add({
    logSettings: () => {
      console.log('Light Settings:', {
        mainLight: {
          position: lights.mainLight.position.toArray(),
          intensity: lights.mainLight.intensity,
          color: '#' + lights.mainLight.color.getHexString()
        },
        fillLight: {
          position: lights.fillLight.position.toArray(),
          intensity: lights.fillLight.intensity,
          color: '#' + lights.fillLight.color.getHexString()
        },
        rimLight: {
          position: lights.rimLight.position.toArray(),
          intensity: lights.rimLight.intensity,
          color: '#' + lights.rimLight.color.getHexString()
        }
      });
    }
  }, 'logSettings').name('Log Light Settings');
} 