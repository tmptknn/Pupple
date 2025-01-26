import * as THREE from "three";

import { VRButton } from "three/examples/jsm/webxr/VRButton.js";
//import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FlyControls } from "three/examples/jsm/controls/FlyControls";
//import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
//import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
//import { GlitchPass } from 'three/addons/postprocessing/GlitchPass.js';
//import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
//import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
//import {BubbleShader} from './src/bubbleShader.js';
import { Vector2, Vector3 } from "three";
import { atan2, cross, rotate } from "three/tsl";
import {
  collideSpheresWithToruses,
  collideSpheresWithSpheres,
  collideSpheresWithCones,
} from "./collider";
// Make a new scene
let scene = new THREE.Scene();
// Set background color of the scene to gray
scene.background = new THREE.Color(0x505050);

// Make a camera. note that far is set to 100, which is better for realworld sized environments
let camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.01,
  100
);
camera.position.set(0, 0, 3);
scene.add(camera);
// Add some lights
var light = new THREE.DirectionalLight(0xffffff, 0.5);
light.position.set(1, 1, 1).normalize();
scene.add(light);
scene.add(new THREE.AmbientLight(0xffffff, 0.5));

const tausta = new THREE.TextureLoader().load("tausta.jpg");
const randomnoise = new THREE.TextureLoader().load("randomnoisequarter.png");
const equirectangular = tausta;
equirectangular.mapping = THREE.EquirectangularReflectionMapping;

// Things Github Copilot suggested, removing it does not change colors so I thing it's not the problem
equirectangular.magFilter = THREE.LinearFilter;
equirectangular.minFilter = THREE.LinearMipMapLinearFilter;
equirectangular.encoding = THREE.sRGBEncoding;
equirectangular.anisotropy = 16;
scene.background = equirectangular;

const tuniform = {
  bubbleCount: { type: "int", value: 0 },
  fanCount: { type: "int", value: 0 },
  gateCount: { type: "int", value: 0 },
  uFans: { type: "mat4", value: null },
  uGates: { type: "mat4", value: null },
  uBubbles: { type: "vec4", value: null },

  //'tDiffuse': { type: 't', value: null },
  uFront: { type: "v3", value: new THREE.Vector3(0.0, 0.0, -1.0) },
  uUp: { type: "v3", value: new THREE.Vector3(0.0, 1.0, 0.0) },
  uLeft: { type: "v3", value: new THREE.Vector3(1.0, 0.0, 0.0) },
  uPos: { type: "v3", value: new THREE.Vector3(0.0, 0.0, 0.0) },
  iTime: { type: "f", value: 0.1 },
  //'uAngle':   { type: 'v2', value: new THREE.Vector2(0.0, 0.0) },
  uFov: { type: "f", value: 50.0 },
  iResolution: { type: "v2", value: new THREE.Vector2(1, 1) },
  iChannel0: { type: "t", value: tausta },
  iChannel1: { type: "t", value: randomnoise },
};

tuniform.iChannel0.value.wrapS = tuniform.iChannel0.value.wrapT =
  THREE.RepeatWrapping;
tuniform.iChannel1.value.wrapS = tuniform.iChannel1.value.wrapT =
  THREE.RepeatWrapping;

tuniform.iResolution.value.set(window.innerWidth, window.innerHeight);

const tuniformR = {
  fanCount: { type: "int", value: 0 },
  gateCount: { type: "int", value: 0 },
  uFans: { type: "mat4", value: null },
  uGates: { type: "mat4", value: null },
  uBubbles: { type: "vec4", value: null },
  //'tDiffuse': { type: 't', value: null },
  uFront: { type: "v3", value: new THREE.Vector3(0.0, 0.0, -1.0) },
  uUp: { type: "v3", value: new THREE.Vector3(0.0, 1.0, 0.0) },
  uLeft: { type: "v3", value: new THREE.Vector3(1.0, 0.0, 0.0) },
  uPos: { type: "v3", value: new THREE.Vector3(0.0, 0.0, 0.0) },
  iTime: { type: "f", value: 0.1 },
  //'uAngle':   { type: 'v2', value: new THREE.Vector2(0.0, 0.0) },
  uFov: { type: "f", value: 50.0 },
  iResolution: { type: "v2", value: new THREE.Vector2(1, 1) },
  iChannel0: { type: "t", value: tausta },
  iChannel1: { type: "t", value: randomnoise },
};

