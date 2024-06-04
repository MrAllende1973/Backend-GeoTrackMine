const createApiResponse = (success, message, code, data) => {
    return {
        success,
        message,
        code,
        data
    };
};

export { createApiResponse };