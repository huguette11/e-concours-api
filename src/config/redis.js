import { Redis } from "ioredis";

export const connection = new Redis({
  host: "127.0.0.1",
  port: 6379,
});

connection.on("connect", () => console.log(" Redis connecté"));
connection.on("error", (err) => console.error("Redis erreur :", err));