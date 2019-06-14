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