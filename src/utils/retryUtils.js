/**
 * Retries an async function execution maxRetries times with exponential backoff
 * @param {Function} fn Function to retry
 * @param {number} maxRetries Maximum retry attempts
 * @param {number} delay Base delay between retries
 * @returns {Promise<any>}
 */
export const withRetry = async (fn, maxRetries = 2, delay = 1000) => {
    let attempts = 0;
    while (attempts < maxRetries) {
        try {
            return await fn();
        } catch (error) {
            attempts++;
            if (attempts >= maxRetries) {
                console.error(`[RetryUtils] Failed after ${maxRetries} attempts`);
                throw error;
            }
            console.error(`[RetryUtils] Attempt ${attempts} failed (${error.message}). Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay * attempts)); // simple exponential backoff
        }
    }
};
