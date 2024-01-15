const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);

function setupSession(app) {
  app.use(session({
    secret: process.env.secret,
    resave: false,
    saveUninitialized: true
  }));

  const store = new MongoDBStore({
    uri: process.env.CONNECTION_STRING,
    collection: 'sessions'
  });
}

module.exports = setupSession;
