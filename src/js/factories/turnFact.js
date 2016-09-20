"use strict";

app.factory('turnFact',function($compile) {

  let sectionPages = 0,
      selectedGroup = {},
      conversationDateArray = [],
      bookObj = {};

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
  let createBook = (msgList,groupObj,customBook) => {
    if (customBook) {
      bookObj = customBook;
    } else {
      bookObj = groupObj;
    }
    $("#flipbook").turn("page",3).turn("stop");
    let currMsgDateObj = parseUnix(msgList[0].created_at);
    conversationDateArray = [];
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
      $("#flipbook").turn("page",1).turn("stop");
      printCover();
      printTOC();
      printForeword();
    };

  function printTOC() {
    let template = '<h2>Table of Contents</h2><uib-accordion close-others="false">';
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
      template += `<a ng-click="turnPage(${date.page})">${date.dateObj.date}</a>`
    })
    template += `</div></div></uib-accordion>`
    let compiledTemplate = $compile(template)(angular.element('[ng-controller=turnCtrl]').scope())
    $('#toc').html(compiledTemplate)
  }

  function printCover(newBookObj) {
    $(".p1").empty();
    if (newBookObj) {
      bookObj = newBookObj;
    }
    if (bookObj.image_url === null) {
      bookObj.image_url = 'src/images/groupme-logo.png'
    };
    let template = ''
    if (bookObj && bookObj.customTitle) {
      template += `<h1 ng-show="!editMode" id="customTitle"">${bookObj.customTitle}</h1>
      <input ng-show="editMode" ng-model="customTitleInput" class="form-control" type="text" placeholder="Enter a title here, originally: ${bookObj.name}" value="${bookObj.customTitle}">
      `
    } else {
      template += `<h1 ng-show="!editMode" id="title"">${bookObj.name}</h1>
      <input ng-show="editMode" ng-model="customTitleInput" class="form-control" type="text" placeholder="Enter a title here, originally: ${bookObj.name}">
      `
    }
    template += `<img id="coverImg" src="${bookObj.image_url}">`
    if (bookObj && bookObj.customTagline) {
      template += `
      <h3 ng-show="!editMode" id="customTagline"">${bookObj.customTagline}</h3>
      <input ng-show="editMode" ng-model="customTaglineInput" class="form-control" type="text" placeholder="Enter a tagline here, like 'A GroupMe Conversation'" value="${bookObj.customTagline}">
      `
    } else {
      template += `
      <h3 ng-show="!editMode" id="tagline"">A GroupMe Conversation</h3>
      <input ng-show="editMode" ng-model="customTaglineInput" class="form-control" type="text" placeholder="Enter a tagline here, like 'A GroupMe Conversation'">`
    }
    template += `<p>${bookObj.messages.count} messages and counting...</p>`;
    let compiledTemplate = $compile(template)(angular.element('[ng-controller=turnCtrl]').scope())
    $(".p1").html(compiledTemplate);
  }

  function printForeword(newBookObj) {
    if (newBookObj) {
      bookObj = newBookObj;
    }
    let template = '<h2>Foreword</h2>';
    if (bookObj && bookObj.customForeword) {
      template += `<p>${bookObj.customForeword}</p>
      <input ng-show="editMode" ng-model="customForewordInput" class="form-control" type="text" placeholder="Enter your custom introduction here." value="${bookObj.customForeword}">`
    } else {
      template += `<p>Thanks for taking a stroll back through memory lane with GroupMe Memories. Did you know you could customize the message that appears here by clicking on the "Edit this Collection" button below?</p>
      <input ng-show="editMode" ng-model="customForewordInput" class="form-control" type="text" placeholder="Enter your custom introduction here.">`
    }
    let compiledTemplate = $compile(template)(angular.element('[ng-controller=turnCtrl]').scope())
    $("#foreword").html(compiledTemplate);
  }

  let parseUnix = (timestamp) => {
    let time = new Date(timestamp * 1000);
    let months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    let year = time.getFullYear();
    let month = months[time.getMonth()];
    let date = time.getDate();
    return {year: year, month: month, date: date};
  }

  return {createBook, printCover, printTOC, printForeword};

});
