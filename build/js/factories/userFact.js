app.factory('userFact', function($http,$log) {
    return {
        getUser: function() {
            return $http.get('/user/getUsr').then(function(s) {
                $log.debug('getUser in fac says:', s);
                return s;
            });
        }
    };
});