import * as THREE from 'three'

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const geometry = new THREE.SphereGeometry(1, 16, 16)
const texture = new THREE.TextureLoader().load('/panorama.jpg');
texture.colorSpace = THREE.SRGBColorSpace;
const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, map: texture});
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

let startDrag = new THREE.Vector2();
window.addEventListener('pointerdown', (event) => {
  startDrag.x = event.clientX;
  startDrag.y = event.clientY;
});

const minFov = 0.01;
const maxFov = 150;

// Rotates the sphere based on the offset in x / y pixels.
const rotateSphere = (xOffset: number, yOffset: number) => {
  const dx = xOffset / window.innerWidth;
  const dxrad = dx * THREE.MathUtils.DEG2RAD * camera.fov * camera.aspect;
  const dy = yOffset / window.innerHeight;
  const dyrad = dy * THREE.MathUtils.DEG2RAD * camera.fov;
  cube.rotation.y -= dxrad;
  cube.rotation.x -= dyrad;
}

window.addEventListener('pointermove', (event) => {
  if (event.buttons === 1) {
    rotateSphere(event.clientX - startDrag.x, event.clientY - startDrag.y);
    startDrag.x = event.clientX;
    startDrag.y = event.clientY;
  }
});

window.addEventListener('wheel', (event) => {
  const currentFov = camera.fov;
  const newFov = Math.max(Math.min(currentFov + event.deltaY * 0.05, maxFov), minFov);
  const percentChange = 1 - newFov / currentFov;

  const toWheelPositionX = (event.clientX - window.innerWidth / 2);
  const toWheelPositionY = (event.clientY - window.innerHeight / 2);
  const shiftX = toWheelPositionX * percentChange
  const shiftY = toWheelPositionY * percentChange

  rotateSphere(-shiftX, -shiftY);

  camera.fov = newFov;
  camera.updateProjectionMatrix();

});

function animate() {
	renderer.render( scene, camera );
}
renderer.setAnimationLoop( animate );
