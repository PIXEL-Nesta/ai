let questions = {};
let vocab = {};
let index = 0;
let mode = "";
let confidence = 0;
let autoAsk = false;
let deferredPrompt;

// Load JSON files
Promise.all([
  fetch("conversation.json").then(r=>{
    if(!r.ok) throw new Error("conversation.json not found!");
    return r.json();
  }),
  fetch("vocab.json").then(r=>{
    if(!r.ok) throw new Error("vocab.json not found!");
    return r.json();
  })
]).then(data=>{
  questions = data[0];
  vocab = data[1];
  console.log("JSON Loaded", questions, vocab);
}).catch(err=>{
  console.error("JSON load error:", err);
  alert("Error loading JSON files. Check file names and folder.");
});

// Register service worker
if('serviceWorker' in navigator){
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then(reg=>{
      console.log('ServiceWorker registered:', reg);
    }).catch(err=>{
      console.log('ServiceWorker registration failed:', err);
    });
  });
}

// Install prompt
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const installBtn = document.getElementById('installBtn');
  installBtn.style.display = 'block';
  installBtn.addEventListener('click', () => {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if(choiceResult.outcome === 'accepted'){
        console.log('User accepted the install prompt');
      }
      deferredPrompt = null;
    });
  });
});

window.onload = () => {
  dailyReminder();
  teacher("Hello! Select a mode to start practicing English confidently.");
  updateStats();
};

function teacher(text){
  document.getElementById("teacherBox").innerText = ""+text;
  speak(text);
}

function startPractice(){
  mode = document.getElementById("modeSelect").value;
  if(!questions[mode] || questions[mode].length === 0){
    teacher("No questions found for this mode!");
    return;
  }
  index = 0;
  autoAsk = true;
  teacher("Practice started Speak confidently. I will correct and guide you.");
  setTimeout(askNextAutoQuestion, 1500);
}

function askNextAutoQuestion(){
  if(!autoAsk) return;
  askQuestion();
  index++;
  setTimeout(askNextAutoQuestion, 12000);
}

function askQuestion(){
  if(!questions[mode] || questions[mode].length === 0) return;
  const q = questions[mode][index % questions[mode].length];
  teacher(q);
}

function teach(){
  const input = document.getElementById("userInput").value.trim();
  document.getElementById("userInput").value="";
  if(!input){
    teacher("Please type or speak something");
    return;
  }
  analyseAndRewrite(input);
  updateStats();
  saveProgress();
}

function analyseAndRewrite(sentence){
  let feedback = " Your sentence:\n"+sentence+"\n\n";
  let corrected = sentence;
  let mistakes = 0;
  const s = sentence.toLowerCase();

  if(s.includes("i is")){ corrected=corrected.replace(/i is/gi,"I am"); feedback+=" 'I is' → 'I am'\n\n"; mistakes++;}
  if(s.includes("i am go")){ corrected=corrected.replace(/i am go/gi,"I am going"); feedback+="'I am go' → 'I am going'\n\n"; mistakes++;}
  if(s.includes("yesterday") && s.includes("go")){ corrected=corrected.replace(/go/gi,"went"); feedback+="Past time → went\n\n"; mistakes++;}

  if(sentence.split(" ").length<4){ feedback+="Sentence too short. Try speaking in full sentences.\n\n"; mistakes++;}

  for(let word in vocab){
    if(s.includes(word)){
      feedback+="Word Tip: '"+word+"' means '"+vocab[word].meaning+"'\nExample: "+vocab[word].example+"\n\n";
    }
  }

  if(mistakes===0){ 
    feedback+="Very good No major mistakes.\nKeep speaking confidently"; 
    confidence+=5;
  } else { 
    feedback+="Correct sentence:\n"+corrected+"\n\nGood try! Keep improving."; 
    confidence+=Math.max(0,5-mistakes);
  }

  teacher(feedback);
}

function updateStats(){
  document.getElementById("confidence").innerText="Confidence Score: "+confidence;
  document.getElementById("answers").innerText="Answers: "+index;
}

function dailyReminder(){
  const today=new Date().toDateString();
  if(localStorage.getItem("day")!==today){
    alert("Practice English today! Your future self will thank you.");
    localStorage.setItem("day",today);
  }
}

function saveProgress(){
  let count=Number(localStorage.getItem("answersDone")||0);
  count++;
  localStorage.setItem("answersDone",count);
  if(count%10===0){alert("🎉 Congratulations! You answered "+count+" questions today!");}
}

function startVoice(){
  if(!("webkitSpeechRecognition" in window)){alert("Use Chrome browser"); return;}
  const rec=new webkitSpeechRecognition();
  rec.lang="en-IN";
  rec.onresult=e=>document.getElementById("userInput").value=e.results[0][0].transcript;
  rec.start();
}

// 🔊 Slow & Clear Voice
function speak(text){
  const msg = new SpeechSynthesisUtterance(text.replace(/\n/g," "));
  msg.lang = "en-IN";
  msg.rate = 0.85;  // slightly slow
  msg.pitch = 1;
  msg.volume = 1;
  speechSynthesis.speak(msg);
}
