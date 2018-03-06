var moment = require('moment');
var mongoose = require('mongoose');
mongoose.Promise = global.Promise;

mongoose.connect(process.env.TASKERBOT_MONGO_CRED);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
  console.log("mongoose connected");
  
});

var TOKEN = process.env.TASKERBOT_BOT_TOKEN;
var ID_GROUP_COASTER = process.env.TASKERBOT_GROUP_ID;
var ID_BOT = process.env.TASKERBOT_BOT_ID;

var User = require('./models/user.js');
var Project = require('./models/project.js');
var Log = require('./models/log.js');

var Bot = require('node-telegram-bot-api'),
    bot = new Bot(TOKEN, { polling: true });

console.log('bot server started...');

setInterval(function() {
  var now = new Date();
  var now_utc = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
  var d = moment(now_utc).add(7, 'hours');
  var hour = d.hour();
  var minute = d.minute();
  var shift = 1;
  console.log(hour, minute);
  if ((hour == 12 || hour == 14 || hour == 16 || hour == 18) && (minute >= 0 && minute <= 30)) {
    switch (hour) {
      case 12: shift = 1; break;
      case 14: shift = 2; break;
      case 16: shift = 3; break;
      case 18: shift = 4; break;
    }
    d = d.toDate();
    d.setHours(0);d.setMinutes(0);d.setSeconds(0);d.setMilliseconds(0);
    blastReminder(shift, d);
  }
}, 20 * 60000); // load every 20 minutes

var STATUS_IDLE = 0;
var STATUS_ADD_PROJECT = 1;
var STATUS_REMOVE_PROJECT = 2;
var STATUS_EDIT_PROJECT = 5;
var STATUS_SUBMIT_EDIT_PROJECT = 6;
var STATUS_LOG_PROJECT = 3;
var STATUS_LOG_DESC = 4;
var STATUS_LOG_EXIST = 7;
var STATUS_LOG_EDIT = 8;
var STATUS_LOG_EDIT_DESC = 9;
var statusMap = [];
var projectMap = [];
var logMap = [];


// === HELP - command untuk help === //
bot.onText(/^\/help$/, function (msg, match) {
  sendHelp(msg.chat.id, false);
});
bot.onText(/^\/help@rollingtaskerbot$/, function (msg, match) {
  sendHelp(msg.chat.id, true);
});
function sendHelp(chatId, isGroup) {
  var message = "command yang ada : \n";
  message += "- /join" + (isGroup ? "@rollingtaskerbot" : "") + " bergabung ke dalam coaster tasker\n";
  message += "- /add_project" + (isGroup ? "@rollingtaskerbot" : "") + " tambah project baru (hanya admin)\n";
  message += "- /edit_project" + (isGroup ? "@rollingtaskerbot" : "") + " edit project (hanya admin)\n";
  message += "- /remove_project" + (isGroup ? "@rollingtaskerbot" : "") + " hapus project (hanya admin)\n";
  message += "- /list_project" + (isGroup ? "@rollingtaskerbot" : "") + " lihat daftar project\n";
  message += "- /log_reminder" + (isGroup ? "@rollingtaskerbot" : "") + " ingatkan coaster untuk mengisi log (hanya admin)\n";
  message += "- /log" + (isGroup ? "@rollingtaskerbot" : "") + " isi log\n";
  message += "- /log_recap" + (isGroup ? "@rollingtaskerbot" : "") + " melihat hasil log (hanya admin)\n";
  bot.sendMessage(chatId, message);
}
// === END HELP === //


