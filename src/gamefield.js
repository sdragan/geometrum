var GamefieldScene = cc.Scene.extend({

    space: null,
    bodiesToRemove: null,
    bodiesToCreate: null,
    blocks: null,
    balls: null,
    blocksLeft: 0,

    containerBg: null,
    containerFg: null,
    containerUi: null,
    containerArea: null,
    containerLevelObjects: null,
    containerParticles: null,
    drawNodeTouch: null,

    effectFlash: null,
    effectScreenshake: null,
    effectTintLevelObjects: null,

    blocksHitInRow: 0,
    score: 0,
    level: 0,

    initVars: function () {
        this.space = null;
        this.bodiesToRemove = [];
        this.bodiesToCreate = [];
        this.blocks = [];
        this.balls = [];
        this.blocksLeft = 0;
        this.blocksHitInRow = 0;
        this.score = 0;
        this.level = 0;
    },

    setup: function () {
        this.initVars();
        this.initLayers();
        this.initEffects();
        this.initPhysics();
        // this.addWalls();
        Paddle.init(this);
        Paddle.addListeners();
        this.initDebugMode();
        this.scheduleUpdate();

        var block = LevelObjectsFactory.createBlock(0, 100, 0.00, "Block_Normal_1", this.space, this.containerLevelObjects);
        this.blocks.push(block);
        block.userData.movementComponents.push(new LevelObjectNonLinearMoveComponent(block, [{x: 0, y: 100}, {
            x: 480,
            y: 100
        }, {x: 240, y: 400}], 5.5, 0.5, GeometrumEase.easeNone));

        // this.balls.push(LevelObjectsFactory.addBall(160, 150, this.space, this.containerLevelObjects, GameConstants.SPRITE_NAME_BALL));
        // this.balls[0].setVel(cc.p(5, 70));

        // this.balls.push(LevelObjectsFactory.addBall(300, 150, this.space, this.containerLevelObjects, GameConstants.SPRITE_NAME_BALL));
        // this.balls[1].setVel(cc.p(-5, 120));
    },

    initLayers: function () {
        this.containerBg = new cc.Node();
        this.containerFg = new cc.Node();
        this.containerUi = new cc.Node();
        this.containerArea = new cc.Node();
        this.containerLevelObjects = new cc.Node();
        this.containerParticles = new cc.Node();

        this.addChild(this.containerBg);
        this.addChild(this.containerFg);
        this.addChild(this.containerUi);
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

    addWalls: function () {
        var wH = LevelObjectsFactory.WALLS_WIDTH;
        var winSize = {width: GameConstants.APP_WIDTH, height: GameConstants.APP_HEIGHT};

        LevelObjectsFactory.addWall(new cp.v(-wH, 0), new cp.v(-wH, winSize.height), this.space);
        LevelObjectsFactory.addWall(new cp.v(winSize.width + wH, winSize.height), new cp.v(winSize.width + wH, 0), this.space);
        LevelObjectsFactory.addWall(new cp.v(0, winSize.height + wH), new cp.v(winSize.width, winSize.height + wH), this.space);
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
        Paddle.removePaddle(this);
    },

    processBlockHit: function (levelObject) {
        this.blocksHitInRow += 1;
        // this.playBlockHitSound();
    },

    processBlockDestroyed: function (levelObject) {
        this.blocksHitInRow += 1;
        // this.playBlockHitSound();
        this.score += levelObject.score * this.blocksHitInRow;

        this.blocksLeft -= 1;
        if (this.blocksLeft <= 0) {
            console.log("Level " + this.level.toString() + " won");
            this.level += 1;
            this.blocksLeft = this.level;
            for (var i = 0; i < this.level; i++) {
                this.scheduleAddBody(Math.random() * 400 + 40, Math.random() * 380 + 300, Math.random() * 360, "Block_Normal_1", true, 0, 0)
            }
            // this.gameState = GameStates.WON;
        }
    },

    processBallTouchedDangerousBlock: function (ball, levelObject) {

    },

    update: function (dt) {
        this.space.step(dt);
        this.updateBlocks(dt);
        this.updateBalls(dt);
        this.removeMarkedBodies();
        this.addScheduledBodies();
    },

    updateBlocks: function (dt) {
        for (var i = 0; i < this.blocks.length; i++) {
            this.blocks[i].userData.update(dt, this);
        }
    },

    updateBalls: function (dt) {
        for (var i = 0; i < this.balls.length; i++) {
            var ball = this.balls[i];
            this.checkBallOutOfScreen(ball);
        }
    },

    checkBallOutOfScreen: function (ball) {
        var ballPosY = ball.getPos().y;
        if ((ballPosY < -50 && ball.getVel().y < 0) || ballPosY > GameConstants.APP_HEIGHT + 50) {
            this.processBallLost(ball);
        }
    },

    processBallLost: function (ball) {
        this.scheduleRemoveBody(ball);
        if (this.balls.length == 1) {
            console.log("Lost");
        }
    },

    scheduleAddBody: function (objX, objY, objAngle, spriteName, isStatic, velX, velY) {
        this.bodiesToCreate.push({
            objX: objX,
            objY: objY,
            objAngle: objAngle,
            spriteName: spriteName,
            isStatic: isStatic,
            velX: velX,
            velY: velY
        });
    },

    addScheduledBodies: function () {
        if (this.bodiesToCreate.length > 0) {
            for (var i = 0; i < this.bodiesToCreate.length; i++) {
                var desc = this.bodiesToCreate[i];
                var body = LevelObjectsFactory.createBlock(desc.objX, desc.objY, desc.objAngle, desc.spriteName, this.space, this.containerLevelObjects);
                body.setVel(cc.p(desc.velX, desc.velY));
                body.userData.makeInvulnerable(GameConstants.GOD_MODE_TIME_DEFAULT);
                this.blocks.push(body);
            }
            this.bodiesToCreate = [];
        }
    },

    scheduleRemoveBody: function (bodyToRemove) {
        if (this.bodiesToRemove.indexOf(bodyToRemove) < 0) {
            -this.bodiesToRemove.push(bodyToRemove);
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
    gamefield: null,

    init: function (gamefield) {
        this.touchStartCoords = {x: 0, y: 0};
        this.paddleEndCoords = {x: 0, y: 0};
        this.paddle = null;
        this.isPaddleBeingDrawn = false;
        this.gamefield = gamefield;
    },

    addListeners: function () {
        var that = this;

        cc.eventManager.addListener({
            event: cc.EventListener.TOUCH_ONE_BY_ONE,
            swallowTouches: true,
            onTouchBegan: function (touch, event) {
                that.processTouchStarted(touch.getLocation().x, touch.getLocation().y);
                return true;
            },
            onTouchMoved: function (touch, event) {
                that.processTouchUpdated(touch.getLocation().x, touch.getLocation().y)
            },
            onTouchEnded: function (touch, event) {
                that.processTouchEnded(touch.getLocation().x, touch.getLocation().y);
            }
        }, this.gamefield);
    },

    removeListeners: function () {
        cc.eventManager.removeListeners(cc.EventListener.TOUCH_ONE_BY_ON);
    },

    processTouchStarted: function (touchX, touchY) {
        if (touchY <= GameConstants.PADDLE_MAX_Y) {
            this.touchStartCoords.x = touchX;
            this.touchStartCoords.y = touchY;
            this.isPaddleBeingDrawn = true;

            if (this.splashCircle == null) {
                this.splashCircle = GameSpriteManager.getSprite("SplashCircle");
            }
            this.gamefield.containerBg.addChild(this.splashCircle);
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

    processTouchUpdated: function (touchX, touchY) {
        if (this.isPaddleBeingDrawn == false) {
            return;
        }

        if (touchY > GameConstants.PADDLE_MAX_Y) {
            touchY = GameConstants.PADDLE_MAX_Y;
        }

        this.updatePaddleEndCoords(touchX, touchY, this.gamefield);
        this.displayPaddleBeingDrawn(this.paddleEndCoords.x, this.paddleEndCoords.y, this.gamefield);

        /*
         if (this.paddle != null) {
         this.paddle.shapeList[0].setEndpoints(cc.p(this.touchStartCoords.x, this.touchStartCoords.y), cc.p(this.paddleEndCoords.x, this.paddleEndCoords.y));
         // this.paddle.shapeList[0].bb_l = this.touchStartCoords.x;
         // this.paddle.shapeList[0].ta.x = this.touchStartCoords.x;
         // this.paddle.shapeList[0].bb_b = this.touchStartCoords.y;
         // this.paddle.shapeList[0].ta_y = this.touchStartCoords.y;
         // this.paddle.shapeList[0].bb_r = this.paddleEndCoords.x;
         // this.paddle.shapeList[0].tb_x = this.paddleEndCoords.x;
         // this.paddle.shapeList[0].bb_t = this.paddleEndCoords.y;
         // this.paddle.shapeList[0].tb_y = this.paddleEndCoords.y;
         this.paddle.shapeList[0].cacheBB();
         }
         */


        // todo: might be horrible for performance
        if (this.paddle != null) {
            this.gamefield.scheduleRemoveBody(this.paddle);
            this.paddle = null;
        }
        this.paddle = LevelObjectsFactory.addPaddle(new cp.v(this.touchStartCoords.x, this.touchStartCoords.y), new cp.v(this.paddleEndCoords.x, this.paddleEndCoords.y), this.gamefield.space);

    },

    updatePaddleEndCoords: function (paddleEndX, paddleEndY) {
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

    displayPaddleBeingDrawn: function (currentX, currentY) {
        this.gamefield.drawNodeTouch.clear();
        this.gamefield.drawNodeTouch.drawSegment(new cp.v(this.touchStartCoords.x, this.touchStartCoords.y), new cp.v(currentX, currentY), LevelObjectsFactory.PADDLE_WIDTH, cc.color(255, 255, 255, 128));
    },

    processTouchEnded: function (touchX, touchY, gamefield) {
        if (this.isPaddleBeingDrawn == false) {
            return;
        }
        // if (this.paddle != null) {
        //     console.log(this.paddle.shapeList[0].bb_l, this.paddle.shapeList[0].bb_b, " - ", this.paddle.shapeList[0].bb_r, this.paddle.shapeList[0].bb_t);
        // }
        this.isPaddleBeingDrawn = false;
        this.gamefield.drawNodeTouch.clear();
        this.removeSplashCircle();

        if (touchY > this.PADDLE_MAX_Y) {
            touchY = this.PADDLE_MAX_Y;
        }

        this.updatePaddleEndCoords(touchX, touchY);

        if (this.paddle != null) {
            this.removePaddle(gamefield);
        }

        this.paddle = LevelObjectsFactory.addPaddle(new cp.v(this.touchStartCoords.x, this.touchStartCoords.y), new cp.v(this.paddleEndCoords.x, this.paddleEndCoords.y), this.gamefield.space);
    },

    removePaddle: function (gamefield) {
        if (this.paddle != null) {
            this.gamefield.scheduleRemoveBody(this.paddle);
            this.paddle = null;
        }
        // if (this.paddleSprite != null) {
        //     this.paddleSprite.removeFromParent();
        // }
        this.isPaddleBeingDrawn = false;
        this.gamefield.drawNodeTouch.clear();
        this.removeSplashCircle();
    }
};