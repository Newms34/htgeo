;(function() {
"use strict";

const socket = io(),
    app = angular.module('htgeo-app', ['ui.router', 'ngAnimate', 'ngSanitize', 'chart.js']),
    resetApp = angular.module('reset-app', []);

const defaultPic = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHEAAACNCAIAAAAPTALlAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAEnQAABJ0Ad5mH3gAAANsSURBVHhe7dVRduIwEETR7GkWmK1HhMch9giw1dWyZNf9mZwM2F3vJ1//TM1N9dxUz0313FTPTfVGb/r9Fh8azIhNCbYTXx7AWE3JE8CDDjVEU3pI8egjHN+UBgl4QXdHNmV6Ml7W0WFNWdwFr+zlgKYM7Y7X5+vdlH0H4YhkXZuy7FCckqlfUzYNgIPSdGrKmmFwVo6LNi24LEGPpowYDMclSG/KgiFxotqlmxZcKZXblMMHxqFSiU25enicq+OmN1wsktWUYyfB0SJuesPRIilNuXQqnK7gpuB0BX1TbpwQA8Lc9IkBYW66wIYYcVNOmxYzYtx0gRkxbrrAjBhlU+6aHGMC3HSNMQFuusaYADddY0yAm64xJsBNK9jTStaUc06BSa3ctIJJrdy0gkmt3LSCSa3ctIJJrdy0gkmt3LSCSa3ctIJJrdy0gkmt3LSCSa3ctIJJrWRNCy6aH3tauekaYwLcdI0xAW66xpgAN11jTICbrjEmQNm04K5pMSPGTReYEeOmC8yIcdMFZsSImxZcNyEGhLnpEwPC9E0LbpwKpyu4KThdIaVpwaWT4GgRN73haBE3veFokaymBfcOj3N1EpsWXD0wDpVyU73cpgW3D4kT1dKbFiwYDMcl6NG0YMdIuCzBRZtyVo5OTQvWDICD0vRrWrDpUJySqWvTgmUH4YhkvZsW7OuO1+e7SlPe3cXl/kZxTaZOTRk0Bm5Kk96UHePhvgS5TTl/YBwqldWUk2fAxTopTTl2HtwtIm7KjXNiQ5iyKafNjCUxsqYcNT/2BGiacs5ZsKqVoCmHnAvbmkSbcsIZsXC/UFNefl7s3Km9Ka89O9bu0diUF14DmzdracqrroTl27jpJizfZndTXnI97N9gX1Mef1VU+GRHUx58bbR4y033ocVbW5vySNuQdVNTHmYPdHnBTVvQ5YXPTXmMLVGnxk0bUafmQ1MeYDU0+s+7pnzVXqPUkpuGUGrpZVO+ZJ/Q6w83jaLXH24qQLKHelM+a9tQ7cFNBaj2UGnKB20P2v1yUw3a/Vo35SO2HwXdVIiCbipEwVVT/tNa3TO6qdI9o5sq3TO6qVjJ+GzK7yymlHRTsVLSTcVKSZryC1NwUz031XNTPTfVuzXlRxNxUz031XNTPTfVc1M9N9VzU70v/jWV7+8ffZYE08zo+Y8AAAAASUVORK5CYII=';

Array.prototype.findUser = function (u) {
    for (var i = 0; i < this.length; i++) {
        if (this[i].user == u) {
            return i;
        }
    }
    return -1;
}
let hadDirect = false;
const dcRedirect = ['$location', '$q', '$injector', function ($location, $q, $injector) {
    //if we get a 401 response, redirect to login
    let currLoc = '';
    return {
        request: function (config) {
            // console.log('STATE', $injector.get('$state'));
            currLoc = $location.path();
            return config;
        },
        requestError: function (rejection) {
            return $q.reject(rejection);
        },
        response: function (result) {
            return result;
        },
        responseError: function (response) {
            console.log('Something bad happened!', response, currLoc, $location.path())
            hadDirect = true;
            bulmabox.alert(`App Restarting`, `Hi! I've made some sort of change just now to make this app more awesome! Unfortunately, this also means I've needed to restart it. I'm gonna log you out now.`, function (r) {
                fetch('/user/logout')
                    .then(r => {
                        hadDirect = false;
                        $state.go('appSimp.login', {}, {
                            reload: true
                        })
                        return $q.reject(response);
                    })
            })
        }
    }
}];
app.config(['$stateProvider', '$urlRouterProvider', '$locationProvider', '$httpProvider', function ($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider) {
        $locationProvider.html5Mode(true);
        $urlRouterProvider.otherwise('/404');
        $stateProvider
            .state('app', {
                abstract: true,
                templateUrl: 'layouts/full.html'
            })
            .state('app.blog', {
                url: '/blog', //default route, if not 404
                templateUrl: 'components/blog.html'
            })
            .state('app.dash', {
                url: '/', //default route, if not 404
                templateUrl: 'components/dash.html'
            })
            .state('app.chat', {
                url: '/chat', //default route, if not 404
                cache:false,
                templateUrl: 'components/chat.html'
            })
            .state('app.calendar', {
                url: '/calendar',
                templateUrl: 'components/calendar.html'
            })
            .state('app.help', {
                url: '/help',
                templateUrl: 'components/help/help.html'
            })
            //forum stuff
            .state('app.forum', {
                //cateories (main)
                url: '/forum',
                templateUrl: 'components/forums/forum.html'
            })
            .state('app.forumCat', {
                //indiv category
                url: '/forumCat?c',
                templateUrl: 'components/forums/forumCat.html'
            })
            .state('app.forumThr', {
                //indiv Thread
                url: '/forumThr?c&t',
                templateUrl: 'components/forums/forumThr.html'
            })
            .state('app.tools', {
                //indiv Thread
                url: '/tools',
                templateUrl: 'components/tools.html'
            })

            //SIMPLE (login, register, forgot, 404, 500)
            .state('appSimp', {
                abstract: true,
                templateUrl: 'components/layout/simp.html'
            })
            .state('appSimp.login', {
                url: '/login',
                templateUrl: 'components/login.html'
            })
            .state('appSimp.register', {
                url: '/register',
                templateUrl: 'components/register.html'
            })
            //unconfirmed usr
            .state('appSimp.unconfirmed', {
                url: '/unconf',
                templateUrl: 'components/alt/unconfirmed.html'
            })
            //and finally, the error-handling routes!
            .state('appSimp.notfound', {
                url: '/404',
                templateUrl: 'components/alt/404.html'
            })
            .state('appSimp.err', {
                url: '/500',
                templateUrl: 'components/alt/500.html'
            })
        //http interceptor stuffs!
        // $httpProvider.interceptors.push(dcRedirect)
    }])
    .directive("fileread", [function () {
        return {
            scope: {
                fileread: "="
            },
            link: function (scope, element, attributes) {
                element.bind("change", function (changeEvent) {
                    const reader = new FileReader(),
                        theFile = changeEvent.target.files[0],
                        tempName = theFile.name;
                    console.log('UPLOADING FILE', theFile);
                    reader.onload = function (loadEvent) {
                        let theURI = loadEvent.target.result;
                        console.log('URI before optional resize', theURI, theURI.length)
                        if (scope.$parent.needsResize) {
                            //needs to resize img (usually for avatar)
                            resizeDataUrl(scope, theURI, scope.$parent.needsResize, scope.$parent.needsResize, tempName);
                        } else {
                            console.log('APPLYING file to $parent')
                            scope.$apply(function () {
                                if (scope.$parent && scope.$parent.$parent && scope.$parent.$parent.avas) {

                                    scope.$parent.$parent.loadingFile = false;
                                    scope.$parent.$parent.fileName = 'Loaded:' + tempName;
                                    scope.$parent.$parent.fileread = theURI;
                                } else {
                                    scope.$parent.loadingFile = false;
                                    scope.$parent.fileName = 'Loaded:' + tempName;
                                    scope.$parent.fileread = theURI;
                                }
                                if (scope.$parent.saveDataURI && typeof scope.$parent.saveDataURI == 'function') {
                                    scope.$parent.saveDataURI(dataURI);
                                }
                            });
                        }
                    }
                    if (!theFile) {
                        scope.$apply(function () {
                            scope.fileread = '';
                            scope.$parent.fileName = false;
                            scope.$parent.loadingFile = false;
                        });
                        return false;
                    }
                    if (theFile.size > 2500000) {
                        bulmabox.alert('File too Large', `Your file ${theFile.name} is larger than 2.5MB. Please upload a smaller file!`)
                        return false;
                    }
                    reader.readAsDataURL(theFile);
                });
            }
        }
    }]).filter('markdown', ['$sce', function ($sce) {
        return function (md) {
            // const video_id = url.split('v=')[1].split('&')[0];
            const conv = new showdown.Converter();
            return $sce.trustAsHtml(conv.makeHtml(md));
        };
    }]);

Array.prototype.rotate = function (n) {
    let arrCop = angular.copy(this);
    for (var i = 0; i < n; i++) {
        arrCop.push(arrCop.shift());
    }
    return arrCop;
};
Date.prototype.dyMo = function () {
    return (this.getMonth() + 1) + '/' + this.getDate();
}
String.prototype.titleCase = function () {
    return this.split(/\s/).map(t => t.slice(0, 1).toUpperCase() + t.slice(1).toLowerCase()).join(' ');
}

const resizeDataUrl = (scope, datas, wantedWidth, wantedHeight, tempName) => {
    // We create an image to receive the Data URI
    const img = document.createElement('img');

    // When the event "onload" is triggered we can resize the image.
    img.onload = function () {
        // We create a canvas and get its context.
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // We set the dimensions at the wanted size.
        canvas.width = wantedWidth;
        canvas.height = wantedHeight;

        // We resize the image with the canvas method drawImage();
        ctx.drawImage(this, 0, 0, wantedWidth, wantedHeight);

        const dataURI = canvas.toDataURL();
        scope.$apply(function () {
            scope.$parent.loadingFile = false;
            scope.$parent.fileName = 'Loaded:' + tempName;
            scope.fileread = dataURI;
            if (scope.$parent.saveDataURI && typeof scope.$parent.saveDataURI == 'function') {
                //only for avatar
                scope.$parent.saveDataURI(dataURI);
            }
        });
    };

    // We put the Data URI in the image's src attribute
    img.src = datas;
}
app.controller('blog-cont', function ($scope, $http, $state, $filter, $sce) {
    $http.get('/user/getUsr')
        .then(r => {
            $scope.doUser(r.data);
            console.log('user', $scope.user)
        });
    $scope.msgs = [];
    $scope.doUser = (u) => {
        if (!u) {
            return false;
        }
        $scope.user = u;
        $scope.msgs.push({
            time: Date.now(),
            user: 'System',
            msg: 'Welcome to Hidden Tyria Geographic Society [GEO] Chat! You\'re logged in as ' + u.user + '. Try /wiki or /google to search for stuff!',
            isSys: true
        })
    }
    $scope.newBlog = {
        title: null,
        contents: null,
        youtube: null,
        pic: null,
        youtubeCand: null
    };
    $scope.blogEntries = [{
        author: 'Healy',
        pic: 'https://static.wixstatic.com/media/4c8c05_d15c19168bda4a3c9a3bef232a00310f~mv2.jpg/v1/fit/w_1175,h_661,al_c,q_80/file.png',
        height: 400,
        title: 'A Test Post',
        contents: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc et mi ut mauris rutrum malesuada. Ut tincidunt in ex ac ultrices. Integer nec aliquam massa. Fusce aliquam fermentum augue. Suspendisse sollicitudin lectus libero. Praesent varius nisl eu neque cursus lobortis. Nullam convallis turpis sit amet tortor cursus fermentum. In facilisis pharetra urna, sed feugiat est lobortis a. Vestibulum vehicula malesuada purus, id convallis massa suscipit nec. Nunc a ante nunc. Nullam faucibus porttitor erat, vitae convallis augue tincidunt a.

        Nunc egestas hendrerit orci, ut rutrum ex porta ac. Pellentesque porttitor erat neque, eu pulvinar ex sodales quis. Morbi gravida suscipit nulla nec laoreet. Vivamus eleifend magna leo. Morbi tincidunt iaculis euismod. Aliquam malesuada nunc lacinia, convallis augue quis, consectetur elit. Maecenas mattis purus sollicitudin semper feugiat. Ut at gravida augue, sit amet venenatis arcu. Maecenas et justo ut elit ultrices maximus et ac enim. Sed nec rutrum nibh. Etiam malesuada lacus nisl, eget pretium odio consectetur ut.`,
        // views: 0,
        youtube: `https://www.youtube.com/watch?v=cGZ4X7cER8k`,
        likeNum: 0,
        usrLiked: false,
        when: 'A long time ago',
        id: null
    }]

    $scope.refBlogs = () => {
        $http.get('/blog/allEntries').then(b => {
            if (!b.data) {
                throw new Error('no blogs')
            }
            $scope.blogEntries = $scope.parseBlogs(b.data);
        }).catch(e => {
            $scope.blogEntries = [{
                author: 'System',
                pic: 'https://static.wixstatic.com/media/4c8c05_d15c19168bda4a3c9a3bef232a00310f~mv2.jpg/v1/fit/w_1175,h_661,al_c,q_80/file.png',
                height: 400,
                title: `Couldn't Load Blog`,
                contents: `Your site is probably broken, or your internet connection sucks. We couldn't load any blog info!`,
                // views: 0,
                youtube: null,
                likeNum: 0,
                usrLiked: false,
                when: 'A long time ago',
                _id: null
            }]
        });
    }
    $scope.refBlogs();
    $scope.parseBlogs = d => {
        return d.map(di => {
            di.height = di.height || 400;
            di.likeNum = di.likes.length;
            di.usrLiked = !!di.likes.includes($scope.user._id);
            di.when = new Date(di.date).toLocaleString();
            di.editContents = di.contents;
            return di;
        })
    }
    $scope.toggleLike = id => {
        $http.get(`/blog/toggleLike?v=${id}`).then(r => {
            let likeTarg = $scope.blogEntries.find(q => q._id == r.data._id);
            likeTarg.likes = r.data.likes;
            likeTarg.usrLiked = r.data.likes.includes($scope.user._id);
            likeTarg.likeNum = r.data.likes.length;
        })
    }
    $scope.timers = {
        pic: null,
        vid: null
    };
    // document.querySelector('#file-inp').addEventListener('change', $scope.doPic,false)
    $scope.doPic = e => {
        console.log('EVENT INTO CHANGE', e);
        const reader = new FileReader(),
            canv = document.querySelector('#upl-canv'),
            ctx = canv.getContext("2d");
        reader.onload = function (event) {
            const img = new Image();
            img.onload = function () {
                console.log(img, img.width)
                canv.width = img.width;
                canv.height = img.height;
                ctx.drawImage(img, 0, 0);
                $scope.pic = canv.toDataURL();
            }
            img.src = event.target.result;
        }
        reader.readAsDataURL(e.target.files[0]);
    }
    $scope.vidTimer = () => {
        if ($scope.timers.vid) {
            clearTimeout($scope.timers.vid);
        }
        $scope.timers.vid = setTimeout(function () {
            if ($scope.newBlog.youtubeCand && $scope.newBlog.youtubeCand.length) {
                if($scope.newBlog.youtubeCand.includes('youtu.be')){
                    //shortUrl: replace with long. Example:
                    //https://youtu.be/hdylEJKNgcs goes to youtube.com/watch?v=hdylEJKNgcs;
                    $scope.newBlog.youtube = $scope.newBlog.youtubeCand.replace('https://youtu.be/','https://www.youtube.com/watch?v=').replace('youtu.be/','https://www.youtube.com/watch?v=')
                }else{
                    $scope.newBlog.youtube = $scope.newBlog.youtubeCand;
                }
            } else {
                $scope.newBlog.youtube = null;
            }
        }, 500)
    }
    $scope.newPost = s => {
        if (!$scope.newBlog.title || !$scope.newBlog.contents) {
            return bulmabox.alert('<i class="fa fa-exclamation-triangle is-size-3"></i>&nbsp;Missing Information', 'Your blog post needs a title and at least some text content!');
        }
        let nb = angular.copy($scope.newBlog);
        delete nb.picCand;
        delete nb.youtubeCand;
        $http.post('/blog/post', nb).then(r => {
            // console.log('response from posting new blog:',r)
            $scope.newBlog = {
                title: null,
                contents: null,
                youtube: null,
                pic: null,
                picCand: null,
                youtubeCand: null
            }
            $scope.refBlogs();
        })
    }
    $scope.editBlog=b=>{
        bulmabox.confirm('Update Blog Text','Are you sure you wanna update your blog post?',c=>{
            if(!!c){
                $http.put('/blog/post',b).then(r=>{
                    $scope.refBlogs();
                })
            }
        })
    }
    $scope.deleteBlog=b=>{
        console.log('Attempting to delete blog',b)
        bulmabox.confirm('Delete Blog Post','Are you sure you wanna delete this blog entry?',c=>{
            if(!!c){
                if(!Object.keys(b)){
                    console.log('somehow b got emptied!',b)
                }
                $http.delete('/blog/post?id='+b._id).then(r=>{
                    $scope.refBlogs();
                })
            }
        })
    }
}).directive('customOnChange', function () {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
            var onChangeHandler = scope.$eval(attrs.customOnChange);
            element.on('change', onChangeHandler);
            element.on('$destroy', function () {
                element.off();
            });

        }
    };
}).filter('trusted', ['$sce', function ($sce) {
    return function (url) {
        const video_id = url.split('v=')[1].split('&')[0];
        return $sce.trustAsResourceUrl("https://www.youtube.com/embed/" + video_id);
    };
}]);
Date.prototype.stdTimezoneOffset = function() {
    var jan = new Date(this.getFullYear(), 0, 1);
    var jul = new Date(this.getFullYear(), 6, 1);
    return Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
}

