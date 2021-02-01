### Small words
id = ID
type = 类别
dm = dm
serv = 服务器

### Help messages
# This is in the help message header
helpHeader = {-bot-name} 在这！

# The main help message body, followed by usage
helpIntro =
  你好，我是{ -bot-name }，我是一个非常简单的机器人，可以将推特的内容推送到服务器
  {-b}你需要阅读我的 [使用文档]({ -docs-url }){-b}
  {-b}想要我加入你的服务器！{-b} [邀请链接]({ -invite-url })!
  {-b}有任何问题？{-b} [来我们的帮助支持服务器！]({ -support-server })
  {-b}想要支持QTweet?{-b} [使用Patreon捐赠]({ -patreon-link })
  
  下面是一个简短的命令列表，可以帮助你使用机器人:

# Footer giving credit to the artist
helpFooter = 头像由{$artist}制作

# The welcome msg sent to server owners & her generic response when DM'd
welcomeMessage = 
      你好，我是 {-bot-name}，感谢你邀请我到你的服务器
      {-b}使用{-b} `{-pr}help`来获取命令和有用的链接。
      {-b}如果这个机器人对你的服务器有帮助{-b}，请考虑给我们投票{-profile-url}
      
      通过使用我的任何命令，任何{-b}通过我发布到您的服务器或DMs上的任何内容由您负责{-b}，阅读文档来获取详情。

### Command usage

# The word "usage"
-usage = 用法
# The word used to describe a twitter screen name, in a variable
-screen-name-variable = twitter用户名

## Usage for every command
usage-tweet = 
  获取给定用户的最后一条推文。
  {-b}{-usage}{-b}: `{-pr}tweet <{-screen-name-variable}> [--count=count]`

usage-start =
  订阅给定用户的实时推文。
  {-b}{-usage}{-b}: `{-pr}start <{-screen-name-variable}> [flags]`
  支持多用户，转发，过滤出文本帖子以及更多功能！查看文档了解更多！

usage-stop = 
  取消订阅给定用户的实时推文。
  {-b}{-usage}{-b}: `{-pr}stop <{-screen-name-variable}>`

usage-stopchannel =
  取消整个频道的订阅。
  {-b}{-usage}{-b}: `{-pr}stopchannel [channel ID]`

usage-list = 列出这个频道所有的订阅。

usage-lang = 
  列出可用的语言或更改语言。
  如果你想帮我翻译，请阅读这些文档！
  {-b}{-usage}{-b}: `{-pr}lang [list] [set <language>]`
usage-lang-set = {-usage}: `{-pr}lang set <language>`

usage-qtprefix = 
  更改命令前缀。
  你需要拥有管理员权限。
  {-b}{-usage}{-b}: `{-pr}qtprefix <new_prefix>`

usage-tweetid = 
  获取特定推文id的推文
  {-b}{-usage}{-b}: `{-pr}tweetid (推文ID)`

### Command feedback
-error-apology = 我正在尝试，很抱歉出错给你带来的麻烦！
## !!tweet
countIsNaN =
  {-b}我需要一个数字来获取对应数量的推文{-b}
  嘿， {$count} 不是一个数字 >:c

tweetCountLimited = 
  {-b}Limited to {$maxCount} tweets{-b}
  因为你不是管理员，所以我会限制的你推文获取数量 - 这是你的限制上限{$maxCount}。

tweetCountUnderOne =
  {-b}因为你让我发送{$count}条推文，所以我啥都不发{-b}
  挺好的~

tweetCountHighConfirm =
  {-b}你正在要求获取大量的推文{-b}
  确定要发送{$count}条推文吗。这无法取消。
  如果你确定这么做，使用以下指令。
  `{-pr}tweet {$screenName} --count={$count} --force`

tweetNotAuthorized =
  {-b}我尝试从{$screenName}获取推文，但是推特不允许访问.{-b}
  通常由于账号封禁导致。

