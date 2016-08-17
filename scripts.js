"use strict";

let groupList;
let returnLimit = 20;
let messagesLength = 0;
let lastMessageID;
let queriedMessages;
let groupID;

// TurnJS Basic Functionality
$("#flipbook").turn({
  width: 1200,
  height: 600,
  autoCenter: true,
  display: "double",
  inclination: 0
});

$("#flipbook").bind('start',
  function (event, pageObject, corner) {
    if (corner == 'tl' || corner == 'bl') {
        event.preventDefault();
    }
  }
);

// Load dummy data on load for development purposes
// $(document).ready(function(){
//   $.getJSON("messages.json")
//   .then((d) => {
//     var msg = d.response.messages;
//     console.log(msg);
//     printMessages(msg);
//   });
// });

// Listen for input on access token field
$("#access-token").change(getGroupList);

// ***
// PRINTING-related functionality
// ***

// Print group list
function printGroupOptions(groups) {
  for (var g in groups) {
    $("#group-select").append(`
        <option>${groups[g].name}</option>
      `);
  }
}


// Check for page div height before printing
function divCheck() {
  // Checking whether the last page's height is approaching page end
  // If so, generates a new page
  var divHeight = $("#flipbook div.page-wrapper:last div.page tbody").height()
  console.log(divHeight)
  if ($("#flipbook div.page-wrapper:last div.page tbody").height() > 500) {
    newPage();
  }
}

// Generates a new page
function newPage() {
  let element = $("<div>");
  $("#flipbook").turn("addPage", element);
  $("#flipbook div.page-wrapper:last div.page").append(`
    <table class="table table-striped table-condensed">
      <thead>
        <tr>
          <th>Name</th>
          <th>Message</th>
          <th>Likes</th>
        </tr>
      </thead>
      <tbody>
      </tbody>
    </table>
  `);
  // Turns to the new page with no animation
  $("#flipbook").turn("next").turn("stop");
}

// Print messages
function printMessages(msg) {
  console.log(msg)
  for (var i = 0; i < msg.length; i++) {
    console.log("printing iterations");
    divCheck();
    let favoriteCount = msg[i].favorited_by.length;
    // If statements to handle different type of message responses
    if (msg[i].text !== null) {
      if (msg[i].attachments.length > 0) {
        // Handle text messages with images
        if (msg[i].attachments[0].type === "image") {
          $("#flipbook div.page-wrapper:last div.page tbody").append(`
            <tr>
              <td class="user-name">${msg[i].name}:</td>
              <td>${msg[i].text}<br>
                <img src="${msg[i].attachments[0].url}"></td>
              <td>${favoriteCount}</td>
            </tr>
          `);
          }
        // Handle text messages
        } else {
          $("#flipbook div.page-wrapper:last div.page tbody").append(`
            <tr>
              <td class="user-name">${msg[i].name}:</td>
              <td>${msg[i].text}</td>
              <td>${favoriteCount}</td>
            </tr>
          `);
        }
      // Handle images
    } else if (msg[i].attachments[0].type === "image") {
          $("#flipbook div.page-wrapper:last div.page tbody").append(`
          <tr>
            <td class="user-name">${msg[i].name}:</td>
            <td><img src="${msg[i].attachments[0].url}"></td>
            <td>${favoriteCount}</td>
          </tr>
      `);
        // Throw error
      } else {
          $("#flipbook div.page-wrapper:last div.page tbody").append(`
          <tr>
            <td class="user-name">${msg[i].name}:</td>
            <td>Unknown Response</td>
            <td>${favoriteCount}</td>
          </tr>
        `);
      }
    }
  }

// ***
// AJAX-related functionality
// ***

// Click event on export button
$("#export").click(() => {
  getGroupID();
});

// Get group list
function getGroupList() {
  $.getJSON("https://api.groupme.com/v3/groups?token=" + $("#access-token")[0].value).then((d) => {
    groupList = d.response;
    printGroupOptions(d.response);
  });
}

// Determine group ID based on selection
function getGroupID() {
  let groupName = $("#group-select")[0].value;
  if (groupList === "") {
    alert("Please enter an access token and select a group");
  } else {
    groupList.forEach((g) => {
      if (g.name === groupName) {
        groupID = g.id;
      }
    });
  }
  getMessages(groupID);
}

// Grab first set of messages for selected group
function getMessages(groupID) {
  $.getJSON("https://api.groupme.com/v3/groups/" + groupID + "/messages?token=" + $("#access-token")[0].value + "&limit=" + returnLimit)
  .then((d) => {
    let msg = d.response.messages;
    var messageList = [];
    msg.forEach(function(m){messageList.push(m);});
    printMessages(messageList);
    messagesLength = d.response.count;
    lastMessageID = $("#message-id")[0].value;
    loopMessages(lastMessageID,messagesLength,groupID);
  })
  .catch(function(error){console.error(error);});
}

// Loops through remaining messages to display all
function loopMessages(lastMessageID,messagesLength,groupID) {
  queriedMessages = queriedMessages + returnLimit || returnLimit;
  console.log(queriedMessages, messagesLength);
  if (queriedMessages <= messagesLength) {
    $.getJSON("https://api.groupme.com/v3/groups/" + groupID + "/messages?token=" + $("#access-token")[0].value + "&limit=" + returnLimit + "&before_id=" + lastMessageID)
    .then((d) => {
      let msg = d.response.messages;
      var messageList = [];
      msg.forEach(function(m){messageList.push(m);});
      console.dir(messageList)
      printMessages(messageList);
      lastMessageID = msg[(msg.length - 1)].id;
      loopMessages(lastMessageID,messagesLength,groupID);
    })
    .catch(function(error){console.error(error);});
  }
}
