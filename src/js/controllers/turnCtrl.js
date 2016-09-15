"use strict";

app.controller('turnCtrl',function($scope,$uibModal) {

  // Image modals
  $(document).off('click','td img').on('click','td img',(event) => {
    $scope.modalImgSrc = event.currentTarget;
    let modalInstance = $uibModal.open({
      ariaLabelledBy: 'full-size image',
      templateUrl: 'src/partials/image-modal.html',
      controller: 'imgModalCtrl',
      scope: $scope
    });
  });

  $scope.turnPage = (pageRef) => {
    $('#flipbook').turn('page', pageRef);
  };

  // TurnJS Configuration
  $scope.readyFlipbook = () => {
    let flipbookSize = {
      width: 1000,
      height: 600
    };

    $("#flipbook").turn({
      when: {
        turning: function(event, page, pageObject) {
          if (page === 1) {
            // add a class here for offset to force centering
            // $("flipbook")
          }
          if (page > 1) {
            // remove the offset class here
            // $("flipbook")
          }
        }
      },
      width: flipbookSize.width,
      height: flipbookSize.height,
      autoCenter: false,
      display: "double",
      inclination: 0
    });

    $("#flipbook").bind('start',
      function (event, pageObject, corner) {
        if (corner === 'tl' || corner === 'bl') {
            event.preventDefault();
        }
      }
    );
  };
});
