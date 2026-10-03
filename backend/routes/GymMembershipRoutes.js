const express = require("express");
const router = express.Router();
const db = require("../db");

// GET all gym memberships
router.get("/", (req, res) => {
    const sql = "SELECT * FROM GymMembership";

    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to fetch gym memberships"
            });
        }

        res.json(results);
    });
});


// POST gym membership
router.post("/", (req, res) => {
    const {
        resident_id,
        plan_name,
        start_date,
        end_date,
        fee,
        status
    } = req.body;

    const sql = `
        INSERT INTO GymMembership
        (resident_id, plan_name, start_date, end_date, fee, status)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    const values = [
        resident_id,
        plan_name,
        start_date,
        end_date,
        fee,
        status || "Active"
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to add gym membership"
            });
        }

        res.status(201).json({
            message: "Gym membership added successfully",
            membership_id: result.insertId
        });
    });
});


// GET gym membership by ID
router.get("/:id", (req, res) => {
    const membershipId = req.params.id;

    const sql = `
        SELECT * FROM GymMembership
        WHERE membership_id = ?
    `;

    db.query(sql, [membershipId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to fetch gym membership"
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                message: "Gym membership not found"
            });
        }

        res.json(results[0]);
    });
});


// UPDATE gym membership
router.put("/:id", (req, res) => {
    const membershipId = req.params.id;

    const {
        resident_id,
        plan_name,
        start_date,
        end_date,
        fee,
        status
    } = req.body;

    const sql = `
        UPDATE GymMembership
        SET resident_id = ?,
            plan_name = ?,
            start_date = ?,
            end_date = ?,
            fee = ?,
            status = ?
        WHERE membership_id = ?
    `;

    const values = [
        resident_id,
        plan_name,
        start_date,
        end_date,
        fee,
        status,
        membershipId
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to update gym membership"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Gym membership not found"
            });
        }

        res.json({
            message: "Gym membership updated successfully"
        });
    });
});


// DELETE gym membership
router.delete("/:id", (req, res) => {
    const membershipId = req.params.id;

    const sql = `
        DELETE FROM GymMembership
        WHERE membership_id = ?
    `;

    db.query(sql, [membershipId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to delete gym membership"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Gym membership not found"
            });
        }

        res.json({
            message: "Gym membership deleted successfully"
        });
    });
});


module.exports = router;