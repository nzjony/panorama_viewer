import * as THREE from 'three'

import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { RGBShiftShader } from 'three/addons/shaders/RGBShiftShader.js';
import { DotScreenShader } from 'three/addons/shaders/DotScreenShader.js';
import { RenderPixelatedPass } from 'three/addons/postprocessing/RenderPixelatedPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { fragmentShader, vertexShader } from './shaders';

const minFov = 0.01;
const maxFov = 150;

window.addEventListener('pointerdown', pointerDown);
window.addEventListener('keydown', keyDown);
window.addEventListener('pointermove', pointerMove);
window.addEventListener('wheel', wheelEvent);

const mainScene = new THREE.Scene();
const blurScene = new THREE.Scene();

//const blurScene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  90,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const blurSceneGroup = new THREE.Group();
blurScene.add(blurSceneGroup)

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

// This is smaller so it blurs
const renderTarget = new THREE.WebGLRenderTarget(window.innerWidth / 16, window.innerHeight / 16);
renderer.setRenderTarget(renderTarget);

// create screen space quad and render rendertarget to screen
// const screenGeometry = new THREE.PlaneGeometry(2, 2);
// const screenMaterial = new THREE.MeshBasicMaterial({map: renderTarget.texture});
// const screenQuad = new THREE.Mesh(screenGeometry, screenMaterial);
// fullScreenQuad.add(screenQuad);

const fullScreenCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

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

  if(!event.metaKey)
  return;

  const pointCreated = getSphereIntersection(event);
  if(pointCreated && event.metaKey)
  {
    const point = createSmallPoint();
    point.position.copy(pointCreated);
    clicks.push(pointCreated);
  }
}

let planeMaterial : THREE.ShaderMaterial;
let planeBufferGeometry: THREE.BufferGeometry;
function createPlaneWithPoints(points: THREE.Vector3[])
{
  const euler = new THREE.Euler(blurSceneGroup.rotation.x, -blurSceneGroup.rotation.y, 0, 'XYZ');
  points.forEach(point => point.applyEuler(euler));
  planeBufferGeometry = new THREE.BufferGeometry().setFromPoints(points);
  planeBufferGeometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(points.length * 2), 2));

  planeMaterial = new THREE.ShaderMaterial({side: THREE.DoubleSide, vertexShader: vertexShader, fragmentShader: fragmentShader});
  planeMaterial.depthTest = false;
  planeMaterial.uniforms = {
    u_textureSize: {value: new THREE.Vector2(window.innerWidth, window.innerHeight)},
    tDiffuse: {value: renderTarget.texture}
  }
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
  planeBufferGeometry.index = new THREE.Uint16BufferAttribute(indices, 1);
  const mesh = new THREE.Mesh(planeBufferGeometry, planeMaterial);
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

// quick hack to get the rotation of the sphere
// Rotates the sphere based on the offset in x / y pixels.
function rotateSphere(xOffset: number, yOffset: number)
{
  const dx = xOffset / window.innerWidth;
  const dxrad = dx * THREE.MathUtils.DEG2RAD * camera.fov * camera.aspect;
  const dy = yOffset / window.innerHeight;
  const dyrad = dy * THREE.MathUtils.DEG2RAD * camera.fov;
  sphere.rotation.y -= dxrad;
  sphere.rotation.x -= dyrad;
  sphere.updateMatrix();

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

renderer.autoClear = false;
function animate() {

  renderer.setRenderTarget(renderTarget);
  renderer.clear();
  renderer.render(mainScene, camera);

  if(planeMaterial)
  {
    planeMaterial.uniforms.tDiffuse.value = renderTarget.texture;
    planeMaterial.needsUpdate = true;

    // Iterate the points of the planeBufferGeometry and compute the screen space
    // coordinates, these are then the texture coordinates.
    const positions = planeBufferGeometry.attributes.position.array;
    const uvCoordinates = [];
    for(let i = 0; i < positions.length; i+=3)
    {
      const position = new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]);
      position.applyMatrix4(sphere.matrix);
      if(i===0)
      console.log(...position);
      const screenPosition = position.project(camera);
      uvCoordinates.push((screenPosition.x + 1) / 2, (screenPosition.y + 1) / 2);
    }
    const uv = planeBufferGeometry.attributes.uv.array;
    for(let i = 0; i < uvCoordinates.length; i+=2)
    {
      uv[i] = uvCoordinates[i];
      uv[i + 1] = uvCoordinates[i + 1];
    }
    planeBufferGeometry.attributes.uv.needsUpdate = true;
  }

  renderer.setRenderTarget(null);
  renderer.clear();

  renderer.render(mainScene, camera);
  // renderer.render(fullScreenQuad, fullScreenCamera);
  renderer.render(blurScene, camera);
  // composer.render();
}
renderer.setAnimationLoop( animate );
