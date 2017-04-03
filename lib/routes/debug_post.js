/**
*  ____  _____ __  __ _   ___  __  ___ ___
* |  _ \| ____|  \/  | | | \ \/ / |_ _/ _ \
* | |_) |  _| | |\/| | | | |\  /   | | | | |
* |  _ <| |___| |  | | |_| |/  \ _ | | |_| |
* |_| \_\_____|_|  |_|\___//_/\_(_)___\___/
*
**/


module.exports = function(express_service){


    var express_service = express_service;
    var express = require('express');
    var router = express.Router();




    router.post("/data", function(req, res){
        console.log('debug:data');
        express_service.emit('post:debug', req.rawBody)
        res.end('OK')
    })



    router.get("/list", function(req, res){
        res.end('debug list - ok')
    })


    return router;
}
