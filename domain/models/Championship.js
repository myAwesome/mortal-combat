const { ChampionshipPlayer } = require("./ChampionshipPlayer");
const { Group } = require("./Group");
const { GroupPlayer } = require("./GroupPlayer");
const { PlayOffPlayer } = require("./PlayOffPlayer");
const { Draw } = require("./Draw");
const { isOdd } = require("../../utils/util");

const groupNames = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "K", "L", "M",
  "N", "O", "P", "Q", "R", "S", "T", "V", "X", "Y", "Z"
];
const BYE_PLAYER_NAME = "bye";
const DEFAULT_DRAW_CONFIG = {
  playThirdPlaceMatch: true,
  playPlacementBrackets: true,
};

class Championship {
  constructor(name, capacity, hasGroups = true, setsToWin = 1, drawConfig = DEFAULT_DRAW_CONFIG) {
    if (![1, 2, 3].includes(Number(setsToWin))) {
      throw new Error("setsToWin must be 1, 2 or 3");
    }
    this.name = name;
    this.capacity = capacity;
    this.hasGroups = hasGroups;
    this.setsToWin = Number(setsToWin);
    this.drawConfig = {
      ...DEFAULT_DRAW_CONFIG,
      ...(drawConfig || {}),
    };
    this.players = null;
    this.points = null;
    this.groupPoints = null;
    this.groups = [];
    this.groupsLength = 0;
    this.joinedGroupsResult = [];
    this.qualifiersAndBye = [];
    this.drawPlayersWithLocation = [];
    this.draw = null;
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
    this.groups.forEach(group => group.createMatches(this.setsToWin));
  };

  createGroupsManual = (manualGroups = [], entryList = this.entryList) => {
    if (!Array.isArray(manualGroups) || manualGroups.length === 0) {
      throw new Error("manualGroups is required");
    }

    const entryById = new Map(
      (entryList || []).map((cp) => [String(cp.player?.id), cp])
    );
    const assignedIds = new Set();

    this.groups = manualGroups.map((manualGroup, index) => {
      const groupName = manualGroup?.name || groupNames[index];
      const playerIds = manualGroup?.playerIds || [];

      if (!Array.isArray(playerIds) || playerIds.length === 0) {
        throw new Error(`Group ${groupName} must contain players`);
      }

      const group = new Group(groupName);
      group.capacity = playerIds.length;

      playerIds.forEach((id) => {
        const key = String(id);
        if (assignedIds.has(key)) {
          throw new Error(`Player ${key} assigned to multiple groups`);
        }
        const championshipPlayer = entryById.get(key);
        if (!championshipPlayer) {
          throw new Error(`Player ${key} is not in entry list`);
        }
        group.addPlayer(new GroupPlayer(championshipPlayer.player));
        assignedIds.add(key);
      });

      return group;
    });

    if (entryById.size !== assignedIds.size) {
      throw new Error("All entry list players must be assigned to a group");
    }

    this.groupsLength = this.groups.length;
    this.groups.forEach((group) => group.createMatches(this.setsToWin));
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
    const qualifierSource = this.hasGroups ? this.joinedGroupsResult : this.players;
    this.qualifiersAndBye = [
      ...qualifierSource.slice(0, this.draw.qualifiers),
      ...byes,
    ];
  };

  seedDrawPlayers = () => {
    this.drawPlayersWithLocation = this.qualifiersAndBye.map((qualifier, index) => ({
      player: qualifier.player,
      location: this.draw.placesPriority[index],
    })).sort((a, b) => a.location - b.location);
  };

  seedDrawPlayersManual = (manualPlayerIds = []) => {
    if (!Array.isArray(manualPlayerIds)) {
      throw new Error("manualPlayerIds must be an array");
    }
    if (manualPlayerIds.length !== this.draw.capacity) {
      throw new Error(`manualPlayerIds must contain exactly ${this.draw.capacity} slots`);
    }

    const qualifierSource = this.hasGroups ? this.joinedGroupsResult : this.players;
    const qualifiers = qualifierSource.slice(0, this.draw.qualifiers);
    const playersById = new Map(
      qualifiers.map((entry) => [String(entry.player?.id), entry.player])
    );
    const assigned = new Set();

    this.drawPlayersWithLocation = manualPlayerIds.map((playerId, index) => {
      if (playerId === null || playerId === undefined || playerId === "") {
        return { player: { name: BYE_PLAYER_NAME }, location: index + 1 };
      }

      const key = String(playerId);
      const player = playersById.get(key);
      if (!player) {
        throw new Error(`Player ${key} is not a qualified draw participant`);
      }
      if (assigned.has(key)) {
        throw new Error(`Player ${key} assigned to multiple draw slots`);
      }
      assigned.add(key);
      return { player, location: index + 1 };
    });

    if (assigned.size !== playersById.size) {
      throw new Error("Assign every qualified player exactly once");
    }
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

    if (match.loser?.player) awardPointsToPlayer(match.loser.player, this.points[stage]);
    if (stage === 2 && match.winner?.player) awardPointsToPlayer(match.winner.player, this.points[1]);
  };

  createTournamentResult = () => {
    this.players.sort((a, b) => b.points - a.points);
  };

  calculateDrawCapacity = (players) => Math.pow(2, Math.ceil(Math.log2(players)));
}

Championship.DEFAULT_DRAW_CONFIG = DEFAULT_DRAW_CONFIG;
exports.Championship = Championship;
