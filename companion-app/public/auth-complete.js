if (window.opener) window.opener.postMessage({ type: "visa-auth-complete" }, location.origin);
setTimeout(() => window.close(), 700);
