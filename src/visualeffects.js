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

    this.unTint = function () {
        this.tintAllObjectsTo(255, 255, 255, null);
    }
};

VisualEffectPauseOverlay = function (gamefield) {
    this.gamefield = gamefield;
    this.overlayDrawNode = new cc.DrawNode();
    this.overlayDrawNode.drawRect(cc.p(0, 0), cc.p(GameConstants.APP_WIDTH, GameConstants.APP_HEIGHT), cc.color(0, 0, 0, 100), 0, cc.color(0, 0, 0, 0));

    this.show = function () {
        this.gamefield.containerFg.addChild(this.overlayDrawNode);
    };

    this.hide = function () {
        this.overlayDrawNode.removeFromParent();
    }
};

VisualEffectBackgroundHighlight = function (gamefield) {
    this.gamefield = gamefield;
    this.highlightSprite = GameSpriteManager.getSprite("WhiteSquare10");
    this.highlightSprite.setAnchorPoint(0, 0);
    this.highlightSprite.setScale(GameConstants.APP_WIDTH / 10, GameConstants.APP_HEIGHT / 10);

    this.HIGHLIGHT_DURATION = 2;
    this.FADEOUT_DURATION = 1;

    this.show = function (value) {
        var rectAlpha = this.getHighlightAlpha(value);
        if (this.highlightSprite.parent != this.gamefield.containerFg) {
            this.gamefield.containerFg.addChild(this.highlightSprite);
        }
        this.highlightSprite.stopAllActions();
        this.highlightSprite.setOpacity(rectAlpha);

        var delayAction = cc.moveBy(this.HIGHLIGHT_DURATION, 0, 0);
        var fadeOutAction = cc.fadeOut(this.FADEOUT_DURATION);
        var callFuncAction = cc.callFunc(this.hide, this);
        this.highlightSprite.runAction(cc.sequence(delayAction, fadeOutAction, callFuncAction));
    };

    this.hide = function () {
        this.highlightSprite.removeFromParent();
    };

    this.getHighlightAlpha = function (value) {
        var result = value * 10;
        return Math.min(result, 50);
    }
};