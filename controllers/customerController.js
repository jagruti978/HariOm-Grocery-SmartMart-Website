const db = require("../config/db");
const razorpay = require("../config/razorpay");


exports.getDashboard = (req, res) => {
  const userId = req.session.user.id;

  const sqlCategories = "SELECT category_id, category_name FROM categories ORDER BY category_name ASC";
  const sqlCartCount = "SELECT SUM(quantity) AS count FROM cart WHERE user_id=?";
  const sqlWishlist = "SELECT product_id FROM wishlist WHERE user_id=?";

  db.query(sqlCategories, (err, categories) => {
    if (err) return res.send("Error loading dashboard");

    db.query(sqlCartCount, [userId], (err, cartResult) => {
      if (err) return res.send("Error loading cart count");

      const cartCount = cartResult[0].count || 0;

      db.query(sqlWishlist, [userId], (err, wishlist) => {
        if (err) return res.send("Error loading wishlist");

        if (categories.length === 0) {
          return res.render("dashboards/customer", {
            categories: [],
            cartCount,
            wishlist
          });
        }

        let completed = 0;
        categories.forEach(cat => {
          const sqlProducts = `
            SELECT product_id, product_name, price, product_image
            FROM products
            WHERE category_id=? AND status='active'
            ORDER BY created_at DESC
          `;
          db.query(sqlProducts, [cat.category_id], (err, products) => {
            if (err) return res.send("Error loading products");

            cat.products = products;
            completed++;

            if (completed === categories.length) {
              res.render("dashboards/customer", {
                categories,
                cartCount,
                wishlist
              });
            }
          });
        });
      });
    });
  });
};

exports.productDetails = (req, res) => {

  if (!req.session.user) return res.redirect("/login");

  const productId = req.params.id;

 
  db.query(
    "SELECT * FROM products WHERE product_id = ?",
    [productId],
    (err, result) => {

      if (err || result.length === 0)
        return res.send("Product not found");

      const product = result[0];

      
      db.query(
        "SELECT * FROM products WHERE category_id = ? AND product_id != ? LIMIT 4",
        [product.category_id, productId],
        (err2, related) => {

          res.render("customer/productDetails", {
            product,
            relatedProducts: related || []
          });
        }
      );
    }
  );
};

exports.addToCart = (req, res) => {
  if (!req.session.user || !req.session.user.id) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const userId = req.session.user.id;
  let { productId, quantity } = req.body;

  quantity = parseInt(quantity) || 1; 

  const checkSql = "SELECT * FROM cart WHERE user_id=? AND product_id=?";

  db.query(checkSql, [userId, productId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false });
    }

    if (result.length > 0) {
      const updateSql =
        "UPDATE cart SET quantity = quantity + ? WHERE user_id=? AND product_id=?";
      db.query(updateSql, [quantity, userId, productId], err => {
        if (err) return res.status(500).json({ success: false });
        return res.json({ success: true });
      });
    } else {
     
      const insertSql =
        "INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)";
      db.query(insertSql, [userId, productId, quantity], err => {
        if (err) return res.status(500).json({ success: false });
        return res.json({ success: true });
      });
    }
  });
};


exports.getCart = (req, res) => {
  const userId = req.session.user.id; 

  const sql = `
    SELECT c.product_id, c.quantity, p.product_name, p.price, p.product_image
    FROM cart c
    JOIN products p ON c.product_id = p.product_id
    WHERE c.user_id = ?
  `;

  db.query(sql, [userId], (err, items) => {
    if (err) return res.send("Error loading cart");

    const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);

    res.render("customer/cart", {
      cartItems: items,
      cartCount
    });
  });
};

exports.removeFromCart = (req, res) => {
  const userId = req.session.user.id; 
  const productId = req.params.productId;

  const sql = "DELETE FROM cart WHERE user_id=? AND product_id=?";
  db.query(sql, [userId, productId], (err) => {
    if (err) return res.send("Error removing item");
    res.redirect("/customer/cart");
  });
};

exports.updateCartQuantity = (req, res) => {
  const { productId, action } = req.body;
  const userId = req.session.user.id;

  if (!productId || !action) {
    return res.status(400).json({ success: false });
  }

  let sql;
  if (action === "plus") {
    sql = "UPDATE cart SET quantity = quantity + 1 WHERE user_id=? AND product_id=?";
  } else {
    sql = "UPDATE cart SET quantity = GREATEST(quantity - 1, 1) WHERE user_id=? AND product_id=?";
  }

  db.query(sql, [userId, productId], err => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false });
    }
    res.json({ success: true });
  });
};




exports.addToWishlist = (req, res) => {
  const userId = req.session.user.id;
  const { productId } = req.body;

  const checkSql =
    "SELECT * FROM wishlist WHERE user_id=? AND product_id=?";
  db.query(checkSql, [userId, productId], (err, result) => {
    if (result.length > 0) {
      return res.json({ success: false, message: "Already in wishlist" });
    }

    const sql =
      "INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)";
    db.query(sql, [userId, productId], () => {
      res.json({ success: true });
    });
  });
};


exports.viewWishlist = (req, res) => {
  const userId = req.session.user.id;

  const sql = `
    SELECT w.wishlist_id, p.*
    FROM wishlist w
    JOIN products p ON w.product_id = p.product_id
    WHERE w.user_id=?
  `;

  db.query(sql, [userId], (err, items) => {
    res.render("customer/wishlist", {
      items,
      cartCount: req.session.cartCount || 0
    });
  });
};

