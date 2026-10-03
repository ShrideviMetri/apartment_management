const express = require("express");
const router = express.Router();
const db = require("../db");

// GET all attendance
router.get("/", (req, res) => {
    const sql = "SELECT * FROM GymAttendance";

    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to fetch gym attendance"
            });
        }

        res.json(results);
    });
});


// POST attendance
router.post("/", (req, res) => {
    const {
        resident_id,
        membership_id,
        check_in,
        check_out
    } = req.body;

    const sql = `
        INSERT INTO GymAttendance
        (resident_id, membership_id, check_in, check_out)
        VALUES (?, ?, ?, ?)
    `;

    const values = [
        resident_id,
        membership_id,
        check_in,
        check_out
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to add gym attendance"
            });
        }

        res.status(201).json({
            message: "Gym attendance added successfully",
            attendance_id: result.insertId
        });
    });
});


// GET attendance by ID
router.get("/:id", (req, res) => {
    const attendanceId = req.params.id;

    const sql = `
        SELECT * FROM GymAttendance
        WHERE attendance_id = ?
    `;

    db.query(sql, [attendanceId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to fetch gym attendance"
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                message: "Gym attendance not found"
            });
        }

        res.json(results[0]);
    });
});


// UPDATE attendance
router.put("/:id", (req, res) => {
    const attendanceId = req.params.id;

    const {
        resident_id,
        membership_id,
        check_in,
        check_out
    } = req.body;

    const sql = `
        UPDATE GymAttendance
        SET resident_id = ?,
            membership_id = ?,
            check_in = ?,
            check_out = ?
        WHERE attendance_id = ?
    `;

    const values = [
        resident_id,
        membership_id,
        check_in,
        check_out,
        attendanceId
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to update gym attendance"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Gym attendance not found"
            });
        }

        res.json({
            message: "Gym attendance updated successfully"
        });
    });
});


// DELETE attendance
router.delete("/:id", (req, res) => {
    const attendanceId = req.params.id;

    const sql = `
        DELETE FROM GymAttendance
        WHERE attendance_id = ?
    `;

    db.query(sql, [attendanceId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to delete gym attendance"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Gym attendance not found"
            });
        }

        res.json({
            message: "Gym attendance deleted successfully"
        });
    });
});


module.exports = router;