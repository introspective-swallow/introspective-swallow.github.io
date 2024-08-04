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


        this.updateCanvas();
        console.log("Initial updateCanvas called");
    },

    updateCanvas: function() {
        console.log("Updating canvas");
        
        const xScale = (this.xMax - this.xMin) / this.width;
        const yScale = (this.yMax - this.yMin) / this.height;
    
        for (let py = 0; py < this.height; py++) {
            const y0 = this.yMin + py * yScale;
            for (let px = 0; px < this.width; px++) {
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
                const color = iteration === this.maxIter ? 0xFF000000 : 0xFFFF0000;
                this.data[py * this.width + px] = color;
            }
        }
    
        // Optimization: Bulk update of canvas
        this.imageData.data.set(this.buf8);
        this.ctx.putImageData(this.imageData, 0, 0);
    }
        
};

zoomOut = function() {
    let zoomFactor = 2;
    
    let width = VisualizationObject.xMax - VisualizationObject.xMin;
    let height = VisualizationObject.yMax - VisualizationObject.yMin;

    VisualizationObject.xMin -= width * zoomFactor / 2;
    VisualizationObject.xMax += width * zoomFactor / 2;
    VisualizationObject.yMin -= height * zoomFactor / 2;
    VisualizationObject.yMax += height * zoomFactor / 2;

    VisualizationObject.updateCanvas();
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
    
    VisualizationObject.updateCanvas();
});

// Allow using the arrow keys to move the graph

document.addEventListener('keydown', function(event) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].indexOf(event.key) > -1) {
        // Prevent the default scrolling behavior
        event.preventDefault();
        let step = 0.1 * (VisualizationObject.xMax - VisualizationObject.xMin);
        switch (event.key) {
            case 'ArrowUp':
                VisualizationObject.yMin -= step;
                VisualizationObject.yMax -= step;
                break;
            case 'ArrowDown':
                VisualizationObject.yMin += step;
                VisualizationObject.yMax += step;
                break;
            case 'ArrowLeft':
                VisualizationObject.xMin -= step;
                VisualizationObject.xMax -= step;
                break;
            case 'ArrowRight':
                VisualizationObject.xMin += step;
                VisualizationObject.xMax += step;
                break;
        }
        VisualizationObject.updateCanvas();
    }
});