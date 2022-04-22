const mongoose = require('mongoose');

const postSchema = mongoose.Schema({
    title: { type: String, required: true },
    url: { type: String, required: true },
    summary: { type: String, required: true }      
},{
    timestamps : true
})

const Post = mongoose.model('posts', postSchema);

module.exports = Post;