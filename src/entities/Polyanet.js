const Entity = require("./Entity");

class Polyanet extends Entity {
  get apiEndpoint() {
    return "/polyanets";
  }
}

module.exports = Polyanet; 