Date.prototype.stdTimezoneOffset = function() {
    var jan = new Date(this.getFullYear(), 0, 1);
    var jul = new Date(this.getFullYear(), 6, 1);
    return Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
};

Date.prototype.isDstObserved = function() {
    return this.getTimezoneOffset() < this.stdTimezoneOffset();
};

app.controller('cal-cont', function($scope, $http, $state, $log) {
    $scope.cal = [];
    $scope.days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    $scope.calLoaded = false;
    // $scope.repEvent = false;
    $scope.wkOpts = [{
        lbl: 'Every week',
        n: 1
    }, {
        lbl: 'Every two weeks',
        n: 2
    }, {
        lbl: 'Every three weeks',
        n: 3
    }, {
        lbl: 'Every four weeks',
        n: 4
    }, {
        lbl: 'Every five weeks',
        n: 5
    }];
    $http.get('/user/usrData')
        .then(r => {
            $scope.user = r.data;
        });
    $scope.refCal = () => {
        $http.get('/cal/all')
            .then((r) => {
                $log.debug('calendar events response:', r);
                $scope.makeCalendar(r.data);
            });
    };
    socket.on('refCal', (e) => {
        $scope.refCal();
    });
    $scope.refCal();
    $scope.makeCalendar = (data) => {
        //make the calendar object using the data from /cal/all
        $scope.offsetDays = $scope.days.rotate(new Date().getDay());
        let wks = 6,
            days = 7,
            i = 0,
            j = 0,
            today = new Date(),
            tDay;
        today.setHours(0, 0, 0, 0); //set day to beginning of the day (12am)
        today = today.getTime();
        $scope.cal = [];
        for (i; i < wks; i++) {
            let newWk = {
                wk: i,
                wkSt: new Date(today + ((7 * i) * 1000 * 3600 * 24)),
                wkEn: new Date(today + (((7 * (i + 1)) - 1) * 1000 * 3600 * 24)),
                days: []
            };
            for (j = 0; j < days; j++) {
                // for each day, add that number of days to our 'current' day (today)
                let theDate = new Date(today + (((7 * i) + j)) * 1000 * 3600 * 24);
                newWk.days.push({
                    d: j,
                    evts: data.filter(et => {
                        let dtNum = new Date(et.eventDate).getTime();
                        $log.debug('THIS DATE DTNUM', dtNum, theDate.getTime());
                        return dtNum > theDate.getTime() && dtNum < (theDate.getTime() + (1000 * 3600 * 24));
                        // && dtNum<(theDate.getTime()+(1000*3600*24))
                    }),
                    date: theDate
                });
            }
            $scope.cal.push(newWk);
        }
        $log.debug('CAL STUFF', $scope.cal, $scope.offsetDays);
    };
    $scope.viewEvent = (ev) => {
        $log.debug('View event', ev);
        let payers = null;
        if (ev.paid && ev.paid.length) {
            payers = `<ul class='ul'>
                ${ev.paid.map(up=>'<li>'+up+'</li>').join('')}
            </ul>`;
        }
        bulmabox.alert(`Event: ${ev.title}`, `Time:${new Date(ev.eventDate).toLocaleString()}<br>Type:${$scope.kindOpts.find(k=>k.kind==ev.kind).kindLong}<br>${payers?'Paid Users<br>'+payers:''}<hr> Description: ${ev.text}`);
    };
    $scope.editEventObj = {
        title: '',
        desc: '',
        day: 0,
        time: (new Date().getHours() + (new Date().getMinutes() < 30 ? 0.5 : 0)) * 2,
        kind: 'lotto',
        id: null
    };
    $scope.clearEdit = () => {
        $scope.editEventAct = false;
    };
    $scope.editEventAct = false;
    $scope.editEvent = (ev) => {
        $scope.editEventAct = true;
        $log.debug('Edit event', ev, 'hour options', $scope.hourOpts);
        const beginningOfDay = new Date(ev.eventDate).setHours(0, 0, 0, 0),
            now = Date.now();
        $scope.editEventObj = {
            title: ev.title,
            desc: ev.text,
            kind: $scope.kindOpts.find(k => k.kind == ev.kind),
            time: Math.floor((ev.eventDate - beginningOfDay) / (30 * 60 * 1000)),
            day: Math.round((ev.eventDate - now) / (3600 * 1000 * 24)),
            id: ev._id,
            user: ev.user
        };
    };
    $scope.doEdit = () => {
        $log.debug('Input edit event', $scope.editEventObj);
        const today = new Date();
        let baseDay = $scope.editEventObj.day,
        baseTime = $scope.editEventObj.time;
        if (!new Date().isDstObserved()) {
            baseTime += 2;
            if (baseTime > 47) {
                baseTime = baseTime % 47;
                baseDay++;
            }
        }
        today.setHours(0, 0, 0, 0);
        let time = today.getTime() + (baseTime * 1800 * 1000) + (baseDay * 3600 * 1000 * 24);
        $log.debug('Sending event', $scope.editEventObj, time);
        // return false;
        if (time < (Date.now() + (5 * 60 * 1000))) {
            //time selected is less than 5 minutes past "now"
            bulmabox.alert('Time Expiring', `Your selected time, ${new Date(time).toLocaleString()}, occurs too soon! Please select a later time.`);
            return false;
        }
        $http.post('/cal/edit', {
                title: $scope.editEventObj.title,
                text: $scope.editEventObj.desc,
                eventDate: time,
                kind: $scope.editEventObj.kind.kind,
                id: $scope.editEventObj.id,
                user: $scope.editEventObj.user
            })
            .then(function(r) {
                $log.debug('edit event response', r);
                if (r.data == 'wrongUser') {
                    bulmabox.alert('<i class="fa fa-exclamation-triangle"></i> Wrong User', 'You cannot edit this event, as you are not its creator and are not a moderator.');
                }
                $scope.refCal();
                $scope.clearEdit();
            });
    };
    $scope.delEvent = (ev) => {
        $log.debug('Delete event', ev);
        bulmabox.confirm('Delete Event', `Are you sure you wish to delete the following event?<br> Title: ${ev.title}<br>Description: ${ev.text}`, function(r) {
            if (!r || r == null) {
                return false;
            } else {
                //delete!
                $http.get('/cal/del?id=' + ev._id).then(function(r) {
                    $log.debug('delete response', r);
                    $scope.refCal();
                });
            }
        });
    };
    $scope.addEvent = false;
    $scope.newEventObj = {
        title: '',
        desc: '',
        day: 0,
        time: (new Date().getHours() + (new Date().getMinutes() < 30 ? 0.5 : 0)) * 2,
        kind: 'lotto',
        repeatNum: 1,
        repeatOn: false,
        repeatFreq: 1
    };
    $http.get('/user/allUsrs')
        .then(au => {
            $scope.allUsrs = au.data.map(u => u.user);
        });

    $scope.addPaid = (ev) => {
        const lto = $scope.allUsrs.filter(pu => !ev.paid || !ev.paid.length || ev.paid.indexOf(pu) < 0).map(uo => {
            return `<option value='${uo}'>${uo}</option>`;
        }).join(''); //find all users where the event either HAS no paid users, OR the user is not in the list yet.
        bulmabox.custom('Add Paid User', `Select a user from the list below to add them to this lotto\'s candidates:<br><p class='select'><select id='payusr'>${lto}</select></p>`, function() {
            let pyusr = document.querySelector('#payusr').value;
            $log.debug('User wishes to add', pyusr);
            $http.post('/cal/lottoPay', { lottoId: ev._id, pusr: pyusr });
        },`<button class='button is-info' onclick='bulmabox.runCb(bulmabox.params.cb)'>Add</button><button class='button is-danger' onclick='bulmabox.kill("bulmabox-diag")'>Cancel</button>`);
    };
    $scope.hourOpts = new Array(48).fill(100).map((c, i) => {
        let post = i < 24 ? 'AM' : 'PM',
            hr = Math.floor((i) / 2) < 13 ? Math.floor((i) / 2) : Math.floor((i) / 2) - 12;
        if (hr < 1) {
            hr = 12;
        }
        return {
            num: i,
            hr: (hr) + (i % 2 ? ':30' : ':00') + post
        };
    });
    $scope.dayOpts = new Array(42).fill(100).map((c, i) => {
        let theDay = new Date(Date.now() + (i * 3600 * 1000 * 24));
        return {
            num: i,
            day: (theDay.getMonth() + 1) + '/' + theDay.getDate()
        };
    });
    $scope.kindOpts = [{
        kind: 'lotto',
        desc: 'An item or items will be given away by a [GEO] member to one lucky guild member!',
        kindLong: 'Lottery/Giveaway'
    }, {
        kind: 'payLotto',
        desc: 'Try your luck! One lucky winner will win the pool of donations!',
        kindLong: 'Paid Lottery/Giveaway'
    }, {
        kind: 'announce',
        desc: 'Someone needs to make an important announcement!',
        kindLong: 'Announcement'
    }, {
        kind: 'contest',
        desc: 'Some sort of contest! See who\'s the best!',
        kindLong: 'Contest'
    }, {
        kind: 'other',
        desc: 'Any other event type',
        kindLong: 'Other'
    }];
    $scope.doAdd = () => {
        //send event!
        const today = new Date();
        let baseTime = $scope.newEventObj.time,
            baseDay = $scope.newEventObj.day;
        // $log.debug('ORIGINAL DATE STUFF',baseTime,baseDay)
        today.setHours(0, 0, 0, 0);
        //dst handlers
        if (!new Date().isDstObserved()) {
            baseTime += 2;
            if (baseTime > 47) {
                baseTime = baseTime % 47;
                baseDay++;
            }
        }
        // $log.debug('NOW DATE STUFF',baseTime,baseDay)
        //end dst
        let time = today.getTime() + (baseTime * 1800 * 1000) + (baseDay * 3600 * 1000 * 24);
        let theUrl = $scope.newEventObj.repeatOn ? '/cal/newRep' : '/cal/new';
        if (time < (Date.now() + (5 * 60 * 1000))) {
            //time selected is less than 5 minutes past "now"
            bulmabox.alert('Time Expiring', `Your selected time, ${new Date(time).toLocaleString()}, occurs too soon! Please select a later time.`);
            return false;
        }
        $log.debug('Sending event', $scope.newEventObj, time);
        // return false; //short circuit when we need to debug
        $http.post(theUrl, {
                title: $scope.newEventObj.title,
                text: $scope.newEventObj.desc,
                eventDate: time,
                kind: $scope.newEventObj.kind.kind,
                repeatNum: $scope.newEventObj.repeatNum,
                repeatFreq: $scope.newEventObj.repeatFreq,
                repeatOn: $scope.newEventObj.repeatOn
            })
            .then(function(r) {
                $log.debug('new event response', r);
                $scope.refCal();
                $scope.clearAdd();
            });
    };
    $scope.clearAdd = () => {
        $scope.addEvent = false;
        $scope.newEventObj = {
            title: '',
            desc: '',
            day: 0,
            time: (new Date().getHours() + (new Date().getMinutes() < 30 ? 0.5 : 0)) * 2,
            kind: 'lotto',
            repeatNum: 1,
            repeatFreq: 1,
            repeatOn: false
        };
    };
});