tuniformR.iChannel0.value.wrapS = tuniformR.iChannel0.value.wrapT =
  THREE.RepeatWrapping;
tuniformR.iChannel1.value.wrapS = tuniformR.iChannel1.value.wrapT =
  THREE.RepeatWrapping;

//tuniformR.iResolution.value.set(window.innerWidth, window.innerHeight);

const tuniformL = {
  fanCount: { type: "int", value: 0 },
  gateCount: { type: "int", value: 0 },
  uFans: { type: "mat4", value: null },
  uGates: { type: "mat4", value: null },
  uBubbles: { type: "vec4", value: null },
  //'tDiffuse': { type: 't', value: null },
  uFront: { type: "v3", value: new THREE.Vector3(0.0, 0.0, -1.0) },
  uUp: { type: "v3", value: new THREE.Vector3(0.0, 1.0, 0.0) },
  uLeft: { type: "v3", value: new THREE.Vector3(1.0, 0.0, 0.0) },
  uPos: { type: "v3", value: new THREE.Vector3(0.0, 0.0, 0.0) },
  iTime: { type: "f", value: 0.1 },
  //'uAngle':   { type: 'v2', value: new THREE.Vector2(0.0, 0.0) },
  uFov: { type: "f", value: 50.0 },
  iResolution: { type: "v2", value: new THREE.Vector2(1, 1) },
  iChannel0: { type: "t", value: tausta },
  iChannel1: { type: "t", value: randomnoise },
};

tuniformL.iChannel0.value.wrapS = tuniformL.iChannel0.value.wrapT =
  THREE.RepeatWrapping;
tuniformL.iChannel1.value.wrapS = tuniformL.iChannel1.value.wrapT =
  THREE.RepeatWrapping;

//tuniformL.iResolution.value.set(window.innerWidth, window.innerHeight);

let vertexShaderSource;
let fragmentShaderSource;
async function init() {
  vertexShaderSource = await (await fetch("vertexShader.glsl")).text();
  fragmentShaderSource = await (await fetch("fragmentShader.glsl")).text();
}

