const express = require("express");
const router = express.Router();
const db = require("../db");

// GET all maintenance bills
router.get("/", (req, res) => {
    const sql = "SELECT * FROM MaintenanceBill";

    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to fetch maintenance bills"
            });
        }

        res.json(results);
    });
});


// POST - Add maintenance bill
router.post("/", (req, res) => {
    const {
        apartment_id,
        bill_month,
        amount,
        due_date,
        status
    } = req.body;

    const sql = `
        INSERT INTO MaintenanceBill
        (apartment_id, bill_month, amount, due_date, status)
        VALUES (?, ?, ?, ?, ?)
    `;

    const values = [
        apartment_id,
        bill_month,
        amount,
        due_date,
        status || "Pending"
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to add maintenance bill"
            });
        }

        res.status(201).json({
            message: "Maintenance bill added successfully",
            bill_id: result.insertId
        });
    });
});


// GET maintenance bill by ID
router.get("/:id", (req, res) => {
    const billId = req.params.id;

    const sql = `
        SELECT * FROM MaintenanceBill
        WHERE bill_id = ?
    `;

    db.query(sql, [billId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to fetch maintenance bill"
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                message: "Maintenance bill not found"
            });
        }

        res.json(results[0]);
    });
});


// UPDATE maintenance bill
router.put("/:id", (req, res) => {
    const billId = req.params.id;

    const {
        apartment_id,
        bill_month,
        amount,
        due_date,
        status
    } = req.body;

    const sql = `
        UPDATE MaintenanceBill
        SET apartment_id = ?,
            bill_month = ?,
            amount = ?,
            due_date = ?,
            status = ?
        WHERE bill_id = ?
    `;

    const values = [
        apartment_id,
        bill_month,
        amount,
        due_date,
        status,
        billId
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to update maintenance bill"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Maintenance bill not found"
            });
        }

        res.json({
            message: "Maintenance bill updated successfully"
        });
    });
});


// DELETE maintenance bill
router.delete("/:id", (req, res) => {

    const billId = req.params.id;

    // First check whether this bill has payments
    const checkSql = `
        SELECT COUNT(*) AS paymentCount
        FROM Payment
        WHERE bill_id = ?
    `;

    db.query(checkSql, [billId], (err, results) => {

        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Error checking payments"
            });
        }

        if (results[0].paymentCount > 0) {
            return res.status(400).json({
                message: "Cannot delete this bill because a payment is linked to it."
            });
        }

        // Delete the bill if no payment exists
        const deleteSql = `
            DELETE FROM MaintenanceBill
            WHERE bill_id = ?
        `;

        db.query(deleteSql, [billId], (err, result) => {

            if (err) {
                console.error(err);
                return res.status(500).json({
                    message: "Error deleting maintenance bill"
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Maintenance bill not found"
                });
            }

            res.json({
                message: "Maintenance bill deleted successfully"
            });
        });
    });
});


module.exports = router;