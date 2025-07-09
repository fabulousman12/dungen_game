
const MAP_WIDTH = 80;
const MAP_HEIGHT = 80;
const VIEWPORT_SIZE = 15;
const SIGHT_RANGE = 6;

let map = [];
let monsters = [];
let powerUps = [];

const player = {
  x: 20, y: 20,
  health: 100,
  maxHealth: 100,
  attack: 20,
  level: 1,
};

// Icons
const icons = {
  wall: '🧱',
  floor: '',
  player: '🧙',
  monster: '👾',
  strongMonster: '💀',
  health: '❤️',
  sword: '🗡️'
};

// Generate map
for (let y = 0; y < MAP_HEIGHT; y++) {
  map[y] = [];
  for (let x = 0; x < MAP_WIDTH; x++) {
    map[y][x] = Math.random() < 0.12 ? 'wall' : 'floor';
  }
}
map[player.y][player.x] = 'player';

function spawnMonsters(count = 25) {
  monsters = [];
  for (let i = 0; i < count; i++) {
    let x, y;
    do {
      x = Math.floor(Math.random() * MAP_WIDTH);
      y = Math.floor(Math.random() * MAP_HEIGHT);
    } while (map[y][x] !== 'floor' || (x === player.x && y === player.y));

    const level = Math.random() < 0.3 ? 2 : 1;
    monsters.push({ x, y, health: level * 40, attack: level * 10, level });
    map[y][x] = 'monster';
  }
}
spawnMonsters();

function spawnPowerUps(count = 12) {
  powerUps = [];
  for (let i = 0; i < count; i++) {
    let x, y, type;
    do {
      x = Math.floor(Math.random() * MAP_WIDTH);
      y = Math.floor(Math.random() * MAP_HEIGHT);
      type = Math.random() < 0.5 ? 'health' : 'sword';
    } while (map[y][x] !== 'floor');

    powerUps.push({ x, y, type });
    map[y][x] = type;
  }
}
spawnPowerUps();

function render() {
  const game = document.createElement('div');
  game.id = 'game';
  game.style.display = 'grid';
  game.style.gridTemplateColumns = `repeat(${VIEWPORT_SIZE}, 32px)`;

  const half = Math.floor(VIEWPORT_SIZE / 2);
  const startX = Math.max(0, Math.min(MAP_WIDTH - VIEWPORT_SIZE, player.x - half));
  const startY = Math.max(0, Math.min(MAP_HEIGHT - VIEWPORT_SIZE, player.y - half));

  for (let y = 0; y < VIEWPORT_SIZE; y++) {
    for (let x = 0; x < VIEWPORT_SIZE; x++) {
      const mapX = startX + x;
      const mapY = startY + y;
      const cell = document.createElement('div');
      const tile = map[mapY][mapX];

      cell.className = `cell ${tile}`;
      if (tile === 'monster') {
        const m = monsters.find(mon => mon.x === mapX && mon.y === mapY);
        cell.textContent = m.level === 2 ? icons.strongMonster : icons.monster;
      } else {
        cell.textContent = icons[tile] || '';
      }

      game.appendChild(cell);
    }
  }

  const root = document.getElementById('root');
  root.innerHTML = '';
  root.appendChild(game);

  const stats = document.createElement('div');
  stats.id = 'stats';
  stats.innerText = `🧙 Health: ${player.health}/${player.maxHealth} | Attack: ${player.attack} | 👾 Enemies: ${monsters.length}`;
  root.appendChild(stats);
}
function movePlayer(dx, dy) {
  const newX = player.x + dx;
  const newY = player.y + dy;

  if (newX < 0 || newX >= MAP_WIDTH || newY < 0 || newY >= MAP_HEIGHT) return;
  const tile = map[newY][newX];

  if (tile === 'wall') return;

  // Attack monster
  const enemy = monsters.find(m => m.x === newX && m.y === newY);
  if (enemy) {
    enemy.health -= player.attack;
    if (enemy.health <= 0) {
      // Remove monster
      monsters = monsters.filter(m => m !== enemy);
      map[newY][newX] = 'floor'; // Clear tile
    } else {
      // Monster counterattacks
      player.health -= enemy.attack;
      if (player.health <= 0) {
        alert("☠️ You died!");
        window.location.reload();
        return;
      }
      return; // Don't move into tile if monster survives
    }
  }

  // Pick up power-ups
  if (tile === 'health') {
    player.health = Math.min(player.maxHealth, player.health + 30);
    powerUps = powerUps.filter(p => !(p.x === newX && p.y === newY));
  }

  if (tile === 'sword') {
    player.attack += 10;
    powerUps = powerUps.filter(p => !(p.x === newX && p.y === newY));
  }

  map[player.y][player.x] = 'floor';
  player.x = newX;
  player.y = newY;
  map[player.y][player.x] = 'player';

  moveMonsters();
  render();
}


function moveMonsters() {
  for (let monster of monsters) {
    if (monster.health <= 0) continue;

    map[monster.y][monster.x] = 'floor';

    const distX = Math.abs(player.x - monster.x);
    const distY = Math.abs(player.y - monster.y);

    if (distX <= SIGHT_RANGE && distY <= SIGHT_RANGE) {
      const dx = player.x - monster.x;
      const dy = player.y - monster.y;
      const stepX = dx !== 0 ? dx / Math.abs(dx) : 0;
      const stepY = dy !== 0 ? dy / Math.abs(dy) : 0;

      let moved = false;
      const newX = monster.x + stepX;
      const newY = monster.y + stepY;

      if (Math.abs(dx) > Math.abs(dy) && canMove(newX, monster.y)) {
        monster.x = newX;
        moved = true;
      } else if (canMove(monster.x, newY)) {
        monster.y = newY;
        moved = true;
      }

      if (monster.x === player.x && monster.y === player.y) {
        player.health -= monster.attack;
        if (player.health <= 0) {
          alert("☠️ You were killed by a monster!");
          window.location.reload();
          return;
        }
        // Don't leave monster on player tile
        monster.x -= stepX;
        monster.y -= stepY;
      }
    }

    map[monster.y][monster.x] = 'monster';
  }
}

function canMove(x, y) {
  return (
    x >= 0 && x < MAP_WIDTH &&
    y >= 0 && y < MAP_HEIGHT &&
    (map[y][x] === 'floor' || map[y][x] === 'player')
  );
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowUp') movePlayer(0, -1);
  if (e.key === 'ArrowDown') movePlayer(0, 1);
  if (e.key === 'ArrowLeft') movePlayer(-1, 0);
  if (e.key === 'ArrowRight') movePlayer(1, 0);
});

render();

// At the bottom of game.js or wherever you define these
window.movePlayer = movePlayer;
window.attack = attack;
