// Database Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCw8H90ye5YMFMqM5VuuOaXtSzCM_lPgzw",
    authDomain: "mission-2027-fm.firebaseapp.com",
    projectId: "mission-2027-fm",
    storageBucket: "mission-2027-fm.firebasestorage.app",
    messagingSenderId: "212938338396",
    appId: "1:212938338396:web:859c73d3d50d54bc537699"
};

// Database Start 
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Screens & Elements
const authScreen = document.getElementById('auth-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const quizScreen = document.getElementById('quiz-screen');

const loginBtn = document.getElementById('login-btn');
const userNameInput = document.getElementById('user-name');
const userMobileInput = document.getElementById('user-mobile');
const userPassInput = document.getElementById('user-pass');
const authError = document.getElementById('auth-error');
const profileName = document.getElementById('profile-name');
const profileScore = document.getElementById('profile-score');
const logoutBtn = document.getElementById('logout-btn');

const tickSound = new Audio('tick.mp3');
const questionEl = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const nextBtn = document.getElementById('next-btn');
const timeEl = document.getElementById('time');
const qCountEl = document.getElementById('q-count');
const totalQEl = document.getElementById('total-q');
const progressBar = document.getElementById('progress-bar');
const quizBody = document.getElementById('quiz-body');
const quizHeader = document.getElementById('quiz-header');
const resultScreen = document.getElementById('result-screen');
const finalScoreEl = document.getElementById('final-score');
const resultMessage = document.getElementById('result-message');
const scoreCircle = document.querySelector('.score-circle');

const quizData = [
    {
        question: "भारत के इतिहास में खोंड विद्रोह (Khond Uprising) कब हुआ था?",
        options: ["1890 - 1895", "1914 - 1920", "1921 - 1924", "1942 - 1945"],
        correctAnswer: 1
    },
    {
        question: "बिहार का शोक (Sorrow of Bihar) किस नदी को कहा जाता है?",
        options: ["गंगा", "गंडक", "कोसी", "पुनपुन"],
        correctAnswer: 2
    },
    {
        question: "अंकोरवाट (Angkor Wat) का मंदिर कहाँ स्थित है?",
        options: ["वियतनाम", "थाईलैंड", "लाओस", "कंबोडिया"],
        correctAnswer: 3
    },
    {
        question: "बिहार में पंचायती राज व्यवस्था का कार्यकाल कितने वर्षों का होता है?",
        options: ["4 वर्ष", "5 वर्ष", "6 वर्ष", "7 वर्ष"],
        correctAnswer: 1
    },
    {
        question: "इनमें से किस राज्य की प्रति व्यक्ति आय सबसे कम है?",
        options: ["पंजाब", "हरियाणा", "बिहार", "गोवा"],
        correctAnswer: 2
    }
];

let currentQuestionIndex = 0;
let score = 0;
let timeLeft = 10;
let timer;
totalQEl.innerText = quizData.length;

// ==========================================
// FIREBASE LOGIN SYSTEM
// ==========================================

window.onload = async () => {
    const savedMobile = localStorage.getItem('mission2027User');
    if (savedMobile) {
        try {
            const docSnap = await db.collection("students").doc(savedMobile).get();
            if (docSnap.exists) {
                showDashboard(docSnap.data());
            }
        } catch (e) {
            console.log("Auto-login failed:", e);
        }
    }
};

loginBtn.addEventListener('click', async () => {
    const name = userNameInput.value.trim();
    const mobile = userMobileInput.value.trim();
    const pass = userPassInput.value.trim();

    if (name === "" || mobile === "" || pass === "") {
        showError("Kripaya sabhi details bharein!");
        return;
    }
    if (mobile.length !== 10) {
        showError("Mobile number 10 digit ka hona chahiye!");
        return;
    }

    loginBtn.innerText = "Loading...";
    authError.style.display = "none";

    try {
        const studentRef = db.collection("students").doc(mobile);
        const docSnap = await studentRef.get();

        if (docSnap.exists) {
            const data = docSnap.data();
            if (data.password === pass) {
                localStorage.setItem('mission2027User', mobile);
                showDashboard(data);
            } else {
                showError("Yeh number pehle se register hai par password galat hai!");
            }
        } else {
            const newStudent = {
                name: name,
                mobile: mobile,
                password: pass,
                totalScore: 0,
                levelUnlocked: 1
            };
            await studentRef.set(newStudent);
            localStorage.setItem('mission2027User', mobile);
            showDashboard(newStudent);
        }
    } catch (e) {
        console.error("Login error:", e);
        showError("Database error! Internet connection check karein.");
    }
    loginBtn.innerText = "Login / Register";
});

function showError(msg) {
    authError.innerText = msg;
    authError.style.display = "block";
}

function showDashboard(userData) {
    authScreen.classList.add('hide');
    quizScreen.classList.add('hide');
    dashboardScreen.classList.remove('hide');

    profileName.innerText = "Welcome, " + userData.name;
    profileScore.innerText = userData.totalScore;
}

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('mission2027User');
    dashboardScreen.classList.add('hide');
    authScreen.classList.remove('hide');
    
    userNameInput.value = '';
    userMobileInput.value = '';
    userPassInput.value = '';
    authError.style.display = 'none';
});

