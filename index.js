const fs = require("fs");
const colors = require("colors");
const {
  questions,
  ToolName,
  METHOD,
  MinimumPointToUpgrade,
} = require("./config");

const BaseRoot = require("./ultils");

class Tools extends BaseRoot {
  constructor() {
    super();
    this.toolsName = ToolName || "";
    this.version = "0.1";
    this.waitingTime = 0;
    this.userInfo = null;
    this.auth = null;
    this.leagues = [];
    this.devices = [];
    this.userDivies = [];
    this.tasks = {
      partner: null,
      missions: null,
      dailyMissions: null,
      checkin: null,
    };
    this.questionStatuses = {
      isFarming: false,
      isDailyClaim: false,
      isDoTask: false,
      isAutoUpgradeGameResource: false,
      isAutoJoinLeague: false,
    };
    this.delayTime = {
      checkin: null,
    };
  }

  addingWaitingTime = (extraTime) => {
    if (this.waitingTime > 0 && this.waitingTime < extraTime) {
      this.waitingTime = this.waitingTime + (extraTime - this.waitingTime);
    }
    this.waitingTime = extraTime;
  };

  async renderQuestions() {
    for (let i = 0; i < questions.length; i++) {
      const questionAnswer = await this.askQuestion(questions[i].question);
      this.questionStatuses[questions[i].type] =
        questionAnswer.toLowerCase() === "y" ?? true;
    }
  }

  processAccount = async (queryId, dataUser) => {
    this.log(colors.yellow(`====== [Process Account] ======`));
    const token = await this.login(queryId, dataUser);
    await this.buildHeader({
      Authorization: `Bearer ${this.auth.accessToken}`,
      Expires: "0",
      Pragma: "no-cache",
    });
    await this.sleep(1000);
    if (true) {
      await this.getUserInfo();
      await this.sleep(1000);
      await this.getListAllTasks();
      await this.sleep(1000);
      // Logic here
      if (this.questionStatuses.isFarming) {
        await this.farmingClaim(queryId, dataUser);
      }
      if (this.questionStatuses.isDailyClaim) {
        await this.dailyCheckInClaim(queryId, dataUser);
      }
      if (this.questionStatuses.isAutoJoinLeague) {
        await this.joinLeague(queryId, dataUser);
      }
      if (this.questionStatuses.isDoTask) {
        await this.resolveTask(queryId, dataUser, token);
      }
      if (this.questionStatuses.isAutoUpgradeGameResource) {
        await this.upgradeDevice(queryId, dataUser, token);
        await this.sleep(10000);
        // await this.resolveEquipItemToDevice();
      }
    }
  };

  login = async (queryId, dataUser) => {
    this.log(colors.yellow(`====== [Login] ======`));
    const header = await this.buildHeaderTools();
    try {
      const request = { initData: queryId };
      const response = await this.callApi(
        METHOD.POST,
        "https://api.depinalliance.xyz/users/auth",
        request,
        header
      );
      if (response && response.data.status === "success") {
        this.log(colors.green(`Login ${this.toolsName} successfully!`));
        if (response.data.data) {
          this.auth = response.data.data;
          await this.sleep(1000);
        }
      } else {
        this.log(colors.red(`Fail to login ${this.toolsName}!`));
        return;
      }
    } catch (error) {
      this.log(colors.red(`Fail to login ${this.toolsName}!`));
      return;
    }
  };

  getUserInfo = async () => {
    this.log(colors.yellow(`====== [Get user information] ======`));
    const header = await this.getHeader();
    try {
      const response = await this.callApi(
        METHOD.GET,
        "https://api.depinalliance.xyz/users/info",
        null,
        header
      );
      if (response && response.data.status === "success") {
        this.log(colors.green(`Get user information successfully`));
        if (response.data.data) {
          this.userInfo = response.data.data;
        }
        await this.sleep(1000);
      } else {
        this.log(colors.red(`Fail to get user information!`));
      }
    } catch (error) {
      this.log(colors.red(`Fail to get user information!`));
    }
  };

