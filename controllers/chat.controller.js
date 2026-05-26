const db = require("../config/db");


exports.customerChatPage = (req, res) => {
  if (!req.session.user) return res.redirect("/login");

  const customerId = req.session.user.id;

 
  const queryAdmin = `SELECT receiver_id FROM chats WHERE sender_id=? AND receiver_id IS NOT NULL LIMIT 1`;

  db.query(queryAdmin, [customerId], (err, result) => {
    if (err) return res.send("Error fetching admin");

    const adminId = result.length ? result[0].receiver_id : null;

    const chatQuery = `
      SELECT * FROM chats
      WHERE sender_id=? OR receiver_id=?
      ORDER BY timestamp ASC
    `;

    db.query(chatQuery, [customerId, customerId], (err, chats) => {
      if (err) return res.send("Error fetching chats");

      res.render("customer/chat", { chats, adminId, session: req.session });
    });
  });
};


exports.sendMessage = (req, res) => {
  if (!req.session.user) return res.redirect("/login");

  const senderId = req.session.user.id;
  let { receiver_id, message } = req.body;

  const query = `
    INSERT INTO chats (sender_id, receiver_id, message)
    VALUES (?, ?, ?)
  `;
  db.query(query, [senderId, receiver_id || null, message], (err) => {
    if (err) return res.send("Message not sent");

      if (req.session.user.role === "customer") {
      db.query(
        "INSERT INTO notifications (type, message, related_id) VALUES (?, ?, ?)",
        ["chat", "New customer message received", senderId]
      );
    }

    if (req.session.user.role === "admin") {
      res.redirect(`/admin/chat/${receiver_id}`);
    } else {
      res.redirect("/customer/chat");
    }
  });
};


exports.adminChatList = (req, res) => {
  if (!req.session.user || req.session.user.role !== "admin")
    return res.redirect("/login");

  
  const query = `
    SELECT DISTINCT u.user_id, u.name
    FROM users u
    JOIN chats c ON u.user_id = c.sender_id
    WHERE u.role='customer'
  `;

  db.query(query, (err, customers) => {
    if (err) return res.send("Error loading chats");
    res.render("admin/chat-list", { customers });
  });
};

exports.adminChatPage = (req, res) => {
  if (!req.session.user || req.session.user.role !== "admin")
    return res.redirect("/login");

  const adminId = req.session.user.id;
  const customerId = req.params.customerId;

  
  const assignQuery = `
    UPDATE chats
    SET receiver_id=?
    WHERE sender_id=? AND receiver_id IS NULL
  `;
  db.query(assignQuery, [adminId, customerId], (err) => {
    if (err) return res.send("Error assigning admin");

    const chatQuery = `
      SELECT * FROM chats
      WHERE (sender_id=? AND receiver_id=?)
         OR (sender_id=? AND receiver_id=?)
      ORDER BY timestamp ASC
    `;
    db.query(chatQuery, [adminId, customerId, customerId, adminId], (err, chats) => {
      if (err) return res.send("Error fetching chats");

      res.render("admin/chat", { chats, customerId, session: req.session });
    });
  });
};
