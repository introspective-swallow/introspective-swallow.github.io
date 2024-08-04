// static/script.js
const canvas = document.getElementById('simulationCanvas');
const ctx = canvas.getContext('2d');
const addParticleButton = document.getElementById('addParticle');

let particles = [];
let globalMagneticField = null;

function drawParticle(x, y) {
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, 2 * Math.PI);
    ctx.fillStyle = 'red';
    ctx.fill();
}

function drawMagneticFieldVector(x, y, size, B) {
    const strength = Math.sqrt(B[0]*B[0] + B[1]*B[1] + B[2]*B[2]);
    const maxStrength = 1.2;  // Adjust based on your B field range
    const normalizedStrength = Math.min(strength / maxStrength, 1);

    // Draw circle
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, 2 * Math.PI);
    ctx.strokeStyle = `rgba(0, 0, 255, ${0.3 * normalizedStrength})`;
    ctx.stroke();

    // Draw arrow to represent x and y components
    const arrowSize = size * 0.8 * normalizedStrength;
    const angle = Math.atan2(B[1], B[0]);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + arrowSize * Math.cos(angle), y + arrowSize * Math.sin(angle));
    ctx.strokeStyle = `rgba(0, 255, 0, ${0.7 * normalizedStrength})`;
    ctx.stroke();

    // Draw dot in center, size represents z component
    const dotSize = Math.abs(B[2]) / maxStrength * size / 3;
    ctx.beginPath();
    ctx.arc(x, y, dotSize, 0, 2 * Math.PI);
    ctx.fillStyle = B[2] > 0 ? `rgba(255, 0, 0, ${0.7 * normalizedStrength})` : `rgba(0, 0, 255, ${0.7 * normalizedStrength})`;
    ctx.fill();
}

function drawMagneticField() {
    if (!globalMagneticField || globalMagneticField.length === 0) return;

    const gridSize = globalMagneticField.length;
    const spacing = canvas.width / gridSize;
    const vectorSize = spacing * 0.8;

    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            const x = (i + 0.5) * spacing;
            const y = (j + 0.5) * spacing;
            const B = globalMagneticField[i][j];
            drawMagneticFieldVector(x, y, vectorSize, B);
        }
    }
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function scalePosition(position) {
    const scale = Math.min(canvas.width, canvas.height) / 1e-5; // Assuming 10 micrometers as full canvas size
    return [
        position[0] * scale + canvas.width / 2,
        position[1] * scale + canvas.height / 2
    ];
}

function updateCanvas() {
    clearCanvas();
    
    if (globalMagneticField) {
        drawMagneticField();
    }

    const currentTime = performance.now();
    particles.forEach((particle) => {
        const t = (currentTime - particle.lastUpdateTime) / particle.updateInterval;
        const interpolatedPosition = particle.previousPosition.map((prev, i) => 
            prev + (particle.position[i] - prev) * Math.min(t, 1)
        );
        const [x, y] = scalePosition(interpolatedPosition);
        drawParticle(x, y);
    });

    requestAnimationFrame(updateCanvas);
}

function addParticle() {
    const particle = {
        charge: 1.602e-19,  // Electron charge in Coulombs
        mass: 9.109e-31,    // Electron mass in kg
        position: [0, 0, 0],  // Initial position in micrometers
        previousPosition: [0, 0, 0],
        velocity: [(Math.random() - 0.5) * 1e6, (Math.random() - 0.5) * 1e6, 0],  // Random velocity in m/s
        timeStep: 1e-12,  // 1 picosecond time step
        updateInterval: 50,  // 50ms between updates
        lastUpdateTime: performance.now()
    };

    const url = `/simulate?charge=${particle.charge}&mass=${particle.mass}&position=${particle.position.join(',')}&velocity=${particle.velocity.join(',')}&timeStep=${particle.timeStep}&updateInterval=${particle.updateInterval / 1000}`;
    
    const eventSource = new EventSource(url);

    eventSource.onmessage = function(event) {
        const data = JSON.parse(event.data);
        particle.previousPosition = particle.position;
        particle.position = data.position;
        particle.lastUpdateTime = performance.now();
    };

    particles.push(particle);
}

addParticleButton.addEventListener('click', addParticle);

// Fetch initial magnetic field
fetch('/magnetic_field')
    .then(response => response.json())
    .then(data => {
        globalMagneticField = data.B_field;
        updateCanvas();
    })
    .catch(error => console.error('Error fetching magnetic field:', error));

console.log("Script loaded");