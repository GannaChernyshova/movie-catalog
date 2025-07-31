import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { GenericContainer, Network, StartedTestContainer, Wait } from "testcontainers";
import path from 'path';
import axios from "axios";

describe("API E2E test", () => {
    let db: StartedPostgreSqlContainer;
    let app: StartedTestContainer;
  
    beforeAll(async () => {
      const network = await new Network().start();
      // 1. Start Postgres
      db = await new PostgreSqlContainer("postgres:17.4")
      .withNetwork(network)
      .withNetworkAliases("postgres")
      .withDatabase("catalog")
      .withUsername("postgres")
      .withPassword("postgres")
      .withCopyFilesToContainer([
        {
          source: path.join(__dirname, "../dev/db/1-create-schema.sql"),
          target: "/docker-entrypoint-initdb.d/1-create-schema.sql"
        },
      ])
      .start();

      // 2. Start API container with environment variables for DB connection
      const container = await GenericContainer
        .fromDockerfile("../movie-catalog")
        .withTarget("final")
        .withBuildkit()
        .build();
        
      app = await container
        .withNetwork(network)
        .withExposedPorts(3000)
        .withEnvironment({
            PGHOST: "postgres",
            PGPORT: "5432",
            PGDATABASE: "catalog",
            PGUSER: "postgres",
            PGPASSWORD: "postgres",
          })
        .withWaitStrategy(Wait.forListeningPorts()) // waits for health check
        .start();

        const stream = await app.logs();
        stream
          .on("data", (line) => console.log("APP LOG:", line.toString()))
          .on("err", (line) => console.error("APP ERR:", line.toString()));

        console.log("APP:", app.getHost());
    }, 120000);
  
    afterAll(async () => {
      await app.stop();
      await db.stop();
    });

    function sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
  
    it("should create and retrieve a movie", async () => {
      const baseUrl = `http://${app.getHost()}:${app.getMappedPort(3000)}`;
      const payload = {
        title: "Interstellar",
        director: "Christopher Nolan",
        genres: ["sci-fi"],
        releaseYear: 2014,
        description: "Space and time exploration"
      };
      
      console.log("POST", `${baseUrl}/movies`);
      console.log("Payload:", JSON.stringify(payload, null, 2));

    //   await sleep(120000); 


      const response = await axios.post(`${baseUrl}/movies`, payload);
      expect(response.status).toBe(201);
      expect(response.data.title).toBe("Interstellar");
    }, 120000);
  });