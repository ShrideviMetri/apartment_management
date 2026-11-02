const express = require("express");
const router = express.Router();
const db = require("../db");
const jwt = require("jsonwebtoken");

// GET all vehicles
router.get("/", (req, res) => {
    const sql = "SELECT * FROM vehicle";

    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to fetch vehicles"
            });
        }

        res.json(results);
    });
});

// Verify resident token
function verifyResident(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Authentication token required"
        });
    }

    try {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.role !== "resident") {
            return res.status(403).json({
                message: "Access denied"
            });
        }

        req.residentId = decoded.resident_id;
        next();

    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
}

// GET logged-in resident's vehicles
router.get("/my", verifyResident, (req, res) => {
    const sql = `
        SELECT vehicle_id, resident_id, parking_slot_id,
               vehicle_number, vehicle_type, brand, model
        FROM vehicle
        WHERE resident_id = ?
        ORDER BY vehicle_id DESC
    `;

    db.query(sql, [req.residentId], (err, results) => {
        if (err) {
            console.error("Resident vehicles error:", err);
            return res.status(500).json({
                message: "Failed to fetch vehicles"
            });
        }

        res.json(results);
    });
});

// ADD vehicle for logged-in resident
router.post("/my", verifyResident, (req, res) => {
    const {
        parking_slot_id,
        vehicle_number,
        vehicle_type,
        brand,
        model
    } = req.body;

    if (!vehicle_number || !vehicle_type) {
        return res.status(400).json({
            message: "Vehicle number and vehicle type are required"
        });
    }

    const sql = `
        INSERT INTO vehicle
        (resident_id, parking_slot_id, vehicle_number,
         vehicle_type, brand, model)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    const values = [
        req.residentId,
        parking_slot_id || null,
        vehicle_number,
        vehicle_type,
        brand || null,
        model || null
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Add resident vehicle error:", err);
            return res.status(500).json({
                message: "Failed to add vehicle"
            });
        }

        res.status(201).json({
            message: "Vehicle added successfully",
            vehicle_id: result.insertId
        });
    });
});

// DELETE only the logged-in resident's vehicle
router.delete("/my/:id", verifyResident, (req, res) => {
    const sql = `
        DELETE FROM vehicle
        WHERE vehicle_id = ? AND resident_id = ?
    `;

    db.query(sql, [req.params.id, req.residentId], (err, result) => {
        if (err) {
            console.error("Delete resident vehicle error:", err);
            return res.status(500).json({
                message: "Failed to delete vehicle"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Vehicle not found or access denied"
            });
        }

        res.json({
            message: "Vehicle deleted successfully"
        });
    });
});

// POST a new vehicle
router.post("/", (req, res) => {
    const {
        resident_id,
        parking_slot_id,
        vehicle_number,
        vehicle_type,
        brand,
        model
    } = req.body;

    const sql = `
        INSERT INTO vehicle
        (resident_id, parking_slot_id, vehicle_number, vehicle_type, brand, model)
        VALUES (?, ?, ?, ?, ?,?)
    `;

    const values = [
        resident_id,
        parking_slot_id,
        vehicle_number,
        vehicle_type,
        brand,
        model
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to add vehicle"
            });
        }

        res.status(201).json({
            message: "Vehicle added successfully",
            vehicle_id: result.insertId
        });
    });
});

// GET vehicle by ID
router.get("/:id", (req, res) => {
    const vehicleId = req.params.id;

    const sql = "SELECT * FROM vehicle WHERE vehicle_id = ?";

    db.query(sql, [vehicleId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to fetch vehicle"
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                message: "Vehicle not found"
            });
        }

        res.json(results[0]);
    });
});

// UPDATE vehicle
router.put("/:id", (req, res) => {
    const vehicleId = req.params.id;

    const {
        resident_id,
        parking_slot_id,
        vehicle_number,
        vehicle_type,
        brand,
        model
    } = req.body;

    const sql = `
        UPDATE vehicle
        SET resident_id = ?,
            parking_slot_id = ?,
            vehicle_number = ?,
            vehicle_type = ?,
            brand = ?,
            model = ?
        WHERE vehicle_id = ?
    `;

    const values = [
        resident_id,
        parking_slot_id,
        vehicle_number,
        vehicle_type,
        brand,
        model,
        vehicleId
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to update vehicle"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Vehicle not found"
            });
        }

        res.json({
            message: "Vehicle updated successfully"
        });
    });
});

// DELETE vehicle
router.delete("/:id", (req, res) => {
    const vehicleId = req.params.id;

    const sql = "DELETE FROM vehicle WHERE vehicle_id = ?";

    db.query(sql, [vehicleId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to delete vehicle"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Vehicle not found"
            });
        }

        res.json({
            message: "Vehicle deleted successfully"
        });
    });
});

module.exports = router;