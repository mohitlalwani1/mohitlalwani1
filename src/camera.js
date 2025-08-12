import * as THREE from 'three';

export class CameraController {
    constructor(camera, domElement) {
        this.camera = camera;
        this.domElement = domElement;
        
        this.isMouseDown = false;
        this.mouseX = 0;
        this.mouseY = 0;
        this.targetX = 0;
        this.targetY = 0;
        
        this.radius = 30;
        this.targetRadius = 30;
        this.phi = 0;
        this.theta = 0;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.domElement.addEventListener('mousedown', (event) => {
            this.isMouseDown = true;
            this.mouseX = event.clientX;
            this.mouseY = event.clientY;
        });

        this.domElement.addEventListener('mousemove', (event) => {
            if (this.isMouseDown) {
                const deltaX = event.clientX - this.mouseX;
                const deltaY = event.clientY - this.mouseY;
                
                this.targetX += deltaX * 0.01;
                this.targetY += deltaY * 0.01;
                
                this.mouseX = event.clientX;
                this.mouseY = event.clientY;
            }
        });

        this.domElement.addEventListener('mouseup', () => {
            this.isMouseDown = false;
        });

        this.domElement.addEventListener('wheel', (event) => {
            event.preventDefault();
            this.targetRadius += event.deltaY * 0.01;
            this.targetRadius = Math.max(5, Math.min(100, this.targetRadius));
        });

        // Touch events for mobile
        this.domElement.addEventListener('touchstart', (event) => {
            if (event.touches.length === 1) {
                this.isMouseDown = true;
                this.mouseX = event.touches[0].clientX;
                this.mouseY = event.touches[0].clientY;
            }
        });

        this.domElement.addEventListener('touchmove', (event) => {
            if (this.isMouseDown && event.touches.length === 1) {
                const deltaX = event.touches[0].clientX - this.mouseX;
                const deltaY = event.touches[0].clientY - this.mouseY;
                
                this.targetX += deltaX * 0.01;
                this.targetY += deltaY * 0.01;
                
                this.mouseX = event.touches[0].clientX;
                this.mouseY = event.touches[0].clientY;
            }
        });

        this.domElement.addEventListener('touchend', () => {
            this.isMouseDown = false;
        });
    }

    update() {
        // Smooth camera movement
        this.phi += (this.targetX - this.phi) * 0.05;
        this.theta += (this.targetY - this.theta) * 0.05;
        this.radius += (this.targetRadius - this.radius) * 0.05;
        
        // Limit vertical rotation
        this.theta = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.theta));
        
        // Calculate camera position
        const x = this.radius * Math.cos(this.phi) * Math.cos(this.theta);
        const y = this.radius * Math.sin(this.theta);
        const z = this.radius * Math.sin(this.phi) * Math.cos(this.theta);
        
        this.camera.position.set(x, y, z);
        this.camera.lookAt(0, 0, 0);
        
        // Add some automatic rotation when not interacting
        if (!this.isMouseDown) {
            this.targetX += 0.002;
        }
    }
}