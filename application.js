export class Applcation {
  constructor(api, apiKey) {
    this.socket = {};
    this.connected = false;
    this.api = api;
    this.key = apiKey;
    this.messages = [];
    this.errors = [];
    this.room = {};
    this.roomid = 'welcome';
    this.user = {};
    this.init();
  }
  async login(email, password) {
    try {
      const out = {
        email: email,
        password: password
      }
      const res = await fetch(`${this.api}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.key}`
        },
        body: JSON.stringify(out)
      });
      const status = res.status;
      const data = await res.json();
      if (status === 200) {
        if (data.error) {
          let msg = `login failed: ${data.message}`;
          this.errors.push(msg);
        }
        this.user = data;
      } else {
        this.errors.push('login failed...');
      }
    } catch (error) {
      this.errors.push("login failed", error.message);
    }

  }
  async testConnection() {
    try {
      const resp = await fetch(`${this.api}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.key}`
        }
      });
      const status = resp.status;
      // data = await resp.json();
      if (status === 200) {
        this.connected = true;
      }
      // console.log(status, "easy", this.connected);
    } catch (error) {

      this.errors.push("error testing connection...", error.message);
    }
  }

  establishWSConnection(roomID) {
    this.socket = new WebSocket(`${this.api}/ws/${roomID}`);
  }

  closeWSConnection() {
    this.socket.close();
    this.connected = false;
  }

  async setRoom(room) {
    try {
      const out = {
        email: this.user.email,
        name: room,
        regular: true
      }
      // console.log("setRoom called", out);
      const res = await fetch(`${this.api}/room/${room}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.key}`
        },
        body: JSON.stringify(out)
      });
      const status = res.status;
      const data = await res.json();
      console.log("status", status)
      if (status === 200) {
        // box.innerHTML = '';
        this.room = data;
        this.roomid = data.id;
      } else {
        this.errors.push('room not set (server error)');
      }
      if (this.socket) {
        this.socket.onmesage = null;
        this.socket.close();
      }

      // this.establishWSConnection(this.roomid);
    } catch (error) {
      this.errors.push("error setting room...", error.message);
    }
    // console.log("setRoom done", this.room);
  }
  init() {
    this.testConnection();
  }
}