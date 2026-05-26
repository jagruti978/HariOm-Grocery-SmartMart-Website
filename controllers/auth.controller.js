const bcrypt = require("bcrypt");
const db = require("../config/db");


exports.signup = async (req, res) => {
  try {
    const {
      name,
      username,
      password,
      role,
      age,
      state,
      gst_number
    } = req.body;

    if (!name || !username || !password || !role) {
      return res.status(400).json({ message: "All required fields missing" });
    }

    db.query(
      "SELECT user_id FROM users WHERE username = ?",
      [username],
      async (err, result) => {
        if (err) return res.status(500).json({ message: "DB error" });

        if (result.length > 0) {
          return res.status(400).json({ message: "Username already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const sql = `
          INSERT INTO users 
          (name, username, password, role, age, state, gst_number, business_docs, is_verified)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
          name.trim(),
          username.trim(),
          hashedPassword,
          role,
          role === "customer" ? age : null,
          role === "customer" ? state : null,
          role === "wholesaler" ? gst_number : null,
          role === "wholesaler" && req.file ? req.file.filename : null,
          role === "admin"
        ];

        db.query(sql, values, (err) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ message: "Database insert error" });
          }
            const newUserId = result.insertId;


  if (role === "wholesaler") {
    db.query(
      "INSERT INTO notifications (type, message) VALUES (?, ?)",
      ["wholesaler", `New wholesaler registration pending approval.`]
    );
  }
          res.status(201).json({
            message: "Signup successful",
            role
          });
        });
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


