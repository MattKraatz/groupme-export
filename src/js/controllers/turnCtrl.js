"use strict";

app.controller('turnCtrl',function($scope,$uibModal,$routeParams,turnFact,groupmeFact) {

  let customBook = {},
      cachedMsgList = [];

  $scope.customTitleInput = '';
  $scope.flipbookStatus = 'Please select a group to get started...';
  $scope.conversationLoaded = false;
  $scope.isNewCollection = true;
  $scope.editMode = false;

  $scope.buildNewCollection = () => {
    let groupObj = $scope.groupSelect;
    $scope.getMessages(groupObj);
  }

  // GRAB GROUPME MESSAGES AND BUILD EBOOK
  $scope.getMessages = (groupObj) => {
    $scope.flipbookStatus = 'Grabbing messages from GroupMe...';
    $scope.$parent.currentGroup = groupObj
    $scope.conversationLoaded = true;
    groupmeFact.getMessages(groupObj.group_id,$scope.$parent.userAccessToken,$scope.startingMessageID)
      .then((msgList) => {
        console.log(msgList);
        cachedMsgList = msgList;
        $scope.flipbookStatus = 'Building your eBook...';
        // Call to firebase here to pull in the custom object, pass into createBook
        firebase.database().ref(`users/${$scope.$parent.currentUser}/books/${groupObj.group_id}`).on('value', (snapshot) => {
          let customBook = snapshot.val();
          console.log('custom book',customBook)
          turnFact.createBook(msgList,$scope.groupSelect,customBook);
          $scope.flipbookStatus = 'Done! Check it out.';
        })
      });
  };

  $scope.saveCollection = () => {
    $('#flipbook').turn('page', 1);
    let bookObj = $scope.parent.currentGroup;
    bookObj.customTitle = $scope.customTitleInput;
    let bookJSON = JSON.parse(angular.toJson(bookObj));
    firebase.database().ref(`users/${$scope.$parent.currentUser}/books/${bookObj.group_id}`).set(bookJSON)
      .then(() => {
        turnFact.printCover(bookObj);
      });
  }

  // IMAGE MODAL CONTROL
  $(document).off('click','td img').on('click','td img',(event) => {
    $scope.modalImgSrc = event.currentTarget;
    let modalInstance = $uibModal.open({
      ariaLabelledBy: 'full-size image',
      templateUrl: 'src/partials/image-modal.html',
      controller: 'imgModalCtrl',
      scope: $scope
    });
  });

  // PAGE TURN CONTROL
  $scope.turnPage = (pageRef) => {
    $('#flipbook').turn('page', pageRef);
  };

  $scope.backToTOC = () => {
    $('#flipbook').turn('page', 1);
  }

  // EDIT CONTROL
  $scope.editCollection = () => {
    $scope.editMode = true;
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
    $scope.editMode = false;
  }

  // CSV CONTROL
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

  // TURNJS CONFIGURATION
  $scope.readyFlipbook = () => {
    let flipbookSize = {
      width: 1000,
      height: 600
    };

    $("#flipbook").turn({
      when: {
        turning: function(event, page, view) {
          if (page === 1) {
            turnFact.printCover();
            $('#flipbook')
              .turn('display', 'single')
              .turn('size', (flipbookSize.width / 2), flipbookSize.height)
              .css('margin-left', (flipbookSize.width / 2) + 'px')
              .attr('pointer-events','none');
          }
        },
        turned: function(event, page, view) {
          if (page === 1) {

          }
          if (page !== 1) {
            $('#flipbook')
              .turn('display', 'double')
              .turn('size', flipbookSize.width, flipbookSize.height)
              .css('margin-left', '0px')
              .attr('pointer-events','all');
          }
        }
      },
      width: flipbookSize.width,
      height: flipbookSize.height,
      autoCenter: false,
      display: "double",
      inclination: 0
    });

    $('#flipbook').bind('start', function (event, pageObject, corner) {
        if (corner == 'tl' || corner == 'bl' || corner == 'br') {
            event.preventDefault();
        }
      }
    );

    $('#toc').height(flipbookSize.height).width((flipbookSize.width / 2) - 50)

    if ($routeParams.bookID) {
      $scope.isNewCollection = false;
      groupmeFact.getGroup($routeParams.bookID,$scope.$parent.userAccessToken)
        .then((groupObj) => {
          $scope.getMessages(groupObj);
        });
    };
  };
});
