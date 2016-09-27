"use strict";

app.controller('modalCtrl',function($scope, $uibModalInstance) {
  $scope.ok = function () {
    $uibModalInstance.close();
  };
})
