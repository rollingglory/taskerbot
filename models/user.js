// User model
 
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;
 
var userSchema = new Schema({
    alias: String,
    name: String,
    username: String,
    telegramId: String,
    isActive: Boolean,
    status: {type: String, default: "unverified"},
    logs : [{ type: Schema.Types.ObjectId, ref: 'Log' }]
});
 
module.exports = mongoose.model('User', userSchema);