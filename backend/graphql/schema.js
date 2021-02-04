const { buildSchema } = require('graphql');

module.exports = buildSchema(`
    type Post {
        _id: ID!
        title: String!
        image: String!
        content: String!
        creator: User!
        createdAt: String!
        updatedAt: String!

    }
    type User {
        _id: ID!
        email: String!
        name: String!
        password: String!
        post: [Post]!
    }

    type AuthData {
        token: String!
        userId: String!
    }

    input UserInputData {
        email: String!
        name: String!
        password: String!
    }

    type RootMutation {
        createUser(userInput: UserInputData): User!
    }

    type RootQuery {
        login(email: String!, password: String!): AuthData
    }

    schema {
        query: RootQuery
        mutation: RootMutation
    }
`)