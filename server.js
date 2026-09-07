import http from "node:http";

const PORT = Number(process.env.PORT) || 3000;

const server = http.createServer((req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200);
    res.end(
      JSON.stringify({
        ok: true,
        service: "ZAKSH Backend",
        name: "ZAKSH",
        token: "ZKO"
      })
    );
    return;
  }

  res.writeHead(404);
  res.end(
    JSON.stringify({
      ok: false,
      error: "Not Found"
    })
  );
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`ZAKSH backend listening on port ${PORT}`);
});
