var LevelObject = function () {
    this.tag = "";
    this.hp = 1;
    this.score = 0;
    this.sprite = null;
    this.blockType = [BlockTypes.NORMAL];
    this.godModeTime = 0;
    this.nextSkins = [];
    this.body = null;
    this.movementComponents = [];

    this.hasType = function (typeToSearch) {
        return this.blockType.indexOf(typeToSearch) >= 0;
    };

    this.makeInvulnerable = function (time) {
        this.godModeTime = time;
    };

    this.processHit = function (ball, gamefield) {
        if (this.hasType(BlockTypes.UNBREAKABLE) || this.godModeTime > 0 || gamefield.bodiesToRemove.indexOf(this.body) >= 0) {
            return;
        }

        if (this.hasType(BlockTypes.DANGEROUS)) {
            gamefield.processBallTouchedDangerousBlock(ball, this);
            return;
        }

        this.hp -= 1;

        if (this.hp <= 0) {
            gamefield.scheduleRemoveBody(this.body);
            gamefield.processBlockDestroyed(this);
        }
        else {
            if (this.nextSkins.length > 0) {
                var nextSkin = this.nextSkins.shift();
                if (nextSkin !== "") {
                    this.godModeTime = GameConstants.GOD_MODE_TIME_DEFAULT;
                    var previousParent = this.sprite.getParent();
                    this.sprite.removeFromParent();
                    this.sprite = GameSpriteManager.getPhSprite(nextSkin);
                    this.sprite.setBody(this.body);
                    previousParent.addChild(this.sprite);
                }
            }
            this.displayHitAnimation();
            gamefield.processBlockHit(this);
        }
    };

    this.displayHitAnimation = function () {
        var seq = cc.sequence(cc.scaleTo(0.08, 0.9), cc.scaleTo(0.08, 1));
        this.sprite.runAction(seq);
    };

    this.update = function (dt, gamefield) {
        this.updateInvulnerability();

        if (this.hasType(BlockTypes.MAGNET) || this.hasType(BlockTypes.ANTIMAGNET)) {
            this.updateMagnet(gamefield);
        }


        this.updateMovementComponents(dt);
    };

    this.updateInvulnerability = function (dt) {
        this.godModeTime -= dt;
        if (this.godModeTime <= 0) {
            this.godModeTime = 0;
        }
    };

    this.updateMagnet = function (gamefield) {
        var balls = gamefield.balls;

        for (var u = 0; u < balls.length; u++) {
            var ball = balls[u];
            var diffX = this.body.getPosition().x - ball.getPosition().x;
            var diffY = this.body.getPosition().y - ball.getPosition().y;
            var pt = cp.v(diffX, diffY);
            var distance = Math.sqrt((diffX * diffX) + (diffY * diffY));

            var multiplier;
            if (this.hasType(BlockTypes.MAGNET)) {
                multiplier = 1;
            }
            else {
                multiplier = -1;
            }

            if (distance < LevelObjectsFactory.MAGNET_RADIUS) {
                pt.x /= distance;
                pt.y /= distance;
                ball.setVel(ball.getVel().add(pt.mult(GameConstants.MAGNET_STRENGTH * multiplier)));
            }
        }
    };

    this.updateMovementComponents = function (dt) {
        for (var i = 0; i < this.movementComponents.length; i++) {
            this.movementComponents[i].update(dt);
        }
    };

    this.remove = function (space) {

        while (this.body.shapeList.length > 0) {
            space.removeShape(this.body.shapeList[0]);
        }

        if (this.body.space != null) {
            space.removeBody(this.body);
        }

        if (this.sprite != null) {
            this.sprite.removeFromParent();
        }

        if (this.areaSprite != null && this.areaSprite.getParent() != null) {
            var areaSprite = this.areaSprite;
            var removeSprite = function () {
                areaSprite.removeFromParent();
            };
            this.areaSprite.runAction(cc.sequence(cc.fadeOut(0.5), cc.callFunc(removeSprite, this)));
        }

        this.movementComponents = [];
    }
};

var LevelObjectAngularMoveComponent = function (levelObject, speed) {
    this.levelObject = levelObject;
    this.speed = speed;

    this.update = function (dt) {
        this.levelObject.setAngVel(this.speed);
    }
};

