

const game_container = document.querySelector("#level-app")

const grid_unit_size = 24;
const grid_units_w = 40;
const grid_units_h = 30;
const game_port_width = grid_unit_size * grid_units_w;
const game_port_height = grid_unit_size * grid_units_h;
const start_game_btn = document.querySelector("#start-game");


let block_list = []
let unique_block_count = 0;
let game_playing = false;
let game_interval = false;


function get_unique_id() {
    id = unique_block_count;
    unique_block_count++;
    return id;
}

class Block {
    constructor(
        grid_x,
        grid_y,
        width,
        height,
        color,
        bouncy = false,
        causes_damage = false,
    ) {
        this.grid_x = grid_x
        this.grid_y = grid_y
        this.width = width
        this.height = height
        this.color = color
        this.bouncy = bouncy
        this.causes_damage = causes_damage
        this.element = this.init();
        this.unique_id = get_unique_id();
    }

    init() {
        let el = document.createElement("div");
        el.classList.add("block");

        // set element position on page
        let rect = game_container.getBoundingClientRect();
        let new_pos_x = rect.left + ((this.grid_x - 1) * grid_unit_size);
        let new_pos_y = rect.top + ((this.grid_y - 1) * grid_unit_size);
        el.style.left = new_pos_x + "px";
        el.style.top = new_pos_y + "px";

        // apply color and width/height
        el.style.width = this.width * grid_unit_size + "px";
        el.style.height = this.height * grid_unit_size + "px";
        el.style.backgroundColor = this.color;

        // add to DOM
        game_container.appendChild(el);
        return el;
    }

}

let player_block = get_player_block();
let player_starting_pos = {
    x: player_block.element.style.left,
    y: player_block.element.style.top,
}

function get_player_block() {
    const player_blocka = new Block(
        20, 15, 1, 1, "purple"
    )
    player_blocka.element.innerHTML = "Player";
    player_blocka.element.style.zIndex = 10;
    return player_blocka;
}

window.onload = (event) => {



    game_container.addEventListener("click", (e) => {
        document.querySelector("#output-json").style.backgroundColor = "pink";

        let rect = game_container.getBoundingClientRect();
        let mouse_x = e.clientX - rect.left;
        let mouse_y = e.clientY - rect.top;
        let grid_x = Math.ceil(mouse_x / grid_unit_size);
        let grid_y = Math.ceil(mouse_y / grid_unit_size);
        if (!(grid_x == 20 && grid_y == 15)) {
            create_block(grid_x, grid_y);
        }
    })

    start_game_btn.addEventListener("click", (e) => {
        if (!game_playing) {
            game_playing = true;
            start_game_btn.innerHTML = "Stop Game";
            start_game_btn.classList.remove("start-btn");
            start_game_btn.classList.add("stop-btn");

            game_interval = setInterval(game_step, 40);

        } else {
            stop_btn();
        }
    })

    document.querySelector("#output-json").addEventListener("click", () => {
        output_json();
        document.querySelector("#output-json").style.backgroundColor = "lime";
    })
    document.querySelector("#input-json").addEventListener("click", () => {
        input_json();
    })

    document.querySelector("#save-to-db").addEventListener("click", () => {
        save_new_to_db();
    })

    document.querySelector("#load-from-db").addEventListener("click", () => {
        load_from_to_db();
    })

    document.querySelector("#update-in-db").addEventListener("click", () => {
        update_in_db();
    })


};

function update_in_db() {
    const level_id = document.querySelector("#level-id").value;
    const level_name = document.querySelector("#level-name").value;
    const author_name = document.querySelector("#author-name").value;

    if (level_id.trim() == "" || level_name.trim() == "" || author_name.trim() == "") {
        document.querySelector("#outmsg").innerHTML = "Error: ensure level name/author/id are not blank";
        return;
    }

    const output_textarea = document.querySelector("#output");
    const input_json = JSON.parse(output_textarea.value);

    fetch(`https://cse341-level-api.onrender.com/levels/${level_id}`, {
        method: 'PUT',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(
            {
                level_name: level_name,
                level_author: author_name,
                level_block_data: input_json.level_block_data,
            }
        )
    })
        .then(response => {
            if (response.status == 204) {
                document.querySelector("#outmsg").innerHTML = "204 success";
            }
        })

}

