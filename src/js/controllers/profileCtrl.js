"use strict";

app.controller('profileCtrl',function($scope) {

  $scope.updateToken = () => {
    let accessToken = $scope.$parent.userAccessToken;
    firebase.database().ref(`users/${$scope.$parent.currentUser}/accessToken`).set(accessToken)
  };
});