Date.prototype.isDstObserved = function() {
    return this.getTimezoneOffset() < this.stdTimezoneOffset();
}

app.controller('cal-cont', function($scope, $http, $state) {
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
    }]
    $http.get('/user/usrData')
        .then(r => {
            $scope.user = r.data;
        })
    $scope.refCal = () => {
        $http.get('/cal/all')
            .then((r) => {
                console.log('calendar events response:', r);
                $scope.makeCalendar(r.data);
            })
    };
    socket.on('refCal', (e) => {
        // bulmabox.alert('Refreshing Calendar',`There's been a change to the calendar, so we're refreshing!`,function(r){
        // $state.go($state.current, {}, { reload: true });
        // })
        $scope.refCal()
    })
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
        $scope.cal = []
        for (i; i < wks; i++) {
            let newWk = {
                wk: i,
                wkSt: new Date(today + ((7 * i) * 1000 * 3600 * 24)),
                wkEn: new Date(today + (((7 * (i + 1)) - 1) * 1000 * 3600 * 24)),
                days: []
            }
            for (j = 0; j < days; j++) {
                // for each day, add that number of days to our 'current' day (today)
                let theDate = new Date(today + (((7 * i) + j)) * 1000 * 3600 * 24);
                newWk.days.push({
                    d: j,
                    evts: data.filter(et => {
                        let dtNum = new Date(et.eventDate).getTime();
                        console.log('THIS DATE DTNUM', dtNum, theDate.getTime())
                        return dtNum > theDate.getTime() && dtNum < (theDate.getTime() + (1000 * 3600 * 24));
                        // && dtNum<(theDate.getTime()+(1000*3600*24))
                    }),
                    date: theDate
                })
            }
            $scope.cal.push(newWk);
        }
        console.log('CAL STUFF', $scope.cal, $scope.offsetDays)
    };
    $scope.viewEvent = (ev) => {
        console.log('View event', ev)
        let payers = null;
        if (ev.paid && ev.paid.length) {
            payers = `<ul class='ul'>
                ${ev.paid.map(up=>'<li> - '+up+'</li>').join('')}
            </ul>`;
        }
        bulmabox.alert(`Event: ${ev.title}`, `Time:${new Date(ev.eventDate).toLocaleString()}<br>Type:${$scope.kindOpts.find(k=>k.kind==ev.kind).kindLong}<br>${payers?'Paid Users<br>'+payers:''}<hr> Description: ${ev.text}`)
    };
    $scope.editEventObj = {
        title: '',
        desc: '',
        day: 0,
        time: (new Date().getHours() + (new Date().getMinutes() < 30 ? 0.5 : 0)) * 2,
        kind: 'lotto',
        id: null
    }
    $scope.clearEdit = () => {
        $scope.editEventAct = false;
    }
    $scope.editEventAct = false;
    $scope.editEvent = (ev) => {
        $scope.editEventAct = true;
        console.log('Edit event', ev, 'hour options', $scope.hourOpts)
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
        }
    };
    $scope.doEdit = () => {
        console.log('Input edit event', $scope.editEventObj)
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
        console.log('Sending event', $scope.editEventObj, time);
        // return false;
        if (time < (Date.now() + (5 * 60 * 1000))) {
            //time selected is less than 5 minutes past "now"
            bulmabox.alert('Time Expiring', `Your selected time, ${new Date(time).toLocaleString()}, occurs too soon! Please select a later time.`)
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
                console.log('edit event response', r)
                if (r.data == 'wrongUser') {
                    bulmabox.alert('<i class="fa fa-exclamation-triangle"></i> Wrong User', 'You cannot edit this event, as you are not its creator and are not a moderator.');
                }
                $scope.refCal()
                $scope.clearEdit()
            })
    }
    $scope.delEvent = (ev) => {
        console.log('Delete event', ev)
        bulmabox.confirm('Delete Event', `Are you sure you wish to delete the following event?<br> Title: ${ev.title}<br>Description: ${ev.text}`, function(r) {
            if (!r || r == null) {
                return false;
            } else {
                //delete!
                $http.get('/cal/del?id=' + ev._id).then(function(r) {
                    console.log('delete response', r)
                    $scope.refCal();
                })
            }
        })
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
        })

    $scope.addPaid = (ev) => {
        const lto = $scope.allUsrs.filter(pu => !ev.paid || !ev.paid.length || ev.paid.indexOf(pu) < 0).map(uo => {
            return `<option value='${uo}'>${uo}</option>`
        }).join(''); //find all users where the event either HAS no paid users, OR the user is not in the list yet.
        bulmabox.custom('Add Paid User', `Select a user from the list below to add them to this lotto\'s candidates:<br><p class='select'><select id='payusr'>${lto}</select></p>`, function() {
            let pyusr = document.querySelector('#payusr').value;
            console.log('User wishes to add', pyusr)
            $http.post('/cal/lottoPay', { lottoId: ev._id, pusr: pyusr })
        })
    }
    $scope.hourOpts = new Array(48).fill(100).map((c, i) => {
        let post = i < 24 ? 'AM' : 'PM',
            hr = Math.floor((i) / 2) < 13 ? Math.floor((i) / 2) : Math.floor((i) / 2) - 12;
        if (hr < 1) {
            hr = 12
        }
        return {
            num: i,
            hr: (hr) + (i % 2 ? ':30' : ':00') + post
        }
    });
    $scope.dayOpts = new Array(42).fill(100).map((c, i) => {
        let theDay = new Date(Date.now() + (i * 3600 * 1000 * 24));
        return {
            num: i,
            day: (theDay.getMonth() + 1) + '/' + theDay.getDate()
        }
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
    }]
    $scope.doAdd = () => {
        //send event!
        const today = new Date();
        let baseTime = $scope.newEventObj.time,
            baseDay = $scope.newEventObj.day;
        // console.log('ORIGINAL DATE STUFF',baseTime,baseDay)
        today.setHours(0, 0, 0, 0);
        //dst handlers
        if (!new Date().isDstObserved()) {
            baseTime += 2;
            if (baseTime > 47) {
                baseTime = baseTime % 47;
                baseDay++;
            }
        }
        // console.log('NOW DATE STUFF',baseTime,baseDay)
        //end dst
        let time = today.getTime() + (baseTime * 1800 * 1000) + (baseDay * 3600 * 1000 * 24);
        let theUrl = $scope.newEventObj.repeatOn ? '/cal/newRep' : '/cal/new';
        if (time < (Date.now() + (5 * 60 * 1000))) {
            //time selected is less than 5 minutes past "now"
            bulmabox.alert('Time Expiring', `Your selected time, ${new Date(time).toLocaleString()}, occurs too soon! Please select a later time.`)
            return false;
        }
        console.log('Sending event', $scope.newEventObj, time)
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
                console.log('new event response', r)
                $scope.refCal()
                $scope.clearAdd()
            })
    }
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
        }
    }
})
app.controller('chat-cont', function ($scope, $http, $state, $filter, $sce) {

    $http.get('/user/getUsr')
        .then(r => {
            $scope.doUser(r.data);
            console.log('user', $scope.user)
        });
    $scope.msgs = [];
    $scope.doUser = (u) => {
        if (!u) {
            return false;
        }
        $scope.user = u;
        $scope.msgs.push({
            time: Date.now(),
            user: 'System',
            msg: 'Welcome to Hidden Tyria Geographic Society [GEO] Chat! You\'re logged in as ' + u.user + '. Try /wiki or /google to search for stuff!<br>You can also poke anyone online by doing @<user>, where <user> is their username.<br>Finally, type /list to see a list of who\'s currently online.',
            isSys: true
        })
    }
    $scope.parseMsg = (t) => {
        console.log('in parseMsg', t);
        if (t.indexOf('/wiki ') === 0) {
            return `Wiki: <a href="https://wiki.guildwars2.com/wiki/${t.slice(6)}" target="_blank">${t.slice(6)}</a>`
        } else if (t.indexOf('/google ') === 0) {
            return `Google: <a href="https://www.google.com/search?q=${t.slice(8)}" target="_blank">${t.slice(8)}</a>`
        }
        return t;
    }
    $http.get('/user/allUsrs')
        .then((au) => {
            //Auch!
            console.log('all users is', au)
            $scope.allUsers = au.data;
        });
    socket.on('chatMsgOut', msg => {
        //recieved a message from backend
        console.log('before dealing with commands, full message object is', msg);
        // var cache = [];
        // let Record = JSON.stringify($scope,function(key, value) {
        //     if (typeof value === 'object' && value !== null) {
        //         if (cache.indexOf(value) !== -1) {
        //             // Duplicate reference found, discard key
        //             return;
        //         }
        //         // Store value in our collection
        //         cache.push(value);
        //     }
        //     return value;
        // });
        // console.log(Record)
        // console.log($scope.parseMsg(msg.msg),'IS THE MESSAGE')
        if (typeof msg.msg !== 'string') {
            return false;
        }
        // socket.on('reqHeartBeat', function (sr) {
        //     $scope.alsoOnline = sr.filter(q => !$scope.user || !$scope.user.user || $scope.user.user != q.name).map(m => m.name);
        //     // console.log('Users that are not this user online',$scope.alsoOnline)
        //     // console.log('$state is',$state)
        //     if ($scope.user && $scope.user.user && $state.current.name.includes('app.')) {
        //         socket.emit('hbResp', {
        //             name: $scope.user.user
        //         })
        //     }
        // })

        msg.msg = $sce.trustAsHtml($scope.parseMsg(msg.msg));
        $scope.msgs.push(msg); //put this in our list of messages;
        if ($scope.msgs.length > 100) {
            $scope.msgs.shift();
        }
        $scope.$apply()
        //scroll to bottom of chat window? HAO DU
        document.querySelector('#chat-container').scrollTop = document.querySelector('#chat-container').scrollHeight;
    })
    socket.on('disconnect', function () {
        $scope.msgs.push({
            time: Date.now(),
            user: 'System',
            msg: 'Warning: The connection to the server was lost. Until you refresh, chat\'s probably gonna be pretty quiet!',
            isSys: true
        });
        if ($scope.msgs.length > 100) {
            $scope.msgs.shift();
        }
        $scope.$apply()
        //scroll to bottom of chat window? HAO DU
        document.querySelector('#chat-container').scrollTop = document.querySelector('#chat-container').scrollHeight;
    })
    $scope.sendChat = () => {
        if (!$scope.newMsg) {
            return false;
        }
        if ($scope.newMsg.toLowerCase() == '/list') {
            let msg = {
                time: Date.now(),
                user: 'System',
                msg: `No other users currently online!`,
                isSys: true
            }
            if($scope.$parent.alsoOnline && $scope.$parent.alsoOnline.length){
                msg.msg = `Users currently online:<ul>${$scope.$parent.alsoOnline.map(q=>'<li> - '+q+'</li>')}</ul>`
            }
            $scope.msgs.push(msg);
            if ($scope.msgs.length > 100) {
                $scope.msgs.shift();
            }
            $scope.newMsg = '';
            // return console.log('ONLINE',$scope.$parent.alsoOnline);
            return false;
        }
        if ($scope.newMsg.toLowerCase() == '/coloron') {
            console.log('toggling disco mode!',$scope.$parent)
            socket.emit('discoMode',{on:true});
            $scope.newMsg = '';
            // return console.log('ONLINE',$scope.$parent.alsoOnline);
            return false;
        }
        if ($scope.newMsg.toLowerCase() == '/coloroff') {
            console.log('toggling disco mode!',$scope.$parent)
            socket.emit('discoMode',{on:false});
            $scope.newMsg = '';
            // return console.log('ONLINE',$scope.$parent.alsoOnline);
            return false;
        }
        console.log('Sending chat message', {
            user: $scope.user.user,
            msg: $scope.newMsg
        })
        socket.emit('chatMsg', {
            user: $scope.user.user,
            msg: $scope.newMsg
        })
        $scope.newMsg = '';
    }
    console.log('CHAT SCOPE', $scope);
    // $scope.$onDestroy()
})
app.controller('dash-cont', function ($scope, $http, $state, $filter) {
        $scope.showDups = localStorage.brethDups; //show this user in 'members' list (for testing)
        $http.get('/user/usrData')
            .then(r => {
                $scope.doUser(r.data);
                console.log('user', $scope.user)
            });
        $http.get('/cal/latestFive')
            .then(r => {
                $scope.latestEvents = r.data;
            })
        $scope.doUser = (u) => {
            if (!u) {
                return false;
            }
            $scope.user = u;
            console.log(u, )
            $scope.possibleInterests.forEach((c, i) => {
                if (u.ints && u.ints[i] && u.ints[i] == 1) {
                    c.active = true;
                }
            })
            $scope.numUnreadMsgs = u.msgs.filter(m => !m.read).length;
        }
        socket.on('sentMsg', function (u) {
            console.log('SOCKET USER', u, 'this user', $scope.user)
            if (u.user == $scope.user.user || u.from == $scope.user.user) {
                console.log('re-getting user')
                $http.get('/user/usrData')
                    .then(r => {
                        $scope.doUser(r.data);
                    });
            }
        })
        $scope.tabs = [{
            name: 'Profile/Characters',
            icon: 'user'
        }, {
            name: 'Members',
            icon: 'users'
        }, {
            name: 'Mail',
            icon: 'envelope'
        }, {
            name: 'Upcoming Events',
            icon: 'calendar'
        }]
        //PIC STUFF
        $scope.defaultPic = defaultPic;
        $scope.loadingFile = false;
        $scope.fileName = null;
        $scope.needsResize = 65;
        $scope.loadFile = () => {
            $scope.loadingFile = true;
            const fr = new FileReader();
        }
        $scope.saveDataURI = (d) => {
            $http.post('/user/changeAva', {
                    img: d
                })
                .then(r => {
                    $scope.doUser(r.data);
                })
        }
        //END PIC STUFF
        $scope.possibleInterests = [{
            name: 'General PvE',
            warn: false,
            active: false,
            icon: 'pve.png'
        }, {
            name: 'sPvP',
            warn: false,
            active: false,
            icon: 'pvp.png'
        }, {
            name: 'WvW',
            warn: false,
            active: false,
            icon: 'wvw.png'
        }, {
            name: 'Fractals',
            warn: false,
            active: false,
            icon: 'fracs.png'
        }, {
            name: 'Raids',
            warn: true,
            active: false,
            icon: 'raids.png'
        }, {
            name: 'Role-Playing',
            warn: true,
            active: false,
            icon: 'rp.png'
        }]
        $scope.tzs = angular.copy(timezoneList);
        //change info stuff
        $scope.changeInterest = (intrst, ind) => {
            console.log(intrst)
            if (intrst.warn && intrst.active) {
                bulmabox.alert('Game Mode Warning', `Hey! Just so you know, [GEO] generally doesn't do ${intrst.name}.<br>However, that doesn't mean we don't have people that might be interested!`);
            }
            $http.get(`/user/changeInterest?int=${ind}&act=${intrst.active}`)
                .then(function (r) {
                    $scope.doUser(r.data);
                })
        }
        $scope.changeTz = () => {
            $http.get('/user/changeTz?tz=' + $scope.user.tz)
                .then(r => {
                    $scope.doUser(r.data);
                })
        }
        $scope.otherInfTimer = null;
        $scope.setOtherInfTimer = () => {
            if ($scope.otherInfTimer) {
                clearTimeout($scope.otherInfTimer);
            }
            $scope.otherInfTimer = setTimeout(function () {
                $http.post('/user/changeOther', {
                        other: $scope.user.otherInfo
                    })
                    .then(r => {
                        $scope.doUser(r.data);
                    })
            }, 500)
        }
        //end info stuff
        //search stuff
        $scope.memNameSort = false;
        $scope.charSearch = '';
        $scope.pickedInts = [false, false, false, false, false, false];
        $scope.intSearchToggle = false;
        $scope.charSearchToggle = false;
        $scope.memFilter = (m) => {
            //two options to 'filter out' this item
            let hasChars = !!m.chars.filter(c => c.name.toLowerCase().indexOf($scope.charSearch.toLowerCase()) > -1).length;
            if ($scope.charSearch && !hasChars) {
                //char search filter has been applied, and none of the user's chars match this
                return false;
            }
            if ($scope.pickedInts.filter(r => !!r).length) {
                //picked some interests
                let okay = true;
                $scope.pickedInts.forEach((intr, idx) => {
                    if (!!intr && !m.ints[idx]) {
                        okay = false;
                    }
                })
                return okay;
            }
            return true;
        }
        //end search stuff
        $http.get('/user/allUsrs')
            .then((au) => {
                console.log('all users is', au)
                $scope.allUsers = au.data;
                setTimeout(function () {

                    socket.emit('getOnline', {});
                }, 100)
            });
        socket.on('allNames', function (r) {
            // console.log('ALL NAMES SOCKET SAYS', r)
            r = r.map(nm => nm.name);
            if ($scope.allUsers) {
                $scope.allUsers.forEach(usr => {
                    usr.online = r.indexOf(usr.user) > -1 || usr.user == $scope.user.user;
                })
            }
            $scope.$digest();
        })
        $scope.showTab = (t) => {
            $scope.currTab = t;
        }
        $scope.currTab = 'Profile/Characters'
        //admin stuffs
        $scope.makeMod = (u) => {
            console.log('wanna mod', u);
            bulmabox.confirm(`Assign Moderator Rights`, `Warning: This will give user ${u.user} full moderator rights, and prevents them from being banned. This process is <i>not</i> reversable!`, function (r) {
                if (!r || r == null) {
                    return false;
                } else {
                    //No thanks
                    $http.get('/user/makeMod?user=' + u.user)
                        .then(tbr => {
                            $scope.allUsers = tbr.data;
                        })
                }
            })
        }
        $scope.toggleBan = (u) => {
            $http.get('/user/toggleBan?user=' + u.user)
                .then(tbr => {
                    $scope.allUsers = tbr.data;
                })
        }
        $scope.confirmUsr = (u) => {
            bulmabox.confirm('Confirm User', `Are you sure you wish to confirm user ${u.user}?`, (r) => {
                if (r && r != null) {
                    $http.get('/user/confirm?u=' + u.user)
                        .then(au => {
                            $scope.allUsers = au.data;
                        })
                }
            })
        }
        //end admin stuffs
        $scope.races = ['Asura', 'Charr', 'Human', 'Norn', 'Sylvari'];
        $scope.profs = ['Guardian', 'Warrior', 'Revenant', 'Thief', 'Ranger', 'Engineer', 'Elementalist', 'Mesmer', 'Necromancer']
        $scope.crafts = ["Armorsmith", "Chef", "Artificer", "Huntsman", "Jeweler", "Leatherworker", "Tailor", "Weaponsmith", "Scribe","None"]
        $scope.addEditCharModal = {
            active:false,
            name:null,
            race:'Asura',
            prof:'Guardian',
            craftOne:{
                cName:"None",
                isMax:false,
            },
            craftTwo:{
                cName:"None",
                isMax:false,
            },
            lvl:80,
            other:null,
            isEdit:false,
        }
        $scope.clearAddEditChar = ()=>{
            $scope.addEditCharModal = {
                active:false,
                name:null,
                race:'Asura',
                prof:'Guardian',
                craftOne:{
                    cName:"None",
                    isMax:false,
                },
                craftTwo:{
                    cName:"None",
                    isMax:false,
                },
                lvl:80,
                other:null,
                isEdit:false,
            }
        }
        $scope.addChar = () => {
            $scope.addEditCharModal.active=true;
            return false
        }
        $scope.autoChars = () => {
            //B9DE7B9E-9DAD-2C40-BECD-12F9BA931FE0851EA3EB-B1AA-4FBB-B4BE-CCDD28F51644
            bulmabox.prompt('Auto-Fill Characters from API', `Auto-filling characters from the Guild Wars 2 Official API will replace any existing characters you've entered with API-found characters. <br><br> - You'll need an API key to do this (click <a href='https://account.arena.net/' target='_blank'>here</a> if you dont have one). <br><br>Are you sure you wish to do this?`, function (resp) {
                if (resp && resp != null) {
                    $http.get('/user/charsFromAPI?api=' + resp)
                        .then(r => {
                            console.log('Auto-char response is', r)
                            if (r && r.data && r.data != 'err') {
                                $scope.doUser(r.data)
                            } else {
                                bulmabox.alert('Error Auto-Filling', 'There was an error auto-filling your characters.<br>While it <i>may</i> be Dave\'s fault, you may also wanna check that your API key is valid. You can also always just manually add your characters!')
                            }
                        })
                }
            })
        }
        $scope.delChr = (chr) => {
            console.log('user wishes to remove character', chr)
            bulmabox.confirm('Remove Character', `Are you sure you wish to remove the character ${chr.name}?`, function (resp) {
                if (resp && resp != null) {
                    $http.get('/user/remChar?id=' + chr._id)
                        .then(r => {
                            $scope.doUser(r.data);
                        }).catch(e => {
                            bulmabox.alert('Error', 'There was a problem removing this character!');
                        })
                }
            })
        }
        $scope.addOrEditChar=()=>{
            console.log('Sending char',$scope.addEditCharModal)
            if(!$scope.addEditCharModal.name){
                return bulmabox.alert('No Character Name','You need to tell us what your character\'s name is!')
            }
            if($scope.addEditCharModal.isEdit){
                $http.post('/user/editChar', $scope.addEditCharModal)
                        .then((r) => {
                            $scope.clearAddEditChar();
                            $scope.$digest()
                            $scope.doUser(r.data);
                        })
            }else{
                $http.post('/user/addChar', $scope.addEditCharModal)
                        .then((r) => {
                            $scope.clearAddEditChar();
                            
                            $scope.doUser(r.data);
                        })
            }
        }
        $scope.editChar = (chr) => {
            // console.log('usr wants to', chr, Date.now())
            $scope.addEditCharModal= {
                active:true,
                name:chr.name,
                race:chr.race,
                prof:chr.prof,
                craftOne:{
                    cName:chr.crafts[0]?chr.crafts[0].cName:'None',
                    isMax:chr.crafts[0]?chr.crafts[0].isMax:false,
                },
                craftTwo:{
                    cName:chr.crafts[1]?chr.crafts[1].cName:'None',
                    isMax:chr.crafts[1]?chr.crafts[1].isMax:false,
                },
                lvl:chr.lvl,
                other:chr.other,
                isEdit:true,
            }
            return false;
            const raceOptList = $scope.races.map(rc => {
                    return `<label class='char-opt opt-${rc}'><input type='radio' name='char-race' value=${rc} title=${rc} ${rc==chr.race?'checked':''}><div></div></label>`
                }).join(''),
                profOptList = $scope.profs.map(rc => {
                    return `<label class='char-opt opt-${rc}'><input type='radio' name='char-prof' value=${rc} title=${rc} ${rc==chr.prof?'checked':''}><div></div></label>`
                }).join('');
            bulmabox.custom('Edit character',
                `<div class="field">
    <label class="label">
        Name
    </label>
    <p class="control has-icons-left">
        <input class="input" type="text" placeholder="Your character's name" id='char-name' value='${chr.name}'>
        <span class="icon is-small is-left">
            <i class="fa fa-user"></i>
        </span>
    </p>
</div>
<div class="field">
    <label class='label'>
        Race
    </label>
    ${raceOptList}
</div>
<div class="field">
    <label class='label'>
        Profession
    </label>
    ${profOptList}
</div>
<div class="field">
    <label class='label'>
        Level
    </label>
    <p class="control has-icons-left">
        <input class='input' type='number' id='char-lvl' min='1' max='${chr.lvl}' value='80'>
        <span class="icon is-small is-left">
            <i class="fa fa-signal"></i>
        </span>
    </p>
</div>
<div class="field">
    <label class='label'>
        Other Info
    </label>
    <p class="control">
        <textarea class='textarea' id='char-other' placeholder='Any other information you wanna include (optional)'>${chr.other||''}</textarea>
    </p>
</div>`,
                function (resp) {
                    //send event!
                    // const title = document.querySelector('#newTitle').value,
                    // text = document.querySelector('#newMsg').value;
                    const theProf = document.querySelector('input[name=char-prof]:checked'),
                        theRace = document.querySelector('input[name=char-race]:checked'),
                        theName = document.querySelector('#char-name');
                    if (!theProf || !theRace || !theName) {
                        bulmabox.alert('Needs More Info', 'You need to specify a profession, race, and name! Otherwise we won\'t know who/what you are!');
                        return false;
                    }
                    const char = {
                        name: document.querySelector('#char-name').value,
                        prof: document.querySelector('input[name=char-prof]:checked').value,
                        race: document.querySelector('input[name=char-race]:checked').value,
                        lvl: document.querySelector('#char-lvl').value,
                        other: document.querySelector('#char-other').value
                    }
                    console.log('User wants to add char', char, resp)
                    $http.post('/user/editChar', char)
                        .then((r) => {
                            $scope.doUser(r.data);
                        })
                }, `<button class='button is-info' onclick='bulmabox.runCb(bulmabox.params.cb)'>Save</button><button class='button is-danger' onclick='bulmabox.kill("bulmabox-diag")'>Cancel</button>`)
        }
        $scope.mail = (usr, oldMsg) => {
            let msgReply = oldMsg? `<div class='notification'>${oldMsg}</div>`:'';
            bulmabox.custom('Send Message',
                `<div class="field">
                ${msgReply}
    <label class='label'>
        Message
    </label>
    <p class="control">
        <textarea class='textarea' id='newMsg' placeholder='What do you wanna say?'></textarea>
    </p>
</div>`,
                function (resp) {
                    //send event!
                    // const title = document.querySelector('#newTitle').value,
                    // text = document.querySelector('#newMsg').value;
                    let theMsg = document.querySelector('#newMsg').value;
                    if (!theMsg) {
                        bulmabox.alert('Huh?', 'Sorry, but we don\'t support uncomfortable silences currently.');
                        return false;
                    }
                    if (!!oldMsg) {
                        theMsg = `<div class='notification'>${oldMsg}</div><br>${theMsg}`;
                    }
                    console.log('old',oldMsg,'new',theMsg)
                    // return false;
                    $http.post('/user/sendMsg', {
                            msg: theMsg,
                            to: usr._id
                        })
                        .then((r) => {
                            //done
                        })
                }, `<button class='button is-info' onclick='bulmabox.runCb(bulmabox.params.cb)'>Send</button><button class='button is-danger' onclick='bulmabox.kill("bulmabox-diag")'>Cancel</button>`)
        }
        $scope.msgView = {
            active: false,
            msg: null,
            mine: false,
        }
        $scope.clearMsg = () => {
            $scope.msgView = {
                active: false,
                msg: null,
                mine: false,
            }
            // $scope.$digest();
        }
        $scope.viewMsg = (m) => {
            console.log('msg object', m)
            const conv = new showdown.Converter(),
                mdMsg = conv.makeHtml(m.msg);
            $scope.msgView.active = true;
            $scope.msgView.mine = true;
            $scope.msgView.msg = m;
            // bulmabox.custom(`Message from ${m.from}`, mdMsg || '(No message)',function(q){
            //     let id=q.slice(q.indexOf(' ')+1);
            //     console.log('user wants to',q, 'with id',id);
            //     if(q.includes('delete ')){
            //         $scope.delMsg(id);
            //     }else if(q.includes('report')){
            //         $scope.repMsg(id);
            //     }else if(q.includes('reply')){
            //         $scope.replyMsg(id);
            //     }
            // },`
            // <button class='button is-success' onclick="bulmabox.kill('bulmabox-diag')">Okay!</button>
            // <button class='button is-info' onclick="bulmabox.runCb(bulmabox.params.cb,'reply ${m._id}')"><i class='fa fa-mail-reply'></i>&nbsp;Reply</button>
            // <button class='button is-white' onclick="bulmabox.runCb(bulmabox.params.cb,'delete ${m._id}')"><i class='fa fa-trash'></i>&nbsp;Trash</button>
            // <button class='button is-danger' onclick="bulmabox.runCb(bulmabox.params.cb,'report ${m._id}')"><i class='fa fa-exclamation'></i>&nbsp;Report</button>
            // `)
            if(m.to){
                return false;
            }
            $http.get('/user/setOneRead?id=' + m._id)
                .then(r => {
                    $scope.doUser(r.data);
                })
        }
        socket.on('reqHeartBeat', sr => {
            $scope.alsoOnline = sr.filter(q => !$scope.user || !$scope.user.user || $scope.user.user != q.name).map(m => m.name);
            if ($scope.allUsers)
                $scope.allUsers.forEach(u => {
                    u.online = $scope.alsoOnline.includes(u.user)
                })
        })
        $scope.delMsg = (m, t) => {
            if (typeof m != 'object') {
                m = {
                    _id: m
                }
            }
            bulmabox.confirm('Delete Message', 'Are you sure you wish to delete this message?', (resp) => {
                console.log('resp', resp);
                if (resp && resp != null) {
                    // return console.log('User would delete msg',m)
                    $http.get('/user/delMsg?id=' + m._id)
                        .then(r => {
                            $scope.doUser(r.data);
                            if (t) {
                                $scope.clearMsg();
                            }
                        })
                }
            })
        }
        $scope.delMyMsg = (m, t) => {
            if (typeof m != 'object') {
                m = {
                    _id: m
                }
            }
            bulmabox.confirm('Delete Message', 'Are you sure you wish to delete this message?', (resp) => {
                console.log('resp', resp);
                if (resp && resp != null) {
                    // return console.log('User would delete msg',m)
                    $http.get('/user/delMyMsg?id=' + m._id)
                        .then(r => {
                            $scope.doUser(r.data);
                            if (t) {
                                $scope.clearMsg();
                            }
                        })
                }
            })
        }
        $scope.replyMsg = m => {
            console.log('User wants to reply to message', m);
            const conv = new showdown.Converter(),
                repTxt = conv.makeHtml(m.msg),
                fromUsr = $scope.allUsers.find(q => q.user == m.from);
            $scope.mail(fromUsr,repTxt);
            $scope.clearMsg();
        }
        $scope.repMsg = (m, t) => {
            if (typeof m != 'object') {
                m = {
                    _id: m
                }
            }
            console.log('user wishes to report msg', m)
            bulmabox.confirm('Report Message', 'Reporting a message sends a notification to the moderators, including the details of the message.<br>It will then be up to the moderators to determine if you\'re being uncool to each other.<br>Are you sure you wish to report this message?', (resp) => {
                $http.post('/user/repMsg', m)
                    .then(r => {
                        //done
                        if (r.data == 'dupRep') {
                            bootbox.alert("Already Reported", "You've already reported this message. Please wait while the moderator team reviews your report.")
                        }
                        if (t) {
                            $scope.clearMsg();
                        }
                    })
            })
        }
        $scope.newPwd = {
            pwd: null,
            pwdDup: null,
            old: null,
            changin: false
        }
        $scope.clearPwd = () => {
            $scope.newPwd = {
                pwd: null,
                pwdDup: null,
                old: null,
                changin: false
            }
        }
        $scope.editPwd = () => {
            if (!$scope.newPwd.pwd || !$scope.newPwd.pwdDup || $scope.newPwd.pwd != $scope.newPwd.pwdDup) {
                bulmabox.alert('<i class="fa fa-exclamation-triangle is-size-3"></i>&nbsp;Password Mismatch', 'Your passwords don\'t match, or are missing!');
            } else {
                $http.post('/user/editPwd', $scope.newPwd).then(r => {
                    if (r.data && r.data != 'err') {
                        $scope.clearPwd();
                        bulmbox.alert('Password Changed!', 'Your password was successfully changed!')
                        $scope.doUser(r.data)
                    } else {
                        bulmabox.alert('<i class="fa fa-exclamation-triangle is-size-3"></i>&nbsp;Error Changing Password', 'There was a problem changing your password. Your old one probably still works, but if you\'re still having an issue, contact a moderator!')
                    }
                })
            }

        }
        $scope.viewEvent = (ev) => {
            bulmabox.alert(`Event: ${ev.title}`, `Date:${$filter('numToDate')(ev.eventDate)}<br>Description:${ev.text}`);
        }
        $scope.emailTimer = () => {
            if ($scope.updEmail) {
                clearTimeout($scope.updEmail);
            }
            $scope.updEmail = setTimeout(function () {
                console.log($scope.user.email);
                $http.get('/user/setEmail?email=' + $scope.user.email)
                    .then(r => {
                        console.log(r);
                        if (r.data && r.data != 'err') {
                            $scope.doUser(r.data);
                        }
                    })
            }, 500);
        }
    })
    .filter('numToDate', function () {
        return function (num) {
            if (isNaN(num)) {
                return 'Invalid date!';
            }
            const theDate = new Date(num);
            console.log(theDate.getMinutes())
            return `${theDate.toLocaleDateString()} ${theDate.getHours()%12}:${theDate.getMinutes().toString().length<2?'0'+theDate.getMinutes():theDate.getMinutes()} ${theDate.getHours()<13?'AM':'PM'}`;
        };
    })
