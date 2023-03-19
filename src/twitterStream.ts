import log from './log';
import { ETwitterStreamEvent, TweetStream, TwitterApi, StreamingV2GetRulesResult, TweetV2SingleStreamResult, ITweetStreamError } from 'twitter-api-v2';

// Idle delay
const shortDelay = 1000 * 60 * 15;
// Long delay, when we just created a stream, we put this in before we create the next one
const longDelay = 1000 * 60 * 45;

// Manages stream creation and makes a queue for creation so we don't spam twitter with requests
class QTweetStream {

  stream: TweetStream<TweetV2SingleStreamResult> | null;
  userIds: string[];
  newUserIds: boolean;
  tClient: TwitterApi;
  timeout: ReturnType<typeof setTimeout>
  streamStart: () => any
  streamData: (data: TweetV2SingleStreamResult) => any
  streamError: (err: ITweetStreamError) => any
  streamEnd: () => any;

  constructor(
    tClient: TwitterApi,
    streamStart: () => any,
    streamData: (data: TweetV2SingleStreamResult) => any,
    streamError: (err: ITweetStreamError) => any,
    streamEnd: () => any
  ) {
    this.stream = null;
    this.userIds = [];
    this.newUserIds = false;
    this.tClient = tClient;
    this.streamStart = streamStart;
    this.streamData = streamData;
    this.streamError = streamError;
    this.streamEnd = streamEnd;
  }

  async checkNewUsers(anyRules?: StreamingV2GetRulesResult) {
    if (this.newUserIds === true || anyRules) {
      log('⚙️ New users found!', null, true);
      this.newUserIds = false;
      if (!anyRules) {
        anyRules = await this.tClient.v2.streamRules();
      }
      if (anyRules.data?.length) {
        this.tClient.v2.updateStreamRules({
          delete: { ids: anyRules.data.map(r => r.id) }
        });
      }
      await this.tClient.v2.updateStreamRules({
        add: this.userIds.reduce((arr, id) => {
          if (!arr.length || arr[0].value.length + id.toString().length + 9 > 512) {
            arr.unshift({value:`from:${id}`});
          } else {
            arr[0].value += ` OR from:${id}`;
          }
          return arr;
        }, [])
      });
      if (!this.stream) {
        this.doCreate();
      }
    } else {
      log(`⚙️ No new users, scheduling next check in ${shortDelay}ms`, null, true);
    }
    this.timeout = setTimeout(() => {
      this.timeout = null;
      this.checkNewUsers();
    }, shortDelay);
  }

  async doCreate() {
    log(`⚙️ Creating a stream with ${this.userIds.length} registered users`);
    this.stream = this.tClient.v2.searchStream({
        autoConnect: false,
        'tweet.fields': ['referenced_tweets','in_reply_to_user_id','author_id','attachments','entities'],
        'user.fields': ['profile_image_url'],
        'media.fields': ['url','duration_ms','preview_image_url','variants'],
        expansions: ['referenced_tweets.id','author_id','referenced_tweets.id.author_id','attachments.media_keys'],
      });
    this.stream.on(ETwitterStreamEvent.Connected, this.streamStart);
    this.stream.on(ETwitterStreamEvent.Error, this.streamError);
    this.stream.on(ETwitterStreamEvent.ConnectionClosed, this.streamEnd);
    this.stream.on(ETwitterStreamEvent.Data, this.streamData);

    try {
      await this.stream.connect();
    } catch(e) {
      log(e)
    }
  }

  async create(userIds: string[]) {
    const originalUserIdCount = this.userIds.length;
    this.userIds = userIds;
    if (originalUserIdCount === 0 && !this.stream) {
      const rules = await this.tClient.v2.streamRules();
      if (rules.data?.length) {
        this.doCreate();
        
        log(`⚙️ Scheduling next user check in ${longDelay}ms`, null, true);
        this.timeout = setTimeout(() => {
          this.timeout = null;
          this.checkNewUsers();
        }, longDelay);
      } else {
        this.checkNewUsers(rules);
      }
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

export default QTweetStream;
