import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- State and Refs ---
const state = {
    bot: `/static/models/ybot/ybot.glb`,
    speed: 0.1,
    pause: 800,
};

const ref = {
    animations: [],
    flag: false,
    pending: false,
    scene: null,
    camera: null,
    renderer: null,
    avatar: null,
    animate: null,
    mixer: null,
    clock: null,
    controls: null,
    currentAnimation: null
};

// --- Animation Loop ---
function animate() {
    requestAnimationFrame(animate);
    
    if (ref.mixer) {
        const delta = ref.clock.getDelta();
        ref.mixer.update(delta);
    }

    if (ref.controls) {
        ref.controls.update();
    }

    if (ref.renderer && ref.scene && ref.camera) {
        ref.renderer.render(ref.scene, ref.camera);
    }
}

// --- Setup 3D Scene ---
function init() {
    const container = document.getElementById('viewerCanvas');
    const statusContainer = document.getElementById('status-container');

    // Scene
    ref.scene = new THREE.Scene();
    ref.scene.background = new THREE.Color(0xf8f9fa);

    // Camera
    const aspect = container.clientWidth / container.clientHeight;
    ref.camera = new THREE.PerspectiveCamera(30, aspect, 0.1, 1000);
    ref.camera.position.set(0, 1.4, 1.6);

    // Renderer
    ref.renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true 
    });
    ref.renderer.setSize(container.clientWidth, container.clientHeight);
    ref.renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(ref.renderer.domElement);

    // Lights
    const spotLight = new THREE.SpotLight(0xffffff, 2);
    spotLight.position.set(0, 5, 5);
    ref.scene.add(spotLight);
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    ref.scene.add(ambientLight);

    // Controls
    ref.controls = new OrbitControls(ref.camera, ref.renderer.domElement);
    ref.controls.target.set(0, 1.2, 0);
    ref.controls.enableDamping = true;
    ref.controls.dampingFactor = 0.08;
    ref.controls.update();

    // Clock for animations
    ref.clock = new THREE.Clock();

    // Load initial model
    loadModel(state.bot);

    // Start animation loop
    animate();

    // Handle window resize
    window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
    const container = document.getElementById('viewerCanvas');
    if (!ref.camera || !ref.renderer) return;
    
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    ref.camera.aspect = width / height;
    ref.camera.updateProjectionMatrix();
    ref.renderer.setSize(width, height);
}

function loadModel(modelPath) {
    const statusContainer = document.getElementById('status-container');
    const loader = new GLTFLoader();
    
    // Add loading overlay
    const loadingOverlay = document.createElement('div');
    loadingOverlay.style.position = 'absolute';
    loadingOverlay.style.left = '0';
    loadingOverlay.style.top = '0';
    loadingOverlay.style.width = '100%';
    loadingOverlay.style.height = '100%';
    loadingOverlay.style.display = 'flex';
    loadingOverlay.style.alignItems = 'center';
    loadingOverlay.style.justifyContent = 'center';
    loadingOverlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
    loadingOverlay.style.color = '#ffffff';
    loadingOverlay.textContent = 'Loading Model...';
    
    const container = document.getElementById('viewerCanvas');
    if (getComputedStyle(container).position === 'static') {
        container.style.position = 'relative';
    }
    container.appendChild(loadingOverlay);

    loader.load(
        modelPath,
        (gltf) => {
            if (ref.avatar) {
                ref.scene.remove(ref.avatar);
            }

            ref.avatar = gltf.scene;
            ref.scene.add(ref.avatar);

            // Setup animation mixer
            if (ref.mixer) {
                ref.mixer.stopAllAction();
            }
            ref.mixer = new THREE.AnimationMixer(ref.avatar);

            // Remove loading overlay
            loadingOverlay.remove();
            statusContainer.textContent = 'Model loaded successfully';

            // Set default pose
            setDefaultPose();
        },
        (progress) => {
            const percent = (progress.loaded / progress.total * 100).toFixed(2);
            loadingOverlay.textContent = `Loading Model... ${percent}%`;
        },
        (error) => {
            console.error('Error loading model:', error);
            loadingOverlay.textContent = 'Error loading model';
            loadingOverlay.style.color = '#ff4444';
            statusContainer.textContent = 'Error loading model';
        }
    );
}

