const Entity = require("./Entity");

class Cometh extends Entity {
  constructor(row, column, direction) {
    super(row, column);
    this.direction = direction;
  }

  get apiEndpoint() {
    return "/comeths";
  }

  getPayload(candidateId) {
    const payload = super.getPayload(candidateId);
    payload.direction = this.direction;
    return payload;
  }
}

module.exports = Cometh; 