  dailyCheckInClaim = async (queryId, dataUser, token) => {
    this.log(colors.yellow(`====== [Daily Checkin Claim] ======`));
    await this.sleep(1000);
    if (this.delayTime.checkin && this.delayTime.checkin < new Date()) {
      this.log(colors.red(`It's not time to claim daily reward yet.`));
      return;
    }
    if (!this.tasks.checkin) {
      this.log(colors.red(`Don't have any checkin tasks.`));
      return;
    }
    const header = await this.getHeader();
    try {
      const response = await this.callApi(
        METHOD.POST,
        "https://api.depinalliance.xyz/missions/daily-checkin",
        null,
        header
      );
      if (response && response.data.status === "success") {
        this.log(colors.green(`Claim daily reward successfully!`));
        this.delayTime.checkin = this.addHoursToDatetime(24);
        await this.sleep(1000);
      } else {
        this.log(colors.red(`Fail claim daily reward!`));
      }
    } catch (error) {
      this.log(colors.red(`Fail claim daily reward!`));
    }
  };

  watchAds = async (queryId, dataUser, token) => {
    this.log(colors.yellow(`====== [Watch Ads] ======`));
    const header = await this.getHeader();
  };

  getListAllTasks = async () => {
    this.log(colors.yellow(`====== [Get all tasks] ======`));
    const header = await this.getHeader();
    try {
      const resPartner = await this.callApi(
        METHOD.GET,
        "https://api.depinalliance.xyz/missions/partner",
        null,
        header
      );
      const resMissions = await this.callApi(
        METHOD.GET,
        "https://api.depinalliance.xyz/missions",
        null,
        header
      );
      const resDailyMissions = await this.callApi(
        METHOD.GET,
        "https://api.depinalliance.xyz/missions/daily",
        null,
        header
      );
      const resDailyCheckin = await this.callApi(
        METHOD.GET,
        "https://api.depinalliance.xyz/missions/daily-checkin",
        null,
        header
      );
      await Promise.all([
        resPartner,
        resMissions,
        resDailyMissions,
        resDailyCheckin,
      ])
        .then(async (commonRes) => {
          const [resPartner, resMissions, resDailyMissions, resDailyCheckin] =
            commonRes;
          if (resPartner && resPartner.data.status === "success") {
            this.log(colors.green(`Get list tasks of partner successfully!`));
            this.tasks.partner = resPartner.data.data;
          }
          if (resMissions && resMissions.data.status === "success") {
            this.log(colors.green(`Get list tasks of missions successfully!`));
            this.tasks.missions = resMissions.data.data;
          }
          if (resDailyMissions && resDailyMissions.data.status === "success") {
            this.log(
              colors.green(`Get list tasks of daily missions successfully!`)
            );
            this.tasks.dailyMissions = resDailyMissions.data.data;
          }
          if (resDailyCheckin && resDailyCheckin.data.status === "success") {
            this.log(colors.green(`Get list daily checkin successfully!`));
            this.tasks.checkin = resDailyCheckin.data.data;
          }
          await this.sleep(1000);
        })
        .catch((error) => {
          this.log(colors.red(`Fail to get list tasks!`));
          return;
        });
    } catch (error) {
      this.log(colors.red(`Fail to get list tasks!`));
      return;
    }
  };

  farmingClaim = async (queryId, dataUser, token) => {
    this.log(colors.yellow(`====== [Farm Claim] ======`));
    const header = await this.getHeader();
    try {
      const response = await this.callApi(
        METHOD.GET,
        "https://api.depinalliance.xyz/users/claim",
        null,
        header
      );
      if (response && response.data.status === "success") {
        this.log(
          colors.green(
            `Begin farming with success. Awaiting the next farming in 8 hours...`
          )
        );
        await this.addingWaitingTime(8 * 60 * 60);
        await this.sleep(1000);
      } else {
        this.log(colors.red(`Fail to start farming!`));
      }
    } catch (error) {
      this.log(colors.red(`Fail to start farming!`));
    }
  };

  playGame = async (queryId, dataUser, token) => {
    this.log(colors.yellow(`====== [Play Game] ======`));
    const header = await this.getHeader();
  };

  resolveTask = async (queryId, dataUser, token) => {
    this.log(colors.yellow(`====== [Resolve Task] ======`));
    await this.resolveDailyMissions();
    await this.sleep(1000);
    await this.resolveMissions();
    await this.sleep(1000);
    this.log(colors.cyan(`Don't support partner tasks yet.`));
  };

