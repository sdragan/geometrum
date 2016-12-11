var GamefieldScene = cc.Scene.extend({

    space: null,
    bodiesToRemove: null,
    blocks: null,
    balls: null,
    blocksLeft: 0,

    containerBg: null,
    containerFg: null,
    containerArea: null,
    containerLevelObjects: null,
    containerParticles: null,
    drawNodeTouch: null,

    effectFlash: null,
    effectScreenshake: null,
    effectTintLevelObjects: null,

    /*
     touchStartCoords: {x: 0, y: 0},
     paddleEndCoords: {x: 0, y: 0},
     paddle: null,
     isPaddleBeingDrawn: false,
     */

    blocksHitInRow: 0,

    initVars: function () {
        this.space = null;
        this.bodiesToRemove = [];
        this.blocks = [];
        this.balls = [];
        this.blocksLeft = 0;
        this.blocksHitInRow = 0;
    },

    setup: function () {
        this.initVars();
        this.initLayers();
        this.initEffects();
        this.initPhysics();
        Paddle.addListeners(this);
        this.initDebugMode();
        this.scheduleUpdate();

        var foo = LevelObjectsFactory.createBlock(149, 442, 0.00, "Block_Normal_1", this.space, this.containerFg);
        console.log("ss");
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

        this.drawNodeTouch = new cc.DrawNode();
        this.addChild(this.drawNodeTouch);

        var bg = GameSpriteManager.getSprite("game_bg_small");
        bg.setAnchorPoint(cc.p(0, 0));
        bg.setScale(2, 2);
        this.containerBg.addChild(bg);
    },

    initEffects: function () {
        this.effectFlash = new VisualEffectFlash(this);
        this.effectScreenshake = new VisualEffectScreenshake(this);
        this.effectTintLevelObjects = new VisualEffectTintLevelObjects(this);
    },

    initPhysics: function () {
        this.space = new cp.Space();
        this.space.gravity = cp.v(0, 0);
        this.space.iterations = 30;
        this.space.sleepTimeThreshold = Infinity;
        this.space.collisionSlop = Infinity;
        this.space.addCollisionHandler(CollisionTypes.COMMON, CollisionTypes.COMMON, this.collisionHandler.bind(this), null, null, null);
    },

    initDebugMode: function () {
        var phDebugNode = new cc.PhysicsDebugNode(this.space);
        this.addChild(phDebugNode, 10);
    },

    collisionHandler: function (arbiter, space) {
        var levelObjectA = arbiter.a.body.userData;
        var levelObjectB = arbiter.b.body.userData;

        if ((levelObjectA.tag == Tags.PADDLE && levelObjectB.tag != Tags.BALL) ||
            (levelObjectB.tag == Tags.PADDLE && levelObjectA.tag != Tags.BALL)) {
            return false;
        }

        if (levelObjectA.tag == Tags.BALL) {
            if (levelObjectB.tag == Tags.BLOCK) {
                arbiter.b.body.userData.processHit(arbiter.a.body, this);
            }
            else if (levelObjectB.tag == Tags.PADDLE) {
                this.processPaddleHit(arbiter.b.body, arbiter.a.body);
            }
        }
        else if (levelObjectB.tag == Tags.BALL) {
            if (levelObjectA.tag == Tags.BLOCK) {
                arbiter.a.body.userData.processHit(arbiter.b.body, this);
            }
            else if (levelObjectA.tag == Tags.PADDLE) {
                this.processPaddleHit(arbiter.a.body, arbiter.b.body);
            }
        }
        return true;
    },

    processPaddleHit: function (paddle) {
        this.blocksHitInRow = 0;
    },

    processBlockDestroyed: function (levelObject) {
        this.blocksLeft -= 1;
        if (this.blocksLeft <= 0) {
            // this.gameState = GameStates.WON;
        }
    },

    processBallTouchedDangerousBlock: function (ball, levelObject) {

    },

    update: function (dt) {
        this.removeMarkedBodies();
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
            bodyToRemove.userData.remove(this.space);

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

var Paddle = {
    touchStartCoords: {x: 0, y: 0},
    paddleEndCoords: {x: 0, y: 0},
    paddle: null,
    isPaddleBeingDrawn: false,
    splashCircle: null,

    addListeners: function (gamefield) {
        var that = this;

        cc.eventManager.addListener({
            event: cc.EventListener.TOUCH_ONE_BY_ONE,
            swallowTouches: true,
            onTouchBegan: function (touch, event) {
                that.processTouchStarted(touch.getLocation().x, touch.getLocation().y, gamefield);
                return true;
            },
            onTouchMoved: function (touch, event) {
                that.processTouchUpdated(touch.getLocation().x, touch.getLocation().y, gamefield)
            },
            onTouchEnded: function (touch, event) {
                that.processTouchEnded(touch.getLocation().x, touch.getLocation().y, gamefield);
            }
        }, gamefield);
    },

    removeListeners: function (gamefield) {
        cc.eventManager.removeListeners(cc.EventListener.TOUCH_ONE_BY_ONE, gamefield);
    },

    processTouchStarted: function (touchX, touchY, gamefield) {
        if (touchY <= GameConstants.PADDLE_MAX_Y) {
            this.touchStartCoords.x = touchX;
            this.touchStartCoords.y = touchY;
            this.isPaddleBeingDrawn = true;

            if (this.splashCircle == null) {
                this.splashCircle = GameSpriteManager.getSprite("SplashCircle");
            }
            gamefield.containerBg.addChild(this.splashCircle);
            this.splashCircle.setPosition(this.touchStartCoords.x, this.touchStartCoords.y);
            this.resetSplashCircle();
            this.splashCircle.runAction(cc.spawn(cc.fadeOut(1), cc.scaleTo(1, 1)));
        }
    },

    resetSplashCircle: function () {
        this.splashCircle.setOpacity(255);
        this.splashCircle.setScale(0.1);
    },

    removeSplashCircle: function () {
        if (this.splashCircle != null) {
            this.splashCircle.removeFromParent();
            this.splashCircle.stopAllActions();
        }
    },

    processTouchUpdated: function (touchX, touchY, gamefield) {
        if (this.isPaddleBeingDrawn == false) {
            return;
        }

        if (touchY > GameConstants.PADDLE_MAX_Y) {
            touchY = GameConstants.PADDLE_MAX_Y;
        }

        this.updatePaddleEndCoords(touchX, touchY, gamefield);
        this.displayPaddleBeingDrawn(this.paddleEndCoords.x, this.paddleEndCoords.y, gamefield);
    },

    updatePaddleEndCoords: function (paddleEndX, paddleEndY, gamefield) {
        var paddleLength = this.getPaddleLength(this.touchStartCoords.x, this.touchStartCoords.y, paddleEndX, paddleEndY);
        var d = GameConstants.PADDLE_MAX_LENGTH / paddleLength;
        if (d < 1) {
            var projectionX = (paddleEndX - this.touchStartCoords.x) * d;
            var projectionY = (paddleEndY - this.touchStartCoords.y) * d;
            this.paddleEndCoords.x = this.touchStartCoords.x + projectionX;
            this.paddleEndCoords.y = this.touchStartCoords.y + projectionY;
        }
        else {
            this.paddleEndCoords.x = paddleEndX;
            this.paddleEndCoords.y = paddleEndY;
        }
    },

    getPaddleLength: function (startX, startY, endX, endY) {
        var pX = startX - endX;
        var pY = startY - endY;
        return Math.sqrt((pX * pX) + (pY * pY));
    },

    displayPaddleBeingDrawn: function (currentX, currentY, gamefield) {
        gamefield.drawNodeTouch.clear();
        gamefield.drawNodeTouch.drawSegment(new cp.v(this.touchStartCoords.x, this.touchStartCoords.y), new cp.v(currentX, currentY), LevelObjectsFactory.PADDLE_WIDTH, cc.color(255, 255, 255, 128));
    },

    processTouchEnded: function (touchX, touchY, gamefield) {
        if (this.isPaddleBeingDrawn == false) {
            return;
        }
        this.isPaddleBeingDrawn = false;
        gamefield.drawNodeTouch.clear();
        this.removeSplashCircle();

        if (touchY > this.PADDLE_MAX_Y) {
            touchY = this.PADDLE_MAX_Y;
        }

        this.updatePaddleEndCoords(touchX, touchY);

        if (this.paddle != null) {
            this.removePaddle(gamefield);
        }

        this.paddle = LevelObjectsFactory.addPaddle(new cp.v(this.touchStartCoords.x, this.touchStartCoords.y), new cp.v(this.paddleEndCoords.x, this.paddleEndCoords.y), gamefield.space);
    },

    removePaddle: function (gamefield) {
        if (this.paddle != null) {
            gamefield.scheduleRemoveBody(this.paddle);
            this.paddle = null;
        }
        // if (this.paddleSprite != null) {
        //     this.paddleSprite.removeFromParent();
        // }
        this.isPaddleBeingDrawn = false;
        gamefield.drawNodeTouch.clear();
        this.removeSplashCircle();
    }
};