// === LOG RECAP - command log_recap === //
bot.onText(/^\/log_recap$/, function (msg, match) {
  if(!checkGroup(msg)) return;
  handleWrongCommand(
    msg, 
    "Format salah. Ketik 'log_recap<spasi>[tanggal]<spasi>[bulan (opsional)]<spasi>[tahun (opsional)]' untuk melakukan logging.", 
    "Pengambilan data log gagal. Coba lagi dalam beberapa saat.", 
    false,
    "recap"
  );
});
bot.onText(/^\/log_recap@rollingtaskerbot$/, function (msg, match) {
  if(!checkGroup(msg)) return;
  handleWrongCommand(
    msg, 
    "Format salah. Ketik 'log_recap<spasi>[tanggal]<spasi>[bulan (opsional)]<spasi>[tahun (opsional)]' untuk melakukan logging.", 
    "Pengambilan data log gagal. Coba lagi dalam beberapa saat.", 
    false,
    "recap"
  );
});
bot.onText(/^\/log_recap((\s+\d+)+)$/, function (msg, match) {
  recap(msg, match); 
});
bot.onText(/^\/log_recap@rollingtaskerbot((\s+\d+)+)$/, function (msg, match) {
  recap(msg, match);
});
function recap(msg, match) {
  if(!checkGroup(msg)) return;
  var errorMessage = "Pengambilan data log gagal. Coba lagi dalam beberapa saat.";
  checkPrivilege(msg, errorMessage, function(usr) {
    if(match.length < 2) {
      var message = "Format salah. Ketik 'log_recap<spasi>[tanggal]<spasi>[bulan (opsional)]<spasi>[tahun (opsional)]' untuk melihat hasil logging.";
      bot.sendMessage(msg.from.id, message);  
    } else {
      var now = new Date(); 
      var now_utc = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
      var d = moment(now_utc).add(7, 'hours').toDate();
      var day = d.getDate(),
          month = d.getMonth(),
          year = d.getFullYear();
      match[1].trim().split(/\s+/).forEach(function (item, idx) {
        switch(idx) {
          case 0: day = item; break;
          case 1: month = item - 1; break;
          case 2: year = item; break;
        }
      });
      var date = new Date(year, month, day, 0, 0, 0, 0);
      var end = new Date(year, month, day, 23, 59, 59, 0);
      getRecap(msg, date, end);
    }
  });
}
function getRecap(msg, date, end) {
  var promise = Log.find({date : {$gte: date.getTime(), $lt: end.getTime()}})
    .sort({ shift : 1, userId: 1 }).populate('userId').populate('projectId').exec();
  promise.then(function(logs) {
    var message = "berikut log untuk tanggal " + date.getDate() + "-" + (date.getMonth()+1) + "-" + date.getFullYear() + ":\n";
    logs.forEach(function (log) {
      message += log.shift + ";" + log.userId.name + ";" + log.projectId.code + ";" + log.content + "\n";
    });
    bot.sendMessage(msg.from.id, message);
  }).catch(function(err) {
    var message = "Logging gagal ditampilkan. Coba lagi dalam beberapa saat.";
    bot.sendMessage(msg.from.id, message);
  });
}
// === END RECAP === //


