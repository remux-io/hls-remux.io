/**
 *  ____  _____ __  __ _   ___  __  ___ ___
 * |  _ \| ____|  \/  | | | \ \/ / |_ _/ _ \
 * | |_) |  _| | |\/| | | | |\  /   | | | | |
 * |  _ <| |___| |  | | |_| |/  \ _ | | |_| |
 * |_| \_\_____|_|  |_|\___//_/\_(_)___\___/
 *
 *
 * "#EXTINF"
 * "#EXT-X-VERSION"
 * "#EXT-X-TARGETDURATION"
 * "#EXT-X-MEDIA-SEQUENCE"
 * "#EXT-X-ALLOW-CACHE"
 * "#EXT-X-BYTERANGE"
 * "#EXT-X-PLAYLIST-TYPE"
 * "#EXT-X-KEY"
 * "#EXT-X-MAP"
 * "#EXT-X-PROGRAM-DATE-TIME"
 * "#EXT-X-DATERANGE"
 * "#EXT-X-DISCONTINUITY-SEQUENCE"
 * "#EXT-X-SESSION-DATA"
 * "#EXT-X-SESSION-KEY"
 * "#EXT-X-START"
 * "#EXT-X-KEY:METHOD"
 * '#EXT-X-ENDLIST'
 *
 * '#EXTINF'
 *
 * "#EXT-X-STREAM-INF"
 * "#EXT-X-I-FRAME-STREAM-INF"
 * "#EXT-X-MEDIA"
 *
 **/





'use strict';

const async = require('async');
const events = require('events');
const path = require('path');

/**
 * @method chunk
 * @param {string} settings.location
 * @param {string} settings.name
 * @param {string} settings.duration
 * @param {string} settings.ctime
 */

const chunk_class = function(settings){
    var chunk = this;
    settings = settings || {}


    var chunk_obj = {
        'tag':'#EXTINF',
        'location':settings.location || '', //location will be different than original
        'name':settings.name || '',
        'duration':settings.duration || '',
        'ctime':settings.ctime || ''
    }

    /**
     * @method toJSON
     * @return {Object}
     */
    chunk.toJSON = function(){
        return JSON.stringify({
            'location':chunk_obj.location,
            'name':chunk_obj.name,
            'duration':chunk_obj.duration,
            'ctime':chunk_obj.ctime
        })
    }

    /**
     * @method toString
     * @return {string}
     */
    chunk.toString = function(){
        return chunk_obj.tag + ':'+ chunk_obj.duration + ',\n' + path.join(chunk_obj.location,chunk_obj.name)
    }


    /**
     * @prop {string} location
     * @prop {string} duration
     * @prop {string} ctime - create time
     * @prop {string} name
     */
    Object.defineProperties(chunk, {
        "location": {
            get: function() {
                return chunk_obj['location'];
            },
            set: function(newValue) {
                return chunk_obj['location'] = newValue || '';
            },
            enumerable: true,
            configurable: true
        },
        "duration": {
            get: function() {
                return chunk_obj['duration'];
            },
            set: function(newValue) {
                return chunk_obj['duration'] = (!isNaN(newValue)?parseFloat(newValue).toFixed(6):'2.000000') ;
            },
            enumerable: true,
            configurable: true
        },
        "ctime": {
            get: function() {
                return chunk_obj['ctime'];
            },
            set: function(newValue) {
                return chunk_obj['ctime'] = newValue ;
            },
            enumerable: true,
            configurable: true
        },
        "name": {
            get: function() {
                return chunk_obj['name'];
            },
            set: function(newValue) {
                return chunk_obj['name'] = newValue ;
            },
            enumerable: true,
            configurable: true
        }
    })
}




/**
 * playlist_class description
 * @method playlist
 * @return {Object}
 */


