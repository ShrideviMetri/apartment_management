const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;

// ================= REGISTER OWNER =================

router.post("/register", async (req, res) => {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
        return res.status(400).json({
            message: "All fields are required"
        });
    }

    try {
        const checkSql = `
            SELECT * FROM ApartmentOwner
            WHERE email = ? OR phone = ?
        `;

        db.query(checkSql, [email, phone], async (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({
                    message: "Database error"
                });
            }

            if (results.length > 0) {
                return res.status(400).json({
                    message: "Email or phone number already registered"
                });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const sql = `
                INSERT INTO ApartmentOwner
                (name, email, phone, password)
                VALUES (?, ?, ?, ?)
            `;

            db.query(
                sql,
                [name, email, phone, hashedPassword],
                (err, result) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({
                            message: "Failed to register owner"
                        });
                    }

                    res.status(201).json({
                        message: "Owner registered successfully",
                        owner_id: result.insertId
                    });
                }
            );
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Something went wrong"
        });
    }
});


// ================= LOGIN OWNER =================

router.post("/login", (req, res) => {
    const { login, password } = req.body;

    if (!login || !password) {
        return res.status(400).json({
            message: "Email/Phone and password are required"
        });
    }

    const sql = `
        SELECT * FROM ApartmentOwner
        WHERE email = ? OR phone = ?
    `;

    db.query(sql, [login, login], async (err, results) => {

        if (err) {
            console.error(err);

            return res.status(500).json({
                message: "Database error"
            });
        }

        if (results.length === 0) {
            return res.status(401).json({
                message: "Invalid email/phone or password"
            });
        }

        const owner = results[0];

        const passwordMatch = await bcrypt.compare(
            password,
            owner.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email/phone or password"
            });
        }

        const token = jwt.sign(
            {
                owner_id: owner.owner_id,
                email: owner.email
            },
            JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        res.json({
            message: "Login successful",
            token: token,
            owner: {
                owner_id: owner.owner_id,
                name: owner.name,
                email: owner.email,
                phone: owner.phone
            }
        });
    });
});

module.exports = router;