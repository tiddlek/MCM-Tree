chrome.runtime.onMessage.addListener(
    (message, sender, sendResponse) => {

        if (message.type !== "fetchPage") {
            return;
        }

        fetch(message.url)
            .then(response => {

                if (!response.ok) {
                    throw new Error(
                        `HTTP ${response.status}`
                    );
                }

                return response.text();
            })
            .then(html => {

                sendResponse({
                    success: true,
                    html: html
                });

            })
            .catch(error => {

                console.error(
                    "Fetch failed:",
                    message.url,
                    error
                );

                sendResponse({
                    success: false,
                    error: error.message
                });

            });

        return true;
    }
);