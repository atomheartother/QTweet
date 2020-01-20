import log from './log';

// Idle delay
const shortDelay = 1000 * 60 * 5;
// Long delay, when we just created a stream, we put this in before we create the next one
const longDelay = 1000 * 60 * 15;
// Destroying delay, delay between stream destruction and stream re-creation
const destroyDelay = 1000 * 1;

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
  }

  checkNewUsers() {
    if (this.newUserIds === true) {
      this.newUserIds = false;
      if (this.stream) {
        this.stream.destroy();
        setTimeout(() => {
          this.doCreate();
        }, destroyDelay);
      } else {
        this.doCreate();
      }
      return;
    }
    this.timeout = setTimeout(() => {
      this.timeout = null;
      this.checkNewUsers();
    }, shortDelay);
  }

  doCreate() {
    log(`Creating a stream with ${this.userIds.length} registered users`);
    this.stream = this.tClient
      .stream('statuses/filter', {
        follow: this.userIds.toString(),
        tweet_mode: 'extended',
      })
      .on('start', this.streamStart)
      .on('data', this.streamData)
      .on('error', this.streamError)
      .on('end', this.streamEnd);
    this.timeout = setTimeout(() => {
      this.timeout = null;
      this.checkNewUsers();
    }, longDelay);
  }

  create(userIds) {
    const originalUserIdCount = this.userIds.length;
    this.userIds = userIds;
    if (originalUserIdCount === 0 && !this.stream) {
      this.doCreate();
    } else {
      this.newUserIds = true;
    }
  }

  // We've been disconnected, discard all info we have,
  // effectively resetting the object until next creation
  disconnected() {
    if (this.stream) {
      this.stream.destroy();
    }
    this.stream = null;
    this.userIds = [];
    this.newUserIds = false;
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }
}

export default Stream;
