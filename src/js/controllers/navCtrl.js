"use strict";

app.controller('navCtrl',function($scope,$window) {

  $scope.logout = () => {
    firebase.auth().signOut()
      .then(() => {
        $window.location.href = '#/login'
      })
  }
})
