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

  $scope.flipbookStatus = 'Please select a group to get started...';

  $scope.getMessages = () => {
    $scope.flipbookStatus = 'Grabbing messages from GroupMe...'
    groupmeFact.getMessages($scope.groupSelect,$scope.$parent.userAccessToken,$scope.startingMessageID)
      .then((msgList) => {
        console.log(msgList);
        $scope.flipbookStatus = 'Building your eBook...'
        turnFact.createBook(msgList,$scope.groupSelect);
        $scope.flipbookStatus = 'Done! Check it out.'
      });
  };
});
