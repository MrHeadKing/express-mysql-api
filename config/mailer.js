const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host : "smtp.gmail.com",
    port : 587,
    secure : false,
    auth : {
        user : process.env.MAIL_USER,
        pass : process.env.MAIL_PASS
    },
    
});


const sendPasswordResetEmail = async (to ,resetLink) => {
   
        await transporter.sendMail({
            from : process.env.MAIL_USER,
            to,
            subject : "Şifre Sıfırlama",
            html : `
                    <h3>Şifre Sıfırlama</h3>
                    <p>Aşağıdaki linke tıklayarak şifreni sıfırlayabilirsin</p>
                    <a href="${resetLink}"${resetLink}</a>
                    <p>Bu bağlantı 15 dakika içinde geçerliliğini yitirecektir.</p>
                `
        });
    
};

module.exports = sendPasswordResetEmail;




