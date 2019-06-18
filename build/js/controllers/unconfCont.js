app.controller('unconf-cont', function($scope, $http, $state) {
    // $scope.usr = JSON.parse(localStorage.geoUsr).user;
    $scope.logout = function() {
        $http.get('/user/logout').then(function(r) {
            console.log(r);
            $state.go('appSimp.login');
        })
    }
})