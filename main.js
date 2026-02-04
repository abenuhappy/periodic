import './src/style/main.css';
import { GameEngine } from './src/game/GameEngine.js';
import elementsData from './src/data/elements.json';

class GameUI {
    constructor() {
        this.engine = new GameEngine(elementsData);
        this.initElements();
        this.initEvents();
        this.timerInterval = null;
    }

    initElements() {
        this.levelVal = document.getElementById('level-val');
        this.scoreVal = document.getElementById('score-val');
        this.streakVal = document.getElementById('streak-val');
        this.bonusVal = document.getElementById('bonus-val');
        this.timerVal = document.getElementById('timer-val');
        this.elementName = document.getElementById('element-name');
        this.cardsContainer = document.getElementById('cards-container');

        this.startScreen = document.getElementById('start-screen');
        this.gameOverScreen = document.getElementById('game-over-screen');
        this.clearedScreen = document.getElementById('cleared-screen');
        this.pauseScreen = document.getElementById('pause-screen');

        this.finalScore = document.getElementById('final-score');
        this.finalLevel = document.getElementById('final-level');
        this.clearedScore = document.getElementById('cleared-score');
        this.reviewList = document.getElementById('review-list');
    }

    initEvents() {
        document.getElementById('start-easy').addEventListener('click', () => this.startGame(1));
        document.getElementById('start-mid').addEventListener('click', () => this.startGame(4));
        document.getElementById('start-hard').addEventListener('click', () => this.startGame(8));

        document.getElementById('restart-btn').addEventListener('click', () => this.showStartScreen());
        document.getElementById('cleared-restart-btn').addEventListener('click', () => this.showStartScreen());
        document.getElementById('resume-btn').addEventListener('click', () => this.resumeGame());

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.togglePause();
            }
        });
    }

    showStartScreen() {
        this.gameOverScreen.classList.remove('visible');
        this.clearedScreen.classList.remove('visible');
        this.startScreen.classList.add('visible');
    }

    startGame(startLevel = 1) {
        this.startScreen.classList.remove('visible');
        this.gameOverScreen.classList.remove('visible');
        this.clearedScreen.classList.remove('visible');
        this.engine.reset(startLevel);
        this.nextLevel();
    }

    restartGame() {
        this.startGame();
    }

    togglePause() {
        if (this.engine.gameState === 'PLAYING') {
            this.engine.gameState = 'PAUSED';
            this.pauseScreen.classList.add('visible');
            clearInterval(this.timerInterval);
        } else if (this.engine.gameState === 'PAUSED') {
            this.resumeGame();
        }
    }

    resumeGame() {
        this.engine.gameState = 'PLAYING';
        this.pauseScreen.classList.remove('visible');
        this.startTimer();
    }

    nextLevel() {
        this.engine.startLevel();
        this.updateHUD();
        this.renderCards();
        this.startTimer();

        // Visual effect for path movement
        const path = document.querySelector('.path');
        path.style.transition = 'none';
        path.style.backgroundPosition = '0 0';
        setTimeout(() => {
            path.style.transition = 'background-position 0.5s linear';
            path.style.backgroundPosition = '0 100px';
        }, 10);
    }

    updateHUD() {
        this.levelVal.textContent = this.engine.level;
        this.scoreVal.textContent = this.engine.score;
        this.streakVal.textContent = this.engine.streak;
        this.bonusVal.textContent = this.engine.bonusPasses;
        this.timerVal.textContent = this.engine.timeLeft;
        this.elementName.textContent = this.engine.currentQuestion.name;
    }

    renderCards() {
        this.cardsContainer.innerHTML = '';
        this.engine.options.forEach((el, index) => {
            const card = document.createElement('div');
            card.className = 'card';
            card.style.animationDelay = `${index * 0.1}s`;
            card.innerHTML = `
                <span class="card-number">${el.atomicNumber}</span>
                <span class="card-symbol">${el.symbol}</span>
            `;
            card.addEventListener('click', () => this.handleCardClick(el.symbol, card));
            this.cardsContainer.appendChild(card);
        });
    }

    handleCardClick(symbol, cardElement) {
        if (this.engine.gameState !== 'PLAYING') return;

        const isCorrect = this.engine.submitAnswer(symbol);

        if (isCorrect) {
            cardElement.classList.add('correct');
            clearInterval(this.timerInterval);

            if (this.engine.gameState === 'CLEARED') {
                setTimeout(() => this.showMissionCleared(), 800);
            } else {
                setTimeout(() => this.nextLevel(), 800);
            }
        } else {
            // Check if a bonus pass was used (engine still in PLAYING or moved to next level level)
            // Actually, my engine.submitAnswer calls handleCorrect or handleIncorrect.
            // If handleIncorrect used a bonus, it returns true and increments level.
            // Wait, my current submitAnswer returns isCorrect.

            if (this.engine.gameState === 'PLAYING' || this.engine.gameState === 'READY') {
                // This means a bonus pass was used and the game continues
                cardElement.classList.add('wrong');
                setTimeout(() => {
                    cardElement.classList.remove('wrong');
                    this.nextLevel();
                }, 800);
            } else {
                cardElement.classList.add('wrong');
                clearInterval(this.timerInterval);
                setTimeout(() => this.showGameOver(), 800);
            }
        }
    }

    startTimer() {
        clearInterval(this.timerInterval);
        this.engine.timeLeft = this.engine.timeLimit;
        this.timerVal.textContent = this.engine.timeLeft;

        this.timerInterval = setInterval(() => {
            this.engine.timeLeft--;
            this.timerVal.textContent = this.engine.timeLeft;

            if (this.engine.timeLeft <= 0) {
                clearInterval(this.timerInterval);
                this.showGameOver();
            }
        }, 1000);
    }

    showGameOver() {
        this.engine.gameState = 'GAME_OVER';
        this.finalScore.textContent = this.engine.score;
        this.finalLevel.textContent = this.engine.level;

        // Render review items
        this.reviewList.innerHTML = '';
        if (this.engine.wrongElements.length > 0) {
            this.engine.wrongElements.forEach(el => {
                const item = document.createElement('div');
                item.className = 'review-item';
                item.innerHTML = `
                    <span class="review-symbol">${el.symbol}</span>
                    <span class="review-name">${el.name}</span>
                `;
                this.reviewList.appendChild(item);
            });
            document.getElementById('review-section').style.display = 'block';
        } else {
            document.getElementById('review-section').style.display = 'none';
        }

        this.gameOverScreen.classList.add('visible');
    }

    showMissionCleared() {
        this.clearedScore.textContent = this.engine.score;
        this.clearedScreen.classList.add('visible');
    }
}

new GameUI();
