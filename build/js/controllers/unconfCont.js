app.controller('unconf-cont', function($scope, $http, $state, $log) {
    // $scope.usr = JSON.parse(localStorage.geoUsr).user;
    $scope.logout = function() {
        $http.get('/user/logout').then(function(r) {
            $log.debug(r);
            $state.go('appSimp.login');
        });
    };
});