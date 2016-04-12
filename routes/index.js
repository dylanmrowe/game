var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/game', function (req, res, next) {
    res.sendFile('index.html', {
        root: 'public'
    });
});

router.get('/login', function (req, res, next) {
    res.sendFile('login.html', {
        root: 'public'
    });
});

router.get('/', function (req, res, next) {
    res.sendFile('index.html', {
        root: 'public'
    });
});

module.exports = router;