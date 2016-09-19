"use strict";

app.controller('turnCtrl',function($scope,$uibModal,$routeParams,turnFact,groupmeFact) {

  let customBook = {};

  // Image modals
  $(document).off('click','td img').on('click','td img',(event) => {
    $scope.modalImgSrc = event.currentTarget;
    let modalInstance = $uibModal.open({
      ariaLabelledBy: 'full-size image',
      templateUrl: 'src/partials/image-modal.html',
      controller: 'imgModalCtrl',
      scope: $scope
    });
  });

  $scope.turnPage = (pageRef) => {
    $('#flipbook').turn('page', pageRef);
  };

  $scope.backToTOC = () => {
    $('#flipbook').turn('page', 2);
  }

  $scope.editCollection = () => {
    $scope.$parent.editMode = true;
  }

  $scope.commitEdit = () => {
    $('#flipbook').turn('page', 1);
    let bookObj = $scope.$parent.currentGroup;
    bookObj.customTitle = $scope.customTitleInput;
    let bookJSON = JSON.parse(angular.toJson(bookObj));
    firebase.database().ref(`users/${$scope.$parent.currentUser}/books/${bookObj.group_id}`).set(bookJSON)
      .then(() => {
        turnFact.printCover(bookObj);
      });
    $scope.$parent.editMode = false;
  }

  $scope.customTitleInput = '';

  // TurnJS configuration
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
    if ($routeParams.bookID) {
      groupmeFact.getGroup($routeParams.bookID,$scope.$parent.userAccessToken)
        .then((groupObj) => {
          $scope.$parent.currentGroup = groupObj;
        });
      groupmeFact.getMessages($routeParams.bookID,$scope.$parent.userAccessToken)
        .then((msgList) => {
          console.log(msgList);
          // Call to firebase here to pull in the custom object, pass into createBook
          firebase.database().ref(`users/${$scope.$parent.currentUser}/books/${$routeParams.bookID}`).on('value', (snapshot) => {
            customBook = snapshot.val();
            turnFact.createBook(msgList,$scope.groupSelect,customBook);
        })
      });
    };
  };
});
