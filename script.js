let gameState = {
  hunterHealth: 100,
  duckHealth: 100,
  score: 0,
  gameActive: true,
  bullets: [],
  duckProjectiles: [],
  duckPosition: { x: 200, y: 100 },
  duckDirection: { x: 2, y: 1 },
  soundEnabled: true
};

// DOM Elements
const gameContainer = document.getElementById("gameContainer");
const hunter = document.getElementById("hunter");
const duck = document.getElementById("duck");
const gameOver = document.getElementById("gameOver");

// Audio Elements
const bulletSound = document.getElementById("bulletSound");
const duckShotSound = document.getElementById("duckShotSound");
const explosionSound = document.getElementById("explosionSound");
const muteBtn = document.getElementById("muteBtn");

// Initialize duck position
duck.style.left = gameState.duckPosition.x + "px";
duck.style.top = gameState.duckPosition.y + "px";

// Sound control
muteBtn.addEventListener("click", () => {
  gameState.soundEnabled = !gameState.soundEnabled;
  muteBtn.textContent = gameState.soundEnabled ? "🔊 Sound On" : "🔇 Sound Off";
});

// Play sound with error handling
function playSound(audioElement, volume = 1.0) {
  if (!gameState.soundEnabled) return;
  
  try {
    // Reset audio to start
    audioElement.currentTime = 0;
    audioElement.volume = volume;
    
    // Play with promise handling
    const playPromise = audioElement.play();
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        // Autoplay might be blocked, ignore silently
        console.log("Audio play failed:", error);
      });
    }
  } catch (error) {
    console.log("Sound error:", error);
  }
}

// Hunter shooting
gameContainer.addEventListener("click", (e) => {
  if (!gameState.gameActive) return;

  const hunterRect = hunter.getBoundingClientRect();
  const containerRect = gameContainer.getBoundingClientRect();

  const startX = hunterRect.left + hunterRect.width / 2 - containerRect.left;
  const startY = hunterRect.top - containerRect.top;
  const targetX = e.clientX - containerRect.left;
  const targetY = e.clientY - containerRect.top;

  shootBullet(startX, startY, targetX, targetY);
});

function shootBullet(startX, startY, targetX, targetY) {
  // Play bullet sound
  playSound(bulletSound, 0.3);
  
  const bullet = document.createElement("div");
  bullet.className = "bullet";
  bullet.style.left = startX + "px";
  bullet.style.top = startY + "px";
  gameContainer.appendChild(bullet);

  const angle = Math.atan2(targetY - startY, targetX - startX);
  const speed = 8;
  const velocityX = Math.cos(angle) * speed;
  const velocityY = Math.sin(angle) * speed;

  gameState.bullets.push({
    element: bullet,
    x: startX,
    y: startY,
    vx: velocityX,
    vy: velocityY,
  });
}

function duckShoot() {
  if (!gameState.gameActive) return;

  // Play duck shot sound
  playSound(duckShotSound, 0.4);

  const duckRect = duck.getBoundingClientRect();
  const hunterRect = hunter.getBoundingClientRect();
  const containerRect = gameContainer.getBoundingClientRect();

  const startX = duckRect.left + duckRect.width / 2 - containerRect.left;
  const startY = duckRect.top + duckRect.height / 2 - containerRect.top;
  const targetX = hunterRect.left + hunterRect.width / 2 - containerRect.left;
  const targetY = hunterRect.top + hunterRect.height / 2 - containerRect.top;

  const projectile = document.createElement("div");
  projectile.className = "duck-projectile";
  projectile.style.left = startX + "px";
  projectile.style.top = startY + "px";
  gameContainer.appendChild(projectile);

  const angle = Math.atan2(targetY - startY, targetX - startX);
  const speed = 4;
  const velocityX = Math.cos(angle) * speed;
  const velocityY = Math.sin(angle) * speed;

  gameState.duckProjectiles.push({
    element: projectile,
    x: startX,
    y: startY,
    vx: velocityX,
    vy: velocityY,
  });
}

function updateDuck() {
  if (!gameState.gameActive) return;

  // Move duck
  gameState.duckPosition.x += gameState.duckDirection.x;
  gameState.duckPosition.y += gameState.duckDirection.y;

  // Bounce off walls
  if (
    gameState.duckPosition.x <= 0 ||
    gameState.duckPosition.x >= window.innerWidth - 60
  ) {
    gameState.duckDirection.x *= -1;
  }
  if (
    gameState.duckPosition.y <= 0 ||
    gameState.duckPosition.y >= window.innerHeight - 200
  ) {
    gameState.duckDirection.y *= -1;
  }

  // Keep duck in bounds
  gameState.duckPosition.x = Math.max(
    0,
    Math.min(window.innerWidth - 60, gameState.duckPosition.x)
  );
  gameState.duckPosition.y = Math.max(
    0,
    Math.min(window.innerHeight - 200, gameState.duckPosition.y)
  );

  duck.style.left = gameState.duckPosition.x + "px";
  duck.style.top = gameState.duckPosition.y + "px";
}

