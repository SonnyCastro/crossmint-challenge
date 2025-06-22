class Entity {
  constructor(row, column) {
    if (this.constructor === Entity) {
      throw new Error("Abstract class 'Entity' cannot be instantiated directly.");
    }
    this.row = row;
    this.column = column;
  }

  /**
   * Returns the API endpoint for the entity.
   * To be implemented by subclasses.
   */
  get apiEndpoint() {
    throw new Error("Method 'apiEndpoint()' must be implemented.");
  }

  /**
   * Returns the payload for the API request.
   * Can be extended by subclasses.
   * @param {string} candidateId - The candidate ID for the API.
   */
  getPayload(candidateId) {
    return {
      row: this.row,
      column: this.column,
      candidateId
    };
  }
}

module.exports = Entity; 