tweetUnknwnError =
  {-b}{$screenName}存在但是他的资料有点问题？{-b}
  我无法获取他的时间线，推特提供以下错误码：
  {$error}

noTweets = {$screenName}好像没发过推文...

noValidTweets =
  {-b}这个用户似乎没有任何有效的推文{-b}
  你可以再试一次，也许推特炸了?

tweetGeneralError = 
  {-b}从{$screenName}获取推文时出现了问题{-b}
  {-error-apology}

## !!tweetId
tweetIdGeneralError =
  {-b}获取推文{$id}时出现了问题{-b}
  {-error-apology}

## Generic for start and stop
getInfoGeneralError =
  {-b}获取 {$namesCount ->
  [one] 
  *[other] 
  }的个人信息时出现了一点问题。{-b}
  {-error-apology}

## !!start
startSuccess =
  {-b}你现在正在订阅{$addedObjectName}!{-b}
  别忘记你可以通过`{-pr}stop {$nameCount ->
    [one] {$firstName} 
    *[other] <{-screen-name-variable}> 
  }`来取消订阅。
  你可能需要20分钟才能收到他们的推文，但一旦开始，它就是实时的!

  {$missedNames ->
    [0] {""}
    *[other] 似乎我无法找到你指定的一些用户，请确保你使用了他们的用户名！
  }

formatUserNames = {$count ->
    [one] {$lastName}
    *[other] {$names} 和 {$lastName}
  }

startUpdateSuccess = 
  {-b}{$addedObjectName} 的订阅参数更新了！{-b}
  您的新参数已经注册。这些变化应该是即时的。

## !!leaveguild
noValidGid = 没有提供有效的工会ID。

guildNotFound = 没有ID为{$guild}的工会。

## !!stop
noSuchSubscription =
  {-b}不再订阅{$screenNames}{-b}
  使用`{-pr}list`来获取当前的订阅列表。

stopSuccess =
  {-b}我已经取消订阅{$screenNames}。{-b}
  You should stop getting any tweets from them.

## !!stopchannel
stopChannelInDm =
  {-b}在目标服务器上使用此命令{-b}
  无法再私聊中使用这个指令，如果你要取消所有私聊订阅请使用`{-pr}stopchannel`.

noSuchChannel =
  {-b}无法找到{$targetChannel}频道{-b}
  如果你删除了这个频道，我可能已经取消订阅了，别担心!

stopChannelSuccess =
  {-b}你已取消订阅 {$subs ->
    [one] 
    *[other] {$subs} 
  }。{-b}
  你现在应该不会再`{$channelName}`中获得任何推文推送。

## !!lang
noSuchLang =
  {-b}我不支持这个语言{-b}
  你可以使用`{-pr}lang list`来查看受支持的语言。

langSuccess =
  {-b}语言切换成功{-b}
  欢迎使用简体中文。

prefixSuccess =
  {-b}命令前缀改变成功{-b}
  你现在应该使用{$prefix}作为命令前缀。

## General
invalidVerb = 
  {-b}指令错误{-b}
  无效的参数: {$verb}

### General twitter errors
noSuchTwitterUser =
  {-b}我找不到{$name}的推文{-b}
  你可能使用了{$count ->
    [1] 他
    *[other] 他们
  }的显示名字而不是用户名。

tooManyUsersRequested =
  {-b}用户请求过多{-b}
  看来我请求了太多的twitter用户了。这是不应该发生的，但请同时请求更少的用户!

noSuchTwitterId =
  {-b}没有这个ID{-b}
  推特没有这个ID的推文。

twitterUnknwnError =
  {-b}从推特获取数据时出现了问题{-b}
  {-error-apology}

### Command permissions error msg
# Short error indicator showing this command is for bot owners
-botOwnerCmd = 机器人所有者命令
# Generic error indicator
-notAuthorized = 未认证

announceForAdmin =
  {-b}{-botOwnerCmd}{-b}
  抱歉，只有机器人所有者才能使用公告！
cmdInDms = 
  {-b}{-notAuthorized}{-b}
  这个指令只能在私聊中使用。
