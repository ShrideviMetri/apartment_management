const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// REGISTER MANAGER
router.post("/register-manager", async (req, res) => {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const sql = `INSERT INTO apartmentowner
        (name, email, phone, password) VALUES (?, ?, ?, ?)`;

        db.query(sql, [name, email, phone, hashedPassword], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(400).json({
                    message: "Registration failed. Email or phone may already exist."
                });
            }

            res.status(201).json({
                message: "Manager registered successfully"
            });
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Registration failed" });
    }
});

// REGISTER RESIDENT
router.post("/register-resident", async (req, res) => {
    const { name, email, phone, apartment_number, password } = req.body;

    if (!name || !email || !phone || !apartment_number || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        const sql = `
            SELECT r.resident_id
            FROM resident r
            JOIN apartment a ON r.apartment_id = a.apartment_id
            WHERE LOWER(TRIM(r.name)) = LOWER(TRIM(?))
              AND LOWER(TRIM(r.email)) = LOWER(TRIM(?))
              AND r.phone = ?
              AND a.apartment_number = ?
        `;

        db.query(sql, [name, email, phone, apartment_number], async (err, rows) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: "Database error" });
            }

            if (rows.length === 0) {
                return res.status(400).json({
                    message: "Resident details do not match our apartment records."
                });
            }

            const residentId = rows[0].resident_id;

            const hashedPassword = await bcrypt.hash(password, 10);

            db.query(
                `INSERT INTO residentaccount (resident_id, password)
                 VALUES (?, ?)`,
                [residentId, hashedPassword],
                (err) => {
                    if (err) {
                        console.error(err);
                        return res.status(400).json({
                            message: "Account already registered or registration failed."
                        });
                    }

                    res.status(201).json({
                        message: "Resident registered successfully. Please login."
                    });
                }
            );
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Registration failed" });
    }
});

// MANAGER LOGIN
router.post("/login-manager", (req, res) => {
    const { login, password } = req.body;

    if (!login || !password) {
        return res.status(400).json({ message: "Enter login and password" });
    }

    db.query(
        `SELECT * FROM apartmentowner WHERE email = ? OR phone = ?`,
        [login, login],
        async (err, rows) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: "Database error" });
            }

            if (!rows.length) {
                return res.status(401).json({ message: "Invalid credentials" });
            }

            const manager = rows[0];

            if (!await bcrypt.compare(password, manager.password)) {
                return res.status(401).json({ message: "Invalid credentials" });
            }

            const token = jwt.sign({
                role: "manager",
                owner_id: manager.owner_id,
                email: manager.email
            }, JWT_SECRET, { expiresIn: "1d" });

            res.json({
                message: "Manager login successful",
                token,
                user: {
                    role: "manager",
                    owner_id: manager.owner_id,
                    name: manager.name,
                    email: manager.email
                }
            });
        }
    );
});

// RESIDENT LOGIN
router.post("/login-resident", (req, res) => {
    const { email, apartment_number, password } = req.body;

    if (!email || !apartment_number || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    const sql = `
        SELECT ra.user_id, ra.password, r.resident_id,
               r.name, r.email, a.apartment_number
        FROM residentaccount ra
        JOIN resident r ON ra.resident_id = r.resident_id
        JOIN apartment a ON r.apartment_id = a.apartment_id
        WHERE r.email = ? AND a.apartment_number = ?
    `;

    db.query(sql, [email, apartment_number], async (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Database error" });
        }

        if (!rows.length ||
            !await bcrypt.compare(password, rows[0].password)) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const resident = rows[0];

        const token = jwt.sign({
            role: "resident",
            resident_id: resident.resident_id,
            email: resident.email
        }, JWT_SECRET, { expiresIn: "1d" });

        res.json({
            message: "Resident login successful",
            token,
            user: {
                role: "resident",
                resident_id: resident.resident_id,
                name: resident.name,
                email: resident.email,
                apartment_number: resident.apartment_number
            }
        });
    });
});

module.exports = router;
