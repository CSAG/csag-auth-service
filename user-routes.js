var express = require('express'),
    _ = require('lodash'),
    config = require('./config'),
    jwt = require('jsonwebtoken');
var passwordHash = require('password-hash');
var pg = require('pg');
var path = require('path');
var connectionString = process.env.DATABASE_URL || 'postgres://'+config.user+':'+config.pass+'@localhost:5432/'+config.database;
var connection = new pg.Client(connectionString);
connection.connect();

pg.connect(connectionString, (err, connection, done) => {
    // Handle connection errors
    if (err) {
        done();
        console.log(err);
        return res.status(500).json({success: false, data: err});
    }
});

var app = module.exports = express.Router();


function createToken(user) {
    return jwt.sign(_.omit(user, 'password'), config.secret, {expiresIn: 60 * 60 * 5});
}


app.post('/register', function (req, res) {

    //Validate request
    if (!req.body.email || !req.body.password || !req.body.firstname || !req.body.lastname || !req.body.tel || !req.body.birthday || !req.body.gender) {
        return res.status(400).send("You must send the email,password,firstname,lastname,tel,birthday,gender");
    }

    //Check if already exists
    let statement = "select * from public.user where email='" + req.body.email + "'";
    let query = connection.query(statement, function (err, result) {
        if (result.rowCount != 0) {
            return res.status(400).send("A user with that email already exists");
        }

        //insert into db
        let hashedPwd = passwordHash.generate(req.body.password);
        let statement = "insert into public.user (email, password,firstname,lastname,tel,birthday,gender) values ('" + req.body.email + "', '" + hashedPwd + "','" + req.body.firstname + "','" + req.body.lastname + "','" + req.body.tel + "','" + req.body.birthday + "','" + req.body.gender + "');"
        let query = connection.query(statement);

        res.status(201).send({
            success: true,
            data: {
                username: req.body.email,
                firstname: req.body.firstname,
                lastname: req.body.lastname,
                tel: req.body.tel,
                birthday: req.body.birthday,
                gender: req.body.gender,
                token: createToken({"author": "CSAG \'"}),
            }
        });

    });
});


app.post('/login', function (req, res) {

    let statement = "select * from public.user where email='" + (req.body.email) + "'";
    var query = connection.query(statement, function (err, result) {

        //validate req
        if (!req.body.email) {
            return res.status(400).send("You must send the email");
        } else if (!req.body.password) {
            return res.status(400).send("You must send the password");
        }

        //if found username in database
        if (result.rowCount == 0) {
            return res.status(401).send("The email don't match");
        }
        //if password match
        if (!passwordHash.verify(req.body.password, result.rows[0].password.trim())) {
            return res.status(401).send("The  password don't match");
        }

        res.status(201).send({
            success: true,
            data: {
                username: result.rows[0].email.trim(),
                firstname: result.rows[0].firstname.trim(),
                lastname: result.rows[0].lastname.trim(),
                tel: result.rows[0].tel.trim(),
                birthday: result.rows[0].birthday.trim(),
                gender:result.rows[0].gender.trim(),
                token: createToken({"author": "CSAG \'"}),
            }
        });

    });
});