const playlist_class = function(){
    var playlist = this;
    var content_list = [];

    var playlist_obj = {
        'inf':{
            'tag':'#EXTM3U',
            'value':true
        },
        'version':{
            'tag':'#EXT-X-VERSION',
            'value':'3'
        },
        'targetDuration':{
            'tag':'#EXT-X-TARGETDURATION',
            'value':'2'
        },
        'cache':{
            'tag':'#EXT-X-ALLOW-CACHE',
            'value':'NO'
        },
        'sequance':{
            'tag':'#EXT-X-MEDIA-SEQUENCE',
            'value':'0'
        },
        'type':{
            'tag':'#EXT-X-PLAYLIST-TYPE',
            'value':'EVENT'
        },
        'content':{

        },
        'end':{
            'tag':'#EXT-X-ENDLIST',
            'value':false
        }
    };


    /**
     * @method add_chunk
     * @param {Object}  settings
     */
    playlist.add_chunk = function(settings){
        var new_chunk = null;

        try{
            new_chunk = (settings.constructor.name == 'chunk_class' ? settings : new chunk_class(settings) )
        }catch(e){
            return false;
        }
        content_list.push(new_chunk)
    }



    playlist.get_content_entry = function(positon){
        //content_list
        positon = positon || (content_list.length>0?content_list.length-1:0)
        return content_list[positon]
    }

    /**
     * @method toString
     * @return {string}
     */
    playlist.toString = function(){
        //content_list
        //playlist_obj

        var playlist_out = '';

        Object.keys(playlist_obj).forEach(function(tag, tagindex){

            if(playlist_obj[tag]['value'] && typeof playlist_obj[tag]['value'] === 'string'){
                playlist_out = (playlist_out==''?'':playlist_out+'\n') + playlist_obj[tag]['tag'] + ':' + playlist_obj[tag]['value'];
            }else if(playlist_obj[tag]['value'] === true){
                playlist_out =(playlist_out==''?'':playlist_out+'\n') + playlist_obj[tag]['tag'];
            }else if(tag === 'content'){
                // playlist_out = playlist_out+'\n';
                content_list.forEach(function(entry, entry_index){
                    playlist_out = (playlist_out==''?'':playlist_out+'\n') + '#EXTINF:'+ entry.duration + ',\n' + path.join(entry.location,entry.name)
                })
            }else{
                //nothing ....mabey
            }
        })

        return playlist_out;

    }

    /**
     * @prop {int} size
     * @prop {string} version
     * @prop {string} sequance
     * @prop {string} targetDuration
     * @prop {string} cache
     * @prop {string} type
     * @prop {string} end
     */
    Object.defineProperties(playlist, {
        "size": {
            get(){
                return content_list.length
            },
            enumerable: true,
            configurable: true
        },
        "version": {
            get: function() {
                return playlist_obj['version'].value;
            },
            set: function(newValue) {
                return playlist_obj['version'].value = (!isNaN(newValue) && [3,4].indexOf(newValue)>=0?playlist_obj['version'].value:playlist_obj['version'].value)
            },
            enumerable: true,
            configurable: true
        },
        "sequance": {
            get: function() {
                return playlist_obj['sequance'].value;
            },
            set: function(newValue) {
                return playlist_obj['sequance'].value = newValue
            },
            enumerable: true,
            configurable: true
        },
        "targetDuration": {
            get: function() {
                return parseInt(playlist_obj['targetDuration'].value).toFixed(0);
            },
            set: function(newValue) {
                return playlist_obj['targetDuration'].value = parseFloat(isNaN(newValue)?playlist_obj['targetDuration'].value:newValue).toFixed(0) ;
            },
            enumerable: true,
            configurable: true
        },
        "cache": {
            get: function() {
                return playlist_obj['cache'].value;
            },
            set: function(newValue) {
                return playlist_obj['cache'].value = newValue===true || newValue===!false;
            },
            enumerable: true,
            configurable: true
        },
        "type": {
            get: function() {
                return playlist_obj['type'].value;
            },
            set: function(newValue) {
                return playlist_obj['type'].value = ([false,'EVENT','VOD'].indexOf(newValue)>=0?newValue:false);
            },
            enumerable: true,
            configurable: true
        },
        "end": {
            get: function() {
                return playlist_obj['end'].value;
            },
            set: function(newValue) {
                return playlist_obj['end'].value = newValue===true || newValue===!false;
            },
            enumerable: true,
            configurable: true
        }
    })
}


/**
 * [variant_playlist_class description]
 * @method variant
 * @param  {Array}  settings
 */
const variant_playlist_class = function(settings){

    var playlist = this;
    var playlist_obj = [];

    settings.forEach(function(obj, index){
        playlist_obj.push({
            resolution: obj.resolution,
            bandwidth: obj.bandwidth,
            codecs: obj.codecs,
            default: obj.default,
            autoselect: obj.autoselect,
            id: '1',
            issue: obj.issue,
            playlist: obj.playlist,
            location_name_end: ( obj.prefix || obj.playlist ) + '.m3u8'
        })
    })


    playlist.toString = function(prefix){

        var playlist_txt = '#EXTM3U\n'
        playlist_obj.forEach(function(obj, index){
            playlist_txt = playlist_txt + '#EXT-X-STREAM-INF:PROGRAM-ID='+obj.id
                +',BANDWIDTH='+obj.bandwidth
                +',CODECS="'+obj.codecs
                +'",RESOLUTION='+obj.resolution+',NAME="'+obj.playlist
                +'",AUTOSELECT='+obj.autoselect
                +',DEFAULT='+obj.default+'\n';

            playlist_txt = playlist_txt + (prefix?path.join(prefix, obj.location_name_end):obj.location_name_end) +'\n'
        })
        return playlist_txt
    }

}



playlist_class.prototype.__proto__ = events.EventEmitter.prototype;
variant_playlist_class.prototype.__proto__ = events.EventEmitter.prototype;
chunk_class.prototype.__proto__ = events.EventEmitter.prototype;
module.exports.playlist = playlist_class
module.exports.variant = variant_playlist_class
module.exports.chunk = chunk_class
