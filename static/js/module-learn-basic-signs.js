import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { words, wordList } from './animations/words.js';
import { alphabets } from './animations/alphabets.js';
import { defaultPose } from './animations/defaultPose.js';

// --- DOM Elements ---
const canvasContainer = document.getElementById('viewerCanvas');
const alphaButtonsContainer = document.getElementById('alphabetButtons');
const wordButtonsContainer = document.getElementById('wordButtons');
const xbotAvatar = document.getElementById('xbot-avatar');
const ybotAvatar = document.getElementById('ybot-avatar');
const speedSlider = document.getElementById('speed-slider');
const speedValueSpan = document.getElementById('speed-value');
const pauseSlider = document.getElementById('pause-slider');
const pauseValueSpan = document.getElementById('pause-value');

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
};

// --- Animation Loop ---
const animate = () => {
    if (ref.animations.length === 0) {
        ref.pending = false;
        return;
    }
    ref.pending = true;
    requestAnimationFrame(animate);

    if (ref.animations[0].length) {
        if (!ref.flag) {
            for (let i = 0; i < ref.animations[0].length;) {
                const [boneName, action, axis, limit, sign] = ref.animations[0][i];
                const bone = ref.avatar.getObjectByName(boneName);

                if (!bone) {
                    console.warn(`Bone not found: ${boneName}`);
                    ref.animations[0].splice(i, 1);
                    continue;
                }

                if (sign === "+" && bone[action][axis] < limit) {
                    bone[action][axis] += state.speed;
                    bone[action][axis] = Math.min(bone[action][axis], limit);
                    i++;
                } else if (sign === "-" && bone[action][axis] > limit) {
                    bone[action][axis] -= state.speed;
                    bone[action][axis] = Math.max(bone[action][axis], limit);
                    i++;
                } else {
                    ref.animations[0].splice(i, 1);
                }
            }
        }
    } else {
        ref.flag = true;
        setTimeout(() => {
            ref.flag = false;
        }, state.pause);
        ref.animations.shift();
    }

    if (ref.renderer) {
        ref.renderer.render(ref.scene, ref.camera);
    }
};
ref.animate = animate;

