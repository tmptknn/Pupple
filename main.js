import * as THREE from 'three';

import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GlitchPass } from 'three/addons/postprocessing/GlitchPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import {BubbleShader} from './src/bubbleShader.js';
import { Vector2 } from 'three';
// Make a new scene
let scene = new THREE.Scene();
// Set background color of the scene to gray
scene.background = new THREE.Color(0x505050);

// Make a camera. note that far is set to 100, which is better for realworld sized environments
let camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1.6, 3);
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

const equirectangular = new THREE.TextureLoader().load('360_0382.pano.jpg');
equirectangular.mapping = THREE.EquirectangularReflectionMapping;

// Things Github Copilot suggested, removing it does not change colors so I thing it's not the problem
equirectangular.magFilter = THREE.LinearFilter;
equirectangular.minFilter = THREE.LinearMipMapLinearFilter;
equirectangular.encoding = THREE.sRGBEncoding;
equirectangular.anisotropy = 16;
scene.background = equirectangular;


//cube.position.set(0, 1.5, -10);
//scene.add(cube);
bubble.position.set(0, 1.5, -10);
scene.add(bubble);

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
const composer = new EffectComposer( renderer );
// Handle browser resize
const renderPass = new RenderPass( scene, camera );
composer.addPass( renderPass );

const glitchPass = new GlitchPass();
composer.addPass( glitchPass );

const outputPass = new OutputPass();
composer.addPass( outputPass );

const bubblePass = new ShaderPass( BubbleShader );
composer.addPass( bubblePass );

window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function render(time) {
    // Rotate the cube
    //cube.rotation.y = time / 1000;
    // Draw everything
    //composer.
    //tuniform.iTime.value = time/1000;
    bubblePass.uniforms.iTime.value = time/1000;
    bubblePass.uniforms.iResolution.value=new Vector2( 1.,1.);
    //renderer.render(scene, camera);
    composer.render();
    
}