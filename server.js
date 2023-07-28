const http = require("http");
const express = require("express");
const io = require("socket.io");

const app = express();
const httpServer = http.createServer(app);
const wsServer = io(httpServer, {
    cors: {
        origin: ["https://admin.socket.io", "http://localhost:3000"],
        credentials: true,
    },
});

const socketRooms = {};

wsServer.on("connection", (socket) => {
    socket.on("join_room", (roomName) => {
        socketRooms[socket.id] = roomName;
        socket.join(roomName);
        socket.to(roomName).emit("welcome");
    });

    socket.on("offer", (offer, roomName) => {
        socket.to(roomName).emit("getOffer", offer);
    });
    socket.on("answer", (answer, roomName) => {
        socket.to(roomName).emit("getAnswer", answer);
    });
    socket.on("iceCandidate", (candidate, roomName) => {
        socket.to(roomName).emit("getIceCandidate", candidate);
    });
    socket.on("disconnect", () => {
        const roomName = socketRooms[socket.id];
        socket.to(roomName).emit("exit");
    });
});

httpServer.listen(8080, () => {
    console.log(`connect server port:8080`);
});
