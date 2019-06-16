const express = require('express');
const router = express.Router(),
    path = require('path'),
    models = require('../../../models/'),
    _ = require('lodash'),
    maxAttempts = 10,
    mongoose = require('mongoose'),
    passport = require('passport'),
    axios = require('axios'),
    fs = require('fs'),
    // SparkPost = require('sparkpost'),
    isMod = (req, res, next) => {
        mongoose.model('User').findOne({
            _id: req.session.passport.user
        }, function (err, usr) {
            if (!err && usr.mod) {
                next();
            } else {
                res.status(403).send('err');
            }
        })
    };
// const oldUsers = JSON.parse(fs.readFileSync('oldUsers.json', 'utf-8'))
let sgApi;
if (fs.existsSync('sparky.json')) {
    sparkyConf = JSON.parse(fs.readFileSync('sparky.json', 'utf-8'));
} else {
    sparkyConf = {
        SPARKPOST_API_KEY: process.env.SPARKPOST_API_KEY,
        SPARKPOST_API_URL: process.env.SPARKPOST_API_URL,
        SPARKPOST_SANDBOX_DOMAIN: process.env.SPARKPOST_SANDBOX_DOMAIN,
        SPARKPOST_SMTP_HOST: process.env.SPARKPOST_SMTP_HOST,
        SPARKPOST_SMTP_PASSWORD: process.env.SPARKPOST_SMTP_PASSWORD,
        SPARKPOST_SMTP_PORT: process.env.SPARKPOST_SMTP_PORT,
        SPARKPOST_SMTP_USERNAME: process.env.SPARKPOST_SMTP_USERNAME,
        SENDGRID_API: process.env.SENDGRID_API
    }
}
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(sparkyConf.SENDGRID_API);


