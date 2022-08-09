const { ChampionshipPlayer, groupNames } = require("./ChampionshipPlayer");
const { Group } = require("./Group");
const { GroupPlayer } = require("./Player");
const { Draw } = require("./Draw");
const {
  calculateDrawCapacity,
  placesPriority,
} = require("../builders/play_off");
const { points } = require("./mocks");

class Championship {
  name;
  capacity;
  hasGroups;
  draw;
  groups;
  groupsLength;
  points;
  players;
  joinedGroupsResult;
  qualifiersAndBye;
  drawPlayersWithLocation;

  constructor(name, capacity, hasGroups = true) {
    this.name = name;
    this.capacity = capacity;
    this.hasGroups = hasGroups;
    this.groups = [];
    this.joinedGroupsResult = [];
    this.drawPlayersWithLocation = [];
    return this;
  }
  get entryList() {
    return this.players;
  }
  set entryList(players) {
    this.players = players
      .map((player) => new ChampionshipPlayer(player))
      .map((cp) => new GroupPlayer(cp));

    return true;
  }

  /** Create Groups using players from entryList **/
  createGroups = (optimal = 3, entryList = this.entryList) => {
    const groupAmount = Math.floor(entryList.length / optimal);
    const groups = [];

    entryList.forEach((player, index) => {
      const gIndex = index % groupAmount;
      if (!groups[gIndex]) {
        groups[gIndex] = new Group(groupNames[gIndex]);
      }
      groups[gIndex].capacity++;
      groups[gIndex].addPlayer(player);
    });
    this.groups = groups;
    this.groupsLength = this.groups.length;

    this.groups.forEach((g) => g.createMatches());
    this.groups.forEach((g) => g.players.sort(Group.orderPlaces));
  };

  prepareQualifiersForDraw = () => {
    this.qualifiersAndBye = [
      ...this.joinedGroupsResult.slice(0, this.draw.qualifiers),
      ...[...Array(this.draw.emptySlots).keys()].map((i) => ({
        player: { name: "bye" },
      })),
    ];
  };

  seedDrawPlayers = () => {
    for (let qualifierIndex in this.qualifiersAndBye) {
      this.drawPlayersWithLocation.push({
        player: this.qualifiersAndBye[qualifierIndex].player,
        location: this.draw.placesPriority[qualifierIndex],
      });
    }

    this.drawPlayersWithLocation.sort((a, b) => {
      return a.location > b.location ? 1 : -1;
    });
  };

  createJoinedGroupsResult = (groups) => {
    const result = [];
    const maxGroupCapacity = groups.reduce((prev, curr) => {
      return prev < curr.players.length ? curr.players.length : prev;
    }, 0);

    for (let i = 0; i < maxGroupCapacity; i++) {
      const joinedGroupsResult = [];
      for (let g of groups) {
        if (g.players[i]) {
          joinedGroupsResult.push(g.players[i]);
        }
      }
      joinedGroupsResult.sort(Group.orderPlaces);
      result.push(...joinedGroupsResult);
    }

    return result;
  };

  createDraw = () => {
    const qualifiers = this.hasGroups ? this.groupsLength * 2 : this.capacity;
    this.draw = new Draw(calculateDrawCapacity(qualifiers));
    this.draw.createMatches(this.draw.capacity);
    this.draw.qualifiers = qualifiers;
    this.draw.placesPriority = placesPriority(this.draw.capacity);
    this.draw.emptySlots = this.draw.capacity - qualifiers;
  };
}
exports.Championship = Championship;
