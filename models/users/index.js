const mongoose = require('mongoose'),
    crypto = require('crypto'),
    passportLocalMongoose = require('passport-local-mongoose');

const usrSchema = new mongoose.Schema({
    user: String, //(user)name of the user,
    pass: String,
    email: String,
    salt: String,
    otherInfo: String,
    reset: String,
    avatar: String, //base64 avatar
    isBanned: {
        type: Boolean,
        default: false
    },
    locked: {
        type: Boolean,
        default: false
    },
    mod: {
        type: Boolean,
        default: false
    }, //only mods can sticky/unsticky and lock/unlock threds
    confirmed: {
        type: Boolean,
        default: false
    },
    chars: [{
        name: String,
        prof: String,
        race: String,
        lvl: {
            type: Number,
            default: 80
        },
        other: String
    }],
    msgs: [{
        //private messages
        from: String,
        date: Number,
        msg: String,
        isRep: {
            type: Boolean,
            default: false
        },
        read: {
            type: Boolean,
            default: false
        },
        msgId: String
    }],
    outBox: [{
        to: String,
        date: Number,
        msg: String,
        isRep: {
            type: Boolean,
            default: false
        },
        read: {
            type: Boolean,
            default: false
        },
        msgId: String
    }],
    tz: {
        type: Number,
        default: -5
    },
    ints: [{
        type: Number,
        default: 0
    }],
    lastLogin:{type:String,default:Date.now()},
    wrongAttempts: { type: Number, default: 0 },

}, {
    collection: 'User'
});

// usrSchema.plugin(passportLocalMongoose, {
//     usernameField: 'user',
//     hashField: 'pass',
//     lastLoginField: 'lastLogin'
// });
const generateSalt = function () {
        return crypto.randomBytes(16).toString('base64');
    },
    encryptPassword = function (plainText, salt) {
        console.log('PASSWORD', plainText, salt)
        var hash = crypto.createHash('sha1');
        hash.update(plainText);
        hash.update(salt);
        return hash.digest('hex');
    };
usrSchema.statics.generateSalt = generateSalt;
usrSchema.statics.encryptPassword = encryptPassword;
usrSchema.methods.correctPassword = function (candidatePassword) {
    console.log('slt', this.salt, 'and their pwd:', this.pass)
    return encryptPassword(candidatePassword, this.salt) === this.pass;
};

const User = mongoose.model('User', usrSchema);
module.exports = User;