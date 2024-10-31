export const idlFactory = ({ IDL }) => {
  const Difficulty = IDL.Record({
    'height' : IDL.Nat,
    'mines' : IDL.Nat,
    'width' : IDL.Nat,
  });
  return IDL.Service({
    'getDifficulty' : IDL.Func([IDL.Nat], [Difficulty], ['query']),
    'getHighScore' : IDL.Func([], [IDL.Nat], ['query']),
    'updateHighScore' : IDL.Func([IDL.Nat], [IDL.Nat], []),
  });
};
export const init = ({ IDL }) => { return []; };
