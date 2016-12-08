var GamefieldScene = cc.Scene.extend({

    bodiesToRemove: null,
    blocks: null,
    balls: null,
    blocksLeft: 0,

    containerBg: null,
    containerFg: null,
    containerArea: null,
    containerLevelObjects: null,
    containerParticles: null,
    touchDrawNode: null,

    initVars: function () {
        this.bodiesToRemove = [];
        this.blocks = [];
        this.balls = [];
        this.blocksLeft = 0;
    },

    setup: function () {
        this.initVars();
        this.initLayers();
    },

    initLayers: function () {
        this.containerBg = new cc.Node();
        this.containerFg = new cc.Node();
        this.containerArea = new cc.Node();
        this.containerLevelObjects = new cc.Node();
        this.containerParticles = new cc.Node();

        this.addChild(this.containerBg);
        this.addChild(this.containerFg);
        this.containerFg.addChild(this.containerArea);
        this.containerFg.addChild(this.containerLevelObjects);
        this.containerFg.addChild(this.containerParticles);

        this.touchDrawNode = new cc.DrawNode();
        this.addChild(this.touchDrawNode);

        var bg = GameSpriteManager.getSprite("game_bg");
        bg.setAnchorPoint(cc.p(0, 0));
        this.bgContainer.addChild(bg);



            this.bgContainer = new cc.Node();
            this.addChild(this.bgContainer);
            this.fgContainer = new cc.Node();
            this.addChild(this.fgContainer);
            this.areaSpriteContainer = new cc.Node();
            this.fgContainer.addChild(this.areaSpriteContainer);
            this.fgContainer.setAnchorPoint(cc.p(0, 0));
            this.ballParticlesContainer = new cc.Node();
            this.fgContainer.addChild(this.ballParticlesContainer);
            var bg = GameSpriteManager.getSprite("game_bg");
            bg.setAnchorPoint(cc.p(0, 0));
            this.bgContainer.addChild(bg);
            this.touchZoneSprite = GameSpriteManager.getSprite("TouchZone");
            this.touchZoneSprite.setAnchorPoint(0, 0);
            this.touchZoneSprite.setOpacity(0);
            this.bgContainer.addChild(this.touchZoneSprite);
            GameParticleManager.addBgParticles(this.bgContainer);
            this.overlayDrawNode = cc.DrawNode.create();
            this.addChild(this.overlayDrawNode);
            this.uiContainer = new cc.Node();
            this.addChild(this.uiContainer);
            this.touchDrawNode = cc.DrawNode.create();
            this.addChild(this.touchDrawNode);
            this.drawNode = cc.DrawNode.create();
            this.addChild(this.drawNode);
            this.flashGradientLayer = new cc.LayerGradient(cc.color(255, 255, 255), cc.color(255, 255, 255));

            this.screenshake = new Screenshake(this.fgContainer);
    },

    processBlockDestroyed: function (levelObject) {
        this.blocksLeft -= 1;
        if (this.blocksLeft <= 0) {
            // this.gameState = GameStates.WON;
        }
    },

    processBallTouchedDangerousBlock: function (ball, levelObject) {

    },

    scheduleRemoveBody: function (bodyToRemove) {
        if (this.bodiesToRemove.indexOf(bodyToRemove) < 0) {
            this.bodiesToRemove.push(bodyToRemove);
        }
    },

    removeMarkedBodies: function () {
        if (this.bodiesToRemove.length == 0) {
            return;
        }

        for (var i = 0; i < this.bodiesToRemove.length; i++) {
            var bodyToRemove = this.bodiesToRemove[i];
            bodyToRemove.userData.remove();

            if (this.blocks.indexOf(bodyToRemove) >= 0) {
                this.blocks.splice(this.blocks.indexOf(bodyToRemove), 1);
            }
            else if (this.balls.indexOf(bodyToRemove) >= 0) {
                this.balls.splice(this.balls.indexOf(bodyToRemove), 1);
            }
        }

        this.bodiesToRemove = [];
    }
});