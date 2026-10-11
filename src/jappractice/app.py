"""Local HTTP server for the spelling practice application."""

from __future__ import annotations

import argparse
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from importlib.resources import files
import json
import mimetypes
from urllib.parse import urlparse

from jappractice.data import load_words


WEB_ROOT = files("jappractice").joinpath("web")
WORDS = load_words()


class PracticeRequestHandler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:  # noqa: N802
        path = urlparse(self.path).path
        if path == "/api/health":
            self._send_json({"status": "ok", "word_count": len(WORDS)})
            return
        if path == "/api/words":
            self._send_json(
                {
                    "words": WORDS,
                    "counts": {
                        "all": len(WORDS),
                        "verb": sum(word["kind"] == "verb" for word in WORDS),
                        "adjective": sum(word["kind"] == "adjective" for word in WORDS),
                    },
                }
            )
            return
        self._send_static(path)

    def _send_json(self, payload: dict) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _send_static(self, request_path: str) -> None:
        relative = "index.html" if request_path == "/" else request_path.lstrip("/")
        if ".." in relative.split("/"):
            self.send_error(HTTPStatus.NOT_FOUND)
            return
        resource = WEB_ROOT.joinpath(relative)
        if not resource.is_file():
            self.send_error(HTTPStatus.NOT_FOUND)
            return
        body = resource.read_bytes()
        content_type = mimetypes.guess_type(relative)[0] or "application/octet-stream"
        if content_type.startswith("text/") or content_type in {"application/javascript", "application/json"}:
            content_type += "; charset=utf-8"
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format: str, *args: object) -> None:
        return


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the local Japanese spelling practice app")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", default=8000, type=int)
    args = parser.parse_args()
    server = ThreadingHTTPServer((args.host, args.port), PracticeRequestHandler)
    print(f"日语拼写练习已启动：http://{args.host}:{args.port}", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
