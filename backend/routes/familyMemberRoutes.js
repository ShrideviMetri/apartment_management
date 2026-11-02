const express = require("express");
const router = express.Router();
const db = require("../db");
const jwt = require("jsonwebtoken");

// GET all family members (Manager)
router.get("/", (req, res) => {
    const sql = "SELECT * FROM familymember";

    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to fetch family members"
            });
        }

        res.json(results);
    });
});

// GET logged-in resident's family members
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
            SELECT family_member_id, resident_id,
                   relationship, age, phone
            FROM familymember
            WHERE resident_id = ?
        `;

        db.query(sql, [decoded.resident_id], (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    message: "Failed to fetch family members"
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

// POST a new family member (Manager)
router.post("/", (req, res) => {
    const { resident_id, relationship, age, phone } = req.body;

    const sql = `
        INSERT INTO familymember
        (resident_id, relationship, age, phone)
        VALUES (?, ?, ?, ?)
    `;

    db.query(sql, [resident_id, relationship, age, phone], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Failed to add family member"
            });
        }

        res.status(201).json({
            message: "Family member added successfully",
            family_member_id: result.insertId
        });
    });
});

// UPDATE Family Member (Manager)
router.put("/:id", (req, res) => {
    const { relationship, age, phone } = req.body;
    const familyMemberId = req.params.id;

    const sql = `
        UPDATE familymember
        SET relationship = ?, age = ?, phone = ?
        WHERE family_member_id = ?
    `;

    db.query(sql, [relationship, age, phone, familyMemberId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                message: "Error updating family member"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Family member not found"
            });
        }

        res.json({
            message: "Family member updated successfully"
        });
    });
});

// DELETE Family Member (Manager)
router.delete("/:id", (req, res) => {
    const familyMemberId = req.params.id;

    db.query(
        "DELETE FROM familymember WHERE family_member_id = ?",
        [familyMemberId],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    message: "Error deleting family member"
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Family member not found"
                });
            }

            res.json({
                message: "Family member deleted successfully"
            });
        }
    );
});

module.exports = router;
