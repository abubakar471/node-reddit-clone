const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const hbs = require('hbs');
const PORT = process.env.PORT || 3000;
const DATABASE = process.env.DATABASE || 'mongodb://localhost:27017/node-reddit-clone';
require('dotenv').config();

const Post = require('./models/Post');

// database
mongoose.connect(DATABASE)
    .then(() => console.log('successfully connected to the database'))
    .catch((err) => console.log('database error => %s', err))

app.set('view engine', 'hbs');
hbs.registerPartials(__dirname + '/views/layouts');

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended : true}));

app.get('/', (req,res) => {
    Post.find({}).lean()
        .then((posts) => {
            res.render('posts_index',{
                posts
            })
        })
        .catch((err) => {
            console.log(err.message);
        })
});
app.get('/posts/new', (req,res) => {
    res.render('posts_new',{
        pageTitle : "New post"
    })
})
app.post('/posts/new', (req,res) => {
    const {title, url, summary} = req.body;
    if(!title || !url || !summary){
        res.render('posts_new',{
            pageTitle : "New post",
            message : "please fill all fields"
        })
    }
    var newPost = new Post({title, url, summary});
    newPost.save();
    res.redirect('/');
})

app.listen(PORT, () => console.log('server is running on port %s',PORT));