function setDefaultPose() {
    if (!ref.avatar) return;

    const defaultPose = {
        'mixamorigNeck': { rotation: { x: Math.PI/12 } },
        'mixamorigLeftArm': { rotation: { z: -Math.PI/3 } },
        'mixamorigLeftForeArm': { rotation: { y: -Math.PI/1.5 } },
        'mixamorigRightArm': { rotation: { z: Math.PI/3 } },
        'mixamorigRightForeArm': { rotation: { y: Math.PI/1.5 } }
    };

    Object.entries(defaultPose).forEach(([boneName, transforms]) => {
        const bone = ref.avatar.getObjectByName(boneName);
        if (bone) {
            Object.entries(transforms).forEach(([property, values]) => {
                Object.entries(values).forEach(([axis, value]) => {
                    bone[property][axis] = value;
                });
            });
            bone.updateMatrix();
        }
    });

    ref.avatar.updateMatrixWorld(true);
}

function playAnimation(animationName) {
    const statusContainer = document.getElementById('status-container');
    const button = document.querySelector(`#btn${animationName.charAt(0).toUpperCase() + animationName.slice(1)}`);
    
    if (!ref.avatar || !ref.mixer) {
        statusContainer.textContent = 'Error: Model not initialized';
        return;
    }

    if (button) button.classList.add('animating');
    statusContainer.textContent = 'Loading animation...';

    const loader = new GLTFLoader();
    const animationPath = `d:/Sign_language_translator_v1.0/New/${animationName}.glb`;

    loader.load(
        animationPath,
        (gltf) => {
            if (gltf.animations && gltf.animations.length > 0) {
                try {
                    if (ref.currentAnimation) {
                        ref.currentAnimation.fadeOut(0.5);
                        setTimeout(() => ref.currentAnimation.stop(), 500);
                    }

                    const animation = gltf.animations[0];
                    ref.currentAnimation = ref.mixer.clipAction(animation);
                    ref.currentAnimation.timeScale = state.speed;
                    ref.currentAnimation.setLoop(THREE.LoopOnce);
                    ref.currentAnimation.clampWhenFinished = true;
                    ref.currentAnimation.fadeIn(0.5);
                    ref.currentAnimation.play();

                    statusContainer.textContent = 'Playing animation...';

                    const duration = animation.duration;
                    setTimeout(() => {
                        if (button) button.classList.remove('animating');
                        ref.currentAnimation.fadeOut(0.5);
                        setTimeout(() => {
                            ref.currentAnimation.stop();
                            setDefaultPose();
                            statusContainer.textContent = 'Animation completed';
                        }, 500);
                    }, (duration / state.speed) * 1000 + state.pause);
                } catch (error) {
                    console.error('Error playing animation:', error);
                    statusContainer.textContent = `Error playing animation: ${error.message}`;
                    if (button) button.classList.remove('animating');
                }
            } else {
                statusContainer.textContent = 'Error: No animations found';
                if (button) button.classList.remove('animating');
            }
        },
        (progress) => {
            const percent = (progress.loaded / progress.total * 100).toFixed(2);
            statusContainer.textContent = `Loading animation... ${percent}%`;
        },
        (error) => {
            console.error('Error loading animation:', error);
            statusContainer.textContent = `Error loading animation: ${error.message}`;
            if (button) button.classList.remove('animating');
        }
    );
}

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', init);

// Avatar selection
document.querySelectorAll('.avatar-img').forEach(img => {
    img.addEventListener('click', () => {
        document.querySelectorAll('.avatar-img').forEach(i => i.classList.remove('selected'));
        img.classList.add('selected');
        state.bot = `/static/models/${img.dataset.model}/${img.dataset.model}.glb`;
        loadModel(state.bot);
    });
});

// Speed slider
const speedSlider = document.getElementById('speed-slider');
const speedValue = document.getElementById('speed-value');
speedSlider.addEventListener('input', (e) => {
    state.speed = parseFloat(e.target.value);
    speedValue.textContent = state.speed.toFixed(2);
    if (ref.currentAnimation) {
        ref.currentAnimation.timeScale = state.speed;
    }
});

// Pause slider
const pauseSlider = document.getElementById('pause-slider');
const pauseValue = document.getElementById('pause-value');
pauseSlider.addEventListener('input', (e) => {
    state.pause = parseInt(e.target.value);
    pauseValue.textContent = `${state.pause}ms`;
});

// Word buttons
document.getElementById('btnGoodbye').addEventListener('click', () => {
    playAnimation('goodbye');
});

// Test animation button
document.getElementById('testAnimation').addEventListener('click', () => {
    playAnimation('goodbye');
});