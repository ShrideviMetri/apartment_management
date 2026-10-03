const express = require("express");
const router = express.Router();
const db = require("../db");

// GET all residents
router.get("/", (req, res) => {
    const sql = "SELECT * FROM resident";

    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to fetch residents"
            });
        }

        res.json(results);
    });
});

// POST a new resident
router.post("/", (req, res) => {
    const {
        apartment_id,
        name,
        phone,
        email,
        occupation,
        role,
        move_in_date,
        move_out_date
    } = req.body;

    const sql = `
        INSERT INTO resident
        (apartment_id, name, phone, email, occupation, role, move_in_date, move_out_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        apartment_id,
        name,
        phone,
        email,
        occupation,
        role,
        move_in_date,
        move_out_date
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to add resident"
            });
        }

        res.status(201).json({
            message: "Resident added successfully",
            resident_id: result.insertId
        });
    });
});

// GET resident by ID
router.get("/:id", (req, res) => {
    const residentId = req.params.id;

    const sql = "SELECT * FROM resident WHERE resident_id = ?";

    db.query(sql, [residentId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to fetch resident"
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                message: "Resident not found"
            });
        }

        res.json(results[0]);
    });
});

// UPDATE a resident
router.put("/:id", (req, res) => {
    const residentId = req.params.id;

    const {
        apartment_id,
        name,
        phone,
        email,
        occupation,
        role,
        move_in_date,
        move_out_date
    } = req.body;

    const sql = `
        UPDATE resident
        SET apartment_id = ?,
            name = ?,
            phone = ?,
            email = ?,
            occupation = ?,
            role = ?,
            move_in_date = ?,
            move_out_date = ?
        WHERE resident_id = ?
    `;

    const values = [
        apartment_id,
        name,
        phone,
        email,
        occupation,
        role,
        move_in_date,
        move_out_date,
        residentId
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to update resident"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Resident not found"
            });
        }

        res.json({
            message: "Resident updated successfully"
        });
    });
});

// DELETE a resident
router.delete("/:id", (req, res) => {
    const residentId = req.params.id;

    const sql = "DELETE FROM resident WHERE resident_id = ?";

    db.query(sql, [residentId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to delete resident"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Resident not found"
            });
        }

        res.json({
            message: "Resident deleted successfully"
        });
    });
});

module.exports = router;