// === LOG - command log === //
bot.onText(/^\/log$/, function (msg, match) {
  if(!checkGroup(msg)) return;
  handleWrongCommand(
    msg, 
    "Format salah. Ketik 'log<spasi>[shift]<spasi>[tanggal]<spasi>[bulan (opsional)]<spasi>[tahun (opsional)]' untuk melakukan logging.", 
    "Logging gagal ditambahkan. Coba lagi dalam beberapa saat.", 
    false,
    "log"
  );
});
bot.onText(/^\/log@rollingtaskerbot$/, function (msg, match) {
  if(!checkGroup(msg)) return;
  handleWrongCommand(
    msg, 
    "Format salah. Ketik 'log<spasi>[shift]<spasi>[tanggal]<spasi>[bulan (opsional)]<spasi>[tahun (opsional)]' untuk melakukan logging.", 
    "Logging gagal ditambahkan. Coba lagi dalam beberapa saat.", 
    false,
    "log"
  );
});
bot.onText(/^\/log((\s+\d+)+)$/, function (msg, match) {
  log(msg, match); 
});
bot.onText(/^\/log@rollingtaskerbot((\s+\d+)+)$/, function (msg, match) {
  log(msg, match);
});
function log(msg, match) {
  if(!checkGroup(msg)) return;
  var user = msg.from;
  var errorMessage = "Logging gagal ditambahkan. Coba lagi dalam beberapa saat.";
  checkPrivilege(msg, errorMessage, function(usr) {
    if(match.length < 2) {
      var message = "Format salah. Ketik 'log<spasi>[shift]<spasi>[tanggal]<spasi>[bulan (opsional)]<spasi>[tahun (opsional)]' untuk melakukan logging.";
      bot.sendMessage(msg.chat.id, message);  
    } else {
      var _usr = usr;
      var shift = 1;
      var now = new Date(); 
      var now_utc = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
      var d = moment(now_utc).add(7, 'hours').toDate();
      var day = d.getDate(),
          month = d.getMonth(),
          year = d.getFullYear();
      match[1].trim().split(/\s+/).forEach(function (item, idx) {
        switch(idx) {
          case 0: shift = item; break;
          case 1: day = item; break;
          case 2: month = item - 1; break;
          case 3: year = item; break;
        }
      });
      var _date = new Date(year, month, day, 0, 0, 0, 0);
      var end = new Date(year, month, day, 23, 59, 59, 0);
      var promise = Log.findOne({date : {$gte: _date.getTime(), $lt: end.getTime()}, shift: shift, userId: _usr.id}).exec();
      promise.then(function(log) {
        if(log) {
          var message = "Kamu sudah logging untuk slot ini. Pilih edit untuk mengubah, delete untuk menghapus, atau cancel untuk membatalkan";
          var keyboardButton = [[{text: 'Edit'}], [{text: 'Delete'}], [{text: 'Cancel'}]];
          var options = {
            reply_markup: {
              keyboard: keyboardButton,
              resize_keyboard: true,
              one_time_keyboard: true
            }
          };
          log.existing = true;
          logMap[user.id] = log;
          statusMap[user.id] = STATUS_LOG_EXIST;
          bot.sendMessage(user.id, message, options);
        } else {
          logMap[user.id] = new Log({
            userId: _usr.id,
            date: _date.getTime(),
            shift: shift
          });
          statusMap[user.id] = STATUS_LOG_PROJECT;
          chooseProject(
            user.id, 
            "Project apa yang kamu kerjakan pada slot ke-" + logMap[user.id].shift + " tanggal " + (new Date(logMap[user.id].date)).getDate() + "?", 
            "Logging gagal ditambahkan. Coba lagi dalam beberapa saat."
          );
        }
      }).catch(function(err) {
        console.log(err);
        var message = "Logging gagal ditambahkan. Coba lagi dalam beberapa saat.";
        bot.sendMessage(msg.chat.id, message);
      });
    }
  });
}
function logProject(msg) {
  var promise = Project.findOne({code: msg.text}).exec();
  promise.then(function(project) {
    if(project == null) {
      var message = "Project dengan kode [" + msg.text + "] tidak terdaftar. Periksa kembali kode project yang kamu masukkan.";
      bot.sendMessage(msg.from.id, message);
    } else {
      var message = "Tuliskan deskripsi singkat apa yang kamu kerjakan.";
      bot.sendMessage(msg.from.id, message).then(function () {
        statusMap[msg.from.id] = STATUS_LOG_DESC;
        projectMap[msg.from.id] = project;
      }); 
    }
  }).catch(function (err) {
    var message = "Data project gagal disimpan. Coba lagi dalam beberapa saat.";
    bot.sendMessage(msg.from.id, message);
  });
}
function logDesc(msg) {
  var promise = User.findOne({telegramId: msg.from.id}).exec();
  promise.then(function(usr) {
    if(usr != null) {
      var newLog = logMap[usr.telegramId];
      newLog.projectId = projectMap[msg.from.id].id;
      newLog.content = msg.text;
      return newLog.save();
    }
  }).then(function(log) {
    if(log == null) {
      var message = "Log gagal disimpan. Coba lagi dalam beberapa saat.";
      bot.sendMessage(msg.from.id, message);
    } else {
      var message = "Logging berhasil! Terima kasih ya!";
      bot.sendMessage(msg.from.id, message).then(function() {
        statusMap[msg.from.id] = STATUS_IDLE;
        projectMap[msg.from.id] = null;
        logMap[msg.from.id] = null;
      });
    }
  }).catch(function(err) {
    console.log(err);
    var message = "Deskripsi gagal ditambahkan. Coba lagi dalam beberapa saat.";
    bot.sendMessage(msg.from.id, message);
  });
}
function logExist(msg) {
  if (msg.text == "Edit") {
    logEdit(msg);
  } else if (msg.text == "Delete") {
    logRemove(msg);
  } else if (msg.text == "Cancel") {
    var message = "Command log dibatalkan";
    bot.sendMessage(msg.from.id, message).then(function () {
      statusMap[msg.from.id] = STATUS_IDLE;
      projectMap[msg.from.id] = null;
      logMap[msg.from.id] = null;
    }); 
  } else {
    var message = "Command " + msg.text + " tidak terdaftar. Command log dibatalkan";
    bot.sendMessage(msg.from.id, message).then(function () {
      statusMap[msg.from.id] = STATUS_IDLE;
      projectMap[msg.from.id] = null;
      logMap[msg.from.id] = null;
    }); 
  }
}
function logEdit(msg) {
  var user = msg.from;
  if (logMap[user.id] != null) {
    statusMap[user.id] = STATUS_LOG_EDIT;
    chooseProject(
      user.id, 
      "Project apa yang kamu kerjakan pada slot ke-" + logMap[user.id].shift + " tanggal " + (new Date(logMap[user.id].date)).getDate() + "?", 
      "Logging gagal ditambahkan. Coba lagi dalam beberapa saat."
    );  
  } else {
    var message = "Gagal mengedit log. Coba lagi dalam beberapa saat";
    bot.sendMessage(user.id, message).then(function () {
      statusMap[user.id] = STATUS_IDLE;
      logMap[msg.from.id] = null;
    }); 
  }
}
function logEditProject(msg) {
  var promise = Project.findOne({code: msg.text}).exec();
  promise.then(function(project) {
    if(project == null) {
      var message = "Project dengan kode [" + msg.text + "] tidak terdaftar. Periksa kembali kode project yang kamu masukkan.";
      bot.sendMessage(msg.chat.id, message);
    } else {
      var message = "Tuliskan deskripsi singkat apa yang kamu kerjakan.";
      bot.sendMessage(msg.from.id, message).then(function () {
        statusMap[msg.from.id] = STATUS_LOG_EDIT_DESC;
        projectMap[msg.from.id] = project;
      }); 
    }
  }).catch(function (err) {
    logEditFailed(user.id);
  });
}
function logEditDesc(msg) {
  var user = msg.from;
  if(logMap[user.id]) {
    var updatedData = { 
      projectId: projectMap[user.id].id,
      content: msg.text
    };
    var promise = Log.update(
      { _id: logMap[user.id].id }, 
      { $set: updatedData }
    );
    promise.then(function(result) {
      if(result != null && result.ok == 1) {
        var message = "Log pada slot ke-" + logMap[user.id].shift + " tanggal " + (new Date(logMap[user.id].date)).getDate() + " berhasil diubah";
        bot.sendMessage(user.id, message).then(function () {
          statusMap[user.id] = STATUS_IDLE;
          projectMap[user.id] = null;
          logMap[user.id] = null;
        }); 
      } else {
        logEditFailed(user.id);
      }
    }).catch(function(err) {
      logEditFailed(user.id);
    });
  } else {
    logEditFailed(user.id);
  }
}
function logEditFailed(chatId) {
  var message = "Log gagal diubah. Coba lagi dalam beberapa saat.";
  bot.sendMessage(chatId, message).then(function () {
    statusMap[chatId] = STATUS_IDLE;
    projectMap[chatId] = null;
    logMap[chatId] = null;
  }); 
}
function logRemove(msg) {
  var user = msg.from;
  if (logMap[user.id] != null) {
    var promise = Log.findOneAndRemove({ _id: logMap[user.id].id }).exec();
    promise.then(function(log) {
      if(log == null) {
        var message = "Gagal menghapus log. Coba lagi dalam beberapa saat";
        bot.sendMessage(user.id, message).then(function () {
          statusMap[user.id] = STATUS_IDLE;
          logMap[msg.from.id] = null;
        }); 
      } else {
        var message = "Log pada slot ke-" + logMap[user.id].shift + " tanggal " + (new Date(logMap[user.id].date)).getDate() + " berhasil dihapus";
        bot.sendMessage(user.id, message).then(function () {
          statusMap[user.id] = STATUS_IDLE;
          logMap[msg.from.id] = null;
        }); 
      }
    });
  } else {
    var message = "Gagal menghapus log. Coba lagi dalam beberapa saat";
    bot.sendMessage(user.id, message).then(function () {
      statusMap[user.id] = STATUS_IDLE;
      logMap[msg.from.id] = null;
    }); 
  }
}
// === END LOG === //


