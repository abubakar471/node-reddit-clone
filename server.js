const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const hbs = require('hbs');
const PORT = process.env.PORT || 3000;
const DATABASE = process.env.DATABASE || 'mongodb://localhost:27017/node-reddit-clone';
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
require('dotenv').config();
const app = express();

const checkAuth = (req, res, next) => {
    console.log('checking authentication');
    if (typeof req.cookies.nToken === 'undefined' || req.cookies.nToken === null) {
        req.user = null;
        console.log('no token')
    } else {
        const token = req.cookies.nToken;
        const decodedToken = jwt.decode(token, { complete: true }) || {};
        console.log('token found')
        req.user = decodedToken.payload;
    }

    next();
}

// middlewares
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(checkAuth);

// database
mongoose.connect('mongodb://localhost:27017/node-reddit-clone')
    .then(() => console.log('successfully connected to the database'))
    .catch((err) => console.log('database error => %s', err))

mongoose.connection.on('error', console.error.bind(console, 'MongoDB connection Error:'));
mongoose.set('debug', true);
// schema models
const Post = require('./models/Post');
const Comment = require('./models/Comment');
const User = require('./models/User');

// view engine
app.set('view engine', 'hbs');
hbs.registerPartials(__dirname + '/views/layouts');
hbs.registerHelper('dateFormat', require('handlebars-dateformat'));
// routes
app.get('/', async (req, res) => {
    const currentUser = req.user;
    
    Post.find({}).lean().sort({ 'createdAt': -1 })
        .then((posts) => {
            res.render('posts_index', {
                posts,
                currentUser
            })
        })
        .catch((err) => {
            console.log(err.message);
        })
});
app.get('/posts/new', (req, res) => {
    const currentUser = req.user;
    if (currentUser) {
        res.render('posts_new', {
            pageTitle: "New post",
            currentUser
        })
    } else {
        res.render('sign_in', {
            pageTitle: "sign in to your account"
        })
    }

})
app.get('/posts/:id', (req, res) => {
    const currentUser = req.user;

    Post.findById(req.params.id).lean()
        .populate('comments').populate('author')
        .then((post) => {
            console.log(post);
            res.render('post_show', { post, currentUser });
        })
        .catch((err) => {
            console.log(err.message);
        });
});

app.get('/n/:subreddit', (req, res) => {
    const currentUser = req.user;
    const { subreddit } = req.params;
    Post.find({ subreddit }).lean().populate('author')
      .then((posts) => res.render('posts_index', { posts, currentUser }))
      .catch((err) => {
        console.log(err);
      });
  })


app.get('/signup', (req, res) => {
    res.render('sign_up', {
        pageTitle: "create a new account"
    })
})
app.get('/signin', async (req, res) => {
    res.render('sign_in', {
        pageTitle: "sign_in"
    })
})
app.get('/signout', (req, res) => {
    res.clearCookie('nToken');
    res.redirect('/');
})
app.post('/posts/new', (req, res) => {
    const { title, url, summary, subreddit } = req.body;

    if (!title || !url || !summary || !subreddit) {
        res.render('posts_new', {
            pageTitle: "New post",
            message: "please fill all fields"
        })
    }

    if (req.user) {
        const userId = req.user._id;
        var newPost = new Post({ title, url, summary, subreddit });
        newPost.author = userId;
      
        newPost
            .save()
            .then(() => User.findById(userId))
            .then((user) => {
                user.posts.unshift(newPost);
                user.save();
                // REDIRECT TO THE NEW POST
                return res.redirect(`/posts/${newPost._id}`);
            })
            .catch((err) => {
                console.log(err.message);
            });
    } else {
        res.render('sign_in', {
            pageTitle: 'Sign in to your account'
        })
    }

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
        .then(() => res.redirect('/posts/' + req.params.postId))
        .catch((err) => {
            console.log(err);
        });
});

app.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;
    var users = await User.find({});
    var user = await User.findOne({ 'email': email });
    if (user) {
        res.render('sign_up', {
            pageTitle: 'create a new account',
            message: 'email already exists. please sign in to continue.',
            classList: 'danger-msg'
        })
    } else {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        var newUser = new User({ username, email, password: hashedPassword });
        await newUser.save()
            .then((user) => {
                console.log(user);
                const token = jwt.sign(
                    { _id: user._id },
                    process.env.SECRET,
                    { expiresIn: '60 days' }
                );
                console.log(token);
                res.cookie('nToken', token, { maxAge: 900000, httpOnly: true });
                return res.redirect('/')

            })
            .catch(err => console.log(err))
        // req.session.user = newUser;
        // res.redirect('/home_dashboard');
        // res.render('sign_in', {
        //     pageTitle: "sign_in",
        //     message: "successfully registered user. please login to continue",
        //     classList: 'success-msg'
        // })
        // console.log('user registered');
    }
})
app.post('/signin', async (req, res) => {
    const { email, password } = req.body;
    const encPassword = await bcrypt.hash(password, 10);

    if (!email || !password) {
        res.render('sign_in', {
            pageTitle: 'sign in',
            classList: 'danger-msg',
            message: "please fill all of the fields"
        })
    }
    try {
        var user = await User.findOne({ 'email': email });


        if (user) {
            if (await bcrypt.compare(password, user.password)) {
                // req.session.user = user;
                const token = jwt.sign({ _id: user._id, username: user.username }, process.env.SECRET, {
                    expiresIn: '60 days',
                });
                // Set a cookie and redirect to root
                res.cookie('nToken', token, { maxAge: 900000, httpOnly: true });
                res.redirect('/');
            } else {
                res.render('sign_in', {
                    pageTitle: 'sign in',
                    classList: 'danger-msg',
                    message: "incorrect password"
                })
            }
        } else {
            res.render('sign_in', {
                pageTitle: 'sign in',
                message: 'Invalid email or password',
                classList: "danger-msg"
            })
        }

    } catch (e) {
        console.log(e);
    }
})

app.listen(PORT, () => console.log('server is running on port %s', PORT));