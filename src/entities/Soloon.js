const Entity = require("./Entity");

class Soloon extends Entity {
  constructor(row, column, color) {
    super(row, column);
    this.color = color;
  }

  get apiEndpoint() {
    return "/soloons";
  }

  getPayload(candidateId) {
    const payload = super.getPayload(candidateId);
    payload.color = this.color;
    return payload;
  }
}

module.exports = Soloon; 