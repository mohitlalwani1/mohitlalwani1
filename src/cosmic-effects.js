import * as THREE from 'three';
import { gsap } from 'gsap';

export class CosmicEffects {
    constructor(scene) {
        this.scene = scene;
        this.createCosmicBackground();
        this.createNebula();
        this.createStarField();
    }

    createCosmicBackground() {
        // Create animated cosmic background
        const geometry = new THREE.SphereGeometry(200, 32, 32);
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 }
            },
            vertexShader: `
                varying vec3 vPosition;
                void main() {
                    vPosition = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                varying vec3 vPosition;
                
                vec3 palette(float t) {
                    vec3 a = vec3(0.5, 0.5, 0.5);
                    vec3 b = vec3(0.5, 0.5, 0.5);
                    vec3 c = vec3(1.0, 1.0, 1.0);
                    vec3 d = vec3(0.0, 0.33, 0.67);
                    return a + b * cos(6.28318 * (c * t + d));
                }
                
                float noise(vec3 p) {
                    return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
                }
                
                void main() {
                    vec3 pos = normalize(vPosition);
                    
                    float n1 = noise(pos * 3.0 + time * 0.1);
                    float n2 = noise(pos * 6.0 + time * 0.2);
                    float n3 = noise(pos * 12.0 + time * 0.3);
                    
                    float combined = n1 * 0.5 + n2 * 0.3 + n3 * 0.2;
                    
                    vec3 color = palette(combined + time * 0.1);
                    color *= 0.3; // Dim for background
                    
                    gl_FragColor = vec4(color, 1.0);
                }
            `,
            side: THREE.BackSide
        });

        this.cosmicSphere = new THREE.Mesh(geometry, material);
        this.scene.add(this.cosmicSphere);
    }

    createNebula() {
        // Create floating nebula clouds
        this.nebulaClouds = [];
        
        for (let i = 0; i < 8; i++) {
            const geometry = new THREE.SphereGeometry(5 + Math.random() * 10, 16, 16);
            const material = new THREE.ShaderMaterial({
                uniforms: {
                    time: { value: 0 },
                    color: { value: new THREE.Color().setHSL(Math.random(), 0.8, 0.6) }
                },
                vertexShader: `
                    uniform float time;
                    varying vec3 vPosition;
                    varying vec3 vNormal;
                    
                    void main() {
                        vPosition = position;
                        vNormal = normal;
                        
                        vec3 pos = position;
                        pos += normal * sin(time + position.x * 0.1) * 0.5;
                        
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform float time;
                    uniform vec3 color;
                    varying vec3 vPosition;
                    varying vec3 vNormal;
                    
                    float noise(vec3 p) {
                        return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453);
                    }
                    
                    void main() {
                        vec3 pos = vPosition * 0.1;
                        
                        float n1 = noise(pos + time * 0.1);
                        float n2 = noise(pos * 2.0 + time * 0.2);
                        float n3 = noise(pos * 4.0 + time * 0.3);
                        
                        float combined = n1 * 0.5 + n2 * 0.3 + n3 * 0.2;
                        
                        float fresnel = 1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
                        float alpha = combined * fresnel * 0.3;
                        
                        gl_FragColor = vec4(color, alpha);
                    }
                `,
                transparent: true,
                blending: THREE.AdditiveBlending
            });

            const cloud = new THREE.Mesh(geometry, material);
            cloud.position.set(
                (Math.random() - 0.5) * 100,
                (Math.random() - 0.5) * 50,
                (Math.random() - 0.5) * 100
            );

            // Animate clouds
            gsap.to(cloud.rotation, {
                x: Math.PI * 2,
                y: Math.PI * 2,
                z: Math.PI * 2,
                duration: 20 + Math.random() * 20,
                repeat: -1,
                ease: "none"
            });

            gsap.to(cloud.position, {
                x: cloud.position.x + (Math.random() - 0.5) * 20,
                y: cloud.position.y + (Math.random() - 0.5) * 20,
                z: cloud.position.z + (Math.random() - 0.5) * 20,
                duration: 10 + Math.random() * 10,
                repeat: -1,
                yoyo: true,
                ease: "power2.inOut"
            });

            this.nebulaClouds.push(cloud);
            this.scene.add(cloud);
        }
    }

    createStarField() {
        // Create twinkling stars
        const starCount = 1000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);
        const sizes = new Float32Array(starCount);

        for (let i = 0; i < starCount; i++) {
            const i3 = i * 3;
            
            // Random positions in a large sphere
            const radius = 150 + Math.random() * 50;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i3 + 2] = radius * Math.cos(phi);

            // Star colors (white to blue-white)
            const temp = 0.7 + Math.random() * 0.3;
            colors[i3] = temp;
            colors[i3 + 1] = temp;
            colors[i3 + 2] = 1.0;

            sizes[i] = Math.random() * 2 + 0.5;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 }
            },
            vertexShader: `
                attribute float size;
                attribute vec3 color;
                varying vec3 vColor;
                varying float vSize;
                uniform float time;
                
                void main() {
                    vColor = color;
                    vSize = size;
                    
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_Position = projectionMatrix * mvPosition;
                    
                    float twinkle = sin(time * 3.0 + position.x * 0.01) * 0.5 + 0.5;
                    gl_PointSize = size * (twinkle * 0.5 + 0.5) * (300.0 / -mvPosition.z);
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                varying float vSize;
                uniform float time;
                
                void main() {
                    float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
                    float strength = 0.05 / distanceToCenter - 0.1;
                    
                    float twinkle = sin(time * 5.0 + vSize * 10.0) * 0.3 + 0.7;
                    
                    gl_FragColor = vec4(vColor * twinkle, strength);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            vertexColors: true
        });

        this.stars = new THREE.Points(geometry, material);
        this.scene.add(this.stars);
    }

    createSupernova(position) {
        // Create massive explosion effect
        const supernovaGeometry = new THREE.SphereGeometry(1, 32, 32);
        const supernovaMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                intensity: { value: 1 }
            },
            vertexShader: `
                uniform float time;
                uniform float intensity;
                varying vec3 vPosition;
                varying vec3 vNormal;
                
                void main() {
                    vPosition = position;
                    vNormal = normal;
                    
                    vec3 pos = position;
                    pos += normal * sin(time * 10.0) * 0.2 * intensity;
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform float intensity;
                varying vec3 vPosition;
                varying vec3 vNormal;
                
                void main() {
                    vec3 color1 = vec3(1.0, 0.8, 0.0);
                    vec3 color2 = vec3(1.0, 0.2, 0.0);
                    vec3 color3 = vec3(0.8, 0.0, 1.0);
                    
                    float t = sin(time * 5.0) * 0.5 + 0.5;
                    vec3 color = mix(mix(color1, color2, t), color3, t * 0.5);
                    
                    float fresnel = 1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
                    float alpha = fresnel * intensity;
                    
                    gl_FragColor = vec4(color, alpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending
        });

        const supernova = new THREE.Mesh(supernovaGeometry, supernovaMaterial);
        supernova.position.copy(position);
        this.scene.add(supernova);

        // Animate supernova
        gsap.to(supernova.scale, {
            x: 50,
            y: 50,
            z: 50,
            duration: 3,
            ease: "power2.out"
        });

        let time = 0;
        const animate = () => {
            time += 0.016;
            supernovaMaterial.uniforms.time.value = time;
            
            if (time < 3) {
                requestAnimationFrame(animate);
            } else {
                gsap.to(supernovaMaterial.uniforms.intensity, {
                    value: 0,
                    duration: 2,
                    onComplete: () => {
                        this.scene.remove(supernova);
                    }
                });
            }
        };
        animate();

        // Create shockwave rings
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this.createShockwaveRing(position, i);
            }, i * 500);
        }
    }

    createShockwaveRing(position, index) {
        const ringGeometry = new THREE.RingGeometry(0, 1, 64);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: new THREE.Color().setHSL(0.1 + index * 0.2, 1, 0.7),
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });

        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.position.copy(position);
        ring.lookAt(0, 0, 0);
        
        this.scene.add(ring);

        gsap.to(ring.scale, {
            x: 80,
            y: 80,
            z: 80,
            duration: 2,
            ease: "power2.out"
        });

        gsap.to(ring.material, {
            opacity: 0,
            duration: 2,
            ease: "power2.out",
            onComplete: () => {
                this.scene.remove(ring);
            }
        });
    }

    update(deltaTime) {
        // Update cosmic background
        if (this.cosmicSphere) {
            this.cosmicSphere.material.uniforms.time.value += deltaTime * 0.1;
        }

        // Update nebula clouds
        this.nebulaClouds.forEach(cloud => {
            cloud.material.uniforms.time.value += deltaTime;
        });

        // Update stars
        if (this.stars) {
            this.stars.material.uniforms.time.value += deltaTime;
        }
    }
}