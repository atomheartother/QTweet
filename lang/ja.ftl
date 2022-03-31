### Small words
id = ID
type = タイプ
dm = dm
serv = サーバー

### Help messages
# This is in the help message header
helpHeader = {-bot-name} が来たよ!

# The main help message body, followed by usage
helpIntro =
  こんにちは、 私は { -bot-name }です。 私は、ツイートをDiscordに投稿するとてもシンプルなボットです。
  {-b}[完全なドキュメント]({ -docs-url })を読むことをおすすめします{-b}
  {-b}私をサーバーに招待したいですか？{-b} [ここをクリック]({ -invite-url })!
  {-b}質問や問題がありますか？{-b} [サポートサーバーがあります！]({ -support-server })
  {-b}QTweetを支援していただけますか？{-b} [Patreonで寄付してください！]({ -patreon-link })
  
  開始するためのコマンドの短いリストはこちらです:

# Footer giving credit to the artist
helpFooter = Profile picture art by {$artist}

# The welcome msg sent to server owners & her generic response when DM'd
welcomeMessage = 
      こんにちは、私は {-bot-name}です。 招待してくださってありがとうございます！
      {-b}はじめに:{-b} `{-pr}help` コマンドと便利なリンク
      {-b}もし私があなたのサーバーにとって有用であれば{-b}、{-profile-url}　でupvoteしてください！
      
      私のコマンドを使用することにより、 あなたは{-b}あなたのサーバーに投稿されたコンテンツや、私を介したDMがあなた自身の責任であること{-b}に同意されたものとみなします。 詳細は私のドキュメントをご確認ください。

### Command usage

# The word "usage"
-usage = 使用例
# The word used to describe a twitter screen name, in a variable
-screen-name-variable = twitter_ID

## Usage for every command
usage-tweet = 
  指定されたユーザーの最新のツイートを投稿します。
  {-b}{-usage}{-b}: `{-pr}tweet <{-screen-name-variable}> [--count=count]`

usage-start =
  登録したツイッターユーザーのつぶやきをリアルタイムに投稿します。
  {-b}{-usage}{-b}: `{-pr}start <{-screen-name-variable}> [flags]`
  複数ユーザー、リツイート、テキスト投稿のフィルタリングなどをサポートしています。詳しくはドキュメントをご覧ください。

usage-stop = 
  指定されたユーザーの登録を解除します。
  {-b}{-usage}{-b}: `{-pr}stop <{-screen-name-variable}>`

usage-stopchannel =
   {-pr}stop とほとんど同じですがチャンネル全体に作用します。
  {-b}{-usage}{-b}: `{-pr}stopchannel [channel ID]`

usage-list = このチャンネル上に登録済みのツイッターユーザーを一覧表示します。

usage-lang = 
  利用可能な言語を一覧表示したり、言語を変更したりすることができます。
  あなたの言語に私を翻訳するのを手伝っていただけますか？ドキュメントを参照してください。
  {-b}{-usage}{-b}: `{-pr}lang [list] [set <language>]`
usage-lang-set = {-usage}: `{-pr}lang set <language>`

usage-qtprefix =
  私を使用するために用いる接頭辞(prefix)を変更することができます。
  これを行うには、**サーバー全体**のモデレーターであることが必要です。
  {-b}{-usage}{-b}: `{-pr}qtprefix <new_prefix>`

usage-tweetid =
  指定されたIDの整形されたツイートを投稿します。
  {-b}{-usage}{-b}: `{-pr}tweetid <tweet_id>`


### Command feedback
-error-apology = ご迷惑をおかけします。
## !!tweet
countIsNaN =
  {-b}ツイート数が必要です{-b}
  {$count} は数値ではありません(´；ω；｀)

tweetCountLimited = 
  {-b}ツイート数の上限は{$maxCount} です。{-b}
  あなたはモデーレーターではないためツイート数の上限が{$maxCount}に制限されています。

tweetCountUnderOne =
  {-b}あなたに{$count}個のツイートを投稿するように言われたので何も投稿できません{-b}
  ナイストライ~

tweetCountHighConfirm =
  {-b}大量のツイートを要求されています{-b}
  本当に {$count} 個のツイートを投稿しますか？？？ 一度始めたら止められませんよ！
  本当に実行する場合は以下のように実行してください。
  `{-pr}tweet {$screenName} --count={$count} --force`

tweetNotAuthorized =
  {-b}{$screenName}からツイートを取得しようとしましたがTwitter側から拒否されました{-b}
  これは殆どの場合ブロックされていることが原因です。

