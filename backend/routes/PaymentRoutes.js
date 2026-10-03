const express = require("express");
const router = express.Router();
const db = require("../db");

// GET all payments
router.get("/", (req, res) => {
    const sql = "SELECT * FROM Payment";

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
        INSERT INTO Payment
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


// GET payment by ID
router.get("/:id", (req, res) => {
    const paymentId = req.params.id;

    const sql = "SELECT * FROM Payment WHERE payment_id = ?";

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
        UPDATE Payment
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

    const sql = "DELETE FROM Payment WHERE payment_id = ?";

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