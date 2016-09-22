"use strict";

let app = angular.module('mainApp',['ngRoute','ngAnimate', 'ngSanitize', 'ui.bootstrap']);

app.config(function($routeProvider) {
  $routeProvider
    .when('/', {
      redirectTo: '/home'
    })
    .when('/home', {
      templateUrl: 'src/partials/home.html',
      controller: 'topCtrl'
    })
    .when('/new', {
      templateUrl: 'src/partials/new-collection.html',
      controller: 'newCtrl',
      resolve: {auth: function(authFact) {return authFact.authCheck()}}
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
      controller: 'profileCtrl',
      resolve: {auth: function(authFact) {return authFact.authCheck()}}
    })
    .when('/view', {
      templateUrl: 'src/partials/view-collections.html',
      controller: 'viewCtrl',
      resolve: {auth: function(authFact) {return authFact.authCheck()}}
    })
    .when('/view/:bookID', {
      templateUrl: 'src/partials/flipbook.html',
      resolve: {auth: function(authFact) {return authFact.authCheck()}}
    })
    .when('/shared/:shareKey', {
      templateUrl: 'src/partials/shared-collection.html'
    })
    .otherwise('/profile');
});

app.run((fbKeys) => {
  firebase.initializeApp(fbKeys);
});
