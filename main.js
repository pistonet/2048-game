// use to change the size of the game board,
// 4 in the original game
const GRID_SIZE = 4;

// the drawn size of the game tiles and the gaps between them
const TILE_WIDTH = 100;
const GAP_WIDTH = 10;


// represents a tile on the game board
class Tile {

	constructor(value, x, y) {
		this.value = value;
		this.x = x;
		this.y = y;
		this.previousX = x;
		this.previousY = y;
		// tile is new if it was spawned on this turn
		this.isNew = true;
		// tile is upgraded when another one combines into it
		this.isUpgraded = false;
		// tile is deleted when it combines into another tile
		this.isDeleted = false;
	}

	// moves this tile up
	move(otherTiles) {
		this.isNew = false;
		this.isUpgraded = false;
		this.previousX = this.x;
		this.previousY = this.y;
		this.#move(otherTiles);
	}

	// tiles only know how to move up
	// to move to another direction rotate the tiles
	#move(otherTiles) {
		// only move if not on first row
		if (this.y > 0) {
			// tile (or tiles if they combined) in the position above this one
			const above = otherTiles.filter(t => t !== this && t.x === this.x && t.y === this.y - 1);
			if (above.length === 2) {
				// tiles above just combined
				return;
			} else if (above.length === 0) {
				// free space above
				this.y -= 1;
				this.#move(otherTiles);
			} else if (above[0].value === this.value) {
				// only one tile above and it has the same value
				above[0].upgrade();
				this.y -= 1;
				this.isDeleted = true;
			}
		}
	}

	// returns true if tile actually moved
	get moved() {
		return this.x !== this.previousX || this.y !== this.previousY;
	}

	// upgrades this tile, doubling it's value
	upgrade() {
		this.value *= 2;
		this.isUpgraded = true;
	}

	// rotates clockwise n times
	rotate(n) {
		if (n > 0) {
			[this.previousX, this.previousY] = [(GRID_SIZE - 1) - this.previousY, this.previousX];
			[this.x, this.y] = [(GRID_SIZE - 1) - this.y, this.x];
			this.rotate(n - 1);
		}
	}

}


// an array of all [x,y] coordinates on the board
const allLocations = [];
for (let y = 0; y < GRID_SIZE; y++) {
	for (let x = 0; x < GRID_SIZE; x++) {
		allLocations.push([x,y]);
	}
}

// array containing all the tiles on the current game board
var tiles = [];
// game score
var score = 0;

// returns a new tile in random location that does not contain tile
// if there are no free locations returns undefined
function createRandomTile(previousTiles) {
	let freeLocations = allLocations.filter(l => !previousTiles.some(t => t.x === l[0] && t.y === l[1]));
	if (freeLocations.length === 0) {
		return;
	} else {
		const location = freeLocations[Math.floor(Math.random()*freeLocations.length)];
		const value = Math.random() < 0.9 ? 2 : 4;
		return new Tile(value, location[0], location[1]);
	}
}


// resets score, clear the tiles array and adds 2 new random tiles
function initialize() {
	tiles = [];
	score = 0;
	// add 2 random tiles
	tiles.push(createRandomTile(tiles));
	tiles.push(createRandomTile(tiles));
	// redraw the board
	draw();
}

// draw the background tiles (the "empty squares") into the game board
function drawBackgroundTiles() {

	const game = document.getElementById("game");

	// ensure the game board has the correct dimensions
	game.style["width"] = `${GAP_WIDTH + (TILE_WIDTH+GAP_WIDTH) * GRID_SIZE}px`;
	game.style["height"] = `${GAP_WIDTH + (TILE_WIDTH+GAP_WIDTH) * GRID_SIZE}px`;

	allLocations.forEach(l => {
		// create background tile
		let div = document.createElement("div");
		div.classList.add("background-tile");
		div.style["left"] = `${toDrawnPosition(l[0])}px`;
		div.style["top"] = `${toDrawnPosition(l[1])}px`;

		// render background tiles behind normal tiles
		div.style["z-index"] = "1";

		game.appendChild(div);
	});
}

// takes a coordinate (0 to (SIDE_LENGTH - 1)) and returns the
// corresponding position (x or y coordinate) on the game board
function toDrawnPosition(position) {
	return GAP_WIDTH + position * (TILE_WIDTH + GAP_WIDTH);
}

