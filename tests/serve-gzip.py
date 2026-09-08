"""Local reproduction of a compressed model response with encoded Content-Length."""
import gzip
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.split('?')[0]=='/assets/summer-festival-phase13.glb':
            payload=gzip.compress(Path('assets/summer-festival-phase13.glb').read_bytes())
            self.send_response(200)
            self.send_header('Content-Type','model/gltf-binary')
            self.send_header('Content-Encoding','gzip')
            self.send_header('Content-Length',str(len(payload)))
            self.end_headers();self.wfile.write(payload)
        else:super().do_GET()

ThreadingHTTPServer(('127.0.0.1',int(sys.argv[1]) if len(sys.argv)>1 else 19773),Handler).serve_forever()
