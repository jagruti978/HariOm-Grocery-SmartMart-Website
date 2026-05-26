const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const wholesalerCtrl = require("../controllers/wholesalerOffer.controller"); // correct


const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "../uploads")),
  filename: (req, file, cb) => cb(null, Date.now() + "_" + file.originalname)
});
const upload = multer({ storage });

router.get("/dashboard", wholesalerCtrl.dashboard);
router.post("/offer/add", upload.single("catalog_file"), wholesalerCtrl.addOffer);
router.post("/resubmit", upload.single("business_docs"),wholesalerCtrl.resubmitVerification);
router.post("/offer/resubmit/:id", wholesalerCtrl.resubmitOffer);
router.post("/offer/delete/:id", wholesalerCtrl.deleteOffer);
router.get("/logout", wholesalerCtrl.logout);

module.exports = router;
