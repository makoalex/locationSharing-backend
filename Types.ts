export interface RootState {
  map: {
    myLocation: {
      lng: number;
      lat: number;
    };
  };
}
export type dataProps = {
  username: string;
  coords: {
    lng: number;
    lat: number;
  };
};
export type dataUserProps = {
  socketId: string;
  username: string;
  coords: {
    lng: number;
    lat: number;
  };
  myself?: boolean;
};
export type onlineUsersProps = {
  [socketId: string]: {
    username: string;
    coords: {
      lng: number;
      lat: number;
    };
    myself?: boolean;
  };
};

export interface mapState {
  myLocation: { lat: number; lng: number };
  onlineUsers: dataUserProps[];
  cardChosenOption: dataUserProps | null;
}

export interface distanceCoords{
  coord1:mapState["myLocation"],
  coord2:mapState["myLocation"]

}
 export type markerProps={
  coords:mapState["myLocation"],
  lat:number,
  lng:number,
  socketId:string,
  username:string
  myself?:boolean
}
export type userInfoCardProps = {
  username:string,
  socketId:string,
  userLocation:mapState['myLocation']
}

export type labelProps = {
  text: string;
  className: string;
};

export type ChatButtonProps = {
  socketId?: string;
  username?: string;
}
export interface chatState{
  chatBoxes:ChatBoxInterface[]
  chatHistory:Record<string, ISingleMessage[]>
}
export interface ChatBoxInterface extends ChatButtonProps{
  messages?: string[]
}
export interface ISingleMessage{
  socketId?:string,
  id?:string,
  myMessage?:boolean,
  content:string
}
export interface IMessage {
  receiverSocketId: string;
  senderSocketId?: string;
  content: string;
  id: string;

}
// Room
export interface RoomState {
  inRoom: string;
  rooms: string[];
  localStream?: MediaStream | null;
  remoteStream?: MediaStream | null;
  isMicOn?:boolean,
  isCameraOn?:boolean
}
export interface IRoom {
  id: string;
  users: string[];
}

export interface IParticipants {
  socketId: string;
  peerId: string;
  username: string;
  
}
export interface IRoomInfo {
  id: string;
  participants: IParticipants[];
}

export interface IRoomCreate{
  peerId?:string,
  newRoomId?:string
  roomId?:string
}
export interface IRoomToDisplay {
  creatorUsername: string;
  id?: string;
  amountOfParticipants: number;
  participants?: IParticipants[];
  roomId?:string

}