const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const morgan = require('morgan');
const path = require('path'); 
const connectToDatabase = require('./config/db');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const flash = require('express-flash');

require('dotenv/config');

// Routers
const indexRouter = require('./routes/index');
const userRouter = require('./routes/user');
const adminRouter = require('./routes/admin');


// Middleware
app.use(bodyParser.raw({ type: 'application/json' }));
app.use(morgan('tiny'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(flash());


app.use(cookieParser());
const oneDay = 1000 * 60 * 60 * 24;
app.use(session({
  secret: process.env.secret,
  resave: false,
  saveUninitialized: true,
  cookie: {  maxAge: oneDay,
    secure:false, },
}));


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


// Database Connection
connectToDatabase();


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, "public")));

app.use('/', indexRouter);
app.use('/user', userRouter );
app.use('/admin', adminRouter);
app.use('/user', express.static(path.join(__dirname, 'public')));
app.use('/user/productdetails', express.static(path.join(__dirname, 'public')));
app.use('/user/cart', express.static(path.join(__dirname, 'public')));
app.use('/user/wishlist', express.static(path.join(__dirname, 'public')));






const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server is running at http://localhost:3000");
});
