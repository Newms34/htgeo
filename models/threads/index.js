const mongoose = require('mongoose');
//Each item in vote will last for a certain period of time. After this time is elapsed, it'll either be accepted or rejected.
const threadSchema = new mongoose.Schema({
    open: { type: Boolean, default: true }, //locked/unlocked
    stickied: { type: Boolean, default: false }, //is thread stuck to top of subgroup?
    title: String, //thread title
    grp: { type: String, default: 'general' }, //subgroup this belongs to
    createDate: { type: Number, default: Date.now() },
    lastUpd:{type:Number,default:Date.now()},
    user: String, //also admin,
    posts: [{
        id: String,
        order: { type: Number, default: 0 },
        lastUpd:{type:Number, default:Date.now()},
        votesUp: [String],
        votesDown: [String]
    }]
}, { collection: 'thread' });
threadSchema.index({title:'text'});
mongoose.model('thread', threadSchema);
