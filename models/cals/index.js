var mongoose = require('mongoose'),
    uuid = require('uuid/v4');
//Each item in vote will last for a certain period of time. After this time is elapsed, it'll either be accepted or rejected.
var calSchema = new mongoose.Schema({
    title:String,
    text:String,//description of event
    user:String,//user that set this event
    eventDate:{type:Number,default:-1},
    createDate:{type:Number,default:Date.now()},
    lastUpd:{type:Number,default:Date.now()},
    kind:{type:String, default:'lotto'},
    expired:{type:Boolean,default:false},
    paid:[String],//if this is a PAID contest, list of users that have paid to enter,
    winner:String
}, { collection: 'cal' });
mongoose.model('cal', calSchema);
