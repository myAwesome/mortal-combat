console.log('building group...');


const createGroupMatches = group => {
  const matches = [];
  const {players, capacity, champ} = group;
  players.forEach((player,key) => {
    for (let opponent_id = key+1; opponent_id < capacity; opponent_id++) {
      const match = {};
      match.group = group;
      match.date = champ.startDate;
      match.player1 = player;
      match.player2 = players[opponent_id];
      matches.push(match);
    }
  });

  return matches;
}

// createGroupMatches(
//   {
//     players:["Federer", "Nadal", "Kei", "Schwartzman"],
//     capacity: 4,
//     champ: {startDate:new Date()}
//   })


function calculateGroupsAmount(totalPlayers) {
  const OPTIMAL = 3;
  console.log( `${totalPlayers} players in ${Math.floor(totalPlayers/OPTIMAL)} groups, ${totalPlayers%OPTIMAL} groups overflowed`);
}

// for (let i = 3; i<=12; i++){
//   calculateGroupsAmount(i);
// }