app.controller('forum-cat-cont', function($scope, $http, $state, $location) {
    if (!localStorage.geoUsr) {
        $state.go('app.login');
        //since we really cannot do anything here if user is NOT logged in
    }
    $http.get('/user/getUsr')
        .then(r => {
            $scope.user = r.data;
            console.log('user', $scope.user)
        });
    $scope.newThr = {};
    $scope.fileName = null;
    //how do we wanna structure the forum obj?
    //structure is gonna be categories --> threads ---> indiv posts
    $scope.currCat = $location.search().c;
    $scope.refCat = () => {
        $http.get('/forum/byCat?grp=' + $scope.currCat)
            .then(function(r) {
                console.log('thrds in this cat', r)
                $scope.threads = r.data.sort((a, b) => {
                    //also need to sort by boolean 'stickied'
                    // return a.lastUpd - b.lastUpd;
                    if (a.stickied === b.stickied)
                        return a.lastUpd - b.lastUpd;
                    else if (a.stickied)
                        return -1;
                    else return 1;
                }).map(t=>{
                    t.time = new Date(t.lastUpd)
                    return t;
                });
                // $scope.$apply();
            })
    }
    $scope.refCat();
    $scope.newThrDial = () => {
        $scope.makingThread = true;
    }
    $scope.clearThread = () => {
        $scope.newThr = {};
        $scope.makingThread = false;
        $scope.loadingFile = false;
    }
    $scope.loadFile = () => {
        $scope.loadingFile = true;
        const fr = new FileReader();
    }
    $scope.deleteThread = (e, thr) => {
        e.stopPropagation();
        e.preventDefault();
        bulmabox.confirm('Delete Thread', `Are you absolutely sure you wish to delete the thread '${thr.title}'? <br>Please note that this process is <em>not</em> reversable!`, (resp) => {
            if (!resp || resp == null) {
                return false;
            } else {
                console.log('Deleting thread', thr)
                $http.delete('/forum/deleteThread?id=' + thr._id)
                    .then(r => {
                        $state.go($state.current, {}, { reload: true });
                    })
            }
        })
    }
    $scope.makeThread = () => {
        $scope.newThr.md = $scope.newThr.txt;
        $scope.newThr.text = new showdown.Converter().makeHtml($scope.newThr.txt);
        $scope.newThr.grp = $scope.currCat;
        // console.log('newThr:',$scope.newThr);
        // return false;
        $http.post('/forum/newThread', $scope.newThr)
            .then(function(r) {
                console.log('new thred response', r)
                $state.go($state.current, {}, { reload: true });
            })
    }
    $scope.toggleSticky = (e, t) => {
        e.stopPropagation();
        e.preventDefault();
        $http.get('/forum/toggleSticky?id=' + t)
            .then(r => {
                console.log('response from thread sticky toggle is', r)
                $scope.refCat();
            })
    }
    $scope.toggleLock = (e, t) => {
        e.stopPropagation();
        e.preventDefault();
        $http.get('/forum/toggleLock?id=' + t)
            .then(r => {
                console.log('response from thread lock toggle is', r)
                $scope.refCat();
            })
    }
})

