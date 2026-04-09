import express from "express";
import candidatRoutes from "./routes/candidat.route.js";
import authRoutes from "./routes/auth.route.js";
import adminRoutes from "./routes/admin.route.js"; 
import cors from "cors";
import { swaggerDocs } from "./swagger.js";
import helmet from "helmet";
import inscriptionRoutes from "./routes/inscription.route.js";



const app = express();

const PORT = process.env.PORT || 3000;

const allowedOrigins = [
  "http://localhost:3000",   
  "http://localhost:4000",  
  "http://localhost:5000",    
  "http://localhost:6000", 
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS non autorisé"));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(helmet());
app.use(express.json());

app.use("/inscriptions", inscriptionRoutes);
app.use("/api/auth", authRoutes);
app.use("/candidats", candidatRoutes);
app.use("/admin", adminRoutes);

swaggerDocs(app, PORT);

app.get("/", (req, res) => {
  res.send("API e-concours opérationnelle");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});