  resolveDailyMissions = async (isClaim) => {
    this.log(colors.yellow(`====== [Resolve Daily Missions] ======`));
    await this.sleep(1000);

    if (
      !this.tasks.dailyMissions ||
      (this.tasks.dailyMissions && !this.tasks.dailyMissions.length) ||
      (this.tasks.dailyMissions &&
        !this.tasks.dailyMissions.some((i) => !i.status))
    ) {
      this.log(colors.cyan(`Don't have any daily missions tasks to resolve.`));
      return;
    }
    await this.sleep(1000);
    this.log(colors.cyan(`> Verify daily missions`));
    await this.tasks.dailyMissions.forEach(async (i) => {
      if (!i.status) {
        await this.goVerifyDailyMissions(i);
      }
    });

    this.log(colors.cyan(`Waiting 30s to claim missions...`));
    await this.sleep(15000);
    await this.getListAllTasks();
    await this.sleep(15000);

    this.log(colors.cyan(`> Claim daily missions`));
    await this.tasks.dailyMissions.forEach(async (i) => {
      if (i.status === "VERIFIED") {
        await this.goClaimDailyMissions(i);
      }
    });

    await this.sleep(1000);
    this.log(colors.green(`Resolve daily missions done!`));
  };

  goVerifyDailyMissions = async (mission) => {
    this.log(
      colors.yellow(`====== [Verify Daily Missions ${mission.name}] ======`)
    );
    await this.sleep(1000);
    const header = await this.getHeader();
    try {
      const response = await this.callApi(
        METHOD.GET,
        `https://api.depinalliance.xyz/missions/verify-task-daily/${mission.id}`,
        null,
        header
      );
      if (response && response.data.status === "success") {
        this.log(
          colors.green(
            `Start verify daily mission ${mission.name} successfully!`
          )
        );
        await this.sleep(1000);
      } else {
        this.log(colors.red(`Fail verify daily mission ${mission.name}!`));
      }
    } catch (error) {
      this.log(colors.red(`Fail verify daily mission ${mission.name}!`));
    }
  };

  goClaimDailyMissions = async (mission) => {
    this.log(
      colors.yellow(`====== [Claim Daily Missions ${mission.name}] ======`)
    );
    await this.sleep(1000);
    const header = await this.getHeader();
    try {
      const response = await this.callApi(
        METHOD.GET,
        `https://api.depinalliance.xyz/missions/claim-task-daily/${mission.id}`,
        null,
        header
      );
      if (response && response.data.status === "success") {
        this.log(
          colors.green(
            `Start claim daily mission ${mission.name} successfully!`
          )
        );
        await this.sleep(1000);
      } else {
        this.log(colors.red(`Fail claim daily mission ${mission.name}!`));
      }
    } catch (error) {
      this.log(colors.red(`Fail claim daily mission ${mission.name}!`));
    }
  };

  resolveMissions = async (isClaim) => {
    this.log(colors.yellow(`====== [Resolve Missions] ======`));
    await this.sleep(1000);
    if (
      !this.tasks.missions ||
      (this.tasks.missions && !this.tasks.missions.length) ||
      (this.tasks.missions && !this.tasks.missions.some((i) => !i.status))
    ) {
      this.log(colors.cyan(`Don't have any missions tasks to resolve.`));
      return;
    }
    const missions = this.tasks.missions;
    this.log(colors.cyan(isClaim ? `> Claim missions` : `> Verify missions`));
    for (let i = 0; i < missions.length; i++) {
      await this.sleep(1000);
      const item = missions[i];
      await this.log(colors.yellow(`Working with group ${item.group}...`));
      await this.sleep(1000);
      if (item.missions.length) {
        if (isClaim) {
          await item.missions.forEach(async (i) => {
            if (i.status === "VERIFYING") {
              await this.goClaimMissions(i);
            }
          });
        } else {
          await item.missions.forEach(async (i) => {
            if (!i.status) {
              await this.goVerifyMissions(i);
            }
          });
        }
      }
    }

    if (!isClaim) {
      this.log(colors.cyan(`Waiting 30s to claim missions...`));
      await this.sleep(15000);
      await this.getListAllTasks();
      await this.sleep(15000);
      return this.resolveMissions(true);
    }

    await this.sleep(1000);
    this.log(colors.green(`Resolve missions done!`));
  };

  goVerifyMissions = async (mission) => {
    this.log(colors.yellow(`====== [Verify Missions ${mission.name}] ======`));
    await this.sleep(1000);
    const header = await this.getHeader();
    try {
      const response = await this.callApi(
        METHOD.GET,
        `https://api.depinalliance.xyz/missions/verify-task/${mission.id}`,
        null,
        header
      );
      if (response && response.data.status === "success") {
        this.log(
          colors.green(`Start verify mission ${mission.name} successfully!`)
        );
        await this.sleep(1000);
      } else {
        this.log(colors.red(`Fail verify mission ${mission.name}!`));
      }
    } catch (error) {
      this.log(colors.red(`Fail verify mission ${mission.name}!`));
    }
  };

