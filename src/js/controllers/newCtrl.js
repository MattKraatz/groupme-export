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
    groupmeFact.getMessages($scope.groupSelect.group_id,$scope.$parent.userAccessToken,$scope.startingMessageID)
      .then((msgList) => {
        console.log(msgList);
        $scope.flipbookStatus = 'Building your eBook...';
        // Call to firebase here to pull in the custom object, pass into createBook
        firebase.database().ref(`users/${$scope.$parent.currentUser}/books/${$scope.groupSelect.group_id}`).on('value', (snapshot) => {
          let customBook = snapshot.val();
          turnFact.createBook(msgList,$scope.groupSelect,customBook);
          $scope.flipbookStatus = 'Done! Check it out.'
        })
      });
  };

  $scope.saveCollection = () => {
    $('#flipbook').turn('page', 1);
    let groupNumber = $('#title').attr('groupID');
    let bookObj = $scope.groupSelect;
    bookObj.customTitle = $scope.customTitleInput;
    let bookJSON = JSON.parse(angular.toJson(bookObj));
    firebase.database().ref(`users/${$scope.$parent.currentUser}/books/${groupNumber}`).set(bookJSON)
      .then(() => {
        turnFact.printCover(bookObj);
      });
  }
});
