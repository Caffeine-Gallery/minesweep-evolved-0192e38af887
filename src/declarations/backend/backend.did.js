export const idlFactory = ({ IDL }) => {
  const Cell = IDL.Record({
    'adjacentMines' : IDL.Nat,
    'isMine' : IDL.Bool,
    'isFlagged' : IDL.Bool,
    'isRevealed' : IDL.Bool,
  });
  const Difficulty = IDL.Record({
    'height' : IDL.Nat,
    'mines' : IDL.Nat,
    'width' : IDL.Nat,
    'basePoints' : IDL.Nat,
  });
  const GameState = IDL.Record({
    'startTime' : IDL.Int,
    'isGameOver' : IDL.Bool,
    'grid' : IDL.Vec(IDL.Vec(Cell)),
    'difficulty' : Difficulty,
    'isFirstClick' : IDL.Bool,
    'score' : IDL.Nat,
  });
  return IDL.Service({
    'getGameState' : IDL.Func([], [IDL.Opt(GameState)], ['query']),
    'getHighScore' : IDL.Func([], [IDL.Nat], ['query']),
    'newGame' : IDL.Func([IDL.Nat], [], []),
    'revealCell' : IDL.Func([IDL.Nat, IDL.Nat], [IDL.Nat], []),
    'toggleFlag' : IDL.Func([IDL.Nat, IDL.Nat], [IDL.Bool], []),
    'updateScore' : IDL.Func([IDL.Nat], [IDL.Nat], []),
  });
};
export const init = ({ IDL }) => { return []; };
