const db = require("../config/db");


exports.getProducts = (req, res) => {
  const productQuery = `
    SELECT p.*, c.category_name
    FROM products p
    LEFT JOIN categories c
    ON p.category_id = c.category_id
  `;

  db.query(productQuery, (err, products) => {
    if (err) return res.send("Error loading products: " + err);

    db.query("SELECT * FROM categories", (err, categories) => {
      if (err) return res.send("Error loading categories: " + err);

      res.render("admin/products", {
        products,
        categories,
        editProduct: null,
        pageTitle: "Manage Products"
      });
    });
  });
};

exports.addProduct = (req, res) => {
  const { product_name, price, stock, category_id, expiry_date, description } = req.body;
  const image = req.file ? req.file.filename : null;

  let status = "active";
  if (stock == 0) status = "out_of_stock";
  if (expiry_date && new Date(expiry_date) < new Date()) status = "expired";

  const query = `
    INSERT INTO products 
    (category_id, product_name, price, stock, expiry_date, description, product_image, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    query,
    [
      category_id,
      product_name,
      price,
      stock,
      expiry_date || null,
      description,
      image,
      status
    ],
    (err, result) => {
      if (err) return res.send("Error adding product: " + err);

      const productId = result.insertId;

      if (status === "expired") {
        db.query(
          "INSERT INTO notifications (type, message, related_id) VALUES (?, ?, ?)",
          ["expired", `Product "${product_name}" is already expired.`, productId]
        );
      }

      if (status === "out_of_stock") {
        db.query(
          "INSERT INTO notifications (type, message, related_id) VALUES (?, ?, ?)",
          ["stock", `Product "${product_name}" is out of stock.`, productId]
        );
      }

      res.redirect("/admin/products");
    }
  );
};

exports.deleteProduct = (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM products WHERE product_id = ?", [id], err => {
    if (err) return res.send("Error deleting product: " + err);
    res.redirect("/admin/products");
  });
};

exports.editProductPage = (req, res) => {
  const { id } = req.params;

  db.query(
    `SELECT p.*, c.category_name
     FROM products p
     LEFT JOIN categories c
     ON p.category_id = c.category_id`,
    (err, products) => {
      if (err) return res.send("Error loading products: " + err);

      db.query("SELECT * FROM categories", (err, categories) => {
        if (err) return res.send("Error loading categories: " + err);

        db.query("SELECT * FROM products WHERE product_id = ?", [id], (err, productResult) => {
          if (err) return res.send("Error loading product: " + err);

          res.render("admin/products", {
            products,
            categories,
            editProduct: productResult[0],
            pageTitle: "Edit Product"
          });
        });
      });
    }
  );
};

exports.updateProduct = (req, res) => {
  const { id } = req.params;
  const { product_name, price, stock, category_id, expiry_date, description } = req.body;

  let status = "active";
  if (stock == 0) status = "out_of_stock";
  if (expiry_date && new Date(expiry_date) < new Date()) status = "expired";

  let query = `
    UPDATE products
    SET product_name=?, price=?, stock=?, category_id=?, expiry_date=?, description=?, status=?
  `;

  const params = [
    product_name,
    price,
    stock,
    category_id,
    expiry_date || null,
    description,
    status
  ];

  if (req.file) {
    query += ", product_image=?";
    params.push(req.file.filename);
  }

  query += " WHERE product_id=?";
  params.push(id);

  db.query(query, params, err => {
    if (err) return res.send("Error updating product: " + err);

    if (status === "expired") {
      db.query(
        "INSERT INTO notifications (type, message, related_id) VALUES (?, ?, ?)",
        ["expired", `Product "${product_name}" is expired`, id]
      );
    }

    if (status === "out_of_stock") {
      db.query(
        "INSERT INTO notifications (type, message, related_id) VALUES (?, ?, ?)",
        ["stock", `Product "${product_name}" is out of stock.`, id]
      );
    }

    res.redirect("/admin/products");
  });
};