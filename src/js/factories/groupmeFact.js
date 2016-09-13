"use strict";

app.factory('groupmeFact', function($q,$http){

  let returnLimit = 100;

  let getGroupList = (accessToken) => {
    return $q((resolve,reject) => {
      $http.get("https://api.groupme.com/v3/groups?token=" + accessToken)
        .then((data) => {
            console.log("return from firebase", data);
            return data.response;
          }, (error) => {
            console.error(error);
            reject(error);
          }
        );
    });
  };

  // Grab first set of messages for selected group
  let getMessages = (groupID,accessToken) => {
    $.getJSON("https://api.groupme.com/v3/groups/" + groupID + "/messages?token=" + accessToken + "&limit=" + returnLimit)
    .then((d) => {
      let msg = d.response.messages;
      msg.forEach(function(m){messageList.push(m);});
      messagesLength = d.response.count;
      if ($("#message-id")[0].value === "") {
        lastMessageID = msg[(msg.length - 1)].id;
      } else {
        lastMessageID = $("#message-id")[0].value;
      }
      loopMessages(lastMessageID,messagesLength,groupID);
    })
    .catch(function(error){console.error(error);});
  };

  // Loops through remaining messages to display all
  let loopMessages = (lastMessageID,messagesLength,groupID) => {
    queriedMessages = queriedMessages + returnLimit || returnLimit;
    if (queriedMessages <= messagesLength) {
      $.getJSON("https://api.groupme.com/v3/groups/" + groupID + "/messages?token=" + $("#access-token")[0].value + "&limit=" + returnLimit + "&before_id=" + lastMessageID)
      .then((d) => {
        let msg = d.response.messages;
        msg.forEach(function(m){messageList.push(m);});
        lastMessageID = msg[(msg.length - 1)].id;
        loopMessages(lastMessageID,messagesLength,groupID);
      })
      .catch(function(error){console.error(error);});
    } else {
      printMessages(messageList);
      $("#flipbook").turn("page", 1).turn("stop");
    }
  };

  return {getGroupList,getMessages}

});
