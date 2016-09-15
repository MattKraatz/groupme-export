"use strict";

app.factory('turnFact',function($compile) {

  let sectionPages = 0,
      selectedGroup = {},
      conversationDateArray = [];

  // Check for page div height before printing
  function divCheck() {
    // Checking whether the last page's height is approaching page end
    // If so, generates a new page
    let imgCount = $("#flipbook div.page-wrapper:last table").find('img').length;
    if ($("#flipbook div.page-wrapper:last table").height() > $('#flipbook').turn('size').height - (35 + (120 * imgCount))) {
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
    let currMsgDateObj = parseUnix(msgList[0].created_at);
    conversationDateArray.push({dateObj: currMsgDateObj, page: $("#flipbook").turn("page")})
    let messageDateString = `${currMsgDateObj.month} ${currMsgDateObj.date}, ${currMsgDateObj.year}`
    $("#flipbook div.page-wrapper:last tbody").append(`
      <tr>
        <td colspan="3" class="timestamp">- ${messageDateString} -</td>
      </tr>
    `)
    for (var i = 0; i < msgList.length; i++) {
      let favoriteCount = msgList[i].favorited_by.length;
      if (i > 0) {
        let prevMsgDateObj = parseUnix(msgList[(i-1)].created_at);
        let currMsgDateObj = parseUnix(msgList[i].created_at);
        if (currMsgDateObj.month + currMsgDateObj.date !== prevMsgDateObj.month + prevMsgDateObj.date) {
          conversationDateArray.push({dateObj: currMsgDateObj, page: $("#flipbook").turn("page")})
          let messageDateString = `${currMsgDateObj.month} ${currMsgDateObj.date}, ${currMsgDateObj.year}`
          $("#flipbook div.page-wrapper:last tbody").append(`
            <tr>
              <td colspan="3" class="timestamp"}>- ${messageDateString} -</td>
            </tr>
          `)
          divCheck();
        }
      }
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
                  <img class="img-thumbnail" src="${msgList[i].attachments[0].url}"></td>
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
              <td><img class="img-thumbnail" src="${msgList[i].attachments[0].url}"></td>
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
    console.log(conversationDateArray);
    let template = '<uib-accordion close-others="false">';
    conversationDateArray.forEach((date, i) => {
      let yearChange = false;
      // Handle Year Accordian Groups
      let currYear = date.dateObj.year;
      let prevYear = date.dateObj.year;
      if (i > 0) {
        prevYear = conversationDateArray[(i - 1)].dateObj.year
      } else {
        template += `<div uib-accordion-group class="panel-default" heading="${date.dateObj.year}">`;
      };
      if (currYear !== prevYear) {
        template += `</div></div><div uib-accordion-group class="panel-default" heading="${date.dateObj.year}">`;
        yearChange = true;
      };
      // Handle Month Accordian Groups
      let currMonth = date.dateObj.month;
      let prevMonth = date.dateObj.month;
      if (i > 0) {
        prevMonth = conversationDateArray[(i - 1)].dateObj.month;
      } else {
        template += `<div uib-accordion-group class="panel-default" heading="${date.dateObj.month}">`;
      };
      if (currMonth !== prevMonth) {
        if (yearChange) {
          template += `<div uib-accordion-group class="panel-default" heading="${date.dateObj.month}">`;
          yearChange = false;
        } else {
          template += `</div><div uib-accordion-group class="panel-default" heading="${date.dateObj.month}">`
        }
      }
      // Handle Date Links
      template += `<a ng-click="turnPage(${date.page})">${date.dateObj.date}<a><br>`
    })
    template += `</div></div></uib-accordion>`
    let compiledTemplate = $compile(template)(angular.element('[ng-controller=turnCtrl]').scope())
    $('#toc').append(compiledTemplate)
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

  let parseUnix = (timestamp) => {
    let time = new Date(timestamp * 1000);
    let months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    let year = time.getFullYear();
    let month = months[time.getMonth()];
    let date = time.getDate();
    return {year: year, month: month, date: date};
  }

  return {createBook};

});
