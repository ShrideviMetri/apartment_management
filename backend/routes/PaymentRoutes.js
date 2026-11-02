const express = require("express");
const router = express.Router();
const db = require("../db");
const jwt = require("jsonwebtoken");

// GET all payments
router.get("/", (req, res) => {
    const sql = "SELECT * FROM payment";

    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to fetch payments"
            });
        }

        res.json(results);
    });
});


// POST payment
router.post("/", (req, res) => {
    const {
        bill_id,
        payment_date,
        amount,
        payment_mode,
        reference_number
    } = req.body;

    const sql = `
        INSERT INTO payment
        (bill_id, payment_date, amount, payment_mode, reference_number)
        VALUES (?, ?, ?, ?, ?)
    `;

    const values = [
        bill_id,
        payment_date,
        amount,
        payment_mode,
        reference_number
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to add payment"
            });
        }

        res.status(201).json({
            message: "Payment added successfully",
            payment_id: result.insertId
        });
    });
});


// GET logged-in resident's payments
router.get("/my", (req, res) => {
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
                message: "Access denied"
            });
        }

        const sql = `
            SELECT
                p.payment_id,
                p.bill_id,
                p.payment_date,
                p.amount,
                p.payment_mode,
                p.reference_number,
                mb.bill_month
            FROM payment p
            JOIN maintenancebill mb
                ON p.bill_id = mb.bill_id
            JOIN resident r
                ON mb.apartment_id = r.apartment_id
            WHERE r.resident_id = ?
            ORDER BY p.payment_date DESC
        `;

        db.query(sql, [decoded.resident_id], (err, results) => {
            if (err) {
                console.error("Resident payments error:", err);
                return res.status(500).json({
                    message: "Failed to fetch payments"
                });
            }

            res.json(results);
        });

    } catch (err) {
        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
});

// GET payment by ID
router.get("/:id", (req, res) => {
    const paymentId = req.params.id;

    const sql = "SELECT * FROM payment WHERE payment_id = ?";

    db.query(sql, [paymentId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to fetch payment"
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                message: "Payment not found"
            });
        }

        res.json(results[0]);
    });
});


// UPDATE payment
router.put("/:id", (req, res) => {
    const paymentId = req.params.id;

    const {
        bill_id,
        payment_date,
        amount,
        payment_mode,
        reference_number
    } = req.body;

    const sql = `
        UPDATE payment
        SET bill_id = ?,
            payment_date = ?,
            amount = ?,
            payment_mode = ?,
            reference_number = ?
        WHERE payment_id = ?
    `;

    const values = [
        bill_id,
        payment_date,
        amount,
        payment_mode,
        reference_number,
        paymentId
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to update payment"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Payment not found"
            });
        }

        res.json({
            message: "Payment updated successfully"
        });
    });
});


// DELETE payment
router.delete("/:id", (req, res) => {
    const paymentId = req.params.id;

    const sql = "DELETE FROM payment WHERE payment_id = ?";

    db.query(sql, [paymentId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to delete payment"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Payment not found"
            });
        }

        res.json({
            message: "Payment deleted successfully"
        });
    });
});


module.exports = router;