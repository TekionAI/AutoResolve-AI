

const express = require("express");
const cors = require("cors");


require("dotenv").config();

const connectDB = require("./config/db");
const dealershipRoutes = require("./routes/dealershipRoutes");
const partsRoutes = require("./routes/partsRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const repairOrderRoutes = require("./routes/repairOrderRoutes");
const vendorRoutes = require("./routes/vendorRoutes");
const vendorInventoryRoutes = require("./routes/vendorInventoryRoutes");
const sourcingRoutes = require("./routes/sourcingRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
const approvalRoutes = require("./routes/approvalRoutes");
const applyRecommendationRoutes = require("./routes/applyRecommendationRoutes");
const technicianRoutes = require("./routes/technicianRoutes");
const serviceBayRoutes = require("./routes/serviceBayRoutes");
const scheduleRoutes = require("./routes/scheduleRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/dealerships", dealershipRoutes);
app.use("/api/parts", partsRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/repair-orders", repairOrderRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/vendor-inventory", vendorInventoryRoutes);
app.use("/api/sourcing", sourcingRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/approvals", approvalRoutes);
app.use("/api/apply-recommendations", applyRecommendationRoutes);
app.use("/api/technicians", technicianRoutes);
app.use("/api/service-bays", serviceBayRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "AutoResolve AI Backend is running!",
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "Healthy",
    service: "AutoResolve AI Backend",
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`AutoResolve AI Backend running on port ${PORT}`);
  });
};

startServer();
