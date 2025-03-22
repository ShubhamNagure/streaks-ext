function markDone(topic) {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const streakKey = `streak_${topic}`;
  const dateKey = `lastMarkedDate_${topic}`;
  const historyKey = `history_${topic}`;

  chrome.storage.local.get([streakKey, dateKey, historyKey], (data) => {
    let streak = data[streakKey] || 0;
    const lastDate = data[dateKey];
    let history = new Set(data[historyKey] || []);

    if (lastDate === today.toDateString()) {
      alert(`You already marked ${topic} today!`);
      return;
    }

    if (lastDate === new Date(Date.now() - 86400000).toDateString()) {
      streak += 1;
    } else {
      streak = 1;
    }

    history.add(dateStr);
    const historyArray = Array.from(history);

    chrome.storage.local.set({
      [streakKey]: streak,
      [dateKey]: today.toDateString(),
      [historyKey]: historyArray
    }, () => {
      document.getElementById(`streak-${topic}`).textContent = `${streak} days`;
      renderHeatmap(topic, document.getElementById(`heatmap-${topic}`));
    });
  });
}

function renderHeatmap(topic, container) {
  container.innerHTML = "";
  const grid = document.createElement("div");
  grid.className = "heatmap";

  chrome.storage.local.get([`history_${topic}`], (data) => {
    const history = new Set(data[`history_${topic}`] || []);
    const today = new Date();

    for (let i = 83; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const iso = date.toISOString().split('T')[0];

      const cell = document.createElement("div");
      cell.className = "heatmap-cell";
      cell.title = iso; // Tooltip showing date
      if (history.has(iso)) cell.classList.add("marked");

      grid.appendChild(cell);
    }

    container.appendChild(grid);
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

  const heatmapSection = document.createElement("div");
  heatmapSection.id = `heatmap-${topic}`;
  renderHeatmap(topic, heatmapSection);
  div.appendChild(heatmapSection);

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