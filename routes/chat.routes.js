const express = require("express");
const router = express.Router();
const chatCtrl = require("../controllers/chat.controller");


router.get("/customer/chat", chatCtrl.customerChatPage);
router.post("/customer/chat/send", chatCtrl.sendMessage);

router.get("/admin/chats", chatCtrl.adminChatList);
router.get("/admin/chat/:customerId", chatCtrl.adminChatPage);
router.post("/admin/chat/send", chatCtrl.sendMessage);

module.exports = router;
