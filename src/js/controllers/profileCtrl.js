"use strict";

app.controller('profileCtrl',function($scope) {

  $scope.updateToken = () => {
    let accessTokenObj = {accessToken: $scope.$parent.userAccessToken};
    firebase.database().ref(`users/${$scope.$parent.currentUser}`).set(accessTokenObj)
  };
});
