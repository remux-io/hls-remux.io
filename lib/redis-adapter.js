/**
*  ____  _____ __  __ _   ___  __  ___ ___
* |  _ \| ____|  \/  | | | \ \/ / |_ _/ _ \
* | |_) |  _| | |\/| | | | |\  /   | | | | |
* |  _ <| |___| |  | | |_| |/  \ _ | | |_| |
* |_| \_\_____|_|  |_|\___//_/\_(_)___\___/
*
**/


'use strict';

const async = require('async');
const events = require('events');
const spawn = require('child_process').spawn;
const redis = require("redis");
const hls_playlist = require('./playlist');
const hls_application = require('./application');



var hls_adapter = function(settings){

    var adapter = this;

    var redis_client = null;
    var looper_publisher = null;

    adapter.settings = settings || {};
    adapter.settings.redis = adapter.settings.redis || {};
    adapter.settings.redis.host = adapter.settings.redis.host || '127.0.0.1';
    adapter.settings.redis.port = adapter.settings.redis.port || 6379;
    var prefix = adapter.settings.prefix || 'remux:app:';



    var looper_pub = function(data){
        looper_publisher.publish(
            prefix+data.context,
            JSON.stringify({
                'event':data.event,
                'data':data.data
            }))
    }


    adapter.emit_looper = function(app_name,event_name,data){
        looper_pub({
            'context':app_name,
            'event':event_name,
            'data':data
        })
    }


    adapter.connect = function(){
        redis_client = redis.createClient({
            "host":adapter.settings.redis.host,
            "port":adapter.settings.redis.port
        });

        looper_publisher = redis.createClient({
            "host":adapter.settings.redis.host,
            "port":adapter.settings.redis.port
        });


        redis_client.on("ready", function () {
            adapter.emit('redis:ready',redis_client)
        });

        redis_client.on("connect", function () {
            adapter.emit('redis:connect',redis_client)
        });

        redis_client.on("reconnecting", function () {
            adapter.emit('redis:reconnecting',redis_client)
        });

        redis_client.on("error", function (err) {
            adapter.emit('redis:error',err)
        });

        redis_client.on("warning", function (war) {
            adapter.emit('redis:warning',war)
        });

        redis_client.on("end", function () {
            adapter.emit('redis:end',redis_client)
        });
    }


    adapter.application_update = function(app, cb){
        var app_path = prefix + app.name;

        var keys = Object.keys(app);
        var red_obj = []
        keys.forEach(function(key){
            red_obj.push(key)
            red_obj.push(app[key])
        })

        redis_client.hmset(app_path, red_obj, function(err, res){

            looper_pub({
                'context':app.name,
                'event':'application_update',
                'data':null
            })

            if(cb) cb(err, res)
        })
    }



    adapter.add_chunk_2_issue = function(issue, data, cb){
        // console.log('add_chunk_2_issue!!!', data.chunk);
        var opts = data.options || {};
        opts.application = opts.application || '';
        opts.issue = opts.issue || '';
        opts.playlist = opts.playlist || '';

        var full_path = prefix+opts.application+':'+issue.stop+':'+opts.playlist;

        var keys = Object.keys(opts);
        var red_obj = []
        keys.forEach(function(key){
            red_obj.push(key)
            red_obj.push(opts[key])
        })

        var chunk = new hls_playlist.chunk(data.chunk)
        // console.log(chunk.toJSON())


        redis_client.hmset(full_path+':playlist', red_obj, function(err, res){
            redis_client.append(full_path+':content',chunk.toString()+'\n', function (err, res) {
                looper_pub({
                    'context':opts.application,
                    'event':'add_chunk_2_issue',
                    'data':JSON.parse(chunk.toJSON())
                })

                if(cb) cb(err, res)
            })
        })
    }



    adapter.set_playlist_settings = function(playlist, issue,cb){
        var settings = {
            'cache':'NO',
            'type':'EVENT',
            'sequance':(issue.sequance),
            'version':3,
            'total_duration':(issue.total_duration)
        }
        var full_path = prefix+issue.name+':'+issue.stop+':'+playlist
        redis_client.hmset(full_path+':playlist_settings', issue, function(err, res){
            cb(err,issue)
        })
    }



    adapter.update_sequance_dinamic_issue = function(issue,data, cb){

        var opts = data.options || {};
        opts.application = opts.application || '';
        opts.issue = opts.issue || '';
        opts.playlist = opts.playlist || '';

        var chunnk_duration_parser = /^.*\:([\d\.]*)/;
        var first_chunk_remover = /^.*\n.*\n/

        var full_path = prefix+issue.name+':'+issue.stop+':'+opts.playlist

        redis_client.get(full_path+':content', function(err, result){
            var duration = chunnk_duration_parser.exec(result)
            console.log('chunk_duration', duration);
            duration = parseFloat(duration[1])
            result = result.replace(first_chunk_remover, '')

            redis_client.set(full_path+':content', result, function(err, res){
                if (err){
                    cb(err,0)
                }else{
                    var settings = {
                        'cache':'NO',
                        'type':'EVENT',
                        'sequance':(issue.sequance+1),
                        'version':3,
                        'total_duration':(issue.total_duration - duration)
                    }
// console.log('settings', settings);
                    issue.sequance = settings.sequance
                    issue.total_duration = settings.total_duration

                    redis_client.hmset(full_path+':playlist_settings', settings, function(err, res){
                        cb(err,issue)
                    })
                }
            })
        })
    }


    adapter.create_issue = function(app, issue, cb){
        var app_path = prefix + app + ':' + issue.stop;

        var keys = Object.keys(issue);
        var red_obj = []

        keys.forEach(function(key){
            red_obj.push(key)
            red_obj.push(issue[key])
        })

        redis_client.hmset(app_path, red_obj, function(err, res){
            looper_pub({
                'context':app,
                'event':'create_issue',
                'data':issue
            })
            if(cb) cb(err, res)
        })
    }





    adapter.get_issue = function(app, end_time, cb){
        var app_path = prefix + app.name + ':' + issue.end;
        redis_client.hgetall(app_path,function(err, res){
            if(cb) cb(err,res)
        })
    }



    adapter.get_application = function(name, cb){
        var app_full_path = prefix + name;
        redis_client.hgetall(app_full_path, function(err, res){
            if (!err && res){
                var result = new hls_application({
                    'title':res.title,
                    'epg_id':res.epg_id
                }, adapter), multi
                cb(err, result)
            }else{
                cb(err, res)
            }
        })
    }


    adapter.add_chunk = function(opts, chunk, cb){
        var opts = opts || {};
        opts.application = opts.application || '';
        opts.issue = opts.issue || '';
        opts.playlist = opts.playlist || '';

        var full_path = prefix+opts.application+':'+opts.issue+':'+opts.playlist;

        var keys = Object.keys(opts);
        var red_obj = []
        keys.forEach(function(key){
            red_obj.push(key)
            red_obj.push(opts[key])
        })

        redis_client.hmset(full_path+':playlist', red_obj, function(err, res){
            var redis_data_m3u8 = [];

            redis_data_m3u8.push(full_path+':content')
            redis_data_m3u8.push(chunk.ctime)
            var chunk_data = {
                'location':chunk.location,
                'name':chunk.name,
                'duration':chunk.duration
            }
            redis_data_m3u8.push(JSON.stringify(chunk_data))

            redis_client.zadd(redis_data_m3u8, function (err, res) {

                looper_pub({
                    'context':opts.application,
                    'event':'add_chunk',
                    'data':{
                        'chunk':JSON.parse(chunk.toJSON()),
                        'options':opts
                    }
                })

                if(cb) cb(err, res)
            })

        })

    }


    adapter.get_variant = function(opts,cb){
        var opts = opts || {};
        opts.app = opts.app || '0x150';
        opts.issue = opts.issue || 'default';

        var key_query = 'remux:app:'+opts.app+':'+opts.issue+':*:playlist'
        var redis_query = []

        redis_client.keys(key_query, function(err,keys){
            if(cb && err) cb(err, replies)

            keys.forEach(function(key){
                redis_query.push(['hgetall', key])
            })

            redis_client.multi(redis_query)
            .exec(function (err, replies) {
                var pl = new hls_playlist.variant(replies)
                if(cb) cb(err, pl)
            });
        })
    }


    adapter.get_playlist_by_time_issue = function(opts,cb){
        var opts = opts;
        opts.app = opts.app || '';
        opts.issue = opts.issue || '';
        opts.profile = opts.profile || '';

        var full_path = 'remux:app:'+opts.app+':'+opts.issue+':'+opts.profile

        redis_client.hgetall(full_path+':playlist_settings', function(err, playlist_settings){

            if( err || !playlist_settings ){
                if (cb) cb(err, null)
            }else{
                redis_client.get(full_path+':content', function(err, result){
                    var tmp_playlist = new hls_playlist.playlist()
                    tmp_playlist.type = playlist_settings.type;
                    tmp_playlist.cache = playlist_settings.cache;
                    tmp_playlist.end=false;
                    tmp_playlist.targetDuration=2
                    tmp_playlist.sequance=playlist_settings.sequance
                    tmp_playlist.version=playlist_settings.version

                    if (cb) cb(err, tmp_playlist.toString() + '\n' + (result?result:''))
                })
            }

        })

    }


    adapter.get_playlist_by_issue = function(opts,cb){
        var opts = opts;
        opts.app = opts.app || '';
        opts.issue = opts.issue || '';
        opts.profile = opts.profile || '';

        var full_path = 'remux:app:'+opts.app+':'+opts.issue+':'+opts.profile+':content'

        redis_client.get(full_path, function(err, result){

            var tmp_playlist = new hls_playlist.playlist()
            tmp_playlist.type = 'EVENT';
            tmp_playlist.cache = 'NO';
            tmp_playlist.end=false;
            tmp_playlist.targetDuration=2
            tmp_playlist.sequance=0

            if (cb) cb(err, tmp_playlist.toString() + '\n' + result)

        })

    }



//last issue
    adapter.get_live_issue = function(opts,cb){
        var opts = opts;
        opts.app = opts.app || '';

        var search_key = prefix+opts.app+':*[0-9]'

        redis_client.keys(search_key, function(err, issue_keys){
            if (err){
                return cb(err,null)
            }else{
                try{

                    var issues = issue_keys.map(function(iss_obj){
                        return parseFloat(iss_obj.split(':')[3])
                    })

                    var issues_sorted = issues.sort(function(a,b){
                        return (a < b)
                    })

                    return cb(err,issues_sorted[0])
                }catch(e){
                    try{
                        return cb(err,issue_keys.split(':')[3])
                    }catch(e){
                        return cb(e,null)
                    }
                }
            }
        })


    }



    adapter.get_playlist_by_time = function(opts,cb){
        var opts = opts;
        opts.app = opts.app || '';
        opts.start = opts.start || 0;
        opts.stop = opts.stop || '+inf';
        opts.profile = opts.profile || '';
        opts.limit = opts.limit || -1;

        var full_path = 'remux:app:'+opts.app+':default:'+opts.profile+':content'
        var redis_request_settings = [full_path, opts.start, opts.stop, "LIMIT", 0, opts.limit]

        redis_client.zrangebyscore(redis_request_settings, function (err, response) {
            if (!err && response){
                var tmp_playlist = new hls_playlist.playlist()
                response.forEach(function (chunk_data) {
                    var chunk = new hls_playlist.chunk(JSON.parse(chunk_data))
                    chunk.location = opts.profile;
                    tmp_playlist.targetDuration = (parseFloat(tmp_playlist.targetDuration)<parseFloat(chunk.duration)?parseFloat(chunk.duration).toFixed(6):parseFloat(tmp_playlist.targetDuration).toFixed(6))
                    tmp_playlist.add_chunk(chunk)
                })
                tmp_playlist.cache = 'NO';
                tmp_playlist.type = 'EVENT';
                tmp_playlist.end=false;
                if(cb) cb(err, tmp_playlist)
            }else{
                if(cb) cb(err, response)
            }
        })
    }



}







var looper_subscriber = function(settings){

    var looper_sub = this;

    looper_sub.settings = settings || {};
    looper_sub.settings.redis = looper_sub.settings.redis || {};
    looper_sub.settings.redis.host = looper_sub.settings.redis.host || '127.0.0.1';
    looper_sub.settings.redis.port = looper_sub.settings.redis.port || 6379;
    var prefix = looper_sub.settings.prefix || 'remux:app:';
    var client_looper = null;


    looper_sub.subscribe = function(app){

        client_looper = redis.createClient({
            "host":looper_sub.settings.redis.host,
            "port":looper_sub.settings.redis.port
        });


        client_looper.on("subscribe", function (channel, count) {

        })


        client_looper.on("message", function (channel, data) {
            try{
                var context = JSON.parse(data);
                if(context.event && context.data){
                    looper_sub.emit(context.event, context.data)
                }
            }catch(e){}


        })

        client_looper.subscribe(prefix+app);
    }



}


hls_adapter.prototype.__proto__ = events.EventEmitter.prototype;
looper_subscriber.prototype.__proto__ = events.EventEmitter.prototype;
module.exports = hls_adapter
module.exports.looper_subscriber = looper_subscriber
