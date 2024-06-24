import * as THREE from 'three'

import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { RGBShiftShader } from 'three/addons/shaders/RGBShiftShader.js';
import { DotScreenShader } from 'three/addons/shaders/DotScreenShader.js';
import { RenderPixelatedPass } from 'three/addons/postprocessing/RenderPixelatedPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const minFov = 0.01;
const maxFov = 150;

let composer : EffectComposer;

window.addEventListener('pointerdown', pointerDown);
window.addEventListener('keydown', keyDown);
window.addEventListener('pointermove', pointerMove);
window.addEventListener('wheel', wheelEvent);

const mainScene = new THREE.Scene();

//const blurScene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  90,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const blurSceneGroup = new THREE.Group();
// blurScene.add(blurSceneGroup);
mainScene.add(blurSceneGroup)

function createSphere()
{
  const texture = new THREE.TextureLoader().load('/panorama.jpg');
  texture.colorSpace = THREE.SRGBColorSpace;
  const geometry = new THREE.SphereGeometry(1, 16, 16);
  const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, map: texture});
  const sphere = new THREE.Mesh(geometry, material);
  sphere.scale.setScalar(100);
  return sphere;
}

const renderer = new THREE.WebGLRenderer();
const clickedPoints = new THREE.Group();
const geometry = new THREE.SphereGeometry(1, 16, 16);
const sphere = createSphere();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const pointMaterial = new THREE.MeshBasicMaterial({color: "red"});
pointMaterial.depthTest = false;
const smallPoint = new THREE.Mesh(geometry, pointMaterial);
smallPoint.scale.setScalar(0.01);

mainScene.add(sphere);
mainScene.add(smallPoint);
// This holds the objects that represent the user's clicks on the sphere.
mainScene.add(clickedPoints);

let clicks: any[] = [];
let startDrag = new THREE.Vector2();

function createSmallPoint()
{
  const material = new THREE.MeshBasicMaterial({color: "green"});
  const point = new THREE.Mesh(geometry, material);
  point.scale.setScalar(0.01);
  clickedPoints.add(point);
  return point;
}

function pointerDown(event: PointerEvent)
{
  startDrag.x = event.clientX;
  startDrag.y = event.clientY;

  const pointCreated = getSphereIntersection(event);
  if(pointCreated)
  {
    const point = createSmallPoint();
    point.position.copy(pointCreated);
    clicks.push(pointCreated);
  }
}

function createPlaneWithPoints(points: THREE.Vector3[])
{
  const bufferGeometry = new THREE.BufferGeometry().setFromPoints(points);
  const planeMaterial = new THREE.MeshBasicMaterial({color: "blue", side: THREE.DoubleSide, transparent: true, opacity: 0.5});
  planeMaterial.depthTest = false;
  const indices = [];
  if(points.length < 4)
  {
    indices.push(0, 1, 2);
  }
  else
  {
    for(let i = 0; i < points.length; i+=4)
    {
      indices.push(0, 1, 2, 0, 2, 3);
    }
  }
  bufferGeometry.index = new THREE.Uint16BufferAttribute(indices, 1);
  const mesh = new THREE.Mesh(bufferGeometry, planeMaterial);
  return mesh;
}

function keyDown(event: KeyboardEvent)
{
  if(event.key === "Enter")
  {
    const mesh = createPlaneWithPoints(clicks);
    // How to do transform?
    blurSceneGroup.add(mesh);
    // cube.add(mesh);
    clickedPoints.clear();
  }
}

// Rotates the sphere based on the offset in x / y pixels.
function rotateSphere(xOffset: number, yOffset: number)
{
  const dx = xOffset / window.innerWidth;
  const dxrad = dx * THREE.MathUtils.DEG2RAD * camera.fov * camera.aspect;
  const dy = yOffset / window.innerHeight;
  const dyrad = dy * THREE.MathUtils.DEG2RAD * camera.fov;
  sphere.rotation.y -= dxrad;
  sphere.rotation.x -= dyrad;

  // The blur scene group also needs to be rotated;
  blurSceneGroup.rotation.y -= dxrad;
  blurSceneGroup.rotation.x -= dyrad;
}

function getSphereIntersection(event: PointerEvent)
{
  const ndcX = ((event.clientX - (window.innerWidth / 2)) / (window.innerWidth / 2));
  const ndcY = (-event.clientY + (window.innerHeight / 2)) / (window.innerHeight / 2);
  const ndc = new THREE.Vector2(ndcX, ndcY);

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(ndc, camera);

  const intersects : THREE.Intersection[] = [];
  sphere.raycast(raycaster, intersects);

  if (intersects.length > 0) {
    const point = intersects[0];
    const pointLocation = point.point;
    pointLocation.normalize();
    return pointLocation;
  }
  return null;
}

function pointerMove(event: PointerEvent)
{
  const diffX = event.clientX - startDrag.x;
  const diffY = event.clientY - startDrag.y;
  if (event.buttons === 1) {
    rotateSphere(diffX, diffY);
    startDrag.x = event.clientX;
    startDrag.y = event.clientY;
  }

  const mouseLocation = getSphereIntersection(event);
  if(mouseLocation)
  {
    smallPoint.position.copy(mouseLocation);
  }
}

function wheelEvent(event: WheelEvent)
{
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
}

// Try to get this working.
// composer = new EffectComposer(renderer);
// composer.addPass(new RenderPass(mainScene, camera));

// let blurScene1 = new RenderPixelatedPass(6, blurScene, camera, {
// });
// blurScene1.clear = false;
// blurScene1.renderToScreen = true;
// blurScene1.pixelatedMaterial.transparent = true;
// composer.addPass(blurScene1);


function animate() {
  renderer.render(mainScene, camera);
  // composer.render();
}
renderer.setAnimationLoop( animate );