// === LOG REMINDER - command log reminder === //
bot.onText(/^\/log_reminder$/, function (msg, match) {
  if(!checkGroup(msg)) return;
  handleWrongCommand(
    msg, 
    "Format salah. Ketik 'log_reminder<spasi>[shift]' untuk mengingatkan coaster mengisi log.", 
    "Reminder gagal dikirim. Coba lagi dalam beberapa saat.", 
    true,
    "log_reminder"
  );
});
bot.onText(/^\/log_reminder@rollingtaskerbot$/, function (msg, match) {
  if(!checkGroup(msg)) return;
  handleWrongCommand(
    msg, 
    "Format salah. Ketik 'log_reminder<spasi>[shift]' untuk mengingatkan coaster mengisi log.", 
    "Reminder gagal dikirim. Coba lagi dalam beberapa saat.", 
    true,
    "log_reminder"
  );
});
bot.onText(/^\/log_reminder((\s+\d+)+)$/, function (msg, match) {
  reminder(msg, match); 
});
bot.onText(/^\/log_reminder@rollingtaskerbot((\s+\d+)+)$/, function (msg, match) {
  reminder(msg, match);
});
function reminder(msg, match) {
  if(!checkGroup(msg)) return;
  var errorMessage = "Reminder gagal dikirim. Coba lagi dalam beberapa saat.";
  checkPrivilege(msg, errorMessage, function(usr) {
    bot.getChatMember(ID_GROUP_COASTER, usr.telegramId).then(function(result) {
      if(result.status == "creator" || result.status == "administrator") {
        if(match.length < 2) {
          var message = "Format salah. Ketik 'log_reminder<spasi>[shift]' untuk mengingatkan coaster mengisi log.";
          bot.sendMessage(msg.chat.id, message);  
        } else {
          var shift = match[1];
          var now = new Date(); 
          var now_utc = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
          var date = moment(now_utc).add(7, 'hours').toDate();
          date.setHours(0);date.setMinutes(0);date.setSeconds(0);date.setMilliseconds(0);
          blastReminder(shift, date);
        }
      } else {
        var message = "Perintah gagal dilaksanakan. Command log_reminder hanya bisa digunakan oleh admin.";
        bot.sendMessage(msg.chat.id, message);  
      }
    });
  });
}
function blastReminder(shift, date) {
  var promise = User.find().exec();
  var _users = null;
  promise.then(function(users) {
    _users = users;
    return Log.find({date : date.getTime(), shift: shift}).exec();
  }).then(function (logs) {
    if(_users == null) return;
    var ids = [];
    logs.forEach(function (log) {
      ids[log.userId] = true;
    })
    _users.forEach(function(user) {
      if(!ids[user.id]) {
        logMap[user.telegramId] = new Log({
          userId: user.id,
          date: date.getTime(),
          shift: shift,
        });
        statusMap[user.telegramId] = STATUS_LOG_PROJECT;
        chooseProject(
          user.telegramId, 
          "Project apa yang kamu kerjakan pada slot ke-" + logMap[user.telegramId].shift + " tanggal " + (new Date(logMap[user.telegramId].date)).getDate() + "?", 
          "Logging gagal ditambahkan. Coba lagi dalam beberapa saat."
        );
      }
    });
  }).catch(function(err) {
    var message = "Pengambilan data user gagal. Coba lagi dalam beberapa saat.";
    bot.sendMessage(msg.chat.id, message);
  });
}
// === END LOG REMINDER === //


