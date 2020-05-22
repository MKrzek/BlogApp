const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');

const feedRoutes = require('./routes/feed');

const app = express();

// app.use(bodyParser.urlencoded()); // x-www-form-urlencoded <form>
app.use(bodyParser.json()); // application/json
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

app.use((err, req, res, next) => {
  console.log(err);
  const { message } = err;
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({ message });
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
    app.listen(8080);
  })
  .catch(err => {
    console.log('err', err);
  });
