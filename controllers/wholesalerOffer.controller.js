const db = require("../config/db");

exports.dashboard = (req, res) => {

  if (!req.session.user) return res.redirect("/login");

  const wholesalerId = req.session.user.id;

  db.query(
    "SELECT status, rejection_reason FROM users WHERE user_id=?",
    [wholesalerId],
    (err, result) => {

      if (err || result.length === 0)
        return res.send("Error loading dashboard");

      const { status, rejection_reason } = result[0];

      
      if (status === "rejected") {
        return res.render("dashboards/wholesaler", {
          offers: [],
          status: "rejected",
          reason: rejection_reason,
          success: null,
          error: null
        });
      }


      if (status === "pending") {
        return res.render("dashboards/wholesaler", {
          offers: [],
          status: "pending",
          reason: null,
          success: null,
          error: "Your verification is under review."
        });
      }

    
      db.query(
        "SELECT * FROM supplier_offers WHERE wholesaler_id=? ORDER BY offer_id DESC",
        [wholesalerId],
        (err2, offers) => {

          res.render("dashboards/wholesaler", {
            offers: offers || [],
            status: "approved",
            reason: null,
            success: req.session.success,
            error: req.session.error
          });

          req.session.success = null;
          req.session.error = null;
        }
      );
    }
  );
};

exports.addOffer = (req, res) => {

  const wholesalerId = req.session.user.id;

  db.query(
    "SELECT status FROM users WHERE user_id=?",
    [wholesalerId],
    (err, result) => {

      if (result[0].status !== "approved") {
        req.session.error = "You are not approved yet.";
        return res.redirect("/wholesaler/dashboard");
      }

      const { product_name, price, moq, stock_available } = req.body;
      const catalog = req.file ? req.file.filename : null;

      db.query(
        `INSERT INTO supplier_offers
        (wholesaler_id, product_name, price, moq, stock_available, catalog_file)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [wholesalerId, product_name, price, moq, stock_available, catalog],
        (err2, result2) => {

          if (err2) return res.send("Error adding offer");

          const newOfferId = result2.insertId;  

          db.query(
            `INSERT INTO notifications (type, message, related_id)
             VALUES (?, ?, ?)`,
            [
              "supply",
              `New supply offer submitted: ${product_name}`,
              newOfferId
            ],
            () => {
              res.redirect("/wholesaler/dashboard");
            }
          );
        }
      );
    }
  );
};

exports.resubmitVerification = (req, res) => {

  const wholesalerId = req.session.user.id;

  if (!req.file) {
    return res.send("Document upload required");
  }

  const document = req.file.filename;

  db.query(
    `UPDATE users 
     SET status='pending',
         rejection_reason=NULL,
         business_docs=?
     WHERE user_id=?`,
    [document, wholesalerId],
    () => res.redirect("/wholesaler/dashboard")
  );
};

exports.deleteOffer = (req, res) => {
  if (!req.session.user) return res.redirect("/login");

  const offerId = req.params.id;
  const wholesalerId = req.session.user.id;

  const sql = `
  DELETE FROM supplier_offers
  WHERE offer_id = ?
  AND wholesaler_id = ?
  AND status IN ('pending','rejected')
`;

  db.query(sql, [offerId, wholesalerId], (err, result) => {
    if (err) {
      console.error("DELETE OFFER ERROR:", err);
      return res.send("Error deleting offer");
    }

    if (result.affectedRows === 0) {
      req.session.error = "You can only delete pending offers.";
    } else {
      req.session.success = "Offer deleted successfully!";
    }

    res.redirect("/wholesaler/dashboard");
  });
};
exports.resubmitOffer = (req, res) => {
  if (!req.session.user) return res.redirect("/login");

  const offerId = req.params.id;
  const wholesalerId = req.session.user.id;

  const { product_name, price, moq, stock_available } = req.body;

  const sql = `
    UPDATE supplier_offers
    SET 
      product_name = ?,
      price = ?,
      moq = ?,
      stock_available = ?,
      status = 'pending'
    WHERE offer_id = ?
    AND wholesaler_id = ?
    AND status = 'rejected'
  `;

  db.query(
    sql,
    [product_name, price, moq, stock_available, offerId, wholesalerId],
    (err, result) => {
      if (err) {
        console.error("RESUBMIT ERROR:", err);
        return res.send("Error resubmitting offer");
      }

      if (result.affectedRows === 0) {
        req.session.error = "Only rejected offers can be resubmitted.";
      } else {
        req.session.success = "Offer updated and resubmitted!";
      }

      res.redirect("/wholesaler/dashboard");
    }
  );
};


exports.logout = (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error("LOGOUT ERROR:", err);
      return res.send("Error logging out");
    }
    res.clearCookie("hariom-session"); 
    res.redirect("/"); 
  });
};

