// import snippet to set up window.workPage.ready() callback queue
window.workPage = window.workPage || {
  ready(callback) {
    window.workPage.readyCallbacks = window.workPage.readyCallbacks || [];
    window.workPage.readyCallbacks.push(callback);
  }
};
