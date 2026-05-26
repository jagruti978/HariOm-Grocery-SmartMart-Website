const bcrypt = require("bcrypt");
const db = require("../config/db");

exports.login = (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password required" });
  }

  const sql =
    "SELECT user_id, name, username, password, role FROM users WHERE username = ?";

  db.query(sql, [username], async (err, results) => {
    if (err) {
      console.error("DB error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid username or password" });
    }


    req.session.user = {
      id: user.user_id,
      name: user.name,
      role: user.role
    };


    return res.status(200).json({
      message: "Login successful",
      role: user.role
    });
  });
};
