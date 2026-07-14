// ১. এখানে আপনার বটের টোকেন এবং মিনি অ্যাপের লিংকটি বসিয়ে দিন:
const token = "8818041019:AAGTqgSFqLQWT1UoKEWyaL5KzbZ1s1TZ5Ic"; 
const webAppUrl = "http://t.me/Fmarketing_Demo_bot/myapp";

// চ্যানেলের ইউজারনেম সরাসরি এখানে সেট করে দেওয়া হয়েছে
const channelUsername = "@winfanti"; 

const { Telegraf } = require('telegraf');
const express = require('express');

const bot = new Telegraf(token);
const app = express();
const port = process.env.PORT || 3000;

// Render নিজেই তার নিজের সার্ভার লিংক জেনারেট করে নেয়, তাই আলাদা কনফিগারেশন লাগবে না
const webhookUrl = process.env.RENDER_EXTERNAL_URL;

app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).send('Bot is running...');
});

// /start কমান্ড
bot.start((ctx) => {
  const formattedChannelName = channelUsername.startsWith('@') ? channelUsername.substring(1) : channelUsername;
  const channelLink = `https://t.me/${formattedChannelName}`;

  ctx.reply("Welcome! To access the Marketing Mini App, please join our support channel first.", {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "📢 Join Support Channel", url: channelLink }
        ],
        [
          { text: "✅ Joined", callback_data: "check_membership" }
        ]
      ]
    }
  });
});

// "✅ Joined" বাটন ক্লিক হ্যান্ডলার
bot.action('check_membership', async (ctx) => {
  const userId = ctx.from.id;
  const targetChannel = channelUsername.startsWith('@') ? channelUsername : `@${channelUsername}`;

  try {
    const member = await ctx.telegram.getChatMember(targetChannel, userId);
    const allowedStatuses = ['creator', 'administrator', 'member', 'restricted'];
    const isJoined = allowedStatuses.includes(member.status);

    if (isJoined) {
      await ctx.editMessageText(
        "✅ Joined Successfully!\n\n🎉 Congratulations!\n\nYou can now access our Marketing Mini App.\n\nClick the button below.",
        {
          reply_markup: {
            inline_keyboard: [
              [
                { text: "🚀 Open App", web_app: { url: webAppUrl } }
              ]
            ]
          }
        }
      );
    } else {
      await ctx.reply("❌ You have not joined our support channel yet.\nPlease join first and press \"✅ Joined\" again.");
    }
    await ctx.answerCbQuery();
  } catch (error) {
    console.error('Membership check failed:', error);
    await ctx.reply("⚠️ Could not verify your membership. Please ensure you have joined the channel, and that the bot is an administrator in the channel.");
    await ctx.answerCbQuery();
  }
});

// সিকিউর ওয়েব-হুক পাথ সেটিংস
const secretPath = `/bot${token}`;
app.use(bot.webhookCallback(secretPath));

// সার্ভার চালু এবং স্বয়ংক্রিয় ওয়েবহুক কানেকশন
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  
  if (webhookUrl) {
    const fullWebhookUrl = `${webhookUrl.replace(/\/$/, '')}${secretPath}`;
    bot.telegram.setWebhook(fullWebhookUrl)
      .then(() => {
        console.log(`Webhook successfully set to: ${fullWebhookUrl}`);
      })
      .catch((err) => {
        console.error('Error setting webhook:', err);
      });
  } else {
    console.log('Running locally. Webhook not set because RENDER_EXTERNAL_URL is missing.');
  }
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
