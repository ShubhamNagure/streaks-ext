chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create("dailyReminder", {
    when: Date.now() + 5000, // First reminder after 5 seconds for testing
    periodInMinutes: 1440 // 24 hours
  });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "dailyReminder") {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icon.png",
      title: "Learning Reminder",
      message: "Don't forget to mark your learning progress today!",
      priority: 2
    });
  }
});