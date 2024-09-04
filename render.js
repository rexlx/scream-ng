
import { Applcation } from './application.js';
const box = document.getElementById('mainBox');
const errorDiv = document.getElementById('errors');
const app = new Applcation("http://localhost:8080", "thisisadoggertoken");
const userMessage = document.getElementById('userMessage');
const addMessage = document.getElementById('addMessage');
const login = document.getElementById('login');
const loginScreen = document.getElementById('login-screen');
const mainContent = document.getElementById('main-content');
const theFooter = document.getElementById('theFooter');
const roomName = document.getElementById('roomName');
const userRoom = document.getElementById('userRoom');
const joinRoom = document.getElementById('joinRoom');
const userEmail = document.getElementById('username');
const userPassword = document.getElementById('password');
const viewHistory = document.getElementById('viewHistory');
const userRooms = document.getElementById('userRooms');
const addRoom = document.getElementById('addRoom');

login.addEventListener('click', async (e) => {
    e.preventDefault();
    await app.login(userEmail.value, userPassword.value);
    checkUser();
});

checkUser();

app.establishWSConnection(app.room.id ? app.room.id : 'welcome', app.tk.value);

async function checkErrors() {
    const div = document.createElement('div');
    div.classList.add('has-text-danger');
    errorDiv.innerHTML = '';
    const errs = new Set(app.errors);
    for (let error of errs) {
        div.innerHTML = error;
        errorDiv.appendChild(div);
    }
    app.errors = [];
}

setInterval(() => {
    checkErrors();
    try {
        if (app.tk.expires === undefined) {
            app.getTempKey();
        }
        let expire = new Date(app.tk.expires);
        let now = new Date();
        if (expire < now) {
            app.getTempKey();
        }
    } catch (error) {
        app.errors.push("client error...", error.message);
    }
}, 5000);

addMessage.addEventListener('click', (e) => {
    e.preventDefault();
    let val = userMessage.value;
    const out = {
        email: app.user.email,
        user_id: app.user.id,
        room_id: app.roomid,
        message: val,
        time: "",
        reply_to: ''
    }

    sendMessage(`${app.api}/message`, out);
});

userMessage.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        addMessage.click();
    }
});

joinRoom.addEventListener('click', async (e) => {
    e.preventDefault();
    await app.setRoom(userRoom.value);
    box.innerHTML = 'no messages yet';
    roomName.innerHTML = `<h4 class="title is-4 has-text-primary">${app.room.name ? app.room.name : 'upside down'}</h4>`
    if (app.room.messages && app.room.messages.length > 0) {
        for (let m of app.messages) {
            addMessageToBox(m);
        }
    }
    app.establishWSConnection(app.room.id ? app.room.id : 'welcome', app.tk.value);
    app.socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        // console.log("WSM", data);
        addMessageToBox(data);
    }
    userRoom.value = '';
});

roomName.innerHTML = `<h4 class="title is-4 has-text-primary">${app.room.name ? app.room.name : 'upside down'}</h4>`
    
app.socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    // console.log("WSM", data);
    addMessageToBox(data);
};

viewHistory.addEventListener('click', async (e) => {
    e.preventDefault();
    if (app.user.history) {
        for (let h of app.user.history) {
            const div = document.createElement('div');
            div.classList.add('has-text-link-light');
            div.innerHTML = h;
            div.addEventListener('click', async (e) => {
            e.preventDefault();
            box.innerHTML = 'no messages yet';
            await app.setRoom(h);
            roomName.innerHTML = `<h4 class="title is-4 has-text-primary">${app.room.name ? app.room.name : 'upside down'}</h4>`
            if (app.room.messages && app.room.messages.length > 0) {
                for (let m of app.messages) {
                    addMessageToBox(m);
                }
            }
            app.establishWSConnection(app.room.id ? app.room.id : 'welcome', app.tk.value);
            app.socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                // console.log("WSM", data);
                addMessageToBox(data);
            }
            viewHistory.innerHTML = `history`;
            // historyItem.innerHTML = '';
        });
        viewHistory.appendChild(div);
    }
    }
});

addRoom.addEventListener('click', async (e) => {
    e.preventDefault();
    await app.addRoom(userRoom.value);
    userRoom.value = '';
});

userRooms.addEventListener('click', async (e) => {
    e.preventDefault();
    if (app.user.rooms) {
        for (let h of app.user.rooms) {
            const div = document.createElement('div');
            div.classList.add('has-text-link-light');
            div.innerHTML = h;
            div.addEventListener('click', async (e) => {
            e.preventDefault();
            box.innerHTML = 'no messages yet';
            await app.setRoom(h);
            roomName.innerHTML = `<h4 class="title is-4 has-text-primary">${app.room.name ? app.room.name : 'upside down'}</h4>`
            if (app.room.messages && app.room.messages.length > 0) {
                for (let m of app.messages) {
                    addMessageToBox(m);
                }
            }
            app.establishWSConnection(app.room.id ? app.room.id : 'welcome', app.tk.value);
            app.socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                // console.log("WSM", data);
                addMessageToBox(data);
            }
            userRooms.innerHTML = `rooms`;
            // historyItem.innerHTML = '';
        });
        userRooms.appendChild(div);
        }
    }
});

async function sendMessage(url , data) {
    try {
        const resp = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${app.key}`
            },
            body: JSON.stringify(data)
        });
        const status = resp.status;
        if (status === 200) {
            app.messages.push(data);
            userMessage.value = '';
        } else {
            app.errors.push(`Error: ${status} when sending message`);
        }
    } catch (error) {
        app.errors.push("client error...", error.message);
    }
}

function addMessageToBox(data) {
    if (box.innerHTML === 'no messages yet') {
        box.innerHTML = '';
    }
    const out = `<div class="content has-text-info mb-3">
    <span class="has-text-dark"> ${data.time}</span>
    <span class="has-text-link"> ${data.email}</span>
    <p class="has-text-primary content">${data.message}</p>
    </div>`;
    box.innerHTML += out;
}

function checkUser() {
    if (app.user.id) {
        loginScreen.style.display = 'none';
        mainContent.style.display = 'block';
        theFooter.style.display = 'block';
    } else {
        loginScreen.style.display = 'block';
        theFooter.style.display = 'none';
        mainContent.style.display = 'none';
    }
}