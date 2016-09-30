"use strict";

app.controller('turnCtrl',function($scope,$uibModal,$routeParams,$location,turnFact,groupmeFact,statsFact) {

  let customBook = {},
      cachedMsgList = [],
      groupObj = {},
      topTenMessageIDs = [],
      cachedMemoryPage = 0;

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

  $scope.showMemories = () => {
    $scope.memoriesActive = true;
    $scope.historyActive = false;
    if (!$scope.memoriesComplete) {
      resolveMemoryChanges();
      readyMemoriesFlipbook()
    } else {
      resolveMemoryChanges();
      if (customBook.memories.length > 0) {
        statsFact.printMemories(customBook.memories);
      }
    }
  }

  $scope.showHistory = () => {
    $scope.memoriesActive = false;
    $scope.historyActive = true;
  }

  // ALERTS
  $scope.callingGroupMe = false;
  $scope.buildingEBook = false;
  $scope.EBookComplete = false;
  $scope.shareLinkActive = false;
  $scope.closeCompleteAlert = () => {
    $scope.EBookComplete = false;
  }

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

  $scope.buildNewCollection = () => {
    groupObj = $scope.groupSelect;
    $scope.$parent.currentGroup = groupObj;
    $scope.getMessages(groupObj);
  }

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
          if (customBook) {
            $scope.customTitleInput = customBook.customTitle;
            $scope.customTaglineInput = customBook.customTagline;
            $scope.customForewordInput = customBook.customForeword;
          } else {
            customBook = groupObj;
          }
          if (!customBook.memories) {
            customBook.memories = [];
            customBook.newMemories = [];
            customBook.removeMemories = [];
          } else {
            customBook.newMemories = [];
            customBook.removeMemories = [];
          }
          console.log('custom book',customBook)
          cachedMsgList = turnFact.createBook(msgList,groupObj,customBook);
          console.log('cached message list', cachedMsgList)
          $scope.buildingEBook = false;
          $scope.EBookComplete = true;
        })
      });
  };

  $scope.saveCollection = () => {
    let bookObj = customBook;
    bookObj.customTitle = $scope.customTitleInput;
    bookObj.customTagline = $scope.customTaglineInput;
    bookObj.customForeword = $scope.customForewordInput;
    let bookJSON = JSON.parse(angular.toJson(bookObj));
    firebase.database().ref(`users/${$scope.$parent.currentUser}/books/${bookObj.group_id}`).set(bookJSON)
      .then(() => {console.log('saved')});
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

  // PAGE LINK CONTROL - FROM MEMORIES
  $(document).off('click','#memoriesFlipbook .linked-message').on('click','#memoriesFlipbook .linked-message',(event) => {
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
    if ($(event.currentTarget).hasClass('bold-message')) {
      $(event.currentTarget).removeClass('bold-message');
      customBook.removeMemories.push(msgID);
      if (customBook.newMemories.indexOf(msgID)) {
        customBook.newMemories.splice(customBook.memories.indexOf(msgID),1);
      }
    } else {
      $(event.currentTarget).addClass('bold-message');
      customBook.newMemories.push(msgID);
      if (customBook.removeMemories.indexOf(msgID)) {
        customBook.removeMemories.splice(customBook.memories.indexOf(msgID),1);
      }
    }
  })

  function resolveMemoryChanges() {
    if (customBook.removeMemories.length > 0) {
      customBook.memories.forEach((memoryObj,index) => {
        if (customBook.removeMemories.includes(memoryObj.id)) {
          customBook.memories.splice(index,1);
          let j = customBook.removeMemories.indexOf(memoryObj.id);
          customBook.removeMemories.splice(j,1);
        }
      })
    }
    if (customBook.newMemories.length > 0) {
      let memoryIndex = customBook.memories.length;
      cachedMsgList.forEach((msgObj,index) => {
        msgObj.memoryIndex = memoryIndex + customBook.newMemories.indexOf(msgObj.id);
        if (customBook.newMemories.includes(msgObj.id)) {
          let dateObj = parseUnix(msgObj.created_at)
          msgObj.parsedDate = `${dateObj.month} ${dateObj.date}, ${dateObj.year}`
          msgObj.likeArray = [];
          msgObj.favorited_by.forEach((id) => {
            customBook.members.forEach((member) => {
              if (member.user_id === id) {
                msgObj.likeArray.push(member.nickname);
              }
            })
          })
          customBook.memories.push(msgObj)
          let index = customBook.newMemories.indexOf(msgObj.id);
          customBook.newMemories.splice(index,1);
        }
      })
    }
  }


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

  // SHARE MODAL
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
      .then((statsObj) => {
        topTenMessageIDs.push(statsObj.mostLikedMessage[0].id);
        statsObj.mostLikedMessageTopTen.forEach((msgObj) => {
          topTenMessageIDs.push(msgObj[0].id);
        });
        statsFact.buildBook();
        $scope.memoriesComplete = true;
      });
  }

  let parseUnix = (timestamp) => {
    let time = new Date(timestamp * 1000);
    let months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    let days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    let year = time.getFullYear();
    let month = months[time.getMonth()];
    let date = time.getDate();
    let day = days[time.getDay()];
    return {year: year, month: month, date: date, day: day};
  }

});