stopForMods = 
  {-b}{-notAuthorized}{-b}
  只有管理员才能取消订阅！
startForMods = 
  {-b}{-notAuthorized}{-b}
  你需要拥有管理员权限或者对应身份组来订阅。
langForMods =
  {-b}{-notAuthorized}{-b}
  只有服务器级的管理员才能更改语言！
prefixForMods = 
  {-b}{-notAuthorized}{-b}
  只有服务器级的管理员才能更改命令前缀！
### Lists
genericEmptyList = 列表为空，没有要显示的内容。

noUserSubscriptions = 
  {-b}这个用户没有订阅{-b}
  不应该这样。。 :c

noSubscriptions = 
  {-b}你没有订阅任何人{-b}
  使用 `{-pr}start <{-screen-name-variable}>` 来开始订阅！

# Flag formatting is on one line, in plain text
formatFlags = 推送设置:文本推送{$notext -> 
    *[0] 开启
    [1] 关闭
  }，转推{$retweet ->
    *[0] 关闭
    [1] 开启
  }，引用推文推送{$noquote ->
    *[0] 开启
    [1] 关闭
  }，提及推送{$ping -> 
    *[0] 开启
    [1] 关闭
  }，回复推送{$replies -> 
    *[0] 关闭
    [1] 开启
  }

genericObjects = {$count} {$count -> 
    [one] 对象
    *[other] 对象
  }

subscriptions = {$count} {$count -> 
    [one] 订阅
    *[other] 订阅
  }

languages = {$count} {$count -> 
    [one] 语言
    *[other] 语言
  }

### Posting errors
postPermissionError =
  {-b}没有权限:{-b} 我不能在{$name}发消息。
  如果一个管理员给我 {-b}发送消息{-b}，{-b}嵌入链接{-b} 和 {-b}添加附件{-b} 的权限的话那会很不错。
  如果你尝试让我不在这里发送消息，请使用 `{-pr}stopchannel {$id}`命令。
  如果你认为一切配置正常但还是出现这个错误，请加入我们的帮助支持服务器，它链接在`{-pr}help`消息中。

### User Limit D:
userLimit =
  {-b}我已经达到用户限制了！{-b} 你的订阅请求包含了没有其他人订阅的账户，所以我不得不删除它们。

  {-b}为什么我这样做？{-b}
  Twitter目前将每个应用程序的订阅限制在5000个以内。如果你正在阅读这条消息，则代表我已经达到了订阅上限，我没有选择-如果我订阅更多的人，那所有人都无法订阅。

  {-b}你打算怎么修复这个问题？{-b}
  我一直在努力寻找摆脱这种情况的方法，这对我来说压力很大，因为我真的希望每个人都能看到他们的推特订阅。然而，到目前为止还没有完美的选择。
  如果你想提出任何解决方案，你可以在这里讨论: https://github.com/atomheartother/QTweet/issues/32

  {-b}我能帮忙吗？{-b}
  如果你读了我上面贴出来的帖子，你会发现很多选项会让我花钱。如果你想帮助并让QTweet更好地为每个人服务，你可以在Patreon上支持QTweet的发展: https://www.patreon.com/atomheartother

  {-b}那现在我有什么解决方案吗？{-b}
  如果你真的想把这些账户订阅到你的服务器上，你有几个选择:
  - {-b}自己搭建运行一个QTweet{-b}:这是一个推荐的选项，QTweet是免费和开源的，你可以在任何计算机或服务器上运行。如果你需要帮助，你可以阅读`!!help`消息或者联系我的制作者。
  - {-b}取消一些你的订阅{-b} 如果你有部分订阅，取消可以释放一些空间。但不幸的是如果其他服务器订阅了这个帐号，那么也就算取消了无济于事。
  - {-b}找到替代QTweet的方法{-b}: 是的，就是这样，如果这些选择对你不起作用，恐怕我也帮不了你了！

### Credit
languageCredit = 中文简体, 来自 `cdwcgt#5791`