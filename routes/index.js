const express = require('express');
const router = express.Router(),
    mongoose = require('mongoose');

module.exports = function(io, pp) {
    router.use('/user', require('./subroutes/users')(io, pp));
    router.use('/forum', require('./subroutes/forums')(io, pp));
    router.use('/tool', require('./subroutes/tools')(io, pp));
    router.use('/cal', require('./subroutes/cal')(io, pp));
    router.use('/blog', require('./subroutes/blog')(io, pp));
    // router.get('/reset', function(req, res, next) {
    //     console.log('reset page!')
    //     res.sendFile('reset.html', { root: './views' })
    // });
    router.get('*', function(req, res, next) {
        // console.log('trying to get main page!')
        res.sendFile('index.html', { root: './views' })
    });
    router.use(function(req, res) {
        res.status(404).end();
    });
    //cron stuff
    const cronny = setInterval(function() {
        // console.log('Checking upcoming events at', new Date().toLocaleString())
        let now = Date.now();
        mongoose.model('cal').find({ kind: { $in: ['lotto', 'payLotto'] } }, function(err, lottos) {
            let lastWinner = null;
            const lottosExp = lottos.filter(lt => lt.eventDate < now && !lt.expired), //expiring (but not expired!) lottos
                alreadyDone = lottos.filter(lt => lt.eventDate < now && lt.expired); //ones already done
            if (alreadyDone.length) {
                //we have events done
                const lastEvtUnsorted = alreadyDone.filter(lt => lt.kind == 'lotto');
                if (lastEvtUnsorted.length) {
                    //we have unpaid lottos done
                    lastWinner = lastEvtUnsorted.sort((a, b) => a.eventDate - b.eventDate)[0].winner;//find the last unpaid lotto winner
                }
            } else {
                lastWinner = null;
            }
            // console.log('WEENRZ:',lastEvt)
            // console.log(now, 'all lottos', lottos.map(e => e.eventDate), 'expiring/expired', lottosExp.map(e => e.eventDate));
            if (lottosExp.length) {
                lottosExp.forEach(lto => {
                    mongoose.model('User').find({ isBanned: false, confirmed: true }, function(err, usrs) {
                        console.log('Users available to win this contest are:', usrs);
                        //'win' one
                        let theWinner = null;
                        if (lto.kind == 'lotto') {
                            theWinner = usrs[Math.floor(Math.random() * usrs.length)];
                            while (theWinner.user == lastWinner) {
                                theWinner = usrs[Math.floor(Math.random() * usrs.length)];
                            }
                        } else {
                            const tempWinner = lto.paid[Math.floor(Math.random() * lto.paid.length)]
                            theWinner = usrs.find(uw => uw.user == tempWinner);
                        }
                        if (lto.kind == 'payLotto' && !theWinner) {
                            lto.text = '<br>Lotto expired without a winner!'
                        } else {
                            lto.text += '<br>WINNER: ' + theWinner.user;
                            lto.winner = theWinner.user;
                        }
                        lto.expired = true;
                        lto.save()
                        if (!theWinner) {
                            return false;
                        }
                        mongoose.model('User').findOne({ 'user': theWinner.user }, function(err, usr) {
                            usr.msgs.push({
                                from: lto.user,
                                date: Date.now(),
                                msg: `<h3>Congratulations!</h3>
                                You've won the event "${lto.title}"! Contact ${lto.user} for further details and to claim your prize(s)!`
                            })
                            console.log(usr)
                            io.emit('refCal', {})
                            usr.save(function(err, usr) {
                                console.log('User updated!', usr, err)
                            });
                        });
                    })
                })
            } else {
                return false; //nothin to do
            }
        })
        //sort thru all other events that ARE expired but have not be MARKED as such
        mongoose.model('cal').find({}, function(err, evts) {
            evtsExp = evts.filter(ev => ev.eventDate < now && !ev.expired);
            evtsExp.forEach(e => {
                e.expired = true;
                e.save();
            });
        });
    }, 10000)
    //end of cron
    return router;
};

//helper stuff
Array.prototype.findOne = function(p, v) {
    let i = 0;
    if (typeof p !== 'string' || !this.length) {
        return false;
    }
    for (i; i < this.length; i++) {
        if (this[i][p] && this[i][p] == v) {
            return i;
        }
    }
    return false;
};

Array.prototype.removeOne = function(n) {
    this.splice(this.indexOf(n), 1);
};