const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const statusDiv = document.getElementById('status');

// Função para enviar mensagem para o script da página
function sendMessageToContentScript(command) {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (tabs.length > 0) {
      chrome.tabs.sendMessage(tabs[0].id, { command: command });
    }
  });
}

startButton.addEventListener('click', () => {
  sendMessageToContentScript('start_listening');
  statusDiv.textContent = 'Status: Ouvindo...';
  statusDiv.style.color = 'green';
});

stopButton.addEventListener('click', () => {
  sendMessageToContentScript('stop_listening');
  statusDiv.textContent = 'Status: Inativo';
  statusDiv.style.color = '#555';
});