// === LIST PROJECT - command list project === //
bot.onText(/^\/list_project$/, function (msg, match) {
  listProject(msg);
});
bot.onText(/^\/list_project@rollingtaskerbot$/, function (msg, match) {
  listProject(msg);
});
function listProject(msg) {
  if(!checkGroup(msg)) return;
  var promise = Project.find().exec();
  promise.then(function(projects) {
    var message = "Daftar project yang aktif saat ini: \n";
    projects.forEach(function(project) {
      if (project.color) {
        message += "[" + project.code + "] " + project.name + " (" + project.color + ")"+ "\n";
      } else {
        message += "[" + project.code + "] " + project.name + "\n";
      }
    });
    bot.sendMessage(msg.chat.id, message);
  }).catch(function(err) {
    var message = "Data project gagal diambil. Coba lagi dalam beberapa saat.";
    bot.sendMessage(msg.chat.id, message);
  });
}
// === END LIST PROJECT === //


// === ADD PROJECT - command add project === //
bot.onText(/^\/add_project$/, function (msg, match) {
  addProjectGroup(msg);
});
bot.onText(/^\/add_project@rollingtaskerbot$/, function (msg, match) {
  addProjectGroup(msg);
});
function addProjectGroup(msg) {
  if(!checkGroup(msg)) return;
  var errorMessage = "Project gagal ditambahkan. Coba lagi dalam beberapa saat.";
  checkPrivilege(msg, errorMessage, function(usr) {
    bot.getChatMember(ID_GROUP_COASTER, usr.telegramId).then(function(result) {
      if(result.status == "creator" || result.status == "administrator") {
        var message = "Tambahkan project baru dengan format '[kode project] - [nama project] - [warna project (opsional)]' atau masukan command /done jika sudah selesai menambahkan.";
        bot.sendMessage(usr.telegramId, message);
        statusMap[usr.telegramId] = STATUS_ADD_PROJECT;
      } else {
        var message = "Perintah gagal dilaksanakan. Command add_project hanya bisa digunakan oleh admin.";
        bot.sendMessage(msg.chat.id, message);  
      }
    });
  });
}
function submitProject(msg) {
  var projects = msg.text.split("\n");
  projects.forEach(function(item, index) {
    var p = item.split("-");
    if(p.length < 2 || p.length > 3) {
      var message = "Format salah. Ketik '[kode project] - [nama project] - [warna project (opsional)]' untuk menambahkan project baru.";
      bot.sendMessage(msg.from.id, message); 
    } else {
      var promise = Project.findOne({code: p[0].trim()}).exec();
      promise.then(function(project) {
        if(project == null) {
          var newProject = new Project({
            code: p[0].trim(),
            name: p[1].trim()
          });
          if (p.length == 3) newProject.color = p[2].trim();
          return newProject.save();
        } else {
          var message = "Project dengan kode [" + project.code + "] sudah ada.";
          bot.sendMessage(msg.from.id, message);
        }
      }).then(function(project) {
        if(project != null) {
          var message = "Project dengan kode [" + project.code + "] berhasil didaftarkan! Gunakan format sebelumnya untuk menambah project lain atau masukan command '/done' jika sudah selesai menambahkan.";
          bot.sendMessage(msg.from.id, message);
        } else {
          var message = "Project gagal ditambahkan. Coba lagi dalam beberapa saat.";
          bot.sendMessage(msg.from.id, message);
        }
      }).catch(function(err) {
        var message = "Project gagal ditambahkan. Coba lagi dalam beberapa saat.";
        bot.sendMessage(msg.from.id, message);
      });
    }
  })
}
bot.onText(/^\/done$/, function (msg, match) {
  done(msg);
});
function done(msg) {
  var message = "";
  switch(statusMap[msg.from.id]) {
    case STATUS_ADD_PROJECT :
      message = "Project berhasil ditambahkan!";
      break;
    case STATUS_REMOVE_PROJECT :
      message = "Project telah dihapus.";
      break;
    default : 
      message = "Tidak ada proses yang sedang berjalan";
      break;
  }
  bot.sendMessage(msg.from.id, message).then(function () {
    statusMap[msg.from.id] = STATUS_IDLE;
  });   
}
// === END ADD PROJECT === //


