const express = require('express'),
    app = express(),
    http = require('http'),
    server = http.Server(app),
    io = require('socket.io')(server),
    path = require('path'),
    cookieParser = require('cookie-parser'),
    // cookie = require('cookie'),
    helmet = require('helmet'),
    bodyParser = require('body-parser'),
    session = require('express-session'),
    passport = require('passport'),
    compression = require('compression');
app.use(compression());

const sesh = session({
    secret: 'ea augusta est et carissima'
});
const usrModel = require('./models/users')
app.use(sesh);
app.use(passport.initialize());
app.use(passport.session());
const passportSetup = require('./config/passport-setup');
app.use(helmet());

app.use(cookieParser('spero eam beatam esse'))
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ limit: '50mb' }));
app.set('view engine', 'html');
app.set('views', path.join(__dirname, 'views'));
app.set('io', io)
// app.set('pp', passport)
const routes = require('./routes')(io);
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'views')));
app.use('/', routes);
// var server = http.Server(app);
// var io = require('socket.io')(server);
let names = [];
// io.use(function(socket, next) {
//     sesh(socket.request, socket.request.res, next);
// });
let isFirstCon=true;
io.on('connection', function(socket) {

    if(isFirstCon) {
        isFirstCon=false;
        // if this is the first new connection, log out everyone else (since this is likely a server restart/update)
        socket.emit('doLogout')
    }
    socket.on('hbResp',function(n){
        // console.log('heartbeat response from',n)
        for(let i=0;i<names.length;i++){
            if(names[i].name==n.name){
                names[i].t=Date.now();
            }
        }
        
    })

    // //new login stuff
    socket.on('hiIm', function(n) {
        //on a new person connecting, add them to our list and then push out the list of all names.
        names.push({ name: n.name, t: Date.now() });
        console.log('NEW USER', n, 'ALL USERS', names)
        // socket.emit('allNames',names);
    })

    socket.on('getOnline',function(){
        socket.emit('allNames',names);
    })
    setInterval(function() {
        let now=Date.now();
        names=names.filter(nm=>now-nm.t<1000);
        //remove any user that has not pinged us in more than 1 second
        // console.log('names is now',names)
        socket.emit('reqHeartBeat', names);
        socket.emit('allNames',names)
    }, 500);

    //messaging (for chat!)
    socket.on('chatMsg', function(msgObj) {
        // console.log('chat message sent! Obj was', msgObj)
        msgObj.time = Date.now();
        msgObj.randVal = Math.floor(Math.random()*999999).toString(32);
        io.emit('chatMsgOut', msgObj)
    })
});
server.listen(process.env.PORT || 8080);
server.on('error', function(err) {
    console.log('Oh no! Err:', err)
});
server.on('listening', function(lst) {
    console.log('Server is listening!')
});
server.on('request', function(req) {
    // console.log(req.url);
})

app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    console.log('Client (probly) err:', err)
    res.send('Error!' + err)
});