  goClaimMissions = async (mission) => {
    this.log(colors.yellow(`====== [Claim Missions ${mission.name}] ======`));
    await this.sleep(1000);
    const header = await this.getHeader();
    try {
      const response = await this.callApi(
        METHOD.GET,
        `https://api.depinalliance.xyz/missions/claim-task/${mission.id}`,
        null,
        header
      );
      if (response && response.data.status === "success") {
        this.log(
          colors.green(`Start claim mission ${mission.name} successfully!`)
        );
        await this.sleep(1000);
      } else {
        this.log(colors.red(`Fail claim mission ${mission.name}!`));
      }
    } catch (error) {
      this.log(colors.red(`Fail claim mission ${mission.name}!`));
    }
  };

  joinLeague = async () => {
    const userLeague = await this.checkUserLeague();
    if (userLeague) {
      this.log(colors.green(`Already joined league!`));
      return;
    }
    await this.sleep(1000);
    await this.getLeague();
    this.log(colors.yellow(`====== [Join league] ======`));
    const header = await this.getHeader();
    if (!this.leagues.length) {
      const targetLeague = this.leagues[0];
      if (!targetLeague) {
        this.log(colors.red(`Not find league to join!`));
        return;
      }
      try {
        const response = await this.callApi(
          METHOD.GET,
          `https://api.depinalliance.xyz/league/join/${targetLeague.code}`,
          null,
          header
        );
        if (response && response.data.status === "success") {
          this.log(
            colors.green(
              `Apply to join ${targetLeague.name} successfully, Wait for approval...`
            )
          );
          await this.sleep(1000);
        } else {
          this.log(colors.red(`Fail to join league ${targetLeague.name}!`));
        }
      } catch (error) {
        this.log(colors.red(`Fail to join league ${targetLeague.name}!`));
      }
    }
  };

  getLeague = async () => {
    this.log(colors.yellow(`====== [Get list league] ======`));
    const header = await this.getHeader();
    try {
      const response = await this.callApi(
        METHOD.GET,
        "https://api.depinalliance.xyz/league?page=1&size=10&name=",
        null,
        header
      );
      if (response && response.data.status === "success") {
        this.log(colors.green(`Get list league successfully`));
        this.leagues = response.data.data;
        await this.sleep(1000);
      } else {
        this.log(colors.red(`Fail to get list league!`));
        return;
      }
    } catch (error) {
      this.log(colors.red(`Fail to get list league!`));
      return;
    }
  };

  checkUserLeague = async () => {
    this.log(colors.yellow(`====== [Get list league] ======`));
    const header = await this.getHeader();
    try {
      const response = await this.callApi(
        METHOD.GET,
        "https://api.depinalliance.xyz/league/user-league",
        null,
        header
      );
      if (response && response.data.status === "success") {
        this.log(colors.green(`Get list league successfully`));
        await this.sleep(1000);
        if (response.data.data) {
          return response.data.data;
        } else {
          return null;
        }
      } else {
        this.log(colors.red(`Fail to get list league!`));
      }
    } catch (error) {
      this.log(colors.red(`Fail to get list league!`));
    }
  };

  upgradeDevice = async () => {
    await this.getListDevices();
    if (!this.devices.length) {
      this.log(colors.red(`Don't find any devices to update!`));
      return;
    }
    if (this.userInfo.point < MinimumPointToUpgrade) {
      this.log(colors.red(`Point balance not met require balance!`));
      return;
    }
    this.log(colors.yellow(`====== [Upgrade Devices] ======`));
    let spentPoint = 0;
    let devicesCanBuy = [...this.devices].filter(
      (i) => i.price <= this.userInfo.point
    );
    while (
      this.userInfo.point > MinimumPointToUpgrade &&
      this.userInfo.point > spentPoint &&
      devicesCanBuy.length
    ) {
      const closestToPoint = devicesCanBuy.reduce((closest, current) => {
        return closest.price > current.price ? closest : current;
      });
      await this.sleep(1000);
      const isOwnItem = await this.buyDevice(closestToPoint);
      await this.sleep(1000);
      if (isOwnItem) {
        await this.equipDevice(closestToPoint);
        devicesCanBuy = devicesCanBuy.filter(
          (i) => i.code !== closestToPoint.code
        );
        await this.sleep(1000);
      } else {
        devicesCanBuy = devicesCanBuy.filter(
          (i) => i.code !== closestToPoint.code
        );
        await this.sleep(1000);
      }
      await this.sleep(1000);
      spentPoint += closestToPoint.price;
    }
    this.log(colors.green(`Upgrade devices done!`));
    await this.sleep(1000);
    const userMaxDevices = await this.getUserMaxDevices();
    if (
      userMaxDevices &&
      this.userDivies &&
      userMaxDevices.maxDevice > this.userDivies.length
    ) {
      console.log("userMaxDevices", userMaxDevices);
      await this.addNewDevice();
      await this.sleep(1000);
    }
  };

