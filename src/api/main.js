import express from "express";
import pool from "./index.js";
import candidatRoutes from "./routes/candidat.route.js";
import authRoutes from "./routes/auth.route.js";


const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/candidats", candidatRoutes);

app.get("/", (req, res) => {
  pool.query("SELECT current_database()")
    .then(result => res.send(`Connected to database: ${result.rows[0].current_database}`))
    .catch(err => res.status(500).send(err.message));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 

