"use strict";

app.controller('viewCtrl', function($scope) {
  $scope.getCollections = () => {
    firebase.database().ref(`users/${$scope.$parent.currentUser}/books`).on('value', (response) => {
      $scope.collections = response.val();
    })
  }

  $scope.deleteCollection = (groupID) => {
    firebase.database().ref(`users/${$scope.$parent.currentUser}/books/${groupID}`).remove();
    $scope.getCollections();
  }

  $scope.collections = '';

})
