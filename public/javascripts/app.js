var app = angular.module('app', []);

app.controller('ctrl', function ($scope, $interval, Player, socket, $http) {

    $scope.title = 'Cool Game';
    $scope.player;
    $scope.enemies = {
        enemyList: [],
        update: function () {
            this.enemyList.forEach(function (enemy) {
                enemy.x += enemy.speedX;
                enemy.y += enemy.speedY;
                enemy.shots.forEach(function (shot) {
                    shot.x += shot.speedX;
                    shot.y += shot.speedY;
                    shot.range--;
                    if (shot.range <= 0) {
                        shot.active = false;
                    };
                })
                enemy.shots = enemy.shots.filter(function (shot) {
                    return shot.active;
                })
            })
            this.enemyList = this.enemyList.filter(function (enemy) {
                return enemy.hp > 0;
            })
        },
        draw: function () {
            this.enemyList.forEach(function (enemy) {
                ctx = $scope.gameArea.context;
                ctx.fillStyle = "red";
                ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
                enemy.shots.forEach(function (shot) {
                    ctx.fillStyle = "red";
                    ctx.fillRect(shot.x, shot.y, shot.width, shot.height);
                })
            })
        }

    }

    $scope.user = {
        hp: 5,
        size: 40,
        speed: 4,
        shotSpeed: 1,
        shotSize: 15,
        freq: 7,
        range: 3,
        killstreak: 0
    }

    $http.get('users/verify').then(function OK(e) {
        if (e.status != 200) {
            document.location.href = '/login';
        } else {
            $scope.user.name = e.data.user;
            $scope.user.kills = e.data.kills;
            $scope.user.hits = e.data.hits;
            $scope.user.deaths = e.data.deaths;
            $scope.user.shotcount = e.data.shots;
        }
    }, function ERR(e) {
        console.log(e.statusText);
    })



    $scope.startGame = function () {
        $scope.gameArea.start();
        $scope.player = new Player($scope.user.name, 'blue', $scope.gameArea, $scope.user.hp, $scope.user.size, $scope.user.size, Math.floor(Math.random() * ($scope.gameArea.getWidth() - $scope.user.size)), Math.floor(Math.random() * ($scope.gameArea.getHeight() - $scope.user.size)), $scope.user.shotcount, $scope.user.hits, $scope.user.kills, $scope.user.deaths);
        // $scope.enemies.enemyList.push(new Player($scope.gameArea, 10, 30, 30, 'red', 120, 120));
        console.log($scope.player);
        socket.emit('newPlayer', $scope.player);
    }



    $scope.gameArea = {
        canvas: document.getElementById('canvas'),
        start: function () {
            this.canvas.width = 500;
            this.canvas.height = 500;
            this.context = this.canvas.getContext('2d');
            this.FPS = 50;
            this.interval = $interval($scope.updateGameArea, 1000 / this.FPS);
        },
        clear: function () {
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        },
        getWidth: function () {
            return this.canvas.width;
        },
        getHeight: function () {
            return this.canvas.height;
        }
    }

    $scope.updateGameArea = function () {
        $scope.gameArea.clear();
        $scope.enemies.update();
        $scope.enemies.draw();

        $scope.player.speedX = 0;
        $scope.player.speedY = 0;
        if ($scope.gameArea.keys && $scope.gameArea.keys[37]) {
            $scope.player.speedX = -$scope.user.speed;
        }
        if ($scope.gameArea.keys && $scope.gameArea.keys[39]) {
            $scope.player.speedX = $scope.user.speed;
        }
        if ($scope.gameArea.keys && $scope.gameArea.keys[38]) {
            $scope.player.speedY = -$scope.user.speed;
        }
        if ($scope.gameArea.keys && $scope.gameArea.keys[40]) {
            $scope.player.speedY = $scope.user.speed;
        }

        if($scope.gameArea.keys && $scope.gameArea.keys[32]) {
            console.log($scope.enemies.enemyList);
        }

        $scope.player.update();
        $scope.player.draw();

        if ($scope.gameArea.keys && $scope.gameArea.keys[68]) {
            $scope.player.shoot('right', $scope.user.shotSpeed, $scope.user.shotSize, $scope.user.range, $scope.user.freq)
        }
        if ($scope.gameArea.keys && $scope.gameArea.keys[65]) {
            $scope.player.shoot('left', $scope.user.shotSpeed, $scope.user.shotSize, $scope.user.range, $scope.user.freq)
        }
        if ($scope.gameArea.keys && $scope.gameArea.keys[83]) {
            $scope.player.shoot('down', $scope.user.shotSpeed, $scope.user.shotSize, $scope.user.range, $scope.user.freq)
        }
        if ($scope.gameArea.keys && $scope.gameArea.keys[87]) {
            $scope.player.shoot('up', $scope.user.shotSpeed, $scope.user.shotSize, $scope.user.range, $scope.user.freq)
        }


        socket.emit('updatePlayer', $scope.player);
        socket.emit('getEnemies', $scope.player);


        $scope.checkCollisions();
    }

    $scope.keydown = function (e) {
        $scope.gameArea.keys = ($scope.gameArea.keys || []);
        $scope.gameArea.keys[e.keyCode] = true;
    }

    $scope.keyup = function (e) {
        $scope.gameArea.keys[e.keyCode] = false;
    }

    $scope.collide = function (a, b) {
        var collided = a.x < b.x + b.width &&
            a.y < b.y + b.height &&
            a.x + a.width > b.x &&
            a.y + a.height > b.y;
        return collided;
    }

    $scope.checkCollisions = function () {
        $scope.player.shots.forEach(function (shot) {
            $scope.enemies.enemyList.forEach(function (enemy) {
                if ($scope.collide(shot, enemy)) {
                    shot.active = false;
                    enemy.hp--;
                    $http.post('users/uphit');
                    $scope.player.hits++;
                    socket.emit('hitEnemy', enemy.id);
                    console.log('hit enemy ' + enemy.id, 'enemy hp: ' + enemy.hp);
                    if (enemy.hp <= 0) {
                        $http.post('users/upkill');
                        $scope.player.kills++;
                        $scope.user.killstreak += 1;
                        console.log('enemy dead');
                        socket.emit('enemyDead', enemy.id);
                    }
                }
            })
        })

    }

    socket.on('youHit', function() {
        $scope.player.hp--;

        if( $scope.player.hp != 0){
            $scope.player.width = $scope.player.hp*8;
            $scope.player.height = $scope.player.hp*8;

            if($scope.player.hp == 2){
                console.log("small-power-time!!!");
                $scope.user.range = .5;
                $scope.user.speed = 5;
                $scope.user.shotSpeed = 3;
                $scope.user.shotSize = 6;
                //$scope.user.freq = 5;
            }
        }
    })

    socket.on('youDied', function() {
        console.log('I died');
        $interval.cancel($scope.gameArea.interval);
        socket.emit('removePlayer');
        var ctx = $scope.gameArea.canvas.getContext('2d');
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'white';
        ctx.fillText("YOU DIED!!!",250,250);
    })

    socket.on('greeting', function (data) {
        $scope.startGame();
    })

    socket.on('players', function (players) {
        console.log(players);
    })

    socket.on('enemies', function (enemies) {
        $scope.enemies.enemyList = enemies;
    })
})

