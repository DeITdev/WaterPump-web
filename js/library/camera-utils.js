import * as THREE from 'three';

export function enforceCameraLimits(camera) {
  // Clamp Y position between 1.0 and 7.0
  camera.position.y = Math.max(1.0, Math.min(7.0, camera.position.y));

  // Clamp X and Z positions to not exceed 8.0
  camera.position.x = Math.max(-8.0, Math.min(8.0, camera.position.x));
  camera.position.z = Math.max(-8.0, Math.min(8.0, camera.position.z));

  // Update camera matrix after position changes
  camera.updateProjectionMatrix();
}

export function focusOnObject(object, camera, controls) {
  // Get the center of the object
  const boundingBox = new THREE.Box3().setFromObject(object);
  const center = new THREE.Vector3();
  boundingBox.getCenter(center);

  // Calculate a good position to view the object from
  const size = new THREE.Vector3();
  boundingBox.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z);
  const fov = camera.fov * (Math.PI / 180);
  const distance = maxDim / (2 * Math.tan(fov / 2));

  // Animate camera movement to focus on the object
  const startPosition = camera.position.clone();
  const endPosition = center.clone().add(new THREE.Vector3(0, 0, distance * 1.5));

  const duration = 1000; // Animation duration in milliseconds
  const startTime = Date.now();

  function animateCamera() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Use an easing function for smoother animation
    const easeProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease out

    // Interpolate camera position
    camera.position.lerpVectors(startPosition, endPosition, easeProgress);

    // Make camera look at the object center
    camera.lookAt(center);

    if (progress < 1) {
      requestAnimationFrame(animateCamera);
    } else {
      // Update controls target to the object center
      controls.target.copy(center);
      controls.update();
    }
  }

  animateCamera();
} 