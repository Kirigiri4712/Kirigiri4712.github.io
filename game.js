const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

function resize() {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	groundY = canvas.height - 80;
	boss.x = canvas.width - 220;
	boss.y = groundY - boss.h;
}
window.addEventListener('resize', resize);

let groundY = 0;

const ui = {
	coin: document.getElementById('coinText'),
	boss: document.getElementById('bossText'),
	unit: document.getElementById('unitText'),
};

const state = {
	coins: 0,

	hpLevel: 1,
	atkLevel: 1,
	countLevel: 1,

	bossLevel: 1,

	spawnInterval: 40,
	spawnTimer: 0,

	maxUnits: 10,

	drag: null,

	effects: [],
};

const units = [];

const boss = {
	x: 0,
	y: 0,
	w: 120,
	h: 220,

	maxHp: 300,
	hp: 300,

	atk: 20,

	cooldown: 0,
};

class Unit {
	constructor() {
		this.reset();
	}

	reset() {
		this.x = 80;
		this.y = groundY - 32;

		this.w = 16;
		this.h = 32;

		this.maxHp = 40 + (state.hpLevel - 1) * 20;
		this.hp = this.maxHp;

		this.atk = 5 + (state.atkLevel - 1) * 3;

		this.speed = 1.2 + Math.random() * 0.6;

		this.dead = false;

		this.dragging = false;
	}

	update() {
		if (this.dragging) return;

		if (this.dead) {
			this.reset();
			return;
		}

		const reach = boss.x - this.x;

		if (reach > 28) {
			this.x += this.speed;
		} else {
			boss.hp -= this.atk * 0.15;

			addEffect(boss.x + Math.random() * 40, boss.y + 80 + Math.random() * 50, 12);
		}
	}

	draw() {
		ctx.save();

		ctx.translate(this.x, this.y);

		ctx.strokeStyle = '#000';
		ctx.lineWidth = 2;

		ctx.beginPath();

		ctx.arc(0, -18, 6, 0, Math.PI * 2);

		ctx.stroke();

		ctx.beginPath();

		ctx.moveTo(0, -12);
		ctx.lineTo(0, 6);

		ctx.moveTo(-8, -2);
		ctx.lineTo(8, -2);

		ctx.moveTo(0, 6);
		ctx.lineTo(-6, 18);

		ctx.moveTo(0, 6);
		ctx.lineTo(6, 18);

		ctx.stroke();

		ctx.restore();
	}

	damage(d) {
		this.hp -= d;

		if (this.hp <= 0) {
			this.dead = true;
		}
	}
}

function spawnUnit() {
	if (units.length >= state.maxUnits) return;

	units.push(new Unit());
}

function addEffect(x, y, size) {
	state.effects.push({
		x,
		y,
		size,
		life: 20,
	});
}

function updateEffects() {
	for (let i = state.effects.length - 1; i >= 0; i--) {
		const e = state.effects[i];

		e.life--;

		e.size *= 0.96;

		if (e.life <= 0) {
			state.effects.splice(i, 1);
		}
	}
}

function drawEffects() {
	ctx.fillStyle = 'orange';

	for (const e of state.effects) {
		ctx.beginPath();

		ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);

		ctx.fill();
	}
}

resize();

function updateBoss() {
	boss.cooldown--;

	if (boss.cooldown <= 0) {
		boss.cooldown = 120;

		for (const u of units) {
			if (u.dead) continue;

			const dx = Math.abs(u.x + u.w / 2 - (boss.x + boss.w / 2));

			if (dx < 170) {
				u.damage(boss.atk);

				addEffect(u.x, u.y, 18);
			}
		}
	}

	if (boss.hp <= 0) {
		state.coins += 50 * state.bossLevel;

		state.bossLevel++;

		boss.maxHp = Math.floor(boss.maxHp * 1.35);

		boss.hp = boss.maxHp;

		boss.atk = Math.floor(boss.atk * 1.15);

		addEffect(boss.x + boss.w / 2, boss.y + boss.h / 2, 60);
	}
}

function updateGame() {
	state.spawnTimer++;

	if (state.spawnTimer >= state.spawnInterval) {
		state.spawnTimer = 0;

		spawnUnit();
	}

	for (const u of units) {
		u.update();
	}

	updateBoss();

	updateEffects();
}

function drawGround() {
	ctx.fillStyle = '#5a9b41';

	ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);
}

function drawBoss() {
	ctx.fillStyle = '#444';

	ctx.fillRect(boss.x, boss.y, boss.w, boss.h);

	ctx.fillStyle = '#fff';

	ctx.fillRect(boss.x + 20, boss.y + 35, 16, 16);

	ctx.fillRect(boss.x + 84, boss.y + 35, 16, 16);

	ctx.fillStyle = 'red';

	ctx.fillRect(boss.x, boss.y - 18, boss.w, 8);

	ctx.fillStyle = 'lime';

	ctx.fillRect(boss.x, boss.y - 18, boss.w * (boss.hp / boss.maxHp), 8);
}

