const express = require("express");
const router = express.Router();
const db = require("../db");

// GET all family members
router.get("/", (req, res) => {
    const sql = "SELECT * FROM FamilyMember";

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

// POST a new family member
router.post("/", (req, res) => {
    const {
        resident_id,
        relationship,
        age,
        phone
    } = req.body;

    const sql = `
        INSERT INTO FamilyMember
        (resident_id, relationship, age, phone)
        VALUES (?, ?, ?, ?)
    `;

    const values = [
        resident_id,
        relationship,
        age,
        phone
    ];

    db.query(sql, values, (err, result) => {
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

// UPDATE Family Member
router.put("/:id", (req, res) => {
    const { relationship, age, phone } = req.body;
    const familyMemberId = req.params.id;

    const sql = `
        UPDATE FamilyMember
        SET relationship = ?, age = ?, phone = ?
        WHERE family_member_id = ?
    `;

    db.query(
        sql,
        [relationship, age, phone, familyMemberId],
        (err, result) => {
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
        }
    );
});


// DELETE Family Member
router.delete("/:id", (req, res) => {
    const familyMemberId = req.params.id;

    const sql = `
        DELETE FROM FamilyMember
        WHERE family_member_id = ?
    `;

    db.query(sql, [familyMemberId], (err, result) => {
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
    });
});

module.exports = router;