const chatModel = require("../models/chat_model.js");
const { default: axios } = require("axios");

/*
• Başlık bilgisini al (front-endden gelecek)
• Kullanıcı idsini al (token üretirken request e eklenen id)
• chat_session tablosuna ekle
# Sohbet başlatıldı mesajını ve insertId yi döndür
*/
module.exports.startChat = async (req,res) => {
    const { title } = req.body;
    console.log("Title : ",title);
    const userId = req.user.userId; 
    console.log("userID : ",userId);
    
    const [exist] = await chatModel.chatSessions.checkSessionTitle(userId , title);
    const message_count = exist.message_count;
    if(message_count > 0)
    {
        return res.status(409).json({error : "Bu başlığa ait sohbet zaten var"});
    }
    const chatsession = new chatModel.chatSessions(userId,title);
    const result = await chatsession.saveChat();
    const sessionId = result.insertId;
    console.log(sessionId);
    res.status(201).json({message : "Sohbet başlatıldı" , sessionId : sessionId});
    
};


/*
Kullanıcı idsini al
• İlgili kullanıcı idsine göre chat_session tablosundan id , başlık ve oluşturma tarihi bilgilerini al.
# Değeri geriye döndür
*/
module.exports.chatHistory = async (req,res) => {
    const userId = req.user.userId;
    console.log("Kullanıcı id : ", userId);
    const data = await chatModel.chatSessions.getChatSessionByUserId(userId);
    if(data.length == 0) {
        res.status(404).json({error : "Sohbet bulunamadı"});
    }
    console.log("Id ye göre session : " , data);
    res.json({data});
}


//3- Seçilen sohbetin tüm mesajlarını dön
/*
• SessionId yi al (request parameters)
• Kullanıcı idsi al
• Güvenlik , bu session kullanıcıya mı ait kontrol et
• chat_sessions tablosunda , alınan SessionId ve KullanıcıId sine sahip bir kayıt var mı
• Yoksa 403 durum kodu ile erişim reddedildi mesajini döndür
# Kayıt varsa devam et ve chat_messages tablosundan session_id kolonu req.paramstan alınan SessionId ye eşit olan kaydı bul ve json formatında geriye döndür
*/
module.exports.getMessagesBySessionId = async (req,res) => {
      const sessionId = req.params.id;
      console.log("Session id parametresi : " , sessionId );
      const userId = req.user.userId;
      console.log("Req user id : " , userId);
      const checkSession = await chatModel.chatSessions.checkSessions(sessionId,userId);
      console.log("Kontrolden gelen değer : " , checkSession);
      if(checkSession.length == 0)
      {
           res.status(404).json({error : "Kullanıcı bulunamadı , erişim reddedildi !"});
      }
      const data = await chatModel.chatSessions.getMessagesBySessionId(sessionId);
      console.log("Session Idye göre gelen değer : " , data);
      res.json({messages : data});
};



/*
    *  Kullanıcıdan alınan mesajı yapay zeka APIsıne gönder.
    * : id -> oturum idsi endpointte gönderilecek. (hangi sohbete ait)
    * AI'den cevap al.
    * Veritabanına kullanıcı mesajını kaydet. gönderici user olmalı.
    * Veritabanına AI cevabı kaydet. gönderici assistant olmalı.
    * AI cevabı ve isteğe bağlı kullanıcı mesajını json olarak döndür.
*/

module.exports.askAi = async (req,res) => {
    try {
            const api_key = process.env.OPENROUTER_API_KEY;
            const userInput = req.body.message;
            
            // Yapay zeka API endpoint adresi
            const aiApiUrl = "https://openrouter.ai/api/v1/chat/completions";

            const chatHistory = await chatModel.chatMessages.getLast5Message(req.params.id);
            console.log("Chat geçmişi : ", chatHistory);
            const reversedHistory = chatHistory.reverse();
            for(let i = 0; i < reversedHistory.length ; i+= 2)
            {
                let temp = reversedHistory[i];
                reversedHistory[i] = reversedHistory[i + 1];
                reversedHistory[i + 1] = temp;
            }

            reversedHistory.push({role : "user" , content : userInput});
            console.log("Düzgün sıralı mesajlar + son mesaj : " ,reversedHistory);
            // API'ye gönderilecek veri
            const response = await axios.post(aiApiUrl,{
                    model : "google/gemma-3-4b-it:free",
                    messages : reversedHistory
            },{
                    headers : {
                            "Authorization" : `Bearer ${api_key}`,
                            "Content-Type" : "application/json",
                            "HTTP-Referer" : "http://localhost:3000"
                    }
            });

            const aiReply = response.data;
            const session_id = req.params.id;
            console.log("Session id :" , session_id);
            const cleanAIAnswer = aiReply.choices[0].message.content;
            console.log("Clean reply : ",cleanAIAnswer);
            console.log(aiReply);

            const userMessage = new chatModel.chatMessages(session_id,"user",userInput);
            const AIMessage = new chatModel.chatMessages(session_id , "assistant" , cleanAIAnswer);

            await userMessage.saveReplies();
            await AIMessage.saveReplies();


            return res.json({messages : [
                {role : "user" , content : userInput},
                {role : "assistant" , content : cleanAIAnswer}
            ]});

            
    }

    catch (err) {
    console.log("AI API Hatası:" ,err.message);
    res.status(500).json({error : "İstek gönderilirken hata oluştu"})
    }
}
