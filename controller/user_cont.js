const path = require("path");
const userModel  = require("../models/user_model.js");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cache = require("../config/cache.js");
const Users = require("../models/user_model.js");
const sendResetPassword = require("../config/mailer.js");

function generateTokens(user)
{
    console.log("Token üretim fonksiyonu logları");
    console.log(".env Access key : " , process.env.ACCESS_SECRET);
    console.log(".env Refresh key : " , process.env.REFRESH_SECRET);

    const payload = {userId : user.id , email : user.email , userType : user.userType};
    const access_token = jwt.sign(payload , process.env.ACCESS_SECRET , {
        expiresIn : "30m"
    });
    const refresh_payload = {type : "refresh" , sub : user.id};
    const refresh_token = jwt.sign(refresh_payload, process.env.REFRESH_SECRET , {
        expiresIn : "7d"
    });
    return {access_token , refresh_token};
}

function generateAccess(user){
    const payload = {userId : user.id , email : user.email , userType : user.userType};
    const access_token = jwt.sign(payload , process.env.ACCESS_SECRET , {
        expiresIn : "1h"
    });
    return access_token;
}


module.exports.logoutUser = (req,res) => {
    // Refresh token cookieden oku
    // access token authHeader dan oku
    const access_token = req.headers.authorization;
    const refresh_token = req.cookies.refreshToken;

    
    console.log("Access token : " , process.env.ACCESS_SECRET);

    // yoksa refresh token gerekli mesajı dön
    if(!refresh_token) {
         return res.status(400).json({error : "Refresh token gerekli"});
    }
    // Kara listeye 7 gün boyunca ekle
    // time = 7* 24 * 60 * 60
    const time = 7 * 24 * 60 * 60;
    const time2 = 1800;
    // set() metodunu kullanacaksın. (token , true , time)
    // Gelişmiş blacklisted kontrolü
    const logoutStatus = {
        access_status : null,
        refresh_status : null
    };

    if(access_token) {
        if(cache.get(access_token)) {
            logoutStatus.access_status = "Zaten logout edilmiş";
        }else{
            cache.set(access_token,true , time2);
            logoutStatus.access_status = "Başarıyla logout edildi";
        }
    }

    if(refresh_token) {
        if(cache.get(refresh_token)) {
            logoutStatus.refresh_status = "Zaten logout edilmiş";
        }else{
            cache.set(refresh_token,true , time);
            logoutStatus.refresh_status = "Başarıyla logout edildi";
        }
    }

    // Logout başarılı , refresh ve access token geçersiz kılındı
    return res.json({message : "Logout başarılı , refresh ve access token geçersiz kılındı"});
};

module.exports.profile = (req,res) => {
    res.json({message : "Korumalı alana hoşgeldin" , user : req.user});
};

/*
module.exports.register = (req, res) => {
    res.sendFile(path.join(__dirname , "../","views","register.html"));
}
*/

/*
module.exports.login = (req,res) => {
    res.sendFile(path.join(__dirname,"../","views","login.html"));
}
*/
module.exports.postRegister = async (req,res) => {
    const {name , surname,email,password,repassword} = req.body;
    if(password.length < 8)
    {
        return res.status(400).json({error : "Parola en az 8 karakter olmalıdır"});
    }
    if(password != repassword)
    {
        return res.status(400).json({error : "Parolalar eşleşmiyor"});
    }
    
    if(!name || !surname || !email)
    {
       return res.status(400).json({error : "Doldurulması zorunlu alanlar var"});
    }
    const checkEmail = await userModel.findUserByEmail(email);
    if(checkEmail.length != 0) {
        return res.status(409).json({error : "Bu e-posta zaten kayıtlı"});
    }

    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password , salt);
    const user = new userModel(name,surname,email,hashedPassword);
    const result = await user.saveUser();
    const id = result.insertId;
    const [last_date] = await Users.getDateByUserId(id);
    const created_at = last_date.created_at;
    res.status(201).json({message : "Kayıt başarılı",created_at, id : id});
}

module.exports.postLogin = async (req,res,) => {
    console.log("postLogin logs");
    const {email,password} = req.body;
    if((!email && !password) || (!email || !password)){
        return res.status(400).json({error : "Eksik ya da hatalı veri gönderildi"});
    }

    const result = await Users.findUserByEmail(email);  
    const user = result[0]; 
    if(!user) {
        return res.status(404).json({error : "Geçersiz e-posta veya şifre"});
    }
    const isMatch = await bcryptjs.compare(password , user.password);
    if(!isMatch){
        return res.status(401).json({error : "Geçersiz e-posta veya şifre"});
    }
    console.log("Kullanıcı tipi : " , user.userType);
    const {access_token , refresh_token} = generateTokens(user);

    console.log("Refresh token : " , refresh_token);
    // Refresh token'i HTTP-ONLY COOKIE'ye koy
    res.cookie("refreshToken" , refresh_token , {
        httpOnly : true,
        secure : false ,
        sameSite : "strict",
        path : "/refresh",
        maxAge :  7 * 24 * 60 * 60 * 1000.  // 7 gün
    });

    console.log("Giriş başarılı. Access token : " , access_token , "Refresh token : " , refresh_token);
    res.json({message : "Giriş başarılı" , access_token : access_token , refresh_token : refresh_token , user : {id : user.id , email : user.email}}, );
    
};





