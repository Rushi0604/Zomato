import http.server
import socketserver
import os

PORT = 8080

class MyHandler(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        # Normalize and remove query parameters if any
        clean_path = path.split('?')[0]
        
        # Serve db/setup.sql directly from project root, everything else from web/
        if clean_path.startswith("/db/"):
            return os.path.join(os.getcwd(), clean_path.lstrip("/"))
        
        # If accessing the root, default to web/index.html
        if clean_path == "/":
            return os.path.join(os.getcwd(), "web", "index.html")
            
        return os.path.join(os.getcwd(), "web", clean_path.lstrip("/"))

    def end_headers(self):
        # Enable CORS
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

# Allow address reuse to prevent "Address already in use" errors
socketserver.TCPServer.allow_reuse_address = True

print("=================================================")
print("FoodExpress Python Web Server Starting...")
print(f"Access UI at: http://localhost:{PORT}")
print("=================================================")

try:
    with socketserver.TCPServer(("", PORT), MyHandler) as httpd:
        httpd.serve_forever()
except KeyboardInterrupt:
    print("\nServer stopped.")
