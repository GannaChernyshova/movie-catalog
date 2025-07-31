import { Client } from "pg";

export interface Movie {
  id: string;
  title: string;
  director: string;
  genres: string[];
  releaseYear: number;
  description?: string;
}

let client: Client | null = null;

async function getClient() {
  if (!client) {
    // Configured using environment variables
    client = new Client();
    await client.connect();
  }
  return client;
}

async function teardown() {
  if (client) {
    await client.end();
  }
}

async function getMovies() : Promise<Movie[]> {
  const client = await getClient();

  const result = await client.query("SELECT * FROM movies ORDER BY title ASC");

  return result.rows.map(row => ({
    id: row.id,
    title: row.title,
    director: row.director,
    genres: row.genres,
    releaseYear: row.release_year,
    description: row.description,
  }));
}

async function addMovie(movie: Movie): Promise<Movie> {
  const client = await getClient();

  const existingMovie = await client.query(
    "SELECT * FROM movies WHERE title = $1 AND director = $2",
    [movie.title, movie.director],
  );

  if (existingMovie.rows.length > 0)
    throw new Error("Movie with this Title from this Director already exists");

  const result = await client.query(
    "INSERT INTO movies (title, director, genres, release_year, description) VALUES ($1, $2, $3, $4, $5) RETURNING id",
    [movie.title, movie.director, movie.genres, movie.releaseYear, movie.description],
  );
  const newMovieId = result.rows[0].id;

  return {
    ...movie,
    id: newMovieId,
  };
}


async function searchMovies(query: string): Promise<Movie[]> {
    const client = await getClient();
  
    const result = await client.query(
      `SELECT * FROM movies
       WHERE title ILIKE $1 OR description ILIKE $1
       ORDER BY title ASC`,
      [`%${query}%`]
    );
  
    return result.rows.map(row => ({
        id: row.id,
        title: row.title,
        director: row.director,
        genres: row.genres,
        releaseYear: row.release_year,
        description: row.description,
      }));
  }

export { getMovies, addMovie, searchMovies, getClient, teardown };