  getUserMaxDevices = async () => {
    this.log(colors.yellow(`====== [Get user max device] ======`));
    const header = await this.getHeader();
    try {
      const response = await this.callApi(
        METHOD.GET,
        "https://api.depinalliance.xyz/users/config",
        null,
        header
      );
      if (response && response.data.status === "success") {
        this.log(colors.green(`Get user max device successfully`));
        return response.data.data;
      } else {
        this.log(colors.red(`Fail to get user max device!`));
        return null;
      }
    } catch (error) {
      this.log(colors.red(`Fail to get user max device!`));
      return null;
    }
  };

  addNewDevice = async () => {
    this.log(colors.yellow(`====== [Add new devices] ======`));
    const header = await this.getHeader();
    try {
      const response = await this.callApi(
        METHOD.GET,
        "https://api.depinalliance.xyz/devices/add-device",
        null,
        header
      );
      if (response && response.data.status === "success") {
        this.log(colors.green(`Add new devices successfully`));
        this.devices = response.data.data;
        await this.sleep(1000);
      } else {
        this.log(colors.red(`Fail to add new devices!`));
      }
    } catch (error) {
      this.log(colors.red(`Fail to add new devices!`));
    }
  };

  getListDevices = async () => {
    this.log(colors.yellow(`====== [Get list devices] ======`));
    const header = await this.getHeader();
    try {
      const response = await this.callApi(
        METHOD.GET,
        "https://api.depinalliance.xyz/devices/item?type=&page=1&sortBy=price&sortAscending=true",
        null,
        header
      );
      if (response && response.data.status === "success") {
        this.log(colors.green(`Get list devices successfully`));
        this.devices = response.data.data;
        await this.sleep(1000);
      } else {
        this.log(colors.red(`Fail to get list devices!`));
        return;
      }
    } catch (error) {
      this.log(colors.red(`Fail to get list devices!`));
      return;
    }
  };

  buyDevice = async (device) => {
    this.log(colors.yellow(`====== [Get list devices] ======`));
    const header = await this.getHeader();
    try {
      const request = { number: 1, code: device.code };
      const response = await this.callApi(
        METHOD.POST,
        "https://api.depinalliance.xyz/devices/buy-item",
        request,
        header
      );
      if (response && response.data.status === "success") {
        this.log(colors.green(`Buy device ${device.name} successfully!`));
        await this.sleep(1000);
        return response.data.data;
      } else {
        this.log(colors.red(`Fail to buy device ${device.name}!`));
        return null;
      }
    } catch (error) {
      this.log(colors.red(`Fail to buy device ${device.name}!`));
      return null;
    }
  };

  equipDevice = async (device) => {
    this.log(colors.yellow(`====== [Equip devices] ======`));
    const header = await this.getHeader();
    try {
      const response = await this.callApi(
        METHOD.GET,
        "https://api.depinalliance.xyz/devices/user-device",
        null,
        header
      );
      if (response && response.data.status === "success") {
        this.log(colors.green(`Equip device ${device.name} successfully!`));
        this.userDivies = response.data.data;
        await this.sleep(1000);
      } else {
        this.log(colors.red(`Fail to equip device ${device.name}!`));
        return;
      }
    } catch (error) {
      this.log(colors.red(`Fail to equip device ${device.name}!`));
      return;
    }
  };

  resolveEquipItemToDevice = async () => {
    const maxItemInDevice = 6;
    const itemTypes = {
      CPU: 1,
      RAM: 3,
      GPU: 2,
      STORAGE: 2,
    };
    await this.equipDevice();
    const deviceOwners = [...this.userDivies];
    await this.sleep(1000);
    for (let i = 0; i < deviceOwners.length; i++) {
      const diviceOwner = deviceOwners[i];
      const userDeviceList = await this.getUserDeviceList(diviceOwner);
      while (userDeviceList && userDeviceList.length < maxItemInDevice) {}
    }

    this.log(colors.yellow(`====== [Resolve equip item to device] ======`));
  };

