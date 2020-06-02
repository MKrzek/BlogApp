const express = require('express');
const app = require('express')();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');

const graphqlHttp = require('express-graphql');
const graphqlSchema = require('./graphql/schema');
const graphqlResolver = require('./graphql/resolvers');
const isAuth = require('./middleware/isAuth');
const keys = require('./config/keys');

// const app = express();

const accessLogStream = fs.createWriteStream(
  path.join(__dirname, 'access.log'),
  { flags: 'a' }
);
app.use(helmet());

// app.use(bodyParser.urlencoded()); // x-www-form-urlencoded <form>
app.use(bodyParser.json()); // application/json

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'OPTIONS, GET, POST, PUT, PATCH, DELETE'
  );
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(isAuth);

app.use(
  '/graphql',
  graphqlHttp({
    schema: graphqlSchema,
    rootValue: graphqlResolver,
    graphiql: true,
    customFormatErrorFn(err) {
      if (!err.originalError) {
        return err;
      }
      const { data } = err.originalError;
      const message = err.message || 'An error occurred';
      const code = err.originalError.code || 500;
      return { message, code, data };
    },
  })
);

app.use((err, req, res, next) => {
  console.log(err);
  const { message } = err;
  const statusCode = err.statusCode || 500;
  const { data } = err;
  res.status(statusCode).json({ message, data });
});

mongoose
  .connect(
    `mongodb+srv://${keys.mongoUser}:${keys.mongoPassword}@cluster0-vgofl.mongodb.net/network?retryWrites=true&w=majority`,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => {
    console.log('connected to Mongo');

    app.listen(process.env.PORT || 8080);
  })
  .catch(err => {
    console.log('err', err);
  });
