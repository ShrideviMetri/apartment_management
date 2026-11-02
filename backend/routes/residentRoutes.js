const express = require("express");
const router = express.Router();
const db = require("../db");
const jwt = require("jsonwebtoken");

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

// GET logged-in resident's profile
router.get("/me/profile", (req, res) => {

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Authentication token required"
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.role !== "resident") {
            return res.status(403).json({
                message: "Access denied. Resident only."
            });
        }

        const sql = `
            SELECT
                r.resident_id,
                r.name,
                r.phone,
                r.email,
                r.occupation,
                r.role,
                r.move_in_date,
                r.move_out_date,
                a.apartment_id,
                a.apartment_number,
                a.floor,
                a.wing,
                a.type,
                a.area_sqft
            FROM resident r
            JOIN apartment a
                ON r.apartment_id = a.apartment_id
            WHERE r.resident_id = ?
        `;

        db.query(sql, [decoded.resident_id], (err, results) => {

            if (err) {
                console.error(err);
                return res.status(500).json({
                    message: "Failed to fetch resident profile"
                });
            }

            if (results.length === 0) {
                return res.status(404).json({
                    message: "Resident not found"
                });
            }

            res.json(results[0]);
        });

    } catch (err) {
        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
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