await init();
let bubbles = [];
for (let j = 0; j < 16; j++) {
  bubbles.push(0, 0, 0, 0);
}
let fanMs = [];
let gateMs = [];
for (let i = 0; i < 16 * 16; i++) {
  fanMs.push(0);
  gateMs.push(0);
}
/*
let i = 0;
let cam = camera;
let tuniforms = [];
tuniforms.push( {
    'tDiffuse': { type: 't', value: null },
    'uFront':   { type: 'v3', value: new THREE.Vector3(0.0, 0.0, -1.0) },
    'uUp':      { type: 'v3', value: new THREE.Vector3(0.0, 1.0, 0.0) },
    'uLeft':    { type: 'v3', value: new THREE.Vector3(1.0, 0.0, 0.0) },
    'uPos':     { type: 'v3', value: new THREE.Vector3(0.0, 0.0, 0.0) },
    'iTime':    { type: 'f', value: 0.1 },
    //'uAngle':   { type: 'v2', value: new THREE.Vector2(0.0, 0.0) },
    'uFov':     { type: 'f', value: 50.0},
    'iResolution': { type: 'v2', value: new THREE.Vector2(1.,1.) },
    'iChannel0':  { type: 't', value: tausta },
    'iChannel1':  { type: 't', value: randomnoise },
})
tuniforms[0].iChannel0.value.wrapS = tuniform.iChannel0.value.wrapT = THREE.RepeatWrapping;
tuniforms[0].iChannel1.value.wrapS = tuniform.iChannel1.value.wrapT = THREE.RepeatWrapping;

tuniforms[0].iResolution.value.set(window.innerWidth, window.innerHeight);
const geometry1 = new THREE.PlaneGeometry(cam.near,cam.near,10,10);
const material1 = new THREE.ShaderMaterial({
    uniforms: tuniforms[i],
    vertexShader: vertexShaderSource,
    fragmentShader: fragmentShaderSource,            
    side:THREE.DoubleSide
});
const plan = new THREE.Mesh(geometry1, material1);
plan.layers.enable(1);
plan.position.set(0,0,-cam.near-0.00001);
cam.add(plan);
i = 1;
tuniforms.push( {
    'tDiffuse': { type: 't', value: null },
    'uFront':   { type: 'v3', value: new THREE.Vector3(0.0, 0.0, -1.0) },
    'uUp':      { type: 'v3', value: new THREE.Vector3(0.0, 1.0, 0.0) },
    'uLeft':    { type: 'v3', value: new THREE.Vector3(1.0, 0.0, 0.0) },
    'uPos':     { type: 'v3', value: new THREE.Vector3(0.0, 0.0, 0.0) },
    'iTime':    { type: 'f', value: 0.1 },
    //'uAngle':   { type: 'v2', value: new THREE.Vector2(0.0, 0.0) },
    'uFov':     { type: 'f', value: 50.0 },
    'iResolution': { type: 'v2', value: new THREE.Vector2(1.,1.) },
    'iChannel0':  { type: 't', value: tausta },
    'iChannel1':  { type: 't', value: randomnoise },
})
tuniforms[1].iChannel0.value.wrapS = tuniform.iChannel0.value.wrapT = THREE.RepeatWrapping;
tuniforms[1].iChannel1.value.wrapS = tuniform.iChannel1.value.wrapT = THREE.RepeatWrapping;

tuniforms[1].iResolution.value.set(window.innerWidth, window.innerHeight);
const geometry2 = new THREE.PlaneGeometry(cam.near,cam.near,10,10);
const material2 = new THREE.ShaderMaterial({
    uniforms: tuniforms[i],
    vertexShader: vertexShaderSource,
    fragmentShader: fragmentShaderSource,            
    side:THREE.DoubleSide
});
const plan2 = new THREE.Mesh(geometry2, material2);
plan2.layers.enable(2);
plan2.position.set(0,0,-cam.near-0.00001);
cam.add(plan2);
*/
// Make a renderer that fills the screen
let renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
// Turn on VR support
renderer.xr.enabled = true;

const geometry = new THREE.PlaneGeometry(
  (camera.near * window.innerWidth) / window.innerHeight,
  camera.near,
  10,
  10
);
const material = new THREE.ShaderMaterial({
  uniforms: tuniform,
  vertexShader: vertexShaderSource,
  fragmentShader: fragmentShaderSource,
  side: THREE.DoubleSide,
});
const plane = new THREE.Mesh(geometry, material);
plane.position.set(0, 0, -camera.near);
plane.layers.disable(1);
plane.layers.disable(2);
plane.layers.enable(0);
//plane.layers.disable(0);
camera.add(plane);

function addBubble(x, y, z, soapBubbles, radius = 0.1) {
  const bubble_geometry = new THREE.SphereGeometry(radius, 32, 32);
  const bubble_material = new THREE.MeshLambertMaterial({
    color: "#CCCCCC",
    transparent: true,
    opacity: 0.8,
  });
  const bubble = new THREE.Mesh(bubble_geometry, bubble_material);
  bubble.position.set(x, y, z);
  bubble.userData = { speed: new Vector3(0, 0, 0) };
  soapBubbles.push(bubble);
}

function addGate(x, y, z, gates, rotationY = 0) {
  const geometry_torus = new THREE.TorusGeometry(0.5, 0.05, 16, 100);
  const material_torus = new THREE.MeshBasicMaterial({ color: 0xffff00 });
  const torus = new THREE.Mesh(geometry_torus, material_torus);
  torus.position.set(x, y, z);
  torus.rotateY(rotationY);
  gates.push(torus);
}

