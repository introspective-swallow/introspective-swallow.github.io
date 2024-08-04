// Global variables
let canvas, ctx, width, height;
let maxIter = 100;
let xMin = -2, xMax = 1, yMin = -1, yMax = 1;
let renderingComplete = false;
let currentRenderingJob = null;
let imageData, buf, buf8, data;

const numWorkers = navigator.hardwareConcurrency || 4;
let workers = [];
let completedWorkers = 0;

function init() {
    canvas = document.getElementById('fractalCanvas');
    ctx = canvas.getContext('2d');

    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    proportion = width / height;

    console.log(`Canvas size: ${width} x ${height}`);

    imageData = ctx.createImageData(width, height);
    buf = new ArrayBuffer(imageData.data.length);
    buf8 = new Uint8ClampedArray(buf);
    data = new Uint32Array(buf);

    initializeWorkers();
    startProgressiveRender();
}

function initializeWorkers() {
    const workerScript = `
        ${hslToRgb.toString()}
        
        ${computeMandelbrot.toString()}
        
        self.onmessage = function(e) {
            const { jobId, width, height, startY, endY, xMin, xMax, yMin, yMax, maxIter, step } = e.data;
            const result = computeMandelbrot(width, height, startY, endY, xMin, xMax, yMin, yMax, maxIter, step);
            self.postMessage({ jobId, startY, endY, workerData: result, step });
        };
    `;

    const blob = new Blob([workerScript], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);

    for (let i = 0; i < numWorkers; i++) {
        const worker = new Worker(workerUrl);
        worker.onmessage = handleWorkerMessage;
        workers.push(worker);
    }

    URL.revokeObjectURL(workerUrl);
}

function handleWorkerMessage(e) {
    const { jobId, startY, endY, workerData, step } = e.data;
    
    if (jobId !== currentRenderingJob) return;

    for (let y = startY; y < endY; y++) {
        for (let x = 0; x < width; x++) {
            data[y * width + x] = workerData[y - startY][x];
        }
    }

    completedWorkers++;

    if (completedWorkers === numWorkers) {
        completedWorkers = 0;
        updateCanvas();
        
        if (step > 1) {
            setTimeout(() => startProgressiveRender(step / 2), 0);
        } else {
            renderingComplete = true;
        }
    }
}

function updateCanvas() {
    imageData.data.set(buf8);
    ctx.putImageData(imageData, 0, 0);
}

function startProgressiveRender(step = 8) {
    renderingComplete = false;
    currentRenderingJob = Math.random();

    const chunkHeight = Math.ceil(height / numWorkers);

    for (let i = 0; i < numWorkers; i++) {
        const startY = i * chunkHeight;
        const endY = Math.min((i + 1) * chunkHeight, height);
        workers[i].postMessage({
            jobId: currentRenderingJob,
            width,
            height,
            startY,
            endY,
            xMin,
            xMax,
            yMin,
            yMax,
            maxIter,
            step
        });
    }
}

