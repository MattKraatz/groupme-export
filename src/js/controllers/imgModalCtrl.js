"use strict";

app.controller('imgModalCtrl',function($scope, $uibModalInstance) {
  $scope.ok = function () {
    $uibModalInstance.close();
  };
})