// === REMOVE PROJECT - command remove project === //
bot.onText(/^\/remove_project$/, function (msg, match) {
  removeProjectGroup(msg);
});
bot.onText(/^\/remove_project@rollingtaskerbot$/, function (msg, match) {
  removeProjectGroup(msg);
});
function removeProjectGroup(msg) {
  if(!checkGroup(msg)) return;
  var errorMessage = "Gagal menghapus project. Coba lagi dalam beberapa saat.";
  checkPrivilege(msg, errorMessage, function(usr) { 
    bot.getChatMember(ID_GROUP_COASTER, usr.telegramId).then(function(result) {
      if(result.status == "creator" || result.status == "administrator") {
        chooseProject(
          usr.telegramId, 
          "Silakan pilih project yang akan dihapus:", 
          "Gagal menghapus project. Coba lagi dalam beberapa saat."
        );
        statusMap[usr.telegramId] = STATUS_REMOVE_PROJECT;
      } else {
        var message = "Command remove_project hanya bisa digunakan oleh admin.";
        bot.sendMessage(msg.chat.id, message);  
      }
    });
  });
}
function deleteProject(msg) {
  var promise = Project.findOneAndRemove({code: msg.text}).exec();
  promise.then(function(project) {
    if(project == null) {
      var message = "Tidak ada project dengan kode [" + msg.text + "]";
      bot.sendMessage(msg.from.id, message);
    } else {
      var message = "Project dengan kode [" + msg.text + "] berhasil dihapus. Lanjutkan menghapus project dengan memasukan kode project atau dengan menggunakan command sebelumnya. Ketik /done jika sudah selesai.";
      bot.sendMessage(msg.from.id, message);
    }
  });
}
// === END REMOVE PROJECT === //


// === EDIT PROJECT - command edit project === //
bot.onText(/^\/edit_project$/, function (msg, match) {
  editProjectGroup(msg);
});
bot.onText(/^\/edit_project@rollingtaskerbot$/, function (msg, match) {
  editProjectGroup(msg);
});
function editProjectGroup(msg) {
  if(!checkGroup(msg)) return;
  var errorMessage = "Gagal mengedit project. Coba lagi dalam beberapa saat.";
  checkPrivilege(msg, errorMessage, function(usr) {
    bot.getChatMember(ID_GROUP_COASTER, usr.telegramId).then(function(result) {
      if(result.status == "creator" || result.status == "administrator") {
        chooseProject(
          usr.telegramId, 
          "Silakan pilih project yang akan diedit:", 
          "Gagal mengedit project. Coba lagi dalam beberapa saat."
        );
        statusMap[usr.telegramId] = STATUS_EDIT_PROJECT;
      } else {
        var message = "Command edit_project hanya bisa digunakan oleh admin.";
        bot.sendMessage(msg.chat.id, message);  
      }
    });
  });
}
function editProject(msg) {
  var promise = Project.findOne({code: msg.text}).exec();
  promise.then(function(project) {
    if(project == null) {
      var message = "Tidak ada project dengan kode [" + msg.text + "]";
      bot.sendMessage(msg.from.id, message);
    } else {
      var message = "Edit project dengan format '[kode project] - [nama project] - [warna project (opsional)]'";
      bot.sendMessage(msg.from.id, message).then(function () {
        statusMap[msg.from.id] = STATUS_SUBMIT_EDIT_PROJECT;
        projectMap[msg.from.id] = project;
      }); 
    }
  });
}
function submitEditProject(msg) {
  var p = msg.text.split("-");
  if(p.length < 2 || p.length > 3) {
    var message = "Format salah. Ketik '[kode project] - [nama project] - [warna project (opsional)]' untuk mengubah project.";
    bot.sendMessage(msg.from.id, message); 
  } else {
    // jika kode berubah, periksa lagi apakah kode sudah ada atau belum
    if (projectMap[msg.from.id].code !== p[0].trim()) {
      var promise = Project.findOne({code: p[0].trim()}).exec();
      promise.then(function(project) {
        if(project == null) {
          updateProject(msg, p);
        } else {
          var message = "Project dengan kode [" + project.code + "] sudah ada. Silakan masukkan kembali data baru dengan format sebelumnya";
          bot.sendMessage(msg.from.id, message);
        }
      }).catch(function(err) {
        var message = "Project gagal diubah. Coba lagi dalam beberapa saat.";
        bot.sendMessage(msg.from.id, message);
      });
    } else {
      updateProject(msg, p);
    }
  }
}
function updateProject(msg, data) {
  var updatedData = { 
    code: data[0].trim(),
    name: data[1].trim(),
  };
  if (data.length == 3) updatedData.color = data[2].trim();
  var promise = Project.update(
      { _id: projectMap[msg.from.id].id}, 
      { $set: updatedData}
    );
  promise.then(function(result) {
    if(result != null && result.ok == 1) {
      var message = "Project dengan kode [" + projectMap[msg.from.id].code + "] berhasil diubah";
      bot.sendMessage(msg.from.id, message).then(function () {
        statusMap[msg.from.id] = STATUS_IDLE;
        projectMap[msg.from.id] = null;
      }); 
    } else {
      var message = "Project gagal diubah. Coba lagi dalam beberapa saat.";
      bot.sendMessage(msg.from.id, message);
    }
  }).catch(function(err) {
    var message = "Project gagal diubah. Coba lagi dalam beberapa saat.";
    bot.sendMessage(msg.from.id, message);
  });
}
// === END EDIT PROJECT === //


