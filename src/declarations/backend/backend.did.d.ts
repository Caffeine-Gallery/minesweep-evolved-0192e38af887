import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Difficulty {
  'height' : bigint,
  'mines' : bigint,
  'width' : bigint,
}
export interface _SERVICE {
  'getDifficulty' : ActorMethod<[bigint], Difficulty>,
  'getHighScore' : ActorMethod<[], bigint>,
  'updateHighScore' : ActorMethod<[bigint], bigint>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
