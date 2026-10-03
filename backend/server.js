const express = require("express");
const cors = require("cors");
const db = require("./db");
const apartmentRoutes=require("./routes/apartmentRoutes");
const residentRoutes=require("./routes/residentRoutes");
const familyMemberRoutes=require("./routes/familyMemberRoutes");
const vehicleRoutes=require("./routes/vehicleRoutes");
const parkingslotRoutes=require("./routes/parkingslotRoutes");
const maintenanceBillRoutes=require("./routes/maintenanceBillRoutes");
const PaymentRoutes=require("./routes/PaymentRoutes");
const StaffRoutes=require("./routes/StaffRoutes");
const ComplaintRoutes=require("./routes/ComplaintRoutes");
const GymMembershipRoutes=require("./routes/GymMembershipRoutes");
const GymAttendenceRoutes=require("./routes/GymAttendenceRoutes");
const AmenityRoutes=require("./routes/AmenityRoutes");
const AmenityBookingRoutes=require("./routes/AmenityBookingRoutes");
const VisitorRoutes=require("./routes/VisitorRoutes");
const DeliveryRoutes=require("./routes/DeliveryRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/apartment",apartmentRoutes);
app.use("/api/resident",residentRoutes);
app.use("/api/familymember",familyMemberRoutes);
app.use("/api/vehicle",vehicleRoutes);
app.use("/api/parkingslot",parkingslotRoutes);
app.use("/api/maintenancebill",maintenanceBillRoutes);
app.use("/api/payment",PaymentRoutes);
app.use("/api/staff",StaffRoutes);
app.use("/api/complaint",ComplaintRoutes);
app.use("/api/gymmembership",GymMembershipRoutes);
app.use("/api/gymattendance",GymAttendenceRoutes);
app.use("/api/amenity",AmenityRoutes);
app.use("/api/amenitybooking",AmenityBookingRoutes);
app.use("/api/visitor",VisitorRoutes);
app.use("/api/delivery",DeliveryRoutes);
app.use("/api/auth", authRoutes);


// Test route
app.get("/", (req, res) => {
    res.send("Apartment Management System Backend is running!");
});

// Test database connection
app.get("/api/test-db", (req, res) => {
    db.query("SELECT 1", (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({
                message: "Database connection failed"
            });
        }

        res.json({
            message: "Database connected successfully!"
        });
    });
});

const PORT = 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});