function load_from_to_db() {
    const level_id = document.querySelector("#level-id").value;

    if (level_id.trim() == "") {
        document.querySelector("#outmsg").innerHTML = "Error: ensure level id is not blank";
        return;
    }

    fetch(`https://cse341-level-api.onrender.com/levels/${level_id}`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
    })
        .then(response => response.json())
        .then(response => {
            document.querySelector("#outmsg").textContent = JSON.stringify(response);
            document.querySelector("#level-name").value = response.level_name;
            document.querySelector("#author-name").value = response.level_author;

            document.querySelector("#output").value = `{
"level_block_data":
    ${JSON.stringify(response.level_block_data, null, 2)}
}`;
            input_json();
        })


}

function save_new_to_db() {
    const level_name = document.querySelector("#level-name").value;
    const author_name = document.querySelector("#author-name").value;

    if (level_name.trim() == "" || author_name.trim() == "") {
        document.querySelector("#outmsg").innerHTML = "Error, ensure level name / author name is not blank";
        return;
    }

    try {
        const output_textarea = document.querySelector("#output");
        const input_json = JSON.parse(output_textarea.value);
        fetch('https://cse341-level-api.onrender.com/levels', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(
                {
                    level_name: level_name,
                    level_author: author_name,
                    level_block_data: input_json.level_block_data,
                }
            )
        })
            .then(response => response.json())
            .then(response => {
                document.querySelector("#outmsg").innerHTML = JSON.stringify(response);
                document.querySelector("#level-id").value = response.insertedId;
            })
    } catch (err) {
        document.querySelector("#outmsg").innerHTML = `Error: Output JSON is probably blank. Err msg: ${err}`;
    }

}

function input_json() {

    // delete all existing blocks
    block_list.forEach((block) => {
        game_container.removeChild(block.element);
    })
    block_list = [];

    // load from json
    const output_textarea = document.querySelector("#output");
    const input_json = JSON.parse(output_textarea.value);
    input_json.level_block_data.forEach((block) => {

        new_block = new Block(
            parseInt(block.grid_x),
            parseInt(block.grid_y),
            parseInt(block.width),
            parseInt(block.height),
            block.color,
            block.bouncy,
            block.causes_damage
        );

        block_list.push(new_block);

    });
}



function output_json() {
    const output_textarea = document.querySelector("#output");
    output_string = `{
"level_block_data":
[
`;

    block_list.forEach((block) => {
        output_string +=
            `   {
        "grid_x": "${block.grid_x}",
        "grid_y": "${block.grid_y}",
        "width": "${block.width}",
        "height": "${block.height}",
        "color": "${block.color}",
        "bouncy": "${block.bouncy}",
        "causes_damage": "${block.causes_damage}"
    },
`
    })
    output_string = output_string.slice(0, -2);
    output_string += `
]
}`;
    output_textarea.value = output_string;
}

function stop_btn() {
    game_playing = false;
    start_game_btn.innerHTML = "Start Game";
    start_game_btn.classList.remove("stop-btn");
    start_game_btn.classList.add("start-btn");

    if (game_interval) {
        clearInterval(game_interval);
    }
    reset_game();
}


function check_collisions() {

}

function check_keyboard_input() {

}


let gravity = 0.6;
let velocity_y = 0;

function reset_game() {
    player_block.element.style.left = player_starting_post.x;
    player_block.element.style.top = player_starting_post.y;
    velocity_y = 0;
}

function game_step() {
    velocity_y += gravity;
    player_block.element.style.top = parseInt(player_block.element.style.top.slice(0, -2)) + velocity_y + "px";

    if (player_block.element.style.top.slice(0, -2) > game_port_height) {
        stop_btn();
    }
}



function create_block(grid_x, grid_y) {
    let block_deleted = false;
    block_list.forEach((block) => {

        if (block.grid_x == grid_x && block.grid_y == grid_y && block_deleted == false) {
            game_container.removeChild(block.element);
            const index = block_list.indexOf(block);
            if (index > -1) {
                block_list.splice(index, 1);
            }

            block_deleted = true;
        }

    })
    if (block_deleted == false) {
        new_block = new Block(
            grid_x,
            grid_y,
            1,
            1,
            document.querySelector("#color").value,
            document.querySelector("#bouncy").checked,
            document.querySelector("#causes-damage").checked
        );

        block_list.push(new_block);
    }
}