var app = angular.module('app', []);

app.controller('ctrl', function($scope, $interval, Player, socket) {
	$scope.title = 'canvas';
	$scope.player;
	$scope.enemies = {
		enemyList: [],
		update: function() {
			this.enemyList.forEach(function(enemy) {
				enemy.x += enemy.speedX;
				enemy.y += enemy.speedY;
				enemy.shots.forEach(function(shot) {
					shot.x += shot.speedX;
					shot.y += shot.speedY;
					shot.range--;
					if (shot.range <= 0) {shot.active = false;};
				})
		        enemy.shots = enemy.shots.filter(function(shot) {return shot.active;})
			})
			this.enemyList = this.enemyList.filter(function(enemy) {
				return enemy.hp > 0;
			})
		},
		draw: function() {
			this.enemyList.forEach(function(enemy) {
				ctx = $scope.gameArea.context;
				ctx.fillStyle = "red";
				ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
				enemy.shots.forEach(function(shot) {
					ctx.fillStyle = "red";
					ctx.fillRect(shot.x, shot.y, shot.width, shot.height);
				})
			})
		}

	}

	$scope.user = {
		name: 'bobby',
		hp: 1,
		size: 30,
		speed: 4,
		shotSpeed: 1,
		shotSize: 5,
		freq: 5,
		range: 1
	}

	$scope.startGame = function () {
		$scope.gameArea.start();
		console.log(Math.floor(Math.random() * ($scope.gameArea.getWidth() - $scope.user.size)));
		$scope.player = new Player('blue', $scope.gameArea, $scope.user.hp, $scope.user.size, $scope.user.size, Math.floor(Math.random() * ($scope.gameArea.getWidth() - $scope.user.size)), Math.floor(Math.random() * ($scope.gameArea.getHeight() - $scope.user.size)));
		// $scope.enemies.enemyList.push(new Player($scope.gameArea, 10, 30, 30, 'red', 120, 120));
		socket.emit('newPlayer', $scope.player);
	}

	$scope.gameArea = {
		canvas: document.getElementById('canvas'),
		start: function() {
			this.canvas.width = 500;
			this.canvas.height = 500;
			this.context = this.canvas.getContext('2d');
			this.FPS = 50;
			this.interval = $interval($scope.updateGameArea, 1000 / this.FPS);
		},
		clear: function() {
			this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
		},
		getWidth: function() {
			return this.canvas.width;
		},
		getHeight: function() {
			return this.canvas.height;
		}
	}

	$scope.updateGameArea = function() {
		$scope.gameArea.clear();
		$scope.enemies.update();
		$scope.enemies.draw();

		$scope.player.speedX = 0;
    	$scope.player.speedY = 0;
	    if ($scope.gameArea.keys && $scope.gameArea.keys[37]) {$scope.player.speedX = -$scope.user.speed; }
	    if ($scope.gameArea.keys && $scope.gameArea.keys[39]) {$scope.player.speedX = $scope.user.speed; }
	    if ($scope.gameArea.keys && $scope.gameArea.keys[38]) {$scope.player.speedY = -$scope.user.speed; }
	    if ($scope.gameArea.keys && $scope.gameArea.keys[40]) {$scope.player.speedY = $scope.user.speed; }
		
		$scope.player.update();
		$scope.player.draw();

	    if ($scope.gameArea.keys && $scope.gameArea.keys[68]) {$scope.player.shoot('right', $scope.user.shotSpeed, $scope.user.shotSize, $scope.user.range, $scope.user.freq)}
	    if ($scope.gameArea.keys && $scope.gameArea.keys[65]) {$scope.player.shoot('left', $scope.user.shotSpeed, $scope.user.shotSize, $scope.user.range, $scope.user.freq)}
	    if ($scope.gameArea.keys && $scope.gameArea.keys[83]) {$scope.player.shoot('down', $scope.user.shotSpeed, $scope.user.shotSize, $scope.user.range, $scope.user.freq)}
	    if ($scope.gameArea.keys && $scope.gameArea.keys[87]) {$scope.player.shoot('up', $scope.user.shotSpeed, $scope.user.shotSize, $scope.user.range, $scope.user.freq)}


		socket.emit('updatePlayer', $scope.player);
		socket.emit('getEnemies', $scope.player);


		$scope.checkCollisions();
	}

	$scope.keydown = function(e) {
		$scope.gameArea.keys = ($scope.gameArea.keys || []);
		$scope.gameArea.keys[e.keyCode] = true;
	}

	$scope.keyup = function(e) {
		$scope.gameArea.keys[e.keyCode] = false;
	}

	$scope.collide = function(a, b) {
		var collided = a.x < b.x + b.width && 
					   a.y < b.y + b.height && 
					   a.x + a.width > b.x &&
					   a.y + a.height > b.y;
		return collided;
	}

	$scope.checkCollisions = function() {
		$scope.player.shots.forEach(function(shot) {
			$scope.enemies.enemyList.forEach(function(enemy) {
				if ($scope.collide(shot, enemy)) {
					shot.active = false;
					enemy.hp--;
					console.log('hit enemy ' + enemy.id, 'enemy hp: ' + enemy.hp);
					if (enemy.hp <= 0) {
						console.log('enemy dead');
					}
				}
			})
		})

	}
	
	socket.on('greeting', function(data) {
		console.log(data);
		$scope.startGame();
	})

	socket.on('players', function(players) {
		console.log(players);
	})

	socket.on('enemies', function(enemies) {
		enemies.forEach(function(enemy) {
			$scope.enemies.enemyList = enemies;
		})
		// console.log(enemies);
	})
})

