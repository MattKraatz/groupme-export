"use strict";

app.controller('profileCtrl',function($scope) {

  $scope.updateToken = () => {
    let accessTokenObj = {accessToken: $scope.$parent.userObj.accessToken};
    firebase.database().ref(`users/${response.uid}`).set(accessTokenObj)
  }
})
