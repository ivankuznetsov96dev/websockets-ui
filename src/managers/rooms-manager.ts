import { DB } from "../db/db";

export class RoomsManager {
  static createRoom(creatorName: string): string {
    const id = Date.now().toString() + '_' + Math.floor(Math.random() * 1000);
    DB.rooms[id] = {
      roomId: id,
      players: [creatorName],
      gameId: null
    };

    return id;
  }

  static addUserToRoom(roomId: string, playerName: string): number | void {
    const room = DB.rooms[roomId];
    if (!room) {
      throw new Error('Room not found');
    }

    if (room.players.includes(playerName)) {
      return;
    }

    room.players.push(playerName);

    return room.players.length;
  }

  static getPublicRoomsForUpdate() {
    const test = Object.values(DB.rooms)
      .filter(rooms => rooms.players.length === 1)
      .map((rooms) => ({ 
        roomId: rooms.roomId, 
        roomUsers: rooms.players.map(name => ({name, index: name})) 
      }));

    return test;
  }

  static removeRoom(roomId: string): void {
    delete DB.rooms[roomId];
  }
}