  getUserDeviceList = async (device) => {
    this.log(
      colors.yellow(
        `====== [Get user devices equiped user ${device.naem}] ======`
      )
    );
    const header = await this.getHeader();
    try {
      const response = await this.callApi(
        METHOD.GET,
        `https://api.depinalliance.xyz/devices/user-device-item?index=${device.index}`,
        null,
        header
      );
      if (response && response.data.status === "success") {
        this.log(colors.green(`Get user devices list successfully`));
        return response.data.data;
      } else {
        this.log(colors.red(`Fail to get user devices list!`));
      }
    } catch (error) {
      this.log(colors.red(`Fail to get user devices list!`));
    }
  };

  getUserDeviceListByType = async (item) => {
    this.log(
      colors.yellow(
        `====== [Get user devices list by type ${item.type}] ======`
      )
    );
    const header = await this.getHeader();
    try {
      const response = await this.callApi(
        METHOD.GET,
        `https://api.depinalliance.xyz/devices/user-device-item?type=${item.type}`,
        null,
        header
      );
      if (response && response.data.status === "success") {
        this.log(
          colors.green(`Get user devices ${item.type} list  successfully`)
        );
        return response.data.data;
      } else {
        this.log(colors.red(`Fail to get user devices ${item.type} list !`));
      }
    } catch (error) {
      this.log(colors.red(`Fail to get user devices ${item.type} list !`));
    }
  };

  addDeviceSelected = async (item, device) => {
    this.log(
      colors.yellow(`====== [Add item ${item.name} into ${device.name}] ======`)
    );
    const header = await this.getHeader();
    try {
      const response = await this.callApi(
        METHOD.GET,
        `https://api.depinalliance.xyz/devices/add-item/${device.index}/${item.id}`,
        null,
        header
      );
      if (response && response.data.status === "success") {
        this.log(
          colors.green(`Add item ${item.name} into ${device.name} successfully`)
        );
      } else {
        this.log(
          colors.red(
            `Fail to add devices item ${item.name} into ${device.name}!`
          )
        );
      }
    } catch (error) {
      this.log(
        colors.red(`Fail to add devices item ${item.name} into ${device.name}!`)
      );
    }
  };

  connectWallets = async (queryId, dataUser, token) => {
    this.log(colors.yellow(`====== [Connect Wallets] ======`));
    const wallets = this.getWalletFile();
    if (!wallets.length) return;
    const header = await this.getHeader();
  };

  buildHeaderTools = () => {
    const excludeKey = ["Accept", "Origin", "Referer"];
    const addional = {
      Origin: "https://punny.pingo.work",
      Referer: "https://punny.pingo.work/",
      Accept: "application/json, text/plain, */*",
    };
    return this.buildHeader(addional, excludeKey);
  };

  async main() {
    this.renderFiglet(this.toolsName, this.version);
    await this.sleep(1000);
    if (!fs.existsSync("auto_run.txt")) {
      await this.renderQuestions();
    } else {
      const autoRunStatuses = await this.updateQuestionStatuses(
        this.questionStatuses
      );
      this.questionStatuses = autoRunStatuses;
      await this.sleep(1000);
      try {
        fs.unlinkSync("auto_run.txt");
      } catch (err) {}
    }
    await this.sleep(1000);

    if (
      !this.questionStatuses.isFarming &&
      !this.questionStatuses.isDailyClaim &&
      !this.questionStatuses.isDoTask &&
      !this.questionStatuses.isAutoUpgradeGameResource &&
      !this.questionStatuses.isAutoJoinLeague
    ) {
      return;
    }

    while (true) {
      const data = this.getDataFile();
      if (!data || data.length < 1) {
        this.log(
          colors.red(`Don't have any data. Please check file data.txt!`)
        );
        await this.sleep(100000);
      }
      for (let i = 0; i < data.length; i++) {
        const queryId = data[i];
        const dataUser = await this.extractUserData(queryId);
        await this.sleep(1000);
        this.log(
          colors.cyan(
            `----------------------=============----------------------`
          )
        );
        this.log(
          colors.cyan(
            `Working with user #${i + 1} | ${dataUser.user.first_name} ${
              dataUser.user.last_name
            }`
          )
        );
        await this.processAccount(queryId, dataUser);
      }
      const extraMinutes = 1 * 60;
      await this.countdown(this.waitingTime + extraMinutes);
    }
  }
}

const client = new Tools();
client.main().catch((err) => {
  client.log(err.message, "error");
});
