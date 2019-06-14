const express = require('express'),
    router = express.Router(),
    path = require('path'),
    models = require('../../../models/'),
    async = require('async'),
    mongoose = require('mongoose'),
    session = require('express-session'),
    maxMsgLen = 50,
    authbit = (req, res, next) => {
        if (req.session && req.session.user && req.session.user._id) {
            if (req.session.user.isBanned) {
                res.status(403).send('banned');
            }
            next();
        } else {
            res.status(401).send('err')
        }
    },
    isMod = (req, res, next) => {
        mongoose.model('User').findOne({ user: req.session.user.user }, function(err, usr) {
            if (!err && usr.mod) {
                next();
            } else {
                res.status(403).send('err');
            }
        })
    };
mongoose.Promise

const routeExp = function(io) {
    //TODO: need way to only let admins (?) add events. All others should get rejected?
    router.post('/new', authbit, (req, res, next) => {
        req.body.user = req.session.user.user;
        mongoose.model('cal').create(req.body, function(err, resp) {
            io.emit('refCal',{})
            console.log('ERR',err)
            res.send(resp);
        })
    });
    router.post('/lottoPay',authbit,(req,res,next)=>{
        //route to designate a particular user as having 'paid' for a lottery (that requires pay)
        if (!req.body.pusr|| !req.body.lottoId){
            res.send('err');//no lotto OR no user to pay.
            return false;
        }
        mongoose.model('cal').findOne({_id:req.body.lottoId},(err,lt)=>{
            console.log('LOTTO FOUND IS',lt)
            if(lt.paid.indexOf(req.body.pusr)<0){
                lt.paid.push(req.body.pusr);
            }
            lt.save((err,ltsv)=>{
                io.emit('refCal',{})
                res.send(ltsv);
            })
        })
    })
    router.post('/newRep', authbit, isMod, (req, res, next) => {
        req.body.user = req.session.user.user;
        console.log('User (hopefully a mod) wants to create a repeating event',req.body)
        const oneWeek = 1000*3600*24*7,
        mProms = [],currDate = req.body.eventDate;
        for(let i=0;i<req.body.repeatNum;i++){
            mProms.push(mongoose.model('cal').create(req.body));
            req.body.eventDate+=oneWeek*req.body.repeatFreq;
            console.log('EVENT now',req.body)
        }
        Promise.all(mProms)
            .then(r=>{
                res.send(r);
            })
        // mongoose.model('cal').create(req.body, function(err, resp) {
        //     io.emit('refCal',{})
        //     console.log('ERR',err)
        //     res.send(resp);
        // })
    })
    // title: $scope.editEventObj.title,
    // text: $scope.editEventObj.desc,
    // eventDate: time,
    // kind: $scope.editEventObj.kind.kind,
    // id:$scope.editEventObj.id,
    // user:$scope.editEventObj.user
    router.post('/edit',authbit,(req,res,next)=>{
        mongoose.model('User').findOne({user:req.session.user.user},(err,usr)=>{
            console.log('USER TO EDIT',usr.user,'USER WHO MADE THIS',req.body.user)
            if(usr.user!=req.body.user && !usr.mod){
                res.send('wrongUser');
                return false;
            }else{
                mongoose.model('cal').findOneAndUpdate({_id:req.body.id},{
                    title:req.body.title,
                    text:req.body.text,
                    eventDate:req.body.eventDate,
                    kind:req.body.kind,
                    lastUpd:Date.now()
                },function(err,upd){
                    io.emit('refCal',{})
                    res.send('done')
                })
            }
        })
    })
    router.get('/del', authbit, isMod, (req, res, next) => {
        console.log('deleting',req.query.id)
        mongoose.model('cal').remove({_id:req.query.id}, function(err, resp) {
            io.emit('refCal',{})
            res.send(resp);
        })
    })
    router.get('/all', authbit, (req, res, next) => {
        const OneWeekAgo = Date.now() - 1000 * 3600 * 24 * 7;
        req.query.time = req.query.time && !isNaN(req.query.time) ? req.query.time : OneWeekAgo;
        mongoose.model('cal').find({ eventDate: { $gt: req.query.time } }, function(err, events) {
            if (err) {
                res.send(err)
            } else {
                res.send(events || null);
            }
        })
    })
    router.get('/latestFive',authbit,(req,res,next)=>{
        mongoose.model('cal').find({},(err,events)=>{
            res.send(events.sort((a,b)=>{
                return b.eventDate-a.eventDatel
            }).slice(0,5));
        })
    })
    router.get('/clean', this.authbit, isMod, (req, res, next) => {
        mongoose.model('cal').remove({}, function(r) {
            res.send('Cleaned!')
        });
    })
    return router;
}
module.exports = routeExp;