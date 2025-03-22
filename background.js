chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create("dailyReminder", {
    when: Date.now() + 5000,
    periodInMinutes: 1440
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