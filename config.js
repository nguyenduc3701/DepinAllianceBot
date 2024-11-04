const questionTypes = {
  IS_DAILY_CLAIM: "isDailyClaim",
  IS_DO_TASK: "isDoTask",
  IS_AUTO_UPGRADE_GAME_RESOURCE: "isAutoUpgradeGameResource",
  IS_AUTO_JOIN_LEAGUE: "isAutoJoinLeague",
  IS_FARMING: "isFarming",
};

const questions = [
  {
    type: questionTypes.IS_FARMING,
    question: "Do you want to start farming?(y/n): ",
  },
  {
    type: questionTypes.IS_DAILY_CLAIM,
    question: "Do you want to claim daily?(y/n): ",
  },
  {
    type: questionTypes.IS_DO_TASK,
    question: "Do you want to do task?(y/n): ",
  },
  {
    type: questionTypes.IS_AUTO_JOIN_LEAGUE,
    question: "Do you want auto join league?(y/n): ",
  },
  {
    type: questionTypes.IS_AUTO_UPGRADE_GAME_RESOURCE,
    question: "Do you want auto upgrade game resource?(y/n): ",
  },
];

const METHOD = {
  GET: "get",
  POST: "post",
  PUT: "put",
  PATCH: "patch",
  DELETE: "delete",
};

const ToolName = "Depin Alliance";
const MinimumPointToUpgrade = 5000;

module.exports = {
  questions,
  questionTypes,
  ToolName,
  METHOD,
  MinimumPointToUpgrade,
};
