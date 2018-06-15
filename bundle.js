(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
class MyDebug {
}
module.exports = MyDebug;

},{}],2:[function(require,module,exports){
class BarIndicator{
  constructor(ctx, min_x, min_y, max_x, max_y){
    this.min_x = min_x;
    this.min_y = min_y;
    this.max_x = max_x;
    this.max_y = max_y;
    this.fill_percent = 1;
    this.ctx = ctx;
  }

  set_fill_percent(percent){
    this.fill_percent = percent;
  }

  render(){
    if(!this.ctx){return;}

    this.ctx.save();

    this.ctx.beginPath();
    this.ctx.rect(
      this.min_x,
      this.min_y,
      this.max_x - this.min_x,
      this.max_y - this.min_y);
    this.ctx.strokeStyle = 'black';
    this.ctx.stroke();
    this.ctx.closePath();

    this.ctx.beginPath();
    this.ctx.fillStyle = 'red';
    this.ctx.rect(
      this.min_x + 1, 
      this.min_y + 1, 
      (this.max_x - this.min_x - 2) * this.fill_percent,
      this.max_y - this.min_y - 2,
    )
    this.ctx.fill();
    this.ctx.closePath();
    this.ctx.restore();
  }
}
module.exports = BarIndicator;

},{}],3:[function(require,module,exports){
var Player = require('./Player.js');

class FuelIndicator{
  constructor(ctx, min_x, min_y, width, height){
    this.ctx = ctx;
    this.min_x = min_x;
    this.min_y = min_y;
    this.width = width;
    this.height = height;
  }

  init_player(player){
    this.player = player;
  }

  render(){
    this.ctx.save();
    // draw number of fuels left in text
    this.ctx.font = "25px Arial";
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = 'bottom';
    let fuel_count = this.player.get_barrels_of_fuels();
    let fuel_count_width = this.ctx.measureText(fuel_count).width;
    this.ctx.fillText(fuel_count, this.min_x, this.min_y + this.height);
    this.ctx.restore();

    // draw border of the fuel bar
    let bar_width = this.width - fuel_count_width;
    let bar_min_x = fuel_count_width + this.min_x;
    let border_width = 1;
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.lineWidth = border_width;
    this.ctx.rect(
      bar_min_x,
      this.min_y,
      bar_width,
      this.height);
    this.ctx.stroke();
    this.ctx.closePath();
    this.ctx.restore();

    // fill the fuel bar with correct percentage
    let fill_percent = this.player.get_fuel_percent();
    this.ctx.save();
    this.ctx.beginPath();
    switch(this.player.engine_status){
      case Player.ENGINE_STATUS_OK:
        this.ctx.fillStyle = '#fcc12d';
        break;
      case Player.ENGINE_STATUS_REPLACE_FUEL:
        let time_passed = Date.now() - this.player.get_fuel_replacement_start_time();
        fill_percent = time_passed / this.player.get_fuel_replacement_time();
        this.ctx.fillStyle = '#fff2d3';
        break;
    }
    if(fill_percent > 0){
      this.ctx.rect(
        bar_min_x + border_width,
        this.min_y + border_width,
        (bar_width - 2 * border_width) * fill_percent,
        this.height - 2 * border_width
      );
      this.ctx.fill();
    }

    this.ctx.font = "22px Arial";
    this.ctx.textAlign = "left";
    this.ctx.textBaseline = 'hanging';
    switch(this.player.engine_status){
      case Player.ENGINE_STATUS_REPLACE_FUEL:
        this.ctx.fillStyle = 'grey';
        this.ctx.fillText('Refuelling...', bar_min_x + border_width, this.min_y + border_width);
        break;
      case Player.ENGINE_STATUS_NO_FUEL:
        this.ctx.fillStyle = 'red';
        this.ctx.fillText('Out of fuel', bar_min_x + border_width, this.min_y + border_width);
        break;
    }
    this.ctx.closePath();
    this.ctx.restore();
  }

}
module.exports = FuelIndicator;

},{"./Player.js":9}],4:[function(require,module,exports){
var Line = require('../geometry/Line.js');
var GameObject = require('./GameObject.js');

class GameArea{
  constructor(play_area, entries, exits, collision_group, have_border = true){
    this.play_area = play_area;
    this.entries = entries;
    this.exits = exits;
    this.collision_group = collision_group;
    this._objects = [];

    if(have_border){
      var line_top = new Line("x", {"x": play_area.min_x, "y": play_area.min_y}, play_area.max_x - play_area.min_x);
      var line_bottom = new Line("x", {"x": play_area.min_x, "y": play_area.max_y}, play_area.max_x - play_area.min_x);
      var line_left = new Line("y", {"x": play_area.min_x, "y": play_area.min_y}, play_area.max_y - play_area.min_y);
      var line_right = new Line("y", {"x": play_area.max_x, "y": play_area.min_y}, play_area.max_y - play_area.min_y);
      var play_area_borders = [line_top, line_bottom, line_left, line_right];
      var play_area_border_objs = play_area_borders.map(function(line){
        return new GameObject(
          collision_group,
          line,
          {"type": "geometry"},
          false
        )
      });
      for(var i = 0 ; i < play_area_border_objs.length ; i ++){
        this._objects.push(play_area_border_objs[i]);
      }
    }
  }

  clone(){
    var cloned_entries = [];
    this.entries.forEach(function(entry){
      cloned_entries.push(entry);
    });
    var cloned_exits = [];
    this.exits.forEach(function(exit){
      cloned_exits.push(exit.clone());
    });
    var cloned_objects = [];
    this._objects.forEach(function(obj){
      cloned_objects.push(obj);
    });
    var cloned_game_area = new GameArea(this.play_area, cloned_entries, cloned_exits, this.collision_group, this.have_border);
    cloned_game_area.set_game_objects(cloned_objects);
    return cloned_game_area;
  }

  set_level(level){
    this.level = level;
  }

  set_play_area(min_x, min_y, max_x, max_y){
    this.play_area = {
      "min_x": min_x,
      "min_y": min_y,
      "max_x": max_x,
      "max_y": max_y
    }
  }

  add_entry(entry){
    if(this.entries === undefined){
      this.entries = [];
    }
    this.entries.push(entry);
  }

  // exit is a GameObject
  add_exit(exit){
    if(this.exits === undefined){
      this.exits = [];
    }
    // properties all exits would have:
    exit.display_body.set_strokeStyle('green');
    exit.display_body.set_lineWidth(3);
    exit.set_pass_through();

    this.exits.push(exit);
  }

  set_game_objects(game_objects){
    this._objects = game_objects;
  }

  get_game_objects(){
    return this._objects.concat(this.exits);
  }

  add_object(game_object){
    if(this._objects === undefined){
      this._objects= [];
    }
    this._objects.push(game_object);
  }


  in_game_area(x, y){
    return x < this.play_area.max_x
      && x > this.play_area.min_x
      && y < this.play_area.max_y
      && y > this.play_area.min_y;
  }
}
module.exports = GameArea;

},{"../geometry/Line.js":14,"./GameObject.js":5}],5:[function(require,module,exports){
var Geometry = require('../geometry/Geometry.js');

class GameObject{
  constructor(collision_group, collision_body, display_body, moveable){
    if(GameObject.id_counter === undefined){
      GameObject.id_counter = 1;
    }else{
      GameObject.id_counter += 1;
    }
    this.id = GameObject.id_counter;
    this.collision_group = collision_group;
    this.collision_body = collision_body;
    //if(display_body.type == "geometry"){
      //this.display_body = display_body;
    //}else{
    // TODO: should I keep display body separate from collision body?
    // FIXME: should not always do this:
      this.display_body = collision_body;
    //}
    this.moveable = moveable;
    this.pass_through = false;

    if(collision_body.shape == Geometry.AABB){
      this.x = collision_body.min.x;
      this.y = collision_body.min.y;
    }else if(collision_body.shape == Geometry.CIRCLE){
      this.x = collision_body.center.x;
      this.y = collision_body.center.y;
    }
    this.intersect_with = [];
    this.impulse_resolved_with = [];
    this.a_x = 0;
    this.a_y = 0;
  }

  clone(){
    return new GameObject(this.collision_group, this.collision_body.clone(), undefined, this.moveable);
  }

  set_pass_through(){
    this.pass_through = true;
  }

  get_position(){
    return {'x':this.x, 'y':this.y};
  }

  set_position(x, y){
    this.x = x;
    this.y = y;
    if(this.collision_body.shape == Geometry.AABB){
      this.collision_body.min_x = x;
      this.collision_body.min_y = y;
      this.collision_body.max_x = x + this.collision_body.width;
      this.collision_body.max_y = y + this.collision_body.height;
    }else if(this.collision_body.shape == Geometry.LINE){
      if(this.collision_body.parallel_to == 'x'){
        this.collision_body.pos = y;
      }else{
        this.collision_body.pos = x;
      }
    }else if(this.collision_body.shape == Geometry.CIRCLE){
      this.collision_body.center.x = this.x;
      this.collision_body.center.y = this.y;
    }
  }

  set_velocity(v_x, v_y){
    this.v_x = v_x;
    this.v_y = v_y;
  }

  set_acceleration(a_x, a_y){
    this.a_x = a_x;
    this.a_y = a_y;
  }

  set_impulse_resolve_target(obj){
    if(!this.impulse_resolved_with.includes(obj)){
      this.impulse_resolved_with.push(obj);
    }
  }

  remove_impulse_resolve_target(obj){
    let idx = this.impulse_resolved_with.indexOf((obj));
    if(idx > -1){
      this.impulse_resolved_with.splice(obj, 1);
    }
  }

  impulse_resolved_with_target(obj){
    return this.impulse_resolved_with.includes(obj);
  }

  set_intersection(obj){
    if(!this.intersect_with.includes(obj)){
      this.intersect_with.push(obj);
    }
  }

  remove_intersection(obj){
    let idx = this.intersect_with.indexOf((obj));
    if(idx > -1){
      this.intersect_with.splice(obj, 1);
    }
  }

  clear_intersection(){
    this.intersect_with = [];
  }

  is_intersect_with(obj){
    return this.intersect_with.includes(obj);
  }
  // aabb should have:
  // min: {x: <>, y:<>}
  // max: {x: <>, y:<>}

  // circle should have:
  // center: {x: <>, y:<>}
  // r: <>

  // lines are infinite line, and should have:
  // parallel_to: ['x'|'y']
  // pos: <>


}
module.exports = GameObject;

},{"../geometry/Geometry.js":13}],6:[function(require,module,exports){
var Geometry = require('../geometry/Geometry.js');
var BarIndicator = require('./BarIndicator.js');
var FuelIndicator = require('./FuelIndicator.js');

class HUD{
  constructor(ctx, min_x, min_y, max_x, max_y){
    this.ctx = ctx;
    this.min_x = min_x;
    this.min_y = min_y;
    this.max_x = max_x;
    this.max_y = max_y;
    this._setup_time_indicator();
    this._setup_fuel_indicator();
  }

  clone(){
    return new HUD(this.ctx, this.min_x, this.min_y, this.max_x, this.max_y);
  }

  init_player(player){
    this.player = player;
    this.fuel_bar.init_player(player);
  }

  set_level(level){
    this.level = level;
  }

  _setup_fuel_indicator(){
    var fuel_bar_config = {
      "x": 200,
      "y": 10,
      "width": 200,
      "height": 30
    };
    this.fuel_bar = new FuelIndicator(
      this.ctx,
      this.min_x + fuel_bar_config.x,
      this.min_y + fuel_bar_config.y,
      fuel_bar_config.width,
      fuel_bar_config.height
    );
  }

  _setup_time_indicator(){
    var time_bar_config = {
      "x": 10,
      "y": 10,
      "width": 100,
      "height": 30,
      "border-color": "black",
      "fill-color": "red"
    };
    this.time_bar = new BarIndicator(
      this.ctx,
      this.min_x + time_bar_config.x,
      this.min_y + time_bar_config.y,
      this.min_x + time_bar_config.x + time_bar_config.width,
      this.min_y + time_bar_config.y + time_bar_config.height
    );
  }

  render(){
    let c_time = Date.now();
    let time_percent_left = (this.level.time_limit - (c_time - this.level.start_time))/this.level.time_limit;
    this._render_time_bar(time_percent_left > 0 ? time_percent_left : 0);


    let fuel_percent_left = this.level.player.current_fuel / this.level.player.max_fuel;
    this._render_fuel_bar(fuel_percent_left);
  }

  _render_time_bar(percent = 1){
    this.time_bar.set_fill_percent(percent);
    this.time_bar.render();
  }

  _render_fuel_bar(){
    this.fuel_bar.render();
  }

}

module.exports = HUD;

},{"../geometry/Geometry.js":13,"./BarIndicator.js":2,"./FuelIndicator.js":3}],7:[function(require,module,exports){
var HUD = require('./HUD.js');
var GameArea = require('./GameArea.js');
var MathUtility = require('../math/MathUtility.js');


class Level{
  //this.ctx
  //this.time_limit in seconds
  //this.hud
  //this.game_area
  //this.player

  constructor(ctx, hud, game_area, time_limit, id, fuel_supply){
    this.id = id;
    this.ctx = ctx;
    this.time_limit = time_limit;

    this.hud = hud;
    this.hud.set_level(this);

    this.game_area = game_area;
    this.game_area.set_level(this);

    this.fuel_supply = fuel_supply;
    this.game_status = 'init';
  }

  clone(){
    //TODO: this clone will lose the player in the level
    return new Level(this.ctx, this.hud.clone(), this.game_area.clone(), this.time_limit, this.id, this.fuel_supply);
  }

  init_player(player){
    this.player = player;

    this.player.game_object.set_velocity(1, 1);
    this.game_area.add_object(player.game_object);
    this.player.set_level(this);

    let player_entry = this.game_area.entries[0];
    this.player.game_object.x = player_entry.x;
    this.player.game_object.y = player_entry.y;
    this.player.game_object.set_velocity(player_entry.v_x, player_entry.v_y);

    this.player.add_fuel_barrel(this.fuel_supply);

    this.hud.init_player(this.player);
  }

  start_game(){
    this.start_time = Date.now();
    this.game_status = 'started';
  }

  // 1: win
  // -1: lost
  // 0: otherwise
  check_game_end(){
    if(this.game_status == 'started'){
      if((!this.game_area.in_game_area(this.player.game_object.x, this.player.game_object.y) 
        || Date.now() - this.start_time > this.time_limit)){
        this.game_status = 'lost';
      }else if(this.player.game_object.is_intersect_with(this.game_area.exits[0])) {
        this.game_status = 'win';
      }
    }
  }

  end_game(){
    this.player.clear_intersection();
    var tmp_player = this.player;
    this.player = undefined;
    this.ctx = undefined;
    this.ctx = undefined;
    this.time_limit = undefined;
    this.hud = undefined;
    this.game_area = undefined;
    this.game_status = 'ended';
    return tmp_player;
  }
}

module.exports = Level;

},{"../math/MathUtility.js":16,"./GameArea.js":4,"./HUD.js":6}],8:[function(require,module,exports){
var GameObject = require('./GameObject.js');
var HUD = require('./HUD.js');
var GameArea= require('./GameArea.js');
var Level = require('./Level.js');

var Circle = require('../geometry/Circle.js');
var AABB = require('../geometry/AABB.js');
var Line = require('../geometry/Line.js');

var ImpluseResolver = require('../physics/ImpluseResolver.js');
var CollisionDetector = require('../physics/CollisionDetector.js');

class LevelLoader{

  static get_levels(ctx, canvas_width, canvas_height){
    var levels = [];
    levels.push(LevelLoader._load_level_0(0, ctx, canvas_width, canvas_height));
    levels.push(LevelLoader._load_level_1(1, ctx, canvas_width, canvas_height));
    levels.push(LevelLoader._load_level_2(2, ctx, canvas_width, canvas_height));
    return levels;
  }

  static _load_level_0(id, ctx, width, height){
    var game_area = new GameArea(
      {"min_x":0,
        "min_y":0,
        "max_x":600,
        "max_y":600},
      [{"x": 30, "y": 300, "v_x": 0.1, "v_y": 0}],
      [],
      CollisionDetector.C_GROUP1
    );
    var exit_circle = new Circle(500, 300, 10);
    var exit_obj = new GameObject(CollisionDetector.C_GROUP1, exit_circle, undefined, false);
    game_area.add_exit(exit_obj);

    var hud = new HUD(ctx, 0, 600, 600, 680);

    var level = new Level(ctx, hud, game_area, 10000, id, 1);
    return level;
  }

  static _load_level_1(id, ctx, width, height){
    var game_area = new GameArea(
      {"min_x":0,
        "min_y":0,
        "max_x":600,
        "max_y":600},
      [{"x": 30, "y": 300, "v_x": 0, "v_y": 0}],
      [],
      CollisionDetector.C_GROUP1
    );
    var exit_circle = new Circle(500, 300, 10);
    var exit_obj = new GameObject(CollisionDetector.C_GROUP1, exit_circle, undefined, false);
    game_area.add_exit(exit_obj);


    let min_x = 290;
    let min_y = 100;
    var block_new = new AABB(min_x, min_y, min_x + 20 , min_y + 400);
    var block_new_aabb = new GameObject(CollisionDetector.C_GROUP1, block_new, block_new, false);
    game_area.add_object(block_new_aabb);

    var hud = new HUD(ctx, 0, 600, 600, 680);

    var level = new Level(ctx, hud, game_area, 15000, id, 1);
    return level;
  }

  static _load_level_2(id, ctx, width, height){
    var game_area = new GameArea(
      {"min_x":0,
        "min_y":0,
        "max_x":600,
        "max_y":600},
      [{"x": 30, "y": 300, "v_x": 0, "v_y": 0}],
      [],
      CollisionDetector.C_GROUP1,
      false
    );
    var exit_circle = new Circle(500, 300, 10);
    var exit_obj = new GameObject(CollisionDetector.C_GROUP1, exit_circle, undefined, false);
    game_area.add_exit(exit_obj);


    let min_x = 290;
    let min_y = 100;
    var block_new = new AABB(min_x, min_y, min_x + 20 , min_y + 400);
    var block_new_aabb = new GameObject(CollisionDetector.C_GROUP1, block_new, block_new, false);
    game_area.add_object(block_new_aabb);

    var hud = new HUD(ctx, 0, 600, 600, 680);

    var level = new Level(ctx, hud, game_area, 15000, id, 1);
    return level;
  }

}

module.exports = LevelLoader;

},{"../geometry/AABB.js":11,"../geometry/Circle.js":12,"../geometry/Line.js":14,"../physics/CollisionDetector.js":18,"../physics/ImpluseResolver.js":20,"./GameArea.js":4,"./GameObject.js":5,"./HUD.js":6,"./Level.js":7}],9:[function(require,module,exports){
var GameObject = require('./GameObject.js');
const MAX_FUEL = 100;
const ENGINE_STATUS_OK = 'ok';
const ENGINE_STATUS_NO_FUEL = 'no_fuel';
const ENGINE_STATUS_REPLACE_FUEL = 'replacing_fuel';

class Player {
  constructor(game_object){
    this.game_object = game_object;
    // engine_status:
    // ok, no_fuel, replacing_fuel
    this.engine_status = ENGINE_STATUS_OK;
    this.fuel_efficiency = 20;
    this.acceleration = 0.2;
    this.barrels_of_fuels = 0;
    this.current_fuel = 0;
    this.fuel_replacement_time = 3000;
  }

  clone(){
    var cloned_player = new Player(this.game_object.clone());
    cloned_player.set_fuel_efficiency(this.get_fuel_efficiency());
    cloned_player.set_acceleration(this.get_acceleration());
    cloned_player.set_barrels_of_fuels(this.get_barrels_of_fuels());
    cloned_player.set_current_fuel(this.get_current_fuel());
    cloned_player.set_fuel_replacement_time(this.get_fuel_replacement_time());
    return cloned_player;
  }

  set_fuel_efficiency(f){
    this.fuel_efficiency = f;
  }

  get_fuel_efficiency(){
    return this.fuel_efficiency;
  }

  clear_intersection(){
    this.game_object.clear_intersection()
  }

  update(){
    this.check_engine();
  }

  get_fuel_replacement_start_time(){
    return this.fuel_replacement_start;
  }

  get_engine_status(){
    return this.engine_status;
  }

  check_engine(){
    switch(this.engine_status){
      case ENGINE_STATUS_NO_FUEL:
        if(this.barrels_of_fuels > 0){
          this.replace_fuel();
        }
        break;
      case ENGINE_STATUS_REPLACE_FUEL:
        this.try_finish_fuel_replacement();
        break;
      case ENGINE_STATUS_OK:
        if(this.current_fuel < 1){
          if(this.barrels_of_fuels < 1){
            this.engine_status = ENGINE_STATUS_NO_FUEL;
          }else{
            this.replace_fuel();
          }
        }
        break;
    }
  }

  add_fuel_barrel(n){
    this.barrels_of_fuels += n;
  }

  add_fuel_percent(p){
    this.current_fuel += p;
    if(this.current_fuel > MAX_FUEL){
      this.barrels_of_fuels += (this.current_fuel / MAX_FUEL);
      this.current_fuel = this.current_fuel % MAX_FUEL;
    }
  }

  set_current_fuel(f){
    this.current_fuel = f;
  }

  get_current_fuel(){
    return this.current_fuel;
  }

  get_fuel_percent(){
    return this.current_fuel / MAX_FUEL;
  }

  burn_fuel(){
    if(this.engine_status == ENGINE_STATUS_OK
      && this.current_fuel >= this.fuel_efficiency){
      this.current_fuel -= this.fuel_efficiency;
      if(this.current_fuel < 1){
        this.replace_fuel();
      }
      return true;// yes we have fuel was burnt
    }else{
      return false;// no fuel was not burnt
    }
  }

  replace_fuel(){
    if(this.barrels_of_fuels >= 1){
      this.barrels_of_fuels -= 1;
      this.fuel_replacement_start = Date.now();
      this.engine_status = ENGINE_STATUS_REPLACE_FUEL;
    }else{
      this.engine_status = ENGINE_STATUS_NO_FUEL;
    }
  }

  try_finish_fuel_replacement(){
    if(Date.now() - this.fuel_replacement_start 
        >= this.fuel_replacement_time){
      this.current_fuel = MAX_FUEL;
      this.engine_status = ENGINE_STATUS_OK;
      this.fuel_replacement_start = null;
      return true;
    }else{
      return false;
    }
  }

  set_fuel_replacement_time(t){
    this.fuel_replacement_time = t;
  }

  get_fuel_replacement_time(){
    return this.fuel_replacement_time;
  }

  set_barrels_of_fuels(n){
    this.barrels_of_fuels = n;
  }

  get_barrels_of_fuels(){
    return this.barrels_of_fuels;
  }

  set_acceleration(acc){
    this.acceleration = acc;
  }

  get_acceleration(){
    return this.acceleration;
  }

  set_level(level){
    this.level = level;
  }
}
module.exports = Player;
module.exports.ENGINE_STATUS_OK = ENGINE_STATUS_OK;
module.exports.ENGINE_STATUS_NO_FUEL = ENGINE_STATUS_NO_FUEL;
module.exports.ENGINE_STATUS_REPLACE_FUEL = ENGINE_STATUS_REPLACE_FUEL ;

},{"./GameObject.js":5}],10:[function(require,module,exports){
class UserInteractionHandler{

  constructor(level){
    this.level = level;
    this.moves = {
      "ArrowDown": false,
      "ArrowUp": false,
      "ArrowLeft": false,
      "ArrowRight": false
    };
    this.key_up_handler = this.key_up_handler_wrapper();
    this.key_down_handler = this.key_down_handler_wrapper();
  }

  key_up_handler_wrapper(){
    var level = this.level;
    var moves = this.moves;
    var func = function(e){
      this.level = level;
      this.moves = moves;
      if(e.code in moves){
        var player_obj = this.level.player.game_object;
        player_obj.a_x = 0;
        player_obj.a_y = 0;
      }
    }
    return func;
  }

  key_down_handler_wrapper(){
    var level = this.level;
    var moves = this.moves;
    var func = function(e){
      this.level = level;
      this.moves = moves;
      if(e.code in this.moves){
        var player = this.level.player;
        var player_obj = player.game_object;
        if(player.burn_fuel()){
          switch(e.code){
            case "ArrowUp":
              player_obj.a_y -= player.acceleration;
              break;
            case "ArrowDown":
              player_obj.a_y += player.acceleration;
              break;
            case "ArrowLeft":
              player_obj.a_x -= player.acceleration;
              break;
            case "ArrowRight":
              player_obj.a_x += player.acceleration;
              break;
          }
        }
      }else{
        switch(e.code){
          case "KeyR":
            console.log("pressed r, should reload game!");
            this.level.game_status = 'restart';
            break;
          case "Enter":
            console.log("pressed enter, will continue game!");
            if(this.level.game_status == 'win'){
              this.level.game_status = 'continue';
            }
            break;
        }
      }
    }
    return func;
  }

}
module.exports = UserInteractionHandler;

},{}],11:[function(require,module,exports){
var Geometry = require('./Geometry.js');
var CollisionDetector = require('../physics/CollisionDetector.js');
var MyDebug = require('../MyDebug.js');

class AABB extends Geometry{
  constructor(min_x, min_y, max_x, max_y){
    super(Geometry.AABB);
    this.min = {};
    this.min.x = min_x;
    this.min.y = min_y;
    this.max = {};
    this.max.x = max_x;
    this.max.y = max_y;
    this.width = max_x - min_x;
    this.height = max_y - min_y;
  }

  clone(){
    return super.clone(new AABB(this.min_x, this.min_y, this.max_x, this.max_y));
  }
  render(ctx, id=undefined){
    ctx.beginPath();
    ctx.rect(
      this.min.x,
      this.min.y,
      this.max.x - this.min.x,
      this.max.y - this.min.y);
    ctx.stroke();
    if(MyDebug.engine_debug){
      // DEBUG
      if(id){
        ctx.strokeText(id, this.min.x, this.min.y);
      }
    }
    ctx.closePath();
  }
}
module.exports = AABB;

},{"../MyDebug.js":1,"../physics/CollisionDetector.js":18,"./Geometry.js":13}],12:[function(require,module,exports){
var Geometry = require('./Geometry.js');
var CollisionDetector = require('../physics/CollisionDetector.js');
var MyDebug = require('../MyDebug.js');

class Circle extends Geometry{
  constructor(center_x, center_y, radius){
    super(Geometry.CIRCLE);
    this.center = {};
    this.center.x = center_x;
    this.center.y = center_y;
    this.r = radius;
  }
  clone(){
    return super.clone(new Circle(this.center.x, this.center.y, this.r));
  }
  render(ctx, id=undefined){
    ctx.save();
    ctx.beginPath();
    if(this.fillStyle){
      ctx.fillStyle = this.fillStyle;
    }
    if(this.strokeStyle){
      ctx.strokeStyle = this.strokeStyle;
    }
    if(this.lineWidth){
      ctx.lineWidth = this.lineWidth;
    }
    ctx.arc(this.center.x,this.center.y, this.r, 0, 2*Math.PI);
    ctx.stroke();
    if(MyDebug.engine_debug && id){
      // DEBUG
      ctx.font = "40px Arial";
      ctx.strokeText(id, this.center.x, this.center.y);
    }
    ctx.closePath();
    ctx.restore();
  }
}
module.exports = Circle;

},{"../MyDebug.js":1,"../physics/CollisionDetector.js":18,"./Geometry.js":13}],13:[function(require,module,exports){
const LINE = 1;
const AABB = 2;
const CIRCLE = 3;

class Geometry{
  constructor(shape){
    this.shape = shape;
  }
  clone(geometry){
    geometry.set_fillStyle(this.fillStyle);
    geometry.set_strokeStyle(this.strokeStyle);
    geometry.set_lineWidth(this.lineWidth);
    return geometry;
  }
  set_fillStyle(fillStyle){
    this.fillStyle = fillStyle;
  }
  set_strokeStyle(strokeStyle){
    this.strokeStyle = strokeStyle;
  }
  set_lineWidth(lineWidth){
    this.lineWidth = lineWidth;
  }
}

module.exports = Geometry;
module.exports.LINE = LINE;
module.exports.AABB = AABB;
module.exports.CIRCLE = CIRCLE;

},{}],14:[function(require,module,exports){
var Geometry = require('./Geometry.js');
var CollisionDetector = require('../physics/CollisionDetector.js');
var MyDebug = require('../MyDebug.js');

class Line extends Geometry{
  constructor(parallel_to, pos, length){
    super(Geometry.LINE);
    this.body_type = CollisionDetector.C_BODY_LINE;
    this.parallel_to = parallel_to;
    this.pos = pos;
    this.length = length;
  }

  clone(){
    var cloned_line = super.clone(new Line(this.parallel_to, this.pos, this.length));
    return cloned_line;
  }

  render(ctx, id=undefined){
    ctx.beginPath();
    switch(this.parallel_to){
      case 'x':
        ctx.moveTo(this.pos.x, this.pos.y);
        ctx.lineTo(this.length, this.pos.y);
        break;
      case 'y':
        ctx.moveTo(this.pos.x, this.pos.y);
        ctx.lineTo(this.pos.x, this.length);
        break;
    }
    if(MyDebug.engine_debug && id){
      ctx.strokeText(id, this.pos.x, this.pos.y);
    }
    ctx.stroke();
    ctx.closePath();
    ctx.restore();
  }
}
module.exports = Line;

},{"../MyDebug.js":1,"../physics/CollisionDetector.js":18,"./Geometry.js":13}],15:[function(require,module,exports){
var Circle = require('./geometry/Circle.js');
var GameObject = require('./game/GameObject.js');
var ImpluseResolver = require('./physics/ImpluseResolver.js');
var CollisionDetector = require('./physics/CollisionDetector.js');
var UserInteractionHandler = require('./game/UserInteractionHandler.js');
var LevelLoader = require('./game/LevelLoader.js');
var Player = require('./game/Player.js');

var MyDebug = require('./MyDebug.js');
MyDebug.engine_debug = 0;

var canvas = document.getElementById("game_field");
var ctx = canvas.getContext('2d');
canvas.width = 600;
canvas.height = 700;

var detector = new CollisionDetector();
var resolver = new ImpluseResolver();

function physics_engine_step_new(game_objects){
  var collision_pairs = [];
  game_objects.filter(obj => obj.moveable).forEach(function(obj){
    for(var j = 0 ; j < game_objects.length ; j ++){
      if(obj !== game_objects[j] ){
        var contact = detector.can_collide(obj, game_objects[j]);
        if(contact){
          collision_pairs.push([obj, game_objects[j], contact]);
        }
      }
    }
  });

  collision_pairs.forEach(function(c_pair){
    resolver.resolve(c_pair[0], c_pair[1], c_pair[2]);
  });

  var time_slice = 0.1;
  game_objects.filter(obj => obj.moveable).forEach(function(obj){
    let pos = obj.get_position();
    obj.set_position(pos.x + time_slice*obj.v_x, pos.y + time_slice*obj.v_y);
    obj.v_x += time_slice*obj.a_x;
    obj.v_y += time_slice*obj.a_y;
  });
}

var player_body = new Circle(30, 30, 10);
var player_obj = new GameObject(CollisionDetector.C_GROUP1, player_body, player_body, true);
var player = new Player(player_obj);

var current_level_number = 0;
var levels = LevelLoader.get_levels(ctx, canvas.width, canvas.height);
var ui_handler = clone_and_start_level(levels[current_level_number], player);

function clone_and_start_level(level, player){
  var cloned_level = level.clone();
  var cloned_player = player.clone();
  cloned_level.init_player(cloned_player);
  var ui_handler = new UserInteractionHandler(cloned_level);
  return ui_handler;
}

function mainLoopNew(){
  // start the game
  if(!ui_handler.level.start_time){
    console.log('starting level:' + current_level_number);
    console.log('level id is:' + ui_handler.level.id);
    document.addEventListener("keydown", ui_handler.key_down_handler, false);
    document.addEventListener("keyup", ui_handler.key_up_handler, false);
    ui_handler.level.start_game();
  }
  if(ui_handler.level.game_status == 'started'){
    for(var i = 0 ; i < 10 ; i ++){
      physics_engine_step_new(ui_handler.level.game_area.get_game_objects());
    }
    ui_handler.level.player.update();
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ui_handler.level.game_area.get_game_objects().forEach(function(obj){
      obj.display_body.render(ctx, obj.id);
    });
    ui_handler.level.hud.render();
    ctx.restore();
  }

  ui_handler.level.check_game_end();
  let game_end_status = ui_handler.level.game_status;
  if(game_end_status == 'win'){
    console.log('game won')
    ctx.save();
    ctx.font = "30px Arial";
    ctx.fillStyle = 'green';
    ctx.fillText("You win! Press Enter to play next level.", 10, 100);
    ctx.restore();
  }else if(game_end_status == 'restart'){
    console.log('restarting level');
    document.removeEventListener("keydown", ui_handler.key_down_handler, false);
    document.removeEventListener("keyup", ui_handler.key_up_handler, false);
    // start next level
    ui_handler = clone_and_start_level(levels[current_level_number], player);
  }else if(game_end_status == 'continue'){
    if(levels.length > current_level_number + 1){
      console.log('game ends, have more level, load next level');
      document.removeEventListener("keydown", ui_handler.key_down_handler, false);
      document.removeEventListener("keyup", ui_handler.key_up_handler, false);
      current_level_number ++;
      player = ui_handler.level.end_game();
      // start next level
      ui_handler = clone_and_start_level(levels[current_level_number], player);
    }else{
      console.log('game ends, no more level');
    }
  }else if(game_end_status == 'lost'){
    console.log('game lost')
    ctx.save();
    ctx.font = "30px Arial";
    ctx.fillStyle = 'red';
    ctx.fillText("You lost... Press r to replay this level.", 10, 100);
    ctx.restore();
  }
}

console.log('start!');
setInterval(mainLoopNew, 10);

},{"./MyDebug.js":1,"./game/GameObject.js":5,"./game/LevelLoader.js":8,"./game/Player.js":9,"./game/UserInteractionHandler.js":10,"./geometry/Circle.js":12,"./physics/CollisionDetector.js":18,"./physics/ImpluseResolver.js":20}],16:[function(require,module,exports){
class MathUtility{

  static distance(x1, y1, x2, y2){
    return Math.sqrt(
      Math.pow(x1 - x2, 2)
      + Math.pow(y1 - y2, 2)
    );
  }

  static distance_square(x1, y1, x2, y2){
    let x_sub = x1 - x2;
    let y_sub = y1 - y2;
    return x_sub * x_sub + y_sub * y_sub;
  }

  // return x  when min < x < max, other wise return which ever is closer to x from (min, max)
  static clamp(x, min, max){
    return x < min ? min : x > max ? max : x;
  }

}
module.exports = MathUtility;

},{}],17:[function(require,module,exports){
class Vector{
  constructor(x, y){
    this.x = x;
    this.y = y;
  }

  clone(){
    return new Vector(this.x, this.y);
  }

  rotate_clockwise_90(){
    return new Vector(- this.y, this.x);
  }

  magnitude(){
    return Math.sqrt(this.x*this.x + this.y*this.y);
  }

  dot_product(v){
    return this.x * v.x + this.y * v.y;
  }
}

module.exports = Vector;

},{}],18:[function(require,module,exports){
var ImpluseResolver = require('./ImpluseResolver.js');
var Contact = require('./Contact.js');

var Geometry = require('../geometry/Geometry.js');

var MathUtility = require('../math/MathUtility.js');

var MyDebug = require('../MyDebug.js');

const COLLISION_GROUPS = [0x0,
  0x1, 0x2, 0x4, 0x8]
//0x10, 0x20, 0x40, 0x80,
//0x100, 0x200, 0x400, 0x800,
//0x1000, 0x2000, 0x4000, 0x8000];
const NO_COLLISION = COLLISION_GROUPS[0];
const C_GROUP1 = COLLISION_GROUPS[1];
const C_GROUP2 = COLLISION_GROUPS[2];
const C_GROUP3 = COLLISION_GROUPS[3];
const C_GROUP4 = COLLISION_GROUPS[4];

class CollisionDetector{

  //constructor(){
    //console.log('[CollisionDetector] constructing');
  //}

  can_collide(obj1, obj2){
    let group_can_collide = (obj1.collision_group & obj2.collision_group) > 0;
    if(!group_can_collide) return false;
    if(!obj1.moveable && !obj2.moveable) return false;

    let collision_type = obj1.collision_body.shape + ':' + obj2.collision_body.shape;
    // FIXME: optimize with bit operation, bit comparison should be much faster than string
    let result = undefined;
    switch(collision_type){
      case Geometry.AABB + ':' + Geometry.AABB:
        result = this.aabb_2_aabb_can_collide(obj1, obj2);
        break;
      case Geometry.CIRCLE + ':' + Geometry.CIRCLE:
        result = this.circle_2_circle_can_collide(obj1, obj2);
        break;
      case Geometry.AABB + ':' + Geometry.CIRCLE:
        result = this.circle_2_aabb_can_collide(obj2, obj1);
        break;
      case Geometry.CIRCLE + ':' + Geometry.AABB:
        result = this.circle_2_aabb_can_collide(obj1, obj2);
        break;
      case Geometry.CIRCLE + ':' + Geometry.LINE:
        result = this.circle_2_line_can_collide(obj1, obj2);
        break;
      case Geometry.LINE + ':' + Geometry.CIRCLE:
        result = this.circle_2_line_can_collide(obj2, obj1);
        break;
      case Geometry.AABB + ':' + Geometry.LINE:
        result = this.aabb_2_line_can_collide(obj1, obj2);
        break;
      case Geometry.LINE+ ':' + Geometry.AABB:
        result = this.aabb_2_line_can_collide(obj2, obj1);
        break;
    }
    if(!result){
      obj1.remove_intersection(obj2);
      obj2.remove_intersection(obj1);
      obj1.remove_impulse_resolve_target(obj2);
      obj2.remove_impulse_resolve_target(obj1);
    }else{
      obj1.set_intersection(obj2);
      obj2.set_intersection(obj1);
    }
    return result;
  }

  aabb_2_aabb_can_collide(obj1, obj2){
    let ab1 = obj1.collision_body;
    let ab2 = obj2.collision_body;
    let min1 = ab1.min;
    let max1 = ab1.max;
    let min2 = ab2.min;
    let max2 = ab2.max;
    let result = undefined;
    if((min1.x <= max2.x && max1.x >= min2.x)
      && (min1.y <= max2.y && max1.y >= min2.y)){
      result = new Contact(obj1, obj2);
    }
    return result;
  }

  circle_2_circle_can_collide(obj1, obj2){
    let c1 = obj1.collision_body;
    let c2 = obj2.collision_body;
    let center1 = c1.center;
    let center2 = c2.center;
    let circle_center_distance = MathUtility.distance_square(center1.x, center1.y, center2.x, center2.y);
    let result = undefined;
    if(circle_center_distance <= Math.pow(c1.r + c2.r, 2)){
      result = new Contact(obj1, obj2);
    }
    return result;
  }

  circle_2_aabb_can_collide(obj1, obj2){
    var c = obj1.collision_body;
    var ab = obj2.collision_body;
    let center = c.center;
    let clamp_x = MathUtility.clamp(center.x, ab.min.x, ab.max.x);
    let clamp_y = MathUtility.clamp(center.y, ab.min.y, ab.max.y);
    let result = 0;
    if(Math.abs(center.x - clamp_x) < c.r
      && Math.abs(center.y - clamp_y) < c.r){
      result = {
        'contact_type': 0,
        'contact': {
          'point': {
            'x': clamp_x,
            'y': clamp_y },
          'aligned_axis': ''}};
      if((clamp_x == ab.min.x || clamp_x == ab.max.x)
        &&(clamp_y == ab.min.y || clamp_y == ab.max.y)){
        // point contact with corner
        let center_to_clamp = MathUtility.distance_square(
          clamp_x,
          clamp_y,
          c.center.x,
          c.center.y);
        if( center_to_clamp <= c.r*c.r){
          result['contact_type'] = Contact.CONTACT_CIRCLE_2_POINT;
        }else{
          // collision didn't happen
          result = 0;
        }
      }
      else if(clamp_x == ab.min.x || clamp_x == ab.max.x){
        // collision on y axis
        result['contact_type'] = Contact.CONTACT_CIRCLE_2_AB_LINE;
        result['contact']['aligned_axis'] = 'y';
      }else if(clamp_y == ab.min.y || clamp_y == ab.max.y){
        // collision on x axis
        result['contact_type'] = Contact.CONTACT_CIRCLE_2_AB_LINE;
        result['contact']['aligned_axis'] = 'x';
      }else{
        // circle center inside AABB
        if(MyDebug.engine_debug){
          console.log("circle center inside aabb!");
          console.log('circle:' + c.id + ', aabb:' + ab.id);
        }
        result['contact_type'] = Contact.CONTACT_CIRCLE_2_POINT;
      }
    }
    return result;
  }

  circle_2_line_can_collide(obj1, obj2){
    let c = obj1.collision_body;
    let l = obj2.collision_body;

    let center = c.center;
    let result = 0;
    switch(l.parallel_to){
      case 'x':
        if(Math.abs(center.y - l.pos.y) < c.r){
          result = new Contact(obj1, obj2);
        }
        break;
      case 'y':
        if(Math.abs(center.x - l.pos.x) < c.r){
          result = new Contact(obj1, obj2);
        }
        break;
    }
    return result;
  }

  aabb_2_line_can_collide(obj1, obj2){
    let ab = obj1.collision_body;
    let l = obj2.collision_body;
    let min = ab.min;
    let max = ab.max;
    let center = {};
    center.x = (ab.min.x + ab.max.x) / 2;
    center.y = (ab.min.y + ab.max.y) / 2;
    let result = undefined;
    switch(l.parallel_to){
      case 'x':
        if(center.y <= max.y && center.y >= min.y){
          result = new Contact(obj1, obj2);
        }
        break;
      case 'y':
        if(center.x <= max.x && center.x >= min.x){
          result = new Contact(obj1, obj2);
        }
        break;
    }
    return result;
  }
}

module.exports = CollisionDetector;
module.exports.NO_COLLISION = NO_COLLISION;
module.exports.C_GROUP1 = C_GROUP1;
module.exports.C_GROUP2 = C_GROUP2;
module.exports.C_GROUP3 = C_GROUP3;
module.exports.C_GROUP4 = C_GROUP4;

},{"../MyDebug.js":1,"../geometry/Geometry.js":13,"../math/MathUtility.js":16,"./Contact.js":19,"./ImpluseResolver.js":20}],19:[function(require,module,exports){
const CONTACT_CIRCLE_2_POINT = 1;
const CONTACT_CIRCLE_2_AB_LINE = 2;

// TODO: optimize the structure of Contact and make sure 
// CollisionDetector and ImpluseResolver are using it correctly

class Contact{
  constructor(obj1, obj2){
    this.obj1 = obj1;
    this.obj2 = obj2;
  }

  // contact_point example: {x: 0, y: 0}
  set_point_contact(contact_point){
    this.contact_type = CONTACT_CIRCLE_2_POINT;
    this.contact_point = contact_point;
  }

  // algined_axis example: 'x'
  set_aa_line_contact(aligned_axis){
    this.contact_type = CONTACT_CIRCLE_2_AB_LINE;
    this.aligned_axis = aligned_axis;
  }

  set_penetration(as_vector){
    this.penetration = as_vector;
  }
}

module.exports = Contact;
module.exports.CONTACT_CIRCLE_2_POINT  = CONTACT_CIRCLE_2_POINT;
module.exports.CONTACT_CIRCLE_2_AB_LINE = CONTACT_CIRCLE_2_AB_LINE;

},{}],20:[function(require,module,exports){
var Geometry = require('../geometry/Geometry.js');
var Vector = require('../math/Vector.js');
var MyDebug = require('../MyDebug.js');

const CONTACT_CIRCLE_2_POINT = 1;
const CONTACT_CIRCLE_2_AB_LINE = 2;

class ImpluseResolver{
  resolve(obj1, obj2, contact){
    if(obj1.pass_through || obj2.pass_through){
      return;
    }
    let collision_type = obj1.collision_body.shape + ':' + obj2.collision_body.shape;
    let result = undefined;
    // we haven't resolved the impulse between obj1 and obj2 since their collision yet
    if(!obj1.impulse_resolved_with_target(obj2)){
      if(MyDebug.engine_debug){
        console.log('resolving!');
        console.log(obj1.id + ',' + obj2.id);
        console.log('before: v_x' + obj1.v_x + ',' + obj1.v_y);
      }
      switch(collision_type){
        case Geometry.AABB + ':' + Geometry.AABB:
          console.log('aabb 2 aabb impluse resolution not supported');
          break;
        case Geometry.CIRCLE + ':' + Geometry.CIRCLE:
          console.log('circle 2 circle impluse resolution not supported');
          break;
        case Geometry.AABB + ':' + Geometry.CIRCLE:
          result = this.circle_2_aabb_resolution(obj2, obj1, contact);
          break;
        case Geometry.CIRCLE + ':' + Geometry.AABB:
          result = this.circle_2_aabb_resolution(obj1, obj2, contact);
          break;
        case Geometry.CIRCLE + ':' + Geometry.LINE:
          result = this.circle_2_line_resolution(obj1, obj2);
          break;
        case Geometry.LINE + ':' + Geometry.CIRCLE:
          result = this.circle_2_line_resolution(obj2, obj1);
          break;
        case Geometry.AABB + ':' + Geometry.LINE:
          console.log('aabb 2 line impluse resolution not supported');
          break;
        case Geometry.LINE+ ':' + Geometry.AABB:
          console.log('line 2 aabb impluse resolution not supported');
          break;
      }
      // remember the fact that we have resolved the impulse between obj1 obj2 already
      // to avoid multiple resolution in case of deep penetration
      obj1.set_impulse_resolve_target(obj2);
      obj2.set_impulse_resolve_target(obj1);
      if(MyDebug.engine_debug){
        console.log('after: v_x' + obj1.v_x + ',' + obj1.v_y);
      }
    }else{
      if(MyDebug.engine_debug){
        console.log('skip resolving!');
        console.log(obj1.id + ',' + obj2.id);
      }
    }
    return result;
  }

  circle_2_aabb_resolution(c, ab, contact){
    if(c.is_intersect_with !== ab || ab.is_intersect_with != c){
      if(MyDebug.engine_debug){
        console.log('intersect!');
        console.log(c.id + ',' + ab.id);
        console.log(contact);
      }
      if(contact['contact_type'] == CONTACT_CIRCLE_2_POINT){
        this._circle_2_point_resolution(c, contact['contact']['point']);
      }else if(contact['contact_type'] == CONTACT_CIRCLE_2_AB_LINE){
        this._circle_2_ab_line_resolution(c, contact['contact']['aligned_axis']);
      }else{
        if(MyDebug.engine_debug){
          console.log('error! unknown contact type:' +  contact['contact_type']);
        }
      }
    }else{
      if(MyDebug.engine_debug){
        console.log('did not intersect!');
      }
    }
  }

  _circle_2_ab_line_resolution(c, aligned_axis){
    switch(aligned_axis){
      case 'x':
        c.v_y *= -1;
        break
      case 'y':
        c.v_x *= -1;
        break
    }
  }

  _circle_2_point_resolution(c, contact_point){
    let circle_center = c.collision_body.center;
    let contact_vector = new Vector(
      contact_point.x - circle_center.x,
      contact_point.y - circle_center.y);
    let perp_contact_vector = contact_vector.rotate_clockwise_90();
    let velocity_vector = new Vector(c.v_x, c.v_y);

    // let theta be the angle between velocity_vector and perp_contact_vector
    // cos(theta) = V1 . V2 / (|V1| * |V2|)
    let cos_theta = (perp_contact_vector.dot_product(velocity_vector))
      /(perp_contact_vector.magnitude() * velocity_vector.magnitude());

    let sin_theta = Math.sqrt(1 - cos_theta * cos_theta);

    // Use vector rotation matrix:
    //|cos(2*theta), -sin(2*theta)|
    //|sin(2*theta),  cos(2*theta)|
    // to multiply velocity_vector to get the velocity after contact
    // note:
    // cos(2*theta) = cos_theta*cos_theta - sin_theta*sin_theta
    // sin(2*theta) = 2*sin(theta)*cos(theta)
    let middle_result1 = (cos_theta*cos_theta - sin_theta*sin_theta);
    let middle_result2 = 2 * cos_theta * sin_theta;
    let velocity_after_contact = new Vector(
      middle_result1 * velocity_vector.x - middle_result2 * velocity_vector.y,
      middle_result2 * velocity_vector.x + middle_result1 * velocity_vector.y
    )

    c.v_x = velocity_after_contact.x;
    c.v_y = velocity_after_contact.y;
  }

  circle_2_line_resolution(c, l){
    if(c.is_intersect_with !== l || l.is_intersect_with != c){
      this._circle_2_ab_line_resolution(c, l.collision_body.parallel_to);
    }
  }
}
module.exports = ImpluseResolver;
module.exports.CONTACT_CIRCLE_2_POINT  = CONTACT_CIRCLE_2_POINT;
module.exports.CONTACT_CIRCLE_2_AB_LINE = CONTACT_CIRCLE_2_AB_LINE;

},{"../MyDebug.js":1,"../geometry/Geometry.js":13,"../math/Vector.js":17}]},{},[15])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvTXlEZWJ1Zy5qcyIsInNyYy9nYW1lL0JhckluZGljYXRvci5qcyIsInNyYy9nYW1lL0Z1ZWxJbmRpY2F0b3IuanMiLCJzcmMvZ2FtZS9HYW1lQXJlYS5qcyIsInNyYy9nYW1lL0dhbWVPYmplY3QuanMiLCJzcmMvZ2FtZS9IVUQuanMiLCJzcmMvZ2FtZS9MZXZlbC5qcyIsInNyYy9nYW1lL0xldmVsTG9hZGVyLmpzIiwic3JjL2dhbWUvUGxheWVyLmpzIiwic3JjL2dhbWUvVXNlckludGVyYWN0aW9uSGFuZGxlci5qcyIsInNyYy9nZW9tZXRyeS9BQUJCLmpzIiwic3JjL2dlb21ldHJ5L0NpcmNsZS5qcyIsInNyYy9nZW9tZXRyeS9HZW9tZXRyeS5qcyIsInNyYy9nZW9tZXRyeS9MaW5lLmpzIiwic3JjL21haW4uanMiLCJzcmMvbWF0aC9NYXRoVXRpbGl0eS5qcyIsInNyYy9tYXRoL1ZlY3Rvci5qcyIsInNyYy9waHlzaWNzL0NvbGxpc2lvbkRldGVjdG9yLmpzIiwic3JjL3BoeXNpY3MvQ29udGFjdC5qcyIsInNyYy9waHlzaWNzL0ltcGx1c2VSZXNvbHZlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25GQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJjbGFzcyBNeURlYnVnIHtcbn1cbm1vZHVsZS5leHBvcnRzID0gTXlEZWJ1ZztcbiIsImNsYXNzIEJhckluZGljYXRvcntcbiAgY29uc3RydWN0b3IoY3R4LCBtaW5feCwgbWluX3ksIG1heF94LCBtYXhfeSl7XG4gICAgdGhpcy5taW5feCA9IG1pbl94O1xuICAgIHRoaXMubWluX3kgPSBtaW5feTtcbiAgICB0aGlzLm1heF94ID0gbWF4X3g7XG4gICAgdGhpcy5tYXhfeSA9IG1heF95O1xuICAgIHRoaXMuZmlsbF9wZXJjZW50ID0gMTtcbiAgICB0aGlzLmN0eCA9IGN0eDtcbiAgfVxuXG4gIHNldF9maWxsX3BlcmNlbnQocGVyY2VudCl7XG4gICAgdGhpcy5maWxsX3BlcmNlbnQgPSBwZXJjZW50O1xuICB9XG5cbiAgcmVuZGVyKCl7XG4gICAgaWYoIXRoaXMuY3R4KXtyZXR1cm47fVxuXG4gICAgdGhpcy5jdHguc2F2ZSgpO1xuXG4gICAgdGhpcy5jdHguYmVnaW5QYXRoKCk7XG4gICAgdGhpcy5jdHgucmVjdChcbiAgICAgIHRoaXMubWluX3gsXG4gICAgICB0aGlzLm1pbl95LFxuICAgICAgdGhpcy5tYXhfeCAtIHRoaXMubWluX3gsXG4gICAgICB0aGlzLm1heF95IC0gdGhpcy5taW5feSk7XG4gICAgdGhpcy5jdHguc3Ryb2tlU3R5bGUgPSAnYmxhY2snO1xuICAgIHRoaXMuY3R4LnN0cm9rZSgpO1xuICAgIHRoaXMuY3R4LmNsb3NlUGF0aCgpO1xuXG4gICAgdGhpcy5jdHguYmVnaW5QYXRoKCk7XG4gICAgdGhpcy5jdHguZmlsbFN0eWxlID0gJ3JlZCc7XG4gICAgdGhpcy5jdHgucmVjdChcbiAgICAgIHRoaXMubWluX3ggKyAxLCBcbiAgICAgIHRoaXMubWluX3kgKyAxLCBcbiAgICAgICh0aGlzLm1heF94IC0gdGhpcy5taW5feCAtIDIpICogdGhpcy5maWxsX3BlcmNlbnQsXG4gICAgICB0aGlzLm1heF95IC0gdGhpcy5taW5feSAtIDIsXG4gICAgKVxuICAgIHRoaXMuY3R4LmZpbGwoKTtcbiAgICB0aGlzLmN0eC5jbG9zZVBhdGgoKTtcbiAgICB0aGlzLmN0eC5yZXN0b3JlKCk7XG4gIH1cbn1cbm1vZHVsZS5leHBvcnRzID0gQmFySW5kaWNhdG9yO1xuIiwidmFyIFBsYXllciA9IHJlcXVpcmUoJy4vUGxheWVyLmpzJyk7XG5cbmNsYXNzIEZ1ZWxJbmRpY2F0b3J7XG4gIGNvbnN0cnVjdG9yKGN0eCwgbWluX3gsIG1pbl95LCB3aWR0aCwgaGVpZ2h0KXtcbiAgICB0aGlzLmN0eCA9IGN0eDtcbiAgICB0aGlzLm1pbl94ID0gbWluX3g7XG4gICAgdGhpcy5taW5feSA9IG1pbl95O1xuICAgIHRoaXMud2lkdGggPSB3aWR0aDtcbiAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcbiAgfVxuXG4gIGluaXRfcGxheWVyKHBsYXllcil7XG4gICAgdGhpcy5wbGF5ZXIgPSBwbGF5ZXI7XG4gIH1cblxuICByZW5kZXIoKXtcbiAgICB0aGlzLmN0eC5zYXZlKCk7XG4gICAgLy8gZHJhdyBudW1iZXIgb2YgZnVlbHMgbGVmdCBpbiB0ZXh0XG4gICAgdGhpcy5jdHguZm9udCA9IFwiMjVweCBBcmlhbFwiO1xuICAgIHRoaXMuY3R4LnRleHRBbGlnbiA9IFwiY2VudGVyXCI7XG4gICAgdGhpcy5jdHgudGV4dEJhc2VsaW5lID0gJ2JvdHRvbSc7XG4gICAgbGV0IGZ1ZWxfY291bnQgPSB0aGlzLnBsYXllci5nZXRfYmFycmVsc19vZl9mdWVscygpO1xuICAgIGxldCBmdWVsX2NvdW50X3dpZHRoID0gdGhpcy5jdHgubWVhc3VyZVRleHQoZnVlbF9jb3VudCkud2lkdGg7XG4gICAgdGhpcy5jdHguZmlsbFRleHQoZnVlbF9jb3VudCwgdGhpcy5taW5feCwgdGhpcy5taW5feSArIHRoaXMuaGVpZ2h0KTtcbiAgICB0aGlzLmN0eC5yZXN0b3JlKCk7XG5cbiAgICAvLyBkcmF3IGJvcmRlciBvZiB0aGUgZnVlbCBiYXJcbiAgICBsZXQgYmFyX3dpZHRoID0gdGhpcy53aWR0aCAtIGZ1ZWxfY291bnRfd2lkdGg7XG4gICAgbGV0IGJhcl9taW5feCA9IGZ1ZWxfY291bnRfd2lkdGggKyB0aGlzLm1pbl94O1xuICAgIGxldCBib3JkZXJfd2lkdGggPSAxO1xuICAgIHRoaXMuY3R4LnNhdmUoKTtcbiAgICB0aGlzLmN0eC5iZWdpblBhdGgoKTtcbiAgICB0aGlzLmN0eC5saW5lV2lkdGggPSBib3JkZXJfd2lkdGg7XG4gICAgdGhpcy5jdHgucmVjdChcbiAgICAgIGJhcl9taW5feCxcbiAgICAgIHRoaXMubWluX3ksXG4gICAgICBiYXJfd2lkdGgsXG4gICAgICB0aGlzLmhlaWdodCk7XG4gICAgdGhpcy5jdHguc3Ryb2tlKCk7XG4gICAgdGhpcy5jdHguY2xvc2VQYXRoKCk7XG4gICAgdGhpcy5jdHgucmVzdG9yZSgpO1xuXG4gICAgLy8gZmlsbCB0aGUgZnVlbCBiYXIgd2l0aCBjb3JyZWN0IHBlcmNlbnRhZ2VcbiAgICBsZXQgZmlsbF9wZXJjZW50ID0gdGhpcy5wbGF5ZXIuZ2V0X2Z1ZWxfcGVyY2VudCgpO1xuICAgIHRoaXMuY3R4LnNhdmUoKTtcbiAgICB0aGlzLmN0eC5iZWdpblBhdGgoKTtcbiAgICBzd2l0Y2godGhpcy5wbGF5ZXIuZW5naW5lX3N0YXR1cyl7XG4gICAgICBjYXNlIFBsYXllci5FTkdJTkVfU1RBVFVTX09LOlxuICAgICAgICB0aGlzLmN0eC5maWxsU3R5bGUgPSAnI2ZjYzEyZCc7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBQbGF5ZXIuRU5HSU5FX1NUQVRVU19SRVBMQUNFX0ZVRUw6XG4gICAgICAgIGxldCB0aW1lX3Bhc3NlZCA9IERhdGUubm93KCkgLSB0aGlzLnBsYXllci5nZXRfZnVlbF9yZXBsYWNlbWVudF9zdGFydF90aW1lKCk7XG4gICAgICAgIGZpbGxfcGVyY2VudCA9IHRpbWVfcGFzc2VkIC8gdGhpcy5wbGF5ZXIuZ2V0X2Z1ZWxfcmVwbGFjZW1lbnRfdGltZSgpO1xuICAgICAgICB0aGlzLmN0eC5maWxsU3R5bGUgPSAnI2ZmZjJkMyc7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBpZihmaWxsX3BlcmNlbnQgPiAwKXtcbiAgICAgIHRoaXMuY3R4LnJlY3QoXG4gICAgICAgIGJhcl9taW5feCArIGJvcmRlcl93aWR0aCxcbiAgICAgICAgdGhpcy5taW5feSArIGJvcmRlcl93aWR0aCxcbiAgICAgICAgKGJhcl93aWR0aCAtIDIgKiBib3JkZXJfd2lkdGgpICogZmlsbF9wZXJjZW50LFxuICAgICAgICB0aGlzLmhlaWdodCAtIDIgKiBib3JkZXJfd2lkdGhcbiAgICAgICk7XG4gICAgICB0aGlzLmN0eC5maWxsKCk7XG4gICAgfVxuXG4gICAgdGhpcy5jdHguZm9udCA9IFwiMjJweCBBcmlhbFwiO1xuICAgIHRoaXMuY3R4LnRleHRBbGlnbiA9IFwibGVmdFwiO1xuICAgIHRoaXMuY3R4LnRleHRCYXNlbGluZSA9ICdoYW5naW5nJztcbiAgICBzd2l0Y2godGhpcy5wbGF5ZXIuZW5naW5lX3N0YXR1cyl7XG4gICAgICBjYXNlIFBsYXllci5FTkdJTkVfU1RBVFVTX1JFUExBQ0VfRlVFTDpcbiAgICAgICAgdGhpcy5jdHguZmlsbFN0eWxlID0gJ2dyZXknO1xuICAgICAgICB0aGlzLmN0eC5maWxsVGV4dCgnUmVmdWVsbGluZy4uLicsIGJhcl9taW5feCArIGJvcmRlcl93aWR0aCwgdGhpcy5taW5feSArIGJvcmRlcl93aWR0aCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBQbGF5ZXIuRU5HSU5FX1NUQVRVU19OT19GVUVMOlxuICAgICAgICB0aGlzLmN0eC5maWxsU3R5bGUgPSAncmVkJztcbiAgICAgICAgdGhpcy5jdHguZmlsbFRleHQoJ091dCBvZiBmdWVsJywgYmFyX21pbl94ICsgYm9yZGVyX3dpZHRoLCB0aGlzLm1pbl95ICsgYm9yZGVyX3dpZHRoKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIHRoaXMuY3R4LmNsb3NlUGF0aCgpO1xuICAgIHRoaXMuY3R4LnJlc3RvcmUoKTtcbiAgfVxuXG59XG5tb2R1bGUuZXhwb3J0cyA9IEZ1ZWxJbmRpY2F0b3I7XG4iLCJ2YXIgTGluZSA9IHJlcXVpcmUoJy4uL2dlb21ldHJ5L0xpbmUuanMnKTtcbnZhciBHYW1lT2JqZWN0ID0gcmVxdWlyZSgnLi9HYW1lT2JqZWN0LmpzJyk7XG5cbmNsYXNzIEdhbWVBcmVhe1xuICBjb25zdHJ1Y3RvcihwbGF5X2FyZWEsIGVudHJpZXMsIGV4aXRzLCBjb2xsaXNpb25fZ3JvdXAsIGhhdmVfYm9yZGVyID0gdHJ1ZSl7XG4gICAgdGhpcy5wbGF5X2FyZWEgPSBwbGF5X2FyZWE7XG4gICAgdGhpcy5lbnRyaWVzID0gZW50cmllcztcbiAgICB0aGlzLmV4aXRzID0gZXhpdHM7XG4gICAgdGhpcy5jb2xsaXNpb25fZ3JvdXAgPSBjb2xsaXNpb25fZ3JvdXA7XG4gICAgdGhpcy5fb2JqZWN0cyA9IFtdO1xuXG4gICAgaWYoaGF2ZV9ib3JkZXIpe1xuICAgICAgdmFyIGxpbmVfdG9wID0gbmV3IExpbmUoXCJ4XCIsIHtcInhcIjogcGxheV9hcmVhLm1pbl94LCBcInlcIjogcGxheV9hcmVhLm1pbl95fSwgcGxheV9hcmVhLm1heF94IC0gcGxheV9hcmVhLm1pbl94KTtcbiAgICAgIHZhciBsaW5lX2JvdHRvbSA9IG5ldyBMaW5lKFwieFwiLCB7XCJ4XCI6IHBsYXlfYXJlYS5taW5feCwgXCJ5XCI6IHBsYXlfYXJlYS5tYXhfeX0sIHBsYXlfYXJlYS5tYXhfeCAtIHBsYXlfYXJlYS5taW5feCk7XG4gICAgICB2YXIgbGluZV9sZWZ0ID0gbmV3IExpbmUoXCJ5XCIsIHtcInhcIjogcGxheV9hcmVhLm1pbl94LCBcInlcIjogcGxheV9hcmVhLm1pbl95fSwgcGxheV9hcmVhLm1heF95IC0gcGxheV9hcmVhLm1pbl95KTtcbiAgICAgIHZhciBsaW5lX3JpZ2h0ID0gbmV3IExpbmUoXCJ5XCIsIHtcInhcIjogcGxheV9hcmVhLm1heF94LCBcInlcIjogcGxheV9hcmVhLm1pbl95fSwgcGxheV9hcmVhLm1heF95IC0gcGxheV9hcmVhLm1pbl95KTtcbiAgICAgIHZhciBwbGF5X2FyZWFfYm9yZGVycyA9IFtsaW5lX3RvcCwgbGluZV9ib3R0b20sIGxpbmVfbGVmdCwgbGluZV9yaWdodF07XG4gICAgICB2YXIgcGxheV9hcmVhX2JvcmRlcl9vYmpzID0gcGxheV9hcmVhX2JvcmRlcnMubWFwKGZ1bmN0aW9uKGxpbmUpe1xuICAgICAgICByZXR1cm4gbmV3IEdhbWVPYmplY3QoXG4gICAgICAgICAgY29sbGlzaW9uX2dyb3VwLFxuICAgICAgICAgIGxpbmUsXG4gICAgICAgICAge1widHlwZVwiOiBcImdlb21ldHJ5XCJ9LFxuICAgICAgICAgIGZhbHNlXG4gICAgICAgIClcbiAgICAgIH0pO1xuICAgICAgZm9yKHZhciBpID0gMCA7IGkgPCBwbGF5X2FyZWFfYm9yZGVyX29ianMubGVuZ3RoIDsgaSArKyl7XG4gICAgICAgIHRoaXMuX29iamVjdHMucHVzaChwbGF5X2FyZWFfYm9yZGVyX29ianNbaV0pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGNsb25lKCl7XG4gICAgdmFyIGNsb25lZF9lbnRyaWVzID0gW107XG4gICAgdGhpcy5lbnRyaWVzLmZvckVhY2goZnVuY3Rpb24oZW50cnkpe1xuICAgICAgY2xvbmVkX2VudHJpZXMucHVzaChlbnRyeSk7XG4gICAgfSk7XG4gICAgdmFyIGNsb25lZF9leGl0cyA9IFtdO1xuICAgIHRoaXMuZXhpdHMuZm9yRWFjaChmdW5jdGlvbihleGl0KXtcbiAgICAgIGNsb25lZF9leGl0cy5wdXNoKGV4aXQuY2xvbmUoKSk7XG4gICAgfSk7XG4gICAgdmFyIGNsb25lZF9vYmplY3RzID0gW107XG4gICAgdGhpcy5fb2JqZWN0cy5mb3JFYWNoKGZ1bmN0aW9uKG9iail7XG4gICAgICBjbG9uZWRfb2JqZWN0cy5wdXNoKG9iaik7XG4gICAgfSk7XG4gICAgdmFyIGNsb25lZF9nYW1lX2FyZWEgPSBuZXcgR2FtZUFyZWEodGhpcy5wbGF5X2FyZWEsIGNsb25lZF9lbnRyaWVzLCBjbG9uZWRfZXhpdHMsIHRoaXMuY29sbGlzaW9uX2dyb3VwLCB0aGlzLmhhdmVfYm9yZGVyKTtcbiAgICBjbG9uZWRfZ2FtZV9hcmVhLnNldF9nYW1lX29iamVjdHMoY2xvbmVkX29iamVjdHMpO1xuICAgIHJldHVybiBjbG9uZWRfZ2FtZV9hcmVhO1xuICB9XG5cbiAgc2V0X2xldmVsKGxldmVsKXtcbiAgICB0aGlzLmxldmVsID0gbGV2ZWw7XG4gIH1cblxuICBzZXRfcGxheV9hcmVhKG1pbl94LCBtaW5feSwgbWF4X3gsIG1heF95KXtcbiAgICB0aGlzLnBsYXlfYXJlYSA9IHtcbiAgICAgIFwibWluX3hcIjogbWluX3gsXG4gICAgICBcIm1pbl95XCI6IG1pbl95LFxuICAgICAgXCJtYXhfeFwiOiBtYXhfeCxcbiAgICAgIFwibWF4X3lcIjogbWF4X3lcbiAgICB9XG4gIH1cblxuICBhZGRfZW50cnkoZW50cnkpe1xuICAgIGlmKHRoaXMuZW50cmllcyA9PT0gdW5kZWZpbmVkKXtcbiAgICAgIHRoaXMuZW50cmllcyA9IFtdO1xuICAgIH1cbiAgICB0aGlzLmVudHJpZXMucHVzaChlbnRyeSk7XG4gIH1cblxuICAvLyBleGl0IGlzIGEgR2FtZU9iamVjdFxuICBhZGRfZXhpdChleGl0KXtcbiAgICBpZih0aGlzLmV4aXRzID09PSB1bmRlZmluZWQpe1xuICAgICAgdGhpcy5leGl0cyA9IFtdO1xuICAgIH1cbiAgICAvLyBwcm9wZXJ0aWVzIGFsbCBleGl0cyB3b3VsZCBoYXZlOlxuICAgIGV4aXQuZGlzcGxheV9ib2R5LnNldF9zdHJva2VTdHlsZSgnZ3JlZW4nKTtcbiAgICBleGl0LmRpc3BsYXlfYm9keS5zZXRfbGluZVdpZHRoKDMpO1xuICAgIGV4aXQuc2V0X3Bhc3NfdGhyb3VnaCgpO1xuXG4gICAgdGhpcy5leGl0cy5wdXNoKGV4aXQpO1xuICB9XG5cbiAgc2V0X2dhbWVfb2JqZWN0cyhnYW1lX29iamVjdHMpe1xuICAgIHRoaXMuX29iamVjdHMgPSBnYW1lX29iamVjdHM7XG4gIH1cblxuICBnZXRfZ2FtZV9vYmplY3RzKCl7XG4gICAgcmV0dXJuIHRoaXMuX29iamVjdHMuY29uY2F0KHRoaXMuZXhpdHMpO1xuICB9XG5cbiAgYWRkX29iamVjdChnYW1lX29iamVjdCl7XG4gICAgaWYodGhpcy5fb2JqZWN0cyA9PT0gdW5kZWZpbmVkKXtcbiAgICAgIHRoaXMuX29iamVjdHM9IFtdO1xuICAgIH1cbiAgICB0aGlzLl9vYmplY3RzLnB1c2goZ2FtZV9vYmplY3QpO1xuICB9XG5cblxuICBpbl9nYW1lX2FyZWEoeCwgeSl7XG4gICAgcmV0dXJuIHggPCB0aGlzLnBsYXlfYXJlYS5tYXhfeFxuICAgICAgJiYgeCA+IHRoaXMucGxheV9hcmVhLm1pbl94XG4gICAgICAmJiB5IDwgdGhpcy5wbGF5X2FyZWEubWF4X3lcbiAgICAgICYmIHkgPiB0aGlzLnBsYXlfYXJlYS5taW5feTtcbiAgfVxufVxubW9kdWxlLmV4cG9ydHMgPSBHYW1lQXJlYTtcbiIsInZhciBHZW9tZXRyeSA9IHJlcXVpcmUoJy4uL2dlb21ldHJ5L0dlb21ldHJ5LmpzJyk7XG5cbmNsYXNzIEdhbWVPYmplY3R7XG4gIGNvbnN0cnVjdG9yKGNvbGxpc2lvbl9ncm91cCwgY29sbGlzaW9uX2JvZHksIGRpc3BsYXlfYm9keSwgbW92ZWFibGUpe1xuICAgIGlmKEdhbWVPYmplY3QuaWRfY291bnRlciA9PT0gdW5kZWZpbmVkKXtcbiAgICAgIEdhbWVPYmplY3QuaWRfY291bnRlciA9IDE7XG4gICAgfWVsc2V7XG4gICAgICBHYW1lT2JqZWN0LmlkX2NvdW50ZXIgKz0gMTtcbiAgICB9XG4gICAgdGhpcy5pZCA9IEdhbWVPYmplY3QuaWRfY291bnRlcjtcbiAgICB0aGlzLmNvbGxpc2lvbl9ncm91cCA9IGNvbGxpc2lvbl9ncm91cDtcbiAgICB0aGlzLmNvbGxpc2lvbl9ib2R5ID0gY29sbGlzaW9uX2JvZHk7XG4gICAgLy9pZihkaXNwbGF5X2JvZHkudHlwZSA9PSBcImdlb21ldHJ5XCIpe1xuICAgICAgLy90aGlzLmRpc3BsYXlfYm9keSA9IGRpc3BsYXlfYm9keTtcbiAgICAvL31lbHNle1xuICAgIC8vIFRPRE86IHNob3VsZCBJIGtlZXAgZGlzcGxheSBib2R5IHNlcGFyYXRlIGZyb20gY29sbGlzaW9uIGJvZHk/XG4gICAgLy8gRklYTUU6IHNob3VsZCBub3QgYWx3YXlzIGRvIHRoaXM6XG4gICAgICB0aGlzLmRpc3BsYXlfYm9keSA9IGNvbGxpc2lvbl9ib2R5O1xuICAgIC8vfVxuICAgIHRoaXMubW92ZWFibGUgPSBtb3ZlYWJsZTtcbiAgICB0aGlzLnBhc3NfdGhyb3VnaCA9IGZhbHNlO1xuXG4gICAgaWYoY29sbGlzaW9uX2JvZHkuc2hhcGUgPT0gR2VvbWV0cnkuQUFCQil7XG4gICAgICB0aGlzLnggPSBjb2xsaXNpb25fYm9keS5taW4ueDtcbiAgICAgIHRoaXMueSA9IGNvbGxpc2lvbl9ib2R5Lm1pbi55O1xuICAgIH1lbHNlIGlmKGNvbGxpc2lvbl9ib2R5LnNoYXBlID09IEdlb21ldHJ5LkNJUkNMRSl7XG4gICAgICB0aGlzLnggPSBjb2xsaXNpb25fYm9keS5jZW50ZXIueDtcbiAgICAgIHRoaXMueSA9IGNvbGxpc2lvbl9ib2R5LmNlbnRlci55O1xuICAgIH1cbiAgICB0aGlzLmludGVyc2VjdF93aXRoID0gW107XG4gICAgdGhpcy5pbXB1bHNlX3Jlc29sdmVkX3dpdGggPSBbXTtcbiAgICB0aGlzLmFfeCA9IDA7XG4gICAgdGhpcy5hX3kgPSAwO1xuICB9XG5cbiAgY2xvbmUoKXtcbiAgICByZXR1cm4gbmV3IEdhbWVPYmplY3QodGhpcy5jb2xsaXNpb25fZ3JvdXAsIHRoaXMuY29sbGlzaW9uX2JvZHkuY2xvbmUoKSwgdW5kZWZpbmVkLCB0aGlzLm1vdmVhYmxlKTtcbiAgfVxuXG4gIHNldF9wYXNzX3Rocm91Z2goKXtcbiAgICB0aGlzLnBhc3NfdGhyb3VnaCA9IHRydWU7XG4gIH1cblxuICBnZXRfcG9zaXRpb24oKXtcbiAgICByZXR1cm4geyd4Jzp0aGlzLngsICd5Jzp0aGlzLnl9O1xuICB9XG5cbiAgc2V0X3Bvc2l0aW9uKHgsIHkpe1xuICAgIHRoaXMueCA9IHg7XG4gICAgdGhpcy55ID0geTtcbiAgICBpZih0aGlzLmNvbGxpc2lvbl9ib2R5LnNoYXBlID09IEdlb21ldHJ5LkFBQkIpe1xuICAgICAgdGhpcy5jb2xsaXNpb25fYm9keS5taW5feCA9IHg7XG4gICAgICB0aGlzLmNvbGxpc2lvbl9ib2R5Lm1pbl95ID0geTtcbiAgICAgIHRoaXMuY29sbGlzaW9uX2JvZHkubWF4X3ggPSB4ICsgdGhpcy5jb2xsaXNpb25fYm9keS53aWR0aDtcbiAgICAgIHRoaXMuY29sbGlzaW9uX2JvZHkubWF4X3kgPSB5ICsgdGhpcy5jb2xsaXNpb25fYm9keS5oZWlnaHQ7XG4gICAgfWVsc2UgaWYodGhpcy5jb2xsaXNpb25fYm9keS5zaGFwZSA9PSBHZW9tZXRyeS5MSU5FKXtcbiAgICAgIGlmKHRoaXMuY29sbGlzaW9uX2JvZHkucGFyYWxsZWxfdG8gPT0gJ3gnKXtcbiAgICAgICAgdGhpcy5jb2xsaXNpb25fYm9keS5wb3MgPSB5O1xuICAgICAgfWVsc2V7XG4gICAgICAgIHRoaXMuY29sbGlzaW9uX2JvZHkucG9zID0geDtcbiAgICAgIH1cbiAgICB9ZWxzZSBpZih0aGlzLmNvbGxpc2lvbl9ib2R5LnNoYXBlID09IEdlb21ldHJ5LkNJUkNMRSl7XG4gICAgICB0aGlzLmNvbGxpc2lvbl9ib2R5LmNlbnRlci54ID0gdGhpcy54O1xuICAgICAgdGhpcy5jb2xsaXNpb25fYm9keS5jZW50ZXIueSA9IHRoaXMueTtcbiAgICB9XG4gIH1cblxuICBzZXRfdmVsb2NpdHkodl94LCB2X3kpe1xuICAgIHRoaXMudl94ID0gdl94O1xuICAgIHRoaXMudl95ID0gdl95O1xuICB9XG5cbiAgc2V0X2FjY2VsZXJhdGlvbihhX3gsIGFfeSl7XG4gICAgdGhpcy5hX3ggPSBhX3g7XG4gICAgdGhpcy5hX3kgPSBhX3k7XG4gIH1cblxuICBzZXRfaW1wdWxzZV9yZXNvbHZlX3RhcmdldChvYmope1xuICAgIGlmKCF0aGlzLmltcHVsc2VfcmVzb2x2ZWRfd2l0aC5pbmNsdWRlcyhvYmopKXtcbiAgICAgIHRoaXMuaW1wdWxzZV9yZXNvbHZlZF93aXRoLnB1c2gob2JqKTtcbiAgICB9XG4gIH1cblxuICByZW1vdmVfaW1wdWxzZV9yZXNvbHZlX3RhcmdldChvYmope1xuICAgIGxldCBpZHggPSB0aGlzLmltcHVsc2VfcmVzb2x2ZWRfd2l0aC5pbmRleE9mKChvYmopKTtcbiAgICBpZihpZHggPiAtMSl7XG4gICAgICB0aGlzLmltcHVsc2VfcmVzb2x2ZWRfd2l0aC5zcGxpY2Uob2JqLCAxKTtcbiAgICB9XG4gIH1cblxuICBpbXB1bHNlX3Jlc29sdmVkX3dpdGhfdGFyZ2V0KG9iail7XG4gICAgcmV0dXJuIHRoaXMuaW1wdWxzZV9yZXNvbHZlZF93aXRoLmluY2x1ZGVzKG9iaik7XG4gIH1cblxuICBzZXRfaW50ZXJzZWN0aW9uKG9iail7XG4gICAgaWYoIXRoaXMuaW50ZXJzZWN0X3dpdGguaW5jbHVkZXMob2JqKSl7XG4gICAgICB0aGlzLmludGVyc2VjdF93aXRoLnB1c2gob2JqKTtcbiAgICB9XG4gIH1cblxuICByZW1vdmVfaW50ZXJzZWN0aW9uKG9iail7XG4gICAgbGV0IGlkeCA9IHRoaXMuaW50ZXJzZWN0X3dpdGguaW5kZXhPZigob2JqKSk7XG4gICAgaWYoaWR4ID4gLTEpe1xuICAgICAgdGhpcy5pbnRlcnNlY3Rfd2l0aC5zcGxpY2Uob2JqLCAxKTtcbiAgICB9XG4gIH1cblxuICBjbGVhcl9pbnRlcnNlY3Rpb24oKXtcbiAgICB0aGlzLmludGVyc2VjdF93aXRoID0gW107XG4gIH1cblxuICBpc19pbnRlcnNlY3Rfd2l0aChvYmope1xuICAgIHJldHVybiB0aGlzLmludGVyc2VjdF93aXRoLmluY2x1ZGVzKG9iaik7XG4gIH1cbiAgLy8gYWFiYiBzaG91bGQgaGF2ZTpcbiAgLy8gbWluOiB7eDogPD4sIHk6PD59XG4gIC8vIG1heDoge3g6IDw+LCB5Ojw+fVxuXG4gIC8vIGNpcmNsZSBzaG91bGQgaGF2ZTpcbiAgLy8gY2VudGVyOiB7eDogPD4sIHk6PD59XG4gIC8vIHI6IDw+XG5cbiAgLy8gbGluZXMgYXJlIGluZmluaXRlIGxpbmUsIGFuZCBzaG91bGQgaGF2ZTpcbiAgLy8gcGFyYWxsZWxfdG86IFsneCd8J3knXVxuICAvLyBwb3M6IDw+XG5cblxufVxubW9kdWxlLmV4cG9ydHMgPSBHYW1lT2JqZWN0O1xuIiwidmFyIEdlb21ldHJ5ID0gcmVxdWlyZSgnLi4vZ2VvbWV0cnkvR2VvbWV0cnkuanMnKTtcbnZhciBCYXJJbmRpY2F0b3IgPSByZXF1aXJlKCcuL0JhckluZGljYXRvci5qcycpO1xudmFyIEZ1ZWxJbmRpY2F0b3IgPSByZXF1aXJlKCcuL0Z1ZWxJbmRpY2F0b3IuanMnKTtcblxuY2xhc3MgSFVEe1xuICBjb25zdHJ1Y3RvcihjdHgsIG1pbl94LCBtaW5feSwgbWF4X3gsIG1heF95KXtcbiAgICB0aGlzLmN0eCA9IGN0eDtcbiAgICB0aGlzLm1pbl94ID0gbWluX3g7XG4gICAgdGhpcy5taW5feSA9IG1pbl95O1xuICAgIHRoaXMubWF4X3ggPSBtYXhfeDtcbiAgICB0aGlzLm1heF95ID0gbWF4X3k7XG4gICAgdGhpcy5fc2V0dXBfdGltZV9pbmRpY2F0b3IoKTtcbiAgICB0aGlzLl9zZXR1cF9mdWVsX2luZGljYXRvcigpO1xuICB9XG5cbiAgY2xvbmUoKXtcbiAgICByZXR1cm4gbmV3IEhVRCh0aGlzLmN0eCwgdGhpcy5taW5feCwgdGhpcy5taW5feSwgdGhpcy5tYXhfeCwgdGhpcy5tYXhfeSk7XG4gIH1cblxuICBpbml0X3BsYXllcihwbGF5ZXIpe1xuICAgIHRoaXMucGxheWVyID0gcGxheWVyO1xuICAgIHRoaXMuZnVlbF9iYXIuaW5pdF9wbGF5ZXIocGxheWVyKTtcbiAgfVxuXG4gIHNldF9sZXZlbChsZXZlbCl7XG4gICAgdGhpcy5sZXZlbCA9IGxldmVsO1xuICB9XG5cbiAgX3NldHVwX2Z1ZWxfaW5kaWNhdG9yKCl7XG4gICAgdmFyIGZ1ZWxfYmFyX2NvbmZpZyA9IHtcbiAgICAgIFwieFwiOiAyMDAsXG4gICAgICBcInlcIjogMTAsXG4gICAgICBcIndpZHRoXCI6IDIwMCxcbiAgICAgIFwiaGVpZ2h0XCI6IDMwXG4gICAgfTtcbiAgICB0aGlzLmZ1ZWxfYmFyID0gbmV3IEZ1ZWxJbmRpY2F0b3IoXG4gICAgICB0aGlzLmN0eCxcbiAgICAgIHRoaXMubWluX3ggKyBmdWVsX2Jhcl9jb25maWcueCxcbiAgICAgIHRoaXMubWluX3kgKyBmdWVsX2Jhcl9jb25maWcueSxcbiAgICAgIGZ1ZWxfYmFyX2NvbmZpZy53aWR0aCxcbiAgICAgIGZ1ZWxfYmFyX2NvbmZpZy5oZWlnaHRcbiAgICApO1xuICB9XG5cbiAgX3NldHVwX3RpbWVfaW5kaWNhdG9yKCl7XG4gICAgdmFyIHRpbWVfYmFyX2NvbmZpZyA9IHtcbiAgICAgIFwieFwiOiAxMCxcbiAgICAgIFwieVwiOiAxMCxcbiAgICAgIFwid2lkdGhcIjogMTAwLFxuICAgICAgXCJoZWlnaHRcIjogMzAsXG4gICAgICBcImJvcmRlci1jb2xvclwiOiBcImJsYWNrXCIsXG4gICAgICBcImZpbGwtY29sb3JcIjogXCJyZWRcIlxuICAgIH07XG4gICAgdGhpcy50aW1lX2JhciA9IG5ldyBCYXJJbmRpY2F0b3IoXG4gICAgICB0aGlzLmN0eCxcbiAgICAgIHRoaXMubWluX3ggKyB0aW1lX2Jhcl9jb25maWcueCxcbiAgICAgIHRoaXMubWluX3kgKyB0aW1lX2Jhcl9jb25maWcueSxcbiAgICAgIHRoaXMubWluX3ggKyB0aW1lX2Jhcl9jb25maWcueCArIHRpbWVfYmFyX2NvbmZpZy53aWR0aCxcbiAgICAgIHRoaXMubWluX3kgKyB0aW1lX2Jhcl9jb25maWcueSArIHRpbWVfYmFyX2NvbmZpZy5oZWlnaHRcbiAgICApO1xuICB9XG5cbiAgcmVuZGVyKCl7XG4gICAgbGV0IGNfdGltZSA9IERhdGUubm93KCk7XG4gICAgbGV0IHRpbWVfcGVyY2VudF9sZWZ0ID0gKHRoaXMubGV2ZWwudGltZV9saW1pdCAtIChjX3RpbWUgLSB0aGlzLmxldmVsLnN0YXJ0X3RpbWUpKS90aGlzLmxldmVsLnRpbWVfbGltaXQ7XG4gICAgdGhpcy5fcmVuZGVyX3RpbWVfYmFyKHRpbWVfcGVyY2VudF9sZWZ0ID4gMCA/IHRpbWVfcGVyY2VudF9sZWZ0IDogMCk7XG5cblxuICAgIGxldCBmdWVsX3BlcmNlbnRfbGVmdCA9IHRoaXMubGV2ZWwucGxheWVyLmN1cnJlbnRfZnVlbCAvIHRoaXMubGV2ZWwucGxheWVyLm1heF9mdWVsO1xuICAgIHRoaXMuX3JlbmRlcl9mdWVsX2JhcihmdWVsX3BlcmNlbnRfbGVmdCk7XG4gIH1cblxuICBfcmVuZGVyX3RpbWVfYmFyKHBlcmNlbnQgPSAxKXtcbiAgICB0aGlzLnRpbWVfYmFyLnNldF9maWxsX3BlcmNlbnQocGVyY2VudCk7XG4gICAgdGhpcy50aW1lX2Jhci5yZW5kZXIoKTtcbiAgfVxuXG4gIF9yZW5kZXJfZnVlbF9iYXIoKXtcbiAgICB0aGlzLmZ1ZWxfYmFyLnJlbmRlcigpO1xuICB9XG5cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBIVUQ7XG4iLCJ2YXIgSFVEID0gcmVxdWlyZSgnLi9IVUQuanMnKTtcbnZhciBHYW1lQXJlYSA9IHJlcXVpcmUoJy4vR2FtZUFyZWEuanMnKTtcbnZhciBNYXRoVXRpbGl0eSA9IHJlcXVpcmUoJy4uL21hdGgvTWF0aFV0aWxpdHkuanMnKTtcblxuXG5jbGFzcyBMZXZlbHtcbiAgLy90aGlzLmN0eFxuICAvL3RoaXMudGltZV9saW1pdCBpbiBzZWNvbmRzXG4gIC8vdGhpcy5odWRcbiAgLy90aGlzLmdhbWVfYXJlYVxuICAvL3RoaXMucGxheWVyXG5cbiAgY29uc3RydWN0b3IoY3R4LCBodWQsIGdhbWVfYXJlYSwgdGltZV9saW1pdCwgaWQsIGZ1ZWxfc3VwcGx5KXtcbiAgICB0aGlzLmlkID0gaWQ7XG4gICAgdGhpcy5jdHggPSBjdHg7XG4gICAgdGhpcy50aW1lX2xpbWl0ID0gdGltZV9saW1pdDtcblxuICAgIHRoaXMuaHVkID0gaHVkO1xuICAgIHRoaXMuaHVkLnNldF9sZXZlbCh0aGlzKTtcblxuICAgIHRoaXMuZ2FtZV9hcmVhID0gZ2FtZV9hcmVhO1xuICAgIHRoaXMuZ2FtZV9hcmVhLnNldF9sZXZlbCh0aGlzKTtcblxuICAgIHRoaXMuZnVlbF9zdXBwbHkgPSBmdWVsX3N1cHBseTtcbiAgICB0aGlzLmdhbWVfc3RhdHVzID0gJ2luaXQnO1xuICB9XG5cbiAgY2xvbmUoKXtcbiAgICAvL1RPRE86IHRoaXMgY2xvbmUgd2lsbCBsb3NlIHRoZSBwbGF5ZXIgaW4gdGhlIGxldmVsXG4gICAgcmV0dXJuIG5ldyBMZXZlbCh0aGlzLmN0eCwgdGhpcy5odWQuY2xvbmUoKSwgdGhpcy5nYW1lX2FyZWEuY2xvbmUoKSwgdGhpcy50aW1lX2xpbWl0LCB0aGlzLmlkLCB0aGlzLmZ1ZWxfc3VwcGx5KTtcbiAgfVxuXG4gIGluaXRfcGxheWVyKHBsYXllcil7XG4gICAgdGhpcy5wbGF5ZXIgPSBwbGF5ZXI7XG5cbiAgICB0aGlzLnBsYXllci5nYW1lX29iamVjdC5zZXRfdmVsb2NpdHkoMSwgMSk7XG4gICAgdGhpcy5nYW1lX2FyZWEuYWRkX29iamVjdChwbGF5ZXIuZ2FtZV9vYmplY3QpO1xuICAgIHRoaXMucGxheWVyLnNldF9sZXZlbCh0aGlzKTtcblxuICAgIGxldCBwbGF5ZXJfZW50cnkgPSB0aGlzLmdhbWVfYXJlYS5lbnRyaWVzWzBdO1xuICAgIHRoaXMucGxheWVyLmdhbWVfb2JqZWN0LnggPSBwbGF5ZXJfZW50cnkueDtcbiAgICB0aGlzLnBsYXllci5nYW1lX29iamVjdC55ID0gcGxheWVyX2VudHJ5Lnk7XG4gICAgdGhpcy5wbGF5ZXIuZ2FtZV9vYmplY3Quc2V0X3ZlbG9jaXR5KHBsYXllcl9lbnRyeS52X3gsIHBsYXllcl9lbnRyeS52X3kpO1xuXG4gICAgdGhpcy5wbGF5ZXIuYWRkX2Z1ZWxfYmFycmVsKHRoaXMuZnVlbF9zdXBwbHkpO1xuXG4gICAgdGhpcy5odWQuaW5pdF9wbGF5ZXIodGhpcy5wbGF5ZXIpO1xuICB9XG5cbiAgc3RhcnRfZ2FtZSgpe1xuICAgIHRoaXMuc3RhcnRfdGltZSA9IERhdGUubm93KCk7XG4gICAgdGhpcy5nYW1lX3N0YXR1cyA9ICdzdGFydGVkJztcbiAgfVxuXG4gIC8vIDE6IHdpblxuICAvLyAtMTogbG9zdFxuICAvLyAwOiBvdGhlcndpc2VcbiAgY2hlY2tfZ2FtZV9lbmQoKXtcbiAgICBpZih0aGlzLmdhbWVfc3RhdHVzID09ICdzdGFydGVkJyl7XG4gICAgICBpZigoIXRoaXMuZ2FtZV9hcmVhLmluX2dhbWVfYXJlYSh0aGlzLnBsYXllci5nYW1lX29iamVjdC54LCB0aGlzLnBsYXllci5nYW1lX29iamVjdC55KSBcbiAgICAgICAgfHwgRGF0ZS5ub3coKSAtIHRoaXMuc3RhcnRfdGltZSA+IHRoaXMudGltZV9saW1pdCkpe1xuICAgICAgICB0aGlzLmdhbWVfc3RhdHVzID0gJ2xvc3QnO1xuICAgICAgfWVsc2UgaWYodGhpcy5wbGF5ZXIuZ2FtZV9vYmplY3QuaXNfaW50ZXJzZWN0X3dpdGgodGhpcy5nYW1lX2FyZWEuZXhpdHNbMF0pKSB7XG4gICAgICAgIHRoaXMuZ2FtZV9zdGF0dXMgPSAnd2luJztcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBlbmRfZ2FtZSgpe1xuICAgIHRoaXMucGxheWVyLmNsZWFyX2ludGVyc2VjdGlvbigpO1xuICAgIHZhciB0bXBfcGxheWVyID0gdGhpcy5wbGF5ZXI7XG4gICAgdGhpcy5wbGF5ZXIgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5jdHggPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5jdHggPSB1bmRlZmluZWQ7XG4gICAgdGhpcy50aW1lX2xpbWl0ID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuaHVkID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuZ2FtZV9hcmVhID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuZ2FtZV9zdGF0dXMgPSAnZW5kZWQnO1xuICAgIHJldHVybiB0bXBfcGxheWVyO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gTGV2ZWw7XG4iLCJ2YXIgR2FtZU9iamVjdCA9IHJlcXVpcmUoJy4vR2FtZU9iamVjdC5qcycpO1xudmFyIEhVRCA9IHJlcXVpcmUoJy4vSFVELmpzJyk7XG52YXIgR2FtZUFyZWE9IHJlcXVpcmUoJy4vR2FtZUFyZWEuanMnKTtcbnZhciBMZXZlbCA9IHJlcXVpcmUoJy4vTGV2ZWwuanMnKTtcblxudmFyIENpcmNsZSA9IHJlcXVpcmUoJy4uL2dlb21ldHJ5L0NpcmNsZS5qcycpO1xudmFyIEFBQkIgPSByZXF1aXJlKCcuLi9nZW9tZXRyeS9BQUJCLmpzJyk7XG52YXIgTGluZSA9IHJlcXVpcmUoJy4uL2dlb21ldHJ5L0xpbmUuanMnKTtcblxudmFyIEltcGx1c2VSZXNvbHZlciA9IHJlcXVpcmUoJy4uL3BoeXNpY3MvSW1wbHVzZVJlc29sdmVyLmpzJyk7XG52YXIgQ29sbGlzaW9uRGV0ZWN0b3IgPSByZXF1aXJlKCcuLi9waHlzaWNzL0NvbGxpc2lvbkRldGVjdG9yLmpzJyk7XG5cbmNsYXNzIExldmVsTG9hZGVye1xuXG4gIHN0YXRpYyBnZXRfbGV2ZWxzKGN0eCwgY2FudmFzX3dpZHRoLCBjYW52YXNfaGVpZ2h0KXtcbiAgICB2YXIgbGV2ZWxzID0gW107XG4gICAgbGV2ZWxzLnB1c2goTGV2ZWxMb2FkZXIuX2xvYWRfbGV2ZWxfMCgwLCBjdHgsIGNhbnZhc193aWR0aCwgY2FudmFzX2hlaWdodCkpO1xuICAgIGxldmVscy5wdXNoKExldmVsTG9hZGVyLl9sb2FkX2xldmVsXzEoMSwgY3R4LCBjYW52YXNfd2lkdGgsIGNhbnZhc19oZWlnaHQpKTtcbiAgICBsZXZlbHMucHVzaChMZXZlbExvYWRlci5fbG9hZF9sZXZlbF8yKDIsIGN0eCwgY2FudmFzX3dpZHRoLCBjYW52YXNfaGVpZ2h0KSk7XG4gICAgcmV0dXJuIGxldmVscztcbiAgfVxuXG4gIHN0YXRpYyBfbG9hZF9sZXZlbF8wKGlkLCBjdHgsIHdpZHRoLCBoZWlnaHQpe1xuICAgIHZhciBnYW1lX2FyZWEgPSBuZXcgR2FtZUFyZWEoXG4gICAgICB7XCJtaW5feFwiOjAsXG4gICAgICAgIFwibWluX3lcIjowLFxuICAgICAgICBcIm1heF94XCI6NjAwLFxuICAgICAgICBcIm1heF95XCI6NjAwfSxcbiAgICAgIFt7XCJ4XCI6IDMwLCBcInlcIjogMzAwLCBcInZfeFwiOiAwLjEsIFwidl95XCI6IDB9XSxcbiAgICAgIFtdLFxuICAgICAgQ29sbGlzaW9uRGV0ZWN0b3IuQ19HUk9VUDFcbiAgICApO1xuICAgIHZhciBleGl0X2NpcmNsZSA9IG5ldyBDaXJjbGUoNTAwLCAzMDAsIDEwKTtcbiAgICB2YXIgZXhpdF9vYmogPSBuZXcgR2FtZU9iamVjdChDb2xsaXNpb25EZXRlY3Rvci5DX0dST1VQMSwgZXhpdF9jaXJjbGUsIHVuZGVmaW5lZCwgZmFsc2UpO1xuICAgIGdhbWVfYXJlYS5hZGRfZXhpdChleGl0X29iaik7XG5cbiAgICB2YXIgaHVkID0gbmV3IEhVRChjdHgsIDAsIDYwMCwgNjAwLCA2ODApO1xuXG4gICAgdmFyIGxldmVsID0gbmV3IExldmVsKGN0eCwgaHVkLCBnYW1lX2FyZWEsIDEwMDAwLCBpZCwgMSk7XG4gICAgcmV0dXJuIGxldmVsO1xuICB9XG5cbiAgc3RhdGljIF9sb2FkX2xldmVsXzEoaWQsIGN0eCwgd2lkdGgsIGhlaWdodCl7XG4gICAgdmFyIGdhbWVfYXJlYSA9IG5ldyBHYW1lQXJlYShcbiAgICAgIHtcIm1pbl94XCI6MCxcbiAgICAgICAgXCJtaW5feVwiOjAsXG4gICAgICAgIFwibWF4X3hcIjo2MDAsXG4gICAgICAgIFwibWF4X3lcIjo2MDB9LFxuICAgICAgW3tcInhcIjogMzAsIFwieVwiOiAzMDAsIFwidl94XCI6IDAsIFwidl95XCI6IDB9XSxcbiAgICAgIFtdLFxuICAgICAgQ29sbGlzaW9uRGV0ZWN0b3IuQ19HUk9VUDFcbiAgICApO1xuICAgIHZhciBleGl0X2NpcmNsZSA9IG5ldyBDaXJjbGUoNTAwLCAzMDAsIDEwKTtcbiAgICB2YXIgZXhpdF9vYmogPSBuZXcgR2FtZU9iamVjdChDb2xsaXNpb25EZXRlY3Rvci5DX0dST1VQMSwgZXhpdF9jaXJjbGUsIHVuZGVmaW5lZCwgZmFsc2UpO1xuICAgIGdhbWVfYXJlYS5hZGRfZXhpdChleGl0X29iaik7XG5cblxuICAgIGxldCBtaW5feCA9IDI5MDtcbiAgICBsZXQgbWluX3kgPSAxMDA7XG4gICAgdmFyIGJsb2NrX25ldyA9IG5ldyBBQUJCKG1pbl94LCBtaW5feSwgbWluX3ggKyAyMCAsIG1pbl95ICsgNDAwKTtcbiAgICB2YXIgYmxvY2tfbmV3X2FhYmIgPSBuZXcgR2FtZU9iamVjdChDb2xsaXNpb25EZXRlY3Rvci5DX0dST1VQMSwgYmxvY2tfbmV3LCBibG9ja19uZXcsIGZhbHNlKTtcbiAgICBnYW1lX2FyZWEuYWRkX29iamVjdChibG9ja19uZXdfYWFiYik7XG5cbiAgICB2YXIgaHVkID0gbmV3IEhVRChjdHgsIDAsIDYwMCwgNjAwLCA2ODApO1xuXG4gICAgdmFyIGxldmVsID0gbmV3IExldmVsKGN0eCwgaHVkLCBnYW1lX2FyZWEsIDE1MDAwLCBpZCwgMSk7XG4gICAgcmV0dXJuIGxldmVsO1xuICB9XG5cbiAgc3RhdGljIF9sb2FkX2xldmVsXzIoaWQsIGN0eCwgd2lkdGgsIGhlaWdodCl7XG4gICAgdmFyIGdhbWVfYXJlYSA9IG5ldyBHYW1lQXJlYShcbiAgICAgIHtcIm1pbl94XCI6MCxcbiAgICAgICAgXCJtaW5feVwiOjAsXG4gICAgICAgIFwibWF4X3hcIjo2MDAsXG4gICAgICAgIFwibWF4X3lcIjo2MDB9LFxuICAgICAgW3tcInhcIjogMzAsIFwieVwiOiAzMDAsIFwidl94XCI6IDAsIFwidl95XCI6IDB9XSxcbiAgICAgIFtdLFxuICAgICAgQ29sbGlzaW9uRGV0ZWN0b3IuQ19HUk9VUDEsXG4gICAgICBmYWxzZVxuICAgICk7XG4gICAgdmFyIGV4aXRfY2lyY2xlID0gbmV3IENpcmNsZSg1MDAsIDMwMCwgMTApO1xuICAgIHZhciBleGl0X29iaiA9IG5ldyBHYW1lT2JqZWN0KENvbGxpc2lvbkRldGVjdG9yLkNfR1JPVVAxLCBleGl0X2NpcmNsZSwgdW5kZWZpbmVkLCBmYWxzZSk7XG4gICAgZ2FtZV9hcmVhLmFkZF9leGl0KGV4aXRfb2JqKTtcblxuXG4gICAgbGV0IG1pbl94ID0gMjkwO1xuICAgIGxldCBtaW5feSA9IDEwMDtcbiAgICB2YXIgYmxvY2tfbmV3ID0gbmV3IEFBQkIobWluX3gsIG1pbl95LCBtaW5feCArIDIwICwgbWluX3kgKyA0MDApO1xuICAgIHZhciBibG9ja19uZXdfYWFiYiA9IG5ldyBHYW1lT2JqZWN0KENvbGxpc2lvbkRldGVjdG9yLkNfR1JPVVAxLCBibG9ja19uZXcsIGJsb2NrX25ldywgZmFsc2UpO1xuICAgIGdhbWVfYXJlYS5hZGRfb2JqZWN0KGJsb2NrX25ld19hYWJiKTtcblxuICAgIHZhciBodWQgPSBuZXcgSFVEKGN0eCwgMCwgNjAwLCA2MDAsIDY4MCk7XG5cbiAgICB2YXIgbGV2ZWwgPSBuZXcgTGV2ZWwoY3R4LCBodWQsIGdhbWVfYXJlYSwgMTUwMDAsIGlkLCAxKTtcbiAgICByZXR1cm4gbGV2ZWw7XG4gIH1cblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IExldmVsTG9hZGVyO1xuIiwidmFyIEdhbWVPYmplY3QgPSByZXF1aXJlKCcuL0dhbWVPYmplY3QuanMnKTtcbmNvbnN0IE1BWF9GVUVMID0gMTAwO1xuY29uc3QgRU5HSU5FX1NUQVRVU19PSyA9ICdvayc7XG5jb25zdCBFTkdJTkVfU1RBVFVTX05PX0ZVRUwgPSAnbm9fZnVlbCc7XG5jb25zdCBFTkdJTkVfU1RBVFVTX1JFUExBQ0VfRlVFTCA9ICdyZXBsYWNpbmdfZnVlbCc7XG5cbmNsYXNzIFBsYXllciB7XG4gIGNvbnN0cnVjdG9yKGdhbWVfb2JqZWN0KXtcbiAgICB0aGlzLmdhbWVfb2JqZWN0ID0gZ2FtZV9vYmplY3Q7XG4gICAgLy8gZW5naW5lX3N0YXR1czpcbiAgICAvLyBvaywgbm9fZnVlbCwgcmVwbGFjaW5nX2Z1ZWxcbiAgICB0aGlzLmVuZ2luZV9zdGF0dXMgPSBFTkdJTkVfU1RBVFVTX09LO1xuICAgIHRoaXMuZnVlbF9lZmZpY2llbmN5ID0gMjA7XG4gICAgdGhpcy5hY2NlbGVyYXRpb24gPSAwLjI7XG4gICAgdGhpcy5iYXJyZWxzX29mX2Z1ZWxzID0gMDtcbiAgICB0aGlzLmN1cnJlbnRfZnVlbCA9IDA7XG4gICAgdGhpcy5mdWVsX3JlcGxhY2VtZW50X3RpbWUgPSAzMDAwO1xuICB9XG5cbiAgY2xvbmUoKXtcbiAgICB2YXIgY2xvbmVkX3BsYXllciA9IG5ldyBQbGF5ZXIodGhpcy5nYW1lX29iamVjdC5jbG9uZSgpKTtcbiAgICBjbG9uZWRfcGxheWVyLnNldF9mdWVsX2VmZmljaWVuY3kodGhpcy5nZXRfZnVlbF9lZmZpY2llbmN5KCkpO1xuICAgIGNsb25lZF9wbGF5ZXIuc2V0X2FjY2VsZXJhdGlvbih0aGlzLmdldF9hY2NlbGVyYXRpb24oKSk7XG4gICAgY2xvbmVkX3BsYXllci5zZXRfYmFycmVsc19vZl9mdWVscyh0aGlzLmdldF9iYXJyZWxzX29mX2Z1ZWxzKCkpO1xuICAgIGNsb25lZF9wbGF5ZXIuc2V0X2N1cnJlbnRfZnVlbCh0aGlzLmdldF9jdXJyZW50X2Z1ZWwoKSk7XG4gICAgY2xvbmVkX3BsYXllci5zZXRfZnVlbF9yZXBsYWNlbWVudF90aW1lKHRoaXMuZ2V0X2Z1ZWxfcmVwbGFjZW1lbnRfdGltZSgpKTtcbiAgICByZXR1cm4gY2xvbmVkX3BsYXllcjtcbiAgfVxuXG4gIHNldF9mdWVsX2VmZmljaWVuY3koZil7XG4gICAgdGhpcy5mdWVsX2VmZmljaWVuY3kgPSBmO1xuICB9XG5cbiAgZ2V0X2Z1ZWxfZWZmaWNpZW5jeSgpe1xuICAgIHJldHVybiB0aGlzLmZ1ZWxfZWZmaWNpZW5jeTtcbiAgfVxuXG4gIGNsZWFyX2ludGVyc2VjdGlvbigpe1xuICAgIHRoaXMuZ2FtZV9vYmplY3QuY2xlYXJfaW50ZXJzZWN0aW9uKClcbiAgfVxuXG4gIHVwZGF0ZSgpe1xuICAgIHRoaXMuY2hlY2tfZW5naW5lKCk7XG4gIH1cblxuICBnZXRfZnVlbF9yZXBsYWNlbWVudF9zdGFydF90aW1lKCl7XG4gICAgcmV0dXJuIHRoaXMuZnVlbF9yZXBsYWNlbWVudF9zdGFydDtcbiAgfVxuXG4gIGdldF9lbmdpbmVfc3RhdHVzKCl7XG4gICAgcmV0dXJuIHRoaXMuZW5naW5lX3N0YXR1cztcbiAgfVxuXG4gIGNoZWNrX2VuZ2luZSgpe1xuICAgIHN3aXRjaCh0aGlzLmVuZ2luZV9zdGF0dXMpe1xuICAgICAgY2FzZSBFTkdJTkVfU1RBVFVTX05PX0ZVRUw6XG4gICAgICAgIGlmKHRoaXMuYmFycmVsc19vZl9mdWVscyA+IDApe1xuICAgICAgICAgIHRoaXMucmVwbGFjZV9mdWVsKCk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIEVOR0lORV9TVEFUVVNfUkVQTEFDRV9GVUVMOlxuICAgICAgICB0aGlzLnRyeV9maW5pc2hfZnVlbF9yZXBsYWNlbWVudCgpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgRU5HSU5FX1NUQVRVU19PSzpcbiAgICAgICAgaWYodGhpcy5jdXJyZW50X2Z1ZWwgPCAxKXtcbiAgICAgICAgICBpZih0aGlzLmJhcnJlbHNfb2ZfZnVlbHMgPCAxKXtcbiAgICAgICAgICAgIHRoaXMuZW5naW5lX3N0YXR1cyA9IEVOR0lORV9TVEFUVVNfTk9fRlVFTDtcbiAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIHRoaXMucmVwbGFjZV9mdWVsKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIGFkZF9mdWVsX2JhcnJlbChuKXtcbiAgICB0aGlzLmJhcnJlbHNfb2ZfZnVlbHMgKz0gbjtcbiAgfVxuXG4gIGFkZF9mdWVsX3BlcmNlbnQocCl7XG4gICAgdGhpcy5jdXJyZW50X2Z1ZWwgKz0gcDtcbiAgICBpZih0aGlzLmN1cnJlbnRfZnVlbCA+IE1BWF9GVUVMKXtcbiAgICAgIHRoaXMuYmFycmVsc19vZl9mdWVscyArPSAodGhpcy5jdXJyZW50X2Z1ZWwgLyBNQVhfRlVFTCk7XG4gICAgICB0aGlzLmN1cnJlbnRfZnVlbCA9IHRoaXMuY3VycmVudF9mdWVsICUgTUFYX0ZVRUw7XG4gICAgfVxuICB9XG5cbiAgc2V0X2N1cnJlbnRfZnVlbChmKXtcbiAgICB0aGlzLmN1cnJlbnRfZnVlbCA9IGY7XG4gIH1cblxuICBnZXRfY3VycmVudF9mdWVsKCl7XG4gICAgcmV0dXJuIHRoaXMuY3VycmVudF9mdWVsO1xuICB9XG5cbiAgZ2V0X2Z1ZWxfcGVyY2VudCgpe1xuICAgIHJldHVybiB0aGlzLmN1cnJlbnRfZnVlbCAvIE1BWF9GVUVMO1xuICB9XG5cbiAgYnVybl9mdWVsKCl7XG4gICAgaWYodGhpcy5lbmdpbmVfc3RhdHVzID09IEVOR0lORV9TVEFUVVNfT0tcbiAgICAgICYmIHRoaXMuY3VycmVudF9mdWVsID49IHRoaXMuZnVlbF9lZmZpY2llbmN5KXtcbiAgICAgIHRoaXMuY3VycmVudF9mdWVsIC09IHRoaXMuZnVlbF9lZmZpY2llbmN5O1xuICAgICAgaWYodGhpcy5jdXJyZW50X2Z1ZWwgPCAxKXtcbiAgICAgICAgdGhpcy5yZXBsYWNlX2Z1ZWwoKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlOy8vIHllcyB3ZSBoYXZlIGZ1ZWwgd2FzIGJ1cm50XG4gICAgfWVsc2V7XG4gICAgICByZXR1cm4gZmFsc2U7Ly8gbm8gZnVlbCB3YXMgbm90IGJ1cm50XG4gICAgfVxuICB9XG5cbiAgcmVwbGFjZV9mdWVsKCl7XG4gICAgaWYodGhpcy5iYXJyZWxzX29mX2Z1ZWxzID49IDEpe1xuICAgICAgdGhpcy5iYXJyZWxzX29mX2Z1ZWxzIC09IDE7XG4gICAgICB0aGlzLmZ1ZWxfcmVwbGFjZW1lbnRfc3RhcnQgPSBEYXRlLm5vdygpO1xuICAgICAgdGhpcy5lbmdpbmVfc3RhdHVzID0gRU5HSU5FX1NUQVRVU19SRVBMQUNFX0ZVRUw7XG4gICAgfWVsc2V7XG4gICAgICB0aGlzLmVuZ2luZV9zdGF0dXMgPSBFTkdJTkVfU1RBVFVTX05PX0ZVRUw7XG4gICAgfVxuICB9XG5cbiAgdHJ5X2ZpbmlzaF9mdWVsX3JlcGxhY2VtZW50KCl7XG4gICAgaWYoRGF0ZS5ub3coKSAtIHRoaXMuZnVlbF9yZXBsYWNlbWVudF9zdGFydCBcbiAgICAgICAgPj0gdGhpcy5mdWVsX3JlcGxhY2VtZW50X3RpbWUpe1xuICAgICAgdGhpcy5jdXJyZW50X2Z1ZWwgPSBNQVhfRlVFTDtcbiAgICAgIHRoaXMuZW5naW5lX3N0YXR1cyA9IEVOR0lORV9TVEFUVVNfT0s7XG4gICAgICB0aGlzLmZ1ZWxfcmVwbGFjZW1lbnRfc3RhcnQgPSBudWxsO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfWVsc2V7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgc2V0X2Z1ZWxfcmVwbGFjZW1lbnRfdGltZSh0KXtcbiAgICB0aGlzLmZ1ZWxfcmVwbGFjZW1lbnRfdGltZSA9IHQ7XG4gIH1cblxuICBnZXRfZnVlbF9yZXBsYWNlbWVudF90aW1lKCl7XG4gICAgcmV0dXJuIHRoaXMuZnVlbF9yZXBsYWNlbWVudF90aW1lO1xuICB9XG5cbiAgc2V0X2JhcnJlbHNfb2ZfZnVlbHMobil7XG4gICAgdGhpcy5iYXJyZWxzX29mX2Z1ZWxzID0gbjtcbiAgfVxuXG4gIGdldF9iYXJyZWxzX29mX2Z1ZWxzKCl7XG4gICAgcmV0dXJuIHRoaXMuYmFycmVsc19vZl9mdWVscztcbiAgfVxuXG4gIHNldF9hY2NlbGVyYXRpb24oYWNjKXtcbiAgICB0aGlzLmFjY2VsZXJhdGlvbiA9IGFjYztcbiAgfVxuXG4gIGdldF9hY2NlbGVyYXRpb24oKXtcbiAgICByZXR1cm4gdGhpcy5hY2NlbGVyYXRpb247XG4gIH1cblxuICBzZXRfbGV2ZWwobGV2ZWwpe1xuICAgIHRoaXMubGV2ZWwgPSBsZXZlbDtcbiAgfVxufVxubW9kdWxlLmV4cG9ydHMgPSBQbGF5ZXI7XG5tb2R1bGUuZXhwb3J0cy5FTkdJTkVfU1RBVFVTX09LID0gRU5HSU5FX1NUQVRVU19PSztcbm1vZHVsZS5leHBvcnRzLkVOR0lORV9TVEFUVVNfTk9fRlVFTCA9IEVOR0lORV9TVEFUVVNfTk9fRlVFTDtcbm1vZHVsZS5leHBvcnRzLkVOR0lORV9TVEFUVVNfUkVQTEFDRV9GVUVMID0gRU5HSU5FX1NUQVRVU19SRVBMQUNFX0ZVRUwgO1xuIiwiY2xhc3MgVXNlckludGVyYWN0aW9uSGFuZGxlcntcblxuICBjb25zdHJ1Y3RvcihsZXZlbCl7XG4gICAgdGhpcy5sZXZlbCA9IGxldmVsO1xuICAgIHRoaXMubW92ZXMgPSB7XG4gICAgICBcIkFycm93RG93blwiOiBmYWxzZSxcbiAgICAgIFwiQXJyb3dVcFwiOiBmYWxzZSxcbiAgICAgIFwiQXJyb3dMZWZ0XCI6IGZhbHNlLFxuICAgICAgXCJBcnJvd1JpZ2h0XCI6IGZhbHNlXG4gICAgfTtcbiAgICB0aGlzLmtleV91cF9oYW5kbGVyID0gdGhpcy5rZXlfdXBfaGFuZGxlcl93cmFwcGVyKCk7XG4gICAgdGhpcy5rZXlfZG93bl9oYW5kbGVyID0gdGhpcy5rZXlfZG93bl9oYW5kbGVyX3dyYXBwZXIoKTtcbiAgfVxuXG4gIGtleV91cF9oYW5kbGVyX3dyYXBwZXIoKXtcbiAgICB2YXIgbGV2ZWwgPSB0aGlzLmxldmVsO1xuICAgIHZhciBtb3ZlcyA9IHRoaXMubW92ZXM7XG4gICAgdmFyIGZ1bmMgPSBmdW5jdGlvbihlKXtcbiAgICAgIHRoaXMubGV2ZWwgPSBsZXZlbDtcbiAgICAgIHRoaXMubW92ZXMgPSBtb3ZlcztcbiAgICAgIGlmKGUuY29kZSBpbiBtb3Zlcyl7XG4gICAgICAgIHZhciBwbGF5ZXJfb2JqID0gdGhpcy5sZXZlbC5wbGF5ZXIuZ2FtZV9vYmplY3Q7XG4gICAgICAgIHBsYXllcl9vYmouYV94ID0gMDtcbiAgICAgICAgcGxheWVyX29iai5hX3kgPSAwO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZnVuYztcbiAgfVxuXG4gIGtleV9kb3duX2hhbmRsZXJfd3JhcHBlcigpe1xuICAgIHZhciBsZXZlbCA9IHRoaXMubGV2ZWw7XG4gICAgdmFyIG1vdmVzID0gdGhpcy5tb3ZlcztcbiAgICB2YXIgZnVuYyA9IGZ1bmN0aW9uKGUpe1xuICAgICAgdGhpcy5sZXZlbCA9IGxldmVsO1xuICAgICAgdGhpcy5tb3ZlcyA9IG1vdmVzO1xuICAgICAgaWYoZS5jb2RlIGluIHRoaXMubW92ZXMpe1xuICAgICAgICB2YXIgcGxheWVyID0gdGhpcy5sZXZlbC5wbGF5ZXI7XG4gICAgICAgIHZhciBwbGF5ZXJfb2JqID0gcGxheWVyLmdhbWVfb2JqZWN0O1xuICAgICAgICBpZihwbGF5ZXIuYnVybl9mdWVsKCkpe1xuICAgICAgICAgIHN3aXRjaChlLmNvZGUpe1xuICAgICAgICAgICAgY2FzZSBcIkFycm93VXBcIjpcbiAgICAgICAgICAgICAgcGxheWVyX29iai5hX3kgLT0gcGxheWVyLmFjY2VsZXJhdGlvbjtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiQXJyb3dEb3duXCI6XG4gICAgICAgICAgICAgIHBsYXllcl9vYmouYV95ICs9IHBsYXllci5hY2NlbGVyYXRpb247XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcIkFycm93TGVmdFwiOlxuICAgICAgICAgICAgICBwbGF5ZXJfb2JqLmFfeCAtPSBwbGF5ZXIuYWNjZWxlcmF0aW9uO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJBcnJvd1JpZ2h0XCI6XG4gICAgICAgICAgICAgIHBsYXllcl9vYmouYV94ICs9IHBsYXllci5hY2NlbGVyYXRpb247XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfWVsc2V7XG4gICAgICAgIHN3aXRjaChlLmNvZGUpe1xuICAgICAgICAgIGNhc2UgXCJLZXlSXCI6XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcInByZXNzZWQgciwgc2hvdWxkIHJlbG9hZCBnYW1lIVwiKTtcbiAgICAgICAgICAgIHRoaXMubGV2ZWwuZ2FtZV9zdGF0dXMgPSAncmVzdGFydCc7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIFwiRW50ZXJcIjpcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwicHJlc3NlZCBlbnRlciwgd2lsbCBjb250aW51ZSBnYW1lIVwiKTtcbiAgICAgICAgICAgIGlmKHRoaXMubGV2ZWwuZ2FtZV9zdGF0dXMgPT0gJ3dpbicpe1xuICAgICAgICAgICAgICB0aGlzLmxldmVsLmdhbWVfc3RhdHVzID0gJ2NvbnRpbnVlJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmdW5jO1xuICB9XG5cbn1cbm1vZHVsZS5leHBvcnRzID0gVXNlckludGVyYWN0aW9uSGFuZGxlcjtcbiIsInZhciBHZW9tZXRyeSA9IHJlcXVpcmUoJy4vR2VvbWV0cnkuanMnKTtcbnZhciBDb2xsaXNpb25EZXRlY3RvciA9IHJlcXVpcmUoJy4uL3BoeXNpY3MvQ29sbGlzaW9uRGV0ZWN0b3IuanMnKTtcbnZhciBNeURlYnVnID0gcmVxdWlyZSgnLi4vTXlEZWJ1Zy5qcycpO1xuXG5jbGFzcyBBQUJCIGV4dGVuZHMgR2VvbWV0cnl7XG4gIGNvbnN0cnVjdG9yKG1pbl94LCBtaW5feSwgbWF4X3gsIG1heF95KXtcbiAgICBzdXBlcihHZW9tZXRyeS5BQUJCKTtcbiAgICB0aGlzLm1pbiA9IHt9O1xuICAgIHRoaXMubWluLnggPSBtaW5feDtcbiAgICB0aGlzLm1pbi55ID0gbWluX3k7XG4gICAgdGhpcy5tYXggPSB7fTtcbiAgICB0aGlzLm1heC54ID0gbWF4X3g7XG4gICAgdGhpcy5tYXgueSA9IG1heF95O1xuICAgIHRoaXMud2lkdGggPSBtYXhfeCAtIG1pbl94O1xuICAgIHRoaXMuaGVpZ2h0ID0gbWF4X3kgLSBtaW5feTtcbiAgfVxuXG4gIGNsb25lKCl7XG4gICAgcmV0dXJuIHN1cGVyLmNsb25lKG5ldyBBQUJCKHRoaXMubWluX3gsIHRoaXMubWluX3ksIHRoaXMubWF4X3gsIHRoaXMubWF4X3kpKTtcbiAgfVxuICByZW5kZXIoY3R4LCBpZD11bmRlZmluZWQpe1xuICAgIGN0eC5iZWdpblBhdGgoKTtcbiAgICBjdHgucmVjdChcbiAgICAgIHRoaXMubWluLngsXG4gICAgICB0aGlzLm1pbi55LFxuICAgICAgdGhpcy5tYXgueCAtIHRoaXMubWluLngsXG4gICAgICB0aGlzLm1heC55IC0gdGhpcy5taW4ueSk7XG4gICAgY3R4LnN0cm9rZSgpO1xuICAgIGlmKE15RGVidWcuZW5naW5lX2RlYnVnKXtcbiAgICAgIC8vIERFQlVHXG4gICAgICBpZihpZCl7XG4gICAgICAgIGN0eC5zdHJva2VUZXh0KGlkLCB0aGlzLm1pbi54LCB0aGlzLm1pbi55KTtcbiAgICAgIH1cbiAgICB9XG4gICAgY3R4LmNsb3NlUGF0aCgpO1xuICB9XG59XG5tb2R1bGUuZXhwb3J0cyA9IEFBQkI7XG4iLCJ2YXIgR2VvbWV0cnkgPSByZXF1aXJlKCcuL0dlb21ldHJ5LmpzJyk7XG52YXIgQ29sbGlzaW9uRGV0ZWN0b3IgPSByZXF1aXJlKCcuLi9waHlzaWNzL0NvbGxpc2lvbkRldGVjdG9yLmpzJyk7XG52YXIgTXlEZWJ1ZyA9IHJlcXVpcmUoJy4uL015RGVidWcuanMnKTtcblxuY2xhc3MgQ2lyY2xlIGV4dGVuZHMgR2VvbWV0cnl7XG4gIGNvbnN0cnVjdG9yKGNlbnRlcl94LCBjZW50ZXJfeSwgcmFkaXVzKXtcbiAgICBzdXBlcihHZW9tZXRyeS5DSVJDTEUpO1xuICAgIHRoaXMuY2VudGVyID0ge307XG4gICAgdGhpcy5jZW50ZXIueCA9IGNlbnRlcl94O1xuICAgIHRoaXMuY2VudGVyLnkgPSBjZW50ZXJfeTtcbiAgICB0aGlzLnIgPSByYWRpdXM7XG4gIH1cbiAgY2xvbmUoKXtcbiAgICByZXR1cm4gc3VwZXIuY2xvbmUobmV3IENpcmNsZSh0aGlzLmNlbnRlci54LCB0aGlzLmNlbnRlci55LCB0aGlzLnIpKTtcbiAgfVxuICByZW5kZXIoY3R4LCBpZD11bmRlZmluZWQpe1xuICAgIGN0eC5zYXZlKCk7XG4gICAgY3R4LmJlZ2luUGF0aCgpO1xuICAgIGlmKHRoaXMuZmlsbFN0eWxlKXtcbiAgICAgIGN0eC5maWxsU3R5bGUgPSB0aGlzLmZpbGxTdHlsZTtcbiAgICB9XG4gICAgaWYodGhpcy5zdHJva2VTdHlsZSl7XG4gICAgICBjdHguc3Ryb2tlU3R5bGUgPSB0aGlzLnN0cm9rZVN0eWxlO1xuICAgIH1cbiAgICBpZih0aGlzLmxpbmVXaWR0aCl7XG4gICAgICBjdHgubGluZVdpZHRoID0gdGhpcy5saW5lV2lkdGg7XG4gICAgfVxuICAgIGN0eC5hcmModGhpcy5jZW50ZXIueCx0aGlzLmNlbnRlci55LCB0aGlzLnIsIDAsIDIqTWF0aC5QSSk7XG4gICAgY3R4LnN0cm9rZSgpO1xuICAgIGlmKE15RGVidWcuZW5naW5lX2RlYnVnICYmIGlkKXtcbiAgICAgIC8vIERFQlVHXG4gICAgICBjdHguZm9udCA9IFwiNDBweCBBcmlhbFwiO1xuICAgICAgY3R4LnN0cm9rZVRleHQoaWQsIHRoaXMuY2VudGVyLngsIHRoaXMuY2VudGVyLnkpO1xuICAgIH1cbiAgICBjdHguY2xvc2VQYXRoKCk7XG4gICAgY3R4LnJlc3RvcmUoKTtcbiAgfVxufVxubW9kdWxlLmV4cG9ydHMgPSBDaXJjbGU7XG4iLCJjb25zdCBMSU5FID0gMTtcbmNvbnN0IEFBQkIgPSAyO1xuY29uc3QgQ0lSQ0xFID0gMztcblxuY2xhc3MgR2VvbWV0cnl7XG4gIGNvbnN0cnVjdG9yKHNoYXBlKXtcbiAgICB0aGlzLnNoYXBlID0gc2hhcGU7XG4gIH1cbiAgY2xvbmUoZ2VvbWV0cnkpe1xuICAgIGdlb21ldHJ5LnNldF9maWxsU3R5bGUodGhpcy5maWxsU3R5bGUpO1xuICAgIGdlb21ldHJ5LnNldF9zdHJva2VTdHlsZSh0aGlzLnN0cm9rZVN0eWxlKTtcbiAgICBnZW9tZXRyeS5zZXRfbGluZVdpZHRoKHRoaXMubGluZVdpZHRoKTtcbiAgICByZXR1cm4gZ2VvbWV0cnk7XG4gIH1cbiAgc2V0X2ZpbGxTdHlsZShmaWxsU3R5bGUpe1xuICAgIHRoaXMuZmlsbFN0eWxlID0gZmlsbFN0eWxlO1xuICB9XG4gIHNldF9zdHJva2VTdHlsZShzdHJva2VTdHlsZSl7XG4gICAgdGhpcy5zdHJva2VTdHlsZSA9IHN0cm9rZVN0eWxlO1xuICB9XG4gIHNldF9saW5lV2lkdGgobGluZVdpZHRoKXtcbiAgICB0aGlzLmxpbmVXaWR0aCA9IGxpbmVXaWR0aDtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEdlb21ldHJ5O1xubW9kdWxlLmV4cG9ydHMuTElORSA9IExJTkU7XG5tb2R1bGUuZXhwb3J0cy5BQUJCID0gQUFCQjtcbm1vZHVsZS5leHBvcnRzLkNJUkNMRSA9IENJUkNMRTtcbiIsInZhciBHZW9tZXRyeSA9IHJlcXVpcmUoJy4vR2VvbWV0cnkuanMnKTtcbnZhciBDb2xsaXNpb25EZXRlY3RvciA9IHJlcXVpcmUoJy4uL3BoeXNpY3MvQ29sbGlzaW9uRGV0ZWN0b3IuanMnKTtcbnZhciBNeURlYnVnID0gcmVxdWlyZSgnLi4vTXlEZWJ1Zy5qcycpO1xuXG5jbGFzcyBMaW5lIGV4dGVuZHMgR2VvbWV0cnl7XG4gIGNvbnN0cnVjdG9yKHBhcmFsbGVsX3RvLCBwb3MsIGxlbmd0aCl7XG4gICAgc3VwZXIoR2VvbWV0cnkuTElORSk7XG4gICAgdGhpcy5ib2R5X3R5cGUgPSBDb2xsaXNpb25EZXRlY3Rvci5DX0JPRFlfTElORTtcbiAgICB0aGlzLnBhcmFsbGVsX3RvID0gcGFyYWxsZWxfdG87XG4gICAgdGhpcy5wb3MgPSBwb3M7XG4gICAgdGhpcy5sZW5ndGggPSBsZW5ndGg7XG4gIH1cblxuICBjbG9uZSgpe1xuICAgIHZhciBjbG9uZWRfbGluZSA9IHN1cGVyLmNsb25lKG5ldyBMaW5lKHRoaXMucGFyYWxsZWxfdG8sIHRoaXMucG9zLCB0aGlzLmxlbmd0aCkpO1xuICAgIHJldHVybiBjbG9uZWRfbGluZTtcbiAgfVxuXG4gIHJlbmRlcihjdHgsIGlkPXVuZGVmaW5lZCl7XG4gICAgY3R4LmJlZ2luUGF0aCgpO1xuICAgIHN3aXRjaCh0aGlzLnBhcmFsbGVsX3RvKXtcbiAgICAgIGNhc2UgJ3gnOlxuICAgICAgICBjdHgubW92ZVRvKHRoaXMucG9zLngsIHRoaXMucG9zLnkpO1xuICAgICAgICBjdHgubGluZVRvKHRoaXMubGVuZ3RoLCB0aGlzLnBvcy55KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICd5JzpcbiAgICAgICAgY3R4Lm1vdmVUbyh0aGlzLnBvcy54LCB0aGlzLnBvcy55KTtcbiAgICAgICAgY3R4LmxpbmVUbyh0aGlzLnBvcy54LCB0aGlzLmxlbmd0aCk7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBpZihNeURlYnVnLmVuZ2luZV9kZWJ1ZyAmJiBpZCl7XG4gICAgICBjdHguc3Ryb2tlVGV4dChpZCwgdGhpcy5wb3MueCwgdGhpcy5wb3MueSk7XG4gICAgfVxuICAgIGN0eC5zdHJva2UoKTtcbiAgICBjdHguY2xvc2VQYXRoKCk7XG4gICAgY3R4LnJlc3RvcmUoKTtcbiAgfVxufVxubW9kdWxlLmV4cG9ydHMgPSBMaW5lO1xuIiwidmFyIENpcmNsZSA9IHJlcXVpcmUoJy4vZ2VvbWV0cnkvQ2lyY2xlLmpzJyk7XG52YXIgR2FtZU9iamVjdCA9IHJlcXVpcmUoJy4vZ2FtZS9HYW1lT2JqZWN0LmpzJyk7XG52YXIgSW1wbHVzZVJlc29sdmVyID0gcmVxdWlyZSgnLi9waHlzaWNzL0ltcGx1c2VSZXNvbHZlci5qcycpO1xudmFyIENvbGxpc2lvbkRldGVjdG9yID0gcmVxdWlyZSgnLi9waHlzaWNzL0NvbGxpc2lvbkRldGVjdG9yLmpzJyk7XG52YXIgVXNlckludGVyYWN0aW9uSGFuZGxlciA9IHJlcXVpcmUoJy4vZ2FtZS9Vc2VySW50ZXJhY3Rpb25IYW5kbGVyLmpzJyk7XG52YXIgTGV2ZWxMb2FkZXIgPSByZXF1aXJlKCcuL2dhbWUvTGV2ZWxMb2FkZXIuanMnKTtcbnZhciBQbGF5ZXIgPSByZXF1aXJlKCcuL2dhbWUvUGxheWVyLmpzJyk7XG5cbnZhciBNeURlYnVnID0gcmVxdWlyZSgnLi9NeURlYnVnLmpzJyk7XG5NeURlYnVnLmVuZ2luZV9kZWJ1ZyA9IDA7XG5cbnZhciBjYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdhbWVfZmllbGRcIik7XG52YXIgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG5jYW52YXMud2lkdGggPSA2MDA7XG5jYW52YXMuaGVpZ2h0ID0gNzAwO1xuXG52YXIgZGV0ZWN0b3IgPSBuZXcgQ29sbGlzaW9uRGV0ZWN0b3IoKTtcbnZhciByZXNvbHZlciA9IG5ldyBJbXBsdXNlUmVzb2x2ZXIoKTtcblxuZnVuY3Rpb24gcGh5c2ljc19lbmdpbmVfc3RlcF9uZXcoZ2FtZV9vYmplY3RzKXtcbiAgdmFyIGNvbGxpc2lvbl9wYWlycyA9IFtdO1xuICBnYW1lX29iamVjdHMuZmlsdGVyKG9iaiA9PiBvYmoubW92ZWFibGUpLmZvckVhY2goZnVuY3Rpb24ob2JqKXtcbiAgICBmb3IodmFyIGogPSAwIDsgaiA8IGdhbWVfb2JqZWN0cy5sZW5ndGggOyBqICsrKXtcbiAgICAgIGlmKG9iaiAhPT0gZ2FtZV9vYmplY3RzW2pdICl7XG4gICAgICAgIHZhciBjb250YWN0ID0gZGV0ZWN0b3IuY2FuX2NvbGxpZGUob2JqLCBnYW1lX29iamVjdHNbal0pO1xuICAgICAgICBpZihjb250YWN0KXtcbiAgICAgICAgICBjb2xsaXNpb25fcGFpcnMucHVzaChbb2JqLCBnYW1lX29iamVjdHNbal0sIGNvbnRhY3RdKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSk7XG5cbiAgY29sbGlzaW9uX3BhaXJzLmZvckVhY2goZnVuY3Rpb24oY19wYWlyKXtcbiAgICByZXNvbHZlci5yZXNvbHZlKGNfcGFpclswXSwgY19wYWlyWzFdLCBjX3BhaXJbMl0pO1xuICB9KTtcblxuICB2YXIgdGltZV9zbGljZSA9IDAuMTtcbiAgZ2FtZV9vYmplY3RzLmZpbHRlcihvYmogPT4gb2JqLm1vdmVhYmxlKS5mb3JFYWNoKGZ1bmN0aW9uKG9iail7XG4gICAgbGV0IHBvcyA9IG9iai5nZXRfcG9zaXRpb24oKTtcbiAgICBvYmouc2V0X3Bvc2l0aW9uKHBvcy54ICsgdGltZV9zbGljZSpvYmoudl94LCBwb3MueSArIHRpbWVfc2xpY2Uqb2JqLnZfeSk7XG4gICAgb2JqLnZfeCArPSB0aW1lX3NsaWNlKm9iai5hX3g7XG4gICAgb2JqLnZfeSArPSB0aW1lX3NsaWNlKm9iai5hX3k7XG4gIH0pO1xufVxuXG52YXIgcGxheWVyX2JvZHkgPSBuZXcgQ2lyY2xlKDMwLCAzMCwgMTApO1xudmFyIHBsYXllcl9vYmogPSBuZXcgR2FtZU9iamVjdChDb2xsaXNpb25EZXRlY3Rvci5DX0dST1VQMSwgcGxheWVyX2JvZHksIHBsYXllcl9ib2R5LCB0cnVlKTtcbnZhciBwbGF5ZXIgPSBuZXcgUGxheWVyKHBsYXllcl9vYmopO1xuXG52YXIgY3VycmVudF9sZXZlbF9udW1iZXIgPSAwO1xudmFyIGxldmVscyA9IExldmVsTG9hZGVyLmdldF9sZXZlbHMoY3R4LCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xudmFyIHVpX2hhbmRsZXIgPSBjbG9uZV9hbmRfc3RhcnRfbGV2ZWwobGV2ZWxzW2N1cnJlbnRfbGV2ZWxfbnVtYmVyXSwgcGxheWVyKTtcblxuZnVuY3Rpb24gY2xvbmVfYW5kX3N0YXJ0X2xldmVsKGxldmVsLCBwbGF5ZXIpe1xuICB2YXIgY2xvbmVkX2xldmVsID0gbGV2ZWwuY2xvbmUoKTtcbiAgdmFyIGNsb25lZF9wbGF5ZXIgPSBwbGF5ZXIuY2xvbmUoKTtcbiAgY2xvbmVkX2xldmVsLmluaXRfcGxheWVyKGNsb25lZF9wbGF5ZXIpO1xuICB2YXIgdWlfaGFuZGxlciA9IG5ldyBVc2VySW50ZXJhY3Rpb25IYW5kbGVyKGNsb25lZF9sZXZlbCk7XG4gIHJldHVybiB1aV9oYW5kbGVyO1xufVxuXG5mdW5jdGlvbiBtYWluTG9vcE5ldygpe1xuICAvLyBzdGFydCB0aGUgZ2FtZVxuICBpZighdWlfaGFuZGxlci5sZXZlbC5zdGFydF90aW1lKXtcbiAgICBjb25zb2xlLmxvZygnc3RhcnRpbmcgbGV2ZWw6JyArIGN1cnJlbnRfbGV2ZWxfbnVtYmVyKTtcbiAgICBjb25zb2xlLmxvZygnbGV2ZWwgaWQgaXM6JyArIHVpX2hhbmRsZXIubGV2ZWwuaWQpO1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIHVpX2hhbmRsZXIua2V5X2Rvd25faGFuZGxlciwgZmFsc2UpO1xuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXl1cFwiLCB1aV9oYW5kbGVyLmtleV91cF9oYW5kbGVyLCBmYWxzZSk7XG4gICAgdWlfaGFuZGxlci5sZXZlbC5zdGFydF9nYW1lKCk7XG4gIH1cbiAgaWYodWlfaGFuZGxlci5sZXZlbC5nYW1lX3N0YXR1cyA9PSAnc3RhcnRlZCcpe1xuICAgIGZvcih2YXIgaSA9IDAgOyBpIDwgMTAgOyBpICsrKXtcbiAgICAgIHBoeXNpY3NfZW5naW5lX3N0ZXBfbmV3KHVpX2hhbmRsZXIubGV2ZWwuZ2FtZV9hcmVhLmdldF9nYW1lX29iamVjdHMoKSk7XG4gICAgfVxuICAgIHVpX2hhbmRsZXIubGV2ZWwucGxheWVyLnVwZGF0ZSgpO1xuICAgIGN0eC5zYXZlKCk7XG4gICAgY3R4LmNsZWFyUmVjdCgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuICAgIHVpX2hhbmRsZXIubGV2ZWwuZ2FtZV9hcmVhLmdldF9nYW1lX29iamVjdHMoKS5mb3JFYWNoKGZ1bmN0aW9uKG9iail7XG4gICAgICBvYmouZGlzcGxheV9ib2R5LnJlbmRlcihjdHgsIG9iai5pZCk7XG4gICAgfSk7XG4gICAgdWlfaGFuZGxlci5sZXZlbC5odWQucmVuZGVyKCk7XG4gICAgY3R4LnJlc3RvcmUoKTtcbiAgfVxuXG4gIHVpX2hhbmRsZXIubGV2ZWwuY2hlY2tfZ2FtZV9lbmQoKTtcbiAgbGV0IGdhbWVfZW5kX3N0YXR1cyA9IHVpX2hhbmRsZXIubGV2ZWwuZ2FtZV9zdGF0dXM7XG4gIGlmKGdhbWVfZW5kX3N0YXR1cyA9PSAnd2luJyl7XG4gICAgY29uc29sZS5sb2coJ2dhbWUgd29uJylcbiAgICBjdHguc2F2ZSgpO1xuICAgIGN0eC5mb250ID0gXCIzMHB4IEFyaWFsXCI7XG4gICAgY3R4LmZpbGxTdHlsZSA9ICdncmVlbic7XG4gICAgY3R4LmZpbGxUZXh0KFwiWW91IHdpbiEgUHJlc3MgRW50ZXIgdG8gcGxheSBuZXh0IGxldmVsLlwiLCAxMCwgMTAwKTtcbiAgICBjdHgucmVzdG9yZSgpO1xuICB9ZWxzZSBpZihnYW1lX2VuZF9zdGF0dXMgPT0gJ3Jlc3RhcnQnKXtcbiAgICBjb25zb2xlLmxvZygncmVzdGFydGluZyBsZXZlbCcpO1xuICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIHVpX2hhbmRsZXIua2V5X2Rvd25faGFuZGxlciwgZmFsc2UpO1xuICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJrZXl1cFwiLCB1aV9oYW5kbGVyLmtleV91cF9oYW5kbGVyLCBmYWxzZSk7XG4gICAgLy8gc3RhcnQgbmV4dCBsZXZlbFxuICAgIHVpX2hhbmRsZXIgPSBjbG9uZV9hbmRfc3RhcnRfbGV2ZWwobGV2ZWxzW2N1cnJlbnRfbGV2ZWxfbnVtYmVyXSwgcGxheWVyKTtcbiAgfWVsc2UgaWYoZ2FtZV9lbmRfc3RhdHVzID09ICdjb250aW51ZScpe1xuICAgIGlmKGxldmVscy5sZW5ndGggPiBjdXJyZW50X2xldmVsX251bWJlciArIDEpe1xuICAgICAgY29uc29sZS5sb2coJ2dhbWUgZW5kcywgaGF2ZSBtb3JlIGxldmVsLCBsb2FkIG5leHQgbGV2ZWwnKTtcbiAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIHVpX2hhbmRsZXIua2V5X2Rvd25faGFuZGxlciwgZmFsc2UpO1xuICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImtleXVwXCIsIHVpX2hhbmRsZXIua2V5X3VwX2hhbmRsZXIsIGZhbHNlKTtcbiAgICAgIGN1cnJlbnRfbGV2ZWxfbnVtYmVyICsrO1xuICAgICAgcGxheWVyID0gdWlfaGFuZGxlci5sZXZlbC5lbmRfZ2FtZSgpO1xuICAgICAgLy8gc3RhcnQgbmV4dCBsZXZlbFxuICAgICAgdWlfaGFuZGxlciA9IGNsb25lX2FuZF9zdGFydF9sZXZlbChsZXZlbHNbY3VycmVudF9sZXZlbF9udW1iZXJdLCBwbGF5ZXIpO1xuICAgIH1lbHNle1xuICAgICAgY29uc29sZS5sb2coJ2dhbWUgZW5kcywgbm8gbW9yZSBsZXZlbCcpO1xuICAgIH1cbiAgfWVsc2UgaWYoZ2FtZV9lbmRfc3RhdHVzID09ICdsb3N0Jyl7XG4gICAgY29uc29sZS5sb2coJ2dhbWUgbG9zdCcpXG4gICAgY3R4LnNhdmUoKTtcbiAgICBjdHguZm9udCA9IFwiMzBweCBBcmlhbFwiO1xuICAgIGN0eC5maWxsU3R5bGUgPSAncmVkJztcbiAgICBjdHguZmlsbFRleHQoXCJZb3UgbG9zdC4uLiBQcmVzcyByIHRvIHJlcGxheSB0aGlzIGxldmVsLlwiLCAxMCwgMTAwKTtcbiAgICBjdHgucmVzdG9yZSgpO1xuICB9XG59XG5cbmNvbnNvbGUubG9nKCdzdGFydCEnKTtcbnNldEludGVydmFsKG1haW5Mb29wTmV3LCAxMCk7XG4iLCJjbGFzcyBNYXRoVXRpbGl0eXtcblxuICBzdGF0aWMgZGlzdGFuY2UoeDEsIHkxLCB4MiwgeTIpe1xuICAgIHJldHVybiBNYXRoLnNxcnQoXG4gICAgICBNYXRoLnBvdyh4MSAtIHgyLCAyKVxuICAgICAgKyBNYXRoLnBvdyh5MSAtIHkyLCAyKVxuICAgICk7XG4gIH1cblxuICBzdGF0aWMgZGlzdGFuY2Vfc3F1YXJlKHgxLCB5MSwgeDIsIHkyKXtcbiAgICBsZXQgeF9zdWIgPSB4MSAtIHgyO1xuICAgIGxldCB5X3N1YiA9IHkxIC0geTI7XG4gICAgcmV0dXJuIHhfc3ViICogeF9zdWIgKyB5X3N1YiAqIHlfc3ViO1xuICB9XG5cbiAgLy8gcmV0dXJuIHggIHdoZW4gbWluIDwgeCA8IG1heCwgb3RoZXIgd2lzZSByZXR1cm4gd2hpY2ggZXZlciBpcyBjbG9zZXIgdG8geCBmcm9tIChtaW4sIG1heClcbiAgc3RhdGljIGNsYW1wKHgsIG1pbiwgbWF4KXtcbiAgICByZXR1cm4geCA8IG1pbiA/IG1pbiA6IHggPiBtYXggPyBtYXggOiB4O1xuICB9XG5cbn1cbm1vZHVsZS5leHBvcnRzID0gTWF0aFV0aWxpdHk7XG4iLCJjbGFzcyBWZWN0b3J7XG4gIGNvbnN0cnVjdG9yKHgsIHkpe1xuICAgIHRoaXMueCA9IHg7XG4gICAgdGhpcy55ID0geTtcbiAgfVxuXG4gIGNsb25lKCl7XG4gICAgcmV0dXJuIG5ldyBWZWN0b3IodGhpcy54LCB0aGlzLnkpO1xuICB9XG5cbiAgcm90YXRlX2Nsb2Nrd2lzZV85MCgpe1xuICAgIHJldHVybiBuZXcgVmVjdG9yKC0gdGhpcy55LCB0aGlzLngpO1xuICB9XG5cbiAgbWFnbml0dWRlKCl7XG4gICAgcmV0dXJuIE1hdGguc3FydCh0aGlzLngqdGhpcy54ICsgdGhpcy55KnRoaXMueSk7XG4gIH1cblxuICBkb3RfcHJvZHVjdCh2KXtcbiAgICByZXR1cm4gdGhpcy54ICogdi54ICsgdGhpcy55ICogdi55O1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gVmVjdG9yO1xuIiwidmFyIEltcGx1c2VSZXNvbHZlciA9IHJlcXVpcmUoJy4vSW1wbHVzZVJlc29sdmVyLmpzJyk7XG52YXIgQ29udGFjdCA9IHJlcXVpcmUoJy4vQ29udGFjdC5qcycpO1xuXG52YXIgR2VvbWV0cnkgPSByZXF1aXJlKCcuLi9nZW9tZXRyeS9HZW9tZXRyeS5qcycpO1xuXG52YXIgTWF0aFV0aWxpdHkgPSByZXF1aXJlKCcuLi9tYXRoL01hdGhVdGlsaXR5LmpzJyk7XG5cbnZhciBNeURlYnVnID0gcmVxdWlyZSgnLi4vTXlEZWJ1Zy5qcycpO1xuXG5jb25zdCBDT0xMSVNJT05fR1JPVVBTID0gWzB4MCxcbiAgMHgxLCAweDIsIDB4NCwgMHg4XVxuLy8weDEwLCAweDIwLCAweDQwLCAweDgwLFxuLy8weDEwMCwgMHgyMDAsIDB4NDAwLCAweDgwMCxcbi8vMHgxMDAwLCAweDIwMDAsIDB4NDAwMCwgMHg4MDAwXTtcbmNvbnN0IE5PX0NPTExJU0lPTiA9IENPTExJU0lPTl9HUk9VUFNbMF07XG5jb25zdCBDX0dST1VQMSA9IENPTExJU0lPTl9HUk9VUFNbMV07XG5jb25zdCBDX0dST1VQMiA9IENPTExJU0lPTl9HUk9VUFNbMl07XG5jb25zdCBDX0dST1VQMyA9IENPTExJU0lPTl9HUk9VUFNbM107XG5jb25zdCBDX0dST1VQNCA9IENPTExJU0lPTl9HUk9VUFNbNF07XG5cbmNsYXNzIENvbGxpc2lvbkRldGVjdG9ye1xuXG4gIC8vY29uc3RydWN0b3IoKXtcbiAgICAvL2NvbnNvbGUubG9nKCdbQ29sbGlzaW9uRGV0ZWN0b3JdIGNvbnN0cnVjdGluZycpO1xuICAvL31cblxuICBjYW5fY29sbGlkZShvYmoxLCBvYmoyKXtcbiAgICBsZXQgZ3JvdXBfY2FuX2NvbGxpZGUgPSAob2JqMS5jb2xsaXNpb25fZ3JvdXAgJiBvYmoyLmNvbGxpc2lvbl9ncm91cCkgPiAwO1xuICAgIGlmKCFncm91cF9jYW5fY29sbGlkZSkgcmV0dXJuIGZhbHNlO1xuICAgIGlmKCFvYmoxLm1vdmVhYmxlICYmICFvYmoyLm1vdmVhYmxlKSByZXR1cm4gZmFsc2U7XG5cbiAgICBsZXQgY29sbGlzaW9uX3R5cGUgPSBvYmoxLmNvbGxpc2lvbl9ib2R5LnNoYXBlICsgJzonICsgb2JqMi5jb2xsaXNpb25fYm9keS5zaGFwZTtcbiAgICAvLyBGSVhNRTogb3B0aW1pemUgd2l0aCBiaXQgb3BlcmF0aW9uLCBiaXQgY29tcGFyaXNvbiBzaG91bGQgYmUgbXVjaCBmYXN0ZXIgdGhhbiBzdHJpbmdcbiAgICBsZXQgcmVzdWx0ID0gdW5kZWZpbmVkO1xuICAgIHN3aXRjaChjb2xsaXNpb25fdHlwZSl7XG4gICAgICBjYXNlIEdlb21ldHJ5LkFBQkIgKyAnOicgKyBHZW9tZXRyeS5BQUJCOlxuICAgICAgICByZXN1bHQgPSB0aGlzLmFhYmJfMl9hYWJiX2Nhbl9jb2xsaWRlKG9iajEsIG9iajIpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgR2VvbWV0cnkuQ0lSQ0xFICsgJzonICsgR2VvbWV0cnkuQ0lSQ0xFOlxuICAgICAgICByZXN1bHQgPSB0aGlzLmNpcmNsZV8yX2NpcmNsZV9jYW5fY29sbGlkZShvYmoxLCBvYmoyKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIEdlb21ldHJ5LkFBQkIgKyAnOicgKyBHZW9tZXRyeS5DSVJDTEU6XG4gICAgICAgIHJlc3VsdCA9IHRoaXMuY2lyY2xlXzJfYWFiYl9jYW5fY29sbGlkZShvYmoyLCBvYmoxKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIEdlb21ldHJ5LkNJUkNMRSArICc6JyArIEdlb21ldHJ5LkFBQkI6XG4gICAgICAgIHJlc3VsdCA9IHRoaXMuY2lyY2xlXzJfYWFiYl9jYW5fY29sbGlkZShvYmoxLCBvYmoyKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIEdlb21ldHJ5LkNJUkNMRSArICc6JyArIEdlb21ldHJ5LkxJTkU6XG4gICAgICAgIHJlc3VsdCA9IHRoaXMuY2lyY2xlXzJfbGluZV9jYW5fY29sbGlkZShvYmoxLCBvYmoyKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIEdlb21ldHJ5LkxJTkUgKyAnOicgKyBHZW9tZXRyeS5DSVJDTEU6XG4gICAgICAgIHJlc3VsdCA9IHRoaXMuY2lyY2xlXzJfbGluZV9jYW5fY29sbGlkZShvYmoyLCBvYmoxKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIEdlb21ldHJ5LkFBQkIgKyAnOicgKyBHZW9tZXRyeS5MSU5FOlxuICAgICAgICByZXN1bHQgPSB0aGlzLmFhYmJfMl9saW5lX2Nhbl9jb2xsaWRlKG9iajEsIG9iajIpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgR2VvbWV0cnkuTElORSsgJzonICsgR2VvbWV0cnkuQUFCQjpcbiAgICAgICAgcmVzdWx0ID0gdGhpcy5hYWJiXzJfbGluZV9jYW5fY29sbGlkZShvYmoyLCBvYmoxKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGlmKCFyZXN1bHQpe1xuICAgICAgb2JqMS5yZW1vdmVfaW50ZXJzZWN0aW9uKG9iajIpO1xuICAgICAgb2JqMi5yZW1vdmVfaW50ZXJzZWN0aW9uKG9iajEpO1xuICAgICAgb2JqMS5yZW1vdmVfaW1wdWxzZV9yZXNvbHZlX3RhcmdldChvYmoyKTtcbiAgICAgIG9iajIucmVtb3ZlX2ltcHVsc2VfcmVzb2x2ZV90YXJnZXQob2JqMSk7XG4gICAgfWVsc2V7XG4gICAgICBvYmoxLnNldF9pbnRlcnNlY3Rpb24ob2JqMik7XG4gICAgICBvYmoyLnNldF9pbnRlcnNlY3Rpb24ob2JqMSk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBhYWJiXzJfYWFiYl9jYW5fY29sbGlkZShvYmoxLCBvYmoyKXtcbiAgICBsZXQgYWIxID0gb2JqMS5jb2xsaXNpb25fYm9keTtcbiAgICBsZXQgYWIyID0gb2JqMi5jb2xsaXNpb25fYm9keTtcbiAgICBsZXQgbWluMSA9IGFiMS5taW47XG4gICAgbGV0IG1heDEgPSBhYjEubWF4O1xuICAgIGxldCBtaW4yID0gYWIyLm1pbjtcbiAgICBsZXQgbWF4MiA9IGFiMi5tYXg7XG4gICAgbGV0IHJlc3VsdCA9IHVuZGVmaW5lZDtcbiAgICBpZigobWluMS54IDw9IG1heDIueCAmJiBtYXgxLnggPj0gbWluMi54KVxuICAgICAgJiYgKG1pbjEueSA8PSBtYXgyLnkgJiYgbWF4MS55ID49IG1pbjIueSkpe1xuICAgICAgcmVzdWx0ID0gbmV3IENvbnRhY3Qob2JqMSwgb2JqMik7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBjaXJjbGVfMl9jaXJjbGVfY2FuX2NvbGxpZGUob2JqMSwgb2JqMil7XG4gICAgbGV0IGMxID0gb2JqMS5jb2xsaXNpb25fYm9keTtcbiAgICBsZXQgYzIgPSBvYmoyLmNvbGxpc2lvbl9ib2R5O1xuICAgIGxldCBjZW50ZXIxID0gYzEuY2VudGVyO1xuICAgIGxldCBjZW50ZXIyID0gYzIuY2VudGVyO1xuICAgIGxldCBjaXJjbGVfY2VudGVyX2Rpc3RhbmNlID0gTWF0aFV0aWxpdHkuZGlzdGFuY2Vfc3F1YXJlKGNlbnRlcjEueCwgY2VudGVyMS55LCBjZW50ZXIyLngsIGNlbnRlcjIueSk7XG4gICAgbGV0IHJlc3VsdCA9IHVuZGVmaW5lZDtcbiAgICBpZihjaXJjbGVfY2VudGVyX2Rpc3RhbmNlIDw9IE1hdGgucG93KGMxLnIgKyBjMi5yLCAyKSl7XG4gICAgICByZXN1bHQgPSBuZXcgQ29udGFjdChvYmoxLCBvYmoyKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIGNpcmNsZV8yX2FhYmJfY2FuX2NvbGxpZGUob2JqMSwgb2JqMil7XG4gICAgdmFyIGMgPSBvYmoxLmNvbGxpc2lvbl9ib2R5O1xuICAgIHZhciBhYiA9IG9iajIuY29sbGlzaW9uX2JvZHk7XG4gICAgbGV0IGNlbnRlciA9IGMuY2VudGVyO1xuICAgIGxldCBjbGFtcF94ID0gTWF0aFV0aWxpdHkuY2xhbXAoY2VudGVyLngsIGFiLm1pbi54LCBhYi5tYXgueCk7XG4gICAgbGV0IGNsYW1wX3kgPSBNYXRoVXRpbGl0eS5jbGFtcChjZW50ZXIueSwgYWIubWluLnksIGFiLm1heC55KTtcbiAgICBsZXQgcmVzdWx0ID0gMDtcbiAgICBpZihNYXRoLmFicyhjZW50ZXIueCAtIGNsYW1wX3gpIDwgYy5yXG4gICAgICAmJiBNYXRoLmFicyhjZW50ZXIueSAtIGNsYW1wX3kpIDwgYy5yKXtcbiAgICAgIHJlc3VsdCA9IHtcbiAgICAgICAgJ2NvbnRhY3RfdHlwZSc6IDAsXG4gICAgICAgICdjb250YWN0Jzoge1xuICAgICAgICAgICdwb2ludCc6IHtcbiAgICAgICAgICAgICd4JzogY2xhbXBfeCxcbiAgICAgICAgICAgICd5JzogY2xhbXBfeSB9LFxuICAgICAgICAgICdhbGlnbmVkX2F4aXMnOiAnJ319O1xuICAgICAgaWYoKGNsYW1wX3ggPT0gYWIubWluLnggfHwgY2xhbXBfeCA9PSBhYi5tYXgueClcbiAgICAgICAgJiYoY2xhbXBfeSA9PSBhYi5taW4ueSB8fCBjbGFtcF95ID09IGFiLm1heC55KSl7XG4gICAgICAgIC8vIHBvaW50IGNvbnRhY3Qgd2l0aCBjb3JuZXJcbiAgICAgICAgbGV0IGNlbnRlcl90b19jbGFtcCA9IE1hdGhVdGlsaXR5LmRpc3RhbmNlX3NxdWFyZShcbiAgICAgICAgICBjbGFtcF94LFxuICAgICAgICAgIGNsYW1wX3ksXG4gICAgICAgICAgYy5jZW50ZXIueCxcbiAgICAgICAgICBjLmNlbnRlci55KTtcbiAgICAgICAgaWYoIGNlbnRlcl90b19jbGFtcCA8PSBjLnIqYy5yKXtcbiAgICAgICAgICByZXN1bHRbJ2NvbnRhY3RfdHlwZSddID0gQ29udGFjdC5DT05UQUNUX0NJUkNMRV8yX1BPSU5UO1xuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAvLyBjb2xsaXNpb24gZGlkbid0IGhhcHBlblxuICAgICAgICAgIHJlc3VsdCA9IDA7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGVsc2UgaWYoY2xhbXBfeCA9PSBhYi5taW4ueCB8fCBjbGFtcF94ID09IGFiLm1heC54KXtcbiAgICAgICAgLy8gY29sbGlzaW9uIG9uIHkgYXhpc1xuICAgICAgICByZXN1bHRbJ2NvbnRhY3RfdHlwZSddID0gQ29udGFjdC5DT05UQUNUX0NJUkNMRV8yX0FCX0xJTkU7XG4gICAgICAgIHJlc3VsdFsnY29udGFjdCddWydhbGlnbmVkX2F4aXMnXSA9ICd5JztcbiAgICAgIH1lbHNlIGlmKGNsYW1wX3kgPT0gYWIubWluLnkgfHwgY2xhbXBfeSA9PSBhYi5tYXgueSl7XG4gICAgICAgIC8vIGNvbGxpc2lvbiBvbiB4IGF4aXNcbiAgICAgICAgcmVzdWx0Wydjb250YWN0X3R5cGUnXSA9IENvbnRhY3QuQ09OVEFDVF9DSVJDTEVfMl9BQl9MSU5FO1xuICAgICAgICByZXN1bHRbJ2NvbnRhY3QnXVsnYWxpZ25lZF9heGlzJ10gPSAneCc7XG4gICAgICB9ZWxzZXtcbiAgICAgICAgLy8gY2lyY2xlIGNlbnRlciBpbnNpZGUgQUFCQlxuICAgICAgICBpZihNeURlYnVnLmVuZ2luZV9kZWJ1Zyl7XG4gICAgICAgICAgY29uc29sZS5sb2coXCJjaXJjbGUgY2VudGVyIGluc2lkZSBhYWJiIVwiKTtcbiAgICAgICAgICBjb25zb2xlLmxvZygnY2lyY2xlOicgKyBjLmlkICsgJywgYWFiYjonICsgYWIuaWQpO1xuICAgICAgICB9XG4gICAgICAgIHJlc3VsdFsnY29udGFjdF90eXBlJ10gPSBDb250YWN0LkNPTlRBQ1RfQ0lSQ0xFXzJfUE9JTlQ7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBjaXJjbGVfMl9saW5lX2Nhbl9jb2xsaWRlKG9iajEsIG9iajIpe1xuICAgIGxldCBjID0gb2JqMS5jb2xsaXNpb25fYm9keTtcbiAgICBsZXQgbCA9IG9iajIuY29sbGlzaW9uX2JvZHk7XG5cbiAgICBsZXQgY2VudGVyID0gYy5jZW50ZXI7XG4gICAgbGV0IHJlc3VsdCA9IDA7XG4gICAgc3dpdGNoKGwucGFyYWxsZWxfdG8pe1xuICAgICAgY2FzZSAneCc6XG4gICAgICAgIGlmKE1hdGguYWJzKGNlbnRlci55IC0gbC5wb3MueSkgPCBjLnIpe1xuICAgICAgICAgIHJlc3VsdCA9IG5ldyBDb250YWN0KG9iajEsIG9iajIpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAneSc6XG4gICAgICAgIGlmKE1hdGguYWJzKGNlbnRlci54IC0gbC5wb3MueCkgPCBjLnIpe1xuICAgICAgICAgIHJlc3VsdCA9IG5ldyBDb250YWN0KG9iajEsIG9iajIpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgYWFiYl8yX2xpbmVfY2FuX2NvbGxpZGUob2JqMSwgb2JqMil7XG4gICAgbGV0IGFiID0gb2JqMS5jb2xsaXNpb25fYm9keTtcbiAgICBsZXQgbCA9IG9iajIuY29sbGlzaW9uX2JvZHk7XG4gICAgbGV0IG1pbiA9IGFiLm1pbjtcbiAgICBsZXQgbWF4ID0gYWIubWF4O1xuICAgIGxldCBjZW50ZXIgPSB7fTtcbiAgICBjZW50ZXIueCA9IChhYi5taW4ueCArIGFiLm1heC54KSAvIDI7XG4gICAgY2VudGVyLnkgPSAoYWIubWluLnkgKyBhYi5tYXgueSkgLyAyO1xuICAgIGxldCByZXN1bHQgPSB1bmRlZmluZWQ7XG4gICAgc3dpdGNoKGwucGFyYWxsZWxfdG8pe1xuICAgICAgY2FzZSAneCc6XG4gICAgICAgIGlmKGNlbnRlci55IDw9IG1heC55ICYmIGNlbnRlci55ID49IG1pbi55KXtcbiAgICAgICAgICByZXN1bHQgPSBuZXcgQ29udGFjdChvYmoxLCBvYmoyKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ3knOlxuICAgICAgICBpZihjZW50ZXIueCA8PSBtYXgueCAmJiBjZW50ZXIueCA+PSBtaW4ueCl7XG4gICAgICAgICAgcmVzdWx0ID0gbmV3IENvbnRhY3Qob2JqMSwgb2JqMik7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBDb2xsaXNpb25EZXRlY3Rvcjtcbm1vZHVsZS5leHBvcnRzLk5PX0NPTExJU0lPTiA9IE5PX0NPTExJU0lPTjtcbm1vZHVsZS5leHBvcnRzLkNfR1JPVVAxID0gQ19HUk9VUDE7XG5tb2R1bGUuZXhwb3J0cy5DX0dST1VQMiA9IENfR1JPVVAyO1xubW9kdWxlLmV4cG9ydHMuQ19HUk9VUDMgPSBDX0dST1VQMztcbm1vZHVsZS5leHBvcnRzLkNfR1JPVVA0ID0gQ19HUk9VUDQ7XG4iLCJjb25zdCBDT05UQUNUX0NJUkNMRV8yX1BPSU5UID0gMTtcbmNvbnN0IENPTlRBQ1RfQ0lSQ0xFXzJfQUJfTElORSA9IDI7XG5cbi8vIFRPRE86IG9wdGltaXplIHRoZSBzdHJ1Y3R1cmUgb2YgQ29udGFjdCBhbmQgbWFrZSBzdXJlIFxuLy8gQ29sbGlzaW9uRGV0ZWN0b3IgYW5kIEltcGx1c2VSZXNvbHZlciBhcmUgdXNpbmcgaXQgY29ycmVjdGx5XG5cbmNsYXNzIENvbnRhY3R7XG4gIGNvbnN0cnVjdG9yKG9iajEsIG9iajIpe1xuICAgIHRoaXMub2JqMSA9IG9iajE7XG4gICAgdGhpcy5vYmoyID0gb2JqMjtcbiAgfVxuXG4gIC8vIGNvbnRhY3RfcG9pbnQgZXhhbXBsZToge3g6IDAsIHk6IDB9XG4gIHNldF9wb2ludF9jb250YWN0KGNvbnRhY3RfcG9pbnQpe1xuICAgIHRoaXMuY29udGFjdF90eXBlID0gQ09OVEFDVF9DSVJDTEVfMl9QT0lOVDtcbiAgICB0aGlzLmNvbnRhY3RfcG9pbnQgPSBjb250YWN0X3BvaW50O1xuICB9XG5cbiAgLy8gYWxnaW5lZF9heGlzIGV4YW1wbGU6ICd4J1xuICBzZXRfYWFfbGluZV9jb250YWN0KGFsaWduZWRfYXhpcyl7XG4gICAgdGhpcy5jb250YWN0X3R5cGUgPSBDT05UQUNUX0NJUkNMRV8yX0FCX0xJTkU7XG4gICAgdGhpcy5hbGlnbmVkX2F4aXMgPSBhbGlnbmVkX2F4aXM7XG4gIH1cblxuICBzZXRfcGVuZXRyYXRpb24oYXNfdmVjdG9yKXtcbiAgICB0aGlzLnBlbmV0cmF0aW9uID0gYXNfdmVjdG9yO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gQ29udGFjdDtcbm1vZHVsZS5leHBvcnRzLkNPTlRBQ1RfQ0lSQ0xFXzJfUE9JTlQgID0gQ09OVEFDVF9DSVJDTEVfMl9QT0lOVDtcbm1vZHVsZS5leHBvcnRzLkNPTlRBQ1RfQ0lSQ0xFXzJfQUJfTElORSA9IENPTlRBQ1RfQ0lSQ0xFXzJfQUJfTElORTtcbiIsInZhciBHZW9tZXRyeSA9IHJlcXVpcmUoJy4uL2dlb21ldHJ5L0dlb21ldHJ5LmpzJyk7XG52YXIgVmVjdG9yID0gcmVxdWlyZSgnLi4vbWF0aC9WZWN0b3IuanMnKTtcbnZhciBNeURlYnVnID0gcmVxdWlyZSgnLi4vTXlEZWJ1Zy5qcycpO1xuXG5jb25zdCBDT05UQUNUX0NJUkNMRV8yX1BPSU5UID0gMTtcbmNvbnN0IENPTlRBQ1RfQ0lSQ0xFXzJfQUJfTElORSA9IDI7XG5cbmNsYXNzIEltcGx1c2VSZXNvbHZlcntcbiAgcmVzb2x2ZShvYmoxLCBvYmoyLCBjb250YWN0KXtcbiAgICBpZihvYmoxLnBhc3NfdGhyb3VnaCB8fCBvYmoyLnBhc3NfdGhyb3VnaCl7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGxldCBjb2xsaXNpb25fdHlwZSA9IG9iajEuY29sbGlzaW9uX2JvZHkuc2hhcGUgKyAnOicgKyBvYmoyLmNvbGxpc2lvbl9ib2R5LnNoYXBlO1xuICAgIGxldCByZXN1bHQgPSB1bmRlZmluZWQ7XG4gICAgLy8gd2UgaGF2ZW4ndCByZXNvbHZlZCB0aGUgaW1wdWxzZSBiZXR3ZWVuIG9iajEgYW5kIG9iajIgc2luY2UgdGhlaXIgY29sbGlzaW9uIHlldFxuICAgIGlmKCFvYmoxLmltcHVsc2VfcmVzb2x2ZWRfd2l0aF90YXJnZXQob2JqMikpe1xuICAgICAgaWYoTXlEZWJ1Zy5lbmdpbmVfZGVidWcpe1xuICAgICAgICBjb25zb2xlLmxvZygncmVzb2x2aW5nIScpO1xuICAgICAgICBjb25zb2xlLmxvZyhvYmoxLmlkICsgJywnICsgb2JqMi5pZCk7XG4gICAgICAgIGNvbnNvbGUubG9nKCdiZWZvcmU6IHZfeCcgKyBvYmoxLnZfeCArICcsJyArIG9iajEudl95KTtcbiAgICAgIH1cbiAgICAgIHN3aXRjaChjb2xsaXNpb25fdHlwZSl7XG4gICAgICAgIGNhc2UgR2VvbWV0cnkuQUFCQiArICc6JyArIEdlb21ldHJ5LkFBQkI6XG4gICAgICAgICAgY29uc29sZS5sb2coJ2FhYmIgMiBhYWJiIGltcGx1c2UgcmVzb2x1dGlvbiBub3Qgc3VwcG9ydGVkJyk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgR2VvbWV0cnkuQ0lSQ0xFICsgJzonICsgR2VvbWV0cnkuQ0lSQ0xFOlxuICAgICAgICAgIGNvbnNvbGUubG9nKCdjaXJjbGUgMiBjaXJjbGUgaW1wbHVzZSByZXNvbHV0aW9uIG5vdCBzdXBwb3J0ZWQnKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBHZW9tZXRyeS5BQUJCICsgJzonICsgR2VvbWV0cnkuQ0lSQ0xFOlxuICAgICAgICAgIHJlc3VsdCA9IHRoaXMuY2lyY2xlXzJfYWFiYl9yZXNvbHV0aW9uKG9iajIsIG9iajEsIGNvbnRhY3QpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIEdlb21ldHJ5LkNJUkNMRSArICc6JyArIEdlb21ldHJ5LkFBQkI6XG4gICAgICAgICAgcmVzdWx0ID0gdGhpcy5jaXJjbGVfMl9hYWJiX3Jlc29sdXRpb24ob2JqMSwgb2JqMiwgY29udGFjdCk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgR2VvbWV0cnkuQ0lSQ0xFICsgJzonICsgR2VvbWV0cnkuTElORTpcbiAgICAgICAgICByZXN1bHQgPSB0aGlzLmNpcmNsZV8yX2xpbmVfcmVzb2x1dGlvbihvYmoxLCBvYmoyKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBHZW9tZXRyeS5MSU5FICsgJzonICsgR2VvbWV0cnkuQ0lSQ0xFOlxuICAgICAgICAgIHJlc3VsdCA9IHRoaXMuY2lyY2xlXzJfbGluZV9yZXNvbHV0aW9uKG9iajIsIG9iajEpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIEdlb21ldHJ5LkFBQkIgKyAnOicgKyBHZW9tZXRyeS5MSU5FOlxuICAgICAgICAgIGNvbnNvbGUubG9nKCdhYWJiIDIgbGluZSBpbXBsdXNlIHJlc29sdXRpb24gbm90IHN1cHBvcnRlZCcpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIEdlb21ldHJ5LkxJTkUrICc6JyArIEdlb21ldHJ5LkFBQkI6XG4gICAgICAgICAgY29uc29sZS5sb2coJ2xpbmUgMiBhYWJiIGltcGx1c2UgcmVzb2x1dGlvbiBub3Qgc3VwcG9ydGVkJyk7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICAvLyByZW1lbWJlciB0aGUgZmFjdCB0aGF0IHdlIGhhdmUgcmVzb2x2ZWQgdGhlIGltcHVsc2UgYmV0d2VlbiBvYmoxIG9iajIgYWxyZWFkeVxuICAgICAgLy8gdG8gYXZvaWQgbXVsdGlwbGUgcmVzb2x1dGlvbiBpbiBjYXNlIG9mIGRlZXAgcGVuZXRyYXRpb25cbiAgICAgIG9iajEuc2V0X2ltcHVsc2VfcmVzb2x2ZV90YXJnZXQob2JqMik7XG4gICAgICBvYmoyLnNldF9pbXB1bHNlX3Jlc29sdmVfdGFyZ2V0KG9iajEpO1xuICAgICAgaWYoTXlEZWJ1Zy5lbmdpbmVfZGVidWcpe1xuICAgICAgICBjb25zb2xlLmxvZygnYWZ0ZXI6IHZfeCcgKyBvYmoxLnZfeCArICcsJyArIG9iajEudl95KTtcbiAgICAgIH1cbiAgICB9ZWxzZXtcbiAgICAgIGlmKE15RGVidWcuZW5naW5lX2RlYnVnKXtcbiAgICAgICAgY29uc29sZS5sb2coJ3NraXAgcmVzb2x2aW5nIScpO1xuICAgICAgICBjb25zb2xlLmxvZyhvYmoxLmlkICsgJywnICsgb2JqMi5pZCk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBjaXJjbGVfMl9hYWJiX3Jlc29sdXRpb24oYywgYWIsIGNvbnRhY3Qpe1xuICAgIGlmKGMuaXNfaW50ZXJzZWN0X3dpdGggIT09IGFiIHx8IGFiLmlzX2ludGVyc2VjdF93aXRoICE9IGMpe1xuICAgICAgaWYoTXlEZWJ1Zy5lbmdpbmVfZGVidWcpe1xuICAgICAgICBjb25zb2xlLmxvZygnaW50ZXJzZWN0IScpO1xuICAgICAgICBjb25zb2xlLmxvZyhjLmlkICsgJywnICsgYWIuaWQpO1xuICAgICAgICBjb25zb2xlLmxvZyhjb250YWN0KTtcbiAgICAgIH1cbiAgICAgIGlmKGNvbnRhY3RbJ2NvbnRhY3RfdHlwZSddID09IENPTlRBQ1RfQ0lSQ0xFXzJfUE9JTlQpe1xuICAgICAgICB0aGlzLl9jaXJjbGVfMl9wb2ludF9yZXNvbHV0aW9uKGMsIGNvbnRhY3RbJ2NvbnRhY3QnXVsncG9pbnQnXSk7XG4gICAgICB9ZWxzZSBpZihjb250YWN0Wydjb250YWN0X3R5cGUnXSA9PSBDT05UQUNUX0NJUkNMRV8yX0FCX0xJTkUpe1xuICAgICAgICB0aGlzLl9jaXJjbGVfMl9hYl9saW5lX3Jlc29sdXRpb24oYywgY29udGFjdFsnY29udGFjdCddWydhbGlnbmVkX2F4aXMnXSk7XG4gICAgICB9ZWxzZXtcbiAgICAgICAgaWYoTXlEZWJ1Zy5lbmdpbmVfZGVidWcpe1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdlcnJvciEgdW5rbm93biBjb250YWN0IHR5cGU6JyArICBjb250YWN0Wydjb250YWN0X3R5cGUnXSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9ZWxzZXtcbiAgICAgIGlmKE15RGVidWcuZW5naW5lX2RlYnVnKXtcbiAgICAgICAgY29uc29sZS5sb2coJ2RpZCBub3QgaW50ZXJzZWN0IScpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIF9jaXJjbGVfMl9hYl9saW5lX3Jlc29sdXRpb24oYywgYWxpZ25lZF9heGlzKXtcbiAgICBzd2l0Y2goYWxpZ25lZF9heGlzKXtcbiAgICAgIGNhc2UgJ3gnOlxuICAgICAgICBjLnZfeSAqPSAtMTtcbiAgICAgICAgYnJlYWtcbiAgICAgIGNhc2UgJ3knOlxuICAgICAgICBjLnZfeCAqPSAtMTtcbiAgICAgICAgYnJlYWtcbiAgICB9XG4gIH1cblxuICBfY2lyY2xlXzJfcG9pbnRfcmVzb2x1dGlvbihjLCBjb250YWN0X3BvaW50KXtcbiAgICBsZXQgY2lyY2xlX2NlbnRlciA9IGMuY29sbGlzaW9uX2JvZHkuY2VudGVyO1xuICAgIGxldCBjb250YWN0X3ZlY3RvciA9IG5ldyBWZWN0b3IoXG4gICAgICBjb250YWN0X3BvaW50LnggLSBjaXJjbGVfY2VudGVyLngsXG4gICAgICBjb250YWN0X3BvaW50LnkgLSBjaXJjbGVfY2VudGVyLnkpO1xuICAgIGxldCBwZXJwX2NvbnRhY3RfdmVjdG9yID0gY29udGFjdF92ZWN0b3Iucm90YXRlX2Nsb2Nrd2lzZV85MCgpO1xuICAgIGxldCB2ZWxvY2l0eV92ZWN0b3IgPSBuZXcgVmVjdG9yKGMudl94LCBjLnZfeSk7XG5cbiAgICAvLyBsZXQgdGhldGEgYmUgdGhlIGFuZ2xlIGJldHdlZW4gdmVsb2NpdHlfdmVjdG9yIGFuZCBwZXJwX2NvbnRhY3RfdmVjdG9yXG4gICAgLy8gY29zKHRoZXRhKSA9IFYxIC4gVjIgLyAofFYxfCAqIHxWMnwpXG4gICAgbGV0IGNvc190aGV0YSA9IChwZXJwX2NvbnRhY3RfdmVjdG9yLmRvdF9wcm9kdWN0KHZlbG9jaXR5X3ZlY3RvcikpXG4gICAgICAvKHBlcnBfY29udGFjdF92ZWN0b3IubWFnbml0dWRlKCkgKiB2ZWxvY2l0eV92ZWN0b3IubWFnbml0dWRlKCkpO1xuXG4gICAgbGV0IHNpbl90aGV0YSA9IE1hdGguc3FydCgxIC0gY29zX3RoZXRhICogY29zX3RoZXRhKTtcblxuICAgIC8vIFVzZSB2ZWN0b3Igcm90YXRpb24gbWF0cml4OlxuICAgIC8vfGNvcygyKnRoZXRhKSwgLXNpbigyKnRoZXRhKXxcbiAgICAvL3xzaW4oMip0aGV0YSksICBjb3MoMip0aGV0YSl8XG4gICAgLy8gdG8gbXVsdGlwbHkgdmVsb2NpdHlfdmVjdG9yIHRvIGdldCB0aGUgdmVsb2NpdHkgYWZ0ZXIgY29udGFjdFxuICAgIC8vIG5vdGU6XG4gICAgLy8gY29zKDIqdGhldGEpID0gY29zX3RoZXRhKmNvc190aGV0YSAtIHNpbl90aGV0YSpzaW5fdGhldGFcbiAgICAvLyBzaW4oMip0aGV0YSkgPSAyKnNpbih0aGV0YSkqY29zKHRoZXRhKVxuICAgIGxldCBtaWRkbGVfcmVzdWx0MSA9IChjb3NfdGhldGEqY29zX3RoZXRhIC0gc2luX3RoZXRhKnNpbl90aGV0YSk7XG4gICAgbGV0IG1pZGRsZV9yZXN1bHQyID0gMiAqIGNvc190aGV0YSAqIHNpbl90aGV0YTtcbiAgICBsZXQgdmVsb2NpdHlfYWZ0ZXJfY29udGFjdCA9IG5ldyBWZWN0b3IoXG4gICAgICBtaWRkbGVfcmVzdWx0MSAqIHZlbG9jaXR5X3ZlY3Rvci54IC0gbWlkZGxlX3Jlc3VsdDIgKiB2ZWxvY2l0eV92ZWN0b3IueSxcbiAgICAgIG1pZGRsZV9yZXN1bHQyICogdmVsb2NpdHlfdmVjdG9yLnggKyBtaWRkbGVfcmVzdWx0MSAqIHZlbG9jaXR5X3ZlY3Rvci55XG4gICAgKVxuXG4gICAgYy52X3ggPSB2ZWxvY2l0eV9hZnRlcl9jb250YWN0Lng7XG4gICAgYy52X3kgPSB2ZWxvY2l0eV9hZnRlcl9jb250YWN0Lnk7XG4gIH1cblxuICBjaXJjbGVfMl9saW5lX3Jlc29sdXRpb24oYywgbCl7XG4gICAgaWYoYy5pc19pbnRlcnNlY3Rfd2l0aCAhPT0gbCB8fCBsLmlzX2ludGVyc2VjdF93aXRoICE9IGMpe1xuICAgICAgdGhpcy5fY2lyY2xlXzJfYWJfbGluZV9yZXNvbHV0aW9uKGMsIGwuY29sbGlzaW9uX2JvZHkucGFyYWxsZWxfdG8pO1xuICAgIH1cbiAgfVxufVxubW9kdWxlLmV4cG9ydHMgPSBJbXBsdXNlUmVzb2x2ZXI7XG5tb2R1bGUuZXhwb3J0cy5DT05UQUNUX0NJUkNMRV8yX1BPSU5UICA9IENPTlRBQ1RfQ0lSQ0xFXzJfUE9JTlQ7XG5tb2R1bGUuZXhwb3J0cy5DT05UQUNUX0NJUkNMRV8yX0FCX0xJTkUgPSBDT05UQUNUX0NJUkNMRV8yX0FCX0xJTkU7XG4iXX0=
