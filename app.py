# app.py
from flask import Flask, render_template, jsonify, request, Response
from simulation import Particle, variable_B_field
import numpy as np
import logging
import json
import time

app = Flask(__name__)
logging.basicConfig(level=logging.DEBUG)

# Global variable to store the magnetic field
global_B_field = None

def generate_magnetic_field_grid(grid_size=20, step_size=1e-6):
    global global_B_field
    if global_B_field is None:
        x = np.linspace(-grid_size*step_size/2, grid_size*step_size/2, grid_size)
        y = np.linspace(-grid_size*step_size/2, grid_size*step_size/2, grid_size)
        X, Y = np.meshgrid(x, y)
        
        B_field = np.zeros((grid_size, grid_size, 3))
        for i in range(grid_size):
            for j in range(grid_size):
                B_field[i, j] = variable_B_field(np.array([X[i,j], Y[i,j], 0]))
        
        global_B_field = B_field.tolist()
    return global_B_field

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/simulate', methods=['GET'])
def simulate():
    # Get parameters from query string
    charge = float(request.args.get('charge', 1.602e-19))
    mass = float(request.args.get('mass', 9.109e-31))
    position = [float(x) for x in request.args.get('position', '0,0,0').split(',')]
    velocity = [float(x) for x in request.args.get('velocity', '0,0,0').split(',')]
    dt = float(request.args.get('timeStep', 1e-12))
    update_interval = float(request.args.get('updateInterval', 0.05))  # 50ms default
    
    particle = Particle(
        q=charge,
        m=mass,
        r0=position,
        v0=velocity,
        B_func=variable_B_field,
        dt=dt
    )
    
    def generate():
        while True:
            start_time = time.time()
            
            # Perform multiple updates to simulate a longer time step
            for _ in range(1):  # Adjust this number to control simulation speed
                r = particle.update()
            
            B = particle.B_func(r)
            yield f"data:{json.dumps({'position': r, 'B_field': B.tolist()})}\n\n"
            
            # Calculate sleep time to maintain update_interval
            elapsed_time = time.time() - start_time
            sleep_time = max(0, update_interval - elapsed_time)
            time.sleep(sleep_time)
    
    return Response(generate(), mimetype='text/event-stream')

@app.route('/magnetic_field', methods=['GET'])
def get_magnetic_field():
    B_field = generate_magnetic_field_grid()
    return jsonify({'B_field': B_field})

if __name__ == '__main__':
    app.run(debug=True)