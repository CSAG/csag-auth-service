var express = require('express'),
    _       = require('lodash'),
    config  = require('./config'),
    jwt     = require('jsonwebtoken');
var mysql = require('mysql');
var passwordHash = require('password-hash');

var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'csag',
    //multipleStatement: true
});

connection.connect();




var app = module.exports = express.Router();


function createToken(user) {
  return jwt.sign(_.omit(user, 'password'), config.secret, { expiresIn: 60*60*5 });
}



app.post('/register', function(req, res) {

  //Validate request
  if (!req.body.username || !req.body.password || !req.body.fullname || !req.body.age) {
    return res.status(400).send("You must send the username, fullname, age and password");
  }

  //Check if already exists
  let statement = 'select * from user where username=' + JSON.stringify(req.body.username) + ' LIMIT 1';
  let query = connection.query(statement, function(err, result) {
    if (result[0] != null) {
      return res.status(400).send("A user with that username already exists");
    }

    //insert into db
    let hashedPwd = passwordHash.generate(req.body.password);
    let statement = 'insert into user (username, password) values (\"' + req.body.username + '\", \"' + hashedPwd + '\");'
    let query = connection.query(statement, function(err, result) {
      if(err){
        console.log("error to insert")
      }
    });

    res.status(201).send({
      success: true,
      data: {
        username: req.body.username,
        fullname: req.body.fullname,
        age: req.body.age,
        id_token: createToken({"author": "babyjazz naja\'"}),
      }
    });

  });
});


app.post('/login', function(req, res) {

  let statement = 'select * from user where username=' + JSON.stringify(req.body.username) + ' LIMIT 1';
  var query = connection.query(statement, function(err, result) {

    //validate req
    if (!req.body.username) {
      return res.status(400).send("You must send the username");
    }else if(!req.body.password){
      return res.status(400).send("You must send the password");
    }

    //if found username in database
    if (result[0] == null) {
      return res.status(401).send("The username or password don't match");
    }

    //if password match
    if (!passwordHash.verify(req.body.password, result[0].password)) {
      return res.status(401).send("The username or password don't match");
    }

    res.status(201).send({
      success: true,
      data: {
        username: result[0].username,
        fullname: result[0].fullname,
        age: result[0].age,
        id_token: createToken({"author": "babyjazz naja\'"}),
      }
    });

  });
});
