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
    required: ["firstname","lastname","username","email","password"],
    properties: {
        firstname: {
            type: "string",
            minLength: 1,
        },
        lastname: {
            type: "string",
            minLength: 1,
        },
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