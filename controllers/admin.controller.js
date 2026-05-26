const db = require("../config/db");

exports.getDashboard = (req, res) => {

  const statsQuery = `
    SELECT
      (SELECT COUNT(*) FROM supplier_offers WHERE status='approved') AS approvedOffers,
      (SELECT COUNT(*) FROM users WHERE role='wholesaler') AS totalWholesalers,
      (SELECT COUNT(*) FROM users WHERE role='wholesaler' AND is_verified=0) AS pendingWholesalers,
      (SELECT COUNT(*) FROM categories) AS totalCategories,
      (SELECT COUNT(*) FROM products) AS totalProducts,
     (SELECT COUNT(*) FROM products WHERE status='expired') AS expiredProducts,
      (SELECT COUNT(*) FROM orders) AS totalOrders,
      (SELECT COUNT(*) FROM orders WHERE payment_status='paid') AS totalPayments,
      (SELECT COUNT(*) FROM coupons) AS totalCoupons,

      --  TODAY SALES
      (SELECT IFNULL(SUM(total_amount),0) 
       FROM orders 
       WHERE DATE(created_at)=CURDATE() 
       AND payment_status='paid') AS todaySales,

      --  WEEK SALES
      (SELECT IFNULL(SUM(total_amount),0)
       FROM orders
       WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
       AND payment_status='paid') AS weekSales,

      --  MONTH SALES
      (SELECT IFNULL(SUM(total_amount),0)
       FROM orders
       WHERE MONTH(created_at)=MONTH(CURDATE())
       AND YEAR(created_at)=YEAR(CURDATE())
       AND payment_status='paid') AS monthSales,

      --  YEAR SALES
      (SELECT IFNULL(SUM(total_amount),0)
       FROM orders
       WHERE YEAR(created_at)=YEAR(CURDATE())
       AND payment_status='paid') AS yearSales
  `;

 
  const graphQuery = `
    SELECT DATE(created_at) as day,
           SUM(total_amount) as total
    FROM orders
    WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
    AND payment_status='paid'
    GROUP BY DATE(created_at)
    ORDER BY day
  `;

  db.query(statsQuery, (err, statsResult) => {
    if (err) return res.send("Dashboard error");

    db.query(graphQuery, (err2, graphResult) => {
      if (err2) return res.send("Graph error");

      res.render("dashboards/admin", {
        ...statsResult[0],
        graphData: graphResult
      });
    });
  });
};
exports.getChartData = (req, res) => {

  const days = parseInt(req.query.days) || 7;

  const query = `
    SELECT 
      DATE(created_at) as day,
      SUM(total_amount) as revenue,
      SUM(total_amount) * 0.2 as profit,
      COUNT(*) as orders
    FROM orders
    WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
    AND payment_status='paid'
    GROUP BY DATE(created_at)
    ORDER BY day
  `;

  db.query(query, [days], (err, result) => {
    if (err) return res.json([]);
    res.json(result);
  });
};

exports.getNotifications = (req, res) => {
  const query = `
    SELECT * FROM notifications
    WHERE is_read = 0
    ORDER BY created_at DESC
  `;

  db.query(query, (err, result) => {
    if (err) return res.json([]);
    res.json(result);
  });
};


exports.markAsRead = (req, res) => {
  const id = req.params.id;

  db.query(
    "UPDATE notifications SET is_read = 1 WHERE id = ?",
    [id],
    () => res.json({ success: true })
  );
};
