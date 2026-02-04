export class GameEngine {
    constructor(elements) {
        this.elements = elements;
        this.reset();
    }

    reset(startLevel = 1) {
        this.level = startLevel;
        this.score = 0;
        this.streak = 0;
        this.bonusPasses = 0;
        this.gameState = 'READY'; // READY, PLAYING, PAUSED, GAME_OVER, CLEARED
        this.currentQuestion = null;
        this.options = [];
        this.timeLimit = 10;
        this.timer = null;
        this.timeLeft = 0;
        this.wrongElements = []; // Store elements for review

        // Question limits and tracking
        this.questionsAnswered = 0;
        const difficultyLimits = { 1: 10, 4: 20, 8: 30 };
        this.totalQuestionsLimit = difficultyLimits[startLevel] || 30;
    }

    startLevel() {
        this.gameState = 'PLAYING';
        this.generateQuestion();
        this.timeLeft = this.timeLimit;
    }

    generateQuestion() {
        const config = this.getLevelConfig();
        const numOptions = config.cards;
        const maxAtomicNumber = config.range;

        // Filter elements based on the range for the current level
        const availableElements = this.elements.filter(e => e.atomicNumber <= maxAtomicNumber);

        // Pick target element from available elements
        const targetIndex = Math.floor(Math.random() * availableElements.length);
        this.currentQuestion = availableElements[targetIndex];

        // Generate options (including target)
        let options = [this.currentQuestion];

        // Add similar looking symbols or random ones
        const potentialDistractors = availableElements.filter(e => e.symbol !== this.currentQuestion.symbol);

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

    getLevelConfig() {
        const configs = {
            1: { cards: 2, range: 10, label: '초급' },
            2: { cards: 2, range: 15, label: '초급' },
            3: { cards: 3, range: 20, label: '초급' },
            4: { cards: 3, range: 25, label: '중급' },
            5: { cards: 3, range: 30, label: '중급' },
            6: { cards: 4, range: 40, label: '중급' },
            7: { cards: 4, range: 50, label: '중급' },
            8: { cards: 4, range: 60, label: '고급' },
            9: { cards: 4, range: 70, label: '고급' },
            10: { cards: 4, range: 80, label: '고급' },
            11: { cards: 5, range: 90, label: '고급' },
            12: { cards: 5, range: 118, label: '고급' }
        };
        return configs[this.level] || configs[12];
    }

    getDifficulty() {
        const config = this.getLevelConfig();
        return {
            numCards: config.cards,
            maxAtomicNumber: config.range,
            label: config.label
        };
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

        this.questionsAnswered++;
        this.updateLevel();
    }

    handleIncorrect() {
        this.streak = 0;
        this.questionsAnswered++;

        if (!this.wrongElements.find(e => e.symbol === this.currentQuestion.symbol)) {
            this.wrongElements.push(this.currentQuestion);
        }

        this.updateLevel();
    }

    updateLevel() {
        // End of difficulty check
        if (this.questionsAnswered >= this.totalQuestionsLimit) {
            this.gameState = 'CLEARED';
            return;
        }

        // Level progression milestones
        if (this.totalQuestionsLimit === 10) { // 초급
            if (this.questionsAnswered < 4) this.level = 1;
            else if (this.questionsAnswered < 7) this.level = 2;
            else this.level = 3;
        } else if (this.totalQuestionsLimit === 20) { // 중급
            if (this.questionsAnswered < 6) this.level = 4;
            else if (this.questionsAnswered < 11) this.level = 5;
            else if (this.questionsAnswered < 16) this.level = 6;
            else this.level = 7;
        } else { // 고급
            if (this.questionsAnswered < 7) this.level = 8;
            else if (this.questionsAnswered < 13) this.level = 9;
            else if (this.questionsAnswered < 19) this.level = 10;
            else if (this.questionsAnswered < 25) this.level = 11;
            else this.level = 12;
        }
    }

}