module.exports.forgotPassword = async (req,res) => {
    // İstek gövdesinden emaili al.
    const {email} = req.body;
    // Böyle bir email var mı db den kontrol et.
    const user = await userModel.findUserByEmail(email);
    // Yoksa hata dön
    // E posta sıfırlama linki gönderildi mesajı dön
    
    // Yeni bir token imzala (oluştur)
    // payload {userId : epostayı gönderen kullanıcının idsi}
    const payload = {userId : user[0].id};
    const token = jwt.sign(payload , process.env.JWT_SECRET, {expiresIn : '15m'});

    // reset linki oluştur. Yapı => {client_url}/reset-password/{token}
    const resetLink = `${process.env.CLIENT_URL}/api/auth/reset-password/${token}`;
    // Bir sonraki adımda hata kontrolü yap
    try {
        // Sıfırlama epostası gönderen fonksiyonu çağır (await ile). (Kullanıcı email,Sıfırlama linki)
        await sendResetPassword(email , resetLink);
        // Şifre sıfırlama linki e posta adresinize gönderildi mesajı dön
        return res.json({message : "Şifre sıfırlama linki e posta adresinize gönderildi"});
    }
    catch(err) {
        // Hata yakalanırsa hatayı konsola yaz.
        console.log(err);
        // 500 durum kodu ile e posta gönderilemedi mesajı dön
        return res.status(500).json({error : "E posta gönderilemedi , sunucu hatası"});
    }
}


module.exports.resetPassword = async (req,res) => {
    // URL deki tokeni al
    const token = req.params.token;
    // Kullanıcıdan yeni parolayı al
    const {password}= req.body;
    // Hata kontrolü yap
    try {
        // Tokeni doğrula
        const decoded = jwt.verify(token, process.env.JWT_SECRET,{ algorithms: ['HS256'] });
        // Doğrulanan tokendeki idye ait kullanıcıyı bul
        const user = await userModel.findUserByDecodeId(decoded.userId);
        // Yoksa 400 ile kullanıcı bulunamadı dön
        if(user.length == 0) {
            res.status(404).json({error : "Kullanıcı bulunamadı"});
        }
        // Parolayı hashle
        const hashedPassword = await bcryptjs.hash(password, 10);
        // Veritabanına kaydet
        userModel.updatePasswordByUserId(decoded.userId,hashedPassword);
        return res.json({message : "Şifreniz başarıyla güncellendi"});
    }
    catch(err) {
        // Hata yakalanırsa
        // 400 durum koduyla Token geçersiz veya süresi dolmuş mesajı gönder
        return res.status(401).json({error : "Token geçersiz veya süresi dolmuş"});
    }
}



module.exports.deleteUser = async (req ,res) => {
    const id = req.params.id;
    // Kullanıcı db de var mı bak
    const user = await userModel.findUserByDecodeId(id);
    console.log(user);
    // yoksa hata dön
    if(user.length == 0) {
        return res.status(404).json({error : "Kullanıcı bulunamadı"});
    }
    // Kullanıcıyı db den sil. Kullanıcı silindi mesajı dön
    await userModel.deleteUserById(id);
    return res.json({message : "Kullanıcı başarıyla silindi"});
};


module.exports.deleteMe = async (req,res) => {
    try {
        const user_id = req.user.userId;
        console.log(user_id);
        const user = await userModel.findUserByDecodeId(user_id);
        if(user.length == 0 ) {
            res.status(404).json({error : "Kullanıcı bulunamadı"});
        }
        await userModel.deleteUserById(user_id);
        res.status(204).send();
    }
    catch(err) {
        console.log(err);
        res.status(500).json({error : "Hesap silinirken bir hata oluştu"});
    }
}

module.exports.updateEmail = async (req,res) => {
    try {
        const id = req.params.id;
        const email = req.body.email;
        const user = await userModel.findUserByDecodeId(id);
        if(user.length == 0) {
            return res.status(404).json({error : "Kullanıcı bulunamadı"});
        }
        await userModel.updateUserEmailById(id,email);
        console.log("New email : ",email);
        console.log("id : " , id);
        return res.json({message : "Kullanıcı email adresi başarıyla güncellendi"});

    }
    catch (err) {
        console.log(err);
        return res.status(500).json({error : "Email güncellenirken bir hata oluştu"});
    }

}


module.exports.refresh = async(req,res) => {  
    /*refresh_token'ı al 
    yoksa hata dön (403)
    refresh_token doğrula
    doğrulanmazsa hata dön (403)
    Kullanıcı idsi doğrulanan id ile eşit değilse hata dön (403)
    yeni access_token oluştur ve json olarak dön . {access_token}*/
    const refresh_token = req.cookies.refreshToken;
    if(!refresh_token){
        return res.status(403).json({error : "Token bulunamadı"});
    }
    if(cache.get(refresh_token)) {
        return res.status(403).json({
            error : "Bu refresh token logout edildi ve geçersiz"
        });
    }
    try {
        const decode = jwt.verify(refresh_token , process.env.REFRESH_SECRET,{ algorithms: ['HS256'] });
        console.log("Decode id : ",decode.id);
        const user = await userModel.findUserByDecodeId(decode.sub); // decode id
        console.log("isMatch : ", user);
        if(user.length == 0) {
            return res.status(403).json({error : "Bu token bu kullanıcıya ait değil"});
            
        }
        const new_access = generateAccess(user);
        console.log(new_access);
        return res.json({new_access});

    }
    catch(err) {
        res.status(401).json({error : "Token doğrulanamadı"});
    }
}











