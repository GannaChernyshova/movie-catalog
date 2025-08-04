const { PostgreSqlContainer } = require("@testcontainers/postgresql");
const path = require('path');

async function createAndBootstrapPostgresContainer() {
  const postgresContainer = await new PostgreSqlContainer("postgres:17.4")
    .withCopyFilesToContainer([
      {
        source: path.join(__dirname, "../dev/db/1-create-schema.sql"),
        target: "/docker-entrypoint-initdb.d/1-create-schema.sql"
      },
    ])
    .start();

  // Configure the pg library
  process.env.PGUSER = postgresContainer.getUsername();
  process.env.PGPASSWORD = postgresContainer.getPassword();
  process.env.PGHOST = postgresContainer.getHost();
  process.env.PGPORT = postgresContainer.getPort().toString();
  process.env.PGDATABASE = postgresContainer.getDatabase();

  return postgresContainer;
}

describe("MovieService integration", () => {
  let postgresContainer;
  let movieService;

  beforeAll(async () => {
    postgresContainer = await createAndBootstrapPostgresContainer();
    movieService = require("../src/services/MovieService");
  }, 120000);

  beforeEach(async () => {
    const client = await movieService.getClient();
    await client.query("DELETE FROM movies");
  });

  afterAll(async () => {
    await movieService.teardown();
    await postgresContainer.stop();
  });

  it("addMovie returns a Movie and indexing works", async () => {
    const sample = {
      title: "Inception",
      director: "Christopher Nolan",
      genres: ["sci-fi", "thriller"],
      releaseYear: 2010,
      description: "A mind‑bending thriller."
    };
    const movie = await movieService.addMovie(sample);
    expect(movie).toHaveProperty("id");
    expect(movie.title).toBe(sample.title);

    const all = await movieService.getMovies();
    expect(all).toHaveLength(1);
    expect(all[0]).toMatchObject(sample);
  });

  it("searchMovies returns matching movie", async () => {
    const movie = await movieService.addMovie({
      title: "The Matrix",
      director: "Lana Wachowski",
      genres: ["action", "sci-fi"],
      releaseYear: 1999,
      description: "A computer hacker learns about the true nature of reality."
    });

    const results = await movieService.searchMovies("matrix");
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ title: "The Matrix" });
  });

  it("searchMovies returns empty array when movie doesn't exist", async () => {
    const results = await movieService.searchMovies("nonexistent movie title");
    expect(results).toEqual([]);
  });

  it("addMovie throws an error when adding a duplicate movie (same title + director)", async () => {
    const movie = {
      title: "Tenet",
      director: "Christopher Nolan",
      genres: ["sci-fi", "thriller"],
      releaseYear: 2020,
      description: "A secret agent manipulates time to prevent global catastrophe."
    };
  
    // First insert should work
    await movieService.addMovie(movie);
  
    // Second insert (same title and director) should throw and error
    await expect(movieService.addMovie(movie)).rejects.toThrow(
      "Movie with this Title from this Director already exists"
    );
  });

}); 