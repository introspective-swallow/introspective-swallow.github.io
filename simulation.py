# simulation.py
import numpy as np

class Particle:
    def __init__(self, q, m, r0, v0, B_func, dt):
        self.q = float(q)  # Charge in Coulombs
        self.m = float(m)  # Mass in kg
        self.r = np.array(r0, dtype=float)  # Position in meters
        self.v = np.array(v0, dtype=float)  # Velocity in m/s
        self.B_func = B_func  # Function to calculate B field at a given position
        self.dt = float(dt)  # Time step in seconds

    def update(self):
        # Implement Boris algorithm for particle push
        B = self.B_func(self.r)
        t = self.q * B * self.dt / (2 * self.m)
        s = 2 * t / (1 + np.dot(t, t))
        
        v_minus = self.v + self.q * self.dt * B / (2 * self.m)
        v_prime = v_minus + np.cross(v_minus, t)
        v_plus = v_minus + np.cross(v_prime, s)
        
        self.v = v_plus
        self.r += self.v * self.dt
        
        return self.r.tolist()

def variable_B_field(r):
    # Create a magnetic field that varies with x and y position
    x, y = r[0], r[1]
    B_x = 0.1 * np.sin(2 * np.pi * y / 1e-5)
    B_y = 0.1 * np.sin(2 * np.pi * x / 1e-5)
    B_z = 1 + 0.1 * np.sin(2 * np.pi * (x + y) / 1e-5)  # Base field + variation
    return np.array([B_x, B_y, B_z])