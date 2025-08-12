import * * THREE from 'three';
import { gsap } from 'gsap';

export class RealityDistortion {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.distortionFields = [];
        this.createDistortionFields();
    }

    createDistortionFields() {
        // Create invisible distortion spheres
        for (let i = 0; i < 5; i++) {
            const field = {
                position: new THREE.Vector3(
                    (Math.random() - 0.5) * 80,
                    (Math.random() - 0.5) * 40,
                    (Math.random() - 0.5) * 80
                ),
                strength: Math.random() * 2 + 1,
                radius: Math.random() * 15 + 10,
                phase: Math.random() * Math.PI * 2
            };
            
            this.distortionFields.push(field);
        }
    }

    createRealityRip(position) {
        // Create a tear in reality effect
        const ripGeometry = new THREE.PlaneGeometry(8, 0.2, 32, 1);
        const ripMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                intensity: { value: 1 }
            },
            vertexShader: `
                uniform float time;
                uniform float intensity;
                varying vec2 vUv;
                varying float vDisplacement;
                
                void main() {
                    vUv = uv;
                    vec3 pos = position;
                    
                    float displacement = sin(pos.x * 5.0 + time * 10.0) * 0.5 * intensity;
                    pos.y += displacement;
                    vDisplacement = displacement;
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform float intensity;
                varying vec2 vUv;
                varying float vDisplacement;
                
                void main() {
                    vec3 color1 = vec3(1.0, 0.0, 1.0);
                    vec3 color2 = vec3(0.0, 1.0, 1.0);
                    vec3 color = mix(color1, color2, sin(time * 5.0) * 0.5 + 0.5);
                    
                    float alpha = abs(vDisplacement) * 2.0 + 0.3;
                    alpha *= (1.0 - abs(vUv.y - 0.5) * 2.0);
                    
                    gl_FragColor = vec4(color, alpha * intensity);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending
        });

        const rip = new THREE.Mesh(ripGeometry, ripMaterial);
        rip.position.copy(position);
        rip.lookAt(this.camera.position);
        
        this.scene.add(rip);

        // Animate the rip
        let time = 0;
        const animate = () => {
            time += 0.016;
            ripMaterial.uniforms.time.value = time;
            
            if (time < 3) {
                requestAnimationFrame(animate);
            } else {
                gsap.to(ripMaterial.uniforms.intensity, {
                    value: 0,
                    duration: 1,
                    onComplete: () => {
                        this.scene.remove(rip);
                    }
                });
            }
        };
        animate();

        // Create reality fragments
        this.createRealityFragments(position);
    }

    createRealityFragments(position) {
        const fragmentCount = 20;
        
        for (let i = 0; i < fragmentCount; i++) {
            const geometry = new THREE.PlaneGeometry(
                Math.random() * 2 + 0.5,
                Math.random() * 2 + 0.5
            );
            
            const material = new THREE.MeshBasicMaterial({
                color: new THREE.Color().setHSL(Math.random(), 1, 0.8),
                transparent: true,
                opacity: 0.8,
                side: THREE.DoubleSide
            });

            const fragment = new THREE.Mesh(geometry, material);
            fragment.position.copy(position);
            fragment.position.add(new THREE.Vector3(
                (Math.random() - 0.5) * 4,
                (Math.random() - 0.5) * 4,
                (Math.random() - 0.5) * 4
            ));

            // Random rotation
            fragment.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );

            this.scene.add(fragment);

            // Animate fragments
            gsap.to(fragment.position, {
                x: fragment.position.x + (Math.random() - 0.5) * 20,
                y: fragment.position.y + (Math.random() - 0.5) * 20,
                z: fragment.position.z + (Math.random() - 0.5) * 20,
                duration: 2 + Math.random() * 2,
                ease: "power2.out"
            });

            gsap.to(fragment.rotation, {
                x: fragment.rotation.x + Math.PI * 2,
                y: fragment.rotation.y + Math.PI * 2,
                z: fragment.rotation.z + Math.PI * 2,
                duration: 2 + Math.random() * 2,
                ease: "power2.out"
            });

            gsap.to(fragment.material, {
                opacity: 0,
                duration: 2 + Math.random() * 2,
                ease: "power2.out",
                onComplete: () => {
                    this.scene.remove(fragment);
                }
            });
        }
    }

    createTimeWave(position) {
        // Create expanding time distortion wave
        const waveGeometry = new THREE.RingGeometry(0, 1, 64);
        const waveMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                radius: { value: 0 }
            },
            vertexShader: `
                uniform float time;
                uniform float radius;
                varying vec2 vUv;
                varying float vRadius;
                
                void main() {
                    vUv = uv;
                    vRadius = length(position.xy);
                    
                    vec3 pos = position;
                    float wave = sin(vRadius * 10.0 - time * 20.0) * 0.2;
                    pos.z += wave;
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform float radius;
                varying vec2 vUv;
                varying float vRadius;
                
                void main() {
                    vec3 color1 = vec3(1.0, 0.5, 0.0);
                    vec3 color2 = vec3(0.0, 0.5, 1.0);
                    
                    float t = sin(vRadius * 5.0 - time * 10.0) * 0.5 + 0.5;
                    vec3 color = mix(color1, color2, t);
                    
                    float alpha = 1.0 - vRadius;
                    alpha *= sin(time * 5.0) * 0.3 + 0.7;
                    
                    gl_FragColor = vec4(color, alpha * 0.6);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide
        });

        const wave = new THREE.Mesh(waveGeometry, waveMaterial);
        wave.position.copy(position);
        wave.lookAt(this.camera.position);
        
        this.scene.add(wave);

        // Animate the wave
        gsap.to(wave.scale, {
            x: 30,
            y: 30,
            z: 30,
            duration: 3,
            ease: "power2.out"
        });

        let time = 0;
        const animate = () => {
            time += 0.016;
            waveMaterial.uniforms.time.value = time;
            waveMaterial.uniforms.radius.value = wave.scale.x;
            
            if (time < 3) {
                requestAnimationFrame(animate);
            } else {
                gsap.to(waveMaterial, {
                    opacity: 0,
                    duration: 1,
                    onComplete: () => {
                        this.scene.remove(wave);
                    }
                });
            }
        };
        animate();
    }

    update(deltaTime) {
        // Update distortion fields
        this.distortionFields.forEach(field => {
            field.phase += deltaTime * 2;
            field.position.y += Math.sin(field.phase) * 0.1;
        });
    }
}