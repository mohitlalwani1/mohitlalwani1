import * as THREE from 'three';
import { gsap } from 'gsap';
import { ParticleSystem } from './particles.js';
import { GeometryManager } from './geometry.js';
import { CameraController } from './camera.js';
import { PostProcessing } from './postprocessing.js';
import { PortalSystem } from './portals.js';
import { RealityDistortion } from './reality-distortion.js';
import { CosmicEffects } from './cosmic-effects.js';

class ThreeJsExperience {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.clock = new THREE.Clock();
        
        this.mouse = new THREE.Vector2();
        this.raycaster = new THREE.Raycaster();
        this.isExploding = false;
        
        this.init();
    }

    init() {
        this.setupRenderer();
        this.setupScene();
        this.setupLighting();
        this.setupObjects();
        this.setupEventListeners();
        this.setupPostProcessing();
        this.animate();
        
        // Hide loading screen
        setTimeout(() => {
            document.getElementById('loading').style.display = 'none';
        }, 2000);
    }

    setupRenderer() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        document.getElementById('canvas-container').appendChild(this.renderer.domElement);
    }

    setupScene() {
        // Stunning space background
        const loader = new THREE.CubeTextureLoader();
        this.scene.background = new THREE.Color(0x000011);
        
        // Add fog for depth
        this.scene.fog = new THREE.Fog(0x000011, 50, 200);
    }

    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
        this.scene.add(ambientLight);

        // Main directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);

        // Colored point lights for atmosphere
        const colors = [0xff0080, 0x0080ff, 0x80ff00, 0xff8000];
        this.pointLights = [];
        
        colors.forEach((color, i) => {
            const light = new THREE.PointLight(color, 2, 50);
            light.position.set(
                Math.cos(i * Math.PI * 0.5) * 20,
                Math.sin(i * Math.PI * 0.5) * 20,
                Math.sin(i * Math.PI * 0.25) * 10
            );
            this.pointLights.push(light);
            this.scene.add(light);
        });
    }

    setupObjects() {
        // Initialize managers
        this.particleSystem = new ParticleSystem(this.scene);
        this.geometryManager = new GeometryManager(this.scene);
        this.cameraController = new CameraController(this.camera, this.renderer.domElement);
        this.portalSystem = new PortalSystem(this.scene);
        this.realityDistortion = new RealityDistortion(this.scene, this.camera);
        this.cosmicEffects = new CosmicEffects(this.scene);
        
        // Position camera
        this.camera.position.set(0, 0, 30);
    }

    setupPostProcessing() {
        this.postProcessing = new PostProcessing(this.scene, this.camera, this.renderer);
    }

    setupEventListeners() {
        // Mouse events
        window.addEventListener('mousemove', (event) => {
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        });

        window.addEventListener('click', (event) => {
            this.handleClick(event);
        });

        // Keyboard events
        window.addEventListener('keydown', (event) => {
            if (event.code === 'Space') {
                event.preventDefault();
                this.triggerColorBurst();
            } else if (event.code === 'KeyR') {
                event.preventDefault();
                this.triggerRealityRip();
            } else if (event.code === 'KeyT') {
                event.preventDefault();
                this.triggerTimeWave();
            } else if (event.code === 'KeyS') {
                event.preventDefault();
                this.triggerSupernova();
            }
        });

        // Resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            this.postProcessing.resize();
        });
    }

    handleClick(event) {
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);
        
        if (intersects.length > 0) {
            const point = intersects[0].point;
            this.particleSystem.explode(point);
            this.geometryManager.shockwave(point);
            this.portalSystem.teleportEffect(point);
        }
    }

    triggerColorBurst() {
        // Change all lights to random colors
        this.pointLights.forEach(light => {
            const hue = Math.random();
            light.color.setHSL(hue, 1, 0.5);
            
            // Animate intensity
            gsap.to(light, {
                intensity: 5,
                duration: 0.2,
                yoyo: true,
                repeat: 1,
                ease: "power2.inOut"
            });
        });

        // Trigger particle burst
        this.particleSystem.colorBurst();
    }

    triggerRealityRip() {
        const position = new THREE.Vector3(
            (Math.random() - 0.5) * 40,
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 40
        );
        this.realityDistortion.createRealityRip(position);
    }

    triggerTimeWave() {
        const position = new THREE.Vector3(0, 0, 0);
        this.realityDistortion.createTimeWave(position);
    }

    triggerSupernova() {
        const position = new THREE.Vector3(
            (Math.random() - 0.5) * 60,
            (Math.random() - 0.5) * 30,
            (Math.random() - 0.5) * 60
        );
        this.cosmicEffects.createSupernova(position);
    }
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const elapsedTime = this.clock.getElapsedTime();
        const deltaTime = this.clock.getDelta();

        // Update systems
        this.particleSystem.update(deltaTime);
        this.geometryManager.update(elapsedTime);
        this.cameraController.update();
        this.portalSystem.update(deltaTime);
        this.realityDistortion.update(deltaTime);
        this.cosmicEffects.update(deltaTime);

        // Animate lights
        this.pointLights.forEach((light, i) => {
            light.position.x = Math.cos(elapsedTime * 0.5 + i * Math.PI * 0.5) * 25;
            light.position.y = Math.sin(elapsedTime * 0.3 + i * Math.PI * 0.5) * 15;
            light.position.z = Math.sin(elapsedTime * 0.7 + i * Math.PI * 0.25) * 20;
        });

        // Render with post-processing
        this.postProcessing.render();
    }
}

// Start the experience
new ThreeJsExperience();