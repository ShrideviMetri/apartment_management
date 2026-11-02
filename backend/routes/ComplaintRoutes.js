const express = require("express");
const router = express.Router();
const db = require("../db");
const jwt = require("jsonwebtoken");

// Resident authentication middleware
function verifyResident(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Authentication required"
        });
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
        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
}


// ========================================
// RESIDENT ROUTES
// ========================================

// GET only logged-in resident's complaints
router.get("/my", verifyResident, (req, res) => {

    const sql = `
        SELECT *
        FROM complaint
        WHERE resident_id = ?
        ORDER BY complaint_id DESC
    `;

    db.query(sql, [req.residentId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to fetch your complaints"
            });
        }

        res.json(results);
    });
});


// ADD complaint for logged-in resident
router.post("/my", verifyResident, (req, res) => {

    const { category, description, priority } = req.body;

    if (!category || !description) {
        return res.status(400).json({
            message: "Category and description are required"
        });
    }

    const sql = `
        INSERT INTO complaint
        (resident_id, assigned_staff_id, category, description, priority, status)
        VALUES (?, NULL, ?, ?, ?, 'Pending')
    `;

    const values = [
        req.residentId,
        category,
        description,
        priority || "Medium"
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to add complaint"
            });
        }

        res.status(201).json({
            message: "Complaint submitted successfully",
            complaint_id: result.insertId
        });
    });
});


// EDIT only own complaint
router.put("/my/:id", verifyResident, (req, res) => {

    const complaintId = req.params.id;
    const { category, description, priority } = req.body;

    if (!category || !description) {
        return res.status(400).json({
            message: "Category and description are required"
        });
    }

    const sql = `
        UPDATE complaint
        SET category = ?,
            description = ?,
            priority = ?
        WHERE complaint_id = ?
        AND resident_id = ?
    `;

    const values = [
        category,
        description,
        priority || "Medium",
        complaintId,
        req.residentId
    ];

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


// DELETE only own complaint
router.delete("/my/:id", verifyResident, (req, res) => {

    const complaintId = req.params.id;

    const sql = `
        DELETE FROM complaint
        WHERE complaint_id = ?
        AND resident_id = ?
    `;

    db.query(sql, [complaintId, req.residentId], (err, result) => {
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


// ========================================
// MANAGER ROUTES (EXISTING CRUD PRESERVED)
// ========================================

// GET all complaints
router.get("/", (req, res) => {

    const sql = "SELECT * FROM complaint";

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


// POST complaint (Manager)
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
        INSERT INTO complaint
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


// GET complaint by ID (Manager)
router.get("/:id", (req, res) => {

    const complaintId = req.params.id;

    const sql = "SELECT * FROM complaint WHERE complaint_id = ?";

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


// UPDATE complaint (Manager)
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
            UPDATE complaint
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
            UPDATE complaint
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


// DELETE complaint (Manager)
router.delete("/:id", (req, res) => {

    const complaintId = req.params.id;

    const sql = "DELETE FROM complaint WHERE complaint_id = ?";

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