tweetUnknwnError =
  {-b}{$screenName} は存在しますが、そのプロフィールに何か問題があるようです。{-b}
  タイムラインを取得できない... Twitter側からのエラー内容:
  {$error}

noTweets = {$screenName} はなにもつぶやいていないようです...

noValidTweets =
  {-b}このユーザーは有効なつぶやきが無いようです...{-b}
  もう一度試してみてください。Twitterの調子が悪いのかな？

tweetGeneralError = 
  {-b}{$screenName}からのツイートの取得に失敗しました{-b}
  {-error-apology}

## !!tweetId
tweetIdGeneralError =
  {-b}ツイートの取得に失敗しました {$id}{-b}
  {-error-apology}

## Generic for start and stop
getInfoGeneralError =
  {-b}{$namesCount ->
  [one] このアカウント
  *[other] これらのアカウント
  }の情報を取得する際に何か問題が発生しました。{-b}
  {-error-apology}

## !!start
startSuccess =
  {-b}{$addedObjectName}の登録に成功しました！{-b}
  `{-pr}stop {$nameCount ->
    [1] {$firstName}
    *[other] <{-screen-name-variable}>
  }`でいつでも停止することができます！
  はじめはツイートの取得は20分ほどかかってしまいますが、一度始まってしまえばリアルタイムになります。

  {$missedNames ->
    [0] {""}
    *[other] 指定されたいくつかのユーザーを見つけることができませんでした。指定したいユーザーのTwitter IDを確認してください。
  }

# This is how we display multiple names.
# If we only have one, we display it, if we have multiple we display them, then add the last one.
formatUserNames = {$count ->
    [1] {$lastName}
    *[other] {$names} と {$lastName}
  }

startUpdateSuccess = 
  {-b}{$addedObjectName} がアップデートされました！{-b}
  あなたの新しいフラグが登録されました。変更はすぐに反映されます。
## !!leaveguild
noValidGid = 有効なギルドIDがありません

guildNotFound = ギルドが見つかりませんでした: {$guild}

## !!stop
noSuchSubscription =
  {-b}{$screenNames}は登録されていません{-b}
  `{-pr}list` で登録済のリストを表示できます！

stopSuccess =
  {-b}{$screenNames}の登録を解除しました{-b}

## !!stopchannel
stopChannelInDm =
  {-b}ターゲットにしたいサーバーでこのコマンドを使用してください{-b}
  DMでは引数を使う必要がありません。 すべてのDM購読を停止したい場合は、 `{-pr}stopchannel`を実行するだけです。

noSuchChannel =
  {-b}{$targetChannel} をあなたのサーバーで見つけることができませんでした{-b}
  削除しても、たぶんもう残してあるのでご安心を

stopChannelSuccess =
  {-b}{$subs}人のユーザーの登録を解除しました.{-b}
  これで、`{$channelName}`でのツイートの取得が停止するはずです。

## !!lang
noSuchLang =
  {-b}この言語はサポートされていません{-b}
  `{-pr}lang list` を実行することでサポートされている言語の一覧を確認できます。

langSuccess =
  {-b}言語の変更に成功しました！{-b}
  にほんごの世界へようこそ！

prefixSuccess =
  {-b}接頭辞(prefix)の変更に成功しました！{-b}
  {$prefix} をつけることでコマンドとして認識されます！

## General
invalidVerb = 
  {-b}コマンド失敗{-b}
  無効なコマンド: {$verb}

### General twitter errors
noSuchTwitterUser =
  {-b}{$name}というTwitterユーザーを見つけることができませんでした {-b}
  おそらく表示名を使用しませんでしたか？　表示名ではなくTwitter IDを使用してください！

tooManyUsersRequested =
  {-b}多すぎるユーザー数がリクエストされました{-b}
  リクエストしたユーザー数が多すぎたようです。このようなことは起こらないはずですが、ユーザー数を減らしてリクエストしてみてください。

noSuchTwitterId =
  {-b}そのようなIDはありません{-b}
  Twitter君はこのIDのツイートが無かったと言っています　(；・∀・)

twitterUnknwnError =
  {-b}Twitterとの通信でなんらかの問題が発生しました{-b}
  {-error-apology}

### Command permissions error msg
# Short error indicator showing this command is for bot owners
-botOwnerCmd = Botオーナーコマンド
# Generic error indicator
-notAuthorized = 許可されていません

announceForAdmin =
  {-b}{-botOwnerCmd}{-b}
  ごめんなさい、botのオーナーのみがアナウンスすることができます
cmdInDms = 
  {-b}{-notAuthorized}{-b}
  このコマンドはDMでのみ有効です
