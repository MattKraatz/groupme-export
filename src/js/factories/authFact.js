"use strict";

app.factory('authFact',function($q) {
  let authCheck = () => {return $q((resolve,reject) => {
    if (firebase.auth().currentUser) {
      firebase.database().ref(`users/${firebase.auth().currentUser.uid}`).on('value', () => {
        resolve();
      })
    } else {
      firebase.auth().onAuthStateChanged(() => {
        firebase.database().ref(`users/${firebase.auth().currentUser.uid}`).on('value', () => {
          resolve();
      })
      })
    }
  })}
  return {authCheck}
})
