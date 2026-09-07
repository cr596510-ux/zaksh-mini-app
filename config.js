export const CONFIG = Object.freeze({
  app: {
    name: "ZAKSH",
    tokenSymbol: "ZKO"
  },

  economy: {
    usdPrice: 0.13,
    miningRewardMin: 60,
    miningRewardMax: 160,
    taskReward: 4,
    adTaskReward: 3
  },

  mining: {
    durationSeconds: 40,
    maxSessions: 2,
    cooldownHours: 6
  },

  tasks: {
    count: 4,
    cooldownHours: 2
  },

  campaign: {
    endAt: "2027-01-05T23:59:59.000Z"
  },

  withdrawal: {
    enabledByOwner: false
  }
});
