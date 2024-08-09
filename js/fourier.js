const noteFrequencies = {
    'C0': 16.35, 'C#0': 17.32, 'D0': 18.35, 'D#0': 19.45, 'E0': 20.60,
    'F0': 21.83, 'F#0': 23.12, 'G0': 24.50, 'G#0': 25.96, 'A0': 27.50,
    'A#0': 29.14, 'B0': 30.87, 'C1': 32.70, 'C#1': 34.65, 'D1': 36.71,
    'D#1': 38.89, 'E1': 41.20, 'F1': 43.65, 'F#1': 46.25, 'G1': 49.00,
    'G#1': 51.91, 'A1': 55.00, 'A#1': 58.27, 'B1': 61.74, 'C2': 65.41,
    'C#2': 69.30, 'D2': 73.42, 'D#2': 77.78, 'E2': 82.41, 'F2': 87.31,
    'F#2': 92.50, 'G2': 98.00, 'G#2': 103.83, 'A2': 110.00, 'A#2': 116.54,
    'B2': 123.47, 'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56,
    'E3': 164.81, 'F3': 174.61, 'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65,
    'A3': 220.00, 'A#3': 233.08, 'B3': 246.94, 'C4': 261.63, 'C#4': 277.18,
    'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99,
    'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
    'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25,
    'F5': 698.46, 'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'A5': 880.00,
    'A#5': 932.33, 'B5': 987.77, 'C6': 1046.50, 'C#6': 1108.73, 'D6': 1174.66,
    'D#6': 1244.51, 'E6': 1318.51, 'F6': 1396.91, 'F#6': 1479.98, 'G6': 1567.98,
    'G#6': 1661.22, 'A6': 1760.00, 'A#6': 1864.66, 'B6': 1975.53, 'C7': 2093.00
};

const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const oscillators = {};
let pressedKeys = [];

function createPiano() {
    const pianoElement = document.getElementById('piano');
    Object.keys(noteFrequencies).forEach(note => {
        const key = document.createElement('div');
        key.className = `key${note.includes('#') ? ' sharp' : ''}`;
        key.textContent = note;
        key.dataset.note = note;
        key.addEventListener('mousedown', () => handleKeyPress(note));
        key.addEventListener('mouseup', () => handleKeyRelease(note));
        key.addEventListener('mouseleave', () => handleKeyRelease(note));
        pianoElement.appendChild(key);
    });
}

function handleKeyPress(note) {
    if (!pressedKeys.includes(note)) {
        pressedKeys.push(note);
        playNote(note);
        updateFourierTransform();
        document.querySelector(`.key[data-note="${note}"]`).classList.add('pressed');
    }
}

function handleKeyRelease(note) {
    pressedKeys = pressedKeys.filter(key => key !== note);
    stopNote(note);
    updateFourierTransform();
    document.querySelector(`.key[data-note="${note}"]`).classList.remove('pressed');
}

function playNote(note) {
    const oscillator = audioContext.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(noteFrequencies[note], audioContext.currentTime);
    oscillator.connect(audioContext.destination);
    oscillator.start();
    oscillators[note] = oscillator;
}

function stopNote(note) {
    if (oscillators[note]) {
        oscillators[note].stop();
        delete oscillators[note];
    }
}

function updateFourierTransform() {
    const sampleRate = 44100;
    const duration = 0.1;
    let numSamples = Math.floor(sampleRate * duration);
    
    // Ensure numSamples is a power of 2
    numSamples = Math.pow(2, Math.ceil(Math.log2(numSamples)));

    const signal = new Array(numSamples).fill(0);

    pressedKeys.forEach(note => {
        const frequency = noteFrequencies[note];
        for (let i = 0; i < numSamples; i++) {
            signal[i] += Math.sin(2 * Math.PI * frequency * i / sampleRate);
        }
    });

    const fft = performFFT(signal);
    const fftMagnitude = fft.map(c => Math.sqrt(c.re * c.re + c.im * c.im));
    
    const maxMagnitude = Math.max(...fftMagnitude);
    const data = fftMagnitude.slice(0, numSamples / 2).map((magnitude, index) => ({
        frequency: index * sampleRate / numSamples,
        magnitude: magnitude / (maxMagnitude || 1)  // Avoid division by zero
    }));

    const filteredData = data.filter(point => point.frequency <= 2000 && point.frequency >= 20);
    drawChart(filteredData);
}

function performFFT(signal) {
    const n = signal.length;
    
    if (n <= 1) {
        return [{ re: signal[0], im: 0 }];
    }

    const evenSamples = signal.filter((_, index) => index % 2 === 0);
    const oddSamples = signal.filter((_, index) => index % 2 === 1);

    const evenFFT = performFFT(evenSamples);
    const oddFFT = performFFT(oddSamples);

    const combined = new Array(n);
    for (let k = 0; k < n / 2; k++) {
        const angle = -2 * Math.PI * k / n;
        const w = { re: Math.cos(angle), im: Math.sin(angle) };
        const t = {
            re: oddFFT[k].re * w.re - oddFFT[k].im * w.im,
            im: oddFFT[k].re * w.im + oddFFT[k].im * w.re
        };
        combined[k] = {
            re: evenFFT[k].re + t.re,
            im: evenFFT[k].im + t.im
        };
        combined[k + n / 2] = {
            re: evenFFT[k].re - t.re,
            im: evenFFT[k].im - t.im
        };
    }
    return combined;
}

function drawChart(data) {
    const canvas = document.getElementById('fourierChart');
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);
    ctx.beginPath();
    ctx.strokeStyle = '#8884d8';

    data.forEach((point, index) => {
        const x = (Math.log(point.frequency) - Math.log(20)) / (Math.log(2000) - Math.log(20)) * width;
        const y = height - (point.magnitude * height);
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });

    ctx.stroke();

    // Draw axes
    ctx.strokeStyle = '#000';
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(width, height);
    ctx.moveTo(0, 0);
    ctx.lineTo(0, height);
    ctx.stroke();

    // X-axis labels
    [20, 50, 100, 200, 500, 1000, 2000].forEach(freq => {
        const x = (Math.log(freq) - Math.log(20)) / (Math.log(2000) - Math.log(20)) * width;
        ctx.fillText(freq, x, height);
    });

    // Y-axis labels
    [0, 0.25, 0.5, 0.75, 1].forEach(mag => {
        const y = height - (mag * height);
        ctx.fillText(mag.toFixed(2), 0, y);
    });
}

function initializePiano() {
    createPiano();
    const canvas = document.getElementById('fourierChart');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    updateFourierTransform();
}

window.addEventListener('load', initializePiano);