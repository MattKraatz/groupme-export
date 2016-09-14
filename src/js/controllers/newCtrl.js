"use strict";

app.controller('newCtrl',function($scope,groupmeFact,turnFact) {

  $scope.getConversations = () => {
    if ($scope.$parent.userAccessToken) {
      groupmeFact.getGroupList($scope.$parent.userAccessToken)
        .then((groupArray) => {
          $scope.groupOptions = groupArray;
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

  $scope.getMessages = () => {
    groupmeFact.getMessages($scope.groupSelect,$scope.$parent.userAccessToken,$scope.startingMessageID)
      .then((msgList) => {
        console.log(msgList);
        turnFact.createBook(msgList,$scope.groupSelect);
      });
  };
});
