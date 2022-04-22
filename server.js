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

// database
mongoose.connect(DATABASE)
    .then(() => console.log('successfully connected to the database'))
    .catch((err) => console.log('database error => %s', err))

// schema models
const Post = require('./models/Post');
const Comment = require('./models/Comment');



app.set('view engine', 'hbs');
hbs.registerPartials(__dirname + '/views/layouts');

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', async (req, res) => {
    Post.find({}).lean().sort({ 'createdAt': -1 })
        .then((posts) => {
            res.render('posts_index', {
                posts
            })
        })
        .catch((err) => {
            console.log(err.message);
        })
});
app.get('/posts/new', (req, res) => {
    res.render('posts_new', {
        pageTitle: "New post"
    })
})
app.get('/posts/:id', async (req, res) => {
    var url = req.params.id;
    Post
        .findById(req.params.id).lean().populate('comments')
        .then((post) => {
            console.log(post);
            res.render('post_show', { 
                post 
            })
        })
        .catch((err) => {
            console.log(err.message);
        });
})
app.get('/n/:subreddit', (req, res) => {
    Post.find({ 'subreddit': req.params.subreddit }).lean()
        .then((posts) => {
            res.render('posts_index', {
                posts
            })
        })
        .catch((err) => console.log(err))
})
app.post('/posts/new', (req, res) => {
    const { title, url, summary, subreddit } = req.body;
    if (!title || !url || !summary || !subreddit) {
        res.render('posts_new', {
            pageTitle: "New post",
            message: "please fill all fields"
        })
    }
    var newPost = new Post({ title, url, summary, subreddit });
    newPost.save();
    res.redirect('/');
})


// CREATE Comment
app.post('/posts/:postId/comments', (req, res) => {
    // INSTANTIATE INSTANCE OF MODEL
    const comment = new Comment(req.body);

    // SAVE INSTANCE OF Comment MODEL TO DB
    comment
        .save()
        .then(() => Post.findById(req.params.postId))
        .then((post) => {
            post.comments.unshift(comment);
            return post.save();
        })
        .then(() => res.redirect('/'))
        .catch((err) => {
            console.log(err);
        });
});

app.listen(PORT, () => console.log('server is running on port %s', PORT));