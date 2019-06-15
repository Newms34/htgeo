app.controller('blog-cont', function ($scope, $http, $state, $filter, $sce) {
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
    $scope.newBlog = {
        title: null,
        contents: null,
        youtube: null,
        pic: null,
        picCand: null,
        youtubeCand: null
    };
    $scope.blogEntries = [{
        author: 'Healy',
        pic: 'https://static.wixstatic.com/media/4c8c05_d15c19168bda4a3c9a3bef232a00310f~mv2.jpg/v1/fit/w_1175,h_661,al_c,q_80/file.png',
        height: 400,
        title: 'A Test Post',
        contents: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc et mi ut mauris rutrum malesuada. Ut tincidunt in ex ac ultrices. Integer nec aliquam massa. Fusce aliquam fermentum augue. Suspendisse sollicitudin lectus libero. Praesent varius nisl eu neque cursus lobortis. Nullam convallis turpis sit amet tortor cursus fermentum. In facilisis pharetra urna, sed feugiat est lobortis a. Vestibulum vehicula malesuada purus, id convallis massa suscipit nec. Nunc a ante nunc. Nullam faucibus porttitor erat, vitae convallis augue tincidunt a.

        Nunc egestas hendrerit orci, ut rutrum ex porta ac. Pellentesque porttitor erat neque, eu pulvinar ex sodales quis. Morbi gravida suscipit nulla nec laoreet. Vivamus eleifend magna leo. Morbi tincidunt iaculis euismod. Aliquam malesuada nunc lacinia, convallis augue quis, consectetur elit. Maecenas mattis purus sollicitudin semper feugiat. Ut at gravida augue, sit amet venenatis arcu. Maecenas et justo ut elit ultrices maximus et ac enim. Sed nec rutrum nibh. Etiam malesuada lacus nisl, eget pretium odio consectetur ut.`,
        // views: 0,
        youtube: `https://www.youtube.com/watch?v=cGZ4X7cER8k`,
        likeNum: 0,
        usrLiked:false,
        when:'A long time ago',
        id: null
    }]
    
    $scope.refBlogs = ()=>{
        $http.get('/blog/allEntries').then(b => {
            if (!b.data) {
                throw new Error('no blogs')
            }
            $scope.blogEntries = $scope.parseBlogs(b.data);
        }).catch(e => {
            $scope.blogEntries = [{
                author: 'System',
                pic: 'https://static.wixstatic.com/media/4c8c05_d15c19168bda4a3c9a3bef232a00310f~mv2.jpg/v1/fit/w_1175,h_661,al_c,q_80/file.png',
                height: 400,
                title: `Couldn't Load Blog`,
                contents: `Your site is probably broken, or your internet connection sucks. We couldn't load any blog info!`,
                // views: 0,
                youtube: null,
                likeNum: 0,
                usrLiked:false,
                when:'A long time ago',
                _id: null
            }]
        });
    }
    $scope.refBlogs();
    $scope.parseBlogs=d=>{
        return d.map(di=>{
            di.height = di.height||400;
            di.likeNum = di.likes.length;
            di.usrLiked = !!di.likes.includes($scope.user._id);
            di.when = new Date(di.date).toLocaleString();
            return di;
        })
    }
    $scope.toggleLike = id => {
        $http.get(`/blog/toggleLike?v=${id}`).then(r => {
            let likeTarg = $scope.blogEntries.find(q => q._id == r.data._id);
            likeTarg.likes = r.data.likes;
            likeTarg.usrLiked = r.data.likes.includes($scope.user._id);
            likeTarg.likeNum = r.data.likes.length;
        })
    }
    $scope.timers = {
        pic: null,
        vid: null
    };
    $scope.picTimer = () => {
        if ($scope.timers.pic) {
            clearTimeout($scope.timers.pic);
        }
        $scope.timers.pic = setTimeout(function () {
            if ($scope.newBlog.picCand && $scope.newBlog.picCand.length) {
                $scope.newBlog.pic = $scope.newBlog.picCand;
            } else {
                $scope.newBlog.pic=null;
            }
        }, 500)
    }
    $scope.vidTimer = () => {
        if ($scope.timers.vid) {
            clearTimeout($scope.timers.vid);
        }
        $scope.timers.vid = setTimeout(function () {
            if ($scope.newBlog.youtubeCand && $scope.newBlog.youtubeCand.length) {
                $scope.newBlog.youtube = $scope.newBlog.youtubeCand;
            } else {
                $scope.newBlog.youtube=null;
            }
        }, 500)
    }
    $scope.newPost = s=>{
        if(!$scope.newBlog.title||!$scope.newBlog.contents){
            return bulmabox.alert('<i class="fa fa-exclamation-triangle is-size-3"></i>&nbsp;Missing Information', 'Your blog post needs a title and at least some text content!');
        }
        let nb = angular.copy($scope.newBlog);
        delete nb.picCand;
        delete nb.youtubeCand;
        $http.post('/blog/newPost',nb).then(r=>{
            // console.log('response from posting new blog:',r)
            $scope.newBlog = {
                title: null,
                contents: null,
                youtube: null,
                pic: null,
                picCand: null,
                youtubeCand: null,
                active:false
            };
            $scope.refBlogs();
        })
    }
})

app.filter('trusted', ['$sce', function ($sce) {
    return function (url) {
        const video_id = url.split('v=')[1].split('&')[0];
        return $sce.trustAsResourceUrl("https://www.youtube.com/embed/" + video_id);
    };
}]);