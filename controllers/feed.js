exports.getPosts = (req, res, next) => {
    res.status(200).json({
        posts: [{title: 'First post', content: 'This is the first post'}]
    });
}

exports.postPosts = (req, res, next) => {
    const title = req.body.title;
    const content = req.body.content;
    // create post in db
    res.status(201).json({
        message: 'Post created',
        post: {id: new Date().toISOString(), title: title, content: content}
    })
}