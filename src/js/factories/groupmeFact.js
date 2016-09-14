"use strict";

app.factory('groupmeFact', function($q,$http){

  let messageReturnLimit = 100,
      groupReturnLimit = 50,
      queriedMessages = 0;

  let getGroupList = (accessToken) => {
    return $q((resolve,reject) => {
      $http.get("https://api.groupme.com/v3/groups?token=" + accessToken + "&per_page=" + groupReturnLimit)
        .then((data) => {
            console.log("return from firebase", data.data.response);
            resolve(data.data.response);
          }, (error) => {
            console.error(error);
            reject(error);
          }
        );
    });
  };

  // Grab first set of messages for selected group
  let getMessages = (groupID,accessToken,startingMessageID) => {
    return $q((resolve,reject) => {
      $http.get("https://api.groupme.com/v3/groups/" + groupID + "/messages?token=" + accessToken + "&limit=" + messageReturnLimit)
        .then((data) => {
          let msgList = data.data.response.messages;
          let conversationLength = data.data.response.count;
          if (msgList.length === 0) {
            resolve(msgList)
          } else {
            let lastMessageID = msgList[(msgList.length - 1)].id;
            // Pull additional messages as many times as necessary
            let loopMessages = () => {
              $http.get("https://api.groupme.com/v3/groups/" + groupID + "/messages?token=" + accessToken + "&limit=" + messageReturnLimit + "&before_id=" + lastMessageID)
                .then((data) => {
                  let messages = data.data.response.messages;
                  messages.forEach(function(msg){msgList.push(msg);});
                  lastMessageID = msgList[(msgList.length - 1)].id;
                  checkMessages();
                })
              }
            // Check for number of retrieved messages against the length of the conversation
            let checkMessages = () => {
              queriedMessages = queriedMessages + messageReturnLimit || messageReturnLimit;
              if (queriedMessages <= conversationLength) {
                loopMessages();
              } else {
                console.log(msgList);
                resolve(msgList)
            }}
            checkMessages();
          }
        }, (error) => {
          console.error(error);
          reject(error);
        })
    })
  }

  // Loops through remaining messages to display all
  // let loopMessages = (msgList,accessToken,lastMessageID,conversationLength,groupID) => {
  //   $q((resolve,reject) => {
  //     queriedMessages = queriedMessages + messageReturnLimit || messageReturnLimit;
  //     if (queriedMessages <= conversationLength) {
  //       $http.get("https://api.groupme.com/v3/groups/" + groupID + "/messages?token=" + accessToken + "&limit=" + messageReturnLimit + "&before_id=" + lastMessageID)
  //       .then((data) => {
  //         let messages = data.data.response.messages;
  //         messages.forEach(function(msg){msgList.push(msg);});
  //         lastMessageID = msgList[(msgList.length - 1)].id;
  //         loopMessages(msgList,lastMessageID,conversationLength,groupID);
  //       })
  //       .catch(function(error){console.error(error);});
  //     } else {
  //       resolve(msgList)
        // printMessages(messageList);
        // $("#flipbook").turn("page", 1).turn("stop");
  //     }
  //   })
  // };
  //   $.getJSON("https://api.groupme.com/v3/groups/" + groupID + "/messages?token=" + accessToken + "&limit=" + messageReturnLimit)
  //   .then((d) => {
  //     let msg = d.response.messages;
  //     msg.forEach(function(m){messageList.push(m);});
  //     messagesLength = d.response.count;
  //     if ($("#message-id")[0].value === "") {
  //       lastMessageID = msg[(msg.length - 1)].id;
  //     } else {
  //       lastMessageID = $("#message-id")[0].value;
  //     }
  //     loopMessages(lastMessageID,messagesLength,groupID);
  //   })
  //   .catch(function(error){console.error(error);});
  // };


  return {getGroupList,getMessages}

});
