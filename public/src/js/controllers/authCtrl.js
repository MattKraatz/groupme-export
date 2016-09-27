"use strict";

app.controller('authCtrl', function($scope,$window,$timeout) {
  $scope.userObj = {
    email: '',
    password: '',
    accessToken: ''
  };

  $scope.loginUnsuccessful = false;
  $scope.loginSuccessful = false;

  $scope.closeAlert = () => {
    $scope.loginUnsuccessful = false;
  }

  $scope.loginUser = () => {
    firebase.auth().signInWithEmailAndPassword($scope.userObj.email,$scope.userObj.password)
      .then(() => {
        $scope.loginSuccessful = true;
        $scope.$apply();
        $timeout(() => {$window.location.href = '#/profile';},1000)
      })
      .catch((error) => {
        $scope.loginUnsuccessful = true;
        $scope.$apply();
        $timeout(() => {$scope.loginUnsuccessful = false;},4000)
      });
  };

  $scope.registerUser = () => {
    firebase.auth().createUserWithEmailAndPassword($scope.userObj.email,$scope.userObj.password)
      .then((response) => {
        let accessTokenObj = {accessToken: $scope.userObj.accessToken};
        firebase.database().ref(`users/${response.uid}`).set(accessTokenObj)
          .then(() => {
            $window.location.href = '#/profile';
          });
      });
  };

});
