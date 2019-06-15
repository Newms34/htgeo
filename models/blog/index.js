const mongoose = require('mongoose');
const blogSchema = new mongoose.Schema({
    pic:{type:String,default:null},
    height:{type:Number,default:400},
    title:String,
    contents:String,
    author:String,
    youtube:{type:String, default:null},
    likes:[String],
    date:{type:Number,default:Date.now()}
}, { collection: 'blog' });
mongoose.model('blog', blogSchema);
