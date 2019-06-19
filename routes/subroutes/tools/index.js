const express = require('express');
const router = express.Router(),
    _ = require('lodash'),
    mongoose = require('mongoose'),
    axios = require('axios'),
    sendpie = require('sendmail')({
        logger: {
            debug: console.log,
            info: console.info,
            warn: console.warn,
            error: console.error
        },
        silent: false
    }),
    isMod = (req, res, next) => {
        mongoose.model('User').findOne({ _id: req.session.passport.user }, function(err, usr) {
            if (!err && usr.mod) {
                next();
            } else {
                res.status(403).send('err');
            }
        })
    },
    fraclvl = require('./data/fracLvls.json'),
    priceObjs = require('./data/priceObjs.json'),
    // priceObjs = ,
    worlds = require('./data/worldPops.json');

let lastPriceCheck = 0;

const routeExp = function(io) {
    this.authbit = (req, res, next) => {
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
    router.get(['/daily', '/daily/tomorrow'], this.authbit, (req, res, next) => {
        console.log('URL:', req.url)
        // res.send('HI')
        // return false
        const tmrw = req.url.indexOf('tomorrow') > -1;
        axios.get('https://api.guildwars2.com/v2/achievements/daily' + (tmrw ? '/tomorrow' : ''))
            .then((r) => {
                // console.log('RESULT', r.data)
                let modes = ['pve', 'pvp', 'wvw', 'fractals', 'special'];
                mongoose.model('User').findOne({ _id: req.session.passport.user }, function(err, usr) {
                    const minUsrLvl = usr.chars && usr.chars.length ? _.minBy(usr.chars, 'lvl').lvl : 1,
                        maxUsrLvl = usr.chars && usr.chars.length ? _.maxBy(usr.chars, 'lvl').lvl : 80;
                    modes.forEach(mode => r.data[mode] = r.data[mode].filter(dl => {
                        return dl.level.min <= maxUsrLvl && dl.level.max >= minUsrLvl;
                    }))
                    let achieveIds = [];
                    if (req.query.modes) {
                        const desiredModes = req.query.modes.split(',');
                        _.difference(modes, desiredModes).forEach(umd => {
                            delete r.data[umd];
                        });
                        modes = desiredModes;
                    }
                    console.log('DATA NOW', r.data)
                    _.each(modes, md => {
                        achieveIds = _.uniq(achieveIds.concat(r.data[md].map(mdi => mdi.id)))
                    })
                    console.log('ACHIEVES', achieveIds)
                    //now have a list of all desired achievs (or all achieves). Get actual info;
                    axios.get('https://api.guildwars2.com/v2/achievements?ids=' + achieveIds.join(','))
                        .then(ds => {
                            if (modes.indexOf('fractals') > -1) {
                                const fracIds = r.data.fractals.map(fi => fi.id);
                                // console.log('Fractal Achieve IDs',fracIds)
                                fracIds.forEach(fli => {
                                    let thisFrac = ds.data.find(fld => fld.id == fli);
                                    //now we have the fractal daily. We need to find the fl associated with it!
                                    if (thisFrac.name.indexOf('Recommended') > -1) {
                                        // console.log('num frac:',thisFrac)
                                        thisFrac.lvl = Number(thisFrac.name.slice(thisFrac.name.indexOf('Scale') + 6))
                                        thisFrac.requirement += ` (${fraclvl.find(flo=>flo.Level==thisFrac.lvl).Fractal})`;
                                    }
                                })
                            }
                            res.send(ds.data)
                        })
                })
            })
            .catch((e) => {
                res.status(400).send(e);
            })
    })
    router.get('/allPrices', this.authbit, (req, res, next) => {
        const secsSinceLast = (Date.now() - lastPriceCheck) / 1000;
        lastPriceCheck = Date.now();
        // console.log(Math.floor(secsSinceLast),'seconds since last request')
        if (secsSinceLast > 30) {
            //do request again
            axios.get('http://api.guildwars2.com/v2/commerce/prices?ids=' + priceObjs.map(po => po.id).join(','))
                .then(r => {
                    priceObjs.forEach(p => {
                        let priceReturn = r.data.find(pf => p.id == pf.id)
                        p.hi = priceReturn.sells.unit_price;
                        p.lo = priceReturn.buys.unit_price;
                    })
                    res.send({ p: priceObjs })
                })
        } else {
            //too soon; send prices
            res.send({ p: priceObjs })
        }
    })
    router.get('/wvw', this.authbit, (req, res, next) => {
        //https://api.guildwars2.com/v2/worlds?ids=all
        // https://api.guildwars2.com/v2/wvw/matches/scores?world=1008
        req.query.world = req.query.world || 'Henge of Denravi';
        let theWorld = worlds.find(w => w.name == req.query.world);
        if (!theWorld || !theWorld.id) theWorld = { id: 1001 }
        console.log('world', req.query.world, 'id', theWorld)
        axios.get('https://api.guildwars2.com/v2/wvw/matches?world=' + theWorld.id)
            .then(r => {
                const objectiveIds = _.flatten(r.data.maps.map(mp => {
                    return mp.objectives.map(mpo => mpo.id);
                }))
                console.log(objectiveIds)
                axios.get('https://api.guildwars2.com/v2/wvw/objectives?ids=' + objectiveIds.join(',')).then(mps => {
                    // console.log('MAP IDS', r.data.maps.map(m => m.id));
                    //mps.data is list of all objectives and their 'picture' info
                    r.data.maps.forEach(wmp => {
                        wmp.objectives.forEach(wmo => {
                            thisObj = mps.data.find(mpso => mpso.id == wmo.id);
                            console.log('COORD', thisObj);
                            wmo.marker = thisObj.marker || null;
                            wmo.name = thisObj.name;
                            if (thisObj.coord) {
                                wmo.coord = thisObj.coord.slice(0, 2);
                            }
                            wmo.chat = thisObj.chat_link;
                        })
                    })
                    //find objective we own
                    const brethId = '8C57F3E8-75D7-4A8E-AC32-5D79119E8095',
                        objOwned = _.flatten(r.data.maps.map(mp => {
                            return mp.objectives;
                        })).filter(oo=>oo.claimed_by==brethId)[0];
                    // axios.get('')
                    // console.log('OBJECTIVE OWNED IS:',objOwned)
                    if(objOwned){
                        objOwned.name = mps.data.find(oo=>oo.id==objOwned.id).name;
                    }
                    res.send({
                        wvw: r.data,
                        objs: mps.data,
                        uniqMps: _.uniqBy(mps.data, 'marker').filter(mpu => !!mpu.marker).map(mpm => mpm.marker),
                        owned:objOwned||null
                    });
                })
                // res.send({wvw:r.data})
            })
            .catch(e => {
                console.log('ERR', e)
                res.send('newMatch')
            })
    })
    return router;
}

module.exports = routeExp;