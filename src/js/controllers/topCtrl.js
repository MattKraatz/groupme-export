"use strict";

app.controller('topCtrl',function($scope) {

  $scope.userAccessToken = '';
  $scope.currentUser = '';

  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      $scope.currentUser = user.uid;
      firebase.database().ref(`users/${$scope.currentUser}`).on('value', (response) => {
        $scope.userAccessToken = response.val().accessToken;
      })
    } else {
      $scope.currentUser = '';
      $scope.userAccessToken = '';
    }
  })


})
