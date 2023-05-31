import fastify from "fastify";

const app = fastify();

app.get('/hello', () => {
    return "How y'all doing?";
})

app.listen({
    port: 3333,

}).then(() => {
    console.log('Server running on PORT 3333')
})