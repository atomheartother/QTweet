import log from './log';

// Idle delay
const shortDelay = 1000 * 60 * 15;
// Long delay, when we just created a stream, we put this in before we create the next one
const longDelay = 1000 * 60 * 45;
// Destroying delay, delay between stream destruction and stream re-creation
const destroyDelay = 1000 * 30;

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
    log('⚙️ Checking for new stream users...', null, true);
    if (this.newUserIds === true) {
      log('⚙️ New users found!', null, true);
      this.newUserIds = false;
      this.tClient.post('tweets/search/stream/rules', {
        add: [ { value: this.userIds.map(() => `from:${this}`).join(' ') } ]
      });
      if (!this.stream) {
        this.doCreate();
      }
      return;
    }
    log(`⚙️ No new users, scheduling next check in ${shortDelay}ms`, null, true);
    this.timeout = setTimeout(() => {
      this.timeout = null;
      this.checkNewUsers();
    }, shortDelay);
  }

  doCreate() {
    log(`⚙️ Creating a stream with ${this.userIds.length} registered users`);
    this.stream = this.tClient
      .stream('tweets/search/stream', {
        'tweet.fields': 'referenced_tweets,in_reply_to_user_id,author_id,attachments,entities',
        'user.fields': 'profile_image_url',
        'expansions': 'referenced_tweets.id,author_id,referenced_tweets.id.author_id,attachments.media_keys'
      })
      .on('start', this.streamStart)
      .on('data', this.streamData)
      .on('error', this.streamError)
      .on('end', this.streamEnd);
    log(`⚙️ Scheduling next check in ${longDelay}ms`, null, true);
    this.timeout = setTimeout(() => {
      this.timeout = null;
      this.checkNewUsers();
    }, longDelay);
  }

  create(userIds) {
    const originalUserIdCount = this.userIds.length;
    this.userIds = userIds;
    if (originalUserIdCount === 0 && !this.stream)
      this.doCreate();
    } else {
      this.newUserIds = true;
    }
  }

  // We've been disconnected, discard all info we have,
  // effectively resetting the object until next creation
  // If destroyStream is not set, there's no need to destroy it as it's already destroyed
  disconnected(destroyStream = true) {
    log('Disconnecting stream');
    if (this.stream && this.stream.destroy && destroyStream) {
      log('Destroying stream');
      try {
        this.stream.destroy();
      } catch (e) {
        console.error('Tried to destroy a stream but ran into error:');
        console.error(e);
        console.error('Stream object:');
        console.error(this.stream);
      }
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
