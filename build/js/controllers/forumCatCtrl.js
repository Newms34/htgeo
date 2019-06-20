app.controller('forum-cat-cont', function($scope, $http, $state, $location, $log) {
    if (!localStorage.geoUsr) {
        $state.go('app.login');
        //since we really cannot do anything here if user is NOT logged in
    }
    $http.get('/user/getUsr')
        .then(r => {
            $scope.user = r.data;
            $log.debug('user', $scope.user);
        });
    $scope.newThr = {};
    $scope.fileName = null;
    //how do we wanna structure the forum obj?
    //structure is gonna be categories --> threads ---> indiv posts
    $scope.currCat = $location.search().c;
    $scope.refCat = () => {
        $http.get('/forum/byCat?grp=' + $scope.currCat)
            .then(function(r) {
                $log.debug('thrds in this cat', r);
                $scope.threads = r.data.sort((a, b) => {
                    //also need to sort by boolean 'stickied'
                    // return a.lastUpd - b.lastUpd;
                    if (a.stickied === b.stickied)
                        return a.lastUpd - b.lastUpd;
                    else if (a.stickied)
                        return -1;
                    else return 1;
                }).map(t=>{
                    t.time = new Date(t.lastUpd);
                    return t;
                });
                // $scope.$apply();
            });
    };
    $scope.refCat();
    $scope.newThrDial = () => {
        $scope.makingThread = true;
    };
    $scope.clearThread = () => {
        $scope.newThr = {};
        $scope.makingThread = false;
        $scope.loadingFile = false;
    };
    $scope.loadFile = () => {
        $scope.loadingFile = true;
        const fr = new FileReader();
    };
    $scope.deleteThread = (e, thr) => {
        e.stopPropagation();
        e.preventDefault();
        bulmabox.confirm('Delete Thread', `Are you absolutely sure you wish to delete the thread '${thr.title}'? <br>Please note that this process is <em>not</em> reversable!`, (resp) => {
            if (!resp || resp == null) {
                return false;
            } else {
                $log.debug('Deleting thread', thr);
                $http.delete('/forum/deleteThread?id=' + thr._id)
                    .then(r => {
                        $state.go($state.current, {}, { reload: true });
                    });
            }
        });
    };
    $scope.makeThread = () => {
        $scope.newThr.md = $scope.newThr.txt;
        $scope.newThr.text = new showdown.Converter().makeHtml($scope.newThr.txt);
        $scope.newThr.grp = $scope.currCat;
        // $log.debug('newThr:',$scope.newThr);
        // return false;
        $http.post('/forum/newThread', $scope.newThr)
            .then(function(r) {
                $log.debug('new thred response', r);
                $state.go($state.current, {}, { reload: true });
            });
    };
    $scope.toggleSticky = (e, t) => {
        e.stopPropagation();
        e.preventDefault();
        $http.get('/forum/toggleSticky?id=' + t)
            .then(r => {
                $log.debug('response from thread sticky toggle is', r);
                $scope.refCat();
            });
    };
    $scope.toggleLock = (e, t) => {
        e.stopPropagation();
        e.preventDefault();
        $http.get('/forum/toggleLock?id=' + t)
            .then(r => {
                $log.debug('response from thread lock toggle is', r);
                $scope.refCat();
            });
    };
});

// const handleUpload = function(postBtn,fileInp,fr) {
//     $log.debug('disabling submit until we get the file!')
//     $log.debug('File info', fileInp.files[0])
//     postBtn.disabled = true;
//     fr.readAsDataURL(fileInp.files[0]);
//     fr.addEventListener('load', function() {
//         postBtn.disabled = false;
//         $log.debug(fr.result)
//     })
// }