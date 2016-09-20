"use strict";

app.controller('newCtrl',function($scope,groupmeFact,turnFact) {

  $scope.getConversations = () => {
    if ($scope.$parent.userAccessToken) {
      groupmeFact.getGroupList($scope.$parent.userAccessToken)
        .then((groupArray) => {
          let filteredGroupArray = groupArray.filter((group) => {
            if (group.messages.count !== 0) {
              return true;
            } else {
              return false;
            }
          })
          $scope.groupOptions = filteredGroupArray;
        });
    } else {
      firebase.auth().onAuthStateChanged((user) => {
        groupmeFact.getGroupList($scope.$parent.userAccessToken)
          .then((groupArray) => {
            $scope.groupOptions = groupArray;
          });
      });
    }
  };

  $scope.groupSelect = '';

  $scope.startingMessageID = '';

});
