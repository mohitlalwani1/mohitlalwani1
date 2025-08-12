import * as THREE from 'three';
import { gsap } from 'gsap';

export class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
        this.createMainParticleSystem();
        this.createFloatingParticles();
    }

    createMainParticleSystem() {
        const particleCount = 5000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // Create galaxy spiral pattern
            const radius = Math.random() * 50;
            const angle = Math.random() * Math.PI * 2;
            const height = (Math.random() - 0.5) * 20;
            
            positions[i3] = Math.cos(angle) * radius;
            positions[i3 + 1] = height;
            positions[i3 + 2] = Math.sin(angle) * radius;

            // Rainbow colors
            const hue = (angle / (Math.PI * 2)) + (radius / 50) * 0.5;
            const color = new THREE.Color().setHSL(hue, 1, 0.7);
            colors[i3] = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;

            sizes[i] = Math.random() * 3 + 1;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                pixelRatio: { value: Math.min(window.devicePixelRatio, 2) }
            },
            vertexShader: `
                attribute float size;
                attribute vec3 color;
                varying vec3 vColor;
                uniform float time;
                uniform float pixelRatio;

                void main() {
                    vColor = color;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    
                    // Add some movement
                    mvPosition.x += sin(time + position.y * 0.01) * 2.0;
                    mvPosition.z += cos(time + position.x * 0.01) * 2.0;
                    
                    gl_Position = projectionMatrix * mvPosition;
                    gl_PointSize = size * pixelRatio * (300.0 / -mvPosition.z);
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                
                void main() {
                    float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
                    float strength = 0.05 / distanceToCenter - 0.1;
                    
                    gl_FragColor = vec4(vColor, strength);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            vertexColors: true
        });

        this.mainParticles = new THREE.Points(geometry, material);
        this.scene.add(this.mainParticles);
    }

    createFloatingParticles() {
        this.floatingParticles = [];
        
        for (let i = 0; i < 100; i++) {
            const geometry = new THREE.SphereGeometry(0.1, 8, 8);
            const material = new THREE.MeshBasicMaterial({
                color: new THREE.Color().setHSL(Math.random(), 1, 0.7),
                transparent: true,
                opacity: 0.8
            });
            
            const particle = new THREE.Mesh(geometry, material);
            particle.position.set(
                (Math.random() - 0.5) * 100,
                (Math.random() - 0.5) * 100,
                (Math.random() - 0.5) * 100
            );
            
            particle.userData = {
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.02,
                    (Math.random() - 0.5) * 0.02,
                    (Math.random() - 0.5) * 0.02
                ),
                originalPosition: particle.position.clone()
            };
            
            this.floatingParticles.push(particle);
            this.scene.add(particle);
        }
    }

    explode(position) {
        const explosionParticles = [];
        const particleCount = 200;

        for (let i = 0; i < particleCount; i++) {
            const geometry = new THREE.SphereGeometry(0.05, 4, 4);
            const material = new THREE.MeshBasicMaterial({
                color: new THREE.Color().setHSL(Math.random(), 1, 0.8),
                transparent: true,
                opacity: 1
            });

            const particle = new THREE.Mesh(geometry, material);
            particle.position.copy(position);

            const direction = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2
            ).normalize();

            const speed = Math.random() * 20 + 10;
            
            gsap.to(particle.position, {
                x: position.x + direction.x * speed,
                y: position.y + direction.y * speed,
                z: position.z + direction.z * speed,
                duration: 2,
                ease: "power2.out"
            });

            gsap.to(particle.material, {
                opacity: 0,
                duration: 2,
                ease: "power2.out",
                onComplete: () => {
                    this.scene.remove(particle);
                }
            });

            gsap.to(particle.scale, {
                x: 0,
                y: 0,
                z: 0,
                duration: 2,
                ease: "power2.out"
            });

            explosionParticles.push(particle);
            this.scene.add(particle);
        }
    }

    colorBurst() {
        // Change main particle colors
        const colors = this.mainParticles.geometry.attributes.color.array;
        for (let i = 0; i < colors.length; i += 3) {
            const hue = Math.random();
            const color = new THREE.Color().setHSL(hue, 1, 0.7);
            colors[i] = color.r;
            colors[i + 1] = color.g;
            colors[i + 2] = color.b;
        }
        this.mainParticles.geometry.attributes.color.needsUpdate = true;

        // Animate floating particles
        this.floatingParticles.forEach(particle => {
            particle.material.color.setHSL(Math.random(), 1, 0.7);
            
            gsap.to(particle.scale, {
                x: 3,
                y: 3,
                z: 3,
                duration: 0.3,
                yoyo: true,
                repeat: 1,
                ease: "power2.inOut"
            });
        });
    }

    update(deltaTime) {
        // Update main particle system
        if (this.mainParticles.material.uniforms) {
            this.mainParticles.material.uniforms.time.value += deltaTime;
        }

        // Rotate main particle system
        this.mainParticles.rotation.y += deltaTime * 0.1;

        // Update floating particles
        this.floatingParticles.forEach(particle => {
            particle.position.add(particle.userData.velocity);
            
            // Bounce off boundaries
            if (Math.abs(particle.position.x) > 50) {
                particle.userData.velocity.x *= -1;
            }
            if (Math.abs(particle.position.y) > 50) {
                particle.userData.velocity.y *= -1;
            }
            if (Math.abs(particle.position.z) > 50) {
                particle.userData.velocity.z *= -1;
            }

            // Add some floating motion
            particle.position.y += Math.sin(Date.now() * 0.001 + particle.userData.originalPosition.x) * 0.01;
        });
    }
}