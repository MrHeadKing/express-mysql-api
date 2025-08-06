
const jwt = require("jsonwebtoken");
const cache = require("../config/cache.js");


function authMiddleware(req,res,next)
{
    console.log("AuthMiddleware logs");
    const authHeader = req.headers.authorization;
    if(!authHeader || !authHeader.startsWith("Bearer ")){
        return res.status(401).json({error : "Token eksik veya geçersiz"});
    }
    const token = authHeader.split(" ")[1];
    if (cache.get(authHeader)) {
        return res.status(401).json({ error: 'Bu token logout edildi' });
    }

    console.log("Access token : " , token);
    console.log("Access Secret Key : " , typeof process.env.ACCESS_SECRET);
    
    try
    {
        const decoded = jwt.verify(token , process.env.ACCESS_SECRET, { algorithms: ['HS256'] });
        console.log("Decoded : ",decoded);
        req.user = decoded;
        next();
    }
    catch(err)
    {
        return res.status(403).json({error : "Token doğrulanamadı"});
    }
    
};

module.exports = authMiddleware;
