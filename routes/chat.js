
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.js");
const messageLimitMiddleware = require("../middlewares/checkUserLimit.js");
const chatController = require("../controller/chat_cont.js");






// Seçilen sohbetin tüm mesajlarını dön.
// GET api / chat / sessions / : id / messages
router.get("/chat/sessions/:id/messages",authMiddleware,chatController.getMessagesBySessionId);




//Yeni bir sohbet başlat 
// POST api / chat / sessions
// session endpointini oluştur (GET)
// Ön koşul : authMiddleware
router.post("/chat/sessions", authMiddleware,chatController.startChat);




// Kullanıcının geçmiş sohbet başlıklarını getir
// GET api / chat / sessions
// sessions endpointini oluştur (POST)
//Ön koşul : authMiddleware
router.get("/chat/sessions",authMiddleware,chatController.chatHistory);





// 4- Yapay zeka ile sohbet ve kayıt.
// POST  api / chat / sessions / : id / messages

router.post("/chat/sessions/:id/messages",authMiddleware,messageLimitMiddleware,chatController.askAi);


module.exports.router = router;
