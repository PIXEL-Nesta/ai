let questions = {};
let vocab = {};
let index = 0;
let mode = "";
let confidence = 0;
let timer = null;
let timeLeft = 30;
let currentQuestionObj = null;
let answered = false;

let deferredPrompt;
const installBtn = document.getElementById('intall'); // Aapki ID 'intall' hai

// 1. Browser ke default prompt ko rokna
window.addEventListener('beforeinstallprompt', (e) => {
  // Prompt ko prevent karein taaki ye turant na dikhe
  e.preventDefault();
  // Event ko save kar lein taaki baad mein trigger kar sakein
  deferredPrompt = e;
  
  // Install button ko dikhayein (by default ise hidden rakhein CSS se)
  installBtn.style.display = 'block';
});

// 2. Button click par install prompt dikhana
installBtn.addEventListener('click', async () => {
  if (deferredPrompt) {
    // Save kiya gaya prompt dikhayein
    deferredPrompt.prompt();
    
    // User ka decision check karein (Accepted ya Dismissed)
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response: ${outcome}`);
    
    // Prompt ek hi baar use ho sakta hai, isliye ise clear kar dein
    deferredPrompt = null;
    
    // Button ko hide kar dein
    installBtn.style.display = 'none';
  }
});

// 3. App install hone ke baad ka event
window.addEventListener('appinstalled', (event) => {
  console.log('PWA installed successfully!');
  installBtn.style.display = 'none';
});

// JSON Load
Promise.all([
  fetch("conversation.json").then(r => r.json()),
  fetch("vocab.json").then(r => r.json())
]).then(d => {
  questions = d[0];
  vocab = d[1];
}).catch(err => console.error("Data load error:", err));

window.onload = () => {
  setText("Select a mode and start practice. / मोड चुनें और अभ्यास शुरू करें।");
};

function setText(text) {
  document.getElementById("teacherBox").innerText = text;
  const speakText = text.split("/")[0];
  speak(speakText);
}

// START PRACTICE
function startPractice() {
  mode = document.getElementById("mode").value;
  if (!questions[mode]) return setText("Mode not found!");
  index = 0;
  confidence = 0; // Reset confidence on new start
  updateStats();
  nextQuestion();
}

// NEXT QUESTION
function nextQuestion() {
  clearTimer(); // Purana timer band karo
  answered = false;
  document.getElementById("userInput").value = ""; 

  let rawQuestion = questions[mode][index % questions[mode].length];
  
  // Handling String or Object from JSON
  if (typeof rawQuestion === 'string') {
    currentQuestionObj = { en: rawQuestion, hi: "Iska jawab dein." };
  } else {
    currentQuestionObj = rawQuestion;
  }

  setText(`Question: ${currentQuestionObj.en} \n (${currentQuestionObj.hi})`);
  
  // Timer Start (Ab ye 30s se shuru hoga)
  startTimer();
}

// WORKING TIMER LOGIC
function startTimer() {
  timeLeft = 30; // Reset to 30 seconds
  updateTimerDisplay();

  // Har 1 second mein ghatega
  timer = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();

    if (timeLeft <= 0) {
      clearTimer();
      if (!answered) {
        setText("Time is up! Moving to next question. / समय समाप्त! अगले प्रश्न पर चल रहे हैं।");
        setTimeout(() => {
          index++;
          nextQuestion();
        }, 3000); // 3 sec wait before auto-next
      }
    }
  }, 1000);
}

function clearTimer() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

function updateTimerDisplay() {
  // Aapke HTML ID 'startTimer' ke saath connect kiya
  const timerEl = document.getElementById("startTimer");
  if(timerEl) {
    timerEl.innerText = "Time left: " + timeLeft + "s";
    
    // Color change alert (Warning)
    if(timeLeft <= 10) {
      timerEl.style.color = "red";
    } else {
      timerEl.style.color = "black";
    }
  }
}

// SUBMIT ANSWER
function teach() {
  if (answered) return; // Baar baar click na ho

  const inputEl = document.getElementById("userInput");
  const answer = inputEl.value.trim();

  if (!answer) {
    alert("Please type your answer! / कृपया अपना उत्तर लिखें!");
    return;
  }

  answered = true;
  clearTimer(); // Stop timer as soon as user submits
  analyseAndRewrite(answer);
}

// DETAILED ANALYSIS
function analyseAndRewrite(sentence) {
  let mistakes = [];
  let corrected = sentence;
  const s = sentence.toLowerCase();

  // Galti 1: Length
  if (sentence.split(" ").length < 3) {
    mistakes.push("Answer is too short (Sentence बढ़ाएं)");
  }

  // Galti 2: Grammar
  if (s.includes("i is")) {
    mistakes.push("'I' ke sath 'am' lagta hai.");
    corrected = corrected.replace(/i is/gi, "I am");
  }
  if (s.startsWith("i from")) {
    mistakes.push("'I am from' sahi hai.");
    corrected = "I am from" + sentence.substring(6);
  }

  // Final Feedback
  let feedback = `Your answer: ${sentence}\n\n`;
  if (mistakes.length === 0) {
    feedback += "✅ Perfect! No mistakes. / बहुत अच्छे!";
    confidence += 5;
  } else {
    feedback += "❌ Mistakes:\n" + mistakes.join("\n") + 
                "\n\n✔ Correct Way: " + corrected;
    confidence += 1;
  }

  setText(feedback);
  updateStats();

  // Next question after 7 seconds (User ko galti padhne ka time milega)
  setTimeout(() => {
    index++;
    nextQuestion();
  }, 7000);
}

function updateStats() {
  document.getElementById("confidence").innerText = "Confidence: " + confidence;
  document.getElementById("answers").innerText = "Done: " + index;
}

function speak(text) {
  speechSynthesis.cancel();
  const msg = new SpeechSynthesisUtterance(text);
  msg.lang = "en-IN";
  msg.rate = 0.85;
  speechSynthesis.speak(msg);
}