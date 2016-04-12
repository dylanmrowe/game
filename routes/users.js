var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var User = mongoose.model('User');
var hash = require('password-hash');


/* GET users listing. */
router.get('/get/all', function (req, res, next) {
    User.find(function (err, users) {
        if (err) {
            return next(err);
        }
        res.json(users);
    });
});


/* GET users listing. */
router.get('/verify', function (req, res, next) {

    if (req.cookies.id == undefined || req.cookies.id == '') {
        res.sendStatus(206);
        return;
    }

    User.findById(req.cookies.id, "user deaths hits kills shots", function (err, user) {
        console.log(user);
        if (err) {
            console.log(err);
            return next(err);
        } else if (user == null) {
            res.sendStatus(206);
        } else {
            res.json(user);
        }
    });
});


/* POST new user. */
router.post('/add', function (req, res, next) {
    var check = {
        user: req.body.user
    };

    User.find(check, function (err, user) { //Check availability of username
        if (err) {
            return next(err);
        } else if (user.length > 0) {
            res.sendStatus(204);
            return;

        } else { //If username doesn't exist, add
            var temp = req.body;
            temp.passHash = hash.generate(temp.passHash);

            console.log(temp);

            var user = new User(temp);
            user.save(function (err, user) {
                if (err) {
                    return next(err);
                }
                res.json(user);
            });
        }
    });
});


/* POST login. */
router.post('/login', function (req, res, next) {

    var temp = {
        user: req.body.user
    }

    User.find(temp, function (err, user) {
        if (err) {
            return next(err);
        } else if (user.length < 1) {
            res.sendStatus(204);
        } else if (hash.verify(req.body.passHash, user[0].passHash)) {
            res.json(user[0]);
        } else {
            res.sendStatus(206);
        }
    });
});


router.post('/upkill', function (req, res, next) {
    User.findById(req.cookies.id, function (err, user) {
        user.upkill(function (err, user) {
            if (err) {
                return next(err);
            }
            res.sendStatus(200);
        });
    });
});

router.post('/updeath', function (req, res, next) {
    User.findById(req.cookies.id, function (err, user) {
        user.updeath(function (err, user) {
            if (err) {
                return next(err);
            }
            res.sendStatus(200);
        });
    });
});

router.post('/uphit', function (req, res, next) {
    User.findById(req.cookies.id, function (err, user) {
        user.uphit(function (err, user) {
            if (err) {
                return next(err);
            }
            res.sendStatus(200);
        });
    });
});

router.post('/upshot', function (req, res, next) {
    User.findById(req.cookies.id, function (err, user) {
        user.upshot(function (err, user) {
            if (err) {
                return next(err);
            }
            res.sendStatus(200);
        });
    });
});

module.exports = router;