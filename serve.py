import http.server
import os

os.chdir("/Users/drsim/Documents/Software/RwandAir")
handler = http.server.SimpleHTTPRequestHandler
httpd = http.server.HTTPServer(("", 8080), handler)
print("Serving on http://localhost:8080")
httpd.serve_forever()
