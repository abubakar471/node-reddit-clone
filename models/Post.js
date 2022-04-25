const mongoose = require('mongoose');
require('./Comment');
const postSchema = new mongoose.Schema({
    title: { type: String, required: true },
    url: { type: String, required: true },
    summary: { type: String, required: true },
    subreddit: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }]
}, {
    timestamps: true
})

const Post = mongoose.model('posts', postSchema);

module.exports = Post;