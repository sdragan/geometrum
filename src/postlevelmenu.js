var PostLevelMenu = function (gamefield) {

    this.gamefield = gamefield;
    this.retryButton = null;
    this.exitButton = null;

    this.TWEEN_DURATION = 0.5;
    this.EXIT_BUTTON_COORDS = {x: 190, y: 360};
    this.EXIT_BUTTON_COORDS_HIDDEN = {x: -60, y: 360};
    this.RETRY_BUTTON_COORDS = {x: 290, y: 360};
    this.RETRY_BUTTON_COORDS_HIDDEN = {x: 540, y: 360};

    this.init = function () {
        this.gamefield.tintAllObjectsTo(0.3, 30, 30, 30);
        this.gamefield.showPauseOverlay();
        this.createButtons();

        var callFunctionAction = cc.callFunc(this.addListeners, this);
        this.exitButton.setPosition(this.EXIT_BUTTON_COORDS_HIDDEN.x, this.EXIT_BUTTON_COORDS_HIDDEN.y);
        var slideExitButtonAction = cc.moveTo(this.TWEEN_DURATION, this.EXIT_BUTTON_COORDS.x, this.EXIT_BUTTON_COORDS.y).easing(cc.easeCubicActionOut());
        this.exitButton.runAction(cc.sequence(slideExitButtonAction, callFunctionAction));

        this.retryButton.setPosition(this.RETRY_BUTTON_COORDS_HIDDEN.x, this.RETRY_BUTTON_COORDS_HIDDEN.y);
        var slideRetryButtonAction = cc.moveTo(this.TWEEN_DURATION, this.RETRY_BUTTON_COORDS.x, this.RETRY_BUTTON_COORDS.y).easing(cc.easeCubicActionOut());
        this.retryButton.runAction(slideRetryButtonAction);
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

    this.onExitButton = function () {
        this.hidePostLevelMenu(this.exitCallback);
    };

    this.onRetryButton = function () {
        this.hidePostLevelMenu(this.retryCallback);
    };

    this.createButtons = function () {
        this.exitButton = this.createButton("ButtonExit", "ButtonExit_Over", this.EXIT_BUTTON_COORDS.x, this.EXIT_BUTTON_COORDS.y, this.exitButtonTouchEvent);
        this.gamefield.uiContainer.addChild(this.exitButton);

        this.retryButton = this.createButton("ButtonRestart", "ButtonRestart_Over", this.RETRY_BUTTON_COORDS.x, this.RETRY_BUTTON_COORDS.y, this.retryButtonTouchEvent);
        this.gamefield.uiContainer.addChild(this.retryButton);
    };

    this.addListeners = function () {
        this.exitButton.setTouchEnabled(true);
        this.retryButton.setTouchEnabled(true);
    };

    this.removeListeners = function () {
        this.exitButton.setTouchEnabled(false);
        this.retryButton.setTouchEnabled(false);
    };

    this.hidePostLevelMenu = function (callback) {
        var callFunctionAction = cc.callFunc(callback, this);
        var slideExitButtonOutAction = cc.moveTo(this.TWEEN_DURATION, this.EXIT_BUTTON_COORDS_HIDDEN.x, this.EXIT_BUTTON_COORDS_HIDDEN.y).easing(cc.easeCubicActionIn());
        this.exitButton.runAction(cc.sequence(slideExitButtonOutAction, callFunctionAction));

        var slideRetryButtonOutAction = cc.moveTo(this.TWEEN_DURATION, this.RETRY_BUTTON_COORDS_HIDDEN.x, this.RETRY_BUTTON_COORDS_HIDDEN.y).easing(cc.easeCubicActionIn());
        this.retryButton.runAction(slideRetryButtonOutAction);

        this.removeListeners();
    };

    this.retryCallback = function () {
        this.cleanUp();
        this.gamefield.hidePauseOverlay();
        this.gamefield.retry();
    };

    this.exitCallback = function () {
        this.cleanUp();
        this.gamefield.exitToLevelMapThis();
    };

    this.cleanUp = function () {
        this.exitButton.removeFromParent();
        this.retryButton.removeFromParent();
    }
};