let groupList = {};
let accessToken = "";

// Global variable to hold all imported messages
let messageList = [];

// Listen for input on access token field
$("#access-token").change(getGroupList);

// Get group list
function getGroupList() {
  $.getJSON("https://api.groupme.com/v3/groups?token=" + $("#access-token")[0].value).then((d) => {
    groupList = d.response;
    printGroupOptions(d.response);
  })
}

// Print group list
function printGroupOptions(groups) {
  for (g in groups) {
    $("#group-select").append(`
        <option>${groups[g].name}</option>
      `)
  }
}

// Print messages
function printMessages(msg) {
  console.log(msg)
  msg.forEach((m) => {
  messageList.push(m)
  let favoriteCount = m.favorited_by.length
    if (m.text !== null) {
      if (m.text.includes("to the group")) {
        $("#message-output").append(`
          <tr class="success">
            <td class="user-name">${m.name}:</td>
            <td>${m.text}</td>
            <td>${favoriteCount}</td>
          </tr>
        `)
      } else {
          $("#message-output").append(`
          <tr>
            <td class="user-name">${m.name}:</td>
            <td>${m.text}</td>
            <td>${favoriteCount}</td>
          </tr>
        `)
      }
    } else if (m.attachments[0].type === "image") {
        $("#message-output").append(`
        <tr>
          <td class="user-name">${m.name}:</td>
          <td><img src="${m.attachments[0].url}"></td>
          <td>${favoriteCount}</td>
        </tr>
      `)
    } else {
        $("#message-output").append(`
        <tr>
          <td class="user-name">${m.name}:</td>
          <td>Unknown Response</td>
          <td>${favoriteCount}</td>
        </tr>
      `)
    }
  })
}

// Grab messages for selected group
function getMessages(ID) {
  let lastMessageID = "";
  let messagesLength = 101;
  let returnLimit = 50;
  let queriedMessages;
  // Grabs first set of messages
  $.getJSON("https://api.groupme.com/v3/groups/" + ID + "/messages?token=" + $("#access-token")[0].value + "&limit=" + returnLimit)
  .then((d) => {
    msg = d.response.messages;
    printMessages(msg);
    messagesLength = d.response.count;
    lastMessageID = msg[(msg.length - 1)].id;
    loopMessages(lastMessageID)
    // Loops through remaining messages to display all
      function loopMessages(lastMessage) {
        queriedMessages = queriedMessages + returnLimit || returnLimit;
        if (queriedMessages <= messagesLength) {
          $.getJSON("https://api.groupme.com/v3/groups/" + ID + "/messages?token=" + $("#access-token")[0].value + "&limit=" + returnLimit + "&before_id=" + lastMessageID)
          .then((d) => {
            msg = d.response.messages;
            printMessages(msg);
            lastMessageID = msg[(msg.length - 1)].id;
            loopMessages(lastMessageID);
          })
        }
      }
  })
  .catch(function(error){console.log(error)})
}

// Determine group ID based on selection
function getGroupID() {
  let groupName = $("#group-select")[0].value;
  let groupID = "";
  groupList.forEach((g) => {
    if (g.name === groupName) {
      groupID = g.id;
    }
  })
  getMessages(groupID);
};


// Click event on export button
$("#export").click((evt) => {
  getGroupID();
});
