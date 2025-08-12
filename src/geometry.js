import * as THREE from 'three';
import { gsap } from 'gsap';

export class GeometryManager {
    constructor(scene) {
        this.scene = scene;
        this.objects = [];
        this.createGeometries();
    }

    createGeometries() {
        this.createMorphingTorus();
        this.createFloatingCubes();
        this.createSpinningIcosahedrons();
        this.createWaveGeometry();
    }

    createMorphingTorus() {
        const geometry = new THREE.TorusGeometry(8, 3, 16, 100);
        const material = new THREE.MeshPhongMaterial({
            color: 0xff6b6b,
            shininess: 100,
            transparent: true,
            opacity: 0.8,
            wireframe: false
        });

        this.torus = new THREE.Mesh(geometry, material);
        this.torus.position.set(0, 0, 0);
        this.torus.castShadow = true;
        this.torus.receiveShadow = true;
        
        this.objects.push(this.torus);
        this.scene.add(this.torus);

        // Animate torus
        gsap.to(this.torus.rotation, {
            x: Math.PI * 2,
            y: Math.PI * 2,
            duration: 20,
            repeat: -1,
            ease: "none"
        });
    }

    createFloatingCubes() {
        this.cubes = [];
        const cubeCount = 20;

        for (let i = 0; i < cubeCount; i++) {
            const size = Math.random() * 2 + 0.5;
            const geometry = new THREE.BoxGeometry(size, size, size);
            const material = new THREE.MeshPhongMaterial({
                color: new THREE.Color().setHSL(i / cubeCount, 1, 0.6),
                transparent: true,
                opacity: 0.7
            });

            const cube = new THREE.Mesh(geometry, material);
            cube.position.set(
                (Math.random() - 0.5) * 60,
                (Math.random() - 0.5) * 60,
                (Math.random() - 0.5) * 60
            );

            cube.castShadow = true;
            cube.receiveShadow = true;

            // Random rotation animation
            gsap.to(cube.rotation, {
                x: Math.PI * 2,
                y: Math.PI * 2,
                z: Math.PI * 2,
                duration: 5 + Math.random() * 10,
                repeat: -1,
                ease: "none"
            });

            // Floating animation
            gsap.to(cube.position, {
                y: cube.position.y + (Math.random() - 0.5) * 20,
                duration: 3 + Math.random() * 4,
                repeat: -1,
                yoyo: true,
                ease: "power2.inOut"
            });

            this.cubes.push(cube);
            this.objects.push(cube);
            this.scene.add(cube);
        }
    }

    createSpinningIcosahedrons() {
        this.icosahedrons = [];
        const count = 8;

        for (let i = 0; i < count; i++) {
            const geometry = new THREE.IcosahedronGeometry(2, 1);
            const material = new THREE.MeshPhongMaterial({
                color: new THREE.Color().setHSL(0.7, 1, 0.5),
                wireframe: true,
                transparent: true,
                opacity: 0.6
            });

            const icosahedron = new THREE.Mesh(geometry, material);
            
            const angle = (i / count) * Math.PI * 2;
            const radius = 25;
            icosahedron.position.set(
                Math.cos(angle) * radius,
                Math.sin(angle * 0.5) * 10,
                Math.sin(angle) * radius
            );

            // Spinning animation
            gsap.to(icosahedron.rotation, {
                x: Math.PI * 2,
                y: Math.PI * 2,
                z: Math.PI * 2,
                duration: 8,
                repeat: -1,
                ease: "none"
            });

            this.icosahedrons.push(icosahedron);
            this.objects.push(icosahedron);
            this.scene.add(icosahedron);
        }
    }

    createWaveGeometry() {
        const geometry = new THREE.PlaneGeometry(40, 40, 50, 50);
        const material = new THREE.MeshPhongMaterial({
            color: 0x4ecdc4,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide,
            wireframe: true
        });

        this.wavePlane = new THREE.Mesh(geometry, material);
        this.wavePlane.rotation.x = -Math.PI / 2;
        this.wavePlane.position.y = -20;

        // Store original positions for wave animation
        this.waveOriginalPositions = geometry.attributes.position.array.slice();

        this.objects.push(this.wavePlane);
        this.scene.add(this.wavePlane);
    }

    shockwave(position) {
        // Create shockwave effect
        const geometry = new THREE.RingGeometry(0, 1, 32);
        const material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 1,
            side: THREE.DoubleSide
        });

        const shockwave = new THREE.Mesh(geometry, material);
        shockwave.position.copy(position);
        shockwave.lookAt(this.scene.position);

        this.scene.add(shockwave);

        // Animate shockwave
        gsap.to(shockwave.scale, {
            x: 20,
            y: 20,
            z: 20,
            duration: 1,
            ease: "power2.out"
        });

        gsap.to(shockwave.material, {
            opacity: 0,
            duration: 1,
            ease: "power2.out",
            onComplete: () => {
                this.scene.remove(shockwave);
            }
        });

        // Shake nearby objects
        this.objects.forEach(obj => {
            const distance = obj.position.distanceTo(position);
            if (distance < 20) {
                const intensity = (20 - distance) / 20;
                
                gsap.to(obj.position, {
                    x: obj.position.x + (Math.random() - 0.5) * intensity * 5,
                    y: obj.position.y + (Math.random() - 0.5) * intensity * 5,
                    z: obj.position.z + (Math.random() - 0.5) * intensity * 5,
                    duration: 0.5,
                    ease: "elastic.out(1, 0.3)"
                });
            }
        });
    }

    update(elapsedTime) {
        // Update wave geometry
        if (this.wavePlane) {
            const positions = this.wavePlane.geometry.attributes.position.array;
            
            for (let i = 0; i < positions.length; i += 3) {
                const x = this.waveOriginalPositions[i];
                const z = this.waveOriginalPositions[i + 2];
                
                positions[i + 1] = Math.sin(elapsedTime * 2 + x * 0.1) * 2 + 
                                   Math.cos(elapsedTime * 3 + z * 0.1) * 1.5;
            }
            
            this.wavePlane.geometry.attributes.position.needsUpdate = true;
        }

        // Orbit icosahedrons
        this.icosahedrons.forEach((ico, i) => {
            const angle = elapsedTime * 0.5 + (i / this.icosahedrons.length) * Math.PI * 2;
            const radius = 25 + Math.sin(elapsedTime + i) * 5;
            
            ico.position.x = Math.cos(angle) * radius;
            ico.position.z = Math.sin(angle) * radius;
            ico.position.y = Math.sin(elapsedTime * 2 + i) * 10;
        });

        // Morph torus
        if (this.torus) {
            this.torus.scale.setScalar(1 + Math.sin(elapsedTime * 2) * 0.3);
            this.torus.material.color.setHSL((elapsedTime * 0.1) % 1, 1, 0.6);
        }
    }
}