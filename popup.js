function markDone(topic) {
  const today = new Date().toDateString();
  const streakKey = `streak_${topic}`;
  const dateKey = `lastMarkedDate_${topic}`;

  chrome.storage.local.get([streakKey, dateKey], (data) => {
    let streak = data[streakKey] || 0;
    const lastDate = data[dateKey];

    if (lastDate === today) {
      alert(`You already marked ${topic} today!`);
      return;
    }

    if (lastDate === new Date(Date.now() - 86400000).toDateString()) {
      streak += 1;
    } else {
      streak = 1;
    }

    chrome.storage.local.set({ [streakKey]: streak, [dateKey]: today }, () => {
      document.getElementById(`streak-${topic}`).textContent = `${streak} days`;
    });
  });
}

function renderTopic(topic) {
  const container = document.getElementById("streakContainer");
  const div = document.createElement("div");
  div.className = "streakBox";
  div.innerHTML = `
    <div class="streakTitle">${topic.charAt(0).toUpperCase() + topic.slice(1)} Streak:</div>
    <div id="streak-${topic}" class="streak">0 days</div>
  `;

  const button = document.createElement("button");
  button.className = "markButton";
  button.textContent = `✅ Mark ${topic}`;
  button.addEventListener("click", () => markDone(topic));
  div.appendChild(button);

  container.appendChild(div);

  const streakKey = `streak_${topic}`;
  chrome.storage.local.get([streakKey], (data) => {
    document.getElementById(`streak-${topic}`).textContent = `${data[streakKey] || 0} days`;
  });
}

function loadTopics() {
  chrome.storage.local.get(["topics"], (data) => {
    const topics = data.topics || ["java", "rest", "go"];
    topics.forEach(renderTopic);
  });
}

function addTopic() {
  const input = document.getElementById("newTopicInput");
  const topic = input.value.trim().toLowerCase();
  if (!topic) return;

  chrome.storage.local.get(["topics"], (data) => {
    let topics = data.topics || [];
    if (!topics.includes(topic)) {
      topics.push(topic);
      chrome.storage.local.set({ topics }, () => {
        renderTopic(topic);
        input.value = "";
      });
    } else {
      alert("Topic already exists.");
    }
  });
}

document.getElementById("addTopicButton").addEventListener("click", addTopic);

loadTopics();