const express = require("express");
const router = express.Router();
const db = require("../db");
const jwt = require("jsonwebtoken");

const GYM_FEES = {
    "3 Months": 2000,
    "6 Months": 3000
};

function verifyResident(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Access denied" });
    }

    try {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.role !== "resident") {
            return res.status(403).json({ message: "Resident access only" });
        }

        req.residentId = decoded.resident_id;
        next();

    } catch (error) {
        return res.status(401).json({ message: "Invalid token" });
    }
}

// GET all gym memberships
router.get("/", (req, res) => {
    const sql = "SELECT * FROM gymmembership";

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

// GET logged-in resident's gym memberships
router.get("/my", verifyResident, (req, res) => {

    const sql = `
        SELECT *
        FROM gymmembership
        WHERE resident_id = ?
        ORDER BY membership_id DESC
    `;

    db.query(sql, [req.residentId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to fetch your gym memberships"
            });
        }

        res.json(results);
    });
});


// Resident registration for gym training
// Resident registration for gym training
router.post("/my", verifyResident, (req, res) => {

    const { plan_name } = req.body;

    if (!["3 Months", "6 Months"].includes(plan_name)) {
        return res.status(400).json({
            message: "Please select a valid gym training plan"
        });
    }

    const fee = GYM_FEES[plan_name];

    const checkSql = `
        SELECT membership_id
        FROM gymmembership
        WHERE resident_id = ?
        AND status IN ('Pending', 'Active')
    `;

    db.query(checkSql, [req.residentId], (err, results) => {

        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to check existing membership"
            });
        }

        if (results.length > 0) {
            return res.status(400).json({
                message: "You already have a pending or active membership"
            });
        }

        const sql = `
            INSERT INTO gymmembership
            (resident_id, plan_name, start_date, end_date,
             fee, status, payment_status)
            VALUES (?, ?, NULL, NULL, ?, 'Pending', 'Pending')
        `;

        db.query(sql, [req.residentId, plan_name, fee], (err, result) => {

            if (err) {
                console.error(err);
                return res.status(500).json({
                    message: "Gym registration failed"
                });
            }

            res.status(201).json({
                message: "Gym registration created. Proceed to payment.",
                membership_id: result.insertId
            });
        });
    });
});

// Simulated gym membership payment
router.post("/my/:id/pay", verifyResident, (req, res) => {

    const sql = `
        UPDATE gymmembership
        SET payment_status = 'Paid',
            status = 'Active',
            start_date = CURRENT_DATE,
            end_date = CASE
                WHEN plan_name = '3 Months'
                    THEN DATE_ADD(CURRENT_DATE, INTERVAL 3 MONTH)
                WHEN plan_name = '6 Months'
                    THEN DATE_ADD(CURRENT_DATE, INTERVAL 6 MONTH)
            END
        WHERE membership_id = ?
        AND resident_id = ?
        AND payment_status = 'Pending'
        AND status = 'Pending'
    `;

    db.query(sql, [req.params.id, req.residentId], (err, result) => {

        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Payment failed"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(400).json({
                message: "Membership not found or already paid"
            });
        }

        res.json({
            message: "Payment successful! Your gym membership is now active."
        });
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
        INSERT INTO gymmembership
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
        SELECT * FROM gymmembership
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
        UPDATE gymmembership
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
        DELETE FROM gymmembership
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