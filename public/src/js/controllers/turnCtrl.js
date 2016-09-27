"use strict";

app.controller('turnCtrl',function($scope,$uibModal,$routeParams,$location,turnFact,groupmeFact,statsFact) {

  let customBook = {},
      cachedMsgList = [],
      groupObj = {};

  $scope.customTitleInput = '';
  $scope.customTaglineInput = '';
  $scope.customForewordInput = '';
  $scope.conversationLoaded = false;
  $scope.isNewCollection = true;
  $scope.editMode = false;
  $scope.shareLink = '';
  $scope.showTOC = false;
  $scope.groupSelect = '';

  // NAVIGATION
  $scope.memoriesActive = false;
  $scope.historyActive = true;
  $scope.memoriesComplete = false;

  // ALERTS
  $scope.callingGroupMe = false;
  $scope.buildingEBook = false;
  $scope.EBookComplete = false;
  $scope.shareLinkActive = false;

  $scope.closeCompleteAlert = () => {
    $scope.EBookComplete = false;
  }

  $scope.showMemories = () => {
    $scope.memoriesActive = true;
    $scope.historyActive = false;
    if (!$scope.memoriesComplete) {
      readyMemoriesFlipbook();
    }
  }

  $scope.showHistory = () => {
    $scope.memoriesActive = false;
    $scope.historyActive = true;
  }

  $scope.buildNewCollection = () => {
    groupObj = $scope.groupSelect;
    $scope.$parent.currentGroup = groupObj;
    $scope.getMessages(groupObj);
  }

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

  // GRAB GROUPME MESSAGES AND BUILD EBOOK
  $scope.getMessages = (groupObj) => {
    $scope.callingGroupMe = true;
    $scope.$parent.currentGroup = groupObj
    $scope.conversationLoaded = true;
    groupmeFact.getMessages(groupObj.group_id,$scope.$parent.userAccessToken,$scope.startingMessageID)
      .then((msgList) => {
        console.log(msgList);
        cachedMsgList = msgList;
        $scope.callingGroupMe = false;
        $scope.buildingEBook = true;
        // Call to firebase here to pull in the custom object, pass into createBook
        firebase.database().ref(`users/${$scope.$parent.currentUser}/books/${groupObj.group_id}`).on('value', (snapshot) => {
          customBook = snapshot.val();
          if (customBook) {
            $scope.customTitleInput = customBook.customTitle;
            $scope.customTaglineInput = customBook.customTagline;
            $scope.customForewordInput = customBook.customForeword;
          }
          console.log('custom book',customBook)
          turnFact.createBook(msgList,groupObj,customBook);
          $scope.buildingEBook = false;
          $scope.EBookComplete = true;
        })
      });
  };

  $scope.saveCollection = () => {
    $('#flipbook').turn('page', 1);
    let bookObj = $scope.$parent.currentGroup;
    bookObj.customTitle = $scope.customTitleInput;
    bookObj.customTagline = $scope.customTaglineInput;
    bookObj.customForeword = $scope.customForewordInput;
    let bookJSON = JSON.parse(angular.toJson(bookObj));
    firebase.database().ref(`users/${$scope.$parent.currentUser}/books/${bookObj.group_id}`).set(bookJSON)
      .then(() => {

      });
    turnFact.printCover(bookObj);
  }

  // IMAGE MODAL CONTROL
  $(document).off('click','td img').on('click','td img',(event) => {
    $scope.modalImgSrc = event.currentTarget;
    let modalInstance = $uibModal.open({
      ariaLabelledBy: 'full-size image',
      templateUrl: 'src/partials/image-modal.html',
      controller: 'modalCtrl',
      scope: $scope
    });
  });

  // PAGE TURN CONTROL
  $scope.turnPage = (pageRef) => {
    $('#flipbook').turn('page', pageRef);
  };

  // EDIT CONTROL
  $scope.editCollection = () => {
    $scope.editMode = true;
  }

  $scope.commitEdit = () => {
    $('#flipbook').turn('page', 1);
    let bookObj = $scope.$parent.currentGroup;
    bookObj.customTitle = $scope.customTitleInput;
    bookObj.customTagline = $scope.customTaglineInput;
    bookObj.customForeword = $scope.customForewordInput;
    let bookJSON = JSON.parse(angular.toJson(bookObj));
    firebase.database().ref(`users/${$scope.$parent.currentUser}/books/${bookObj.group_id}`).set(bookJSON)
      .then(() => {
        turnFact.printCover(bookObj);
        turnFact.printForeword(bookObj);
      });
    $scope.editMode = false;
  }

  $scope.cancelEdit = () => {
    if (customBook) {
      $scope.customTitleInput = customBook.customTitle;
      $scope.customTaglineInput = customBook.customTagline;
      $scope.customForewordInput = customBook.customForeword;
    } else if (groupObj) {
      $scope.customTitleInput = groupObj.customTitle;
      $scope.customTaglineInput = groupObj.customTagline;
      $scope.customForewordInput = groupObj.customForeword;
    }
    $scope.editMode = false;
  }

  // SHARE CONTROL
  $scope.shareCollection = () => {
    let bookObj = {};
    if (customBook) {
      bookObj = customBook;
    } else {
      bookObj = $scope.$parent.currentGroup;
    }
    bookObj.accessToken = $scope.$parent.userAccessToken;
    let bookJSON = angular.toJson(bookObj);
    bookObj = $.parseJSON(bookJSON);
    firebase.database().ref('shared').push(bookObj)
      .then((response) => {
        $scope.shareLink = `https://groupme-memories.firebaseapp.com/#/shared/${response.key}`;
        $scope.shareLinkActive = true;
        $scope.$apply();
      })
  }

  $scope.closeShareAlert = () => {
    $scope.shareLinkActive = false;
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

  // HISTORY TURNJS CONFIGURATION

  let flipbookSize = {
    width: 1000,
    height: 600
  };

  $scope.readyFlipbook = () => {
    $("#flipbook").turn({
      when: {
        turning: function(event, page, view) {
          if (page === 1) {
            // turnFact.printCover();
          }
        }
      },
      width: flipbookSize.width,
      height: flipbookSize.height,
      autoCenter: true,
      display: "double",
      inclination: 0
    });

    $('#flipbook').bind('start', function (event, pageObject, corner) {
        if (corner == 'tl' || corner == 'bl' || corner == 'br') {
          event.preventDefault();
      }
    }
  );

    if ($location.url().includes('view')) {
      $scope.isNewCollection = false;
      groupmeFact.getGroup($routeParams.bookID,$scope.$parent.userAccessToken)
        .then((groupObj) => {
          $scope.getMessages(groupObj);
        });
    };
    if ($location.url().includes('shared')) {
      let shareKey = $routeParams.shareKey;
      firebase.database().ref('shared/' + shareKey).on('value', (snapshot) => {
        groupObj = snapshot.val();
        $scope.customTitleInput = groupObj.customTitle;
        $scope.customTaglineInput = groupObj.customTagline;
        $scope.customForewordInput = groupObj.customForeword;
        $scope.flipbookStatus = 'Grabbing messages from GroupMe...';
        $scope.conversationLoaded = true;
        groupmeFact.getMessages(groupObj.group_id,groupObj.accessToken)
          .then((msgList) => {
            console.log(msgList);
            cachedMsgList = msgList;
            $scope.flipbookStatus = 'Building your eBook...';
            turnFact.createBook(msgList,groupObj);
            $scope.flipbookStatus = 'Done! Check it out.';
          });
      })
    };
  };

  // MEMORIES TURNJS CONFIGURATION

  let readyMemoriesFlipbook = () => {
    $scope.memoriesComplete = true;
    $("#memoriesFlipbook").turn({
      width: flipbookSize.width,
      height: flipbookSize.height,
      autoCenter: true,
      display: "double",
      inclination: 0
    });
    $('#memoriesFlipbook').bind('start', function (event, pageObject, corner) {
      if (corner == 'tl' || corner == 'bl' || corner == 'br') {
        event.preventDefault();
      }
    })
    let bookObj;
    if (customBook) {
      bookObj = customBook;
    } else {
      bookObj = $scope.$parent.currentGroup;
    }
    statsFact.crunchStats(cachedMsgList,bookObj)
      .then(() => {
        $('#memoriesFlipbook').turn('page',1).turn("stop");
        statsFact.buildBook();
      });
  }

});
