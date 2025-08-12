import * as THREE from 'three';

export class PostProcessing {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        
        this.setupPostProcessing();
    }

    setupPostProcessing() {
        // Create render target
        this.renderTarget = new THREE.WebGLRenderTarget(
            window.innerWidth,
            window.innerHeight,
            {
                minFilter: THREE.LinearFilter,
                magFilter: THREE.LinearFilter,
                format: THREE.RGBAFormat,
                stencilBuffer: false
            }
        );

        // Create post-processing scene
        this.postScene = new THREE.Scene();
        this.postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

        // Create post-processing material with bloom and color effects
        this.postMaterial = new THREE.ShaderMaterial({
            uniforms: {
                tDiffuse: { value: null },
                time: { value: 0 },
                resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
            },
            vertexShader: `
                varying vec2 vUv;
                
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D tDiffuse;
                uniform float time;
                uniform vec2 resolution;
                varying vec2 vUv;
                
                // Bloom effect
                vec3 bloom(vec3 color) {
                    vec3 bright = max(color - 0.8, 0.0);
                    return color + bright * 0.5;
                }
                
                // Chromatic aberration
                vec3 chromaticAberration(sampler2D tex, vec2 uv) {
                    float aberration = 0.002;
                    vec2 center = vec2(0.5);
                    vec2 offset = (uv - center) * aberration;
                    
                    float r = texture2D(tex, uv + offset).r;
                    float g = texture2D(tex, uv).g;
                    float b = texture2D(tex, uv - offset).b;
                    
                    return vec3(r, g, b);
                }
                
                // Film grain
                float random(vec2 st) {
                    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
                }
                
                void main() {
                    vec3 color = chromaticAberration(tDiffuse, vUv);
                    
                    // Apply bloom
                    color = bloom(color);
                    
                    // Add film grain
                    float grain = random(vUv + time) * 0.05;
                    color += grain;
                    
                    // Vignette effect
                    vec2 center = vUv - 0.5;
                    float vignette = 1.0 - dot(center, center) * 0.8;
                    color *= vignette;
                    
                    // Color enhancement
                    color = pow(color, vec3(0.9));
                    color *= 1.2;
                    
                    gl_FragColor = vec4(color, 1.0);
                }
            `
        });

        // Create post-processing quad
        const postGeometry = new THREE.PlaneGeometry(2, 2);
        this.postQuad = new THREE.Mesh(postGeometry, this.postMaterial);
        this.postScene.add(this.postQuad);
    }

    render() {
        // Render scene to texture
        this.renderer.setRenderTarget(this.renderTarget);
        this.renderer.render(this.scene, this.camera);

        // Apply post-processing
        this.postMaterial.uniforms.tDiffuse.value = this.renderTarget.texture;
        this.postMaterial.uniforms.time.value = performance.now() * 0.001;

        // Render to screen
        this.renderer.setRenderTarget(null);
        this.renderer.render(this.postScene, this.postCamera);
    }

    resize() {
        this.renderTarget.setSize(window.innerWidth, window.innerHeight);
        this.postMaterial.uniforms.resolution.value.set(window.innerWidth, window.innerHeight);
    }
}