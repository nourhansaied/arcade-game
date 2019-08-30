/* Some global variables that might be usefull */

// Settings
var settings = {
    debug: false,
    pause: false,
    colors: {
        0: "green",  // harmless  (not on player's line)
        1: "orange", // dangerous (on player's line, not colliding)
        2: "red"     // colliding (on player's line and colliding)
    }
};

// Define dimensions in game
var colWidth = 101;
var rowHeight = 83;
var tileSize = 83;
var numCols = 5;
var numRows = 6;
var entityWidth = 101;
var entityHeight = 170;
var scoreNow = 0;

// Maximum spawned entities in a row and the minimal distance inbetween
var spawnMax = 3;
var spawnDistance = colWidth;

// Define boundaries of game board
var boundaryRight = numCols * colWidth;
var boundaryBottom = numRows * tileSize;

// Define initial values
var initialPlayerCol = 2;
var initialPlayerRow = 5;
var minEnemies = 3;
var maxEnemies = 6;
var numEnemies = Math.floor((Math.random() * (maxEnemies-minEnemies)) + 
                 0.5) + minEnemies;

// Enemies our player must avoid
var Enemy = function(id) {
    this.id = id;
    // Variables applied to each of our instances go here

    // Set dimensions
    this.width = entityWidth;
    this.height = entityHeight;

    // The image/sprite for our enemies, this uses
    // a helper we've provided to easily load images
    this.sprite = 'images/enemy-bug.png';

    // Set the enemy's initial values
    this.reset();
};

// Update the enemy's position, required method for game
// Parameter: dt, a time delta between ticks
Enemy.prototype.update = function(dt) {
    // Multiply any movement by the dt parameter and round the
    // result to an integer, which will ensure the game runs at the same
    // speed for all computers and the pixels are aligned at the grid.
    if (this.isMoving) {
        this.x = Math.round(this.x+(dt * this.speed));

        // reset when enemy left the canvas
        if (this.x > boundaryRight) {
            this.reset();
        }
    } else {
        this.spawn();
    }
};

// Draw the enemy on the screen, required method for game
Enemy.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
};

// Reset the enemy to its initial state
Enemy.prototype.reset = function() {
    this.isMoving = false;

    this.row = Math.floor((Math.random() * 3) + 1);

    // Set enemy's location based on column/row
    this.x = -colWidth;
    this.y = this.row * rowHeight;

    // Set enemy's speed based on row
    this.speed = (4-this.row) * 110;

    this.threatLevel = 0;
};

// Try to spawn the enemy on its row, keeping in mind that spawning is
// only possible when:
//  1. the maximum amount of moving enemies (spawnMax) on the same row
//  hasn't been reached yet.
//  2. the minimum distance to its predecessor (spawnDistance) is free
// When spawning is not possible, the enemy will be put on hold.
Enemy.prototype.spawn = function() {
    var spawnedOnSameRow = 0;
    for (var enemy=0; enemy<allEnemies.length; enemy++) {
        // Check all other enemies moving on the same row and count them
        if ((allEnemies[enemy].id != this.id) &&
            (allEnemies[enemy].row == this.row &&
            allEnemies[enemy].isMoving)) {

            if (allEnemies[enemy].x < 0 + spawnDistance) {
                // Not enough space, so no further checking needed
                return;
            }
            // Count enemies already spawned on the same row
            spawnedOnSameRow++;
        }
    }
    // Only spawn when maximum amount of enemies hasn't been reached yet
    if (spawnedOnSameRow < spawnMax) {
        this.isMoving = true;
    }
};

var Player = function() {
    // Set default values
    this.reset();

    // Set dimensions
    this.width = entityWidth;
    this.height = entityHeight;

    // Load the image to this.sprite
    this.sprite = 'images/char-boy.png';
};

