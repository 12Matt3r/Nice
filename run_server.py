import subprocess
import os

# Start the Node.js server
server_process = subprocess.Popen(['npm', 'start'], stdout=subprocess.PIPE, stderr=subprocess.PIPE)

# You can optionally print the output for debugging
for line in iter(server_process.stdout.readline, b''):
    print(line.decode('utf-8').strip())
