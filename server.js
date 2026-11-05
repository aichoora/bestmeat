// 개발용 로컬 서버: node server.js 실행 후 http://localhost:8080 접속
// (별도 설치 없이 Node.js만 있으면 동작합니다)
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 8080;
const ROOT = __dirname;
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
};

http.createServer((req, res) => {
  let urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (urlPath.endsWith("/")) urlPath += "index.html";

  const file = path.join(ROOT, urlPath);
  // 프로젝트 폴더 밖이나 숨김 파일(.git 등)은 열지 않음
  if (!file.startsWith(ROOT + path.sep) || urlPath.split("/").some((p) => p.startsWith(".")) || path.basename(file) === "server.js") {
    res.writeHead(403).end("Forbidden");
    return;
  }

  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("페이지를 찾을 수 없습니다.");
      return;
    }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file).toLowerCase()] || "application/octet-stream" });
    res.end(data);
  });
}).listen(PORT, () => {
  console.log(`베스트미트 개발 서버 실행 중: http://localhost:${PORT}`);
  console.log("종료하려면 Ctrl+C");
});
