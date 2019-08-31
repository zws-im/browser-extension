/* global browser */

const apiURL = "https://us-central1-zero-width-shortener.cloudfunctions.net";

/**
 * Wait a number of milliseconds
 * @param {Number} time Number of milliseconds to wait for
 */
const wait = time =>
  new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, time);
  });

/**
 * Copy a string to the clipboard using a textarea
 * @param {string} str String to copy to the clipboard
 */
const legacyCopy = str => {
  const el = document.createElement("textarea");
  el.value = str;
  document.body.appendChild(el);

  el.select();
  document.execCommand("copy");

  document.body.removeChild(el);
};

/**
 * Event triggered when the extension icon is clicked
 * @param {Object} tab Current tab being used by the user
 * @property {string} tab.url Current URL the tab is on
 */
browser.browserAction.onClicked.addListener(async tab => {
  // Our loading indicator
  browser.browserAction.setBadgeText({ text: "..." });
  browser.browserAction.setBadgeBackgroundColor({ color: "#808080" });

  const { url } = tab;

  try {
    // This is a non-ideal way to do query parameters, however the Fetch API doesn't have a better way
    const response = await fetch(`${apiURL}/shortenURL?url=${encodeURIComponent(url)}`);
    const { short } = await response.json();

    // Copy to the clipboard if it has the permissions
    navigator.permissions
      .query({
        name: "clipboard-write"
      })
      .then(permission => {
        const shortenedURL = `https://zws.im/${short}`;

        if (permission === "granted") {
          // As of writing, the permissions for copying will *never* be granted, so we use the old fashioned method of copying
          navigator.clipboard.writeText(shortenedURL);
        } else {
          legacyCopy(shortenedURL);
        }

        browser.browserAction.setBadgeText({ text: "Done" });
        browser.browserAction.setBadgeBackgroundColor({ color: "#4caf50" });
      });
  } catch (error) {
    console.error(error);

    browser.browserAction.setBadgeText({ text: "Error" });
    browser.browserAction.setBadgeBackgroundColor({ color: "#f44336" });
  } finally {
    // Wait a bit for the user to see the status
    await wait(3000);

    // An empty string will hide the badge
    browser.browserAction.setBadgeText({ text: "" });
  }
});
