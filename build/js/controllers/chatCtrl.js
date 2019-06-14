app.controller('chat-cont', function($scope, $http, $state, $filter,$sce) {
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
    $scope.parseMsg = (t)=>{
    	if(t.indexOf('/wiki ')===0){
    		return `Wiki: <a href="https://wiki.guildwars2.com/wiki/${t.slice(6)}" target="_blank">${t.slice(6)}</a>`
    	}else if(t.indexOf('/google ')===0){
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
    socket.on('msgOut', function(msg) {
    	console.log($scope.parseMsg(msg.msg),'IS THE MESSAGE')
    	msg.msg = $sce.trustAsHtml($scope.parseMsg(msg.msg));
        $scope.msgs.push(msg);
        if ($scope.msgs.length > 100) {
            $scope.msgs.shift();
        }
        $scope.$apply()
        //scroll to bottom of chat window? HAO DU
        document.querySelector('#chat-container').scrollTop = document.querySelector('#chat-container').scrollHeight;
    })
    socket.on('disconnect', function() {
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
        socket.emit('chatMsg', { user: $scope.user.user, msg: $scope.newMsg })
        $scope.newMsg = '';
    }
})