// const handleUpload = function(postBtn,fileInp,fr) {
//     console.log('disabling submit until we get the file!')
//     console.log('File info', fileInp.files[0])
//     postBtn.disabled = true;
//     fr.readAsDataURL(fileInp.files[0]);
//     fr.addEventListener('load', function() {
//         postBtn.disabled = false;
//         console.log(fr.result)
//     })
// }
app.controller('forum-cont', function($scope, $http, $state,$sce) {
    $scope.currMsg = 0;
    $scope.forObj = {};
    if (!localStorage.geoUsr) {
        $state.go('app.login');
        //since we really cannot do anything here if user is NOT logged in
    }
    //how do we wanna structure the forum obj?
    //structure is gonna be categories --> threads ---> indiv posts
    //main page
    $http.get('/forum/cats')
        .then((r) => {
            const forCats = Object.keys(r.data);
            console.log('CATS',r)
            $scope.forObj = forCats.map(ct => {
                return {
                    name: ct,
                    count: r.data[ct].n,
                    time: r.data[ct].t > 0 ? new Date(r.data[ct].t) : null
                }
            })
        })
    //search stuffs
    $scope.searchin=false;
    $scope.search = '';
    $scope.searchTimer = null;
    $scope.doSearch = () => {
        if ($scope.searchTimer) {
            clearTimeout($scope.searchTimer);
        }
        $scope.searchTimer = setTimeout(function() {
            if ($scope.search && $scope.search.length) {
                $http.post('/forum/searchThr', { term: $scope.search })
                    .then(r => {
                        console.log('search response', r);
                        $scope.searchResults = r.data;
                    })
            }
        }, 500)
    }
    //end search stuff
    $scope.goCat = function(n) {
        $state.go('app.forumCat', { c: n })
    }
})
app.controller('forum-thr-cont', function ($scope, $http, $state, $location, $sce) {
    $scope.currMsg = 0;
    $scope.defaultPic = defaultPic;
    $scope.forObj = {};
    $scope.fileName = null
    if (!localStorage.geoUsr) {
        $state.go('app.login');
        //since we really cannot do anything here if user is NOT logged in
    }
    $scope.loadingFile = false;
    $scope.loadFile = () => {
        $scope.loadingFile = true;
        const fr = new FileReader();
    }
    $scope.currCat = $location.search().c;
    $scope.id = $location.search().t;
    // console.log($scope.currCat,)
    $scope.refThred = () => {
        console.log('info to back:', $scope.id)
        $http.get('/forum/thread?id=' + $scope.id)
            .then((r) => {
                console.log('response', r)
                $scope.thr = r.data.thrd;
                r.data.psts.map(ps => {
                    ps.rawText = ps.text;
                    ps.text = $sce.trustAsHtml(ps.text);
                    ps.date = new Date(ps.lastUpd).toLocaleString();
                    ps.wasEdited = ps.lastUpd != ps.createDate;
                    return ps;
                });
                $scope.avas = r.data.ava;
                $scope.thr.posts = $scope.thr.posts.map(psth => {
                    console.log('PSTH', psth, r.data.psts.filter(psps => psps._id == psth.id)[0])
                    const thePst = r.data.psts.filter(psps => psps._id == psth.id)[0];
                    thePst.votesUp = psth.votesUp;
                    thePst.votesDown = psth.votesDown;
                    thePst.byMod = r.data.mods.indexOf(thePst.user) > -1;
                    thePst.order = psth.order;
                    return r.data.psts.filter(psps => psps._id == psth.id)[0];
                }).sort((a, b) => {
                    return a.order - b.order;
                })
                console.log('thred response', $scope.thr, r);
            })
    }
    $scope.refThred();
    $http.get('/user/getUsr').then((r) => {
        $scope.user = r.data;
        console.log('user', $scope.user)
    })
    $scope.newPost = () => {
        // let theText = document.querySelector('#postTxt').value;
        // console.log('new POST',theText,$scope.fileread);
        if (!$scope.newPostTxt && !$scope.fileread) {
            bulmabox.alert('Say Something!', `You can't just post nothing!`);
            return false;
        }
        // return false;
        $http.post('/forum/newPost', {
                thread: $scope.thr._id,
                text: new showdown.Converter().makeHtml($scope.newPostTxt),
                md: $scope.newPostTxt,
                file: $scope.fileread || null
            })
            .then((r) => {
                window.location.reload();
            })
    };
    $scope.vote = (pst, dir) => {
        // console.log('voting for', pst, 'direction', dir, 'which is', typeof dir)
        $http.put('/forum/vote', {
                thread: pst.thread,
                post: pst._id,
                voteUp: !!dir
            })
            .then((r) => {
                console.log('vote response is:', r)
                $scope.refThred();
            })
    }
    $scope.repPost = p=>{
        bulmabox.confirm('Report Post','Are you sure you wish to report this post to the mod team? <br>Please note that abuse of the report feature will result in the mod team being very angery.',e=>{
            if(!!e){
                $http.get('/forums/reportPost?id='+p._id).then(r=>{
                    bulmabox.alert('Post Reported!','This post has been reported. Thanks!')
                }).catch(e=>{
                    bulmabox.alert(`Can't Report`,`There was some issue reporting this post. Sorry!`);
                })
            }
        })
    }
    $scope.quoteMe = (pst) => {
        document.querySelector('#postTxt').value = '>' + pst.md;
    }
})
app.controller('inbox-cont',function($scope,$http,userFact){
	$scope.currMsg = 0;
	console.log('PARENT USER IS:',$scope.$parent.user);
	$scope.chMsg = function(dir){
		if(dir && $scope.currMsg<$scope.$parent.user.msgs.length-1){
			console.log('goin up 1 msg')
			$scope.currMsg++;
		}else if(!dir && $scope.currMsg>0){
			$scope.currMsg--;
		}
		$scope.$digest();
	};
	$scope.interpDate =function(d){
		return new Date(d).toUTCString();
	}
	$scope.reply=function(){
		userFact.writeMsg($scope.$parent.user.msgs[$scope.currMsg].from,$scope.$parent.user.name,true);
	}
	$scope.deleteMsg = function(){
		bootbox.confirm('Are you sure you wish to delete this message? Deleted messages are <i>not</i> recoverable!',function(r){
			if(!r || r==null){
				return;
			}else{
				$http.post('/user/delMsg',{
					user:$scope.$parent.user.name,
					id:$scope.$parent.user.msgs[$scope.currMsg].id
				}).then(function(r){
					if(r.data && r.data.name){
						//refresh user.
						$scope.$parent.user = r.data;
						console.log('affected user',$scope.$parent.user)
						angular.element('body').scope().$digest();
						$scope.currMsgs = Math.min($scope.$parent.user.msgs.length-1,$scope.currMsgs);
					}else if (r.data=='err'){
						bootbox.alert('Error deleting message!')
					}
				})
			}
		});
	}
})
app.controller('log-cont', function($scope, $http, $state, $q, userFact) {
    $scope.noWarn = false;
    $scope.nameOkay = true;
    delete localStorage.geoUsr;
    $scope.checkTimer = false;
    $scope.goReg = () => {
        $state.go('appSimp.register')
    };
    $scope.goLog = () => {
        $state.go('appSimp.login')
    };
    $scope.googLog = () => {
        window.location.href = './user/google';
    }
    $scope.forgot = () => {
        if (!$scope.user) {
            bulmabox.alert('<i class="fa fa-exclamation-triangle is-size-3"></i>&nbsp;Forgot Password', 'To recieve a password reset email, please enter your username!')
            return;
        }
        $http.post('/user/forgot', { user: $scope.user }).then(function(r) {
            console.log('forgot route response', r)
            if (r.data == 'err') {
                bulmabox.alert('<i class="fa fa-exclamation-triangle is-size-3"></i>&nbsp;Forgot Password Error', "It looks like that account either doesn't exist, or doesn't have an email registered with it! Contact a mod for further help.")
            } else {
                bulmabox.alert('Forgot Password', 'Check your email! If your username is registered, you should recieve an email from us with a password reset link.')
            }
        })
    }
    $scope.signin = () => {
        console.log('trying to login with',$scope.user,$scope.pwd)
        $http.post('/user/login', { user: $scope.user, pass: $scope.pwd })
            .then((r) => {
                console.log(r);
                if (r.data=='authErr' || !r.data) {
                    bulmabox.alert('<i class="fa fa-exclamation-triangle is-size-3"></i>&nbsp;Incorrect Login', 'Either your username or password (or both!) are incorrect.');
                }else if(r.data=='banned'){
                    bulmabox.alert('<i class="fa fa-exclamation-triangle is-size-3"></i>&nbsp;Banned', "You've been banned! We're a pretty laid-back guild, so you must have <i>really</i> done something to piss us off!")
                } else {
                    // delete r.data.msgs;
                    console.log('LOGIN RESPONSE',r.data)
                    socket.emit('chatMsg', { msg: `${$scope.user} logged in!` })
                    localStorage.geoUsr = JSON.stringify(r.data.usr);
                    if(r.data.news){
                        bulmabox.alert('Updates/News',`Since you last logged in, the following updates have been implemented:<br><ul style='list-style:disc;'><li>${r.data.news.join('</li><li>')}</li></ul>`)
                    }
                    $state.go('app.dash');
                }
            })
            .catch(e => {
                if(e.data=='unconfirmed'){
                    bulmabox.alert('<i class="fa fa-exclamation-triangle is-size-3"></i>&nbsp;Unconfirmed', "Your account is currently unconfirmed. For anti-spam purposes, we need a [GEO] person to confirm your account. Thanks!")
                }else{

                    bulmabox.alert('<i class="fa fa-exclamation-triangle is-size-3"></i>&nbsp;Error', "There's been some sort of error logging in. This is <i>probably</i> not an issue necessarily with your credentials. Blame Dave!")
                    // console.log(e);
                }
            })
    }
    $scope.checkUser = () => {
        if ($scope.checkTimer) {
            clearTimeout($scope.checkTimer);
        }
        $scope.checkTimer = setTimeout(function() {
            $http.get('/user/nameOkay?name=' + $scope.user)
                .then((r) => {
                    $scope.nameOkay = r.data;
                })
        }, 500)
    }
    $scope.emailBad=false;
    $scope.checkEmail=()=>{
        $scope.emailBad = $scope.email.length && !$scope.email.match(/(\w+\.*)+@(\w+\.)+\w+/g);
    }
    $scope.register = () => {
        if (!$scope.pwd || !$scope.pwdDup || !$scope.user) {
            bulmabox.alert('<i class="fa fa-exclamation-triangle is-size-3"></i>&nbsp;Missing Information', 'Please enter a username, and a password (twice).')
        } else if ($scope.pwd != $scope.pwdDup) {
            console.log('derp')
            bulmabox.alert('<i class="fa fa-exclamation-triangle is-size-3"></i>&nbsp;Password Mismatch', 'Your passwords don\'t match, or are missing!');
        }else if(!$scope.email || $scope.emailBad){
            bulmabox.confirm('<i class="fa fa-exclamation-triangle is-size-3"></i>&nbsp;Send Without Email?',`You've either not included an email, or the format you're using doesn't seem to match any we know. <br>While you can register without a valid email, it'll be much more difficult to recover your account.<br>Register anyway?`,function(resp){
                if(!resp||resp==null){
                    return false;
                }
                $http.post('/user/new', {
                    user: $scope.user,
                    pass: $scope.pwd,
                    email:$scope.email
                })
                .then((r) => {
                    $http.post('/user/login', { user: $scope.user, pass: $scope.pwd })
                        .then(() => {
                            $state.go('app.dash')
                        }).catch(e=>{
                            if(e.data=='duplicate'){
                                bulmabox.alert('<i class="fa fa-exclamation-triangle is-size-3"></i>&nbsp;User Already Exists', "That account already exists. Are you sure you didn't mean to log in?")
                            }
                            if(e.data=='unconfirmed'){
                                $state.go('appSimp.unconfirmed')
                            }
                        })
                }).catch(e=>{
                    if(e.data=='duplicate'){
                        bulmabox.alert('<i class="fa fa-exclamation-triangle is-size-3"></i>&nbsp;User Already Exists', "That account already exists. Are you sure you didn't mean to log in?")
                    }
                    if(e.data=='unconfirmed'){
                        $state.go('appSimp.unconfirmed')
                    }
                })
            })
        } else {
            console.log('running register with user',$scope.user,'and pwd',$scope.pwd)
            $http.post('/user/new', {
                    user: $scope.user,
                    pass: $scope.pwd,
                    email:$scope.email
                })
                .then((r) => {
                    $http.post('/user/login', { user: $scope.user, pass: $scope.pwd })
                        .then(() => {
                            $state.go('app.dash')
                        })
                }).catch(e=>{
                    if(e.data=='duplicate'){
                        bulmabox.alert('<i class="fa fa-exclamation-triangle is-size-3"></i>&nbsp;User Already Exists', "That account already exists. Are you sure you didn't mean to log in?")
                    }
                })
        }
    }
});
String.prototype.capMe = function () {
    return this.slice(0, 1).toUpperCase() + this.slice(1);
}
app.controller('main-cont', function ($scope, $http, $state, userFact) {
    console.log('main controller registered!')
    $scope.user = null;
    userFact.getUser().then(r => {
        $scope.user = r.data;
        // $scope.user.someRandVal = 'potato';
        //user sends their name to back
        socket.emit('hiIm', {
            name: $scope.user.user
        })
    })
    $scope.isActive=true;
    $scope.pokeTimer = null;
    $scope.faceOpen = false;
    const baseTitle = 'Hidden Tyria Geographic Society [GEO] Guild Site';
    window.addEventListener('focus',function(e){
        $scope.isActive = true;
        if($scope.pokeTimer){
            clearInterval($scope.pokeTimer);
        }
        document.title = baseTitle;
    })
    window.addEventListener('blur',function(e){
        $scope.isActive = false;
    })
    const faces = ['😐','😮',]
    socket.on('chatMsgOut',(m)=>{
        //for detecting if someone has mentioned us in chat and w
        if(m.msg.includes('@'+$scope.user.user) && m.user!=$scope.user.user && !$scope.isActive){
            // console.log('this user was mentioned in',m)
            $scope.pokeTimer = setInterval(function(){
                $scope.faceOpen = !$scope.faceOpen;
                let pos = $scope.faceOpen?0:1;
                document.title=faces[pos]+' '+ baseTitle;
            },250)
        }
        // console.log('MESSAGE',m)
    })
    //used to see if this user is still online after a disconnect.
    //also used to see who ELSE is online
    socket.on('reqHeartBeat', function (sr) {
        $scope.alsoOnline = sr.filter(q => !$scope.user || !$scope.user.user || $scope.user.user != q.name).map(m => m.name);
        // console.log('Users that are not this user online',$scope.alsoOnline)
        // console.log('$state is',$state)
        if ($scope.user && $scope.user.user && $state.current.name.includes('app.')) {
            socket.emit('hbResp', {
                name: $scope.user.user
            })
        }
    })
    socket.on('disco',m=>{
        if(!m){
            $scope.col='div:nth-child(even){animation:none;}div:nth-child(odd){animation:none}';
        }else{
            $scope.col='div:nth-child(even){animation:huehue 4s linear 2s infinite;}div:nth-child(odd){animation:huehue 4s linear 0s infinite;}'
        }
    })
    // socket.on('allNames',function(r){
    // 	$scope.online = r;
    // 	console.log('users now online are',r)
    // })
    $scope.explMd = () => {
        bulmabox.alert('Markdown', `<div class='is-size-2'>Markdown</div>
        <hr>
        <div class='is-size-5'>What It Is</div>
        <p>Markdown is a specialized way of formatting text, used by sites like Reddit, Stack Overflow, and apps like Discord.</p>
        <hr>
        <div class='is-size-5'>What It Does</div>
        <p>It allows you to format text with stuff like <strong>bold</strong> or <em>italics</em> without the use of fancy, complex word processors.</p>
        <hr>
        <div class='is-size-4'>Commands:</div>
        <table class="table table-striped table-bordered">
        <thead>
        <tr>
        <th style="text-align:left"><strong>Markdown</strong></th>
        <th style="text-align:left"><strong>Result</strong></th>
        </tr>
        </thead>
        <tbody>
        <tr>
        <td style="text-align:left">#text, ##text,…</td>
        <td style="text-align:left">header (big text). More '#'s means smaller headers</td>
        </tr>
        <tr>
        <td style="text-align:left">*text*, _text_</td>
        <td style="text-align:left"><em>italic text</em></td>
        </tr>
        <tr>
        <td style="text-align:left">**text**,__text,__</td>
        <td style="text-align:left"><strong>bold text</strong></td>
        </tr>
        <tr>
        <td style="text-align:left">~~text~~</td>
        <td style="text-align:left"><s>strikethrough text</s> woops!</td>
        </tr>
        <tr>
        <td style="text-align:left">[link text](link url)</td>
        <td style="text-align:left"><a href="https://www.google.com">links</a></td>
        </tr>
        <tr>
        <td style="text-align:left">- item</td>
        <td style="text-align:left">- item in a bullet list</td>
        </tr>
        <tr>
        <td style="text-align:left">1. item</td>
        <td style="text-align:left">1. Item in a numbered list</td>
        </tr>
        <tr>
        <td style="text-align:left">![alt text](url “hover text”)</td>
        <td style="text-align:left"><img src="https://github.com/adam-p/markdown-here/raw/master/src/common/images/icon48.png" alt="alt text" title="hover text"> (The alt text is displayed if the browser can’t load the image)</td>
        </tr>
        <tr>
        <td style="text-align:left">\`text\`</td>
        <td style="text-align:left"><code>look ma, ima programmer!</code></td>
        </tr>
        </tbody>
        </table>`)
    }
    $scope.sc = '';
    $scope.seekrit = {
        code: ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a', 'Space'],
        on: false,
        asking: false,
        hist: [],
        corrNum: 0,
        whichFont: 0
    };

    $scope.fontOpts = ['aurebesh', 'tengwar quenya-1', 'klingon font', 'hieroglyphic', 'dovahkiin', 'Skyrim_Daedra'];
    document.querySelector('body').addEventListener('keyup', function (e) {
        e.preventDefault();
        // console.log('KEY PRESSED WAS', e)
        if ($scope.seekrit.asking) {
            //asking kweschun, so ignore keypress
            return false;
        }
        const nextCode = $scope.seekrit.code[$scope.seekrit.corrNum]; //the next correct code to be entered
        if ((e.key.toLowerCase() != nextCode && e.code != nextCode)) {
            //wrong code: return false and do nuffink
            // $scope.seekrit.on=false;
            // $scope.sc = '';
            // $scope.seekrit.corrNum=0;
            return false;
        } else if ($scope.seekrit.corrNum + 1 === $scope.seekrit.code.length) {
            //at end
            $scope.seekrit.asking = true;
            bulmabox.confirm('Toggle Secret Mode', 'Are you sure you wanna toggle the Secret Mode?', function (r) {
                if (r && r !== null) {
                    $scope.seekrit.on = !$scope.seekrit.on;
                    if (!!$scope.seekrit.on) {
                        let theFont = $scope.fontOpts[$scope.seekrit.whichFont];
                        $scope.seekrit.whichFont++;
                        if ($scope.seekrit.whichFont >= $scope.fontOpts.length) {
                            $scope.seekrit.whichFont = 0;
                        }
                        $scope.sc = `*:not(.fa){font-family:${theFont},arial!important;}`;
                    } else {
                        $scope.sc = '';
                    }
                    $scope.$digest();
                } else {
                    $scope.sc = '';
                    $scope.$digest();
                }
                $scope.seekrit.asking = false;
                $scope.seekrit.corrNum = 0;
            })
        } else {
            $scope.seekrit.corrNum++;
        }
    })
})
app.controller('nav-cont',function($scope,$http,$state){
	$scope.logout = function() {
        bulmabox.confirm('Logout','Are you sure you wish to logout?', function(resp) {
            if (!resp || resp == null) {
                return true;
            } else {
                $http.get('/user/logout').then(function(r) {
                    console.log('b4 logout usr removl, parent scope is',$scope.$parent.user)
                    $scope.$parent.user=null;
                    console.log('and now its',$scope.$parent.user)
                    $state.go('appSimp.login');
                })
            }
        })
    }
    $scope.mobActive=false;
    //     $scope.gotLogMsg=false;
    // socket.on('doLogout',function(r){
    //     //force logout (likely due to app change)
    //     console.log('APP REQUESTED LOGOUT:',$state.current)
    //     if($state.current.name=='appSimp.login'||$state.current.name=='appSimp.register' || $scope.gotLogMsg){
    //         //don't force logout if we're already logged out, or if we've already got the msg
    //         return false;
    //     }
    //     $scope.gotLogMsg=true;
    //     bulmabox.alert(`App Restarting`,`Hi! I've made some sort of change just now to make this app more awesome! Unfortunately, this also means I've needed to restart it. I'm gonna log you out now.`,function(r){
    //         console.log('herez where user wud b logged out');
    //         $http.get('/user/logout').then(function(r){
    //             $scope.gotLogMsg=false;
    //             $state.go('appSimp.login',{},{reload:true})
    //         })
    //     })
    // })
})
resetApp.controller('reset-contr',function($scope,$http,$location){
	$scope.key = window.location.search.slice(5);

	$http.get('/user/resetUsr?key='+$scope.key).then(function(u){
		console.log('getting reset user status?',u)
		$scope.user=u.data;
	});
	$scope.doReset = function(){
		if(!$scope.user || !$scope.pwd || !$scope.pwdDup || $scope.pwdDup!=$scope.pwd ||!$scope.key){
			bulmabox.alert('Error: Missing data','Make sure you&rsquo;ve reached this page from a password reset link, and that you have entered the same password in both fields!');
		}else{
			$http.post('/user/resetPwd',{
				acct:$scope.user.user,
				pwd:$scope.pwd,
				pwdDup:$scope.pwdDup,
				key:$scope.key
			}).then(function(r){
				console.log('')
				if(r.data=='err'){
					bulmabox.alert('Error resetting password','There was an error resetting your password. Please contact a mod');
				}else{
					bulmabox.alert('Password Reset','Your password was successfully reset! We\'re redirecting you to login now.',function(){
						$scope.goLogin();
					})
				}
			})
		}
	}
	$scope.goLogin = ()=>{
		window.location.href='../../login';
	}
})
const timezoneList = [
   {
      "value": -12,
      "text": "(GMT -12:00) Eniwetok, Kwajalein"
   },
   {
      "value": -11,
      "text": "(GMT -11:00) Midway Island, Samoa"
   },
   {
      "value": -10,
      "text": "(GMT -10:00) Hawaii"
   },
   {
      "value": -9,
      "text": "(GMT -9:00) Alaska"
   },
   {
      "value": -8,
      "text": "(GMT -8:00) Pacific Time (US & Canada)"
   },
   {
      "value": -7,
      "text": "(GMT -7:00) Mountain Time (US & Canada)"
   },
   {
      "value": -6,
      "text": "(GMT -6:00) Central Time (US & Canada), Mexico City"
   },
   {
      "value": -5,
      "text": "(GMT -5:00) Eastern Time (US & Canada), Bogota, Lima"
   },
   {
      "value": -4,
      "text": "(GMT -4:00) Atlantic Time (Canada), Caracas, La Paz"
   },
   {
      "value": -3.5,
      "text": "(GMT -3:30) Newfoundland"
   },
   {
      "value": -3,
      "text": "(GMT -3:00) Brazil, Buenos Aires, Georgetown"
   },
   {
      "value": -2,
      "text": "(GMT -2:00) Mid-Atlantic"
   },
   {
      "value": -1,
      "text": "(GMT -1:00) Azores, Cape Verde Islands"
   },
   {
      "value": 0,
      "text": "(GMT) Western Europe Time, London, Lisbon, Casablanca"
   },
   {
      "value": 1,
      "text": "(GMT +1:00) Brussels, Copenhagen, Madrid, Paris"
   },
   {
      "value": 2,
      "text": "(GMT +2:00) Kaliningrad, South Africa"
   },
   {
      "value": 3,
      "text": "(GMT +3:00) Baghdad, Riyadh, Moscow, St. Petersburg"
   },
   {
      "value": 3.5,
      "text": "(GMT +3:30) Tehran"
   },
   {
      "value": 4,
      "text": "(GMT +4:00) Abu Dhabi, Muscat, Baku, Tbilisi"
   },
   {
      "value": 4.5,
      "text": "(GMT +4:30) Kabul"
   },
   {
      "value": 5,
      "text": "(GMT +5:00) Ekaterinburg, Islamabad, Karachi, Tashkent"
   },
   {
      "value": 5.5,
      "text": "(GMT +5:30) Bombay, Calcutta, Madras, New Delhi"
   },
   {
      "value": 5.75,
      "text": "(GMT +5:45) Kathmandu"
   },
   {
      "value": 6,
      "text": "(GMT +6:00) Almaty, Dhaka, Colombo"
   },
   {
      "value": 7,
      "text": "(GMT +7:00) Bangkok, Hanoi, Jakarta"
   },
   {
      "value": 8,
      "text": "(GMT +8:00) Beijing, Perth, Singapore, Hong Kong"
   },
   {
      "value": 9,
      "text": "(GMT +9:00) Tokyo, Seoul, Osaka, Sapporo, Yakutsk"
   },
   {
      "value": 9.5,
      "text": "(GMT +9:30) Adelaide, Darwin"
   },
   {
      "value": 10,
      "text": "(GMT +10:00) Eastern Australia, Guam, Vladivostok"
   },
   {
      "value": 11,
      "text": "(GMT +11:00) Magadan, Solomon Islands, New Caledonia"
   },
   {
      "value": 12,
      "text": "(GMT +12:00) Auckland, Wellington, Fiji, Kamchatka"
   }
]
const worlds = [{
        id: 1001,
        name: "Anvil Rock",
        population: "High"
    },
    {
        id: 1002,
        name: "Borlis Pass",
        population: "Medium"
    },
    {
        id: 1003,
        name: "Yak's Bend",
        population: "High"
    },
    {
        id: 1004,
        name: "Henge of Denravi",
        population: "Medium"
    },
    {
        id: 1005,
        name: "Maguuma",
        population: "High"
    },
    {
        id: 1006,
        name: "Sorrow's Furnace",
        population: "Medium"
    },
    {
        id: 1007,
        name: "Gate of Madness",
        population: "Medium"
    },
    {
        id: 1008,
        name: "Jade Quarry",
        population: "Medium"
    },
    {
        id: 1009,
        name: "Fort Aspenwood",
        population: "Full"
    },
    {
        id: 1010,
        name: "Ehmry Bay",
        population: "Medium"
    },
    {
        id: 1011,
        name: "Stormbluff Isle",
        population: "Medium"
    },
    {
        id: 1012,
        name: "Darkhaven",
        population: "Medium"
    },
    {
        id: 1013,
        name: "Sanctum of Rall",
        population: "VeryHigh"
    },
    {
        id: 1014,
        name: "Crystal Desert",
        population: "Medium"
    },
    {
        id: 1015,
        name: "Isle of Janthir",
        population: "Medium"
    },
    {
        id: 1016,
        name: "Sea of Sorrows",
        population: "VeryHigh"
    },
    {
        id: 1017,
        name: "Tarnished Coast",
        population: "High"
    },
    {
        id: 1018,
        name: "Northern Shiverpeaks",
        population: "High"
    },
    {
        id: 1019,
        name: "Blackgate",
        population: "Full"
    },
    {
        id: 1020,
        name: "Ferguson's Crossing",
        population: "Medium"
    },
    {
        id: 1021,
        name: "Dragonbrand",
        population: "Medium"
    },
    {
        id: 1022,
        name: "Kaineng",
        population: "High"
    },
    {
        id: 1023,
        name: "Devona's Rest",
        population: "Medium"
    },
    {
        id: 1024,
        name: "Eredon Terrace",
        population: "Medium"
    },
    {
        id: 2001,
        name: "Fissure of Woe",
        population: "Medium"
    },
    {
        id: 2002,
        name: "Desolation",
        population: "VeryHigh"
    },
    {
        id: 2003,
        name: "Gandara",
        population: "High"
    },
    {
        id: 2004,
        name: "Blacktide",
        population: "Medium"
    },
    {
        id: 2005,
        name: "Ring of Fire",
        population: "Medium"
    },
    {
        id: 2006,
        name: "Underworld",
        population: "Medium"
    },
    {
        id: 2007,
        name: "Far Shiverpeaks",
        population: "Medium"
    },
    {
        id: 2008,
        name: "Whiteside Ridge",
        population: "High"
    },
    {
        id: 2009,
        name: "Ruins of Surmia",
        population: "Medium"
    },
    {
        id: 2010,
        name: "Seafarer's Rest",
        population: "VeryHigh"
    },
    {
        id: 2011,
        name: "Vabbi",
        population: "High"
    },
    {
        id: 2012,
        name: "Piken Square",
        population: "VeryHigh"
    },
    {
        id: 2013,
        name: "Aurora Glade",
        population: "High"
    },
    {
        id: 2014,
        name: "Gunnar's Hold",
        population: "Medium"
    },
    {
        id: 2101,
        name: "Jade Sea",
        population: "High"
    },
    {
        id: 2102,
        name: "Fort Ranik",
        population: "Medium"
    },
    {
        id: 2103,
        name: "Augury Rock",
        population: "High"
    },
    {
        id: 2104,
        name: "Vizunah Square",
        population: "Medium"
    },
    {
        id: 2105,
        name: "Arborstone",
        population: "Medium"
    },
    {
        id: 2201,
        name: "Kodash",
        population: "High"
    },
    {
        id: 2202,
        name: "Riverside",
        population: "Full"
    },
    {
        id: 2203,
        name: "Elona Reach",
        population: "VeryHigh"
    },
    {
        id: 2204,
        name: "Abaddon's Mouth",
        population: "Medium"
    },
    {
        id: 2205,
        name: "Drakkar Lake",
        population: "High"
    },
    {
        id: 2206,
        name: "Miller's Sound",
        population: "Medium"
    },
    {
        id: 2207,
        name: "Dzagonur",
        population: "Medium"
    },
    {
        id: 2301,
        name: "Baruch Bay",
        population: "VeryHigh"
    }
];
app.controller('tool-cont', function($scope, $http, $state, $filter, $sce, $window) {
    $scope.showTab = (t) => {
        $scope.currTab = t;
        if($scope.currTab=='WvW Current Match History'){
            $scope.refWvw()
        }
    }
    $scope.currTab = 'Dailies'
    $scope.tabs = [{
        name: 'Dailies',
        icon: 'calendar-check-o'
    }, {
        name: 'WvW Current Match History',
        icon: 'fort-awesome'
    }, {
        name: 'Core/Lodestone Upgrade',
        icon: 'diamond'
    }, {
        name: 'Tier Six Material Conversion',
        icon: 'money'
    }]
    //Dailies
    $scope.dailyRestrict = {};
    $scope.tmrw = false;
    $scope.regetDaily = () => {
        const spd = Object.keys($scope.dailyRestrict).filter(sp => $scope.dailyRestrict[sp]);
        $http.get('/tool/daily' + ($scope.tmrw ? '/tomorrow' : '') + (spd.length ? '?modes=' + spd.join(',') : '')).then(r => {
            console.log('dailyObj', r.data)
            $scope.dailies = r.data;
        })
    }
    $window.addEventListener('keyup', (e) => {
        if (e.which == 39 && !e.shiftKey) {
            $scope.nextSkirm();
            $scope.$digest();
        } else if (e.which == 39 && e.shiftKey) {
            $scope.lastSkirm();
            $scope.$digest();
        } else if (e.which == 37 && !e.shiftKey) {
            $scope.prevSkirm();
            $scope.$digest();
        } else if (e.which == 37 && e.shiftKey) {
            $scope.firstSkirm();
            $scope.$digest();
        }
    })
    $scope.regetDaily();
    //get ALL prices:
    $scope.refPrices = () => {
        $http.get('/tool/allPrices')
            .then(r => {
                $scope.prices = $scope.calcPrices(r.data.p)
            })
    }
    $scope.wvwWorld = false;
    $scope.wvwColors = ['red', 'green', 'blue']
    $scope.wvwPie = {
        cutoutPercentage: 0,
        backgroundColor: ['#aa0000', '#00aa00', '#0000aa'],
        config: {
            plugins: {
                vert: false
            }
        }
    }
    $scope.wvwDisabled = false;
    //NOTE: slice 'size' is current accumulated score for that skirimish; i.e., the score at end of skirimish
    $scope.makeMarkers = () => {
        const icons = ['camp-blue.png',
            'camp-green.png',
            'camp-netural.png',
            'camp-red.png',
            'castle-blue.png',
            'castle-green.png',
            'castle-neutral.png',
            'castle-red.png',
            'keep-blue.png',
            'keep-green.png',
            'keep-netural.png',
            'keep-red.png',
            'ruins-blue.png',
            'ruins-green.png',
            'ruins-neutral.png',
            'ruins-red.png',
            'tower-blue.png',
            'tower-green.png',
            'tower-neutral.png',
            'tower-red.png'
        ]
        $scope.mapMarkers = icons.map(mm => {
            return L.icon({
                iconUrl: './img/wvw/' + mm,
                iconName: mm.replace('.png',''),
                // shadowUrl: null,
                iconSize: [32, 32], // size of the icon
                // shadowSize: [32,32], // size of the shadow
                iconAnchor: [15, 15], // point of the icon which will correspond to marker's location
                // shadowAnchor: [15,15], // the same for the shadow
                popupAnchor: [-3, -76] // point from which the popup should open relative to the iconAnchor
            });
        });
        console.log('Map Markers', $scope.mapMarkers)
    }
    $scope.refWvw = () => {
        $http.get('/tool/wvw' + ($scope.wvwWorld ? '?world=' + $scope.wvwWorld : ''))
            .then(r => {
                console.log('WVW STUFF', r, r.data)
                if (r.data == 'newMatch') {
                    $scope.wvwDisabled = true;
                    $scope.wvw = null;
                    return false;
                } else {
                    $scope.wvwDisabled = false;
                }
                $scope.wvw = r.data.wvw;
                $scope.currentMatch = $scope.wvw.skirmishes.length - 1;

                $scope.wvw.labels = $scope.wvwColors.map(cl => {
                    return r.data.wvw.all_worlds[cl].map(clw => {
                        return worlds.find(wld => wld.id == clw).name;
                    }).join(', ')
                });
                $scope.wvw.skirmishes.forEach(sk => {
                    sk.scoreArr = $scope.wvwColors.map(c => sk.scores[c]);
                })
                $scope.wvw.history = $scope.wvwColors.map(c => {
                    return $scope.wvw.skirmishes.map(sk => sk.scores[c]);
                })
                $scope.wvw.histLabels = new Array($scope.wvw.history[0].length).fill(100).map((c, i) => i + 1);
                $scope.wvw.histColors = [{
                    backgroundColor: 'transparent',
                    borderColor: '#f00',
                    pointBackgroundColor: '#f00'
                }, {
                    backgroundColor: 'transparent',
                    borderColor: '#0f0',
                    pointBackgroundColor: '#0f0'
                }, {
                    backgroundColor: 'transparent',
                    borderColor: '#00f',
                    pointBackgroundColor: '#00f'
                }]
                console.log('WVW', $scope.wvw)
                // $scope.currSkirm = {s:$scope.wvwColors.map(c=>r.data.wvw.scores[c]),l:labels,v:$scope.wvwColors.map(c=>r.data.data.victory_points[c])}
                $scope.mapMarkers = [];
                $scope.wvwOwned = r.data.owned||null;//wot do we own
                $scope.makeMarkers()
                let mapDiv = document.querySelector('#wvw-map');
                console.log('mapDiv', mapDiv, mapDiv.offsetWidth)
                // mapDiv.style.height = mapDiv.getBoundingClientRect().right +'px';
                $scope.doMap( $scope.wvw.maps)
            })
    }
    $scope.nextSkirm = () => {
        if (!$scope.wvw) {
            return false
        }
        if ($scope.wvw.skirmishes.length > $scope.currentMatch + 1) {
            $scope.currentMatch++;
        } else {
            $scope.currentMatch = 0;
        }
        $scope.positionVert();
    }
    $scope.prevSkirm = () => {
        if (!$scope.wvw) {
            return false
        }
        if ($scope.currentMatch && $scope.currentMatch > 0) {
            $scope.currentMatch--;
        } else {
            $scope.currentMatch = $scope.wvw.skirmishes.length - 1;
        }
        $scope.positionVert();
    }
    $scope.lastSkirm = () => {
        $scope.currentMatch = $scope.wvw.skirmishes.length - 1;
        $scope.positionVert();
    }
    $scope.firstSkirm = () => {
        $scope.currentMatch = 0;
        $scope.positionVert();
    }
    //prices!
    $scope.mats = ['blood', 'bone', 'claw', 'fang', 'scale', 'totem', 'venom'];
    $scope.cores = ['glacial', 'onyx', 'destroyer', 'molten', 'corrupted', 'essence', 'crystal', 'charged']
    $scope.calcPrices = (data) => {
        console.log('DATA before prices', data)
        data.push({ hi: 2504, lo: 2504, lName: 'Bottle of Elonian Wine', id: 19663, sName: 'wine' }); //push in bottle of elonian whine
        //mats
        //output is 5-12 t6 for input of 50 t5, 1 t6, 5 cdust, 5 philosorocks
        //MIN: 5 output (5*t6.lo) for 50*t5.hi, 1 t6.hi, 5 cdust.hi
        //MAX: 12 output (12*t6.hi) for 50*t5.lo, 1 t6.lo, 5 cdust.lo
        let dust = data.find(d => d.sName == 't6dust');
        $scope.mats.forEach(m => {
            let t5 = data.find(d => {
                    return d.sName == 't5' + m;
                }),
                t6 = data.find(d => {
                    return d.sName == 't6' + m;
                });
            t6.hiProf = (12 * t6.hi) - ((50 * t5.lo) + (1 * t6.lo) + (5 * dust.lo))
            t6.loProf = (5 * t6.lo) - ((50 * t5.hi) + (1 * t6.hi) + (5 * dust.hi))
            t6.t5 = t5;
            t6.profGood = 0;
            if (t6.hiProf > 0 && t6.loProf > 0) {
                t6.profGood = 1;
            } else if (t6.hiProf < 0 && t6.loProf < 0) {
                t6.profGood = -1;
            }
        })
        $scope.cores.forEach(c => {
            let core = data.find(d => d.sName == 'c' + c),
                l = data.find(d => d.sName == 'l' + c);
            // console.log('TYPE:',c,'CORE',core,'LODE',l)
            l.c = core;
            l.hiProf = l.hi - ((2 * core.lo) + dust.lo + 2504);
            l.loProf = l.lo - ((2 * core.hi) + dust.hi + 2504);
            l.profGood = 0;
            if (l.hiProf > 0 && l.loProf > 0) {
                l.profGood = 1;
            } else if (l.hiProf < 0 && l.loProf < 0) {
                l.profGood = -1;
            }
        })
        console.log('PRICES!', data)
        return data;
    }
    $scope.isMat = (m) => {
        return m.sName.indexOf('t6') > -1 && m.sName != 't6dust';
    }
    $scope.isGem = (m) => {
        // console.log('checking',m,m.sName[0])
        return m.sName.indexOf('t6') < 0 && m.sName != 'wine' && m.sName.indexOf('t5') < 0 && m.sName[0] == 'l';
    }
    $scope.histClick = (e) => {
        console.log('CLICKED:', e, Chart)
        if (!e || !e[0]) return false;
        $scope.currentMatch = e[0]._index;
        $scope.positionVert();
    }
    $scope.positionVert = () => {
        $scope.lineOpts.title.text = `(${$scope.currentMatch+1})`;
        // $scope.$digest();
    }
    Chart.plugins.register({
        id: 'vert',
        afterDraw: function(chart, options) {
            if (chart.config.type != 'doughnut') {
                // $scope.lineXWid = chart.scales[Object.keys(chart.scales)[0]].maxWidth;
                $scope.lineXWid = chart.chartArea.right - chart.chartArea.left;
                $scope.lineYWid = chart.chartArea.left;
                $scope.lineHeight = chart.chartArea.bottom - chart.chartArea.top;
                $scope.lineStepWid = $scope.lineXWid / ($scope.wvw.skirmishes.length - 1);
                // console.log('After Draw', chart, 'WIDTH:', $scope.lineXWid, $scope.lineYWid, $scope.lineHeight, 'SCALE NAMES:', Object.keys(chart.scales));
                // console.log('CHART',JSON.stringify(chart))
                const ctx = chart.canvas.getContext("2d");
                ctx.moveTo($scope.lineYWid + ($scope.currentMatch * $scope.lineStepWid), 5)
                ctx.lineTo($scope.lineYWid + ($scope.currentMatch * $scope.lineStepWid), $scope.lineHeight + 5);
                ctx.strokeStyle = '#fff';
                ctx.stroke();
            }
        }
    });
    $scope.lineOpts = {
        title: { text: `(${$scope.currentMatch+1})` },
        scales: {
            yAxes: [{
                ticks: {
                    beginAtZero: true,
                    fontColor: '#fff'
                },
            }],
            xAxes: [{
                ticks: {
                    fontColor: '#fff'
                },
            }]
        },
        hover: {
            animationDuration: 0
        }
    }
    $scope.refPrices();
    // $scope.refWvw();
    $scope.getMapState=()=>{
        //
        console.log('ZOOM',$scope.map.getZoom(),'BOUNDS',$scope.map.getBounds())
    }
    $scope.unproject = function(m, c) {
        return m.unproject(c, m.getMaxZoom())
    }
    $scope.doMap = function(mapObjs) {
        "use strict";
        // const unproject = function (coord) {
        //     return map.unproject(coord, map.getMaxZoom());
        // }
        let southWest, northEast;

        $scope.map = L.map("wvw-map", {
            minZoom: 0,
            maxZoom: 6,
            // zoomSnap: 0,
            // zoomDelta: 0.3,
            /* wheelPxPerZoomLevel: 140,
            maxBoundsViscosity: 1.0,
            bounceAtZoomLimits: false,
            zoomControl: false,
            attributionControl: false, */
        });

        northEast = $scope.unproject($scope.map, [15700, 8900]);
        southWest = $scope.unproject($scope.map, [5100, 15900]);

        const renderBounds = new L.LatLngBounds($scope.unproject($scope.map, [16384, 0]), $scope.unproject($scope.map, [0, 16384]));
        L.tileLayer("https://tiles.guildwars2.com/2/3/{z}/{x}/{y}.jpg", {
            /* minZoom: 0,
            maxZoom: 7,
            continuousWorld: true */
            subdomains: ["tiles1", "tiles2", "tiles3", "tiles4"],
            bounds: renderBounds,
            minNativeZoom: 4,
            noWrap: true
        }).addTo($scope.map);
        $scope.map.setMaxBounds(new L.LatLngBounds(southWest, northEast));
        $scope.map.setView(new L.LatLng(
                (northEast.lat - southWest.lat) / 2,
                (northEast.lng - southWest.lng) / 2),
            0);
        // map.on("click", onMapClick);

        mapObjs.forEach(mp => {
            mp.objectives.filter(mpf => !!mpf.marker).forEach(mpo => {
                let theMarker = $scope.mapMarkers.find(mmr => mmr.options.iconName == mpo.type.toLowerCase()+'-'+mpo.owner.toLowerCase());
                console.log('THIS OBJECTIVE',mpo,'MARKER (probly)',theMarker,'FROM', mpo.type.toLowerCase()+'-'+mpo.owner.toLowerCase())
                L.marker($scope.unproject($scope.map, mpo.coord), { title: `${mpo.name} (owned by: ${mpo.owner})`, icon: theMarker }).addTo($scope.map)
            })
        })
        setTimeout(function() {
            $scope.map.invalidateSize();
            $scope.map.setZoom(3);
        }, 500)
    }
})
app.controller('unconf-cont', function($scope, $http, $state) {
    // $scope.usr = JSON.parse(localStorage.geoUsr).user;
    $scope.logout = function() {
        $http.get('/user/logout').then(function(r) {
            console.log(r);
            $state.go('appSimp.login');
        })
    }
})
app.factory('socketFac', function ($rootScope) {
  var socket = io.connect();
  return {
    on: function (eventName, callback) {
      socket.on(eventName, function () { 
        var args = arguments;
        $rootScope.$apply(function () {
          callback.apply(socket, args);
        });
      });
    },
    emit: function (eventName, data, callback) {
      socket.emit(eventName, data, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          if (callback) {
            callback.apply(socket, args);
          }
        });
      })
    }
  };
});
app.run(['$rootScope', '$state', '$stateParams', '$transitions', '$q','userFact', function($rootScope, $state, $stateParams, $transitions, $q,userFact) {
    $transitions.onBefore({ to: 'app.**' }, function(trans) {
        let def = $q.defer();
        console.log('TRANS',trans)
        const usrCheck = trans.injector().get('userFact')
        usrCheck.getUser().then(function(r) {
            console.log('response from login chck',r)
            if (r.data && r.data.confirmed) {
                // localStorage.twoRibbonsUser = JSON.stringify(r.user);
                def.resolve(true)
            } else if(r.data){
                def.resolve($state.target('appSimp.unconfirmed',undefined, {location:true}))
            }else{
                // User isn't authenticated. Redirect to a new Target State
                def.resolve($state.target('appSimp.login', undefined, { location: true }))
            }
        }).catch(e=>{
            def.resolve($state.target('appSimp.login', undefined, { location: true }))
        });
        return def.promise;
    });
    // $transitions.onFinish({ to: '*' }, function() {
    //     document.body.scrollTop = document.documentElement.scrollTop = 0;
    // });
}]);
app.factory('userFact', function($http) {
    return {
        getUser: function() {
            return $http.get('/user/getUsr').then(function(s) {
                console.log('getUser in fac says:', s)
                return s;
            })
        }
    };
});
}());
