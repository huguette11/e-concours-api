import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();


import authRoutes      from "./routes/auth.route.js";
import candidatRoutes  from "./routes/candidat.route.js";
import concoursRoutes from "./routes/concours.route.js";
import examenRoutes from "./routes/examen.route.js";



//app.use("/api/concours", concoursRoutes);


const app  = express();
const PORT = process.env.PORT || 3000;


const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:4000",
  "http://localhost:5000",
  "http://localhost:5173", 
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error("CORS non autorisé"));
  },
  credentials: true,
}));


app.use(express.json());


app.use("/api/auth",       authRoutes);
app.use("/api/candidats",  candidatRoutes);


app.get("/", (req, res) => {
  res.json({
    message: "API e-concours opérationnelle",
    version: "1.0.0",
  });
});


app.listen(PORT, () => {
  console.log(` Serveur démarré sur le port ${PORT}`);
});