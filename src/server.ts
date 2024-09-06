import express, { Request, Response } from 'express';

const app = express();
const PORT = 3000;

// 中间件
app.use(express.json());

// 路由
app.get('/', (req: Request, res: Response) => {
    res.send('Hello, World!');
});

app.post('/data', (req: Request, res: Response) => {
    const data = req.body;
    res.json({ received: data });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});