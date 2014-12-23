#! /usr/bin/env node

var http    = require('http');
var redis   = require('redis');
var concat  = require('concat-stream');
var client  = redis.createClient(6379, process.env.DOCKER_HOST_IP || 'localhost');
var server  = http.createServer();
var errors  = 0;

client.on('error', function(err) {
  console.log(err);
  if (++errors === 10) {
    process.exit(1);
  }
});

server.on('request', function(req, res) {
  if (req.method === 'GET') {
    client.get(req.path, function(err, value) {
      if (err) {
        res.statusCode = 500;
        res.end(err.message);
        return;
      }
      res.end(value);
    });
  } else {
    req.pipe(concat(function(list) {
      client.set(req.path, list.toString(), function(err) {
        if (err) {
          res.statusCode = 500;
          res.end(err.message);
          return;
        }
        res.statusCode = 204;
        res.end();
      })
    }));
  }
});

server.listen(3000);
