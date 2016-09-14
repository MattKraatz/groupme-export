"use strict";

app.factory('turnFact',function() {

  let sectionPages = 0,
      selectedGroup = {};

  // Check for page div height before printing
  function divCheck() {
    // Checking whether the last page's height is approaching page end
    // If so, generates a new page
    if ($("#flipbook div.page-wrapper:last table").height() > $('#flipbook').turn('size').height - 40) {
      let overflowRow = $("#flipbook div.page-wrapper:last tr:last")[0].innerHTML;
      $("#flipbook div.page-wrapper:last tr:last").remove();
      newPage();
      $("#flipbook div.page-wrapper:last tbody").append(`
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
  let createBook = (msgList,groupObj) => {
    selectedGroup = groupObj;
    $("#flipbook").turn("page",3).turn("stop");
    console.log(msgList.length);
    for (var i = 0; i < msgList.length; i++) {
      let favoriteCount = msgList[i].favorited_by.length;
      // If statements to handle different type of message responses
      if (msgList[i].text !== null) {
        // Replace hyperlink text with an actual anchor tag
        if (msgList[i].text.includes("http" || "https")) {
          var regEx = /https?:\/\/[^\s]*/;
          var link = regEx.exec(msgList[i].text);
          msgList[i].text = msgList[i].text.replace(regEx,`<a href="${link}">LINK</a>`);
        }
        // Handle text messages with images
        if (msgList[i].attachments.length > 0 && msgList[i].attachments[0].type === "image") {
            $("#flipbook div.page-wrapper:last tbody").append(`
              <tr>
                <td class="user-name">${msgList[i].name}:</td>
                <td>${msgList[i].text}<br>
                  <img src="${msgList[i].attachments[0].url}"></td>
                <td>${favoriteCount}</td>
              </tr>
            `);
          // Handle text messages
          } else {
            $("#flipbook div.page-wrapper:last tbody").append(`
              <tr>
                <td class="user-name">${msgList[i].name}:</td>
                <td>${msgList[i].text}</td>
                <td>${favoriteCount}</td>
              </tr>
            `);
          }
        // Handle images
      } else if (msgList[i].attachments[0].type === "image") {
            $("#flipbook div.page-wrapper:last tbody").append(`
            <tr>
              <td class="user-name">${msgList[i].name}:</td>
              <td><img src="${msgList[i].attachments[0].url}"></td>
              <td>${favoriteCount}</td>
            </tr>
        `);
          // Throw error
      } else {
          $("#flipbook div.page-wrapper:last tbody").append(`
            <tr>
              <td class="user-name">${msgList[i].name}:</td>
              <td>Unknown Message</td>
              <td>${favoriteCount}</td>
            </tr>
        `);
        }
      divCheck();
      }
      printTOC();
      printCover();
    };

  function printTOC() {
    $("#flipbook").turn("page",1).turn("stop");
    // Determine number of pages for each divider
    sectionPages = Math.floor($("#flipbook").turn("pages") / 10);
    $("#toc").append(`
        <a ng-click="turnPage(3)">Section 1, pages 1 - ${1 + sectionPages}<a><br>
        <a ng-click="turnPage((3 + ${sectionPages}))">Section 2, pages ${1 + sectionPages} - ${1 + 2 * sectionPages}<a><br>
        <a ng-click="turnPage((3 + 2 * ${sectionPages}))">Section 3, pages ${1 + 2 * sectionPages} - ${1 + 3 * sectionPages}<a><br>
        <a ng-click="turnPage((3 + 3 * ${sectionPages}))">Section 4, pages ${1 + 3 * sectionPages} - ${1 + 4 * sectionPages}<a><br>
        <a ng-click="turnPage((3 + 4 * ${sectionPages}))">Section 5, pages ${1 + 4 * sectionPages} - ${1 + 5 * sectionPages}<a><br>
        <a ng-click="turnPage((3 + 5 * ${sectionPages}))">Section 6, pages ${1 + 5 * sectionPages} - ${1 + 6 * sectionPages}<a><br>
        <a ng-click="turnPage((3 + 6 * ${sectionPages}))">Section 7, pages ${1 + 6 * sectionPages} - ${1 + 7 * sectionPages}<a><br>
        <a ng-click="turnPage((3 + 7 * ${sectionPages}))">Section 8, pages ${1 + 7 * sectionPages} - ${1 + 8 * sectionPages}<a><br>
        <a ng-click="turnPage((3 + 8 * ${sectionPages}))">Section 9, pages ${1 + 8 * sectionPages} - ${1 + 9 * sectionPages}<a><br>
        <a ng-click="turnPage((3 + 9 * ${sectionPages}))">Section 10, pages ${1 + 9 * sectionPages} - ${1 + 10 * sectionPages}<a><br>
      `);
  }

  function printCover() {
    if (selectedGroup.image_url === null) {
      selectedGroup.image_url = 'src/images/groupme-logo.png'
    };
    $(".p1").html(`
      <h1>${selectedGroup.name}</h1>
      <img src="${selectedGroup.image_url}">
      <h2>A GroupMe Conversation</h2>
      <p>${selectedGroup.messages.count} messages and counting...</p>
    `);
  }

  return {createBook};

});