app.factory('Player', ['$timeout', 'Shot', '$http', function ($timeout, Shot, $http) {
    function Player(name, color, gameArea, hp, width, height, x, y, shotcount, hits, kills, deaths) {
        this.name = name;
        this.hp = hp;
        this.color = color;
        this.width = width;
        this.height = height;
        this.x = x;
        this.y = y;
        this.shots = [];
        this.speedX = 0;
        this.speedY = 0;
        //this.name = '';
        this.shotcount = shotcount;
        this.hits = hits;
        this.kills = kills;
        this.deaths = deaths;
        this.killstreak = 0;
        this.draw = function () {
            ctx = gameArea.context;
            ctx.fillStyle = color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
            this.drawShots();
        }
        this.update = function () {
            this.x += this.speedX;
            this.y += this.speedY;
            this.updateShots();
            this.shots = this.shots.filter(function (shot) {
                return shot.active;
            })
            this.hitWall();
        }
        this.hitWall = function () {
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
        this.toggleCanShoot = function () {
            this.canShoot = this.canShoot == true ? false : true;
        }
        this.shoot = function (dir, shotSpeed, shotSize, range, freq) {
            if (this.canShoot) {
                this.canShoot = false;
                if (dir == 'right') {
                    var calcShotSpeed = 2 + shotSpeed + Math.max(0, this.speedX / 2);
                    var shot = new Shot(gameArea, shotSize, shotSize, 'black', this.x + this.width, this.y + this.height / 2 - shotSize / 2, calcShotSpeed, this.speedY / 3, range);
                    this.shots.push(shot);
                }
                if (dir == 'left') {
                    var calcShotSpeed = -2 - shotSpeed - Math.max(0, -this.speedX / 2);
                    var shot = new Shot(gameArea, shotSize, shotSize, 'black', this.x - shotSize, this.y + this.height / 2 - shotSize / 2, calcShotSpeed, this.speedY / 3, range);
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

                $http.post('users/upshot');
                this.shotcount++;

                var that = this;
                $timeout(function () {
                    that.toggleCanShoot();
                }, 1000 / freq)
            }
        }

        this.drawShots = function () {
            this.shots.forEach(function (shot) {
                ctx = gameArea.context;
                ctx.fillStyle = '#'+(Math.random()*0xFFFFFF<<0).toString(16);
                ctx.fillRect(shot.x, shot.y, shot.width, shot.height);
            })
        }

        this.updateShots = function () {
            this.shots.forEach(function (shot) {
                shot.x += shot.speedX;
                shot.y += shot.speedY;
                shot.range--;
                if (shot.range <= 0) {
                    shot.active = false;
                };
            })
        }

    }
    return Player;
}])

app.factory('Shot', function () {
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

app.factory('socket', function ($rootScope) {
    var socket = io.connect();
    return {
        on: function (eventName, callback) {
            socket.on(eventName, function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    callback.apply(socket, args);
                });
            });
        },
        emit: function (eventName, data, callback) {
            socket.emit(eventName, data, function () {
                var args = arguments;
                $rootScope.$apply(function () {
                    if (callback) {
                        callback.apply(socket, args);
                    }
                });
            })
        }
    };
});