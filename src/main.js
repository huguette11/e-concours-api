import express from "express";
import candidatRoutes from "./routes/candidat.route.js";
import authRoutes from "./routes/auth.route.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/candidats", candidatRoutes);

app.get("/", (req, res) => {
  res.send("API e-concours opérationnelle");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});