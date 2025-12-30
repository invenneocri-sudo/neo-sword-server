const WebSocket = require("ws");

const PORT = process.env.PORT || 3000;
const wss = new WebSocket.Server({ port: PORT });

let rooms = {};

console.log("🟢 네오크리 서버 시작:", PORT);

wss.on("connection", ws => {

  ws.on("message", msg => {
    let data;
    try {
      data = JSON.parse(msg);
    } catch {
      return;
    }

    // 방 생성
    if (data.type === "createRoom") {
      const roomId = Math.random().toString(36).substring(2, 8);
      rooms[roomId] = {
        players: [],
        bossHp: 90000000
      };
      ws.send(JSON.stringify({
        type: "roomCreated",
        roomId
      }));
    }

    // 방 참가
    if (data.type === "joinRoom") {
      const room = rooms[data.roomId];
      if (!room) {
        ws.send(JSON.stringify({
          type: "error",
          msg: "방이 존재하지 않습니다"
        }));
        return;
      }

      ws.roomId = data.roomId;
      ws.name = data.name || "플레이어";
      ws.trophy = ws.trophy || 0;

      room.players.push(ws);

      broadcast(room, {
        type: "system",
        msg: `${ws.name} 입장 (${room.players.length}명)`
      });
    }

    // 채팅
    if (data.type === "chat") {
      const room = rooms[ws.roomId];
      if (!room) return;

      broadcast(room, {
        type: "chat",
        name: ws.name,
        msg: data.msg
      });
    }

    // PvP 판정 (간단)
    if (data.type === "pvp") {
      const my = data.power + Math.random() * 50;
      const enemy = data.enemyPower + Math.random() * 50;
      const win = my > enemy;

      if (win) ws.trophy++;

      ws.send(JSON.stringify({
        type: "pvpResult",
        result: win ? "승리" : "패배",
        trophy: ws.trophy
      }));
    }

    // 보스 공격
    if (data.type === "bossHit") {
      const room = rooms[ws.roomId];
      if (!room) return;

      room.bossHp -= data.damage;
      if (room.bossHp < 0) room.bossHp = 0;

      broadcast(room, {
        type: "bossUpdate",
        hp: room.bossHp
      });
    }
  });

  ws.on("close", () => {
    const room = rooms[ws.roomId];
    if (!room) return;

    room.players = room.players.filter(p => p !== ws);

    broadcast(room, {
      type: "system",
      msg: `${ws.name} 퇴장`
    });

    if (room.players.length === 0) {
      delete rooms[ws.roomId];
    }
  });
});

function broadcast(room, data) {
  room.players.forEach(p => {
    if (p.readyState === WebSocket.OPEN) {
      p.send(JSON.stringify(data));
    }
  });
}
