app.controller('log-cont', function($scope, $http, $state, $q, userFact) {
    $scope.noWarn = false;
    $scope.nameOkay = true;
    delete localStorage.brethUsr;
    $scope.checkTimer = false;
    $scope.goReg = () => {
        $state.go('appSimp.register')
    };
    $scope.goLog = () => {
        $state.go('appSimp.login')
    };
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
        $http.post('/user/login', { user: $scope.user, pass: $scope.pwd })
            .then((r) => {
                console.log(r);
                if (r.data=='authErr') {
                    bulmabox.alert('<i class="fa fa-exclamation-triangle is-size-3"></i>&nbsp;Incorrect Login', 'Either your username or password (or both!) are incorrect.<hr><span style="font-weight:bold;">Note to Previous Users:</span><br> Your account MAY have been reset due to an issue with the authentication software we were using. For security reasons, I had to wipe the database (including accounts). Really sorry! <br> - Dave (HealyUnit)');
                }else if(r.data=='banned'){
                    bulmabox.alert('<i class="fa fa-exclamation-triangle is-size-3"></i>&nbsp;Banned', "You've been banned! We're a pretty laid-back guild, so you must have <i>really</i> done something to piss us off!")
                } else {
                    // delete r.data.msgs;
                    console.log('LOGIN RESPONSE',r.data)
                    socket.emit('chatMsg', { msg: `${$scope.user} logged in!` })
                    if(r.data.news){
                        bulmabox.alert('Updates/News',`Since you last logged in, the following updates have been implemented:<br><ul style='list-style:disc;'><li>${r.data.news.join('</li><li>')}</li></ul>`)
                    }
                    localStorage.brethUsr = JSON.stringify(r.data.usr);
                    $state.go('app.dash');
                }
            })
            .catch(e => {
                bulmabox.alert('<i class="fa fa-exclamation-triangle is-size-3"></i>&nbsp;Error', "There's been some sort of error logging in. This is <i>probably</i> not an issue necessarily with your credentials. Blame Dave!")
                console.log(e);
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
                        })
                })
            })
        } else {
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
                })
        }
    }
});