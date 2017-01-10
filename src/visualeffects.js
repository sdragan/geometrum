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

};