var LevelObjectWaypointMoveComponent = function (levelObject, waypoints, duration, waitOnWaypoints, easingFunction) {
    this.levelObject = levelObject;
    this.waypoints = waypoints;
    this.duration = duration;
    this.waitOnWaypoints = waitOnWaypoints;
    this.easingFunction = easingFunction;

    this.currentWaypointIndex = 1;
    this.time = 0;
    this.waitTime = this.waitOnWaypoints;

    this.currentWaypoint = null;
    this.prevWaypoint = null;
    this.tempPoint = cc.p(0, 0);

    this.update = function (dt) {
        if (this.waitTime > 0) {
            this.waitTime -= dt;
            this.tempPoint.x = 0;
            this.tempPoint.y = 0;
            this.levelObject.setVel(this.tempPoint);
            return;
        }

        this.time += dt;
        if (this.time >= this.duration) {
            this.time = this.duration;
        }

        var currentPosition = this.levelObject.getPos();
        var newX = this.easingFunction(this.time, this.prevWaypoint.x, this.currentWaypoint.x - this.prevWaypoint.x, this.duration);
        var newY = this.easingFunction(this.time, this.prevWaypoint.y, this.currentWaypoint.y - this.prevWaypoint.y, this.duration);
        var diffX = newX - currentPosition.x;
        var diffY = newY - currentPosition.y;
        this.tempPoint.x = (diffX / dt) / this.duration;
        this.tempPoint.y = (diffY / dt) / this.duration;
        this.levelObject.setVel(this.tempPoint);

        this.processWaypointReached();
    };

    this.processWaypointReached = function () {
        if (this.time >= this.duration) {
            this.time = 0;
            this.waitTime = this.waitOnWaypoints;
            if (this.currentWaypointIndex < this.waypoints.length - 1) {
                this.currentWaypointIndex += 1;
            }
            else {
                this.currentWaypointIndex = 0;
            }
            this.updateCurrentAndPrevWaypoints();
        }
    };

    this.updateCurrentAndPrevWaypoints = function () {
        this.currentWaypoint = this.waypoints[this.currentWaypointIndex];
        if (this.currentWaypointIndex == 0) {
            this.prevWaypoint = this.waypoints[this.waypoints.length - 1];
        }
        else {
            this.prevWaypoint = this.waypoints[this.currentWaypointIndex - 1];
        }
    };

    this.updateCurrentAndPrevWaypoints();
};

var GeometrumEase = {
    easeNone: function (time, before, change, duration) {
        return before + change * (time / duration);
    },

    easeInQuad: function (t, b, c, d) {
        return c * (t /= d) * t + b;
    },

    easeInQuartic: function (t, b, c, d) {
        var ts = (t /= d) * t;
        return b + c * (ts * ts);
    }
};

var Tags = {
    BALL: "ball",
    BLOCK: "block",
    WALL: "wall",
    PADDLE: "paddle"
};

var BlockTypes = {
    NORMAL: "normal",
    TOUGH: "tough",
    MOVABLE: "movable",
    UNBREAKABLE: "unbreakable",
    SPLITTABLE: "splittable",
    TOUGH_MOVABLE: "tough_movable",
    MAGNET: "magnet",
    ANTIMAGNET: "antimagnet",
    DANGEROUS: "dangerous"
};

var CollisionTypes = {
    COMMON: 1,
    WALLS: 2
};