// === JOIN - command untuk join === //
bot.onText(/^\/join$/, function (msg, match) {
  if(msg.chat.id < 0) {
    join(msg);
  } else {
    var message = "Command ini hanya bisa digunakan di dalam group coaster.";
    bot.sendMessage(msg.chat.id, message);
  } 
});
bot.onText(/^\/join@rollingtaskerbot$/, function (msg, match) {
  join(msg);
});
function join(msg) {
  if(!checkGroup(msg)) return;
  var user = msg.from;
  var promise = User.findOne({telegramId: user.id}).exec();
  promise.then(function(usr) {
    if(usr == null) {
      var newUser = new User({
        name: user.first_name + " " + user.last_name,
        username: user.username,
        telegramId: user.id
      });
      return newUser.save();
    } else {
      if(usr.status == "unverified") {
        var message = "Selamat, kamu berhasil bergabung ke dalam rolling task! Silakan klik [start](https://telegram.me/rollingtaskerbot) untuk memulai logging.";
        bot.sendMessage(msg.chat.id, message, {"parse_mode":"Markdown", "disable_web_page_preview":true});
      } else {
        var message = "Kamu sudah tergabung sebelumnya di dalam rolling task.";
        bot.sendMessage(msg.chat.id, message);
      }
    }
  }).then(function(usr) {
    if(usr != null) {
      var message = "Selamat, kamu berhasil bergabung ke dalam rolling task! Silakan klik [start](https://telegram.me/rollingtaskerbot) untuk memulai logging.";
      bot.sendMessage(msg.chat.id, message, {"parse_mode":"Markdown", "disable_web_page_preview":true});
    }
  }).catch(function(err) {
    var message = "Pendaftaran user gagal. Coba lagi dalam beberapa saat.";
    bot.sendMessage(msg.chat.id, message);
  });
}
// === END JOIN === //


// === START - command untuk start === //
bot.onText(/^\/start$/, function (msg, match) {
  if(!checkGroup(msg)) return;
  if(msg.chat.id < 0) {
    var message = "Command ini hanya digunakan di dalam private chat";
    bot.sendMessage(msg.chat.id, message);
    return;
  }
  var user = msg.from;
  var promise = User.findOne({telegramId: user.id}).exec();
  promise.then(function(usr) {
    if(usr == null) {
      var message = "Maaf, bot ini dibuat untuk kebutuhan internal dan tidak terbuka untuk umum.";
      bot.sendMessage(msg.chat.id, message)
    } else {
      return User.update({_id: usr.id}, { status: "verified", isActive: true }).exec();
    }
  }).then(function(usr) {
    if(usr != null) {
      var message = "Halo, kamu sudah terdaftar di dalam rolling task! Saya akan membantu kamu dalam melakukan logging.";
      bot.sendMessage(msg.chat.id, message);
    } else {
      var message = "Terjadi kesalahan, silakan ketikan kembali command /start";
      bot.sendMessage(msg.chat.id, message);
    }
  }).catch(function(err) {
    var message = "User gagal ditambahkan. Coba lagi dalam beberapa saat.";
    bot.sendMessage(msg.chat.id, message);
  });
});
// === END START === //



// === HELPER === //

