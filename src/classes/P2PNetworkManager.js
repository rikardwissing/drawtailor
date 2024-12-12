import { Peer } from "https://esm.sh/peerjs@1.5.4?bundle-deps";
import { elements } from '../elements.js';

export class P2PNetworkManager {
  constructor(onStateUpdate) {
    this.peer = null;
    this.connections = new Map();
    this.isHost = false;
    this.onStateUpdate = onStateUpdate;
    this.peerId = null;
    this.playerName = '';
    this.players = new Map();
  }

  setPlayerName(name) {
    this.playerName = name;
  }

  initialize() {
    this.peer = new Peer();
    this.peer.on("open", (id) => {
      this.peerId = id;
      elements.peerId.textContent = id;
    });

    this.peer.on("connection", (conn) => {
      this.handleNewConnection(conn);
    });
  }

  createRoom() {
    this.isHost = true;
    this.players.set(this.peerId, {
      name: this.playerName,
      isHost: true
    });
    this.broadcastLobbyState();
    return this.peerId;
  }

  joinRoom(hostId) {
    if (hostId === this.peerId) return;

    const conn = this.peer.connect(hostId);
    this.handleNewConnection(conn);
    this.players.set(this.peerId, {
      name: this.playerName,
      isHost: false
    });
  }

  handleNewConnection(conn) {
    conn.on("open", () => {
      this.connections.set(conn.peer, conn);
      
      // Send initial player info
      conn.send({
        type: 'PLAYER_INFO',
        playerId: this.peerId,
        playerName: this.playerName,
        isHost: this.isHost
      });

      conn.on("data", (data) => {
        switch(data.type) {
          case 'PLAYER_INFO':
            this.players.set(data.playerId, {
              name: data.playerName,
              isHost: data.isHost
            });
            this.broadcastLobbyState();
            break;
          case 'LOBBY_STATE':
            if (!this.isHost) {
              this.players = new Map(data.players);
              this.onStateUpdate(data);
            }
            break;
          default:
            this.onStateUpdate(data);
        }
      });
    });

    conn.on("close", () => {
      this.connections.delete(conn.peer);
      this.players.delete(conn.peer);
      this.broadcastLobbyState();
    });
  }

  broadcast(data) {
    this.connections.forEach((conn) => {
      conn.send(data);
    });
  }

  broadcastGameStart() {
    this.broadcast({
      type: 'GAME_START',
      players: Array.from(this.players.entries())
    });
  }

  broadcastLobbyState() {
    this.broadcast({
      type: 'LOBBY_STATE',
      players: Array.from(this.players.entries())
    });
  }

  sendDrawingUpdate(pathData) {
    this.broadcast({
      type: "DRAWING_UPDATE",
      pathData,
      senderId: this.peerId,
    });
  }

  disconnect() {
    this.connections.forEach((conn) => conn.close());
    this.connections.clear();
    if (this.peer) {
      this.peer.destroy();
    }
  }
}
