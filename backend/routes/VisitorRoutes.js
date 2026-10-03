const express = require("express");
const router = express.Router();
const db = require("../db");

// GET all visitors
router.get("/", (req, res) => {
    const sql = "SELECT * FROM Visitor";

    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to fetch visitors"
            });
        }

        res.json(results);
    });
});


// POST visitor
router.post("/", (req, res) => {
    const {
        resident_id,
        visitor_name,
        phone,
        purpose,
        vehicle_number,
        entry_time,
        exit_time
    } = req.body;

    const sql = `
        INSERT INTO Visitor
        (resident_id, visitor_name, phone, purpose, vehicle_number, entry_time, exit_time)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        resident_id,
        visitor_name,
        phone,
        purpose,
        vehicle_number,
        entry_time,
        exit_time
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to add visitor"
            });
        }

        res.status(201).json({
            message: "Visitor added successfully",
            visitor_id: result.insertId
        });
    });
});


// GET visitor by ID
router.get("/:id", (req, res) => {
    const visitorId = req.params.id;

    const sql = "SELECT * FROM Visitor WHERE visitor_id = ?";

    db.query(sql, [visitorId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to fetch visitor"
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                message: "Visitor not found"
            });
        }

        res.json(results[0]);
    });
});


// UPDATE visitor
router.put("/:id", (req, res) => {
    const visitorId = req.params.id;

    const {
        resident_id,
        visitor_name,
        phone,
        purpose,
        vehicle_number,
        entry_time,
        exit_time
    } = req.body;

    const sql = `
        UPDATE Visitor
        SET resident_id = ?,
            visitor_name = ?,
            phone = ?,
            purpose = ?,
            vehicle_number = ?,
            entry_time = ?,
            exit_time = ?
        WHERE visitor_id = ?
    `;

    const values = [
        resident_id,
        visitor_name,
        phone,
        purpose,
        vehicle_number,
        entry_time,
        exit_time,
        visitorId
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to update visitor"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Visitor not found"
            });
        }

        res.json({
            message: "Visitor updated successfully"
        });
    });
});


// DELETE visitor
router.delete("/:id", (req, res) => {
    const visitorId = req.params.id;

    const sql = "DELETE FROM Visitor WHERE visitor_id = ?";

    db.query(sql, [visitorId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to delete visitor"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Visitor not found"
            });
        }

        res.json({
            message: "Visitor deleted successfully"
        });
    });
});


module.exports = router;