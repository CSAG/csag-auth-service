var express = require('express'),
    _       = require('lodash'),
    config  = require('./config'),
    jwt     = require('jsonwebtoken');
var passwordHash = require('password-hash');
var pg = require('pg');
var path = require('path');
var connectionString = process.env.DATABASE_URL || 'postgres://postgres:123456@localhost:5432/csagauth';
var connection = new pg.Client(connectionString);
connection.connect();

pg.connect(connectionString, (err, connection, done) => {
    // Handle connection errors
    if(err) {
        done();
        console.log(err);
        return res.status(500).json({success: false, data: err});
    }});

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
  let statement = "select * from public.user where username='" + req.body.username + "'";
  let query = connection.query(statement, function(err, result) {
   if (result.rowCount != 0) {
      return res.status(400).send("A user with that username already exists");
   }

    //insert into db
    let hashedPwd = passwordHash.generate(req.body.password);
    let statement = "insert into public.user (username, password,fullname) values ('" + req.body.username + "', '" + hashedPwd + "','"+req.body.fullname+"');"
    let query = connection.query(statement);

    res.status(201).send({
      success: true,
      data: {
        username: req.body.username,
        fullname: req.body.fullname,
        age: req.body.age,
        token: createToken({"author": "CSAG \'"}),
      }
    });

  });
});


app.post('/login', function(req, res) {

  let statement = "select * from public.user where username='" + (req.body.username) + "'";
  var query = connection.query(statement, function(err, result) {

    //validate req
    if (!req.body.username) {
      return res.status(400).send("You must send the username");
    }else if(!req.body.password){
      return res.status(400).send("You must send the password");
    }

    //if found username in database
    if (result.rowCount == 0) {
      return res.status(401).send("The username don't match");
    }
    //if password match
    if (!passwordHash.verify(req.body.password, result.rows[0].password.trim())) {
      return res.status(401).send("The  password don't match");
    }

    res.status(201).send({
      success: true,
      data: {
        username: result.rows[0].username.trim(),
        fullname: result.rows[0].fullname.trim(),
        age: result.rows[0].age,
        token: createToken({"author": "CSAG \'"}),
      }
    });

  });
});
