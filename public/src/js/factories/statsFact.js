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
      statsObj.averageDelayMinutes = Math.floor(totalDelay / totalMessages / 60);
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
      for (let i = 1; i < 8; i++) {
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
      bookObj.members.forEach((member) => {
        if (!totalLikesGivenByUser[member.user_id]) {
          haters.push(member);
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
      // Replace User ID with actual User Object
      for (let stat in statsObj) {
        if (statsObj[stat].length > 0) {
          statsObj[stat].forEach((currentStat,index) => {
            bookObj.members.forEach((currentMember) => {
              if (currentMember.user_id === currentStat) {
                statsObj[stat].splice(index,1,currentMember);
              }
            })
          })
        }
      }
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
<div class="container">
  <div class="row text-center">
    <h2>Well, for starters...</h2>
  </div>
  <div class="row">
    <div class="col-xs-12 text-right">
      <span class="smallText">You sent</span><span class="largeText"> <span class="glyphicon glyphicon-envelope"></span> ${statsObj.totalMessages} </span><span class="smallText">total messages sent over</span class="smallText"><span class="largeText"> 5 </span><span class="smallText">years</span class="smallText">
    </div>
  </div>
  <hr>
  <div class="row">
    <div class="col-xs-12 text-left">
      <span class="smallText">...and you liked each other</span> <span class="largeText">most</span> <span class="smallText">of the time</span>
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
</div>
    `);
    newPage();
    let template = `
<div class="container">
  <div class="row text-center">
    <h2>Hall of Fame</h2>
  </div>
  <div class="row">
    <div class="col-xs-12">
      <blockquote>
        <p class="linked-message" page="${statsObj.mostLikedMessage[0].page}" msg-id="${statsObj.mostLikedMessage[0].id}">${statsObj.mostLikedMessage[0].text}</p>
        <footer>
          ${statsObj.mostLikedMessage[0].name}, most popular with ${statsObj.mostLikedMessage[1]} likes
        </footer>
      </blockquote>
    </div>
  </div>
  <div class="row">
    <div class="col-xs-12">
      <table class="table table-condensed table-striped table-hover">
        <thead>
          <th>Name</th>
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
          </tr>`
    })
     template += `
        </tbody>
      </table>
    </div>
  </div>
</div>`
    $('#memoriesFlipbook div.page-wrapper:last div.memoriesContent').html(template);
    newPage();
    template = `
<div class="container">
  <div class="row text-center">
    <h2>Superlatives</h2>
  </div>
  <div class="row">
    <div class="col-xs-12">
    <ul class="media-list">
      <li class="media">
        <div class="media-left">
            <img class="media-object" src="${statsObj.mostLikedUserByLikesPerMessage[0].image_url}">
        </div>
        <div class="media-body">
          <h4 class="media-heading">Most Popular User by Average Likes</h4>
          <p>${statsObj.mostLikedUserByLikesPerMessage[0].nickname}, with an average of ${statsObj.mostLikedUserByLikesPerMessage[1]} likes per message.</p>
        </div>
      </li>
      <li class="media">
        <div class="media-left">
            <img class="media-object" src="${statsObj.mostLikedUserByTotalLikes[0].image_url}">
        </div>
        <div class="media-body">
          <h4 class="media-heading">Most Popular User by Total Likes</h4>
          <p>${statsObj.mostLikedUserByTotalLikes[0].nickname}, with an average of ${statsObj.mostLikedUserByTotalLikes[1]} likes per message.</p>
        </div>
      </li>
      <li class="media">
        <div class="media-left">
            <img class="media-object" src="${statsObj.mostActiveUser[0].image_url}">
        </div>
        <div class="media-body">
          <h4 class="media-heading">Most Active Talker</h4>
          <p>${statsObj.mostActiveUser[0].nickname}, with ${statsObj.mostActiveUser[1]} messages sent.</p>
        </div>
      </li>
      <li class="media">
        <div class="media-left">
            <img class="media-object" src="${statsObj.mostActiveLikerByTotalLikes[0].image_url}">
        </div>
        <div class="media-body">
          <h4 class="media-heading">Most Active Liker</h4>
          <p>${statsObj.mostActiveLikerByTotalLikes[0].nickname}, with ${statsObj.mostActiveLikerByTotalLikes[1]} likes doled out.</p>
        </div>
      </li>`
    if (statsObj.haters.length > 0) {
      statsObj.haters.forEach((hater) => {
        template += `<li class="media">
        <div class="media-left">
            <img class="media-object" src="${hater.image_url}">
        </div>
        <div class="media-body">
          <h4 class="media-heading">Most Active Liker</h4>
          <p>${hater.nickname}</p>
        </div>
      </li>`
      })
    }
    if (statsObj.selfLikers.length > 0) {
      statsObj.selfLikers.forEach((selfLiker) => {
        template += `<li class="media">
        <div class="media-left">
            <img class="media-object" src="${selfLiker.image_url}">
        </div>
        <div class="media-body">
          <h4 class="media-heading">Most Active Liker</h4>
          <p>${selfLiker.nickname}</p>
        </div>
      </li>`
      })
    }
    template += `
      </ul>
    </div>
  </div>
</div>`
    $('#memoriesFlipbook div.page-wrapper:last div.memoriesContent').html(template);
    newPage();
    $('#memoriesFlipbook div.page-wrapper:last div.memoriesContent').html(`
      <div class="text-center">
        <h2>Memorable Quotes</h2>
      </div>
    `);
    $('#memoriesFlipbook').turn("page",1).turn("stop");
  }

  let printMemories = (memoriesArray) => {
    if ($('#memoriesFlipbook').turn('pages') > 5) {
      console.log('need to clear the memories list');
    }
    $('#memoriesFlipbook').turn('page',5);

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

  function divCheck() {
    // Checking whether the last page's height is approaching page end
    // If so, generates a new page
    let imgCount = $("#memoriesFlipbook .memoriesContent").find('img').length;
    if ($("#memoriesFlipbook .memoriesContent").height() > $('#memoriesFlipbook').turn('size').height - (35 + (120 * imgCount))) {
      let overflowRow = $("#memoriesFlipbook .memoriesContent:last")[0].innerHTML;
      $("#memoriesFlipbook .memoriesContent:last").remove();
      newPage();
      $("#memoriesFlipbook .memoriesContent").append(`
        <tr>
          ${overflowRow}
        </tr>
      `);
    }
  }

  return {crunchStats, buildBook, printMemories}
})
