import * as THREE from 'three'

const minFov = 0.01;
const maxFov = 150;

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

const clickedPoints = new THREE.Group();
scene.add(clickedPoints);

function createSmallPoint()
{
  const material = new THREE.MeshBasicMaterial({color: "green"});
  const point = new THREE.Mesh(geometry, material);
  point.scale.setScalar(0.01);
  clickedPoints.add(point);
  return point;
}

let clicks: any[] = [];

let startDrag = new THREE.Vector2();

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
window.addEventListener('pointerdown', pointerDown);

function createPlaneWithPoints(points: THREE.Vector3[])
{
  const bufferGeometry = new THREE.BufferGeometry().setFromPoints(points);
  const planeMaterial = new THREE.MeshBasicMaterial({color: "blue", side: THREE.DoubleSide});
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
    cube.add(mesh);
    clickedPoints.clear();
    // clicks = [];
  }
}
window.addEventListener('keydown', keyDown);

// Rotates the sphere based on the offset in x / y pixels.
const rotateSphere = (xOffset: number, yOffset: number) => {
  const dx = xOffset / window.innerWidth;
  const dxrad = dx * THREE.MathUtils.DEG2RAD * camera.fov * camera.aspect;
  const dy = yOffset / window.innerHeight;
  const dyrad = dy * THREE.MathUtils.DEG2RAD * camera.fov;
  cube.rotation.y -= dxrad;
  cube.rotation.x -= dyrad;
}

function getSphereIntersection(event: PointerEvent)
{
  const ndcX = ((event.clientX - (window.innerWidth / 2)) / (window.innerWidth / 2));
  const ndcY = (-event.clientY + (window.innerHeight / 2)) / (window.innerHeight / 2);
  const ndc = new THREE.Vector2(ndcX, ndcY);

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(ndc, camera);

  const intersects : THREE.Intersection[] = [];
  cube.raycast(raycaster, intersects);

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

window.addEventListener('pointermove', pointerMove);

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
window.addEventListener('wheel', wheelEvent);

function animate() {
	renderer.render( scene, camera );
}
renderer.setAnimationLoop( animate );
