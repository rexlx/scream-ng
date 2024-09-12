
// import { dialog } from 'electron';
// import { read, readFile } from 'original-fs';
import { Applcation } from './application.js';
const box = document.getElementById('mainBox');
const errorDiv = document.getElementById('errors');
const app = new Applcation("http://localhost:8080", "thisisadoggertoken");
const userMessage = document.getElementById('userMessage');
const addMessage = document.getElementById('addMessage');
const login = document.getElementById('login');
const loginScreen = document.getElementById('login-screen');
const mainContent = document.getElementById('main-content');
const profileMenu = document.getElementById('profile');
const profileScreen = document.getElementById('profile-screen');
const theFooter = document.getElementById('theFooter');
const roomName = document.getElementById('roomName');
const userRoom = document.getElementById('userRoom');
const joinRoom = document.getElementById('joinRoom');
const userEmail = document.getElementById('username');
const userPassword = document.getElementById('password');
const viewHistory = document.getElementById('viewHistory');
const userRooms = document.getElementById('userRooms');
const addRoom = document.getElementById('addRoom');
const cancelProfile = document.getElementById('cancelProfile');
const loadKeydb = document.getElementById('loadKeydb');

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

addMessage.addEventListener('click', async (e) => {
    e.preventDefault();
    let out = {};
    try {
        let val = userMessage.value;
        let handle = app.user.handle ? app.user.handle : app.user.email;
        out = {
            email: handle,
            user_id: app.user.id,
            room_id: app.roomid,
            message: val,
            time: "",
            reply_to: '',
        }
        if (app.enckeys.length > 0) {
            let x = await app.encrypt(val);
            out.hotsauce = x.key;
            out.message = x.data.data;
            out.iv = x.data.iv;
        }
        // console.log("out", out);
        // let y = app.decrypt(x.data.data, x);
        // console.log("encrypted", y);
        sendMessage(`${app.api}/message`, out);
    } catch (error) {
        app.errors.push("client error...", error.message);
    }
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
        for (let m of app.room.messages) {
            if (m.hotsauce) {
                let y = await app.decrypt(m.message, m);
                m.message = y;
            }
            addMessageToBox(m);
        }
    }
    app.establishWSConnection(app.room.id ? app.room.id : 'welcome', app.tk.value);
    app.socket.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        if (data.hotsauce) {
            let y = await app.decrypt(data.message, data);
            data.message = y;
        }
        // console.log("WSM", data);
        addMessageToBox(data);
    };
    userRoom.value = '';
});

roomName.innerHTML = `<h4 class="title is-4 has-text-primary">${app.room.name ? app.room.name : 'upside down'}</h4>`
    
app.socket.onmessage = async (event) => {
    const data = JSON.parse(event.data);
    if (data.hotsauce) {
        let y = await app.decrypt(data.message, data);
        data.message = y;
    }
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
                for (let m of app.room.messages) {
                    if (m.hotsauce) {
                        let y = await app.decrypt(m.message, m);
                        m.message = y;
                    }
                    addMessageToBox(m);
                }
            }
            app.establishWSConnection(app.room.id ? app.room.id : 'welcome', app.tk.value);
            app.socket.onmessage = async (event) => {
                const data = JSON.parse(event.data);
                if (data.hotsauce) {
                    let y = await app.decrypt(data.message, data);
                    data.message = y;
                }
                // console.log("WSM", data);
                addMessageToBox(data);
            }
            viewHistory.innerHTML = `history`;
            // historyItem.innerHTML = '';
        });
        viewHistory.appendChild(div);
    };
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
                for (let m of app.room.messages) {
                    if (m.hotsauce) {
                        let y = await app.decrypt(m.message, m);
                        m.message = y;
                    }
                    addMessageToBox(m);
                }
            }
            app.establishWSConnection(app.room.id ? app.room.id : 'welcome', app.tk.value);
            app.socket.onmessage = async (event) => {
                const data = JSON.parse(event.data);
                if (data.hotsauce) {
                    let y = await app.decrypt(data.message, data);
                    data.message = y;
                }
                // console.log("WSM", data);
                addMessageToBox(data);
            };
            userRooms.innerHTML = `rooms`;
            // historyItem.innerHTML = '';
        });
        userRooms.appendChild(div);
        }
    }
});

