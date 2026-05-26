const express = require("express");
const multer = require("multer");
const router = express.Router();

const productCtrl = require("../controllers/product.controller");
const { getCategories, addCategory, deleteCategory } = require("../controllers/category.controller");

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "_" + file.originalname);
  }
});
const upload = multer({ storage });




router.get("/categories", getCategories);
router.post("/categories/add", addCategory);
router.post("/categories/delete/:id", deleteCategory);


router.get("/products", productCtrl.getProducts);
router.post("/products/add", upload.single("product_image"), productCtrl.addProduct);
router.post("/products/delete/:id", productCtrl.deleteProduct);
router.get("/products/edit/:id", productCtrl.editProductPage);
router.post("/products/update/:id", upload.single("product_image"), productCtrl.updateProduct);


const couponCtrl = require("../controllers/coupon.controller");

router.get("/coupons", couponCtrl.getCoupons);
router.post("/coupons/add", couponCtrl.addCoupon);
router.post("/coupons/delete/:id", couponCtrl.deleteCoupon);
router.get("/coupons/edit/:id", couponCtrl.editCouponPage);
router.post("/coupons/update/:id", couponCtrl.updateCoupon);


const orderCtrl = require("../controllers/order.controller");

router.get("/order", orderCtrl.getAllOrders);
router.post("/order/update-status/:id", orderCtrl.updateOrderStatus);


const wholesalerCtrl = require("../controllers/wholesaler.controller");

router.get("/wholesalers", wholesalerCtrl.getSupplyOffers);
router.post("/wholesalers/approve/:id", wholesalerCtrl.approveWholesaler);
router.post("/wholesalers/reject/:id", wholesalerCtrl.rejectWholesaler);
router.post("/wholesalers/revoke/:id", wholesalerCtrl.revokeWholesaler);


router.post("/supply-offers/approve/:id", wholesalerCtrl.approveSupplyOffer);
router.post("/supply-offers/reject/:id", wholesalerCtrl.rejectSupplyOffer);
router.post("/supply-offers/add-to-shop/:id", wholesalerCtrl.addOfferToShop);


const adminCtrl = require("../controllers/admin.controller");

router.get("/dashboard", adminCtrl.getDashboard);
router.get("/chart-data", adminCtrl.getChartData);
router.get("/notifications", adminCtrl.getNotifications);
router.post("/notifications/read/:id", adminCtrl.markAsRead);




module.exports = router;