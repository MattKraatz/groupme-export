"use strict";

app.factory('statsFact', function($q) {

  let statsObj = {},
  customBook = {};

  let crunchStats = (msgArray,bookObj) => {
    return $q((resolve, reject) => {
      let messageDelayArray = [],
          totalDelay = 0,
          dayActivityObject = [],
          dateActivityObject = [],
          totalMessages = 0,
          totalMessagesByUser = {},
          messageLengthByUser = {},
          averageMessageLengthByUser = [],
          likedMessagesArray = [],
          totalLikes = 0,
          totalLikesReceivedByUser = {},
          totalLikesGivenByUser = {},
          averageLikesPerMessageByUser = {},
          averageLikesByUserPerMessage = {},
          selfLikers = {},
          haters = [],
          groupMembers = {},
          prevMsg = {};

      customBook = bookObj;

      bookObj.members.forEach((currentUser) => {
        groupMembers[currentUser.user_id] = currentUser.nickname;
      });

      msgArray.forEach((currentMsg,index) => {
        totalMessages += 1;
        buildObjToSort(currentMsg.user_id,totalMessagesByUser,1);
        if (index > 0) {
          prevMsg = msgArray[(index-1)];
          // Avg Delay Between Messages
          messageDelayArray.push(currentMsg.created_at - prevMsg.created_at);
        }
        if (currentMsg.text === null) {
          currentMsg.text = 'IMAGE'
        }
        // Most active day of the week
        let currentDay = parseUnix(currentMsg.created_at);
        buildObjToSort(currentDay.day,dayActivityObject,1);
        statsObj.mostActiveDay = sortObjByValueDescending(dayActivityObject)[0];
        // Most active dates of all time
        let currentDate = `${currentDay.day}, ${currentDay.month} ${currentDay.date}, ${currentDay.year}`;
        buildObjToSort(currentDate,dateActivityObject,1);
        statsObj.mostActiveDate = sortObjByValueDescending(dateActivityObject)[0];
        // LIKES FUNCTIONALITY
        if (currentMsg.favorited_by.length > 0 && currentMsg.sender_type !== 'system') {
          totalLikes += currentMsg.favorited_by.length;
          likedMessagesArray.push([currentMsg,currentMsg.favorited_by.length]);
          // Total Likes Received By User
          buildObjToSort(currentMsg.user_id,totalLikesReceivedByUser,currentMsg.favorited_by.length);
          // Total Likes Given By User
          currentMsg.favorited_by.forEach((favoritingUser) => {
            buildObjToSort(currentMsg.user_id,totalLikesGivenByUser,1);
            if (favoritingUser === currentMsg.user_id) {
              buildObjToSort(favoritingUser,selfLikers,1);
            }
          });
        }
        // Longest and Shortest Messages on Average
        if (currentMsg.text) {
          buildObjToSort(currentMsg.user_id,messageLengthByUser,currentMsg.text.length);
        }
      })

      // Avg Delay Between Messages
      messageDelayArray.forEach((currentDelay) => {
        totalDelay += currentDelay;
      });
      let groupLife = totalDelay / 60 / 60 / 24 / 365;
      if (groupLife > 1) {
        let groupYears = Math.floor(groupLife);
        statsObj.groupLife = `${groupYears} years`;
      } else {
        let groupMonths = Math.ceil(groupLife * 12);
        statsObj.groupLife = `${groupMonths} months`
      }
      statsObj.averageDelayMinutes = Math.floor(totalDelay / totalMessages / 60);
      // LIKES FUNCTIONALITY
      statsObj.totalLikes = totalLikes;
      let likeRatio = totalLikes / totalMessages;
      if (likeRatio > 0.5) {
        statsObj.likeAdj = 'most';
      } else {
        statsObj.likeAdj = 'some';
      };
      statsObj.mostLikedUserByTotalLikes = sortObjByValueDescending(totalLikesReceivedByUser)[0];
      statsObj.selfLikers = sortObjByValueDescending(selfLikers);
      // Average Likes Received by User per Message Sent
      for (let user in totalLikesReceivedByUser) {
        let averageLikes = Math.floor((totalLikesReceivedByUser[user] * 10) / totalMessagesByUser[user]) / 10;
        buildObjToSort(user,averageLikesPerMessageByUser,averageLikes);
      }
      statsObj.mostLikedUserByLikesPerMessage = sortObjByValueDescending(averageLikesPerMessageByUser)[0];
      // Most Liked Messages
      let messagesSortedByLikes = likedMessagesArray.sort((a,b) => {
        return b[1] - a[1];
      });
      let mostLikedMessageTopTen = [];
      for (let i = 1; i < 6; i++) {
        mostLikedMessageTopTen.push(messagesSortedByLikes[i]);
      }
      statsObj.mostLikedMessageTopTen = mostLikedMessageTopTen;
      statsObj.mostLikedMessage = messagesSortedByLikes[0];
      // Most Active Likers
      statsObj.mostActiveLikerByTotalLikes = sortObjByValueDescending(totalLikesGivenByUser)[0];
      for (let user in totalLikesGivenByUser) {
        let messagesNotByUser = totalMessages - totalMessagesByUser[user];
        let averageLikes = totalLikesGivenByUser[user] / messagesNotByUser;
        buildObjToSort(user,averageLikesByUserPerMessage,averageLikes);
      }
      statsObj.mostActiveLikerByAverageLikes = sortObjByValueDescending(averageLikesByUserPerMessage)[0];
      // Users that gave no likes
      bookObj.members.forEach((member) => {
        if (!totalLikesGivenByUser[member.user_id]) {
          haters.push(member);
        }
      });
      statsObj.haters = haters;
      // Most Active Users
      let mostActiveUsers = sortObjByValueDescending(totalMessagesByUser);
      statsObj.mostActiveUserTopTen = [];
      for (let i = 0; i < 10; i++) {
        statsObj.mostActiveUserTopTen.push(mostActiveUsers[i]);
      }
        statsObj.mostActiveUser = mostActiveUsers[0];
      // Longest and Shortest Messages on Average
      statsObj.totalMessages = totalMessages;
      for (let user in messageLengthByUser) {
        let averageLength = messageLengthByUser[user] / totalMessagesByUser[user];
        buildObjToSort(user,averageMessageLengthByUser,averageLength);
      }
      let sortedAverageMessageLengthByUser = sortObjByValueDescending(averageMessageLengthByUser);
      statsObj.longestMessages = sortedAverageMessageLengthByUser[0];
      statsObj.longestMessages[1] = Math.floor(statsObj.longestMessages[1] * 10) / 10;
      let length = sortedAverageMessageLengthByUser.length;
      statsObj.shortestMessages = sortedAverageMessageLengthByUser[(length - 1)];
      statsObj.shortestMessages[1] = Math.floor(statsObj.shortestMessages[1] * 10) / 10;
      // Replace User ID with actual User Object
      for (let stat in statsObj) {
        if (statsObj[stat].length > 0 && typeof statsObj[stat] === 'object') {
          statsObj[stat].forEach((currentStat,index) => {
            bookObj.members.forEach((currentMember) => {
              if (currentMember.user_id === currentStat) {
                statsObj[stat].splice(index,1,currentMember);
              }
            });
          });
        }
      }
      // RESOLVE STATISTICS OBJECT
    console.log('statsObj',statsObj);
    resolve(statsObj);
    });
  };

  let buildObjToSort = (iteratingObj,globalObject,iterator) => {
    if (globalObject[iteratingObj]) {
      globalObject[iteratingObj] += iterator;
    } else {
      globalObject[iteratingObj] = iterator;
    }
  };

  let sortObjByValueDescending = (objToSort) => {
    let sortable = [];
    for (let i in objToSort) {
      sortable.push([i,objToSort[i]]);
    }
    sortable.sort((a, b) => {
      return b[1] - a[1];
    });
    return sortable;
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

  let buildBook = () => {
    $("#memoriesCover").html(`
      <h1>${customBook.name}</h1>
      <h3>Our GroupMe Memories</h3>
      <img src="${customBook.image_url}"></img>`)
    newStatPage();
    $('#memoriesFlipbook div.page-wrapper:last div.memoriesContent').html(`
  <div class="row text-center">
    <h2>Well, for starters...</h2>
  </div>
  <div class="row">
    <div class="col-xs-12 text-right">
      <span class="smallText">You sent</span><span class="largeText"> <span class="glyphicon glyphicon-envelope"></span> ${statsObj.totalMessages} </span><span class="smallText">total messages over</span class="smallText"><span class="largeText"> ${statsObj.groupLife} </span>
    </div>
  </div>
  <hr>
  <div class="row">
    <div class="col-xs-12 text-left">
      <span class="smallText">...and you liked each other</span> <span class="largeText">${statsObj.likeAdj}</span> <span class="smallText">of the time</span>
    </div>
  </div>
  <div class="row">
    <div class="col-xs-11 text-right">
      <span class="smallText">with</span><span class="largeText"> ${statsObj.totalLikes} <span class="glyphicon glyphicon-heart"></span></span> <span class="smallText">total likes</span>
    </div>
  </div>
  <hr>
  <div class="row">
    <div class="col-xs-12 text-center">
    <span class="largeText"><span class="glyphicon glyphicon-calendar"></span> ${statsObj.mostActiveDay[0]}s </span><span class="smallText">were the most bumpin'</span></div>
  </div>
  <hr>
  <div class="row text-left">
    <div class="col-xs-12"><span class="smallText">And with ${statsObj.mostActiveDate[1]} messages...</span></div>
  </div>
  <div class="row text-center">
    <div class="col-xs-12"><span class="largeText">${statsObj.mostActiveDate[0]}</span></div>
  </div>
  <div class="row text-right">
    <div class="col-xs-12"><span class="smallText">...was the most active date of all time</span></div>
  </div>
  <hr>
  <div class="row text-left">
    <div class="col-xs-12"><span class="smallText"><strong>${statsObj.longestMessages[0].nickname}</strong> was the wordiest, with ${statsObj.longestMessages[1]} characters on average.</span></div>
  </div>
  <hr>
  <div class="row text-right">
    <div class="col-xs-12"><span class="smallText">At ${statsObj.shortestMessages[1]} characters per message, <strong>${statsObj.shortestMessages[0].nickname}</strong> was the briefest.</span></div>
  </div>
    `);
    newStatPage();
    let template = `
  <div class="row text-center">
    <h2>Hall of Fame</h2>
  </div>
  <div class="row">
    <div class="col-xs-12">
      <div class="panel panel-default">
        <div class="panel-heading">
          <h3 class="panel-title">Most Popular, with ${statsObj.mostLikedMessage[1]} likes</p>
        </div>
        <div class="panel-body">
          <div class="media">
            <div class="media-left">
              <img class="media-object profile-crop" src="${statsObj.mostLikedMessage[0].avatar_url}">
            </div>
            <div class="media-body">
              <blockquote>
                <p class="linked-message" page="${statsObj.mostLikedMessage[0].page}" msg-id="${statsObj.mostLikedMessage[0].id}">"${statsObj.mostLikedMessage[0].text}"</p>
                <footer>
                  ${statsObj.mostLikedMessage[0].name}
                </footer>
              </blockquote>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="row">
    <div class="col-xs-12">
      <div class="panel panel-default">
        <div class="panel-heading">
          <h3 class="panel-title">Other good ones...</p>
        </div>
          <table class="table table-condensed table-striped table-hover">
            <thead>
              <th style="width: 100px;">Name</th>
              <th>Message</th>
              <th>Likes</th>
            </thead>
            <tbody>
    `;
    statsObj.mostLikedMessageTopTen.forEach((message) => {
      template += `
          <tr class="linked-message" page="${message[0].page}" msg-id="${message[0].id}">
            <td>${message[0].name}</td>
            <td>${message[0].text}</td>
            <td>${message[1]}</td>
          </tr>`;
    });
     template += `
          </tbody>
        </table>
    </div>
  </div>`;
    $('#memoriesFlipbook div.page-wrapper:last div.memoriesContent').html(template);
    newStatPage();
    template = `
  <div class="row text-center">
    <h2>Superlatives</h2>
  </div>
  <div class="row">
    <div class="col-xs-12">
      <div class="panel panel-default">
        <div class="panel-heading">
          <p>Most Popular User by Average Likes</p>
        </div>
        <div class="panel-body">
          <div class="media">
            <div class="media-left">
              <img class="media-object profile-crop" src="${statsObj.mostLikedUserByLikesPerMessage[0].image_url}">
            </div>
            <div class="media-body">
            <p class="largeText">${statsObj.mostLikedUserByLikesPerMessage[0].nickname}</p><p class="smallText">with an average of ${statsObj.mostLikedUserByLikesPerMessage[1]} likes per message.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="row">
    <div class="col-xs-12">
      <div class="panel panel-default">
        <div class="panel-heading">
          <p>Most Active Talker</h3>
        </div>
        <div class="panel-body">
          <div class="media">
            <div class="media-left">
              <img class="media-object profile-crop" src="${statsObj.mostActiveUser[0].image_url}">
            </div>
            <div class="media-body">
            <p class="largeText">${statsObj.mostActiveUser[0].nickname}</p>
            <p class="smallText">with a total of ${statsObj.mostActiveUser[1]} messages.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="row">
    <div class="col-xs-12">
      <div class="panel panel-default">
        <div class="panel-heading">
          <p>Most Active Liker</h3>
        </div>
        <div class="panel-body">
          <div class="media">
            <div class="media-left">
              <img class="media-object profile-crop" src="${statsObj.mostActiveLikerByTotalLikes[0].image_url}">
            </div>
            <div class="media-body">
            <p class="largeText">${statsObj.mostActiveLikerByTotalLikes[0].nickname}</p>
            <p class="smallText">with a total of ${statsObj.mostActiveLikerByTotalLikes[1]} likes doled out.</p>
            </div>
          </div>
        </div>
      </div>
    </div>`;
    if (statsObj.haters.length > 0) {
      statsObj.haters.forEach((hater) => {
        template += `<li class="media">
        <div class="media-left">
            <img class="media-object" src="${hater.image_url}">
        </div>
        <div class="media-body">
          <h4 class="media-heading">Hater</h4>
          <p class="largeText">${hater.nickname}</p>
          <p class="smallText">didn't ever like a single post</p>
        </div>
      </li>`;
      });
    }
    if (statsObj.selfLikers.length > 0) {
      statsObj.selfLikers.forEach((selfLiker) => {
        template += `<li class="media">
        <div class="media-left">
            <img class="media-object" src="${selfLiker.image_url}">
        </div>
        <div class="media-body">
          <h4 class="media-heading">Most Active Liker</h4>
          <p class="largeText">${selfLiker.nickname}</p>
          <p class="smallText">liked their own post at least once</p>
        </div>
      </li>`;
      });
    }
    template += `
      </ul>
    </div>
  </div>
</div>`;
    $('#memoriesFlipbook div.page-wrapper:last div.memoriesContent').html(template);
    newStatPage();
    $('#memoriesFlipbook div.page-wrapper:last div.memoriesContent').html(`
      <div class="text-center">
        <h2>Memorable Quotes</h2>
      </div>`);
    printMemories();
  };

  let printMemories = (memoriesArray) => {
    if (!memoriesArray) {
      memoriesArray = customBook.memories;
    }
    if ($('#memoriesFlipbook').turn('pages') > 5) {
      let flipbookLength = $('#memoriesFlipbook').turn('pages');
      for (let i = flipbookLength; i > 5; i--) {
        $('#memoriesFlipbook').turn('removePage', i);
      }
    }
    $('#memoriesFlipbook').turn('page',5);
    $("#memoriesFlipbook .memoriesContent:last").empty();
    $("#memoriesFlipbook .memoriesContent:last").html(`
      <div class="text-center">
        <h2>Memorable Quotes</h2>
      </div>`);
    memoriesArray.forEach((memoryObj,index) => {
      if (index > 0 && index % 3 === 0) {
        newMemoryPage();
      }
      let template = `<div class="panel panel-default memory">
        <div class="panel-body">
          <div class="media">
            <div class="media-left media-middle">
                <img class="media-object profile-crop" src="${memoryObj.avatar_url}">
            </div>
            <div class="media-body">
              <blockquote>
                <p class="linked-message" page="${memoryObj.page}" msg-id="${memoryObj.id}">"${memoryObj.text}"</p>
                <footer>
                  ${memoryObj.name}
                </footer>
              </blockquote>
            </div>
            <div class="panel-footer">
              <strong>${memoryObj.parsedDate}</strong>`;
      if (memoryObj.likeArray && memoryObj.likeArray.length > 0) {
        memoryObj.likeArray.forEach((nickname, index) => {
          if (index === 0) {
            template += ` - liked by ${memoryObj.likeArray[0]}`;
          } else {
            template += `, ${nickname}`;
          }
        });
      }
      template += `</div>
          </div>
        </div>
      </div>`;
      $("#memoriesFlipbook .memoriesContent:last").append(template);
    });
    $("#memoriesFlipbook").turn('page',1).turn('stop');
  };

  let newStatPage = () => {
    let element = $("<div>");
    $("#memoriesFlipbook").turn("addPage", element);
    let currentPage = $("#memoriesFlipbook").turn("pages") - 1;
    $("#memoriesFlipbook div.page-wrapper:last div.page").append(`
      <div class="container">
        <div class="memoriesContent">
        </div>
        <span class="page-num">pg. ${currentPage}</span>
      </div>
    `);
    // Turns to the new page with no animation
    $("#memoriesFlipbook").turn("next").turn("stop");
  };

  let newMemoryPage = () => {
    let element = $("<div>");
    $("#memoriesFlipbook").turn("addPage", element);
    let currentPage = $("#memoriesFlipbook").turn("pages") - 1;
    $("#memoriesFlipbook div.page-wrapper:last div.page").append(`
      <div class="container">
        <div class="memoriesContent">
        </div>
        <span class="page-num">pg. ${currentPage}</span>
      </div>
    `);
    // Turns to the new page with no animation
    let lastPage = $("#memoriesFlipbook").turn("pages");
    $("#memoriesFlipbook").turn("page",lastPage).turn("stop");
  };

  function printForeword(newBookObj) {
    if (newBookObj) {
      bookObj = newBookObj;
    }
    let template = '<h2>Foreword</h2><form name="customCover">';
    if (bookObj && bookObj.customForeword) {
      bookObj.customForeword = bookObj.customForeword.replace('/\\n/g','<br><br>');
      template += `<p ng-show="!editMode">${bookObj.customForeword}</p>
      <textarea ng-show="editMode" ng-model="customForewordInput" name="customForeword" class="form-control" type="text" placeholder="Enter your custom introduction here." value="${bookObj.customForeword}"></textarea>`;
    } else {
      template += `<p ng-show="!editMode">Thanks for taking a stroll back through memory lane with GroupMe Memories. Did you know you could customize the message that appears here by clicking on the "Edit this Collection" button below?</p>
      <textarea ng-show="editMode" ng-model="customForewordInput" name="customForeword" class="form-control" type="text" placeholder="Enter your custom introduction here."></textarea></form>`;
    }
    let compiledTemplate = $compile(template)(angular.element('[ng-controller=turnCtrl]').scope());
    $("#foreword").html(compiledTemplate);
  }

  return {crunchStats, buildBook, printMemories, printForeword};
})
