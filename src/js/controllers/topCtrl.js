"use strict";

app.controller('topCtrl',function($scope) {

  $scope.userAccessToken = '';

  firebase.auth().onAuthStateChanged((user) => {
    if (user) {

    } else {
      $scope.userAccessToken = '';
    }
  })


})
