import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Cell {
  'adjacentMines' : bigint,
  'isMine' : boolean,
  'isFlagged' : boolean,
  'isRevealed' : boolean,
}
export interface Difficulty {
  'height' : bigint,
  'mines' : bigint,
  'width' : bigint,
  'basePoints' : bigint,
}
export interface GameState {
  'startTime' : bigint,
  'isGameOver' : boolean,
  'grid' : Array<Array<Cell>>,
  'difficulty' : Difficulty,
  'isFirstClick' : boolean,
  'score' : bigint,
}
export interface _SERVICE {
  'getGameState' : ActorMethod<[], [] | [GameState]>,
  'getHighScore' : ActorMethod<[], bigint>,
  'newGame' : ActorMethod<[bigint], undefined>,
  'revealCell' : ActorMethod<[bigint, bigint], bigint>,
  'toggleFlag' : ActorMethod<[bigint, bigint], boolean>,
  'updateScore' : ActorMethod<[bigint], bigint>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
