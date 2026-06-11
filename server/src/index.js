const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
require("dotenv").config();

const socketHandler = require("./socket/socketHandler");

const app = express();
app.use(cors());

const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5174" || "https://typeing-race.vercel.app")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.get("/", (req, res) => {
  res.send("Last Typist Standing Server Running");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

socketHandler(io);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