function drawUnits() {
	for (const u of units) {
		u.draw();
	}
}

function drawBackground() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	drawGround();

	drawBoss();

	drawUnits();

	drawEffects();
}

function updateUI() {
	ui.coin.textContent = 'Coin : ' + state.coins;

	ui.boss.textContent = 'Boss Lv : ' + state.bossLevel + '  HP : ' + Math.ceil(boss.hp) + '/' + boss.maxHp;

	ui.unit.textContent = '人数 ' + units.length + '/' + state.maxUnits;
}

function loop() {
	updateGame();

	drawBackground();

	updateUI();

	requestAnimationFrame(loop);
}

loop();

canvas.addEventListener('mousedown', (e) => {
	const rect = canvas.getBoundingClientRect();

	const mx = e.clientX - rect.left;
	const my = e.clientY - rect.top;

	for (let i = units.length - 1; i >= 0; i--) {
		const u = units[i];

		if (u.dead) continue;

		if (mx >= u.x - 12 && mx <= u.x + 12 && my >= u.y - 28 && my <= u.y + 24) {
			state.drag = u;
			u.dragging = true;
			break;
		}
	}
});

canvas.addEventListener('mousemove', (e) => {
	if (!state.drag) return;

	const rect = canvas.getBoundingClientRect();

	state.drag.x = e.clientX - rect.left;
	state.drag.y = e.clientY - rect.top;
});

function releaseDrag() {
	if (!state.drag) return;

	const u = state.drag;

	u.dragging = false;

	u.speed = 8;

	state.drag = null;
}

canvas.addEventListener('mouseup', releaseDrag);
canvas.addEventListener('mouseleave', releaseDrag);

document.getElementById('hpBtn').onclick = () => {
	const cost = 30 * state.hpLevel;

	if (state.coins < cost) return;

	state.coins -= cost;

	state.hpLevel++;

	for (const u of units) {
		u.maxHp = 40 + (state.hpLevel - 1) * 20;
		u.hp = u.maxHp;
	}
};

document.getElementById('atkBtn').onclick = () => {
	const cost = 30 * state.atkLevel;

	if (state.coins < cost) return;

	state.coins -= cost;

	state.atkLevel++;

	for (const u of units) {
		u.atk = 5 + (state.atkLevel - 1) * 3;
	}
};

document.getElementById('countBtn').onclick = () => {
	const cost = 50 * state.countLevel;

	if (state.coins < cost) return;

	state.coins -= cost;

	state.countLevel++;

	state.maxUnits += 5;
};

for (let i = 0; i < state.maxUnits; i++) {
	spawnUnit();
}

function clamp(v, min, max) {
	return Math.max(min, Math.min(max, v));
}

setInterval(() => {
	for (const u of units) {
		if (u.dragging) continue;

		if (u.dead) continue;

		u.speed = clamp(u.speed, 1.2, 8);

		if (u.speed > 1.2) {
			u.speed *= 0.96;
		}

		u.y = groundY - 32;
	}
}, 16);

document.addEventListener('contextmenu', (e) => {
	e.preventDefault();
});

window.addEventListener('blur', () => {
	releaseDrag();
});

canvas.addEventListener(
	'touchstart',
	(e) => {
		e.preventDefault();

		const t = e.touches[0];

		const rect = canvas.getBoundingClientRect();

		const mx = t.clientX - rect.left;
		const my = t.clientY - rect.top;

		for (let i = units.length - 1; i >= 0; i--) {
			const u = units[i];

			if (mx >= u.x - 12 && mx <= u.x + 12 && my >= u.y - 28 && my <= u.y + 24) {
				state.drag = u;
				u.dragging = true;
				break;
			}
		}
	},
	{ passive: false }
);

canvas.addEventListener(
	'touchmove',
	(e) => {
		e.preventDefault();

		if (!state.drag) return;

		const t = e.touches[0];

		const rect = canvas.getBoundingClientRect();

		state.drag.x = t.clientX - rect.left;
		state.drag.y = t.clientY - rect.top;
	},
	{ passive: false }
);

canvas.addEventListener('touchend', releaseDrag);

resize();
loop();

function initGame() {
	state.coins = 0;

	state.hpLevel = 1;
	state.atkLevel = 1;
	state.countLevel = 1;

	state.bossLevel = 1;

	state.maxUnits = 10;

	state.spawnTimer = 0;

	units.length = 0;
	state.effects.length = 0;

	boss.maxHp = 300;
	boss.hp = 300;
	boss.atk = 20;
	boss.cooldown = 120;

	for (let i = 0; i < state.maxUnits; i++) {
		spawnUnit();
	}
}

initGame();

if (typeof window !== 'undefined') {
	window.gameState = state;
	window.units = units;
	window.boss = boss;
}

console.log('Stick Army Mini Ready');
