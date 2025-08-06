const chatModel = require("../models/chat_model.js");

async function checkMessageLimitMiddleware(req,res,next)
{
    // Kullanıcının idsini , rolünü al.
    const userId = req.user.userId;
    const role = req.user.userType;
    console.log("Limit için user id : " , userId);
    console.log("Limit için kullanıcı rolü : " , role);
    
    // Kullanıcı tipi plus ise devam et.
    if(role === "plus")
    {
        next();
    }
    // Değilse normal kullanıcının gün içinde kaç mesaj gönderdiğini bul.
    const [count] = await chatModel.chatMessages.getMessageCountByUserId(userId);
    console.log("Günlük mesaj sayısı : ",count.messageCount);
    // Bu sayı 10 eşit ya da büyükse mesaj hakkınız doldu mesajını dön
    if(count.messageCount >= 10)
    {
        return res.status(429).json({error : "Günlük soru hakkınızı doldurdunuz"});
    }

    // Günlük hak dolmamışsa devam et
    next();
}

module.exports = checkMessageLimitMiddleware;
