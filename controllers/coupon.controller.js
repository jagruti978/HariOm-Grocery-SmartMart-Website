const db = require("../config/db");

exports.getCoupons = (req, res) => {
  db.query("SELECT * FROM coupons", (err, coupons) => {
    if (err) {
      console.error(err);
      return res.send("Error loading coupons");
    }

    res.render("admin/coupons", {
      coupons,
      editCoupon: null   
    });
  });
};


exports.addCoupon = (req, res) => {
  const {
    coupon_code,
    discount_type,
    discount_value,
    start_date,
    end_date,
    per_customer_limit
  } = req.body;

  db.query(
    `INSERT INTO coupons
    (coupon_code, discount_type, discount_value, start_date, end_date, per_customer_limit)
    VALUES (?, ?, ?, ?, ?, ?)`,
    [
      coupon_code,
      discount_type,
      discount_value,
      start_date,
      end_date,
      per_customer_limit
    ],
    err => {
      if (err) {
        console.error(err);
      }
      res.redirect("/admin/coupons");
    }
  );
};


exports.deleteCoupon = (req, res) => {
  const { id } = req.params;

  db.query(
    "DELETE FROM coupons WHERE coupon_id = ?",
    [id],
    err => {
      if (err) {
        console.error(err);
      }
      res.redirect("/admin/coupons");
    }
  );
};


exports.editCouponPage = (req, res) => {
  const { id } = req.params;

  db.query(
    "SELECT * FROM coupons WHERE coupon_id = ?",
    [id],
    (err, rows) => {
      if (err) {
        console.error(err);
        return res.redirect("/admin/coupons");
      }

      db.query("SELECT * FROM coupons", (err2, coupons) => {
        if (err2) {
          console.error(err2);
          return res.redirect("/admin/coupons");
        }

        res.render("admin/coupons", {
          coupons,
          editCoupon: rows[0]
        });
      });
    }
  );
};

exports.updateCoupon = (req, res) => {
  const { id } = req.params;

  const {
    coupon_code,
    discount_type,
    discount_value,
    start_date,
    end_date,
    per_customer_limit,
    status
  } = req.body;

  db.query(
    `UPDATE coupons SET
      coupon_code = ?,
      discount_type = ?,
      discount_value = ?,
      start_date = ?,
      end_date = ?,
      per_customer_limit = ?,
      status = ?
     WHERE coupon_id = ?`,
    [
      coupon_code,
      discount_type,
      discount_value,
      start_date,
      end_date,
      per_customer_limit,
      status,
      id
    ],
    err => {
      if (err) {
        console.error(err);
      }
      res.redirect("/admin/coupons");
    }
  );
};
