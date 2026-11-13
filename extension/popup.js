// Change this to your own domain once you have one.
const MAKEQR_URL = 'https://makeqr-vrsn.onrender.com';

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tab = tabs && tabs[0];
  const url = tab && tab.url;
  const label = document.getElementById('url');
  const button = document.getElementById('go');
  if (!url || !/^https?:\/\//i.test(url)) {
    label.textContent = 'Open a normal web page (http or https) first.';
    return;
  }
  label.textContent = url;
  button.disabled = false;
  button.addEventListener('click', () => {
    chrome.tabs.create({ url: `${MAKEQR_URL}/?newurl=${encodeURIComponent(url)}` });
    window.close();
  });
});
