const express = require('express');
const app = require('express')();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');
const http = require('http').createServer(app);
// const io = require('socket.io')(http);

const feedRoutes = require('./routes/feed');
const authRoutes = require('./routes/auth');

// const app = express();

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images');
  },
  filename: (req, file, cb) => {
    cb(null, `${new Date().toISOString()}-${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/jpeg'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

// app.use(bodyParser.urlencoded()); // x-www-form-urlencoded <form>
app.use(bodyParser.json()); // application/json
app.use(multer({ storage: fileStorage, fileFilter }).single('image'));
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'OPTIONS, GET, POST, PUT, PATCH, DELETE'
  );
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

app.use('/feed', feedRoutes);
app.use('/auth', authRoutes);

app.use((err, req, res, next) => {
  console.log(err);
  const { message } = err;
  const statusCode = err.statusCode || 500;
  const { data } = err;
  res.status(statusCode).json({ message, data });
});

mongoose
  .connect(
    'mongodb+srv://mkrzek:mkrzek@cluster0-vgofl.mongodb.net/network?retryWrites=true' +
      '&w=majority',
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => {
    console.log('connected to Mongo');

    // http.listen(8080);
    // eslint-disable-next-line global-require
    const io = require('./socket').init(http.listen(8080));
    io.on('connection', socket => {
      console.log('client connected');
    });
  })
  .catch(err => {
    console.log('err', err);
  });
