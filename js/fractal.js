// Global variables
let canvas, ctx, width, height;
let maxIter = 75;
let xMin = -2, xMax = 1, yMin = -1, yMax = 1;
let renderingComplete = false;
let currentRenderingJob = null;
let imageData, buf, buf8, data;

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

function init() {
    console.log("Initializing");
    canvas = document.getElementById('fractalCanvas');
    if (!canvas) {
        console.error("Canvas element not found");
        return;
    }

    ctx = canvas.getContext('2d');
    console.log("Canvas context acquired");

    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;

    // Optimization: Use a typed array for image data
    imageData = ctx.createImageData(width, height);
    buf = new ArrayBuffer(imageData.data.length);
    buf8 = new Uint8ClampedArray(buf);
    data = new Uint32Array(buf);

    startProgressiveRender();
    console.log("Initial updateCanvas called");
}

function clearCanvas() {
    ctx.clearRect(0, 0, width, height);
    for (let i = 0; i < data.length; i++) {
        data[i] = 0xFF000000; // Set all pixels to black
    }
}

function startProgressiveRender() {
    renderingComplete = false;
    renderMandelbrot(8); // Start with 8x8 pixel blocks
}

function renderMandelbrot(step) {
    console.log("Rendering Mandelbrot set");
    const jobId = Math.random();
    currentRenderingJob = jobId;
    
    const xScale = (xMax - xMin) / width;
    const yScale = (yMax - yMin) / height;

    for (let py = 0; py < height; py += step) {
        const y0 = yMin + py * yScale;
        for (let px = 0; px < width; px += step) {
            if (currentRenderingJob !== jobId) return; // Stop if a new render has been requested

            const x0 = xMin + px * xScale;
            let x = 0;
            let y = 0;
            let iteration = 0;

            while (x*x + y*y <= 4 && iteration < maxIter) {
                const xtemp = x*x - y*y + x0;
                y = 2*x*y + y0;
                x = xtemp;
                iteration++;
            }

            // Optimization: Direct pixel manipulation
            // Continuous coloring
            if (iteration < maxIter) {
                // Smooth coloring formula
                const smooth = iteration + 1 - Math.log(Math.log(Math.sqrt(x*x + y*y))) / Math.log(2);
                // Map smooth iteration count to a color
                const hue = (smooth / maxIter) * 360; // Use full hue range
                const [r, g, b] = hslToRgb(hue / 360, 1, 0.5);
                const color = 0xFF000000 | (b << 16) | (g << 8) | r;
                data[py * width + px] = color;
            } else {
                // Set to black if max iterations reached
                data[py * width + px] = 0xFF000000;
            }
        }
    }
    if (step !== 1) {
        // Interpolate colors
        for (let py = 0; py < height; py++) {
            for (let px = 0; px < width; px++) {
                if (px % step === 0 && py % step === 0) continue; // Skip already calculated pixels

                const x1 = Math.floor(px / step) * step;
                const y1 = Math.floor(py / step) * step;
                const x2 = Math.min(x1 + step, width - 1);
                const y2 = Math.min(y1 + step, height - 1);

                const q11 = data[y1 * width + x1];
                const q21 = data[y1 * width + x2];
                const q12 = data[y2 * width + x1];
                const q22 = data[y2 * width + x2];

                const fx = (px - x1) / step;
                const fy = (py - y1) / step;

                const top = interpolateColor(q11, q21, fx);
                const bottom = interpolateColor(q12, q22, fx);
                const final = interpolateColor(top, bottom, fy);

                data[py * width + px] = final;
            }
        }
    }

    // Optimization: Bulk update of canvas
    imageData.data.set(buf8);
    ctx.putImageData(imageData, 0, 0);

    setTimeout(() => {
        // Schedule next render pass if needed
        if (step > 1 && currentRenderingJob === jobId) {
            // Wait one second before trying to render the next step
            requestAnimationFrame(() => renderMandelbrot(1));
        } else {
            renderingComplete = true;
        }
    }, 200);
}

function zoomOut() {
    let zoomFactor = 2;
    
    let currentWidth = xMax - xMin;
    let currentHeight = yMax - yMin;

    xMin -= currentWidth * (zoomFactor-1) / 2;
    xMax += currentWidth * (zoomFactor-1) / 2;
    yMin -= currentHeight * (zoomFactor-1) / 2;
    yMax += currentHeight * (zoomFactor-1) / 2;

    startProgressiveRender();
}

// Initialize the simulation when the page loads
window.addEventListener('load', init);

// Zoom on click
document.getElementById('fractalCanvas').addEventListener('click', function(event) {
    let bound = canvas.getBoundingClientRect();

    let x = event.clientX - bound.left - canvas.clientLeft;
    let y = event.clientY - bound.top - canvas.clientTop;

    y = canvas.height - y;
        
    // Get the new xMin, xMax, yMin, yMax
    let xScale = (xMax - xMin) / canvas.width;
    let yScale = (yMax - yMin) / canvas.height;
    
    let xReal = x * xScale + xMin;
    let yReal = yMax - y * yScale;

    let zoomFactor = 4;
    let newXMin = xReal - (xMax - xMin) / zoomFactor / 2;
    let newXMax = xReal + (xMax - xMin) / zoomFactor / 2;
    let newYMin = yReal - (yMax - yMin) / zoomFactor / 2;
    let newYMax = yReal + (yMax - yMin) / zoomFactor / 2;
    
    xMin = newXMin;
    xMax = newXMax;
    yMin = newYMin;
    yMax = newYMax;
    
    startProgressiveRender();
});

// Allow using the arrow keys to move the graph
document.addEventListener('keydown', function(event) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].indexOf(event.key) > -1) {
        // Prevent the default scrolling behavior
        event.preventDefault();
        let stepX = 0.1 * (xMax - xMin);
        let stepY = 0.1 * (yMax - yMin);

        switch (event.key) {
            case 'ArrowUp':
                yMin -= stepY;
                yMax -= stepY;
                break;
            case 'ArrowDown':
                yMin += stepY;
                yMax += stepY;
                break;
            case 'ArrowLeft':
                xMin -= stepX;
                xMax -= stepX;
                break;
            case 'ArrowRight':
                xMin += stepX;
                xMax += stepX;
                break;
        }
        startProgressiveRender();
    }
});

// Zoom out on pressing -
document.addEventListener('keydown', function(event) {
    if (event.key === '-') {
        zoomOut();
    }
});

// Zoom in on pressing +
document.addEventListener('keydown', function(event) {
    if (event.key === '+') {
        let zoomFactor = 2;
    
        let currentWidth = xMax - xMin;
        let currentHeight = yMax - yMin;
    
        xMin += currentWidth * (zoomFactor-1) / 4;
        xMax -= currentWidth * (zoomFactor-1) / 4;
        yMin += currentHeight * (zoomFactor-1) / 4;
        yMax -= currentHeight * (zoomFactor-1) / 4;
        console.log(xMin, xMax, yMin, yMax);
        startProgressiveRender();
    }
});