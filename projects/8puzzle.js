// Photo credit: https://www.google.com/url?sa=i&url=https%3A%2F%2Fcommons.wikimedia.org%2Fwiki%2FFile%3AGrandtetonnational_park59887215.jpg&psig=AOvVaw2B1UINiA_5QoTcenLah8qZ&ust=1727133173544000&source=images&cd=vfe&opi=89978449&ved=0CBcQjhxqFwoTCJDUjs7W14gDFQAAAAAdAAAAABAE

const CANVAS_WIDTH  = 400;
const CANVAS_HEIGHT = 400;

let orig_img;
let piece_imgs = [];
const goal_order = [0, 1, 2, 3, 4, 5, 6, 7, 8];
let piece_order = [...goal_order];

let neighbors = [-3, -1, 1, 3];

let swapping = false;
let swap_vec;
let swap_start;
const swap_duration = 10;

let solving = false;
let solve_moves = [];

function arrayEq(a1, a2) {
    if (a1.length != a2.length) return false;

    for (let i = 0; i < a1.length; i++) {
        if (a1[i] != a2[i]) return false;
    }
    return true;
}

class GameState {
    constructor(position, cost, parent, move_taken) {
        this.position = position;
        this.cost = cost;
        this.distance = this.cost + this.calculateHeuristic(this.position);
        this.parent = parent;
        this.move_taken = move_taken;
    }

    getMoves() {
        let moves = [];
        let empty_i = this.position.findIndex((n) => n == 8);
        for (let i = 0; i < neighbors.length; i++) {
            let array_index = empty_i + neighbors[i];
            if (array_index < 0 || array_index >= 9) continue;
            if (array_index == 3 && empty_i == 2) continue;
            if (array_index == 2 && empty_i == 3) continue;
            if (array_index == 5 && empty_i == 6) continue;
            if (array_index == 6 && empty_i == 5) continue;
            moves.push(createVector(array_index, empty_i));
        }

        return moves;
    }

    generatePosition(move) {
        let new_position = [...this.position];
        let tmp = new_position[move.x];
        new_position[move.x] = new_position[move.y];
        new_position[move.y] = tmp;

        return new GameState(new_position, this.cost + 1, this, move);
    }

    calculateHeuristic() {
        let heur = 0;
        for (let i = 0; i < 9; i++) {
            heur += (this.position[i] % 3) - (i % 3);
            heur += Math.floor(this.position[i] / 3) - Math.floor(i / 3);
        }

        return heur;
    }
}

function shuffleGame() {

    for (var i = piece_order.length - 1; i >= 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = piece_order[i];
        piece_order[i] = piece_order[j];
        piece_order[j] = temp;
    }
}

function preload() {
  orig_img = loadImage("../images/Grandtetonnational_park59887215.jpg");
}


function solve() {
    
    let goal_moves = [];

    let open_list = [new GameState(piece_order, 0, null)];
    let closed_list = [];


    while (open_list.length) {

        open_list = open_list.sort((a, b) => b.distance - a.distance);

        let curr_pos = open_list.pop();

        if (arrayEq(curr_pos.position, goal_order)) {
            
            while (curr_pos.parent) {
                goal_moves.push(curr_pos.move_taken);
                curr_pos = curr_pos.parent;
            }
            break;
        }

        let moves = curr_pos.getMoves();

        for (let i = 0; i < moves.length; i++) {
            let new_position = curr_pos.generatePosition(moves[i]);
            let found = false;
            open_list.forEach((p) => arrayEq(p.position, new_position.position) && (found = true));
            if (found) continue;
            closed_list.forEach((p) => arrayEq(p.position, new_position.position) && (found = true));
            if (found) continue;

            open_list.push(new_position);
        }

        closed_list.push(curr_pos);
    }

    return goal_moves;

}


function makeMove(move) {
    if (swapping) return false;

    console.log(move);

    swapping = true;
    swap_vec = move;
    swap_start = frameCount;
    return true;
}


