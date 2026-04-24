import dotenv from 'dotenv'
dotenv.config();

import express from "express";
import candidatRoutes from "./routes/candidat.route.js";
import authRoutes from "./routes/auth.route.js";
import adminRoutes from "./routes/admin.route.js"; 
import cors from "cors";
import { swaggerDocs } from "./swagger.js";
import helmet from "helmet";
import { connection } from "./config/redis.js";
import inscriptionRoutes from "./routes/inscription.route.js";
import paiementRoutes from "./routes/paiement.route.js";
import concoursRoutes from "./routes/concours.route.js";
import { limiter } from "./middleware/rateLimiter.js";
import { Cron } from "./cron/Cron.js";
import { ensureBucketExists } from "./config/minio.js";

const app = express();

const PORT = process.env.PORT || 4000;

// const allowedOrigins = [
//   "http://localhost:3000",   
//   "http://localhost:4000",  
//   "http://localhost:5000",    
//   "http://localhost:6000", 
// ];

// const corsOptions = {
//   origin: (origin, callback) => {
//     if (!origin) return callback(null, true);

//     if (allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error("CORS non autorisé"));
//     }
//   },
//   credentials: true,
// };
await ensureBucketExists('e-concours');

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(limiter)

app.use("/api/inscription", inscriptionRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/candidat", candidatRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payment",paiementRoutes)
app.use("/api/concours",concoursRoutes)


swaggerDocs(app, PORT);

app.get("/", (req, res) => {
  res.send("API e-concours opérationnelle");
});

// await connection.set("test", "ioredis fonctionne !");
// const val = await connection.get("test");
// console.log(val); // ioredis fonctionne !

app.listen(PORT, () => {

  console.log(`Server is running on port ${PORT}`);
});