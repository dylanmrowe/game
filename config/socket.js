var sockets = function(server) {
	var io = require('socket.io')(server);

	var players = [];

	io.on('connection', function(socket) {
		console.log('USER CONNECTED ==============================================');
		socket.emit('greeting', { message: "Hello!"});
		
		socket.on('newPlayer', function(player) {
			player.id = this.id;
			console.log(player)
			players.push(player);
			socket.emit('players', players);
		})

		socket.on('updatePlayer', function(player) {
			player.id = this.id;
			players[players.findIndex(findPlayer, this)] = player;
		})

		socket.on('getEnemies', function(player) {
			var enemies = players.filter(filterEnemies, this);
			socket.emit('enemies', enemies);
			// console.log(enemies);
		})

		socket.on('disconnect', function() {
			console.log('USER DISCONNECTED =======================================');
			players.splice(players.findIndex(findPlayer, this), 1);

		})
	})

	return io;
}

module.exports = sockets;

function findPlayer(player) {
	return player.id == this.id;
}

function filterEnemies(enemy) {
	// console.log(enemy.id, this.id);
	return enemy.id != this.id;
}