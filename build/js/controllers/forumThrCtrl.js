app.controller('forum-thr-cont', function ($scope, $http, $state, $location, $sce) {
    $scope.currMsg = 0;
    $scope.defaultPic = defaultPic;
    $scope.forObj = {};
    $scope.fileName = null
    if (!localStorage.geoUsr) {
        $state.go('app.login');
        //since we really cannot do anything here if user is NOT logged in
    }
    $scope.loadingFile = false;
    $scope.loadFile = () => {
        $scope.loadingFile = true;
        const fr = new FileReader();
    }
    $scope.currCat = $location.search().c;
    $scope.id = $location.search().t;
    // console.log($scope.currCat,)
    $scope.refThred = () => {
        console.log('info to back:', $scope.id)
        $http.get('/forum/thread?id=' + $scope.id)
            .then((r) => {
                console.log('response', r)
                $scope.thr = r.data.thrd;
                r.data.psts.map(ps => {
                    ps.rawText = ps.text;
                    ps.text = $sce.trustAsHtml(ps.text);
                    ps.date = new Date(ps.lastUpd).toLocaleString();
                    ps.wasEdited = ps.lastUpd != ps.createDate;
                    return ps;
                });
                $scope.avas = r.data.ava;
                $scope.thr.posts = $scope.thr.posts.map(psth => {
                    console.log('PSTH', psth, r.data.psts.filter(psps => psps._id == psth.id)[0])
                    const thePst = r.data.psts.filter(psps => psps._id == psth.id)[0];
                    thePst.votesUp = psth.votesUp;
                    thePst.votesDown = psth.votesDown;
                    thePst.byMod = r.data.mods.indexOf(thePst.user) > -1;
                    thePst.order = psth.order;
                    return r.data.psts.filter(psps => psps._id == psth.id)[0];
                }).sort((a, b) => {
                    return a.order - b.order;
                })
                console.log('thred response', $scope.thr, r);
            })
    }
    $scope.refThred();
    $http.get('/user/getUsr').then((r) => {
        $scope.user = r.data;
        console.log('user', $scope.user)
    })
    $scope.newPost = () => {
        // let theText = document.querySelector('#postTxt').value;
        // console.log('new POST',theText,$scope.fileread);
        if (!$scope.newPostTxt && !$scope.fileread) {
            bulmabox.alert('Say Something!', `You can't just post nothing!`);
            return false;
        }
        // return false;
        $http.post('/forum/newPost', {
                thread: $scope.thr._id,
                text: new showdown.Converter().makeHtml($scope.newPostTxt),
                md: $scope.newPostTxt,
                file: $scope.fileread || null
            })
            .then((r) => {
                window.location.reload();
            })
    };
    $scope.vote = (pst, dir) => {
        // console.log('voting for', pst, 'direction', dir, 'which is', typeof dir)
        $http.put('/forum/vote', {
                thread: pst.thread,
                post: pst._id,
                voteUp: !!dir
            })
            .then((r) => {
                console.log('vote response is:', r)
                $scope.refThred();
            })
    }
    $scope.repPost = p=>{
        bulmabox.confirm('Report Post','Are you sure you wish to report this post to the mod team? <br>Please note that abuse of the report feature will result in the mod team being very angery.',e=>{
            if(!!e){
                $http.get('/forums/reportPost?id='+p._id).then(r=>{
                    bulmabox.alert('Post Reported!','This post has been reported. Thanks!')
                }).catch(e=>{
                    bulmabox.alert(`Can't Report`,`There was some issue reporting this post. Sorry!`);
                })
            }
        })
    }
    $scope.quoteMe = (pst) => {
        document.querySelector('#postTxt').value = '>' + pst.md;
    }
})