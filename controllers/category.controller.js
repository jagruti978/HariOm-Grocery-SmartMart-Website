const db = require("../config/db");


exports.getCategories = (req, res) => {
  db.query("SELECT * FROM categories", (err, results) => {
    if (err) return res.send("DB Error");
    res.render("admin/categories", { categories: results });
  });
};

exports.addCategory = (req, res) => {
  const { category_name } = req.body;

  if (!category_name) return res.redirect("/admin/categories");

  db.query(
    "INSERT INTO categories (category_name) VALUES (?)",
    [category_name],
    () => res.redirect("/admin/categories")
  );
};


exports.deleteCategory = (req, res) => {
  db.query(
    "DELETE FROM categories WHERE category_id = ?",
    [req.params.id],
    () => res.redirect("/admin/categories")
  );
};
