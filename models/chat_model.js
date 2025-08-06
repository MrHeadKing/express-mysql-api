const connection = require("../db/db.js");

module.exports.chatSessions = class ChatSessions {

    constructor(user_id , title)
    {
        this.user_id = user_id;
        this.title = title;
        
    }
    
    saveChat()
    {
        return new Promise((resolve,reject) => {
            const sql = `INSERT INTO chat_sessions(user_id,title,created_at) VALUES(?,?,NOW())`;
            connection.query(sql , [this.user_id,this.title] , (err,result) => {
                if(err){
                    reject(err);
                }
                else {
                    console.log("Sorgu sonrası obje : ",result);
                    resolve(result);
                }
            });
        }); 
    }

    

    static getChatSessionByUserId(id)
    {
        return new Promise((resolve,reject) => {
            const sql = "SELECT id,title,created_at FROM chat_sessions WHERE user_id = ?";
            connection.query(sql , [id] , (err,rows) => {
                if(err) {
                    reject(err);
                }
                else {
                    resolve(rows);
                }
                
            });

        });
    }

    static checkSessions(id , user_id)
    {
        return new Promise((resolve,reject) => {
            const sql = "SELECT id FROM chat_sessions WHERE id = ? AND user_id = ?";
            connection.query(sql , [id,user_id] ,(err,row) => {
                if(err) {
                    reject(err);
                }
                else {
                    resolve(row);
                }
            });
        });
    }


    //Kayıt varsa devam et ve chat_messages tablosundan session_id 
    //kolonu req.paramstan alınan SessionId ye eşit olan kaydı 
    //bul ve json formatında geriye döndür
    // Not : Paramstan gelen değer enpointten gelen değerdir
    // hangi sohbet başlığı içindeki mesajlar isteniyosa o başlıktaki
    // mesajlar döndürülecektir

    static getMessagesBySessionId(session_id)
    {
        return new Promise((resolve,reject) => {
            const sql = "SELECT sender,message,created_at FROM chat_messages WHERE session_id = ?";
            connection.query(sql , [session_id] , (err,rows) => {
                if(err) {
                    reject(err);
                }
                else {
                    resolve(rows);
                }
            });
        });
    }
    
    static checkSessionTitle(userId , title)
    {
        return new Promise((resolve,reject) => {
            const sql = "SELECT COUNT(*) as message_count FROM chat_sessions WHERE user_id = ? AND title = ?";
            connection.query(sql , [userId ,title], (err,rows) => {
                if(err){
                    reject(err);
                }
                else {
                    resolve(rows);
                }
            });
        });
    }
    
}

    


    /*
    *  Kullanıcıdan alınan mesajı yapay zeka APIsıne gönder.
    * : id -> oturum idsi endpointe gönderilecek. (hangi sohbete ait)
    * AI'den cevap al.
    * Veritabanına kullanıcı mesajını kaydet. gönderici user olmalı.
    * Veritabanına AI cevabı kaydet. gönderici assistant
    * AI cevabı ve isteğe bağlı kullanıcı mesajını json olarak döndür.
*/
module.exports.chatMessages = class ChatMessages {
    
    constructor(session_id , sender ,message){
            this.session_id = session_id;
            this.sender = sender;
            this.message = message;

    }

    saveReplies(){
        return new Promise((resolve,reject) => {
            const sql = "INSERT INTO chat_messages(session_id,sender,message,created_at) VALUES(?,?,?,NOW())";
            connection.query(sql , [this.session_id , this.sender,this.message], (err,result) => {
                if(err) {
                    reject(err);
                }
                else{
                    resolve(result);
                }
            });
        });
    }
    
    static getMessageCountByUserId(user_id)
    {
        return new Promise((resolve,reject) => {
            const sql = `
            SELECT COUNT(cm.id) AS messageCount FROM chat_messages cm
            JOIN chat_sessions cs ON cm.session_id = cs.id
            WHERE cs.user_id = ? AND cm.sender = 'user' AND cm.created_at >= CURDATE() AND cm.created_at < CURDATE() + INTERVAL 1 DAY`;
            connection.query(sql , [user_id] , (err,result) => {
                if(err) {
                    reject(err);
                }
                else {
                    resolve(result);
                }
            });
        });
    }

    static getLast5Message(session_id)
    {
        return new Promise((resolve, reject) => {
            const sql = `SELECT sender AS role, message AS content FROM chat_sessions,chat_messages
            WHERE chat_sessions.id = chat_messages.session_id AND 
            chat_messages.session_id = ? ORDER BY chat_messages.created_at DESC LIMIT 6`;
            connection.query(sql , [session_id] , (err,rows) => {
                if(err) {
                    reject(err);
                }
                else {
                    resolve(rows);
                }
                
            });
        });
    }
    
}
