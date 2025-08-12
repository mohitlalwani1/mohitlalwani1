import * as THREE from 'three';
import { gsap } from 'gsap';

export class PortalSystem {
    constructor(scene) {
        this.scene = scene;
        this.portals = [];
        this.createPortals();
    }

    createPortals() {
        const portalCount = 3;
        
        for (let i = 0; i < portalCount; i++) {
            const portal = this.createPortal(i);
            this.portals.push(portal);
        }
    }

    createPortal(index) {
        // Portal ring geometry
        const ringGeometry = new THREE.RingGeometry(3, 4, 32);
        const ringMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                color1: { value: new THREE.Color(0xff0080) },
                color2: { value: new THREE.Color(0x0080ff) }
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vPosition;
                uniform float time;
                
                void main() {
                    vUv = uv;
                    vPosition = position;
                    
                    vec3 pos = position;
                    pos.z += sin(time * 2.0 + pos.x * 0.5) * 0.2;
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 color1;
                uniform vec3 color2;
                varying vec2 vUv;
                varying vec3 vPosition;
                
                void main() {
                    vec2 center = vec2(0.5);
                    float dist = distance(vUv, center);
                    
                    float pulse = sin(time * 3.0) * 0.5 + 0.5;
                    vec3 color = mix(color1, color2, pulse);
                    
                    float alpha = smoothstep(0.3, 0.5, dist) * (1.0 - smoothstep(0.45, 0.5, dist));
                    alpha *= (sin(time * 5.0 + dist * 10.0) * 0.3 + 0.7);
                    
                    gl_FragColor = vec4(color, alpha);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide
        });

        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        
        // Position portals in a triangle formation
        const angle = (index / 3) * Math.PI * 2;
        ring.position.set(
            Math.cos(angle) * 20,
            Math.sin(index * 1.5) * 10,
            Math.sin(angle) * 20
        );
        
        ring.lookAt(0, 0, 0);

        // Portal interior effect
        const interiorGeometry = new THREE.CircleGeometry(3, 32);
        const interiorMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                resolution: { value: new THREE.Vector2(512, 512) }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec2 resolution;
                varying vec2 vUv;
                
                vec3 palette(float t) {
                    vec3 a = vec3(0.5, 0.5, 0.5);
                    vec3 b = vec3(0.5, 0.5, 0.5);
                    vec3 c = vec3(1.0, 1.0, 1.0);
                    vec3 d = vec3(0.263, 0.416, 0.557);
                    return a + b * cos(6.28318 * (c * t + d));
                }
                
                void main() {
                    vec2 uv = (vUv - 0.5) * 2.0;
                    vec2 uv0 = uv;
                    vec3 finalColor = vec3(0.0);
                    
                    for (float i = 0.0; i < 4.0; i++) {
                        uv = fract(uv * 1.5) - 0.5;
                        float d = length(uv) * exp(-length(uv0));
                        vec3 col = palette(length(uv0) + i * 0.4 + time * 0.4);
                        d = sin(d * 8.0 + time) / 8.0;
                        d = abs(d);
                        d = pow(0.01 / d, 1.2);
                        finalColor += col * d;
                    }
                    
                    gl_FragColor = vec4(finalColor, 1.0);
                }
            `,
            transparent: true
        });

        const interior = new THREE.Mesh(interiorGeometry, interiorMaterial);
        interior.position.copy(ring.position);
        interior.rotation.copy(ring.rotation);

        this.scene.add(ring);
        this.scene.add(interior);

        // Animate portal
        gsap.to(ring.rotation, {
            z: Math.PI * 2,
            duration: 10,
            repeat: -1,
            ease: "none"
        });

        return {
            ring,
            interior,
            material: ringMaterial,
            interiorMaterial
        };
    }

    teleportEffect(position) {
        // Find nearest portal
        let nearestPortal = null;
        let minDistance = Infinity;

        this.portals.forEach(portal => {
            const distance = portal.ring.position.distanceTo(position);
            if (distance < minDistance) {
                minDistance = distance;
                nearestPortal = portal;
            }
        });

        if (nearestPortal && minDistance < 5) {
            // Create teleport effect
            const particles = [];
            for (let i = 0; i < 50; i++) {
                const geometry = new THREE.SphereGeometry(0.1, 8, 8);
                const material = new THREE.MeshBasicMaterial({
                    color: new THREE.Color().setHSL(Math.random(), 1, 0.8),
                    transparent: true,
                    opacity: 1
                });

                const particle = new THREE.Mesh(geometry, material);
                particle.position.copy(position);

                const targetPortal = this.portals[Math.floor(Math.random() * this.portals.length)];
                
                gsap.to(particle.position, {
                    x: targetPortal.ring.position.x + (Math.random() - 0.5) * 6,
                    y: targetPortal.ring.position.y + (Math.random() - 0.5) * 6,
                    z: targetPortal.ring.position.z + (Math.random() - 0.5) * 6,
                    duration: 1,
                    ease: "power2.inOut"
                });

                gsap.to(particle.material, {
                    opacity: 0,
                    duration: 1,
                    onComplete: () => {
                        this.scene.remove(particle);
                    }
                });

                particles.push(particle);
                this.scene.add(particle);
            }

            // Portal flash effect
            gsap.to(nearestPortal.material.uniforms.color1.value, {
                r: 1, g: 1, b: 1,
                duration: 0.2,
                yoyo: true,
                repeat: 1
            });
        }
    }

    update(deltaTime) {
        this.portals.forEach(portal => {
            portal.material.uniforms.time.value += deltaTime;
            portal.interiorMaterial.uniforms.time.value += deltaTime;
        });
    }
}