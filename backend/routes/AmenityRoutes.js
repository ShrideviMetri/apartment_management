const express = require("express");
const router = express.Router();
const db = require("../db");

// GET all amenities
router.get("/", (req, res) => {
    const sql = "SELECT * FROM Amenity";

    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to fetch amenities"
            });
        }

        res.json(results);
    });
});


// POST amenity
router.post("/", (req, res) => {
    const {
        name,
        description,
        location,
        capacity,
        status
    } = req.body;

    const sql = `
        INSERT INTO Amenity
        (name, description, location, capacity, status)
        VALUES (?, ?, ?, ?, ?)
    `;

    const values = [
        name,
        description,
        location,
        capacity,
        status || "Available"
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to add amenity"
            });
        }

        res.status(201).json({
            message: "Amenity added successfully",
            amenity_id: result.insertId
        });
    });
});


// GET amenity by ID
router.get("/:id", (req, res) => {
    const amenityId = req.params.id;

    const sql = "SELECT * FROM Amenity WHERE amenity_id = ?";

    db.query(sql, [amenityId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to fetch amenity"
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                message: "Amenity not found"
            });
        }

        res.json(results[0]);
    });
});


// UPDATE amenity
router.put("/:id", (req, res) => {
    const amenityId = req.params.id;

    const {
        name,
        description,
        location,
        capacity,
        status
    } = req.body;

    const sql = `
        UPDATE Amenity
        SET name = ?,
            description = ?,
            location = ?,
            capacity = ?,
            status = ?
        WHERE amenity_id = ?
    `;

    const values = [
        name,
        description,
        location,
        capacity,
        status,
        amenityId
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to update amenity"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Amenity not found"
            });
        }

        res.json({
            message: "Amenity updated successfully"
        });
    });
});


// DELETE amenity
router.delete("/:id", (req, res) => {
    const amenityId = req.params.id;

    const sql = "DELETE FROM Amenity WHERE amenity_id = ?";

    db.query(sql, [amenityId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to delete amenity"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Amenity not found"
            });
        }

        res.json({
            message: "Amenity deleted successfully"
        });
    });
});


module.exports = router;