// to make it tamperproof.
const developerMode = false; // Set true only when testing manually
if (!developerMode) {
  try {
    Object.freeze(chrome.storage.sync);
  } catch (err) {
    console.warn("Failed to freeze chrome.storage.sync (expected in some contexts)", err);
  }
}

if (developerMode) {
  document.getElementById("devBanner").style.display = "block";
}

function markDone(topic) {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const streakKey = `streak_${topic}`;
  const dateKey = `lastMarkedDate_${topic}`;
  const historyKey = `history_${topic}`;

  chrome.storage.sync.get([streakKey, dateKey, historyKey], (data) => {
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

    chrome.storage.sync.set({
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

  chrome.storage.sync.get([`history_${topic}`], (data) => {
    const history = new Set(data[`history_${topic}`] || []);
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
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
  div.id = `box-${topic}`;
  div.innerHTML = `
    <div class="streakTitle">
      ${topic.charAt(0).toUpperCase() + topic.slice(1)} Streak:
      <button style="float:right; background:none; border:none; color:#e74c3c; cursor:pointer;" title="Delete ${topic}" id="delete-${topic}">🗑️</button>
    </div>
    <div id="streak-${topic}" class="streak">0 days</div>
    <div id="extra-${topic}" style="font-size: 0.9em; color: #555;"></div>
    <div id="integrity-${topic}" style="font-size: 0.85em; margin-top: 4px;"></div>
  `;

  const button = document.createElement("button");
  button.className = "markButton";
  button.textContent = `✅ Mark ${topic}`;
  button.addEventListener("click", () => {
    if (!developerMode) markDone(topic);
    else alert("Developer mode is ON — manual streak modification allowed.");
  });
  div.appendChild(button);

  const heatmapSection = document.createElement("div");
  heatmapSection.id = `heatmap-${topic}`;
  renderHeatmap(topic, heatmapSection);
  div.appendChild(heatmapSection);

  container.appendChild(div);

  const streakKey = `streak_${topic}`;
  const dateKey = `lastMarkedDate_${topic}`;
  const historyKey = `history_${topic}`;

  chrome.storage.sync.get([streakKey, dateKey, historyKey], (data) => {
    const streak = data[streakKey] || 0;
    const lastMarked = data[dateKey] || "N/A";
    const history = new Set(data[historyKey] || []);
    document.getElementById(`streak-${topic}`).textContent = `${streak} days`;

    const extraInfo = `
      <div>Total Active Days: ${history.size}</div>
      <div>Last Marked: ${lastMarked}</div>
    `;
    document.getElementById(`extra-${topic}`).innerHTML = extraInfo;

    // 🔐 Integrity Check
    const integrityEl = document.getElementById(`integrity-${topic}`);
    if (streak > history.size) {
      integrityEl.innerHTML = `<span style="color: red;">❌ Tampered (streak > history)</span>`;
    } else {
      integrityEl.innerHTML = `<span style="color: green;">✅ Legit</span>`;
    }
  });

  // Delete button
  document.getElementById(`delete-${topic}`).addEventListener("click", () => deleteTopic(topic));
}


function deleteTopic(topic) {
  if (!confirm(`Are you sure you want to delete "${topic}"?`)) return;

  const streakKey = `streak_${topic}`;
  const dateKey = `lastMarkedDate_${topic}`;
  const historyKey = `history_${topic}`;

  chrome.storage.sync.get(["topics"], (data) => {
    let topics = data.topics || [];
    topics = topics.filter(t => t !== topic);

    chrome.storage.sync.remove([streakKey, dateKey, historyKey], () => {
      chrome.storage.sync.set({ topics }, () => {
        document.getElementById(`box-${topic}`).remove();
      });
    });
  });
}


function loadTopics() {
  chrome.storage.sync.get(["topics"], (data) => {
    const topics = data.topics || ["java", "rest", "go"];
    topics.forEach(renderTopic);
  });
}

function addTopic() {
  const input = document.getElementById("newTopicInput");
  const topic = input.value.trim().toLowerCase();
  if (!topic) return;

  chrome.storage.sync.get(["topics"], (data) => {
    let topics = data.topics || [];
    if (!topics.includes(topic)) {
      topics.push(topic);
      chrome.storage.sync.set({ topics }, () => {
        renderTopic(topic);
        input.value = "";
      });
    } else {
      alert("Topic already exists.");
    }
  });
}


const SHEET_ID = "SHEET ID FORM URL"; // From sheet URL
const SHEET_RANGE = "A1"; // Top-left cell where backup starts

function backupToGoogleSheet() {
  chrome.identity.getAuthToken({ interactive: true }, (token) => {
    if (chrome.runtime.lastError) {
      alert("Auth failed: " + chrome.runtime.lastError.message);
      return;
    }

    chrome.storage.sync.get(null, (data) => {
      const topics = data.topics || [];
      const rows = [];

      topics.forEach(topic => {
        const streak = data[`streak_${topic}`] || 0;
        const lastMarked = data[`lastMarkedDate_${topic}`] || "N/A";
        const history = JSON.stringify(data[`history_${topic}`] || []);
        const totalDays = (data[`history_${topic}`] || []).length;

        rows.push([topic, streak, lastMarked, totalDays, history]);
      });

      const requestBody = {
        values: [["Topic", "Streak", "LastMarked", "TotalDays", "History JSON"], ...rows]
      };

      fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_RANGE}?valueInputOption=RAW`, {
        method: "PUT",
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      })
        .then(res => res.json())
        .then(response => {
          console.log("Backup successful", response);
          alert("Backup to Google Sheet successful!");
        })
        .catch(err => {
          console.error("Backup failed", err);
          alert("Backup failed: " + err.message);
        });
    });
  });
}


document.getElementById("addTopicButton").addEventListener("click", addTopic);
document.getElementById("backupBtn").addEventListener("click", backupToGoogleSheet);

loadTopics();