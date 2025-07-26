const socket = io();

let localStream;
let peerConnection;
const config = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

document.getElementById('joinBtn').onclick = async () => {
  const first = document.getElementById('first').value.trim();
  const last = document.getElementById('last').value.trim();
  const name = `${first} ${last}`;
  if (!first || !last) return alert('Enter both names');

  document.getElementById('namePrompt').style.display = 'none';
  document.getElementById('main').style.display = 'block';

  socket.emit('join', name);

  const video = document.getElementById('localVideo');
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  video.srcObject = localStream;

  startConnection();
};

function sendMessage() {
  const msg = document.getElementById('msgInput').value;
  if (msg) {
    socket.emit('chat', msg);
    document.getElementById('msgInput').value = '';
  }
}

socket.on('chat', ({ name, msg }) => {
  const m = document.createElement('div');
  m.textContent = `${name}: ${msg}`;
  document.getElementById('messages').appendChild(m);
});

socket.on('message', (msg) => {
  const m = document.createElement('div');
  m.style.fontStyle = 'italic';
  m.textContent = msg;
  document.getElementById('messages').appendChild(m);
});

// WebRTC
function startConnection() {
  peerConnection = new RTCPeerConnection(config);
  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

  peerConnection.onicecandidate = ({ candidate }) => {
    if (candidate) socket.emit('ice-candidate', candidate);
  };

  peerConnection.ontrack = (event) => {
    document.getElementById('remoteVideo').srcObject = event.streams[0];
  };

  peerConnection.createOffer()
    .then(offer => {
      peerConnection.setLocalDescription(offer);
      socket.emit('video-offer', offer);
    });
}

socket.on('video-offer', async (offer) => {
  if (!peerConnection) startConnection();

  await peerConnection.setRemoteDescription(offer);
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.emit('video-answer', answer);
});

socket.on('video-answer', async (answer) => {
  await peerConnection.setRemoteDescription(answer);
});

socket.on('ice-candidate', async (candidate) => {
  try {
    await peerConnection.addIceCandidate(candidate);
  } catch (e) {
    console.error('Error adding ICE candidate', e);
  }
});