var LevelObjectsFactory = {
    BALL_ELASTICITY: 1,
    BALL_FRICTION: 0,
    BALL_MASS: 0.5,
    BLOCK_ELASTICITY: 0.6,
    BLOCK_FRICTION: 1,
    PADDLE_ELASTICITY: 1.6,
    PADDLE_FRICTION: 0.5,
    PADDLE_WIDTH: 3,
    WALLS_WIDTH: 80,
    WALLS_ELASTICITY: 0.5,
    WALLS_FRICTION: 1,
    MOVABLE_BLOCK_MASS: 50,
    MAGNET_RADIUS: 200,

    TYPES_BY_SKIN: {
        Block_Normal_1: [BlockTypes.NORMAL]
    },

    HP_BY_SKIN: {
        Block_Normal_1: 1,
        Block_Tough_1_hp3: 3,
        Block_Tough_1_hp2: 2,
        Block_Tough_1_hp1: 1
    },

    BASE_SCORE_BY_SKIN: {
        Block_Normal_1: 1,
        Block_Tough_1_hp3: 3
    },

    NEXT_SKINS_BY_SKIN: {
        Block_Tough_1_hp3: ["Block_Tough_1_hp2", "Block_Tough_1_hp1"]
    },

    createBlock: function (blockX, blockY, angle, skin, isStatic, space, container) {
        if (bodyDefs.hasOwnProperty(skin) == false) {
            throw new Error("Trying to create block with unknown skin");
        }

        var sprite = GameSpriteManager.getPhSprite(skin);
        var body;
        if (isStatic == true) {
            body = this.createStaticBody();
        }
        else {
            var mass = Infinity;
            var nodeSize = sprite.getContentSize();
            var momentum = cp.momentForBox(mass, nodeSize.width, nodeSize.height);
            body = this.createNormalBody(space, mass, momentum);
        }

        body.setPos(cc.p(blockX, blockY));
        body.setAngle(MathUtils.degToRad(360 - angle));
        sprite.setBody(body);
        var bd = bodyDefs[skin];
        sprite.setAnchorPoint(bd.anchorPoint);
        var nodeSize = sprite.getContentSize();
        var offset = cc.p(-nodeSize.width * bd.anchorPoint.x, -nodeSize.height * bd.anchorPoint.y);
        var collisionType = CollisionTypes.COMMON;
        this.createPolyShape(space, body, bd, offset, collisionType);
        container.addChild(sprite);

        var userData = new LevelObject();
        userData.tag = Tags.BLOCK;
        userData.blockType = this.TYPES_BY_SKIN[skin];
        userData.hp = this.HP_BY_SKIN[skin];
        userData.sprite = sprite;
        if (this.NEXT_SKINS_BY_SKIN.hasOwnProperty(skin)) {
            userData.nextSkins = this.NEXT_SKINS_BY_SKIN[skin]
        }
        userData.score = this.BASE_SCORE_BY_SKIN[skin];
        body.userData = userData;
        userData.body = body;
        return body;
    },

    addCrystal: function (crystalX, crystalY, angle, spriteName, isStatic, blockType, space, container, nextSkins, areaSpriteContainer) {
        if (typeof nextSkins == "undefined") {
            nextSkins = [];
        }
        var isPoly = bodyDefs.hasOwnProperty(spriteName) || spriteName.indexOf("Crystal_") == 0;
        var frame = GameSpriteManager.getFrame(spriteName);
        var sprite = null;
        if (isStatic) {
            sprite = this.createStaticSprite(frame, crystalX, crystalY, angle);
        }
        else {
            sprite = this.createPhSprite(frame);
        }

        var nodeSize = sprite.getContentSize();
        var body = null;
        if (isStatic) {
            body = this.createStaticBody();
        }
        else {
            var mass = this.MOVABLE_BLOCK_MASS;
            var momentum = cp.momentForBox(mass, nodeSize.width, nodeSize.height);
            body = this.createNormalBody(space, mass, momentum);
            sprite.setBody(body);
        }
        body.setPos(cc.p(crystalX, crystalY));
        body.setAngle(MathUtils.degToRad(360 - angle));

        var collisionType = CollisionTypes.COMMON;
        if (isPoly) {
            // might be a temporary solution
            var bd;
            if (spriteName.indexOf("Crystal_") == 0) {
                var genericName = "Crystal_" + spriteName[spriteName.length - 1];
                bd = bodyDefs[genericName];
            }
            else {
                bd = bodyDefs[spriteName];
            }
            sprite.setAnchorPoint(bd.anchorPoint);
            var offset = cc.p(-nodeSize.width * bd.anchorPoint.x, -nodeSize.height * bd.anchorPoint.y);
            this.createPolyShape(space, body, bd, offset, collisionType);
        }
        else {
            this.createBoxShape(space, body, nodeSize, 0.5, 0.5, collisionType);
        }

        var userData = new LevelObject();
        userData.tag = Tags.BLOCK;
        userData.blockType = blockType;
        userData.hp = blockType.indexOf(BlockTypes.TOUGH_MOVABLE) >= 0 || blockType.indexOf(BlockTypes.TOUGH) >= 0 ? 3 : 1;
        userData.sprite = sprite;
        userData.nextSkins = nextSkins;
        body.userData = userData;
        userData.body = body;

        if (spriteName.indexOf("agnet") >= 0) {
            var areaSprite;
            if (spriteName.indexOf("Antimagnet") >= 0) {
                // areaSprite = GameSpriteManager.getSprite("AntimagnetArea");
                areaSprite = GameSpriteManager.getSprite("MagnetArea"); // todo: change to "AntimagnetArea"

            }
            else {
                areaSprite = GameSpriteManager.getSprite("MagnetArea");
            }
            var areaSpriteInitialSize = 200;
            var areaSpriteTargetScale = (this.MAGNET_RADIUS * 2) / areaSpriteInitialSize;
            areaSprite.setScale(areaSpriteTargetScale);
            areaSprite.setAnchorPoint(0.5, 0.5);
            areaSpriteContainer.addChild(areaSprite);
            areaSprite.setPosition(cc.p(crystalX, crystalY));
            userData.areaSprite = areaSprite;
        }
        container.addChild(sprite);

        return body;
    },

    createStaticSprite: function (frame, objX, objY, angle) {
        var staticSprite = new cc.Sprite(frame);
        staticSprite.setPosition(cc.p(objX, objY));
        staticSprite.setRotation(angle);
        return staticSprite;
    },

    createPhSprite: function (frame) {
        return new cc.PhysicsSprite(frame);
    },

    createNormalBody: function (space, mass, momentum) {
        return space.addBody(new cp.Body(mass, momentum));
    },

    createStaticBody: function () {
        return new cp.StaticBody();
    },

    createBoxShape: function (space, body, nodeSize, elasticity, friction, collisionType) {
        var boxShape = new cp.BoxShape(body, nodeSize.width, nodeSize.height);
        this.addShape(space, boxShape, elasticity, friction, collisionType);
    },

    createCircleShape: function (space, body, nodeSize, elasticity, friction, collisionType) {
        var circleShape = new cp.CircleShape(body, nodeSize.height * 0.5, cc.p(0, 0));
        this.addShape(space, circleShape, elasticity, friction, collisionType);
    },

    createPolyShape: function (space, body, bodyDef, offset, collisionType) {
        var fixture = bodyDef.fixtures[0];
        var bdPolygons = fixture.polygons;
        var shapes = [];
        for (var j = 0; j < bdPolygons.length; j++) {
            var polyShape = new cp.PolyShape(body, bdPolygons[j].vertices, offset);
            this.addShape(space, polyShape, fixture["elasticity"], fixture["friction"], collisionType);
            shapes.push(polyShape);
        }
    },

    createStaticLineShape: function (space, body, a, b, r, elasticity, friction, collisionType) {
        var lineShape = new cp.SegmentShape(body, a, b, r);
        lineShape.setElasticity(elasticity);
        lineShape.setFriction(friction);
        lineShape.setCollisionType(collisionType);
        space.addStaticShape(lineShape);
    },

    addShape: function (space, shape, elasticity, friction, collisionType) {
        space.addShape(shape);
        shape.setFriction(friction);
        shape.setElasticity(elasticity);
        shape.setCollisionType(collisionType);
    },

    addBall: function (ballX, ballY, space, container, spriteName) {
        return this.addPhysicsCircle(ballX, ballY, space, container, Tags.BALL, CollisionTypes.COMMON, this.BALL_ELASTICITY, this.BALL_FRICTION, spriteName);
    },

    addPhysicsCircle: function (circleX, circleY, space, container, tag, collisionType, elasticity, friction, spriteName) {
        var mass = 3;
        var sprite = GameSpriteManager.getPhSprite(spriteName);
        var nodeSize = sprite.getContentSize();

        var body = this.createNormalBody(space, mass, cp.momentForBox(mass, nodeSize.width, nodeSize.height));
        body.setPos(cc.p(circleX, circleY));
        this.createCircleShape(space, body, nodeSize, elasticity, friction, collisionType);
        sprite.setBody(body);
        container.addChild(sprite);

        var userData = new LevelObject();
        userData.tag = tag;
        userData.sprite = sprite;
        body.userData = userData;
        userData.body = body;
        return body;
    },

    addWall: function (a, b, space) {
        return this.addCustomLine(a, b, this.WALLS_WIDTH, space, this.WALLS_ELASTICITY, this.WALLS_FRICTION, Tags.WALL, CollisionTypes.WALLS);
    },

    addPaddle: function (a, b, space) {
        return this.addCustomLine(a, b, this.PADDLE_WIDTH, space, this.PADDLE_ELASTICITY, this.PADDLE_FRICTION, Tags.PADDLE, CollisionTypes.COMMON)
    },

    addCustomLine: function (a, b, r, space, elasticity, friction, tag, collisionType) {
        var body = this.createStaticBody();
        this.createStaticLineShape(space, body, a, b, r, elasticity, friction, collisionType);
        var userData = new LevelObject();
        userData.tag = tag;
        userData.body = body;
        body.userData = userData;
        return body;
    }
};

