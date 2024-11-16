// Postavljanje canvasa i konteksta
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Postavljanje velicine Canvasa na velicinu prozora preglednika
canvas.width = window.innerWidth - 4; // Zbog bordera
canvas.height = window.innerHeight - 4; // Također zbog bordera

// Tezina igre - sirina palice
// Mijenjat ce se pritiskom na tipke B(easy) N(normal) M(hard)
const DIFFICULTY = {
  EASY: 300,
  NORMAL: 150,
  HARD: 75,
};

// Varijable za palicu
const paddle = {
  height: 20,
  width: DIFFICULTY.NORMAL,
  x: (canvas.width - DIFFICULTY.NORMAL) / 2,
  y: canvas.height - 20,
  speed: 15,
  color: { h: 0, s: 100, l: 50 }, // Crvena boja u HSL formatu kao objekt
};

// Varijable loptice
const ball = {
  x: canvas.width / 2,
  y: canvas.height - 30,
  radius: 12,
  speed: 4,
  jumpX: 4 * (Math.random() * 2 - 1),
  jumpY: -8,
  color: "green",
  maxSpeed: 16, // Maksimalna brzina loptice
};

// Varijable cigli
const brick = {
  rowCount: 5,
  columnCount: 6,
  width: 0, // Izracunat cemo dinamicki
  height: 35,
  padding: 1,
  offsetTop: 30,
  offsetLeft: 0,
};

// Izracunavanje sirine cigli kako bismo prekrili cijeli ekran
brick.width =
  (canvas.width - brick.padding * (brick.columnCount - 1)) / brick.columnCount;

// Inicijalizacija cigli
let bricks = [];
for (let c = 0; c < brick.columnCount; c++) {
  bricks[c] = [];
  for (let r = 0; r < brick.rowCount; r++) {
    bricks[c][r] = { x: 0, y: 0, status: 1 };
  }
}

// Varijable za bodove
let score = 0;
let maxScore = localStorage.getItem("maximum-score") || 0;

// Varijable za kontrolu palice
let rightPressed = false;
let leftPressed = false;
// Varijabla za kontrolu ponašanja unutar testing mode-a
let testingMode = false;
// Varijabla za praćenje stanja Shift tipke
let shiftPressed = false;

const keyDownHandler = (e) => {
  // Pomak palice
  if (e.key === "Right" || e.key === "ArrowRight") {
    rightPressed = true;
  } else if (e.key === "Left" || e.key === "ArrowLeft") {
    leftPressed = true;
  }

  // Ubrzanje loptice
  if (
    e.key === " " &&
    Math.abs(ball.jumpX) < ball.maxSpeed &&
    Math.abs(ball.jumpY) < ball.maxSpeed
  ) {
    ball.jumpX *= 2;
    ball.jumpY *= 2;
  }

  // Pokretanje testing moda
  if (e.key === "t" || e.key === "T") {
    paddle.width = canvas.width; // Palica preko cijelog ekrana
    paddle.x = 0;
    ball.jumpX *= 2;
    ball.jumpY *= 2;
    testingMode = true;
  }

  // Dodavanje funkcionalnosti promjene tezine igre - zelimo sprijeciti u slucaju da je ukljucen testing mode
  if ((e.key === "B" || e.key === "b") && !testingMode) {
    paddle.width = DIFFICULTY.EASY;
  }
  if ((e.key === "N" || e.key === "n") && !testingMode) {
    paddle.width = DIFFICULTY.NORMAL;
  }
  if ((e.key === "M" || e.key === "m") && !testingMode) {
    paddle.width = DIFFICULTY.HARD;
  }

  // Ubrzanje palice kad se drži tipka Shift
  if (e.key === "Shift" && !shiftPressed) {
    shiftPressed = true;
    paddle.speed += 15;
  }
};

const keyUpHandler = (e) => {
  // Pomak palice
  if (e.key === "Right" || e.key === "ArrowRight") {
    rightPressed = false;
  } else if (e.key === "Left" || e.key === "ArrowLeft") {
    leftPressed = false;
  }

  // Usporavanje loptice
  if (
    e.key === " " &&
    Math.abs(ball.jumpX) > ball.speed &&
    Math.abs(ball.jumpY) > ball.speed
  ) {
    ball.jumpX /= 2;
    ball.jumpY /= 2;
  }

  // Uspori palicu kad pustis Shift
  if (e.key === "Shift") {
    shiftPressed = false;
    paddle.speed -= 15;
  }
};

// Slusatelji dogadaja za tipke
document.addEventListener("keyup", keyUpHandler);
document.addEventListener("keydown", keyDownHandler);

// Funkcija za prilagodavanje svjetline HSL boje
const adjustColorBrightness = (color, percent) => {
  let l = color.l + percent;
  if (l > 100) l = 100;
  if (l < 0) l = 0;

  // Vracamo HSL string s novom svjetlinom
  return `hsl(${color.h}, ${color.s}%, ${l}%)`;
};

