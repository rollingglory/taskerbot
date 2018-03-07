var express = require('express');
var packageInfo = require('./package.json');
var path = require('path');
var moment = require('moment');
var bodyParser = require('body-parser');

var index = require('./routes/index');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'taskerview'));
app.set('view engine', 'ejs');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);

var server = app.listen(process.env.PORT, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Web server started at http://%s:%s', host, port);
});

// Heroku Keep Alive Ping
var http = require('http'); //importing http
setInterval(function() {
    http.get('https://rollingtaskerbot.herokuapp.com', function(res) {
        if (res.statusCode !== 200) {
            console.log('Heroku Keep Alive Ping: Error - Status Code ' +
                res.statusCode);
        }
    }).on('error', function(err) {
        console.log('Heroku Keep Alive Ping: Error - ' + err.message);
    });
}, 20 * 60 * 1000); // load every 20 minutes


//get recaps

var moment = require('moment');
var mongoose = require('mongoose');
mongoose.Promise = global.Promise;

mongoose.connect(process.env.TASKERBOT_MONGO_CRED);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
  console.log("mongoose connected");
});
var User = require('./models/user.js');
var Project = require('./models/project.js');
var Log = require('./models/log.js');
var allowedOrigins = ["http://glyph.rollingglory.com", "http://localhost", "http://localhost:8080"];

app.get('/recap/:month-:year', function (req, res) {
  var origin = req.headers.origin;
  if(allowedOrigins.indexOf(origin) > -1){
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  var year = req.params.year;
  var month = req.params.month;

  var start = new Date(year, month - 1, 1, 0, 0, 0);
  var end = new Date(year, month - 1, 31, 23, 59, 59);

  var promise = Log.find({date : {$gte: start.getTime(), $lt: end.getTime()}}).sort({date: 1, userId: 1 , shift : 1}).populate('userId','alias').populate('projectId','code').exec()
    .then(function(logs) {
      result = {status:'success',logs:logs};
      res.json(result);
    }).catch(function(err) {
      result = {status:'failed'};
      res.json(result);
    })
})

app.get('/recap/:month-:year/user/:user', function (req, res) {
  var origin = req.headers.origin;
  if(allowedOrigins.indexOf(origin) > -1){
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  var year = req.params.year;
  var month = req.params.month;
  var user = req.params.user;

  var start = new Date(year, month - 1, 1, 0, 0, 0);
  var end = new Date(year, month - 1, 31, 23, 59, 59);

  var promise = Log.find({date : {$gte: start.getTime(), $lt: end.getTime()}, userId: user}).sort({date: 1, userId: 1 , shift : 1}).populate('userId','name alias').populate('projectId','code').exec()
    .then(function(logs) {
      result = {status:'success',user:logs[0].userId.name,logs:logs};
      res.json(result);
    }).catch(function(err) {
      result = {status:'failed'};
      res.json(result);
    })
})

app.get('/recap/:month-:year/project/:project', function (req, res) {
  var origin = req.headers.origin;
  if(allowedOrigins.indexOf(origin) > -1){
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  var year = req.params.year;
  var month = req.params.month;
  var project = req.params.project;

  var start = new Date(year, month - 1, 1, 0, 0, 0);
  var end = new Date(year, month - 1, 31, 23, 59, 59);

  var promise = Log.find({date : {$gte: start.getTime(), $lt: end.getTime()}, projectId: project}).sort({date: 1, shift : 1, userId: 1}).populate('userId','alias').populate('projectId','code name').exec(function(err,log){
      if (err) return handleError(err);
      log.forEach(function(){
        this.date = new Date(this.date).getDate();
      })
  })
    .then(function(logs) {
      result = {status:'success',project:logs[0].projectId.name,logs:logs};
      res.json(result);
    }).catch(function(err) {
      result = {status:'failed'};
      res.json(result);
    })
})

app.get('/users',function(req,res){
  var origin = req.headers.origin;
  if(allowedOrigins.indexOf(origin) > -1){
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  var promise = User.find({isActive : true}).select("alias").sort({ name: 1 }).exec()
    .then(function(users){
      result = {status:'success',users:users};
      res.json(result);
    }).catch(function(err){
      result = {status:'failed'};
      res.json(result);  
    });
})

app.get('/projects',function(req,res){
  var origin = req.headers.origin;
  if(allowedOrigins.indexOf(origin) > -1){
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  var promise = Project.find({isActive : true}).select("code name").sort({ name: 1 }).exec()
    .then(function(projects){
      result = {status:'success',projects:projects};
      res.json(result);
    }).catch(function(err){
      result = {status:'failed'};
      res.json(result);  
    });
})

app.post('/log', function(req, res){
  var origin = req.headers.origin;
  if(allowedOrigins.indexOf(origin) > -1){
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  var userId = req.body.user_id;
  var projectId = req.body.project_id;
  var date = req.body.date;
  var shift = req.body.shift;
  var content = req.body.content;
  
  date.trim().split('/').forEach(function (item, idx) {
    switch(idx) {
      case 0: day = item; break;
      case 1: month = item - 1; break;
      case 2: year = item; break;
    }
  });
  var now = new Date(year, month, day, 0, 0, 0, 0);
  var now_utc = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
  var d = moment(now_utc).add(7, 'hours').toDate();

  var newLog = new Log({ userId: userId, date: d.getTime(), shift: shift, projectId: projectId, content: content });
  newLog.save()
  .then(function(log) {
    if(log == null) {
      var message = "Log gagal disimpan. Coba lagi dalam beberapa saat.";
      res.send({ success: false, message: message });
    } else {
      var message = "Logging berhasil! Terima kasih ya!";
      res.send({ success: true, message: message });
    }
  }).catch(function(err) {
    console.log(err);
    var message = "Deskripsi gagal ditambahkan. Coba lagi dalam beberapa saat.";
    res.send({ success: false, message: message });
  });
});

app.post('/edit_log', function(req, res){
  var logId = req.body.log_id;
  var projectId = req.body.project_id;
  var content = req.body.content;

  var updatedData = { 
    projectId: projectId,
    content: content
  };
  var promise = Log.update(
    { _id: logId }, 
    { $set: updatedData }
  );
  promise.then(function(result) {
    if(result != null && result.ok == 1) {
      var message = "Log berhasil diubah";
      res.send({ success: true, message: message });
    } else {
      var message = "Log gagal diubah. Coba lagi dalam beberapa saat.";
      res.send({ success: false, message: message });
    }
  }).catch(function(err) {
    var message = "Log gagal diubah. Coba lagi dalam beberapa saat.";
    res.send({ success: false, message: message });
  });
});

app.post('/remove_log', function(req, res){
  var logId = req.body.log_id;
  var promise = Log.findOneAndRemove({ _id: logId }).exec();
  promise.then(function(log) {
    if(log == null) {
      var message = "Log tidak ditemukan";
      res.send({ success: false, message: message });
    } else {
      var message = "Log berhasil dihapus";
      res.send({ success: true, message: message });
    }
  });
});