app.factory('Player', ['$timeout', 'Shot', function($timeout, Shot) {
	function Player(color, gameArea, hp, width, height, x, y)  {
		this.hp = hp;
		this.color = color;
	    this.width = width;
	    this.height = height;
	    this.x = x;
	    this.y = y;
	    this.shots = [];
	    this.speedX = 0;
	    this.speedY = 0;
	    this.draw = function() {
	        ctx = gameArea.context;
	        ctx.fillStyle = color;
	        ctx.fillRect(this.x, this.y, this.width, this.height);
	        this.drawShots();
	    }
	    this.update = function() {
	        this.x += this.speedX;
	        this.y += this.speedY;
	        this.updateShots();
	        this.shots = this.shots.filter(function(shot) {return shot.active;})
	        this.hitWall();
	    } 
	    this.hitWall = function() {
	    	var top = 0;
	    	var left = 0;
	    	var bottom = gameArea.canvas.height - this.height;
	    	var right = gameArea.canvas.width - this.width;
	    	if (this.y > bottom) {
	    		this.speedY = 0;
	    		this.y = bottom;
	    	}
	    	if (this.y < top) {
	    		this.speedY = 0;
	    		this.y = top;
	    	}
	    	if (this.x > right) {
	    		this.speedX = 0;
	    		this.x = right;
	    	}
	    	if (this.x < left) {
	    		this.speedX = 0;
	    		this.x = left;
	    	}
	    }
	    this.canShoot = true;
	    this.toggleCanShoot = function() {
	    	this.canShoot = this.canShoot == true ? false : true;
	    }
	    this.shoot = function(dir, shotSpeed, shotSize, range, freq) {
	    	if (this.canShoot) {
	    		this.canShoot = false;
		    	if (dir == 'right') {
		    		var calcShotSpeed = 2 + shotSpeed + Math.max(0, this.speedX / 2);
		    		var shot = new Shot(gameArea, shotSize, shotSize, 'black', this.x + this.width, this.y + this.height / 2 - shotSize / 2, calcShotSpeed, this.speedY / 3, range);
		    		this.shots.push(shot);
		    	}
		    	if (dir == 'left') {
		    		var calcShotSpeed = -2 - shotSpeed - Math.max(0, -this.speedX / 2);
		    		var shot = new Shot(gameArea, shotSize, shotSize, 'black', this.x - shotSize, this.y + this.height / 2  - shotSize / 2, calcShotSpeed, this.speedY / 3, range);
		    		this.shots.push(shot);
		    	}
		    	if (dir == 'down') {
		    		var calcShotSpeed = 2 + shotSpeed + Math.max(0, this.speedY / 2);
		    		var shot = new Shot(gameArea, shotSize, shotSize, 'black', this.x + this.width / 2 - shotSize / 2, this.y + this.height, this.speedX / 3, calcShotSpeed, range);
		    		this.shots.push(shot);
		    	}
		    	if (dir == 'up') {
		    		var calcShotSpeed = -2 - shotSpeed - Math.max(0, -this.speedY / 2);
		    		var shot = new Shot(gameArea, shotSize, shotSize, 'black', this.x + this.width / 2 - shotSize / 2, this.y - shotSize, this.speedX / 3, calcShotSpeed, range);
		    		this.shots.push(shot);
		    	}
		    	var that = this;
			    $timeout(function() {
			    	that.toggleCanShoot();
			    }, 1000 / freq)
	    	}
	    }

	    this.drawShots = function() {
	    	this.shots.forEach(function(shot) {
	    		ctx = gameArea.context;
	    		ctx.fillStyle = color;
	    		ctx.fillRect(shot.x, shot.y, shot.width, shot.height);
	    	})
	    }

	    this.updateShots = function() {
	    	this.shots.forEach(function(shot) {
	    		shot.x += shot.speedX;
	    		shot.y += shot.speedY;
	    		shot.range--;
	    		if (shot.range <= 0) {shot.active = false;};
	    	})
	    }

	}
	return Player;
}])

app.factory('Shot', function() {
	function Shot(gameArea, width, height, color, x, y, shotSpeedX, shotSpeedY, range) {
		this.active = true;
		this.range = range * 50;
		this.width = width;
		this.height = height;
		this.x = x;
		this.y = y;
		this.speedX = shotSpeedX;
		this.speedY = shotSpeedY;
	}
	return Shot;
})

app.factory('socket', function($rootScope) {
	var socket = io.connect();
	return {
		on: function(eventName, callback) {
			socket.on(eventName, function() {
				var args = arguments;
				$rootScope.$apply(function () {
					callback.apply(socket, args);
				});
			});
		},
		emit: function(eventName, data, callback) {
			socket.emit(eventName, data, function() {
				var args = arguments;
				$rootScope.$apply(function() {
					if (callback) {
						callback.apply(socket, args);
					}
				});
			})
		}
	};
});