// --- Setup 3D Scene ---
function setupScene() {
    // Cleanup previous scene
    if (ref.renderer) {
        ref.renderer.dispose();
        canvasContainer.innerHTML = '';
    }

    ref.animations = [];
    ref.flag = false;
    ref.pending = false;

    // Scene
    ref.scene = new THREE.Scene();
    ref.scene.background = null; // transparent background

    // Light
    const spotLight = new THREE.SpotLight(0xffffff, 2);
    spotLight.position.set(0, 5, 5);
    ref.scene.add(spotLight);
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    ref.scene.add(ambientLight);

    // Camera
    const { clientWidth, clientHeight } = canvasContainer;
    ref.camera = new THREE.PerspectiveCamera(30, clientWidth / clientHeight, 0.1, 1000);
    ref.camera.position.set(0, 1.4, 1.6);

    // Renderer
    ref.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    ref.renderer.setSize(clientWidth, clientHeight);
    ref.renderer.setPixelRatio(window.devicePixelRatio);
    canvasContainer.appendChild(ref.renderer.domElement);

    // --- Loading Manager and Indicator ---
    // Add a loading indicator to give user feedback
    const loadingOverlay = document.createElement('div');
    loadingOverlay.style.position = 'absolute';
    loadingOverlay.style.left = '0';
    loadingOverlay.style.top = '0';
    loadingOverlay.style.width = '100%';
    loadingOverlay.style.height = '100%';
    loadingOverlay.style.display = 'flex';
    loadingOverlay.style.alignItems = 'center';
    loadingOverlay.style.justifyContent = 'center';
    loadingOverlay.style.color = 'var(--text-primary)';
    loadingOverlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
    loadingOverlay.style.fontFamily = 'Inter, sans-serif';
    loadingOverlay.style.fontSize = '1.2rem';
    loadingOverlay.textContent = 'Loading Model...';
    // The canvas container needs to be `relative` for the absolute overlay to work
    if (getComputedStyle(canvasContainer).position === 'static') {
        canvasContainer.style.position = 'relative';
    }
    canvasContainer.appendChild(loadingOverlay);

    const manager = new THREE.LoadingManager();
    manager.onLoad = function () {
        loadingOverlay.style.display = 'none';
    };
    manager.onError = function (url) {
        console.error('There was an error loading ' + url);
        loadingOverlay.textContent = 'Error: Could not load model. Check console.';
        loadingOverlay.style.color = '#ef4444';
    };

    // Loader
    const loader = new GLTFLoader(manager); // Pass manager to loader
    loader.load(
        state.bot,
        (gltf) => {
            // CRUCIAL: Log the model scene to help find bone names
            console.log("✅ Model loaded successfully. Inspect the 'children' array below to find the correct bone names for your animations:", gltf.scene);

            gltf.scene.traverse((child) => { if (child.isSkinnedMesh) { child.frustumCulled = false; } });
            ref.avatar = gltf.scene;
            ref.scene.add(ref.avatar);
            defaultPose(ref);
            ref.renderer.render(ref.scene, ref.camera); // Initial render
        },
        undefined, // onProgress is now handled by the manager
        (error) => {
            // The manager's onError will also catch this.
            console.error('An error happened during the GLTF load process:', error);
        }
    );
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
    if (!ref.camera || !ref.renderer) return;
    const { clientWidth, clientHeight } = canvasContainer;
    ref.camera.aspect = clientWidth / clientHeight;
    ref.camera.updateProjectionMatrix();
    ref.renderer.setSize(clientWidth, clientHeight);
    ref.renderer.render(ref.scene, ref.camera);
}

// --- UI Setup and Event Handlers ---
function setupUI() {
    // Alphabet buttons
    for (let i = 0; i < 26; i++) {
        const letter = String.fromCharCode(i + 65);
        const button = document.createElement('button');
        button.className = 'sign-btn';
        button.textContent = letter;
        button.onclick = () => {
            console.log(`Button clicked: ${letter}. Pending: ${ref.pending}`);
            if (!ref.pending) {
                alphabets[letter](ref);
                ref.animate();
            }
        };
        alphaButtonsContainer.appendChild(button);
    }

    // Word buttons
    wordList.forEach(word => {
        const button = document.createElement('button');
        button.className = 'sign-btn';
        button.textContent = word.replace(/([A-Z])/g, ' $1').trim(); // Add spaces for readability
        button.onclick = () => {
            console.log(`Button clicked: ${word}. Pending: ${ref.pending}`);
            if (!ref.pending) {
                words[word](ref);
                ref.animate();
            }
        };
        wordButtonsContainer.appendChild(button);
    });

    // Avatar selection
    xbotAvatar.addEventListener('click', () => {
        if (state.bot.includes('xbot')) return;
        state.bot = `/static/models/xbot/xbot.glb`;
        xbotAvatar.classList.add('selected');
        ybotAvatar.classList.remove('selected');
        setupScene();
    });

    ybotAvatar.addEventListener('click', () => {
        if (state.bot.includes('ybot')) return;
        state.bot = `/static/models/ybot/ybot.glb`;
        ybotAvatar.classList.add('selected');
        xbotAvatar.classList.remove('selected');
        setupScene();
    });

    // Sliders
    speedSlider.addEventListener('input', (e) => {
        state.speed = parseFloat(e.target.value);
        speedValueSpan.textContent = state.speed.toFixed(2);
    });

    pauseSlider.addEventListener('input', (e) => {
        state.pause = parseInt(e.target.value, 10);
        pauseValueSpan.textContent = state.pause;
    });
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    setupUI();
    setupScene();
});