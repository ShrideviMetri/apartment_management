const express = require("express");
const router = express.Router();
const db = require("../db");
const jwt = require("jsonwebtoken");

// GET all apartments
router.get("/", (req, res) => {
    const sql = "SELECT * FROM apartment";

    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to fetch apartments"
            });
        }

        res.json(results);
    });
});

// GET apartment belonging to logged-in resident
router.get("/me", (req, res) => {

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
                message: "Resident access only"
            });
        }

        const sql = `
            SELECT a.*
            FROM apartment a
            JOIN resident r
                ON a.apartment_id = r.apartment_id
            WHERE r.resident_id = ?
        `;

        db.query(sql, [decoded.resident_id], (err, results) => {

            if (err) {
                console.error(err);
                return res.status(500).json({
                    message: "Failed to fetch apartment details"
                });
            }

            if (results.length === 0) {
                return res.status(404).json({
                    message: "Apartment not found"
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


// GET apartment by ID
router.get("/:id", (req, res) => {
    const apartmentId = req.params.id;

    const sql = "SELECT * FROM apartment WHERE apartment_id = ?";

    db.query(sql, [apartmentId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to fetch apartment"
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                message: "Apartment not found"
            });
        }

        res.json(results[0]);
    });
});

// UPDATE an apartment
router.put("/:id", (req, res) => {
    const apartmentId = req.params.id;

    const {
        apartment_number,
        floor,
        wing,
        type,
        area_sqft,
        status
    } = req.body;

    const sql = `
        UPDATE apartment
        SET apartment_number = ?,
            floor = ?,
            wing = ?,
            type = ?,
            area_sqft = ?,
            status = ?
        WHERE apartment_id = ?
    `;

    const values = [
        apartment_number,
        floor,
        wing,
        type,
        area_sqft,
        status,
        apartmentId
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to update apartment"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Apartment not found"
            });
        }

        res.json({
            message: "Apartment updated successfully"
        });
    });
});

// DELETE an apartment
router.delete("/:id", (req, res) => {
    const apartmentId = req.params.id;

    const sql = "DELETE FROM apartment WHERE apartment_id = ?";

    db.query(sql, [apartmentId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to delete apartment"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Apartment not found"
            });
        }

        res.json({
            message: "Apartment deleted successfully"
        });
    });
});

// POST a new apartment
router.post("/", (req, res) => {
    const {
        apartment_number,
        floor,
        wing,
        type,
        area_sqft,
        status
    } = req.body;

    const sql = `
        INSERT INTO apartment
        (apartment_number, floor, wing, type, area_sqft, status)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    const values = [
        apartment_number,
        floor,
        wing,
        type,
        area_sqft,
        status
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to add apartment"
            });
        }

        res.status(201).json({
            message: "Apartment added successfully",
            apartment_id: result.insertId
        });
    });
});



module.exports = router;