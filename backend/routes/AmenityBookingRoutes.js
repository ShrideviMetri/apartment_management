const express = require("express");
const router = express.Router();
const db = require("../db");

// GET all bookings
router.get("/", (req, res) => {
    const sql = "SELECT * FROM AmenityBooking";

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


// POST booking
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
        INSERT INTO AmenityBooking
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


// GET booking by ID
router.get("/:id", (req, res) => {
    const bookingId = req.params.id;

    const sql = `
        SELECT * FROM AmenityBooking
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


// UPDATE booking
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
        UPDATE AmenityBooking
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


// DELETE booking
router.delete("/:id", (req, res) => {
    const bookingId = req.params.id;

    const sql = `
        DELETE FROM AmenityBooking
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