function hslToRgb(h, s, l) {
    let r, g, b;

    if (s === 0) {
        r = g = b = l;
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

function computeMandelbrot(width, height, startY, endY, xMin, xMax, yMin, yMax, maxIter, step) {
    const xScale = (xMax - xMin) / width;
    const yScale = (yMax - yMin) / height;
    const result = [];

    for (let py = startY; py < endY; py += step) {
        const row = new Array(width).fill(0);
        const y0 = yMin + py * yScale;
        for (let px = 0; px < width; px += step) {
            const x0 = xMin + px * xScale;
            let x = 0, y = 0, iteration = 0;

            while (x*x + y*y <= 4 && iteration < maxIter) {
                const xtemp = x*x - y*y + x0;
                y = 2*x*y + y0;
                x = xtemp;
                iteration++;
            }

            let color;
            if (iteration < maxIter) {
                const smooth = iteration + 1 - Math.log(Math.log(Math.sqrt(x*x + y*y))) / Math.log(2);
                const hue = (smooth / maxIter) * 360;
                const [r, g, b] = hslToRgb(hue / 360, 1, 0.5);
                color = 0xFF000000 | (b << 16) | (g << 8) | r;
            } else {
                color = 0xFF000000;
            }

            for (let dy = 0; dy < step && py + dy < endY; dy++) {
                for (let dx = 0; dx < step && px + dx < width; dx++) {
                    row[px + dx] = color;
                }
            }
        }
        for (let i = 0; i < step && startY + result.length < endY; i++) {
            result.push(row);
        }
    }

    return result;
}

function zoom(centerX, centerY, factor) {
    const currentWidth = xMax - xMin;
    const currentHeight = yMax - yMin;
    const newWidth = currentWidth / factor;
    const newHeight = currentHeight / factor;

    xMin = centerX - newWidth / 2;
    xMax = centerX + newWidth / 2;
    yMin = centerY - newHeight / 2;
    yMax = centerY + newHeight / 2;

    // Ensure the aspect ratio is maintained
    if ((xMax - xMin) / (yMax - yMin) !== proportion) {
        const diff = Math.abs((xMax - xMin) / (yMax - yMin) - proportion);

        if ((xMax - xMin) / (yMax - yMin) < proportion) {
            const newWidth = (yMax - yMin) * proportion;
            xMin = centerX - newWidth / 2;
            xMax = centerX + newWidth / 2;
        } else {
            const newHeight = (xMax - xMin) / proportion;
            yMin = centerY - newHeight / 2;
            yMax = centerY + newHeight / 2;
        }
    }

    startProgressiveRender();
}

function zoomIn() {
    zoom((xMin + xMax) / 2, (yMin + yMax) / 2, 2);
}

function zoomOut() {
    zoom((xMin + xMax) / 2, (yMin + yMax) / 2, 0.5);
}

function move(dx, dy) {
    const stepX = 0.1 * (xMax - xMin);
    const stepY = 0.1 * (yMax - yMin);

    xMin += dx * stepX;
    xMax += dx * stepX;
    yMin += dy * stepY;
    yMax += dy * stepY;

    startProgressiveRender();
}

// Event Listeners
window.addEventListener('load', init);

document.getElementById('fractalCanvas').addEventListener('click', function(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const centerX = xMin + (x / width) * (xMax - xMin);
    const centerY = yMin + (y / height) * (yMax - yMin);

    zoom(centerX, centerY, 2);
});

document.addEventListener('keydown', function(event) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].indexOf(event.key) !== -1) event.preventDefault();

    switch (event.key) {
        case 'ArrowUp': move(0, -1); break;
        case 'ArrowDown': move(0, 1); break;
        case 'ArrowLeft': move(-1, 0); break;
        case 'ArrowRight': move(1, 0); break;
        case '+': zoom((xMin + xMax) / 2, (yMin + yMax) / 2, 2); break;
        case '-': zoom((xMin + xMax) / 2, (yMin + yMax) / 2, 0.5); break;
    }
});

// Also uses mousewheel event for zooming
document.addEventListener('wheel', function(event) {
    event.stopImmediatePropagation();
    event.preventDefault();
    const factor = event.deltaY < 0 ? 0.5 : 2;
    zoom((xMin + xMax) / 2, (yMin + yMax) / 2, factor);
}, {passive:false});

// If mouse close to the edge, move the graph in that direction
document.getElementById('fractalCanvas').addEventListener('mousemove', function(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    console.log(x, y);
    // Check if the mouse is inside the canvas
    if (x < 0 || x >= width || y < 0 || y >= height) return;

    const margin = 40;

    if (x < margin) move(-0.3, 0);
    if (x > width - margin) move(0.3, 0);
    if (y < margin) move(0, -0.3);
    if (y > height - margin) move(0, 0.3);
});

