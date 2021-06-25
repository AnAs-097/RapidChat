var currentUserId='';
var chatSessionKey='';
////////
function openChat(fKey,fName,fPhotoUrl) {
    
    var friend = {friendId: fKey, userId: currentUserId };
    var check = false;

    var db = firebase.database().ref('friendsList');
    db.on('value', function(friends) {
        friends.forEach( function(data) {
            var user = data.val();
            if ((user.friendId === fKey && user.userId === friend.userId) || (user.friendId === friend.userId && user.userId === friend.friendId)) {
                check = true;
                chatSessionKey=data.key;
            }
            
        });

        if (check === false)
        {
            chatSessionKey = firebase.database().ref('friendsList').push(friend, function(error) {
                if(error) {
                    alert(error);
                }
                else {
                    document.getElementById('messagePanel').removeAttribute('style');
                    document.getElementById('loadImg').setAttribute('style','display:none');
                }
            }).getKey();
        }
        else {
            document.getElementById('messagePanel').removeAttribute('style');
            document.getElementById('loadImg').setAttribute('style','display:none');
        }
        document.getElementById('chatFriendName').innerHTML = fName;
        document.getElementById('chatDP').src = fPhotoUrl;
        document.getElementById('messageList').innerHTML='';

        enterPressed();
        
        document.getElementById('textInputField').value = '';
        document.getElementById('textInputField').focus();
        
        loadChat(chatSessionKey);
        //document.getElementById('messageList').scrollTo(0,document.getElementById('messageList').clientHeight);
        //var messageBody = document.querySelector('#messageList');
        //messageBody.scrollTop = messageBody.scrollHeight - messageBody.clientHeight;
    });
    
}


function enterPressed(){
    document.addEventListener('keyup', function(key){
        if(key.which == 13){
            var msg = document.getElementById('textInputField').value
            if( msg !== ''){
                
                document.getElementById('textInputField').value = '';
                document.getElementById('textInputField').focus();
                send(msg);
            }
                
        }
    });
}

function send(msg){
    var newChatMsg = {senderId: currentUserId,msg: msg, date: new Date().toLocaleString()};
    firebase.database().ref('messages').child(chatSessionKey).push(newChatMsg, function(error) {
        if(error) alert(error);
        else {
             var messageBody = document.querySelector('#messageList');
             messageBody.scrollTop = messageBody.scrollHeight - messageBody.clientHeight;
        }
    });

}

function selectImage(){
    document.getElementById('imgFile').click();
}

function sendImg(event){
    var file = event.files[0];
    if(!file.type.match("image.*")){
        alert("File type missmatch");
    }
    else{
        var fileReader = new FileReader();
        fileReader.addEventListener("load",function(){
            var newChatMsg = {senderId: currentUserId,msg: fileReader.result, date: new Date().toLocaleString()};
            firebase.database().ref('messages').child(chatSessionKey).push(newChatMsg, function(error) {
                if(error) alert(error);
                else {
                     var messageBody = document.querySelector('#messageList');
                     messageBody.scrollTop = messageBody.scrollHeight - messageBody.clientHeight;
                }
            });
         }, false);
        if(file) {
            fileReader.readAsDataURL(file);
        }
    }
}

//////////////////////////////////////////////

function loadChat(chatSessionKey) {
    var datab = firebase.database().ref('messages').child(chatSessionKey);
    document.getElementById('messageList').innerHTML='';
    datab.on('value', function (messages){
        var message='';
        messages.forEach(function (messageData){
            var messageVal = messageData.val();
            var dateTime = messageVal.date.split(',');
            var msg = '';
            if(messageVal.msg.indexOf("base64") !== -1){
                msg = '<img src = "'+ messageVal.msg+'" class = "img-fluid"/>'
            }
            else{
                msg = messageVal.msg
            }
            if(messageVal.senderId===currentUserId){
                message += '<div class="row justify-content-end"><div class="col-6 col-sm-7 col-md-7" style="display: inline-block;"><p class="message-send-element float-right">' + msg +' <span class="message-time float-right" title="' + dateTime[0] +'">' + dateTime[1] +'</span></p></div></div> ';
            }
            else{
                message += '<div class="row"><div class="col-6 col-sm-7 col-md-7" style="display: inline-block;"><p class="message-element">'+ msg +' <span class="message-time float-right" title="' + dateTime[0] +'">' + dateTime[1] +'</span></p></div></div>';
            }
        });
        document.getElementById('messageList').innerHTML = message;
        //document.getElementById('messageList').scrollTo(0,document.body.scrollHeight);
        var messageBody = document.querySelector('#messageList');
        messageBody.scrollTop = messageBody.scrollHeight - messageBody.clientHeight;
    });
    document.getElementById('messageList').scrollTo(0,document.body.scrollHeight);
}