function setup() {
  createCanvas(400, 400);
  frameRate(30);
  
  orig_img.loadPixels();

  let piece_width = Math.floor(orig_img.width / 3);
  let piece_height = Math.floor(orig_img.height / 3);
  for (let i = 0; i < 9; i++) {
    let piece_img = createImage(piece_width, piece_height);
    piece_img.loadPixels();

    for (let y = 0; y < piece_height; y++) {
        for (let x = 0; x < piece_width; x++) {
            let x_orig = x + piece_width * (i % 3);
            let y_orig = y + piece_height * Math.floor(i / 3);
            piece_img.pixels[(x + y * piece_width) * 4 + 0] = orig_img.pixels[(x_orig + y_orig * orig_img.width) * 4 + 0]
            piece_img.pixels[(x + y * piece_width) * 4 + 1] = orig_img.pixels[(x_orig + y_orig * orig_img.width) * 4 + 1]
            piece_img.pixels[(x + y * piece_width) * 4 + 2] = orig_img.pixels[(x_orig + y_orig * orig_img.width) * 4 + 2]
            piece_img.pixels[(x + y * piece_width) * 4 + 3] = 255;
        }
    }

    piece_img.updatePixels();
    piece_imgs.push(piece_img);
  }

  swap_vec = createVector(-1, -1);
}

function mouseClicked() {

    if (mouseY >= 10 && mouseY < 40) {
        if (mouseX >= 50 && mouseX < 150) {
            // Solve button
            console.log("Solve");
            solve_moves = solve();
            console.log(solve_moves);
        }

        if (mouseX >= 250 && mouseX < 350) {
            // Reset button
            piece_order = [...goal_order];
        }
    }


    if (swapping || solve_moves.length) return;

    let gridVec = createVector(Math.floor((mouseX - 50) / 100), Math.floor((mouseY - 50) / 100));

    if (gridVec.x < 0 || gridVec.x >= 3) return;
    if (gridVec.y < 0 || gridVec.y >= 3) return;

    let array_index = gridVec.x + 3 * gridVec.y;

    for (let i = 0; i < neighbors.length; i++) {
        let neighbor_index = array_index + neighbors[i];

        if (neighbor_index < 0) continue;
        if (neighbor_index >= 9) continue;
        if (array_index == 3 && neighbor_index == 2) continue;
        if (array_index == 2 && neighbor_index == 3) continue;
        if (array_index == 5 && neighbor_index == 6) continue;
        if (array_index == 6 && neighbor_index == 5) continue;

        if (piece_order[neighbor_index] != 8) continue;

        makeMove(createVector(array_index, neighbor_index));
        
        break;
    }
}

function draw() {
    background(240);

    noStroke();
    textSize(12);
    fill("#00c738");
    rect(50, 10, 100, 30, 10);

    fill("#006dc7");
    rect(250, 10, 100, 30, 10);

    fill(0);
    textAlign(CENTER, CENTER);
    text("Solve", 100, 25);

    text("Reset", 300, 25);

    textSize(8);
    text("Photo Credit: Grand Teton National Park near Jackson Lake Lodge by Chascar\nhttps://commons.wikimedia.org/wiki/File:Grandtetonnational_park59887215.jpg", 200, 375);

    if (solve_moves.length) {
        let move = solve_moves.pop();
        if (!makeMove(move)) solve_moves.push(move);
    }

    // Draw pieces
    for (let i = 0; i < 9; i++) {

        let x_offset = 50 + 100 * (i % 3);
        let y_offset = 50 + 100 * Math.floor(i / 3);

        if (swapping && i == (swap_vec.x || i == swap_vec.y)) {
            let swap_t = (frameCount - swap_start) / swap_duration;
            if (swap_t >= 1) {
                let tmp = piece_order[swap_vec.x];
                piece_order[swap_vec.x] = piece_order[swap_vec.y];
                piece_order[swap_vec.y] = tmp;

                swap_vec = createVector(-1, -1);
                swapping = false;
            } else {
                let swap_to = (i == swap_vec.x) ? swap_vec.y : swap_vec.x;
                let target_x = 50 + 100 * (swap_to % 3);
                let target_y = 50 + 100 * Math.floor(swap_to / 3);
                x_offset += (target_x - x_offset) * swap_t;
                y_offset += (target_y - y_offset) * swap_t;
            }

        }

        if (piece_order[i] == 8) continue;
        let img = piece_imgs[piece_order[i]];
        img.resize(100, 100)
        image(img, x_offset, y_offset);
    }

}