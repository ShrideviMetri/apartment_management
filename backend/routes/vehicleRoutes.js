const express = require("express");
const router = express.Router();
const db = require("../db");

// GET all vehicles
router.get("/", (req, res) => {
    const sql = "SELECT * FROM Vehicle";

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
        INSERT INTO Vehicle
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

    const sql = "SELECT * FROM Vehicle WHERE vehicle_id = ?";

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
        UPDATE Vehicle
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

    const sql = "DELETE FROM Vehicle WHERE vehicle_id = ?";

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