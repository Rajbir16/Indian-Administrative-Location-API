import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.3",

    info: {
      title: "Indian Administrative Location API",
      version: "2.0.0",
      description:
        "REST API for Indian administrative location data including states, districts, sub-districts and villages.",
    },

    servers: [
      {
        url: "http://localhost:3000",
        description: "Local development server",
      },
      {
        url: "https://indian-administrative-location-api.onrender.com",
        description: "Production server",
      },
    ],

    tags: [
      {
        name: "Locations",
        description: "Indian administrative location data",
      },
      {
        name: "Authentication",
        description: "User registration and authentication",
      },
      {
        name: "API Keys",
        description: "API key management",
      },
      {
        name: "Analytics",
        description: "Usage and analytics",
      },
      {
        name: "Admin",
        description: "Administrative management",
      },
    ],

    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "X-API-Key",
          description: "API key required for V1 API requests.",
        },

        ApiSecretAuth: {
          type: "apiKey",
          in: "header",
          name: "X-API-Secret",
          description: "API secret required for write operations.",
        },

        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT authentication token.",
        },
      },

      schemas: {
        StandardResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            count: {
              type: "integer",
              example: 10,
            },
            data: {
              type: "array",
              items: {},
            },
            meta: {
              type: "object",
              properties: {
                requestId: {
                  type: "string",
                  example: "req_123456",
                },
                responseTime: {
                  type: "number",
                  example: 42,
                },
                rateLimit: {
                  type: "object",
                  properties: {
                    remaining: {
                      type: "integer",
                      example: 4989,
                    },
                    limit: {
                      type: "integer",
                      example: 5000,
                    },
                    reset: {
                      type: "integer",
                      example: 60,
                    },
                  },
                },
              },
            },
          },
        },

        Location: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              example: 1,
            },
            code: {
              type: "string",
              example: "MH",
            },
            name: {
              type: "string",
              example: "Maharashtra",
            },
          },
        },

        VillageSearchResult: {
          type: "object",
          properties: {
            value: {
              type: "string",
              example: "270001",
            },
            label: {
              type: "string",
              example: "Manibeli",
            },
            fullAddress: {
              type: "string",
              example:
                "Manibeli, Akkalkuwa, Nandurbar, Maharashtra, India",
            },
            hierarchy: {
              type: "object",
            },
          },
        },

        ErrorResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            error: {
              type: "string",
              example: "INVALID_QUERY",
            },
            message: {
              type: "string",
              example: "Invalid request",
            },
          },
        },
      },
    },

    paths: {
      // ==================================================
      // LOCATION APIs
      // ==================================================

      "/v1/states": {
        get: {
          tags: ["Locations"],
          summary: "Get states",
          description:
            "Returns all active Indian states available to the authenticated API key.",
          security: [{ ApiKeyAuth: [] }],

          responses: {
            "200": {
              description: "States returned successfully",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/StandardResponse",
                  },
                },
              },
            },

            "401": {
              description: "Invalid API key",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ErrorResponse",
                  },
                },
              },
            },

            "429": {
              description: "Rate limit exceeded",
            },
          },
        },
      },

      "/v1/states/{id}/districts": {
        get: {
          tags: ["Locations"],
          summary: "Get districts for a state",
          security: [{ ApiKeyAuth: [] }],

          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              description: "State ID",
              schema: {
                type: "integer",
              },
              example: 1,
            },
          ],

          responses: {
            "200": {
              description: "Districts returned successfully",
            },
            "400": {
              description: "Invalid state ID",
            },
            "401": {
              description: "Invalid API key",
            },
            "403": {
              description: "State access denied",
            },
            "404": {
              description: "State not found",
            },
          },
        },
      },

      "/v1/districts/{id}/subdistricts": {
        get: {
          tags: ["Locations"],
          summary: "Get sub-districts for a district",
          security: [{ ApiKeyAuth: [] }],

          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              description: "District ID",
              schema: {
                type: "integer",
              },
              example: 1,
            },
          ],

          responses: {
            "200": {
              description: "Sub-districts returned successfully",
            },
            "400": {
              description: "Invalid district ID",
            },
            "401": {
              description: "Invalid API key",
            },
            "403": {
              description: "State access denied",
            },
            "404": {
              description: "District not found",
            },
          },
        },
      },

      "/v1/subdistricts/{id}/villages": {
        get: {
          tags: ["Locations"],
          summary: "Get villages for a sub-district",
          security: [{ ApiKeyAuth: [] }],

          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              description: "Sub-district ID",
              schema: {
                type: "integer",
              },
              example: 1,
            },
          ],

          responses: {
            "200": {
              description: "Villages returned successfully",
            },
            "400": {
              description: "Invalid sub-district ID",
            },
            "401": {
              description: "Invalid API key",
            },
            "403": {
              description: "State access denied",
            },
            "404": {
              description: "Sub-district not found",
            },
          },
        },
      },

      "/v1/search": {
        get: {
          tags: ["Locations"],
          summary: "Search villages",
          description:
            "Search villages by name with optional state, district and sub-district filters.",
          security: [{ ApiKeyAuth: [] }],

          parameters: [
            {
              name: "q",
              in: "query",
              required: true,
              description: "Village search text. Minimum 2 characters.",
              schema: {
                type: "string",
                minLength: 2,
              },
              example: "Manibeli",
            },

            {
              name: "state",
              in: "query",
              required: false,
              schema: {
                type: "string",
              },
              example: "Maharashtra",
            },

            {
              name: "district",
              in: "query",
              required: false,
              schema: {
                type: "string",
              },
              example: "Nandurbar",
            },

            {
              name: "subDistrict",
              in: "query",
              required: false,
              schema: {
                type: "string",
              },
              example: "Akkalkuwa",
            },

            {
              name: "limit",
              in: "query",
              required: false,
              schema: {
                type: "integer",
                minimum: 1,
                maximum: 100,
                default: 50,
              },
              example: 10,
            },
          ],

          responses: {
            "200": {
              description: "Search results returned successfully",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/StandardResponse",
                  },
                },
              },
            },

            "400": {
              description: "Invalid query",
            },

            "401": {
              description: "Invalid API key",
            },

            "403": {
              description: "State access denied",
            },

            "429": {
              description: "Rate limit exceeded",
            },
          },
        },
      },

      "/v1/autocomplete": {
        get: {
          tags: ["Locations"],
          summary: "Autocomplete locations",
          description:
            "Returns autocomplete results for village, sub-district, district or state.",
          security: [{ ApiKeyAuth: [] }],

          parameters: [
            {
              name: "q",
              in: "query",
              required: true,
              description: "Search text. Minimum 2 characters.",
              schema: {
                type: "string",
                minLength: 2,
              },
              example: "Mahar",
            },

            {
              name: "hierarchyLevel",
              in: "query",
              required: false,
              description: "Location hierarchy level",
              schema: {
                type: "string",
                enum: [
                  "village",
                  "subdistrict",
                  "district",
                  "state",
                ],
                default: "village",
              },
              example: "village",
            },

            {
              name: "limit",
              in: "query",
              required: false,
              schema: {
                type: "integer",
                minimum: 1,
                maximum: 100,
                default: 10,
              },
              example: 10,
            },
          ],

          responses: {
            "200": {
              description:
                "Autocomplete results returned successfully",
            },

            "400": {
              description: "Invalid query",
            },

            "401": {
              description: "Invalid API key",
            },

            "429": {
              description: "Rate limit exceeded",
            },
          },
        },
      },

      // ==================================================
      // AUTHENTICATION
      // ==================================================

      "/api/auth/register": {
        post: {
          tags: ["Authentication"],
          summary: "Register user",
          description: "Creates a new user account.",

          requestBody: {
            required: true,

            content: {
              "application/json": {
                schema: {
                  type: "object",

                  required: [
                    "email",
                    "name",
                    "password",
                  ],

                  properties: {
                    email: {
                      type: "string",
                      format: "email",
                      example: "user@example.com",
                    },

                    name: {
                      type: "string",
                      example: "Test User",
                    },

                    password: {
                      type: "string",
                      format: "password",
                      example: "Password123!",
                    },
                  },
                },
              },
            },
          },

          responses: {
            "201": {
              description: "User registered successfully",
            },

            "400": {
              description: "Invalid registration data",
            },

            "409": {
              description: "Email already registered",
            },
          },
        },
      },

      "/api/auth/b2b/register": {
        post: {
          tags: ["Authentication"],
          summary: "Register B2B user",
          description:
            "Registers a business user for administrative approval.",

          requestBody: {
            required: true,

            content: {
              "application/json": {
                schema: {
                  type: "object",

                  required: [
                    "businessEmail",
                    "businessName",
                    "phoneNumber",
                    "password",
                    "confirmPassword",
                  ],

                  properties: {
                    businessEmail: {
                      type: "string",
                      format: "email",
                      example: "company@example.com",
                    },

                    businessName: {
                      type: "string",
                      example:
                        "Example Technologies Pvt Ltd",
                    },

                    gstNumber: {
                      type: "string",
                      nullable: true,
                      example: "27ABCDE1234F1Z5",
                    },

                    phoneNumber: {
                      type: "string",
                      example: "+919876543210",
                    },

                    password: {
                      type: "string",
                      format: "password",
                      example: "Password123!",
                    },

                    confirmPassword: {
                      type: "string",
                      format: "password",
                      example: "Password123!",
                    },
                  },
                },
              },
            },
          },

          responses: {
            "201": {
              description:
                "Registration submitted for approval",
            },

            "400": {
              description: "Invalid registration data",
            },

            "409": {
              description: "Email already registered",
            },
          },
        },
      },

      "/api/auth/login": {
        post: {
          tags: ["Authentication"],
          summary: "Login",
          description:
            "Authenticates an approved user and returns a JWT.",

          requestBody: {
            required: true,

            content: {
              "application/json": {
                schema: {
                  type: "object",

                  required: [
                    "email",
                    "password",
                  ],

                  properties: {
                    email: {
                      type: "string",
                      format: "email",
                      example: "user@example.com",
                    },

                    password: {
                      type: "string",
                      format: "password",
                      example: "Password123!",
                    },
                  },
                },
              },
            },
          },

          responses: {
            "200": {
              description: "Login successful",
            },

            "401": {
              description:
                "Invalid credentials or account not approved",
            },
          },
        },
      },

      // ==================================================
      // API KEY MANAGEMENT
      // ==================================================

      "/api/auth/api-keys": {
        get: {
          tags: ["API Keys"],
          summary: "List API keys",
          description:
            "Returns API keys belonging to the authenticated user.",

          security: [{ BearerAuth: [] }],

          responses: {
            "200": {
              description: "API keys returned successfully",
            },

            "401": {
              description: "Authentication required",
            },
          },
        },

        post: {
          tags: ["API Keys"],
          summary: "Create API key",
          description:
            "Creates a new API key and returns the secret once.",

          security: [{ BearerAuth: [] }],

          requestBody: {
            required: true,

            content: {
              "application/json": {
                schema: {
                  type: "object",

                  required: ["name"],

                  properties: {
                    name: {
                      type: "string",
                      example: "Production API Key",
                    },
                  },
                },
              },
            },
          },

          responses: {
            "201": {
              description:
                "API key created successfully. Secret is returned only once.",
            },

            "400": {
              description: "Invalid request",
            },

            "401": {
              description: "Authentication required",
            },

            "403": {
              description:
                "Account is not approved or access denied",
            },

            "409": {
              description:
                "Maximum number of active API keys reached",
            },
          },
        },
      },

      "/api/auth/api-keys/{id}": {
        delete: {
          tags: ["API Keys"],
          summary: "Revoke API key",
          description:
            "Revokes an API key belonging to the authenticated user.",

          security: [{ BearerAuth: [] }],

          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: {
                type: "integer",
              },
              example: 1,
            },
          ],

          responses: {
            "200": {
              description: "API key revoked successfully",
            },

            "401": {
              description: "Authentication required",
            },

            "404": {
              description: "API key not found",
            },
          },
        },
      },

      "/api/auth/api-keys/{id}/rotate-secret": {
        post: {
          tags: ["API Keys"],
          summary: "Rotate API secret",
          description:
            "Generates a new API secret. The new secret is returned once.",

          security: [{ BearerAuth: [] }],

          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: {
                type: "integer",
              },
              example: 1,
            },
          ],

          responses: {
            "200": {
              description:
                "API secret rotated successfully",
            },

            "401": {
              description: "Authentication required",
            },

            "404": {
              description: "API key not found",
            },
          },
        },
      },

      // ==================================================
      // USER USAGE
      // ==================================================

      "/api/usage": {
        get: {
          tags: ["Analytics"],
          summary: "Get current usage",
          description:
            "Returns usage information for the authenticated user.",

          security: [{ BearerAuth: [] }],

          responses: {
            "200": {
              description: "Usage returned successfully",
            },

            "401": {
              description: "Authentication required",
            },
          },
        },
      },

      "/api/usage/history": {
        get: {
          tags: ["Analytics"],
          summary: "Get usage history",
          description:
            "Returns the authenticated user's 30-day request history.",

          security: [{ BearerAuth: [] }],

          responses: {
            "200": {
              description:
                "Usage history returned successfully",
            },

            "401": {
              description: "Authentication required",
            },
          },
        },
      },
    },
  },

  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);