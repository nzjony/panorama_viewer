import * as THREE from 'three'

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  90,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const geometry = new THREE.SphereGeometry(1, 16, 16);
const texture = new THREE.TextureLoader().load('/panorama.jpg');
texture.colorSpace = THREE.SRGBColorSpace;
const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, map: texture});
const pointMaterial = new THREE.MeshBasicMaterial({color: "red"});
pointMaterial.depthTest = false;
const cube = new THREE.Mesh(geometry, material);
cube.scale.setScalar(100);
const smallPoint = new THREE.Mesh(geometry, pointMaterial);
smallPoint.scale.setScalar(0.01);
scene.add(cube);
scene.add(smallPoint);

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
  const diffX = event.clientX - startDrag.x;
  const diffY = event.clientY - startDrag.y;
  if (event.buttons === 1) {
    rotateSphere(diffX, diffY);
    startDrag.x = event.clientX;
    startDrag.y = event.clientY;
  }

  const ndc = new THREE.Vector2(((event.clientX - (window.innerWidth / 2)) / (window.innerWidth / 2)),
    (-event.clientY - (window.innerHeight / 2)) / (window.innerHeight / 2) + 2);

    console.log(ndc);

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(ndc, camera);

  const intersects : THREE.Intersection[] = [];
  cube.raycast(raycaster, intersects);

  if (intersects.length > 0) {
    const point = intersects[0];
    const pointLocation = point.point;
    pointLocation.normalize();
    smallPoint.position.copy(pointLocation);
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
