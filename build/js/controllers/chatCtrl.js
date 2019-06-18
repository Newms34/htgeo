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