const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: process.env.PORT || 10000 });

console.log("🟢 네오크리 서버 시작");

const players = new Map(); // ws → playerData
const queue = []; // 경쟁전 대기열
const rooms = {};

function getRank(trophy){
  if(trophy<10) return "브론즈";
  if(trophy<30) return "실버";
  if(trophy<70) return "골드";
  if(trophy<150) return "프로";
  if(trophy<300) return "다이아";
  return "네오크리";
}

wss.on("connection", ws => {
  players.set(ws,{ trophy:0, rank:"브론즈" });

  ws.on("message", msg => {
    const d = JSON.parse(msg);
    const p = players.get(ws);

    /* PvE 트로피 */
    if(d.type==="pve-clear"){
      p.trophy++;
      p.rank=getRank(p.trophy);
      ws.send(JSON.stringify({
        type:"pve-reward",
        trophy:p.trophy,
        rank:p.rank
      }));
    }

    /* 경쟁전 매칭 */
    if(d.type==="rank-queue"){
      queue.push(ws);
      if(queue.length>=2){
        const a=queue.shift();
        const b=queue.shift();
        a.send(JSON.stringify({type:"rank-start"}));
        b.send(JSON.stringify({type:"rank-start"}));
      }
    }

    /* 경쟁전 결과 */
    if(d.type==="rank-win"){
      p.trophy+=2;
      p.rank=getRank(p.trophy);
      ws.send(JSON.stringify({
        type:"rank-result",
        trophy:p.trophy,
        rank:p.rank
      }));
    }
  });

  ws.on("close",()=>players.delete(ws));
});
