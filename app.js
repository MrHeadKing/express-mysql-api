require("dotenv").config();
const express = require('express');
const cors = require("cors");
const userRouter = require("./routes/user.js");
const chatRouter = require("./routes/chat.js");
const cookieParser = require("cookie-parser");
const app = express();

// Middlewares
app.use(express.urlencoded({extended : true}));
app.use(express.json());

app.use(cookieParser());
app.use(cors());

// Routes
app.use("/api/auth",userRouter.router);
app.use("/api" , chatRouter.router);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
