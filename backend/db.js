require("dotenv").config();

const mysql = require("mysql2");
const fs = require("fs");
const path = require("path");

const db = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    ssl: {
        ca: fs.readFileSync(
            path.join(__dirname, "ca.pem"),
            "utf8"
        ),
        rejectUnauthorized: true
    },

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

db.getConnection((err, connection) => {
    if (err) {
        console.error("Aiven MySQL connection failed:", err);
        return;
    }

    console.log("Aiven MySQL connected successfully!");
    connection.release();
});

module.exports = db;