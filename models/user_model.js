
const connection = require("../db/db.js");
module.exports = class Users {
    
    constructor(name,surname,email,password)
    {
        this.name = name;
        this.surname = surname;
        this.email = email;
        this.password = password;
        this.userType = "normal";
    }

    saveUser()
    {
        return new Promise((resolve,reject) => {
            const query = `INSERT INTO users(name,surname,userType,email,password) VALUES(?,?,?,?,?)`;
            connection.query(query , [this.name , this.surname,this.userType,this.email,this.password],(err,result) => {
                if(err) {
                    reject(err);
                }
                else {
                    resolve(result);
                }
                
            });
        });
    }

    static findUserByEmail(email)
    {
        return new Promise((resolve,reject) => {
            const query = "SELECT * FROM users WHERE email = ? LIMIT 1;";
            connection.query(query , [email], (err,result) => {
                if(err) {
                    reject(err);
                }
                else {
                    resolve(result);
                }       
            });
        });

    }

    static getDateByUserId(id)
    {
        return new Promise((resolve,reject) => {
            const sql = "SELECT created_at FROM users WHERE id = ?";
            connection.query(sql , [id] , (err, row) => {
                if(err) {
                    reject(err);
                }
                else {
                    resolve(row);
                }
            });
        });
    }

    // Refresh token <==> Kullanıcı tokeni ile doğrulamak için
    static findUserByDecodeId(decode_id) {
        return new Promise((resolve, reject) => {
            const sql = "SELECT id,email,userType FROM users WHERE id = ?";
            connection.query(sql , [decode_id] , (err, row) => {
                if(err) {
                    reject(err);
                }
                else {
                    resolve(row);
                }
            });
        });
    }
    
    static updatePasswordByUserId(user_id , new_password) {
        return new Promise((resolve,reject) => {
            const sql = "UPDATE users SET password = ? WHERE id = ?";
            connection.query(sql , [new_password , user_id] ,(err,result) => {
                if(err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    }

    static deleteUserById(id) {
        return new Promise((resolve,reject) => {
            const sql = "DELETE FROM users WHERE id = ?";
            connection.query(sql , [id] , (err,result) => {
                if(err) {
                    reject(err);
                }
                else {
                    resolve(result);
                }
            });
        });
    }

    static updateUserEmailById(id,email) {
        return new Promise((resolve,reject) => {
            const sql = "UPDATE users SET email = ? WHERE id = ?";
            connection.query(sql , [email,id], (err,result) => {
                if(err) {
                    reject(err);
                }
                else {
                    resolve(result);
                }
            });
        });
    }

}

