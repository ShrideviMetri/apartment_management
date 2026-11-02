const express = require("express");
const router = express.Router();
const db = require("../db");
const jwt = require("jsonwebtoken");

// Verify resident token
function verifyResident(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Authentication token required"
        });
    }

    try {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.role !== "resident") {
            return res.status(403).json({
                message: "Access denied"
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

// GET all deliveries
router.get("/", (req, res) => {
    const sql = "SELECT * FROM delivery";

    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to fetch deliveries"
            });
        }

        res.json(results);
    });
});

router.get("/my", verifyResident, (req, res) => {
    const sql = `
        SELECT *
        FROM delivery
        WHERE resident_id = ?
        ORDER BY arrival_time DESC
    `;

    db.query(sql, [req.residentId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to fetch your deliveries"
            });
        }

        res.json(results);
    });
});


// POST delivery
router.post("/", (req, res) => {
    const {
        resident_id,
        delivery_person,
        delivery_company,
        package_details,
        vehicle_number,
        arrival_time,
        collected_time,
        status
    } = req.body;

    const sql = `
        INSERT INTO delivery
        (resident_id, delivery_person, delivery_company, package_details,
         vehicle_number, arrival_time, collected_time, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        resident_id,
        delivery_person,
        delivery_company,
        package_details,
        vehicle_number,
        arrival_time,
        collected_time,
        status || "Pending"
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to add delivery"
            });
        }

        res.status(201).json({
            message: "Delivery added successfully",
            delivery_id: result.insertId
        });
    });
});


// Get logged-in resident's deliveries
router.get("/my", verifyResident, (req, res) => {
    const sql = `
        SELECT * FROM delivery
        WHERE resident_id = ?
        ORDER BY arrival_time DESC
    `;

    db.query(sql, [req.residentId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Failed to fetch deliveries" });
        }

        res.json(results);
    });
});


// Update delivery status
router.put("/my/:id/status", verifyResident, (req, res) => {
    const { status } = req.body;

    if (!["Pending", "Received"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
    }

    const sql = `
        UPDATE delivery
        SET status = ?,
            collected_time = ?
        WHERE delivery_id = ? AND resident_id = ?
    `;

    const collectedTime = status === "Received"
        ? new Date()
        : null;

    db.query(
        sql,
        [status, collectedTime, req.params.id, req.residentId],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: "Failed to update status" });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Delivery not found" });
            }

            res.json({ message: "Status updated successfully" });
        }
    );
});

// GET delivery by ID
router.get("/:id", (req, res) => {
    const deliveryId = req.params.id;

    const sql = "SELECT * FROM delivery WHERE delivery_id = ?";

    db.query(sql, [deliveryId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to fetch delivery"
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                message: "Delivery not found"
            });
        }

        res.json(results[0]);
    });
});


// UPDATE delivery
router.put("/:id", (req, res) => {
    const deliveryId = req.params.id;

    const {
        resident_id,
        delivery_person,
        delivery_company,
        package_details,
        vehicle_number,
        arrival_time,
        collected_time,
        status
    } = req.body;

    const sql = `
        UPDATE delivery
        SET resident_id = ?,
            delivery_person = ?,
            delivery_company = ?,
            package_details = ?,
            vehicle_number = ?,
            arrival_time = ?,
            collected_time = ?,
            status = ?
        WHERE delivery_id = ?
    `;

    const values = [
        resident_id,
        delivery_person,
        delivery_company,
        package_details,
        vehicle_number,
        arrival_time,
        collected_time,
        status,
        deliveryId
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to update delivery"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Delivery not found"
            });
        }

        res.json({
            message: "Delivery updated successfully"
        });
    });
});


// DELETE delivery
router.delete("/:id", (req, res) => {
    const deliveryId = req.params.id;

    const sql = "DELETE FROM delivery WHERE delivery_id = ?";

    db.query(sql, [deliveryId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to delete delivery"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Delivery not found"
            });
        }

        res.json({
            message: "Delivery deleted successfully"
        });
    });
});


module.exports = router;