function loadContacts() {
    var datab = firebase.database().ref('friendsList');
    datab.on('value', function(pairs){
        document.getElementById('contactList').innerHTML=' <li class="list-group-item" style="background-color:#f8f8f8"><input type="text" placeholder="Search......" class="form-control"/></li>';
        pairs.forEach( function(data) {
            var pair = data.val();
            var friendId = '';
            if(pair.friendId === currentUserId) {
                friendId = pair.userId;
            }
            else if(pair.userId === currentUserId) {
                friendId = pair.friendId;
            }

            if(friendId !== ''){
                firebase.database().ref('users').child(friendId).on('value', function(data){
                    var frnd = data.val();
                    document.getElementById('contactList').innerHTML +='<li class="list-group-item list-group-item-action" onclick="openChat(\''+data.key+'\',\''+frnd.name+'\',\''+frnd.photoURL+'\')"><div class="row"><div class="col-md-2"><img src="'+frnd.photoURL+'" class="contact-img" /></div><div class="col-md-10" style="cursor:pointer;"><div class="contact-name">'+frnd.name+'</div><div class="latest-message">Hello</div></div></div></li>';
                });
            }
        });
    });
}


function login(){
    var provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider);
}

function logout(){
    firebase.auth().signOut();
}

function onFirebaseStateChanged(){
    firebase.auth().onAuthStateChanged(onStateChanged);
}

function onStateChanged(user){
    if (user){
        var userProfile = { email: '', name: '', photoURL: '' };
        userProfile.email = firebase.auth().currentUser.email;
        userProfile.name = firebase.auth().currentUser.displayName;
        userProfile.photoURL = firebase.auth().currentUser.photoURL;

        var check = false;
        var datab = firebase.database().ref('users');
        datab.on('value', function (users){
            users.forEach(function(data) {
                var user = data.val();
                if (user.email === userProfile.email) {
                    currentUserId = data.key;
                    check = true;
                }
            });
            if(check === false) {
             
                firebase.database().ref('users').push(userProfile, callback);        
            }
            else{
            
                document.getElementById('profileImg').src = firebase.auth().currentUser.photoURL;
                document.getElementById('profileImg').title = firebase.auth().currentUser.displayName;
                document.getElementById('lnkLogin').style='display: none';
                document.getElementById('lnkLogout').style='';
                document.getElementById('newChatBtn').style='';

               
            }
            loadContacts();
        });
    }
    else{
        document.getElementById('profileImg').src = 'Images/profile-blank.png';
        document.getElementById('profileImg').title = '';
        document.getElementById('lnkLogin').style='';
        document.getElementById('lnkLogout').style='display: none';
        document.getElementById('newChatBtn').style='display: none';
    }
}

function callback(error) {
    if (error) {
        alert(error);
    }
    else {
        document.getElementById('profileImg').src = firebase.auth().currentUser.photoURL;
        document.getElementById('profileImg').title = firebase.auth().currentUser.displayName;
        document.getElementById('lnkLogin').style='display: none';
        document.getElementById('lnkLogout').style='';
    }
}

function populateFriends() {
    var fList = document.getElementById('friendList');
    fList.innerHTML = '<div> <span class="spinner-border text-primary mt-5" style="height: 8rem; width:4rem"> </span> </div>';

    var datab = firebase.database().ref('users');
    var userList='';
    datab.on('value', function (users){
        if(users.hasChildren()) {
            userList = ' <li class="list-group-item" style="background-color:#f8f8f8"><input type="text" placeholder="Search......" class="form-control"/></li>';
            
        }
        users.forEach(function(data) {
            var user = data.val();
            if(user.email !== firebase.auth().currentUser.email)
                userList += '<li class="list-group-item list-group-item-action" data-dismiss="modal" onclick="openChat(\''+data.key+'\',\''+user.name+'\',\''+user.photoURL+'\')"><div class="row"><div class="col-md-2"><img src="'+user.photoURL+'" class="contact-img" /></div><div class="col-md-10" style="cursor:pointer;"><div class="contact-name">'+user.name+'</div></div></div></li>';
        });
        fList.innerHTML = userList;    
    });
}

onFirebaseStateChanged();