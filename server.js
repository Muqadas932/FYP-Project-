// backend/server.js
require("dotenv").config();
const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const recommendRoutes = require("./routes/recommendRoutes");
const jobRoutes = require("./routes/jobRoutes");               // NEW
const applicationRoutes = require("./routes/applicationRoutes"); // NEW
const reportRoutes = require("./routes/reportRoutes");           // NEW
const externalJobsRoutes = require("./routes/externalJobsRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// ====== STATIC FRONTEND (VERY IMPORTANT) ======
// assume: D:\job-portal-ai-node\frontend
const FRONTEND_DIR = path.join(__dirname, "..", "frontend");
console.log("Serving frontend from:", FRONTEND_DIR);

app.use(express.static(FRONTEND_DIR));

// "/" par index.html bhej do
app.get("/", (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, "index.html"));
});

// ====== API ROUTES ======
app.use("/api/auth", authRoutes);              // /api/auth/login , /api/auth/register
app.use("/api/recommend", recommendRoutes);    // AI recommendations
app.use("/api/jobs", jobRoutes);               // Admin: create + list jobs
app.use("/api/applications", applicationRoutes); // User: apply to jobs
app.use("/api/report", reportRoutes);          // FYP PDF report
app.use("/api/external-jobs", externalJobsRoutes); // External jobs fetch

// ====== DB + SERVER START ======
const PORT = process.env.PORT || 5000;
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/job_portal_ai";

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });
