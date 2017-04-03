/**
*  ____  _____ __  __ _   ___  __  ___ ___
* |  _ \| ____|  \/  | | | \ \/ / |_ _/ _ \
* | |_) |  _| | |\/| | | | |\  /   | | | | |
* |  _ <| |___| |  | | |_| |/  \ _ | | |_| |
* |_| \_\_____|_|  |_|\___//_/\_(_)___\___/
*
**/

const path = require('path');

module.exports = function(m3u8_store){

    var express = require('express');
    var router = express.Router();
    var m3u8_store = m3u8_store;
    var sessions = {};



    /**
     *
     * TIME EVENT
     *
     */
        router.get("/:app/event/:issue/playlist.m3u8", function(req, res){
            m3u8_store.get_variant({'app':req.params.app, 'issue':req.params.issue}, function(err,result){
                var playlist = result.toString();
                res.writeHead(200, {'Content-Length': playlist.length,'Content-Type': 'application/vnd.apple.mpegurl'});
                res.end(playlist)
            })
        })


        router.get("/:app/event/:issue/:profile.m3u8", function(req, res){
            m3u8_store.get_playlist_by_time_issue(req.params, function(err,playlist){
                res.writeHead(200, {'Content-Length': playlist.length,'Content-Type': 'application/vnd.apple.mpegurl'});
                res.end(playlist)
            })
        })


        router.get("/:app/event/:issue/:profile/:chunk.ts", function(req, res){
            var filename = '/video/'+req.params.app+'/'
                +req.params.profile+'/'
                +req.params.chunk+'.ts'
            console.log(filename);
            res.setHeader('X-Accel-Redirect', filename);
            res.end();
        })



    /**
     *
     * LIVE
     *
     */
        router.get("/:app/live/playlist.m3u8", function(req, res){
            m3u8_store.get_live_issue({'app':req.params.app}, function(err, issue){
                if (err){
                    res.writeHead(404)
                    res.end()
                }else{
                    console.log(issue);
                    m3u8_store.get_variant({'app':req.params.app, 'issue':issue}, function(err,result){
                        var playlist = result.toString();
                        res.writeHead(200, {'Content-Length': playlist.length,'Content-Type': 'application/vnd.apple.mpegurl'});
                        res.end(playlist)
                    })
                }
            })
        })


        router.get("/:app/live/:profile.m3u8", function(req, res){
            m3u8_store.get_live_issue({'app':req.params.app}, function(err, issue){
                if (err){
                    res.writeHead(404)
                    res.end()
                }else{
                    var params = req.params
                    params.issue = issue

                    m3u8_store.get_playlist_by_issue(params, function(err,playlist){
                        res.writeHead(200, {'Content-Length': playlist.length,'Content-Type': 'application/vnd.apple.mpegurl'});
                        res.end(playlist)
                    })
                }
            })

        })


        router.get("/:app/live/:profile/:chunk.ts", function(req, res){
            var filename = '/video/'+req.params.app+'/'
                +req.params.profile+'/'
                +req.params.chunk+'.ts'
            console.log(filename);
            res.setHeader('X-Accel-Redirect', filename);
            res.end();
        })



    /**
     *
     * BY START - STOP TIME
     *
     */

    router.get("/:app/:start/:stop/playlist.m3u8", function(req, res){
        m3u8_store.get_variant({id:req.params.app}, function(err,result){
            var playlist = result.toString();
            res.writeHead(200, {'Content-Length': playlist.length,'Content-Type': 'application/vnd.apple.mpegurl'});
            res.end(playlist)
        })
    })


    router.get("/:app/:start/:stop/:profile.m3u8", function(req, res){
        m3u8_store.get_playlist_by_time(req.params, function(err,result){
            result.type=false;
            result.end=true
            var playlist = result.toString();
            res.writeHead(200, {'Content-Length': playlist.length,'Content-Type': 'application/vnd.apple.mpegurl'});
            res.end(playlist)
        })
    })


    router.get("/:app/:start/:stop/:profile/:chunk.ts", function(req, res){
        var filename = '/video/'+req.params.app+'/'
            +req.params.profile+'/'
            +req.params.chunk+'.ts'
        console.log(filename);
        res.setHeader('X-Accel-Redirect', filename);
        res.end();
    })





/**
 *
 * BY EPG
 *
 */
    router.get("/:app/:issue/playlist.m3u8", function(req, res){
        m3u8_store.get_variant({'app':req.params.app, 'issue':req.params.issue}, function(err,result){
            var playlist = result.toString();
            res.writeHead(200, {'Content-Length': playlist.length,'Content-Type': 'application/vnd.apple.mpegurl'});
            res.end(playlist)
        })
    })


    router.get("/:app/:issue/:profile.m3u8", function(req, res){
        m3u8_store.get_playlist_by_issue(req.params, function(err,playlist){
            res.writeHead(200, {'Content-Length': playlist.length,'Content-Type': 'application/vnd.apple.mpegurl'});
            res.end(playlist)
        })
    })


    router.get("/:app/:issue/:profile/:chunk.ts", function(req, res){
        var filename = '/video/'+req.params.app+'/'
            +req.params.profile+'/'
            +req.params.chunk+'.ts'
        console.log(filename);
        res.setHeader('X-Accel-Redirect', filename);
        res.end();
    })


/**
 *
 *
 * Pseudo timeshift
 *
 */

    router.get("/:app/playlist.m3u8", function(req, res){
        var session = req.query.session
        var start_time = req.query.start
        var timestamp = req.query.timestamp
        sessions[session] = req.query.start || (sessions[session]+2000) || (new Date().getTime()-6000)

    })


    router.get("/:app/:profile.m3u8", function(req, res){
        var app = req.params.app || '';
        var profile = req.params.profile;
        var session = req.query.session;
        var timestamp = req.query.timestamp || new Date().getTime();
        var timestart = req.query.timestart || new Date().getTime();

        timestamp = parseFloat(timestamp)
        timestart = parseFloat(timestart)

        sessions[session] = sessions[session] || {}

        //first time
        if (!sessions[session].timestamp){
            sessions[session].timestamp = timestamp
            sessions[session].timestart = timestart
            sessions[session].sequance = 1
            sessions[session].lastrequest = new Date().getTime()
        //not first time
        }else if(sessions[session].timestamp == timestamp){
            sessions[session].timestart = sessions[session].timestart + (new Date().getTime()-sessions[session].lastrequest)
            sessions[session].sequance = sessions[session].sequance + 1
            sessions[session].lastrequest = new Date().getTime()
        //seek change
        }else if(sessions[session].timestamp < timestamp){
            sessions[session].timestamp = timestamp
            sessions[session].timestart = timestart
            sessions[session].sequance = 1
            sessions[session].lastrequest = new Date().getTime()
        }

        m3u8_store.get_playlist_by_time({
            'app':app,
            'start':sessions[session].timestart,
            'profile':profile,
            'limit':3
        },function(err, playlist_content){
            playlist_content.sequance = sessions[session].sequance.toString()
            playlist_content.type = false

            res.writeHead(200, {'Content-Length': playlist_content.toString().length,'Content-Type': 'application/vnd.apple.mpegurl'});
            res.end(playlist_content.toString())
        })
    })


    router.get("/:app/:profile/:chunk.ts", function(req, res){
        var filename = '/video/'+req.params.app+'/'
            +req.params.profile+'/'
            +req.params.chunk+'.ts'
        console.log(filename);
        res.setHeader('X-Accel-Redirect', filename);
        res.end();
    })


    return router;

}
