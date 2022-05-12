// JS file for server-side
// ----------------------------------------

// initializing express app object
let express = require('express');
let app = express();
app.use('/', express.static('public'));

app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));

let Datastore = require('nedb');
let db = new Datastore({filename: 'note.db', timestampData: true});
db.loadDatabase();


// initializing http server
let http = require('http');
let server = http.createServer(app);

// initializing socket.io
let io = require('socket.io');
const { timeStamp } = require('console');
io = new io.Server(server);


app.post('/noteData', (req, res) => {
    console.log('received a post request');
    let noteData = req.body;
    db.insert(noteData);

    let confirmObj = {
        'task': 'success',
        'note': noteData
    }

    res.json(confirmObj);
})

app.get('/allNotes', (req, res) => {
    console.log('received a get for all notes');

    console.log('roomname ' + roomName);

    db.find({room: `${roomName}`}).sort({createdAt: 1}).exec((err, docs) => {
        let allNotes = {"data": docs};
        res.json(allNotes);
    })
})

// object containing user name as key and user-id as value
let users = {};
// object containing room name as key and # of users in room as value
let rooms = {};
// variable for containing how many times the add button is clicked across all sockets in a room
let count = 0;
let roomName;

let userList = [];

io.sockets.on('connect', (socket) => {
    console.log('socket joined: ', socket.id);

    // upon receiving userData from the user that is containing user name and socket id
    socket.on('userData', (data) => {
        socket.room = data.room;
        socket.name = data.name;
        roomName = data.room;

        // add the user to the user object
        users[socket.name] = socket.id;

        let userObj = {
            username: data.name,
            roomname: data.room
        }

        // adding the user object if it doesn't exist in the array
        if (!(userList.includes(userObj))){
            userList.push(userObj);
        }

        // have the socket join the room it specified in the form
        socket.join(socket.room);
        if (rooms[socket.room]){
            rooms[socket.room]++;
        }
        else{
            rooms[socket.room] = 1;
        }

        // emit room name to the specific socket
        socket.emit('roomName', socket.room);
        // emit size of the room to all sockets in that room
        io.to(socket.room).emit('roomSize', rooms[socket.room]);
        // emit the array of all users to all sockets in the room
        io.to(socket.room).emit('userList', userList);
    })

    // upon receiving notification that add-note button is clicked; data contains the color of the note added
    socket.on('addNoteClicked', (data) => {
        count++;

        // save the color in an object together with count value that will be used as identifier for each note
        let noteInfo = {
            color: data,
            value: count
        }

        io.to(socket.room).emit('noteColor', noteInfo);
    })

    // upon receiving the id of the sticky note whose remove icon was clicked
    socket.on('removeIconClicked', (id) => {
        console.log('this will be removed: ' + id);
        // emit the id to all sockets in the room to have the note deleted for all users
        io.to(socket.room).emit('removeIconClicked', id);

        let id_num = id.match(/\d/g);
        id_num = id_num.join(""); 

        // remove the note data from the array if the remove icon was clicked
        db.remove({id: `${id_num}` }, {multi: true}, function (err, numRemoved) {
        });
    })

    // upon receiving the data of the text that was submitted for the note
    socket.on('noteTextSubmitted', (data) => {
        // emit the data to all sockets in the room to have the text displayed for all users
        io.to(socket.room).emit('noteTextDetails', data);

        // for only getting the number id of the note
        let id_num = data.noteID.match(/\d/g);
        id_num = id_num.join(""); 

        // updating the text and type of note whenever a text was submitted by the user
        db.update({ id: `${id_num}` }, { $set: { text: data.text, type: data.type }} , {} , function () {});
    })

    // when a socket disconnects
    socket.on('disconnect', () => {
        console.log('socket disconnected: ', socket.id);
        // decrement the size of the room
        rooms[socket.room]--;
        // delete the socket from the user object
        delete users[socket.name];

        // emit the updated room size to all sockets in the room
        io.to(socket.room).emit('roomSize', rooms[socket.room]);

        userList = userList.filter((e) => { 
            return e.username != socket.name; 
        }); 
        
        io.to(socket.room).emit('userList', userList);
        
        // for debugging purposes
        // db.remove({}, { multi: true }, function (err, numRemoved) {});
    })
})

// running the server
let port = process.env.PORT || 8000;
server.listen(port, () => {
    console.log('server listening to port ' + port);
})