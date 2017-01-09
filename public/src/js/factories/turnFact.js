"use strict";

app.factory('turnFact',function($compile) {

  let conversationDateArray = [],
      bookObj = {};

  // Check for page div height before printing
  function divCheck() {
    // Checking whether the last page's height is approaching page end
    // If so, generates a new page
    let imgCount = $("#flipbook div.page-wrapper:last table").find('img').length;
    if ($("#flipbook div.page-wrapper:last table").height() > $('#flipbook').turn('size').height - (35 + (120 * imgCount))) {
      let overflowRow = $("#flipbook div.page-wrapper:last tr:last")[0].outerHTML;
      $("#flipbook div.page-wrapper:last tr:last").remove();
      newPage();
      $("#flipbook div.page-wrapper:last tbody").append(`${overflowRow}`);
    }
  }

  // Generates a new page
  function newPage() {
    let element = $("<div>");
    $("#flipbook").turn("addPage", element);
    var currentPage = $("#flipbook").turn("pages") - 1;
    $("#flipbook div.page-wrapper:last div.page").append(`
      <table class="table table-striped table-condensed table-hover">
        <thead>
          <tr>
            <th>Name</th>
            <th>Message</th>
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
  let createBook = (msgList,groupObj,customBook) => {
    if (customBook) {
      bookObj = customBook;
    } else {
      bookObj = groupObj;
    }
    $("#flipbook").turn("page",2).turn("stop");
    let memoryIDs = [];
    bookObj.memories.forEach((memoryObj) => {
      memoryIDs.push(memoryObj.id);
    });
    let currMsgDateObj = parseUnix(msgList[0].created_at);
    conversationDateArray = [];
    conversationDateArray.push({dateObj: currMsgDateObj, page: $("#flipbook").turn("page")});
    let messageDateString = `${currMsgDateObj.month} ${currMsgDateObj.date}, ${currMsgDateObj.year}`;
    $("#flipbook div.page-wrapper:last tbody").append(`<tr><td colspan="3" class="timestamp">- ${messageDateString} -</td></tr>`);
    for (var i = 0; i < msgList.length; i++) {
      if (i > 0) {
        let prevMsgDateObj = parseUnix(msgList[(i-1)].created_at);
        let currMsgDateObj = parseUnix(msgList[i].created_at);
        if (currMsgDateObj.month + currMsgDateObj.date !== prevMsgDateObj.month + prevMsgDateObj.date) {
          if (currMsgDateObj.year == 0) {
            console.log('unknown message yo')
          } else {
            conversationDateArray.push({dateObj: currMsgDateObj, page: $("#flipbook").turn("page")});
            let messageDateString = `${currMsgDateObj.month} ${currMsgDateObj.date}, ${currMsgDateObj.year}`;
            $("#flipbook div.page-wrapper:last tbody").append(`<tr><td colspan="3" class="timestamp"}>- ${messageDateString} -</td></tr>`);
            divCheck();
          }
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
              <tr msg-id="${msgList[i].id}">
                <td class="user-name">${msgList[i].name}:</td>
                <td>${msgList[i].text}<br>
                  <img class="img-thumbnail" src="${msgList[i].attachments[0].url}"></td>
              </tr>
            `);
          // Handle text messages
          } else {
            $("#flipbook div.page-wrapper:last tbody").append(`
              <tr msg-id="${msgList[i].id}">
                <td class="user-name">${msgList[i].name}:</td>
                <td>${msgList[i].text}</td>
              </tr>`);
          }
        // Handle images
      } else if (msgList[i].attachments.length > 0 && msgList[i].attachments[0].type === "image") {
            $("#flipbook div.page-wrapper:last tbody").append(`
            <tr msg-id="${msgList[i].id}">
              <td class="user-name">${msgList[i].name}:</td>
              <td><img class="img-thumbnail" src="${msgList[i].attachments[0].url}"></td>
            </tr>`);
          // Throw error
      } else {
        $("#flipbook div.page-wrapper:last tbody").append(`
          <tr msg-id="${msgList[i].id}">
            <td class="user-name">${msgList[i].name}:</td>
            <td>Unknown Message</td>
          </tr>
      `);
      }
      if (memoryIDs.includes(msgList[i].id)) {
        $("#flipbook div.page-wrapper:last tr:last").addClass('bold-message');
      }
      divCheck();
      msgList[i].page = $("#flipbook").turn("page");
      }
      $("#flipbook").turn("page",1).turn("stop");
      printCover();
      printTOC();
      return msgList;
    };

  function printTOC() {
    let template = '<uib-accordion close-others="false">';
    conversationDateArray.forEach((date, i) => {
      let yearChange = false;
      // Handle Year Accordian Groups
      let currYear = date.dateObj.year;
      let prevYear = date.dateObj.year;
      if (i > 0) {
        prevYear = conversationDateArray[(i - 1)].dateObj.year;
      } else {
        template += `<div uib-accordion-group class="panel-default" heading="${date.dateObj.year}">`;
      }
      if (currYear !== prevYear) {
        template += `</div></div><div uib-accordion-group class="panel-default" heading="${date.dateObj.year}">`;
        yearChange = true;
      }
      // Handle Month Accordian Groups
      let currMonth = date.dateObj.month;
      let prevMonth = date.dateObj.month;
      if (i > 0) {
        prevMonth = conversationDateArray[(i - 1)].dateObj.month;
      } else {
        template += `<div uib-accordion-group class="panel-default" heading="${date.dateObj.month}">`;
      }
      if (currMonth !== prevMonth) {
        if (yearChange) {
          template += `<div uib-accordion-group class="panel-default" heading="${date.dateObj.month}">`;
          yearChange = false;
        } else {
          template += `</div><div uib-accordion-group class="panel-default" heading="${date.dateObj.month}">`;
        }
      }
      // Handle Date Links
      template += `<a ng-click="turnPage(${date.page})">${date.dateObj.date} </a>`;
    });
    template += `</div></div></uib-accordion>`;
    let compiledTemplate = $compile(template)(angular.element('[ng-controller=turnCtrl]').scope());
    $('#toc .panel-body').html(compiledTemplate);
  }

  function printCover() {
    if (bookObj.image_url === null) {
      bookObj.image_url = 'src/images/groupme-logo.png';
    }
    let template = '';
    template += `<h1 id="title"">${bookObj.name}</h1>`;
    template += `<img id="coverImg" src="${bookObj.image_url}">`;
    template += `<h3 id="tagline"">A GroupMe Conversation</h3>`;
    template += `<p>${bookObj.messages.count} messages and counting...</p>`;
    let compiledTemplate = $compile(template)(angular.element('[ng-controller=turnCtrl]').scope());
    $("#flipbook .p1").html(compiledTemplate);
  }

  let parseUnix = (timestamp) => {
    let time = new Date(timestamp * 1000);
    let months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    let days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    let year = time.getFullYear();
    let month = months[time.getMonth()];
    let date = time.getDate();
    let day = days[time.getDay()];
    return {year: year, month: month, date: date, day: day};
  };

  return {createBook, printCover, printTOC};

});
