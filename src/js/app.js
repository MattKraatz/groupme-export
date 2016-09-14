"use strict";

let app = angular.module('mainApp',['ngRoute','ngAnimate', 'ui.bootstrap']);

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
});
