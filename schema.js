const loginSchema = {
    type: "object",
    required: ["username","password"],
    properties: {
        username: {
            type: "string",
            minLength: 1,
        },
        password: {
            type: "string",
            minLength: 1,
        },
    },
};

const registerSchema = {
    type: "object",
    required: ["username","password"],
    properties: {
        username: {
            type: "string",
            minLength: 1,
        },
        email: {
            type: "string",
            minLength: 1,
        },
        password: {
            type: "string",
            minLength: 1,
        },
    },
};

module.exports = {loginSchema,registerSchema}