var express = require('express');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// APIs
var mongoose = require('mongoose');
// Mongo Lab
mongoose.connect('mongodb://test:test@ds151702.mlab.com:51702/bookshop');

// local Database
//mongoose.connect('mongodb://localhost:27017/bookshop');

var db = mongoose.connection;
db.on('error', console.error.bind(console, '# MongoDB - connection error: '));

// set up sessions
app.use(session({
  secret: 'mySecretString',
  saveUninitialized: false,
  resave: true,
  cookie: {maxAge: 1000 * 60 * 60 * 24 * 2}, // 2 days in milliseconds
  store: new MongoStore({mongooseConnection: db, ttl: 2 * 24 * 60 * 60})
  // ttl: 2 days * 24 hours * 60 minutes * 60 seconds
}));
// save to sessison
app.post('/cart', function(req, res) {
  var cart = req.body;
  req.session.cart = cart;
  req.session.save(function(err) {
    if(err) {
      throw err;
    }
    res.json(req.session.cart);
  });
});
// get seesion cart API
app.get('/cart', function(req, res) {
  if(typeof req.session.cart !== 'undefined') {
    res.json(req.session.cart);
  }
});
// end session set up

var Books = require('./models/books.js');

// POST books
app.post('/books', function(req, res) {
  var book = req.body;

  Books.create(book, function(err, books) {
    if(err) {
      throw err;
    }
    res.json(books);
  });
});

// GET books
app.get('/books', function(req, res) {
  Books.find(function(err, books) {
    if(err) {
      throw err;
    }
    res.json(books);
  });
});

// DELETE books
app.delete('/books/:_id', function(req, res) {
  // MongoDB query string
  var query = {_id: req.params._id};

  Books.remove(query, function(err, books) {
    if(err) {
      console.log("# API DELETE BOOKS: ", err);
    }
    res.json(books);
  });
});

// UPDATE books
app.put('/books/:_id', function(req, res) {
  var book = req.body;
  var query = req.params._id;
  // if the field doesn't exist $set will set a new field
  var update = {
    '$set': {
      title: book.title,
      description: book.description,
      image: book.image,
      price: book.price
    }
  };
  // when true returns the updated document
  var option = {new: true};

  Books.findOneAndUpdate(query, update, option, function(err, books) {
    if(err) {
      throw err;
    }
    res.json(books);
  });
});

// get book images API
app.get('/images', function(req, res) {
  const imgFolder = __dirname + '/public/images/';
  // require file system
  const fs = require('fs');
  // read all files in the directory
  fs.readdir(imgFolder, function(err, files) {
    if(err) {
      return console.error(err);
    }
    // create an empty array
    const filesArr = [];
    // iterate all images in the directory and add to the array
    files.forEach(function(file) {
      filesArr.push({name: file});
    });
    // send the JSON response with the array
    res.json(filesArr);
  });
});

// end APIs

app.listen(3001, function(err) {
    if(err) {
        return console.log(err);
    }
    console.log('API server is listening on http://localhost:3001');
});
