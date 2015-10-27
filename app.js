var fs = require('fs');
var http = require('http');
var https = require('https');
var querystring = require('querystring');
var index = fs.readFileSync(__dirname + '/index.html');
var sessions = {};
var server = http.createServer(handler);
var env = require('env2')('./config.env');




function handler(req, res) {
  var urlArray = req.url.split('/');
  console.log(req.url);

  if (req.method === "GET" && req.url === '/') {
    var redirect = "https://github.com/login/oauth/authorize";
    var idStr = "?client_id=" + process.env.clientID;
    //in redirecte uri in your site add /auth/?code= then the code
    res.writeHead(302, {
      "Location": redirect + idStr
    });
    res.end(index);
  } else if (req.url.match(/^(\/auth\/)/)) {
    console.log('this is authorisation');
    getToken(urlArray[2].split('=')[1], function(data) {
      // TODO: check for conflict
      setToken(data, res, getUserData);
    });
  } else if(req.url.match(/^(\/makepost\/)/)){
    var title = urlArray[2];
    var comment = urlArray[3];
    var issueBody = ''





    var issueData = querystring.stringify({
      "title":title,
      "body":comment
    });

    //console.log('---- ',issueData);
    console.log('>>>>>>>>>>>>>>',sessions.token);

    var options = {
      hostname: 'api.github.com',
      path: '/repos/sohilpandya/katasohil/issues',
      method: 'POST',
      headers:{
        'Authorization': 'token '+sessions.token,
        'User-Agent': 'Mozilla/5.0 (iPad; U; CPU OS 3_2_1 like Mac OS X; en-us) AppleWebKit/531.21.10 (KHTML, like Gecko) Mobile/7B405'
      }
    }

    var requestaddIssue  = https.request(options, function(responseFromIssues){
      responseFromIssues.setEncoding('utf8');
      responseFromIssues.on('data', function(chunk){
        console.log('>>>>chunk>>>>>',chunk);
        issueBody += chunk;
      });
      responseFromIssues.on('end',function(){
        console.log("no more data");
      });
      console.log('>>>>>>issue dat<<<<<<<<',issueBody);


    });



    requestaddIssue.write(issueData);
    requestaddIssue.end();

  } else {
    fs.readFile(__dirname + req.url, function(err, file) {
      if (err) {
        res.writeHead(404, {
          "Content-Type": "text/" + ext
        });
        console.log('error:' + err);
        res.end();
      } else {
        var ext = req.url.split('.')[1];
        res.writeHead(200, {
          "Content-Type": "text/" + ext
        });
        res.end(file);
      }
    });
  }
}

function setToken(gitToken, res, callback) {

  var cookie = Math.floor(Math.random() * 100000000);
  var access_token = gitToken.split('=')[1].split('&')[0];
  sessions[cookie] = access_token;
  sessions.token = access_token;
  res.writeHead(200, {
    "Set-Cookie": 'access=' + cookie
  });
  callback();
  res.end(index);

  // var token = jwt.encode({
  //   iss: 7
  // });
}

var getUserData = function() {

  var optionsuser = {
    hostname: 'api.github.com',
    path: '/user?access_token=' + sessions.token,
    method: 'GET'
  };
  var body = '';
  var userReq = https.request(optionsuser, function(res) {
    res.on('data', function(chunk) {
      body += chunk;
    });
    res.on('end', function() {
      console.log(body);
      var username = JSON.parse(body);
      var name = username.login;
      sessions.gituser = name;
      console.log(name, sessions);

    });
  });
  userReq.setHeader('User-Agent', 'KataSohil');
  userReq.end();

};


var getToken = function(code, callback) {
  console.log('gitHub code: \"' + code + "\"");
  var postData = querystring.stringify({
    client_id: process.env.clientID,
    client_secret: process.env.clientSecret,
    code: code
  });

  var options = {
    hostname: 'github.com',
    path: '/login/oauth/access_token',
    method: 'POST'
  };

  var req = https.request(options, function(res) {
    console.log('github return statusCode: ' + res.statusCode);
    var body = '';
    res.on('data', function(chunk) {
      body += chunk;
    });
    res.on('end', function() {
      // var access_token = ;
      // function setCookie() {
      //   var rnd = Math.floor(Math.random() * 100000000);
      //   if (!sessions[rnd]) sessions[rnd] = access_token;
      //   else setCookie();
      // }
      callback(body);
    });
  });
  req.end(postData);
};

server.listen(8000);
console.log("listening on 8000")



module.exports = handler;
