const express = require("express");
const router = express.Router();
const db = require("../db");

// GET all parking slots
router.get("/", (req, res) => {
    const sql = "SELECT * FROM ParkingSlot";

    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to fetch parking slots"
            });
        }

        res.json(results);
    });
});

// POST a new parking slot
router.post("/", (req, res) => {
    const {
        slot_number,
        type,
        status
    } = req.body;

    const sql = `
        INSERT INTO ParkingSlot
        (slot_number, type, status)
        VALUES (?, ?, ?)
    `;

    const values = [
        slot_number,
        type,
        status
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to add parking slot"
            });
        }

        res.status(201).json({
            message: "Parking slot added successfully",
            parking_slot_id: result.insertId
        });
    });
});

// UPDATE Parking Slot
router.put("/:id", (req, res) => {
    const { slot_number, type, status } = req.body;
    const parkingSlotId = req.params.id;

    const sql = `
        UPDATE ParkingSlot
        SET slot_number = ?, type = ?, status = ?
        WHERE parking_slot_id = ?
    `;

    db.query(
        sql,
        [slot_number, type, status, parkingSlotId],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    message: "Error updating parking slot"
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Parking slot not found"
                });
            }

            res.json({
                message: "Parking slot updated successfully"
            });
        }
    );
});

// DELETE Parking Slot
router.delete("/:id", (req, res) => {
    const parkingSlotId = req.params.id;

    const sql = `
        DELETE FROM ParkingSlot
        WHERE parking_slot_id = ?
    `;

    db.query(sql, [parkingSlotId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Error deleting parking slot"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Parking slot not found"
            });
        }

        res.json({
            message: "Parking slot deleted successfully"
        });
    });
});

module.exports = router;