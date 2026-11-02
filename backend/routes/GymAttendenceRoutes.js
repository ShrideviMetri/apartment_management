const express = require("express");
const router = express.Router();
const db = require("../db");
const jwt = require("jsonwebtoken");

function verifyResident(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Access denied" });
    }

    try {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.role !== "resident") {
            return res.status(403).json({
                message: "Resident access only"
            });
        }

        req.residentId = decoded.resident_id;
        next();

    } catch (error) {
        return res.status(401).json({ message: "Invalid token" });
    }
}

// GET all attendance
router.get("/", (req, res) => {
    const sql = "SELECT * FROM gymattendance";

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


// GET logged-in resident's attendance history
router.get("/my", verifyResident, (req, res) => {

    const sql = `
        SELECT attendance_id, resident_id, membership_id,
               check_in, check_out
        FROM gymattendance
        WHERE resident_id = ?
        ORDER BY check_in DESC
    `;

    db.query(sql, [req.residentId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to fetch attendance history"
            });
        }

        res.json(results);
    });
});


// RESIDENT CHECK-IN
router.post("/my/check-in", verifyResident, (req, res) => {

    // Check whether resident already has an open session
    const openSessionSql = `
        SELECT attendance_id
        FROM gymattendance
        WHERE resident_id = ?
        AND check_out IS NULL
        LIMIT 1
    `;

    db.query(openSessionSql, [req.residentId], (err, sessions) => {

        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to check existing attendance"
            });
        }

        if (sessions.length > 0) {
            return res.status(400).json({
                message: "You are already checked in. Please check out first."
            });
        }

        // Find active and paid membership
        const membershipSql = `
            SELECT membership_id
            FROM gymmembership
            WHERE resident_id = ?
              AND status = 'Active'
              AND payment_status = 'Completed'
              AND start_date <= CURRENT_DATE
              AND end_date >= CURRENT_DATE
            ORDER BY membership_id DESC
            LIMIT 1
        `;

        db.query(membershipSql, [req.residentId], (err, memberships) => {

            if (err) {
                console.error(err);
                return res.status(500).json({
                    message: "Failed to verify gym membership"
                });
            }

            if (memberships.length === 0) {
                return res.status(400).json({
                    message: "You need an active paid gym membership to check in."
                });
            }

            const membershipId = memberships[0].membership_id;

            const insertSql = `
                INSERT INTO gymattendance
                (resident_id, membership_id, check_in, check_out)
                VALUES (?, ?, CURRENT_TIMESTAMP, NULL)
            `;

            db.query(
                insertSql,
                [req.residentId, membershipId],
                (err, result) => {

                    if (err) {
                        console.error(err);
                        return res.status(500).json({
                            message: "Check-in failed"
                        });
                    }

                    res.status(201).json({
                        message: "Gym check-in successful!",
                        attendance_id: result.insertId
                    });
                }
            );
        });
    });
});


// RESIDENT CHECK-OUT
router.put("/my/:id/check-out", verifyResident, (req, res) => {

    const sql = `
        UPDATE gymattendance
        SET check_out = CURRENT_TIMESTAMP
        WHERE attendance_id = ?
          AND resident_id = ?
          AND check_out IS NULL
    `;

    db.query(
        sql,
        [req.params.id, req.residentId],
        (err, result) => {

            if (err) {
                console.error(err);
                return res.status(500).json({
                    message: "Check-out failed"
                });
            }

            if (result.affectedRows === 0) {
                return res.status(400).json({
                    message: "Attendance record not found or already checked out"
                });
            }

            res.json({
                message: "Gym check-out successful!"
            });
        }
    );
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
        INSERT INTO gymattendance
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
        SELECT * FROM gymattendance
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
        UPDATE gymattendance
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
        DELETE FROM gymattendance
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