exports.removeFromWishlist = (req, res) => {
  const id = req.params.id;
  db.query(
    "DELETE FROM wishlist WHERE wishlist_id=?",
    [id],
    () => res.redirect("/customer/wishlist")
  );
};



exports.applyCoupon = (req, res) => {
  const { code } = req.body;
  const userId = req.session.user.id;

  const sql = `
    SELECT * FROM coupons
    WHERE coupon_code=? AND status='active' 
      AND start_date <= CURDATE() AND end_date >= CURDATE()
  `;
  
  db.query(sql, [code], (err, result) => {
    if (err) return res.json({ success: false, message: "Something went wrong" });
    if (result.length === 0) return res.json({ success: false, message: "Invalid or expired coupon" });

    const coupon = result[0];

    
    const usedSql = `
      SELECT COUNT(*) AS count FROM orders 
      WHERE user_id=? AND coupon_id=?
    `;
    db.query(usedSql, [userId, coupon.coupon_id], (err2, usedRes) => {
      if (usedRes[0].count >= coupon.per_customer_limit) {
        return res.json({ success: false, message: "Coupon usage limit reached" });
      }

      
      res.json({ 
        success: true, 
        coupon: {
          type: coupon.discount_type,
          value: coupon.discount_value
        }
      });
    });
  });
};




exports.checkoutCart = (req, res) => {
  const userId = req.session.user.id;
  const couponCode = req.body.couponCode || null;


  const cartSql = `
    SELECT c.product_id, c.quantity, p.price
    FROM cart c
    JOIN products p ON c.product_id = p.product_id
    WHERE c.user_id=?
  `;

  db.query(cartSql, [userId], (err, items) => {
    if (err || items.length === 0) return res.json({ success: false, message: "Cart is empty" });

    let totalAmount = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    let discount = 0;
    let couponId = null;

    if (couponCode) {
     const couponSql =
  "SELECT * FROM coupons WHERE coupon_code=? AND status='active'";
      db.query(couponSql, [couponCode], (err, coupons) => {
        if (!err && coupons.length > 0) {
          const coupon = coupons[0];
          couponId = coupon.coupon_id;
          if (coupon.type === "flat") discount = parseFloat(coupon.value);
          else if (coupon.type === "percentage") discount = totalAmount * parseFloat(coupon.value)/100;
        }
        createOrder();
      });
    } else {
      createOrder();
    }

    function createOrder() {
      const finalAmount = totalAmount - discount;

      const orderSql = `
        INSERT INTO orders (user_id, total_amount, coupon_id)
        VALUES (?, ?, ?)
      `;
      db.query(orderSql, [userId, finalAmount, couponId], (err, orderRes) => {
        if (err) return res.json({ success: false });

        const orderId = orderRes.insertId;

      db.query(
  "INSERT INTO notifications (type, message, related_id) VALUES (?, ?, ?)",
  ["order", `New order placed. Order ID: ${orderId}`, orderId]
);


        
        const orderItems = items.map(i => [orderId, i.product_id, i.quantity, i.price]);
        const itemsSql = `
          INSERT INTO order_items (order_id, product_id, quantity, price)
          VALUES ?
        `;
        db.query(itemsSql, [orderItems], (err) => {
          if (err) return res.json({ success: false });

          db.query("DELETE FROM cart WHERE user_id=?", [userId], () => {
            res.json({ success: true, orderId });
          });
        });
      });
    }
  });
};


exports.viewOrders = (req, res) => {
  const userId = req.session.user.id;
  const sql = `
    SELECT * FROM orders
    WHERE user_id=?
    ORDER BY created_at DESC
  `;
  db.query(sql, [userId], (err, orders) => {
    if (err) return res.send("Error loading orders");
    res.render("customer/orders", { orders });
  });
};



exports.createPaymentOrder = (req, res) => {
  const { orderId } = req.body;

  const sql = "SELECT total_amount FROM orders WHERE order_id=?";
  db.query(sql, [orderId], (err, result) => {
    if (err || result.length === 0)
      return res.json({ success: false });

    const amount = result[0].total_amount;

    razorpay.orders.create(
      {
        amount: amount * 100, // paise
        currency: "INR",
        receipt: "order_" + orderId,
      },
      (err, order) => {
        if (err) return res.json({ success: false });

        res.json({
          success: true,
          razorpayOrderId: order.id,
          amount: order.amount,
          key: razorpay.key_id,
        });
      }
    );
  });
};

exports.verifyPayment = (req, res) => {
  const { orderId, paymentId } = req.body;

  const getOrderSql =
    "SELECT total_amount FROM orders WHERE order_id=?";
  db.query(getOrderSql, [orderId], (err, result) => {
    if (err || result.length === 0)
      return res.json({ success: false });

    const amount = result[0].total_amount;

   
    const paymentSql = `
      INSERT INTO payments 
      (order_id, transaction_id, amount, payment_method, payment_status)
      VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
      paymentSql,
      [orderId, paymentId, amount, "razorpay", "success"],
      () => {
       
        db.query(
          "UPDATE orders SET payment_status='paid' WHERE order_id=?",
          [orderId],
          () => res.json({ success: true })
        );
      }
    );
  });
};


exports.logout = (req, res) => {
  req.session.destroy(() => res.redirect("/"));
};
