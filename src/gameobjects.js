var LevelObject = function () {
    this.tag = "";
    this.hp = 1;
    this.score = 0;
    this.sprite = null;
    this.blockType = [BlockTypes.NORMAL];
    this.godModeTime = 0;
    this.nextSkins = [];
    this.body = null;

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
                    this.godModeTime = GameConstants.GOD_MOD_TIME_DEFAULT;
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
    }

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
    WALLS_WIDTH: 20,
    WALLS_ELASTICITY: 0.5,
    WALLS_FRICTION: 1,
    MOVABLE_BLOCK_MASS: 50,
    MAGNET_RADIUS: 200,

    TYPES_BY_SKIN: {
        Block_Normal_1: [BlockTypes.NORMAL]
    },

    BASE_SCORE_BY_SKIN: {
        Block_Normal_1: 1,
        Block_Tough_1_hp3: 3
    },

    NEXT_SKINS_BY_SKIN: {
        Block_Tough_1_hp3: ["Block_Tough_1_hp2", "Block_Tough_1_hp1"]
    },

    createBlock: function (blockX, blockY, angle, skin, space, container) {
        if (bodyDefs.hasOwnProperty(skin) == false) {
            throw new Error("Trying to create block with unknown skin");
        }

        var sprite = GameSpriteManager.getPhSprite(skin);
        var body = this.createStaticBody();
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
        userData.hp = userData.hasType(BlockTypes.TOUGH) ? 3 : 1;
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
