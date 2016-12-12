var IngameUI = function (gamefield) {

    this.gamefield = gamefield;
    this.pauseButton = null;
    this.soundOnButton = null;
    this.soundOffButton = null;
    this.retryButton = null;
    this.exitButton = null;
    this.resumeButton = null;
    this.menuFrame = null;
    this.giantGear = null;
    this.gameStateBeforePause = GameStates.NORMAL;

    this.PAUSE_TWEEN_DURATION = 0.5;
    this.PAUSE_BUTTON_COORDS = {x: 440, y: 680};
    this.PAUSE_BUTTON_HIDDEN_COORDS = {x: 520, y: 680};

    this.MENU_HIDE_DURATION = 0.3;

    this.RETRY_BUTTON_COORDS = {x: 90, y: 720 - 458};
    this.SOUND_BUTTON_COORDS = {x: 178, y: 720 - 528};
    this.EXIT_BUTTON_COORDS = {x: 304, y: 720 - 528};
    this.RESUME_BUTTON_COORDS = {x: 392, y: 720 - 458};

    this.FRAME_COORDS = {x: 240, y: 350};
    this.GIANT_GEAR_OFFSET = 2;

    this.init = function () {
        if (this.pauseButton == null) {
            this.pauseButton = this.createButton("ButtonPause", "ButtonPause_Over", this.PAUSE_BUTTON_HIDDEN_COORDS.x, this.PAUSE_BUTTON_HIDDEN_COORDS.y, this.pauseButtonTouchEvent);
        }
        this.gamefield.containerUi.addChild(this.pauseButton);
        this.showPauseButton();
    };

    this.createButton = function (outSkin, overSkin, x, y, onTriggeredEvent) {
        var button = new ccui.Button();
        var outSkinTextureName = GameSpriteManager.getMCTextureName(outSkin);
        var overSkinTextureName = GameSpriteManager.getMCTextureName(overSkin);
        button.loadTextures(outSkinTextureName, overSkinTextureName, "", ccui.Widget.PLIST_TEXTURE);
        button.setPosition(x, y);
        button.addTouchEventListener(onTriggeredEvent, this);
        return button;
    };

    this.pauseButtonTouchEvent = function (sender, type) {
        if (type == ccui.Widget.TOUCH_ENDED) {
            this.onPauseButton();
        }
    };

    this.resumeButtonTouchEvent = function (sender, type) {
        if (type == ccui.Widget.TOUCH_ENDED) {
            this.onResumeButton();
        }
    };

    this.exitButtonTouchEvent = function (sender, type) {
        if (type == ccui.Widget.TOUCH_ENDED) {
            this.onExitButton();
        }
    };

    this.retryButtonTouchEvent = function (sender, type) {
        if (type == ccui.Widget.TOUCH_ENDED) {
            this.onRetryButton();
        }
    };

    this.soundButtonTouchEvent = function (sender, type) {
        if (type == ccui.Widget.TOUCH_ENDED) {
            this.onSoundButton();
        }
    };

    this.onPauseButton = function () {
        this.gameStateBeforePause = this.gamefield.gameState;
        this.gamefield.gameState = GameStates.PAUSED;
        this.gamefield.tintAllObjectsTo(0.3, 30, 30, 30);
        this.gamefield.showPauseOverlay();
        this.hidePauseButton();
        this.showPauseMenu();
    };

    this.onResumeButton = function () {
        this.hidePauseMenu(this.resumeCallback);
    };

    this.onExitButton = function () {
        this.hidePauseMenu(this.exitCallback);
    };

    this.onRetryButton = function () {
        this.hidePauseMenu(this.retryCallback);
    };

    this.onSoundButton = function () {
        GameSoundManager.toggleSoundOn();
        this.updateSoundButtons();
    };

    this.updateSoundButtons = function () {
        this.soundOnButton.setVisible(GameSoundManager.getSoundOn());
        this.soundOffButton.setVisible(!GameSoundManager.getSoundOn());
        this.addProperSoundListener();
    };

    this.showPauseButton = function () {
        var position = this.pauseButton.getPosition();
        if (position.x > GameConstants.APP_WIDTH) {
            this.pauseButton.setTouchEnabled(true);
            var slideInAction = cc.moveTo(this.PAUSE_TWEEN_DURATION, this.PAUSE_BUTTON_COORDS.x, this.PAUSE_BUTTON_COORDS.y);
            this.pauseButton.runAction(slideInAction);
        }
        else {
            throw new Error("Pause button is already in proper place");
        }
    };

    this.hidePauseButton = function () {
        var position = this.pauseButton.getPosition();
        if (position.x < GameConstants.APP_WIDTH) {
            this.pauseButton.setTouchEnabled(false);
            var slideOutAction = cc.moveTo(this.PAUSE_TWEEN_DURATION, this.PAUSE_BUTTON_HIDDEN_COORDS.x, this.PAUSE_BUTTON_HIDDEN_COORDS.y);
            this.pauseButton.runAction(slideOutAction);
        }
        else {
            throw new Error("Pause button is already out of screen");
        }
    };

    this.showPauseMenu = function () {
        this.menuFrame = GameSpriteManager.getSprite("ButtonsFrameNoGear");
        this.menuFrame.setPosition(cc.p(this.FRAME_COORDS.x, this.FRAME_COORDS.y));
        this.giantGear = GameSpriteManager.getSprite("ButtonsFrameGear");
        this.giantGear.setPosition(cc.p(this.FRAME_COORDS.x, this.FRAME_COORDS.y + this.GIANT_GEAR_OFFSET));
        this.giantGear.runAction(cc.rotateBy(60, 360).repeatForever());
        this.gamefield.containerUi.addChild(this.menuFrame);
        this.gamefield.containerUi.addChild(this.giantGear);

        this.createPauseMenuButtons();
        this.resumeButton.setPosition(this.RESUME_BUTTON_COORDS.x, this.RESUME_BUTTON_COORDS.y);
        this.exitButton.setPosition(this.EXIT_BUTTON_COORDS.x, this.EXIT_BUTTON_COORDS.y);
        this.retryButton.setPosition(this.RETRY_BUTTON_COORDS.x, this.RETRY_BUTTON_COORDS.y);
        this.soundOnButton.setPosition(this.SOUND_BUTTON_COORDS.x, this.SOUND_BUTTON_COORDS.y);
        this.soundOffButton.setPosition(this.SOUND_BUTTON_COORDS.x, this.SOUND_BUTTON_COORDS.y);

        this.resumeButton.setVisible(true);
        this.exitButton.setVisible(true);
        this.retryButton.setVisible(true);
        this.soundOnButton.setVisible(GameSoundManager.getSoundOn());
        this.soundOffButton.setVisible(!GameSoundManager.getSoundOn());

        this.addMenuListeners();
    };

    this.createPauseMenuButtons = function () {
        if (this.resumeButton != null) {
            return;
        }
        this.resumeButton = this.createButton("ButtonResume", "ButtonResume_Over", this.RESUME_BUTTON_COORDS.x, this.RESUME_BUTTON_COORDS.y, this.resumeButtonTouchEvent);
        this.gamefield.containerUi.addChild(this.resumeButton);

        this.exitButton = this.createButton("ButtonExit", "ButtonExit_Over", this.EXIT_BUTTON_COORDS.x, this.EXIT_BUTTON_COORDS.y, this.exitButtonTouchEvent);
        this.gamefield.containerUi.addChild(this.exitButton);

        this.retryButton = this.createButton("ButtonRestart", "ButtonRestart_Over", this.RETRY_BUTTON_COORDS.x, this.RETRY_BUTTON_COORDS.y, this.retryButtonTouchEvent);
        this.gamefield.containerUi.addChild(this.retryButton);

        this.soundOnButton = this.createButton("ButtonSoundOn", "ButtonSoundOn_Over", this.SOUND_BUTTON_COORDS.x, this.SOUND_BUTTON_COORDS.x, this.soundButtonTouchEvent);
        this.gamefield.containerUi.addChild(this.soundOnButton);

        this.soundOffButton = this.createButton("ButtonSoundOff", "ButtonSoundOff_Over", this.SOUND_BUTTON_COORDS.x, this.SOUND_BUTTON_COORDS.x, this.soundButtonTouchEvent);
        this.gamefield.containerUi.addChild(this.soundOffButton);

        this.removeMenuListeners();
    };

    this.addMenuListeners = function () {
        this.resumeButton.setTouchEnabled(true);
        this.exitButton.setTouchEnabled(true);
        this.retryButton.setTouchEnabled(true);
        this.addProperSoundListener();
    };

    this.addProperSoundListener = function () {
        this.soundOnButton.setTouchEnabled(GameSoundManager.getSoundOn());
        this.soundOffButton.setTouchEnabled(!GameSoundManager.getSoundOn());
    };

    this.removeMenuListeners = function () {
        this.resumeButton.setTouchEnabled(false);
        this.exitButton.setTouchEnabled(false);
        this.retryButton.setTouchEnabled(false);
        this.soundOnButton.setTouchEnabled(false);
        this.soundOffButton.setTouchEnabled(false);
    };

    this.hidePauseMenu = function (callback) {
        var callFunctionAction = cc.callFunc(callback, this);
        var slideResumeButtonOutAction = cc.moveTo(this.MENU_HIDE_DURATION, this.RESUME_BUTTON_COORDS.x, this.RESUME_BUTTON_COORDS.y);
        this.resumeButton.runAction(cc.sequence(slideResumeButtonOutAction, callFunctionAction));

        this.menuFrame.removeFromParent();
        this.giantGear.removeFromParent();

        this.removeMenuListeners();

        this.resumeButton.setVisible(false);
        this.exitButton.setVisible(false);
        this.retryButton.setVisible(false);
        this.soundOnButton.setVisible(false);
        this.soundOffButton.setVisible(false);
    };

    this.resumeCallback = function () {
        this.showPauseButton();
        this.gamefield.hidePauseOverlay();
        this.gamefield.gameState = this.gameStateBeforePause;
        this.gamefield.tintAllObjectsTo(0.3, 255, 255, 255);
    };

    this.retryCallback = function () {
        this.gamefield.hidePauseOverlay();
        this.gamefield.retry();
    };

    this.exitCallback = function () {
        this.gamefield.hidePauseOverlay();
        this.gamefield.exitToLevelMapThis();
    };

    this.cleanUp = function () {
        this.resumeButton.removeFromParent();
        this.exitButton.removeFromParent();
        this.retryButton.removeFromParent();
        this.soundOnButton.removeFromParent();
        this.soundOffButton.removeFromParent();
    }
};