// Funkcija za generiranje boje cigle na temelju broja reda
const getBrickColor = (row) => {
  const lightnessValues = [20, 35, 50, 65, 80];
  return { h: 240, s: 100, l: lightnessValues[row] };
};

// Funkcija za crtanje palice s efektom sjencanja
const drawPaddle = () => {
  // Konvertiranje boje u HSL string
  const baseColor = `hsl(${paddle.color.h}, ${paddle.color.s}%, ${paddle.color.l}%)`;

  // Crtanje osnovne palice
  ctx.fillStyle = baseColor;
  ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);

  // Gornji rub - svjetlija nijansa
  ctx.fillStyle = adjustColorBrightness(paddle.color, 20);
  ctx.fillRect(paddle.x, paddle.y, paddle.width, 3);

  // Donji rub - tamnija nijansa
  ctx.fillStyle = adjustColorBrightness(paddle.color, -20);
  ctx.fillRect(paddle.x, paddle.y + paddle.height - 3, paddle.width, 3);
};

// Funkcija za crtanje loptice
const drawBall = () => {
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);

  // Popunjavanje loptice
  ctx.fillStyle = ball.color;
  ctx.fill();

  ctx.closePath();
};

// Funkcija za crtanje cigli s efektom sjencanja
const drawBricks = () => {
  for (let r = 0; r < brick.rowCount; r++) {
    for (let c = 0; c < brick.columnCount; c++) {
      if (bricks[c][r].status) {
        let brickX = c * (brick.width + brick.padding) + brick.offsetLeft;
        let brickY = r * (brick.height + brick.padding) + brick.offsetTop;
        bricks[c][r].x = brickX;
        bricks[c][r].y = brickY;

        // Osnovna boja cigle kao objekt
        let baseColor = getBrickColor(r);
        const baseColorStr = `hsl(${baseColor.h}, ${baseColor.s}%, ${baseColor.l}%)`;

        // Crtanje osnovne cigle
        ctx.fillStyle = baseColorStr;
        ctx.fillRect(brickX, brickY, brick.width, brick.height);

        // Gornji rub - svjetlija nijansa
        ctx.fillStyle = adjustColorBrightness(baseColor, 20);
        ctx.fillRect(brickX, brickY, brick.width, 3);

        // Donji rub - tamnija nijansa
        ctx.fillStyle = adjustColorBrightness(baseColor, -20);
        ctx.fillRect(brickX, brickY + brick.height - 3, brick.width, 3);
      }
    }
  }
};

// Funkcija za crtanje bodova
const drawScore = () => {
  ctx.font = "20px Arial";
  ctx.fillStyle = "white";
  ctx.textAlign = "right";
  ctx.fillText("Score: " + score, canvas.width - 10, 20);
  ctx.fillText("Max Score: " + maxScore, canvas.width - 10, 40);
};

// Funkcija za prikaz poruke u testing modu
const drawTestingModeMessage = () => {
  ctx.font = "30px Arial";
  ctx.fillStyle = "white";
  ctx.textAlign = "right";
  ctx.fillText("Testing mode activated", canvas.width - 10, canvas.height - 10);
};

// Funkcija koja prikazuje upute o kontrolama
const drawTutorial = () => {
  ctx.font = "15px Arial";
  ctx.fillStyle = "white";
  ctx.textAlign = "left";
  ctx.fillText(
    "(<-) LEFT   |   (->) RIGHT   |   (T) TESTING MODE   |   (SPACEBAR) BALL SPEED   |   (SHIFT) PADDLE SPEED   |   (B, N, M) DIFFICULTY",
    20,
    20
  );
};

let gameOver = false;

// Funkcija za detekciju kolizije
const collisionDetection = (prevX, prevY) => {
  for (let r = 0; r < brick.rowCount; r++) {
    for (let c = 0; c < brick.columnCount; c++) {
      let b = bricks[c][r];
      if (b.status) {
        // Provjera sudara
        if (
          ball.x + ball.radius > b.x &&
          ball.x - ball.radius < b.x + brick.width &&
          ball.y + ball.radius > b.y &&
          ball.y - ball.radius < b.y + brick.height
        ) {
          // Odredi s koje strane je došlo do sudara koristeci prethodnu poziciju
          let collidedFromLeft = prevX + ball.radius <= b.x;
          let collidedFromRight = prevX - ball.radius >= b.x + brick.width;
          let collidedFromTop = prevY + ball.radius <= b.y;
          let collidedFromBottom = prevY - ball.radius >= b.y + brick.height;

          if (collidedFromLeft) {
            // Sudar s lijeve strane
            ball.x = b.x - ball.radius;
            ball.jumpX = -ball.jumpX;
          } else if (collidedFromRight) {
            // Sudar s desne strane
            ball.x = b.x + brick.width + ball.radius;
            ball.jumpX = -ball.jumpX;
          } else if (collidedFromTop) {
            // Sudar odozgo
            ball.y = b.y - ball.radius;
            ball.jumpY = -ball.jumpY;
          } else if (collidedFromBottom) {
            // Sudar odozdo
            ball.y = b.y + brick.height + ball.radius;
            ball.jumpY = -ball.jumpY;
          } else {
            // Ako ne mozemo odrediti stranu, promijenimo oba smjera
            ball.jumpX = -ball.jumpX;
            ball.jumpY = -ball.jumpY;
          }

          b.status = 0;
          score += 1;
          if (score > maxScore) {
            maxScore = score;
            localStorage.setItem("maximum-score", maxScore);
          }
          if (score === brick.rowCount * brick.columnCount) {
            drawWinMessage();
            gameOver = true;
          }

          return true; // Sudar se dogodio
        }
      }
    }
  }
  return false; // Nije bilo sudara
};