// defining tile background colours
const colours = {
	2: "#eee4da",
	4: "#ece0c8",
	8: "#f2b179",
	16: "#f59563",
	32: "#f67c5f",
	64: "#f65d3b",
	128: "#edcf72",
	256: "#edcc61",
	512: "#edc850",
	1024: "#edc53f",
	2048: "#edc22e"
};
const gray = "#3c3a32";

// returns gray for the lagrer tiles (4096 ->) not found in colours
function getColour(value) {
	return (colours.hasOwnProperty(value)) ? colours[value] : gray;
}


// function used move the tiles and play the game
function move(direction) {

	const moveAllTiles = () => {
		// before moving, sort tiles in order of rising y-coordinate
		// crucial to move tiles in correct order
		tiles.sort((a,b) => a.y - b.y);
		tiles.forEach(t => t.move(tiles));
	}

	// first filter out tiles that were combined into other tiles on the last turn
	tiles = tiles.filter(t => !t.isDeleted);

	// the tiles only know how to move up so to move to different directions
	// we first rotate the game board so that direction is up
	switch (direction) {
		case 'up':
			moveAllTiles();
			break;
		case 'left':
			tiles.forEach(t => t.rotate(1));
			moveAllTiles();
			tiles.forEach(t => t.rotate(3));
			break;
		case 'down':
			tiles.forEach(t => t.rotate(2));
			moveAllTiles();
			tiles.forEach(t => t.rotate(2));
			break;
		case 'right':
			tiles.forEach(t => t.rotate(3));
			moveAllTiles();
			tiles.forEach(t => t.rotate(1));
			break;
	}

	// only add new random tile if at least one tile on the board actually moved
	if (tiles.some(t => t.moved)) {
		tiles.push(createRandomTile(tiles));
	}

	// increase score after moving
	score += tiles.filter(t => t.isUpgraded).map(t => t.value).reduce((sum, n) => sum + n, 0);
}

// create keybinds for moving the tiles
document.addEventListener('keydown', ev => {
	if (ev.code === "ArrowUp") {
		move("up");
		draw();
	}
	if (ev.code === "ArrowLeft") {
		move("left");
		draw();
	}
	if (ev.code === "ArrowDown") {
		move("down");
		draw();
	}
	if (ev.code === "ArrowRight") {
		move("right");
		draw();
	}
});


// create new stylesheet, this stylesheet contains the animations for sliding tiles
const stylesheet = document.createElement('style');
document.head.appendChild(stylesheet);

function addKeyFrames(name, frames) {
    stylesheet.sheet.insertRule("@keyframes " + name + "{" + frames + "}");
}

function clearKeyFrames() {
    Array.from(stylesheet.sheet.rules).forEach(r => stylesheet.sheet.deleteRule(r));
}


// redraws and animates the game board and score
function draw() {
	const game = document.getElementById("game");

	// redraw score
	document.getElementById("score").innerText = `Score: ${score}`;

	// remove previous tiles
	Array.from(game.getElementsByClassName("tile")).forEach(c => game.removeChild(c));
	// remove previous keyframes
	clearKeyFrames();

	let i = 0;
	tiles.forEach(t => {

		// create tile
		const div = document.createElement("div");
		div.classList.add("tile");
		div.style["left"] = `${toDrawnPosition(t.x)}px`;
		div.style["top"] = `${toDrawnPosition(t.y)}px`;

		// background based on value
		div.style["background-color"] = getColour(t.value);

		// background tiles have z-index 1
		// deleted tiles slide under the tile they combine into
		div.style["z-index"] = (t.isDeleted) ? "2" : "3";

		// animate based on tile type
		div.style["animation-name"] = (t.isNew) ? "spawn" : ((t.isUpgraded) ? "upgrade" : `tile_${i}`);
		div.style["animation-duration"] = (t.isNew) ? "1s" : "0.16s";
		// pulse the tile only after the other tile has slid under it
		div.style["animation-delay"] = (t.isUpgraded) ? "0.10s" : "0s";

		// create custom animation for tile sliding
		addKeyFrames(`tile_${i}`,
			`from {left: ${toDrawnPosition(t.previousX)}px;}` + `to {left: ${toDrawnPosition(t.x)}px;}`
			+ `from {top: ${toDrawnPosition(t.previousY)}px;}` + `to {top: ${toDrawnPosition(t.y)}px;}`
		);

		// create label
		const p = document.createElement("p");
		p.classList.add("value");
		// values 2 and 4 have a dark font, all others have a light font
		p.style["color"] = (t.value <= 4) ? "#776e65" : "#f9f6f2";
		p.innerText = t.value;
		div.appendChild(p);
		game.appendChild(div);
		i++;
	});
}


