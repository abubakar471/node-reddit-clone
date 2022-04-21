const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const hbs = require('hbs');
require('dotenv').config();

app.set('view engine', 'hbs');
hbs.registerPartials(__dirname + '/views/layouts');

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : true}));

app.get('/', (req,res) => {
    res.render('home');
})

app.listen(3000, () => console.log('server is running on port 3000'))