Player.prototype.update = function() {
    // Only update coordinates when the player has made a move
    if (this.moved) {
        this.x = this.col * colWidth;
        this.y = this.row * rowHeight;
        this.moved = false;
    }
    // If the player reaches the water the game should be reset by
    // moving the player back to the initial location
    if (this.y === 0) {
        scoreNow += 1;
    document.getElementById("score").innerHTML = scoreNow;
        console.log("Player has reached the water! WINNING!!");
        this.reset();
    }
};

Player.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
};

Player.prototype.handleInput = function(keyCode) {
    /*
     * This method should receive user input and initiate a player-move
     * according to that input, as long as its a legal move.
     * The player cannot move off screen
     */
    switch (keyCode) {
        case "left":
            if (this.x >= colWidth) {
                this.move(keyCode);
            }
            break;
        case "up":
            if (this.y >= rowHeight) {
                this.move(keyCode);
            }
            break;
        case "right":
            if (this.x < boundaryRight-colWidth) {
                this.move(keyCode);
            }
            break;
        case "down":
            if (this.y < boundaryBottom-rowHeight) {
                this.move(keyCode);
            }
            break;
    }
};

// Move player one column/row in the given direction
Player.prototype.move = function(direction) {
    switch (direction) {
        case "left":
            this.col -= 1;
            break;
        case "up":
            this.row -= 1;
            break;
        case "right":
            this.col += 1;
            break;
        case "down":
            this.row += 1;
            break;
    }
    this.moved = true;
};

// Reset the player to its initial state
Player.prototype.reset = function() {
    // Set the player's initial column/row
    this.col = initialPlayerCol;
    this.row = initialPlayerRow;

    // Set location based on column/row
    this.x = this.col * colWidth;
    this.y = this.row * rowHeight;

    this.state = 0;
};

// HUD to project game-status (and for debugging)
var Hud = function() {
    this.intersections = [];
};

Hud.prototype.render = function() {
    if (settings.debug) {
        this.drawBoundingBoxes();
        this.drawIntersections();
    }
};

// This will help understanding the behavior of the algorithms by
// visualizing the data that's being used behind the scenes.
Hud.prototype.drawBoundingBoxes = function() {
    // Draw bounding boxes of the entities
    ctx.strokeStyle = "black";
    ctx.lineWidth = 1;

    allEnemies.forEach(function(e) {
        ctx.strokeStyle = settings.colors[e.threatLevel];
        ctx.strokeRect(e.x, e.y, 101, 170);
    });
    ctx.strokeStyle = "black";
    ctx.strokeRect(player.x, player.y, 101, 170);
};

Hud.prototype.drawIntersections = function() {
    ctx.strokeStyle = "red";
    ctx.lineWidth = 5;

    while (this.intersections.length > 0) {
        var box = this.intersections.shift();
        ctx.strokeRect(box.x, box.y, box.width, box.height);
    }
};

// Now instantiate your objects.
// Place all enemy objects in an array called allEnemies
// Place the player object in a variable called player
var allEnemies = [];
for (var i=0; i<numEnemies; i++) {
    allEnemies.push(new Enemy(i));
}
var player = new Player();

var hud = new Hud();

// This listens for key presses and sends the keys to your
// Player.handleInput() method. You don't need to modify this.
document.addEventListener('keyup', function(e) {
    var allowedKeys = {
        27: 'esc',   // Escape (reset)
        37: 'left',  // ArrowLeft
        38: 'up',    // ArrowUp
        39: 'right', // ArrowRight
        40: 'down',  // ArrowDown
        68: 'd',     // Debug
        80: 'p'      // Pause
    };

    switch (allowedKeys[e.keyCode]) {
        case 'esc':
            player.reset();
            break;
        case 'd':
            settings.debug = !settings.debug;
            console.log("debug: " + (settings.debug ? "on" : "off") );
            break;
        case 'p':
            settings.pause = !settings.pause;
            console.log( (settings.pause ? "paused" : "resumed") );
            break;
        default:
            if (!settings.pause) {
                player.handleInput(allowedKeys[e.keyCode]);
            }
    }
});
