import express from "express";
import cors from "cors";
import { PeerServer } from "peer";
import { Server, Socket } from "socket.io";
import { createServer } from "node:http";
import {
  dataProps,
  onlineUsersProps,
  IMessage,
  IRoomCreate,
  IParticipants,
} from "./Types";
import dotenv from "dotenv";

const app = express();
app.use(cors());
dotenv.config();
// peer server
const peerServer = PeerServer({ port: 9000, path: "/peer" });
const server = createServer(app);
const PORT = process.env.PORT|| 3003;

let onlineUsers: onlineUsersProps = {};
let videoRooms = {};

// using the server object with the constructor of socket.io and config object
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`user connected of id: ${socket.id}`);
  socket.on("user-login", (data: dataProps) => {
    loginEventHandler(socket, data);
  });

  socket.on("chat-message", (data: IMessage) => {
    chatMessageHandler(socket, data);
  });

  socket.on("video-room-create", (data: IRoomCreate) => {
    videoRoomCreateHandler(socket, data);
  });
  socket.on("video-room-join", (data: IRoomCreate) => {
    videoRoomJoinHandler(socket, data);
  });
  socket.on("video-room-leave", (data: IRoomCreate) => {
    videoRoomLeaveHandler(socket, data);
  });

  socket.on("disconnect", () => {  
    disconnectEventHandler(socket);
  });
});

app.get("/", (req, res) => {
  res.send("server is running");
});

server.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`);
});

//handlers

const loginEventHandler = (socket: Socket, data: dataProps) => {
  socket.join("logged-users");
  onlineUsers[socket.id] = {
    username: data.username,
    coords: data.coords,
  };
  io.to("logged-users").emit("online-users", convertOnlineUsersToArray());
  // broadcasting video rooms to all users that are logged in
  broadcastVideoRooms();
};

const chatMessageHandler = (socket: Socket, data: IMessage) => {
  const { receiverSocketId, content, id } = data;
  if (onlineUsers[receiverSocketId]) {
    socket.to(receiverSocketId).emit("chat-message", {
      senderSocketId: socket.id,
      content,
      id,
    });
  }
};

const videoRoomCreateHandler = (socket: Socket, data: IRoomCreate) => {
  const { peerId, newRoomId } = data;
  // adding new room
  videoRooms[newRoomId] = {
    participants: [
      {
        socketId: socket.id,
        username: onlineUsers[socket.id].username,
        peerId,
      },
    ],
  };

  broadcastVideoRooms();
};

const videoRoomJoinHandler = (socket: Socket, data: IRoomCreate) => {
  const { roomId, peerId } = data;
  if (videoRooms[roomId]) {
    videoRooms[roomId].participants.forEach((participant: IParticipants) => {
      socket.to(participant.socketId).emit("video-room-init", {
        newParticipantPeerId: peerId,
      });
    });

    videoRooms[roomId].participants = [
      ...videoRooms[roomId].participants,
      {
        socketId: socket.id,
        username: onlineUsers[socket.id].username,
        peerId,
      },
    ];
    broadcastVideoRooms();
  }
};
export const videoRoomLeaveHandler = (socket: Socket, data: IRoomCreate) => {
  const { roomId } = data;
  if (videoRooms[roomId]) {
    videoRooms[roomId].participants = videoRooms[roomId].participants.filter(
      (participant: IParticipants) => {
        return participant.socketId !== socket.id;
      }
    );
  }
  if (videoRooms[roomId].participants.length > 0) {
    // emit an event to all the participants in the room
    socket
      .to(videoRooms[roomId].participants[0].socketId)
      .emit("video-room-disconnect");
  }
  // delete the room if there are no participants
  if (videoRooms[roomId].participants.length === 0) {
    delete videoRooms[roomId];
  }
  broadcastVideoRooms();
};

const disconnectEventHandler = (socket: Socket) => {
  // add functionality to check if the user is in a room and remove him from the room
  checkIFUserIsInCall(socket);

  //
  console.log(`user disconnected: ${socket.id}`);
  removeOnlineUsers(socket.id);
  broadcastDisconnectUsersDetail(socket.id);
};

//  helper functions

const broadcastDisconnectUsersDetail = (disconnectedUserSocketId: string) => {
  io.to("logged-users").emit("user-disconnected", disconnectedUserSocketId);
};

const broadcastVideoRooms = () => {
  // broadcasting to users that have passed the login event
  io.to("logged-users").emit("video-rooms", videoRooms);
};

const removeOnlineUsers = (id: string) => {
  if (onlineUsers[id]) {
    delete onlineUsers[id];
  }
};

const convertOnlineUsersToArray = () => {
  const onlineUsersArray = [];
  Object.entries(onlineUsers).forEach(([key, value]) => {
    onlineUsersArray.push({
      socketId: key,
      username: value.username,
      coords: value.coords,
    });
  });
  return onlineUsersArray;
};
const checkIFUserIsInCall = (socket: Socket) => {
  Object.entries(videoRooms).forEach(
    ([key, value]: [string, { participants: IParticipants[] }]) => {
      const participant = value.participants.find(
        (p: IParticipants) => p.socketId === socket.id
      );
      if (participant) {
        removeUserFromVideoRoom(socket.id, key);
      }
    }
  );
};

const removeUserFromVideoRoom = (socketId: string, roomId: string) => {
  videoRooms[roomId].participants = videoRooms[roomId].participants.filter(
    (participant: IParticipants) => participant.socketId !== socketId
  );
  // remove the room if there are no participants left in the room
  if (videoRooms[roomId].participants.length === 0) {
    delete videoRooms[roomId];
  } else {
    // if there are participants left in the room inform  him to clear his peer connection
    io.to(videoRooms[roomId].participants[0].socketId).emit(
      "video-room-disconnect"
    );
  }
  broadcastVideoRooms()
};