profileMenu.addEventListener('click', (e) => {
    e.preventDefault();
    // const thisUser
    const homeFromProfile = document.getElementById('homeFromProfile');
    const saveProfile = document.getElementById('saveProfile');
    const email = document.getElementById('editEmail');
    const firstName = document.getElementById('firstName');
    const lastName = document.getElementById('lastName');
    const about = document.getElementById('about');
    const viewPosts = document.getElementById('viewPosts');
    const editProfileButton = document.getElementById('editProfile');
    const editProfileColumn = document.getElementById('editProfileColumn');
    const postColumn = document.getElementById('postsColumn');
    const postsItem = document.getElementById('postsItem');
    const addPost = document.getElementById('addPost');
    const thisUser = app.viewingSelf ? app.user : (app.profileUser || app.user);
    // console.log("thisUser", thisUser, app.viewingSelf);
    loginScreen.style.display = 'none';
    editProfileColumn.style.display = 'none';
    postColumn.style.display = 'block';
    profileScreen.style.display = 'block';
    mainContent.style.display = 'none';
    theFooter.style.display = 'none';
    email.value = app.user.email;
    firstName.value = app.user.first_name;
    lastName.value = app.user.last_name;
    about.value = app.user.about;
    if (thisUser.posts) {
        for (let p of thisUser.posts) {
            const article = document.createElement('article');
            article.classList.add('message', 'is-dark');
            const div = document.createElement('div');
            div.classList.add('has-text-link-light', 'message-body');
            div.innerHTML = p.content;
            div.addEventListener('click', async (e) => {
                e.preventDefault();
                box.innerHTML = 'no messages yet';
                await app.setRoom(p.id);
                checkUser();
                roomName.innerHTML = `<h4 class="title is-4 has-text-primary">${app.room.name ? app.room.name : 'upside down'}</h4>`
                if (app.room.messages && app.room.messages.length > 0) {
                    for (let m of app.room.messages) {
                        addMessageToBox(m);
                    }
                }
                app.establishWSConnection(app.room.id ? app.room.id : 'welcome', app.tk.value);
                app.socket.onmessage = async (event) => {
                    const data = JSON.parse(event.data);
                    if (data.hotsauce) {
                        let y = await app.decrypt(data.message, data);
                        data.message = y;
                    }
                    // console.log("WSM", data);
                    addMessageToBox(data);
                };
                viewPosts.innerHTML = `posts`;
                // historyItem.innerHTML = '';
            });
            article.appendChild(div);
            viewPosts.appendChild(article);
        }
    }
    editProfileButton.addEventListener('click', (e) => {
        e.preventDefault();
        if (!app.viewingSelf) {
            return;
        }
        editProfileColumn.style.display = 'block';
        postColumn.style.display = 'none';
        profileScreen.style.display = 'block';
        mainContent.style.display = 'none';
        theFooter.style.display = 'none';

        // you added these lines from just outside the function
        cancelProfile.addEventListener('click', (e) => {
            e.preventDefault();
            postColumn.style.display = 'none';
            editProfileColumn.style.display = 'none';
            checkUser();
        });
        saveProfile.addEventListener('click', async (e) => {
            e.preventDefault();
            const out = {
                email: email.value,
                first_name: firstName.value,
                last_name: lastName.value,
                about: about.value
            }
            await app.updateProfile(out);
            checkUser();
        });
    });

    // posts menu item is clicked
    postsItem.addEventListener('click', async (e) => {
        e.preventDefault();
        editProfileColumn.style.display = 'none';
        postColumn.style.display = 'block';
        profileScreen.style.display = 'block';
        mainContent.style.display = 'none';
        theFooter.style.display = 'none';
        viewPosts.innerHTML = '';
        if (thisUser.posts) {
            for (let p of app.user.posts) {
                const article = document.createElement('article');
                article.classList.add('message', 'is-dark');
                const div = document.createElement('div');
                div.classList.add('has-text-link-light', 'message-body');
                div.innerHTML = p.content;
                div.addEventListener('click', async (e) => {
                    e.preventDefault();
                    box.innerHTML = 'no messages yet';
                    await app.setRoom(p.id);
                    roomName.innerHTML = `<h4 class="title is-4 has-text-primary">${app.room.name ? app.room.name : 'upside down'}</h4>`
                    if (app.room.messages && app.room.messages.length > 0) {
                        for (let m of app.room.messages) {
                            addMessageToBox(m);
                        }
                    }
                    app.establishWSConnection(app.room.id ? app.room.id : 'welcome', app.tk.value);
                    app.socket.onmessage = async (event) => {
                        const data = JSON.parse(event.data);
                        if (data.hotsauce) {
                            let y = await app.decrypt(data.message, data);
                            data.message = y;
                        }
                        // console.log("WSM", data);
                        addMessageToBox(data);
                    };
                    viewPosts.innerHTML = `posts`;
                    // historyItem.innerHTML = '';
                });
                article.appendChild(div);
                viewPosts.appendChild(article);
            }
        }

    });
    const userPost = document.getElementById('userPost');
    addPost.addEventListener('click', async (e) => {
        e.preventDefault();
        const out = {
            content: userPost.value,
            email: app.user.email
        }
        await app.addPost(out);
        userPost.value = '';
        postsItem.click();
    });
        
    homeFromProfile.addEventListener('click', (e) => {
        e.preventDefault();
        checkUser();
    });
});

