const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const morgan = require('morgan');
const mongoose = require('mongoose');
const path = require('path'); 
const connectToDatabase = require('./config/db');
const setupSession = require('./config/session');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const flash = require('express-flash');
const { isAuth, displayuser } = require('./middleware/displayuser');





require('dotenv/config');



// Routers

const indexRouter = require('./routes/index');
const userRouter = require('./routes/user');
const adminRouter = require('./routes/admin');
const { render } = require('ejs');


// Middleware
app.use(morgan('tiny'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


app.use(cookieParser());
app.use(session({
  secret: process.env.secret,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false },
}));
app.use(flash());
app.use(displayuser);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));



app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');




// Database Connection
connectToDatabase();

// Session Setup
setupSession(app);


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, "public")));


app.use('/', indexRouter);
app.use('/user', userRouter );
app.use('/admin', adminRouter);
app.use('/user', express.static(path.join(__dirname, 'public')));
app.use('/user/productdetails', express.static(path.join(__dirname, 'public')));



app.get('/test',(req,res)=>{
  res.render('user/profile')
})






app.listen(3000, () => {
  console.log("Server is running at http://localhost:3000");
});
