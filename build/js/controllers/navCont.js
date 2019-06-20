app.controller('nav-cont',function($scope,$http,$state, $log){
	$scope.logout = function() {
        bulmabox.confirm('Logout','Are you sure you wish to logout?', function(resp) {
            if (!resp || resp == null) {
                return true;
            } else {
                $http.get('/user/logout').then(function(r) {
                    $log.debug('b4 logout usr removl, parent scope is',$scope.$parent.user);
                    $scope.$parent.user=null;
                    $log.debug('and now its',$scope.$parent.user);
                    $state.go('appSimp.login');
                });
            }
        });
    };
    $scope.mobActive=false;
    //     $scope.gotLogMsg=false;
    // socket.on('doLogout',function(r){
    //     //force logout (likely due to app change)
    //     $log.debug('APP REQUESTED LOGOUT:',$state.current)
    //     if($state.current.name=='appSimp.login'||$state.current.name=='appSimp.register' || $scope.gotLogMsg){
    //         //don't force logout if we're already logged out, or if we've already got the msg
    //         return false;
    //     }
    //     $scope.gotLogMsg=true;
    //     bulmabox.alert(`App Restarting`,`Hi! I've made some sort of change just now to make this app more awesome! Unfortunately, this also means I've needed to restart it. I'm gonna log you out now.`,function(r){
    //         $log.debug('herez where user wud b logged out');
    //         $http.get('/user/logout').then(function(r){
    //             $scope.gotLogMsg=false;
    //             $state.go('appSimp.login',{},{reload:true})
    //         })
    //     })
    // })
});