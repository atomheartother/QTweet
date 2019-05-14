const log = require("./log");

// Manages stream creation and makes a queue for creation so we don't spam twitter with requests
class Stream {
  constructor(tClient, streamStart, streamData, streamError, streamEnd) {
    this.stream = null;
    this.userIds = [];
    this.newUserIds = false;
    this.tClient = tClient;
    this.streamStart = streamStart;
    this.streamData = streamData;
    this.streamError = streamError;
    this.streamEnd = streamEnd;
    this.interval = setInterval(() => {
      this.checkNewUsers();
    }, 60000);
  }

  checkNewUsers() {
    if (this.newUserIds === true) {
      this.newUserIds = false;
      if (!!this.stream) {
        this.stream.destroy();
        setTimeout(() => {
          this.doCreate();
        }, 5000);
      } else {
        this.doCreate();
      }
    }
  }

  doCreate() {
    log(`Creating a stream with ${this.userIds.length} registered users`);
    this.stream = this.tClient
      .stream("statuses/filter", {
        follow: this.userIds.toString()
      })
      .on("start", this.streamStart)
      .on("data", this.streamData)
      .on("error", this.streamError)
      .on("end", this.streamEnd);
  }

  create(userIds) {
    const originalUserIdCount = this.userIds.length;
    if (originalUserIdCount === 0) {
      this.doCreate();
    } else {
      this.newUserIds = true;
    }
    this.userIds = userIds;
  }

  // We've been disconnected, discard all info we have
  disconnected() {
    this.stream = null;
    this.userIds = [];
    this.stream = null;
    this.newUserIds = false;
  }
}

module.exports = Stream;
