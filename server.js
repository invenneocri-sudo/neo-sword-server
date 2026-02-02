const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// 모든 접속을 허용하는 설정 (CORS)
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// 브라우저로 그냥 접속했을 때 보일 화면
app.get('/', (req, res) => {
    res.send('<h1>OpenWave Pro 서버 작동 중!</h1>');
});

// 실시간 통신 부분
io.on('connection', (socket) => {
    console.log('새로운 친구 접속:', socket.id);

    // 메시지 받기
    socket.on('send_msg', (data) => {
        // 모든 접속자에게 받은 메시지 그대로 전달 (무제한!)
        io.emit('receive_msg', data);
    });

    socket.on('disconnect', () => {
        console.log('친구 나감');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`서버가 포트 ${PORT}에서 달리는 중!`);
});
