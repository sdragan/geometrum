var GamefieldScene = cc.Scene.extend({

    updateCallback: null,
    ballSpeedCallback: null,

    space: null,
    bodiesToRemove: null,
    bodiesToCreate: null,
    blocks: null,
    balls: null,
    blocksLeft: 0,
    minBallSpeed: GameConstants.MIN_BALL_SPEED,

    containerBg: null,
    containerFg: null,
    containerUi: null,
    containerArea: null,
    containerLevelObjects: null,
    containerBall: null,
    containerParticles: null,
    drawNodeTouch: null,

    effectFlash: null,
    effectScreenshake: null,
    effectPauseOverlay: null,
    effectTintLevelObjects: null,
    effectBackgroundHighlight: null,

    blocksHitInRow: 0,
    blocksDestroyedInRow: 0,
    score: 0,
    level: 0,

    preLevelMenu: null,
    postLevelMenu: null,

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
        this.initParticles();
        this.initPhysics();
        this.addWalls();
        Paddle.init(this);
        // this.initDebugMode();
        this.scheduleUpdate();

        this.createPreLevelAndMainMenu();
    },

    initLayers: function () {
        this.containerBg = new cc.Node();
        this.containerFg = new cc.Node();
        this.containerUi = new cc.Node();
        this.containerArea = new cc.Node();
        this.containerLevelObjects = new cc.Node();
        this.containerBall = new cc.Node();
        this.containerParticles = new cc.Node();

        this.addChild(this.containerBg);
        this.addChild(this.containerFg);
        this.addChild(this.containerUi);
        this.containerFg.addChild(this.containerArea);
        this.containerFg.addChild(this.containerLevelObjects);
        this.containerFg.addChild(this.containerBall);
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
        this.effectPauseOverlay = new VisualEffectPauseOverlay(this);
        this.effectTintLevelObjects = new VisualEffectTintLevelObjects(this);
        this.effectBackgroundHighlight = new VisualEffectBackgroundHighlight(this);
    },

    initParticles: function () {
        GameParticleManager.setParent(this.containerParticles);
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

    createPreLevelAndMainMenu: function () {
        this.updateCallback = this.updateNormal;
        this.level = 0;
        LevelsBuilder.buildLevel(this);
        this.createBallAtInitialPosition();
        this.preLevelMenu = new PreLevelMenu(this);
        this.preLevelMenu.init();
        Paddle.addListeners();
        Paddle.setPaddleFinishedCallback(this.startFromMainMenu);
        Paddle.setPaddleMaxY(300);
        this.ballSpeedCallback = function (ball, dt) {
        };
    },

    createBallAtInitialPosition: function () {
        this.balls.push(LevelObjectsFactory.addBall(GameConstants.APP_WIDTH / 2, GameConstants.APP_HEIGHT / 2, this.space, this.containerBall, GameConstants.SPRITE_NAME_BALL));
    },

    setInitialBallVelocity: function () {
        for (var i = 0; i < this.balls.length; i++) {
            this.balls[i].setVel(cp.v(0, GameConstants.INITIAL_BALL_VEL_Y));
        }
        this.ballSpeedCallback = this.fadeInBallSpeed;
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
                this.processPaddleHit(arbiter.b.body, arbiter.a.body, arbiter);
            }
        }
        else if (levelObjectB.tag == Tags.BALL) {
            if (levelObjectA.tag == Tags.BLOCK) {
                arbiter.a.body.userData.processHit(arbiter.b.body, this);
            }
            else if (levelObjectA.tag == Tags.PADDLE) {
                this.processPaddleHit(arbiter.a.body, arbiter.b.body, arbiter);
            }
        }
        return true;
    },

    processPaddleHit: function (paddle, ball, arbiter) {
        this.blocksHitInRow = 0;
        this.blocksDestroyedInRow = 0;
        Paddle.removePaddle(this);
        this.setDelayedBallPaddleParticles(arbiter.contacts[0].p.x, arbiter.contacts[0].p.y, ball);
    },

    delayedBallPaddleParticlesParams: null,
    setDelayedBallPaddleParticles: function (collisionX, collisionY, ball) {
        this.delayedBallPaddleParticlesParams = {x: collisionX, y: collisionY, ball: ball, ticksLeft: 1};
    },

    updateDelayedParticles: function () {
        if (this.delayedBallPaddleParticlesParams != null) {
            if (this.delayedBallPaddleParticlesParams.ticksLeft > 0) {
                this.delayedBallPaddleParticlesParams.ticksLeft -= 1;
            }
            else {
                // todo: ball direction
                var ballVelocity = this.delayedBallPaddleParticlesParams.ball.getVelocity();
                // var normalizedVelocity = cp.v.normalize(ballVelocity);
                // this.delayedBallPaddleParticlesParams.ball.userData.sprite.setScale(1 + Math.abs(normalizedVelocity.x), 1 + Math.abs(normalizedVelocity.y));
                var ballAngle = MathUtils.radToDeg(Math.atan2(ballVelocity.x, ballVelocity.y));
                var oppositeAngle = 180 + ballAngle;
                console.log("angle: " + ballAngle + ", oppositeAngle: " + oppositeAngle);
                GameParticleManager.displayBallPaddleParticles(this.delayedBallPaddleParticlesParams, oppositeAngle);
                this.delayedBallPaddleParticlesParams = null;
            }
        }
    },

    processBlockHit: function (levelObject) {
        this.blocksHitInRow += 1;
        // this.playBlockHitSound();
    },

    processBlockDestroyed: function (levelObject) {
        this.blocksHitInRow += 1;
        this.blocksDestroyedInRow += 1;

        if (this.blocksDestroyedInRow >= GameConstants.BLOCKS_DESTROYED_IN_ROW_FOR_HIGHLIGHT) {
            this.effectBackgroundHighlight.show(this.blocksDestroyedInRow - GameConstants.BLOCKS_DESTROYED_IN_ROW_FOR_HIGHLIGHT + 1);
        }
        // this.playBlockHitSound();
        this.score += levelObject.score * this.blocksHitInRow;

        this.blocksLeft -= 1;
        if (this.blocksLeft <= 0) {
            this.processLevelWon();
        }
    },

    processBallTouchedDangerousBlock: function (ball, levelObject) {

    },

    processLevelWon: function () {
        console.log("Level " + this.level.toString() + " won");
        this.level += 1;
        Paddle.removePaddle(this);
        Paddle.removeListeners();
        this.ballSpeedCallback = this.fadeOutBallSpeed;
        LevelTransition.transitToNextLevel(this);
        this.moveBallToScreenCenter(this.balls[0]);
    },

    moveBallToScreenCenter: function (ball) {
        var waitAction = cc.moveBy(1.5, 0, 0);
        var shrinkAction = cc.scaleTo(0.3, 0, 0).easing(cc.easeQuadraticActionOut());
        var moveToCenterAction = cc.callFunc(function () {
            ball.setPos(cc.p(240, 360));
            ball.setVel(cc.p(0, 0));
        }, this);
        var unshrinkAction = cc.scaleTo(0.8, 1, 1).easing(cc.easeBounceOut());
        ball.userData.sprite.runAction(cc.sequence(waitAction, shrinkAction, moveToCenterAction, unshrinkAction));
    },

    removeAllBlocksWithSplash: function () {
        for (var i = 0; i < this.blocks.length; i++) {
            if (this.bodiesToRemove.indexOf(this.blocks[i] < 0)) {
                this.bodiesToRemove.push(this.blocks[i]);
                // todo: and an explosion effect
            }
        }
    },

    retry: function () {

    },

    isZeroGravity: function () {
        return this.space.gravity.y == 0;
    },

    update: function (dt) {
        this.updateCallback(dt);
    },

    updateNormal: function (dt) {
        this.space.step(dt);
        this.updateBlocks(dt);
        this.updateBalls(dt);
        this.removeMarkedBodies();
        this.addScheduledBodies();
        this.updateDelayedParticles();
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
            this.ballSpeedCallback(ball, dt);
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
        this.effectFlash.doFlash();
        this.scheduleRemoveBody(ball);
        if (this.balls.length == 1) {
            console.log("Lost");
            this.processGameLost();
        }
    },

    processGameLost: function () {
        var delayDuration = 3;
        var delayAction = cc.moveBy(delayDuration, 0, 0);
        var postDelayFuncAction = cc.callFunc(this.showPostLevelMenu, this);
        this.containerBg.runAction(cc.sequence(delayAction, postDelayFuncAction));
        Paddle.removePaddle(this);
        Paddle.removeListeners();
    },

    showPostLevelMenu: function () {
        // todo: decide whether to show PostLevelMenu or PostLevelContinueMenu
        if (false) {
            this.postLevelContinueMenu = new PostLevelContinueMenu(this);
            this.postLevelContinueMenu.init();
        }
        else {
            this.proceedToPostLevelMenu();
        }
    },

    proceedToPostLevelMenu: function () {
        this.postLevelMenu = new PostLevelMenu(this);
        this.postLevelMenu.init();
    },

    limitBallSpeed: function (ball, dt) {
        var magnitude = Math.sqrt((ball.getVelocity().x * ball.getVelocity().x) + (ball.getVelocity().y * ball.getVelocity().y));
        if (magnitude >= this.minBallSpeed) {
            // return;
        }
        var accelerationPerSecond = 10000;
        var acceleration = accelerationPerSecond * dt;
        var targetMagnitude = this.minBallSpeed;
        var diff = targetMagnitude - magnitude;
        var newMagnitude = 0;
        if (diff < acceleration) {
            newMagnitude = targetMagnitude;
        }
        else {
            newMagnitude = magnitude + acceleration;
        }
        ball.setVel(ball.getVelocity().mult(newMagnitude / magnitude));
    },

    fadeOutBallSpeed: function (ball, dt) {
        var magnitude = Math.sqrt((ball.getVelocity().x * ball.getVelocity().x) + (ball.getVelocity().y * ball.getVelocity().y));
        if (magnitude <= 5) {
            ball.setVel(ball.getVelocity().mult(0));
        }
        else {
            ball.setVel(ball.getVelocity().mult(0.98));
        }
    },

    fadeInBallSpeed: function (ball, dt) {
        var magnitude = Math.sqrt((ball.getVelocity().x * ball.getVelocity().x) + (ball.getVelocity().y * ball.getVelocity().y));
        if (magnitude >= this.minBallSpeed) {
            ball.setVel(ball.getVelocity().mult(this.minBallSpeed / magnitude));
            this.ballSpeedCallback = this.limitBallSpeed;
        }
        else {
            ball.setVel(ball.getVelocity().mult(1.025));
        }
    },

    ballSlowDownTime: 0,
    ballSlowDownDuration: 2,
    ballPrevWaypoint: null,
    currentWaypoint: {x: 240, y: 360},
    ballSlowDownMoveToCenter: function (ball, dt) {
        if (this.ballPrevWaypoint == null) {
            this.ballPrevWaypoint = ball.getPos();
        }
        this.ballSlowDownTime += dt;
        if (this.ballSlowDownTime >= this.ballSlowDownDuration) {
            this.ballSlowDownTime = this.ballSlowDownDuration;
        }
        var currentPosition = ball.getPos();
        var newX = GeometrumEase.easeNone(this.ballSlowDownTime, this.ballPrevWaypoint.x, this.currentWaypoint.x - this.ballPrevWaypoint.x, this.ballSlowDownDuration);
        var newY = GeometrumEase.easeNone(this.ballSlowDownTime, this.ballPrevWaypoint.y, this.currentWaypoint.y - this.ballPrevWaypoint.y, this.ballSlowDownDuration);
        var diffX = newX - currentPosition.x;
        var diffY = newY - currentPosition.y;
        ball.setVel({
            x: (diffX / dt) / this.ballSlowDownDuration,
            y: (diffY / dt) / this.ballSlowDownDuration
        });
        if (this.ballSlowDownTime >= this.ballSlowDownDuration) {
            this.ballSlowDownTime = 0;
            this.ballSpeedCallback = function (ball, dt) {
            };
            this.ballPrevWaypoint = null;
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

    scheduleAddBody2: function (scheduledBodyInfo) {
        this.bodiesToCreate.push(scheduledBodyInfo);
    },

    addScheduledBodies: function () {
        if (this.bodiesToCreate.length > 0) {
            for (var i = 0; i < this.bodiesToCreate.length; i++) {
                var desc = this.bodiesToCreate[i];
                var body = LevelObjectsFactory.createBlock(desc.objX, desc.objY, desc.objAngle, desc.spriteName, desc.isStatic, this.space, this.containerLevelObjects);
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
    },

    resetToMainMenu: function () {
        var i;
        for (i = 0; i < this.balls.length; i++) {
            this.scheduleRemoveBody(this.balls[i]);
        }
        for (i = 0; i < this.blocks.length; i++) {
            this.scheduleRemoveBody(this.blocks[i]);
        }
        Paddle.removePaddle(this);
        this.removeMarkedBodies();

        this.createPreLevelAndMainMenu();
    },

    startFromMainMenu: function () {
        Paddle.removePaddleFinishedCallback();
        this.setInitialBallVelocity();
        this.preLevelMenu.cleanUp();
    }
});

var Paddle = {
    touchStartCoords: {x: 0, y: 0},
    paddleEndCoords: {x: 0, y: 0},
    paddle: null,
    isPaddleBeingDrawn: false,
    splashCircle: null,
    gamefield: null,
    paddleMaxY: GameConstants.PADDLE_MAX_Y,

    init: function (gamefield) {
        this.touchStartCoords = {x: 0, y: 0};
        this.paddleEndCoords = {x: 0, y: 0};
        this.paddle = null;
        this.isPaddleBeingDrawn = false;
        this.gamefield = gamefield;
    },

    paddleFinishedCallback: null,
    setPaddleFinishedCallback: function (callback) {
        this.paddleFinishedCallback = callback;
    },
    removePaddleFinishedCallback: function () {
        this.paddleFinishedCallback = null;
        Paddle.setPaddleMaxY(GameConstants.PADDLE_MAX_Y);
    },
    setPaddleMaxY: function (value) {
        this.paddleMaxY = value;
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
        cc.eventManager.removeListeners(cc.EventListener.TOUCH_ONE_BY_ONE);
    },

    processTouchStarted: function (touchX, touchY) {
        if (touchY <= this.paddleMaxY) {
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

        if (touchY > this.paddleMaxY) {
            touchY = this.paddleMaxY;
        }

        this.updatePaddleEndCoords(touchX, touchY, this.gamefield);
        this.displayPaddleBeingDrawn(this.paddleEndCoords.x, this.paddleEndCoords.y, this.gamefield);

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
        this.isPaddleBeingDrawn = false;
        this.gamefield.drawNodeTouch.clear();
        this.removeSplashCircle();

        if (touchY > this.paddleMaxY) {
            touchY = this.paddleMaxY;
        }

        this.updatePaddleEndCoords(touchX, touchY);

        if (this.paddle != null) {
            this.removePaddle(gamefield);
        }

        this.displayPaddleBeingDrawn(this.paddleEndCoords.x, this.paddleEndCoords.y);
        this.paddle = LevelObjectsFactory.addPaddle(new cp.v(this.touchStartCoords.x, this.touchStartCoords.y), new cp.v(this.paddleEndCoords.x, this.paddleEndCoords.y), this.gamefield.space);

        if (this.paddleFinishedCallback != null) {
            this.paddleFinishedCallback.call(this.gamefield);
            this.removePaddleFinishedCallback();
            this.paddleMaxY = GameConstants.PADDLE_MAX_Y;
        }
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

var LevelTransition = {
    transitToNextLevel: function (gamefield) {
        this.gamefield = gamefield;
        this.destroyAllRemainingBlocks();
        this.doWait();
    },

    destroyAllRemainingBlocks: function () {

    },

    doWait: function () {
        var duration = 3;
        var waitAction = cc.moveBy(duration, 0, 0);
        var switchToNextPart = cc.callFunc(this.generateNextLevel, this);
        this.gamefield.containerFg.runAction(cc.sequence(waitAction, switchToNextPart));
    },

    generateNextLevel: function () {
        console.log("Generating new level");

        LevelsBuilder.buildLevel(this.gamefield);

        this.gamefield.containerLevelObjects.setPosition(0, GameConstants.APP_HEIGHT);

        var duration = 2;
        var fgMoveBy = cc.moveBy(duration, 0, -GameConstants.APP_HEIGHT).easing(cc.easeCubicActionInOut());
        var switchToNextPart = cc.callFunc(this.continueNextLevel, this);
        this.gamefield.containerLevelObjects.runAction(cc.sequence(fgMoveBy, switchToNextPart));
    },

    continueNextLevel: function () {
        this.gamefield.setInitialBallVelocity();
        Paddle.addListeners();
    }
};