import { SCALE, CONFIG } from './config.js';

export class PackingScene {
    constructor(container, mode, color) {
        this.mode = mode;
        this.color = color;
        this.container = container;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a2e);

        this.camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 100);
        this.camera.position.set(3, 2.5, 3);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.shadowMap.enabled = true;
        container.appendChild(this.renderer.domElement);

        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.target.set(0, 0.7, 0);

        this.setupLights();
        this.createGround();
        this.createConveyor();
        this.createCart();

        this.packages = [];
        this.packagesInCart = [];
        this.animatingPackages = [];
        this.pendingPackages = [];
    }

    setupLights() {
        const ambient = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambient);

        const directional = new THREE.DirectionalLight(0xffffff, 0.8);
        directional.position.set(3, 6, 3);
        directional.castShadow = true;
        directional.shadow.mapSize.width = 1024;
        directional.shadow.mapSize.height = 1024;
        this.scene.add(directional);

        const accent = new THREE.PointLight(this.color, 0.4, 10);
        accent.position.set(-2, 3, 2);
        this.scene.add(accent);
    }

    createGround() {
        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(15, 15),
            new THREE.MeshStandardMaterial({ color: 0x16213e, roughness: 0.8 })
        );
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);

        const grid = new THREE.GridHelper(15, 30, 0x0f3460, 0x0f3460);
        grid.position.y = 0.005;
        this.scene.add(grid);
    }

    createConveyor() {
        this.conveyor = new THREE.Group();

        const beltWidth = 0.6;
        const beltLength = 3;

        const belt = new THREE.Mesh(
            new THREE.BoxGeometry(beltLength, 0.12, beltWidth),
            new THREE.MeshStandardMaterial({ color: 0x333333 })
        );
        belt.position.set(-1, 1.1, -1.2);
        belt.castShadow = true;
        this.conveyor.add(belt);

        const surface = new THREE.Mesh(
            new THREE.BoxGeometry(beltLength - 0.1, 0.05, beltWidth - 0.1),
            new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
        );
        surface.position.set(-1, 1.17, -1.2);
        this.conveyor.add(surface);

        // Legs
        const legGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.05);
        const legMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
        [[-2.3, -1.45], [-2.3, -0.95], [0.3, -1.45], [0.3, -0.95]].forEach(([x, z]) => {
            const leg = new THREE.Mesh(legGeo, legMat);
            leg.position.set(x, 0.525, z);
            this.conveyor.add(leg);
        });

        this.scene.add(this.conveyor);
    }

    createCart() {
        if (this.cart) {
            this.scene.remove(this.cart);
        }

        this.cart = new THREE.Group();
        const w = CONFIG.cart.width * SCALE;
        const d = CONFIG.cart.depth * SCALE;
        const h = CONFIG.cart.height * SCALE;

        // Base
        const base = new THREE.Mesh(
            new THREE.BoxGeometry(w + 0.05, 0.06, d + 0.05),
            new THREE.MeshStandardMaterial({ color: 0x4a4a4a })
        );
        base.position.y = 0.22;
        base.castShadow = true;
        this.cart.add(base);

        // Walls
        const wallMat = new THREE.MeshStandardMaterial({
            color: this.color,
            transparent: true,
            opacity: 0.25,
            side: THREE.DoubleSide
        });

        const walls = [
            { pos: [0, 0.22 + h/2, -d/2], rot: [0, 0, 0], size: [w, h] },
            { pos: [0, 0.22 + h/2, d/2], rot: [0, Math.PI, 0], size: [w, h] },
            { pos: [-w/2, 0.22 + h/2, 0], rot: [0, Math.PI/2, 0], size: [d, h] },
            { pos: [w/2, 0.22 + h/2, 0], rot: [0, -Math.PI/2, 0], size: [d, h] }
        ];

        walls.forEach(wall => {
            const mesh = new THREE.Mesh(new THREE.PlaneGeometry(...wall.size), wallMat);
            mesh.position.set(...wall.pos);
            mesh.rotation.set(...wall.rot);
            this.cart.add(mesh);
        });

        // Edge frame
        const edges = new THREE.LineSegments(
            new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d)),
            new THREE.LineBasicMaterial({ color: this.color })
        );
        edges.position.y = 0.22 + h/2;
        this.cart.add(edges);

        // Wheels
        const wheelGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.06, 12);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        const offset = 0.12;
        const wheelPositions = [
            [-w/2 + offset, -d/2 + offset],
            [w/2 - offset, -d/2 + offset],
            [-w/2 + offset, d/2 - offset],
            [w/2 - offset, d/2 - offset]
        ];
        wheelPositions.forEach(([x, z]) => {
            const wheel = new THREE.Mesh(wheelGeo, wheelMat);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(x, 0.07, z);
            this.cart.add(wheel);
        });

        this.scene.add(this.cart);
    }

    createPackage(typeIndex, seed) {
        const type = CONFIG.packageTypes[typeIndex];

        // Use seed for consistent random variation between scenes
        const variation = 0.9 + (seed % 100) / 500;
        const w = type.w * variation * SCALE;
        const d = type.d * variation * SCALE;
        const h = type.h * variation * SCALE;

        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(w, h, d),
            new THREE.MeshStandardMaterial({ color: type.color, roughness: 0.8 })
        );
        mesh.castShadow = true;

        // Tape
        const tape = new THREE.Mesh(
            new THREE.BoxGeometry(w * 0.15, h + 0.003, d + 0.003),
            new THREE.MeshStandardMaterial({ color: 0xd4a76a })
        );
        mesh.add(tape);

        // Store dimensions in inches for display, scaled for collision
        mesh.userData = {
            width: w,
            depth: d,
            height: h,
            widthInches: type.w * variation,
            depthInches: type.d * variation,
            heightInches: type.h * variation,
            volume: w * d * h,
            volumeInches: (type.w * variation) * (type.d * variation) * (type.h * variation),
            type: type.name
        };
        return mesh;
    }

    spawnPackage(typeIndex, seed) {
        const pkg = this.createPackage(typeIndex, seed);
        pkg.position.set(-2.5, 1.25, -1.2);
        this.scene.add(pkg);
        this.packages.push(pkg);

        if (this.mode === 'optimized') {
            this.pendingPackages.push(pkg);
            this.animatingPackages.push({
                mesh: pkg,
                state: 'conveyor',
                targetX: 0.5,
                velocity: new THREE.Vector3(0, 0, 0),
                waitForBatch: true
            });
        } else {
            this.animatingPackages.push({
                mesh: pkg,
                state: 'conveyor',
                targetX: 0.5,
                velocity: new THREE.Vector3(0, 0, 0)
            });
        }
    }

    findPlacementPosition(pkg, existingPackages = this.packagesInCart) {
        const w = CONFIG.cart.width * SCALE;
        const d = CONFIG.cart.depth * SCALE;
        const h = CONFIG.cart.height * SCALE;
        const pkgW = pkg.userData.currentWidth || pkg.userData.width;
        const pkgD = pkg.userData.currentDepth || pkg.userData.depth;
        const pkgH = pkg.userData.height;

        const gridStep = 0.04;
        let bestPosition = null;
        let lowestY = Infinity;

        for (let x = -w/2 + pkgW/2; x <= w/2 - pkgW/2; x += gridStep) {
            for (let z = -d/2 + pkgD/2; z <= d/2 - pkgD/2; z += gridStep) {
                let y = 0.25;

                for (const placed of existingPackages) {
                    const pW = placed.userData.currentWidth || placed.userData.width;
                    const pD = placed.userData.currentDepth || placed.userData.depth;

                    if (this.boxesOverlap2D(x, z, pkgW, pkgD, placed.position.x, placed.position.z, pW, pD)) {
                        y = Math.max(y, placed.position.y + placed.userData.height / 2);
                    }
                }

                const finalY = y + pkgH / 2;
                if (finalY + pkgH / 2 <= 0.22 + h + 0.1 && finalY < lowestY) {
                    lowestY = finalY;
                    bestPosition = new THREE.Vector3(x, finalY, z);
                }
            }
        }

        if (!bestPosition) {
            const maxY = existingPackages.length > 0
                ? Math.max(...existingPackages.map(p => p.position.y + p.userData.height / 2))
                : 0.25;
            bestPosition = new THREE.Vector3(0, maxY + pkgH / 2, 0);
        }

        return bestPosition;
    }

    findOptimizedPlacements(packagesToPlace = this.pendingPackages) {
        const w = CONFIG.cart.width * SCALE;
        const d = CONFIG.cart.depth * SCALE;
        const h = CONFIG.cart.height * SCALE;
        const sorted = [...packagesToPlace].sort((a, b) => b.userData.volume - a.userData.volume);

        const placements = [];
        const virtualPlaced = [...this.packagesInCart.filter(p => !packagesToPlace.includes(p))];

        for (const pkg of sorted) {
            const pkgW = pkg.userData.width;
            const pkgD = pkg.userData.depth;
            const pkgH = pkg.userData.height;

            let bestPosition = null;
            let lowestY = Infinity;
            let bestScore = -Infinity;
            let bestRotation = 0;
            let bestDims = { w: pkgW, d: pkgD };

            const rotations = [
                { w: pkgW, d: pkgD, rot: 0 },
                { w: pkgD, d: pkgW, rot: Math.PI / 2 }
            ];

            for (const { w: rw, d: rd, rot } of rotations) {
                const gridStep = 0.025;

                for (let x = -w/2 + rw/2; x <= w/2 - rw/2; x += gridStep) {
                    for (let z = -d/2 + rd/2; z <= d/2 - rd/2; z += gridStep) {
                        let y = 0.25;

                        for (const placed of virtualPlaced) {
                            const pW = placed.userData.currentWidth || placed.userData.width;
                            const pD = placed.userData.currentDepth || placed.userData.depth;

                            if (this.boxesOverlap2D(x, z, rw, rd, placed.position.x, placed.position.z, pW, pD)) {
                                y = Math.max(y, placed.position.y + placed.userData.height / 2);
                            }
                        }

                        const finalY = y + pkgH / 2;

                        if (finalY + pkgH / 2 <= 0.22 + h + 0.1) {
                            const cornerBonus = (Math.abs(x) + Math.abs(z)) * 0.2;
                            const heightPenalty = finalY * 3;
                            const score = cornerBonus - heightPenalty;

                            if (finalY < lowestY || (Math.abs(finalY - lowestY) < 0.005 && score > bestScore)) {
                                lowestY = finalY;
                                bestScore = score;
                                bestPosition = new THREE.Vector3(x, finalY, z);
                                bestRotation = rot;
                                bestDims = { w: rw, d: rd };
                            }
                        }
                    }
                }
            }

            if (bestPosition) {
                placements.push({ pkg, pos: bestPosition, rotation: bestRotation });
                virtualPlaced.push({
                    position: bestPosition,
                    userData: {
                        width: pkgW,
                        depth: pkgD,
                        height: pkgH,
                        currentWidth: bestDims.w,
                        currentDepth: bestDims.d
                    }
                });
            }
        }

        return placements;
    }

    boxesOverlap2D(x1, z1, w1, d1, x2, z2, w2, d2) {
        return Math.abs(x1 - x2) < (w1 + w2) / 2 - 0.003 &&
               Math.abs(z1 - z2) < (d1 + d2) / 2 - 0.003;
    }

    placePackage(pkg, position, rotation = 0) {
        pkg.position.copy(position);
        if (rotation) {
            pkg.rotation.y = rotation;
            pkg.userData.currentWidth = pkg.userData.depth;
            pkg.userData.currentDepth = pkg.userData.width;
        } else {
            pkg.userData.currentWidth = pkg.userData.width;
            pkg.userData.currentDepth = pkg.userData.depth;
        }
        if (!this.packagesInCart.includes(pkg)) {
            this.packagesInCart.push(pkg);
        }
    }

    processBatch() {
        if (this.pendingPackages.length === 0) return;

        const placements = this.findOptimizedPlacements();

        placements.forEach(({ pkg, pos, rotation }) => {
            const anim = this.animatingPackages.find(a => a.mesh === pkg);
            if (anim) {
                anim.state = 'dropping';
                anim.targetPosition = pos;
                anim.rotation = rotation;
                anim.velocity = new THREE.Vector3(0, 0, 0);
            }
        });

        this.pendingPackages = [];
    }

    repackAll() {
        if (this.packagesInCart.length === 0) return;

        // Get all packages currently in cart
        const allPackages = [...this.packagesInCart];

        // Find optimized placements for all
        const placements = this.findOptimizedPlacements(allPackages);

        // Animate packages to new positions
        placements.forEach(({ pkg, pos, rotation }) => {
            // Remove from packagesInCart temporarily
            const idx = this.packagesInCart.indexOf(pkg);
            if (idx > -1) this.packagesInCart.splice(idx, 1);

            this.animatingPackages.push({
                mesh: pkg,
                state: 'dropping',
                targetPosition: pos,
                rotation: rotation,
                velocity: new THREE.Vector3(0, 0, 0)
            });
        });
    }

    update(speedMultiplier) {
        for (let i = this.animatingPackages.length - 1; i >= 0; i--) {
            const anim = this.animatingPackages[i];
            const pkg = anim.mesh;

            if (anim.state === 'conveyor') {
                pkg.position.x += CONFIG.conveyorSpeed * 0.016 * speedMultiplier * SCALE;
                pkg.position.y = 1.25 + Math.sin(Date.now() * 0.008) * 0.01;

                if (pkg.position.x >= anim.targetX) {
                    if (anim.waitForBatch) {
                        anim.state = 'waiting';
                        pkg.position.x = anim.targetX;

                        if (this.pendingPackages.length >= 10 ||
                            this.packagesInCart.length + this.pendingPackages.length >= CONFIG.maxPackagesPerCart) {
                            this.processBatch();
                        }
                    } else {
                        anim.state = 'dropping';
                        anim.targetPosition = this.findPlacementPosition(pkg);
                        anim.velocity = new THREE.Vector3(0, 0, 0);
                    }
                }
            } else if (anim.state === 'waiting') {
                if (this.pendingPackages.length >= 10 ||
                    this.packagesInCart.length + this.pendingPackages.length >= CONFIG.maxPackagesPerCart) {
                    this.processBatch();
                }
            } else if (anim.state === 'dropping') {
                const target = anim.targetPosition;
                const speed = CONFIG.dropSpeed * 0.016 * speedMultiplier;

                pkg.position.x += (target.x - pkg.position.x) * speed;
                pkg.position.z += (target.z - pkg.position.z) * speed;

                anim.velocity.y -= 0.008 * speedMultiplier;
                pkg.position.y += anim.velocity.y;

                if (pkg.position.y <= target.y || pkg.position.distanceTo(target) < 0.03) {
                    this.placePackage(pkg, target, anim.rotation || 0);
                    this.animatingPackages.splice(i, 1);
                }
            }
        }
    }

    render() {
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    resize() {
        const w = this.container.clientWidth;
        const h = this.container.clientHeight;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
    }

    getStats() {
        const count = this.packagesInCart.length;
        if (count === 0) return { count: 0, efficiency: 0, maxHeight: 0, maxHeightInches: 0 };

        const totalVolume = this.packagesInCart.reduce((sum, p) => sum + p.userData.volume, 0);
        const maxY = Math.max(...this.packagesInCart.map(p => p.position.y + p.userData.height / 2));
        const usedHeight = maxY - 0.22;
        const usedHeightInches = usedHeight / SCALE;
        const cartW = CONFIG.cart.width * SCALE;
        const cartD = CONFIG.cart.depth * SCALE;
        const usedVolume = cartW * cartD * usedHeight;
        const efficiency = usedVolume > 0 ? (totalVolume / usedVolume) * 100 : 0;

        return { count, efficiency, maxHeight: usedHeight, maxHeightInches: usedHeightInches };
    }

    reset() {
        this.packages.forEach(p => this.scene.remove(p));
        this.packages = [];
        this.packagesInCart = [];
        this.animatingPackages = [];
        this.pendingPackages = [];
        this.createCart();
    }
}
