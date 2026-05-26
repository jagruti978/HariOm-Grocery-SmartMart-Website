const db = require("../config/db");

exports.getSupplyOffers = (req, res) => {

  const wholesalersQuery = `
    SELECT user_id, name, username, gst_number, business_docs, status, rejection_reason, created_at
    FROM users
    WHERE role='wholesaler'
    AND status != 'rejected'
    ORDER BY created_at DESC
  `;

  const offersQuery = `
    SELECT 
      so.offer_id,
      so.product_name,
      so.price,
      so.moq,
      so.stock_available,
      so.catalog_file,
      so.status,
      u.name
    FROM supplier_offers so
    JOIN users u ON u.user_id = so.wholesaler_id
    WHERE u.status = 'approved'
    ORDER BY so.offer_id DESC
  `;

  const categoryQuery = "SELECT category_id, category_name FROM categories";

  db.query(wholesalersQuery, (err, wholesalers) => {
    if (err) return res.send("Error loading wholesalers");

    db.query(offersQuery, (err2, offers) => {
      if (err2) return res.send("Error loading supply offers");

      db.query(categoryQuery, (err3, categories) => {
        if (err3) return res.send("Error loading categories");

        res.render("admin/wholesalers", {
          wholesalers,
          offers,
          categories
        });
      });
    });
  });
};


exports.approveWholesaler = (req, res) => {
  db.query(
    "UPDATE users SET status='approved', rejection_reason=NULL WHERE user_id=?",
    [req.params.id],
    () => res.redirect("/admin/wholesalers")
  );
};

exports.rejectWholesaler = (req, res) => {

  const reason = req.body.reason || "Documents not valid";

  db.query(
    "UPDATE users SET status='rejected', rejection_reason=? WHERE user_id=?",
    [reason, req.params.id],
    () => res.redirect("/admin/wholesalers")
  );
};

exports.revokeWholesaler = (req, res) => {
  db.query(
    "UPDATE users SET status='pending' WHERE user_id=?",
    [req.params.id],
    () => res.redirect("/admin/wholesalers")
  );
};

exports.approveSupplyOffer = (req, res) => {
  const offerId = req.params.id;

  db.query(
    "UPDATE supplier_offers SET status='approved' WHERE offer_id=?",
    [offerId],
    (err) => {
      if (err) return res.send("Error approving offer");
      res.redirect("/admin/wholesalers");
    }
  );
};
exports.rejectSupplyOffer = (req, res) => {
  const offerId = req.params.id;

  db.query(
    "UPDATE supplier_offers SET status='rejected' WHERE offer_id=?",
    [offerId],
    (err) => {
      if (err) return res.send("Error rejecting offer");
      res.redirect("/admin/wholesalers");
    }
  );
};


exports.addOfferToShop = (req, res) => {

  const offerId = req.params.id;
  const categoryId = req.body.category_id;

  if (!categoryId) {
    return res.send("Please select category");
  }

  db.query(
    "SELECT * FROM supplier_offers WHERE offer_id=?",
    [offerId],
    (err, result) => {

      if (err || result.length === 0)
        return res.send("Offer not found");

      const offer = result[0];

      db.query(
        `INSERT INTO products
        (category_id, product_name, price, stock, product_image)
        VALUES (?, ?, ?, ?, ?)`,
        [
          categoryId,
          offer.product_name,
          offer.price,
          offer.stock_available,
          offer.catalog_file
        ],
        (err2) => {

          if (err2) {
            console.error(err2);
            return res.send("Error adding product");
          }

          db.query(
            "UPDATE supplier_offers SET status='published' WHERE offer_id=?",
            [offerId],
            () => {
              res.redirect("/admin/wholesalers");
            }
          );
        }
      );
    }
  );
};