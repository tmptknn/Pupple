import * as THREE from 'three';

import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
//import { FlyControls } from 'three/examples/jsm/controls/FlyControls';
//import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GlitchPass } from 'three/addons/postprocessing/GlitchPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import {BubbleShader} from './src/bubbleShader.js';
import { Vector2 } from 'three';
import { atan2, cross, rotate } from 'three/tsl';
// Make a new scene
let scene = new THREE.Scene();
// Set background color of the scene to gray
scene.background = new THREE.Color(0x505050);

// Make a camera. note that far is set to 100, which is better for realworld sized environments
let camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.01, 100);
camera.position.set(0, 0, 0.0001);
scene.add(camera);

// Add some lights
var light = new THREE.DirectionalLight(0xffffff,0.5);
light.position.set(1, 1, 1).normalize();
scene.add(light);
scene.add(new THREE.AmbientLight(0xffffff,0.5))

let bubble = new THREE.Mesh(
    new THREE.SphereGeometry(1.0, 32, 32),
    new THREE.MeshLambertMaterial({color:'#CCCCCC', transparent: true, opacity: 0.5})
);
const tausta = new THREE.TextureLoader().load( 'tausta.jpg');
const randomnoise = new THREE.TextureLoader().load( 'randomnoise.png' );
const equirectangular = tausta;
equirectangular.mapping = THREE.EquirectangularReflectionMapping;

// Things Github Copilot suggested, removing it does not change colors so I thing it's not the problem
equirectangular.magFilter = THREE.LinearFilter;
equirectangular.minFilter = THREE.LinearMipMapLinearFilter;
equirectangular.encoding = THREE.sRGBEncoding;
equirectangular.anisotropy = 16;
scene.background = equirectangular;



const tuniform = {
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
    }

    const tuniform2 = {
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
    }

tuniform.iChannel0.value.wrapS = tuniform.iChannel0.value.wrapT = THREE.RepeatWrapping;
tuniform.iChannel1.value.wrapS = tuniform.iChannel1.value.wrapT = THREE.RepeatWrapping;

tuniform.iResolution.value.set(window.innerWidth, window.innerHeight);

let vertexShaderSource;
let fragmentShaderSource;
async function init(){
    vertexShaderSource = await (await fetch('vertexShader.glsl')).text();
    fragmentShaderSource = await (await fetch('fragmentShader.glsl')).text();
}

await init();
//cube.position.set(0, 1.5, -10);
//scene.add(cube);
bubble.position.set(0, 1.5, -10);
scene.add(bubble);



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
let renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
// Turn on VR support
renderer.xr.enabled = true;
const VRCamera = renderer.xr.getCamera();
console.log(VRCamera);

const geometry = new THREE.PlaneGeometry(VRCamera.near*2,VRCamera.near*2,10,10);
const material = new THREE.ShaderMaterial({
    uniforms: tuniform,
    vertexShader: vertexShaderSource,
    fragmentShader: fragmentShaderSource,            
    side:THREE.DoubleSide
});
const plane = new THREE.Mesh(geometry, material);
plane.position.set(0,0,-VRCamera.near);
plane.layers.disable(0);
plane.layers.enable(1);
VRCamera.add(plane);
VRCamera.position.set(0, 0, 0);
scene.add(VRCamera);
// Set animation loop
renderer.setAnimationLoop(render);
// Add canvas to the page
document.body.appendChild(renderer.domElement);


const geometry2 = new THREE.PlaneGeometry(VRCamera.near*2,VRCamera.near*2,10,10);
const material2 = new THREE.ShaderMaterial({
    uniforms: tuniform2,
    vertexShader: vertexShaderSource,
    fragmentShader: fragmentShaderSource,            
    side:THREE.DoubleSide
});
const plane2 = new THREE.Mesh(geometry, material);
plane2.position.set(0.063,0,-VRCamera.near);
plane2.layers.disable(0);
plane2.layers.enable(2);
VRCamera.add(plane2);
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
const controls = new OrbitControls(camera, renderer.domElement);
controls.autoRotate = true;
/*let controls = new FlyControls( camera, renderer.domElement );
controls.movementSpeed = 100;
controls.rollSpeed = Math.PI / 24;
controls.autoForward = false;
controls.dragToLook = true;
*/
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

window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}



function render(time) {
    //if(renderer.xr.isPresenting && tuniforms.length <2 ){    

    //}
    //if(renderer.xr.isPresenting){ 
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
    //controls.update(0.01)
        
        let dirFront = new THREE.Vector3(0,0,1);
        let dirUp = new THREE.Vector3(0,1,0);
        let dirLeft = new THREE.Vector3(1,0,0);
        dirFront = VRCamera.getWorldDirection(dirFront);

        dirUp = dirUp.applyQuaternion( VRCamera.quaternion );
        dirLeft =dirLeft.applyQuaternion( VRCamera.quaternion );
        //console.log(dirFront, dirUp, dirLeft);
        tuniform.uFov.value = VRCamera.fov
        tuniform.uFront.value = dirFront;
        tuniform.uUp.value = dirUp;
        tuniform.uLeft.value = dirLeft;
        tuniform.uPos.value = VRCamera.position;
        tuniform.iTime.value = time/1000;
        tuniform.iResolution.value=new Vector2( 1., 1);


        let dirFront2 = new THREE.Vector3(0,0,1);
        let dirUp2 = new THREE.Vector3(0,1,0);
        let dirLeft2 = new THREE.Vector3(1,0,0);
        dirFront2 = VRCamera.getWorldDirection(dirFront2);

        dirUp2 = dirUp2.applyQuaternion( VRCamera.quaternion );
        dirLeft2 =dirLeft2.applyQuaternion( VRCamera.quaternion );
        //console.log(dirFront, dirUp, dirLeft);
        tuniform2.uFov.value = VRCamera.fov
        tuniform2.uFront.value = dirFront2;
        tuniform2.uUp.value = dirUp2;
        tuniform2.uLeft.value = dirLeft2;
        tuniform2.uPos.value = VRCamera.position.clone().add(dirLeft2.multiply(0.063));
        tuniform2.iTime.value = time/1000;
        tuniform2.iResolution.value=new Vector2( 1., 1);
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