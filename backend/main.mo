import Array "mo:base/Array";
import Nat "mo:base/Nat";
import Time "mo:base/Time";

actor MinesweeperGame {
    type Difficulty = {
        width: Nat;
        height: Nat;
        mines: Nat;
    };

    stable var highScore: Nat = 0;

    let difficulties: [Difficulty] = [
        { width = 9; height = 9; mines = 10 },
        { width = 16; height = 16; mines = 40 },
        { width = 24; height = 24; mines = 99 },
        { width = 30; height = 30; mines = 180 }
    ];

    public query func getDifficulty(difficultyIndex: Nat): async Difficulty {
        difficulties[difficultyIndex]
    };

    public query func getHighScore(): async Nat {
        highScore
    };

    public func updateHighScore(score: Nat): async Nat {
        if (score > highScore) {
            highScore := score;
        };
        highScore
    };
}
