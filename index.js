// ১. এখানে আপনার বটের টোকেনটি বসিয়ে দিন:
const token = "8818041019:AAGTqgSFqLQWT1UoKEWyaL5KzbZ1s1TZ5Ic"; 

// আপনার দেওয়া চ্যানেল আইডি, চ্যানেল লিংক এবং মিনি অ্যাপের লিংক সরাসরি সেট করা হয়েছে
const channelId = "-1002183552076"; 
const channelLink = "https://t.me/winfanti";
const webAppUrl = "https://t.me/Fmarketing_Demo_bot/myapp";

const { Telegraf } = require('telegraf');
const express = require('express');

const bot = new Telegraf(token);
const app = express();
const port = process.env.PORT || 3000;

// Render-এর অটোমেটিক ওয়েবহুক ইউআরএল
const webhookUrl = process.env.RENDER_EXTERNAL_URL;

app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).send('Bot is running...');
});

// /start কমান্ড
bot.start((ctx) => {
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

  try {
    // সরাসরি চ্যানেল আইডি দিয়ে মেম্বারশিপ চেক করা হচ্ছে
    const member = await ctx.telegram.getChatMember(channelId, userId);
    const allowedStatuses = ['creator', 'administrator', 'member', 'restricted'];
    const isJoined = allowedStatuses.includes(member.status);

    if (isJoined) {
      // টেলিগ্রাম লিংকের ক্ষেত্রে বাটনটি স্বাভাবিক লিংক হিসেবে এবং ওয়েবসাইট হলে web_app হিসেবে কাজ করবে
      const openAppButton = webAppUrl.includes('t.me/') 
        ? { text: "🚀 Open App", url: webAppUrl }
        : { text: "🚀 Open App", web_app: { url: webAppUrl } };

      await ctx.editMessageText(
        "✅ Joined Successfully!\n\n🎉 Congratulations!\n\nYou can now access our Marketing Mini App.\n\nClick the button below.",
        {
          reply_markup: {
            inline_keyboard: [
              [ openAppButton ]
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
    await ctx.reply(`⚠️ আসল সমস্যাটি হলো: ${error.message}\n\n(বটটি চ্যানেলের এডমিন আছে কি না এবং পারমিশন ঠিক আছে কি না দয়া করে চেক করুন)`);
    await ctx.answerCbQuery();
  }
});

// সিকিউর ওয়েব-হুক পাথ সেটিংস
const secretPath = `/bot${token}`;
app.use(bot.webhookCallback(secretPath));

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
    console.log('Running locally. Webhook not set.');
  }
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
