const db = require("../config/db");


exports.getAllOrders = (req, res) => {
  const sql = `
    SELECT 
      o.order_id,
      o.total_amount,
      o.payment_status,
      o.order_status,
      o.created_at,
      u.name AS customer_name,
      u.username AS customer_username
    FROM orders o
    JOIN users u ON o.user_id = u.user_id
    ORDER BY o.created_at DESC
  `;

  db.query(sql, (err, orders) => {
    if (err) {
      console.error("ORDER FETCH ERROR:", err);
      return res.send("Error loading orders");
    }

    res.render("admin/order", {
      orders,
      pageTitle: "Manage Orders"   
    });
  });
};


exports.updateOrderStatus = (req, res) => {
  const orderId = req.params.id;

  const sql = `
    UPDATE orders
    SET order_status = 'delivered'
    WHERE order_id = ? AND payment_status = 'paid'
  `;

  db.query(sql, [orderId], err => {
    if (err) {
      console.error("ORDER UPDATE ERROR:", err);
      return res.send("Error updating order");
    }

    res.redirect("/admin/order");
  });
};
