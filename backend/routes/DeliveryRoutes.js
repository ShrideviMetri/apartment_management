const express = require("express");
const router = express.Router();
const db = require("../db");

// GET all deliveries
router.get("/", (req, res) => {
    const sql = "SELECT * FROM Delivery";

    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to fetch deliveries"
            });
        }

        res.json(results);
    });
});


// POST delivery
router.post("/", (req, res) => {
    const {
        resident_id,
        delivery_person,
        delivery_company,
        package_details,
        vehicle_number,
        arrival_time,
        collected_time,
        status
    } = req.body;

    const sql = `
        INSERT INTO Delivery
        (resident_id, delivery_person, delivery_company, package_details,
         vehicle_number, arrival_time, collected_time, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        resident_id,
        delivery_person,
        delivery_company,
        package_details,
        vehicle_number,
        arrival_time,
        collected_time,
        status || "Pending"
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to add delivery"
            });
        }

        res.status(201).json({
            message: "Delivery added successfully",
            delivery_id: result.insertId
        });
    });
});


// GET delivery by ID
router.get("/:id", (req, res) => {
    const deliveryId = req.params.id;

    const sql = "SELECT * FROM Delivery WHERE delivery_id = ?";

    db.query(sql, [deliveryId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to fetch delivery"
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                message: "Delivery not found"
            });
        }

        res.json(results[0]);
    });
});


// UPDATE delivery
router.put("/:id", (req, res) => {
    const deliveryId = req.params.id;

    const {
        resident_id,
        delivery_person,
        delivery_company,
        package_details,
        vehicle_number,
        arrival_time,
        collected_time,
        status
    } = req.body;

    const sql = `
        UPDATE Delivery
        SET resident_id = ?,
            delivery_person = ?,
            delivery_company = ?,
            package_details = ?,
            vehicle_number = ?,
            arrival_time = ?,
            collected_time = ?,
            status = ?
        WHERE delivery_id = ?
    `;

    const values = [
        resident_id,
        delivery_person,
        delivery_company,
        package_details,
        vehicle_number,
        arrival_time,
        collected_time,
        status,
        deliveryId
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to update delivery"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Delivery not found"
            });
        }

        res.json({
            message: "Delivery updated successfully"
        });
    });
});


// DELETE delivery
router.delete("/:id", (req, res) => {
    const deliveryId = req.params.id;

    const sql = "DELETE FROM Delivery WHERE delivery_id = ?";

    db.query(sql, [deliveryId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to delete delivery"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Delivery not found"
            });
        }

        res.json({
            message: "Delivery deleted successfully"
        });
    });
});


module.exports = router;