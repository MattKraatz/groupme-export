"use strict";

let groupList = {};
let lastMessageID = "";
let returnLimit = 50;
let messagesLength = 0;
let queriedMessages;
let groupID = "";

// TurnJS Basic Functionality
$("#flipbook").turn({
  width: 800,
  height: 600,
  autoCenter: true,
  display: "double"
});

// Check for page div height before printing
let msgIndex = 0;

function divCheck() {
  msgIndex += 1;
  // if ($("#flipbook div.page-wrapper:last div.page tbody").height() > 500) {
  if (msgIndex % 15 === 0) {
    let element = $("<div />");
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
    `)
  };
}

// Global variable to hold all imported messages
let messageList = [];

// Load dummy data on load for development purposes
$(document).ready(function(){
  $.getJSON("messages.json")
  .then((d) => {
    var msg = d.response.messages;
    console.log(msg);
    printMessages(msg);
  });
});

// Listen for input on access token field
$("#access-token").change(getGroupList);

// Get group list
function getGroupList() {
  $.getJSON("https://api.groupme.com/v3/groups?token=" + $("#access-token")[0].value).then((d) => {
    groupList = d.response;
    printGroupOptions(d.response);
  });
}

// Print group list
function printGroupOptions(groups) {
  for (var g in groups) {
    $("#group-select").append(`
        <option>${groups[g].name}</option>
      `);
  }
}

// Print messages
function printMessages(msg) {
  console.log(msg);
  msg.forEach((m) => {
    messageList.push(m);
    divCheck();
    let favoriteCount = m.favorited_by.length;
    // If statements to handle different type of message responses
    if (m.text !== null) {
      if (m.attachments.length > 0) {
        if (m.attachments[0].type !== undefined) {
          // Handle text messages with images
          if (m.attachments[0].type === "image") {
            $("#flipbook div.page-wrapper:last div.page tbody").append(`
              <tr>
                <td class="user-name">${m.name}:</td>
                <td>${m.text}<br>
                  <img src="${m.attachments[0].url}"></td>
                <td>${favoriteCount}</td>
              </tr>
            `);
          }
        }
        // Handle text messages
      } else {
        $("#flipbook div.page-wrapper:last div.page tbody").append(`
          <tr>
            <td class="user-name">${m.name}:</td>
            <td>${m.text}</td>
            <td>${favoriteCount}</td>
          </tr>
        `);
      }
      // Handle images
    } else if (m.attachments[0].type === "image") {
        $("#flipbook div.page-wrapper:last div.page tbody").append(`
        <tr>
          <td class="user-name">${m.name}:</td>
          <td><img src="${m.attachments[0].url}"></td>
          <td>${favoriteCount}</td>
        </tr>
    `);
        // Throw error
    } else {
        $("#flipbook div.page-wrapper:last div.page tbody").append(`
        <tr>
          <td class="user-name">${m.name}:</td>
          <td>Unknown Response</td>
          <td>${favoriteCount}</td>
        </tr>
      `);
    }
  });
}

// Grab first set of messages for selected group
function getMessages(groupID) {
  $.getJSON("https://api.groupme.com/v3/groups/" + groupID + "/messages?token=" + $("#access-token")[0].value + "&limit=" + returnLimit)
  .then((d) => {
    let msg = d.response.messages;
    printMessages(msg);
    messagesLength = d.response.count;
    lastMessageID = $("#message-id")[0].value;
    loopMessages(lastMessageID,messagesLength,groupID);
  })
  .catch(function(error){console.error(error);});
}

// Loops through remaining messages to display all
function loopMessages(lastMessageID,messagesLength,groupID) {
  queriedMessages = queriedMessages + returnLimit || returnLimit;
  console.log(queriedMessages);
  if (queriedMessages <= messagesLength) {
    $.getJSON("https://api.groupme.com/v3/groups/" + groupID + "/messages?token=" + $("#access-token")[0].value + "&limit=" + returnLimit + "&before_id=" + lastMessageID)
    .then((d) => {
      let msg = d.response.messages;
      console.log(messagesLength);
      printMessages(msg);
      lastMessageID = msg[(msg.length - 1)].id;
      loopMessages(lastMessageID,messagesLength,groupID);
    })
    .catch(function(error){console.error(error);});
  }
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

// Click event on export button
$("#export").click(() => {
  getGroupID();
});
