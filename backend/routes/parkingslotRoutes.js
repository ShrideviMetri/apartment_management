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


// GET ALL parking slots for resident
router.get("/my", verifyResident, (req, res) => {

    const sql = `
        SELECT
            ps.parking_slot_id,
            ps.slot_number,
            ps.type,
            ps.status,
            CASE
                WHEN EXISTS (
                    SELECT 1
                    FROM vehicle v
                    WHERE v.parking_slot_id = ps.parking_slot_id
                    AND v.resident_id = ?
                )
                THEN 1
                ELSE 0
            END AS is_mine
        FROM parkingslot ps
        ORDER BY ps.slot_number
    `;

    db.query(sql, [req.residentId], (err, results) => {
        if (err) {
            console.error("Resident parking error:", err);
            return res.status(500).json({
                message: "Failed to fetch parking slots"
            });
        }

        res.json(results);
    });
});


// EDIT resident's parking assignment
// The resident selects another available parking slot.
router.put("/my/:id", verifyResident, (req, res) => {

    const currentSlotId = req.params.id;
    const newSlotId = req.body.new_parking_slot_id;

    if (!newSlotId || Number(newSlotId) === Number(currentSlotId)) {
        return res.status(400).json({
            message: "Select a different parking slot"
        });
    }

    // Check whether the current slot belongs to this resident
    const ownershipSql = `
        SELECT vehicle_id
        FROM vehicle
        WHERE parking_slot_id = ?
        AND resident_id = ?
    `;

    db.query(
        ownershipSql,
        [currentSlotId, req.residentId],
        (err, vehicles) => {

            if (err) {
                console.error(err);
                return res.status(500).json({
                    message: "Failed to verify parking assignment"
                });
            }

            if (vehicles.length === 0) {
                return res.status(403).json({
                    message: "You cannot edit this parking slot"
                });
            }

            // Check whether the new slot is available
            const availabilitySql = `
                SELECT parking_slot_id
                FROM parkingslot
                WHERE parking_slot_id = ?
                AND LOWER(status) = 'available'
            `;

            db.query(availabilitySql, [newSlotId], (err, slots) => {

                if (err) {
                    console.error(err);
                    return res.status(500).json({
                        message: "Failed to check slot availability"
                    });
                }

                if (slots.length === 0) {
                    return res.status(400).json({
                        message: "Selected parking slot is not available"
                    });
                }

                // Move this resident's vehicle assignment
                const updateVehicleSql = `
                    UPDATE vehicle
                    SET parking_slot_id = ?
                    WHERE parking_slot_id = ?
                    AND resident_id = ?
                `;

                db.query(
                    updateVehicleSql,
                    [newSlotId, currentSlotId, req.residentId],
                    (err, result) => {

                        if (err) {
                            console.error(err);
                            return res.status(500).json({
                                message: "Failed to update parking assignment"
                            });
                        }

                        if (result.affectedRows === 0) {
                            return res.status(404).json({
                                message: "Parking assignment not found"
                            });
                        }

                        // Mark new slot occupied
                        db.query(
                            `UPDATE parkingslot
                             SET status = 'Occupied'
                             WHERE parking_slot_id = ?`,
                            [newSlotId],
                            (err) => {

                                if (err) {
                                    console.error(err);
                                    return res.status(500).json({
                                        message: "Assignment updated, but slot status update failed"
                                    });
                                }

                                // Make old slot available only if nobody uses it
                                const oldSlotSql = `
                                    UPDATE parkingslot
                                    SET status = 'Available'
                                    WHERE parking_slot_id = ?
                                    AND NOT EXISTS (
                                        SELECT 1
                                        FROM vehicle
                                        WHERE vehicle.parking_slot_id = parkingslot.parking_slot_id
                                    )
                                `;

                                db.query(oldSlotSql, [currentSlotId], (err) => {

                                    if (err) {
                                        console.error(err);
                                        return res.status(500).json({
                                            message: "Assignment updated, but old slot status update failed"
                                        });
                                    }

                                    res.json({
                                        message: "Parking assignment updated successfully"
                                    });
                                });
                            }
                        );
                    }
                );
            });
        }
    );
});


// DELETE resident's parking assignment
router.delete("/my/:id", verifyResident, (req, res) => {

    const parkingSlotId = req.params.id;

    const ownershipSql = `
        SELECT vehicle_id
        FROM vehicle
        WHERE parking_slot_id = ?
        AND resident_id = ?
    `;

    db.query(
        ownershipSql,
        [parkingSlotId, req.residentId],
        (err, vehicles) => {

            if (err) {
                console.error(err);
                return res.status(500).json({
                    message: "Failed to verify parking assignment"
                });
            }

            if (vehicles.length === 0) {
                return res.status(403).json({
                    message: "You cannot delete this parking assignment"
                });
            }

            // Remove the resident's assignment, not the shared slot record
            const deleteAssignmentSql = `
                UPDATE vehicle
                SET parking_slot_id = NULL
                WHERE parking_slot_id = ?
                AND resident_id = ?
            `;

            db.query(
                deleteAssignmentSql,
                [parkingSlotId, req.residentId],
                (err, result) => {

                    if (err) {
                        console.error(err);
                        return res.status(500).json({
                            message: "Failed to remove parking assignment"
                        });
                    }

                    if (result.affectedRows === 0) {
                        return res.status(404).json({
                            message: "Parking assignment not found"
                        });
                    }

                    // Make slot available only if no vehicle uses it
                    const statusSql = `
                        UPDATE parkingslot
                        SET status = 'Available'
                        WHERE parking_slot_id = ?
                        AND NOT EXISTS (
                            SELECT 1
                            FROM vehicle
                            WHERE vehicle.parking_slot_id = parkingslot.parking_slot_id
                        )
                    `;

                    db.query(statusSql, [parkingSlotId], (err) => {

                        if (err) {
                            console.error(err);
                            return res.status(500).json({
                                message: "Assignment removed, but slot status update failed"
                            });
                        }

                        res.json({
                            message: "Parking assignment deleted successfully"
                        });
                    });
                }
            );
        }
    );
});


// ================= MANAGER CRUD =================

// GET all parking slots
router.get("/", (req, res) => {
    const sql = "SELECT * FROM parkingslot";

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
    const { slot_number, type, status } = req.body;

    const sql = `
        INSERT INTO parkingslot (slot_number, type, status)
        VALUES (?, ?, ?)
    `;

    db.query(sql, [slot_number, type, status], (err, result) => {
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


// UPDATE Parking Slot (Manager)
router.put("/:id", (req, res) => {
    const { slot_number, type, status } = req.body;
    const parkingSlotId = req.params.id;

    const sql = `
        UPDATE parkingslot
        SET slot_number = ?, type = ?, status = ?
        WHERE parking_slot_id = ?
    `;

    db.query(sql, [slot_number, type, status, parkingSlotId], (err, result) => {
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
    });
});


// DELETE Parking Slot (Manager)
router.delete("/:id", (req, res) => {
    const parkingSlotId = req.params.id;

    const sql = `
        DELETE FROM parkingslot
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