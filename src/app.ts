import express from 'express';
import {addMovie, getMovies, searchMovies} from './services/MovieService';
import dotenv from 'dotenv';
dotenv.config();


const app = express();
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Hello World!!!");
});

app.post('/movies', async (req, res) => {
    try {
        const movie = await addMovie(req.body);
        res.status(201).json(movie);
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
});

app.get('/movies', async (req, res) => {
  const movies = await getMovies();
  res.json(movies);
});

app.get('/movies/search', async (req, res) => {
    const q = req.query.q;
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Missing query parameter `q`' });
    }
  
    try {
      const movies = await searchMovies(q);
      res.json(movies);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});

export default app;