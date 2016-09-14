"use strict";

app.controller('newCtrl',function($scope,groupmeFact) {

  $scope.getConversations = () => {
    if ($scope.$parent.userAccessToken) {
      groupmeFact.getGroupList($scope.$parent.userAccessToken)
        .then((groupArray) => {
          $scope.groupOptions = groupArray;
        })
    } else {
      firebase.auth().onAuthStateChanged((user) => {
        groupmeFact.getGroupList($scope.$parent.userAccessToken)
          .then((groupArray) => {
            $scope.groupOptions = groupArray;
          })
      })
    }
  }

  $scope.groupSelect = '';

  $scope.startingMessageID = '';

  $scope.getMessages = () => {
    groupmeFact.getMessages($scope.groupSelect.group_id,$scope.$parent.userAccessToken,$scope.startingMessageID)
      .then((msgList) => {
        console.log(msgList)
      })
  }

  // TurnJS Configuration
  $scope.readyFlipbook = () => {
    let flipbookSize = {
      width: 1000,
      height: 600
    };
    $("#flipbook").turn({
      when: {
        turning: function(event, page, pageObject) {
          if (page === 1) {
            // add a class here for offset to force centering
            // $("flipbook")
          }
          if (page > 1) {
            // remove the offset class here
            // $("flipbook")
          }
        }
      },
      width: flipbookSize.width,
      height: flipbookSize.height,
      autoCenter: false,
      display: "double",
      inclination: 0
    });

    $("#flipbook").bind('start',
      function (event, pageObject, corner) {
        if (corner === 'tl' || corner === 'bl') {
            event.preventDefault();
        }
      }
    );
  };
});