LevelsBuilder = {
    rangeBoundaries: [0, 2, 5],
    levelsPool: [[], [], []],
    availableLevels: [],

    buildLevel: function (gamefield) {
        var levelBuildFunction = this.selectLevel(gamefield.level);
        levelBuildFunction(gamefield);
    },

    selectLevel: function (level) {
        var range = this.getRange(level);
        if (this.isFirstInRange(level)) {
            this.availableLevels = [];
        }

        if (this.availableLevels.length == 0) {
            this.fillAvailableLevelsList(range);
        }

        var levelBuildFunction = this.getLevelFromPool(range);
        return levelBuildFunction;
    },

    isFirstInRange: function (level) {
        return this.rangeBoundaries.indexOf(level) >= 0;
    },

    getRange: function (level) {
        for (var i = 0; i < this.rangeBoundaries.length; i++) {
            if (level < this.rangeBoundaries[i]) {
                return i - 1;
            }
        }
        return this.rangeBoundaries.length;
    },

    fillAvailableLevelsList: function (range) {
        for (var i = 0; i < this.levelsPool[range].length; i++) {
            this.availableLevels.push(this.levelsPool[range][i]);
        }
    },

    getLevelFromPool: function () {
        var levelIndex = Math.floor(Math.random() * this.availableLevels.length);
        var currentLevel = this.availableLevels[levelIndex];
        this.availableLevels.splice(levelIndex, 1);
        return currentLevel;
    },

    init: function () {
        this.levelsPool[0].push(function (gamefield) {
            var blocks = gamefield.blocks;
            var space = gamefield.space;
            var container = gamefield.containerLevelObjects;
            var block;

            block = LevelObjectsFactory.createBlock(80, 500, 0.00, "Block_Normal_1", false, space, container);
            blocks.push(block);
            block.userData.movementComponents.push(new LevelObjectWaypointMoveComponent(block,
                [{x: 80, y: 500}, {x: 400, y: 500}],
                3, 0, GeometrumEase.easeInQuad));
            block.userData.movementComponents.push(new LevelObjectAngularMoveComponent(block, 10));
            gamefield.blocksLeft = 1;
        });

        this.levelsPool[1].push(function (gamefield) {
            var blocks = gamefield.blocks;
            var space = gamefield.space;
            var container = gamefield.containerLevelObjects;
            var level = gamefield.level;

            for (var i = 0; i < level; i++) {
                blocks.push(LevelObjectsFactory.createBlock(100 + 100 * i, 550, Math.random() * 360, "Block_Normal_1", false, space, container));
                var moveComponent = new LevelObjectAngularMoveComponent(blocks[blocks.length - 1], Math.random() * 8);
                blocks[blocks.length - 1].userData.movementComponents.push(moveComponent);
            }
            gamefield.blocksLeft = level;
        });
    }
};

var ScheduledObjectBuilder = function () {
    this._objX = 0;
    this._objY = 0;
    this._objAngle = 0;
    this._spriteName = "";
    this._isStatic = true;
    this._velX = 0;
    this._velY = 0;

    this.x = function (value) {
        this._objX = value;
        return this;
    };

    this.y = function (value) {
        this._objY = value;
        return this;
    };

    this.angle = function (value) {
        this._objAngle = value;
        return this;
    };

    this.spriteName = function (value) {
        this._spriteName = value;
        return this;
    };

    this.isStatic = function (value) {
        this._isStatic = value;
        return this;
    };

    this.velX = function (value) {
        this._velX = value;
        return this;
    };

    this.velY = function (value) {
        this._velY = value;
        return this;
    };

    this.build = function () {
        return {
            objX: this._objX,
            objY: this._objY,
            objAngle: this._objAngle,
            spriteName: this._spriteName,
            isStatic: this._isStatic,
            velX: this._velX,
            velY: this._velY
        }
    }
};