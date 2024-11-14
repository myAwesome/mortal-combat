const { ChampionshipPlayer } = require("./ChampionshipPlayer");
const { Group } = require("./Group");
const { GroupPlayer, PlayOffPlayer } = require("./Player");
const { Draw } = require("./Draw");
const { isOdd } = require("../../utils/util");

const groupNames = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "K", "L", "M",
  "N", "O", "P", "Q", "R", "S", "T", "V", "X", "Y", "Z"
];
const BYE_PLAYER_NAME = "bye";

class Championship {
  constructor(name, capacity, hasGroups = true) {
    this.name = name;
    this.capacity = capacity;
    this.hasGroups = hasGroups;
    this.groups = [];
    this.joinedGroupsResult = [];
    this.drawPlayersWithLocation = [];
    return this;
  }

  // Getters and Setters
  get entryList() {
    return this.players;
  }

  set entryList(players) {
    this.players = players.map(player => new ChampionshipPlayer(player));
  }

  // Group Creation and Initialization
  createGroups = (optimalGroupSize = 3, entryList = this.entryList) => {
    const groupAmount = Math.floor(entryList.length / optimalGroupSize);
    this.groups = Array.from({ length: groupAmount }, (_, index) => new Group(groupNames[index]));

    entryList.forEach((championshipPlayer, index) => {
      const group = this.groups[index % groupAmount];
      group.capacity++;
      group.addPlayer(new GroupPlayer(championshipPlayer.player));
    });

    this.groupsLength = this.groups.length;
    this.groups.forEach(group => group.createMatches());
  };

  // Point Assignment
  addPointsAccordingToPlace = () => {
    this.groups.forEach(group => {
      group.players.forEach(player => {
        const championshipPlayer = this.players.find(cp => cp.player === player.player);
        if (championshipPlayer) {
          championshipPlayer.points = this.groupPoints[player.groupMetadata.place];
        }
      });
    });
  };

  // Qualifier Preparation
  prepareQualifiersForDraw = () => {
    const byes = Array(this.draw.emptySlots).fill({ player: { name: BYE_PLAYER_NAME } });
    this.qualifiersAndBye = [
      ...this.joinedGroupsResult.slice(0, this.draw.qualifiers),
      ...byes,
    ];
  };

  seedDrawPlayers = () => {
    this.drawPlayersWithLocation = this.qualifiersAndBye.map((qualifier, index) => ({
      player: qualifier.player,
      location: this.draw.placesPriority[index],
    })).sort((a, b) => a.location - b.location);
  };

  createJoinedGroupsResult = (groups) => {
    const maxGroupCapacity = Math.max(...groups.map(group => group.players.length));
    const result = [];

    for (let i = 0; i < maxGroupCapacity; i++) {
      const groupStagePlayers = groups.map(group => group.players[i]).filter(Boolean);
      groupStagePlayers.sort(Group.orderPlaces);
      result.push(...groupStagePlayers);
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
    this.drawPlayersWithLocation.forEach(playerLocation => {
      const matchNumber = Math.ceil(playerLocation.location / 2);
      const isBye = playerLocation.player.name === BYE_PLAYER_NAME;

      this.draw.matches.forEach(match => {
        if (match.playersInRound === this.drawPlayersWithLocation.length && match.matchNumberInRound === matchNumber) {
          isOdd(playerLocation.location)
              ? (match.player1 = new PlayOffPlayer(playerLocation.player, isBye))
              : (match.player2 = new PlayOffPlayer(playerLocation.player, isBye));
        }
      });
    });
  };

  onCompletedDraw = () => {
    let stage = this.draw.capacity;

    while (stage > 1) {
      this.draw.matches.forEach(match => {
        if (match.playersInRound === stage && match.prize === 1) {
          this.awardPoints(match, stage);
        }
      });
      stage /= 2;
    }
  };

  awardPoints = (match, stage) => {
    const awardPointsToPlayer = (player, stagePoints) => {
      const championshipPlayer = this.players.find(cp => cp.player === player);
      if (championshipPlayer) {
        championshipPlayer.points = stagePoints;
      }
    };

    if (match.looser?.player) awardPointsToPlayer(match.looser.player, this.points[stage]);
    if (stage === 2 && match.winner?.player) awardPointsToPlayer(match.winner.player, this.points[1]);
  };

  createTournamentResult = () => {
    this.players.sort((a, b) => b.points - a.points);
  };

  calculateDrawCapacity = (players) => Math.pow(2, Math.ceil(Math.log2(players)));
}

exports.Championship = Championship;
