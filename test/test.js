'use strict';

const {
    remux_http_service,
    hls_playlist,
    hls_chunk,
    hls_adapter,
    hls_application
} = require('../')

var playlist_store = new hls_adapter()
playlist_store.connect()

var time_start = 1488410853859

// setInterval(function(){
//     time_start = time_start+2099
//     playlist_store.get_playlist_by_time({
//         'app':'0x150',
//         'start':time_start,
//         'profile':'HI',
//         'limit':3
//     },function(err, playlist_content){
//         if(err){
//             console.log(err);
//         }else{
//             console.log(playlist_content.toString());
//         }
//     })
// },2000)


playlist_store.get_playlist_by_time({
    'app':'0x150',
    'start':time_start,
    'profile':'HI',
    'limit':3
},function(err, playlist_content){
    if(err){
        console.log(err);
    }else{
        console.log(playlist_content.get_content_entry());
    }
})

// console.log(playlist_store);
