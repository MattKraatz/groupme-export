"use strict";

app.controller('turnCtrl',function($scope,$uibModal,$routeParams,turnFact,groupmeFact) {

  let customBook = {},
      cachedMsgList = [];

  $scope.customTitleInput = '';

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

  $scope.downloadCSV = () => {
    let filteredMsgList = filter(cachedMsgList);
    let msgListJSON = JSON.stringify(filteredMsgList);
    let result = Papa.unparse(msgListJSON);
    let blob = new Blob([result], {type: 'text/csv'});
    saveAs(blob, 'myConversation.csv');
  }

  let filter = (arrayOfMessages) => {
    let filteredArray = [];
    arrayOfMessages.forEach((object) => {
      let filteredObject = {
        timestamp: object.created_at,
        name: object.name,
        message: object.text,
        image: ''
      };
      if (object.attachments[0] && object.attachments[0].type === "image") {
        filteredObject.image = object.attachments[0].url;
      }
      filteredArray.push(filteredObject);
    })
    return filteredArray;
  }

  let flatten = (arrayOfObjects) => {
    let flatArray = [];
    arrayOfObjects.forEach((object) => {
      let flatObj = {};
      for (let prop in object) {
        if (object[prop] && object[prop].constructor === Array) {
          if (object[prop].length > 0) {
            flatObj[prop] = {};
            object[prop].forEach((value, index) => {
              flatObj[(prop + "-" + index)] = value;
            })
          }
        } else {
          flatObj[prop] = object[prop];
        }
      }
      flatArray.push(flatObj);
    })
    return flatArray;
  }

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
          cachedMsgList = msgList;
          // Call to firebase here to pull in the custom object, pass into createBook
          firebase.database().ref(`users/${$scope.$parent.currentUser}/books/${$routeParams.bookID}`).on('value', (snapshot) => {
            customBook = snapshot.val();
            turnFact.createBook(msgList,$scope.groupSelect,customBook);
        })
      });
    };
  };
});