loadKeydb.addEventListener('click', async (e) => {
    e.preventDefault();
    // electron object defined in preload.js -> ipcRenderer.invoke('dialog', method, config)
    try {
        electron.openDialog('showOpenDialog', {
            properties: ['openFile'],
            filters: [
                { name: 'JSON', extensions: ['json'] },
                { name: 'All Files', extensions: ['*'] }
            ],

        }).then(async(result) => {
            if (!result) {
                app.errors.push("client error...", "cancelled");
                return;
            }
            const path = result.filePaths[0];
            readFile(path).then((data) => {
                // might need to add a try here in the future...
                const blob = new Blob([data], { type: 'application/json' });
                const reader = new FileReader();
                reader.readAsText(blob);
                reader.onload = async (e) => {
                    const text = e.target.result;
                    const obj = JSON.parse(text);
                    if (obj.length > 0) {
                        app.enckeys = obj;
                    }
                };
                reader.onerror = (e) => {
                    app.errors.push("client error...", e.message);
                };
            }).catch((error) => {
                app.errors.push("client error...", error.message);
            });
        }).catch((error) => {
            app.errors.push("client error...", error.message);
        });
    } catch (error) {
        app.errors.push("client error...", error.message);
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
    // const out = `<div class="content has-text-info mb-3">
    // <span class="has-text-dark"> ${data.time}</span>
    // <span class="has-text-link"> ${data.email}</span>
    // <p class="has-text-primary content wrap">${data.message}</p>
    // </div>`;
    const message = document.createElement('div');
    message.classList.add('content', 'has-text-info', 'mb-3');
    message.dataset.id = data.user_id;
    const emailSpan = document.createElement('span');
    emailSpan.classList.add('has-text-link');
    emailSpan.innerHTML = data.email;
    const timeSpan = document.createElement('span');
    timeSpan.classList.add('has-text-dark');
    timeSpan.innerHTML = data.time;
    timeSpan.innerHTML += ' ';
    message.appendChild(timeSpan);
    message.appendChild(emailSpan);
    const p = document.createElement('p');
    p.classList.add('has-text-primary', 'content', 'wrap');
    p.innerHTML = data.message;
    message.appendChild(p);
    emailSpan.addEventListener('click', async (e) => {
        e.preventDefault();
        await app.getUser(data.user_id);
        app.viewingSelf = false;
        profileMenu.click();
    });
    box.appendChild(message);
}

function checkUser() {
    app.viewingSelf = true;
    if (app.user.id) {
        loginScreen.style.display = 'none';
        profileScreen.style.display = 'none';
        mainContent.style.display = 'block';
        theFooter.style.display = 'none';
    } else {
        loginScreen.style.display = 'block';
        profileScreen.style.display = 'none';
        theFooter.style.display = 'block';
        mainContent.style.display = 'none';
    }
}

// function displayPosts() {
    
// }