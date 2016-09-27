"use strict";

app.controller('navCtrl',function($scope,$window,$location) {

  $scope.logout = () => {
    firebase.auth().signOut()
      .then(() => {
        $window.location.href = '#/login';
      });
  };

  $scope.getClass = (path) => {
    if ($location.path() === path) {
      return 'active';
    } else {
      '';
    }
  }

});
