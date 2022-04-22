const mongoose = require('mongoose');
const { Schema } = require('mongoose');
const Comment = require('./Comment');
const postSchema = new mongoose.Schema({
    title: { type: String, required: true },
    url: { type: String, required: true },
    summary: { type: String, required: true },
    subreddit: { type: String, required: true },
    comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }]
}, {
    timestamps: true
})

const Post = mongoose.model('posts', postSchema);

module.exports = Post;