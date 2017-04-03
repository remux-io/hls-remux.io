/**
 *  ____  _____ __  __ _   ___  __  ___ ___
 * |  _ \| ____|  \/  | | | \ \/ / |_ _/ _ \
 * | |_) |  _| | |\/| | | | |\  /   | | | | |
 * |  _ <| |___| |  | | |_| |/  \ _ | | |_| |
 * |_| \_\_____|_|  |_|\___//_/\_(_)___\___/
 *
 *
 **/

/**
 * @module remux-hls/application
 */


'use strict';

const async = require('async');
const events = require('events');

/**
 * remux-hls application
 * @function
 * @param {string} settings.name - channel name
 * @param {string} settings.title - channel title
 * @param {string} settings.epg_id - channel epg id
 * @param {Object} adapter - adapter to store hls index
 */

const application = function(settings, adapter){

    var app = this;
    var app_obj = settings || {};
    app_obj.name = app_obj.name || '';
    app_obj.title = app_obj.title || '';
    app_obj.epg_id = app_obj.epg_id || '';
    var adapter = adapter || null;


    /**
     * @method save
     * @param  {Function} callback
     */
    app.save = function(cb){
        if(adapter){
            try{
                adapter.application_update(app_obj,function(err,result){
                    if(cb) cb(err,result)
                })
            }catch(e){
                console.log(e);
            }
        }
    }


    app.createIssue = function(start, end, epg, tumblr, cb){
        var opts = opts || {};
        opts.name = opts.name || '';
        opts.epg = opts.epg || '';
        opts.tumblr = opts.tumblr || '';
        opts.start = opts.start || '';
        opts.end = opts.end || '';

        if(adapter){
            try{
                adapter.createIssue(app_obj,opts,function(err,result){
                    if(cb) cb(err,result)
                })
            }catch(e){
                console.log(e);
            }
        }
    }



    app.findIssue = function(opts){

    }



    app.getAllIssues = function(){

    }



    app.update = function(){

    }


    
    Object.defineProperties(application, {
        "name": {
            get: function() {
                return app_obj['name'];
            },
            set: function(newValue) {
                return app_obj['name'] = newValue || '';
                app.update()
            },
            enumerable: true,
            configurable: true
        },
        "epg_id": {
            get: function() {
                return app_obj['epg_id'];
            },
            set: function(newValue) {
                return app_obj['epg_id'] = newValue || '';
                app.update()
            },
            enumerable: true,
            configurable: true
        }
    })

}





application.prototype.__proto__ = events.EventEmitter.prototype;
module.exports = application
