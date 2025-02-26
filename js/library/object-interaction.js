import { focusOnObject } from './camera-utils.js';

export function setupObjectInteraction(raycaster, mouse, camera, controls) {
  // Event listeners for object interaction
  window.addEventListener('mousemove', (event) => onMouseMove(event, raycaster, mouse, camera), false);
  window.addEventListener('click', (event) => onClick(event, raycaster, mouse, camera, controls), false);
}

export function findTargetObjects(model) {
  let targetObject = null;

  // Find the panel body object specifically
  model.traverse((child) => {
    if (child.isMesh) {
      // Look specifically for the panel_body002 object
      if (child.name === 'panel_body002') {
        targetObject = child;
        console.log('Found target panel object:', child.name);
      }
    }
  });

  // If we didn't find the specific object, try the white object detection as fallback
  if (!targetObject) {
    model.traverse((child) => {
      if (child.isMesh) {
        if (child.name.includes('panel') ||
          (child.material && child.material.color &&
            child.material.color.r > 0.8 &&
            child.material.color.g > 0.8 &&
            child.material.color.b > 0.8)) {
          targetObject = child;
          console.log('Found fallback target object:', child.name);
        }
      }
    });
  }

  return targetObject;
}

function onMouseMove(event, raycaster, mouse, camera) {
  // Calculate mouse position in normalized device coordinates
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Update the cursor style if hovering over the target object
  checkIntersection(raycaster, mouse, camera);
}

function checkIntersection(raycaster, mouse, camera) {
  if (!window.targetObject) return;

  // Update the raycaster with the camera and mouse position
  raycaster.setFromCamera(mouse, camera);

  // Calculate objects intersecting the ray
  const intersects = raycaster.intersectObject(window.targetObject, true);

  if (intersects.length > 0) {
    document.body.style.cursor = 'pointer';
  } else {
    document.body.style.cursor = 'auto';
  }
}

function onClick(event, raycaster, mouse, camera, controls) {
  if (!window.targetObject) return;

  // Update the raycaster with the camera and mouse position
  raycaster.setFromCamera(mouse, camera);

  // Calculate objects intersecting the ray
  const intersects = raycaster.intersectObject(window.targetObject, true);

  if (intersects.length > 0) {
    // Focus camera on the target object
    focusOnObject(window.targetObject, camera, controls);
  }
} 