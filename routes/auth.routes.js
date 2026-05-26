const express = require("express");
const multer = require("multer");
const { signup } = require("../controllers/auth.controller");
const { login } = require("../controllers/login.controller");

const router = express.Router();

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "_" + file.originalname);
  }
});

const upload = multer({ storage });

router.post("/signup", upload.single("docs"), signup);
router.post("/login", login);
module.exports = router;
