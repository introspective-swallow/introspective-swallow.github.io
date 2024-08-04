// magnetic-simulation.js

let MagneticSimulation = {
    canvas: null,
    ctx: null,
    particles: [],
    globalMagneticField: null,
    addParticleButton: null,

    init: function() {
        console.log("Initializing MagneticSimulation");
        this.canvas = document.getElementById('simulationCanvas');
        if (!this.canvas) {
            console.error("Canvas element not found");
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        this.addParticleButton = document.getElementById('addParticle');
        if (!this.addParticleButton) {
            console.error("Add Particle button not found");
            return;
        }

        this.globalMagneticField = this.generateMagneticFieldGrid();
        console.log("Global magnetic field generated");

        this.addParticleButton.addEventListener('click', () => this.addParticle());
        console.log("Add Particle button event listener added");

        this.updateCanvas();
        console.log("Initial updateCanvas called");
    },

    Particle: class {
        constructor(q, m, r0, v0, dt) {
            this.q = q;  // Charge in Coulombs
            this.m = m;  // Mass in kg
            this.r = r0; // Position in meters
            this.v = v0; // Velocity in m/s
            this.dt = dt; // Time step in seconds
        }

        update(B) {
            // Implement Boris algorithm for particle push
            const t = B.map(b => (this.q * b * this.dt) / (2 * this.m));
            const tMagnitudeSquared = t[0]*t[0] + t[1]*t[1] + t[2]*t[2];
            const s = t.map(ti => (2 * ti) / (1 + tMagnitudeSquared));

            const vMinus = this.v.map((vi, i) => vi + (this.q * this.dt * B[i]) / (2 * this.m));
            const vPrime = [
                vMinus[0] + vMinus[1] * t[2] - vMinus[2] * t[1],
                vMinus[1] + vMinus[2] * t[0] - vMinus[0] * t[2],
                vMinus[2] + vMinus[0] * t[1] - vMinus[1] * t[0]
            ];
            this.v = [
                vMinus[0] + vPrime[1] * s[2] - vPrime[2] * s[1],
                vMinus[1] + vPrime[2] * s[0] - vPrime[0] * s[2],
                vMinus[2] + vPrime[0] * s[1] - vPrime[1] * s[0]
            ];

            this.r = this.r.map((ri, i) => ri + this.v[i] * this.dt);

            return this.r;
        }
    },

    variableBField: function(r) {
        const [x, y] = r;
        const Bx = 0.1 * Math.sin(2 * Math.PI * y / 1e-5);
        const By = 0.1 * Math.sin(2 * Math.PI * x / 1e-5);
        const Bz = 1 + 0.1 * Math.sin(2 * Math.PI * (x + y) / 1e-5);
        return [Bx, By, Bz];
    },

    generateMagneticFieldGrid: function(gridSize = 20, stepSize = 1e-6) {
        const grid = [];
        for (let i = 0; i < gridSize; i++) {
            const row = [];
            for (let j = 0; j < gridSize; j++) {
                const x = (i - gridSize / 2) * stepSize;
                const y = (j - gridSize / 2) * stepSize;
                row.push(this.variableBField([x, y, 0]));
            }
            grid.push(row);
        }
        return grid;
    },

    drawParticle: function(x, y) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, 3, 0, 2 * Math.PI);
        this.ctx.fillStyle = 'red';
        this.ctx.fill();
    },

    drawMagneticFieldVector: function(x, y, size, B) {
        const strength = Math.sqrt(B[0]*B[0] + B[1]*B[1] + B[2]*B[2]);
        const maxStrength = 1.2;
        const normalizedStrength = Math.min(strength / maxStrength, 1);

        this.ctx.beginPath();
        this.ctx.arc(x, y, size / 2, 0, 2 * Math.PI);
        this.ctx.strokeStyle = `rgba(0, 0, 255, ${0.3 * normalizedStrength})`;
        this.ctx.stroke();

        const arrowSize = size * 0.8 * normalizedStrength;
        const angle = Math.atan2(B[1], B[0]);
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x + arrowSize * Math.cos(angle), y + arrowSize * Math.sin(angle));
        this.ctx.strokeStyle = `rgba(0, 255, 0, ${0.7 * normalizedStrength})`;
        this.ctx.stroke();

        const dotSize = Math.abs(B[2]) / maxStrength * size / 3;
        this.ctx.beginPath();
        this.ctx.arc(x, y, dotSize, 0, 2 * Math.PI);
        this.ctx.fillStyle = B[2] > 0 ? `rgba(255, 0, 0, ${0.7 * normalizedStrength})` : `rgba(0, 0, 255, ${0.7 * normalizedStrength})`;
        this.ctx.fill();
    },

    drawMagneticField: function() {
        const gridSize = this.globalMagneticField.length;
        const spacing = this.canvas.width / gridSize;
        const vectorSize = spacing * 0.8;

        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                const x = (i + 0.5) * spacing;
                const y = (j + 0.5) * spacing;
                const B = this.globalMagneticField[i][j];
                this.drawMagneticFieldVector(x, y, vectorSize, B);
            }
        }
    },

    clearCanvas: function() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },

    scalePosition: function(position) {
        const scale = Math.min(this.canvas.width, this.canvas.height) / 1e-5;
        return [
            position[0] * scale + this.canvas.width / 2,
            position[1] * scale + this.canvas.height / 2
        ];
    },

    updateCanvas: function() {
        this.clearCanvas();
        this.drawMagneticField();

        this.particles.forEach((particle) => {
            const B = this.variableBField(particle.r);
            const newPosition = particle.update(B);
            const [x, y] = this.scalePosition(newPosition);
            this.drawParticle(x, y);
        });

        requestAnimationFrame(() => this.updateCanvas());
    },

    addParticle: function() {
        const particle = new this.Particle(
            1.602e-19,  // Electron charge in Coulombs
            9.109e-31,  // Electron mass in kg
            [0, 0, 0],  // Initial position in meters
            [(Math.random() - 0.5) * 1e6, (Math.random() - 0.5) * 1e6, 0],  // Random velocity in m/s
            1e-12  // 1 picosecond time step
        );

        this.particles.push(particle);
    }
};

// Initialize the simulation when the page loads
window.addEventListener('load', function() {
    MagneticSimulation.init();
});