// Funkcija za update pozicija
const update = () => {
  // Pomicanje palice
  if (leftPressed && paddle.x > 0) {
    paddle.x -= paddle.speed;
  } else if (rightPressed && paddle.x < canvas.width - paddle.width) {
    paddle.x += paddle.speed;
  }

  // Ograničavanje brzine loptice
  let speed = Math.sqrt(ball.jumpX * ball.jumpX + ball.jumpY * ball.jumpY);
  if (speed > ball.maxSpeed) {
    let scale = ball.maxSpeed / speed;
    ball.jumpX *= scale;
    ball.jumpY *= scale;
  }

  // Podjela kretanja loptice na manje korake
  let steps = Math.ceil(speed / 5);
  let stepX = ball.jumpX / steps;
  let stepY = ball.jumpY / steps;

  let collisionHappened = false;

  for (let i = 0; i < steps; i++) {
    // Sacuvaj prethodnu poziciju loptice
    let prevX = ball.x;
    let prevY = ball.y;

    // Pomicanje loptice po malom koraku
    ball.x += stepX;
    ball.y += stepY;

    // Detekcija kolizije loptice sa zidovima
    if (ball.x - ball.radius < 0) {
      ball.x = ball.radius;
      ball.jumpX = -ball.jumpX;
      stepX = -stepX; // Azuriraj stepX nakon promjene smjera
    } else if (ball.x + ball.radius > canvas.width) {
      ball.x = canvas.width - ball.radius;
      ball.jumpX = -ball.jumpX;
      stepX = -stepX;
    }

    if (ball.y - ball.radius < 0) {
      ball.y = ball.radius;
      ball.jumpY = -ball.jumpY;
      stepY = -stepY; // Azuriraj stepY nakon promjene smjera
    } else if (ball.y + ball.radius > canvas.height) {
      // Sudar s donjim rubom ekrana
      if (ball.x > paddle.x && ball.x < paddle.x + paddle.width) {
        // Izrazunaj relativnu poziciju udarca na palici (-1 do 1)
        let relativeHitPosition = (ball.x - paddle.x) / paddle.width - 0.5;
        relativeHitPosition *= 2;

        // Postavi maksimalnu horizontalnu brzinu
        let maxHorizontalSpeed = ball.maxSpeed;

        // Azuriraj horizontalnu brzinu loptice na temelju pozicije udarca
        ball.jumpX = relativeHitPosition * maxHorizontalSpeed;
        stepX = ball.jumpX / steps;

        // Odrzavaj konstantnu vertikalnu brzinu prema gore
        ball.jumpY = -Math.abs(ball.jumpY);
        stepY = ball.jumpY / steps;
        ball.y = canvas.height - paddle.height - ball.radius; // Postavi lopticu iznad palice
      } else {
        drawGameOverMessage();
        gameOver = true;
        break;
      }
    }

    // Detekcija sudara sa ciglama unutar svakog koraka
    collisionHappened = collisionDetection(prevX, prevY);

    if (collisionHappened || gameOver) {
      // Ako je došlo do sudara, prekinemo daljnje pomake u ovom frame-u
      break;
    }
  }
};

// Funkcija za crtanje
const draw = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBricks();
  drawBall();
  drawPaddle();
  drawScore();
  drawTutorial();
  if (testingMode) drawTestingModeMessage();
};

// Funkcija za prikaz poruke o pobjedi
const drawWinMessage = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = "50px Arial";
  ctx.textAlign = "center";
  ctx.fillStyle = "white";
  ctx.fillText(
    "Čestitamo, pobijedili ste!",
    canvas.width / 2,
    canvas.height / 2
  );
};

// Funkcija za prikaz poruke o gubitku
const drawGameOverMessage = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = "50px Arial";
  ctx.textAlign = "center";
  ctx.fillStyle = "white";
  ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
};

// Funkcija glavne petlje
const loop = () => {
  if (!gameOver) {
    draw();
    update();
    // Konstantno crtaj novi frame
    requestAnimationFrame(loop);
  }
};

// Pokretanje igre
loop();
