# Movie Catalog Service - Node

A simple RESTful API for managing and searching a catalog of movies, built with **Node.js**, **Express**, **PostgreSQL**, and **TypeScript**. Integration tests are implemented using **Testcontainers**.

---

## Endpoints

| Method | Endpoint               | Description                                                |
| ------ | ---------------------- | ---------------------------------------------------------- |
| GET    | `/`                    | Basic health check route                                   |
| POST   | `/movies`              | Add a new movie to the catalog                             |
| GET    | `/movies`              | Retrieve all movies, sorted alphabetically by title        |
| GET    | `/movies/search?q=...` | Search movies by title or description using fuzzy matching |

---

## Movie Object Format

```json
{
  "title": "string",
  "director": "string",
  "genres": ["string"],
  "releaseYear": number,
  "description": "string (optional)"
}
```

---

## Validation and Constraints

* All movies must include `title`, `director`, `genres`, and `releaseYear`.
* The combination of `title` and `director` must be unique.
* Input data is validated before insertion. Missing or invalid fields result in descriptive error messages.
* Attempts to add duplicate movies will be rejected with a meaningful error.

---

## Testing

Integration tests are written using [Testcontainers](https://www.testcontainers.org/) to spin up a real PostgreSQL instance during the test lifecycle. The test suite includes:

* Inserting valid movies
* Searching for movies that exist or do not exist
* Validating required fields
* Preventing duplicate movie entries
