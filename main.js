import * as THREE from 'three';

import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
//import { FlyControls } from 'three/examples/jsm/controls/FlyControls';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
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
        'uFov':     { type: 'f', value: 50.0/180.*Math.PI },
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

const geometry = new THREE.PlaneGeometry(camera.near*window.innerWidth/window.innerHeight,camera.near,10,10);
const material = new THREE.ShaderMaterial({
    uniforms: tuniform,
    vertexShader: vertexShaderSource,
    fragmentShader: fragmentShaderSource,            
    side:THREE.DoubleSide
});
const plane = new THREE.Mesh(geometry, material);
plane.position.set(0,0,-camera.near);
camera.add(plane);
// Make a renderer that fills the screen
let renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
// Turn on VR support
renderer.xr.enabled = true;
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

let tuniforms = [];

function render(time) {
    if(renderer.xr.isPresenting && tuniforms.length <2 ){    
        let i = 0;
            let cam = camera;
            tuniforms.push( {
                'tDiffuse': { type: 't', value: null },
                'uFront':   { type: 'v3', value: new THREE.Vector3(0.0, 0.0, -1.0) },
                'uUp':      { type: 'v3', value: new THREE.Vector3(0.0, 1.0, 0.0) },
                'uLeft':    { type: 'v3', value: new THREE.Vector3(1.0, 0.0, 0.0) },
                'uPos':     { type: 'v3', value: new THREE.Vector3(0.0, 0.0, 0.0) },
                'iTime':    { type: 'f', value: 0.1 },
                //'uAngle':   { type: 'v2', value: new THREE.Vector2(0.0, 0.0) },
                'uFov':     { type: 'f', value: 50.0/180.*Math.PI },
                'iResolution': { type: 'v2', value: new THREE.Vector2(1.,1.) },
                'iChannel0':  { type: 't', value: tausta },
                'iChannel1':  { type: 't', value: randomnoise },
            })
            const geometry = new THREE.PlaneGeometry(cam.near,cam.near,10,10);
            const material = new THREE.ShaderMaterial({
                uniforms: tuniforms[i],
                vertexShader: vertexShaderSource,
                fragmentShader: fragmentShaderSource,            
                side:THREE.DoubleSide
            });
            const plan = new THREE.Mesh(geometry, material);
            plan.position.set(0,0,-cam.near);
            cam.add(plan);
    }
    if(renderer.xr.isPresenting){
        //for(let i=0; i<camera.cameras.length; i++){
            let i=0;
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
        //}

    }else{
    // Rotate the cube
    //cube.rotation.y = time / 1000;
    // Draw everything
    //composer.
    //tuniform.iTime.value = time/1000;
    //controls.update(0.01)
        
        let dirFront = new THREE.Vector3(0,0,1);
        let dirUp = new THREE.Vector3(0,1,0);
        let dirLeft = new THREE.Vector3(1,0,0);
        dirFront = camera.getWorldDirection(dirFront);

        dirUp = dirUp.applyQuaternion( camera.quaternion );
        dirLeft =dirLeft.applyQuaternion( camera.quaternion );
        //console.log(dirFront, dirUp, dirLeft);
        tuniform.uFov.value = camera.fov/2.0
        tuniform.uFront.value = dirFront;
        tuniform.uUp.value = dirUp;
        tuniform.uLeft.value = dirLeft;
        tuniform.uPos.value = camera.position;
        tuniform.iTime.value = time/1000;
        tuniform.iResolution.value=new Vector2( 1., window.innerHeight/window.innerWidth);
/*
        bubblePass.uniforms.uFov.value = camera.fov/2.0;
        bubblePass.uniforms.uFront.value = dirFront;
        bubblePass.uniforms.uUp.value = dirUp;
        bubblePass.uniforms.uLeft.value = dirLeft;
        bubblePass.uniforms.uPos.value = camera.position;
        bubblePass.uniforms.iTime.value = time/1000;
        bubblePass.uniforms.iResolution.value=new Vector2( 1., window.innerHeight/window.innerWidth);
        */
    }
    renderer.render(scene, camera);
    //composer.render();
    
}