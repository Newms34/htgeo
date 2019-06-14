app.controller('inbox-cont',function($scope,$http,userFact){
	$scope.currMsg = 0;
	console.log('PARENT USER IS:',$scope.$parent.user);
	$scope.chMsg = function(dir){
		if(dir && $scope.currMsg<$scope.$parent.user.msgs.length-1){
			console.log('goin up 1 msg')
			$scope.currMsg++;
		}else if(!dir && $scope.currMsg>0){
			$scope.currMsg--;
		}
		$scope.$digest();
	};
	$scope.interpDate =function(d){
		return new Date(d).toUTCString();
	}
	$scope.reply=function(){
		userFact.writeMsg($scope.$parent.user.msgs[$scope.currMsg].from,$scope.$parent.user.name,true);
	}
	$scope.deleteMsg = function(){
		bootbox.confirm('Are you sure you wish to delete this message? Deleted messages are <i>not</i> recoverable!',function(r){
			if(!r || r==null){
				return;
			}else{
				$http.post('/user/delMsg',{
					user:$scope.$parent.user.name,
					id:$scope.$parent.user.msgs[$scope.currMsg].id
				}).then(function(r){
					if(r.data && r.data.name){
						//refresh user.
						$scope.$parent.user = r.data;
						console.log('affected user',$scope.$parent.user)
						angular.element('body').scope().$digest();
						$scope.currMsgs = Math.min($scope.$parent.user.msgs.length-1,$scope.currMsgs);
					}else if (r.data=='err'){
						bootbox.alert('Error deleting message!')
					}
				})
			}
		});
	}
})