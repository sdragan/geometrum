VisualEffectFlash = function (gamefield) {
    this.gamefield = gamefield;
    this.flashGradientLayer = new cc.LayerColor(cc.color.WHITE);

    this.doFlash = function () {
        this.gamefield.addChild(this.flashGradientLayer);
        this.flashGradientLayer.setOpacity(0);
        this.flashGradientLayer.runAction(cc.sequence(cc.fadeIn(0), cc.fadeOut(0.4), cc.callFunc(this.doRemoveFlash, this)));
    };

    this.doRemoveFlash = function () {
        this.flashGradientLayer.removeFromParent();
    }
};

VisualEffectScreenshake = function (gamefield) {

};

VisualEffectTintLevelObjects = function (gamefield) {
    this.gamefield = gamefield;
    this.DEFAULT_DURATION = 0.3;

    this.tintAllObjectsTo = function (r, g, b, callback) {
        var tintAction = cc.tintTo(this.DEFAULT_DURATION, r, g, b);
        var i;

        for (i = 0; i < this.gamefield.blocks.length; i++) {
            if (this.gamefield.blocks[i].userData.sprite != null) {
                this.gamefield.blocks[i].userData.sprite.runAction(tintAction.clone());
            }
        }
        for (i = 0; i < this.gamefield.balls.length; i++) {
            this.gamefield.balls[i].userData.sprite.runAction(tintAction.clone());
        }

        /*
         if (this.paddleSprite != null) {
         this.paddleSprite.runAction(tintAction.clone());
         }
         */

        if (callback != null) {
            var moveByAction = cc.moveBy(this.DEFAULT_DURATION, 0, 0);
            var callFuncAction = cc.callFunc(callback, this);
            this.gamefield.containerBg.runAction(cc.sequence(moveByAction, callFuncAction));
        }
    };

    this.untint = function () {
        this.tintAllObjectsTo(255, 255, 255, null);
    }
};

VisualEffectPauseOverlay = function (gamefield) {
    this.gamefield = gamefield;
    this.overlayDrawNode = new cc.DrawNode();
    this.overlayDrawNode.drawRect(cc.p(0, 0), cc.p(GameConstants.APP_WIDTH, GameConstants.APP_HEIGHT), cc.color(0, 0, 0, 100), 0, cc.color(0, 0, 0));

    this.show = function () {
        this.gamefield.containerFg.addChild(this.overlayDrawNode);
    };

    this.hide = function () {
        this.overlayDrawNode.removeFromParent();
    }
};