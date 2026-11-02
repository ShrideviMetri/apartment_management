
const express = require("express");
const router = express.Router();
const db = require("../db");
const jwt = require("jsonwebtoken");

// Resident authentication
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

// GET logged-in resident's bookings
router.get("/my", verifyResident, (req, res) => {

    const sql = `
        SELECT ab.*, a.name AS amenity_name
        FROM amenitybooking ab
        LEFT JOIN amenity a ON ab.amenity_id = a.amenity_id
        WHERE ab.resident_id = ?
        ORDER BY ab.booking_date DESC, ab.start_time DESC
    `;

    db.query(sql, [req.residentId], (err, results) => {

        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to fetch your bookings"
            });
        }

        res.json(results);
    });
});


// BOOK an amenity
router.post("/my", verifyResident, (req, res) => {

    const {
        amenity_id,
        booking_date,
        start_time,
        end_time
    } = req.body;

    if (!amenity_id || !booking_date || !start_time || !end_time) {
        return res.status(400).json({
            message: "All booking details are required"
        });
    }

    if (start_time >= end_time) {
        return res.status(400).json({
            message: "End time must be later than start time"
        });
    }

    const sql = `
        INSERT INTO amenitybooking
        (resident_id, amenity_id, booking_date, start_time, end_time, status)
        VALUES (?, ?, ?, ?, ?, 'Booked')
    `;

    const values = [
        req.residentId,
        amenity_id,
        booking_date,
        start_time,
        end_time
    ];

    db.query(sql, values, (err, result) => {

        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to book amenity"
            });
        }

        res.status(201).json({
            message: "Amenity booked successfully",
            booking_id: result.insertId
        });
    });
});


// EDIT own booking
router.put("/my/:id", verifyResident, (req, res) => {

    const bookingId = req.params.id;

    const {
        amenity_id,
        booking_date,
        start_time,
        end_time
    } = req.body;

    if (!amenity_id || !booking_date || !start_time || !end_time) {
        return res.status(400).json({
            message: "All booking details are required"
        });
    }

    if (start_time >= end_time) {
        return res.status(400).json({
            message: "End time must be later than start time"
        });
    }

    const sql = `
        UPDATE amenitybooking
        SET amenity_id = ?,
            booking_date = ?,
            start_time = ?,
            end_time = ?
        WHERE booking_id = ?
        AND resident_id = ?
    `;

    const values = [
        amenity_id,
        booking_date,
        start_time,
        end_time,
        bookingId,
        req.residentId
    ];

    db.query(sql, values, (err, result) => {

        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to update booking"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Booking not found"
            });
        }

        res.json({
            message: "Booking updated successfully"
        });
    });
});


// DELETE own booking
router.delete("/my/:id", verifyResident, (req, res) => {

    const bookingId = req.params.id;

    const sql = `
        DELETE FROM amenitybooking
        WHERE booking_id = ?
        AND resident_id = ?
    `;

    db.query(sql, [bookingId, req.residentId], (err, result) => {

        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to delete booking"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Booking not found"
            });
        }

        res.json({
            message: "Booking deleted successfully"
        });
    });
});


// ========================================
// MANAGER ROUTES (EXISTING CRUD)
// ========================================

// GET all bookings
router.get("/", (req, res) => {

    const sql = "SELECT * FROM amenitybooking";

    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to fetch bookings"
            });
        }

        res.json(results);
    });
});


// POST booking (Manager)
router.post("/", (req, res) => {

    const {
        resident_id,
        amenity_id,
        booking_date,
        start_time,
        end_time,
        status
    } = req.body;

    const sql = `
        INSERT INTO amenitybooking
        (resident_id, amenity_id, booking_date, start_time, end_time, status)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    const values = [
        resident_id,
        amenity_id,
        booking_date,
        start_time,
        end_time,
        status || "Booked"
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to add booking"
            });
        }

        res.status(201).json({
            message: "Amenity booking added successfully",
            booking_id: result.insertId
        });
    });
});


// GET booking by ID (Manager)
router.get("/:id", (req, res) => {

    const bookingId = req.params.id;

    const sql = `
        SELECT * FROM amenitybooking
        WHERE booking_id = ?
    `;

    db.query(sql, [bookingId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to fetch booking"
            });
        }

        if (results.length === 0) {
            return res.status(404).json({
                message: "Booking not found"
            });
        }

        res.json(results[0]);
    });
});


// UPDATE booking (Manager)
router.put("/:id", (req, res) => {

    const bookingId = req.params.id;

    const {
        resident_id,
        amenity_id,
        booking_date,
        start_time,
        end_time,
        status
    } = req.body;

    const sql = `
        UPDATE amenitybooking
        SET resident_id = ?,
            amenity_id = ?,
            booking_date = ?,
            start_time = ?,
            end_time = ?,
            status = ?
        WHERE booking_id = ?
    `;

    const values = [
        resident_id,
        amenity_id,
        booking_date,
        start_time,
        end_time,
        status,
        bookingId
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to update booking"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Booking not found"
            });
        }

        res.json({
            message: "Amenity booking updated successfully"
        });
    });
});


// DELETE booking (Manager)
router.delete("/:id", (req, res) => {

    const bookingId = req.params.id;

    const sql = `
        DELETE FROM amenitybooking
        WHERE booking_id = ?
    `;

    db.query(sql, [bookingId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to delete booking"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Booking not found"
            });
        }

        res.json({
            message: "Amenity booking deleted successfully"
        });
    });
});


module.exports = router;
