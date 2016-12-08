VisualEffectFlash = function (gamefield) {
    this.gamefield = gamefield;
    this.flashGradientLayer = new cc.LayerColor(cc.color.WHITE);

    this.doFlash = function () {
        this.gamefield.addChild(this.flatshGradientLayer);
        this.flashGradientLayer.setOpacity(0);
        this.flashGradientLayer.runAction(cc.sequence(cc.fadeIn(0.2), cc.fadeOut(0.2), cc.callFunc(this.doRemoveFlash, this)));
    };

    this.doRemoveFlash = function () {
        this.flashGradientLayer.removeFromParent();
    }
};

VisualEffectScreenShake = function (gamefield) {

};

VisualEffectTintLevelObjects = function (gamefield) {

};