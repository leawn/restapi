const User = require('../models/user');
const path = require('path');
const fs = require('fs');
const Post = require('../models/post');
const { validationResult } = require('express-validator/check');
const io = require('../socket');

exports.getPosts = (req, res, next) => {
    const currentPage = req.query.page || 1;
    const perPage = 2;
    let totalItems;
    Post
        .find()
        .countDocuments()
        .then(count => {
            totalItems = count;
            return Post
                .find()
                .populate('creator')
                .sort({
                    createdAt: -1
                })
                .skip((currentPage - 1) * perPage)
                .limit(perPage);
        })
        .then(posts => {
            res
                .status(200)
                .json({
                    message: 'Fetched posts successfully.',
                    posts: posts,
                    totalItems: totalItems
                });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        })
    /*Post
        .find()
        .then(posts => {
            res
                .status(200)
                .json({
                    message: 'Fetched posts successfully',
                    posts: posts
                },);
        })
        .catch(err => {
            if (!err.statusCode) { //need to refactor in a single function!
                err.statusCode = 500;
            }
            next(err);
        });*/
    /*res.status(200).json({
        posts: [{
            _id: '1',
            title: 'First post',
            content: 'This is the first post',
            imageUrl: 'images/theodor.jpg',
            creator: {
                name: 'Leo'
            },
            createdAt: new Date()
        }]
    });*/
}

exports.postPosts = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed, entered data is incorrect');
        error.statusCode = 422;
        throw error;
        /*return res
            .status(422)
            .json({
                message: 'Validation failed, entered data is incorrect',
                errors: errors.array()
            });*/
    }
    if (!req.file) {
        const error = new Error('No image provided');
        error.statusCode = 422;
        throw error;
    }
    const imageUrl = req.file.path;
    const title = req.body.title;
    const content = req.body.content;
    let creator;
    const post = new Post({
        title: title,
        content: content,
        imageUrl: imageUrl,
        creator: req.userId
    });
    post
        .save()
        .then(result => {
            return User.findById(req.userId)
        })
        .then(user => {
            creator = user;
            user.posts.push(post);
            userInfo = user;
            return user.save();
        })
        .then(() => {
            io
                .getIO()
                .emit('posts', {
                    action: 'create',
                    post: {
                        ...post._doc,
                        creator: {
                            _id: req.userId,
                            name: creator.name
                        }
                    }
                });
            res.status(201).json({
                message: 'Post created',
                post: post,
                creator: {
                    _id: creator._id,
                    name: creator.name
                }
            });
        })
        .catch(err => {
            if (!err.statusCode) { //need to refactor in a single function!
                err.statusCode = 500;
            }
            next(err);
    });
}

exports.getPost = (req, res, next) => {
    const postId = req.params.postId;
    Post
        .findById(postId)
        .then(post => {
            if (!post) {
                const error = new Error('Could not find post.');
                error.statusCode = 404;
                throw error;
            }
            res.status(200).json({
                message: 'Post fetched',
                post: post
            });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        })
}

exports.updatePost = (req, res, next) => {
    const postId = req.params.postId;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed, entered data is incorrect');
        error.statusCode = 422;
        throw error;
    }
    const title = req.body.title;
    const content = req.body.content;
    let imageUrl = req.body.image;
    if (req.file) {
        imageUrl = req.file.path;
    }
    if (!imageUrl) {
        const error = new Error('No file picked');
        error.statusCode = 422;
        throw error;
    }
    Post
        .findById(postId)
        .populate('creator')
        .then(post => {
            if (!post) {
                const error = new Error('Could not find post.');
                error.statusCode = 404;
                throw error;
            }
            if (post.creator._id.toString() !== req.userId) {
                const error = new Error('Not authorized');
                error.statusCode = 403;
                throw error;
            }
            if (imageUrl !== post.imageUrl) {
                clearImage(post.imageUrl);
            }
            post.title = title;
            post.imageUrl = imageUrl;
            post.content = content;
            return post.save();
        })
        .then(result => {
            io
                .getIO()
                .emit('posts', {
                    action: 'update',
                    post: result
                });
            res
                .status(200)
                .json({
                    message: 'Post updated!',
                    post: result
                });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        })
}

exports.deletePost = (req, res, next) => {
    const postId = req.params.postId;
    Post
        .findById(postId)
        .then(post => {
            if (!post) {
                const error = new Error('Could not find post.');
                error.statusCode = 404;
                throw error;
            }
            if (post.creator.toString() !== req.userId) { //don't forget to refactor later
                const error = new Error('Not authorized');
                error.statusCode = 403;
                throw error;
            }
            //check
            clearImage(post.imageUrl);
            return Post.findByIdAndRemove(postId);
        })
        .then(() => {
            return User.findById(req.userId);
        })
        .then(user => {
            user.posts.pull(postId);
            return user.save();
        })
        .then(() => {
            io
                .getIO()
                .emit('posts', {
                    action: 'delete',
                    post: postId
                })
            res
                .status(200)
                .json({
                    message: 'Deleted post'
                });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
}

const clearImage = filePath => {
    filePath = path.join(__dirname, '../', filePath);
    fs.unlink(filePath, err => {
        console.log(err);
    })
}