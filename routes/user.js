
const express = require("express");
const userController = require("../controller/user_cont.js");
const authMiddleware = require("../middlewares/auth.js");

const router = express.Router();

/*
router.get("/user-register",userController.register);
router.get("/user-login",userController.login);
*/

router.get("/profile",authMiddleware,userController.profile);

router.post("/register", userController.postRegister);
router.post("/login",userController.postLogin);
router.post("/logout",authMiddleware,userController.logoutUser);
router.post("/refresh",userController.refresh);
router.post("/forgot-password",userController.forgotPassword);
router.post("/reset-password/:token",userController.resetPassword);


router.delete("/delete/:id",userController.deleteUser);
router.delete("/delete/users/me",authMiddleware,userController.deleteMe);

router.patch("/users/:id/email",authMiddleware,userController.updateEmail);


module.exports.router = router;





/*
http://localhost:3000/reset-password/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQ4LCJpYXQiOjE3NTM3MDU3MjYsImV4cCI6MTc1MzcwNjYyNn0.bsEBXq3eoGX7A5u6ezwbibqhGHrJtwrYFgtJdLP83BE
*/