"use strict";

app.controller('topCtrl',function($scope) {

  $scope.isLoggedIn = false;
  $scope.userAccessToken = '';
  $scope.currentUser = '';
  $scope.editMode = false;

  let scopeApplied = false;

  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      $scope.isLoggedIn = true;
      $scope.currentUser = user.uid;
      firebase.database().ref(`users/${$scope.currentUser}`).on('value', (response) => {
        $scope.userAccessToken = response.val().accessToken;
      if (!scopeApplied) {
        $scope.$apply();
        scopeApplied = true;
      }
      });
    } else {
      $scope.isLoggedIn = false;
      $scope.currentUser = '';
      $scope.userAccessToken = '';
      if (!scopeApplied) {
        $scope.$apply();
        scopeApplied = true;
      }
    }
  });
});
