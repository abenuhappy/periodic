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
        this.gradeSelection = document.getElementById('grade-selection');
        this.levelSelection = document.getElementById('level-selection');
        this.levelButtonsContainer = document.getElementById('level-buttons-container');

        this.gameOverScreen = document.getElementById('game-over-screen');
        this.clearedScreen = document.getElementById('cleared-screen');
        this.pauseScreen = document.getElementById('pause-screen');

        this.finalScore = document.getElementById('final-score');
        this.finalLevel = document.getElementById('final-level');
        this.clearedScore = document.getElementById('cleared-score');
        this.reviewList = document.getElementById('review-list');
    }

    initEvents() {
        // Grade button clicks
        document.querySelectorAll('.grade-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const grade = btn.dataset.grade;
                this.showLevelSelection(grade, btn);
            });
        });

        // Back button
        document.getElementById('back-to-grades').addEventListener('click', () => {
            this.showGradeSelection();
        });

        document.getElementById('restart-btn').addEventListener('click', () => this.showStartScreen());
        document.getElementById('cleared-restart-btn').addEventListener('click', () => this.showStartScreen());
        document.getElementById('resume-btn').addEventListener('click', () => this.resumeGame());

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.togglePause();
            }
        });
    }

    showGradeSelection() {
        this.levelSelection.classList.add('hidden');
        this.gradeSelection.classList.remove('hidden');
        // Reset active states
        document.querySelectorAll('.grade-btn').forEach(btn => btn.classList.remove('active'));
    }

    showLevelSelection(grade, clickedBtn) {
        // Highlight selection
        if (clickedBtn) clickedBtn.classList.add('active');

        setTimeout(() => {
            this.gradeSelection.classList.add('hidden');
            this.levelSelection.classList.remove('hidden');

            // Clear previous buttons
            this.levelButtonsContainer.innerHTML = '';

            // Define levels for each grade
            const gradeLevels = {
                '초급': [1, 2, 3],
                '중급': [4, 5, 6],
                '고급': [7, 8, 9, 10],
                '최고급': [11, 12]
            };

            const levels = gradeLevels[grade];
            levels.forEach(lvl => {
                const btn = document.createElement('button');
                btn.className = 'btn level-btn';

                // Temporary engine to get config for description
                const tempEngine = new GameEngine(elementsData);
                tempEngine.level = lvl;
                const config = tempEngine.getLevelConfig();

                btn.innerHTML = `
                    <span class="level-number">Lv.${lvl}</span>
                    <span class="level-desc">${config.totalQuestions}문항 / 범위 1~${config.range}</span>
                `;
                btn.addEventListener('click', () => this.startGame(lvl));
                this.levelButtonsContainer.appendChild(btn);
            });
        }, 300); // Small delay for visual feedback
    }

    showStartScreen() {
        this.gameOverScreen.classList.remove('visible');
        this.clearedScreen.classList.remove('visible');
        this.startScreen.classList.add('visible');
        this.showGradeSelection();
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
        clearInterval(this.timerInterval);

        if (isCorrect) {
            cardElement.classList.add('correct');

            if (this.engine.gameState === 'CLEARED') {
                setTimeout(() => this.showMissionCleared(), 800);
            } else {
                setTimeout(() => this.nextLevel(), 800);
            }
        } else {
            cardElement.classList.add('wrong');

            // Highlight the correct card
            const cards = this.cardsContainer.querySelectorAll('.card');
            cards.forEach(card => {
                const cardSymbol = card.querySelector('.card-symbol').textContent;
                if (cardSymbol === this.engine.currentQuestion.symbol) {
                    card.classList.add('correct');
                }
            });

            if (this.engine.gameState === 'CLEARED') {
                setTimeout(() => this.showMissionCleared(), 1500);
            } else {
                setTimeout(() => this.nextLevel(), 1500);
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

                // Show correct answer and move on
                this.engine.handleIncorrect();

                const cards = this.cardsContainer.querySelectorAll('.card');
                cards.forEach(card => {
                    const cardSymbol = card.querySelector('.card-symbol').textContent;
                    if (cardSymbol === this.engine.currentQuestion.symbol) {
                        card.classList.add('correct');
                    }
                });

                if (this.engine.gameState === 'CLEARED') {
                    setTimeout(() => this.showMissionCleared(), 1500);
                } else {
                    setTimeout(() => this.nextLevel(), 1500);
                }
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
