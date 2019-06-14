var mongoose = require('mongoose');
//Each item in vote will last for a certain period of time. After this time is elapsed, it'll either be accepted or rejected.
var postSchema = new mongoose.Schema({
    text:String,//actual TEXT of the post (may include html),
    md:String,//raw markdown (for quoting!)
    user:String,
    createDate:{type:Number,default:Date.now()},
    lastUpd:{type:Number,default:Date.now()},
    thread:String,//ID of parent thread.
    file:{type:String,default:null},
    profPic:{type:String,default:null}
}, { collection: 'post' });
postSchema.index({md:'text'});
mongoose.model('post', postSchema);
