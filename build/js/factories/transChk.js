app.run(['$rootScope', '$state', '$stateParams', '$transitions', '$q','userFact', function($rootScope, $state, $stateParams, $transitions, $q,userFact) {
    $transitions.onBefore({ to: 'app.**' }, function(trans) {
        let def = $q.defer();
        console.log('TRANS',trans)
        const usrCheck = trans.injector().get('userFact')
        usrCheck.getUser().then(function(r) {
            console.log('response from login chck',r)
            if (r.data && r.data.confirmed) {
                // localStorage.twoRibbonsUser = JSON.stringify(r.user);
                def.resolve(true)
            } else if(r.data){
                def.resolve($state.target('appSimp.unconfirmed',undefined, {location:true}))
            }else{
                // User isn't authenticated. Redirect to a new Target State
                def.resolve($state.target('appSimp.login', undefined, { location: true }))
            }
        }).catch(e=>{
            def.resolve($state.target('appSimp.login', undefined, { location: true }))
        });
        return def.promise;
    });
    // $transitions.onFinish({ to: '*' }, function() {
    //     document.body.scrollTop = document.documentElement.scrollTop = 0;
    // });
}]);