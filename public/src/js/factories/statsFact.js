"use strict";

app.factory('statsFact', function($q) {

  let statsObj = {};

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
          shortestMessagesOnAverage = '',
          longestMessagesOnAverage = '',
          activeUsers = [],
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

      bookObj.members.forEach((currentUser) => {
        groupMembers[currentUser.user_id] = currentUser.nickname;
      })

      msgArray.forEach((currentMsg,index) => {
        totalMessages += 1;
        buildObjToSort(currentMsg.user_id,totalMessagesByUser,1);
        activeUsers = Object.keys(totalMessagesByUser);
        if (index > 0) {
          prevMsg = msgArray[(index-1)];
          // Avg Delay Between Messages
          messageDelayArray.push(currentMsg.created_at - prevMsg.created_at);
        };
        // Most active day of the week
        let currentDay = parseUnix(currentMsg.created_at);
        buildObjToSort(currentDay.day,dayActivityObject,1)
        statsObj.mostActiveDay = sortObjByValueDescending(dayActivityObject)[0];
        // Most active dates of all time
        let currentDate = `${currentDay.day}, ${currentDay.month} ${currentDay.date}, ${currentDay.year}`;
        buildObjToSort(currentDate,dateActivityObject,1)
        statsObj.mostActiveDate = sortObjByValueDescending(dateActivityObject)[0];
        // LIKES FUNCTIONALITY
        if (currentMsg.favorited_by.length > 0) {
          totalLikes += currentMsg.favorited_by.length;
          likedMessagesArray.push([currentMsg,currentMsg.favorited_by.length])
          // Total Likes Received By User
          buildObjToSort(currentMsg.user_id,totalLikesReceivedByUser,currentMsg.favorited_by.length)
          // Total Likes Given By User
          currentMsg.favorited_by.forEach((favoritingUser) => {
            buildObjToSort(currentMsg.user_id,totalLikesGivenByUser,1);
            if (favoritingUser === currentMsg.user_id) {
              console.log('this dude is full of himself', favoritingUser)
              buildObjToSort(favoritingUser,selfLikers,1);
            }
          })
        }
        // Longest and Shortest Messages on Average
        if (currentMsg.text) {
          buildObjToSort(currentMsg.user_id,messageLengthByUser,currentMsg.text.length);
        }
      })

      // Avg Delay Between Messages
      messageDelayArray.forEach((currentDelay, index) => {
        totalDelay += currentDelay;
      })
      statsObj.averageDelaySeconds = totalDelay / totalMessages;
      // LIKES FUNCTIONALITY
      statsObj.totalLikes = totalLikes;
      statsObj.mostLikedUserByTotalLikes = sortObjByValueDescending(totalLikesReceivedByUser)[0];
      statsObj.selfLikers = sortObjByValueDescending(selfLikers);
      // Average Likes Received by User per Message Sent
      for (let user in totalLikesReceivedByUser) {
        let averageLikes = totalLikesReceivedByUser[user] / totalMessagesByUser[user];
        buildObjToSort(user,averageLikesPerMessageByUser,averageLikes);
      }
      statsObj.mostLikedUserByLikesPerMessage = sortObjByValueDescending(averageLikesPerMessageByUser)[0];
      // Most Liked Messages
      let messagesSortedByLikes = likedMessagesArray.sort((a,b) => {
        return b[1] - a[1];
      })
      let mostLikedMessageTopTen = [];
      for (let i = 0; i < 10; i++) {
        mostLikedMessageTopTen.push(messagesSortedByLikes[i])
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
      activeUsers.forEach((user, index) => {
        if (!totalLikesGivenByUser[user]) {
          haters.push(user);
        }
      })
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
      let length = sortedAverageMessageLengthByUser.length;
      statsObj.shortestMessages = sortedAverageMessageLengthByUser[(length - 1)];
      // RESOLVE STATISTICS OBJECT
    console.log(statsObj);
    resolve(statsObj);
    })
  }

  let buildObjToSort = (iteratingObj,globalObject,iterator) => {
    if (globalObject[iteratingObj]) {
      globalObject[iteratingObj] += iterator;
    } else {
      globalObject[iteratingObj] = iterator;
    }
  }

  let sortObjByValueDescending = (objToSort) => {
    let sortable = [];
    for (let i in objToSort) {
      sortable.push([i,objToSort[i]])
    };
    sortable.sort((a, b) => {
      return b[1] - a[1];
    });
    return sortable;
  }

  let parseUnix = (timestamp) => {
    let time = new Date(timestamp * 1000);
    let months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    let days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
    let year = time.getFullYear();
    let month = months[time.getMonth()];
    let date = time.getDate();
    let day = days[time.getDay()];
    return {year: year, month: month, date: date, day: day};
  }

  let buildBook = () => {
    newPage();
    $('#memoriesFlipbook').turn("next").turn("stop");
    $('#memoriesFlipbook div.page-wrapper:last div.memoriesContent').html(`
      <h2>Group Summary</h2>
        <ul>
          <li>Total Messages: ${statsObj.totalMessages}</li>
          <li>Total Likes: ${statsObj.totalLikes}</li>
          <li>Average Time Elapsed Between Messages: ${statsObj.averageDelaySeconds}</li>
          <li>Most Active Day of the Week: ${statsObj.mostActiveDay[0]}</li>
          <li>Most Active Date of All Time: ${statsObj.mostActiveDate[0]} with ${statsObj.mostActiveDate[1]} messages</li>
          <li>Longest Messages: ${statsObj.longestMessages[0]} with an average of ${statsObj.longestMessages[1]} characters per message</li>
          <li>Shortest Messages: ${statsObj.shortestMessages[0]} with an average of ${statsObj.shortestMessages[1]} characters per message</li>
        </ul>
    `);
    newPage();
    $('#memoriesFlipbook div.page-wrapper:last div.memoriesContent').html(`
      <h2>Popular Messages</h2>
        <ul>
          <li>Most Liked Message: ${statsObj.mostLikedMessage[0].text} with ${statsObj.mostLikedMessage[1]} likes</li>
          <li>Other Liked Messages: ${statsObj.mostLikedMessageTopTen}</li>
          <li>Most Liked User on Average: ${statsObj.mostLikedUserByLikesPerMessage[0]}</li>
          <li>Most Liked User by Total Likes: ${statsObj.mostLikedUserByTotalLikes[0]}</li>
        </ul>
    `);
    newPage();
    $('#memoriesFlipbook div.page-wrapper:last div.memoriesContent').html(`
      <h2>Activity by User</h2>
        <ul>
          <li>Haters: ${statsObj.haters} </li>
          <li>Self-Likers: ${statsObj.selfLikers}</li>
          <li>Most Active User: ${statsObj.mostActiveUser[0]} with a total of ${statsObj.mostActiveUser[1]} messages</li>
          <li>Other Active Users: ${statsObj.mostActiveUserTopTen}</li>
        </ul>
    `);
    $('#memoriesFlipbook').turn("page",1).turn("stop");
  }

  let newPage = () => {
    let element = $("<div>");
    $("#memoriesFlipbook").turn("addPage", element);
    let currentPage = $("#memoriesFlipbook").turn("pages") - 2;
    $("#memoriesFlipbook div.page-wrapper:last div.page").append(`
      <div class="memoriesContent">
      </div>
      <span class="page-num">pg. ${currentPage}</span>
    `);
    // Turns to the new page with no animation
    $("#memoriesFlipbook").turn("next").turn("stop");
  }

  return {crunchStats, buildBook}
})
