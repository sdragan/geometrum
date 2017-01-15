var PreLevelMenu = function (gamefield) {

    this.gamefield = gamefield;
    this.resumeButton = null;
    this.RESUME_BUTTON_COORDS = {x: 240, y: 460};

    this.init = function () {
        this.resumeButton = this.createButton("ButtonResume", "ButtonResume_Over", this.RESUME_BUTTON_COORDS.x, this.RESUME_BUTTON_COORDS.y, this.resumeButtonTouchEvent);
        this.gamefield.containerUi.addChild(this.resumeButton);
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

    this.resumeButtonTouchEvent = function (sender, type) {
        if (type == ccui.Widget.TOUCH_ENDED) {
            this.onResumeButton();
        }
    };

    this.onResumeButton = function () {
        this.resumeButton.removeFromParent();
        this.gamefield.startFromMainMenu();
    };
};