var mongoose = require('mongoose');
var userSchema = new mongoose.Schema({
    user: String,
    passHash: String,
    kills: {
        type: Number,
        default: 0
    },
    deaths: {
        type: Number,
        default: 0
    },
    hits: {
        type: Number,
        default: 0
    },
    shots: {
        type: Number,
        default: 0
    }
});

userSchema.methods.upkill = function (e) {
    this.kills += 1;
    this.save(e);
};

userSchema.methods.updeath = function (e) {
    this.deaths += 1;
    this.save(e);
};

userSchema.methods.uphit = function (e) {
    this.hits += 1;
    this.save(e);
};

userSchema.methods.upshot = function (e) {
    this.shots += 1;
    this.save(e);
};

mongoose.model('User', userSchema);