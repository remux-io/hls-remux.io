/**
*  ____  _____ __  __ _   ___  __  ___ ___
* |  _ \| ____|  \/  | | | \ \/ / |_ _/ _ \
* | |_) |  _| | |\/| | | | |\  /   | | | | |
* |  _ <| |___| |  | | |_| |/  \ _ | | |_| |
* |_| \_\_____|_|  |_|\___//_/\_(_)___\___/
*
**/


module.exports = function(express_service){

console.log(express_service)

    var express_service = express_service;
    var express = require('express');
    var router = express.Router();
    var remux_hls_parser = require('hls-parser-remux.io')

    var hls = new remux_hls_parser()



    router.get("/:app_name/:profile/playlist.m3u8", function(req, res){
        res.end("result...")
    })




    /*
     *
     * query ->
     *      id,
     *      name,
     *      resolution,
     *      defult,
     *      autoselect,
     *      codec,
     *      bandwidth
     *
     *      ?? channel_id
     *      ?? epg_id
     *      app_name ==? channel_id
     *
     */
    router.post("/:app_name/:profile/playlist.m3u8", function(req, res){

        var tags = hls.parse(req.rawBody)

        var playlist_settings = {
            'application':req.params.app_name,
            'profile':req.params.profile,
        }

        playlist_settings.resolution = req.query.resolution || null;
        playlist_settings.bandwidth = req.query.bandwidth || null;
        playlist_settings.codecs = req.query.codecs || 'avc1.77.30, mp4a.40.2';
        playlist_settings.id = req.query.id || 1;
        playlist_settings.default = req.query.default || 'NO';
        playlist_settings.autoselect = req.query.autoselect || 'YES';

        express_service.emit('post:playlist', playlist_settings, tags)

        res.sendStatus(200)
    })


    return router;
}
