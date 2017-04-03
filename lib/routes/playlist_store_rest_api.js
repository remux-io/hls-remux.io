/**
*  ____  _____ __  __ _   ___  __  ___ ___
* |  _ \| ____|  \/  | | | \ \/ / |_ _/ _ \
* | |_) |  _| | |\/| | | | |\  /   | | | | |
* |  _ <| |___| |  | | |_| |/  \ _ | | |_| |
* |_| \_\_____|_|  |_|\___//_/\_(_)___\___/
*
**/


module.exports = function(m3u8_store){


    var express_service = express_service;
    var express = require('express');
    var router = express.Router();


    router.get("list", function(req, res){
        /**
         * registrirani playlisti /kanali/
         * status (activni neactivni)
         * last update
         * after (5 * last chunk time duration) = not active chanel;
         */

        try{
            var state = playlist_store.getState();
            res.status(200).end(JSON.stringify(state))
        }cache(e){
            res.status(400).end(JSON.stringify({error:'playlist not found'}))
        }

    })


    router.get("/:id/:playlist", function(req, res){        //variant
            // var m3u8 = playlist_store.get_playlist(playlist_params)
        res.end("request for Variant playlist - comming soon.")
    })


    router.get("/:app_name/:profile/:playlist", function(req, res){

        var playlist_settings = {
            'application':req.params.app_name,
            'profile':req.params.profile,
        }

        var m3u8 = playlist_store.get_playlist(playlist_params, false)
        if (m3u8){
            res.set('Content-Type', 'application/x-mpegURL');
            res.status(200).end(m3u8.toString())
        }else{
            res.set('Content-Type', 'application/json');
            res.status(400).end(JSON.stringify({error:'playlist not found'}))
        }
    })

    return router;
}
