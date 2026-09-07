export const TASK_CONFIG = Object.freeze([
  {
    taskKey: "join_channel",
    title: "Join ZAKSH Channel",
    description: "Join the official ZAKSH Telegram channel.",
    taskType: "telegram_channel_join",
    target: "https://t.me/ZAKASMINER",
    reward: 4,
    cooldownSeconds: 7200,
    active: true
  },
  {
    taskKey: "react_channel",
    title: "React to ZAKSH Channel",
    description: "React to a post in the official ZAKSH Telegram channel.",
    taskType: "telegram_channel_reaction",
    target: "https://t.me/ZAKASMINER",
    reward: 4,
    cooldownSeconds: 7200,
    active: true
  },
  {
    taskKey: "watch_ad",
    title: "Watch Advertisement",
    description: "Watch the available advertisement and receive ZKO.",
    taskType: "advertisement",
    target: null,
    reward: 3,
    cooldownSeconds: 7200,
    active: true
  },
  {
    taskKey: "invite_friend",
    title: "Invite a Friend",
    description: "Invite a new user to ZAKSH using your referral link.",
    taskType: "referral",
    target: null,
    reward: 4,
    cooldownSeconds: 7200,
    active: true
  }
]);
