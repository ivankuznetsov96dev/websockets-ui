export interface DBModel {
  players: Record<string, { password: string; wins: number }>;
  rooms: Record<string, unknown>;
  games: Record<string, unknown>;
  sockets: Record<string, unknown>;
}