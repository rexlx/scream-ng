export class Applcation {
  constructor(api, apiKey) {
    this.enckeys = [
      {
        "name": "malfunctioning-unapproachability",
        "key": "Em9k8X2SsEDHbC6mF9jwBug8BGfLYC2TR97hzKzCaAY="
      },
      {
        "name": "tegular-peripatopsidae",
        "key": "eOSPDQfRMp+RwOKE4v7TQc5yGgeg2ABQ23pjWg8kWAg="
      },
      {
        "name": "elective-experience",
        "key": "Wh7toVpICwu53zFH7+1PagoveuCK6uquyVfr8TSIwQw="
      },
      {
        "name": "heraldic-epacris",
        "key": "QnyTODU7KLY9taRt7V2sNyRflu97U3LYmnx4uhCsLDM="
      }
    ];
    this.socket = {};
    this.connected = false;
    this.viewingSelf = true;
    this.api = api;
    this.tk = {};
    this.key = apiKey;
    this.messages = {
      "sent": 0
    };
    this.errors = [];
    this.room = {};
    this.roomid = 'welcome';
    this.user = {};
    this.profileUser = {};
    this.init();
  }
  getRandomEncodingKey() {
    return this.enckeys[Math.floor(Math.random() * this.enckeys.length)];
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
  async addPost(out) {
    try {
      const res = await fetch(`${this.api}/addpost`, {
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
        this.user = data;
      } else {
        this.errors.push('post not added...');
      }
    } catch (error) {
      this.errors.push("error adding post...", error.message);
    }
  }
  async updateProfile(out) {
    try {
      const res = await fetch(`${this.api}/profile`, {
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
        console.log("profile updated", data);
        this.user = data;
      } else {
        this.errors.push('profile not updated...');
      }
    } catch (error) {
      this.errors.push("error updating profile...", error.message);
    }
  }
  async getTempKey() {
    try {
      const res = await fetch(`${this.api}/hotsauce`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.key}`
        }
      });
      const status = res.status;
      const data = await res.json();
      if (status === 200) {
        this.tk = data;
        // console.log("temp key", this.tk);
      } else {
        this.errors.push('key not set...');
      }
    }
      catch (error) {
        this.errors.push("error getting temp key...", error.message);
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

  async establishWSConnection(roomID, key) {
    this.socket = new WebSocket(`${this.api}/ws/${roomID}/${key}`);
  }

  closeWSConnection() {
    this.socket.close();
    this.connected = false;
  }
  async updateHistory() {
    try {
      let out = {
        "user_id": this.user.email
      };
      const res = await fetch(`${this.api}/history`, {
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
        // console.log("updateHistory", data, this.user);
        this.user.history = data.history;
      } else {
        this.errors.push('history not set (server error)');
      }
    }
    catch (error) {
      this.errors.push("error updating history...", error.message);
    }
  }
  async addRoom(room) {
    try {
      const out = {
        email: this.user.email,
        name: room,
        regular: true
      }
      const res = await fetch(`${this.api}/addroom`, {
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
        this.user.rooms.push(room)
        console.log("addRoom", data);
      } else {
        this.errors.push('room not set (server error)');
      }
    } catch (error) {
      this.errors.push("error adding room...", error.message);
    }
  }
  async getUser(id) {
    try {
      const res = await fetch(`${this.api}/getuser`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.key}`
        },
        body: JSON.stringify({ user_id: id })
      });
      const status = res.status;
      const data = await res.json();
      if (status === 200) {
        this.profileUser = data;
        console.log("getUser", data);
      } else {
        this.errors.push('user not found...');
      }
    } catch (error) {
      this.errors.push("error getting user...", error.message);
    }
  }
  async setRoom(room) {
    console.log("setRoom called", room);
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
      if (status === 200) {
        // box.innerHTML = '';
        this.room = data;
        this.roomid = data.id;
        this.updateHistory();
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
  async encodeString(str, k) {
    const hotsauce = window.crypto.getRandomValues(new Uint8Array(16));
    const encoder = new TextEncoder();
    const data = encoder.encode(str);

    const cipher = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: hotsauce
      },
      k,
      data
    );
    const encrypted = new Uint8Array(cipher);
    const base64 = btoa(String.fromCharCode(...encrypted));
    return { iv: btoa(String.fromCharCode(...hotsauce)), data: base64 };
  }
  async encrypt(val) {
    const keyPair = this.getRandomEncodingKey();
    const b64NoPadding = keyPair.key.replace(/=/g, "");
    // const keyBytes = new Uint8Array(keyPair.key.match(/[\s\S]/g).map(ch => ch.charCodeAt(0)));
    const keyBytes = Uint8Array.from(atob(b64NoPadding), c => c.charCodeAt(0));
    if (keyBytes.length !== 32) {
      console.log(`Invalid key length for ${keyPair.key}: ${keyBytes.length} bytes`);
      return;
    }
    const secretKey = await window.crypto.subtle.importKey(
      "raw",
      keyBytes,
      { name: "AES-GCM" },
      false,
      ["encrypt", "decrypt"]
    );
    const out = await this.encodeString(val, secretKey);
    return { key: keyPair.name, data: out };
  }
  async decodeString(str, k, iv) {
    const decoder = new TextDecoder();
  const encrypted = new Uint8Array(atob(str).split("").map(c => c.charCodeAt(0)));

  // Decode the Base64 encoded IV
  const ivNoPadding = iv.replace(/=/g, "");
  const ivBytes = new Uint8Array(atob(ivNoPadding).split("").map(c => c.charCodeAt(0)));

  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: ivBytes // Use the correct IV
    },
    k,
    encrypted
  );
  return decoder.decode(decrypted);
  }
  async decrypt(val, key) {
    const keyPair = this.enckeys.find(k => k.name === key.hotsauce);
    if (!keyPair) {
      console.log(`No key found for ${key}`);
      return;
    }
    const b64NoPadding = keyPair.key.replace(/=/g, "");
    const keyBytes = Uint8Array.from(atob(b64NoPadding), c => c.charCodeAt(0));
    if (keyBytes.length !== 32) {
      console.log(`Invalid key length for ${keyPair.key}: ${keyBytes.length} bytes`);
      return;
    }
    const secretKey = await window.crypto.subtle.importKey(
      "raw",
      keyBytes,
      { name: "AES-GCM" },
      false,
      ["encrypt", "decrypt"]
    );
    const out = await this.decodeString(val, secretKey, key.iv);
    return out;
  }
  init() {
    this.testConnection();
    this.getTempKey();
  }
}