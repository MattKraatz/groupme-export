"use strict";

app.factory('groupmeFact', function($q,$http){

  let messageReturnLimit = 100,
      groupReturnLimit = 50,
      queriedMessages = 0;

  let getGroupList = (accessToken) => {
    return $q((resolve,reject) => {
      $http.get("https://api.groupme.com/v3/groups?token=" + accessToken + "&per_page=" + groupReturnLimit)
        .then((data) => {
            resolve(data.data.response);
          }, (error) => {
            console.error(error);
            reject(error);
          }
        );
    });
  };

  let getGroup = (groupID,accessToken) => {
    return $q((resolve,reject) => {
      $http.get("https://api.groupme.com/v3/groups/" + groupID + "?token=" + accessToken)
        .then((data) => {
          resolve(data.data.response);
        }, (error) => {
          console.error(error);
          reject(error);
        })
    })
  }

  // Grab first set of messages for selected group
  let getMessages = (groupID,accessToken,startingMessageID) => {
    return $q((resolve,reject) => {
      $http.get("https://api.groupme.com/v3/groups/" + groupID + "/messages?token=" + accessToken + "&limit=" + messageReturnLimit)
        .then((data) => {
          let msgList = data.data.response.messages;
          let conversationLength = data.data.response.count;
          if (msgList.length === 0) {
            resolve(msgList);
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
                });
              };
            // Check for number of retrieved messages against the length of the conversation
            let checkMessages = () => {
              queriedMessages = queriedMessages + messageReturnLimit || messageReturnLimit;
              if (queriedMessages <= conversationLength) {
                loopMessages();
              } else {
                msgList.reverse();
                resolve(msgList);
            }};
            checkMessages();
          }
        }, (error) => {
          console.error(error);
          reject(error);
        });
    });
  };

  return {getGroupList,getGroup,getMessages};

});
