"use strict";

app.controller('turnCtrl',function($scope,$uibModal,$routeParams,$location,turnFact,groupmeFact,statsFact) {

  let customBook = {},
      cachedMsgList = [],
      groupObj = {},
      topTenMessageIDs = [],
      cachedMemoryPage = 0;

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

  $scope.showMemories = () => {
    $scope.memoriesActive = true;
    $scope.historyActive = false;
    if (!$scope.memoriesComplete) {
      readyMemoriesFlipbook();
    } else {
      if (customBook.memories.length > 0) {
        statsFact.printMemories(customBook.memories);
      }
    }
  };

  $scope.showHistory = () => {
    $scope.memoriesActive = false;
    $scope.historyActive = true;
  };

  // ALERTS
  $scope.callingGroupMe = false;
  $scope.buildingEBook = false;
  $scope.EBookComplete = false;
  $scope.shareLinkActive = false;
  $scope.closeCompleteAlert = () => {
    $scope.EBookComplete = false;
  };

// CORE FUNCTIONALITY
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
          });
          $scope.groupOptions = filteredGroupArray;
        });
    } else {
      firebase.auth().onAuthStateChanged(() => {
        groupmeFact.getGroupList($scope.$parent.userAccessToken)
          .then((groupArray) => {
            $scope.groupOptions = groupArray;
          });
      });
    }
  };

  $scope.buildNewCollection = () => {
    groupObj = $scope.groupSelect;
    $scope.$parent.currentGroup = groupObj;
    $scope.getMessages(groupObj);
  };

  // GRAB GROUPME MESSAGES AND FIREBASE CUSTOMIZATIONS AND PASS TO TURN FACTORY
  $scope.getMessages = (groupObj) => {
    $scope.callingGroupMe = true;
    $scope.$parent.currentGroup = groupObj;
    $scope.conversationLoaded = true;
    customBook = {};
    groupmeFact.getMessages(groupObj.group_id,$scope.$parent.userAccessToken,$scope.startingMessageID)
      .then((msgList) => {
        $scope.callingGroupMe = false;
        $scope.buildingEBook = true;
        // Call to firebase here to pull in the custom object, pass into createBook
        firebase.database().ref(`users/${$scope.$parent.currentUser}/books/${groupObj.group_id}`).on('value', (snapshot) => {
          customBook = snapshot.val();
          if (!customBook) {
            customBook = groupObj;
          }
          if (!customBook.memories) {
            customBook.memories = [];
            customBook.foreWord = ''
          }
          console.log('custom book',customBook);
          cachedMsgList = turnFact.createBook(msgList,groupObj,customBook);
          console.log('cached message list', cachedMsgList);
          $scope.buildingEBook = false;
          $scope.EBookComplete = true;
        });
      });
  };

  $scope.saveCollection = () => {
    let bookObj = customBook;
    let bookJSON = JSON.parse(angular.toJson(bookObj));
    firebase.database().ref(`users/${$scope.$parent.currentUser}/books/${bookObj.group_id}`).set(bookJSON)
  };

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

  // PAGE LINK CONTROL - FROM MEMORIES
  $(document).off('click','#memoriesFlipbook .memory').on('click','#memoriesFlipbook .memory',(event) => {
    $scope.memoriesActive = false;
    $scope.historyActive = true;
    $scope.$apply();
    $('#flipbook').turn('page', event.currentTarget.attributes.getNamedItem('page').value);
    $('#flipbook [msg-id]').filter(`[msg-id='${event.currentTarget.attributes.getNamedItem('msg-id').value}']`).addClass('bold-message');
  });

  // MEMORY CONTROL
  $(document).off('click','#flipbook [msg-id]').on('click','#flipbook [msg-id]',(event) => {
    cachedMemoryPage = $('#memoriesFlipbook').turn('page');
    let msgID = event.currentTarget.attributes.getNamedItem('msg-id').value;
    if (event.target.nodeName === 'IMG') {
      console.log('img clicked')
    } else {
      // REMOVE MEMORIES
      if ($(event.currentTarget).hasClass('bold-message')) {
        $(event.currentTarget).removeClass('bold-message');
        customBook.memories.forEach((memoryObj,index) => {
          if (memoryObj.id === msgID) {
            customBook.memories.splice(index,1);
          }
        })
      } else {
        // ADD MEMORIES
        $(event.currentTarget).addClass('bold-message');
        cachedMsgList.forEach((msgObj) => {
          if (msgObj.id === msgID) {
            let dateObj = parseUnix(msgObj.created_at);
            msgObj.parsedDate = `${dateObj.month} ${dateObj.date}, ${dateObj.year}`;
            msgObj.likeArray = [];
            msgObj.favorited_by.forEach((id) => {
              customBook.members.forEach((member) => {
                if (member.user_id === id) {
                  msgObj.likeArray.push(member.nickname);
                }
              })
            })
          customBook.memories.push(msgObj);
          }
        })
      }
    }
  });

  // PAGE TURN CONTROL
  $scope.turnPage = (pageRef) => {
    $scope.memoriesActive = false;
    $scope.historyActive = true;
    $('#flipbook').turn('page', pageRef);
  };

  // SHARE CONTROL
  $scope.shareCollection = () => {
    let bookObj = {};
    if (customBook) {
      bookObj = customBook;
    } else {
      bookObj = $scope.$parent.currentGroup;
    }
    bookObj.accessToken = $scope.$parent.userAccessToken;
    bookObj.user_id = $scope.$parent.currentUser;
    let bookJSON = angular.toJson(bookObj);
    bookObj = $.parseJSON(bookJSON);
    firebase.database().ref('shared').push(bookObj)
      .then((response) => {
        $scope.shareLink = `https://groupme-memories.firebaseapp.com/#/shared/${response.key}`;
        $scope.shareLinkActive = true;
        $scope.$apply();
      });
  };

  // SHARE MODAL
  $scope.closeShareAlert = () => {
    $scope.shareLinkActive = false;
  };

  // CSV CONTROL
  $scope.downloadCSV = () => {
    let filteredMsgList = filter(cachedMsgList);
    let msgListJSON = JSON.stringify(filteredMsgList);
    let result = Papa.unparse(msgListJSON);
    let blob = new Blob([result], {type: 'text/csv'});
    saveAs(blob, 'myConversation.csv');
  };

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
    });
    return filteredArray;
  };

  // HISTORY TURNJS CONFIGURATION

  let flipbookSize = {
    width: 1000,
    height: 600
  };

  $scope.readyFlipbook = () => {
    $("#flipbook").turn({
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
    }
    if ($location.url().includes('shared')) {
      let shareKey = $routeParams.shareKey;
      firebase.database().ref('shared/' + shareKey).on('value', (snapshot) => {
        groupObj = snapshot.val();
        customBook = groupObj;
        console.log(groupObj)
        $scope.conversationLoaded = true;
        groupmeFact.getMessages(groupObj.group_id,groupObj.accessToken)
          .then((msgList) => {
            $scope.callingGroupMe = false;
            $scope.buildingEBook = true;
            cachedMsgList = turnFact.createBook(msgList,groupObj);
            console.log('cached message list', cachedMsgList);
            $scope.buildingEBook = false;
            $scope.EBookComplete = true;
          });
      });
    }
  };

  // MEMORIES TURNJS CONFIGURATION

  let readyMemoriesFlipbook = () => {
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
    });
    let bookObj;
    if (customBook) {
      bookObj = customBook;
    } else {
      bookObj = $scope.$parent.currentGroup;
    }
    statsFact.crunchStats(cachedMsgList,bookObj)
      .then((statsObj) => {
        topTenMessageIDs.push(statsObj.mostLikedMessage[0].id);
        statsObj.mostLikedMessageTopTen.forEach((msgObj) => {
          topTenMessageIDs.push(msgObj[0].id);
        });
        statsFact.buildBook();
        $scope.memoriesComplete = true;
      });
  };

  let parseUnix = (timestamp) => {
    let time = new Date(timestamp * 1000);
    let months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    let days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    let year = time.getFullYear();
    let month = months[time.getMonth()];
    let date = time.getDate();
    let day = days[time.getDay()];
    return {year: year, month: month, date: date, day: day};
  };

});