function addFan(x, y, z, fans, rotationY = 0) {
  const geometry_torus = new THREE.TorusGeometry(0.5, 0.05, 16, 100);
  const material_torus = new THREE.MeshBasicMaterial({ color: 0xffff00 });
  const torus = new THREE.Mesh(geometry_torus, material_torus);
  torus.position.set(x, y, z);
  torus.rotateY(rotationY);
  fans.push(torus);
}

function addToScene(gameObject) {
  scene.add(gameObject);
}

let soapBubbles = [];
for (let i = 0; i < 16; i++) {
  addBubble(
    (Math.random() - 0.5) * 3,
    (Math.random() - 0.5) * 2,
    (Math.random() - 0.5) * 3,
    soapBubbles,
    Math.random() * 0.1 + 0.15
  );
}
soapBubbles.forEach(addToScene);

const gates = [];
addGate(0, 0, -1.5, gates);
addGate(1, 0.5, -3, gates, -Math.PI / 5);
addGate(-1, 1, -5, gates, Math.PI / 5);
addGate(0, 0.5, -8, gates);

gates.forEach(addToScene);

const fans = [];
addFan(0, 1, -1.5, fans, Math.PI / 4);
addFan(0, 0, 0, fans);
fans.forEach(addToScene);

const VRCamera = renderer.xr.getCamera();
//console.log(VRCamera);
VRCamera.position.set(0, 0, 0);
scene.add(VRCamera);

const geometryR = new THREE.PlaneGeometry(
  VRCamera.near * 2,
  VRCamera.near * 2,
  10,
  10
);
const materialR = new THREE.ShaderMaterial({
  uniforms: tuniformR,
  vertexShader: vertexShaderSource,
  fragmentShader: fragmentShaderSource,
  side: THREE.DoubleSide,
});
const planeR = new THREE.Mesh(geometryR, materialR);
planeR.position.set(0, 0, -VRCamera.near);
planeR.layers.disable(0);
planeR.layers.enable(1);
VRCamera.add(planeR);

const geometryL = new THREE.PlaneGeometry(
  VRCamera.near * 2,
  VRCamera.near * 2,
  10,
  10
);
const materialL = new THREE.ShaderMaterial({
  uniforms: tuniformL,
  vertexShader: vertexShaderSource,
  fragmentShader: fragmentShaderSource,
  side: THREE.DoubleSide,
});
const planeL = new THREE.Mesh(geometryL, materialL);
planeL.position.set(0.063, 0, -VRCamera.near);
planeL.layers.disable(0);
planeL.layers.enable(2);
VRCamera.add(planeL);

//VRCamera.position.set(0, 0, 0);
//scene.add(VRCamera);
// Set animation loop
renderer.setAnimationLoop(render);
// Add canvas to the page
document.body.appendChild(renderer.domElement);

// Add a button to enter/exit vr to the page
document.body.appendChild(VRButton.createButton(renderer));

// For AR instead, import ARButton at the top
//    import { ARButton } from 'https://unpkg.com/three/examples/jsm/webxr/ARButton.js';
// then create the button
//  document.body.appendChild(ARButton.createButton(renderer));
//const controls = new OrbitControls(camera, renderer.domElement);
//controls.autoRotate = true;
let controls = new FlyControls(camera, renderer.domElement);
controls.movementSpeed = 0.5;
controls.rollSpeed = Math.PI / 3;
controls.autoForward = false;
controls.dragToLook = true;

//const composer = new EffectComposer( renderer );
// Handle browser resize
//const renderPass = new RenderPass( scene, camera );
//composer.addPass( renderPass );

//const glitchPass = new GlitchPass();
//composer.addPass( glitchPass );

//const outputPass = new OutputPass();
//composer.addPass( outputPass );

//const bubblePass = new ShaderPass( BubbleShader );
//composer.addPass( bubblePass );

window.addEventListener("resize", onWindowResize, false);

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

let wind = [0, 0];

