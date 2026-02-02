import { CONFIG } from './config.js';
import { PackingScene } from './PackingScene.js';

// ==================== MAIN APP ====================
let seqScene, optScene;
let isRunning = false;
let isPaused = false;
let speedMultiplier = 2;
let spawnTimer = 0;
let packageSeed = 0;
let cartNumber = 1;
const SPAWN_INTERVAL = 1200;

function init() {
    const seqPanel = document.getElementById('sequential-panel');
    const optPanel = document.getElementById('optimized-panel');

    seqScene = new PackingScene(seqPanel, 'sequential', 0xe94560);
    optScene = new PackingScene(optPanel, 'optimized', 0x0f9b8e);

    // Sync camera controls
    seqScene.controls.addEventListener('change', () => {
        optScene.camera.position.copy(seqScene.camera.position);
        optScene.camera.quaternion.copy(seqScene.camera.quaternion);
        optScene.controls.target.copy(seqScene.controls.target);
    });

    optScene.controls.addEventListener('change', () => {
        seqScene.camera.position.copy(optScene.camera.position);
        seqScene.camera.quaternion.copy(optScene.camera.quaternion);
        seqScene.controls.target.copy(optScene.controls.target);
    });

    setupUI();
    window.addEventListener('resize', onResize);
    animate();
}

function spawnPackages() {
    const typeIndex = Math.floor(Math.random() * CONFIG.packageTypes.length);
    packageSeed++;

    seqScene.spawnPackage(typeIndex, packageSeed);
    optScene.spawnPackage(typeIndex, packageSeed);
}

function updateStats() {
    const seqStats = seqScene.getStats();
    const optStats = optScene.getStats();

    document.getElementById('seq-count').textContent = seqStats.count;
    document.getElementById('seq-efficiency').textContent = seqStats.efficiency.toFixed(1) + '%';
    document.getElementById('seq-height').textContent = seqStats.maxHeightInches.toFixed(1) + '"';

    document.getElementById('opt-count').textContent = optStats.count;
    document.getElementById('opt-efficiency').textContent = optStats.efficiency.toFixed(1) + '%';
    document.getElementById('opt-height').textContent = optStats.maxHeightInches.toFixed(1) + '"';

    document.getElementById('sum-seq-count').textContent = seqStats.count;
    document.getElementById('sum-opt-count').textContent = optStats.count;
    document.getElementById('sum-seq-eff').textContent = seqStats.efficiency.toFixed(1) + '%';
    document.getElementById('sum-opt-eff').textContent = optStats.efficiency.toFixed(1) + '%';
    document.getElementById('sum-seq-height').textContent = seqStats.maxHeightInches.toFixed(1) + '"';
    document.getElementById('sum-opt-height').textContent = optStats.maxHeightInches.toFixed(1) + '"';

    // Highlight winner
    const seqEffEl = document.getElementById('sum-seq-eff');
    const optEffEl = document.getElementById('sum-opt-eff');
    seqEffEl.classList.toggle('winner', seqStats.efficiency > optStats.efficiency);
    optEffEl.classList.toggle('winner', optStats.efficiency > seqStats.efficiency);

    // Update repack button state
    const repackBtn = document.getElementById('repack-btn');
    repackBtn.disabled = seqStats.count === 0 || seqScene.animatingPackages.length > 0;
}

function animate() {
    requestAnimationFrame(animate);

    if (isRunning && !isPaused) {
        spawnTimer += 16 * speedMultiplier;

        if (spawnTimer >= SPAWN_INTERVAL) {
            spawnTimer = 0;
            const maxCount = Math.max(seqScene.packagesInCart.length, optScene.packagesInCart.length);
            if (maxCount < CONFIG.maxPackagesPerCart) {
                spawnPackages();
            }
        }

        seqScene.update(speedMultiplier);
        optScene.update(speedMultiplier);
    } else {
        // Still update animations when paused (for repack)
        seqScene.update(speedMultiplier);
        optScene.update(speedMultiplier);
    }

    updateStats();
    seqScene.render();
    optScene.render();
}

function setupUI() {
    // Dimension inputs
    ['width', 'depth', 'height'].forEach(dim => {
        const input = document.getElementById(`cart-${dim}`);

        const updateDimension = () => {
            let val = parseFloat(input.value);
            // Clamp value to valid range
            val = Math.max(6, Math.min(48, val));
            input.value = val;
            CONFIG.cart[dim] = val;
            if (!isRunning) {
                seqScene.createCart();
                optScene.createCart();
            }
        };

        input.addEventListener('change', updateDimension);
        input.addEventListener('input', updateDimension);
    });

    // Speed
    const speedSlider = document.getElementById('speed');
    const speedDisplay = document.getElementById('speed-val');
    speedSlider.addEventListener('input', () => {
        speedMultiplier = parseFloat(speedSlider.value);
        speedDisplay.textContent = speedMultiplier;
    });

    // Buttons
    document.getElementById('start-btn').addEventListener('click', () => {
        isRunning = true;
        isPaused = false;
        document.getElementById('start-btn').textContent = 'Running...';
    });

    document.getElementById('pause-btn').addEventListener('click', () => {
        isPaused = !isPaused;
        document.getElementById('pause-btn').textContent = isPaused ? 'Resume' : 'Pause';
    });

    document.getElementById('reset-btn').addEventListener('click', reset);

    document.getElementById('add-10-btn').addEventListener('click', () => {
        for (let i = 0; i < 10; i++) {
            setTimeout(() => {
                const maxCount = Math.max(seqScene.packagesInCart.length, optScene.packagesInCart.length);
                if (maxCount < CONFIG.maxPackagesPerCart) {
                    spawnPackages();
                }
            }, i * 80);
        }
    });

    // Repack button
    document.getElementById('repack-btn').addEventListener('click', () => {
        if (seqScene.packagesInCart.length > 0 && seqScene.animatingPackages.length === 0) {
            seqScene.repackAll();
        }
    });
}

function reset() {
    isRunning = false;
    isPaused = false;
    spawnTimer = 0;
    packageSeed = 0;
    cartNumber = 1;

    seqScene.reset();
    optScene.reset();
    updateStats();

    document.getElementById('start-btn').textContent = 'Start';
    document.getElementById('pause-btn').textContent = 'Pause';
    document.getElementById('cart-number').textContent = '1';
}

function onResize() {
    seqScene.resize();
    optScene.resize();
}

init();
