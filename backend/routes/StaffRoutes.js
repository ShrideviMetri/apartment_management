const express = require("express");
const router = express.Router();
const db = require("../db");

// GET all staff
router.get("/", (req, res) => {
    const sql = "SELECT * FROM Staff";

    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to fetch staff"
            });
        }

        res.json(results);
    });
});


// POST staff
router.post("/", (req, res) => {
    const {
        name,
        phone,
        email,
        staff_type,
        joining_date,
        status
    } = req.body;

    const sql = `
        INSERT INTO Staff
        (name, phone, email, staff_type, joining_date, status)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    const values = [
        name,
        phone,
        email,
        staff_type,
        joining_date,
        status || "Active"
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to add staff"
            });
        }

        res.status(201).json({
            message: "Staff added successfully",
            staff_id: result.insertId
        });
    });
});


// GET staff by ID
router.get("/:id", (req, res) => {
    const staffId = req.params.id;

    const sql = "SELECT * FROM Staff WHERE staff_id = ?";

    db.query(sql, [staffId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to fetch staff"
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                message: "Staff not found"
            });
        }

        res.json(results[0]);
    });
});


// UPDATE staff
router.put("/:id", (req, res) => {
    const staffId = req.params.id;

    const {
        name,
        phone,
        email,
        staff_type,
        joining_date,
        status
    } = req.body;

    const sql = `
        UPDATE Staff
        SET name = ?,
            phone = ?,
            email = ?,
            staff_type = ?,
            joining_date = ?,
            status = ?
        WHERE staff_id = ?
    `;

    const values = [
        name,
        phone,
        email,
        staff_type,
        joining_date,
        status,
        staffId
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to update staff"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Staff not found"
            });
        }

        res.json({
            message: "Staff updated successfully"
        });
    });
});


// DELETE staff
router.delete("/:id", (req, res) => {
    const staffId = req.params.id;

    const sql = "DELETE FROM Staff WHERE staff_id = ?";

    db.query(sql, [staffId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to delete staff"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Staff not found"
            });
        }

        res.json({
            message: "Staff deleted successfully"
        });
    });
});


module.exports = router;