// ==========================================
// QUIZ SYSTEM 
// ==========================================

window.startLevel = function(levelNumber) {
    dashboardScreen.classList.add('hide');
    quizScreen.classList.remove('hide');
    quizBody.classList.remove('hide');
    quizHeader.classList.remove('hide');
    resultScreen.classList.add('hide');
    startQuiz();
}

function startQuiz() {
    currentQuestionIndex = 0;
    score = 0;
    loadQuestion();
}

function loadQuestion() {
    resetState();
    const progress = ((currentQuestionIndex) / quizData.length) * 100;
    progressBar.style.width = `${progress}%`;
    qCountEl.innerText = currentQuestionIndex + 1;

    const currentQuizData = quizData[currentQuestionIndex];
    questionEl.innerText = currentQuizData.question;

    currentQuizData.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.innerText = option;
        button.classList.add('option-btn');
        button.addEventListener('click', () => checkAnswer(index, button));
        optionsContainer.appendChild(button);
    });

    startTimer();
}

function resetState() {
    clearInterval(timer);
    tickSound.pause();
    tickSound.currentTime = 0;
    timeLeft = 10; 
    timeEl.innerText = timeLeft;
    nextBtn.classList.remove('hide'); 
    nextBtn.classList.add('hide-btn');
    optionsContainer.innerHTML = '';
}

function startTimer() {
    timer = setInterval(() => {
        timeLeft--;
        timeEl.innerText = timeLeft;
        
        if (timeLeft <= 5 && timeLeft > 0) {
            tickSound.currentTime = 0; 
            tickSound.play().catch(e => console.log("Sound error"));
        }
        
        if (timeLeft <= 0) {
            clearInterval(timer);
            timeEl.innerText = "0";
            tickSound.pause(); 
            autoShowCorrectAnswer();
        }
    }, 1000);
}

function checkAnswer(selectedIndex, selectedButton) {
    clearInterval(timer);
    tickSound.pause();
    tickSound.currentTime = 0;

    const correctIndex = quizData[currentQuestionIndex].correctAnswer;
    const allButtons = optionsContainer.children;

    for (let i = 0; i < allButtons.length; i++) {
        allButtons[i].classList.add('disabled');
        if (i === correctIndex && selectedIndex !== correctIndex) {
            allButtons[i].classList.add('correct'); 
        }
    }

    if (selectedIndex === correctIndex) {
        selectedButton.classList.add('correct');
        score += 10; 
    } else {
        selectedButton.classList.add('wrong');
    }

    nextBtn.classList.remove('hide-btn');
    nextBtn.classList.remove('hide');
}

function autoShowCorrectAnswer() {
    const correctIndex = quizData[currentQuestionIndex].correctAnswer;
    const allButtons = optionsContainer.children;

    for (let i = 0; i < allButtons.length; i++) {
        allButtons[i].classList.add('disabled');
        if (i === correctIndex) {
            allButtons[i].classList.add('correct');
        }
    }
    
    nextBtn.classList.remove('hide-btn');
    nextBtn.classList.remove('hide');
}

nextBtn.addEventListener('click', () => {
    currentQuestionIndex++;
    if (currentQuestionIndex < quizData.length) {
        loadQuestion();
    } else {
        showResults();
    }
});

async function showResults() {
    quizBody.classList.add('hide');
    quizHeader.classList.add('hide');
    progressBar.style.width = "100%";
    resultScreen.classList.remove('hide');
    
    const maxScore = quizData.length * 10;
    finalScoreEl.innerText = `${score}/${maxScore}`;
    
    const percentage = (score / maxScore) * 100;
    scoreCircle.style.setProperty('--p', `${percentage}%`);

    if (score === maxScore) {
        resultMessage.innerText = "Shabash! Aapne Top kiya!";
        resultMessage.style.color = "#2ed573";
    } else if (score >= maxScore / 2) {
        resultMessage.innerText = "Achha prayas hai, par aur mehnat ki zarurat hai.";
        resultMessage.style.color = "#eccc68";
    } else {
        resultMessage.innerText = "Thodi aur tayari kijiye!";
        resultMessage.style.color = "#ff4757";
    }

    // SCORE UPDATE LOGIC
    const savedMobile = localStorage.getItem('mission2027User');
    if (savedMobile) {
        try {
            const studentRef = db.collection("students").doc(savedMobile);
            const docSnap = await studentRef.get();
            if (docSnap.exists) {
                const data = docSnap.data();
                const newTotalScore = data.totalScore + score;
                await studentRef.update({ totalScore: newTotalScore });
                profileScore.innerText = newTotalScore; 
            }
        } catch(e) {
            console.error("Score save karne mein error:", e);
        }
    }
}

window.goToDashboard = function() {
    const savedMobile = localStorage.getItem('mission2027User');
    if(savedMobile) {
        resultScreen.classList.add('hide');
        dashboardScreen.classList.remove('hide');
    }
      }

