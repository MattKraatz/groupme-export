"use strict";

app.controller('authCtrl', function($scope,$window) {
  $scope.userObj = {
    email: '',
    password: '',
    accessToken: ''
  }

  $scope.loginUser = () => {
    firebase.auth().signInWithEmailAndPassword($scope.userObj.email,$scope.userObj.password);
  }

  $scope.registerUser = () => {
    firebase.auth().createUserWithEmailAndPassword($scope.userObj.email,$scope.userObj.password)
      .then((response) => {
        let accessTokenObj = {accessToken: $scope.userObj.accessToken};
        firebase.database().ref(`users/${response.uid}`).set(accessTokenObj)
          .then(() => {
            $window.location.href = '/profile'
          })
      });
  }

})
