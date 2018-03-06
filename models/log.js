// Log model
 
var mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	ObjectId = Schema.ObjectId;
 
var logSchema = new Schema({
    userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    date: {type: Number, default: 0},
    shift: {type: Number, default: 0},
    projectId: {type: mongoose.Schema.Types.ObjectId, ref: 'Project'},
    content: {type: String, default: ""}
});
 
module.exports = mongoose.model('Log', logSchema);