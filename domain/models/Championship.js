const { ChampionshipPlayer } = require("./ChampionshipPlayer");
const { Group } = require("./Group");
const { GroupPlayer, PlayOffPlayer } = require("./Player");
const { Draw } = require("./Draw");
const { isOdd } = require("../../utils/util");
const groupNames = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "V",
  "X",
  "Y",
  "Z",
];
class Championship {
  name;
  capacity;
  hasGroups;
  draw;
  groups;
  groupsLength;
  points;
  groupPoints;
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
    this.players = players.map((player) => new ChampionshipPlayer(player));
  }

  /** Create Groups using players from entryList **/
  createGroups = (optimal = 3, entryList = this.entryList) => {
    const groupAmount = Math.floor(entryList.length / optimal);
    const groups = [];

    entryList.forEach((championshipPlayer, index) => {
      const gIndex = index % groupAmount;
      if (!groups[gIndex]) {
        groups[gIndex] = new Group(groupNames[gIndex]);
      }
      groups[gIndex].capacity++;
      groups[gIndex].addPlayer(new GroupPlayer(championshipPlayer.player));
    });
    this.groups = groups;
    this.groupsLength = this.groups.length;

    this.groups.forEach((g) => g.createMatches());
  };

  addPointsAccordingToPlace = () => {
    this.groups.forEach((g) => {
      g.players.forEach((p) => {
        const playerInChamp = this.players.find((cp) => cp.player === p.player);
        playerInChamp.points = this.groupPoints[p.groupMetadata.place];
      });
    });
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
    this.draw = new Draw(this.calculateDrawCapacity(qualifiers), this);
    this.draw.createMatches(this.draw.capacity);
    this.draw.qualifiers = qualifiers;
    this.draw.placesPriority = Draw.calcPlacesPriority(this.draw.capacity);
    this.draw.emptySlots = this.draw.capacity - qualifiers;
  };

  startDraw = () => {
    this.drawPlayersWithLocation.forEach((p) => {
      const isBye = p.player.name === "bye";
      const mNumberForPlayer = Math.ceil(p.location / 2);
      this.draw.matches.forEach((m, i, arr) => {
        if (
          m.playersInRound === this.drawPlayersWithLocation.length &&
          m.matchNumberInRound === mNumberForPlayer
        ) {
          isOdd(p.location)
            ? (m.player1 = new PlayOffPlayer(p.player, isBye))
            : (m.player2 = new PlayOffPlayer(p.player, isBye));
        }
      });
    });
  };

  // add points for result
  onCompletedDraw = () => {
    let stage = this.draw.capacity;
    while (stage > 1) {
      this.draw.matches.forEach((m) => {
        if (m.playersInRound === stage && m.prize === 1) {
          if (m.looser.player) {
            const playerInChamp = this.players.find((cp) => {
              return cp.player === m.looser.player;
            });
            if (playerInChamp) {
              playerInChamp.points = this.points[stage];
            }
          }
          if (stage === 2) {
            if (m.winner.player) {
              const playerInChamp = this.players.find((cp) => {
                return cp.player === m.winner.player;
              });
              if (playerInChamp) {
                playerInChamp.points = this.points[1];
              }
            }
          }
        }
      });
      stage = stage / 2;
    }
  };

  createTournamentResult = () => {
    this.players.sort((a, b) => {
      return a.points < b.points ? 1 : -1;
    });
  };

  calculateDrawCapacity = (players) =>
    Math.pow(2, Math.ceil(Math.log2(players)));
}
exports.Championship = Championship;
