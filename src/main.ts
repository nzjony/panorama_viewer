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

window.addEventListener('pointermove', (event) => {
  if (event.buttons === 1) {
    const dx = (event.clientX - startDrag.x) / window.innerWidth;
    const dxrad = dx * THREE.MathUtils.DEG2RAD * camera.fov * camera.aspect;
    const dy = (event.clientY - startDrag.y) / window.innerHeight;
    const dyrad = dy * THREE.MathUtils.DEG2RAD * camera.fov;
    startDrag.x = event.clientX;
    startDrag.y = event.clientY;
    cube.rotation.y -= dxrad;
    cube.rotation.x -= dyrad;
  }
});

function animate() {
	renderer.render( scene, camera );
}
renderer.setAnimationLoop( animate );
