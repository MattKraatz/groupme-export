"use strict";

let app = angular.module('mainApp',['ngRoute','ngAnimate', 'ui.bootstrap']);

app.config(function($routeProvider) {
  $routeProvider
    .when('/', {
      redirectTo: '/profile'
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
    .when('/view', {
      templateUrl: 'src/partials/view-collections.html',
      controller: 'viewCtrl'
    })
    .when('/view/:bookID', {
      templateUrl: 'src/partials/flipbook.html',
    })
    .otherwise('/profile');
});

app.run((fbKeys) => {
  firebase.initializeApp(fbKeys);
});
