"use strict";

let app = angular.module('mainApp',['ngRoute']);

app.config(function($routeProvider) {
  $routeProvider
    .when('/', {
      templateUrl: 'src/partials/new-collection.html',
      controller: 'newCtrl'
    })
    .when('/new', {
      templateUrl: 'src/partials/new-collection.html',
      controller: 'newCtrl'
    })
    .when('/login', {
      templateUrl: 'src/partials/login.html',
      controller: 'authCtrl'
    })
    .when('/register', {
      templateUrl: 'src/partials/register.html',
      controller: 'authCtrl'
    })
    .when('/profile', {
      templateUrl: 'src/partials/profile.html',
      controller: 'profileCtrl'
    })
    .otherwise('/');
});

app.run((fbKeys) => {
  firebase.initializeApp(fbKeys);
})

let groupList;
let messagesLength = 0;
let lastMessageID;
let queriedMessages;
let groupID;
let messageList = [];
let sectionPages;
let groupName;
let groupPic;

// ***
// PRINTING-related functionality
// ***

// Check for page div height before printing
function divCheck() {
  // Checking whether the last page's height is approaching page end
  // If so, generates a new page
  if ($("#flipbook div.page-wrapper:last div.page table").height() > flipbookSize.height - 40) {
    let overflowRow = $("#flipbook div.page-wrapper:last div.page tbody tr:last")[0].innerHTML;
    $("#flipbook div.page-wrapper:last div.page tbody tr:last").remove();
    newPage();
    $("#flipbook div.page-wrapper:last div.page tbody").append(`
      <tr>
        ${overflowRow}
      </tr>
    `);
  }
}

// Generates a new page
function newPage() {
  let element = $("<div>");
  $("#flipbook").turn("addPage", element);
  var currentPage = $("#flipbook").turn("pages") - 2;
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
    <span class="page-num">pg. ${currentPage}</span>
  `);
  // Turns to the new page with no animation
  $("#flipbook").turn("next").turn("stop");
}

// Print messages
function printMessages(msg) {
  $("#flipbook").turn("page",3).turn("stop");
  for (var i = 0; i < msg.length; i++) {
    let favoriteCount = msg[i].favorited_by.length;
    // If statements to handle different type of message responses
    if (msg[i].text !== null) {
      // Replace hyperlink text with an actual anchor tag
      if (msg[i].text.includes("http" || "https")) {
        var regEx = /https?:\/\/[^\s]*/;
        var link = regEx.exec(msg[i].text);
        msg[i].text = msg[i].text.replace(regEx,`<a href="${link}">LINK</a>`)
      }
      // Handle text messages with images
      if (msg[i].attachments.length > 0 && msg[i].attachments[0].type === "image") {
          $("#flipbook div.page-wrapper:last div.page tbody").append(`
            <tr>
              <td class="user-name">${msg[i].name}:</td>
              <td>${msg[i].text}<br>
                <img src="${msg[i].attachments[0].url}"></td>
              <td>${favoriteCount}</td>
            </tr>
          `);
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
            <td>Unknown Message</td>
            <td>${favoriteCount}</td>
          </tr>
      `);
      }
    divCheck();
    }
    printTOC();
    printCover();
  }

function printTOC() {
  $("#flipbook").turn("page",2).turn("stop");
  // Determine number of pages for each divider
  sectionPages = Math.floor($("#flipbook").turn("pages") / 10);
  $("#toc").append(`
      <a onclick="turnPage()">Section 1, pages 1 - ${1 + sectionPages}<a><br>
      <a onclick="turnPage()">Section 2, pages ${1 + sectionPages} - ${1 + 2 * sectionPages}<a><br>
      <a onclick="turnPage()">Section 3, pages ${1 + 2 * sectionPages} - ${1 + 3 * sectionPages}<a><br>
      <a onclick="turnPage()">Section 4, pages ${1 + 3 * sectionPages} - ${1 + 4 * sectionPages}<a><br>
      <a onclick="turnPage()">Section 5, pages ${1 + 4 * sectionPages} - ${1 + 5 * sectionPages}<a><br>
      <a onclick="turnPage()">Section 6, pages ${1 + 5 * sectionPages} - ${1 + 6 * sectionPages}<a><br>
      <a onclick="turnPage()">Section 7, pages ${1 + 6 * sectionPages} - ${1 + 7 * sectionPages}<a><br>
      <a onclick="turnPage()">Section 8, pages ${1 + 7 * sectionPages} - ${1 + 8 * sectionPages}<a><br>
      <a onclick="turnPage()">Section 9, pages ${1 + 8 * sectionPages} - ${1 + 9 * sectionPages}<a><br>
      <a onclick="turnPage()">Section 10, pages ${1 + 9 * sectionPages} - ${1 + 10 * sectionPages}<a><br>
    `);
}

function turnPage() {
  let pageRef = parseInt(3 + (($(event.currentTarget).index()-1)/2) * sectionPages);
  $("#flipbook").turn("page",pageRef);
}

function printCover() {
  $(".p1").html(`
    <h1>${groupName}:</h1>
    <img src="${groupPic}">
    <h2>A GroupMe Conversation</h2>
    <p>${messagesLength} messages and counting...</p>
  `);
}

// ***
// AJAX-related functionality
// ***

// Click event on export button
$("#export").click(() => {
  getGroupID();
});

// Determine group ID based on selection
function getGroupID() {
  groupName = $("#group-select")[0].value;
  if (groupList === "") {
    alert("Please enter an access token and select a group");
  } else {
    groupList.forEach((g) => {
      if (g.name === groupName) {
        groupID = g.id;
        groupPic = g.image_url;
      }
    });
  }
  getMessages(groupID);
}

