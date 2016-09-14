"use strict";

app.controller('topCtrl',function($scope) {

  $scope.isLoggedIn = false;
  $scope.userAccessToken = '';
  $scope.currentUser = '';

  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      $scope.isLoggedIn = true;
      $scope.currentUser = user.uid;
      firebase.database().ref(`users/${$scope.currentUser}`).on('value', (response) => {
        $scope.userAccessToken = response.val().accessToken;
      $scope.$apply();
      });
    } else {
      $scope.isLoggedIn = false;
      $scope.currentUser = '';
      $scope.userAccessToken = '';
      $scope.$apply();
    }
  });
});