stopForMods = 
  {-b}{-notAuthorized}{-b}
  Twitterのアカウントを登録解除できるのはモデレーターのみです
startForMods = 
  {-b}{-notAuthorized}{-b}
  登録するためにはモデレーターであるか適切な役職が割り当てられている必要があります
langForMods =
  {-b}{-notAuthorized}{-b}
  サーバーレベルのモデレーターのみが言語を変更することができます。
prefixForMods = 
  {-b}{-notAuthorized}{-b}
  サーバーレベルのモデレーターのみが接頭辞(prefix)を変更することができます。
### Lists
genericEmptyList = リストは空です。何も表示するものがありません。

noUserSubscriptions = 
  {-b}このユーザーは何も登録していません{-b}
  そんなばかな (ﾟ∀ﾟ)

noSubscriptions = 
  {-b}あなたは何も登録していません{-b}
  `{-pr}start <{-screen-name-variable}>` で登録できますよ！

# Flag formatting is on one line, in plain text
formatFlags = {$notext -> 
    *[0] テキスト投稿あり
    [1] テキスト投稿なし
  }, {$retweet ->
    *[0] リツートを含まない
    [1] リツイートを含む
  }, {$noquote ->
    *[0] 引用リツイートを含む
    [1] 引用リツイートを含まない
  }, {$replies -> 
    *[0] 返信を含まない
    [1] 返信を含む
  } の条件で登録されました。

genericObjects = {$count} {$count -> 
    [one] 個のオブジェクト
    *[other] 個のオブジェクト
  }

subscriptions = {$count} {$count -> 
    [one] 個の購読
    *[other] 個の購読
  }

languages = {$count} {$count -> 
    [one] 個の言語
    *[other] 個の言語
  }

### Posting errors
postPermissionError =
  {-b}権限が不足しています:{-b} {$name}でメッセージを送信できません！
  もしモデレーターが私に{-b}メッセージを送信{-b}, {-b}埋め込みリンク{-b}, {-b}ファイルの添付{-b}の権限を与えてくれれば、ちゃんと動きます
  メッセージを送るのを停止したい場合は`{-pr}stopchannel {$id}`をモデレーターが実行することで停止します。
  もしあなたが正しく行ったつもりでもこのメッセージが送信され続ける場合はサポートサーバーに参加してください！`{-pr}help` コマンドのメッセージ内に招待リンクがあります。

### User Limit D:
userLimit =
  {-b}ユーザー数の上限に達しました{-b} あなたの登録リクエストは他に誰も登録をしていないユーザーだったため登録できませんでした。

  {-b}解決策はありますか？{-b}
  Twitterは現在、すべてのアプリの購読数を5,000に制限しています。もしあなたがこれを読んでいるのであれば、私はその制限に達しており、選択の余地はありません。もし私がこれ以上ユーザー数を増やすように要求すれば、すべてが壊れてしまいます！

  {-b}これを解決するために何かしていますか？{-b}
  私は、この状況を打開するための選択肢を懸命に探していますが、全員にツイートをしてもらいたいという思いから、非常にストレスを感じています。残念ながら、今のところ完璧な選択肢はないようです。
  何か解決策を提案したい方は、このトピックに関するスレッドをこちらでご覧ください：https://github.com/atomheartother/QTweet/issues/32

  {-b}私は何か手助けできますか？{-b}
  私が上に投稿したスレッドを読めば、多くのオプションがお金がかかることだとわかると思います。もしあなたがQTweetの機能向上に協力したいのであれば、PatreonでQTweetの開発を支援することができます - 少しずつでも支援してください:https://www.patreon.com/atomheartother

  {-b}その間に自分のツイートを取得するにはどうすればいいですか？{-b}
  これらのアカウントをどうしても自分のサーバーに購読したい場合は、いくつかの選択肢があります。
  - {-b}あなた独自のQTweetをホストする{-b}: QTweetはフリーでオープンソースなので、どのコンピュータやサーバーからでも動作させることができます、ぜひやってみてください。詳しくは `!!help` のメッセージを読んでいただき、必要であれば私の製作者に連絡してください。
  - {-b}購読の一部を削除{-b} もし複数の購読をしている場合は購読の一部を削除しスペースを開けることができます - ただし、そのアカウントに他のサーバーが登録されている場合は、残念ながら動作しません。
  - {-b}QTweetの代わりになるものを探す{-b}: はい、それだけです。もしこれらの選択肢があなたのためにならないのであれば、残念ながら私はあなたのために何もすることができません。

### Credit
languageCredit = 日本語、翻訳者 `Fatal_Errorrr#4781`
