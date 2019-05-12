class Backup {
  constructor({
    mode = "exponential",
    increment = 2,
    startValue = 0,
    maxValue = -1
  } = {}) {
    this.mode = mode;
    this.increment = increment;
    this.startValue = startValue;
    this.maxValue = maxValue;
    this.val = startValue;
  }

  reset() {
    this.val = this.startValue;
  }

  increment() {
    if (this.maxValue >= 0 && this.val < this.maxValue) {
      switch (this.mode) {
        case "linear":
          this.val += this.increment;
        default:
          this.val *= this.increment;
      }
      if (this.val > this.maxValue) {
        this.val = this.maxValue;
      }
    }
  }

  value() {
    return this.val;
  }
}

module.exports = Backup;
