#!/usr/bin/env python3
"""Local static server for development with cache disabled."""

from __future__ import annotations

import argparse
import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class NoCacheHTTPRequestHandler(SimpleHTTPRequestHandler):
    """Serve static files while disabling browser/proxy cache."""

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def send_head(self):
        # Ignore conditional requests so local development always gets fresh content.
        for header_name in ("If-Modified-Since", "If-None-Match"):
            if header_name in self.headers:
                del self.headers[header_name]
        return super().send_head()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run local static server with cache disabled")
    parser.add_argument("port", nargs="?", type=int, default=8000, help="Port to listen on")
    parser.add_argument("--host", default="0.0.0.0", help="Host/IP to bind")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    os.chdir(root_dir)

    server = ThreadingHTTPServer((args.host, args.port), NoCacheHTTPRequestHandler)

    print("=" * 42)
    print("  个人简历本地开发服务器（禁缓存）")
    print("=" * 42)
    print(f"项目目录: {os.getcwd()}")
    print(f"访问地址: http://localhost:{args.port}/index.html")
    print("按 Ctrl+C 停止服务器")
    print("=" * 42)

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n服务器已停止")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
