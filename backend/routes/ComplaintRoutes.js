const express = require("express");
const router = express.Router();
const db = require("../db");

// GET all complaints
router.get("/", (req, res) => {
    const sql = "SELECT * FROM Complaint";

    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to fetch complaints"
            });
        }

        res.json(results);
    });
});


// POST complaint
router.post("/", (req, res) => {
    const {
        resident_id,
        assigned_staff_id,
        category,
        description,
        priority,
        status
    } = req.body;

    const sql = `
        INSERT INTO Complaint
        (resident_id, assigned_staff_id, category, description, priority, status)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    const values = [
        resident_id,
        assigned_staff_id,
        category,
        description,
        priority || "Medium",
        status || "Pending"
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to add complaint"
            });
        }

        res.status(201).json({
            message: "Complaint added successfully",
            complaint_id: result.insertId
        });
    });
});


// GET complaint by ID
router.get("/:id", (req, res) => {
    const complaintId = req.params.id;

    const sql = "SELECT * FROM Complaint WHERE complaint_id = ?";

    db.query(sql, [complaintId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to fetch complaint"
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                message: "Complaint not found"
            });
        }

        res.json(results[0]);
    });
});


// UPDATE complaint
router.put("/:id", (req, res) => {
    const complaintId = req.params.id;

    const {
        resident_id,
        assigned_staff_id,
        category,
        description,
        priority,
        status
    } = req.body;

    let sql;
    let values;

    if (status === "Solved") {
        sql = `
            UPDATE Complaint
            SET resident_id = ?,
                assigned_staff_id = ?,
                category = ?,
                description = ?,
                priority = ?,
                status = ?,
                resolved_at = CURRENT_TIMESTAMP
            WHERE complaint_id = ?
        `;

        values = [
            resident_id,
            assigned_staff_id,
            category,
            description,
            priority,
            status,
            complaintId
        ];
    } else {
        sql = `
            UPDATE Complaint
            SET resident_id = ?,
                assigned_staff_id = ?,
                category = ?,
                description = ?,
                priority = ?,
                status = ?,
                resolved_at = NULL
            WHERE complaint_id = ?
        `;

        values = [
            resident_id,
            assigned_staff_id,
            category,
            description,
            priority,
            status,
            complaintId
        ];
    }

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to update complaint"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Complaint not found"
            });
        }

        res.json({
            message: "Complaint updated successfully"
        });
    });
});
            

        

// DELETE complaint
router.delete("/:id", (req, res) => {
    const complaintId = req.params.id;

    const sql = "DELETE FROM Complaint WHERE complaint_id = ?";

    db.query(sql, [complaintId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to delete complaint"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Complaint not found"
            });
        }

        res.json({
            message: "Complaint deleted successfully"
        });
    });
});


module.exports = router;