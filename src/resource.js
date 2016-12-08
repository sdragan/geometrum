var res = {
    spritesheet_png: "res/spritesheet.png",
    spritesheet_plist: "res/spritesheet.plist",
    physics_bodies_plist: "res/physics_bodies.plist",
    particles_plist: "res/particles.plist",
    sound_block_hit_01: "res/GP_Match_01.mp3",
    sound_block_hit_02: "res/GP_Match_02.mp3",
    sound_block_hit_03: "res/GP_Match_03.mp3",
    sound_block_hit_04: "res/GP_Match_04.mp3",
    sound_block_hit_05: "res/GP_Match_05.mp3"
};

var g_resources = [];
for (var i in res) {
    g_resources.push(res[i]);
}