const routeExp = function (io, pp) {
    this.authbit = (req, res, next) => {
        if (!req.session || !req.session.passport || !req.session.passport.user) {
            //no passport userid
            res.status(401).send('err')
        } else {
            mongoose.model('User').findOne({
                _id: req.session.passport.user
            }, function (err, usr) {
                console.log(err,usr)
                if (!err && usr && !usr.isBanned && !usr.locked) {
                    usr.lastAction = new Date().toLocaleString();
                    usr.save((errsv,usv)=>{
                        // truncus('after auth and LA update, usr is',usv)
                        req.user = usv;
                        next();
                    })
                } else {
                    res.status(403).send('err');
                }
            })
        }
    };
    router.get('/getUsr', this.authbit, (req, res, next) => {
        res.send(req.user);
    });
    // router.get('/setDaveOkay',(req,res,next)=>{
    //     mongoose.model('User').findOne({'user':'dave'},(err,usr)=>{
    //         usr.confirmed=true;
    //         usr.mod=true;
    //         usr.save((erru,svu)=>{
    //             res.send(svu);
    //         })
    //     })
    // })
    router.get('/allUsrs', this.authbit, (req, res, next) => {
        mongoose.model('User').find({}, function (err, usrs) {
            const badStuff = ['msgs','salt','googleId','pass']
            res.send(_.cloneDeep(usrs).map(u => {
                //we wanna remove all the sensitive info
                badStuff.forEach(d=>{
                    if (!!u[d]){
                        delete u[d];
                    }
                })
                return u;
            }));
        })
    });
    router.get('/setOneRead', this.authbit, (req, res, next) => {
        if (!req.query.id) {
            res.send('err');
        }
        mongoose.model('User').findOne({
            _id: req.session.passport.user
        }, function (err, usr) {
            usr.msgs.filter(m => m._id == req.query.id)[0].read = true;
            usr.save((errsv, usrsv) => {
                res.send(usrsv);
            })
        })
    })
    router.get('/setAllRead', this.authbit, (req, res, next) => {
        if (!req.query.id) {
            res.send('err');
        }
        mongoose.model('User').findOne({
            _id: req.session.passport.user
        }, function (err, usr) {
            usr.msgs.forEach(m => m.read = true);
            usr.save((errsv, usrsv) => {
                res.send(usrsv);
            })
        })
    })
    router.get('/changeInterest', this.authbit, (req, res, next) => {
        mongoose.model('User').findOne({
            _id: req.session.passport.user
        }, function (err, usr) {
            console.log('INT status', req.query.act, 'FOR', parseInt(req.query.int), usr.ints, usr.ints[parseInt(req.query.int)], req.query.act == 'true')
            // usr.ints[parseInt(req.query.int)]= req.query.act=='true'?1:0;
            if (req.query.act == 'true') {
                usr.ints.set(req.query.int, 1)
            } else {
                usr.ints.set(req.query.int, 0)
            }
            console.log('USR NOW', usr, usr.ints)
            usr.save(function (errsv, usrsv) {
                console.log('USER AFTER SAVE', usrsv, 'ERR IS', errsv)
                res.send(usrsv);
            })
        })
    })
    router.get('/changeTz', this.authbit, (req, res, next) => {
        mongoose.model('User').findOne({
            _id: req.session.passport.user
        }, function (err, usr) {
            usr.tz = req.query.tz;
            console.log('USER TIME ZONE NOW', usr)
            usr.save((errsv, usrsv) => {
                res.send(usrsv)
            })
        })
    })
    router.post('/changeOther', this.authbit, (req, res, next) => {
        mongoose.model('User').findOne({
            _id: req.session.passport.user
        }, function (err, usr) {
            usr.otherInfo = req.body.other;
            usr.save((errsv, usrsv) => {
                res.send(usrsv);
            })
        })
    })
    router.post('/changeAva', this.authbit, (req, res, next) => {
        mongoose.model('User').findOne({
            _id: req.session.passport.user
        }, function (err, usr) {
            usr.avatar = req.body.img;
            console.log('USER NOW', req.body, usr)
            usr.save((errsv, usrsv) => {
                res.send(usrsv);
            })
        })
    })
    router.get('/charsFromAPI', this.authbit, (req, res, next) => {
        if (!req.query.api) {
            res.send('err');
        } else {
            // axios.get('https://api.guildwars2.com/v2/characters?access_token='+req.query.api,(e,r,b)=>{
            //     // res.send(b)
            //     console.log(b);
            //     const charProms = Array.from(b).map(ch=>axios.get(`https://api.guildwars2.com/v2/characters/${ch}?access_token=${req.query.api}`))
            //     Promise.all(charProms).then(r=>{
            //         res.send(r);
            //     })
            // })
            axios.get(`https://api.guildwars2.com/v2/characters?access_token=${req.query.api}`)
                .then(r => {
                    const charProms = Array.from(r.data).map(ch => axios.get(`https://api.guildwars2.com/v2/characters/${ch}?access_token=${req.query.api}`));
                    console.log(r.data, typeof r.data, charProms)
                    axios.get(`https://api.guildwars2.com/v2/characters/${r.data[0]}?access_token=${req.query.api}`)
                        .then(roc => {
                            console.log('FIRST CHAR', roc)
                        })
                    axios.all(charProms).then(rc => {
                        console.log('hi')
                        const allChars = rc.map(rcc => {
                            return {
                                name: rcc.data.name,
                                prof: rcc.data.profession,
                                race: rcc.data.race,
                                lvl: rcc.data.level
                            }
                        });
                        mongoose.model('User').findOneAndUpdate({
                            _id: req.session.passport.user
                        }, {
                            $set: {
                                chars: allChars
                            }
                        }, (errsv, respsv) => {
                            res.send(respsv)
                        })
                        // res.send(allChars);
                    })
                })
                .catch(e => {
                    res.send('err');
                })
        }
    })
    //character stuff (add, edit, delete)
    router.post('/addChar', this.authbit, (req, res, next) => {
        mongoose.model('User').findOne({
            _id: req.session.passport.user
        }, function (err, usr) {
            if (!usr.chars.findOne('name', req.body.name)) {
                usr.chars.push(req.body)
            }
            usr.save(function (err, ures) {
                res.send(ures);
            })
        })
    })
    router.post('/editChar', this.authbit, (req, res, next) => {
        mongoose.model('User').findOne({
            _id: req.session.passport.user
        }, function (err, usr) {
            const charPos = usr.chars.findOne('name', req.body.name);
            if (charPos !== false) {
                usr.chars[charPos] = req.body;
            }
            usr.save(function (err, ures) {
                res.send(ures);
            })
        })
    })
    router.get('/remChar', this.authbit, (req, res, next) => {
        mongoose.model('User').findOne({
            _id: req.session.passport.user
        }, function (err, usr) {
            const charPos = usr.chars.findOne('id', req.query.id)
            console.log('REMOVE CHAR', req.query, usr, charPos)
            if (!charPos && charPos !== 0) {
                res.status(400).send('err');
            } else {
                usr.chars.splice(charPos, 1);
                usr.save((err, usd) => {
                    res.send(usd);
                })
            }
        })
    })

    //admin stuff
    router.get('/makeMod', this.authbit, isMod, (req, res, next) => {
        mongoose.model('User').findOneAndUpdate({
            user: req.query.user
        }, {
            $set: {
                mod: true
            }
        }, function (err, nm) {
            mongoose.model('User').find({}, function (err, usrs) {
                const badStuff = ['msgs','salt','googleId','pass']
                res.send(_.cloneDeep(usrs).map(u => {
                    //we wanna remove all the sensitive info
                    badStuff.forEach(d=>{
                        if (!!u[d]){
                            delete u[d];
                        }
                    })
                    return u;
                }));
            })
        })
    })
    router.get('/toggleBan', this.authbit, isMod, (req, res, next) => {
        mongoose.model('User').findOne({
            user: req.query.user
        }, function (err, usr) {
            console.log('BANNING', req.query.user, usr)
            usr.isBanned = !usr.isBanned;
            usr.save(function (err, resp) {
                mongoose.model('User').find({}, function (err, usrs) {
                    const badStuff = ['msgs','salt','googleId','pass']
                    res.send(_.cloneDeep(usrs).map(u => {
                        //we wanna remove all the sensitive info
                        badStuff.forEach(d=>{
                            if (!!u[d]){
                                delete u[d];
                            }
                        })
                        return u;
                    }));
                })
            })
        })
    })
    //msg stuff
    router.post('/sendMsg', this.authbit, (req, res, next) => {
        //user sends message to another user
        console.log('SEND MSG', req.body)
        mongoose.model('User').findOne({
            'user': req.body.to
        }, function (err, usr) {
            if (!usr || err) {
                console.log(usr, err)
                res.send('err');
            } else {
                const msgId = Math.floor(Math.random() * 9999999999999999).toString(32);
                usr.msgs.push({
                    from: req.session.passport.user,
                    date: Date.now(),
                    msg: req.body.msg,
                    msgId: msgId
                })
                usr.save(function (err, usr) {
                    console.log('User updated!', usr, err)
                    mongoose.model('User').findOne({
                        user: req.session.passport.user
                    }, function (err, fusr) {
                        fusr.outBox.push({
                            to: req.body.to,
                            date: Date.now(),
                            msg: req.body.msg,
                            msgId: msgId
                        })
                        io.emit('sentMsg', {
                            user: req.body.to,
                            from: req.session.passport.user
                        })
                        fusr.save();
                    })
                    res.send('done');
                });
            }
        });
    });
    router.get('/delMsg', this.authbit, (req, res, next) => {
        //user deletes an old message sent TO them by user and id. this removes from inbox
        mongoose.model('User').findOne({
            _id: req.session.passport.user
        }, function (err, usr) {
            if (!usr || err) {
                res.send('err');
            } else {
                console.log('USER', usr.user, 'MSGS', usr.msgs, 'QUERY', req.query)
                for (var i = 0; i < usr.msgs.length; i++) {
                    if (usr.msgs[i]._id == req.query.id) {
                        usr.msgs.splice(i, 1);
                        break;
                    }
                }
                usr.save(function (err, usr) {
                    req.user = usr;
                    res.send(usr);
                })
            }
        })
    });
    router.get('/delMyMsg', this.authbit, (req, res, next) => {
        //user deletes an old message sent FROM them by user and id. This removes from outbox
        mongoose.model('User').findOne({
            _id: req.session.passport.user
        }, function (err, usr) {
            if (!usr || err) {
                res.send('err');
            } else {
                for (var i = 0; i < usr.outBox.length; i++) {
                    if (usr.outBox[i]._id == req.query.id) {
                        usr.outBox.splice(i, 1);
                        break;
                    }
                }
                usr.save(function (err, usr) {
                    req.user = usr;
                    res.send(usr);
                })
            }
        })
    });
    router.post('/repMsg', this.authbit, (req, res, next) => {
        //sends a message to all users flagged as 'mods' with message body, to, from
        mongoose.model('User').findOne({
            _id: req.session.passport.user
        }, (erru, usr) => {
            const theMsg = usr.msgs.filter(m => m._id == req.body._id)[0];
            if (theMsg.isRep) {
                res.send('dupRep');
                return false;
            }
            console.log(theMsg, '---THE MSG')
            theMsg.isRep = true;
            console.log("REPORTING MESSAGE", req.body)
            // console.log('SET ISREP TO TRUE: usr', usr, 'ID', req.body._id, 'MSG', usr.msgs.filter(m => m._id == req.body._id)[0])
            usr.save((errfrm, usrfrm) => {
                console.log('Saved FROM report', usrfrm, errfrm, 'ORIGINAL USER REPORTING', usr, 'END USER REPING')
                io.emit('sentMsg', {
                    user: req.user.user
                })
            });
            // throw new Error('err!')
            mongoose.model('User').find({
                mod: true
            }, (err, mods) => {
                //send to each of the mods
                mods.forEach(mod => {
                    mod.msgs.push({
                        from: 'System',
                        msg: `<h3>Reported Message</h3>
                    <br>Date:${new Date(req.body.date).toLocaleString()}
                    <br>From:${req.body.from}
                    <br>To:${req.user.user}
                    <br>Message:${req.body.msg}`,
                        date: Date.now()
                    });
                    mod.save();
                })
                //now find on the SENT (outbox) of sending user
                mongoose.model('User').findOne({
                    user: req.body.from
                }, (ferr, fusr) => {
                    console.log('tryin to find message');
                    let repd = fusr.outBox.filter(orp => orp.msgId == theMsg.msgId)[0];
                    console.log(repd, fusr);
                    repd.isRep = true;
                    fusr.save((oerr, ousr) => {
                        io.emit('sentMsg', {
                            user: req.body.from
                        })
                        res.send(usr);
                    })
                })
            })
        })
    })
    //end of msgs
    router.get('/confirm', this.authbit, isMod, (req, res, next) => {
        if (!req.query.u) {
            res.status(400).send('err')
        }
        //find user and confirm them, then resend all users
        //check for old user from before db wipe

        mongoose.model('User').findOne({
            'user': req.query.u
        }, function (err, usr) {
            if (err) {
                res.send(err);
            }
            console.log('user to confirm is', usr)
            let oldOrigUsr = oldUsers.find(u => u.user == req.query.u); //copy old users over so we dont have to
            usr.confirmed = true;
            if (oldOrigUsr) {
                console.log('Old user found! is', oldOrigUsr)
                usr.tz = oldOrigUsr.tz;
                usr.msgs = _.cloneDeep(oldOrigUsr.msgs);
                usr.chars = _.cloneDeep(oldOrigUsr.chars);
                usr.ints = _.cloneDeep(oldOrigUsr.ints);
                usr.lastLogin = oldOrigUsr.lastLogin;
                usr.otherInfo = oldOrigUsr.otherInfo;
                usr.avatar = oldOrigUsr.avatar;
                usr.outBox = oldOrigUsr.outBox;
                usr.mod = !!oldOrigUsr.mod;
                // um.create(oldOrigUsr, (err, nusr) => {
                //     res.send(nusr);
                // })
                // usr = oldOrigUsr;
            }
            usr.save((cerr, cusr) => {
                console.log('err saving conf usr', cerr, 'User', cusr)
                mongoose.model('User').find({}, function (err, usrs) {
                    const badStuff = ['msgs','salt','googleId','pass']
                    res.send(_.cloneDeep(usrs).map(u => {
                        //we wanna remove all the sensitive info
                        badStuff.forEach(d=>{
                            if (!!u[d]){
                                delete u[d];
                            }
                        })
                        return u;
                    }));
                })
            })
        })
    })
    router.get('/usrData',this.authbit, function (req, res, next) {
        res.send(req.user);
    });
    // router.get('/chkLog', (req, res, next) => {
    //     console.log(req.session)
    //     if (req.session && req.session.user) {
    //         delete req.session.user.pass;
    //         delete req.session.user.salt;
    //         delete req.session.user.reset;
    //         res.send(req.session.user)
    //     } else {
    //         res.send(false)
    //     }
    // })
    router.get('/nameOkay', function (req, res, next) {
        mongoose.model('User').find({
            'user': req.query.name
        }, function (err, user) {
            console.log('USER CHECK', user);
            res.send(!user.length)
        });
    });
    router.post('/editPwd', this.authbit, (req, res, next) => {
        mongoose.model('User').findOne({
            _id: req.session.passport.user
        }, function (err, usr) {
            if (usr && usr.correctPassword(req.body.old) && req.body.pwd == req.body.pwdDup) {
                console.log('got correct pwd, changing!')
                usr.salt = mongoose.model('User').generateSalt();
                usr.pass = mongoose.model('User').encryptPassword(req.body.pwd, usr.salt);
                usr.save((err, usrsv) => {
                    res.send(usrsv);
                })
            } else {
                res.send('err');
            }
        })
    })
    router.post('/new', function (req, res, next) {
        //record new user
        // mongoose.model('User').findOne({
        //     'user': req.body.user
        // }, function (err, usr) {
        //     if (usr || err) {
        //         //while this SHOULDNT occur, it's a final error check to make sure we're not overwriting a previous user.
        //         //Should we check for req.session?
        //         res.send('err')
        //     } else {
        //         const pwd = req.body.pass,
        //             um = mongoose.model('User');
        //         delete req.body.pass;
        //         console.log(req.body)
        //         req.body.ints = [0, 0, 0, 0, 0, 0];
        //         req.body.salt = um.generateSalt();
        //         req.body.pass = mongoose.model('User').encryptPassword(pwd, req.body.salt)
        //         um.create(req.body, (err, nusr) => {
        //             res.send(nusr);
        //         })
        //     }
        // })
        passport.authenticate('local-signup', function (err, user, info) {
            // truncus('err', err, 'usr', user, 'inf', info)
            if (err) {
                return res.status(400).send(err)
            }
            res.send('done')
        })(req, res, next);
    });
    // router.post('/login', function (req, res, next) {
    //         mongoose.model('User').findOne({
    //             'user': req.body.user
    //         }, function (err, usr) {
    //             if (!err && usr && !usr.isBanned && usr.correctPassword(req.body.pass)) {
    //                 const prevLog = usr.lastLogin;
    //                 usr.lastLogin = Date.now();
    //                 // usr.lastLogin=0;
    //                 const lastNews = fs.readFileSync('./news.txt', 'utf8').split(/\n/);
    //                 console.log('NEWS', lastNews, lastNews - prevLog);
    //                 let news = null;
    //                 if (Number(lastNews[0]) - prevLog > 1000) {
    //                     news = lastNews.slice(1).map(d => d.replace(/\r/, ''));
    //                 }
    //                 req.session.user = usr;
    //                 delete req.session.user.pass;
    //                 delete req.session.user.salt;
    //                 delete req.session.user.reset;
    //                 delete req.session.user.email;
    //                 usr.save((err, usrsv) => {
    //                     res.send({
    //                         usr: req.session.user,
    //                         news: news
    //                     })
    //                 })
    //             } else if (usr && usr.isBanned) {
    //                 res.send('banned')
    //             } else {
    //                 res.send('authErr');
    //             }
    //         })
    //     },
    //     function (err, req, res, next) {
    //         // handle error
    //         console.log(err)
    //         res.status(401).send('DIDNT WORK')
    //     });
    router.post('/login', function (req, res, next) {
        // truncus('req.body', req.body)
        if (!req.body || !req.body.pass || !req.body.user) {
            return res.send(false);
        }
        passport.authenticate('local-login', function (err, usr, info) {
            console.log('err', err, 'usr IS', usr, 'inf', info, 'pass candidate', req.body.pass, 'correct?')
            if (!info) {
                //wrong un/pwd combo
                mongoose.model('User').findOne({
                    'user': req.body.user
                }, (_err, usrwc) => {
                    if (!usrwc || usrwc.wrongAttempts < maxAttempts) {
                        return res.send(false);
                    }
                    usrwc.wrongAttempts = 0;
                    usrwc.locked = true; //too many incorrect attempts; lock account & wait for teacher;
                    refStu();
                    usrwc.save((_erru, _svu) => {
                        return res.status(403).send('banned');
                    })
                })
            } else {
                // const correctSchool = (usr.school === null || usr.school == config.MATHAPP_SCHOOL);
                if (usr && !usr.isBanned && !usr.locked && usr.confirmed) {
                    req.session.passport = {
                        user: usr._id
                    };
                    usr.pass = null;
                    usr.salt = null;
                    res.send(usr);
                }
                if (usr.isBanned) {
                    return res.status(403).send('banned');
                } else if (usr.locked) {
                    return res.status(403).send('locked')
                } else if (!usr.confirmed) {
                    return res.status(400).send('unconfirmed')
                } 
            }
        })(req, res, next);
    });
    router.get('/logout', function (req, res, next) {
        /*this function logs out the user. It has no confirmation stuff because
        1) this is on the backend
        2) this assumes the user has ALREADY said "yes", and
        3) logging out doesn't actually really require any credentials (it's logging IN that needs em!)
        */
        console.log('usr sez bai');
        req.session.destroy();
        res.send('logged');
    });
    router.post('/forgot', function (req, res, next) {
        //user enters password, requests reset email
        //this IS call-able without credentials, but
        //as all it does is send out a reset email, this
        //shouldn't be an issue
        mongoose.model('User').findOne({
            user: req.body.user
        }, function (err, usr) {
            console.log(err, usr, req.body)
            if (!usr || err) {
                res.send('err');
                return;
            } else {
                let jrrToken = Math.floor(Math.random() * 99999).toString(32);
                for (var i = 0; i < 15; i++) {
                    jrrToken += Math.floor(Math.random() * 99999).toString(32);
                }
                if (!usr.email) {
                    res.send('err');
                    return false;
                }
                console.log(jrrToken)
                //req.protocol,req.get('host')
                const resetUrl = req.protocol + '://' + req.get('host') + '/user/reset?key=' + jrrToken;
                usr.reset = jrrToken;
                usr.save(function () {
                    const msg = {
                        to: usr.email,
                        from: 'no-reply@htgeo.herokuapp.com',
                        subject: 'Password Reset',
                        text: 'Someone (hopefully you!) requested a reset email for your Hidden Tyria Geographic Society [GEO] account. If you did not request this, just ignore this email. Otherwise, go to ' + resetUrl + '!',
                        html: 'Someone (hopefully you!) requested a reset email for your Hidden Tyria Geographic Society [GEO] account. <br>If you did not request this, just ignore this email.<br>Otherwise, click <a href="' + resetUrl + '">here</a>',
                    };
                    sgMail.send(msg);
                    res.end('done')
                });
            }
        })
    });

    router.get('/reset', function (req, res, next) {
        //trying to get reset page using req.query. incorrect token leads to resetFail
        var rst = req.query.key;
        if (!rst) {
            console.log('NO KEY!')
            res.sendFile('resetFail.html', {
                root: './views'
            });
        } else {
            mongoose.model('User').findOne({
                reset: rst
            }, function (err, usr) {
                if (err || !usr) {
                    console.log('NO USER!')
                    res.sendFile('resetFail.html', {
                        root: './views'
                    });
                }
                res.sendFile('reset.html', {
                    root: './views'
                });
            })
        }
    });
    router.get('/resetUsr', function (req, res, next) {
        // get user info by key for the reset.html page
        var rst = req.query.key;
        if (!rst) {
            res.send('err');
        } else {
            console.log('lookin for key:', rst)
            mongoose.model('User').findOne({
                reset: rst
            }, function (err, usr) {
                if (err || !usr) {
                    res.send('err');
                } else {
                    res.send(usr);
                }
            })
        }
    });
    router.post('/resetPwd/', function (req, res, next) {
        if (!req.body.acct || !req.body.pwd || !req.body.key || !req.body.pwdDup || (req.body.pwdDup != req.body.pwd)) {
            res.send('err');
        } else {
            mongoose.model('User').findOne({
                reset: req.body.key
            }, function (err, usr) {
                if (err || !usr || usr.user !== req.body.acct) {
                    res.send('err');
                } else {
                    console.log('usr before set:', usr)
                    // usr.setPassword(req.body.pwd, function() {
                    usr.salt = mongoose.model('User').generateSalt();
                    usr.pass = mongoose.model('User').encryptPassword(req.body.pwd, usr.salt)
                    console.log('usr after set:', usr)
                    // usr.reset = null;
                    usr.save();
                    res.send('done')
                    // });
                }
            })
        }
    })
    router.get('/setEmail', authbit, (req, res, next) => {
        ///(\w+\.*)+@(\w+\.)+\w+/g
        ///(\w+\.*)+@(\w*)(\.\w+)+/g
        if (!req.query.email || !req.query.email.match(/(\w+\.*)+@(\w+\.)+\w+/g) || (req.query.email.match(/(\w+\.*)+@(\w+\.)+\w+/g)[0].length !== req.query.email.length)) {
            res.send('err');
            return false;
        }
        mongoose.model('User').findOne({
            _id: req.session.passport.user
        }, function (err, usr) {
            usr.email = req.query.email;
            usr.save((errsv, usrsv) => {
                res.send(usrsv);
            })
        })
    })
    router.get('/google', passport.authenticate('google-signup', {
        scope: ['profile']
    }));
    router.get('/googleRedir', passport.authenticate('google-signup', {
        failureRedirect: '../login?dup'
    }), (req, res) => {
        mongoose.model('User').findOne({
            _id: req.session.passport.user
        }, function (_err, usr) {
            //make sure we're in the right school
            // truncus('USER FOUND VIA REDIRECT:', usr, 'SCHOOL', config.MATHAPP_SCHOOL)
            // truncus('REQ IS',req,'GET REQT')
            // res.send('SEE CONSOLE!')
            res.redirect('../')
        });
    });
    return router;
}

module.exports = routeExp;