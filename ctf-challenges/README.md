# CTF Challenges

This directory contains a collection of Capture The Flag (CTF) challenges for cybersecurity practice and learning.

## Challenge Structure

Each subdirectory contains a different challenge with the following files:

- `challenge.md` - Challenge description and objectives
- `solution.md` - Step-by-step solution guide (spoiler alert!)
- Additional files needed to run the challenge locally

## Running Challenges

### Run All Challenges

To start all challenges at once:

```bash
docker compose up
```

Access the challenges at:

http://<challenge-name>.localhost

### Run Individual Challenges

To run just one challenge, navigate to its directory and start it:

```bash
cd cookie1
docker build -t cookie1 .
docker run -p 3000:3000 cookie1
```

Then access it at http://localhost:3000

## How It Works

To run multiple challenges simultaneously we use **Traefik** as a reverse proxy which routes requests based on the `Host` header. All services run on an internal Docker network, with only Traefik exposing ports to your host machine. This allows each challenge to be accessible via its own subdomain (e.g., `cookie1.localhost`, `cookie2.localhost`).

## Stopping Services

```bash
docker compose down
```

## Adding New Local Challenges

To add a new locally-hosted challenge:

1. Create a new directory with your challenge files
2. Add a `Dockerfile` to containerize your challenge
3. Add a new service to `docker-compose.yml` with appropriate Traefik labels
4. Include `challenge.md` and `solution.md` files

## Notes

- The `.localhost` domains work automatically on most systems
- For external challenges, you'll need an internet connection
- Always try to solve challenges yourself before checking the solution!
