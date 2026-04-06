import express from "express";
import candidatRoutes from "./routes/candidat.route.js";
import authRoutes from "./routes/auth.route.js";
import cors from "cors" ;
import { swaggerDocs } from "./swagger.js";
import helmet from "helmet";
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
app.use("/api/auth", authRoutes);
app.use("/candidats", candidatRoutes);
swaggerDocs(app, 3000);
app.get("/", (req, res) => {
  res.send("API e-concours opérationnelle");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});