function render(time) {
  fans[0].rotateY(0.01);
  //if(renderer.xr.isPresenting && tuniforms.length <2 ){
  wind[0] += (Math.random() - 0.5) * 0.000001;
  wind[1] += (Math.random() - 0.5) * 0.000001;
  for (let i = 0; i < soapBubbles.length; i++) {
    soapBubbles[i].userData.speed.add(new Vector3(wind[0], 0, wind[1]));
    soapBubbles[i].userData.speed.multiplyScalar(0.94);
    soapBubbles[i].userData.speed.add(
      new Vector3(
        (Math.random() - 0.5) * 0.001,
        (Math.random() - 0.5) * 0.001,
        (Math.random() - 0.5) * 0.001
      )
    );

    soapBubbles[i].position.add(
      new Vector3(
        soapBubbles[i].userData.speed.x +
          (Math.random() - 0.5) * 0.00001 +
          wind[0],
        soapBubbles[i].userData.speed.y + (Math.random() - 0.5) * 0.0001,
        soapBubbles[i].userData.speed.z +
          (Math.random() - 0.5) * 0.00001 +
          wind[1]
      )
    );
  }

  for (let j = 0; j < soapBubbles.length; j++) {
    bubbles[4 * j + 0] = soapBubbles[j].position.x;
    bubbles[4 * j + 1] = soapBubbles[j].position.y;
    bubbles[4 * j + 2] = soapBubbles[j].position.z;
    bubbles[4 * j + 3] = soapBubbles[j].geometry.parameters.radius;
  }
  for (let j = 0; j < gates.length; j++) {
    let gate0 = gates[j].matrixWorld.invert();
    for (let i = 0; i < 16; i++) {
      gateMs[16 * j + i] = gate0.elements[i];
    }
  }
  for (let j = 0; j < fans.length; j++) {
    let fan0 = fans[j].matrixWorld.invert();
    for (let i = 0; i < 16; i++) {
      fanMs[16 * j + i] = fan0.elements[i];
    }
  }
  controls.update(0.01);

  let collisions = collideSpheresWithToruses(soapBubbles, gates);
  if (collisions.length > 0) {
    console.log("Collisions:", collisions);
    for (let collision of collisions) {
      scene.remove(soapBubbles[collision.sphere]);
      soapBubbles.splice(collision.sphere, 1);
    }
  }

  let sphereCollisions = collideSpheresWithSpheres(soapBubbles);
  if (sphereCollisions.length > 0) {
    //console.log("Sphere collisions:", sphereCollisions);
    for (let collision of sphereCollisions) {
      let bubble1 = soapBubbles[collision.sphere1];
      let bubble2 = soapBubbles[collision.sphere2];
      let bubblea = bubble2;
      let bubbleb = bubble1;
      if (
        bubble1.geometry.parameters.radius > bubble2.geometry.parameters.radius
      ) {
        bubblea = bubble1;
        bubbleb = bubble2;
      }
      let massa = 4 * Math.PI * Math.pow(bubblea.geometry.parameters.radius, 2);
      let massb = 4 * Math.PI * Math.pow(bubbleb.geometry.parameters.radius, 2);
      let ra = bubblea.geometry.parameters.radius;
      let rb = bubbleb.geometry.parameters.radius;
      let desiredDistance = Math.sqrt(
        ra * ra + rb * rb - 2 * ra * rb * Math.cos(Math.PI / 3)
      );
      let distancce = bubblea.position.distanceTo(bubbleb.position);
      let change = (desiredDistance - distancce) * 0.15;
      let changea = (change * massb) / (massa + massb);
      let changeb = (change * massa) / (massa + massb);
      let direction = bubblea.position
        .clone()
        .sub(bubbleb.position)
        .normalize();
      bubblea.position.add(direction.multiplyScalar(changea));
      bubbleb.position.add(direction.multiplyScalar(-changeb));
      bubblea.userData.speed.add(direction.multiplyScalar(changea * 0.1));
      bubbleb.userData.speed.add(direction.multiplyScalar(-changeb * 0.1));
      /*
      let speed = bubblea.userData.speed
        .clone()
        .multiply(massa)
        .add(bubbleb.userData.speed.clone().multiply(massb))
        .multiply(1 / (massa + massb));
      bubblea.userData.speed = speed;
      bubbleb.userData.speed = speed;
      */
    }
  }

  let blown = collideSpheresWithCones(soapBubbles, [camera]);
  if (blown.length > 0) {
    //console.log("Blown:", blown);
    for (let blow of blown) {
      let sphere = soapBubbles[blow.sphere];
      let diff = sphere.position.clone().sub(camera.position);
      let distance = diff.length();
      let strength = Math.max(0, 1.0 - distance);
      let dirFront = new THREE.Vector3(0, 0, 1);
      dirFront = camera.getWorldDirection(dirFront);
      /*sphere.userData.speed.add(
        sphere.position
          .clone()
          .sub(camera.position)
          .normalize()
          .multiplyScalar(strength * 0.1)
      );
      */
      sphere.userData.speed.add(dirFront.multiplyScalar(strength * 0.01));
    }
  }

  let fanBlown = collideSpheresWithCones(soapBubbles, fans);
  if (fanBlown.length > 0) {
    //console.log("Blown:", blown);
    for (let blow of blown) {
      let sphere = soapBubbles[blow.sphere];
      let fan = fans[blow.cone];
      let diff = sphere.position.clone().sub(fan.position);
      let distance = diff.length();
      let strength = Math.max(0, 1.0 - distance);
      let dirFront = new THREE.Vector3(0, 0, 1);
      dirFront = dirFront.applyQuaternion(fan.quaternion);
      /*sphere.userData.speed.add(
        sphere.position
          .clone()
          .sub(fan.position)
          .normalize()
          .multiplyScalar(strength * 0.1)
      );
      */
      sphere.userData.speed.add(dirFront.multiplyScalar(strength * 0.01));
    }
  }

  //}
  if (renderer.xr.isPresenting) {
    //for(let i=0; i<camera.cameras.length; i++){
    /*
            for(let i =0; i<2; i++){
            let cam = camera;
            let dirFront = new THREE.Vector3(0,0,1);
            let dirUp = new THREE.Vector3(0,1,0);
            let dirLeft = new THREE.Vector3(1,0,0);
            dirFront = cam.getWorldDirection(dirFront);
    
            dirUp = dirUp.applyQuaternion( cam.quaternion );
            dirLeft =dirLeft.applyQuaternion( cam.quaternion );
            //console.log(dirFront, dirUp, dirLeft);
            tuniforms[i].uFov.value = cam.fov/2.0
            tuniforms[i].uFront.value = dirFront;
            tuniforms[i].uUp.value = dirUp;
            tuniforms[i].uLeft.value = dirLeft;
            tuniforms[i].uPos.value = camera.position;
            tuniforms[i].iTime.value = time/1000;
            tuniforms[i].iResolution.value=new Vector2( 1., 1.);
    }
            */
    //}

    //}
    // Rotate the cube
    //cube.rotation.y = time / 1000;
    // Draw everything
    //composer.
    //tuniform.iTime.value = time/1000;

    let dirFrontR = new THREE.Vector3(0, 0, 1);
    let dirUpR = new THREE.Vector3(0, 1, 0);
    let dirLeftR = new THREE.Vector3(1, 0, 0);
    dirFrontR = VRCamera.getWorldDirection(dirFrontR);

    dirUpR = dirUpR.applyQuaternion(VRCamera.quaternion);
    dirLeftR = dirLeftR.applyQuaternion(VRCamera.quaternion);
    //console.log(dirFront, dirUp, dirLeft);
    tuniformR.uFov.value = VRCamera.fov;
    tuniformR.uFront.value = dirFrontR;
    tuniformR.uUp.value = dirUpR;
    tuniformR.uLeft.value = dirLeftR;
    tuniformR.uPos.value = VRCamera.position;
    tuniformR.iTime.value = time / 1000;
    tuniformR.iResolution.value = new Vector2(1, 1);
    tuniformR.uBubbles.value = bubbles;

    let dirFrontL = new THREE.Vector3(0, 0, 1);
    let dirUpL = new THREE.Vector3(0, 1, 0);
    let dirLeftL = new THREE.Vector3(1, 0, 0);
    dirFrontL = VRCamera.getWorldDirection(dirFrontL);

    dirUpL = dirUpL.applyQuaternion(VRCamera.quaternion);
    dirLeftL = dirLeftL.applyQuaternion(VRCamera.quaternion);
    //console.log(dirFront, dirUp, dirLeft);
    tuniformL.uFov.value = VRCamera.fov;
    tuniformL.uFront.value = dirFrontL;
    tuniformL.uUp.value = dirUpL;
    tuniformL.uLeft.value = dirLeftL;
    tuniformL.uPos.value = VRCamera.position
      .clone()
      .add(dirLeftL.clone().multiplyScalar(0.063));
    tuniformL.iTime.value = time / 1000;
    tuniformL.iResolution.value = new Vector2(1, 1);
    tuniformL.uBubbles.value = bubbles;
  } else {
    let dirFront = new THREE.Vector3(0, 0, 1);
    let dirUp = new THREE.Vector3(0, 1, 0);
    let dirLeft = new THREE.Vector3(1, 0, 0);
    dirFront = camera.getWorldDirection(dirFront);

    dirUp = dirUp.applyQuaternion(camera.quaternion);
    dirLeft = dirLeft.applyQuaternion(camera.quaternion);
    //console.log(dirFront, dirUp, dirLeft);
    tuniform.uFov.value = camera.fov;
    tuniform.uFront.value = dirFront;
    tuniform.uUp.value = dirUp;

    tuniform.uLeft.value = dirLeft;
    tuniform.uPos.value = camera.position;
    tuniform.iTime.value = time / 1000;
    tuniform.iResolution.value = new Vector2(
      1,
      window.innerHeight / window.innerWidth
    );
    tuniform.uBubbles.value = bubbles;
    tuniform.uFans.value = fanMs;
    tuniform.uGates.value = gateMs;
    tuniform.gateCount.value = gates.length;
    tuniform.fanCount.value = fans.length;
    tuniform.bubbleCount.value = soapBubbles.length;
    //tuniform.fanCount.value = fans.length;
    //dirUp.cross(new THREE.Vector3(0,1,0));
    if (dirUp.y < 0.9) {
      //camera.rotateOnAxis((dirUp.cross(new THREE.Vector3(0,1,0))).normalize(),0.01);
      //camera.rotateOnWorldAxis((dirUp.cross(new THREE.Vector3(0,1,0))).normalize(),0.01);
    }
  }
  /*
        bubblePass.uniforms.uFov.value = camera.fov/2.0;
        bubblePass.uniforms.uFront.value = dirFront;
        bubblePass.uniforms.uUp.value = dirUp;
        bubblePass.uniforms.uLeft.value = dirLeft;
        bubblePass.uniforms.uPos.value = camera.position;
        bubblePass.uniforms.iTime.value = time/1000;
        bubblePass.uniforms.iResolution.value=new Vector2( 1., window.innerHeight/window.innerWidth);
        */
  //console.log(camera);
  renderer.render(scene, camera);
  //composer.render();
}

//renderer.domElement.addEventListener("click", toggleMusic);
var musicPlaying = false;

// create an AudioListener and add it to the camera
const listener = new THREE.AudioListener();
camera.add(listener);

// create a global audio source
const sound = new THREE.Audio(listener);

// load a sound and set it as the Audio object's buffer
const audioLoader = new THREE.AudioLoader();
audioLoader.load("./music/calming_music.ogg", function (buffer) {
  sound.setBuffer(buffer);
  sound.setLoop(true);
  sound.setVolume(0.5);
});

var btnToggleMusic = document.getElementById("btnToggleMusic");
btnToggleMusic.addEventListener("click", toggleMusic);

function toggleMusic() {
  if (musicPlaying) {
    musicPlaying = false;
    sound.pause();
  } else {
    musicPlaying = true;
    sound.play();
  }
}
