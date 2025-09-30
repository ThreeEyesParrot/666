const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('scoreEl');
const healthEl = document.getElementById('healthEl');
const modalEl = document.getElementById('modalEl');
const modalScoreEl = document.getElementById('modalScoreEl');
const startGameBtn = document.getElementById('startGameBtn');

let player;
let projectiles = [];
let enemies = [];
let particles = [];
let score = 0;
let health = 100;
let animationId;
let enemySpawnInterval;

function init() {
    canvas.width = window.innerWidth * 0.8;
    canvas.height = window.innerHeight * 0.8;

    player = new Player(canvas.width / 2, canvas.height - 30);
    projectiles = [];
    enemies = [];
    particles = [];
    score = 0;
    health = 100;
    scoreEl.innerHTML = score;
    healthEl.innerHTML = health;
    modalEl.style.display = 'none';

    clearInterval(enemySpawnInterval);
    enemySpawnInterval = setInterval(spawnEnemies, 1000);
    animate();
}

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 50;
        this.height = 20;
        this.color = 'white';
    }

    draw() {
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - this.height / 2);
        ctx.lineTo(this.x - this.width / 2, this.y + this.height / 2);
        ctx.lineTo(this.x + this.width / 2, this.y + this.height / 2);
        ctx.closePath();
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}

class Projectile {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
    }

    update() {
        this.draw();
        this.x = this.x + this.velocity.x;
        this.y = this.y + this.velocity.y;
    }
}

class Enemy {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
    }

    update() {
        this.draw();
        this.x = this.x + this.velocity.x;
        this.y = this.y + this.velocity.y;
    }
}

const friction = 0.99;
class Particle {
     constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
        this.alpha = 1;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }

    update() {
        this.draw();
        this.velocity.x *= friction;
        this.velocity.y *= friction;
        this.x = this.x + this.velocity.x;
        this.y = this.y + this.velocity.y;
        this.alpha -= 0.01;
    }
}

function spawnEnemies() {
    const radius = Math.random() * (30 - 10) + 10;
    const x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius;
    const y = Math.random() * canvas.height;
    const color = `hsl(${Math.random() * 360}, 50%, 50%)`;
    
    const angle = Math.atan2(player.y - y, player.x - x);
    const velocity = {
        x: Math.cos(angle),
        y: Math.sin(angle)
    };

    enemies.push(new Enemy(x, y, radius, color, velocity));
}

function animate() {
    animationId = requestAnimationFrame(animate);
    ctx.fillStyle = 'rgba(26, 26, 26, 0.2)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    player.draw();

    particles.forEach((particle, index) => {
        if (particle.alpha <= 0) {
            particles.splice(index, 1);
        } else {
            particle.update();
        }
    });

    projectiles.forEach((projectile, index) => {
        projectile.update();

        if (projectile.x + projectile.radius < 0 ||
            projectile.x - projectile.radius > canvas.width ||
            projectile.y + projectile.radius < 0 ||
            projectile.y - projectile.radius > canvas.height) {
            setTimeout(() => {
                projectiles.splice(index, 1);
            }, 0);
        }
    });

    enemies.forEach((enemy, enemyIndex) => {
        enemy.update();

        const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);

        if (dist - enemy.radius - player.width / 2 < 1) {
            health -= 10;
            healthEl.innerHTML = health;
            if (health <= 0) {
                cancelAnimationFrame(animationId);
                clearInterval(enemySpawnInterval);
                modalScoreEl.innerHTML = score;
                modalEl.style.display = 'flex';
            }
            setTimeout(() => {
                enemies.splice(enemyIndex, 1);
            }, 0);
        }

        projectiles.forEach((projectile, projectileIndex) => {
            const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);

            if (dist - enemy.radius - projectile.radius < 1) {
                for (let i = 0; i < enemy.radius * 2; i++) {
                    particles.push(new Particle(projectile.x, projectile.y, Math.random() * 2, enemy.color, {
                        x: (Math.random() - 0.5) * (Math.random() * 6),
                        y: (Math.random() - 0.5) * (Math.random() * 6)
                    }));
                }

                if (enemy.radius - 10 > 5) {
                    score += 100;
                    gsap.to(enemy, {
                        radius: enemy.radius - 10
                    });
                    setTimeout(() => {
                        projectiles.splice(projectileIndex, 1);
                    }, 0);
                } else {
                    score += 250;
                    setTimeout(() => {
                        enemies.splice(enemyIndex, 1);
                        projectiles.splice(projectileIndex, 1);
                    }, 0);
                }
                scoreEl.innerHTML = score;
            }
        });
    });
}

window.addEventListener('mousemove', (event) => {
    if (player) {
        const rect = canvas.getBoundingClientRect();
        player.x = event.clientX - rect.left;
    }
});

window.addEventListener('click', (event) => {
    if (player) {
        const rect = canvas.getBoundingClientRect();
        const angle = Math.atan2(event.clientY - rect.top - player.y, event.clientX - rect.left - player.x);
        const velocity = {
            x: Math.cos(angle) * 5,
            y: Math.sin(angle) * 5
        };
        projectiles.push(new Projectile(player.x, player.y, 5, 'white', velocity));
    }
});

startGameBtn.addEventListener('click', () => {
    init();
});

// Initial setup for the modal
modalEl.style.display = 'flex';
modalScoreEl.innerHTML = 0;