// untuk merespon mesej yang bukan command
bot.on('message', function (msg) {
  var chatId = msg.chat.id;
  // memberikan respon saat bot ditambahkan ke dalam grup
  var newChatMember = msg.new_chat_member;
  if(newChatMember != null && newChatMember.id == ID_BOT) {
    var message = "";
    if(chatId == ID_GROUP_COASTER) {
      message = "Halo, aku adalah rollingtaskerbot! Aku bertugas untuk membantu para coaster dalam melakukan logging.\n";
      message += "Silakan ketik command /join untuk bergabung dalam daftar user di dalam tasker."
    } else {
      message = "Maaf, bot ini dibuat untuk kebutuhan internal dan tidak terbuka untuk umum.";
    } 
    bot.sendMessage(chatId, message); 
  } else {
    if(msg.text[0] != "/") {
      switch(statusMap[msg.from.id]) {
        case STATUS_ADD_PROJECT :
          submitProject(msg);
          break;
        case STATUS_REMOVE_PROJECT :
          deleteProject(msg);
          break;
        case STATUS_EDIT_PROJECT :
          editProject(msg);
          break;
        case STATUS_SUBMIT_EDIT_PROJECT :
          submitEditProject(msg);
          break;
        case STATUS_LOG_PROJECT :
          logProject(msg);
          break;
        case STATUS_LOG_DESC :
          logDesc(msg);
          break;
        case STATUS_LOG_EXIST :
          logExist(msg);
          break;
        case STATUS_LOG_EDIT :
          logEditProject(msg);
          break;
        case STATUS_LOG_EDIT_DESC :
          logEditDesc(msg);
          break;
      }
    }
  }
});

// fungsi untuk meng-handle mesej yang datang dari group selain coaster
function checkGroup(msg) {
  if(msg.chat.id < 0 && msg.chat.id != ID_GROUP_COASTER) {
    var message = "Maaf, bot ini dibuat untuk kebutuhan internal dan tidak terbuka untuk umum.";
    bot.sendMessage(msg.chat.id, message);
    return false;
  }
  return true;
}

// fungsi untuk handle kesalahan input command
function handleWrongCommand(msg, formatMessage, errorMessage, isAdminCommand, command) {
  checkPrivilege(msg, errorMessage, function(usr) {
    if (isAdminCommand) {
      bot.getChatMember(ID_GROUP_COASTER, usr.telegramId).then(function(result) {
        if(result.status == "creator" || result.status == "administrator") {
          bot.sendMessage(msg.chat.id, formatMessage);  
        } else {
          var message = "Perintah gagal dilaksanakan. Command " + command + " hanya bisa digunakan oleh admin.";
          bot.sendMessage(msg.chat.id, message);  
        }
      });
    } else {
      bot.sendMessage(msg.chat.id, formatMessage); 
    }
  });
}

// fungsi untuk cek privilege
function checkPrivilege(msg, errorMessage, callback) {
  var user = msg.from;
  var promise = User.findOne({telegramId: user.id}).exec();
  promise.then(function(usr) {
    if(usr == null) {
      var message = "Kamu belum terdaftar di dalam rolling tasker. Gunakan command /join untuk mendaftarkan diri kamu ke dalam coaster.";
      bot.sendMessage(msg.chat.id, message);  
    } else {
      callback(usr);
    }
  }).catch(function(err) {
    console.log(err);
    bot.sendMessage(msg.chat.id, errorMessage);
  });
}

// fungsi untuk menampilkan keyboard pilihan project ke user
function chooseProject(chatId, message, errorMessage) {
  var promise = Project.find().exec();
  promise.then(function(projects) {
    var keyboardButton = [];
    var idx = 0;
    var iter = 0;
    projects.forEach(function(project) {
      if(iter == 0) keyboardButton[idx] = [];
      keyboardButton[idx].push({text : project.code});
      iter += 1;
      if(iter == 3) {
        iter = 0;
        idx += 1;
      }
    });
    var options = {
      reply_markup: {
        keyboard: keyboardButton,
        resize_keyboard: true,
        one_time_keyboard: true
      }
    };
    bot.sendMessage(chatId, message, options);
  }).catch(function(err) {
    bot.sendMessage(chatId, errorMessage);
  });
}

// fungsi untuk menambahkan admin sesuai dengan admin grup
function setAdmin(chatId) {
  bot.getChatAdministrators(chatId).then(function(results) {
    results.forEach(function(result) {
      var user = result.user;
      var promise = User.findOne({telegramId: user.id}).exec();
      promise.then(function(usr) {
        if(usr == null) {
          var newUser = new User({
            name: user.first_name + " " + user.last_name,
            username: user.username,
            telegramId: user.id
          });
          return newUser.save();
        } else {
          // return User.update({_id: usr.id}, { role: "admin" }).exec();
        }
      }).then(function(usr) {
        console.log("admin tersimpan");
      }).catch(function(err) {
        var message = "Gagal menambahkan admin";
        bot.sendMessage(msg.chat.id, message);
      });
    });
  });
}

// === END HELPER === //