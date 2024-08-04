// Helper function to convert HSL to RGB
function hslToRgb(h, s, l) {
    let r, g, b;

    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function interpolateColor(c1, c2, factor) {
    const r1 = c1 & 0xFF, g1 = (c1 >> 8) & 0xFF, b1 = (c1 >> 16) & 0xFF;
    const r2 = c2 & 0xFF, g2 = (c2 >> 8) & 0xFF, b2 = (c2 >> 16) & 0xFF;
    const r = Math.round(r1 + factor * (r2 - r1));
    const g = Math.round(g1 + factor * (g2 - g1));
    const b = Math.round(b1 + factor * (b2 - b1));
    return 0xFF000000 | (b << 16) | (g << 8) | r;
}


let VisualizationObject = {
    canvas: null,
    ctx: null,
    widht: null,
    height: null,
    maxIter: 75,
    xMin: -2,
    xMax: 1,
    yMin: -1,
    yMax: 1,
    renderingComplete : false, 
    currentRenderingJob: null,

    init: function() {
        console.log("Initializing VisualizationObject");
        this.canvas = document.getElementById('fractalCanvas');
        if (!this.canvas) {
            console.error("Canvas element not found");
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        console.log("Canvas context acquired");

        const {width, height} = this.canvas.getBoundingClientRect();
        
        this.width = width;
        this.height = height;

        // Optimization: Use a typed array for image data
        this.imageData = this.ctx.createImageData(this.width, this.height);
        this.buf = new ArrayBuffer(this.imageData.data.length);
        this.buf8 = new Uint8ClampedArray(this.buf);
        this.data = new Uint32Array(this.buf);


        this.startProgressiveRender();
        console.log("Initial updateCanvas called");
    },

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        for (let i = 0; i < this.data.length; i++) {
            this.data[i] = 0xFF000000; // Set all pixels to black
        }
    },

    startProgressiveRender() {
        this.renderingComplete = false;
        //lowResImageData = this.createLowResSnapshot();
        //this.ctx.clearRect(0, 0, this.width, this.height);
        //this.ctx.drawImage(this.canvas, 0, 0, this.width / 4, this.height / 4, 0, 0, this.width, this.height);
        //this.clearCanvas();
        this.renderMandelbrot(8); // Start with 8x8 pixel blocks
    },

    createLowResSnapshot() {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.width / 4;
        tempCanvas.height = this.height / 4;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(this.canvas, 0, 0, this.width / 4, this.height / 4);
        return tempCtx.getImageData(0, 0, this.width / 4, this.height / 4);
    },

    renderMandelbrot: function(step) {
        console.log("Rendering Mandelbrot set");
        const jobId = Math.random();
        this.currentRenderingJob = jobId;
        
        const xScale = (this.xMax - this.xMin) / this.width;
        const yScale = (this.yMax - this.yMin) / this.height;
    
        for (let py = 0; py < this.height; py += step) {
            const y0 = this.yMin + py * yScale;
            for (let px = 0; px < this.width; px += step) {
                if (this.currentRenderingJob !== jobId) return; // Stop if a new render has been requested

                const x0 = this.xMin + px * xScale;
                let x = 0;
                let y = 0;
                let iteration = 0;
    
                while (x*x + y*y <= 4 && iteration < this.maxIter) {
                    const xtemp = x*x - y*y + x0;
                    y = 2*x*y + y0;
                    x = xtemp;
                    iteration++;
                }
    
                // Optimization: Direct pixel manipulation
                            // Continuous coloring
                if (iteration < this.maxIter) {
                    // Smooth coloring formula
                    const smooth = iteration + 1 - Math.log(Math.log(Math.sqrt(x*x + y*y))) / Math.log(2);
                    // Map smooth iteration count to a color
                    const hue = (smooth / this.maxIter) * 360; // Use full hue range
                    const [r, g, b] = hslToRgb(hue / 360, 1, 0.5);
                    const color = 0xFF000000 | (b << 16) | (g << 8) | r;
                    this.data[py * this.width + px] = color;
                } else {
                    // Set to black if max iterations reached
                    this.data[py * this.width + px] = 0xFF000000;
                }
            }
        }
        if (step !== 1) {
            // Interpolate colors
            for (let py = 0; py < this.height; py++) {
                for (let px = 0; px < this.width; px++) {
                    if (px % step === 0 && py % step === 0) continue; // Skip already calculated pixels

                    const x1 = Math.floor(px / step) * step;
                    const y1 = Math.floor(py / step) * step;
                    const x2 = Math.min(x1 + step, this.width - 1);
                    const y2 = Math.min(y1 + step, this.height - 1);

                    const q11 = this.data[y1 * this.width + x1];
                    const q21 = this.data[y1 * this.width + x2];
                    const q12 = this.data[y2 * this.width + x1];
                    const q22 = this.data[y2 * this.width + x2];

                    const fx = (px - x1) / step;
                    const fy = (py - y1) / step;

                    const top = interpolateColor(q11, q21, fx);
                    const bottom = interpolateColor(q12, q22, fx);
                    const final = interpolateColor(top, bottom, fy);

                    this.data[py * this.width + px] = final;
                }
            }
        }
    
        // Optimization: Bulk update of canvas
        this.imageData.data.set(this.buf8);
        this.ctx.putImageData(this.imageData, 0, 0);

        setTimeout(() => {
                // Schedule next render pass if needed
            if (step > 1 && this.currentRenderingJob === jobId) {
                // Wait one second before trying to render the next step
                requestAnimationFrame(() => this.renderMandelbrot(1));
            } else {
                this.renderingComplete = true;
            }
        }, 200);
    }
        
};

zoomOut = function() {
    let zoomFactor = 2;
    
    let width = VisualizationObject.xMax - VisualizationObject.xMin;
    let height = VisualizationObject.yMax - VisualizationObject.yMin;

    VisualizationObject.xMin -= width * (zoomFactor-1) / 2;
    VisualizationObject.xMax += width * (zoomFactor-1) / 2;
    VisualizationObject.yMin -= height * (zoomFactor-1) / 2;
    VisualizationObject.yMax += height * (zoomFactor-1) / 2;

    VisualizationObject.startProgressiveRender();
}

// Initialize the simulation when the page loads
window.addEventListener('load', function() {
    VisualizationObject.init();
});

// Zoom on click
document.getElementById('fractalCanvas').addEventListener('click', function(event) {
    let bound = VisualizationObject.canvas.getBoundingClientRect();

    let x = event.clientX - bound.left - VisualizationObject.canvas.clientLeft;
    let y = event.clientY - bound.top - VisualizationObject.canvas.clientTop;

    y = VisualizationObject.canvas.height - y;
        
    // Get the new xMin, xMax, yMin, yMax
    let xScale = (VisualizationObject.xMax - VisualizationObject.xMin) / VisualizationObject.canvas.width;
    let yScale = (VisualizationObject.yMax - VisualizationObject.yMin) / VisualizationObject.canvas.height;
    
    let xReal = x * xScale + VisualizationObject.xMin;
    let yReal = VisualizationObject.yMax - y * yScale;

    let zoomFactor = 4;
    let xMin = xReal - (VisualizationObject.xMax - VisualizationObject.xMin) / zoomFactor / 2;
    let xMax = xReal + (VisualizationObject.xMax - VisualizationObject.xMin) / zoomFactor / 2;
    let yMin = yReal - (VisualizationObject.yMax - VisualizationObject.yMin) / zoomFactor / 2;
    let yMax = yReal + (VisualizationObject.yMax - VisualizationObject.yMin) / zoomFactor / 2;
    
    VisualizationObject.xMin = xMin;
    VisualizationObject.xMax = xMax;
    VisualizationObject.yMin = yMin;
    VisualizationObject.yMax = yMax;
    
    VisualizationObject.startProgressiveRender();
});

// Allow using the arrow keys to move the graph

document.addEventListener('keydown', function(event) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].indexOf(event.key) > -1) {
        // Prevent the default scrolling behavior
        event.preventDefault();
        let stepX = 0.1 * (VisualizationObject.xMax - VisualizationObject.xMin);
        let stepY = 0.1 * (VisualizationObject.yMax - VisualizationObject.yMin);

        switch (event.key) {
            case 'ArrowUp':
                VisualizationObject.yMin -= stepY;
                VisualizationObject.yMax -= stepY;
                break;
            case 'ArrowDown':
                VisualizationObject.yMin += stepY;
                VisualizationObject.yMax += stepY;
                break;
            case 'ArrowLeft':
                VisualizationObject.xMin -= stepX;
                VisualizationObject.xMax -= stepX;
                break;
            case 'ArrowRight':
                VisualizationObject.xMin += stepX;
                VisualizationObject.xMax += stepX;
                break;
        }
        VisualizationObject.startProgressiveRender();
    }
});

// Zoom out on pressing -

document.addEventListener('keydown', function(event) {
    if (event.key === '-') {
        zoomOut();
    }
}
);

// Zoom in on pressing +

document.addEventListener('keydown', function(event) {
    if (event.key === '+') {
        let zoomFactor = 2;
    
        let width = VisualizationObject.xMax - VisualizationObject.xMin;
        let height = VisualizationObject.yMax - VisualizationObject.yMin;
    
        VisualizationObject.xMin += width * (zoomFactor-1) / 4;
        VisualizationObject.xMax -= width * (zoomFactor-1) / 4;
        VisualizationObject.yMin += height * (zoomFactor-1) / 4;
        VisualizationObject.yMax -= height * (zoomFactor-1) / 4;
        console.log(VisualizationObject.xMin, VisualizationObject.xMax, VisualizationObject.yMin, VisualizationObject.yMax);
        VisualizationObject.startProgressiveRender();
    }
}
);