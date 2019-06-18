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