function updateProjectiles() {
  // Update bullets
  gameState.bullets.forEach((bullet, index) => {
    bullet.x += bullet.vx;
    bullet.y += bullet.vy;
    bullet.element.style.left = bullet.x + "px";
    bullet.element.style.top = bullet.y + "px";

    // Check collision with duck
    const duckRect = duck.getBoundingClientRect();
    const bulletRect = bullet.element.getBoundingClientRect();

    if (
      bulletRect.left < duckRect.right &&
      bulletRect.right > duckRect.left &&
      bulletRect.top < duckRect.bottom &&
      bulletRect.bottom > duckRect.top
    ) {
      // Hit duck
      gameState.duckHealth -= 25;
      gameState.score += 10;
      updateHUD();
      createExplosion(bullet.x, bullet.y);

      // Play explosion sound
      playSound(explosionSound, 0.5);

      bullet.element.remove();
      gameState.bullets.splice(index, 1);

      if (gameState.duckHealth <= 0) {
        endGame("Hunter Wins!");
      }
      return;
    }

    // Remove if out of bounds
    if (
      bullet.x < 0 ||
      bullet.x > window.innerWidth ||
      bullet.y < 0 ||
      bullet.y > window.innerHeight
    ) {
      bullet.element.remove();
      gameState.bullets.splice(index, 1);
    }
  });

  // Update duck projectiles
  gameState.duckProjectiles.forEach((projectile, index) => {
    projectile.x += projectile.vx;
    projectile.y += projectile.vy;
    projectile.element.style.left = projectile.x + "px";
    projectile.element.style.top = projectile.y + "px";

    // Check collision with hunter
    const hunterRect = hunter.getBoundingClientRect();
    const projectileRect = projectile.element.getBoundingClientRect();
    const containerRect = gameContainer.getBoundingClientRect();

    if (
      projectileRect.left < hunterRect.right &&
      projectileRect.right > hunterRect.left &&
      projectileRect.top < hunterRect.bottom &&
      projectileRect.bottom > hunterRect.top
    ) {
      // Hit hunter
      gameState.hunterHealth -= 20;
      updateHUD();
      createExplosion(projectile.x, projectile.y);

      // Play explosion sound
      playSound(explosionSound, 0.5);

      projectile.element.remove();
      gameState.duckProjectiles.splice(index, 1);

      if (gameState.hunterHealth <= 0) {
        endGame("Duck Wins!");
      }
      return;
    }

    // Remove if out of bounds
    if (
      projectile.x < 0 ||
      projectile.x > window.innerWidth ||
      projectile.y < 0 ||
      projectile.y > window.innerHeight
    ) {
      projectile.element.remove();
      gameState.duckProjectiles.splice(index, 1);
    }
  });
}

function createExplosion(x, y) {
  const explosion = document.createElement("div");
  explosion.className = "explosion";
  explosion.style.left = x - 30 + "px";
  explosion.style.top = y - 30 + "px";
  gameContainer.appendChild(explosion);

  setTimeout(() => {
    explosion.remove();
  }, 500);
}

function updateHUD() {
  document.getElementById("hunterHealth").textContent = Math.max(
    0,
    gameState.hunterHealth
  );
  document.getElementById("duckHealth").textContent = Math.max(
    0,
    gameState.duckHealth
  );
  document.getElementById("score").textContent = gameState.score;
}

function endGame(message) {
  gameState.gameActive = false;
  document.getElementById("gameOverText").textContent = message;
  gameOver.style.display = "block";
  
  // Stop all sounds when game ends
  bulletSound.pause();
  bulletSound.currentTime = 0;
  duckShotSound.pause();
  duckShotSound.currentTime = 0;
  explosionSound.pause();
  explosionSound.currentTime = 0;
}

function restartGame() {
  gameState = {
    hunterHealth: 100,
    duckHealth: 100,
    score: 0,
    gameActive: true,
    bullets: [],
    duckProjectiles: [],
    duckPosition: { x: 200, y: 100 },
    duckDirection: { x: 2, y: 1 },
    soundEnabled: gameState.soundEnabled // Preserve sound setting
  };

  // Clear all projectiles
  document
    .querySelectorAll(".bullet, .duck-projectile, .explosion")
    .forEach((el) => el.remove());

  // Reset positions
  duck.style.left = gameState.duckPosition.x + "px";
  duck.style.top = gameState.duckPosition.y + "px";

  gameOver.style.display = "none";
  updateHUD();
}

// Game loop
function gameLoop() {
  if (gameState.gameActive) {
    updateDuck();
    updateProjectiles();
    gameState.score += 1; // Survival bonus
    updateHUD();
  }
  requestAnimationFrame(gameLoop);
}

// Duck shoots periodically
setInterval(() => {
  if (gameState.gameActive && Math.random() < 0.3) {
    duckShoot();
  }
}, 1500);

// Initialize game
updateHUD();
gameLoop();

// Handle window resize
window.addEventListener('resize', () => {
  // Keep duck in bounds after resize
  gameState.duckPosition.x = Math.max(
    0,
    Math.min(window.innerWidth - 60, gameState.duckPosition.x)
  );
  gameState.duckPosition.y = Math.max(
    0,
    Math.min(window.innerHeight - 200, gameState.duckPosition.y)
  );
  
  duck.style.left = gameState.duckPosition.x + "px";
  duck.style.top = gameState.duckPosition.y + "px";
});