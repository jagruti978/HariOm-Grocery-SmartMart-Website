const express = require("express");
const router = express.Router();
const customerController = require("../controllers/customerController");

const isCustomer = (req, res, next) => {
  if (req.session.user && req.session.user.role === "customer") {
    return next();
  }

  if (req.xhr || req.headers.accept.indexOf("json") > -1) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  
  return res.redirect("/login");
};

router.get("/dashboard", isCustomer, customerController.getDashboard);
router.get("/cart", isCustomer, customerController.getCart);

router.get("/product/:id", customerController.productDetails);


router.post("/cart/add", isCustomer, customerController.addToCart);

router.get("/cart/remove/:productId", isCustomer, customerController.removeFromCart);

router.post("/cart/update", isCustomer, customerController.updateCartQuantity);

router.post("/payment/create", isCustomer, customerController.createPaymentOrder);
router.post("/payment/verify", isCustomer, customerController.verifyPayment);


router.post("/wishlist/add", customerController.addToWishlist);
router.get("/wishlist", customerController.viewWishlist);
router.get("/wishlist/remove/:id", customerController.removeFromWishlist);

router.post("/cart/apply-coupon", customerController.applyCoupon);
router.post("/checkout", customerController.checkoutCart);
router.get("/orders", customerController.viewOrders);


router.get("/logout", isCustomer, customerController.logout);

module.exports = router;
