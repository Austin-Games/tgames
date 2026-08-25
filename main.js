const htmlContent = `
  <div style="background: #f4f4f4; padding: 20px; border-radius: 5px;">
    <h2>Hello from jsDelivr!</h2>
    <p>This HTML was injected dynamically via a JavaScript wrapper.</p>
  </div>
`;

// Inject into a specific container or append to body
document.currentScript.insertAdjacentHTML('afterend', htmlContent);
