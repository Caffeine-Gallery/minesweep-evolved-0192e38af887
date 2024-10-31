import Bool "mo:base/Bool";

import Array "mo:base/Array";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Option "mo:base/Option";
import Time "mo:base/Time";
import Int "mo:base/Int";
import Blob "mo:base/Blob";

actor MinesweeperGame {
    type Difficulty = {
        width: Nat;
        height: Nat;
        mines: Nat;
        basePoints: Nat;
    };

    type Cell = {
        isMine: Bool;
        isRevealed: Bool;
        isFlagged: Bool;
        adjacentMines: Nat;
    };

    type GameState = {
        grid: [[Cell]];
        difficulty: Difficulty;
        score: Nat;
        startTime: Int;
        isGameOver: Bool;
        isFirstClick: Bool;
    };

    stable var highScore: Nat = 0;

    let difficulties: [Difficulty] = [
        { width = 9; height = 9; mines = 10; basePoints = 100 },
        { width = 16; height = 16; mines = 40; basePoints = 200 },
        { width = 24; height = 24; mines = 99; basePoints = 300 },
        { width = 30; height = 30; mines = 180; basePoints = 500 }
    ];

    var gameState: ?GameState = null;

    public func newGame(difficultyIndex: Nat): async () {
        let difficulty = difficulties[difficultyIndex];
        let emptyGrid = Array.tabulate<[Cell]>(difficulty.height, func (y) {
            Array.tabulate<Cell>(difficulty.width, func (x) {
                {
                    isMine = false;
                    isRevealed = false;
                    isFlagged = false;
                    adjacentMines = 0;
                }
            })
        });

        gameState := ?{
            grid = emptyGrid;
            difficulty = difficulty;
            score = 0;
            startTime = Time.now();
            isGameOver = false;
            isFirstClick = true;
        };
    };

    public query func getGameState(): async ?GameState {
        gameState
    };

    public func revealCell(x: Nat, y: Nat): async Nat {
        switch (gameState) {
            case (null) { return 0 };
            case (?state) {
                if (state.isGameOver) { return 0 };

                if (state.isFirstClick) {
                    gameState := ?placeMines(state, x, y);
                };

                let (newState, revealedCount) = revealCellRecursive(Option.unwrap(gameState), x, y);
                gameState := ?newState;

                if (newState.isGameOver) {
                    return 0;
                } else {
                    return revealedCount;
                }
            };
        };
    };

    public func toggleFlag(x: Nat, y: Nat): async Bool {
        switch (gameState) {
            case (null) { return false };
            case (?state) {
                if (state.isGameOver) { return false };

                let newGrid = Array.tabulate<[Cell]>(state.difficulty.height, func (row) {
                    Array.tabulate<Cell>(state.difficulty.width, func (col) {
                        if (row == y and col == x) {
                            {
                                state.grid[row][col] with
                                isFlagged = not state.grid[row][col].isFlagged
                            }
                        } else {
                            state.grid[row][col]
                        }
                    })
                });

                gameState := ?{ state with grid = newGrid };
                return true;
            };
        };
    };

    public func updateScore(points: Nat): async Nat {
        switch (gameState) {
            case (null) { return 0 };
            case (?state) {
                let newScore = state.score + points;
                gameState := ?{ state with score = newScore };

                if (newScore > highScore) {
                    highScore := newScore;
                };

                return newScore;
            };
        };
    };

    public query func getHighScore(): async Nat {
        highScore
    };

    private func placeMines(state: GameState, firstX: Nat, firstY: Nat): GameState {
        var grid = state.grid;
        var minesPlaced = 0;
        let totalCells = state.difficulty.width * state.difficulty.height;

        // Use current time as seed for pseudo-random number generation
        var seed: Nat = Int.abs(Time.now());

        // Simple Linear Congruential Generator parameters
        let a: Nat = 1664525;
        let c: Nat = 1013904223;
        let m: Nat = 2**32;

        func lcg() : Nat {
            seed := (a * seed + c) % m;
            seed
        };

        while (minesPlaced < state.difficulty.mines) {
            let randomCell = lcg() % totalCells;
            let x = randomCell % state.difficulty.width;
            let y = randomCell / state.difficulty.width;

            if (not grid[y][x].isMine and (x != firstX or y != firstY)) {
                grid := Array.tabulate<[Cell]>(state.difficulty.height, func (row) {
                    Array.tabulate<Cell>(state.difficulty.width, func (col) {
                        if (row == y and col == x) {
                            { grid[row][col] with isMine = true }
                        } else {
                            grid[row][col]
                        }
                    })
                });
                minesPlaced += 1;
            };
        };

        // Calculate adjacent mines
        grid := Array.tabulate<[Cell]>(state.difficulty.height, func (y) {
            Array.tabulate<Cell>(state.difficulty.width, func (x) {
                if (not grid[y][x].isMine) {
                    let count = countAdjacentMines(grid, x, y);
                    { grid[y][x] with adjacentMines = count }
                } else {
                    grid[y][x]
                }
            })
        });

        {
            state with
            grid = grid;
            isFirstClick = false;
        }
    };

    private func revealCellRecursive(state: GameState, x: Nat, y: Nat): (GameState, Nat) {
        var grid = state.grid;
        var revealedCount = 0;

        if (grid[y][x].isRevealed or grid[y][x].isFlagged) {
            return (state, revealedCount);
        };

        grid := Array.tabulate<[Cell]>(state.difficulty.height, func (row) {
            Array.tabulate<Cell>(state.difficulty.width, func (col) {
                if (row == y and col == x) {
                    { grid[row][col] with isRevealed = true }
                } else {
                    grid[row][col]
                }
            })
        });
        revealedCount += 1;

        if (grid[y][x].isMine) {
            return ({state with grid = grid; isGameOver = true}, revealedCount);
        };

        if (grid[y][x].adjacentMines == 0) {
            let directions = [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1)];
            for ((dx, dy) in directions.vals()) {
                let newX = x + dx;
                let newY = y + dy;
                if (newX >= 0 and newX < state.difficulty.width and newY >= 0 and newY < state.difficulty.height) {
                    let (newState, count) = revealCellRecursive({state with grid = grid}, Int.abs(newX), Int.abs(newY));
                    grid := newState.grid;
                    revealedCount += count;
                };
            };
        };

        ({state with grid = grid}, revealedCount)
    };

    private func countAdjacentMines(grid: [[Cell]], x: Nat, y: Nat): Nat {
        var count = 0;
        let directions = [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1)];
        for ((dx, dy) in directions.vals()) {
            let newX = Int.abs(x + dx);
            let newY = Int.abs(y + dy);
            if (newX >= 0 and newX < grid[0].size() and newY >= 0 and newY < grid.size()) {
                if (grid[newY][newX].isMine) {
                    count += 1;
                };
            };
        };
        count
    };
}
