document.getElementById("markDone").addEventListener("click", () => {
  const today = new Date().toDateString();

  chrome.storage.local.get(["lastMarkedDate", "streak"], (data) => {
    let streak = data.streak || 0;
    const lastDate = data.lastMarkedDate;

    if (lastDate === today) {
      alert("You already marked today!");
      return;
    }

    if (lastDate === new Date(Date.now() - 86400000).toDateString()) {
      streak += 1;
    } else {
      streak = 1;
    }

    chrome.storage.local.set({ lastMarkedDate: today, streak });
    document.getElementById("streak").textContent = `${streak} days`;
  });
});

chrome.storage.local.get("streak", (data) => {
  document.getElementById("streak").textContent = `${data.streak || 0} days`;
});