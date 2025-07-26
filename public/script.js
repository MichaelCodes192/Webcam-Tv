const socket = io();
const peers = {};
let myStream;
let myName = '';

function joinChat() {
  const first = document.getElementById('firstName').value.trim();
  const last = document.getElementById('lastName').value.trim();
  if (!first || !last) return alert('Please enter your full name.');
  myName = `${first} ${last}`;
  document.getElementById('namePrompt').hidden = true;
  document.getElementById('main').hidden = false;

  navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
    myStream = stream;
    addVideoStream(stream, 'Me');

    socket.emit('join-room', 'mainRoom', myName);

    socket.on('user-connected', (userId, name) => {
      const peer = createPeer(userId, stream);
      peers[userId] = { peer, name };
    });

    socket.on('signal', data => {
      if (!peers[data.from]) {
        const peer = createPeer(data.from, stream, false);
        peers[data.from] = { peer, name: data.name };
      }
      peers[data.from].peer.signal(data.signal);
    });

    socket.on('user-disconnected', id => {
      if (peers[id]) {
        peers[id].peer.destroy();
        document.getElementById(id)?.remove();
        delete peers[id];
      }
    });
  });

  socket.on('createMessage', (msg, name) => {
    const li = document.createElement('li');
    li.textContent = `${name}: ${msg}`;
    document.getElementById('messages').appendChild(li);
  });

  document.getElementById('chat-form').addEventListener('submit', e => {
    e.preventDefault();
    const msg = document.getElementById('chat-input').value;
    if (msg) {
      socket.emit('message', msg);
      document.getElementById('chat-input').value = '';
    }
  });
}

function createPeer(id, stream, initiator = true) {
  const peer = new SimplePeer({ initiator, trickle: false, stream });
  peer.on('signal', signal => {
    socket.emit('signal', { to: id, signal });
  });
  peer.on('stream', userStream => {
    addVideoStream(userStream, peers[id]?.name || 'User', id);
  });
  return peer;
}

function addVideoStream(stream, name, id = '') {
  const video = document.createElement('video');
  video.srcObject = stream;
  video.autoplay = true;
  video.playsInline = true;
  video.id = id;
  const container = document.createElement('div');
  const label = document.createElement('div');
  label.textContent = name;
  label.style.textAlign = 'center';
  label.style.fontSize = '14px';
  label.style.marginBottom = '4px';
  container.appendChild(label);
  container.appendChild(video);
  document.getElementById('video-grid').appendChild(container);
}
