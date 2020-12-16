const User = require('../models/user');

exports.statusGet = (req, res, next) => {
    const userId = req.userId;
    User
        .findById(userId)
        .then(user => {
            if (!user) {
                console.log(user);
                const error = new Error('Could not find user')
                error.statusCode = 403;
                throw error;
            }
            res
                .status(200)
                .json({
                    message: 'Status fetched',
                    status: user.status
                });
        })
        .catch(err => {
            console.log(err);
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
}

exports.statusUpdate = (req, res, next) => {
    const userId = req.userId;
    const status = req.body.status;
    User
        .findById(userId)
        .then(user => {
            if (!user) {
                const error = new Error('A user with that email could not be found');
                error.statusCode = 401;
                throw error;
            }
            user.status = status;
            return user.save();
        })
        .then((result) => {
            res
                .status(201)
                .json({
                    message: 'Updated status',
                    status: status
                })
        })
        .catch(err => {
            console.log(req.body.status)
            console.log(req.body)
            console.log(req)
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
}