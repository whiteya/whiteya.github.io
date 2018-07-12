// TODO pull into sub project
// TODO general project setup, code style, newer javascript features

var GRID_SIZE = 11;

var ColourWars = {};

function toStyleColor(value) {
    var hex = (value & 0xFFFFFF).toString(16);
    return "#" + "0".repeat(6 - hex.length) + hex;
}

function Player(colour, ai) {
    this.colour = colour;
    this.moves = [];
    this.ai = !!ai;
}

Player.prototype.chooseMove = function() {
    var moves = [];
    for (var y = 0; y < GRID_SIZE; y++) {
        for (var x = 0; x < GRID_SIZE; x++) {
            if (isValidMove(x, y, this.colour)) {
                moves.push({x: x, y: y});
            }
        }
    }
    if (moves.length == 0) {
        return false;
    }
    var pos = moves[Math.floor((Math.random() * moves.length))];
    updateSquare(pos.x, pos.y, this.colour);
    return true;
}

function GridSquare() {
    this.colours = [0, 0, 0, 0];
    this.domCell = undefined;
}

GridSquare.prototype.isSquareLocked = function() {
    // Create a sorted copy of this.colours
    var sortedColours = this.colours.slice();
    sortedColours.sort(function(a, b) {return b - a});
    // Check if the max is 2 more than the next max
    return sortedColours[0] - sortedColours[1] >= 2;
}

GridSquare.prototype.valueOf = function() {
    if (this.isSquareLocked()) {
        // Return the square that caused this to be locked
        return ColourWars.colours[this.colours.indexOf(Math.max(...this.colours))];
    }
    // Calculate a weighted average of the colours
    var colour = 0;
    var sum = 0;
    for (var i = 0; i < this.colours.length; i++) {
        colour += ColourWars.colours[i] * this.colours[i];
        sum += this.colours[i];
    }
    if (sum === 0) {
        return colour;
    }
    console.assert(colour / sum <= 0xFFFFFF);
    return 0.5 * colour / sum;
}

GridSquare.prototype.updateSquare = function(colour) {
    this.colours[colour]++;
    if (this.isSquareLocked()) {
        for (var i = 0; i < this.colours.length; i++) {
            this.colours[i] = 0;
        }
        this.colours[colour] = 2;
    }
    if (this.colours[colour] > 5) {
        for (var i = 0; i < this.colours.length; i++) {
            this.colours[i] = 0;
        }
        this.colours[colour] = 2;
    }   
    // Update the style colour
    this.domCell.style.backgroundColor = toStyleColor(this.valueOf());
}

function updateSquare(x, y, colour) {
    ColourWars.grid[y][x].updateSquare(colour);
}

function onGameClick(x, y) {
    return function() {
        // Only 1 player left
        for (var i = 0; i < ColourWars.players.length; i++) {

        }
        // check if players are AI
        var allAi = true;
        for (var i = 0; i < ColourWars.players.length; i++) {
            allAi &= ColourWars.players[i].ai;
        }
        if (!allAi) {
            if (!isValidMove(x, y, ColourWars.player)) {
                return;
            }

            updateSquare(x, y, ColourWars.player);
        }
        //AI moves
        for (var i = 0; i < ColourWars.players.length; i++) {
            if (ColourWars.players[i].ai) {
                ColourWars.players[i].chooseMove();
            }
        }
        updateScores();
    }
}

function isValidMove(x, y, player) {
    if (!(y in ColourWars.grid) || !(x in ColourWars.grid[y]) || ColourWars.grid[y][x]  .isSquareLocked()) {
        return false;
    }
    function checkSquare(x, y) {
        return y in ColourWars.grid && x in ColourWars.grid[y] && ColourWars.grid[y][x].colours[player] > 0;
    }
    return checkSquare(x - 1, y) || 
        checkSquare(x, y - 1) ||
        checkSquare(x + 1, y) ||
        checkSquare(x, y + 1);
}

function createGridReference(sizeX, sizeY, valueGetter) {
    ColourWars.grid = [];
    for (var y = 0; y < sizeY; y++) {
        ColourWars.grid[y] = [];
        for (var x = 0; x < sizeX; x++) {
            ColourWars.grid[y][x] = valueGetter();
        }
    }
}

function createGrid(size) {
    createGridReference(size, size, function() {return new GridSquare()});

    // Create DOM grid
    var table = document.querySelector("#colourwars table");
    var row = document.createElement("tr");
    var cell = document.createElement("th");
    var div = document.createElement("div");
    div.className = "clickable";
    cell.appendChild(div);
    for (var y = 0; y < size; y++) {
        var newRow = row.cloneNode(true);
        for (var x = 0; x < size; x++) {
            var newCell = cell.cloneNode(true);
            ColourWars.grid[y][x].domCell = newCell.querySelector("div");
            newCell.addEventListener("click", onGameClick(x, y), false);
            newRow.appendChild(newCell)
        }
        table.appendChild(newRow);
    }
}

function updateScores() {
    var scores = [];
    for (var y = 0; y < GRID_SIZE; y++) {
        for (var x = 0; x < GRID_SIZE; x++) {
            for (var i = 0; i < ColourWars.grid[y][x].colours.length; i++) {
                if (scores[i] === undefined) {
                    scores[i] = 0;
                }
                scores[i] += ColourWars.grid[y][x].colours[i];
            }
        }
    }
    // Normalize scores
    var max = Math.max(...scores);
    for (var i = 0; i < scores.length; i++) {
        scores[i] /= max;
    }
    for (var i = 0; i < ColourWars.players.length; i++) {
        var div = document.querySelector("#p" + i);
        div.style.width = (scores[i] * 100).toString() + "%";
    }
}

function createScoresDOM() {
    var scores = document.querySelector("#scores");
    for (var i = 0; i < ColourWars.players.length; i++) {
        var div = document.createElement("div");
        div.id = "p" + i;
        div.style.backgroundColor = toStyleColor(ColourWars.colours[i]);
        scores.appendChild(div);
    }
}

window.onload = function() {
    ColourWars.colours = [0xFF0000, 0xFFD300, 0x3A00F3, 0x00F700];
    ColourWars.player = 3;
    ColourWars.players = [new Player(0, true), new Player(1, true), new Player(2, true), new Player(3, false)];
    // Set up the grid
    createGrid(GRID_SIZE);

    createScoresDOM();

    // Add the starting squares
    var max = GRID_SIZE - 1;
    var half = max / 2;
    for (var i = 0; i < 2; i++) {
        updateSquare(0, half, 0);
        updateSquare(half, max, 1);
        updateSquare(max, half, 2);
        updateSquare(half, 0, 3);
    }
}
