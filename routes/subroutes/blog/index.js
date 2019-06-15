const express = require('express');
const router = express.Router(),
    _ = require('lodash'),
    mongoose = require('mongoose'),
    isMod = (req, res, next) => {
        console.log('passport',req.session.passport);
        mongoose.model('User').findOne({ _id: req.session.passport.user }, function(err, usr) {
            if (!err && usr.mod) {
                next();
            } else {
                res.status(403).send('err');
            }
        })
    };

const routeExp = function(io) {
    this.authbit = (req, res, next) => {
        console.log('authbit',req.session.passport)
        if (!req.session || !req.session.passport || !req.session.passport.user) {
            //no passport userid
            res.status(401).send('err')
        } else {
            mongoose.model('User').findOne({
                _id: req.session.passport.user
            }, function (err, usr) {
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
    router.get('/allEntries',this.authbit,(req,res,next)=>{
        mongoose.model('blog').find({},(err,blg)=>{
            if(err||!blg||!blg.length){
               return res.status(400).send(null)
            }
            res.send(blg);
        })
    });
    router.get('/toggleLike',this.authbit,(req,res,next)=>{
        const id = req.query.v;
        mongoose.model('blog').findOne({_id:id},function(err,blg){
            if(err||!blg){
                return res.status(400).send('err');
            }
            if(blg.likes.includes(req.user._id)){
                //blog like list already has this user, so they're DISLIKING it.
                let pos = blg.likes.indexOf(req.user._id);
                blg.likes = blg.likes.slice(0,pos).concat(blg.likes.slice(pos+1));
            }else{
                blg.likes.push(req.user._id);
            }
            let outBlg = _.cloneDeep(blg.likes);
            blg.save((err,rsp)=>{
                res.send({
                    _id:blg._id,
                    likes:outBlg
                })
            })
        })
    })
    router.post('/newPost',this.authbit,isMod,(req,res,next)=>{
        if(!req.body.title|| !req.body.contents){
            return res.status(400).send('noInfo')
        }else{
            req.body.author = req.user.user;
            mongoose.model('blog').create(req.body,(err,resp)=>{
                res.send(resp);
            })
        }
    })
    return router;
}

module.exports = routeExp;