var GameStateModel = {

    init: function () {

    }
};

var MathUtils = {

    radToDeg: function (rad) {
        return rad / (Math.PI / 180);
    },

    degToRad: function (deg) {
        return deg * (Math.PI / 180);
    }
};

var GameSpriteManager = {
    getSprite: function (spriteName) {
        return new cc.Sprite(this.getFrame(spriteName));
    },
    getPhSprite: function (spriteName) {
        return new cc.PhysicsSprite(this.getFrame(spriteName));
    },
    getFrame: function (spriteName) {
        var frame;
        frame = cc.spriteFrameCache.getSpriteFrame(spriteName);
        if (frame == null) {
            frame = cc.spriteFrameCache.getSpriteFrame(this.getMCTextureName(spriteName));
        }

        if (frame == null) {
            console.log("Couldn't find frame: " + spriteName);
        }

        return frame;
    },
    getMCTextureName: function (textureName) {
        return textureName + "0000"
    }
};

var GameSoundManager = {
    isSoundOn: true,
    cachedSounds: [],
    BLOCK_HIT_SOUND_MAX: 5,
    init: function () {
        /*
         for (var i = 1; i < 13; i++) {
         var str = i < 10 ? "0" + i.toString() : i <= 12 ? i.toString() : "12";
         this.playSound("sound_block_hit_" + str);
         }
         */
    },
    playSound: function (soundId) {
        if (!this.isSoundOn) {
            return;
        }
        // this.cacheSoundIfWasntPlayedBefore(soundId);
        cc.audioEngine.playEffect(res[soundId], false);
    },
    playBlockHitSound: function (blocksHitInRow) {
        var soundIndex = blocksHitInRow;
        if (blocksHitInRow > this.BLOCK_HIT_SOUND_MAX) {
            soundIndex = this.BLOCK_HIT_SOUND_MAX;
        }
        var str = soundIndex < 10 ? "0" + soundIndex.toString() : soundIndex.toString();
        this.playSound("sound_block_hit_" + str);
    },
    cacheSoundIfWasntPlayedBefore: function (soundId) {
        if (this.cachedSounds.indexOf(soundId) < 0) {
            cc.audioEngine.setEffectsVolume(0);
            this.cachedSounds.push(soundId);
        }
        else {
            cc.audioEngine.setEffectsVolume(1.0);
        }
    },
    toggleSoundOn: function () {
        this.isSoundOn = !this.isSoundOn;
        if (!this.isSoundOn) {
            this.stopMusic();
        }
    },
    getSoundOn: function () {
        return this.isSoundOn;
    },
    stopMusic: function () {

    },
    playMusic: function () {

    }
};

var GameParticleManager = {
    init: function () {

    }
};

var GameConstants = {
    APP_WIDTH: 480,
    APP_HEIGHT: 720,

    MAGNET_STRENGTH: 12,
    GOD_MODE_TIME_DEFAULT: 0.15,
    PADDLE_MAX_LENGTH: 150,
    PADDLE_MAX_Y: 700,
    INITIAL_BALL_X: 240,
    INITIAL_BALL_Y: -300,
    MIN_BALL_SPEED: 300,
    INITIAL_BALL_VEL_Y: -20,

    BLOCKS_DESTROYED_IN_ROW_FOR_HIGHLIGHT: 3,

    SPRITE_NAME_BALL: "NeuBall"
};