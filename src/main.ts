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


function animate() {
	renderer.render( scene, camera );
}
renderer.setAnimationLoop( animate );
