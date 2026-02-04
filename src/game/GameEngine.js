export class GameEngine {
    constructor(elements) {
        this.elements = elements;
        this.reset();
    }

    reset() {
        this.level = 1;
        this.score = 0;
        this.streak = 0;
        this.bonusPasses = 0;
        this.gameState = 'READY'; // READY, PLAYING, PAUSED, GAME_OVER
        this.currentQuestion = null;
        this.options = [];
        this.timeLimit = 10;
        this.timer = null;
        this.timeLeft = 0;
        this.wrongElements = []; // Store elements for review
    }

    startLevel() {
        this.gameState = 'PLAYING';
        this.generateQuestion();
        this.timeLeft = this.timeLimit;
    }

    generateQuestion() {
        const difficulty = this.getDifficulty();
        const numOptions = difficulty.numCards;

        // Pick target element
        const targetIndex = Math.floor(Math.random() * this.elements.length);
        this.currentQuestion = this.elements[targetIndex];

        // Generate options (including target)
        let options = [this.currentQuestion];

        // Add similar looking symbols or random ones
        const potentialDistractors = this.elements.filter(e => e.symbol !== this.currentQuestion.symbol);

        // Sort distractors by similarity to target symbol
        potentialDistractors.sort((a, b) => {
            const similarityA = this.getSimilarity(a.symbol, this.currentQuestion.symbol);
            const similarityB = this.getSimilarity(b.symbol, this.currentQuestion.symbol);
            return similarityB - similarityA;
        });

        // Pick top distractors based on level
        const distractors = potentialDistractors.slice(0, numOptions - 1);
        options = [...options, ...distractors];

        // Shuffle options
        this.options = this.shuffle(options);
    }

    getDifficulty() {
        if (this.level <= 3) return { numCards: 2 + Math.floor(this.level / 2), label: '초급' };
        if (this.level <= 7) return { numCards: 4 + (this.level % 2), label: '중급' };
        return { numCards: Math.min(8, 6 + Math.floor((this.level - 7) / 2)), label: '고급' };
    }

    getSimilarity(s1, s2) {
        let score = 0;
        if (s1[0] === s2[0]) score += 10;
        if (s1.length === s2.length) score += 5;
        // Simple overlap
        for (let char of s1) {
            if (s2.includes(char)) score += 2;
        }
        return score;
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    submitAnswer(symbol) {
        if (this.gameState !== 'PLAYING') return null;

        const isCorrect = symbol === this.currentQuestion.symbol;
        if (isCorrect) {
            this.handleCorrect();
        } else {
            this.handleIncorrect();
        }
        return isCorrect;
    }

    handleCorrect() {
        this.score += 10 * this.level;
        this.streak++;
        if (this.streak % 10 === 0) {
            this.bonusPasses++;
        }
        this.level++;
    }

    handleIncorrect() {
        if (this.bonusPasses > 0) {
            this.bonusPasses--;
            this.streak = 0;
            this.level++;
            return true; // Pass used
        } else {
            if (!this.wrongElements.find(e => e.symbol === this.currentQuestion.symbol)) {
                this.wrongElements.push(this.currentQuestion);
            }
            this.gameState = 'GAME_OVER';
            return false;
        }
    }
}
