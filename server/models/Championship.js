const { ChampionshipPlayer, groupNames } = require("./ChampionshipPlayer");
const { Group, GroupPlayer } = require("./Group");
const { Draw } = require("./Draw");
const {
  calculateDrawCapacity,
  placesPriority,
} = require("../builders/play_off");
const { points } = require("./mocks");

class Championship {
  id;
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

  constructor(id, name, capacity, hasGroups) {
    this.id = id;
    this.name = name;
    this.capacity = capacity;
    this.hasGroups = hasGroups;
    this.draw = new Draw(this);
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

  /** from entryList **/
  createGroups = (optimal = 3) => {
    if (this.hasGroups) {
      const groupAmount = Math.floor(this.entryList.length / optimal);
      const groups = [];

      this.entryList.forEach((player, index) => {
        const gIndex = index % groupAmount;
        if (!groups[gIndex]) {
          groups[gIndex] = new Group(groupNames[gIndex]);
        }
        groups[gIndex].players.push(player);
      });
      this.groups = groups;
      this.groupsLength = this.groups.length;
    }
    this.createDraw();
    this.groups.forEach((g) => g.createMatches());
    this.groups.forEach((g) => g.players.sort(Group.orderPlaces));
    this.groups.forEach((g) => {
      g.players.forEach((p, i) => {
        p.groupMetadata.place = i + 1;
        p.groupMetadata.group = g.name;
        if (i < 2) {
          p.points = points["16"];
        }
        if (i === 2) {
          p.points = points["3place"];
        }
        if (i === 3) {
          p.points = points["4place"];
        }
      });
    });

    const maxDrawCapacity = this.groups.reduce((prev, curr) => {
      return prev < curr.players.length ? curr.players.length : prev;
    }, 0);

    // todo: зробити більш читаємо
    // todo: винести
    for (let i = 0; i < maxDrawCapacity; i++) {
      const joinedGroupsResult = [];
      for (let g of this.groups) {
        if (g.players[i]) {
          joinedGroupsResult.push(g.players[i]);
        }
      }
      joinedGroupsResult.sort(Group.orderPlaces);
      this.joinedGroupsResult.push(...joinedGroupsResult);
    }

    // todo: CodeReview   ...[...Array(this.draw.emptySlots).keys()].map((i) => "bye"),
    // todo: pad right,
    this.qualifiersAndBye = [
      ...this.joinedGroupsResult.slice(0, this.draw.qualifiers),
      ...[...Array(this.draw.emptySlots).keys()].map((i) => ({
        player: { name: "bye" },
      })),
    ];

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

  createDraw = () => {
    const qualifiers = this.hasGroups ? this.groupsLength * 2 : this.capacity;
    this.draw.qualifiers = qualifiers;
    this.draw.capacity = calculateDrawCapacity(qualifiers);
    this.draw.placesPriority = placesPriority(this.draw.capacity);
    this.draw.emptySlots = this.draw.capacity - qualifiers;
    this.draw.matchesLength = this.draw.capacity / 2;
  };
}
exports.Championship = Championship;
