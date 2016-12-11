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

var GameData = {
    APP_WIDTH: 480,
    APP_HEIGHT: 720
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
    MAGNET_STRENGTH: 12,
    GOD_MOD_TIME: 0.15
};