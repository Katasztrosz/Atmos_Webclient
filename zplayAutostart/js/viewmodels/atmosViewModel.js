define(['knockout', 'jquery', 'hammer', 'gesturehandler', 'animationmanager', 'utils', 'gesture', 'pauseinfo', 'jumpinfo', 'skipinfo'],
  function (ko, $, Hammer, gestureHandler, animationManager, Utils, Gesture, PauseInfo, JumpInfo, SkipInfo) {

    var video = $("#atmosPlayer"),
      bgMusicPlayer = $("#bgMusicPlayer"),
      starterImg = $("#starterImg"),
      rotateMenu = $("#rotateMenu"),
      gameIcon = $("#gameIcon"),
      gameTitle = $("#gameTitle"),
      finishMessage = $("#finishMessage");
      gameSubTitle = $("#subTitle"),
      storeImage = $("#storeImage"),
      // endScreenImg = $("#endScreenImg"),
      downloadBtOffImg = $("#downloadBtOffImg"),
      downloadBtOnImg = $("#downloadBtOnImg"),
      installButton = $("#installButton"),
      bufferSpinner = $("#bufferSpinner"),
      body = $("body"),
      playButton = $("#playButton"),
      windowHeight = 0,
      windowWidth = 0,
      isMenuOpen = false,
      isStoreClick = false,
      reactionSum = 0,
      reactionNum = 0;
      var startTime = 0;
      var globalOrientation;

    $(window).resize(function () {
      resize();
    }).resize();

    $(window).on("orientationchange", function (obj) {
      $("#atmosPlayer").stop().fadeTo(1000, 1.0);
    });


    $(window).on("pagehide", function () {
      if (!isStoreClick) {
        console.log("Game closed");
        var endTime = new Date();
        var timeDiff = endTime - startTime;
        timeDiff /= 1000;
        var curtime = video.get(0).currentTime;
        var duration = video.get(0).duration;
        var ratio = curtime / duration * 100;
        eventParameters.isGameStarted = gestureHandler.isVideoStarted();
        eventParameters.gameplaySeconds = Math.round(timeDiff % 60);
        eventParameters.gameplayPercentage = Math.round(ratio);
        mixpanel.track("Game closed", eventParameters);
      }
    });

    function resize() {
      windowHeight = $(window).height();
      windowWidth = $(window).width();

      if (globalOrientation === 0) {
        video.css('width', windowHeight);

        var videoWidth = video.width(),
          marginLeftAdjust = (windowWidth - videoWidth) / 2,
          marginTopAdjust = (windowHeight - video.height()) / 2;
        video.css({
          'height': windowWidth,
          'marginLeft': marginLeftAdjust,
          'marginTop': -marginLeftAdjust
        });

        body.css({
          'width': videoWidth
        });
      } else if (globalOrientation === 1) {
        video.css('width', windowWidth);

        var videoWidth = video.width(),
          marginLeftAdjust = (windowWidth - videoWidth) / 2;
        video.css({
          'height': windowHeight,
          'marginLeft': marginLeftAdjust
        });
        body.css({
          'width': videoWidth
        });

      }
    }

    return function atmosViewModel() {
      console.log("atmosViewModel()");
      var self = this;

      self.game = {
        title: ko.observable(),
        shortTitle: ko.observable(),
        subTitle: ko.observable(),
        orientation: ko.observable(),
        playStoreLink: ko.observable(""),
        appStoreLink: ko.observable(""),
        gestures: ko.observableArray(),
        menuPos: ko.observable(),
        videoSrc: ko.observable()
      };
      self.curTime = ko.observable(true);
      self.orientation = ko.observable();
      self.url = ko.observable();
      self.showInstallBtn = ko.observable(true);
      self.opSystem = Utils.getMobileOperatingSystem();

      //constant variables
      self.OP_ANDROID = "Android";
      self.OP_IOS = "iOS";
      self.PAGE_404 = "error404.html";

      //class declarations
      self.menuWrapperClasses = ko.observableArray();
      self.downloadBtnClasses = ko.observableArray();

      ko.bindingHandlers['class'] = {
        update: function (element, valueAccessor) {
          var currentValue = ko.utils.unwrapObservable(valueAccessor()),
            prevValue = element['__ko__previousClassValue__'],

            // Handles updating adding/removing classes
            addOrRemoveClasses = function (singleValueOrArray, shouldHaveClass) {
              if (Object.prototype.toString.call(singleValueOrArray) === '[object Array]') {
                ko.utils.arrayForEach(singleValueOrArray, function (cssClass) {
                  var value = ko.utils.unwrapObservable(cssClass);
                  ko.utils.toggleDomNodeCssClass(element, value, shouldHaveClass);
                });
              } else if (singleValueOrArray) {
                ko.utils.toggleDomNodeCssClass(element, singleValueOrArray, shouldHaveClass);
              }
            };

          addOrRemoveClasses(prevValue, false);

          addOrRemoveClasses(currentValue, true);

          element['__ko__previousClassValue__'] = currentValue.concat();
        }
      };

      //Starts video and music, Called by Store Click
      function play() {
        console.log('play()');
        // gestureHandler.initHammer();
        mixpanel.track("Game started", eventParameters);
        video.get(0).play();
        bgMusicPlayer.get(0).play();
        gestureHandler.isPaused(false);
      }

      //Called when strat screen is tapped or video is finished
      self.storeClick = function () {
        if (gestureHandler.isVideoCompleted()) {
          openEndScreen();
          //openStore();
        } else {
          console.log('StoreClick()');
          // bufferSpinner.addClass('on');
          // bufferSpinner.fadeTo(10, 1.0);  
          // onLandingPageOpen();
          play();
        }
      };

      self.menuStoreClick = function () {
        openStore();
      }

      function openStore() {
        console.log("openStore()");
        isStoreClick = true;
        var endTime = new Date();
        var timeDiff = endTime - startTime;
        timeDiff /= 1000;
        var curtime = video.get(0).currentTime;
        var duration = video.get(0).duration;
        var ratio = curtime / duration * 100;
        eventParameters.isGameStarted = gestureHandler.isVideoStarted();
        eventParameters.gameplaySeconds = Math.round(timeDiff % 60);
        eventParameters.gameplayPercentage = Math.round(ratio);
        mixpanel.track("Store click", eventParameters);
        
        if (self.opSystem === self.OP_IOS) {
          if (self.game.appStoreLink) {
            // console.log(logTimer.getTime('gameStart'));
             console.log("ios");
            window.location.href = self.game.appStoreLink;
          } else {
            //404 error
            window.location.href = self.PAGE_404;
          }
        } else if (self.opSystem === self.OP_ANDROID) {
          if (self.game.playStoreLink) {
            // console.log(logTimer.getTime('gameStart'));
            console.log("android");
            document.location = self.game.playStoreLink;
          } else {
            //404 error
            document.location = self.PAGE_404;
          }
        } 
      }

function openEndScreen(){
        if (self.opSystem === self.OP_IOS && typeof webkit !== 'undefined') {
          webkit.messageHandlers.video.postMessage("video_did_end_playing");
        } else if (self.opSystem === self.OP_ANDROID) {
          window.PlayableAds.mediationEnd();
        } 
        // console.log("openEndScreen()");
        // console.log( $("#endScreenImg").attr('src'));
        // if($("#endScreenImg").attr('src').length==0 || $("#endScreenImg").attr('src')=='null'){
        //     openStore();
        // }else{    
        //     console.log("done");
        //     endScreenImg.get(0).style.visibility = 'visible';
        //     downloadBtOffImg.css({visibility: 'visible'});
        //     $(video).remove();
        //     setTimeout(function(){
        //       downloadBtOffImg.on('mousedown touchstart', function(event) {
        //         console.log('touchstart on off');
        //           downloadBtOnImg.css({visibility: 'visible'});
        //           downloadBtOffImg.css({visibility: 'hidden'});
        //       });
        //       downloadBtOffImg.on('click', function(event) {
        //         console.log('click on off');
        //           openStore();
        //       });
        //       downloadBtOnImg.on('mouseup touchend click', function(event) {
        //         console.log('touchend on on');
        //           openStore();
        //       });

        //       body.on('mouseup touchend', function(event) {
        //         console.log('touchend on body');
        //         downloadBtOffImg.css({visibility: 'visible'});
        //         downloadBtOnImg.css({visibility: 'hidden'});
        //       })

        //       var endTime = new Date();
        //       var timeDiff = endTime - startTime;
        //       timeDiff /= 1000;
        //       var curtime = video.get(0).currentTime;
        //       var duration = video.get(0).duration;
        //       var ratio = curtime / duration * 100;
        //       eventParameters.isGameStarted = gestureHandler.isVideoStarted();
        //       eventParameters.gameplaySeconds = Math.round(timeDiff % 60);
        //       eventParameters.gameplayPercentage = Math.round(ratio);
        //       mixpanel.track("End screen", eventParameters);
        //       if (self.opSystem === self.OP_IOS && typeof webkit !== 'undefined') {
        //         webkit.messageHandlers.video.postMessage("video_did_end_playing");
        //       } else if (self.opSystem === self.OP_ANDROID) {
        //         window.PlayableAds.mediationEnd();
        //       }          
        // },500);                   
        // }
      }

      function showFinishMenu(){
        console.log('showFinishMenu()');
        gestureHandler.disableHammer();
        finishMenu.fadeTo(50, 1.0);
        setTimeout(function(){
          document.body.addEventListener('click',  function() { openStore();}); 
          document.body.addEventListener('touchstart',  function() { openStore();});       
        }, 200);
         
      }

      self.goBackClick = function () {
        bgMusicPlayer.get(0).pause();
        if (self.opSystem === self.OP_IOS) {
          window.location.href = 'ios:goBackNatively';
        } else if (self.opSystem === self.OP_ANDROID) {
          document.location = 'android:goBackNatively';
        }
      }

      self.openMenuClick = function () {
        if (!isMenuOpen) {
          isMenuOpen = !isMenuOpen;
          openStore();
        } else {
          initMenu();
        }
      }

      video.get(0).onwaiting = function () {
         if (gestureHandler.isVideoStarted()) {
          console.log("BUFFERING...");
        }
      };

      gestureHandler.actualIndex.subscribe(function(e){
      //  bufferSpinner.removeClass('on');
      //  bufferSpinner.stop().fadeTo(0, 0.0);
      //  Doesn't run first time, just when the video has started
        if (gestureHandler.isVideoStarted() && video.get(0).currentTime * 1000 > 100) {
          
          if(gestureHandler.isPaused()){
            video.get(0).play();
            console.log('play video');
          }

          gestureHandler.isPaused(false);

          var d = new Date();    
          reactionSum += (d.getTime()-gestureHandler.handleGestureTime);
          reactionNum++;
          var d = new Date();
          
          console.log("Reaction Time: " + (d.getTime()-gestureHandler.handleGestureTime) + " Average reaction time: " + reactionSum/reactionNum);

          var index = gestureHandler.currentTimerIndex();     
          console.log('Current index: ' + index + ' out of: ' + gestureHandler.gestures().length);
          if (index < gestureHandler.gestures().length) {
            console.log("Timeout set from handle Gesture: " + index);
             gestureHandler.setTimerForIndex(index);
          }
          else{
            //After the final gesture the video plays till the end, than we can open the Store with a storeClick
            video.get(0).play();            
          }
        }
      });

      //Runs when video is ready to play
      video.get(0).oncanplay = function () {
          viewDidLoad = true;
          if (self.opSystem === self.OP_IOS && typeof webkit !== 'undefined') {
            webkit.messageHandlers.video.postMessage("video_did_end_loading");
          } else if (self.opSystem === self.OP_ANDROID) {
              window.PlayableAds.mediationEndLoading();
          }
          
          console.log('oncanplay()');
          gestureHandler.initHammer();
          if (isAdViewable) {
            self.storeClick();
          }
          // document.location = "videoDidLoad://";

          // if(!gestureHandler.isVideoStarted()){
            // log('Video can play', { 'ms since loaded': logTimer.getTime('loadingStart'), 'game ID': gestureHandler.gameID(), 'Seconds buffered': video.get(0).buffered.end(0)} );
          // }
      };

      //Runs when video is playing
      video.get(0).onplay = function () {            
        gestureHandler.isPaused(false);
        console.log("onplay: " + video.get(0).currentTime * 1000);
        if(!gestureHandler.isVideoStarted()){
          if (self.opSystem === self.OP_IOS && typeof webkit !== 'undefined') {
              webkit.messageHandlers.video.postMessage("video_did_start_playing");
          } else if (self.opSystem === self.OP_ANDROID) {
              window.PlayableAds.mediationStart();
          }
        }
        canPlay();
      };

      //Runs when video is playing
      function canPlay() {
        console.log('canPlay()');

        if (video.get(0).currentTime * 1000 > 0) {
          //Runs on the very first gesture, sets the first timeout till the first attack time
          if (gestureHandler.currentGestureIndex() === 0 && gestureHandler.isVideoStarted() === false) {
            hidePlayMenu();
            //video.get(0).pause();
            //console.log('set Timeout till first attack: ' + logTimer.getTime('loadingStart'));
            
            var index = gestureHandler.currentTimerIndex();
            console.log("INDEX :" + index)
            gestureHandler.setTimerForIndex(index);
            gestureHandler.isVideoStarted(true);
            //gestureHandler.preloadGestureImage(gestureHandler.gestures()[0][0]);            
          }; 
        } else {
          setTimeout(canPlay, 100);
        }
      }

      video.get(0).onended = function () {
        gestureHandler.isVideoCompleted(true);
        openEndScreen();
        bgMusicPlayer.get(0).pause();
        $("#starterImg").css({
          'pointer-events': 'all'
        });
      }

      video.get(0).onerror = function (error) {
        console.log("video error");
        bgMusicPlayer.get(0).pause();
      };

      self.gameId = video.data('gameid');

      self.initGame = function (allData) {
        console.log("initGame()");
        self.game.title = allData.title;
        self.game.subTitle = allData.subTitle;
        self.game.shortTitle = allData.shortTitle;
        self.game.orientation = allData.orientation;
        self.game.playStoreLink = allData.playStoreLink;
        self.game.appStoreLink = allData.appStoreLink;
        self.game.gestures = allData.gestures;
        self.game.menuPos = allData.menuPos;
        gestureHandler.gameID(allData.id);

        if (clickUrl !== "") {
          self.game.playStoreLink = clickUrl;
          self.game.appStoreLink = clickUrl;
        } else {
          console.log("Click url is not present.");
        }

        console.log(self.game);

        startTime = new Date();

        handleOrientation();

        for (var i = 0; i < allData.gestures.length; i++) {
          var gesture = [];
          for (var j = 0; j < allData.gestures[i].length; j++) {
            gesture.push(new Gesture(allData.gestures[i][j]));
          }
          gestureHandler.gestures().push(gesture);
        }

        //If there is a jump/pause/skip gesture in the gestures list, we pushe a new element to jump/pause/skip list
        console.log("Load jump/pause/skip lists");
        for (var i = 0; i < gestureHandler.gestures().length; i++) {
            for (var j = 0; j < gestureHandler.gestures()[i].length; j++) {
              if (gestureHandler.gestures()[i][j].type() === "jump") {
                gestureHandler.jumpList().push(new JumpInfo(gestureHandler.gestures()[i][j]));
              }
              if (gestureHandler.gestures()[i][j].type() === "pause") {
                gestureHandler.pauseList().push(new PauseInfo(gestureHandler.gestures()[i][j]));
              }
              if (gestureHandler.gestures()[i][j].type() === "skip") {
                gestureHandler.skipList().push(new SkipInfo(gestureHandler.gestures()[i][j]));
              }
            }
        }
        //Deletes the jump/pause/skip gesture from the gestures
        for (var i = 0; i < gestureHandler.gestures().length; i++) {
          for (var j = 0; j < gestureHandler.gestures()[i].length; j++) {
            if (gestureHandler.gestures()[i][j].type() === "jump") {
              gestureHandler.gestures()[i].splice(j, 1);
            }
            if (gestureHandler.gestures()[i][j].type() === "pause") {
              gestureHandler.gestures()[i].splice(j, 1);
            }
            if (gestureHandler.gestures()[i][j].type() === "skip") {
            gestureHandler.gestures()[i].splice(j, 1);
            }
          }
        }

        $('#starterWrapper').fadeTo(10, 0.0);
        // $("#starterImg").remove();
        initGestureHandler();
        initMenu();
        //play();
      };

      function getSizeForResoultion() {
        if (self.opSystem === self.OP_IOS) {
          if (windowWidth >= 375) {
            return "medium";
          } else if (windowWidth >= 320 && windowWidth < 375) {
            return "small";
          } else {
            return "xsmall";
          }
        } else if (self.opSystem === self.OP_ANDROID) {
          if (windowWidth >= 720) {
            return "medium";
          } else if (windowWidth >= 480 && windowWidth < 720) {
            return "small";
          } else {
            return "xsmall";
          }
        } else {
          return "medium";
        }
      }

      function initAnimationManager() {
        animationManager.orientation = self.orientation;
      }

      function initGestureHandler() {
        gestureHandler.hideAnimation = animationManager.hideAnimation;
        gestureHandler.initMenu = initMenu;
        gestureHandler.orientation = self.orientation;
        gestureHandler.openStore = openStore;
        gestureHandler.openEndScreen = openEndScreen;
      } 

    function openCustomURLinIFrame(src){
        var rootElm = document.documentElement;
        var newFrameElm = document.createElement("IFRAME");
        newFrameElm.setAttribute("src",src);
        rootElm.appendChild(newFrameElm);
        //remove the frame now
        newFrameElm.parentNode.removeChild(newFrameElm);
    }

    function didFinishLoad(){
        var url = "atmos://didFinishLoad";
        var rootElm = document.documentElement;
        var newFrameElm = document.createElement("IFRAME");
        newFrameElm.setAttribute("src",url);
        console.log(url);
        rootElm.appendChild(newFrameElm);
        //remove the frame now
        newFrameElm.parentNode.removeChild(newFrameElm);
    }

      function hidePlayMenu() {
        // bufferSpinner.removeClass('on');
        // bufferSpinner.stop().fadeTo(0, 0.0);
        $("#starterImg").remove();
      }

      var initMenu = function () {
        console.log("initMenu()");
        isMenuOpen = false;
        var menuWrapperCSS = ["inactive"];
        var downloadBtnCSS = ["inactive"];

        if (self.orientation === 0) {

          // $("#atmosPlayer").css({
          //       "transform": "rotate(90deg)",
          //     })
          // $("#startMenu").css({
          //     "transform": "rotate(90deg)",
          // });

          menuWrapperCSS.push("landscape");
 
          downloadBtnCSS.push("landscape");

          if (self.game.menuPos === "bottomright") {
            menuWrapperCSS.push("bottom bottomTransform");
            downloadBtnCSS.push("top");
          } else if (self.game.menuPos === "bottomleft") {
            menuWrapperCSS.push("top bottomTransform");
            downloadBtnCSS.push("bottom");
          } else if (self.game.menuPos === "topright") {
            menuWrapperCSS.push("bottom bottomTransform");
            downloadBtnCSS.push("top");
          } else if (self.game.menuPos === "topleft") {
            menuWrapperCSS.push("top bottomTransform");
            downloadBtnCSS.push("top");
          }

        } else if (self.orientation === 1) {
          if (self.game.menuPos === "bottomright") {
            menuWrapperCSS.push("bottom");
            downloadBtnCSS.push("bottom");
          } else if (self.game.menuPos === "bottomleft") {
            menuWrapperCSS.push("bottom");
            downloadBtnCSS.push("bottom");
          } else if (self.game.menuPos === "topright") {
            menuWrapperCSS.push("top");
            downloadBtnCSS.push("top");
          } else if (self.game.menuPos === "topleft") {
            menuWrapperCSS.push("top");
            downloadBtnCSS.push("top");
          }
        }

        self.menuWrapperClasses(menuWrapperCSS);
        self.downloadBtnClasses(downloadBtnCSS);
      }

      function handleOrientation() {
        console.log("handleorientation");
        self.orientation = self.game.orientation;
        globalOrientation = self.game.orientation;
        if (self.orientation === 0) {
          video.addClass('landscape');
          // finishMenu.addClass('landscape');
          $("#storeButtonDiv").addClass('landscape');
          $("#installButtonDiv").addClass('landscape');
          // $("#endScreenImg").addClass('landscape');
          $("#downloadBtOffImg").addClass('landscape');
          $("#downloadBtOnImg").addClass('landscape');
        };
        resize();

      }

     };
   });
