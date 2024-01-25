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
const cors = require('cors');
const Coupon= require('./models/coupen');



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
const oneDay = 1000 * 60 * 60 * 24;
app.use(session({
  secret: process.env.secret,
  resave: false,
  saveUninitialized: true,
  cookie: {  maxAge: oneDay,
    secure:false, },
}));

app.use(flash());
app.use(cors({
  origin: 'http://localhost:3000',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
}));






app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');




// Database Connection
connectToDatabase();

// Session Setup
setupSession(app);


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, "public")));

// app.use((req, res, next) => {
//   console.log('Session data:', req.session);
//   next();
// });

app.use('/', indexRouter);
app.use('/user', userRouter );
app.use('/admin', adminRouter);
app.use('/user', express.static(path.join(__dirname, 'public')));
app.use('/user/productdetails', express.static(path.join(__dirname, 'public')));
app.use('/user/cart', express.static(path.join(__dirname, 'public')));





app.get('/test',async(req,res)=>{
 
  res.render('user/search')
})





const PORT = process.env.PORT || 3000;
app.listen(3000, () => {
  console.log("Server is running at http://localhost:3000");
});
